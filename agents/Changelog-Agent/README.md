# Changelog Agent

> Generates and maintains CHANGELOG.md files from git commit history

## Overview
The Changelog Agent automatically creates professional changelogs by analyzing your git history. It follows the [Keep a Changelog](https://keepachangelog.com) format and works best with [Conventional Commits](https://www.conventionalcommits.org/).

## Usage

### Generate New Changelog
```bash
# From your git repository
claude-code --agent changelog-agent

# For a specific repository
claude-code --agent changelog-agent /path/to/repo
```

### Update Existing Changelog
```bash
# Add new entries since last update
claude-code --agent changelog-agent --update
```

### Generate for Specific Version Range
```bash
# Between two tags
claude-code --agent changelog-agent --from v1.0.0 --to v2.0.0

# Since last tag
claude-code --agent changelog-agent --since v1.0.0
```

## What It Does

### Analyzes Git History
- Reads commit messages from git log
- Identifies semantic version tags (v1.0.0, v2.1.0, etc.)
- Extracts dates from tag creation
- Parses Conventional Commits format

### Categorizes Changes
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

### Generates Professional Output
- Follows Keep a Changelog format
- Organizes versions in reverse chronological order
- Includes release dates
- Highlights breaking changes
- Creates "Unreleased" section for recent commits

## What It Doesn't Do

❌ Create or modify source code  
❌ Create git tags or releases  
❌ Write commit messages (use `git-commit-helper`)  
❌ Modify git history  
❌ Publish releases to GitHub  
❌ Update version numbers in code  

## Commit Message Format

### Best Results with Conventional Commits
```bash
# Feature
git commit -m "feat(auth): add JWT authentication"

# Bug fix
git commit -m "fix: resolve memory leak"

# Breaking change
git commit -m "feat!: drop Node 14 support"

# With body
git commit -m "feat(api): add search endpoint

Implements full-text search across all resources.
Includes pagination and filtering options."
```

### Supported Types
- `feat`: New feature → **Added**
- `fix`: Bug fix → **Fixed**
- `docs`: Documentation → **Changed**
- `perf`: Performance → **Changed**
- `refactor`: Code refactor → **Changed**
- `test`: Tests → **Changed**
- `build`: Build system → **Changed**
- `ci`: CI/CD → **Changed**
- `chore`: Maintenance → **Changed**

### Non-Conventional Commits
The agent works with any commit format but categorizes them as "Changed" by default.

## Examples

### Example 1: New Changelog
```bash
$ claude-code --agent changelog-agent

Analyzing git history...
✓ Found 3 version tags: v1.0.0, v1.1.0, v1.2.0
✓ Processed 47 commits
✓ Detected 5 unreleased changes

Generated CHANGELOG.md with:
- Unreleased (5 changes)
- Version 1.2.0 (15 changes)
- Version 1.1.0 (22 changes)
- Version 1.0.0 (10 changes)

CHANGELOG.md created successfully!
```

### Example 2: Update Existing
```bash
$ claude-code --agent changelog-agent --update

Found existing CHANGELOG.md
Last version: v1.2.0 (2026-01-10)

New commits since v1.2.0:
✓ 3 features added
✓ 2 bugs fixed
✓ 1 documentation update

Updating CHANGELOG.md...
✓ Added "Unreleased" section with 6 changes

CHANGELOG.md updated successfully!
```

## MCP Requirements

This agent requires the following MCP servers:
- **git**: For reading commit history and tags
- **filesystem**: For reading/writing CHANGELOG.md

### Installing MCP Servers
```bash
# Check MCP status
claude-code --test-mcp git
claude-code --test-mcp filesystem

# Install if needed
claude-code --agent mcp-configurator
```

## Output Format

### Generated CHANGELOG.md
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New search functionality

### Fixed
- Date parsing bug

## [1.1.0] - 2026-01-15

### Added
- User authentication system
- API rate limiting

### Changed
- Improved error messages
- Updated dependencies

### Fixed
- Memory leak in background worker

## [1.0.0] - 2026-01-01

### Added
- Initial release
- Core API functionality
```

## Tips for Best Results

### 1. Use Semantic Version Tags
```bash
# Tag your releases
git tag -a v1.0.0 -m "First release"
git tag -a v1.1.0 -m "Feature update"

# Push tags
git push --tags
```

### 2. Write Good Commit Messages
```bash
# Good - specific and actionable
git commit -m "feat(api): add user search endpoint"

# Better - includes scope and detail
git commit -m "feat(api): add user search endpoint

Implements full-text search with pagination.
Supports filtering by role and status."

# Best - follows conventions with breaking change
git commit -m "feat(auth)!: migrate to OAuth 2.0

BREAKING CHANGE: Password authentication removed.
Users must authenticate via OAuth providers."
```

### 3. Keep Changelog Updated
```bash
# After each release
claude-code --agent changelog-agent --update

# Before creating a tag
git tag -a v1.2.0 -m "Release v1.2.0"
```

### 4. Enhance Generated Content
The agent creates a solid foundation. Consider adding:
- Links to issues: `- Fix login bug ([#123](link))`
- PR references: `- Add search (PR #45)`
- Migration guides for breaking changes
- Credits for contributors

## Troubleshooting

### "Not a git repository"
**Solution:** Initialize git or run from a git repository:
```bash
git init
```

### "No version tags found"
**Solution:** The agent can still work, but results are better with tags:
```bash
# Create your first tag
git tag -a v1.0.0 -m "First release"

# Then generate changelog
claude-code --agent changelog-agent
```

### "No commits found"
**Solution:** Make some commits first:
```bash
git add .
git commit -m "feat: initial commit"
```

### Changes not categorized correctly
**Solution:** Use Conventional Commits format for better categorization:
```bash
# Instead of
git commit -m "added new feature"

# Use
git commit -m "feat: add new feature"
```

## Configuration

### Custom Categories
While the agent uses standard Keep a Changelog categories, you can request custom formatting:
```bash
# Ask for specific style
claude-code --agent changelog-agent --style detailed

# Or provide guidance in the prompt
"Generate changelog but group all changes by component rather than type"
```

## Related Agents

- **git-commit-helper**: Write better commit messages
- **readme-agent**: Generate README.md files
- **doc-review-agent**: Review documentation quality

## Version
Current version: 1.0.0

## Contributing
This agent follows the [Agent Design Guidelines](../../AGENT_GUIDELINES.md).

## License
Part of the Agent Infrastructure Repository