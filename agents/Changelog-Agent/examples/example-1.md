# Changelog Agent Examples

## Example 1: First Changelog Generation

### Git History
```bash
$ git log --oneline --decorate

a1b2c3d (tag: v1.1.0) feat(api): add rate limiting
d4e5f6g fix: memory leak in worker process
h7i8j9k docs: update API documentation
k1l2m3n (tag: v1.0.0) feat(auth): add JWT authentication
n4o5p6q feat: initial API implementation
q7r8s9t chore: project setup
```

### Command
```bash
$ claude-code --agent changelog-agent
```

### Generated CHANGELOG.md
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-17

### Added
- Add rate limiting (api)

### Changed
- Update API documentation (docs)

### Fixed
- Memory leak in worker process

## [1.0.0] - 2026-01-15

### Added
- Add JWT authentication (auth)
- Initial API implementation

### Changed
- Project setup (chore)
```

---

## Example 2: Unreleased Changes

### Git History
```bash
$ git log --oneline --since="v1.1.0"

t1u2v3w feat(search): add full-text search
w4x5y6z fix: incorrect timezone conversion
y7z8a9b perf: optimize database queries
b1c2d3e docs: add search API examples
```

### Command
```bash
$ claude-code --agent changelog-agent
```

### Generated CHANGELOG.md (with Unreleased)
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Add full-text search (search)

### Changed
- Optimize database queries (perf)
- Add search API examples (docs)

### Fixed
- Incorrect timezone conversion

## [1.1.0] - 2026-01-17

### Added
- Add rate limiting (api)

### Fixed
- Memory leak in worker process

## [1.0.0] - 2026-01-15

### Added
- Add JWT authentication (auth)
- Initial API implementation
```

---

## Example 3: Breaking Changes

### Git History
```bash
$ git log --oneline v2.0.0^..v2.0.0

e1f2g3h feat(api)!: migrate to v2 endpoints
h4i5j6k feat: add GraphQL support
k7l8m9n BREAKING CHANGE: remove deprecated endpoints
n1o2p3q fix: update client libraries
```

### Commit Details
```bash
$ git show k7l8m9n
commit k7l8m9n
Author: Developer <dev@example.com>
Date: 2026-01-17

feat(api): redesign endpoint structure

BREAKING CHANGE: All v1 endpoints have been removed.
Clients must migrate to v2 API. See migration guide.
```

### Generated CHANGELOG.md
```markdown
## [2.0.0] - 2026-01-17

### Added
- Add GraphQL support

### Changed
- ⚠️ BREAKING: Migrate to v2 endpoints (api)
- ⚠️ BREAKING: Remove deprecated endpoints
  All v1 endpoints have been removed. Clients must migrate to v2 API.

### Fixed
- Update client libraries
```

---

## Example 4: Update Existing Changelog

### Existing CHANGELOG.md
```markdown
# Changelog

## [1.0.0] - 2026-01-01

### Added
- Initial release
```

### New Commits
```bash
$ git log --oneline v1.0.0..HEAD

p1q2r3s feat(ui): add dark mode
s4t5u6v feat(api): add export functionality
v7w8x9y fix: button alignment in mobile view
y1z2a3b test: add E2E tests for checkout
```

### Command
```bash
$ claude-code --agent changelog-agent --update
```

### Updated CHANGELOG.md
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Add dark mode (ui)
- Add export functionality (api)

### Changed
- Add E2E tests for checkout (test)

### Fixed
- Button alignment in mobile view

## [1.0.0] - 2026-01-01

### Added
- Initial release
```

---

## Example 5: Non-Conventional Commits

### Git History (without conventional format)
```bash
$ git log --oneline

a1b2c3d Added new search feature
d4e5f6g Fixed bug in login
h7i8j9k Updated documentation
k1l2m3n Refactored database layer
n4o5p6q Initial commit
```

### Generated CHANGELOG.md
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Added new search feature

### Changed
- Updated documentation
- Refactored database layer
- Initial commit

### Fixed
- Fixed bug in login
```

**Note:** Non-conventional commits are still processed but categorized based on keywords in the message.

---

## Example 6: Multiple Scopes and Detailed Messages

### Git History
```bash
$ git log --oneline --format="%h %s"

a1b2c3d feat(auth): implement OAuth 2.0 support
d4e5f6g feat(auth): add social login (Google, GitHub)
h7i8j9k feat(api): add webhook endpoints
k1l2m3n fix(auth): resolve token refresh issue
n4o5p6q fix(api): handle rate limit errors correctly
p7q8r9s docs(api): add webhook documentation
s1t2u3v perf(db): optimize user queries
```

### Generated CHANGELOG.md
```markdown
## [Unreleased]

### Added
- Implement OAuth 2.0 support (auth)
- Add social login (Google, GitHub) (auth)
- Add webhook endpoints (api)

### Changed
- Add webhook documentation (api, docs)
- Optimize user queries (db, perf)

### Fixed
- Resolve token refresh issue (auth)
- Handle rate limit errors correctly (api)
```

---

## Example 7: With Version Comparison Links

### Git Repository on GitHub
```
Repository: https://github.com/username/myproject
```

### Generated CHANGELOG.md (with links)
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- New dashboard analytics

## [1.2.0] - 2026-01-17

### Added
- User profile customization
- Export to CSV functionality

### Fixed
- Memory leak in background jobs

## [1.1.0] - 2026-01-10

### Added
- Dark mode support
- Email notifications

## [1.0.0] - 2026-01-01

### Added
- Initial release

[unreleased]: https://github.com/username/myproject/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/username/myproject/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/username/myproject/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/username/myproject/releases/tag/v1.0.0
```

---

## Tips from Examples

### 1. Use Semantic Versioning Tags
```bash
# Good tags
git tag -a v1.0.0 -m "Initial release"
git tag -a v1.1.0 -m "Feature update"
git tag -a v2.0.0 -m "Major update"

# The agent automatically extracts dates from tags
```

### 2. Conventional Commits Work Best
```bash
# Agent can easily categorize these
feat(scope): description
fix(scope): description
docs(scope): description

# Breaking changes are clearly marked
feat!: description
feat: description

BREAKING CHANGE: explanation
```

### 3. Group Related Changes
When you have multiple commits for one feature:
```bash
# These will be grouped together
git commit -m "feat(search): add search infrastructure"
git commit -m "feat(search): implement full-text search"
git commit -m "feat(search): add search filters"

# In changelog appears as:
### Added
- Add search infrastructure (search)
- Implement full-text search (search)
- Add search filters (search)
```

### 4. Manual Enhancement Recommended
After generation, enhance with:
- Issue/PR links: `- Fix login bug (#123)`
- More context: `- Add dark mode - Saves user preference`
- Migration notes for breaking changes
- Contributors: `- Feature X (thanks @username)`