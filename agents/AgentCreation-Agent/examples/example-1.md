# Agent Creator Examples

## Example 1: Valid Agent Creation - Git Commit Helper

### User Request (Explicit)
```
User: "Create an agent that helps me write better git commit messages"
```

### Agent Creator Response
```
Great! Let's create a git commit message helper agent.

I need some details:

1. What specific aspects of commit messages should it help with?
   - Conventional commits format?
   - Commit message length?
   - Breaking change detection?
   - All of the above?

2. What should it NOT do?
   - Actually commit changes?
   - Modify git history?
   - Generate changelogs?

Let me know and I'll design the agent!
```

### User Response
```
User: "It should help format messages in conventional commits style and 
suggest the right type (feat, fix, etc.) based on the changes. It should 
NOT actually commit or modify git history."
```

### Agent Creator Designs
```
Perfect! Here's the design:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 AGENT DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: git-commit-helper
Purpose: Assists in writing conventional commit messages based on staged changes
Category: Git Workflows
Version: 1.0.0

Scope Boundaries:
  ✓ DOES:
    - Analyze git staged changes
    - Suggest commit type (feat, fix, docs, etc.)
    - Recommend commit message format
    - Follow Conventional Commits standard
    - Suggest scope based on changed files
    - Detect breaking changes
  
  ✗ DOES NOT:
    - Execute git commit command
    - Modify git history or commits
    - Generate changelogs (use changelog-agent)
    - Stage or unstage files
    - Create git tags

Requirements:
  • MCP Servers: git, filesystem
  • Input Types: git diff, staged files, git status
  • Output Types: commit message suggestions, format recommendations

Validation:
  ✓ Single responsibility (commit message assistance only)
  ✓ No overlap with existing agents
  ✓ Clear boundaries
  ✓ Minimal MCP dependencies
  ✓ Follows Agent Design Guidelines

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Does this match your vision? (y/n):
```

### User Confirms
```
User: "Yes, perfect!"
```

### Agent Creator Creates Files
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CREATING AGENT FILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Creating: agents/git-commit-helper/agent.json ✓
Creating: agents/git-commit-helper/README.md ✓
Creating: agents/git-commit-helper/instructions.md ✓
Creating: agents/git-commit-helper/mcp-requirements.txt ✓
Creating: agents/git-commit-helper/examples/ ✓

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Agent Created Successfully!

Location: agents/git-commit-helper/

Files created:
  📄 agent.json (metadata)
  📄 README.md (user guide) 
  📄 instructions.md (operational instructions)
  📄 mcp-requirements.txt (MCP dependencies)
  📁 examples/ (usage examples)

Next Steps:
1. Review the generated files
2. Add examples in examples/ directory
3. Install MCP servers:
   - git: npm install -g @modelcontextprotocol/server-git
   - filesystem: (usually pre-installed)
4. Test the agent:
   claude-code --agent git-commit-helper
5. Add to version control:
   git add agents/git-commit-helper
   git commit -m "feat(agents): add git-commit-helper agent"

Related Agents:
  - changelog-agent: Generate CHANGELOG.md from commits
  - doc-review-agent: Review commit message quality

Would you like me to:
- Generate example usage scenarios?
- Help configure the MCP servers?
- Create a test commit message to try it out?
```

---

## Example 2: Invalid - Not Explicit Request

### User Statement (Not a Request)
```
User: "I'm having trouble with my documentation"
```

### Agent Creator Response (Does NOT Create Agent)
```
I can help with documentation! Here are existing agents that might help:

📚 Documentation Agents:
  - readme-agent: Generates comprehensive README.md files
  - changelog-agent: Creates CHANGELOG.md from git history
  - doc-review-agent: Reviews documentation quality and completeness

Which of these would help with your documentation issue?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you'd like me to CREATE A NEW AGENT specifically for a documentation 
task that these don't cover, please explicitly request it:

Example: "Create an agent that generates API documentation"

Would you like to use an existing agent or create a new one?
```

---

## Example 3: Scope Too Broad

### User Request
```
User: "Create an agent for Python development"
```

### Agent Creator Response
```
⚠️ Scope Too Broad

"Python development" covers many different tasks. Let's narrow this to 
a single, focused responsibility.

What SPECIFIC Python development task should this agent handle?

Examples of well-scoped Python agents:
  - python-docstring-writer: Adds docstrings to functions/classes
  - python-test-generator: Creates pytest test stubs
  - python-type-hint-adder: Adds type hints to function signatures
  - python-import-organizer: Organizes and sorts import statements
  - python-requirements-updater: Updates requirements.txt with latest versions

Or describe your own specific task:
  "Create an agent that [one specific task]"

What specific Python task should this agent focus on?
```

### User Clarifies
```
User: "Create an agent that adds docstrings to Python functions"
```

### Agent Creator Proceeds
```
Perfect! That's a well-scoped task.

Let's design the python-docstring-writer agent:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 AGENT DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: python-docstring-writer
Purpose: Generates and adds docstrings to Python functions and classes
Category: Code Generation
Version: 1.0.0

Scope Boundaries:
  ✓ DOES:
    - Analyze Python function/class signatures
    - Generate Google-style or NumPy-style docstrings
    - Include parameter descriptions
    - Include return type descriptions
    - Add docstrings to existing functions
  
  ✗ DOES NOT:
    - Modify function logic or implementation
    - Add type hints (use python-type-hint-adder)
    - Generate tests (use python-test-generator)
    - Format code (use code formatter)
    - Analyze code quality (use code-reviewer)

Requirements:
  • MCP Servers: filesystem
  • Input Types: Python files, function definitions
  • Output Types: Python files with docstrings added

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Proceed? (y/n):
```

---

## Example 4: Duplicate Agent Detected

### User Request
```
User: "Create an agent that generates README files for projects"
```

### Agent Creator Response
```
⚠️ Duplicate Agent Detected

An agent with this exact purpose already exists:

  Name: readme-agent
  Purpose: Generates comprehensive README.md files for projects
  Location: agents/readme-agent/
  
  Capabilities:
    - Analyzes project structure
    - Detects project type and dependencies
    - Generates standard README sections
    - Updates existing README files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Options:
1. Use the existing readme-agent
2. If your needs differ, describe how your agent would be different
3. Suggest enhancements to the existing readme-agent

What would you like to do?
```

### User Response Option A: Use Existing
```
User: "Oh, I'll just use the existing one. Thanks!"

Agent Creator:
Great! You can use it like this:
  claude-code --agent readme-agent

Check out the guide: agents/readme-agent/README.md
```

### User Response Option B: Different Scope
```
User: "I want one that specifically generates README for Docker projects 
with container documentation"

Agent Creator:
That's a valid specialized scope! Let's create:

Name: docker-readme-generator
Purpose: Generates README.md files specifically for Docker projects with 
         container documentation
Category: Documentation

This is different because it:
  - Focuses ONLY on Docker projects
  - Includes container-specific sections (images, volumes, networks)
  - Documents Docker Compose services
  - Adds Docker-specific setup instructions

The general readme-agent handles all project types.
Your docker-readme-generator will be a specialized variant.

Proceed with creation? (y/n):
```

---

## Example 5: Missing Information

### User Request
```
User: "Create an agent for testing"
```

### Agent Creator Response
```
I need more specific information about this testing agent.

"Testing" is too broad. What specific testing task should it handle?

Please answer these questions:

1. What programming language?
   - Python (pytest)
   - JavaScript (Jest)
   - Go (go test)
   - Language-agnostic?

2. What type of tests?
   - Unit tests
   - Integration tests
   - E2E tests
   - All types?

3. What exactly should it do?
   - Generate test stubs
   - Write test assertions
   - Analyze test coverage
   - Run tests and report?

Example specific scopes:
  "Create an agent that generates pytest unit test stubs for Python functions"
  "Create an agent that writes Jest test cases for React components"
  "Create an agent that analyzes test coverage gaps"

What specific testing task should this agent handle?
```

---

## Example 6: Interactive Refinement

### Initial Request
```
User: "Create an agent that helps with API documentation"
```

### Agent Creator Asks Questions
```
Good start! Let's refine the scope.

API documentation can mean different things:

1. What format?
   - OpenAPI/Swagger specs
   - Markdown documentation
   - Inline code comments
   - Generated HTML docs

2. What should it document?
   - REST endpoints
   - GraphQL schemas
   - gRPC services
   - WebSocket events

3. What should it generate?
   - Complete documentation from code
   - Update existing docs
   - Extract from comments
   - All of the above?

What specific combination are you thinking?
```

### User Clarifies
```
User: "I want it to generate OpenAPI/Swagger specs from Express.js route definitions"
```

### Agent Creator Designs
```
Perfect! Very specific scope.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 AGENT DESIGN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: openapi-generator-express
Purpose: Generates OpenAPI/Swagger specifications from Express.js route definitions
Category: Documentation
Version: 1.0.0

Scope Boundaries:
  ✓ DOES:
    - Parse Express.js route files
    - Extract endpoint definitions (GET, POST, etc.)
    - Generate OpenAPI 3.0 spec
    - Document request/response schemas
    - Include middleware authentication info
  
  ✗ DOES NOT:
    - Generate docs for other frameworks (create separate agents)
    - Write inline code comments (use doc-comment-writer)
    - Test API endpoints (use api-test-generator)
    - Deploy or publish specs
    - Modify route implementations

Requirements:
  • MCP Servers: filesystem
  • Input Types: Express.js route files, JavaScript/TypeScript
  • Output Types: openapi.json or openapi.yaml

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is nicely scoped! Proceed? (y/n):
```

---

## Example 7: User Requests Modification

### User Request
```
User: "Modify the readme-agent to also generate CHANGELOG files"
```

### Agent Creator Response (Does NOT Modify)
```
⚠️ Scope Violation

This would violate the single responsibility principle.

The readme-agent should only handle README.md files.
Changelog generation is a separate concern.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Good news: We already have a focused agent for this!

  changelog-agent: Generates CHANGELOG.md from git history
  Location: agents/changelog-agent/

You can use both agents together:
  1. claude-code --agent readme-agent
  2. claude-code --agent changelog-agent

This follows the "composability over complexity" principle - each 
agent does one thing well, and they work together.

Would you like to learn more about the changelog-agent?
```

---

## Key Patterns from Examples

### Pattern 1: Explicit Request Required
User must explicitly ask to "create an agent"

### Pattern 2: Scope Refinement
Agent helps narrow broad requests to specific tasks

### Pattern 3: Duplicate Prevention
Checks for existing agents before creating

### Pattern 4: Interactive Design
Back-and-forth to clarify requirements

### Pattern 5: Validation
Ensures single responsibility and clear boundaries

### Pattern 6: Confirmation
Always confirms before creating files

### Pattern 7: Next Steps
Provides clear guidance after creation