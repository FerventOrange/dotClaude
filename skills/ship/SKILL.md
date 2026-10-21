---
name: ship
description: Full dotClaude delivery workflow (clarify, branch, implement, test, review loop, docs, commit/PR, PR review, approved merge) driven by the root orchestrator through subagents. Use when the user types /ship or asks to ship, build, or deliver a feature/fix end to end.
argument-hint: [task]
---

# /ship

Root-orchestrator procedure for taking a request from idea to merged PR. Root plans and delegates; it does not write code, docs, or git state itself.

Task: $ARGUMENTS (if empty, use the user's current request).

## 0. Before starting
- Use the project CLAUDE.md (Commands, Conventions, Boundaries) already in your context; pass relevant parts into every delegation.
- Rate confidence in intent, scope, and expected result. Below **80%**, or anything ambiguous/contradictory: ask the user (AskUserQuestion) before delegating.

## Steps
1. **Clarify** — resolve open questions with the user. Record the agreed task, scope, and acceptance criteria.
2. **Branch** — git-agent creates `<type>/<short-desc>` from up-to-date default branch. Never work on main. If the current branch does not fit the task, start a new one.
3. **Implement** — implement-agent (app code), infra-agent (CI/config/tooling/installers), docs-agent (docs-only work), agent-manager (`agents/`, `skills/`, `templates/project-CLAUDE.md`, `install/custom-instructions.md`; only on explicit user request). Parallelize per Parallelism below.
4. **Test** — test-agent adds and runs tests; on unexplained failures, debug-agent diagnoses, then the owner fixes.
5. **Review loop** — review-agent reviews the branch diff (cycle 1). On CHANGES_REQUESTED, send each BLOCKING/MAJOR finding (by id) to its owning agent: "fix only the listed findings in your file types; report rejected ones with reasons". Re-review with the cycle number and prior FINDINGS.
6. **Docs** — docs-agent updates README/CHANGELOG (Unreleased) if user-facing behavior changed.
7. **Commit & push** — git-agent makes conventional, logical commits, pushes the feature branch, opens a PR. Return the PR URL.
8. **PR review** — review-agent reviews the PR and posts it (`gh pr review`; `--comment` with `VERDICT:` / `Reviewed: <sha>` header when the author cannot approve). On CHANGES_REQUESTED, back to step 5 (same cycle counter).
9. **Merge** — show the user PR URL, verdict, and checks; ask for explicit approval. Only then git-agent merges (squash default), deletes the branch, syncs main — in the foreground. The guard hook will also prompt; that prompt is not a substitute for asking.

Skip steps that do not apply (no tests for docs-only), but never skip review before merge.

## Delegation prompt (every call)
```
TASK: <one-line goal + acceptance criteria>
SCOPE: <in scope> | OUT OF SCOPE: <explicit exclusions>
FILES OWNED: <paths/globs this agent may touch>
PROJECT: <Commands/Conventions/Boundaries from project CLAUDE.md, or "none">
CYCLE: <n>/3 (review/fix only)
PRIOR FINDINGS: <F<n> [SEV] file:line — problem — fix ...> (review/fix only)
AUTHORIZATIONS: <explicit user approvals for gated actions, quoted; or "none">
```
Never write an authorization the user did not give. Never forward your own guess as a user decision.

## Parallelism
- Default: one shared feature branch; parallel agents get non-overlapping FILES OWNED.
- Use Agent `isolation: "worktree"` only when parallel agents must touch overlapping files, or to try alternative approaches. Each runs in `.claude/worktrees/<name>/` on branch `worktree-<name>` from current HEAD (`worktree.baseRef: "head"`, set by the installer); unchanged worktrees are auto-removed, changed ones kept.
- Before spawning isolated agents, git-agent commits pending feature-branch work (stash only what must stay out of the worktrees) and ensures `.claude/worktrees/` is ignored; if not, appends it to `.git/info/exclude` (local, not committed).
- Isolated agents commit nothing and report `WORKTREE: <path> <branch>`. Then git-agent, one worktree at a time: commits inside it (`git -C <path>`), merges `worktree-<name>` into the feature branch with `git merge --no-ff` (conflict → owning agent resolves, git-agent completes the merge), then `git worktree remove <path>`, `git branch -d worktree-<name>`, `git worktree prune`.
- Independent features → separate sessions (`claude -w <name>`), not one /ship run.

## Review cap
At most **3** review/fix cycles total (steps 5 and 8 combined). If BLOCKING or MAJOR findings remain after cycle 3, stop and escalate to the user with the open findings and options.

## Handling agent results
- `NEEDS_CLARIFICATION` — relay questions (with options and recommendation) to the user; re-run with answers.
- `BLOCKED` — report the reason. A guard-hook denial is final: never rephrase or reroute the command to evade it.
- `FOLLOW_UPS` — list for the user; offer a separate branch or issue. Never fix silently.
- Tool/permission error — retry the agent once; on a repeat, diagnose and report.
- Steps that can trigger a guard `ask` (merge, release create, branch/tag deletion, force-push, `worktree remove --force`): run git-agent in the **foreground** — background subagents cannot surface guard `ask` prompts.

## Report to user
Per step: agent, status, changes, findings, follow-ups (summarized). End with PR URL, merge state, and open follow-ups.
