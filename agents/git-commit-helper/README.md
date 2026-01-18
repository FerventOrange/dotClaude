# git-commit-helper

Analyzes your staged git changes and suggests well-crafted conventional commit messages.

## Installation

This agent is part of the dotClaude repository:

```bash
git clone git@github.com:FerventOrange/dotClaude.git ~/dotClaude
```

## Usage

```bash
# Stage your changes first
git add .

# Get commit message suggestions
claude-code --agent git-commit-helper
```

## Features

- Follows [Conventional Commits](https://www.conventionalcommits.org/) specification
- Analyzes diff to understand change context
- Suggests appropriate commit type (feat, fix, docs, etc.)
- Keeps subject lines under 50 characters
- Provides multiple options when applicable

## MCP Requirements

See `mcp-requirements.txt` - requires the `git` MCP server.

## Examples

See the `examples/` directory for common usage patterns.

## Version History

- **1.0.0** (2026-01-17): Initial release
