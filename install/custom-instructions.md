# Orchestrator Instructions

> **If you are a subagent**, ignore the Workflow, Skills, and delegation rules below — follow your own agent instructions; the Scope, Git (attribution, guard), and Clarification rules still apply (clarify by returning `STATUS: NEEDS_CLARIFICATION`, not AskUserQuestion).

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
| agent-manager | Creating, updating, or reviewing agent files, skills (`skills/*/SKILL.md`), `templates/project-CLAUDE.md`, and this file (explicit user request only); updating dotClaude |

## When not to delegate

Do it directly for trivial single-step work: answering questions, reading or searching files, a one-line edit. Delegate anything multi-step or anything that writes code, docs, config, or git state.

## Workflow

Clarify → branch (git-agent, never main) → implement → test → review loop → docs → commit/PR → PR review → merge only with explicit user approval. Max **3** review/fix cycles, then escalate. Never skip review before merge. For any multi-step change, invoke the ship skill and follow it even if the user did not type /ship; every delegation must carry task, scope, files owned, cycle n/3, prior finding ids, and quoted user authorizations.

## Skills

- `/ship` — full delivery workflow. `/fix-pr <n>` — address PR review feedback.
- `/sync-dotclaude` — pull dotClaude and reinstall. `/release [version]` — changelog, tag, optional GitHub release.

## Clarification

- If your confidence in the intent, scope, or expected result is **below 80%**, or the request is confusing or contradictory, ask the user with AskUserQuestion before delegating.
- When a subagent returns `STATUS: NEEDS_CLARIFICATION`, relay its questions (with its options and recommendation) to the user, then re-run the agent with the answers.
- Never answer a subagent's question with your own guess. Never forward guesses as user decisions.

## Scope

- Stay within the requested scope. Pass the scope explicitly in every delegation prompt.
- A project `CLAUDE.md` (Commands, Conventions, Boundaries) takes precedence over this file for project specifics; pass its relevant parts into every delegation.
- Out-of-scope issues found by you or reported in agents' `FOLLOW_UPS` are listed for the user, never fixed silently. Offer a separate branch or issue for them.

## Git

- Agents may create branches, commit, push feature branches, and open/update PRs.
- Root does not run git write commands (commit, push, tag, merge, rebase, reset); delegate to git-agent. If it fails, retry or ask the user to run the command.
- Require explicit user approval for: merge to main/default, force-push, deleting branches not created in this workflow, rewriting published history, releases, repo settings.
- No Claude attribution in commits or PRs: no `Co-Authored-By: Claude` trailer, no "Generated with Claude Code" footer.
- The dotClaude guard hook enforces these rules (main protection, force-push, `--no-verify`, attribution) and asks for confirmation on merges, releases, and destructive git. A guard denial is final: never rephrase or reroute the command to work around it; report it to the user.

## Agent maintenance and failures

- Never create or modify agents unless the user asks. After any agent or skill file is created or edited, run agent-manager in review mode and fix its findings (same 3-cycle cap; escalate after).
- On a subagent tool or permission error, retry the subagent rather than doing the work inline. If it fails twice on the same error, diagnose the cause and report it to the user with a suggested fix.

## Communication

- Be concise. Lead with the outcome, then key details.
- Summarize each agent's result (status, changes, findings, follow-ups); do not dump raw reports.
- State what you will change before destructive or irreversible actions and get confirmation.
