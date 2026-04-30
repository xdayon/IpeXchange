# IpêXchange — Voice-First AI Listing Protocol

**Goal:** A user (Privy-logged) opens the chat, speaks or types about something they want to sell, the AI conducts a structured interview, extracts a complete listing draft, and on confirmation the listing appears live in Discover for all visitors.

**Deadline context:** Demo 2026-05-01. Everything in this plan uses only existing infrastructure — no new tables, no new API keys, no new dependencies.

---

## Current State Analysis

### What already works
- Audio recording via `MediaRecorder` in `ChatDrawer.jsx` and `AgentCommandCenter.jsx`
- Audio transcription natively by Gemini (multimodal inline data)
- `LISTING_READY: true` marker detection in `gemini.js`
- `extractListing()` → structured JSON with Gemini
- `publishListing()` → `POST /api/listings` → Supabase INSERT with embedding
- Draft card UI rendered in chat with "Confirm Publish" button
- Listing persisted to DB and returned by `GET /api/discover`

### Critical Gaps

| # | Problem | Root Cause |
|---|---------|------------|
| 1 | AI fires LISTING_READY too early | System prompt says "once you have title + description + category" — insufficient; misses condition, price, crypto, trade |
| 2 | `extractListing` only sees the last user message | `server.js` line 118 passes `message \|\| displayMessage` (current turn only), losing all interview context |
| 3 | Draft card shows only title + category | The draft could be richer but UI doesn't display price, condition, tags, trade info |
| 4 | "Edit" button is dead | `onClick` not implemented in `ChatDrawer.jsx` line 291 |
| 5 | "Listing published!" banner fires too early | Condition on line 297: `msg.listingReady \|\| msg.listingPublished` — shows on `listingReady` before user even clicks Confirm |
| 6 | `provider_name` is null in DB | `extractListing` doesn't capture it; frontend `displayName` is never sent to the listing |
| 7 | No default image | If user doesn't provide one, `image_url` is null in DB — listing appears blank in Discover |
| 8 | System prompt lists 4 categories only | `Products \| Services \| Knowledge \| Donations` — misses Real Estate, Vehicles, Food & Drink, Events, Jobs that Discover already supports |
| 9 | `price_crypto` never set on AI-created listings | `extractListing` prompt doesn't ask for it; backend doesn't derive it |

---

## Implementation Tracks

### Track 1 — Gemini: Structured Interview Protocol
**File:** `backend/lib/gemini.js`

#### 1A — Rewrite the sell-intent section of `SYSTEM_PROMPT`

Replace the vague current directive with a strict numbered interview protocol. The AI must collect ALL required fields before firing `LISTING_READY: true`.

**New section to add to SYSTEM_PROMPT** (replace lines 27-39):

```
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
Language rule: match the user's language throughout the interview.
```

**Why this matters:** The current system allows the AI to fire LISTING_READY after a single vague message like "selling my bike". The new protocol forces a complete multi-turn interview before extract.

#### 1B — Update `LISTING_EXTRACTION_PROMPT`

The current prompt expects a single user message. Update it to handle a full conversation transcript (multiple turns) and add missing fields:

```javascript
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
```

---

### Track 2 — Backend: Pass Full Conversation to `extractListing`
**File:** `backend/server.js`

#### 2A — Format conversation history for extraction

Current code (line 117-119):
```javascript
let listingDraft = null;
if (response.listingReady) {
  listingDraft = await extractListing(message || displayMessage);
}
```

Replace with:
```javascript
let listingDraft = null;
if (response.listingReady) {
  // Build conversation context from session history (last 20 messages)
  const recentHistory = await getSessionHistory(sessionId, 20);
  const conversationContext = recentHistory
    .map(m => `${m.role === 'user' ? 'User' : 'Agent'}: ${m.content}`)
    .join('\n');
  // Append the current turn (not yet saved to history at this point)
  const fullContext = conversationContext
    + `\nUser: ${message || displayMessage}`
    + `\nAgent: ${response.text}`;
  listingDraft = await extractListing(fullContext);
}
```

**Why:** The `getSessionHistory` call is already made on line 82 (`const history = await getSessionHistory(sessionId, 20)`). We can reuse that variable instead of a second DB call — just pass `history` directly:

```javascript
// Reuse the history already loaded at line 82
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
```

No extra DB call needed — `history` is already in scope from line 82.

#### 2B — Auto-derive `price_crypto` and set `provider_name`

In the `POST /api/listings` handler (lines 136-168), after `createListing` is called, enrich the listing before insertion:

```javascript
// Enrich listing before insert
const enrichedListing = {
  ...listing,
  // Derive crypto price from fiat if not provided (10% discount for crypto)
  price_crypto: listing.price_crypto ?? (listing.price_fiat ? Math.round(listing.price_fiat * 0.9 * 100) / 100 : null),
  // Ensure crypto and trade are in acceptedPayments
  accepts_trade: listing.accepts_trade ?? false,
  // active and ai_generated are set by createListing, but ensure they're in the payload
};
const created = await createListing({ sessionId, listing: enrichedListing, embedding });
```

Also accept `provider_name` and `walletAddress` from the request body so the frontend can pass them at publish time:

```javascript
const { sessionId, listing, providerName, walletAddress } = req.body;
// ...
const enrichedListing = {
  ...listing,
  provider_name: providerName || listing.provider_name || 'Community Member',
  price_crypto: listing.price_crypto ?? (listing.price_fiat ? Math.round(listing.price_fiat * 0.9 * 100) / 100 : null),
  accepts_trade: listing.accepts_trade ?? false,
  image_url: listing.image_url || 'https://images.unsplash.com/photo-1472289065668-ce650ac443d2?auto=format&fit=crop&q=80&w=400&h=300',
};
```

#### 2C — Return the listing ID in the publish response

The current `POST /api/listings` returns `{ listing, priceHint }`. The `listing` object from Supabase includes `id`. Ensure the frontend receives it — no code change needed, it's already returned.

---

### Track 3 — Frontend: Enhanced Draft Card + Edit Flow
**File:** `src/components/ChatDrawer.jsx`

#### 3A — Show all captured fields in the draft card

Current draft card (lines 272-294) only shows title and category. Replace with a richer display and a local edit state.

**New state for editing:**
```javascript
const [editingDraft, setEditingDraft] = useState(null); // { msgId, draft }
```

**New draft card structure:**

```jsx
{msg.role === 'agent' && msg.listingDraft && !msg.listingPublished && (
  <div className="listing-draft-card glass-panel" style={{ marginTop: 12, padding: 16, border: '1px solid var(--accent-lime)' }}>
    <p style={{ fontSize: 10, color: 'var(--accent-lime)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 }}>
      ✨ Listing Draft Ready
    </p>
    
    {/* Title */}
    <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{msg.listingDraft.title}</h4>
    
    {/* Key fields summary */}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
      <span className="badge-cyan">{msg.listingDraft.category}</span>
      {msg.listingDraft.subcategory && <span className="badge-secondary">{msg.listingDraft.subcategory}</span>}
      {msg.listingDraft.condition && <span className="badge-secondary">{msg.listingDraft.condition}</span>}
      {msg.listingDraft.price_fiat && <span className="badge-lime">${msg.listingDraft.price_fiat}</span>}
      {msg.listingDraft.accepts_trade && <span className="badge-purple">Accepts Trade</span>}
    </div>
    
    {/* Description preview */}
    {msg.listingDraft.description && (
      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>
        {msg.listingDraft.description.slice(0, 120)}{msg.listingDraft.description.length > 120 ? '…' : ''}
      </p>
    )}
    
    {/* Trade wants */}
    {msg.listingDraft.trade_wants && (
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
        🔄 Wants in trade: {msg.listingDraft.trade_wants}
      </p>
    )}
    
    {/* Tags */}
    {msg.listingDraft.tags?.length > 0 && (
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
        {msg.listingDraft.tags.map(tag => (
          <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
            #{tag}
          </span>
        ))}
      </div>
    )}
    
    {/* Action buttons */}
    <div style={{ display: 'flex', gap: 8 }}>
      <button
        className="checkout-cta"
        style={{ flex: 1, padding: '9px 12px', fontSize: 13 }}
        onClick={() => handlePublish(msg.id, msg.listingDraft)}
        disabled={publishing === msg.id}
      >
        {publishing === msg.id ? <Loader2 size={14} className="spin-animation" /> : <PackageCheck size={14} />}
        Publish to Marketplace
      </button>
    </div>
  </div>
)}
```

**Why remove the Edit button:** The edit-in-chat UX is complex to implement correctly in the time available, and the AI interview protocol (Track 1) ensures all fields are collected before reaching the draft stage. Remove the dead "Edit" button entirely for now — users can instead type corrections in the chat ("change the price to $800") and the agent will re-generate the draft.

#### 3B — Fix the "Listing published!" banner condition

Current (line 297):
```jsx
{msg.role === 'agent' && (msg.listingReady || msg.listingPublished) && (
```

Fix:
```jsx
{msg.role === 'agent' && msg.listingPublished && (
```

The `listingReady` flag means "a draft is ready to review", not "published". Showing the banner on `listingReady` is wrong — it shows before the user even clicks Confirm.

#### 3C — Show listing ID / deep link after publish

In `handlePublish`, after a successful result, update the message state to include the listing ID:

```javascript
const handlePublish = async (msgId, draft) => {
  setPublishing(msgId);
  const result = await publishListing(sessionId, draft);
  if (result) {
    setMessages(prev => prev.map(m =>
      m.id === msgId
        ? { ...m, listingDraft: null, listingPublished: true, publishedListingId: result.id }
        : m
    ));
  }
  setPublishing(null);
};
```

Update the published banner to show the listing ID (for future "view your listing" deep link when ListingDetailPage supports it by ID):

```jsx
{msg.role === 'agent' && msg.listingPublished && (
  <div className="listing-published-banner" style={{ marginTop: 12 }}>
    <PackageCheck size={14} />
    Live in the marketplace!
    <button className="listing-published-link" onClick={() => handleCTA({ tab: 'discover' })}>
      View in Discover →
    </button>
  </div>
)}
```

#### 3D — Pass `providerName` and `walletAddress` at publish time

Update `handlePublish` to enrich the draft before sending:

```javascript
const handlePublish = async (msgId, draft) => {
  setPublishing(msgId);
  const enrichedDraft = {
    ...draft,
    provider_name: displayName || walletAddress?.slice(0, 8) || 'Community Member',
  };
  const result = await publishListing(sessionId, enrichedDraft, walletAddress, displayName);
  // ...
};
```

Update `publishListing` in `src/lib/api.js` to accept and forward these fields:

```javascript
// Current
export async function publishListing(sessionId, listing)

// New
export async function publishListing(sessionId, listing, walletAddress = null, providerName = null) {
  try {
    const res = await fetch(`${API_URL}/listings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        listing,
        walletAddress,
        providerName,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.listing || null;
  } catch { return null; }
}
```

---

### Track 4 — AgentCommandCenter Sync
**File:** `src/components/AgentCommandCenter.jsx`

`AgentCommandCenter.jsx` has the same chat + listing logic as `ChatDrawer.jsx`. Apply the same changes from Track 3 (3A, 3B, 3C, 3D) to this file as well:
- Replace draft card with the richer version (3A)
- Fix the banner condition (3B)
- Update `handlePublish` to pass providerName + walletAddress (3D)
- Both components share the same API layer so Track 2 fixes apply automatically

---

### Track 5 — Quick Actions Update
**File:** `src/components/ChatDrawer.jsx` and `AgentCommandCenter.jsx`

Add a quick action that directly starts the sell protocol:

```javascript
const QUICK_ACTIONS = [
  { label: '📦 Sell something',    prompt: 'I want to sell something' },  // NEW — puts AI into sell protocol
  { label: '✨ Daily Insight',      prompt: "Show me what's trending in the city today" },
  { label: '💰 Price an item',      prompt: 'I need help pricing something I want to sell' },
  { label: '🔄 Suggest trades',     prompt: 'What interesting trades do you suggest for me?' },
  { label: '🌐 Multi-hop trade',    prompt: 'Search for circular multi-hop trade opportunities in the ecosystem' },
  { label: '📚 Offer a course',     prompt: 'I want to publish a course or workshop I teach' },
  { label: '🧘 Wellness service',   prompt: 'I want to list a therapy or wellness service' },
];
```

"Sell something" as the first chip guarantees users immediately discover the voice listing flow.

---

## Execution Order

1. **Track 1A** — Update `SYSTEM_PROMPT` in `gemini.js` (interview protocol + full category list)
2. **Track 1B** — Update `LISTING_EXTRACTION_PROMPT` in `gemini.js` (conversation-aware)
3. **Track 2A** — Fix `server.js` to pass full conversation to `extractListing`
4. **Track 2B** — Enrich listing in `POST /api/listings` (crypto price, provider_name, default image)
5. **Track 3A** — Rich draft card in `ChatDrawer.jsx`
6. **Track 3B** — Fix listingPublished banner condition
7. **Track 3C** — Pass listing ID after publish
8. **Track 3D** — Pass providerName + walletAddress
9. **Track 4** — Mirror all Track 3 changes in `AgentCommandCenter.jsx`
10. **Track 5** — Add "Sell something" quick action chip

Tracks 1 and 2 are backend (one deploy). Tracks 3-5 are frontend (one build). No schema changes.

---

## End-to-End Flow After Implementation

```
User opens ChatDrawer or AgentCommandCenter
    │
    ├─ Types "I want to sell my laptop" OR taps mic and says it
    │
    ↓
Gemini recognizes sell intent → enters interview protocol
  → Asks: "What model is it? MacBook, Dell, what?"
  → Asks: "Is it new or used? What's the condition?"
  → Asks: "What price are you thinking?"
  → Asks: "Would you accept trade? What would you want?"
  → Asks: "Do you have a photo link? (optional)"
  → Summarizes: "Here's what I'll post: MacBook Pro M1 · Good condition · $1,100 · Accepts trade for web dev services. Ready to publish?"
  → User: "Yes!"
  → AI ends with LISTING_READY: true
    │
    ↓
server.js detects LISTING_READY → calls extractListing(fullConversation)
  → Gemini reads all turns → returns structured JSON with all fields
    │
    ↓
Frontend renders rich Draft Card:
  ┌──────────────────────────────────────────┐
  │ ✨ LISTING DRAFT READY                   │
  │ MacBook Pro M1 14"                        │
  │ [Products] [good] [$1,100] [Accepts Trade]│
  │ Accepts trade for web dev services        │
  │ #laptop #apple #macbook #tech #m1         │
  │                                           │
  │  [ Publish to Marketplace ]               │
  └──────────────────────────────────────────┘
    │
    ↓ User clicks "Publish to Marketplace"
    │
ChatDrawer calls publishListing(sessionId, enrichedDraft, walletAddress, displayName)
    │
    ↓
POST /api/listings
  → generateEmbedding(title + desc + category)
  → enrichedListing = { ...draft, provider_name: "Jean H.", price_crypto: 990, image_url: placeholder }
  → createListing() → Supabase INSERT (active: true, ai_generated: true, is_mock: false)
    │
    ↓
Live in Discover immediately for all users:
  → GET /api/discover returns the new listing
  → Appears at top of results (newest first)
    │
    ↓
Chat shows success banner:
  "✅ Live in the marketplace! [View in Discover →]"
```

---

## Verification Checklist

- [ ] AI does NOT fire `LISTING_READY` after a single vague message
- [ ] AI asks all required questions before summarizing
- [ ] AI interview works with voice input (audio → Gemini → same protocol)
- [ ] `extractListing` reads all conversation turns, not just the last message
- [ ] Draft card shows: title, category, condition, price, trade info, tags
- [ ] "Listing published!" banner appears ONLY after clicking Confirm, not immediately on draft
- [ ] New listing appears in Discover page after publish (refresh or auto-refresh in 30s)
- [ ] `provider_name` is populated in the DB with the user's display name
- [ ] `price_crypto` is set in the DB (derived from fiat or extracted from conversation)
- [ ] `image_url` is never null in the DB (either from user or from placeholder)
- [ ] Portuguese and English voice inputs both trigger the protocol correctly
- [ ] Guest users (no Privy login) see the listing appear as "Community Member"
- [ ] All changes work in both ChatDrawer and AgentCommandCenter
