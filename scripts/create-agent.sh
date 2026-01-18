#!/bin/bash
# create-agent.sh - Generate a new agent from template
# Usage: ./scripts/create-agent.sh <agent-name>

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
AGENTS_DIR="$REPO_ROOT/agents"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

usage() {
    echo "Usage: $0 <agent-name>"
    echo ""
    echo "Creates a new agent with the standard directory structure."
    echo ""
    echo "Example:"
    echo "  $0 git-commit-helper"
    exit 1
}

# Check arguments
if [ -z "$1" ]; then
    echo -e "${RED}Error: Agent name is required${NC}"
    usage
fi

AGENT_NAME="$1"
AGENT_DIR="$AGENTS_DIR/$AGENT_NAME"

# Validate agent name (lowercase, hyphens allowed)
if [[ ! "$AGENT_NAME" =~ ^[a-z][a-z0-9-]*$ ]]; then
    echo -e "${RED}Error: Agent name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens${NC}"
    exit 1
fi

# Check if agent already exists
if [ -d "$AGENT_DIR" ]; then
    echo -e "${RED}Error: Agent '$AGENT_NAME' already exists at $AGENT_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}Creating agent: $AGENT_NAME${NC}"

# Create directory structure
mkdir -p "$AGENT_DIR/examples"

# Get current date
CURRENT_DATE=$(date +%Y-%m-%d)

# Create agent.json
cat > "$AGENT_DIR/agent.json" << EOF
{
  "name": "$AGENT_NAME",
  "version": "1.0.0",
  "description": "TODO: Add a brief description",
  "scope": "TODO: Define the scope",
  "author": "TODO: Your name or team",
  "created": "$CURRENT_DATE",
  "updated": "$CURRENT_DATE",
  "mcp_servers": [],
  "dependencies": [],
  "input_types": [],
  "output_types": [],
  "constraints": []
}
EOF

# Create instructions.md
cat > "$AGENT_DIR/instructions.md" << 'EOF'
# Agent: {{AGENT_NAME}}

## Primary Objective
TODO: One sentence describing what this agent does.

## Scope Boundaries

### This agent DOES:
- TODO: Specific task 1
- TODO: Specific task 2
- TODO: Specific task 3

### This agent DOES NOT:
- TODO: Out of scope task 1
- TODO: Out of scope task 2
- TODO: Redirect to [other-agent] for this

## Required Context
TODO: What information the agent needs to function.

## Workflow
1. TODO: Step 1
2. TODO: Step 2
3. TODO: Step 3

## Output Format
TODO: Describe what the agent produces.

## Error Handling
TODO: How to handle common issues.

## Examples
See the `examples/` directory for usage examples.
EOF

# Replace placeholder in instructions.md
sed -i "s/{{AGENT_NAME}}/$AGENT_NAME/g" "$AGENT_DIR/instructions.md" 2>/dev/null || \
    sed -i '' "s/{{AGENT_NAME}}/$AGENT_NAME/g" "$AGENT_DIR/instructions.md"

# Create README.md
cat > "$AGENT_DIR/README.md" << EOF
# $AGENT_NAME

TODO: Brief description of what this agent does.

## Installation

This agent is part of the dotClaude repository. Clone the repo to use it:

\`\`\`bash
git clone https://github.com/your-org/dotClaude.git ~/dotClaude
\`\`\`

## Usage

\`\`\`bash
claude-code --agent $AGENT_NAME
\`\`\`

## MCP Requirements

See \`mcp-requirements.txt\` for required MCP servers.

## Examples

See the \`examples/\` directory.

## Version History

- **1.0.0** ($CURRENT_DATE): Initial release
EOF

# Create mcp-requirements.txt
cat > "$AGENT_DIR/mcp-requirements.txt" << EOF
# MCP servers required for this agent
# Add servers as needed, e.g.:
# filesystem>=1.0.0
# git>=1.0.0
EOF

# Create example placeholder
cat > "$AGENT_DIR/examples/example-1.md" << EOF
# Example 1: Basic Usage

## Input
TODO: Describe the input for this example.

## Expected Output
TODO: Describe what the agent should produce.

## Notes
TODO: Any additional context.
EOF

echo -e "${GREEN}Agent created successfully!${NC}"
echo ""
echo "Directory: $AGENT_DIR"
echo ""
echo "Next steps:"
echo "  1. Edit $AGENT_DIR/agent.json - Fill in metadata"
echo "  2. Edit $AGENT_DIR/instructions.md - Define agent behavior"
echo "  3. Edit $AGENT_DIR/README.md - Add documentation"
echo "  4. Add examples to $AGENT_DIR/examples/"
echo "  5. Update $AGENT_DIR/mcp-requirements.txt if needed"
echo ""
echo -e "${YELLOW}Remember: Keep the scope narrow and focused!${NC}"
