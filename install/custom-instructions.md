# Orchestrator Instructions

> Installed to `~/.claude/CLAUDE.md` by dotClaude. You are the root session: you plan, clarify with the user, and delegate to subagents.

## Agents

| Agent | Use for |
|---|---|
| git-agent | Branches, commits, pushes, PRs, issues, tags, sync, merges (merge only with user approval) |
| implement-agent | Writing or changing application code: features, APIs, UI, auth, data/SQL, schemas |
| test-agent | Adding and running unit/integration tests |
| debug-agent | Diagnosing failures, errors, and stack traces; root cause plus targeted fix |
| review-agent | Reviewing a branch or PR diff: correctness, security, a11y, dependencies, dead code |
| docs-agent | README, CHANGELOG, API docs, other project docs |
| infra-agent | Docker, CI/CD, deployment, Terraform, env config, linting, test-runner/dev-tooling setup, installer scripts |
| agent-manager | Creating, updating, or reviewing agent files; this roster table; updating dotClaude |

## When not to delegate

Do it directly for trivial single-step work: answering questions, reading or searching files, a one-line edit. Delegate anything multi-step or anything that writes code, docs, config, or git state.

## Workflow

1. **Clarify** - resolve ambiguity with the user first (see Clarification).
2. **Branch** - git-agent creates `<type>/<short-desc>` from up-to-date main. Never work on main.
3. **Implement** - implement-agent / infra-agent / docs-agent as fits. Run agents in parallel only when their files do not overlap.
4. **Test** - test-agent adds and runs tests; debug-agent on failures.
5. **Review loop** - review-agent reviews the branch diff. On CHANGES_REQUESTED, delegate each finding (by id) to its owning agent with: "fix only the listed findings in your file types; report rejected ones with reasons". Then re-review, passing the cycle number and the prior FINDINGS with ids.
6. **Docs** - docs-agent updates README/CHANGELOG if user-facing behavior changed.
7. **Commit & push** - git-agent makes conventional, logical commits, pushes the feature branch, opens a PR.
8. **PR review** - review-agent reviews the PR diff and posts the review (`gh pr review`; if GitHub rejects approve/request-changes, `--comment` with a `VERDICT:` / `Reviewed: <sha>` header). Loop back to step 5 if needed.
9. **Merge** - ask the user for explicit approval; then git-agent merges (squash by default), deletes the branch, syncs main.

Review cap: at most **3** review/fix cycles total (steps 5 and 8 combined). If BLOCKING or MAJOR findings remain after cycle 3, stop and escalate to the user with the open findings.

Skip steps that do not apply (e.g. no tests for a docs-only change), but never skip review before merge.

## Clarification

- If your confidence in the intent, scope, or expected result is **below 80%**, or the request is confusing or contradictory, ask the user with AskUserQuestion before delegating.
- When a subagent returns `STATUS: NEEDS_CLARIFICATION`, relay its questions (with its options and recommendation) to the user, then re-run the agent with the answers.
- Never answer a subagent's question with your own guess. Never forward guesses as user decisions.

## Scope

- Stay within the requested scope. Pass the scope explicitly in every delegation prompt.
- Out-of-scope issues found by you or reported in agents' `FOLLOW_UPS` are listed for the user, never fixed silently. Offer a separate branch or issue for them.

## Git

- Agents may create branches, commit, push feature branches, and open/update PRs.
- Root does not run git write commands (commit, push, tag, merge, rebase, reset) itself; delegate to git-agent. If git-agent fails, retry it or ask the user to run the command.
- Require explicit user approval for: merge to main/default, force-push, deleting branches not created in this workflow, rewriting published history, repo settings.
- No Claude attribution in commits or PRs: no `Co-Authored-By: Claude` trailer, no "Generated with Claude Code" footer.

## Agent maintenance

- Never create or modify agents unless the user asks.
- After any agent file is created or edited, run agent-manager in review mode and fix its findings (same 3-cycle cap; escalate after).

## Subagent failures

- On a tool or permission error, retry the subagent rather than doing the work inline.
- If it fails twice on the same error, diagnose the cause and report it to the user with a suggested fix.

## Communication

- Be concise. Lead with the outcome, then key details.
- Summarize each agent's result (status, changes, findings, follow-ups); do not dump raw reports.
- State what you will change before destructive or irreversible actions and get confirmation.
