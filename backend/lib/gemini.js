import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use gemini-2.0-flash — stable, free tier, fast
const MODEL = 'gemini-2.0-flash';

// In-memory rate limit tracker (resets on restart)
const requestTimestamps = [];
const MAX_RPM = 13; // stay under the 15 RPM free limit

function isRateLimited() {
  const now = Date.now();
  // Keep only timestamps from the last 60 seconds
  const recent = requestTimestamps.filter(t => now - t < 60000);
  requestTimestamps.length = 0;
  requestTimestamps.push(...recent);
  return recent.length >= MAX_RPM;
}

function recordRequest() {
  requestTimestamps.push(Date.now());
}

const SYSTEM_PROMPT = `You are Xchange Core, the AI agent of IpeXchange — a decentralized local economy platform built on IpeDAO, operating in Jurerê International, Florianópolis, Brazil.

Your role is to help community members:
- Buy, sell, trade, and donate goods and services within the local network
- Find fair prices based on community transaction history
- Discover multi-hop circular trade opportunities (e.g., A gives skill to B, B gives product to C, C gives what A wants)
- Access P2P credit based on their Ipê Rep score
- Connect with local talent, workshops, and knowledge sharing
- Understand the Ipê ecosystem: Ipê Passport (identity), Ipê Rep (reputation), IpeDAO (governance), Rootstock/RBTC (payments)

Current available listings in the network:
- MacBook Pro M1 14" — $1,200 (Alex M.)
- Website Development — from $500 (Bia Tech)
- Bracatinga Honey 500g — $12 (Ipê Farm)
- Yoga at the Park — $15/hour (FitJurerê)
- Artisan Coffee Beans — $9/pack (CoffeeLab)
- Smart Home Setup — $50 (AI Haus)
- Climate Data Analysis — $30 (Jurerê Climate)
- Legal Advice: DAO Gov — from 100 USDC (Ipê Law)
- Projector Rental — $30/day (CineRent)
- Oggi E-Bike — $850 (Marina G.)
- Artisan Sourdough — $5/loaf (Bread & Co)
- Cello Lessons — $15/hour (Music & Co)
- Beehive Construction — 20 USDC or trade (João, Ipê Farm)
- Woodworking Workshop — $15/lesson (WoodCraft)

Network demands (high need):
- Solar panel technicians (HIGH urgency)
- Local eggs / fresh produce (HIGH urgency)
- Carpenters (MEDIUM urgency)

Personality: You are intelligent, concise, warm, and community-focused. You speak like a knowledgeable local guide who also understands Web3 and decentralized finance. You always protect user privacy (ZKP, Ipê Passport).

Response format: Keep responses under 120 words. Be direct and actionable. Use **bold** for key items. Suggest specific next steps. When relevant, end with a CTA action type in this format on a new line:
CTA_ACTION: [discover|checkout|investments|circular|home|none]
CTA_LABEL: [Short button label]

Language rule: ALWAYS respond in the SAME language the user is using — detect it from their text or from the audio content. If the user speaks Portuguese, reply in Portuguese. If English, reply in English. If Spanish, reply in Spanish.`;

const INTENT_EXTRACTION_PROMPT = `Analyze this user message and extract the trading intent. Return ONLY valid JSON, no markdown:
{
  "intentType": "buy|sell|trade|learn|invest|donate|none",
  "item": "specific item or service name, or null",
  "category": "Products|Services|Knowledge|Donations|null",
  "confidence": 0.0-1.0
}`;

export async function chat(history, userMessage, audioBase64 = null, mimeType = null) {
  if (isRateLimited()) {
    return {
      text: '⚡ Core is processing too much data from the ecosystem right now. Please wait a moment and try again — the network is active!',
      cta: null,
      rateLimited: true,
    };
  }

  try {
    recordRequest();
    const model = genAI.getGenerativeModel({
      model: MODEL,
      systemInstruction: SYSTEM_PROMPT,
    });

    // Build conversation history for Gemini
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
          data: audioBase64
        }
      });
      parts.push({ text: userMessage || 'Please listen to this audio message from the user and respond naturally as Xchange Core, in the same language as the audio.' });
    } else {
      parts.push({ text: userMessage });
    }

    const result = await chatSession.sendMessage(parts);
    const rawText = result.response.text();

    // Parse CTA from response
    let text = rawText;
    let cta = null;

    const ctaActionMatch = rawText.match(/CTA_ACTION:\s*(\w+)/i);
    const ctaLabelMatch = rawText.match(/CTA_LABEL:\s*(.+)/i);

    if (ctaActionMatch && ctaActionMatch[1] !== 'none') {
      cta = {
        tab: ctaActionMatch[1].toLowerCase(),
        label: ctaLabelMatch ? ctaLabelMatch[1].trim() : 'View more',
      };
      // Remove CTA lines from the displayed text
      text = rawText
        .replace(/CTA_ACTION:.*$/im, '')
        .replace(/CTA_LABEL:.*$/im, '')
        .trim();
    }

    return { text, cta, rateLimited: false };
  } catch (err) {
    console.error('Gemini error:', err.message, '| Audio:', !!audioBase64, '| MimeType:', mimeType);
    if (err.message?.includes('429') || err.message?.includes('quota')) {
      return {
        text: '⚡ Core is handling a lot of requests right now. Wait a moment and try again!',
        cta: null,
        rateLimited: true,
      };
    }
    if (err.message?.includes('invalid') || err.message?.includes('audio')) {
      return {
        text: 'I had trouble processing that audio. Could you try again or type your message?',
        cta: null,
        rateLimited: false,
      };
    }
    return {
      text: 'An error occurred. Please try again.',
      cta: null,
      rateLimited: false,
    };
  }
}

export async function extractIntent(userMessage) {
  if (isRateLimited()) return null;

  try {
    recordRequest();
    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(
      `${INTENT_EXTRACTION_PROMPT}\n\nUser message: "${userMessage}"`
    );
    const raw = result.response.text().trim();
    // Strip markdown code fences if present
    const json = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(json);
  } catch (err) {
    console.error('Intent extraction error:', err.message);
    return null;
  }
}
