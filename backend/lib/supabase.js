import { createClient } from '@supabase/supabase-js';

let supabase = null;
let dbAvailable = false;

// In-memory fallback for when DB isn't set up yet
const inMemory = {
  sessions: {},
  messages: {},   // sessionId -> []
  intents: [],
  listings: [],
  demands: [],
  cycles: [],
};

try {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
  console.log('⚡ Supabase client initialized');
} catch (e) {
  console.warn('⚠️  Supabase not configured — using in-memory fallback');
}

// Check if DB tables actually exist
async function checkDb() {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('sessions').select('id').limit(1);
    if (!error) {
      dbAvailable = true;
      console.log('✅ Supabase DB tables found — persistence enabled');
    } else {
      console.warn('⚠️  Supabase tables not found — using in-memory fallback. Run supabase_schema.sql in your Supabase dashboard.');
    }
  } catch (e) {
    console.warn('⚠️  Supabase connection failed — in-memory fallback active');
  }
}
checkDb();

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function upsertSession(sessionId) {
  if (!dbAvailable) {
    inMemory.sessions[sessionId] = { id: sessionId, last_seen: new Date().toISOString() };
    return;
  }
  const { error } = await supabase
    .from('sessions')
    .upsert({ id: sessionId, last_seen: new Date().toISOString() });
  if (error) console.error('upsertSession error:', error.message);
}

// ─── Messages ────────────────────────────────────────────────────────────────

export async function saveMessage({ sessionId, role, content, isAudio = false }) {
  if (!dbAvailable) {
    if (!inMemory.messages[sessionId]) inMemory.messages[sessionId] = [];
    inMemory.messages[sessionId].push({ role, content, created_at: new Date().toISOString(), audio_transcript: isAudio });
    return;
  }
  const { error } = await supabase.from('messages').insert({
    session_id: sessionId,
    role,
    content,
    audio_transcript: isAudio,
  });
  if (error) console.error('saveMessage error:', error.message);
}

export async function getSessionHistory(sessionId, limit = 20) {
  if (!dbAvailable) {
    const msgs = (inMemory.messages[sessionId] || []).slice(-limit);
    return msgs;
  }
  const { data, error } = await supabase
    .from('messages')
    .select('role, content, created_at, audio_transcript')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('getSessionHistory error:', error.message);
    return [];
  }
  return data || [];
}

// ─── Intents ─────────────────────────────────────────────────────────────────

export async function saveIntent({ sessionId, intentType, item, category, confidence }) {
  if (!intentType || intentType === 'none' || !item) return;

  if (!dbAvailable) {
    inMemory.intents.push({ session_id: sessionId, intent_type: intentType, item, category, confidence, created_at: new Date().toISOString() });
    return;
  }
  const { error } = await supabase.from('user_intents').insert({
    session_id: sessionId,
    intent_type: intentType,
    item,
    category,
    confidence,
  });
  if (error) console.error('saveIntent error:', error.message);
}

export async function getHotIntents() {
  if (!dbAvailable) {
    const since = Date.now() - 24 * 60 * 60 * 1000;
    const recent = inMemory.intents.filter(i =>
      new Date(i.created_at).getTime() > since &&
      ['buy', 'trade', 'learn'].includes(i.intent_type) &&
      i.item
    );
    const counts = {};
    for (const row of recent) {
      const key = row.item.toLowerCase();
      if (!counts[key]) counts[key] = { item: row.item, category: row.category, count: 0 };
      counts[key].count++;
    }
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('user_intents')
    .select('item, category, intent_type')
    .gte('created_at', since)
    .in('intent_type', ['buy', 'trade', 'learn'])
    .not('item', 'is', null);

  if (error) {
    console.error('getHotIntents error:', error.message);
    return [];
  }

  const counts = {};
  for (const row of data || []) {
    const key = row.item.toLowerCase();
    if (!counts[key]) counts[key] = { item: row.item, category: row.category, count: 0 };
    counts[key].count++; 
  }
  return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
}

// ─── Listings ─────────────────────────────────────────────────────────────────
// Helper to format DB rows to frontend format
function mapListingToFrontend(row) {
  const acceptedPayments = [];
  if (row.price_fiat > 0) acceptedPayments.push('fiat');
  if (row.price_crypto > 0) acceptedPayments.push('crypto');
  if (row.accepts_trade) acceptedPayments.push('trade');
  if (acceptedPayments.length === 0) acceptedPayments.push('free');

  let priceStr = 'Free';
  if (row.price_fiat > 0) priceStr = `R$${row.price_fiat}`;

  return {
    ...row,
    provider: row.provider_name || 'Anonymous',
    image: row.image_url || 'https://images.unsplash.com/photo-1555661530-68c8e98db4e6?auto=format&fit=crop&q=80&w=400&h=300',
    price: priceStr,
    acceptedPayments,
    isPublic: true,
  };
}
export async function getListings({ category = null, limit = 50 } = {}) {
  if (!dbAvailable) {
    // Return in-memory listings if any, otherwise return empty
    return inMemory.listings;
  }

  let query = supabase
    .from('listings')
    .select('id, title, description, category, condition, price_fiat, price_crypto, accepts_trade, trade_wants, provider_name, image_url, active, is_mock, created_at')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) {
    console.error('getListings error:', error.message);
    return [];
  }
  return (data || []).map(mapListingToFrontend);
}

export async function createListing({ sessionId, listing, embedding = null }) {
  const {
    title, description, category, condition,
    price_fiat, price_crypto, accepts_trade,
    trade_wants, provider_name, image_url,
  } = listing;

  if (!dbAvailable) {
    const newListing = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      title, description, category, condition,
      price_fiat, price_crypto, accepts_trade,
      trade_wants, provider_name, image_url,
      active: true,
      ai_generated: true,
      is_mock: false,
      created_at: new Date().toISOString(),
    };
    inMemory.listings.push(newListing);
    return newListing;
  }

  const { data, error } = await supabase
    .from('listings')
    .insert({
      session_id: sessionId,
      title,
      description,
      category,
      condition,
      price_fiat: price_fiat || null,
      price_crypto: price_crypto || null,
      accepts_trade: accepts_trade || false,
      trade_wants: trade_wants || null,
      provider_name: provider_name || null,
      image_url: image_url || null,
      active: true,
      ai_generated: true,
      is_mock: false,
      embedding: embedding ? JSON.stringify(embedding) : null,
    })
    .select()
    .single();

  if (error) {
    console.error('createListing error:', error.message);
    return null;
  }
  return data;
}

// Semantic search: find listings similar to a query embedding
export async function searchListingsBySimilarity(embedding, limit = 5) {
  if (!dbAvailable || !embedding) return [];

  const { data, error } = await supabase.rpc('match_listings', {
    query_embedding: JSON.stringify(embedding),
    match_threshold: 0.70,
    match_count: limit,
  });

  if (error) {
    console.error('searchListingsBySimilarity error:', error.message);
    return [];
  }
  return (data || []).map(mapListingToFrontend);
}

// ─── Demands ──────────────────────────────────────────────────────────────────

export async function createDemand({ sessionId, description, category, maxBudgetFiat, acceptsTrade, embedding = null }) {
  if (!dbAvailable) {
    const demand = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      description,
      category,
      max_budget_fiat: maxBudgetFiat || null,
      accepts_trade: acceptsTrade !== false,
      resolved: false,
      is_mock: false,
      created_at: new Date().toISOString(),
    };
    inMemory.demands.push(demand);
    return demand;
  }

  const { data, error } = await supabase
    .from('demands')
    .insert({
      session_id: sessionId,
      description,
      category,
      max_budget_fiat: maxBudgetFiat || null,
      accepts_trade: acceptsTrade !== false,
      resolved: false,
      is_mock: false,
      embedding: embedding ? JSON.stringify(embedding) : null,
    })
    .select()
    .single();

  if (error) {
    console.error('createDemand error:', error.message);
    return null;
  }
  return data;
}

// ─── Multi-Hop Engine ─────────────────────────────────────────────────────────

export async function getTradeCycles(sessionId) {
  if (!dbAvailable || !sessionId) return [];

  const { data, error } = await supabase.rpc('find_trade_cycles', {
    target_session_id: sessionId,
    match_threshold: 0.65,
  });

  if (error) {
    console.error('getTradeCycles error:', error.message);
    return [];
  }
  
  // Pl/PgSQL JSONB returns either null or an array
  return data || [];
}

export default supabase;
