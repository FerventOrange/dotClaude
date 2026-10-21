# dotClaude install script for Windows
# Installs prerequisites (Claude Code, GitHub CLI), the orchestrator CLAUDE.md, and agents/*.md.
#
# Usage: .\install\install.ps1 [-SkipClaudeInstall] [-InstallLevel user|project|both]
#                              [-ProjectPath C:\path\to\project] [-Force]
#   -Force  answer "yes" to all confirmations (overwrite CLAUDE.md with backup, remove legacy files)

param(
    [switch]$SkipClaudeInstall,
    [ValidateSet("user", "project", "both")]
    [string]$InstallLevel = "",
    [string]$ProjectPath = "",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

$DotClaudeDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$SourceInstructions = Join-Path $DotClaudeDir "install\custom-instructions.md"
$SourceAgentsDir = Join-Path $DotClaudeDir "agents"
$ClaudeConfigDir = if ($env:CLAUDE_CONFIG_DIR) { $env:CLAUDE_CONFIG_DIR } else { Join-Path $env:USERPROFILE ".claude" }
$UserClaudeMd = Join-Path $ClaudeConfigDir "CLAUDE.md"
$UserAgentsDir = Join-Path $ClaudeConfigDir "agents"
$LegacyHook = Join-Path $ClaudeConfigDir "hooks\block-git-commands.js"

# Agent names from dotClaude v2 (category/<name>/instructions.md layout)
$LegacyAgents = @(
    "api-endpoint-agent", "auth-agent", "seed-data-agent", "code-cleanup-agent", "code-linting-agent",
    "code-review-agent", "dependency-agent", "python-agent", "security-review-agent", "terraform-agent",
    "api-client-agent", "sql-migration-agent", "sql-query-agent", "sql-schema-agent",
    "state-management-agent", "validation-schema-agent", "api-doc-agent", "changelog-agent",
    "doc-review-agent", "documentation-agent", "accessibility-agent", "component-generator-agent",
    "form-builder-agent", "route-generator-agent", "git-commit-agent", "git-issues-agent", "git-pr-agent",
    "git-sync-agent", "git-tags-agent", "pr-review-agent", "agent-creator", "agent-review-agent",
    "agent-updater", "cicd-agent", "deployment-agent", "docker-agent", "dotclaude-updater",
    "env-config-agent", "gitops-agent", "debug-agent", "integration-test-agent", "unit-test-agent",
    "readme-agent"
)

function Write-Ok   { param([string]$Text) Write-Host "[OK] $Text" -ForegroundColor Green }
function Write-Warn { param([string]$Text) Write-Host "[!] $Text" -ForegroundColor Yellow }
function Write-Err  { param([string]$Text) Write-Host "[X] $Text" -ForegroundColor Red }
function Write-Step { param([string]$Text) Write-Host $Text -ForegroundColor Blue }

# Returns $true on yes. -Force answers yes.
function Confirm-Action {
    param([string]$Prompt)
    if ($Force) { return $true }
    $answer = Read-Host "$Prompt [y/N]"
    return ($answer -eq "y" -or $answer -eq "Y")
}

function Test-Command {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Get-ToolVersion {
    param([string]$Name)
    try { return (& $Name --version 2>$null | Select-Object -First 1) } catch { return "installed" }
}

function Test-WantsUser    { return ($script:InstallLevel -eq "user" -or $script:InstallLevel -eq "both") }
function Test-WantsProject { return ($script:InstallLevel -eq "project" -or $script:InstallLevel -eq "both") }

function Install-ClaudeCode {
    if (-not (Test-Command npm)) {
        Write-Err "npm not found. Install Node.js (https://nodejs.org/ or: winget install OpenJS.NodeJS) and run this script again."
        exit 1
    }
    Write-Host "Installing Claude Code via npm..."
    npm install -g @anthropic-ai/claude-code
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to install Claude Code"
        exit 1
    }
    if (-not (Test-Command claude)) {
        Write-Warn "Claude Code installed but not on PATH yet. Restart your terminal or add npm's global bin to PATH."
    }
}

function Install-GhCli {
    if (-not (Test-Command winget)) {
        Write-Warn "winget not found. Install GitHub CLI manually: https://github.com/cli/cli#installation"
        return
    }
    Write-Host "Installing GitHub CLI via winget..."
    winget install GitHub.cli --accept-source-agreements --accept-package-agreements
    if ($LASTEXITCODE -ne 0) { Write-Warn "winget returned a non-zero exit code" }
    $ghPath = "C:\Program Files\GitHub CLI"
    if ((Test-Path $ghPath) -and (($env:Path -split ';') -notcontains $ghPath)) {
        $env:Path = "$ghPath;$env:Path"
    }
}

function Select-InstallLevel {
    if ($script:InstallLevel) { return }
    Write-Host "Select installation level:"
    Write-Host "  1) User    (~/.claude/CLAUDE.md + ~/.claude/agents/)"
    Write-Host "  2) Project (<project>/.claude/CLAUDE.md + .claude/agents/ + .gitignore)"
    Write-Host "  3) Both"
    switch ([string](Read-Host "Choice [1/2/3] (default: 1)")) {
        "2" { $script:InstallLevel = "project" }
        "3" { $script:InstallLevel = "both" }
        default { $script:InstallLevel = "user" }
    }
}

function Resolve-ProjectPath {
    if (-not $script:ProjectPath) { $script:ProjectPath = Read-Host "Enter project root path" }
    if (-not $script:ProjectPath) { Write-Err "No path provided."; exit 1 }
    if (-not (Test-Path $script:ProjectPath -PathType Container)) {
        Write-Err "Directory does not exist: $script:ProjectPath"
        exit 1
    }
    $script:ProjectPath = (Resolve-Path $script:ProjectPath).Path
    if (-not (Test-Path (Join-Path $script:ProjectPath ".git"))) {
        Write-Err "Not a git repository: $script:ProjectPath (project-level install requires one)"
        exit 1
    }
    Write-Ok "Valid git repository: $script:ProjectPath"
}

function Install-ClaudeMd {
    param([string]$Destination)
    if (-not (Test-Path $SourceInstructions)) { Write-Err "Missing $SourceInstructions"; return }
    New-Item -ItemType Directory -Path (Split-Path -Parent $Destination) -Force | Out-Null
    if (Test-Path $Destination) {
        if (-not (Confirm-Action "Existing $Destination found. Overwrite (a backup is kept)?")) {
            Write-Host "Keeping existing $Destination"
            return
        }
        $backup = "$Destination.backup.$(Get-Date -Format 'yyyyMMddHHmmss')"
        Copy-Item $Destination $backup
        Write-Host "Backup created: $backup"
    }
    Copy-Item $SourceInstructions $Destination -Force
    Write-Ok "Instructions installed to $Destination"
}

function Update-Gitignore {
    $file = Join-Path $script:ProjectPath ".gitignore"
    if ((Test-Path $file) -and ((Get-Content $file | ForEach-Object { $_.Trim() }) -contains ".claude/")) {
        Write-Ok ".claude/ already in .gitignore"
        return
    }
    Add-Content -Path $file -Value "`n# dotClaude - project-level Claude Code configuration`n.claude/" -Encoding ascii
    Write-Ok "Added .claude/ to $file"
}

function Test-LegacyAgentDir {
    param([System.IO.DirectoryInfo]$Dir)
    $instructions = Join-Path $Dir.FullName "instructions.md"
    if (-not (Test-Path $instructions)) { return $false }
    if ($LegacyAgents -contains $Dir.Name) { return $true }
    $content = Get-Content $instructions -Raw
    if (-not $content) { return $false }
    $frontmatter = [regex]::Match($content, '(?s)\A---\r?\n(.*?)\r?\n---')
    return ($frontmatter.Success -and $frontmatter.Groups[1].Value -match '(?m)^(version|mcp_servers):')
}

# Remove v2 agent directories after confirmation
function Remove-LegacyAgents {
    param([string]$AgentsDir)
    if (-not (Test-Path $AgentsDir)) { return }
    $legacy = @(Get-ChildItem -Path $AgentsDir -Directory | Where-Object { Test-LegacyAgentDir $_ })
    if ($legacy.Count -eq 0) {
        Write-Ok "No legacy agent directories in $AgentsDir"
        return
    }
    Write-Warn "Found $($legacy.Count) legacy agent director(ies) in ${AgentsDir}:"
    $legacy | ForEach-Object { Write-Host "  - $($_.Name)" }
    if (Confirm-Action "Remove them?") {
        $legacy | ForEach-Object { Remove-Item -Recurse -Force $_.FullName }
        Write-Ok "Removed $($legacy.Count) legacy agent director(ies)"
    } else {
        Write-Host "Kept legacy agent directories."
    }
}

function Remove-LegacyHook {
    if (-not (Test-Path $LegacyHook)) { return }
    $settings = Join-Path $ClaudeConfigDir "settings.json"
    if ((Test-Path $settings) -and (Select-String -Path $settings -Pattern "block-git-commands" -SimpleMatch -Quiet)) {
        Write-Warn "$LegacyHook is still referenced in $settings; leaving it in place."
        return
    }
    Write-Warn "Orphaned legacy hook found: $LegacyHook"
    if (Confirm-Action "Remove it?") {
        Remove-Item -Force $LegacyHook
        Write-Ok "Removed $LegacyHook"
    }
}

function Install-Agents {
    param([string]$TargetDir)
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    $agents = @(Get-ChildItem -Path $SourceAgentsDir -Filter "*.md" -File -ErrorAction SilentlyContinue)
    if ($agents.Count -eq 0) {
        Write-Warn "No agents found in $SourceAgentsDir"
        return
    }
    foreach ($agent in $agents) {
        Copy-Item $agent.FullName $TargetDir -Force
        Write-Host "  Installed: $($agent.BaseName)"
    }
    Write-Ok "$($agents.Count) agent(s) installed to $TargetDir"
}

function Test-Installation {
    Write-Host ""
    Write-Step "Verification"
    if (Test-Command claude) { Write-Ok "Claude Code: $(Get-ToolVersion claude)" } else { Write-Err "Claude Code not found" }
    if (Test-Command gh) { Write-Ok "GitHub CLI: $(Get-ToolVersion gh)" } else { Write-Warn "GitHub CLI not found (needed for PR workflows)" }
}

function Main {
    Write-Host "dotClaude installer" -ForegroundColor Blue
    Write-Host ""

    Write-Step "Step 1: Prerequisites"
    if (Test-Command claude) {
        Write-Ok "Claude Code already installed"
    } elseif ($SkipClaudeInstall) {
        Write-Warn "Skipping Claude Code installation (-SkipClaudeInstall)"
    } else {
        Install-ClaudeCode
    }
    if (Test-Command gh) { Write-Ok "GitHub CLI already installed" } else { Install-GhCli }
    Write-Host ""

    Write-Step "Step 2: Installation level"
    Select-InstallLevel
    Write-Ok "Install level: $script:InstallLevel"
    if (Test-WantsProject) { Resolve-ProjectPath }
    Write-Host ""

    $projectClaude = if (Test-WantsProject) { Join-Path $script:ProjectPath ".claude" } else { $null }

    Write-Step "Step 3: Instructions (CLAUDE.md)"
    if (Test-WantsUser) { Install-ClaudeMd $UserClaudeMd }
    if (Test-WantsProject) {
        Install-ClaudeMd (Join-Path $projectClaude "CLAUDE.md")
        Update-Gitignore
    }
    Write-Host ""

    Write-Step "Step 4: Migrate legacy agents"
    if (Test-WantsUser) { Remove-LegacyAgents $UserAgentsDir }
    if (Test-WantsProject) { Remove-LegacyAgents (Join-Path $projectClaude "agents") }
    if (Test-WantsUser) { Remove-LegacyHook }
    Write-Host ""

    Write-Step "Step 5: Install agents"
    if (Test-WantsUser) { Install-Agents $UserAgentsDir }
    if (Test-WantsProject) { Install-Agents (Join-Path $projectClaude "agents") }

    Test-Installation
    Write-Host ""
    Write-Ok "Installation complete. Start Claude Code with 'claude'; list agents with .\install\list-agents.ps1"
}

Main
