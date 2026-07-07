// Seeds dev users and intents that form a 2-hop cycle, a 3-hop cycle
// and one value-unbalanced pair, then prints find_intent_cycles output.
// Usage: SUPABASE_URL=... SUPABASE_SECRET_KEY=... GEMINI_API_KEY=... npm run db:seed
const { SUPABASE_URL, SUPABASE_SECRET_KEY, GEMINI_API_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !GEMINI_API_KEY) {
  console.error('Set SUPABASE_URL, SUPABASE_SECRET_KEY and GEMINI_API_KEY.');
  process.exit(1);
}

const headers = {
  apikey: SUPABASE_SECRET_KEY,
  authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
  'content-type': 'application/json',
};

async function rest(pathname, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${pathname}`, {
    ...options,
    headers: { ...headers, prefer: 'return=representation', ...options.headers },
  });
  if (!res.ok) throw new Error(`${pathname}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

async function embed(text) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`,
    { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ content: { parts: [{ text }] }, outputDimensionality: 768 }) },
  );
  if (!res.ok) throw new Error(`embed: ${res.status} ${await res.text()}`);
  const values = (await res.json()).embedding.values;
  const norm = Math.sqrt(values.reduce((s, v) => s + v * v, 0));
  return values.map((v) => v / norm);
}

const SEED_USERS = [
  { display_name: 'Seed Dayon', email: 'seed-dayon@test.local' },
  { display_name: 'Seed Bia', email: 'seed-bia@test.local' },
  { display_name: 'Seed Joao', email: 'seed-joao@test.local' },
  { display_name: 'Seed Rico', email: 'seed-rico@test.local' },
];

// 2-hop ring: Dayon wants a bicycle (Rico offers one, $280) and Rico wants a
//   website (Dayon offers one, $350). Ratio 280/350 = 0.8, passes.
// 3-hop ring: Dayon wants bike (Joao offers, $300), Joao wants massage
//   (Bia offers, $320), Bia wants website (Dayon offers, $350). Passes.
// Unbalanced control: Dayon wants a laptop and Rico offers one at $2000;
//   against Dayon's $350 website the ratio is 0.175, must be excluded.
const INTENTS = () => [
  { user: 0, direction: 'want', title: 'Mountain bike in good condition', price_fiat: null },
  { user: 0, direction: 'want', title: 'Gaming laptop for video editing', price_fiat: null },
  { user: 0, direction: 'offer', title: 'Professional website design and development', price_fiat: 350 },
  { user: 1, direction: 'want', title: 'Professional website for my business', price_fiat: null },
  { user: 1, direction: 'offer', title: 'Relaxing massage therapy session package', price_fiat: 320 },
  { user: 2, direction: 'want', title: 'Massage therapy sessions for back pain', price_fiat: null },
  { user: 2, direction: 'offer', title: 'Mountain bike 29 inch, well maintained', price_fiat: 300 },
  { user: 3, direction: 'want', title: 'Website development for online store', price_fiat: null },
  { user: 3, direction: 'offer', title: 'City bicycle, barely used', price_fiat: 280 },
  { user: 3, direction: 'offer', title: 'Gaming laptop, high end', price_fiat: 2000 },
];

console.log('Cleaning previous seed data...');
await rest('/users?email=like.seed-*@test.local', { method: 'DELETE' });

console.log('Creating users...');
const users = await rest('/users', { method: 'POST', body: JSON.stringify(SEED_USERS) });

console.log('Creating intents with embeddings...');
const rows = [];
for (const item of INTENTS()) {
  rows.push({
    user_id: users[item.user].id,
    direction: item.direction,
    title: item.title,
    price_fiat: item.price_fiat,
    embedding: JSON.stringify(await embed(item.title)),
  });
}
await rest('/intents', { method: 'POST', body: JSON.stringify(rows) });

console.log('Running find_intent_cycles for Seed Dayon...');
const cycles = await rest('/rpc/find_intent_cycles', {
  method: 'POST',
  body: JSON.stringify({ p_user_id: users[0].id }),
});
console.log(JSON.stringify(cycles, null, 2));
console.log(`Found ${cycles.length} cycle(s). Expect a 2-hop (bike/website) and a 3-hop (bike/website/massage); the $2000 laptop must not appear.`);
