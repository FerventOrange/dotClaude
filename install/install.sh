#!/bin/bash
# dotClaude Install Script
# Installs Claude Code (if needed) and configures agent awareness
#
# Usage: ./install/install.sh [--skip-claude-install] [--level user|project|both] [--project-path /path/to/project]

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
INSTALL_LEVEL=""
PROJECT_PATH=""
for arg in "$@"; do
    case $arg in
        --skip-claude-install)
            SKIP_CLAUDE_INSTALL=true
            ;;
        --level)
            shift_next=true
            ;;
        --project-path)
            shift_next_project=true
            ;;
        *)
            if [ "$shift_next" = true ]; then
                INSTALL_LEVEL="$arg"
                shift_next=false
            elif [ "$shift_next_project" = true ]; then
                PROJECT_PATH="$arg"
                shift_next_project=false
            fi
            ;;
    esac
done

# Detect OS (Linux, macOS, and Windows/WSL supported)
detect_os() {
    case "$(uname -s)" in
        Linux*)     OS="linux";;
        Darwin*)    OS="macos";;
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
        linux|macos)
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
                if [ "$OS" = "macos" ]; then
                    echo "  - macOS: brew install node"
                else
                    echo "  - Ubuntu/Debian: sudo apt install nodejs npm"
                    echo "  - Fedora: sudo dnf install nodejs npm"
                fi
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
            echo -e "${RED}Unsupported OS. This script supports Linux, macOS, and Windows.${NC}"
            exit 1
            ;;
    esac
}

# Check if GitHub CLI is installed
check_gh_installed() {
    if command -v gh &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Install GitHub CLI
install_gh_cli() {
    echo -e "${YELLOW}Installing GitHub CLI...${NC}"

    case $OS in
        linux|macos)
            if command -v apt-get &> /dev/null; then
                echo "Using apt to install GitHub CLI..."
                (type -p wget >/dev/null || (sudo apt update && sudo apt-get install wget -y)) \
                    && sudo mkdir -p -m 755 /etc/apt/keyrings \
                    && out=$(wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg) \
                    && echo "$out" | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
                    && sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
                    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
                    && sudo apt update \
                    && sudo apt install gh -y
            elif command -v dnf &> /dev/null; then
                echo "Using dnf to install GitHub CLI..."
                sudo dnf install 'dnf-command(config-manager)' -y
                sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
                sudo dnf install gh -y
            elif command -v brew &> /dev/null; then
                echo "Using Homebrew to install GitHub CLI..."
                brew install gh
            else
                echo -e "${YELLOW}[!] Could not auto-install GitHub CLI. Install manually:${NC}"
                echo "  https://github.com/cli/cli#installation"
            fi
            ;;
        windows)
            echo -e "${YELLOW}On Windows, use the PowerShell install script or:${NC}"
            echo "  winget install GitHub.cli"
            ;;
        *)
            echo -e "${YELLOW}[!] Install GitHub CLI manually: https://github.com/cli/cli#installation${NC}"
            ;;
    esac
}

# Prompt for installation level
prompt_install_level() {
    if [ -n "$INSTALL_LEVEL" ]; then
        return
    fi

    echo -e "${BLUE}Select installation level:${NC}"
    echo "  1) User-level only    (~/.claude/CLAUDE.md + ~/.claude/agents/)"
    echo "  2) Project-level only (<project>/.claude/CLAUDE.md + .claude/agents/ + .gitignore)"
    echo "  3) Both               (user-level + project-level)"
    echo ""
    read -p "Choice [1/2/3] (default: 1): " choice

    case $choice in
        2) INSTALL_LEVEL="project" ;;
        3) INSTALL_LEVEL="both" ;;
        *) INSTALL_LEVEL="user" ;;
    esac
}

# Prompt for project path and validate
prompt_project_path() {
    if [ -n "$PROJECT_PATH" ]; then
        # Resolve to absolute path
        PROJECT_PATH="$(cd "$PROJECT_PATH" 2>/dev/null && pwd)" || {
            echo -e "${RED}[X] Directory does not exist: $PROJECT_PATH${NC}"
            exit 1
        }
    else
        read -p "Enter project root path: " PROJECT_PATH
        if [ -z "$PROJECT_PATH" ]; then
            echo -e "${RED}[X] No path provided.${NC}"
            exit 1
        fi
        # Resolve to absolute path
        PROJECT_PATH="$(cd "$PROJECT_PATH" 2>/dev/null && pwd)" || {
            echo -e "${RED}[X] Directory does not exist: $PROJECT_PATH${NC}"
            exit 1
        }
    fi

    # Validate it's a git repo
    if [ ! -d "$PROJECT_PATH/.git" ]; then
        echo -e "${RED}[X] Not a git repository: $PROJECT_PATH${NC}"
        echo "    No .git directory found. Project-level install requires a git repository."
        exit 1
    fi

    echo -e "${GREEN}[OK]${NC} Valid git repository: $PROJECT_PATH"
}

# Configure agent awareness at user level
configure_agent_awareness_user() {
    echo -e "${YELLOW}Configuring user-level agent awareness...${NC}"

    # Create config directory
    mkdir -p "$CLAUDE_CONFIG_DIR"

    # Check if custom instructions already exist
    if [ -f "$CUSTOM_INSTRUCTIONS_FILE" ]; then
        echo -e "${YELLOW}Existing custom instructions found at $CUSTOM_INSTRUCTIONS_FILE${NC}"
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
        echo -e "${GREEN}[OK] Custom instructions installed to $CUSTOM_INSTRUCTIONS_FILE${NC}"
    else
        echo -e "${RED}Warning: custom-instructions.md not found in install directory.${NC}"
    fi
}

# Configure agent awareness at project level
configure_agent_awareness_project() {
    echo -e "${YELLOW}Configuring project-level agent awareness...${NC}"

    local project_claude_dir="$PROJECT_PATH/.claude"
    local project_claude_md="$project_claude_dir/CLAUDE.md"

    # Create .claude directory
    mkdir -p "$project_claude_dir"

    # Check if CLAUDE.md already exists in project
    if [ -f "$project_claude_md" ]; then
        echo -e "${YELLOW}Existing CLAUDE.md found at $project_claude_md${NC}"
        read -p "Overwrite? (y/n): " overwrite
        if [ "$overwrite" != "y" ]; then
            echo "Keeping existing project CLAUDE.md."
            # Still update .gitignore
            update_gitignore
            return
        fi
        # Backup existing
        cp "$project_claude_md" "$project_claude_md.backup.$(date +%Y%m%d%H%M%S)"
        echo "Backup created."
    fi

    # Copy custom instructions to project .claude/ directory
    if [ -f "$DOTCLAUDE_DIR/install/custom-instructions.md" ]; then
        cp "$DOTCLAUDE_DIR/install/custom-instructions.md" "$project_claude_md"
        echo -e "${GREEN}[OK] Custom instructions installed to $project_claude_md${NC}"
    else
        echo -e "${RED}Warning: custom-instructions.md not found in install directory.${NC}"
    fi

    # Update .gitignore
    update_gitignore
}

# Add .claude/ to .gitignore
update_gitignore() {
    local gitignore_file="$PROJECT_PATH/.gitignore"
    local entry=".claude/"

    if [ -f "$gitignore_file" ]; then
        # Check if entry already exists
        if grep -qxF "$entry" "$gitignore_file" 2>/dev/null; then
            echo -e "${GREEN}[OK]${NC} .claude/ already in .gitignore"
            return
        fi
        # Append entry
        echo "" >> "$gitignore_file"
        echo "# dotClaude - project-level Claude Code configuration" >> "$gitignore_file"
        echo "$entry" >> "$gitignore_file"
        echo -e "${GREEN}[OK]${NC} Added .claude/ to existing .gitignore"
    else
        # Create .gitignore with entry
        echo "# dotClaude - project-level Claude Code configuration" > "$gitignore_file"
        echo "$entry" >> "$gitignore_file"
        echo -e "${GREEN}[OK]${NC} Created .gitignore with .claude/ entry"
    fi
}

# Install agents to a target directory (from category folders)
# Usage: install_agents <target_dir> <label>
install_agents() {
    local target_dir="$1"
    local label="$2"
    echo -e "${YELLOW}Installing agents ($label)...${NC}"

    # Create agents directory
    mkdir -p "$target_dir"

    # Source agents directory
    SOURCE_AGENTS_DIR="$DOTCLAUDE_DIR/agents"

    if [ ! -d "$SOURCE_AGENTS_DIR" ]; then
        echo -e "${YELLOW}[!] Source agents directory not found${NC}"
        return
    fi

    installed_count=0

    # Iterate through category directories (github, documentation, code, frontend, backend, data, testing, infrastructure)
    for category_dir in "$SOURCE_AGENTS_DIR"/*/; do
        if [ -d "$category_dir" ]; then
            category_name=$(basename "$category_dir")

            # Iterate through agents within each category
            for agent_dir in "$category_dir"/*/; do
                if [ -d "$agent_dir" ] && [ -f "$agent_dir/instructions.md" ]; then
                    agent_name=$(basename "$agent_dir")
                    dest_agent_dir="$target_dir/$agent_name"

                    # Copy/update agent
                    rm -rf "$dest_agent_dir"
                    cp -r "$agent_dir" "$dest_agent_dir"
                    echo "  Installed: $agent_name ($category_name)"
                    installed_count=$((installed_count + 1))
                fi
            done
        fi
    done

    echo -e "${GREEN}[OK] $installed_count agent(s) installed to $target_dir${NC}"
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

    # Check GitHub CLI
    if check_gh_installed; then
        GH_VERSION=$(gh --version 2>/dev/null | head -1 || echo "unknown")
        echo -e "${GREEN}[OK]${NC} GitHub CLI installed: $GH_VERSION"
    else
        echo -e "${YELLOW}[!]${NC} GitHub CLI not found (optional, needed for PR workflows)"
    fi

    # Check user-level custom instructions
    if [ "$INSTALL_LEVEL" = "user" ] || [ "$INSTALL_LEVEL" = "both" ]; then
        if [ -f "$CUSTOM_INSTRUCTIONS_FILE" ]; then
            echo -e "${GREEN}[OK]${NC} User-level instructions: $CUSTOM_INSTRUCTIONS_FILE"
        else
            echo -e "${RED}[X]${NC} User-level instructions not found"
        fi
    fi

    # Check project-level custom instructions
    if [ "$INSTALL_LEVEL" = "project" ] || [ "$INSTALL_LEVEL" = "both" ]; then
        if [ -f "$PROJECT_PATH/.claude/CLAUDE.md" ]; then
            echo -e "${GREEN}[OK]${NC} Project-level instructions: $PROJECT_PATH/.claude/CLAUDE.md"
        else
            echo -e "${RED}[X]${NC} Project-level instructions not found"
        fi
        if [ -f "$PROJECT_PATH/.gitignore" ] && grep -qxF ".claude/" "$PROJECT_PATH/.gitignore" 2>/dev/null; then
            echo -e "${GREEN}[OK]${NC} .claude/ in .gitignore"
        else
            echo -e "${YELLOW}[!]${NC} .claude/ not in .gitignore"
        fi
    fi

    # Check installed agents directory (per level)
    if [ "$INSTALL_LEVEL" = "user" ] || [ "$INSTALL_LEVEL" = "both" ]; then
        if [ -d "$AGENTS_INSTALL_DIR" ]; then
            AGENT_COUNT=$(find "$AGENTS_INSTALL_DIR" -maxdepth 1 -type d ! -name "agents" | wc -l)
            echo -e "${GREEN}[OK]${NC} User agents directory: $AGENTS_INSTALL_DIR ($AGENT_COUNT agents)"
        else
            echo -e "${RED}[X]${NC} User agents directory not found"
        fi
    fi
    if [ "$INSTALL_LEVEL" = "project" ] || [ "$INSTALL_LEVEL" = "both" ]; then
        local project_agents_dir="$PROJECT_PATH/.claude/agents"
        if [ -d "$project_agents_dir" ]; then
            AGENT_COUNT=$(find "$project_agents_dir" -maxdepth 1 -type d ! -name "agents" | wc -l)
            echo -e "${GREEN}[OK]${NC} Project agents directory: $project_agents_dir ($AGENT_COUNT agents)"
        else
            echo -e "${RED}[X]${NC} Project agents directory not found"
        fi
    fi

    # List agents (show from whichever level was installed)
    local list_dir="$AGENTS_INSTALL_DIR"
    if [ "$INSTALL_LEVEL" = "project" ]; then
        list_dir="$PROJECT_PATH/.claude/agents"
    fi
    echo ""
    echo "Installed agents:"
    for agent_dir in "$list_dir"/*/; do
        if [ -d "$agent_dir" ]; then
            agent_name=$(basename "$agent_dir")
            echo "  - $agent_name"
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

    # Step 2: Check/Install GitHub CLI
    echo -e "${BLUE}Step 2: GitHub CLI${NC}"
    if check_gh_installed; then
        GH_VERSION=$(gh --version 2>/dev/null | head -1 || echo "installed")
        echo -e "${GREEN}[OK] GitHub CLI already installed${NC} ($GH_VERSION)"
    else
        install_gh_cli
    fi
    echo ""

    # Step 3: Select installation level
    echo -e "${BLUE}Step 3: Installation Level${NC}"
    prompt_install_level
    echo -e "${GREEN}[OK]${NC} Install level: $INSTALL_LEVEL"

    # If project or both, get and validate project path
    if [ "$INSTALL_LEVEL" = "project" ] || [ "$INSTALL_LEVEL" = "both" ]; then
        prompt_project_path
    fi
    echo ""

    # Step 4: Configure agent awareness
    echo -e "${BLUE}Step 4: Agent Awareness Configuration${NC}"
    if [ "$INSTALL_LEVEL" = "user" ] || [ "$INSTALL_LEVEL" = "both" ]; then
        configure_agent_awareness_user
    fi
    if [ "$INSTALL_LEVEL" = "project" ] || [ "$INSTALL_LEVEL" = "both" ]; then
        configure_agent_awareness_project
    fi
    echo ""

    # Step 5: Install agents to matching scope
    echo -e "${BLUE}Step 5: Install Agents${NC}"
    if [ "$INSTALL_LEVEL" = "user" ] || [ "$INSTALL_LEVEL" = "both" ]; then
        install_agents "$AGENTS_INSTALL_DIR" "user-level"
    fi
    if [ "$INSTALL_LEVEL" = "project" ] || [ "$INSTALL_LEVEL" = "both" ]; then
        install_agents "$PROJECT_PATH/.claude/agents" "project-level"
    fi
    echo ""

    # Step 6: Verify
    verify_installation

    echo ""
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}       Installation Complete!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo "Installed to:"
    if [ "$INSTALL_LEVEL" = "user" ] || [ "$INSTALL_LEVEL" = "both" ]; then
        echo "  - User instructions: $CUSTOM_INSTRUCTIONS_FILE"
        echo "  - User agents: $AGENTS_INSTALL_DIR"
    fi
    if [ "$INSTALL_LEVEL" = "project" ] || [ "$INSTALL_LEVEL" = "both" ]; then
        echo "  - Project instructions: $PROJECT_PATH/.claude/CLAUDE.md"
        echo "  - Project agents: $PROJECT_PATH/.claude/agents"
        echo "  - .gitignore updated: $PROJECT_PATH/.gitignore"
    fi
    echo ""
    echo "Next steps:"
    echo "  1. Start Claude Code: claude"
    echo "  2. Test agent awareness: Ask 'help me create project documentation'"
    echo "  3. List agents: ./install/list-agents.sh"
    echo ""
}

main "$@"
