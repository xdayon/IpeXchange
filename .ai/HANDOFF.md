# Session Handoff

Keep this file factual and under 80 lines. Replace stale entries; do not append a
conversation transcript.

## Objective

- 2026-10-24: full audit, database recovery, and a roadmap toward the IslandDAO v5
  demo day (Solana builder residency in Florianopolis, 2026-10-19 to 2026-11-11).
- Do not touch `demo` or recreate `pre-reset-mvp`.

## Current State

- Branch `main-mvp` at `838892f` (pushed). Production Worker is live, but the
  Supabase project `mzjdataxrqtlqufnvpmh` is paused by the Free plan: its host no
  longer resolves, the pooler answers "tenant/user not found", and `/api/market`
  returns 500. The legacy demo project `xzecgbkwrhozoxigfzqn` is paused as well.
- Restoring requires the owner to open the Supabase dashboard (GitHub-login
  account for the MVP, email account for the demo) and click Restore. If the
  restore window has passed, download the backup and restore it into a new project.
- Legacy demo is still served: frontend `ipexchange.onrender.com`, backend
  `ipe-api-x0q3.onrender.com` (Render Free, ~20 s cold start, in-memory mock
  fallback when its DB is down). Its map is broken: CARTO basemaps now return an
  "API KEY REQUIRED" tile. `ipexchange.pages.dev` serves an old MVP build.

## Uncommitted Changes (this session)

- `apps/api/src/lib/keepalive.js`, `scheduled` handler in `src/index.js`, and a
  `17 */6 * * *` cron in `wrangler.jsonc`: pings Supabase through REST (retries
  off) and optional `KEEPALIVE_URLS` (comma list, e.g. the demo backend).
- `GET /api/health/db` returns 503 when the database is unreachable.
- CSP (`_headers` and `SPA_SECURITY_HEADERS`) now allows the Cloudflare Web
  Analytics beacon; the CSP-blocked inline polyfill script was removed from
  `apps/web/index.html` (it never ran in production).
- Verified: `npm run check` passes (116 tests); `wrangler dev --test-scheduled`
  runs the cron and logs the ping; local build renders at 390 px and desktop with
  no horizontal scroll and no CSP inline-script error.

## Audit Findings Not Yet Fixed

- `find_intent_cycles` wrappers (0013, 0014) filter kind/expiry/exchange-mode
  guards after the inner `LIMIT 10`, so valid cycles can be dropped.
- `transaction_mode = 'buy_now'` offers can enter barter cycles.
- `persist_intent_cycle` reserves intents and sets `in_cycle` at suggestion time,
  hiding them from the market for up to 7 days.
- Released intents (decline or expiry) never trigger a new match.
- Edge discovery is a full want x offer scan; `trade_cycles.hops` is limited to 2-3.
- Privy (3.1 MB) is preloaded on every Mini App open even though TMA auth uses initData.

## External Follow-up

- Deploy the keepalive only after the database is restored and the owner approves.
- Production still lacks `PRIVY_APP_SECRET`; payout-wallet verification fails closed.
- Native ETH checkout from ERC-4337 accounts needs a trace-capable `BASE_RPC_URL`.
- Ask GitHub Support to purge cached views of `list_output.txt` (third-party PII);
  earliest affected unreachable commit `443bb094b4243da2ef9b00859f269581d1420ef7`.
