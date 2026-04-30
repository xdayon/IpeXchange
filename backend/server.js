import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';
import { chat, extractIntent, extractListing, generateEmbedding, suggestPrice } from './lib/gemini.js';
import {
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
} from './lib/supabase.js';
import { MOCK_SESSIONS, MOCK_LISTINGS, MOCK_DEMANDS } from './lib/mockData.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust Render's reverse proxy (required for express-rate-limit and HTTPS)
app.set('trust proxy', 1);

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(express.json({ limit: '50mb' }));
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    'https://ipexchange.onrender.com',
    'https://ipexchange-front.onrender.com',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));

// Per-IP rate limiter: max 30 requests per 5 minutes
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Aguarde um momento.' },
});

app.use('/api/', limiter);

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ts: Date.now(), service: 'Xchange Core' });
});

// ─── Chat ─────────────────────────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  const { sessionId, message, isAudio = false, audioBase64 = null, mimeType = null, walletAddress = null } = req.body;

  if (!sessionId || (!message?.trim() && !audioBase64)) {
    return res.status(400).json({ error: 'sessionId and either message or audio are required' });
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

    // Call Gemini with live listings and stores context
    const response = await chat(history, message, audioBase64, mimeType, contextListings, contextStores);

    await saveMessage({ sessionId, role: 'agent', content: response.text });

    // ── Async: Extract intent & Demand (Analytics) ───────────────────────────
    if (message?.trim()) {
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
      }).catch(err => console.error('Async intent error:', err.message));
    }

    let listingDraft = null;
    if (response.listingReady) {
      listingDraft = await extractListing(message || displayMessage);
    }

    return res.json({
      text: response.text,
      cta: response.cta,
      rateLimited: response.rateLimited,
      listingReady: response.listingReady,
      listingDraft,
    });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Internal error', text: 'Internal error. Please try again.' });
  }
});

// ─── Listing creation (explicit publish confirmation from frontend) ────────────

app.post('/api/listings', async (req, res) => {
  const { sessionId, listing } = req.body;

  if (!sessionId || !listing?.title) {
    return res.status(400).json({ error: 'sessionId and listing.title are required' });
  }

  try {
    // Generate semantic embedding for this listing
    const embeddingText = `${listing.title} ${listing.description || ''} ${listing.category || ''}`;
    const embedding = await generateEmbedding(embeddingText);

    // Find similar listings for price context
    let priceHint = null;
    if (embedding) {
      const similarListings = await searchListingsBySimilarity(embedding, 5);
      if (listing.price_fiat && similarListings.length > 0) {
        priceHint = await suggestPrice(listing.title, similarListings);
      }
    }

    const created = await createListing({ sessionId, listing, embedding });

    if (!created) {
      return res.status(500).json({ error: 'Failed to create listing' });
    }

    return res.status(201).json({ listing: created, priceHint });
  } catch (err) {
    console.error('POST /api/listings error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});


// ─── Semantic search ──────────────────────────────────────────────────────────

app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) {
    return res.status(400).json({ error: 'Query parameter q is required' });
  }

  try {
    const embedding = await generateEmbedding(q);
    if (!embedding) {
      // Fallback: simple text-based search in listings
      const allListings = await getListings({ limit: 50 });
      const filtered = allListings.filter(l =>
        l.title.toLowerCase().includes(q.toLowerCase()) ||
        (l.description && l.description.toLowerCase().includes(q.toLowerCase()))
      );
      return res.json({ results: filtered, semantic: false });
    }

    const results = await searchListingsBySimilarity(embedding, 8);
    return res.json({ results, semantic: true });
  } catch (err) {
    console.error('GET /api/search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// ─── Discover ─────────────────────────────────────────────────────────────────

app.get('/api/discover', async (req, res) => {
  const { category, subcategory, tags } = req.query;
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

    res.json({
      listings,
      trending: trending.length > 0 ? trending : [],
      hotIntents,
    });
  } catch (err) {
    console.error('Discover error:', err);
    res.status(500).json({ listings: [], trending: [], hotIntents: [] });
  }
});

// ─── City Graph ──────────────────────────────────────────────────────────────

app.get('/api/city-graph', async (req, res) => {
  try {
    const { listings, users, stores, transactions, demands } = await getCityGraphData();
    const { buildCityGraphPayload } = await import('./lib/cityGraphBuilder.js');
    const payload = buildCityGraphPayload({ listings, users, stores, transactions, demands });
    res.json(payload);
  } catch (err) {
    console.error('City graph error:', err);
    res.status(500).json({ entities: [], edges: [] });
  }
});

// ─── Session history ──────────────────────────────────────────────────────────

app.get('/api/history/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const history = await getSessionHistory(sessionId, 50);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load history' });
  }
});

// ─── Multi-Hop Trades ─────────────────────────────────────────────────────────

app.get('/api/cycles/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const cycles = await getTradeCycles(sessionId);
    res.json({ cycles });
  } catch (err) {
    console.error('GET /api/cycles error:', err);
    res.status(500).json({ error: 'Failed to load trade cycles' });
  }
});

// ─── Stores ───────────────────────────────────────────────────────────────────

// List all stores (optionally filtered by category)
app.get('/api/stores', async (req, res) => {
  const { category } = req.query;
  try {
    const stores = await getStores({ category: category || null });
    res.json({ stores });
  } catch (err) {
    console.error('GET /api/stores error:', err);
    res.status(500).json({ error: 'Failed to load stores' });
  }
});

// Get products for a specific store
app.get('/api/stores/:storeId/products', async (req, res) => {
  const { storeId } = req.params;
  try {
    const products = await getStoreProducts(storeId);
    res.json({ products });
  } catch (err) {
    console.error('GET /api/stores/:storeId/products error:', err);
    res.status(500).json({ error: 'Failed to load store products' });
  }
});

// All store products that accept trade (used by discover + multi-hop context)
app.get('/api/stores/tradeable', async (req, res) => {
  try {
    const products = await getAllTradeableStoreProducts({ limit: 50 });
    res.json({ products });
  } catch (err) {
    console.error('GET /api/stores/tradeable error:', err);
    res.status(500).json({ error: 'Failed to load tradeable store products' });
  }
});

// ─── User: Upsert on login ────────────────────────────────────────────────────────
// Called after Privy auth completes. Creates or updates the user record.
app.post('/api/users/upsert', async (req, res) => {
  const { walletAddress, email, privyId, displayName } = req.body;

  if (!walletAddress && !email) {
    return res.status(400).json({ error: 'walletAddress or email is required' });
  }

  try {
    const user = await upsertUser({ walletAddress, email, privyId, displayName });
    if (!user) return res.status(500).json({ error: 'Failed to upsert user' });
    return res.json({ user });
  } catch (err) {
    console.error('POST /api/users/upsert error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// ─── User: Get profile + stats ───────────────────────────────────────────────────
app.get('/api/users/:wallet/profile', async (req, res) => {
  const { wallet } = req.params;
  try {
    const profile = await getUserProfile(wallet);
    if (!profile) return res.status(404).json({ error: 'User not found' });
    return res.json({ profile });
  } catch (err) {
    console.error('GET /api/users/:wallet/profile error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// ─── User: Get transaction history ──────────────────────────────────────────────
app.get('/api/users/:wallet/transactions', async (req, res) => {
  const { wallet } = req.params;
  const limit = parseInt(req.query.limit) || 20;
  try {
    const transactions = await getUserTransactions(wallet, limit);
    return res.json({ transactions });
  } catch (err) {
    console.error('GET /api/users/:wallet/transactions error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// ─── Transactions: Record a purchase ─────────────────────────────────────────────
app.post('/api/transactions', async (req, res) => {
  const { listingId, buyerWallet, sellerWallet, amountFiat, amountCrypto, currency, isTrade, tradeDescription } = req.body;

  if (!buyerWallet) {
    return res.status(400).json({ error: 'buyerWallet is required' });
  }

  try {
    const tx = await recordTransaction({ listingId, buyerWallet, sellerWallet, amountFiat, amountCrypto, currency, isTrade, tradeDescription });
    if (!tx) return res.status(500).json({ error: 'Failed to record transaction' });
    return res.status(201).json({ transaction: tx });
  } catch (err) {
    console.error('POST /api/transactions error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// ─── Listings by session ──────────────────────────────────────────────────────

app.get('/api/listings/mine', async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });
  try {
    const { getListingsBySession } = await import('./lib/supabase.js');
    const listings = await getListingsBySession(session_id);
    res.json({ listings });
  } catch (err) {
    console.error('listings/mine error:', err);
    res.status(500).json({ listings: [] });
  }
});

app.patch('/api/listings/:listingId/privacy', async (req, res) => {
  const { listingId } = req.params;
  const { session_id, location_privacy } = req.body;
  if (!session_id) return res.status(400).json({ error: 'session_id required' });
  try {
    const { updateListingPrivacy } = await import('./lib/supabase.js');
    const result = await updateListingPrivacy(listingId, session_id, location_privacy);
    res.json(result);
  } catch (err) {
    console.error('listings/privacy error:', err);
    res.status(500).json({ error: 'Failed to update privacy' });
  }
});

// ─── Admin: Seed mock data ───────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.post('/api/admin/seed', async (req, res) => {
  try {
    const result = await seedDatabase(MOCK_SESSIONS, MOCK_LISTINGS, MOCK_DEMANDS);
    if (result.success) {
      res.json({ success: true, message: 'Mock data seeded successfully via Supabase client' });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (err) {
    console.error('Seed error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Auto-Seed ──────────────────────────────────────────────────────────────
async function ensureMockData() {
  try {
    const listings = await getListings({ limit: 1 });
    if (!listings || listings.length === 0) {
      console.log('⚠️  No listings found — auto-seeding mock data...');
      const result = await seedDatabase(MOCK_SESSIONS, MOCK_LISTINGS, MOCK_DEMANDS);
      if (result.success) {
        console.log('✅ Mock data auto-seeded on startup.');
      } else {
        console.warn('⚠️  Auto-seed failed:', result.error);
      }
    } else {
      console.log(`ℹ️  Discovery has ${listings.length}+ active listing(s). No seed needed.`);
    }
  } catch (err) {
    console.warn('⚠️  ensureMockData check failed:', err.message);
  }
}

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🌿 Xchange Core API running on port ${PORT}`);
  console.log(`   Gemini: ${process.env.GEMINI_API_KEY ? '✅ configured' : '❌ missing GEMINI_API_KEY'}`);
  console.log(`   Supabase: ${process.env.SUPABASE_URL ? '✅ configured' : '❌ missing SUPABASE_URL'}`);
  ensureMockData();
});
