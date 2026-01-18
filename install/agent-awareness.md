# Claude Code Custom Instructions - Agent-Aware Configuration

## Purpose
These instructions make Claude Code automatically aware of available agents and guide it to recommend appropriate agents when user requests match agent capabilities.

---

## How to Use

### Method 1: Claude Code Custom Instructions (Recommended)
Add these instructions to your Claude Code configuration:

**Location:** `~/.claude-code/custom-instructions.md` or project-level `.claude/instructions.md`

**Contents:**
```markdown
# Agent Infrastructure Integration

You have access to a library of focused, scoped agents in the `agents/` directory. Before attempting tasks yourself, ALWAYS check if an appropriate agent exists.

## Available Agent Categories

### Documentation Agents
- **readme-agent**: Generate or update README.md files
  - Trigger: User asks to create/update README, project documentation, getting started guide
  - Usage: `claude-code --agent readme-agent`

- **changelog-agent**: Generate or update CHANGELOG.md from git history
  - Trigger: User asks for changelog, release notes, version history
  - Usage: `claude-code --agent changelog-agent`

- **doc-review-agent**: Review documentation quality
  - Trigger: User asks to review docs, check documentation, improve README
  - Usage: `claude-code --agent doc-review-agent [file]`

### Infrastructure Agents
- **agent-creator**: Create new scoped agents (USER MUST EXPLICITLY REQUEST)
  - Trigger: ONLY when user explicitly says "create an agent for..."
  - Usage: `claude --agent agent-creator`

- **dotclaude-updater**: Update and verify dotClaude installation
  - Trigger: User wants to update agents or check for updates
  - Usage: `claude --agent dotclaude-updater`

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
Usage: claude-code --agent [agent-name]

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

Before responding to documentation, git, or infrastructure tasks:

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
Usage: claude-code --agent readme-agent

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
❌ WRONG - Always ask user first
```

## Agent Categories Reference

Quickly identify which category a request belongs to:

| User Request Contains... | Likely Agent Category | Check These Agents |
|-------------------------|----------------------|-------------------|
| "README", "project docs", "getting started" | Documentation | readme-agent |
| "changelog", "release notes", "version history" | Documentation | changelog-agent |
| "review docs", "check documentation" | Documentation | doc-review-agent |
| "create agent", "new agent", "build agent" | Infrastructure | agent-creator |
| "update dotClaude", "update agents" | Infrastructure | dotclaude-updater |
| "commit message", "git commit" | Git Workflows | git-commit-agent |
| "write tests", "test cases" | Testing | (not yet created) |

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
3. doc-review-agent - Review quality

Should I:
a) Use all three agents in sequence
b) Start with just README (readme-agent)
c) Help you directly

What would you prefer?"
```

### Agent Recommendation with Fallback
```
User: "Generate API documentation"

Claude: "I don't see a specialized api-doc-generator agent yet.

Options:
1. I can help you directly with API documentation
2. If you want a dedicated agent for this, I can help you create one
   (say "create an agent for API documentation")

Which would you prefer?"
```

## Summary

### DO:
✅ Check for relevant agents before starting tasks
✅ Recommend agents when they match user needs
✅ Explain why an agent is better for the task
✅ Give user choice between agent and general help
✅ Use agents for their specific, scoped purposes

### DON'T:
❌ Switch to agents without asking
❌ Recommend agents for out-of-scope tasks
❌ Create agents autonomously (agent-creator only)
❌ Force agent usage on users
❌ Ignore agents when they're perfect for the task
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
    "agent-creator": {
      "triggers": ["create agent", "new agent", "build agent"],
      "auto_suggest": false,
      "requires_explicit": true
    }
  }
}
```

---

## Method 3: Shell Alias with Agent Check
Create a smart wrapper that checks for agents:

```bash
#!/bin/bash
# Save as: ~/bin/cc (claude-code wrapper)

check_for_agent() {
    local request="$1"
    
    # Check for documentation requests
    if echo "$request" | grep -qi "readme\|project doc"; then
        echo "💡 Tip: Use 'claude-code --agent readme-agent' for README generation"
        read -p "Use readme-agent? (y/n): " use_agent
        if [ "$use_agent" = "y" ]; then
            claude-code --agent readme-agent
            exit 0
        fi
    fi
    
    if echo "$request" | grep -qi "changelog\|release notes"; then
        echo "💡 Tip: Use 'claude-code --agent changelog-agent' for changelogs"
        read -p "Use changelog-agent? (y/n): " use_agent
        if [ "$use_agent" = "y" ]; then
            claude-code --agent changelog-agent
            exit 0
        fi
    fi
    
    # Add more checks for other agents...
}

# Check if this looks like an agent task
if [ $# -gt 0 ]; then
    check_for_agent "$*"
fi

# Otherwise, run normal claude-code
claude-code "$@"
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
    echo "📚 Documentation files changed!"
    echo ""
    echo "Consider using agents to maintain quality:"
    echo "  - doc-review-agent: Review your changes"
    echo "  - changelog-agent: Update CHANGELOG.md"
    echo ""
    read -p "Review docs now? (y/n): " review
    if [ "$review" = "y" ]; then
        claude-code --agent doc-review-agent README.md
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
   - Copy custom instructions to `~/.claude-code/custom-instructions.md`
   - Or add to project `.claude/instructions.md`

3. **Test Agent Awareness:**
   ```bash
   # Ask Claude Code about documentation
   claude-code
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

Last Updated: [Date]

## Documentation
- readme-agent (v1.0.0)
- changelog-agent (v1.0.0)
- doc-review-agent (v1.0.0)

## Infrastructure
- agent-creator (v1.0.0)
- dotclaude-updater (v1.0.0)

## Git Workflows
- git-commit-agent (v1.0.0)

## Code Quality
- code-cleanup-agent (v1.0.0)

## [Other Categories]
...
```

---

## Notes

- These instructions integrate with Claude Code's existing capabilities
- Agents are recommended, not forced
- User always has final choice
- Maintains transparency about agent usage
- Follows the principle of "agents when appropriate, general help when needed"