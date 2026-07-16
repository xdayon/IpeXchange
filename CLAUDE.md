@AGENTS.md

## Claude Code

- Treat `AGENTS.md` as the shared source of truth. Do not duplicate its rules.
- Keep compaction summaries focused on the objective, decisions, changed files,
  verification results, unresolved risks, and the next concrete action.
- Use subagents only for independent, bounded tasks that would otherwise add
  large file reads or verbose research to the main context.
