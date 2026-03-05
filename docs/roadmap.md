# Agent Development Roadmap

This document tracks the development status of dotClaude agents.

See also: [CHANGELOG](../CHANGELOG.md) | [Agent Guidelines](agent-guidelines.md) | [Project Goals](project-goals.md)

---

## GitHub Agents (Blue)

### Completed
- [x] **git-commit-agent** - Creates conventional commit messages
- [x] **git-pr-agent** - Handle branch switching, creation, and push/pull operations
- [x] **git-tags-agent** - Manage repository topics and version tags
- [x] **git-issues-agent** - Create and manage GitHub issues

- [x] **git-sync-agent** - Sync forks with upstream repositories

---

## Documentation Agents (Yellow)

### Completed
- [x] **doc-review-agent** - Reviews documentation quality and provides feedback
- [x] **documentation-agent** - Generates and updates README.md files
- [x] **changelog-agent** - Generates CHANGELOG.md from git history

- [x] **api-doc-agent** - Creates API documentation from code

---

## Code Agents (Red)

### Completed
- [x] **code-cleanup-agent** - Identifies redundant, duplicate, and dead code
- [x] **code-review-agent** - Reviews code for bugs and best practices
- [x] **code-linting-agent** - Runs and configures lint hooks
- [x] **dependency-agent** - Validates dependencies across files
- [x] **python-agent** - Python-specific code generation
- [x] **terraform-agent** - Terraform infrastructure code generation

---

## Testing Agents (Green)

### Completed
- [x] **debug-agent** - Processes and analyzes error outputs
- [x] **unit-test-agent** - Generates unit tests
- [x] **integration-test-agent** - Generates integration tests

---

## dotClaude Agents (Pink)

### Completed
- [x] **agent-creator** - Creates new agent instruction files (user-triggered only)
- [x] **dotclaude-updater** - Updates local installation from GitHub

- [x] **agent-updater** - Updates existing agent instructions (requires explicit user input)
- [x] **agent-review-agent** - Reviews agent instructions for structural correctness and format consistency

---

## Summary

| Category | Completed | Planned | Total |
|----------|-----------|---------|-------|
| GitHub (Blue) | 5 | 0 | 5 |
| Documentation (Yellow) | 4 | 0 | 4 |
| Code (Red) | 6 | 0 | 6 |
| Testing (Green) | 3 | 0 | 3 |
| dotClaude (Pink) | 4 | 0 | 4 |
| **Total** | **22** | **0** | **22** |

---

*Last updated: 2026-01-31*
