---
name: release
description: Cut a SemVer release — pick the next version from CHANGELOG Unreleased and commit types, move Unreleased to the version, release branch + PR + review, approved merge, annotated tag, optional GitHub release. Use when the user types /release [version] or asks to release, tag, or publish a version.
argument-hint: [version]
disable-model-invocation: true
---

# /release

Root-orchestrator procedure for a release. Optional argument: `$ARGUMENTS` = target version (`X.Y.Z` or `vX.Y.Z`, pre-release `-rc.N` allowed).

## 0. Before starting
- Use the project CLAUDE.md (Commands, Conventions, Boundaries) already in your context.
- Below **80%** confidence about version, scope, or whether to publish: ask the user.

## Steps
1. **Gather** (read-only; root may run): `git fetch --tags`, `git describe --tags --abbrev=0` (last tag), `git log --oneline <last>..origin/<default>`, and the CHANGELOG `## [Unreleased]` section. No tags → use the full history and propose `0.1.0` (or ask the user). Stop if Unreleased is empty and there are no commits since the last tag.
2. **Version** — bump from commits and Unreleased: `BREAKING CHANGE` or Removed/breaking entries → major; `feat` / Added → minor; otherwise patch. If `$ARGUMENTS` is given, use it but warn when it disagrees with the computed bump. Show last tag, proposed version, and the change list; get user confirmation.
3. **Branch** — git-agent creates `release/vX.Y.Z` from up-to-date default.
4. **Changelog** — docs-agent (changelog mode) moves Unreleased entries under `## [X.Y.Z] - YYYY-MM-DD` (today), leaves an empty Unreleased, updates compare links, and writes the new version's section to a temp file outside the repo, returning its path (release notes for step 9). Bump version fields in manifests only if the project keeps them (implement-agent or infra-agent per file).
5. **Commit & PR** — git-agent commits `chore/release : vX.Y.Z`, pushes, opens a PR titled the same.
6. **Review** — review-agent reviews the PR (task: release vX.Y.Z; check changelog accuracy vs commits, version consistency) and posts. Fix loop per `/ship` step 5, **3**-cycle cap.
7. **Merge** — show PR URL, verdict, checks; ask the user for explicit approval. Then git-agent merges (squash default) and syncs default, in the foreground. The guard hook will also prompt.
8. **Tag** — git-agent creates annotated `vX.Y.Z` on the merged default-branch commit and pushes that single tag (never `--tags`). Tag creation and push need no extra approval.
9. **GitHub release (optional)** — ask the user. On explicit approval, git-agent runs `gh release create vX.Y.Z --title vX.Y.Z --notes-file <path from step 4>` (`--prerelease` for `-rc/-beta/-alpha`) in the foreground. The guard hook asks again.

## Delegation prompt (every call)
```
TASK: release vX.Y.Z — <step>
SCOPE: <step scope> | OUT OF SCOPE: unrelated changes
FILES OWNED: <e.g. CHANGELOG.md>
PROJECT: <Commands/Conventions/Boundaries, or "none">
CYCLE: <n>/3 (review/fix only)
PRIOR FINDINGS: <ids, or "none">
AUTHORIZATIONS: <quoted user approval: "merge PR #<n>" / "gh release create vX.Y.Z", or "none">
```
Each gated action needs its own approval; approval to merge is not approval to publish a GitHub release.

## Rules
- Never tag an unmerged commit, move or delete a pushed tag, or force-push without explicit approval.
- A guard-hook denial is final: report it, never rephrase the command to evade it.
- Guard `ask` steps (merge, release create, tag/branch deletion, force): run git-agent in the **foreground** — background subagents cannot surface guard `ask` prompts.
- No Claude attribution in commits, PR, tag message, or release notes.

## Report to user
Version, PR URL, merge sha, tag, release URL (or "not published"), follow-ups.
