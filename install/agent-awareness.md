# Claude Code Custom Instructions - Agent-Aware Configuration

## Purpose
These instructions make Claude Code automatically aware of available agents and guide it to recommend appropriate agents when user requests match agent capabilities.

---

## How to Use

### Method 1: Claude Code Custom Instructions (Recommended)
Add these instructions to your Claude Code configuration:

**Location:** `~/.claude/CLAUDE.md` or project-level `.claude/instructions.md`

**Contents:**
```markdown
# Agent Infrastructure Integration

You have access to a library of focused, scoped agents in the `agents/` directory. Before attempting tasks yourself, ALWAYS check if an appropriate agent exists.

## Available Agent Categories

### GitHub Agents
- **git-commit-agent**: Suggest conventional commit messages
  - Trigger: User asks for commit message help, conventional commits, commit formatting
  - Usage: `claude --agent git-commit-agent`

- **git-pr-agent**: Create and manage pull requests
  - Trigger: User asks to create a PR, review PR, pull request help
  - Usage: `claude --agent git-pr-agent`

- **git-tags-agent**: Manage git tags and releases
  - Trigger: User asks about tagging, versioning, release tags
  - Usage: `claude --agent git-tags-agent`

- **git-issues-agent**: Create and manage GitHub issues
  - Trigger: User asks to create issues, triage issues, issue templates
  - Usage: `claude --agent git-issues-agent`

- **git-sync-agent**: Sync branches and manage remotes
  - Trigger: User asks to sync branches, rebase, merge, manage remotes
  - Usage: `claude --agent git-sync-agent`

### Documentation Agents
- **readme-agent**: Generate or update README.md files
  - Trigger: User asks to create/update README, project documentation, getting started guide
  - Usage: `claude --agent readme-agent`

- **changelog-agent**: Generate or update CHANGELOG.md from git history
  - Trigger: User asks for changelog, release notes, version history
  - Usage: `claude --agent changelog-agent`

- **doc-review-agent**: Review documentation quality
  - Trigger: User asks to review docs, check documentation, improve README
  - Usage: `claude --agent doc-review-agent [file]`

- **api-doc-agent**: Generate API documentation
  - Trigger: User asks for API docs, endpoint documentation, API reference
  - Usage: `claude --agent api-doc-agent`

### Code Agents
- **code-cleanup-agent**: Clean up and refactor code
  - Trigger: User asks to clean up code, remove dead code, refactor
  - Usage: `claude --agent code-cleanup-agent`

- **code-review-agent**: Review code for quality and best practices
  - Trigger: User asks for code review, quality check, best practices review
  - Usage: `claude --agent code-review-agent`

- **code-linting-agent**: Lint and format code
  - Trigger: User asks to lint code, fix formatting, enforce style
  - Usage: `claude --agent code-linting-agent`

- **dependency-agent**: Manage project dependencies
  - Trigger: User asks about dependencies, outdated packages, vulnerability audit
  - Usage: `claude --agent dependency-agent`

- **python-agent**: Python-specific development tasks
  - Trigger: User asks for Python help, virtual environments, packaging
  - Usage: `claude --agent python-agent`

- **terraform-agent**: Terraform infrastructure-as-code tasks
  - Trigger: User asks about Terraform, infrastructure provisioning, HCL
  - Usage: `claude --agent terraform-agent`

### Testing Agents
- **debug-agent**: Debug and troubleshoot issues
  - Trigger: User asks to debug, troubleshoot, find root cause
  - Usage: `claude --agent debug-agent`

- **unit-test-agent**: Generate and manage unit tests
  - Trigger: User asks to write tests, add test coverage, unit testing
  - Usage: `claude --agent unit-test-agent`

- **integration-test-agent**: Generate and manage integration tests
  - Trigger: User asks for integration tests, end-to-end tests, test workflows
  - Usage: `claude --agent integration-test-agent`

### Infrastructure Agents
- **agent-creator**: Create new scoped agents (USER MUST EXPLICITLY REQUEST)
  - Trigger: ONLY when user explicitly says "create an agent for..."
  - Usage: `claude --agent agent-creator`

- **dotclaude-updater**: Update and verify dotClaude installation
  - Trigger: User wants to update agents or check for updates
  - Usage: `claude --agent dotclaude-updater`

- **agent-updater**: Update existing agent instructions and configuration
  - Trigger: User asks to update an agent, modify agent behavior
  - Usage: `claude --agent agent-updater`

- **agent-review-agent**: Review agent quality and compliance
  - Trigger: User asks to review an agent, audit agent instructions
  - Usage: `claude --agent agent-review-agent`

## Agent Usage Rules

### ALWAYS Recommend Agents When:
1. User request matches an agent's scope exactly
2. Agent can complete the task better than general approach
3. Task is within an agent's documented capabilities

### Recommendation Format:
```
I can help with [task], but we have a specialized agent for this:

Agent: [agent-name]
Purpose: [what it does]
Usage: claude --agent [agent-name]

This agent is optimized for [specific reason].

Would you like me to:
1. Use the [agent-name] agent (recommended)
2. Help you directly (general approach)
```

### DO NOT Recommend Agents When:
- Task is outside agent scope
- Request needs general Claude Code capabilities
- User specifically asks NOT to use agents
- Task requires multiple tools beyond agent's scope

### NEVER Autonomously Switch to Agents:
- Always ask user if they want to use the agent
- Explain why the agent is recommended
- Give user choice between agent and general help

## Agent Discovery

Before responding to documentation, git, code, testing, or infrastructure tasks:

1. Check: Does an agent exist for this? (`ls agents/`)
2. Read: What does the agent do? (`cat agents/[name]/README.md`)
3. Recommend: Is this the best tool? (suggest agent)
4. Proceed: Use agent or provide general help based on user choice

## Example Interactions

### Good - Recommends Agent
```
User: "Can you help me create a README for my project?"

Claude: "I can help with that! We have a specialized readme-agent that's
optimized for this:

Agent: readme-agent
Purpose: Generates comprehensive README.md files by analyzing project structure
Usage: claude --agent readme-agent

This agent will:
- Detect your project type automatically
- Generate appropriate sections
- Include installation instructions
- Add usage examples

Would you like me to use the readme-agent? (y/n)"
```

### Good - Asks Before Using
```
User: "Update my changelog with recent commits"

Claude: "Perfect! The changelog-agent is designed exactly for this task.

It will:
- Parse your git history
- Follow Keep a Changelog format
- Categorize changes automatically
- Add to existing CHANGELOG.md

Use the changelog-agent? (y/n)"
```

### Good - Recommends Available Agent
```
User: "Generate API documentation"

Claude: "We have a specialized api-doc-agent for this:

Agent: api-doc-agent
Purpose: Generate API documentation from your codebase
Usage: claude --agent api-doc-agent

Would you like to use the api-doc-agent? (y/n)"
```

### Good - No Agent Available
```
User: "Refactor this function to use async/await"

Claude: "I'll help you refactor this. (No specialized agent exists for
this task, so I'll assist directly.)"

[Proceeds with refactoring]
```

### Bad - Switches Without Asking
```
User: "Can you help me create a README?"

Claude: [Immediately switches to readme-agent without asking]
WRONG - Always ask user first
```

## Agent Categories Reference

Quickly identify which category a request belongs to:

| User Request Contains... | Likely Agent Category | Check These Agents |
|-------------------------|----------------------|-------------------|
| "README", "project docs", "getting started" | Documentation | readme-agent |
| "changelog", "release notes", "version history" | Documentation | changelog-agent |
| "review docs", "check documentation" | Documentation | doc-review-agent |
| "API docs", "endpoint documentation" | Documentation | api-doc-agent |
| "commit message", "git commit" | GitHub | git-commit-agent |
| "pull request", "PR" | GitHub | git-pr-agent |
| "git tag", "release tag", "versioning" | GitHub | git-tags-agent |
| "github issue", "create issue" | GitHub | git-issues-agent |
| "sync branch", "rebase", "merge" | GitHub | git-sync-agent |
| "clean up code", "refactor" | Code | code-cleanup-agent |
| "code review", "quality check" | Code | code-review-agent |
| "lint", "format code", "style" | Code | code-linting-agent |
| "dependencies", "packages", "vulnerability" | Code | dependency-agent |
| "python", "pip", "virtual env" | Code | python-agent |
| "terraform", "infrastructure", "HCL" | Code | terraform-agent |
| "debug", "troubleshoot", "root cause" | Testing | debug-agent |
| "unit test", "test coverage" | Testing | unit-test-agent |
| "integration test", "e2e test" | Testing | integration-test-agent |
| "create agent", "new agent", "build agent" | Infrastructure | agent-creator |
| "update dotClaude", "update agents" | Infrastructure | dotclaude-updater |
| "update agent", "modify agent" | Infrastructure | agent-updater |
| "review agent", "audit agent" | Infrastructure | agent-review-agent |

## Special Case: agent-creator

The agent-creator has STRICT triggering rules:

**MUST have explicit request:**
- "Create an agent for [purpose]"
- "Make a new agent that [does X]"
- "Build an agent to [task]"

**MUST NOT trigger on:**
- "I need help with [task]" (offer existing agents instead)
- "How do I [task]?" (general help)
- Inferred needs (NEVER autonomous agent creation)

## Checking Available Agents

To see what agents are available:
```bash
ls agents/
```

To read an agent's capabilities:
```bash
cat agents/[agent-name]/README.md
```

To check MCP requirements:
```bash
cat agents/[agent-name]/mcp-requirements.txt
```

## Integration Examples

### Multi-Agent Workflow
```
User: "I need to document my project"

Claude: "I can help set up complete documentation:

1. readme-agent - Create README.md
2. changelog-agent - Generate CHANGELOG.md
3. api-doc-agent - Generate API documentation
4. doc-review-agent - Review quality

Should I:
a) Use all four agents in sequence
b) Start with just README (readme-agent)
c) Help you directly

What would you prefer?"
```

### Multi-Agent Code Quality Workflow
```
User: "Help me improve code quality"

Claude: "We have several agents that can help:

1. code-review-agent - Review code for quality and best practices
2. code-linting-agent - Fix formatting and style issues
3. code-cleanup-agent - Refactor and remove dead code
4. unit-test-agent - Add test coverage

Should I:
a) Run all agents in sequence (recommended)
b) Start with a specific agent
c) Help you directly

What would you prefer?"
```

## Summary

### DO:
- Check for relevant agents before starting tasks
- Recommend agents when they match user needs
- Explain why an agent is better for the task
- Give user choice between agent and general help
- Use agents for their specific, scoped purposes

### DON'T:
- Switch to agents without asking
- Recommend agents for out-of-scope tasks
- Create agents autonomously (agent-creator only)
- Force agent usage on users
- Ignore agents when they're perfect for the task
```

---

## Method 2: Project-Level Configuration
Create a `.claude/agents.json` in your project:

```json
{
  "agent_awareness": true,
  "auto_recommend": true,
  "agents": {
    "readme-agent": {
      "triggers": ["readme", "project documentation", "getting started"],
      "auto_suggest": true
    },
    "changelog-agent": {
      "triggers": ["changelog", "release notes", "version history"],
      "auto_suggest": true
    },
    "doc-review-agent": {
      "triggers": ["review docs", "check documentation", "improve readme"],
      "auto_suggest": true
    },
    "api-doc-agent": {
      "triggers": ["api docs", "endpoint documentation", "api reference"],
      "auto_suggest": true
    },
    "git-commit-agent": {
      "triggers": ["commit message", "conventional commit"],
      "auto_suggest": true
    },
    "git-pr-agent": {
      "triggers": ["pull request", "create pr"],
      "auto_suggest": true
    },
    "git-tags-agent": {
      "triggers": ["git tag", "release tag", "versioning"],
      "auto_suggest": true
    },
    "git-issues-agent": {
      "triggers": ["github issue", "create issue", "triage"],
      "auto_suggest": true
    },
    "git-sync-agent": {
      "triggers": ["sync branch", "rebase", "merge"],
      "auto_suggest": true
    },
    "code-cleanup-agent": {
      "triggers": ["clean up", "refactor", "dead code"],
      "auto_suggest": true
    },
    "code-review-agent": {
      "triggers": ["code review", "quality check"],
      "auto_suggest": true
    },
    "code-linting-agent": {
      "triggers": ["lint", "format", "style"],
      "auto_suggest": true
    },
    "dependency-agent": {
      "triggers": ["dependencies", "packages", "vulnerability"],
      "auto_suggest": true
    },
    "python-agent": {
      "triggers": ["python", "pip", "virtual env"],
      "auto_suggest": true
    },
    "terraform-agent": {
      "triggers": ["terraform", "infrastructure", "hcl"],
      "auto_suggest": true
    },
    "debug-agent": {
      "triggers": ["debug", "troubleshoot", "root cause"],
      "auto_suggest": true
    },
    "unit-test-agent": {
      "triggers": ["unit test", "test coverage", "write tests"],
      "auto_suggest": true
    },
    "integration-test-agent": {
      "triggers": ["integration test", "e2e test", "end to end"],
      "auto_suggest": true
    },
    "agent-creator": {
      "triggers": ["create agent", "new agent", "build agent"],
      "auto_suggest": false,
      "requires_explicit": true
    },
    "dotclaude-updater": {
      "triggers": ["update dotclaude", "update agents", "check updates"],
      "auto_suggest": true
    },
    "agent-updater": {
      "triggers": ["update agent", "modify agent"],
      "auto_suggest": true
    },
    "agent-review-agent": {
      "triggers": ["review agent", "audit agent"],
      "auto_suggest": true
    }
  }
}
```

---

## Method 3: Shell Alias with Agent Check
Create a smart wrapper that checks for agents:

```bash
#!/bin/bash
# Save as: ~/bin/cc (claude wrapper)

check_for_agent() {
    local request="$1"

    # Check for documentation requests
    if echo "$request" | grep -qi "readme\|project doc"; then
        echo "Tip: Use 'claude --agent readme-agent' for README generation"
        read -p "Use readme-agent? (y/n): " use_agent
        if [ "$use_agent" = "y" ]; then
            claude --agent readme-agent
            exit 0
        fi
    fi

    if echo "$request" | grep -qi "changelog\|release notes"; then
        echo "Tip: Use 'claude --agent changelog-agent' for changelogs"
        read -p "Use changelog-agent? (y/n): " use_agent
        if [ "$use_agent" = "y" ]; then
            claude --agent changelog-agent
            exit 0
        fi
    fi

    if echo "$request" | grep -qi "commit message\|git commit"; then
        echo "Tip: Use 'claude --agent git-commit-agent' for commit messages"
        read -p "Use git-commit-agent? (y/n): " use_agent
        if [ "$use_agent" = "y" ]; then
            claude --agent git-commit-agent
            exit 0
        fi
    fi

    if echo "$request" | grep -qi "pull request\|create pr"; then
        echo "Tip: Use 'claude --agent git-pr-agent' for pull requests"
        read -p "Use git-pr-agent? (y/n): " use_agent
        if [ "$use_agent" = "y" ]; then
            claude --agent git-pr-agent
            exit 0
        fi
    fi

    if echo "$request" | grep -qi "code review\|review code"; then
        echo "Tip: Use 'claude --agent code-review-agent' for code reviews"
        read -p "Use code-review-agent? (y/n): " use_agent
        if [ "$use_agent" = "y" ]; then
            claude --agent code-review-agent
            exit 0
        fi
    fi

    if echo "$request" | grep -qi "unit test\|write test"; then
        echo "Tip: Use 'claude --agent unit-test-agent' for unit tests"
        read -p "Use unit-test-agent? (y/n): " use_agent
        if [ "$use_agent" = "y" ]; then
            claude --agent unit-test-agent
            exit 0
        fi
    fi

    if echo "$request" | grep -qi "debug\|troubleshoot"; then
        echo "Tip: Use 'claude --agent debug-agent' for debugging"
        read -p "Use debug-agent? (y/n): " use_agent
        if [ "$use_agent" = "y" ]; then
            claude --agent debug-agent
            exit 0
        fi
    fi

    # Add more checks for other agents as needed...
}

# Check if this looks like an agent task
if [ $# -gt 0 ]; then
    check_for_agent "$*"
fi

# Otherwise, run normal claude
claude "$@"
```

---

## Method 4: Pre-Commit Hook for Documentation
Automatically suggest doc agents when relevant files change:

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check if README or docs changed
if git diff --cached --name-only | grep -q "README\|CHANGELOG"; then
    echo ""
    echo "Documentation files changed!"
    echo ""
    echo "Consider using agents to maintain quality:"
    echo "  - doc-review-agent: Review your changes"
    echo "  - changelog-agent: Update CHANGELOG.md"
    echo ""
    read -p "Review docs now? (y/n): " review
    if [ "$review" = "y" ]; then
        claude --agent doc-review-agent README.md
    fi
fi
```

---

## Implementation Steps

1. **Choose Your Method:**
   - Custom Instructions (simplest, most flexible)
   - Project Config (project-specific)
   - Shell Wrapper (system-wide)
   - Git Hooks (automated checks)

2. **Add Instructions:**
   - Copy custom instructions to `~/.claude/CLAUDE.md`
   - Or add to project `.claude/instructions.md`

3. **Test Agent Awareness:**
   ```bash
   # Ask Claude Code about documentation
   claude
   > "Help me create a README"

   # Should recommend readme-agent
   ```

4. **Verify Behavior:**
   - Claude should check for agents
   - Claude should recommend appropriate agents
   - Claude should ask before switching
   - Claude should explain why agent is better

---

## Expected Behavior After Implementation

### Before (Without Instructions)
```
User: "Create a README"
Claude: [Directly starts writing README]
```

### After (With Instructions)
```
User: "Create a README"
Claude: "I can help! We have a specialized readme-agent for this:

The readme-agent will:
- Analyze your project structure
- Detect dependencies automatically
- Generate appropriate sections

Use readme-agent? (y/n)"
```

---

## Maintenance

### Adding New Agents
When new agents are created, update the custom instructions:

1. Add to appropriate category
2. Define triggers
3. Document usage
4. Test recommendations

### Agent Registry
Keep a living document of all agents:

```markdown
# Available Agents

Last Updated: 2026-01-31

## GitHub (5 agents)
- git-commit-agent
- git-pr-agent
- git-tags-agent
- git-issues-agent
- git-sync-agent

## Documentation (4 agents)
- readme-agent
- changelog-agent
- doc-review-agent
- api-doc-agent

## Code (6 agents)
- code-cleanup-agent
- code-review-agent
- code-linting-agent
- dependency-agent
- python-agent
- terraform-agent

## Testing (3 agents)
- debug-agent
- unit-test-agent
- integration-test-agent

## Infrastructure (4 agents)
- agent-creator
- dotclaude-updater
- agent-updater
- agent-review-agent

Total: 22 agents across 5 categories
```

---

## Notes

- These instructions integrate with Claude Code's existing capabilities
- Agents are recommended, not forced
- User always has final choice
- Maintains transparency about agent usage
- Follows the principle of "agents when appropriate, general help when needed"
