import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// gemini-flash-latest — alias sempre disponível, sem problemas de cota
const MODEL = 'gemini-flash-latest';
// Embedding model — free tier, 768 dimensions, matches pgvector schema
const EMBEDDING_MODEL = 'text-embedding-004';

const SYSTEM_PROMPT = `You are Xchange Core, the AI agent of IpêXchange — the decentralized marketplace of Ipê City, a pop-up innovation city and urban experiment built on community, technology, and circular economy.

Your role is to help Ipê City residents and visitors:
- Buy, sell, trade, and donate goods and services within the city network
- Publish listings: physical products, professional services, therapy & wellness, courses & workshops, knowledge & mentorship, pop-up establishments, community spaces, and more
- Find fair prices based on community transaction history
- Discover multi-hop circular trade opportunities (e.g., A gives skill to B, B gives product to C, C gives what A wants)
- Access P2P credit based on their Ipê Rep score
- Connect with local talent, artisans, builders, therapists, teachers, and entrepreneurs
- Understand the Ipê ecosystem: Ipê Passport (identity), Ipê Rep (reputation), IpeDAO (governance), Rootstock/RBTC (payments)

Listing categories available:
- **Products**: physical goods, equipment, electronics, food, crafts, bikes, etc.
- **Services**: tech work, design, legal, therapy, yoga, massage, wellness, professional services
- **Knowledge**: courses, workshops, mentorship, language lessons, skill-sharing, tutorials
- **Donations**: free goods, community gifts, pay-what-you-want

When a user wants to sell or offer something, guide them to provide: title, description, category, price or trade preference. Once you have enough info, confirm it and publish.
When a user wants to buy or find something, match against available listings and suggest the best options.
If the user mentions wanting to trade (troca), help them find multi-hop opportunities.

Personality: Intelligent, concise, warm, and community-focused. You speak like a knowledgeable city guide who understands Web3, circular economy, and decentralized finance. You always protect user privacy (ZKP, Ipê Passport).

Response format: Keep responses under 120 words. Be direct and actionable. Use **bold** for key items. Suggest specific next steps. When relevant, end with a CTA action type in this format on a new line:
CTA_ACTION: [discover|checkout|investments|circular|home|none]
CTA_LABEL: [Short button label]

When you detect a sell intent and have enough info (title + description + category), end with:
LISTING_READY: true

Language rule: ALWAYS respond in the SAME language the user is using. Portuguese → Portuguese. English → English. Spanish → Spanish.`;

const INTENT_EXTRACTION_PROMPT = `Analyze this user message and extract the trading intent. Return ONLY valid JSON, no markdown:
{
  "intentType": "buy|sell|trade|learn|invest|donate|none",
  "item": "specific item or service name, or null",
  "category": "Products|Services|Knowledge|Donations|null",
  "confidence": 0.0-1.0
}`;

const LISTING_EXTRACTION_PROMPT = `You are a structured data extractor for IpêXchange marketplace. Extract listing details from the user's message.
Return ONLY valid JSON, no markdown, no explanation:
{
  "title": "concise listing title (max 60 chars)",
  "description": "full description with key details mentioned",
  "category": "Products|Services|Knowledge|Donations",
  "condition": "new|like_new|good|fair|for_parts|null (null for services, courses, therapy, knowledge)",
  "price_fiat": number or null,
  "price_crypto": number or null,
  "accepts_trade": boolean,
  "trade_wants": "what they want in trade, or null",
  "provider_name": "seller/provider name if mentioned, or null",
  "confidence": 0.0-1.0
}
Category mapping: therapy/yoga/wellness/massage → Services | courses/workshops/mentorship → Knowledge | physical goods/equipment → Products | free/gift → Donations
If information is missing or unclear, set confidence below 0.8 and use null for missing fields.`;

// ─── Main Chat ────────────────────────────────────────────────────────────────

export async function chat(history, userMessage, audioBase64 = null, mimeType = null, contextListings = null) {
  try {
    // Build system prompt, optionally injecting live listings context
    let systemPrompt = SYSTEM_PROMPT;
    if (contextListings && contextListings.length > 0) {
      const listingsSummary = contextListings
        .slice(0, 10)
        .map(l => `- ${l.title} — ${l.price_fiat ? `$${l.price_fiat}` : 'trade only'} (${l.provider_name || 'Community'})`)
        .join('\n');
      systemPrompt += `\n\nCurrent available listings in the network:\n${listingsSummary}`;
    }

    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: systemPrompt,
    });

    const geminiHistory = history.map(msg => ({
      role: msg.role === 'agent' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chatSession = model.startChat({ history: geminiHistory });

    const parts = [];
    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'audio/webm',
          data: audioBase64,
        },
      });
      parts.push({
        text: userMessage || 'Please listen to this audio message from the user and respond naturally as Xchange Core, in the same language as the audio.',
      });
    } else {
      parts.push({ text: userMessage });
    }

    const result = await chatSession.sendMessage(parts);
    const rawText = result.response.text();

    // Parse CTA from response
    let text = rawText;
    let cta = null;
    let listingReady = false;

    const ctaActionMatch = rawText.match(/CTA_ACTION:\s*(\w+)/i);
    const ctaLabelMatch  = rawText.match(/CTA_LABEL:\s*(.+)/i);
    const listingReadyMatch = rawText.match(/LISTING_READY:\s*true/i);

    if (listingReadyMatch) {
      listingReady = true;
    }

    if (ctaActionMatch && ctaActionMatch[1] !== 'none') {
      cta = {
        tab:   ctaActionMatch[1].toLowerCase(),
        label: ctaLabelMatch ? ctaLabelMatch[1].trim() : 'View more',
      };
    }

    text = rawText
      .replace(/CTA_ACTION:.*$/im, '')
      .replace(/CTA_LABEL:.*$/im, '')
      .replace(/LISTING_READY:.*$/im, '')
      .trim();

    return { text, cta, rateLimited: false, listingReady };
  } catch (err) {
    const msg = err.message || 'Unknown error';
    console.error('Gemini error:', msg, '| Audio:', !!audioBase64, '| MimeType:', mimeType);

    if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
      return {
        text: '⚡ Too many requests. Please wait a moment and try again!',
        cta: null,
        rateLimited: true,
        listingReady: false,
      };
    }
    if (msg.includes('invalid') || msg.toLowerCase().includes('audio')) {
      return {
        text: "I had trouble processing that audio. Could you try recording again or type your message?",
        cta: null,
        rateLimited: false,
        listingReady: false,
      };
    }
    return {
      text: `Error: ${msg.slice(0, 120)}`,
      cta: null,
      rateLimited: false,
      listingReady: false,
    };
  }
}

// ─── Intent Extraction ────────────────────────────────────────────────────────

export async function extractIntent(userMessage) {
  if (!userMessage || !userMessage.trim()) return null;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(
      `${INTENT_EXTRACTION_PROMPT}\n\nUser message: "${userMessage}"`
    );
    const raw  = result.response.text().trim();
    const json = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(json);
  } catch (err) {
    console.error('Intent extraction error:', err.message);
    return null;
  }
}

// ─── Listing Extraction ───────────────────────────────────────────────────────
// Converts natural language sell description → structured listing object

export async function extractListing(conversationText) {
  if (!conversationText || !conversationText.trim()) return null;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(
      `${LISTING_EXTRACTION_PROMPT}\n\nUser message: "${conversationText}"`
    );
    const raw  = result.response.text().trim();
    const json = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(json);

    // Only return if we have enough info to make a valid listing
    if (!parsed.title || parsed.confidence < 0.7) return null;
    return parsed;
  } catch (err) {
    console.error('Listing extraction error:', err.message);
    return null;
  }
}

// ─── Semantic Embeddings ──────────────────────────────────────────────────────
// Generates a 768-dim embedding vector for pgvector similarity search

export async function generateEmbedding(text) {
  if (!text || !text.trim()) return null;

  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(text);
    return result.embedding.values; // Float32Array with 768 dimensions
  } catch (err) {
    console.error('Embedding error:', err.message);
    return null;
  }
}

// ─── Price Suggestion ─────────────────────────────────────────────────────────
// Given a listing title + similar listings from the DB, suggest a fair price

export async function suggestPrice(newListingTitle, similarListings) {
  if (!similarListings || similarListings.length === 0) return null;

  const comparables = similarListings
    .filter(l => l.price_fiat)
    .map(l => `- ${l.title}: $${l.price_fiat}`)
    .join('\n');

  if (!comparables) return null;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL });
    const prompt = `Based on these comparable listings in our local marketplace:
${comparables}

What is a fair price range for: "${newListingTitle}"?
Reply with ONLY a JSON object, no markdown:
{"min": number, "max": number, "suggested": number, "reasoning": "1 sentence"}`;

    const result = await model.generateContent(prompt);
    const raw  = result.response.text().trim();
    const json = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(json);
  } catch (err) {
    console.error('Price suggestion error:', err.message);
    return null;
  }
}
