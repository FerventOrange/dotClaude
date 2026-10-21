#!/bin/bash
# list-agents.sh - List dotClaude agents (agents/*.md) with their descriptions
#
# Usage: ./install/list-agents.sh

set -e

AGENTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/agents"
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [ ! -d "$AGENTS_DIR" ]; then
    echo -e "${YELLOW}No agents directory found at $AGENTS_DIR${NC}"
    exit 1
fi

# frontmatter_value <file> <key>: value of <key> in the leading --- block
frontmatter_value() {
    sed -n '2,/^---$/p' "$1" | grep -m1 "^$2:" | sed "s/^$2:[[:space:]]*//" || true
}

count=0
for file in "$AGENTS_DIR"/*.md; do
    [ -f "$file" ] || continue
    name="$(frontmatter_value "$file" name)"
    [ -n "$name" ] || name="$(basename "$file" .md)"
    echo -e "${CYAN}$name${NC}"
    description="$(frontmatter_value "$file" description)"
    [ -n "$description" ] && echo "    $description"
    count=$((count + 1))
done

echo ""
echo "Total: $count agents"
