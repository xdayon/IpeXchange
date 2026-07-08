import { Hono } from 'hono';
import { optionalAuth } from '../middleware/auth.js';
import { getDb } from '../lib/supabase.js';
import { embed } from '../lib/gemini.js';

const app = new Hono();

const CARD_FIELDS =
  'id, user_id, direction, kind, title, description, category, price_fiat, image_url, created_at, is_continuous';

// Public market feed. Anonymous search falls back to text match so Gemini
// quota is only spent on logged-in users.
app.get('/market', optionalAuth, async (c) => {
  const db = getDb(c.env);
  const direction = c.req.query('direction');
  const kind = c.req.query('kind');
  const category = c.req.query('category');
  const q = c.req.query('q')?.trim();
  const limit = Math.min(Number(c.req.query('limit')) || 30, 60);
  const offset = Math.max(Number(c.req.query('offset')) || 0, 0);

  if (q && c.get('user')) {
    const vector = await embed(c.env, q);
    if (vector) {
      const { data, error } = await db.rpc('match_intents', {
        query_embedding: vector,
        p_direction: direction === 'want' ? 'want' : 'offer',
        match_threshold: 0.55,
        match_count: limit,
      });
      if (!error) return c.json({ intents: data ?? [], mode: 'semantic' });
      console.error('match_intents failed:', error);
    }
  }

  let query = db
    .from('intents')
    .select(CARD_FIELDS)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (direction === 'want' || direction === 'offer') query = query.eq('direction', direction);
  if (['good', 'digital', 'service', 'knowledge'].includes(kind)) query = query.eq('kind', kind);
  if (category) query = query.eq('category', category);
  if (q) query = query.or(`title.ilike.%${q.replaceAll('%', '')}%,description.ilike.%${q.replaceAll('%', '')}%`);

  const { data, error } = await query;
  if (error) {
    console.error('Market query failed:', error);
    return c.json({ error: 'Market unavailable' }, 500);
  }
  return c.json({ intents: data ?? [], mode: 'recent' });
});

export default app;
