# Claude Code Custom Instructions

> Installed to `~/.claude/CLAUDE.md` by dotClaude. Claude Code reads this automatically.

## Agent Usage

- Always use a specialized agent when one fits the task scope. Agents are listed via `ls ~/.claude/agents/` and detailed via `cat ~/.claude/agents/[name]/instructions.md`.
- Never perform multi-step workflows (code generation, reviews, git operations, documentation updates) inline. Delegate each step to the appropriate agent.
- For simple, single-step tasks (renaming a variable, answering a question, reading a file), work directly — agents add overhead when the task is trivial.
- When recommending an agent, explain why it fits, show the usage command, and ask for permission before switching. Never autonomously switch to an agent.
- When multiple agents could handle a request, prefer the most narrowly scoped one. If unclear, ask the user which agent to use.
- Launch independent agents in parallel when possible to maximize throughput.
- When a task spans multiple agent scopes, offer to chain them sequentially. Complete each before moving to the next, summarize results between steps, and let the user stop or skip at any point.
- After creating or modifying agents, run agent-review-agent and fix findings with agent-updater.
- After feature work, update README.md via documentation-agent and CHANGELOG.md via changelog-agent.
- Never create or modify agents unless the user explicitly asks.

## Git Workflow

- Never commit directly to `main`. Always use feature branches and PRs.
- If the current work doesn't fit the current branch's scope, suggest creating a new branch first.
- Always use the appropriate git agent (git-commit-agent, git-pr-agent, git-tags-agent, etc.) for git operations instead of running git commands directly.
- NEVER run `git commit`, `git push`, or `git tag` from root — not even as a fallback. If a git agent fails, retry the agent or ask the user to run the command manually. Do not attempt the git command inline.

## Subagent Management

- If a subagent fails due to permission or tool errors, retry the subagent rather than performing the work inline from the root agent. The root agent should delegate, not fall back to doing the work itself.
- If a subagent fails twice on the same error, diagnose the root cause (missing tool, permission denied, file not found) and report to the user with a suggested fix before retrying.
- When running multiple agents, summarize each agent's result before launching the next. This gives the user a chance to course-correct.
- Prefer foreground agents when the result is needed before proceeding. Use background agents only for genuinely independent work.

## Communication Style

- Be direct and concise. Lead with the answer or action, not the reasoning.
- When proposing changes, state what you will change and why. Ask for confirmation before destructive or irreversible actions.
- After completing a task, provide a brief summary of what was done. Do not restate the full conversation.
- When an agent produces a report, surface the key findings to the user — do not dump raw output without context.

## Agent Quick Reference

| Category | Count | Key Agents |
|----------|-------|------------|
| GitHub | 6 | git-commit-agent, git-pr-agent, git-tags-agent, git-issues-agent, git-sync-agent, pr-review-agent |
| Documentation | 4 | documentation-agent, changelog-agent, doc-review-agent, api-doc-agent |
| Code | 7 | code-review-agent, code-cleanup-agent, code-linting-agent, security-review-agent, dependency-agent, python-agent, terraform-agent |
| Frontend | 4 | component-generator-agent, form-builder-agent, route-generator-agent, accessibility-agent |
| Backend | 3 | api-endpoint-agent, auth-agent, seed-data-agent |
| Data | 6 | api-client-agent, sql-migration-agent, sql-query-agent, sql-schema-agent, state-management-agent, validation-schema-agent |
| Testing | 3 | debug-agent, unit-test-agent, integration-test-agent |
| Infrastructure | 9 | agent-creator, agent-updater, agent-review-agent, dotclaude-updater, docker-agent, cicd-agent, deployment-agent, env-config-agent, gitops-agent |

> 42 agents across 8 categories. See `~/.claude/agents/` for full list. See [agent-guidelines.md](docs/agent-guidelines.md) for design standards.
