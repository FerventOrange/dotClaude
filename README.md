# dotClaude

A centralized repository for managing Claude Code agents and development settings across teams and projects.

## Overview

dotClaude provides:
- **Cross-platform installation** scripts for Claude Code
- **GitHub integration** automation and configuration
- **Agent library** with version-controlled, shareable agents
- **MCP server management** tools

## Repository Structure

```
dotClaude/
├── install/        # Installation scripts and custom instructions
├── agents/         # Agent library (flattened structure)
├── scripts/        # Utility scripts for agent creation
├── agentGuidelines.md  # Agent design principles
└── goals.md        # Project goals and roadmap
```

## Quick Start

### Clone the Repository

```bash
git clone git@github.com:FerventOrange/dotClaude.git ~/dotClaude
cd ~/dotClaude
```

### Create a New Agent

```bash
./scripts/create-agent.sh my-agent-name
```

### Update Agents

```bash
git pull origin main
```

## Agent Philosophy

Each agent in this repository follows the **Single Responsibility Principle**:
- Narrow focus on a specific task
- Clear input/output contracts
- Composable with other agents
- Minimal MCP dependencies

See [agentGuidelines.md](agentGuidelines.md) for detailed agent design principles.

## Available Agents

| Agent | Purpose | Usage |
|-------|---------|-------|
| `readme-agent` | Generate README.md files | `claude --agent readme-agent` |
| `changelog-agent` | Generate CHANGELOG.md from git history | `claude --agent changelog-agent` |
| `doc-review-agent` | Review documentation quality | `claude --agent doc-review-agent` |
| `git-commit-agent` | Suggest conventional commit messages | `claude --agent git-commit-agent` |
| `codecleanup-agent` | Find redundant/duplicate code | `claude --agent codecleanup-agent` |
| `agent-creator` | Create new scoped agents | `claude --agent agent-creator` |
| `dotclaude-updater` | Update dotClaude from GitHub | `claude --agent dotclaude-updater` |

## Contributing

1. Fork the repository
2. Create a focused agent following the [guidelines](agentGuidelines.md)
3. Test your agent locally
4. Submit a pull request

## License

MIT

---

*For project goals and roadmap, see [goals.md](goals.md)*
