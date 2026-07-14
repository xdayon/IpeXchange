# Session Handoff

Keep this file factual and under 80 lines. Replace stale entries; do not append a
conversation transcript.

## Objective

- Complete every actionable item from the security and quality review without
  touching `demo` or recreating `pre-reset-mvp`.

## Current State

- Branch: `feature/nexum-intelligence`
- Last published commit: `64825b1`
- Working tree contains the final follow-up fixes and must be preserved.
- Migrations 0015 through 0021 are authored but not applied to a shared database.

## Implemented

- Findings 1-7, 9-20 and the listed low-severity application issues are fixed.
- Migration 0021 expires unanswered cycles after seven days, releases their
  intents atomically, permits safe re-suggestion, and pins every application SQL
  function to `public, pg_temp`.
- Cycle expiry runs lazily during matching and cycle reads/actions, with no poller.
- Checkout requires explicit wallet choice when multiple wallets are connected.
- Native ERC-4337 ETH verification requires both a UserOperation sender and a
  matching internal transfer trace; unavailable traces stay pending and safe.
- Archived listing images are removed from the owner's Storage path; a failed
  deletion restores the URL and returns a retryable error.
- `ws` 8 consumers are overridden to 8.21.0; the WalletConnect component that
  requires major 7 remains on 7.5.11. Privy was not downgraded.

## Verification

- `npm run check` passes: lint, syntax, 112 tests, web build, Worker dry-run.
- `git diff --check` passes.
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

- Apply migrations 0015-0021 to staging, exercise real integrations, then apply
  them to production using the guarded `npm run db:apply` workflow and backups.
- `pre-reset-mvp` is absent from the GitHub API and remote refs. GitHub documents
  that cached SHA views can only be purged through a Support Portal ticket; ask
  Support to purge cached views/references for `list_output.txt` in
  `xdayon/IpeXchange` because it contains third-party PII. The earliest affected
  unreachable commit is `443bb094b4243da2ef9b00859f269581d1420ef7`.

## Notes

- The remaining npm audit items are moderate transitive `uuid` advisories. npm's
  proposed forced fix downgrades Privy and must not be used.
- Build warnings are third-party Privy/Rolldown annotations and chunk size only.
