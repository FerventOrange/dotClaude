# dotClaude

A curated collection of specialized AI agents for Claude Code CLI. This repository provides ready-to-use agents that extend Claude Code's capabilities for common development tasks like documentation, git workflows, and code maintenance.

## Why dotClaude?

**The Problem:** Claude Code is powerful, but using it effectively for repetitive tasks requires crafting detailed prompts each time. Complex workflows like generating changelogs, reviewing documentation, or creating consistent commit messages need specific context and instructions.

**The Solution:** dotClaude provides pre-built, specialized agents that:
- **Save time** - No need to write detailed prompts for common tasks
- **Ensure consistency** - Agents follow best practices and standardized formats
- **Enable workflows** - Agents can work together (e.g., generate README, then review it)
- **Stay updated** - Self-updating mechanism keeps agents current

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

1. Creates `~/.claude/` directory (if needed)
2. Copies all agents to `~/.claude/agents/`
3. Sets up `CLAUDE.md` with agent awareness instructions

## Available Agents

| Agent | Category | Purpose |
|-------|----------|---------|
| **git-commit-agent** | GitHub | Suggest conventional commit messages |
| **git-pr-agent** | GitHub | Manage branches for PR workflows |
| **git-tags-agent** | GitHub | Manage git tags and version releases |
| **git-issues-agent** | GitHub | Create well-formatted GitHub issues |
| **git-sync-agent** | GitHub | Sync forks with upstream repositories |
| **readme-agent** | Documentation | Generate/update README.md files |
| **changelog-agent** | Documentation | Generate CHANGELOG.md from git history |
| **doc-review-agent** | Documentation | Review documentation quality |
| **api-doc-agent** | Documentation | Generate API documentation from code |
| **code-cleanup-agent** | Code | Find redundant/duplicate code |
| **code-review-agent** | Code | Review code for bugs and best practices |
| **code-linting-agent** | Code | Set up and configure linting tools |
| **dependency-agent** | Code | Validate dependencies across files |
| **python-agent** | Code | Python-specific code generation |
| **terraform-agent** | Code | Terraform infrastructure code generation |
| **debug-agent** | Testing | Parse errors and identify root causes |
| **unit-test-agent** | Testing | Generate unit tests for functions/classes |
| **integration-test-agent** | Testing | Generate integration tests |
| **agent-creator** | dotClaude | Create new custom agents |
| **dotclaude-updater** | dotClaude | Update dotClaude from GitHub |
| **agent-updater** | dotClaude | Update existing agent instructions |
| **agent-review-agent** | dotClaude | Review agent instructions for quality |

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

### Multi-Agent Workflows

With agent awareness enabled, Claude can chain agents:

```
You: "Document my project completely"
Claude will offer: readme-agent -> changelog-agent -> doc-review-agent
```

## Agent Awareness

After installation, Claude automatically recommends agents when you ask for help with matching tasks. Example:

```
You: I need to create a README

Claude: I can help with that! We have a specialized agent:
  Agent: readme-agent
  Usage: claude --agent readme-agent
  Would you like to use it? (y/n)
```

## Repository Structure

```
dotClaude/
├── agents/
│   ├── github/          # Git workflow agents (Blue)
│   ├── documentation/   # Doc generation agents (Yellow)
│   ├── code/            # Code analysis agents (Red)
│   ├── testing/         # Testing agents (Green)
│   └── infrastructure/  # dotClaude management (Pink)
├── docs/                # Guidelines and roadmap
└── install/             # Installation scripts
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
```

## Contributing

1. Fork the repository
2. Create a focused agent following the [guidelines](docs/agent-guidelines.md)
3. Test locally with `claude --agent your-agent`
4. Submit a pull request

## License

MIT

---

*See [docs/roadmap.md](docs/roadmap.md) for development roadmap*
