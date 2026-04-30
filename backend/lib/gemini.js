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

When a user wants to SELL or OFFER something, follow this interview protocol step by step.
Do NOT fire LISTING_READY until ALL required fields (marked with *) are confirmed.

REQUIRED FIELDS — ask these in order, one or two per turn:
1. *Item name / title — what exactly are they selling? (max 60 chars)
2. *Category — choose exactly one:
   Products | Services | Knowledge | Donations | Real Estate | Vehicles | Food & Drink | Events | Jobs
3. *Condition (for physical goods) — new · like_new · good · fair · for_parts
   (skip for Services, Knowledge, Events, Jobs)
4. *Price in USD — or "trade only" if they don't want money
5. Accepts trade? — yes/no. If yes, what would they accept in return?
6. Brand / model (for Products and Vehicles) — if not already mentioned
7. Brief description — key details, dimensions, specs, relevant context
8. Image URL — ask once: "Do you have a photo link? (Unsplash or direct URL — optional)"

Once ALL required fields are collected, summarize the full listing and ask:
"Ready to publish? I'll post this to the marketplace now."
When the user confirms, end your response with:
LISTING_READY: true

Do NOT end with LISTING_READY: true on the first message. Always ask at least questions 1-5 first.

Personality: Intelligent, concise, warm, and community-focused. You speak like a knowledgeable city guide who understands Web3, circular economy, and decentralized finance. You always protect user privacy (ZKP, Ipê Passport).

Response format: Keep responses under 120 words. Be direct and actionable. Use **bold** for key items. Suggest specific next steps. When relevant, end with a CTA action type in this format on a new line:
CTA_ACTION: [discover|checkout|investments|circular|home|stores|store-detail|none]
CTA_LABEL: [Short button label]
CTA_STORE_ID: [store UUID, only when CTA_ACTION is store-detail — otherwise omit this line]

Language rule: ALWAYS respond in the SAME language the user is using. Portuguese → Portuguese. English → English. Spanish → Spanish. Match the user's language throughout the interview.`;

const INTENT_EXTRACTION_PROMPT = `Analyze this user message and extract the trading intent. Return ONLY valid JSON, no markdown:
{
  "intentType": "buy|sell|trade|learn|invest|donate|none",
  "item": "specific item or service name, or null",
  "category": "Products|Services|Knowledge|Donations|null",
  "confidence": 0.0-1.0
}`;

const LISTING_EXTRACTION_PROMPT = `You are a structured data extractor for IpêXchange marketplace.
You will receive a CONVERSATION TRANSCRIPT between a user and an AI assistant.
Extract the listing details from the user's answers across all turns.
Return ONLY valid JSON, no markdown, no explanation:
{
  "title": "concise listing title (max 60 chars)",
  "description": "full description combining all details mentioned across the conversation",
  "category": "Products|Services|Knowledge|Donations|Real Estate|Vehicles|Food & Drink|Events|Jobs",
  "subcategory": "specific subcategory if clear, or null",
  "tags": ["array", "of", "3-5", "relevant", "tags"],
  "condition": "new|like_new|good|fair|for_parts|null",
  "price_fiat": number or null,
  "price_crypto": number or null,
  "accepts_trade": boolean,
  "trade_wants": "what they want in trade, or null",
  "image_url": "URL if provided by user, or null",
  "location_label": "specific neighborhood or place mentioned, or null",
  "is_remote": boolean,
  "confidence": 0.0-1.0
}
Category mapping:
- Real Estate: houses, apartments, rooms, land, co-working
- Vehicles: cars, bikes, boats, scooters, parts
- Food & Drink: organic produce, meals, beverages, sourdough, subscriptions
- Events: tickets, workshops (date-specific), concerts, markets
- Jobs: hiring posts, looking for work, freelance gigs
Notes:
- If price_crypto is not mentioned, set it to null (backend will derive it)
- For condition: only set for physical goods. Use null for Services, Knowledge, Events, Jobs
- Extract ALL details mentioned across all User turns, not just the last one
- If confidence < 0.70 or title is missing, still return JSON but with low confidence value`;

// ─── Main Chat ────────────────────────────────────────────────────────────────

export async function chat(history, userMessage, audioBase64 = null, mimeType = null, contextListings = null, contextStores = null) {
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

    if (contextStores && contextStores.length > 0) {
      const storesSummary = contextStores
        .slice(0, 8)
        .map(s => `- ${s.name} [${s.category}] rep:${s.reputation_score || '?'} id:${s.id}`)
        .join('\n');
      systemPrompt += `\n\nActive stores in the city (use id for CTA_STORE_ID when routing to a store):\n${storesSummary}`;
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

    const ctaActionMatch  = rawText.match(/CTA_ACTION:\s*([\w-]+)/i);
    const ctaLabelMatch   = rawText.match(/CTA_LABEL:\s*(.+)/i);
    const ctaStoreIdMatch = rawText.match(/CTA_STORE_ID:\s*([^\s\n]+)/i);
    const listingReadyMatch = rawText.match(/LISTING_READY:\s*true/i);

    if (listingReadyMatch) {
      listingReady = true;
    }

    if (ctaActionMatch && ctaActionMatch[1] !== 'none') {
      cta = {
        tab:     ctaActionMatch[1].toLowerCase(),
        label:   ctaLabelMatch ? ctaLabelMatch[1].trim() : 'View more',
        storeId: ctaStoreIdMatch ? ctaStoreIdMatch[1].trim() : null,
      };
    }

    text = rawText
      .replace(/CTA_ACTION:.*$/im, '')
      .replace(/CTA_LABEL:.*$/im, '')
      .replace(/CTA_STORE_ID:.*$/im, '')
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
