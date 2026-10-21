#!/bin/bash
# dotClaude install script
# Installs prerequisites (Claude Code, GitHub CLI), the orchestrator CLAUDE.md, and agents/*.md.
#
# Usage: ./install/install.sh [--skip-claude-install] [--level user|project|both]
#                             [--project-path /path/to/project] [--force]
#   --force  answer "yes" to all confirmations (overwrite CLAUDE.md with backup, remove legacy files)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOTCLAUDE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_INSTRUCTIONS="$DOTCLAUDE_DIR/install/custom-instructions.md"
SOURCE_AGENTS_DIR="$DOTCLAUDE_DIR/agents"
CLAUDE_CONFIG_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
USER_CLAUDE_MD="$CLAUDE_CONFIG_DIR/CLAUDE.md"
USER_AGENTS_DIR="$CLAUDE_CONFIG_DIR/agents"
LEGACY_HOOK="$CLAUDE_CONFIG_DIR/hooks/block-git-commands.js"

# Agent names from dotClaude v2 (category/<name>/instructions.md layout)
LEGACY_AGENTS="api-endpoint-agent auth-agent seed-data-agent code-cleanup-agent code-linting-agent
code-review-agent dependency-agent python-agent security-review-agent terraform-agent api-client-agent
sql-migration-agent sql-query-agent sql-schema-agent state-management-agent validation-schema-agent
api-doc-agent changelog-agent doc-review-agent documentation-agent accessibility-agent
component-generator-agent form-builder-agent route-generator-agent git-commit-agent git-issues-agent
git-pr-agent git-sync-agent git-tags-agent pr-review-agent agent-creator agent-review-agent
agent-updater cicd-agent deployment-agent docker-agent dotclaude-updater env-config-agent gitops-agent
debug-agent integration-test-agent unit-test-agent readme-agent"

SKIP_CLAUDE_INSTALL=false
FORCE=false
INSTALL_LEVEL=""
PROJECT_PATH=""

while [ $# -gt 0 ]; do
    case "$1" in
        --skip-claude-install) SKIP_CLAUDE_INSTALL=true ;;
        --force) FORCE=true ;;
        --level|--project-path)
            if [ $# -lt 2 ] || [ -z "$2" ] || [ "${2#--}" != "$2" ]; then
                echo -e "${RED}[X] $1 requires a value${NC}"; exit 1
            fi
            if [ "$1" = "--level" ]; then INSTALL_LEVEL="$2"; else PROJECT_PATH="$2"; fi
            shift ;;
        *) echo -e "${RED}[X] Unknown argument: $1${NC}"; exit 1 ;;
    esac
    shift
done

case "$INSTALL_LEVEL" in
    ""|user|project|both) ;;
    *) echo -e "${RED}[X] --level must be user, project, or both${NC}"; exit 1 ;;
esac

ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[X]${NC} $1"; }
step() { echo -e "${BLUE}$1${NC}"; }

# confirm <prompt>: returns 0 on yes. --force answers yes.
confirm() {
    if [ "$FORCE" = true ]; then return 0; fi
    local answer
    read -r -p "$1 [y/N]: " answer
    [ "$answer" = "y" ] || [ "$answer" = "Y" ]
}

wants_user()    { [ "$INSTALL_LEVEL" = "user" ] || [ "$INSTALL_LEVEL" = "both" ]; }
wants_project() { [ "$INSTALL_LEVEL" = "project" ] || [ "$INSTALL_LEVEL" = "both" ]; }

case "$(uname -s)" in
    Linux*) OS="linux" ;;
    Darwin*) OS="macos" ;;
    MINGW*|MSYS*|CYGWIN*) OS="windows" ;;
    *) OS="unknown" ;;
esac

install_claude_code() {
    if [ "$OS" = "windows" ]; then
        warn "On Windows, use .\\install\\install.ps1 or run: npm install -g @anthropic-ai/claude-code"
        exit 1
    fi
    if ! command -v npm &> /dev/null; then
        err "npm not found. Install Node.js (https://nodejs.org/) and run this script again."
        exit 1
    fi
    echo "Installing Claude Code via npm..."
    npm install -g @anthropic-ai/claude-code
    if ! command -v claude &> /dev/null; then
        warn "Claude Code installed but not on PATH yet. Restart your shell or add npm's global bin to PATH."
    fi
}

install_gh_cli() {
    echo "Installing GitHub CLI..."
    if command -v brew &> /dev/null; then
        brew install gh
    elif command -v apt-get &> /dev/null; then
        (type -p wget >/dev/null || (sudo apt update && sudo apt-get install wget -y)) \
            && sudo mkdir -p -m 755 /etc/apt/keyrings \
            && wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
            && sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
            && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
            && sudo apt update \
            && sudo apt install gh -y
    elif command -v dnf &> /dev/null; then
        sudo dnf install 'dnf-command(config-manager)' -y
        sudo dnf config-manager --add-repo https://cli.github.com/packages/rpm/gh-cli.repo
        sudo dnf install gh -y
    else
        warn "Could not auto-install GitHub CLI. Install manually: https://github.com/cli/cli#installation"
    fi
}

prompt_install_level() {
    [ -n "$INSTALL_LEVEL" ] && return
    echo "Select installation level:"
    echo "  1) User    (~/.claude/CLAUDE.md + ~/.claude/agents/)"
    echo "  2) Project (<project>/.claude/CLAUDE.md + .claude/agents/ + .gitignore)"
    echo "  3) Both"
    local choice
    read -r -p "Choice [1/2/3] (default: 1): " choice || true
    case "$choice" in
        2) INSTALL_LEVEL="project" ;;
        3) INSTALL_LEVEL="both" ;;
        *) INSTALL_LEVEL="user" ;;
    esac
}

resolve_project_path() {
    if [ -z "$PROJECT_PATH" ]; then
        read -r -p "Enter project root path: " PROJECT_PATH || true
    fi
    [ -z "$PROJECT_PATH" ] && { err "No path provided."; exit 1; }
    local input="$PROJECT_PATH"
    PROJECT_PATH="$(cd "$input" 2>/dev/null && pwd)" || { err "Directory does not exist: $input"; exit 1; }
    if [ ! -d "$PROJECT_PATH/.git" ]; then
        err "Not a git repository: $PROJECT_PATH (project-level install requires one)"
        exit 1
    fi
    ok "Valid git repository: $PROJECT_PATH"
}

# install_claude_md <destination>
install_claude_md() {
    local dest="$1"
    [ -f "$SOURCE_INSTRUCTIONS" ] || { err "Missing $SOURCE_INSTRUCTIONS"; return; }
    mkdir -p "$(dirname "$dest")"
    if [ -f "$dest" ]; then
        if ! confirm "Existing $dest found. Overwrite (a backup is kept)?"; then
            echo "Keeping existing $dest"
            return
        fi
        local backup
        backup="$dest.backup.$(date +%Y%m%d%H%M%S)"
        cp "$dest" "$backup"
        echo "Backup created: $backup"
    fi
    cp "$SOURCE_INSTRUCTIONS" "$dest"
    ok "Instructions installed to $dest"
}

update_gitignore() {
    local file="$PROJECT_PATH/.gitignore"
    if [ -f "$file" ] && grep -qxF ".claude/" "$file"; then
        ok ".claude/ already in .gitignore"
        return
    fi
    printf '\n# dotClaude - project-level Claude Code configuration\n.claude/\n' >> "$file"
    ok "Added .claude/ to $file"
}

# is_legacy_agent_dir <dir>: dir holds an old-format agent
is_legacy_agent_dir() {
    local dir="$1" name
    name="$(basename "$dir")"
    [ -f "$dir/instructions.md" ] || return 1
    case " $(echo $LEGACY_AGENTS) " in *" $name "*) return 0 ;; esac
    sed -n '2,/^---$/p' "$dir/instructions.md" | grep -qE '^(version|mcp_servers):'
}

# migrate_legacy_agents <agents_dir>: remove v2 agent directories after confirmation
migrate_legacy_agents() {
    local agents_dir="$1" dir
    [ -d "$agents_dir" ] || return 0
    local legacy=()
    for dir in "$agents_dir"/*/; do
        [ -d "$dir" ] || continue
        dir="${dir%/}"
        is_legacy_agent_dir "$dir" && legacy+=("$dir")
    done
    if [ ${#legacy[@]} -eq 0 ]; then
        ok "No legacy agent directories in $agents_dir"
        return 0
    fi
    warn "Found ${#legacy[@]} legacy agent director(ies) in $agents_dir:"
    for dir in "${legacy[@]}"; do echo "  - $(basename "$dir")"; done
    if confirm "Remove them?"; then
        for dir in "${legacy[@]}"; do rm -rf "$dir"; done
        ok "Removed ${#legacy[@]} legacy agent director(ies)"
    else
        echo "Kept legacy agent directories."
    fi
}

remove_legacy_hook() {
    [ -f "$LEGACY_HOOK" ] || return 0
    local settings="$CLAUDE_CONFIG_DIR/settings.json"
    if [ -f "$settings" ] && grep -q "block-git-commands" "$settings"; then
        warn "$LEGACY_HOOK is still referenced in $settings; leaving it in place."
        return 0
    fi
    warn "Orphaned legacy hook found: $LEGACY_HOOK"
    if confirm "Remove it?"; then
        rm -f "$LEGACY_HOOK"
        ok "Removed $LEGACY_HOOK"
    fi
}

# install_agents <target_dir>
install_agents() {
    local target="$1" file count=0
    mkdir -p "$target"
    for file in "$SOURCE_AGENTS_DIR"/*.md; do
        [ -f "$file" ] || continue
        cp "$file" "$target/"
        echo "  Installed: $(basename "$file" .md)"
        count=$((count + 1))
    done
    if [ "$count" -eq 0 ]; then
        warn "No agents found in $SOURCE_AGENTS_DIR"
    else
        ok "$count agent(s) installed to $target"
    fi
}

verify_installation() {
    echo ""
    step "Verification"
    if command -v claude &> /dev/null; then ok "Claude Code: $(claude --version 2>/dev/null || echo installed)"; else err "Claude Code not found"; fi
    if command -v gh &> /dev/null; then ok "GitHub CLI: $(gh --version 2>/dev/null | head -1)"; else warn "GitHub CLI not found (needed for PR workflows)"; fi
}

main() {
    echo -e "${BLUE}dotClaude installer${NC} (OS: $OS)"
    echo ""

    step "Step 1: Prerequisites"
    if command -v claude &> /dev/null; then
        ok "Claude Code already installed"
    elif [ "$SKIP_CLAUDE_INSTALL" = true ]; then
        warn "Skipping Claude Code installation (--skip-claude-install)"
    else
        install_claude_code
    fi
    if command -v gh &> /dev/null; then ok "GitHub CLI already installed"; else install_gh_cli; fi
    echo ""

    step "Step 2: Installation level"
    prompt_install_level
    ok "Install level: $INSTALL_LEVEL"
    if wants_project; then resolve_project_path; fi
    echo ""

    step "Step 3: Instructions (CLAUDE.md)"
    if wants_user; then install_claude_md "$USER_CLAUDE_MD"; fi
    if wants_project; then
        install_claude_md "$PROJECT_PATH/.claude/CLAUDE.md"
        update_gitignore
    fi
    echo ""

    step "Step 4: Migrate legacy agents"
    if wants_user; then migrate_legacy_agents "$USER_AGENTS_DIR"; fi
    if wants_project; then migrate_legacy_agents "$PROJECT_PATH/.claude/agents"; fi
    if wants_user; then remove_legacy_hook; fi
    echo ""

    step "Step 5: Install agents"
    if wants_user; then install_agents "$USER_AGENTS_DIR"; fi
    if wants_project; then install_agents "$PROJECT_PATH/.claude/agents"; fi

    verify_installation
    echo ""
    ok "Installation complete. Start Claude Code with 'claude'; list agents with ./install/list-agents.sh"
}

main
