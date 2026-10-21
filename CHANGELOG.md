# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.2.0] - 2026-10-21

### Added
- Report-check hook (`hooks/report-check.js`, SubagentStop): blocks a dotClaude agent from stopping until its final message has `STATUS`, `SUMMARY`, `CHANGES`, and `FOLLOW_UPS` (plus `VERDICT` for `review-agent`); `NEEDS_CLARIFICATION` requires only `STATUS` and `QUESTIONS`. Blocks once, then allows; fails open; `DOTCLAUDE_REPORT_CHECK=off` disables it

### Changed
- Guard simplified: it no longer analyzes commands wrapped in `bash -c`, `cmd /c`, `iex` / `Invoke-Expression`, or `Push-Location`, and no longer honors `git --git-dir`. It is a mistake-catcher for Claude's own commands, not a security boundary
- Test suite trimmed to tests covering valuable logic (307 to 177 tests)
- Agents encode useful-tests-only and YAGNI: `implement-agent` avoids speculative handling and `review-agent` flags missing tests for valuable new logic
- Installer adopts only agents that exactly match a released dotClaude version (content hash in `install/lib/known-releases.json`), replacing them without a backup and removing stale backups of such copies; skills are never adopted, and any same-name user skill is backed up

## [3.1.0] - 2026-10-20

### Added
- Guard hook (`hooks/guard.js`, PreToolUse on `Bash` and `PowerShell`): denies commits and pushes on the default branch, `--no-verify`, and Claude attribution in commit/PR/issue text; asks before force pushes to other branches, remote ref deletion, `git reset --hard`, `git clean -f`, `git checkout .`, merge/rebase on the default branch, `gh pr merge`, `gh release create|delete`, `gh repo edit|delete`, and risky `gh api` writes. Fails open; `DOTCLAUDE_GUARD=off` disables it
- Statusline (`statusline/statusline.js`) showing model, agent, directory, branch with a dirty marker, remaining context, and cost
- `settings/settings.json` template with the guard hook, statusline, and `permissions.allow` / `permissions.deny` lists, merged by `install/lib/settings-merge.js` (de-duplicated, user keys kept, `settings.json` backed up first)
- Skills: `/ship`, `/fix-pr`, `/sync-dotclaude`, `/release`
- `templates/project-CLAUDE.md` per-project template; project-scope installs offer to write it to `<project>/CLAUDE.md` when absent
- Installer flags `--dry-run` / `-DryRun` and `--uninstall` / `-Uninstall`
- `scripts/validate.js` for agent files, skills, and the roster table, plus `.github/workflows/ci.yml` (tests, validation, shell checks, sandboxed install on Ubuntu and Windows)
- Unit tests for the guard hook and statusline (`node --test`)
- Guard asks before `git branch -D` and `git worktree remove --force`, analyzes commands wrapped in `bash -c`, `cmd /c`, `iex` / `Invoke-Expression`, and `Push-Location`, and honors `--git-dir`
- Guard hook entry sets `onFailure: block` (Claude Code 2.1.295 or later); the installer omits it with a warning on older versions
- `PowerShell(...)` allow and deny entries mirroring the `Bash(...)` ones, and `Read` denies for secrets (`**/.env`, `.env.local`, `.env.*.local`, `.env.production`, `*.pem`, SSH keys, `~/.ssh/**`, `~/.aws/**`); `.env.example` stays readable
- `worktree.baseRef: head` in the settings template, and a `/ship` Parallelism policy: shared branch by default, `isolation: "worktree"` only for overlapping parallel work or alternative approaches, merged back with `--no-ff` one at a time and then removed
- Installer manifest at `<cfg>/dotclaude/manifest.json`; uninstall reverts exactly what was added, restores a replaced `statusLine`, and removes `settings.json` if the install created it
- `.gitattributes` for line endings
- Agent frontmatter keys `effort` and `maxTurns`, and skill keys `argument-hint`, `disable-model-invocation`, and `allowed-tools`; the validator rejects unknown keys
- Subagent note in the installed `CLAUDE.md`

### Changed
- Guard attribution check inspects only message text and trailer/footer forms, not the whole command line
- Installer backs up a user skill that collides with a dotClaude skill instead of overwriting it; dry run ends with "Dry run complete (nothing written)"
- `/release` and `/sync-dotclaude` are user-only (`disable-model-invocation`)
- `agent-manager` owns `skills/`, `templates/project-CLAUDE.md`, and `install/custom-instructions.md`
- CI uses Node 22 and pinned-SHA actions v7, and quotes the test globs: `node --test "hooks/*.test.js" "statusline/*.test.js"`
- Node.js 18+ is now a prerequisite; installers exit with a message if it is missing
- Installers also install the guard hook and statusline to `<scope>/dotclaude/`, skills to `<scope>/skills/`, and merge settings
- Agents read the project `CLAUDE.md` (Commands, Conventions, Boundaries) when present and prefer its commands over detection
- `install/custom-instructions.md` trimmed: the detailed workflow moved into the `/ship` skill, leaving a short summary and pointers
- `CONTRIBUTING.md` documents the skill format and the validator/test steps; README documents the new features

## [3.0.0] - 2026-10-20

**BREAKING:** The 42-agent roster is replaced by 8 agents with new names and a new file format. Old agent names (for example `git-commit-agent`, `documentation-agent`) no longer exist. Re-run the installer to migrate.

### Added
- `CONTRIBUTING.md` with the agent file format, required sections, and PR process
- Installers migrate legacy dotClaude v2 agents: per-directory agents are detected and removed after confirmation
- Installers remove the orphaned `~/.claude/hooks/block-git-commands.js` left by earlier versions, after confirmation and only when settings.json no longer references it.
- Installers honor the `CLAUDE_CONFIG_DIR` environment variable for user scope
- `LICENSE` file (MIT)

### Changed
- Consolidated 42 agents into 8:
  - **git-agent** - git-commit, git-pr, git-sync, git-tags, git-issues, gitops
  - **review-agent** - code-review, security-review, pr-review, accessibility, dependency, code-cleanup
  - **implement-agent** - python, component-generator, form-builder, route-generator, state-management, api-endpoint, auth, seed-data, api-client, validation-schema, sql-query, sql-schema, sql-migration
  - **test-agent** - unit-test, integration-test
  - **debug-agent** - debug
  - **docs-agent** - documentation, changelog, api-doc, doc-review
  - **infra-agent** - docker, cicd, deployment, terraform, env-config, code-linting
  - **agent-manager** - agent-creator, agent-updater, agent-review-agent, dotclaude-updater
- Agents are now flat files (`agents/<name>.md`) with real Claude Code subagent frontmatter (`name`, `description`, `tools`, `model`, `color`) instead of `agents/<category>/<name>/instructions.md`
- Agents may branch, commit, push feature branches, open PRs, and post reviews; merging to main always requires explicit user approval
- Recursive review loop: review, fix only the listed findings, re-review, up to 3 cycles before escalating to the user
- Clarification protocol: agents stop and return `NEEDS_CLARIFICATION` when confidence is below 80% or the request is ambiguous or contradictory
- All agents end with a standard `STATUS / SUMMARY / CHANGES / FOLLOW_UPS` report; out-of-scope issues are reported, not fixed
- Installers support `--force` / `-Force` to answer yes to every confirmation prompt
- `install/custom-instructions.md` rewritten as the orchestrator workflow contract (installed as `CLAUDE.md`)
- `list-agents` scripts read flat `agents/*.md` frontmatter
- README rewritten around the 8-agent roster and workflow

### Removed
- `install/agent-awareness.md`
- `docs/roadmap.md`, `docs/project-goals.md`, `docs/README.md`
- `docs/agent-guidelines.md` (replaced by `CONTRIBUTING.md`)
- Agent category directories (`agents/github/`, `agents/code/`, `agents/frontend/`, etc.)
- `install/.gitkeep`

## [2.0.0] - 2026-04-02

### Changed
- Upgraded **agent-creator**, **agent-updater**, and **agent-review-agent** to v2.0.0 with canonical agent template, batch operation support, cross-agent consistency enforcement, and overlap detection
- Upgraded documentation agents (**changelog-agent**, **doc-review-agent**, **api-doc-agent**) to v2.0.0 with canonical template
- Renamed **readme-agent** to **documentation-agent** with broadened scope (now generates all project docs: README, CONTRIBUTING, ARCHITECTURE, guides, CODE_OF_CONDUCT, LICENSE)
- Updated all cross-references from readme-agent to documentation-agent across 14+ files
- Added required context and examples sections to frontend agent instructions
- Added required context and examples sections to backend agent instructions
- Added required context and examples sections to infra agent instructions
- Expanded agent usage guidelines with delegation and review rules

### Added
- **Frontend agent cluster** with 4 new agents (PR #6):
  - **component-generator** - UI component scaffolding
  - **form-builder** - Form generation and validation
  - **route-generator** - Route/page scaffolding
  - **accessibility** - Accessibility audit and remediation
- **Backend agent cluster** with 3 new agents (PR #7):
  - **api-endpoint** - REST/GraphQL endpoint generation
  - **auth** - Authentication and authorization scaffolding
  - **seed-data** - Database seed data generation
- **Infrastructure agent cluster** with 3 new agents (PR #8):
  - **env-config** - Environment configuration management
  - **cicd** - CI/CD pipeline generation
  - **deployment** - Deployment configuration and scripts
- **Data agent cluster** with 6 new agents (PR #9):
  - **api-client** - API client generation
  - **state-management** - State management scaffolding
  - **validation-schema** - Data validation schema generation
  - **sql-migration** - SQL migration file generation
  - **sql-query** - SQL query generation
  - **sql-schema** - SQL schema design
- **gitops-agent** - GitHub org/repo configuration management via `gh` CLI (repository settings, branch protection rules, team permissions, webhooks, labels, issue/PR templates, CODEOWNERS, org-wide policies, audit/drift detection, and batch operations)
- Agent retry rule to prevent root-level fallback when subagents fail (PR #10)
- Git command enforcement hooks to install scripts (PR #5, #11)
- Hook to block `gh pr edit` title/body modifications outside pr-agent

### Fixed
- Hardened block-git-commands hook against bypass and resource abuse
- Anchored regex patterns in hooks, added stdin timeout and audit logging
- Applied agent-review findings to all data agents

## [0.4.0] - 2026-01-31

### Added
- 6 new agents across documentation, github, infrastructure, and testing categories:
  - **api-doc-agent** - API documentation generation
  - **git-sync-agent** - Git synchronization workflows
  - **agent-updater** - Agent update management
  - **debug-agent** - Debugging assistance
  - **integration-test-agent** - Integration test generation
  - **unit-test-agent** - Unit test generation
- **agent-review-agent** for instruction file quality review and validation
- **docker** agent for container configuration
- **pr-review** agent for pull request review workflows
- **security-review** agent for security audit and analysis
- Scope detection for branch awareness in git workflow agents
- Git command enforcement hooks to install scripts
- Hook to block `gh pr edit` title/body modifications outside pr-agent

### Changed
- Slimmed custom instructions to behavioral rules only, removing redundant agent lookup tables and recommendation templates
- Expanded documentation-agent scope to include general documentation updates
- Added Workflow sections to doc-review-agent and code-cleanup-agent
- Added Out of Scope Redirects to dotclaude-updater
- Added color field to agent-creator template for propagation
- Rewrote project-goals.md to reflect 22-agent state
- Rewrote agent-awareness.md with all 22 agents and correct paths
- Expanded agent usage guidelines with delegation and review rules
- Added agent retry rule to prevent root-level fallback

### Fixed
- `((count++))` crash with `set -e` in install.sh and list-agents.sh
- Removed no-op `shift` in install.sh argument parsing
- Fixed cross-references: api-doc-generator to api-doc-agent, git-commit-helper to git-commit-agent
- Added `nul` to .gitignore for Windows platform artifact
- Addressed review agent findings across repo

## [0.3.0] - 2026-01-31

### Added
- 5 new Code category agents:
  - **code-review-agent** - Code review and quality analysis
  - **code-linting-agent** - Linting and style enforcement
  - **dependency-agent** - Dependency management and updates
  - **python-agent** - Python-specific development assistance
  - **terraform-agent** - Terraform infrastructure-as-code assistance
- GitHub CLI (`gh`) detection and installation in both install.sh and install.ps1
- PR title convention section to git-pr-agent documentation

### Changed
- Updated git-commit-agent to use type/scope commit message convention
- Updated README prerequisites to list `gh` as a dependency
- Renumbered install steps to accommodate GitHub CLI installation

## [0.2.0] - 2026-01-20

### Added
- 3 new GitHub category agents:
  - **git-pr-agent** - Branch management and pull request workflows
  - **git-tags-agent** - Tag and version management
  - **git-issues-agent** - GitHub issue creation and formatting
- Author attribution configuration for git-commit-agent

### Changed
- Reorganized agents into category directories:
  - `agents/github/` - git-commit, git-pr, git-tags, git-issues
  - `agents/documentation/` - readme, changelog, doc-review
  - `agents/code/` - code-cleanup
  - `agents/infrastructure/` - agent-creator, dotclaude-updater
  - `agents/testing/` - (placeholder for future agents)
- Reorganized documentation files:
  - `agentGuidelines.md` renamed to `agent-guidelines.md`
  - `goals.md` renamed to `project-goals.md`
  - `todo.md` renamed to `roadmap.md`
  - Added `docs/README.md` as documentation index
- Updated install scripts to handle nested category structure
- List-agents scripts now display agents grouped by category

## [0.1.0] - 2026-01-17

### Added
- Initial repository setup with project README, goals, and agent guidelines
- 7 specialized agents:
  - **agent-creator** - Creates new scoped agents with proper structure
  - **changelog-agent** - Generates CHANGELOG.md from git history
  - **code-cleanup-agent** - Identifies redundant and duplicate code
  - **doc-review-agent** - Reviews documentation quality
  - **dotclaude-updater** - Updates dotClaude from GitHub
  - **git-commit-agent** - Suggests conventional commit messages
  - **documentation-agent** - Generates README.md files
- Installation scripts for Windows (PowerShell) and Unix (Bash)
- Agent awareness system with custom instructions template
- Agent design guidelines documentation
- Project goals and roadmap
- Agent template generator scripts (bash and PowerShell)
- CHANGELOG.md file
- Cross-document navigation links in documentation
- Agent color configuration in YAML frontmatter

### Changed
- Consolidated agent structure from multiple files to single `instructions.md` with YAML frontmatter
- Standardized agent directory naming to kebab-case format
- Compressed verbose agent instructions into concise, focused prompts

### Removed
- Legacy `git-commit-helper` agent directory (consolidated into git-commit-agent)
- Redundant per-agent files: agent.json, README.md, mcp-requirements.txt, examples/
- Empty placeholder directories (config/, examples/, tests/)
