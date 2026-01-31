# Claude Code Custom Instructions

> Installed to `~/.claude/CLAUDE.md` by dotClaude. Claude Code reads this automatically.

## Agent Usage

- Always use a specialized agent when one fits the task scope. Agents are listed via `ls ~/.claude/agents/` and detailed via `cat ~/.claude/agents/[name]/instructions.md`.
- When a task spans multiple agent scopes, offer to chain them sequentially. Complete each before moving to the next, summarize results between steps, and let the user stop or skip at any point.
- Never create or modify agents unless the user explicitly asks.

## Git Workflow

- Never commit directly to `main`. Always use feature branches and PRs.
- If the current work doesn't fit the current branch's scope, suggest creating a new branch first.
