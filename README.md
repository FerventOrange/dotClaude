# dotClaude

A lean set of 8 Claude Code subagents and an orchestration contract that drive a full branch-to-merge workflow: clarify, implement, test, review, document, commit, open a PR, and merge only after you approve.

The root Claude Code session acts as the orchestrator. Its rules live in `CLAUDE.md`, which the installer places for you. Each agent owns one clear part of the work and returns a structured report the orchestrator can act on.

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated (`claude --version`)
- Git (`git --version`)
- GitHub CLI, authenticated, for PR and review steps (`gh auth status`)
- Node.js 18+ (`node --version`); the guard hook, statusline, and settings merge run on it, and the installer exits if it is missing

## Installation

Linux / macOS:

```bash
git clone https://github.com/FerventOrange/dotClaude.git
cd dotClaude
./install/install.sh                                         # prompts for scope (default: user)
./install/install.sh --level user                            # user scope: ~/.claude
./install/install.sh --level project --project-path ~/code/app  # project scope: <project>/.claude
```

Windows (PowerShell):

```powershell
git clone https://github.com/FerventOrange/dotClaude.git
cd dotClaude
.\install\install.ps1                                              # prompts for scope (default: user)
.\install\install.ps1 -InstallLevel user                          # user scope
.\install\install.ps1 -InstallLevel project -ProjectPath C:\code\app  # project scope
```

What the installer does:

1. **Prerequisites** - requires Node.js 18+, checks for Claude Code and the GitHub CLI, and installs `gh` if it is missing.
2. **Scope** - installs to user scope (`~/.claude/`, or `$CLAUDE_CONFIG_DIR` when set; every project), project scope (`<project>/.claude/`, one repository), or both. Project scope requires the target to be a git repository and adds `.claude/` to its `.gitignore`.
3. **Installs the orchestrator rules** - writes `CLAUDE.md` (from `install/custom-instructions.md`) with the workflow contract below. An existing `CLAUDE.md` is replaced only after a y/N prompt, and a timestamped backup is kept.
4. **Legacy cleanup** - detects agents from dotClaude v2 and earlier (per-agent directories such as `agents/git-commit-agent/`) and, after a y/N prompt, removes them so they do not shadow the new roster. In user scope it also offers to remove the orphaned `hooks/block-git-commands.js` from earlier versions when `settings.json` no longer references it.
5. **Copies agents** - writes the 8 files from `agents/*.md` into `<scope>/agents/`.
6. **Hooks, statusline, skills, settings** - copies the guard hook, report-check hook, and statusline to `<scope>/dotclaude/`, the skills to `<scope>/skills/`, and merges `settings/settings.json` into `<scope>/settings.json` (backed up first as `settings.json.backup.<timestamp>`). What was added is recorded in `<scope>/dotclaude/manifest.json`. In project scope it also offers to write `<project>/CLAUDE.md` from the project template, only if none exists.

Agents that exactly match a released dotClaude version (content hash in `install/lib/known-releases.json`) are adopted: replaced without a backup, and stale backups of such copies are removed. Skills are never adopted; any user skill with the same name as a dotClaude skill is backed up. Other user agents with the same name as a dotClaude agent are backed up under `<scope>/dotclaude/backups/` before being replaced. An existing `CLAUDE.md` is replaced only after a y/N prompt, with a timestamped backup. Legacy agent directories and the orphaned `hooks/block-git-commands.js` (user scope only) are removed only after a y/N prompt. `--force` (bash) or `-Force` (PowerShell) answers yes to every prompt and also replaces a custom `statusLine`.

### Dry run and uninstall

`--dry-run` prints every action, writes nothing, and ends with "Dry run complete (nothing written)"; `--uninstall` reverses the install (PowerShell: `-DryRun`, `-Uninstall`), e.g. `./install/install.sh --uninstall --level user`. Using the manifest, uninstall reverts exactly what was added: the hook entry, matching permission entries, `<scope>/dotclaude/`, the skills, and the 8 agents. A `statusLine` the install replaced is restored, and `settings.json` is removed if the install created it. Other `settings.json` keys are kept. `CLAUDE.md` is removed only if it is still the dotClaude file, after a y/N prompt.

## Agents

| Agent | Owns | Model |
|-------|------|-------|
| `git-agent` | Branches, commits, pushes, PRs, issues, tags, fork sync, merges (with approval) | sonnet |
| `review-agent` | Code, security, PR, accessibility, and dependency review; dead-code findings | opus |
| `implement-agent` | Application code: features, endpoints, components, auth, data/SQL, schemas | inherit |
| `test-agent` | Unit and integration tests; running the suite | sonnet |
| `debug-agent` | Root-cause analysis of errors and failing tests | inherit |
| `docs-agent` | README, CHANGELOG, API docs, contributor docs, doc review | sonnet |
| `infra-agent` | Docker, CI/CD, deployment, Terraform, env config, linting, test-runner/dev-tooling setup, installer scripts | sonnet |
| `agent-manager` | Create, update, review, and sync-install the agents themselves | opus |

Every agent ends its run with the same contract:

```
STATUS: DONE | NEEDS_CLARIFICATION | BLOCKED
SUMMARY: <1-3 lines>
CHANGES: <files touched, or "none">
FOLLOW_UPS: <out-of-scope issues noticed, or "none">
```

`review-agent` also emits `FINDINGS` (`F<n> [BLOCKING|MAJOR|MINOR|NIT] file:line - problem - fix`) and a `VERDICT: APPROVE | CHANGES_REQUESTED`.

## Workflow

```
Clarify -> Branch -> Implement -> Test -> Review loop -> Docs -> Commit & push + PR -> PR review -> Merge
                                           ^      |                                      |
                                           +-fix--+<-------------------------------------+
```

1. **Clarify** - the orchestrator resolves ambiguity with you first. Any agent whose confidence is below 80%, or whose request is ambiguous or contradictory, stops and returns `NEEDS_CLARIFICATION` with specific questions instead of guessing.
2. **Branch** - `git-agent` creates `<type>/<short-desc>` from an up-to-date main. Work never happens on main.
3. **Implement** - `implement-agent`, `infra-agent`, or `docs-agent`, in parallel when files do not overlap.
4. **Test** - `test-agent` adds and runs tests; `debug-agent` handles failures.
5. **Review loop** - `review-agent` reviews the diff. On `CHANGES_REQUESTED` each finding (`F1`, `F2`, ...) goes to its owning agent, which fixes only those; review then re-runs with the cycle number and prior findings. **Maximum 3 cycles** (local and PR review combined); if BLOCKING or MAJOR findings remain, they are escalated to you.
6. **Docs** - `docs-agent` updates README/CHANGELOG when user-facing behavior changed.
7. **Commit & push** - `git-agent` makes conventional commits, pushes the feature branch, and opens a PR.
8. **PR review** - `review-agent` reviews the PR; further fixes count toward the 3-cycle cap.
9. **Merge** - **only with your explicit approval**. `git-agent` then merges, deletes the branch, and syncs main.

Agents stay in scope: anything they notice outside their task is reported under `FOLLOW_UPS`, never fixed silently. Force-pushes, history rewrites, and repository setting changes also require your approval.

The step-by-step version of this workflow lives in the `/ship` skill; the installed `CLAUDE.md` keeps a short summary and points to it.

## Skills

Installed to `<scope>/skills/<name>/SKILL.md`.

| Skill | Use |
|-------|-----|
| `/ship` | Full workflow from request to merged PR, with delegation templates |
| `/fix-pr <n>` | Collect review comments on a PR, route them to owning agents, fix, push, re-review |
| `/sync-dotclaude` | User-only. Update the local dotClaude install via `agent-manager` and report what changed |
| `/release [version]` | User-only. Pick the next SemVer, move CHANGELOG Unreleased to the version, release PR, approved merge, tag |

## Guard hook

`hooks/guard.js` is a PreToolUse hook on the `Bash` and `PowerShell` tools. It fails open: an internal error allows the command. The settings template sets `onFailure: block` on the hook (Claude Code 2.1.295 or later); on older versions the installer omits it and prints a warning.

- **Denied:** `git commit` on the default branch; `git push` to the default branch (including bare `git push` while on it); `--no-verify` on commit or push; Claude attribution in commit, tag, PR, issue, or release message text. Only trailer and footer forms are matched (`Co-Authored-By: ... Claude` or `noreply@anthropic.com`, "Generated with [Claude Code](...)"); the rest of the command line is not inspected.
- **Ask (user confirmation):** force push to a non-default branch; deleting remote branches or tags; `git reset --hard`; `git clean -f`; `git branch -D`; `git worktree remove --force`; `git checkout .` / `git restore .`; `git merge` or `git rebase` while on the default branch; `gh pr merge`; `gh release create|delete`; `gh repo edit|delete`; `gh api` with DELETE/PUT/PATCH on repository settings, branches, or protection.

The guard also analyzes commands wrapped in `bash -c`, `cmd /c`, `iex` / `Invoke-Expression`, and `Push-Location`, and honors `git --git-dir`.

Escape hatch: set `DOTCLAUDE_GUARD=off` in the environment to disable it.

## Report check

`hooks/report-check.js` is a SubagentStop hook for the dotClaude agents. It blocks an agent from stopping until its final message contains the report contract fields: `STATUS`, `SUMMARY`, `CHANGES`, and `FOLLOW_UPS`, plus `VERDICT` for `review-agent`. `STATUS` must be one of `DONE`, `NEEDS_CLARIFICATION`, or `BLOCKED`.

- **Block once, then allow:** the agent gets one request to append the missing fields. If they are still missing on the retry, the stop is allowed and a warning goes to stderr.
- **`NEEDS_CLARIFICATION`:** only `STATUS` and `QUESTIONS` are required.
- **Fails open:** other agents, an unreadable message, or an internal error allow the stop.

Escape hatch: set `DOTCLAUDE_REPORT_CHECK=off` in the environment to disable it.

## Permissions

`settings/settings.json` is merged into your `settings.json`. Arrays are de-duplicated and existing keys are never removed.

- **Allow:** read-only and routine commands (each as `Bash(...)` and `PowerShell(...)`) such as `git status|diff|log|show|branch|fetch|rev-parse`, `gh pr|issue|repo view/list/diff/checks`, `node --test`, `npm test`, `npm run lint`, `pytest`, `ls`.
- **Deny:** `rm -rf /`, `rm -rf ~`, force pushes to `main` (Bash and PowerShell), and `Read` of `**/.env`, `.env.local`, `.env.*.local`, `.env.production`, `*.pem`, `id_rsa*`, `id_ed25519*`, `~/.ssh/**`, and `~/.aws/**`. `.env.example` stays readable. These are `Read` denies and do not stop `cat` through Bash.
- **Worktrees:** `worktree.baseRef` is set to `head`, so agent worktrees start from the current commit.

## Worktrees

By default parallel agents share the feature branch and own non-overlapping files. `/ship` uses `isolation: "worktree"` only when parallel agents must touch overlapping files or to try alternative approaches. Isolated agents commit nothing; `git-agent` commits inside each worktree, merges them back with `--no-ff` one at a time, then removes and prunes them. For independent features, start separate sessions with `claude -w <name>`.

## Statusline, project template, CI

- **Statusline** - `statusline/statusline.js` renders `model | [agent] dir (branch*) | ctx:N% | $cost`; `*` marks uncommitted changes. It is set only if `statusLine` is absent, is the old `jq` command, or you pass `--force`.
- **Project template** - `templates/project-CLAUDE.md` is a starting point for a project's own `CLAUDE.md` (commands, conventions, boundaries). Agents read it if present and prefer its commands over detection.
- **CI** - `.github/workflows/ci.yml` runs on pushes and PRs to `main`: unit tests, `scripts/validate.js`, shell checks, and a sandboxed install and uninstall on Ubuntu and Windows (Node 22, actions pinned to commit SHAs).

## Repository Structure

```
dotClaude/
├── agents/            # One flat file per agent: <name>.md with Claude Code frontmatter
├── skills/            # ship, fix-pr, sync-dotclaude, release (each <name>/SKILL.md)
├── hooks/             # guard.js, report-check.js hooks and their tests
├── statusline/        # statusline.js and its tests
├── settings/          # settings.json template (hook, statusline, permissions)
├── templates/         # project-CLAUDE.md
├── scripts/           # validate.js: checks agents, skills, roster table
├── .github/workflows/ # ci.yml
├── install/
│   ├── custom-instructions.md  # Orchestrator rules, installed as CLAUDE.md
│   ├── install.sh              # Linux/macOS installer
│   ├── install.ps1             # Windows installer
│   ├── lib/settings-merge.js   # Settings merge/unmerge and file copy helper
│   ├── lib/known-releases.json # Released agent hashes used for adoption
│   ├── list-agents.sh          # List agents and their descriptions (Linux/macOS)
│   └── list-agents.ps1         # List agents and their descriptions (Windows)
├── .gitattributes     # Line endings: LF for .sh, CRLF for .ps1
├── CONTRIBUTING.md    # Agent and skill formats, conventions, PR process
├── CHANGELOG.md
├── LICENSE
└── README.md
```

## Updating

Pull the latest version and re-run the installer, or run `/sync-dotclaude`:

```bash
cd dotClaude && git pull
./install/install.sh            # or .\install\install.ps1 on Windows
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the agent and skill formats and PR process.

## License

MIT — see [LICENSE](LICENSE)
