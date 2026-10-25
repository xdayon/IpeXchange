// Cloudflare Worker: serves the SPA from ./dist (ASSETS) and the API under /api/*.
//
// Secrets (wrangler secret put <NAME>, or .dev.vars locally):
//   GEMINI_API_KEY             required for chat, search and embeddings
//   SUPABASE_URL               optional; without it the API serves in-memory demo data
//   SUPABASE_SERVICE_ROLE_KEY  optional (SUPABASE_ANON_KEY is accepted as a fallback)
import { Hono } from 'hono';
import { chat, configureGemini, extractIntent, extractListing, generateEmbedding, suggestPrice } from './lib/gemini.js';
import {
  configureSupabase,
  isDbAvailable,
  pingSupabase,
  upsertSession,
  saveMessage,
  getSessionHistory,
  saveIntent,
  getHotIntents,
  getListings,
  createListing,
  searchListingsBySimilarity,
  createDemand,
  getTradeCycles,
  upsertUser,
  getUserProfile,
  getUserTransactions,
  recordTransaction,
  getStores,
  getStoreProducts,
  getAllTradeableStoreProducts,
  seedDatabase,
  getCityGraphData,
  getListingsBySession,
  updateListingPrivacy,
} from './lib/supabase.js';
import { buildCityGraphPayload } from './lib/cityGraphBuilder.js';
import { MOCK_SESSIONS, MOCK_LISTINGS, MOCK_DEMANDS } from './lib/mockData.js';

const app = new Hono();

// ─── Rate limiting (per isolate, fixed window, keyed by client IP) ───────────

const WINDOW_MS = 5 * 60 * 1000;
const buckets = new Map();

function rateLimit(name, max) {
  return async (c, next) => {
    const ip = c.req.header('cf-connecting-ip') || 'local';
    const key = `${name}:${ip}`;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || now - bucket.start >= WINDOW_MS) {
      bucket = { start: now, count: 0 };
      buckets.set(key, bucket);
      if (buckets.size > 5000) {
        for (const [k, b] of buckets) if (now - b.start >= WINDOW_MS) buckets.delete(k);
      }
    }
    bucket.count += 1;
    if (bucket.count > max) {
      c.header('Retry-After', String(Math.ceil((bucket.start + WINDOW_MS - now) / 1000)));
      return c.json({ error: 'Too many requests. Please wait a moment.' }, 429);
    }
    await next();
  };
}

app.use('/api/*', rateLimit('api', 120));
app.use('/api/chat', rateLimit('chat', 20));

// ─── Bindings: configure clients lazily once per isolate ─────────────────────

let seedChecked = false;

async function ensureMockData() {
  try {
    const listings = await getListings({ limit: 1 });
    if (!listings || listings.length === 0) {
      const result = await seedDatabase(MOCK_SESSIONS, MOCK_LISTINGS, MOCK_DEMANDS);
      if (!result.success) console.warn('Auto-seed failed:', result.error);
    }
  } catch (err) {
    console.warn('ensureMockData check failed:', err.message);
  }
}

app.use('/api/*', async (c, next) => {
  configureGemini(c.env);
  await configureSupabase(c.env);
  if (!seedChecked && isDbAvailable()) {
    seedChecked = true;
    c.executionCtx.waitUntil(ensureMockData());
  }
  await next();
});

const readBody = (c) => c.req.json().catch(() => ({}));

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/health', (c) => c.json({ status: 'ok', ts: Date.now(), service: 'Xchange Core' }));

// ─── Chat ─────────────────────────────────────────────────────────────────────

app.post('/api/chat', async (c) => {
  const { sessionId, message, isAudio = false, audioBase64 = null, mimeType = null } = await readBody(c);

  if (!sessionId || (!message?.trim() && !audioBase64)) {
    return c.json({ error: 'sessionId and either message or audio are required' }, 400);
  }

  try {
    await upsertSession(sessionId);

    const history = await getSessionHistory(sessionId, 20);

    // Load live listings and stores to inject as context into the LLM
    const [contextListings, contextStores] = await Promise.all([
      getListings({ limit: 20 }),
      getStores(),
    ]);

    const displayMessage = isAudio && !message?.trim() ? '🎤 Audio Sent' : message;
    await saveMessage({ sessionId, role: 'user', content: displayMessage, isAudio });

    const response = await chat(history, message, audioBase64, mimeType, contextListings, contextStores);

    await saveMessage({ sessionId, role: 'agent', content: response.text });

    // Async: extract intent & demand (analytics)
    if (message?.trim()) {
      c.executionCtx.waitUntil(
        extractIntent(message).then(async (intent) => {
          if (!intent || intent.intentType === 'none') return;
          await saveIntent({
            sessionId,
            intentType: intent.intentType,
            item: intent.item,
            category: intent.category,
            confidence: intent.confidence,
          });
          if (['buy', 'trade', 'learn'].includes(intent.intentType) && intent.item) {
            const embedding = await generateEmbedding(`${intent.item} ${intent.category || ''}`);
            await createDemand({ sessionId, description: `${intent.intentType}: ${intent.item}`, category: intent.category, embedding });
          }
        }).catch(err => console.error('Async intent error:', err.message))
      );
    }

    let listingDraft = null;
    if (response.listingReady) {
      const conversationContext = history
        .map(m => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`)
        .join('\n');
      const fullContext = conversationContext
        + `\nUser: ${message || displayMessage}`
        + `\nAgent: ${response.text}`;
      listingDraft = await extractListing(fullContext);
    }

    return c.json({
      text: response.text,
      cta: response.cta,
      rateLimited: response.rateLimited,
      listingReady: response.listingReady,
      listingDraft,
    });
  } catch (err) {
    console.error('Chat error:', err);
    return c.json({ error: 'Internal error', text: 'Internal error. Please try again.' }, 500);
  }
});

// ─── Listing creation (explicit publish confirmation from frontend) ───────────

app.post('/api/listings', async (c) => {
  const { sessionId, listing, providerName } = await readBody(c);

  if (!sessionId || !listing?.title) {
    return c.json({ error: 'sessionId and listing.title are required' }, 400);
  }

  try {
    const enrichedListing = {
      ...listing,
      provider_name: providerName || listing.provider_name || 'Community Member',
      // Derive crypto price from fiat if not provided (10% discount for crypto)
      price_crypto: listing.price_crypto ?? (listing.price_fiat ? Math.round(listing.price_fiat * 0.9 * 100) / 100 : null),
      accepts_trade: listing.accepts_trade ?? false,
      image_url: listing.image_url || 'https://images.unsplash.com/photo-1472289065668-ce650ac443d2?auto=format&fit=crop&q=80&w=400&h=300',
    };

    const embeddingText = `${enrichedListing.title} ${enrichedListing.description || ''} ${enrichedListing.category || ''}`;
    const embedding = await generateEmbedding(embeddingText);

    let priceHint = null;
    if (embedding) {
      const similarListings = await searchListingsBySimilarity(embedding, 5);
      if (enrichedListing.price_fiat && similarListings.length > 0) {
        priceHint = await suggestPrice(enrichedListing.title, similarListings);
      }
    }

    const created = await createListing({ sessionId, listing: enrichedListing, embedding });

    if (!created) {
      return c.json({ error: 'Failed to create listing' }, 500);
    }

    return c.json({ listing: created, priceHint }, 201);
  } catch (err) {
    console.error('POST /api/listings error:', err);
    return c.json({ error: 'Internal error' }, 500);
  }
});

// ─── Semantic search ──────────────────────────────────────────────────────────

app.get('/api/search', async (c) => {
  const q = c.req.query('q');
  if (!q || !q.trim()) {
    return c.json({ error: 'Query parameter q is required' }, 400);
  }

  try {
    const embedding = isDbAvailable() ? await generateEmbedding(q) : null;
    if (!embedding) {
      // Fallback: simple text-based search in listings
      const allListings = await getListings({ limit: 50 });
      const filtered = allListings.filter(l =>
        l.title.toLowerCase().includes(q.toLowerCase()) ||
        (l.description && l.description.toLowerCase().includes(q.toLowerCase()))
      );
      return c.json({ results: filtered, semantic: false });
    }

    const results = await searchListingsBySimilarity(embedding, 8);
    return c.json({ results, semantic: true });
  } catch (err) {
    console.error('GET /api/search error:', err);
    return c.json({ error: 'Search failed' }, 500);
  }
});

// ─── Discover ─────────────────────────────────────────────────────────────────

app.get('/api/discover', async (c) => {
  const { category, subcategory, tags } = c.req.query();
  try {
    const [listings, hotIntents] = await Promise.all([
      getListings({
        limit: 50,
        category: category || null,
        subcategory: subcategory || null,
        tags: tags ? tags.split(',') : null,
      }),
      getHotIntents(),
    ]);

    // Cross-reference hot intents with live listings to surface trending
    const trending = hotIntents
      .map(intent => {
        if (!intent.item) return null;
        const match = listings.find(l =>
          l.title.toLowerCase().includes(intent.item.toLowerCase()) ||
          intent.item.toLowerCase().includes(l.title.toLowerCase().split(' ')[0])
        );
        return match ? { ...match, aiTrending: true, trendCount: intent.count } : null;
      })
      .filter(Boolean);

    return c.json({
      listings,
      trending: trending.length > 0 ? trending : [],
      hotIntents,
    });
  } catch (err) {
    console.error('Discover error:', err);
    return c.json({ listings: [], trending: [], hotIntents: [] }, 500);
  }
});

// ─── City Graph ──────────────────────────────────────────────────────────────

app.get('/api/city-graph', async (c) => {
  try {
    const { listings, users, stores, transactions, demands } = await getCityGraphData();
    return c.json(buildCityGraphPayload({ listings, users, stores, transactions, demands }));
  } catch (err) {
    console.error('City graph error:', err);
    return c.json({ entities: [], edges: [] }, 500);
  }
});

// ─── Session history ──────────────────────────────────────────────────────────

app.get('/api/history/:sessionId', async (c) => {
  try {
    const history = await getSessionHistory(c.req.param('sessionId'), 50);
    return c.json({ history });
  } catch {
    return c.json({ error: 'Failed to load history' }, 500);
  }
});

// ─── Multi-Hop Trades ─────────────────────────────────────────────────────────

app.get('/api/cycles/:sessionId', async (c) => {
  try {
    const cycles = await getTradeCycles(c.req.param('sessionId'));
    return c.json({ cycles });
  } catch (err) {
    console.error('GET /api/cycles error:', err);
    return c.json({ error: 'Failed to load trade cycles' }, 500);
  }
});

// ─── Stores ───────────────────────────────────────────────────────────────────

app.get('/api/stores', async (c) => {
  try {
    const stores = await getStores({ category: c.req.query('category') || null });
    return c.json({ stores });
  } catch (err) {
    console.error('GET /api/stores error:', err);
    return c.json({ error: 'Failed to load stores' }, 500);
  }
});

// Registered before :storeId so "tradeable" is not captured as an id
app.get('/api/stores/tradeable', async (c) => {
  try {
    const products = await getAllTradeableStoreProducts({ limit: 50 });
    return c.json({ products });
  } catch (err) {
    console.error('GET /api/stores/tradeable error:', err);
    return c.json({ error: 'Failed to load tradeable store products' }, 500);
  }
});

app.get('/api/stores/:storeId/products', async (c) => {
  try {
    const products = await getStoreProducts(c.req.param('storeId'));
    return c.json({ products });
  } catch (err) {
    console.error('GET /api/stores/:storeId/products error:', err);
    return c.json({ error: 'Failed to load store products' }, 500);
  }
});

// ─── Users ────────────────────────────────────────────────────────────────────

// Called after Privy auth completes. Creates or updates the user record.
app.post('/api/users/upsert', async (c) => {
  const { walletAddress, email, privyId, displayName } = await readBody(c);

  if (!walletAddress && !email) {
    return c.json({ error: 'walletAddress or email is required' }, 400);
  }

  try {
    const user = await upsertUser({ walletAddress, email, privyId, displayName });
    if (!user) return c.json({ error: 'Failed to upsert user' }, 500);
    return c.json({ user });
  } catch (err) {
    console.error('POST /api/users/upsert error:', err);
    return c.json({ error: 'Internal error' }, 500);
  }
});

app.get('/api/users/:wallet/profile', async (c) => {
  try {
    const profile = await getUserProfile(c.req.param('wallet'));
    if (!profile) return c.json({ error: 'User not found' }, 404);
    return c.json({ profile });
  } catch (err) {
    console.error('GET /api/users/:wallet/profile error:', err);
    return c.json({ error: 'Internal error' }, 500);
  }
});

app.get('/api/users/:wallet/transactions', async (c) => {
  const limit = parseInt(c.req.query('limit')) || 20;
  try {
    const transactions = await getUserTransactions(c.req.param('wallet'), limit);
    return c.json({ transactions });
  } catch (err) {
    console.error('GET /api/users/:wallet/transactions error:', err);
    return c.json({ error: 'Internal error' }, 500);
  }
});

// ─── Transactions: record a purchase ──────────────────────────────────────────

app.post('/api/transactions', async (c) => {
  const { listingId, buyerWallet, sellerWallet, amountFiat, amountCrypto, currency, isTrade, tradeDescription } = await readBody(c);

  if (!buyerWallet) {
    return c.json({ error: 'buyerWallet is required' }, 400);
  }

  try {
    const tx = await recordTransaction({ listingId, buyerWallet, sellerWallet, amountFiat, amountCrypto, currency, isTrade, tradeDescription });
    if (!tx) return c.json({ error: 'Failed to record transaction' }, 500);
    return c.json({ transaction: tx }, 201);
  } catch (err) {
    console.error('POST /api/transactions error:', err);
    return c.json({ error: 'Internal error' }, 500);
  }
});

// ─── Listings by session ──────────────────────────────────────────────────────

app.get('/api/listings/mine', async (c) => {
  const sessionId = c.req.query('session_id');
  if (!sessionId) return c.json({ error: 'session_id required' }, 400);
  try {
    return c.json({ listings: await getListingsBySession(sessionId) });
  } catch (err) {
    console.error('listings/mine error:', err);
    return c.json({ listings: [] }, 500);
  }
});

app.patch('/api/listings/:listingId/privacy', async (c) => {
  const { session_id, location_privacy } = await readBody(c);
  if (!session_id) return c.json({ error: 'session_id required' }, 400);
  try {
    const result = await updateListingPrivacy(c.req.param('listingId'), session_id, location_privacy);
    return c.json(result);
  } catch (err) {
    console.error('listings/privacy error:', err);
    return c.json({ error: 'Failed to update privacy' }, 500);
  }
});

// ─── Admin: seed mock data ────────────────────────────────────────────────────

// Re-seeds mock data into Supabase. Hidden unless ADMIN_SEED_TOKEN is set
// and sent as x-admin-token, so visitors cannot write to the database.
app.post('/api/admin/seed', async (c) => {
  const token = c.env.ADMIN_SEED_TOKEN;
  if (!token || c.req.header('x-admin-token') !== token) return c.json({ error: 'Not found' }, 404);
  try {
    const result = await seedDatabase(MOCK_SESSIONS, MOCK_LISTINGS, MOCK_DEMANDS);
    if (result.success) {
      return c.json({ success: true, message: 'Mock data seeded successfully via Supabase client' });
    }
    return c.json({ error: result.error }, 500);
  } catch (err) {
    console.error('Seed error:', err);
    return c.json({ error: err.message }, 500);
  }
});

app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404));

// ─── Cron: keep the Free Supabase project from auto-pausing ───────────────────

async function scheduled(_event, env) {
  try {
    const result = await pingSupabase(env);
    console.log('Supabase keep-alive:', JSON.stringify(result));
  } catch (err) {
    console.error('Supabase keep-alive failed:', err.message);
  }
}

export default { fetch: app.fetch, scheduled };
