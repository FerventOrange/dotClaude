#!/bin/bash
# list-agents.sh - Display available agents and their details
#
# Usage: ./install/list-agents.sh

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOTCLAUDE_DIR="$(dirname "$SCRIPT_DIR")"
AGENTS_DIR="$DOTCLAUDE_DIR/agents"

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}           Available Agents${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if agents directory exists
if [ ! -d "$AGENTS_DIR" ]; then
    echo -e "${YELLOW}No agents directory found at $AGENTS_DIR${NC}"
    exit 1
fi

# List agents
for agent_dir in "$AGENTS_DIR"/*/; do
    if [ -d "$agent_dir" ]; then
        agent_name=$(basename "$agent_dir")
        instructions="$agent_dir/instructions.md"

        if [ -f "$instructions" ]; then
            # Parse YAML frontmatter for description
            description=$(sed -n '/^---$/,/^---$/p' "$instructions" | grep "^description:" | sed 's/description:[[:space:]]*//')

            echo -e "${CYAN}$agent_name${NC}"
            if [ -n "$description" ]; then
                echo -e "  $description"
            fi
            echo ""
        else
            echo -e "${CYAN}$agent_name${NC}"
            echo ""
        fi
    fi
done

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Usage:"
echo "  claude --agent ~/.claude/agents/<agent-name>"
echo ""
