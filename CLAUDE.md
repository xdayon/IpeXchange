# IpêXchange — AI Context File (MVP)

## What this project is
Intent marketplace for Ipê City (network state, Florianópolis, Brazil).
Citizens list their INTERESTS and their OFFERS; the system crosses
intents to suggest purchases, connections and multi-hop trade cycles (2-3
people, off-chain, max 25% value imbalance). Payments in ETH on Base L2
arrive in launch 2.
Interfaces: Web app (ipexchange.xyz) + Telegram Mini App (xchange.synapses.academy) + Telegram Bot.

## NEVER do these things
- NEVER modify the `demo` branch or the `pre-reset-mvp` tag
- NEVER commit secrets or API keys (.env, .dev.vars are gitignored)
- NEVER put business logic inside UI components — use hooks or api/ layer
- NEVER create files over 150 lines without strong justification
- NEVER use hardcoded color values — always use CSS variables from `apps/web/src/styles/tokens.css`
- NEVER write user-facing text in Portuguese — English only (see Language Rule below)
- NEVER use emojis or em dashes in user-facing text — use lucide-react SVG icons
- NEVER mock or stub DB/API calls — always use real Supabase data
- NEVER add features beyond what was explicitly requested
- NEVER create documentation files unless explicitly asked

## Language Rule
**All system code, UI text, comments, variable names, API responses, bot messages, error messages, and prompts must be in English.**
The developer speaks Portuguese — that is fine for conversation — but every output targeting the app, bot, or API must be English.

## Product language
The two user-facing concepts are **Interests** (what you are looking for) and
**Offers** (what you bring to the market). Never use "I have" copy.
Offers are broad: physical goods, digital products, services, work,
consulting, knowledge and skills — all tradeable.
Internally everything is an `intent` with `direction: want | offer`.

## Visual Identity (preserve always)
- Background: `#080C14` (near-black with blue tint)
- Accent Cyan: `#38BDF8`
- Accent Lime: `#B4F44A` (primary CTA color)
- Accent Indigo: `#818CF8`
- Text Primary: `#F8FAFC`
- Text Secondary: `#94A3B8`
- Font: Inter (Google Fonts)
- Card style: glassmorphism (see `.glass-panel` in `apps/web/src/styles/globals.css`)

## Tech Stack
- **Frontend:** React + Vite (`apps/web`) — served as Worker static assets
- **API:** Hono on Cloudflare Workers (`apps/api`) — one Worker, two custom domains
- **Database:** Supabase (PostgreSQL + pgvector + Storage), Worker-only access via secret key
- **Auth:** Privy (`@privy-io/react-auth`) — login: email, wallet, telegram; Worker verifies the Privy JWT (jose + JWKS)
- **Mini App auth:** Telegram initData validated with HMAC in the Worker
- **Blockchain:** Base L2 (chainId 8453) — launch 2
- **Bot:** raw Telegram Bot API (webhook route on the Worker; no Telegraf)
- **LLM:** Groq is primary — `llama-3.3-70b-versatile` (Nexum interview + intent drafting) and `whisper-large-v3` (audio transcription); Gemini REST as fallback for drafting and for embeddings (`gemini-embedding-001`, `outputDimensionality: 768`, normalized client-side)

## Project Structure
```
apps/web/                ← Vite SPA
  src/
    features/{marketplace,intent,cycles,nexum,auth,profile,home}/
    shared/{ui,layout,hooks}/
    api/                 ← all HTTP calls; apiFetch attaches auth headers
    styles/              ← tokens.css (SINGLE SOURCE OF TRUTH), globals.css
    App.jsx              ← routing only (manual history stack, no react-router)
apps/api/                ← Cloudflare Worker
  src/
    index.js             ← Hono app + route mounts only
    middleware/auth.js   ← Privy JWT + Telegram initData
    routes/              ← one file per resource
    lib/                 ← supabase.js, gemini.js, groq.js, telegram.js, notify.js, matching.js, linktoken.js, nexum.js
supabase/migrations/     ← schema; apply with npm run db:apply (tracked in schema_migrations, each file runs once)
scripts/                 ← db-apply.js, seed.js
```

## Key Business Rules
- Matching runs on-demand after intent creation via `ctx.waitUntil()` — no polling, no cron loops (free-tier discipline).
- Multi-hop: 2-hop and 3-hop only; exchanged offers must stay within 25% of each other's value; unknown prices pass.
- AI is gated: `increment_ai_usage` RPC limits Copilot to N actions/user/day.
- Anonymous users browse the market (text search only); login required to publish or mark interest.
- Images: 1 per intent, Supabase Storage bucket `listing-images/`, uploads proxied through the Worker.

## Supabase Tables (MVP)
- `users` — id, privy_did, wallet, email, telegram_id, telegram_username, telegram_dm_ok, display_name, avatar_url
- `intents` — id, user_id, direction (want|offer), kind (good|digital|service|knowledge), title, description, category, price_fiat, image_url, embedding vector(768), status, source
- `intent_drafts` — Copilot drafts (raw_text, drafts jsonb, status)
- `interest_marks` — intent_id, user_id, message (unique per pair)
- `trade_cycles` + `trade_cycle_participants` — multi-hop state machine
- `payments` — direct P2P crypto on Base (token: eth|usdc|eurc|cbbtc): intent_id, buyer/seller, to_wallet, amount_fiat, token_usd_price, amount_wei, tx_hash unique, status (quoted|submitted|confirmed|failed), quote_expires_at
- `notifications` — user_id, type, payload jsonb, telegram_sent
- `ai_usage` — daily per-user AI action counters
- RPCs: `match_intents`, `find_intent_cycles`, `increment_ai_usage`; cycle state machine is atomic plpgsql — `persist_intent_cycle` (dedup by cycle_hash), `respond_to_cycle`, `confirm_cycle_step` (fulfills gives + wants on completion)

## Code Conventions
- No TypeScript — pure JavaScript project
- No comments unless the WHY is non-obvious
- Hooks for all stateful logic (`use*.js` pattern)
- All fetch calls go through `apps/web/src/api/` — never fetch directly in components
- CSS classes over inline styles. Inline styles only for truly dynamic values.
- No new dependencies without justification
