# IpeXchange Agent Guide

## Product

IpeXchange is the intent marketplace for Ipe City in Florianopolis, Brazil.
Users publish **Interests** (what they seek) and **Offers** (what they bring).
The product suggests direct matches and 2-3 person trade cycles. Web, Telegram
Mini App, and Telegram Bot are supported. Crypto payments on Base are launch 2.

## Non-Negotiables

- Never modify the `demo` branch or the `pre-reset-mvp` tag.
- Never commit secrets or API keys. `.env` and `.dev.vars` are ignored.
- Keep business logic out of UI components; use hooks or `api/` modules.
- Do not add dependencies or features without a concrete need in the request.
- Use real Supabase data; do not mock or stub database/API behavior.
- Keep app code, UI copy, comments, API responses, bot messages, errors, and
  prompts in English. Conversation with the developer may be in Portuguese.
- Do not use emoji or em dashes in user-facing copy. Use Lucide SVG icons.
- Prefer files below 150 lines; exceed that only when splitting would hurt
  cohesion or readability.
- Do not create documentation unless the request requires it.

## Product Vocabulary

- User-facing concepts are **Interests** and **Offers**. Never use "I have."
- Offers include goods, digital products, services, work, consulting,
  knowledge, and skills.
- Internally, both are `intent` records with `direction: want | offer`.
- Multi-person trades are "trade loops" in UI copy; a 2-person loop may be
  called a "direct swap". Internally they are `trade_cycles`.

## Stack And Routing

- Frontend: React + Vite in `apps/web`, pure JavaScript.
- API: Hono on Cloudflare Workers in `apps/api`.
- Data: Supabase PostgreSQL, pgvector, and Storage; access it through the Worker.
- Auth: Privy JWT on web and validated Telegram `initData` in the Mini App.
- AI: Groq primary, Gemini fallback and embeddings. Verify active model names in
  `apps/api/src/lib/` rather than relying on documentation.
- Frontend HTTP calls belong in `apps/web/src/api/` and use `apiFetch`.
- Stateful UI logic belongs in `use*.js` hooks.
- API routes belong in `apps/api/src/routes/`; shared integrations and business
  logic belong in `apps/api/src/lib/`.
- Database changes belong in `supabase/migrations/` and run through
  `npm run db:apply`.

## UI Rules

- Preserve the established dark glass visual language.
- Use CSS classes, not inline styles, except for truly dynamic values.
- Use variables from `apps/web/src/styles/tokens.css`; never hardcode colors.
- See `apps/web/src/styles/globals.css` for shared patterns such as
  `.glass-panel`.

## Business Rules

- Matching runs through `ctx.waitUntil()` (or inline for swipes) after an
  intent is created or edited, after a swipe or interest mark, and after a loop
  is declined or superseded. Do not add polling or matching crons; clearing
  rounds are admin-triggered (`POST /api/admin/clearing`). The only scheduled
  job is the Supabase keepalive cron in `wrangler.jsonc`.
- Trade loops have 2 to 7 participants, ranked by the product of edge
  acceptance probabilities, with at most 25% value imbalance; unknown prices
  pass. Semantic edges need similarity >= 0.70; swipes and interest marks on
  exchangeable Offers are explicit edges. Buy now only Offers never join loops.
- Suggestions do not reserve intents. The last acceptance claims one-off
  intents and supersedes competing suggestions; continuous intents are never
  reserved. Matching logic lives in SQL (`supabase/migrations/0023_*`) and is
  covered by `npm run test:db`.
- AI usage is limited by the `increment_ai_usage` RPC.
- Anonymous users may browse with text search. Publishing and marking interest
  require authentication.
- Each intent supports one image in the `listing-images/` Storage bucket;
  uploads are proxied through the Worker.

## Work Method

- Inspect relevant code and `git status` before editing; do not guess structure.
- Keep changes limited to the requested outcome and preserve unrelated edits.
- Use the main agent for small changes. Delegate only independent, bounded work
  whose isolated context saves more than the delegation overhead.
- Before switching agents or ending incomplete work, update `.ai/HANDOFF.md`.
- Start a resumed session by reading `AGENTS.md`, `.ai/HANDOFF.md`, and the diff,
  then verify that the handoff still matches the repository.
- Run the narrowest relevant check while iterating. Before completion, run
  `npm run check` when the change scope permits it.

## Commands

```bash
npm run dev
npm run dev:api
npm test
npm run lint
npm run check
npm run build
npm run db:apply
npm run test:db   # needs TEST_DATABASE_URL (disposable Postgres + pgvector)
```

