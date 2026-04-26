import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
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
} from './lib/supabase.js';

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
  const { sessionId, message, isAudio = false, audioBase64 = null, mimeType = null } = req.body;

  if (!sessionId || (!message?.trim() && !audioBase64)) {
    return res.status(400).json({ error: 'sessionId and either message or audio are required' });
  }

  try {
    await upsertSession(sessionId);

    const history = await getSessionHistory(sessionId, 20);

    // Load live listings to inject as context into the LLM
    const contextListings = await getListings({ limit: 20 });

    const displayMessage = isAudio && !message?.trim() ? '🎤 Audio Sent' : message;
    await saveMessage({ sessionId, role: 'user', content: displayMessage, isAudio });

    // Call Gemini with live listings context
    const response = await chat(history, message, audioBase64, mimeType, contextListings);

    await saveMessage({ sessionId, role: 'agent', content: response.text });

    // ── Async: Extract intent + handle sell flow ──────────────────────────────
    if (message?.trim()) {
      extractIntent(message).then(async (intent) => {
        if (!intent || intent.intentType === 'none') return;

        // Save intent for analytics / hot trends
        await saveIntent({
          sessionId,
          intentType: intent.intentType,
          item: intent.item,
          category: intent.category,
          confidence: intent.confidence,
        });

        // If it's a buy/trade intent, also save as demand for the matching engine
        if (['buy', 'trade', 'learn'].includes(intent.intentType) && intent.item) {
          const embedding = await generateEmbedding(`${intent.item} ${intent.category || ''}`);
          await createDemand({
            sessionId,
            description: `${intent.intentType}: ${intent.item}`,
            category: intent.category,
            embedding,
          });
        }

        // If sell intent detected and Core flagged listing as ready, extract and publish
        if (intent.intentType === 'sell' && response.listingReady) {
          const listing = await extractListing(message);
          if (listing && listing.title) {
            const embeddingText = `${listing.title} ${listing.description || ''} ${listing.category || ''}`;
            const embedding = await generateEmbedding(embeddingText);
            await createListing({ sessionId, listing, embedding });
            console.log(`📦 New listing created via chat: "${listing.title}" (session: ${sessionId})`);
          }
        }
      }).catch(err => console.error('Async intent/listing error:', err.message));
    }

    return res.json({
      text: response.text,
      cta: response.cta,
      rateLimited: response.rateLimited,
      listingReady: response.listingReady,
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

// ─── Get listings ──────────────────────────────────────────────────────────────

app.get('/api/listings', async (req, res) => {
  const { category, limit } = req.query;
  try {
    const listings = await getListings({
      category: category || null,
      limit: parseInt(limit) || 50,
    });
    res.json({ listings });
  } catch (err) {
    console.error('GET /api/listings error:', err);
    res.status(500).json({ error: 'Failed to load listings' });
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
  try {
    const [listings, hotIntents] = await Promise.all([
      getListings({ limit: 30 }),
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

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🌿 Xchange Core API running on port ${PORT}`);
  console.log(`   Gemini: ${process.env.GEMINI_API_KEY ? '✅ configured' : '❌ missing GEMINI_API_KEY'}`);
  console.log(`   Supabase: ${process.env.SUPABASE_URL ? '✅ configured' : '❌ missing SUPABASE_URL'}`);
});
