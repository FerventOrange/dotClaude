# Code Cleanup Agent

A specialized Claude Code agent for identifying redundant, duplicate, and dead code in repositories.

## Purpose

Scans codebases to find code that can be safely removed or consolidated, generating actionable cleanup reports.

## Usage

```bash
claude --agent codecleanup-agent
```

## Features

- Identifies duplicate code patterns across files
- Finds redundant files with overlapping functionality
- Detects dead code (unused imports, unreachable code)
- Locates copy-paste code that should be consolidated
- Finds unused dependencies in package files
- Generates prioritized cleanup reports (HIGH/MEDIUM/LOW)

## What It Analyzes

| Category | Examples |
|----------|----------|
| Duplicate Code | Similar functions, repeated logic blocks |
| Redundant Files | Overlapping documentation, duplicate configs |
| Dead Code | Unused imports, unreachable branches, commented code |
| Copy-Paste | Code blocks that should be extracted to shared utilities |
| Unused Dependencies | Packages in package.json/requirements.txt not imported |

## MCP Requirements

- `filesystem` - For reading project files
- `git` - For analyzing file history

## Output Format

The agent produces a structured report:

```markdown
## Cleanup Report

### HIGH Priority
- [Issue description with file locations]

### MEDIUM Priority
- [Issue description with file locations]

### LOW Priority
- [Issue description with file locations]

### Summary Table
| Priority | Count | Action |
|----------|-------|--------|
```

## Important Notes

- This agent only **analyzes and reports** - it does not delete files
- Always review recommendations before taking action
- Some "dead code" may be intentionally kept for future use
