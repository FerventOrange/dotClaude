# dotClaude

A curated collection of 41 specialized AI agents for Claude Code CLI. This repository provides ready-to-use agents that extend Claude Code's capabilities across the full development lifecycle -- from frontend scaffolding and backend API design to database management, CI/CD pipelines, and documentation.

## Why dotClaude?

**The Problem:** Claude Code is powerful, but using it effectively for repetitive tasks requires crafting detailed prompts each time. Complex workflows like generating changelogs, reviewing documentation, or creating consistent commit messages need specific context and instructions.

**The Solution:** dotClaude provides pre-built, specialized agents that:
- **Save time** - No need to write detailed prompts for common tasks
- **Ensure consistency** - Agents follow best practices and standardized formats
- **Enable workflows** - Agents can work together (e.g., generate README, then review it)
- **Stay updated** - Self-updating mechanism keeps agents current
- **Enforce guardrails** - Git command hooks redirect destructive operations to the correct agent

## Prerequisites

Before installing dotClaude, ensure you have:

1. **Node.js** (v18 or higher)
   - Check: `node --version`
   - Download: [nodejs.org](https://nodejs.org/)

2. **Claude Code CLI** (installed and authenticated)
   - Install: `npm install -g @anthropic-ai/claude-code`
   - Verify: `claude --version`

3. **Git** (for cloning and agent operations)
   - Check: `git --version`

4. **GitHub CLI** (for PR workflows, installed automatically by the installer)
   - Check: `gh --version`
   - Install: `winget install GitHub.cli` or visit [cli.github.com](https://cli.github.com/)

## Installation

### Linux/macOS

```bash
git clone https://github.com/FerventOrange/dotClaude.git
cd dotClaude
chmod +x install/install.sh
./install/install.sh
```

### Windows (PowerShell)

```powershell
git clone https://github.com/FerventOrange/dotClaude.git
cd dotClaude
.\install\install.ps1
```

### What the Installer Does

1. Installs Claude Code via npm (if not already present)
2. Installs GitHub CLI via the system package manager (if not already present)
3. Copies custom instructions to `~/.claude/CLAUDE.md` for agent awareness
4. Copies all 41 agents to `~/.claude/agents/`
5. Installs a PreToolUse hook (`block-git-commands.js`) that intercepts direct git commit, push, tag, merge, and rebase commands and redirects them to the appropriate agent
6. Merges the hook configuration into `~/.claude/settings.json`

## Available Agents

### GitHub (6 agents)

| Agent | Purpose |
|-------|---------|
| **git-commit-agent** | Suggest conventional commit messages |
| **git-pr-agent** | Manage branches for PR workflows |
| **git-tags-agent** | Manage git tags and version releases |
| **git-issues-agent** | Create well-formatted GitHub issues |
| **git-sync-agent** | Sync forks with upstream repositories |
| **pr-review-agent** | Review pull requests with structured comments |

### Documentation (4 agents)

| Agent | Purpose |
|-------|---------|
| **readme-agent** | Generate and update README.md files |
| **changelog-agent** | Generate CHANGELOG.md from git history |
| **doc-review-agent** | Review documentation quality |
| **api-doc-agent** | Generate API documentation from code |

### Code (7 agents)

| Agent | Purpose |
|-------|---------|
| **code-cleanup-agent** | Find redundant and duplicate code |
| **code-review-agent** | Review code for bugs and best practices |
| **code-linting-agent** | Set up and configure linting tools |
| **dependency-agent** | Validate dependencies across files |
| **python-agent** | Python-specific code generation |
| **security-review-agent** | Review code for security vulnerabilities (OWASP Top 10, secrets, CVEs) |
| **terraform-agent** | Terraform infrastructure code generation |

### Frontend (4 agents)

| Agent | Purpose |
|-------|---------|
| **component-generator-agent** | Scaffold UI components with styles, tests, and exports for any framework |
| **form-builder-agent** | Generate form components with validation, error states, and submission handling |
| **route-generator-agent** | Generate pages and routes with layout wiring, detecting the routing framework |
| **accessibility-agent** | Audit UI components for WCAG 2.1 AA compliance (ARIA, contrast, keyboard nav) |

### Backend (3 agents)

| Agent | Purpose |
|-------|---------|
| **api-endpoint-agent** | Scaffold REST or GraphQL endpoints with types and middleware |
| **auth-agent** | Generate authentication flows, middleware, guards, and session/JWT setup |
| **seed-data-agent** | Generate seed and fixture data for development and testing |

### Data (6 agents)

| Agent | Purpose |
|-------|---------|
| **api-client-agent** | Generate typed API client code from OpenAPI, GraphQL, or tRPC schemas |
| **state-management-agent** | Scaffold stores, reducers, and context providers matching project patterns |
| **validation-schema-agent** | Generate Zod, Yup, or JSON validation schemas from types or DB models |
| **sql-migration-agent** | Generate and review database migration files (Prisma, Knex, raw SQL) |
| **sql-query-agent** | Build, review, and optimize SQL queries for correctness and performance |
| **sql-schema-agent** | Review and generate database schema definitions with normalization guidance |

### Testing (3 agents)

| Agent | Purpose |
|-------|---------|
| **debug-agent** | Parse errors and identify root causes |
| **unit-test-agent** | Generate unit tests for functions and classes |
| **integration-test-agent** | Generate integration tests |

### Infrastructure (8 agents)

| Agent | Purpose |
|-------|---------|
| **docker-agent** | Generate Dockerfiles and docker-compose configs |
| **env-config-agent** | Manage environment files, secrets templates, and config across environments |
| **cicd-agent** | Generate CI/CD pipeline configs (GitHub Actions, GitLab CI, and others) |
| **deployment-agent** | Generate deploy scripts and hosting configs (Vercel, AWS, Fly.io, and others) |
| **agent-creator** | Create new custom agents |
| **dotclaude-updater** | Update dotClaude from GitHub |
| **agent-updater** | Update existing agent instructions |
| **agent-review-agent** | Review agent instructions for quality |

## Usage Examples

### Generate a README

```bash
cd your-project
claude --agent readme-agent
```

### Create a Changelog

```bash
claude --agent changelog-agent
```

### Review Documentation

```bash
claude --agent doc-review-agent README.md
```

### Get Commit Message Help

```bash
git add .
claude --agent git-commit-agent
```

### Scaffold a Frontend Component

```bash
claude --agent component-generator-agent
```

### Generate an API Endpoint

```bash
claude --agent api-endpoint-agent
```

### Generate a CI/CD Pipeline

```bash
claude --agent cicd-agent
```

### Multi-Agent Workflows

With agent awareness enabled, Claude can chain agents:

```
You: "Document my project completely"
Claude will offer: readme-agent -> changelog-agent -> doc-review-agent
```

```
You: "Help me improve code quality"
Claude will offer: code-review-agent -> code-linting-agent -> code-cleanup-agent -> unit-test-agent
```

## Agent Awareness

After installation, Claude automatically recommends agents when you ask for help with matching tasks. The custom instructions installed to `~/.claude/CLAUDE.md` teach Claude to:

- Check for a matching agent before starting any task
- Recommend the agent and explain why it is a better fit
- Ask for permission before switching to an agent
- Chain multiple agents for multi-step workflows
- Retry a failed subagent rather than falling back to inline work

Example interaction:

```
You: I need to create a README

Claude: I can help with that! We have a specialized agent:
  Agent: readme-agent
  Usage: claude --agent readme-agent
  Would you like to use it? (y/n)
```

## Git Command Hooks

The installer sets up a PreToolUse hook that intercepts potentially destructive git commands and redirects them to the correct agent. Blocked commands include:

| Command | Redirects to |
|---------|-------------|
| `git commit` | git-commit-agent |
| `git push` | git-pr-agent |
| `git tag` | git-tags-agent |
| `git merge` | git-sync-agent |
| `git rebase` | git-sync-agent |
| `gh pr edit --title/--body` | git-pr-agent |

This prevents Claude from running raw git operations outside the controlled agent workflows.

## Repository Structure

```
dotClaude/
├── agents/
│   ├── github/          # Git and GitHub workflow agents
│   ├── documentation/   # Documentation generation agents
│   ├── code/            # Code analysis and maintenance agents
│   ├── frontend/        # UI component and routing agents
│   ├── backend/         # API endpoint and auth agents
│   ├── data/            # API clients, state, SQL, and validation agents
│   ├── testing/         # Testing and debugging agents
│   └── infrastructure/  # Docker, CI/CD, deploy, and dotClaude management agents
├── docs/                # Guidelines, project goals, and roadmap
└── install/             # Installation scripts, hooks, and agent-awareness config
    ├── hooks/           # PreToolUse hook scripts
    ├── install.sh       # Linux/macOS installer
    ├── install.ps1      # Windows installer
    ├── list-agents.sh   # List installed agents (bash)
    └── list-agents.ps1  # List installed agents (PowerShell)
```

## Creating Custom Agents

```bash
claude --agent agent-creator
```

Or manually create `~/.claude/agents/your-agent/instructions.md` with YAML frontmatter.

See [docs/agent-guidelines.md](docs/agent-guidelines.md) for detailed guidelines.

## Updating

```bash
claude --agent dotclaude-updater
```

Or manually:
```bash
cd ~/dotClaude && git pull
./install/install.sh
```

## Contributing

1. Fork the repository
2. Create a focused agent following the [guidelines](docs/agent-guidelines.md)
3. Test locally with `claude --agent your-agent`
4. Submit a pull request

## License

MIT

---

*See [docs/roadmap.md](docs/roadmap.md) for development roadmap and [CHANGELOG.md](CHANGELOG.md) for version history.*
