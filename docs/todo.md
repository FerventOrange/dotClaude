# Agent Development Roadmap

This document tracks the development status of dotClaude agents.

See also: [CHANGELOG.md](../CHANGELOG.md) | [Agent Guidelines](agentGuidelines.md) | [Goals](goals.md)

---

## GitHub Agents (Blue)

### Completed
- [x] **git-commit-agent** - Creates conventional commit messages

### Planned
- [ ] **git-pr-agent** - Handle branch switching, creation, and push/pull operations
- [ ] **git-tags-agent** - Manage repository topics and version tags
- [ ] **git-issues-agent** - Create and manage GitHub issues

---

## Documentation Agents (Yellow)

### Completed
- [x] **doc-review-agent** - Reviews documentation quality and provides feedback
- [x] **readme-agent** - Generates and updates README.md files
- [x] **changelog-agent** - Generates CHANGELOG.md from git history

### Planned
- [ ] **api-doc-agent** - Creates API documentation from code

---

## Code Agents (Red)

### Completed
- [x] **code-cleanup-agent** - Identifies redundant, duplicate, and dead code

### Planned
- [ ] **code-review-agent** - Reviews code for bugs and best practices
- [ ] **code-linting-agent** - Runs and configures lint hooks
- [ ] **dependency-agent** - Validates dependencies across files
- [ ] **python-agent** - Python-specific code generation
- [ ] **terraform-agent** - Terraform infrastructure code generation

---

## Testing Agents (Green)

### Planned
- [ ] **debug-agent** - Processes and analyzes error outputs
- [ ] **unit-test-agent** - Generates unit tests
- [ ] **integration-test-agent** - Generates integration tests

---

## dotClaude Agents (Pink)

### Completed
- [x] **agent-creator** - Creates new agent instruction files (user-triggered only)
- [x] **dotclaude-updater** - Updates local installation from GitHub

### Planned
- [ ] **agent-updater** - Updates existing agent instructions (requires explicit user input)

---

## Summary

| Category | Completed | Planned | Total |
|----------|-----------|---------|-------|
| GitHub (Blue) | 1 | 3 | 4 |
| Documentation (Yellow) | 3 | 1 | 4 |
| Code (Red) | 1 | 5 | 6 |
| Testing (Green) | 0 | 3 | 3 |
| dotClaude (Pink) | 2 | 1 | 3 |
| **Total** | **7** | **13** | **20** |

---

*Last updated: 2026-01-19*
