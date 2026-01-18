#!/bin/bash
# list-agents.sh - Display available agents and their details
#
# Usage: ./install/list-agents.sh [--verbose]

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOTCLAUDE_DIR="$(dirname "$SCRIPT_DIR")"
AGENTS_DIR="$DOTCLAUDE_DIR/agents"

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Parse arguments
VERBOSE=false
for arg in "$@"; do
    case $arg in
        --verbose|-v)
            VERBOSE=true
            ;;
    esac
done

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

# Count agents
AGENT_COUNT=$(find "$AGENTS_DIR" -maxdepth 1 -type d ! -name "agents" | wc -l)
echo -e "${GREEN}Total agents: $AGENT_COUNT${NC}"
echo ""

# List agents
for agent_dir in "$AGENTS_DIR"/*/; do
    if [ -d "$agent_dir" ]; then
        agent_name=$(basename "$agent_dir")
        agent_json="$agent_dir/agent.json"

        if [ -f "$agent_json" ]; then
            # Parse agent.json for details
            description=$(grep -o '"description"[[:space:]]*:[[:space:]]*"[^"]*"' "$agent_json" 2>/dev/null | sed 's/"description"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' || echo "No description")
            version=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$agent_json" 2>/dev/null | sed 's/"version"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' || echo "1.0.0")
            scope=$(grep -o '"scope"[[:space:]]*:[[:space:]]*"[^"]*"' "$agent_json" 2>/dev/null | sed 's/"scope"[[:space:]]*:[[:space:]]*"\([^"]*\)"/\1/' || echo "general")

            echo -e "${CYAN}$agent_name${NC} (v$version)"
            echo -e "  ${GREEN}Description:${NC} $description"
            echo -e "  ${GREEN}Scope:${NC} $scope"

            if [ "$VERBOSE" = true ]; then
                # Show MCP requirements
                mcp_file="$agent_dir/mcp-requirements.txt"
                if [ -f "$mcp_file" ]; then
                    mcp_servers=$(grep -v "^#" "$mcp_file" | grep -v "^$" | tr '\n' ', ' | sed 's/,$//')
                    if [ -n "$mcp_servers" ]; then
                        echo -e "  ${GREEN}MCP Servers:${NC} $mcp_servers"
                    fi
                fi

                # Show constraints
                constraints=$(grep -o '"constraints"[[:space:]]*:[[:space:]]*\[[^]]*\]' "$agent_json" 2>/dev/null || echo "")
                if [ -n "$constraints" ]; then
                    echo -e "  ${GREEN}Constraints:${NC}"
                    echo "$constraints" | grep -o '"[^"]*"' | sed 's/"//g' | head -3 | while read -r c; do
                        echo "    - $c"
                    done
                fi
            fi

            echo ""
        else
            echo -e "${CYAN}$agent_name${NC}"
            echo "  (No agent.json found)"
            echo ""
        fi
    fi
done

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Usage:"
echo "  View agent details: cat agents/<agent-name>/README.md"
echo "  Use an agent:       claude --agent <agent-name>"
echo ""

if [ "$VERBOSE" = false ]; then
    echo "Tip: Use --verbose for more details"
    echo ""
fi
