# Session Handoff

Keep this file factual and under 80 lines. Replace stale entries; do not append a
conversation transcript.

## Objective

- Implement the security review in risk order without touching `demo` or
  `pre-reset-mvp`.
- Findings 1-7, 9-16, 18-20, and the cycle-hash part of 17 are fixed locally.

## Current State

- Branch: `feature/nexum-intelligence`
- Last verified commit: `cbebb0e`
- The working tree contains the security fixes and must be preserved.
- Migrations 0015 through 0020 are authored but have not been DB-applied.

## Implemented Decisions

- Payment verification binds the on-chain sender to a Privy wallet belonging to
  the buyer for native ETH and ERC-20 transfers.
- Expired quotes cannot initiate a wallet send; a submitted hash is retained and
  only reverification is offered, preventing accidental duplicate payment.
- `intent_reservations` atomically gives a cycle or payment exclusive ownership
  of an intent; abandoned no-hash reservations expire lazily.
- Privy plus Telegram linking uses the atomic merge RPC, including payment and
  referral foreign keys.
- Seed deletion is scoped to seed users and destructive initial-schema replay
  fails closed.
- Authenticated users have a paginated in-app notification center, unread count,
  mark-read actions, contextual navigation, and no polling.
- Copilot publish consumes only normalized persisted drafts, applies rate and AI
  quota limits, and atomically claims/inserts/finalizes with stale-claim recovery.
- Semantic market search preserves direction, kind, category, exclusion, limit,
  and offset filters.
- Deep links validate UUIDs before authenticated API calls; share replacement is
  callback-based and both public share endpoints require an active intent.
- Interest messages are typed, trimmed, and capped at 280 characters.
- Verified Privy email is synchronized server-side; `ADMIN_EMAILS` promotion
  revalidates it and fails closed when Privy is unavailable.
- Failed payments can only recheck their immutable submitted hash and recover
  atomically when the original quote, buyer wallet, and Offer remain valid.
- `/me` retries transient failures with bounded backoff and preserves a known
  session; initial failures expose a retry action instead of a dead-end login.
- Browser and Telegram navigation use History API state; page URLs, cycle URLs,
  and canonical `/l/:id` links survive refresh and support Back/Forward.
- Local AI quota dates use Florianopolis time; SPA responses include HSTS.
- Upload/settings failures are visible and microphone input is disabled while busy.

## Main Changed Areas

- API payment, auth, Privy, matching, market, interest, Copilot, notification,
  share, and security middleware modules plus focused tests.
- Web payment hook/flow, deep links, notifications UI/API, image/settings error
  handling, and Nexum microphone guard plus focused tests.
- Safe DB apply/seed helpers and tests.
- Migrations `0015_link_merge_fks.sql` through `0020_failed_payment_recovery.sql`.

## Verification

- `npm run check` passes: lint, syntax, 105 tests, web build, Worker dry-run.
- Build emits pre-existing Privy/Rolldown annotation and chunk-size warnings.
- `git diff --check` passes.
- Migrations were reviewed statically; no disposable local Postgres was available.

## Next Actions

- Apply migrations in a controlled non-production environment and exercise the
  payment, account-link, reservation, Copilot, and notification flows end to end.
- Request GitHub cached-object purge for the former PII tag, then finish finding
  17 expiry and remaining low-severity items.

## Open Risks

- Finding 8: only `pre-reset-mvp` reached the PII file; the tag was deleted
  locally and remotely. GitHub cache/object purge is still an external follow-up.
- Automatic cycle expiry and the remaining low-severity items are not fixed.
- Native ETH via ERC-4337 remains unsupported; ERC-20 smart-account transfers work.
