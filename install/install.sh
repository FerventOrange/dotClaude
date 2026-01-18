#!/bin/bash
# dotClaude Install Script
# Installs Claude Code (if needed) and configures agent awareness
#
# Usage: ./install/install.sh [--skip-claude-install]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOTCLAUDE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLAUDE_CONFIG_DIR="$HOME/.claude"
CUSTOM_INSTRUCTIONS_FILE="$CLAUDE_CONFIG_DIR/CLAUDE.md"
AGENTS_INSTALL_DIR="$CLAUDE_CONFIG_DIR/agents"

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}       dotClaude Installation Script${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Parse arguments
SKIP_CLAUDE_INSTALL=false
for arg in "$@"; do
    case $arg in
        --skip-claude-install)
            SKIP_CLAUDE_INSTALL=true
            shift
            ;;
    esac
done

# Detect OS (Linux and Windows/WSL supported)
detect_os() {
    case "$(uname -s)" in
        Linux*)     OS="linux";;
        MINGW*|MSYS*|CYGWIN*) OS="windows";;
        *)          OS="unknown";;
    esac
    echo "$OS"
}

OS=$(detect_os)
echo -e "${GREEN}Detected OS:${NC} $OS"
echo ""

# Check if Claude Code is installed
check_claude_installed() {
    if command -v claude &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Install Claude Code
install_claude_code() {
    echo -e "${YELLOW}Installing Claude Code...${NC}"

    case $OS in
        linux)
            if command -v npm &> /dev/null; then
                echo "Using npm to install Claude Code..."
                npm install -g @anthropic-ai/claude-code
                NPM_BIN="$(npm bin -g 2>/dev/null || true)"
                if [ -n "$NPM_BIN" ] && ! echo ":$PATH:" | grep -q ":$NPM_BIN:"; then
                    export PATH="$NPM_BIN:$PATH"
                fi
                if ! command -v claude &> /dev/null; then
                    echo -e "${YELLOW}[!] Claude was installed, but is not on PATH yet. Restart your shell or add npm's global bin to PATH.${NC}"
                fi
            else
                echo -e "${RED}npm not found. Please install Node.js first:${NC}"
                echo "  - Visit: https://nodejs.org/"
                echo "  - Ubuntu/Debian: sudo apt install nodejs npm"
                echo "  - Fedora: sudo dnf install nodejs npm"
                echo ""
                echo "After installing Node.js, run this script again."
                exit 1
            fi
            ;;
        windows)
            echo -e "${YELLOW}On Windows, use the PowerShell install script:${NC}"
            echo "  .\\install\\install.ps1"
            echo ""
            echo "Or install manually:"
            echo "  1. Open PowerShell as Administrator"
            echo "  2. Run: npm install -g @anthropic-ai/claude-code"
            exit 1
            ;;
        *)
            echo -e "${RED}Unsupported OS. This script supports Linux and Windows.${NC}"
            exit 1
            ;;
    esac
}

# Configure agent awareness
configure_agent_awareness() {
    echo -e "${YELLOW}Configuring agent awareness...${NC}"

    # Create config directory
    mkdir -p "$CLAUDE_CONFIG_DIR"

    # Check if custom instructions already exist
    if [ -f "$CUSTOM_INSTRUCTIONS_FILE" ]; then
        echo -e "${YELLOW}Existing custom instructions found.${NC}"
        read -p "Overwrite? (y/n): " overwrite
        if [ "$overwrite" != "y" ]; then
            echo "Keeping existing instructions."
            return
        fi
        # Backup existing
        cp "$CUSTOM_INSTRUCTIONS_FILE" "$CUSTOM_INSTRUCTIONS_FILE.backup.$(date +%Y%m%d%H%M%S)"
        echo "Backup created."
    fi

    # Copy custom instructions
    if [ -f "$DOTCLAUDE_DIR/install/custom-instructions.md" ]; then
        cp "$DOTCLAUDE_DIR/install/custom-instructions.md" "$CUSTOM_INSTRUCTIONS_FILE"
        echo -e "${GREEN}[OK] Custom instructions installed${NC}"
    else
        echo -e "${RED}Warning: custom-instructions.md not found in install directory.${NC}"
    fi
}

# Install agents to ~/.claude/agents
install_agents() {
    echo -e "${YELLOW}Installing agents...${NC}"

    # Create agents directory
    mkdir -p "$AGENTS_INSTALL_DIR"

    # Source agents directory
    SOURCE_AGENTS_DIR="$DOTCLAUDE_DIR/agents"

    if [ ! -d "$SOURCE_AGENTS_DIR" ]; then
        echo -e "${YELLOW}[!] Source agents directory not found${NC}"
        return
    fi

    installed_count=0
    updated_count=0

    for agent_dir in "$SOURCE_AGENTS_DIR"/*/; do
        if [ -d "$agent_dir" ]; then
            agent_name=$(basename "$agent_dir")
            dest_agent_dir="$AGENTS_INSTALL_DIR/$agent_name"

            if [ -d "$dest_agent_dir" ]; then
                # Agent exists - check if update needed
                source_json="$agent_dir/agent.json"
                dest_json="$dest_agent_dir/agent.json"

                if [ -f "$source_json" ] && [ -f "$dest_json" ]; then
                    source_version=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$source_json" | sed 's/.*"\([^"]*\)"$/\1/')
                    dest_version=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$dest_json" | sed 's/.*"\([^"]*\)"$/\1/')

                    if [ "$source_version" != "$dest_version" ]; then
                        # Update agent
                        rm -rf "$dest_agent_dir"
                        cp -r "$agent_dir" "$dest_agent_dir"
                        echo "  Updated: $agent_name (v$dest_version -> v$source_version)"
                        ((updated_count++))
                    fi
                fi
            else
                # New agent - install
                cp -r "$agent_dir" "$dest_agent_dir"
                echo "  Installed: $agent_name"
                ((installed_count++))
            fi
        fi
    done

    if [ $installed_count -gt 0 ]; then
        echo -e "${GREEN}[OK] $installed_count new agent(s) installed${NC}"
    fi
    if [ $updated_count -gt 0 ]; then
        echo -e "${GREEN}[OK] $updated_count agent(s) updated${NC}"
    fi
    if [ $installed_count -eq 0 ] && [ $updated_count -eq 0 ]; then
        echo -e "${GREEN}[OK] All agents up to date${NC}"
    fi
}

# Verify installation
verify_installation() {
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}           Verification${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""

    # Check Claude Code
    if check_claude_installed; then
        CLAUDE_VERSION=$(claude --version 2>/dev/null || echo "unknown")
        echo -e "${GREEN}[OK]${NC} Claude Code installed: $CLAUDE_VERSION"
    else
        echo -e "${RED}[X]${NC} Claude Code not found"
    fi

    # Check custom instructions
    if [ -f "$CUSTOM_INSTRUCTIONS_FILE" ]; then
        echo -e "${GREEN}[OK]${NC} Custom instructions: $CUSTOM_INSTRUCTIONS_FILE"
    else
        echo -e "${RED}[X]${NC} Custom instructions not found"
    fi

    # Check installed agents directory
    if [ -d "$AGENTS_INSTALL_DIR" ]; then
        AGENT_COUNT=$(find "$AGENTS_INSTALL_DIR" -maxdepth 1 -type d ! -name "agents" | wc -l)
        echo -e "${GREEN}[OK]${NC} Agents directory: $AGENTS_INSTALL_DIR"
        echo -e "${GREEN}[OK]${NC} Agents installed: $AGENT_COUNT"
    else
        echo -e "${RED}[X]${NC} Agents directory not found"
    fi

    # List agents
    echo ""
    echo "Installed agents:"
    for agent_dir in "$AGENTS_INSTALL_DIR"/*/; do
        if [ -d "$agent_dir" ]; then
            agent_name=$(basename "$agent_dir")
            agent_json="$agent_dir/agent.json"
            if [ -f "$agent_json" ]; then
                version=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$agent_json" | sed 's/.*"\([^"]*\)"$/\1/')
                echo "  - $agent_name (v$version)"
            else
                echo "  - $agent_name"
            fi
        fi
    done
}

# Main installation flow
main() {
    # Step 1: Check/Install Claude Code
    echo -e "${BLUE}Step 1: Claude Code${NC}"
    if check_claude_installed; then
        CLAUDE_VERSION=$(claude --version 2>/dev/null || echo "installed")
        echo -e "${GREEN}[OK] Claude Code already installed${NC} ($CLAUDE_VERSION)"
    else
        if [ "$SKIP_CLAUDE_INSTALL" = true ]; then
            echo -e "${YELLOW}[!] Skipping Claude Code installation (--skip-claude-install)${NC}"
        else
            install_claude_code
        fi
    fi
    echo ""

    # Step 2: Configure agent awareness
    echo -e "${BLUE}Step 2: Agent Awareness Configuration${NC}"
    configure_agent_awareness
    echo ""

    # Step 3: Install agents
    echo -e "${BLUE}Step 3: Install Agents${NC}"
    install_agents
    echo ""

    # Step 4: Verify
    verify_installation

    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}       Installation Complete!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo "Installed to:"
    echo "  - Custom instructions: $CUSTOM_INSTRUCTIONS_FILE"
    echo "  - Agents directory: $AGENTS_INSTALL_DIR"
    echo ""
    echo "Next steps:"
    echo "  1. Start Claude Code: claude"
    echo "  2. Test agent awareness: Ask 'help me create a README'"
    echo "  3. List agents: ./install/list-agents.sh"
    echo ""
}

main "$@"
