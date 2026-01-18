# Agent Creator

> Creates new scoped agents with all required files - **USER-TRIGGERED ONLY**

## ⚠️ Important: User-Triggered Only

This agent **ONLY** activates when you **explicitly request** agent creation. It will NOT create agents autonomously or based on inferred needs.

**Valid requests:**
- "Create an agent for writing commit messages"
- "Make a new agent called test-generator"
- "Help me build an agent that reviews API documentation"

**Won't trigger on:**
- "I need help with documentation" (offers existing agents instead)
- General problem descriptions
- Mentions of what agents could do

## Overview

The Agent Creator helps you design and create new agents that follow the Agent Design Guidelines. It ensures agents are properly scoped, non-overlapping, and follow best practices.

## Usage

### Create a New Agent

```bash
claude-code --agent agent-creator
```

**Then explicitly request creation:**
```
User: "Create an agent that helps organize Python imports"
```

### Interactive Process

The agent will guide you through:

1. **Scope Definition**
   - What the agent does
   - What it doesn't do
   - Clear boundaries

2. **Validation**
   - Check for duplicates
   - Verify single responsibility
   - Ensure no overlap

3. **Design Refinement**
   - Input/output contracts
   - MCP server requirements
   - Category assignment

4. **Confirmation**
   - Review complete design
   - Approve file creation

5. **File Generation**
   - Creates all required files
   - Follows Agent Design Guidelines

## What It Creates

For each agent, creates:

```
agents/your-agent/
├── agent.json              # Metadata and configuration
├── README.md               # User-facing guide
├── instructions.md         # Claude operational instructions
├── mcp-requirements.txt    # MCP server dependencies
└── examples/               # Usage examples directory
```

## What It Does

### Design Assistance
- Guides you through agent design
- Helps define clear scope boundaries
- Validates single responsibility
- Checks for duplicate agents
- Ensures proper categorization

### File Generation
- Creates agent.json with metadata
- Generates comprehensive instructions.md
- Writes user-friendly README.md
- Documents MCP requirements
- Sets up examples directory

### Validation
- Checks Agent Design Guidelines compliance
- Validates scope isn't too broad
- Ensures no overlap with existing agents
- Verifies MCP dependencies are minimal
- Confirms name reflects scope

## What It Doesn't Do

❌ Activate without explicit user request  
❌ Create agents autonomously  
❌ Modify existing agents (without confirmation)  
❌ Generate source code implementations  
❌ Create test files or CI/CD configs  
❌ Skip validation steps  

## Examples

### Example 1: Create Git Commit Helper

```bash
$ claude-code --agent agent-creator

# User explicitly requests:
User: "Create an agent that helps write conventional commit messages"

Agent Creator:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Let's create your agent!

Proposed Design:
Name: git-commit-helper
Purpose: Assists in writing conventional commit messages
Category: Git Workflows

Scope:
  DOES:
  - Analyze staged git changes
  - Suggest commit message format
  - Follow Conventional Commits standard
  
  DOES NOT:
  - Actually commit changes (user runs git commit)
  - Modify git history
  - Generate changelogs (use changelog-agent)

MCP Servers: git, filesystem

Does this match your vision? (y/n)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

User: y

[Validation passes]

[Shows confirmation screen]

Proceed with creation? (y/n): y

✅ Agent created successfully!
Files created in agents/git-commit-helper/
```

### Example 2: Scope Too Broad

```bash
User: "Create an agent for web development"

Agent Creator:
⚠️ Scope Too Broad

"Web development" covers too many tasks.

Let's narrow it down. What specific task?

Examples:
- html-validator: Validates HTML syntax
- css-minifier: Minifies CSS files
- react-component-generator: Generates React components
- api-endpoint-documenter: Documents API endpoints

What specific task should this agent handle?

User: "Generate React components"

Agent Creator: Perfect! Let's create a react-component-generator...
```

### Example 3: Duplicate Detected

```bash
User: "Create an agent that generates README files"

Agent Creator:
⚠️ Agent Already Exists

An agent with this purpose exists:
  Name: readme-agent
  Purpose: Generates comprehensive README.md files
  Location: agents/readme-agent/

Options:
1. Use the existing readme-agent
2. Describe how your agent would differ

What would you like to do?
```

## Agent Creation Process

### 1. Initial Request
You explicitly request agent creation

### 2. Scope Discussion
```
Agent asks:
- What should this agent do?
- What category does it fit?
- What are the boundaries?
```

### 3. Design Refinement
```
Together you define:
- Clear purpose (one sentence)
- What it DOES
- What it DOES NOT do
- Required MCP servers
- Input/output types
```

### 4. Validation
```
Checks:
✓ Single responsibility
✓ No duplicates
✓ Clear boundaries
✓ Minimal dependencies
✓ Follows guidelines
```

### 5. Confirmation
```
Shows complete design
Asks for approval
Lists files to create
```

### 6. Creation
```
Generates all files
Provides next steps
Suggests related agents
```

## Agent Categories

Your agent will fit into one of these:

- **Code Generation**: Generate specific code types
- **Code Analysis**: Analyze for specific issues
- **Documentation**: Create specific doc types
- **Testing**: Handle specific testing tasks
- **Git Workflows**: Specific git operations
- **Refactoring**: Specific refactoring patterns
- **Configuration**: Manage specific configs
- **Infrastructure**: Internal tooling

## MCP Requirements

This agent requires:
- **filesystem**: For creating agent files

### Installing MCP Servers
```bash
# Check status
claude-code --test-mcp filesystem

# Install if needed
claude-code --agent mcp-configurator
```

## Validation Rules

The agent validates:

### Scope Rules
- [ ] One-sentence purpose description
- [ ] Clear DOES/DOES NOT boundaries
- [ ] Fits single responsibility principle
- [ ] No overlap with existing agents
- [ ] Can compose with other agents

### Naming Rules
- [ ] Lowercase with hyphens
- [ ] Reflects narrow scope
- [ ] Not too generic
- [ ] Descriptive of function

### Dependency Rules
- [ ] Minimal MCP servers
- [ ] Each MCP justified
- [ ] No unnecessary dependencies

## Tips for Best Results

### 1. Be Specific
```
❌ "Create an agent for Python"
✅ "Create an agent that adds type hints to Python functions"
```

### 2. Think Narrow
```
❌ "Create an agent for testing"
✅ "Create an agent that generates unit test stubs"
```

### 3. One Responsibility
```
❌ Agent that: generates code, tests it, and documents it
✅ Agent that: generates code (use other agents for testing/docs)
```

### 4. Check for Duplicates
Before requesting, check if an agent exists:
```bash
ls agents/
```

### 5. Define Boundaries
Know what the agent should NOT do:
```
DOES: Write docstrings
DOES NOT: Generate code, run tests, create docs
```

## Troubleshooting

### "This isn't an explicit agent creation request"
**Cause:** You described a need but didn't ask to create an agent  
**Solution:** Explicitly say "Create an agent that..."

### "Agent scope is too broad"
**Cause:** Agent tries to do too many things  
**Solution:** Narrow to one specific task

### "Duplicate agent detected"
**Cause:** Similar agent already exists  
**Solution:** Use existing agent or modify scope to differentiate

### "Missing required information"
**Cause:** Need more details about agent purpose  
**Solution:** Answer the questions about scope and boundaries

## Design Principles

### Single Responsibility
Each agent does ONE thing well

### Composability
Agents work together, not in isolation

### Clear Boundaries
Explicit about what's in/out of scope

### Minimal Dependencies
Only essential MCP servers

### User Control
YOU decide when agents are created

## Related Agents

- **readme-agent**: Generate README files
- **changelog-agent**: Generate changelogs
- **doc-review-agent**: Review documentation
- **mcp-configurator**: Configure MCP servers

## Safety Features

### User Confirmation Required
Never creates files without your approval

### Validation Checks
Ensures agents follow guidelines

### Duplicate Detection
Won't create overlapping agents

### Explicit Triggering
Only activates when you request it

## Version
Current version: 1.0.0

## Contributing

This agent follows the [Agent Design Guidelines](../../AGENT_GUIDELINES.md).

To suggest improvements:
1. Use the agent and note issues
2. Document what could be better
3. Submit feedback following guidelines

## License
Part of the Agent Infrastructure Repository