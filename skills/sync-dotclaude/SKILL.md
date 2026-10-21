---
name: sync-dotclaude
description: Update the local dotClaude install — pull the dotClaude repo and re-run its installer (agents, skills, hooks, statusline, settings merge) via agent-manager sync-install, then report what changed. Use when the user types /sync-dotclaude or asks to update, sync, or reinstall dotClaude.
argument-hint: [user|project|both] [dry-run] [force]
disable-model-invocation: true
---

# /sync-dotclaude

Root-orchestrator procedure for syncing the installed dotClaude config with its repo. Arguments (optional): `$ARGUMENTS` — install level (`user` | `project` | `both`), `dry-run`, or `force`.

## 0. Before starting
- Below **80%** confidence about level or intent: ask the user.
- `force` in the arguments is not approval by itself if the user's intent is unclear; confirm what it replaces (CLAUDE.md with backup, legacy agent dirs, existing statusLine) before passing it on.

## Steps
1. **Record baseline** — note the repo's current `HEAD` short sha (agent-manager reports it; root may run `git -C <repo> rev-parse --short HEAD` read-only).
2. **Optional preview** — if the user asked for `dry-run`, or changes look large, delegate agent-manager with `DRY_RUN: yes`; it returns `DRY_RUN_PLAN` with `STATUS: DONE` and stops. Show the plan; run step 3 with `DRY_RUN: no` only after the user approves it.
3. **Sync** — delegate to agent-manager:
   ```
   TASK: sync-install the dotClaude repo
   SCOPE: pull --ff-only + re-run installer | OUT OF SCOPE: editing any repo or installed file by hand
   LEVEL: <user|project|both> (default user); PROJECT PATH: <path, if project>
   DRY_RUN: <yes|no>
   AUTHORIZATIONS: <"user approved --force: replace CLAUDE.md (backup), remove legacy agents, replace statusLine" | "none">
   ```
4. **Handle result**
   - `BLOCKED` on local changes, non-default branch, or non-fast-forward — show the reason; ask the user how to proceed (commit via git-agent, stash, or abort). Never discard changes without approval.
   - Installer kept items (CLAUDE.md, legacy dirs, statusLine) — show them and the exact `--force` command; re-run with force only on explicit approval.
   - Missing `node` — tell the user Node.js >= 18 is required for hooks/statusline.
5. **Report changes** — from agent-manager's `PULLED`, `AGENTS_CHANGED`, `SKILLS_CHANGED`, and `KEPT`, plus `git -C <repo> log --oneline <old>..<new>` and `git -C <repo> diff --stat <old>..<new>`. Group by agents, skills, hooks/statusline, settings, CLAUDE.md.
6. **Restart note** — tell the user to restart Claude Code (or start a new session) so updated agents, skills, hooks, and CLAUDE.md load.

## Rules
- Root does not pull, install, or copy files itself; agent-manager does.
- Never edit installed copies under `~/.claude/` to "fix" a sync; fixes go to the repo via `/ship`.
- A guard-hook denial is final: report it, never work around it.
- Run agent-manager and any git-agent step in the **foreground** — background subagents cannot surface guard `ask` prompts.

## Report to user
Old → new sha, commit list, changed components, items kept and why, required follow-up (force approval, restart).
