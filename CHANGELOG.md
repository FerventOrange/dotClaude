# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- 6 new agents across documentation, github, infrastructure, and testing categories:
  - **api-doc-agent** - API documentation generation
  - **git-sync-agent** - Git synchronization workflows
  - **agent-updater** - Agent update management
  - **debug-agent** - Debugging assistance
  - **integration-test-agent** - Integration test generation
  - **unit-test-agent** - Unit test generation
- **agent-review-agent** for instruction file quality review and validation
- Scope detection for branch awareness in git workflow agents

### Changed
- Slimmed custom instructions to behavioral rules only, removing redundant agent lookup tables and recommendation templates
- Expanded readme-agent scope to include general documentation updates
- Added Workflow sections to doc-review-agent and code-cleanup-agent
- Added Out of Scope Redirects to dotclaude-updater
- Added color field to agent-creator template for propagation
- Rewrote project-goals.md to reflect 22-agent state
- Rewrote agent-awareness.md with all 22 agents and correct paths

### Fixed
- `((count++))` crash with `set -e` in install.sh and list-agents.sh
- Removed no-op `shift` in install.sh argument parsing
- Fixed cross-references: api-doc-generator to api-doc-agent, git-commit-helper to git-commit-agent
- Added `nul` to .gitignore for Windows platform artifact

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
  - **readme-agent** - Generates README.md files
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

---

[Unreleased]: https://github.com/FerventOrange/dotClaude/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/FerventOrange/dotClaude/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/FerventOrange/dotClaude/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/FerventOrange/dotClaude/releases/tag/v0.1.0
