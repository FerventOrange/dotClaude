# Agent Design Guidelines

## Core Philosophy: Limited Scope, Maximum Effectiveness

Each agent in this repository must be **narrowly focused** on a specific task, domain, or workflow. Scoped agents are easier to maintain, test, understand, and compose together for complex workflows.

---

## Agent Scoping Principles

### 1. Single Responsibility Principle
**Each agent should do ONE task exceptionally well.**

✅ **Good Examples:**
- `git-commit-agent` - Assists with writing conventional commit messages
- `git-problems-agent` - Assists with writing issues to git
- `api-doc-generator` - Generates API documentation from code
- `test-writer` - Creates unit tests for existing functions
- `code-reviewer` - Reviews code for best practices and bugs
- `python-coder` - Reviews code in python using best practices
- `security-reviewer` -  Reviews code for best security practices
- `documentation-writer` -  Reviews code for best security practices


❌ **Bad Examples:**
- `full-stack-developer` - Too broad, tries to do everything
- `project-manager` - Scope creep, unclear boundaries
- `general-assistant` - No specific focus

### 2. Clear Input/Output Contract
Each agent should have well-defined:
- **Input requirements** - What files, context, or data it needs
- **Explaination** - What changes it would like to make and why, always ask for confirmation.
- **Output format** - What it produced (files, reports, suggestions)
- **Dependencies** - What tools or MCP servers it requires

### 3. Composability Over Complexity
Agents should be designed to work together rather than trying to handle every edge case.

**Example Workflow:**
```
code-analyzer → bug-finder → fix-suggester → test-writer
```

Each agent has a clear role and passes work to the next agent in the chain.

---

## Agent Structure

### Required Components

Every agent must include:

```
agents/
└── agent-name/
    ├── agent.json          # Agent configuration and metadata
    ├── README.md           # Documentation and usage guide
    ├── instructions.md     # Detailed instructions for Claude
    ├── examples/           # Example inputs/outputs
    └── mcp-requirements.txt # Required MCP servers (if any)
```

### Agent Manifest (agent.json)

```json
{
  "name": "git-commit-helper",
  "version": "1.0.0",
  "description": "Assists in writing conventional commit messages",
  "scope": "git workflows",
  "author": "Your Team",
  "created": "2026-01-17",
  "updated": "2026-01-17",
  "mcp_servers": [
    "filesystem",
    "git"
  ],
  "dependencies": [],
  "input_types": [
    "git diff",
    "staged files"
  ],
  "output_types": [
    "commit message",
    "commit suggestions"
  ],
  "constraints": [
    "Only works with git repositories",
    "Requires staged changes"
  ]
}
```

### Instructions Format (instructions.md)

```markdown
# Agent: [Name]

## Primary Objective
[One sentence describing what this agent does]

## Scope Boundaries
### This agent DOES:
- [Specific task 1]
- [Specific task 2]
- [Specific task 3]

### This agent DOES NOT:
- [Out of scope task 1]
- [Out of scope task 2]
- [Redirect to other-agent for this]

## Required Context
[What information the agent needs to function]

## Workflow
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Output Format
[Describe what the agent produces]

## Error Handling
[How to handle common issues]

## Examples
[Include 4-5 clear examples]
```

---

## MCP Server Integration

### MCP Requirements File
Each agent that requires MCP servers must declare them in `mcp-requirements.txt`:

```txt
# MCP servers required for this agent
filesystem>=1.0.0
git>=1.0.0
github>=2.0.0  # optional, for advanced features
```

### MCP Configuration Helper
We provide a dedicated agent for MCP setup:

**Agent: `mcp-configurator`**
- Scans agent requirements
- Checks installed MCP servers
- Guides installation of missing servers
- Validates MCP connectivity
- Updates Claude Code configuration

### MCP Server Discovery
```bash
# Check what MCP servers an agent needs
./scripts/check-mcp-requirements.sh agents/git-commit-helper

# Configure all required MCP servers for an agent
./scripts/setup-mcp.sh agents/git-commit-helper
```

---

## Agent Scope Categories

To maintain organization, agents should fall into one of these categories:

### 1. Code Generation
- Narrow focus: Generate specific types of code
- Examples: `react-component-generator`, `sql-query-builder`, `dockerfile-creator`

### 2. Code Analysis
- Narrow focus: Analyze code for specific issues
- Examples: `security-scanner`, `performance-profiler`, `dependency-auditor`

### 3. Documentation
- Narrow focus: Create specific documentation types
- Examples: `readme-generator`, `api-doc-writer`, `changelog-creator`

### 4. Testing
- Narrow focus: Handle specific testing tasks
- Examples: `unit-test-writer`, `integration-test-generator`, `test-data-creator`

### 5. Git Workflows
- Narrow focus: Specific git operations
- Examples: `commit-message-helper`, `branch-namer`, `pr-description-writer`

### 6. Refactoring
- Narrow focus: Specific refactoring patterns
- Examples: `extract-function`, `rename-variables`, `simplify-conditionals`

### 7. Configuration
- Narrow focus: Manage specific config files
- Examples: `eslint-configurator`, `docker-compose-builder`, `env-file-manager`

### 8. Infrastructure
- Narrow focus: Internal tooling and setup
- Examples: `mcp-configurator`, `agent-updater`, `workspace-initializer`

---

## Scope Validation Checklist

Before adding an agent to the repository, verify:

- [ ] Agent has a single, clear purpose (can be described in one sentence)
- [ ] Agent's scope is documented with clear boundaries
- [ ] Agent doesn't overlap significantly with existing agents
- [ ] Agent can be composed with other agents for complex workflows
- [ ] Agent has clear input/output contracts
- [ ] Agent declares all MCP server dependencies
- [ ] Agent includes examples demonstrating its scope
- [ ] Agent documentation explains when NOT to use it
- [ ] Agent has a meaningful name that reflects its limited scope

---

## Anti-Patterns to Avoid

### ❌ The "Swiss Army Knife" Agent
```json
{
  "name": "code-helper",
  "description": "Helps with all coding tasks"
}
```
**Problem:** Too broad, unclear when to use

### ❌ The "Almost Everything" Agent
```json
{
  "name": "python-developer",
  "scope": "All Python development tasks including coding, testing, deploying, documenting"
}
```
**Problem:** Should be 4+ separate agents

### ❌ The "Feature Creep" Agent
```
# Started as: git-commit-helper
# Now also: formats code, runs tests, pushes to remote, creates PRs
```
**Problem:** Scope expanded beyond original purpose

---

## Working with Multiple Agents

### Sequential Workflows
Use agents in sequence for multi-step tasks:
```bash
# Step 1: Analyze code
claude-code --agent code-analyzer src/

# Step 2: Generate tests based on analysis
claude-code --agent test-writer src/module.py

# Step 3: Run and verify tests
claude-code --agent test-runner tests/
```

### Switching Between Agents
```bash
# Start with one agent
claude-code --agent api-doc-generator

# Switch to another for different task
claude-code --agent code-reviewer
```

### Agent Recommendations
Agents should recommend other agents when a request is out of scope:

```
I'm the git-commit-helper agent, focused solely on crafting commit messages.

Your request to refactor this code is outside my scope. 
I recommend using the 'code-refactorer' agent for this task:

  claude-code --agent code-refactorer

Would you like me to help with your commit message instead?
```

---

## Update Strategy (Git Pull Only)

### No CI/CD Required
- Developers maintain agents via `git pull`
- No automated deployments or builds
- No complex update mechanisms
- Simple, manual, developer-controlled

### Update Process
```bash
# Check for updates
cd ~/dotClaude
git fetch origin

# View what's changed
git log HEAD..origin/main --oneline

# Pull latest agents
git pull origin main

# Verify MCP requirements haven't changed
./scripts/check-mcp-requirements.sh --all
```

### Version Management
- Use git tags for versioning: `v1.0.0`, `v1.1.0`
- Changelog in each agent's directory
- Breaking changes clearly documented
- Migration guides when scope changes

---

## MCP Server Management

### Available MCP Servers
Maintain a list of commonly used MCP servers:

```txt
# Core MCP Servers
- filesystem: File system operations
- git: Git repository management
- github: GitHub API integration
- sqlite: Database operations
- postgres: PostgreSQL operations
- puppeteer: Browser automation
- jira: Jira issue tracking
- aws: AWS service integration
- terraform : Hashicorp integration
```

### MCP Installation Guide
Each MCP server should have a quick-start guide:

```markdown
# Installing the Git MCP Server

## Prerequisites
- Node.js 18+
- Git installed

## Installation
npm install -g @modelcontextprotocol/server-git

## Configuration
Add to Claude Code config:
{
  "mcpServers": {
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"]
    }
  }
}

## Verification
claude-code --test-mcp git
```

---

## Best Practices

### 1. Start Small
Begin with the smallest possible scope. You can always expand later.

### 2. Document Boundaries
Be explicit about what the agent does and doesn't do.

### 3. Use Examples
Show 3-5 clear examples of the agent's intended use.

### 4. Fail Gracefully
When a request is out of scope, guide users to the right agent.

### 5. Minimize Dependencies
Only require MCP servers that are absolutely necessary.

### 6. Test in Isolation
Each agent should work independently without requiring other agents running in parralel.

### 7. Version Carefully
Use semantic versioning and document breaking changes clearly.

---

## Getting Started

### Creating a New Agent
```bash
# Use the agent template generator
./scripts/create-agent.sh my-new-agent

# Edit the generated files
cd agents/my-new-agent
vim instructions.md agent.json
```

### Testing an Agent
```bash
# Test locally
claude-code --agent my-new-agent --test

# Verify MCP requirements
./scripts/check-mcp-requirements.sh agents/my-new-agent
```

### Adding to Repository
```bash
# Commit new agent
git add agents/my-new-agent
git commit -m "feat: add my-new-agent for specific task"

# Push for team access
git push origin main
```

---

## Review Criteria

When reviewing new agents, check:

1. **Scope:** Is it focused enough?
2. **Overlap:** Does it duplicate existing agents?
3. **Documentation:** Are boundaries clear?
4. **Examples:** Are there enough use cases?
5. **MCP Dependencies:** Are they minimal and justified?
6. **Naming:** Does the name reflect the limited scope?
7. **Composability:** Can it work with other agents?

---

*Remember: A collection of focused agents is more powerful than one agent trying to do everything.*