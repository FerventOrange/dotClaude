# Claude Code Custom Instructions - Agent Integration

> **Installation:** This file is copied to `~/.claude/CLAUDE.md` during installation.
> Claude Code reads this file automatically to customize its behavior globally.

---

## Agent Awareness Protocol

Before responding to tasks, check if a specialized agent exists that matches the request.

### Available Agents

**Documentation:**
- `readme-agent` - Generate/update README.md files
- `changelog-agent` - Generate/update CHANGELOG.md from git history
- `doc-review-agent` - Review documentation quality
- `api-doc-agent` - Generate API documentation from source code

**Git Workflows:**
- `git-commit-agent` - Suggest conventional commit messages
- `git-pr-agent` - Manage branches for PR workflows
- `git-tags-agent` - Manage git tags and version releases
- `git-issues-agent` - Create well-formatted GitHub issues
- `git-sync-agent` - Sync forks with upstream repositories

**Code Quality:**
- `code-cleanup-agent` - Find redundant/duplicate code for deletion
- `code-review-agent` - Review code for bugs and best practices
- `code-linting-agent` - Set up and configure linting tools
- `dependency-agent` - Validate dependencies across files
- `python-agent` - Python-specific code generation
- `terraform-agent` - Terraform infrastructure code generation

**Testing:**
- `debug-agent` - Parse error outputs and identify root causes
- `unit-test-agent` - Generate unit tests for functions/classes
- `integration-test-agent` - Generate integration tests for component interactions

**Infrastructure:**
- `agent-creator` - Create new agents (ONLY when user explicitly requests)
- `dotclaude-updater` - Update and verify dotClaude from GitHub
- `agent-updater` - Update existing agent instructions (ONLY when user explicitly requests)
- `agent-review-agent` - Review agent instruction files for quality and consistency

### Agent Recommendation Rules

**WHEN to recommend an agent:**
1. User request matches agent scope exactly
2. Agent optimized for the specific task
3. Task is within agent's documented capabilities

**HOW to recommend:**
```
I can help with [task]! We have a specialized agent for this:

**Agent:** [agent-name]
**Purpose:** [what it does]
**Usage:** `claude --agent [agent-name]`

**Benefits:**
- [Specific advantage 1]
- [Specific advantage 2]

Would you like to use the [agent-name] agent? (y/n)
```

**WHEN NOT to recommend:**
- Task outside agent scope
- User asks not to use agents
- General help is more appropriate

### Quick Reference

| User Request | Recommend Agent | Command |
|-------------|-----------------|---------|
| "create README", "project docs" | readme-agent | `claude --agent readme-agent` |
| "changelog", "release notes" | changelog-agent | `claude --agent changelog-agent` |
| "review docs", "check README" | doc-review-agent | `claude --agent doc-review-agent [file]` |
| "create agent for..." | agent-creator | `claude --agent agent-creator` |
| "commit message help" | git-commit-agent | `claude --agent git-commit-agent` |
| "create branch", "push branch" | git-pr-agent | `claude --agent git-pr-agent` |
| "create tag", "version release" | git-tags-agent | `claude --agent git-tags-agent` |
| "create issue", "bug report" | git-issues-agent | `claude --agent git-issues-agent` |
| "find duplicate code" | code-cleanup-agent | `claude --agent code-cleanup-agent` |
| "review code", "check for bugs" | code-review-agent | `claude --agent code-review-agent` |
| "set up linting", "configure eslint" | code-linting-agent | `claude --agent code-linting-agent` |
| "check dependencies", "unused packages" | dependency-agent | `claude --agent dependency-agent` |
| "write python code", "python function" | python-agent | `claude --agent python-agent` |
| "terraform module", "infrastructure code" | terraform-agent | `claude --agent terraform-agent` |
| "sync fork", "update from upstream" | git-sync-agent | `claude --agent git-sync-agent` |
| "API docs", "document endpoints" | api-doc-agent | `claude --agent api-doc-agent` |
| "debug error", "stack trace" | debug-agent | `claude --agent debug-agent` |
| "write unit tests", "test function" | unit-test-agent | `claude --agent unit-test-agent` |
| "integration tests", "test workflow" | integration-test-agent | `claude --agent integration-test-agent` |
| "update agent", "modify agent" | agent-updater | `claude --agent agent-updater` |
| "update dotClaude" | dotclaude-updater | `claude --agent dotclaude-updater` |
| "review agent", "check agent quality" | agent-review-agent | `claude --agent agent-review-agent` |

### Special Rules

**agent-creator** - Requires explicit user request:
- ✅ "Create an agent that..." 
- ❌ "I need help with X" (offer existing agents instead, don't create new one)

### Always:
- ✅ Ask before using an agent
- ✅ Explain why agent is recommended
- ✅ Give user choice between agent and direct help
- ✅ List available agents when relevant

### Never:
- ❌ Switch to agent without asking
- ❌ Recommend agents for out-of-scope tasks
- ❌ Create agents autonomously
- ❌ Force agent usage

### Agent Cycling (Multi-Agent Workflows)

When a task could benefit from multiple agents, offer to cycle through them:

**WHEN to cycle agents:**
- Task spans multiple agent scopes (e.g., "document my project" = readme + changelog)
- Sequential workflow improves output quality
- User requests comprehensive handling

**HOW to offer cycling:**
```
This task could benefit from multiple agents:

1. [agent-1] - [what it handles]
2. [agent-2] - [what it handles]
3. [agent-3] - [what it handles]

Options:
a) Run all agents in sequence (recommended)
b) Run specific agent: [1/2/3]
c) Help directly without agents

Which would you prefer?
```

**Agent Workflow Chains:**

| Task | Agent Sequence |
|------|----------------|
| "Document my project" | readme-agent → changelog-agent → doc-review-agent |
| "Create and review README" | readme-agent → doc-review-agent |
| "Full release prep" | changelog-agent → doc-review-agent |

**Cycling Rules:**
- Complete each agent's task before moving to next
- Show output/results between agents
- Allow user to stop or skip at any point
- Summarize what each agent accomplished

**Transition Format:**
```
[agent-1] complete. Results: [summary]

Moving to [agent-2] for [next task]...
Continue? (y/n/skip)
```

### Git Workflow Rules

**Before making code changes, always:**
1. Pull the latest from `main`: `git pull origin main`
2. Create a new feature branch: `git checkout -b feature/description`
3. Make changes on the feature branch
4. Commit and push the branch
5. Create a PR to merge back into `main`

**Never commit directly to `main`.** Always use feature branches and PRs.

**Scope awareness:** If the user requests work that doesn't fit the current branch's purpose, suggest creating a new branch before starting. Use `git-pr-agent` to handle the branch switch. Keep branches focused on a single deliverable.

### Discovery
Check available agents: `ls ~/.claude/agents/`
Read agent details: `cat ~/.claude/agents/[name]/instructions.md`
