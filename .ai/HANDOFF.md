# Session Handoff

Keep this file factual and under 80 lines. Replace stale entries; do not append a
conversation transcript.

## Objective

- 2026-10-25: audit follow-up. Engine, Mini App and legacy demo upgraded for the
  IslandDAO v5 demo day (Solana residency, Florianopolis, ends 2026-11-11).
- Both versions run on Cloudflare Workers + Supabase; Render is retired.
- Do not touch `demo` or recreate `pre-reset-mvp`.

## Current State (local commits, nothing pushed or deployed)

- `main-mvp`: keepalive cron + `/api/health/db` (22b7787); matching engine v2,
  migration 0023 (9ada99c); review hardening (cdceabe); loop receipts with
  Solana anchoring, migration 0024 (merge f44e62c).
- `feat/tma-experience` (worktree in the session scratchpad): Mini App overhaul
  (Privy only on web, swipe deck, Discover hub, MapLibre map, loop radar,
  clearing panel, celebrations). Merge into `main-mvp` after its final pass.
- `showcase` (from `demo`): legacy demo ported to Worker `ipexchange-demo` on
  `demo.ipexchange.xyz`, Esri tiles, seed endpoint guarded by ADMIN_SEED_TOKEN.
- Production Supabase `mzjdataxrqtlqufnvpmh` and demo `xzecgbkwrhozoxigfzqn`
  are paused by the Free plan; production `/api/market` returns 500 until restored.

## Engine Facts

- Loop edges need cosine similarity >= 0.70 (real Gemini pairs 0.77-0.88,
  look-alikes up to 0.69); swipes and interest marks are explicit edges.
- Beam search, loops of 2-7; benchmark (400 dense members): find 76 ms,
  clearing 4 s. Temp tables must be TRUNCATEd (DELETE bloats them).
- `intent_swipes` uses a surrogate key: a composite (user_id, offer_id) PK makes
  PostgREST see a users<->intents junction and breaks `users(...)` embeds.
- One `match_and_persist` RPC per trigger and `notifyMany` keep a 7-person loop
  inside the 50-subrequest Workers Free budget.
- Public Solana devnet RPC blocks Workers traffic and its faucet returned 429;
  the memo transaction was validated with `simulateTransaction` (sigVerify):
  AccountNotFound for the real tx, SignatureFailure for a tampered one.

## Verification

- `npm run check`: 130 tests pass (+24 DB tests skipped without a database).
- `npm run test:db` (PostgreSQL 17 + pgvector): 24 pass; clean apply of
  0001-0024 verified; CI job `matching-db` added.
- End-to-end through the local Worker + PostgREST: publish, deck, swipe,
  loop found, accept, decline, supersede, cancel, clearing, map, receipts.

## Owner Follow-up

- Restore both Supabase projects; then `npm run db:apply` (0022-0024).
- Deploy: `npm run deploy` (main), `npm run deploy` in the `showcase` checkout.
- Secrets: PRIVY_APP_SECRET (still missing), ADMIN_TELEGRAM_IDS; demo needs
  GEMINI_API_KEY + SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY; optional
  SOLANA_ANCHOR_SECRET + provider SOLANA_RPC_URL (Helius/QuickNode).
- Privy allowed origins: add demo.ipexchange.xyz.
- Ask GitHub Support to purge cached views of `list_output.txt` (PII); earliest
  affected commit `443bb094b4243da2ef9b00859f269581d1420ef7`.
