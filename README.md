# dotClaude

A lean set of 8 Claude Code subagents and an orchestration contract that drive a full branch-to-merge workflow: clarify, implement, test, review, document, commit, open a PR, and merge only after you approve.

The root Claude Code session acts as the orchestrator. Its rules live in `CLAUDE.md`, which the installer places for you. Each agent owns one clear part of the work and returns a structured report the orchestrator can act on.

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed and authenticated (`claude --version`)
- Git (`git --version`)
- GitHub CLI, authenticated, for PR and review steps (`gh auth status`)
- Node.js 18+ if the installer needs to install Claude Code via npm

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

1. **Prerequisites** - checks for Claude Code and the GitHub CLI, and installs `gh` if it is missing.
2. **Scope** - installs to user scope (`~/.claude/`, or `$CLAUDE_CONFIG_DIR` when set; every project), project scope (`<project>/.claude/`, one repository), or both. Project scope requires the target to be a git repository and adds `.claude/` to its `.gitignore`.
3. **Installs the orchestrator rules** - writes `CLAUDE.md` (from `install/custom-instructions.md`) with the workflow contract below. An existing `CLAUDE.md` is replaced only after a y/N prompt, and a timestamped backup is kept.
4. **Legacy cleanup** - detects agents from dotClaude v2 and earlier (per-agent directories such as `agents/git-commit-agent/`) and, after a y/N prompt, removes them so they do not shadow the new roster. In user scope it also offers to remove the orphaned `hooks/block-git-commands.js` from earlier versions when `settings.json` no longer references it.
5. **Copies agents** - writes the 8 files from `agents/*.md` into `<scope>/agents/`.

Agent files with the same names in `<scope>/agents/` are always overwritten. An existing `CLAUDE.md` is replaced only after a y/N prompt, with a timestamped backup. Legacy agent directories and the orphaned `hooks/block-git-commands.js` (user scope only) are removed only after a y/N prompt. `--force` (bash) or `-Force` (PowerShell) answers yes to every prompt.

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

## Repository Structure

```
dotClaude/
├── agents/            # One flat file per agent: <name>.md with Claude Code frontmatter
├── install/
│   ├── custom-instructions.md  # Orchestrator rules, installed as CLAUDE.md
│   ├── install.sh              # Linux/macOS installer
│   ├── install.ps1             # Windows installer
│   ├── list-agents.sh          # List agents and their descriptions (Linux/macOS)
│   └── list-agents.ps1         # List agents and their descriptions (Windows)
├── CONTRIBUTING.md    # Agent file format, conventions, PR process
├── CHANGELOG.md
├── LICENSE
└── README.md
```

## Updating

Pull the latest version and re-run the installer:

```bash
cd dotClaude && git pull
./install/install.sh            # or .\install\install.ps1 on Windows
```

Or ask Claude Code to have `agent-manager` sync-install the repository agents into your Claude config.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the agent file format and PR process.

## License

MIT — see [LICENSE](LICENSE)
