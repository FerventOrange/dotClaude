# Doc Review Agent

> Reviews and improves documentation quality for readability, accuracy, and completeness

## Overview
The Doc Review Agent analyzes your documentation to identify issues, suggest improvements, and ensure high-quality documentation. It provides detailed, actionable feedback with severity ratings.

## Usage

### Review a File
```bash
# Review README
claude-code --agent doc-review-agent README.md

# Review CHANGELOG
claude-code --agent doc-review-agent CHANGELOG.md

# Review any markdown file
claude-code --agent doc-review-agent docs/api.md
```

### Review Multiple Files
```bash
# Review all markdown files
claude-code --agent doc-review-agent docs/*.md

# Review specific files
claude-code --agent doc-review-agent README.md CHANGELOG.md
```

### Quick Review
```bash
# Get quick summary instead of detailed report
claude-code --agent doc-review-agent README.md --quick
```

### Review and Fix
```bash
# Get review + corrected version
claude-code --agent doc-review-agent README.md --fix
```

## What It Does

### Analyzes Documentation
- **Structure**: Heading hierarchy, section organization, flow
- **Content**: Clarity, accuracy, completeness, examples
- **Formatting**: Markdown syntax, code blocks, links, tables
- **Writing**: Grammar, spelling, tone, consistency

### Identifies Issues by Severity
- 🔴 **Critical**: Blocks users, incorrect information
- 🟡 **Major**: Significantly impacts usability
- 🔵 **Minor**: Small improvements needed
- 💡 **Suggestion**: Nice-to-have enhancements

### Provides Actionable Feedback
- Specific locations of issues
- Clear explanations of problems
- Concrete recommendations
- Examples of improvements
- Priority-ordered fixes

## What It Doesn't Do

❌ Generate new documentation (use `readme-agent`, `changelog-agent`)  
❌ Modify source code  
❌ Execute code examples  
❌ Test external links  
❌ Translate documentation  
❌ Write commit messages  

## Review Coverage

### README.md
- [ ] Clear title and description
- [ ] Installation instructions
- [ ] Usage examples
- [ ] Configuration details
- [ ] Contributing guidelines
- [ ] License information
- [ ] Proper code formatting
- [ ] Section completeness

### CHANGELOG.md
- [ ] Keep a Changelog format
- [ ] Semantic versioning
- [ ] Proper categorization
- [ ] Breaking change highlights
- [ ] Consistent date formatting
- [ ] No duplicate entries

### API Documentation
- [ ] All endpoints documented
- [ ] Request/response examples
- [ ] Parameter descriptions
- [ ] Error responses
- [ ] Authentication requirements
- [ ] Consistent formatting

### General Documentation
- [ ] Clear purpose
- [ ] Logical organization
- [ ] Appropriate detail level
- [ ] Code examples
- [ ] Correct markdown
- [ ] Good grammar

## Examples

### Example 1: Basic Review
```bash
$ claude-code --agent doc-review-agent README.md

Reviewing README.md...

# Documentation Review Report

**Overall Score:** 7/10

## Critical Issues (🔴)
None found

## Major Issues (🟡)
1. Missing Installation section
   - Location: N/A - section absent
   - Impact: Users cannot get started
   - Fix: Add section with setup instructions

2. Code examples lack language identifiers
   - Location: Lines 45-50, 67-72
   - Impact: No syntax highlighting
   - Fix: Add language to code blocks (```bash, ```python)

## Minor Issues (🔵)
1. Spelling: "teh" should be "the" (line 23)
2. Inconsistent bullet style (mixed - and *)

## Suggestions (💡)
- Add badges for build status and version
- Include a demo or screenshot
- Add table of contents for long README

## Strengths
✓ Clear project description
✓ Good usage examples
✓ Proper heading hierarchy

## Top 3 Recommendations
1. Add Installation section
2. Fix code block formatting
3. Fix spelling errors

Review complete!
```

### Example 2: Quick Review
```bash
$ claude-code --agent doc-review-agent CHANGELOG.md --quick

📄 Quick Review: CHANGELOG.md

Overall: Good (7/10) ✓

Issues:
🟡 Not following Keep a Changelog format
🟡 Vague change descriptions ("fixed bugs")
🔵 Inconsistent version formatting

Quick Fixes:
1. Add Keep a Changelog header
2. Use categories: Added, Changed, Fixed
3. Be specific: "Fixed login timeout bug"

Need detailed report? (y/n)
```

### Example 3: Review and Fix
```bash
$ claude-code --agent doc-review-agent README.md --fix

Reviewing and fixing README.md...

Found 8 issues:
- 2 major (missing sections)
- 4 minor (formatting)
- 2 suggestions (enhancements)

Applied fixes:
✓ Added Installation section
✓ Fixed code block language identifiers
✓ Corrected spelling errors
✓ Standardized bullet formatting

Files created:
- README.md.review (review report)
- README-fixed.md (corrected version)

Compare changes:
  diff README.md README-fixed.md
```

## MCP Requirements

This agent requires:
- **filesystem**: For reading documentation files

### Installing MCP Servers
```bash
# Check status
claude-code --test-mcp filesystem

# Install if needed
claude-code --agent mcp-configurator
```

## Output

### Review Report
Comprehensive analysis with:
- Overall quality score
- Issues by severity
- Specific locations
- Recommendations
- Strengths
- Priority fixes

### Fixed Version (Optional)
- Corrected documentation
- Change summary
- Side-by-side comparison option

## Tips for Best Results

### 1. Review Before Publishing
```bash
# Always review before sharing
git add README.md
claude-code --agent doc-review-agent README.md
# Fix issues found
git commit -m "docs: improve README based on review"
```

### 2. Regular Reviews
```bash
# Review after major changes
claude-code --agent doc-review-agent docs/

# Quick check during development
claude-code --agent doc-review-agent README.md --quick
```

### 3. Combine with Other Agents
```bash
# Generate README
claude-code --agent readme-agent

# Review quality
claude-code --agent doc-review-agent README.md

# Fix issues and regenerate if needed
```

### 4. Focus on High Priority
Start with critical and major issues:
```
Review found:
- 1 critical issue
- 3 major issues
- 7 minor issues
- 5 suggestions

Priority: Fix critical and major first
```

## Review Criteria

### Structural Quality
- Clear heading hierarchy (H1 → H2 → H3)
- Logical section order
- Appropriate document length
- Good flow between sections

### Content Quality
- Clear and concise writing
- Accurate information
- Complete coverage
- Appropriate examples
- Consistent terminology

### Formatting Quality
- Valid markdown syntax
- Code blocks with language identifiers
- Proper link formatting
- Consistent list styling
- Well-formatted tables

### Writing Quality
- Correct grammar and spelling
- Active voice preferred
- Appropriate tone
- Technical accuracy
- Clear explanations

## Severity Guide

### 🔴 Critical
Will prevent users from using the project:
- Incorrect installation commands
- Factually wrong information
- Broken essential links
- Missing critical sections

### 🟡 Major
Significantly impacts user experience:
- Incomplete important sections
- Unclear explanations
- Outdated information
- Major formatting issues

### 🔵 Minor
Should be fixed but not blocking:
- Spelling/grammar errors
- Minor formatting inconsistencies
- Missing optional sections
- Suboptimal organization

### 💡 Suggestion
Nice-to-have improvements:
- Style enhancements
- Additional examples
- Better wording
- Enhanced formatting

## Troubleshooting

### "File not found"
**Solution:** Check file path and name:
```bash
# List files
ls -la

# Correct path
claude-code --agent doc-review-agent ./docs/README.md
```

### "File too large"
**Solution:** Review sections separately:
```bash
# Review specific sections by line range
claude-code --agent doc-review-agent README.md --lines 1-100
```

### "No issues found but doc seems poor"
**Solution:** Request focused review:
```bash
# Focus on specific aspects
claude-code --agent doc-review-agent README.md --focus structure
claude-code --agent doc-review-agent README.md --focus writing
```

## Configuration

### Review Depth
```bash
# Quick (structure and critical only)
--quick

# Standard (default, all severity levels)
[no flag]

# Detailed (includes suggestions and examples)
--detailed
```

### Review Focus
```bash
# Focus on specific aspects
--focus structure    # Organization only
--focus content      # Content quality only
--focus formatting   # Markdown syntax only
--focus writing      # Grammar and style only
```

## Related Agents

- **readme-agent**: Generate README.md files
- **changelog-agent**: Generate CHANGELOG.md files
- **api-doc-generator**: Create API documentation
- **code-reviewer**: Review source code

## Version
Current version: 1.0.0

## Contributing
This agent follows the [Agent Design Guidelines](../../AGENT_GUIDELINES.md).

## License
Part of the Agent Infrastructure Repository