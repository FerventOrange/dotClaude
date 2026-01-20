# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Agent color configuration in YAML frontmatter
  - Blue: git-commit-agent (GitHub category)
  - Yellow: doc-review-agent, readme-agent, changelog-agent (Documentation category)
  - Red: code-cleanup-agent (Code category)
  - Pink: agent-creator, dotclaude-updater (dotClaude category)
- Comprehensive documentation review across all files
- This CHANGELOG.md file
- Cross-document navigation links in docs/
- Summary table in todo.md

### Changed
- Consolidated agent structure from multiple files to single `instructions.md` with YAML frontmatter
- Standardized agent naming to kebab-case format
- Updated install scripts to work with simplified agent structure
- Reorganized documentation into dedicated `install/` directory
- Enhanced README.md with installation instructions, prerequisites, and usage examples
- Updated goals.md to reflect current project state
- Reformatted todo.md with checkboxes and summary table

### Removed
- Legacy `git-commit-helper` agent directory (consolidated into git-commit-agent)
- Redundant documentation files (agent-awareness.md, agent-awareness-summary.md, setup-agent-awareness.md)
- Empty placeholder directories (config/, examples/, tests/)
- Individual agent files: agent.json, README.md, mcp-requirements.txt, examples/

## [0.1.0] - 2026-01-17

### Added
- Initial repository setup
- 7 specialized agents:
  - **agent-creator** - Creates new scoped agents with proper structure
  - **changelog-agent** - Generates CHANGELOG.md from git history
  - **code-cleanup-agent** - Identifies redundant and duplicate code
  - **doc-review-agent** - Reviews documentation quality
  - **dotclaude-updater** - Updates dotClaude from GitHub
  - **git-commit-agent** - Suggests conventional commit messages
  - **readme-agent** - Generates README.md files
- Installation scripts for Windows (PowerShell) and Unix (Bash)
- Agent awareness system with custom instructions
- Agent design guidelines documentation
- Project goals and roadmap

---

## About This Changelog

This changelog is generated and maintained using the `changelog-agent`. To update:

```bash
claude --agent changelog-agent
```

### Categories Used

- **Added** - New features and capabilities
- **Changed** - Changes to existing functionality
- **Deprecated** - Features marked for future removal
- **Removed** - Features that have been removed
- **Fixed** - Bug fixes
- **Security** - Security-related changes

---

[Unreleased]: https://github.com/travhall/dotClaude/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/travhall/dotClaude/releases/tag/v0.1.0
