# README Agent

> Generates comprehensive README.md files for software projects

## Overview
The README Agent analyzes your project structure, dependencies, and code to create professional, well-structured README.md files. It's focused solely on README generation and works great with other documentation agents.

## Usage

### Create a New README
```bash
# From your project directory
claude-code --agent readme-agent

# Specify a different directory
claude-code --agent readme-agent /path/to/project
```

### Update an Existing README
```bash
# The agent will detect existing README and ask if you want to update
claude-code --agent readme-agent
```

### Quick Generation
```bash
# Generate without interactive prompts
claude-code --agent readme-agent --auto
```

## What It Does

### Analyzes Your Project
- Detects project type (Node.js, Python, Go, Rust, etc.)
- Reads package manager files for dependencies
- Identifies main entry points and structure
- Finds configuration files and environment variables

### Generates Sections
- **Title & Description**: Clear project identification
- **Installation**: Step-by-step setup instructions
- **Usage**: Code examples from your entry points
- **Configuration**: Environment variables and config files
- **Features**: Key capabilities based on code analysis
- **Contributing**: Guidelines for contributors
- **License**: License information from LICENSE file

### Smart Defaults
- Adds appropriate badges (CI/CD, version, license)
- Uses correct package manager commands (npm, pip, cargo, etc.)
- Formats code blocks with proper syntax highlighting
- Creates professional, consistent structure

## What It Doesn't Do

❌ Write or modify source code  
❌ Create API documentation (use `api-doc-generator`)  
❌ Review documentation quality (use `doc-review-agent`)  
❌ Generate changelogs (use `changelog-agent`)  
❌ Create inline code comments  

## Examples

### Example 1: New Node.js Project
```bash
$ claude-code --agent readme-agent

Analyzing project...
✓ Detected: Node.js project with Express
✓ Found: package.json, .env.example
✓ Entry point: src/server.js

Generated README.md with:
- Installation instructions (npm install)
- Environment setup from .env.example
- Usage examples for API endpoints
- Development server instructions

README.md created successfully!
```

### Example 2: Update Existing Python Project
```bash
$ claude-code --agent readme-agent

Found existing README.md

Would you like me to:
1. Create a new README (overwrites existing)
2. Update the existing README (preserves and enhances)
3. Show what I would add without modifying

> 2

Updating README.md...
✓ Added Installation section
✓ Added Configuration section  
✓ Enhanced Usage examples
✓ Added Contributing guidelines

README.md updated successfully!
```

## MCP Requirements

This agent requires the following MCP servers:
- **filesystem**: For reading project files and writing README.md

### Installing MCP Servers
```bash
# Check if filesystem MCP is installed
claude-code --test-mcp filesystem

# If not installed, use the mcp-configurator agent
claude-code --agent mcp-configurator
```

## Tips for Best Results

### 1. Prepare Your Project
- Have a clear entry point (main.py, index.js, main.go, etc.)
- Include dependency files (package.json, requirements.txt, etc.)
- Add a LICENSE file if you have one
- Create .env.example if you use environment variables

### 2. Review and Customize
The agent creates a solid foundation, but you should:
- Add project-specific details
- Include screenshots or demos if applicable
- Add troubleshooting for common issues
- Customize examples for your use case

### 3. Combine with Other Agents
```bash
# Create README
claude-code --agent readme-agent

# Review the quality
claude-code --agent doc-review-agent README.md

# If you made changes, update changelog
claude-code --agent changelog-agent
```

## Configuration

The agent uses smart defaults but respects:
- Existing README.md structure (when updating)
- Your project's coding style
- Package manager preferences from lock files
- Documentation patterns in your codebase

## Output

### File Created
- `README.md` in your project root

### Content Structure
```markdown
# Project Name
[Badges]

## Description
## Features  
## Installation
## Usage
## Configuration
## Documentation
## Contributing
## License
## Contact
```

## Troubleshooting

### "Cannot detect project type"
**Solution:** Make sure you have a package manager file (package.json, requirements.txt, go.mod, Cargo.toml, etc.) in your project root.

### "Insufficient information for comprehensive README"
**Solution:** Provide more context:
```bash
claude-code --agent readme-agent
# Then answer the prompts about project purpose and main features
```

### "No write permissions"
**Solution:** Check that you have write access to the project directory:
```bash
chmod u+w .
```

## Related Agents

- **changelog-agent**: Generate CHANGELOG.md from git history
- **doc-review-agent**: Review and improve documentation quality
- **api-doc-generator**: Create detailed API documentation

## Version
Current version: 1.0.0

## Contributing
This agent follows the [Agent Design Guidelines](../../AGENT_GUIDELINES.md). To report issues or suggest improvements:
1. Check existing issues
2. Submit detailed bug reports or feature requests
3. Follow the scoped agent principles

## License
Part of the Agent Infrastructure Repository