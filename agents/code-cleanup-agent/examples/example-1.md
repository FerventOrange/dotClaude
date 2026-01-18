# Example 1: Repository Cleanup Scan

## Scenario
User wants to identify cleanup opportunities in a Node.js project before a major release.

## User Request
```
Scan this repository for any code that can be cleaned up or removed.
```

## Agent Response

```markdown
# Cleanup Report: my-nodejs-project

## Summary
- Total issues found: 8
- HIGH priority: 2
- MEDIUM priority: 4
- LOW priority: 2

## HIGH Priority Issues

### 1. Duplicate Utility Functions
**Type:** Duplicate Code
**Locations:**
- `src/utils/helpers.js:45-67`
- `src/lib/common.js:12-34`
**Description:** Both files contain nearly identical `formatDate()` functions with only minor naming differences.
**Recommendation:** Consolidate into a single shared utility and update imports.

### 2. Unused Dependencies
**Type:** Unused Dependencies
**Location:** `package.json`
**Description:** The following packages are listed but never imported:
- `moment` (replaced by date-fns)
- `lodash.merge` (not used anywhere)
**Recommendation:** Remove from package.json and run `npm prune`.

## MEDIUM Priority Issues

### 3. Dead Import Statements
**Type:** Dead Code
**Location:** `src/components/Dashboard.jsx:1-5`
**Description:** 3 imports are declared but never used in this file.
**Recommendation:** Remove unused imports.

### 4. Commented-Out Code Block
**Type:** Dead Code
**Location:** `src/api/client.js:89-134`
**Description:** 45 lines of commented-out code from old API implementation.
**Recommendation:** Remove if no longer needed; code is in git history.

## LOW Priority Issues

### 5. Empty Test File
**Type:** Redundant File
**Location:** `tests/placeholder.test.js`
**Description:** File contains only a placeholder comment, no actual tests.
**Recommendation:** Either add tests or remove file.

## Summary Table
| Priority | Issue Type | Count | Action |
|----------|------------|-------|--------|
| HIGH | Duplicate Code | 1 | Consolidate |
| HIGH | Unused Dependencies | 2 | Remove |
| MEDIUM | Dead Imports | 3 | Remove |
| MEDIUM | Commented Code | 1 | Remove |
| LOW | Empty Files | 1 | Remove |
```

## Notes
- Agent scanned src/, tests/, and root config files
- Skipped node_modules/ and dist/ directories
- Report provides specific line numbers for easy navigation
