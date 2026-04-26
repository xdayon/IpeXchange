import { createClient } from '@supabase/supabase-js';

let supabase = null;
let dbAvailable = false;

// In-memory fallback for when DB isn't set up yet
const inMemory = {
  sessions: {},
  messages: {},   // sessionId -> []
  intents: [],
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
      console.warn('⚠️  Supabase tables not found — using in-memory fallback. Run supabase_schema.sql in your Supabase dashboard to enable persistence.');
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
    // Count from in-memory
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

export default supabase;
