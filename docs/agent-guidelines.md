# Agent Design Guidelines

Guidelines for creating well-scoped, maintainable Claude Code agents.

See also: [Roadmap](roadmap.md) | [Project Goals](project-goals.md) | [CHANGELOG](../CHANGELOG.md)

---

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
- `documentation-writer` -  Generates and updates project documentation files


❌ **Bad Examples:**
- `full-stack-developer` - Too broad, tries to do everything
- `project-manager` - Scope creep, unclear boundaries
- `general-assistant` - No specific focus

### 2. Clear Input/Output Contract
Each agent should have well-defined:
- **Input requirements** - What files, context, or data it needs
- **Explanation** - What changes it would like to make and why, always ask for confirmation.
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
    └── instructions.md     # Agent instructions with YAML frontmatter
```

Each agent is a single directory containing one `instructions.md` file. All metadata is declared in YAML frontmatter at the top of the file.

### Instructions Format (instructions.md)

All agents follow the **v2.0.0 canonical template** (see below). The file begins with YAML frontmatter for metadata, followed by the instruction body.

```markdown
---
name: git-commit-agent
version: 2.0.0
description: Assists in writing conventional commit messages
color: green
mcp_servers:
  - filesystem
  - git
---

# Agent: git-commit-agent

## Primary Objective
[One sentence describing what this agent does]

## Scope Boundaries
### This agent DOES:
- [Verb-led specific task 1]
- [Verb-led specific task 2]

### This agent DOES NOT:
- [Out of scope task 1] -> use `other-agent`
- [Out of scope task 2] -> Manual action

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

## Out of Scope Redirects
| Request | Redirect To |
|---------|-------------|
| [Request type] | `other-agent` |
```

---

## v2.0.0 Canonical Template

All agents in this repository must conform to the v2.0.0 canonical template. This ensures consistency, reviewability, and composability across the entire agent collection.

### YAML Frontmatter Fields

Every `instructions.md` must begin with these frontmatter fields:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Agent identifier (matches directory name) |
| `version` | Yes | Semantic version (currently `2.0.0`) |
| `description` | Yes | One-line summary of the agent's purpose |
| `color` | No | Display color for UI integrations |
| `mcp_servers` | No | List of MCP servers the agent requires |

### Required Sections (in order)

The instruction body must follow this exact section order:

1. **Primary Objective** - Single sentence stating what the agent does
2. **Scope Boundaries** - Two subsections:
   - **This agent DOES:** - Verb-led bullet list of in-scope tasks
   - **This agent DOES NOT:** - Redirected bullet list with `-> use \`agent\`` or `-> Manual action`
3. **Required Context** - What inputs, files, or information the agent needs
4. **Workflow** - Numbered steps describing the agent's execution flow
5. **Output Format** - What the agent produces and how it is structured
6. **Error Handling** - How to handle common failure modes
7. **Out of Scope Redirects** - Table mapping off-topic requests to the correct agent

---

## MCP Server Integration

MCP servers are declared in the YAML frontmatter of each agent's `instructions.md` file. No separate requirements files are needed.

### MCP Server Discovery
```bash
# Check what MCP servers an agent needs (declared in frontmatter)
head -20 agents/[agent-name]/instructions.md
```

---

## Agent Scope Categories

To maintain organization, agents fall into one of these 8 categories (42 agents total):

### 1. Backend (3 agents)
- Narrow focus: Server-side code generation and patterns
- Examples: `api-endpoint-agent`, `database-agent`, `backend-coder`

### 2. Code (7 agents)
- Narrow focus: Code analysis, review, and generation
- Examples: `code-reviewer`, `security-reviewer`, `python-coder`, `refactor-agent`

### 3. Data (6 agents)
- Narrow focus: Data processing, transformation, and analysis
- Examples: `csv-analyzer`, `json-transformer`, `data-pipeline-agent`

### 4. Documentation (4 agents)
- Narrow focus: Create and maintain specific documentation types
- Examples: `documentation-agent`, `api-doc-agent`, `changelog-agent`, `doc-review-agent`

### 5. Frontend (4 agents)
- Narrow focus: Client-side code and UI components
- Examples: `react-component-agent`, `css-agent`, `accessibility-agent`

### 6. GitHub (6 agents)
- Narrow focus: Git operations and GitHub workflows
- Examples: `git-commit-agent`, `git-pr-agent`, `git-tags-agent`, `git-problems-agent`

### 7. Infrastructure (9 agents)
- Narrow focus: Internal tooling, setup, and agent management
- Examples: `agent-creator`, `agent-review-agent`, `agent-updater`, `dotclaude-installer`

### 8. Testing (3 agents)
- Narrow focus: Test creation, execution, and coverage
- Examples: `test-writer`, `test-runner`, `test-coverage-agent`

---

## Scope Validation Checklist

Before adding an agent to the repository, verify:

- [ ] Agent has a single, clear purpose (can be described in one sentence)
- [ ] Agent's scope is documented with clear boundaries
- [ ] Agent doesn't overlap significantly with existing agents
- [ ] Agent can be composed with other agents for complex workflows
- [ ] Agent has clear input/output contracts
- [ ] Agent declares all MCP server dependencies in YAML frontmatter
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
# Started as: git-commit-agent
# Now also: formats code, runs tests, pushes to remote, creates PRs
```
**Problem:** Scope expanded beyond original purpose

---

## Working with Multiple Agents

### Sequential Workflows
Use agents in sequence for multi-step tasks:
```bash
# Step 1: Analyze code
claude --agent code-analyzer src/

# Step 2: Generate tests based on analysis
claude --agent test-writer src/module.py

# Step 3: Run and verify tests
claude --agent test-runner tests/
```

### Switching Between Agents
```bash
# Start with one agent
claude --agent api-doc-generator

# Switch to another for different task
claude --agent code-reviewer
```

### Agent Recommendations
Agents should recommend other agents when a request is out of scope:

```
I'm the git-commit-agent agent, focused solely on crafting commit messages.

Your request to refactor this code is outside my scope. 
I recommend using the 'code-refactorer' agent for this task:

  claude --agent code-refactorer

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
claude --test-mcp git
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
Each agent should work independently without requiring other agents running in parallel.

### 7. Version Carefully
Use semantic versioning and document breaking changes clearly.

---

## Getting Started

### Creating a New Agent
```bash
# Use the agent template generator
claude --agent agent-creator

# The agent-creator will scaffold the new agent directory
# with a properly formatted instructions.md file
```

### Testing an Agent
```bash
# Test locally
claude --agent my-new-agent

# Check MCP requirements (declared in frontmatter)
head -20 agents/my-new-agent/instructions.md
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
5. **MCP Dependencies:** Are they minimal, justified, and declared in YAML frontmatter?
6. **Naming:** Does the name reflect the limited scope?
7. **Composability:** Can it work with other agents?
8. **v2.0.0 Compliance:** Does the agent follow the canonical template?
   - Canonical section order (Primary Objective > Scope Boundaries > Required Context > Workflow > Output Format > Error Handling > Out of Scope Redirects)
   - DOES list uses verb-led bullets
   - DOES NOT list redirects to specific agents or "Manual action"
   - Required Context section is present and populated
   - YAML frontmatter includes name, version, and description

---

*Remember: A collection of focused agents is more powerful than one agent trying to do everything.*