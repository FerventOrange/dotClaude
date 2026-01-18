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
├── install/        # OS-specific installation scripts
├── config/         # Configuration templates and helpers
├── agents/         # Agent library and registry
├── scripts/        # Utility scripts for management
├── docs/           # Documentation and guides
├── tests/          # Testing and validation
└── examples/       # Example configurations and workflows
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
./scripts/check-mcp-requirements.sh --all
```

## Agent Philosophy

Each agent in this repository follows the **Single Responsibility Principle**:
- Narrow focus on a specific task
- Clear input/output contracts
- Composable with other agents
- Minimal MCP dependencies

See [agentGuidelines.md](agentGuidelines.md) for detailed agent design principles.

## Agent Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| Code Generation | Generate specific code types | `react-component-generator`, `dockerfile-creator` |
| Code Analysis | Analyze code for issues | `security-scanner`, `performance-profiler` |
| Documentation | Create documentation | `readme-generator`, `api-doc-writer` |
| Testing | Handle testing tasks | `unit-test-writer`, `test-data-creator` |
| Git Workflows | Git operations | `commit-message-helper`, `pr-description-writer` |
| Refactoring | Code refactoring | `extract-function`, `rename-variables` |
| Configuration | Manage config files | `eslint-configurator`, `env-file-manager` |
| Infrastructure | Internal tooling | `mcp-configurator`, `agent-updater` |

## Contributing

1. Fork the repository
2. Create a focused agent following the [guidelines](agentGuidelines.md)
3. Test your agent locally
4. Submit a pull request

## License

MIT

---

*For project goals and roadmap, see [goals.md](goals.md)*
