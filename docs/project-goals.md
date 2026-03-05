# Project Goals & Objectives

A centralized repository for managing Claude Code agents and development settings across teams and projects.

See also: [Roadmap](roadmap.md) | [Agent Guidelines](agent-guidelines.md) | [CHANGELOG](../CHANGELOG.md)

---

## Current State (v2.0.0)

### Completed
- [x] Cross-platform installation scripts (Bash & PowerShell)
- [x] Agent awareness system with custom instructions
- [x] 42 specialized agents deployed across 8 categories
- [x] Agent design guidelines documented
- [x] CHANGELOG following Keep a Changelog format
- [x] Simplified agent structure (single instructions.md with YAML frontmatter)
- [x] Category-based agent organization (backend, code, data, documentation, frontend, github, infrastructure, testing)
- [x] Testing agents (debug, unit-test, integration-test)
- [x] Language-specific agents (Python, Terraform)
- [x] Code quality agents (linting, review, cleanup, dependency management)
- [x] Full Git workflow agents (commit, PR, tags, issues, sync, pr-review)
- [x] Frontend agents (accessibility, component-generator, form-builder, route-generator)
- [x] Backend agents (api-endpoint, auth, seed-data)
- [x] Data agents (api-client, sql-migration, sql-query, sql-schema, state-management, validation-schema)
- [x] v2.0.0 canonical template migration for all agents

### Remaining
- [ ] Community feedback integration
- [ ] Agent validation framework
- [ ] macOS-specific testing (Intel & Apple Silicon)

---

## Core Goals

### 1. Cross-Platform Installation
**Status:** Complete

**Achieved:**
- Linux/macOS installation via `install.sh`
- Windows installation via `install.ps1`
- Automated agent copying to `~/.claude/agents/`
- Custom instructions setup for agent awareness
- Agent listing scripts (`list-agents.sh`, `list-agents.ps1`)

**Remaining:**
- macOS-specific testing (Intel & Apple Silicon)
- Dependency version checking

---

### 2. Agent Library System
**Status:** Complete

**Achieved:**
- Central agent library in `agents/` directory organized into 8 categories
- Semantic versioning in agent metadata
- Git-based distribution (clone + pull for updates)
- Agent discovery via install scripts
- Self-update capability via `dotclaude-updater` agent
- Agent management tooling (agent-creator, agent-updater, agent-review-agent)

**Remaining:**
- Agent validation framework
- Rollback capability for updates

---

### 3. Developer Experience
**Status:** Complete

**Achieved:**
- Documentation agents (documentation-agent, changelog, doc-review, api-doc)
- Git workflow agents (commit, PR, tags, issues, sync, pr-review)
- Code maintenance agents (cleanup, review, linting, dependency management, security-review)
- Testing agents (debug, unit-test, integration-test)
- Language-specific agents (Python, Terraform)
- Frontend agents (accessibility, component-generator, form-builder, route-generator)
- Backend agents (api-endpoint, auth, seed-data)
- Data agents (api-client, sql-migration, sql-query, sql-schema, state-management, validation-schema)
- Infrastructure agents (cicd, deployment, docker, env-config, gitops)
- Agent creation and management tooling

**Remaining:**
- Performance optimization

---

## Design Decisions

| Question | Decision |
|----------|----------|
| Agent Storage | Within Git repository |
| Update Mechanism | Pull model (git pull + install script) |
| Versioning | Semantic versioning (MAJOR.MINOR.PATCH) |
| Agent Structure | Single `instructions.md` with YAML frontmatter |
| Agent Organization | Category subfolders (backend, code, data, documentation, frontend, github, infrastructure, testing) |
| Customization | Agents scoped to single responsibility; customize via fork |
| Canonical Template | v2.0.0 standardized template with canonical section order (Primary Objective, Scope Boundaries, Required Context, Workflow, Output Format, Error Handling, Out of Scope Redirects) applied to all agents |

---

## Repository Structure

```
dotClaude/
├── agents/                        # Agent definitions (instructions.md files)
│   ├── backend/                   # Backend & API agents (3)
│   │   ├── api-endpoint-agent/
│   │   ├── auth-agent/
│   │   └── seed-data-agent/
│   ├── code/                      # Code quality & language agents (7)
│   │   ├── code-cleanup-agent/
│   │   ├── code-linting-agent/
│   │   ├── code-review-agent/
│   │   ├── dependency-agent/
│   │   ├── python-agent/
│   │   ├── security-review-agent/
│   │   └── terraform-agent/
│   ├── data/                      # Data & schema agents (6)
│   │   ├── api-client-agent/
│   │   ├── sql-migration-agent/
│   │   ├── sql-query-agent/
│   │   ├── sql-schema-agent/
│   │   ├── state-management-agent/
│   │   └── validation-schema-agent/
│   ├── documentation/             # Documentation agents (4)
│   │   ├── api-doc-agent/
│   │   ├── changelog-agent/
│   │   ├── doc-review-agent/
│   │   └── documentation-agent/
│   ├── frontend/                  # Frontend & UI agents (4)
│   │   ├── accessibility-agent/
│   │   ├── component-generator-agent/
│   │   ├── form-builder-agent/
│   │   └── route-generator-agent/
│   ├── github/                    # Git workflow agents (6)
│   │   ├── git-commit-agent/
│   │   ├── git-issues-agent/
│   │   ├── git-pr-agent/
│   │   ├── git-sync-agent/
│   │   ├── git-tags-agent/
│   │   └── pr-review-agent/
│   ├── infrastructure/            # Infrastructure & agent management agents (9)
│   │   ├── agent-creator/
│   │   ├── agent-review-agent/
│   │   ├── agent-updater/
│   │   ├── cicd-agent/
│   │   ├── deployment-agent/
│   │   ├── docker-agent/
│   │   ├── dotclaude-updater/
│   │   ├── env-config-agent/
│   │   └── gitops-agent/
│   └── testing/                   # Testing & debugging agents (3)
│       ├── debug-agent/
│       ├── integration-test-agent/
│       └── unit-test-agent/
├── docs/                          # Documentation and guidelines
│   ├── agent-guidelines.md
│   ├── project-goals.md
│   ├── roadmap.md
│   └── README.md
├── install/                       # Installation scripts
│   ├── install.sh
│   ├── install.ps1
│   ├── list-agents.sh
│   ├── list-agents.ps1
│   ├── custom-instructions.md
│   └── agent-awareness.md
├── CHANGELOG.md
└── README.md
```

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Installation Time | < 15 min | ~5 min |
| Agent Count | 40+ | 42 |
| Documentation Coverage | 100% | 95% |
| Cross-Platform Support | 3 OS | 2 tested |
| Agent Categories | 8 | 8 |

---

## Implementation Phases

### Phase 1: Foundation - Complete
- [x] Repository setup and structure
- [x] Installation scripts for Linux/Windows
- [x] Initial documentation
- [x] Core agents (7 total)

### Phase 2: Expansion - Complete
- [x] Complete agent library (22 agents, exceeding target of 20)
- [x] Testing agents (debug, unit-test, integration-test)
- [x] Language-specific agents (Python, Terraform)
- [x] Category-based agent organization
- [x] Full Git workflow coverage (commit, PR, tags, issues, sync)
- [x] Code quality agents (review, linting, dependency management)
- [x] API documentation agent
- [x] Agent management tooling (creator, updater, reviewer)

### Phase 3: Agent Cluster Expansion & v2.0.0 Migration - Complete
- [x] Frontend agent cluster (accessibility, component-generator, form-builder, route-generator)
- [x] Backend agent cluster (api-endpoint, auth, seed-data)
- [x] Data agent cluster (api-client, sql-migration, sql-query, sql-schema, state-management, validation-schema)
- [x] Infrastructure expansion (cicd, deployment, docker, env-config, gitops)
- [x] GitHub category expansion (pr-review-agent)
- [x] Code category expansion (security-review-agent)
- [x] v2.0.0 canonical template migration for all 42 agents
- [x] Rename readme-agent to documentation-agent
- [x] Agent count grown from 22 to 42 across 8 categories

### Phase 4: Enhancement - In Progress
- [ ] Agent validation framework
- [ ] Rollback capability
- [ ] CI/CD integration
- [ ] Performance optimization
- [ ] macOS testing (Intel & Apple Silicon)

### Phase 5: Community - Planned
- [ ] Contribution guidelines
- [ ] Agent submission process
- [ ] Community feedback integration

---

*Document created: 2026-01-17*
*Last updated: 2026-03-05*
