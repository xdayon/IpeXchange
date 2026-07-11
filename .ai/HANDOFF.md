# Session Handoff

Keep this file factual and under 80 lines. Replace stale entries; do not append a
conversation transcript.

## Objective

- No active implementation handoff.

## Current State

- Branch: `feature/nexum-intelligence`
- Last verified commit: `c7b2992`
- Working tree at handoff: agent workflow files added or reorganized.

## Decisions

- `AGENTS.md` is the shared durable instruction source.
- `CLAUDE.md` imports `AGENTS.md` and contains only Claude-specific guidance.
- This file carries temporary cross-session state; chat history is not the
  source of truth.

## Changed Files

- `AGENTS.md`
- `CLAUDE.md`
- `.ai/HANDOFF.md`

## Verification

- Documentation-only workflow change; application checks are not required.

## Next Action

- Replace this handoff when starting the next implementation task.

## Open Risks

- None for the workflow-file change.
