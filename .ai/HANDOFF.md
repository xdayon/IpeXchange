# Session Handoff

Keep this file factual and under 80 lines. Replace stale entries; do not append a
conversation transcript.

## Objective

- Implement a comprehensive English/USD UX improvement: first-login onboarding,
  clearer marketplace education, explicit offer/payment modes, and accessibility.
- Do not touch `demo` or recreate `pre-reset-mvp`.

## Current State

- Branch: `main-mvp`; last published commit: `f597ccc` (merged PR #2).
- `apps/web/src/main.jsx` now reads `VITE_PRIVY_CLIENT_ID` and passes it to
  `PrivyProvider`; the ignored `apps/web/.env` contains the public Client ID.
- The Client ID change is merged and deployed to `ipexchange.xyz` and
  `xchange.synapses.academy` as Worker version `730643a1-454f-4ddd-9fe7-edfaf7bcad47`.
- Production is missing `PRIVY_APP_SECRET`; login JWT validation still works,
  but verified email, payout-wallet ownership, and payment checks need it.
- Migrations 0015 through 0021 are applied to the Supabase project configured in
  `apps/api/.dev.vars` (`mzjdataxrqtlqufnvpmh`).
- Pre-existing uncommitted Nexum engine/interview changes span 16 API/web files;
  preserve them while integrating the UX work.
- Gas sponsorship is out of scope: network fees must remain buyer-paid and the
  platform must not assume paymaster or promotional-credit costs.
- UX changes and migration 0022 are local only: not committed, deployed, or
  applied to Supabase.

## Implemented

- Versioned first-login onboarding explains Interests, Offers, purchases,
  exchanges, group trades, and Nexum; it is replayable from Settings.
- Home, Market, Group trades, navigation, empty states, contrast, focus,
  keyboard semantics, reduced motion, and target sizes have a clarity pass.
- Offers choose Exchange only, Buy now, or Both. Buy now requires a verified
  payout wallet, positive USD price, and seller-selected Base tokens; USDC is
  the default, checkout is non-custodial, and gas remains buyer-paid.
- Settings supports explicit selection and verification of a payout wallet.
- Migration 0021 expires unanswered cycles after seven days, releases their
  intents atomically, permits safe re-suggestion, and pins every application SQL
  function to `public, pg_temp`.
- Cycle expiry runs lazily during matching and cycle reads/actions, with no poller.
- Checkout requires explicit wallet choice when multiple wallets are connected.
- Native ERC-4337 ETH verification requires both a UserOperation sender and a
  matching internal transfer trace; unavailable traces stay pending and safe.

## Verification

- Current combined `npm run check` passes: lint, syntax, 114 tests, web build,
  and Worker dry-run. `git diff --check` passes.
- Production `/api/health` responds with HTTP 200; the new frontend bundle is
  available on `xchange.synapses.academy` and contains the Client ID.
- `npm audit --omit=dev --audit-level=high` reports no high or critical issues;
  ten transitive moderate `uuid` findings remain behind Privy/MetaMask.
- Migrations 0001-0021 apply from scratch on disposable PostgreSQL 17 + pgvector.
- A transactional SQL test confirms cycle expiry, reservation release, intent
  reactivation and insertion of a new cycle with the same hash.
- PostgreSQL catalog inspection confirms all application functions have pinned
  search paths.
- The default Base public RPC supports neither `debug_traceTransaction` nor
  `trace_transaction`; production needs a trace-capable `BASE_RPC_URL` before
  enabling native ETH checkout from an ERC-4337 smart account.

## External Follow-up

- Exercise payment, account linking, reservations, Copilot and notifications
  against the configured Supabase project after deployment.
- `pre-reset-mvp` is absent from the GitHub API and remote refs. GitHub documents
  that cached SHA views can only be purged through a Support Portal ticket; ask
  Support to purge cached views/references for `list_output.txt` in
  `xdayon/IpeXchange` because it contains third-party PII. The earliest affected
  unreachable commit is `443bb094b4243da2ef9b00859f269581d1420ef7`.

## Notes

- The remaining npm audit items are moderate transitive `uuid` advisories. npm's
  proposed forced fix downgrades Privy and must not be used.
- Build warnings are third-party Privy/Rolldown annotations and chunk size only.
