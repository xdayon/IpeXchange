import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { chat, extractIntent } from './lib/gemini.js';
import {
  upsertSession,
  saveMessage,
  getSessionHistory,
  saveIntent,
  getHotIntents,
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

// Per-session rate limiter: max 30 requests per 5 minutes per IP
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Aguarde um momento.' },
});

app.use('/api/', limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check — also used as keepalive by frontend
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', ts: Date.now(), service: 'Xchange Core' });
});

// ── Chat endpoint ─────────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { sessionId, message, isAudio = false, audioBase64 = null, mimeType = null } = req.body;

  if (!sessionId || (!message?.trim() && !audioBase64)) {
    return res.status(400).json({ error: 'sessionId and either message or audio are required' });
  }

  try {
    // Ensure session exists
    await upsertSession(sessionId);

    // Load conversation history for context
    const history = await getSessionHistory(sessionId, 20);

    // Save user message
    const displayMessage = isAudio && !message?.trim() ? '🎤 Audio Sent' : message;
    await saveMessage({ sessionId, role: 'user', content: displayMessage, isAudio });

    // Call Gemini
    const response = await chat(history, message, audioBase64, mimeType);

    // Save agent response
    await saveMessage({ sessionId, role: 'agent', content: response.text });

    // Extract intent asynchronously (fire-and-forget, don't block response)
    extractIntent(message).then(async (intent) => {
      if (intent && intent.intentType !== 'none') {
        await saveIntent({
          sessionId,
          intentType: intent.intentType,
          item: intent.item,
          category: intent.category,
          confidence: intent.confidence,
        });
      }
    }).catch(err => console.error('Async intent error:', err.message));

    return res.json({
      text: response.text,
      cta: response.cta,
      rateLimited: response.rateLimited,
    });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Internal error', text: 'Internal error. Please try again.' });
  }
});

// ── Session history ───────────────────────────────────────────────────────────
app.get('/api/history/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  try {
    const history = await getSessionHistory(sessionId, 50);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load history' });
  }
});

// ── Discover — listings + AI-surfaced trending ────────────────────────────────
const LISTINGS = [
  { id: 'l1', title: 'MacBook Pro M1 14"', category: 'Products', provider: 'Alex M.', price: '$1,200', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400&h=300', acceptedPayments: ['fiat', 'crypto'] },
  { id: 'l2', title: 'Website Development', category: 'Services', provider: 'Bia Tech', price: 'From $500', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=400&h=300', acceptedPayments: ['crypto', 'trade'] },
  { id: 'l3', title: 'Bracatinga Honey (500g)', category: 'Products', provider: 'Ipê Farm', price: '$12', image: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?auto=format&fit=crop&q=80&w=400&h=300', acceptedPayments: ['fiat', 'crypto', 'trade'] },
  { id: 'l31', title: 'Oggi E-Bike', category: 'Products', provider: 'Marina G.', price: '$850', image: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&q=80&w=400&h=300', acceptedPayments: ['fiat', 'crypto'] },
  { id: 'l4', title: 'Yoga at the Park', category: 'Services', provider: 'FitJurerê', price: '$15/hour', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=400&h=300', acceptedPayments: ['fiat', 'crypto'] },
  { id: 'l29', title: 'Beehive Construction', category: 'Knowledge', provider: 'João, Ipê Farm', price: 'Trade / 20 USDC', image: 'https://images.unsplash.com/photo-1552528172-e1bc14eb581e?auto=format&fit=crop&q=80&w=400&h=300', acceptedPayments: ['trade', 'crypto'] },
];

app.get('/api/discover', async (req, res) => {
  try {
    const hotIntents = await getHotIntents();

    // Cross-reference hot intents with listings to surface trending items
    const trending = hotIntents
      .map(intent => {
        const match = LISTINGS.find(l =>
          l.title.toLowerCase().includes(intent.item.toLowerCase()) ||
          intent.item.toLowerCase().includes(l.title.toLowerCase().split(' ')[0])
        );
        return match ? { ...match, aiTrending: true, trendCount: intent.count } : null;
      })
      .filter(Boolean);

    res.json({
      listings: LISTINGS,
      trending: trending.length > 0 ? trending : [],
      hotIntents,
    });
  } catch (err) {
    console.error('Discover error:', err);
    // Fallback to static listings
    res.json({ listings: LISTINGS, trending: [], hotIntents: [] });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌿 Xchange Core API running on port ${PORT}`);
  console.log(`   Gemini: ${process.env.GEMINI_API_KEY ? '✅ configured' : '❌ missing GEMINI_API_KEY'}`);
  console.log(`   Supabase: ${process.env.SUPABASE_URL ? '✅ configured' : '❌ missing SUPABASE_URL'}`);
});
