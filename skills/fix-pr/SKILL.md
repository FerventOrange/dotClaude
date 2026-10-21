---
name: fix-pr
description: Address review feedback on an open pull request — collect review findings and comments, route each to its owning agent, fix, push, and re-review. Use when the user types /fix-pr <number> or asks to fix, address, or resolve review comments on a PR.
argument-hint: <pr-number>
---

# /fix-pr

Root-orchestrator procedure for resolving review feedback on PR `$ARGUMENTS`.

## 0. Inputs
- PR number = `$ARGUMENTS` with any leading `#` stripped. If empty or not a number, ask the user (offer `gh pr list` results for the current branch).
- Use the project CLAUDE.md (Commands, Conventions, Boundaries) already in your context.
- Below **80%** confidence in which feedback to address or how: ask the user before delegating.

## Steps
1. **Collect** (read-only; root may run these directly):
   - `gh pr view <n> --json number,title,body,headRefName,baseRefName,headRefOid,state,reviewDecision,reviews,comments`
   - `gh api repos/{owner}/{repo}/pulls/<n>/comments` (inline review comments, with `path`/`line`)
   - `gh pr checks <n>`
   Stop and report if the PR is closed/merged or its head branch is on a fork you cannot push to.
2. **Normalize** — build one findings list. Keep existing `F<n>` ids from a dotClaude review body; assign new ids (continuing numbering) to human comments. Each: `F<n> [SEV] file:line — problem — fix`. Human comments without severity: treat requested changes as MAJOR, questions/suggestions as MINOR. Failing checks become findings.
3. **Confirm** — show the list to the user. Ask which MINOR/NIT and human comments to address and about anything ambiguous or out of scope. Do not guess.
4. **Cycle count** — cycle = max(cycle stated earlier in this session, count of dotClaude reviews on the PR with a `VERDICT:` body); if unsure, ask the user. These fixes count toward the **3**-cycle cap. If the cap is already reached, escalate instead of fixing.
5. **Branch** — git-agent switches to the PR head branch and syncs it (`pull --ff-only`). Never work on main.
6. **Fix** — route each finding to its owner by file type: app code → implement-agent; tests → test-agent; CI/config/installers → infra-agent; docs → docs-agent; `agents/`, `skills/`, `templates/project-CLAUDE.md`, `install/custom-instructions.md` → agent-manager (only if the user asked to modify them); unexplained failure → debug-agent first. Parallelize only across non-overlapping files.
7. **Verify** — test-agent runs the affected tests (or the project's test command).
8. **Commit & push** — git-agent commits (conventional, one logical change each) and pushes the PR branch. No force-push unless the user explicitly approved it; a force-push runs git-agent in the foreground.
9. **Re-review** — review-agent re-reviews PR `<n>` with the cycle number and prior FINDINGS, and posts the review. On CHANGES_REQUESTED, loop to step 6 while under the cap.
10. **Reply** (optional, on user request) — git-agent posts a PR comment mapping finding ids to commits.

## Delegation prompt (every call)
```
TASK: fix findings on PR #<n> (<title>)
SCOPE: only the listed findings | OUT OF SCOPE: everything else
FILES OWNED: <paths for this agent>
PROJECT: <Commands/Conventions/Boundaries, or "none">
CYCLE: <n>/3
PRIOR FINDINGS: <F<n> [SEV] file:line — problem — fix ...>
AUTHORIZATIONS: <quoted user approvals, or "none">
```
Fixers must return `FINDINGS_ADDRESSED` (id → fixed | rejected with reason). Relay rejected findings to the user.

## Rules
- Merge is not part of /fix-pr. Offer `/ship` step 9 (explicit user approval) once the verdict is APPROVE.
- A guard-hook denial is final: report it, never rephrase the command to evade it.
- Guard `ask` steps (force-push, branch deletion): run git-agent in the **foreground** — background subagents cannot surface guard `ask` prompts.
- Out-of-scope issues → FOLLOW_UPS for the user, never fixed silently.

## Report to user
Findings table (id, owner, fixed/rejected), commits pushed, new verdict and review URL, cycle used, follow-ups.
