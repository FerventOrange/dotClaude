# Agent Development Roadmap

This document tracks the development status of dotClaude agents.

See also: [CHANGELOG](../CHANGELOG.md) | [Agent Guidelines](agent-guidelines.md) | [Project Goals](project-goals.md)

> **v2.0.0 Canonical Template Migration:** Infrastructure and documentation agents have been upgraded to the v2.0.0 canonical template format. Migration for remaining categories is in progress.

---

## GitHub Agents (Blue)

### Completed
- [x] **git-commit-agent** - Creates conventional commit messages
- [x] **git-pr-agent** - Handle branch switching, creation, and push/pull operations
- [x] **git-tags-agent** - Manage repository topics and version tags
- [x] **git-issues-agent** - Create and manage GitHub issues
- [x] **git-sync-agent** - Sync forks with upstream repositories
- [x] **pr-review-agent** - Reviews pull requests for quality and correctness

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
- [x] **security-review-agent** - Reviews code for security vulnerabilities and best practices

---

## Testing Agents (Green)

### Completed
- [x] **debug-agent** - Processes and analyzes error outputs
- [x] **unit-test-agent** - Generates unit tests
- [x] **integration-test-agent** - Generates integration tests

---

## Backend Agents (Green)

### Completed
- [x] **api-endpoint-agent** - Generates API endpoint boilerplate and routing
- [x] **auth-agent** - Generates authentication and authorization logic
- [x] **seed-data-agent** - Generates seed data scripts for databases

---

## Data Agents (Green)

### Completed
- [x] **api-client-agent** - Generates API client libraries and SDK wrappers
- [x] **sql-migration-agent** - Creates SQL migration files
- [x] **sql-query-agent** - Generates optimized SQL queries
- [x] **sql-schema-agent** - Generates SQL schema definitions
- [x] **state-management-agent** - Generates state management boilerplate
- [x] **validation-schema-agent** - Generates validation schemas and rules

---

## Frontend Agents (Blue)

### Completed
- [x] **accessibility-agent** - Audits and improves UI accessibility
- [x] **component-generator-agent** - Generates UI component boilerplate
- [x] **form-builder-agent** - Generates form components with validation
- [x] **route-generator-agent** - Generates routing configuration and page scaffolds

---

## Infrastructure Agents (Purple)

### Completed
- [x] **cicd-agent** - Generates CI/CD pipeline configurations
- [x] **deployment-agent** - Generates deployment scripts and manifests
- [x] **docker-agent** - Generates Dockerfiles and docker-compose configurations
- [x] **env-config-agent** - Generates environment configuration files
- [x] **gitops-agent** - Generates GitOps workflow configurations

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
| GitHub (Blue) | 6 | 0 | 6 |
| Documentation (Yellow) | 4 | 0 | 4 |
| Code (Red) | 7 | 0 | 7 |
| Testing (Green) | 3 | 0 | 3 |
| Backend (Green) | 3 | 0 | 3 |
| Data (Green) | 6 | 0 | 6 |
| Frontend (Blue) | 4 | 0 | 4 |
| Infrastructure (Purple) | 5 | 0 | 5 |
| dotClaude (Pink) | 4 | 0 | 4 |
| **Total** | **42** | **0** | **42** |

---

*Last updated: 2026-03-05*
