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
YELLOW='\033[1;33m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Category colors
declare -A CATEGORY_COLORS
CATEGORY_COLORS[github]=$BLUE
CATEGORY_COLORS[documentation]=$YELLOW
CATEGORY_COLORS[code]=$RED
CATEGORY_COLORS[testing]=$GREEN
CATEGORY_COLORS[infrastructure]=$MAGENTA

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

total_count=0

# List agents by category
for category_dir in "$AGENTS_DIR"/*/; do
    if [ -d "$category_dir" ]; then
        category_name=$(basename "$category_dir")
        color=${CATEGORY_COLORS[$category_name]:-$CYAN}

        echo -e "${color}## ${category_name^}${NC}"
        echo ""

        for agent_dir in "$category_dir"/*/; do
            if [ -d "$agent_dir" ]; then
                agent_name=$(basename "$agent_dir")
                instructions="$agent_dir/instructions.md"

                if [ -f "$instructions" ]; then
                    # Parse YAML frontmatter for description
                    description=$(sed -n '/^---$/,/^---$/p' "$instructions" | grep "^description:" | sed 's/description:[[:space:]]*//')

                    echo -e "  ${CYAN}$agent_name${NC}"
                    if [ -n "$description" ]; then
                        echo -e "    $description"
                    fi
                    ((total_count++))
                fi
            fi
        done
        echo ""
    fi
done

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Total: $total_count agents"
echo ""
echo "Usage:"
echo "  claude --agent <agent-name>"
echo ""
