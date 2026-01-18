# DotClaude-Updater

Updates and verifies your local dotClaude installation from GitHub.

## Overview

This agent handles keeping your dotClaude installation current by:
- Pulling latest changes from the GitHub repository
- Verifying updates completed successfully
- Listing new or updated agents
- Recommending post-update actions

## Usage

```bash
claude --agent DotClaude-Updater
```

## What It Does

1. **Checks for updates** - Fetches from remote and shows pending changes
2. **Pulls updates** - Downloads and applies latest changes
3. **Verifies integrity** - Confirms update succeeded
4. **Reports changes** - Lists new agents, modified files, recommendations

## What It Doesn't Do

- Push changes to remote
- Modify your local customizations
- Auto-run install scripts
- Handle merge conflicts (alerts you instead)

## MCP Requirements

See mcp-requirements.txt - requires git and filesystem MCP servers.

## Related Agents

- AgentCreation-Agent - Create new agents
- Changelog-Agent - View project changelog

## Version

Current version: 1.0.0
