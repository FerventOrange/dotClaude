# dotClaude Install Script for Windows
# Installs Claude Code (if needed) and configures agent awareness
#
# Usage: .\install\install.ps1 [-SkipClaudeInstall]

param(
    [switch]$SkipClaudeInstall
)

$ErrorActionPreference = "Stop"

# Configuration
$DotClaudeDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ClaudeConfigDir = Join-Path $env:USERPROFILE ".claude"
$CustomInstructionsFile = Join-Path $ClaudeConfigDir "CLAUDE.md"
$AgentsInstallDir = Join-Path $ClaudeConfigDir "agents"

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host "       $Text" -ForegroundColor Blue
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host ""
}

function Write-Step {
    param([string]$Step, [string]$Text)
    Write-Host "$Step : $Text" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Text)
    Write-Host "[OK] $Text" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Text)
    Write-Host "[!] $Text" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Text)
    Write-Host "[X] $Text" -ForegroundColor Red
}

function Add-SessionPath {
    param([string]$PathToAdd)
    if ([string]::IsNullOrWhiteSpace($PathToAdd)) {
        return
    }
    $currentPaths = $env:Path -split ';'
    if ($currentPaths -notcontains $PathToAdd) {
        $env:Path = "$PathToAdd;$env:Path"
    }
}

Write-Header "dotClaude Installation Script"

# Check if Claude Code is installed
function Test-ClaudeInstalled {
    try {
        $null = Get-Command claude -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Install Claude Code
function Install-ClaudeCode {
    Write-Host "Installing Claude Code..." -ForegroundColor Yellow

    # Check for npm
    try {
        $null = Get-Command npm -ErrorAction Stop
    } catch {
        Write-Err "npm not found. Please install Node.js first:"
        Write-Host "  - Visit: https://nodejs.org/"
        Write-Host "  - Or use winget: winget install OpenJS.NodeJS"
        Write-Host ""
        Write-Host "After installing Node.js, run this script again."
        exit 1
    }

    # Install via npm
    Write-Host "Using npm to install Claude Code..."
    npm install -g @anthropic-ai/claude-code

    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to install Claude Code"
        exit 1
    }

    try {
        $npmBin = npm bin -g
        Add-SessionPath $npmBin
    } catch {
        Write-Warn "Unable to update PATH for this session; restart your shell if claude is not found."
    }

    if (-not (Test-ClaudeInstalled)) {
        Write-Warn "Claude was installed, but is not on PATH yet. Restart your terminal or add the npm global bin to PATH."
    }

    Write-Success "Claude Code installed"
}

# Check if GitHub CLI is installed
function Test-GhInstalled {
    try {
        $null = Get-Command gh -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Install GitHub CLI
function Install-GhCli {
    Write-Host "Installing GitHub CLI..." -ForegroundColor Yellow

    try {
        $null = Get-Command winget -ErrorAction Stop
        Write-Host "Using winget to install GitHub CLI..."
        winget install GitHub.cli --accept-source-agreements --accept-package-agreements
        if ($LASTEXITCODE -ne 0) {
            Write-Warn "winget install returned non-zero exit code"
        }
        # Add to session PATH
        $ghPath = "C:\Program Files\GitHub CLI"
        if (Test-Path $ghPath) {
            Add-SessionPath $ghPath
        }
    } catch {
        Write-Warn "winget not found. Install GitHub CLI manually:"
        Write-Host "  https://github.com/cli/cli#installation"
        Write-Host "  Or: winget install GitHub.cli"
    }
}

# Configure agent awareness
function Set-AgentAwareness {
    Write-Host "Configuring agent awareness..." -ForegroundColor Yellow

    # Create config directory
    if (-not (Test-Path $ClaudeConfigDir)) {
        New-Item -ItemType Directory -Path $ClaudeConfigDir -Force | Out-Null
    }

    # Check for existing instructions
    if (Test-Path $CustomInstructionsFile) {
        Write-Warn "Existing custom instructions found."
        $overwrite = Read-Host "Overwrite? (y/n)"
        if ($overwrite -ne "y") {
            Write-Host "Keeping existing instructions."
            return
        }
        # Backup existing
        $timestamp = Get-Date -Format "yyyyMMddHHmmss"
        $backupFile = "$CustomInstructionsFile.backup.$timestamp"
        Copy-Item $CustomInstructionsFile $backupFile
        Write-Host "Backup created: $backupFile"
    }

    # Copy custom instructions
    $sourceFile = Join-Path $DotClaudeDir "install\custom-instructions.md"
    if (Test-Path $sourceFile) {
        Copy-Item $sourceFile $CustomInstructionsFile -Force
        Write-Success "Custom instructions installed"
    } else {
        Write-Warn "custom-instructions.md not found in install directory"
    }
}

# Install agents to ~/.claude/agents (copy agent directories from category folders)
function Install-Agents {
    Write-Host "Installing agents..." -ForegroundColor Yellow

    # Create agents directory
    if (-not (Test-Path $AgentsInstallDir)) {
        New-Item -ItemType Directory -Path $AgentsInstallDir -Force | Out-Null
        Write-Host "Created agents directory: $AgentsInstallDir"
    }

    # Source agents directory
    $sourceAgentsDir = Join-Path $DotClaudeDir "agents"

    if (-not (Test-Path $sourceAgentsDir)) {
        Write-Warn "Source agents directory not found"
        return
    }

    # Get category directories (github, documentation, code, testing, infrastructure)
    $categories = Get-ChildItem -Directory $sourceAgentsDir -ErrorAction SilentlyContinue

    if ($categories.Count -eq 0) {
        Write-Warn "No agent categories found"
        return
    }

    $installedCount = 0

    foreach ($category in $categories) {
        # Get agents within each category
        $agents = Get-ChildItem -Directory $category.FullName -ErrorAction SilentlyContinue

        foreach ($agent in $agents) {
            $instructionsPath = Join-Path $agent.FullName "instructions.md"
            $destAgentDir = Join-Path $AgentsInstallDir $agent.Name

            if (-not (Test-Path $instructionsPath)) {
                continue
            }

            # Remove existing and copy fresh
            if (Test-Path $destAgentDir) {
                Remove-Item -Recurse -Force $destAgentDir
            }
            Copy-Item -Recurse $agent.FullName $destAgentDir
            Write-Host "  Installed: $($agent.Name) ($($category.Name))"
            $installedCount++
        }
    }

    if ($installedCount -gt 0) {
        Write-Success "$installedCount agent(s) installed"
    } else {
        Write-Success "All agents up to date"
    }
}

# Verify installation
function Test-Installation {
    Write-Header "Verification"

    # Check Claude Code
    if (Test-ClaudeInstalled) {
        try {
            $version = & claude --version 2>$null
            Write-Success "Claude Code installed: $version"
        } catch {
            Write-Success "Claude Code installed"
        }
    } else {
        Write-Err "Claude Code not found"
    }

    # Check GitHub CLI
    if (Test-GhInstalled) {
        try {
            $ghVersion = & gh --version 2>$null | Select-Object -First 1
            Write-Success "GitHub CLI installed: $ghVersion"
        } catch {
            Write-Success "GitHub CLI installed"
        }
    } else {
        Write-Warn "GitHub CLI not found (optional, needed for PR workflows)"
    }

    # Check custom instructions
    if (Test-Path $CustomInstructionsFile) {
        Write-Success "Custom instructions: $CustomInstructionsFile"
    } else {
        Write-Err "Custom instructions not found"
    }

    # Check installed agents directory
    if (Test-Path $AgentsInstallDir) {
        $agentDirs = Get-ChildItem -Path $AgentsInstallDir -Directory -ErrorAction SilentlyContinue
        $agentCount = ($agentDirs | Measure-Object).Count
        Write-Success "Agents directory: $AgentsInstallDir"
        Write-Success "Agents installed: $agentCount"
    } else {
        Write-Err "Agents directory not found"
    }

    # List agents
    Write-Host ""
    Write-Host "Installed agents:" -ForegroundColor Cyan

    Get-ChildItem -Path $AgentsInstallDir -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor White
    }
}

# Main installation flow
function Main {
    # Step 1: Check/Install Claude Code
    Write-Step "Step 1" "Claude Code"
    if (Test-ClaudeInstalled) {
        try {
            $version = & claude --version 2>$null
            Write-Success "Claude Code already installed ($version)"
        } catch {
            Write-Success "Claude Code already installed"
        }
    } else {
        if ($SkipClaudeInstall) {
            Write-Warn "Skipping Claude Code installation (-SkipClaudeInstall)"
        } else {
            Install-ClaudeCode
        }
    }
    Write-Host ""

    # Step 2: Check/Install GitHub CLI
    Write-Step "Step 2" "GitHub CLI"
    if (Test-GhInstalled) {
        try {
            $ghVersion = & gh --version 2>$null | Select-Object -First 1
            Write-Success "GitHub CLI already installed ($ghVersion)"
        } catch {
            Write-Success "GitHub CLI already installed"
        }
    } else {
        Install-GhCli
    }
    Write-Host ""

    # Step 3: Configure agent awareness
    Write-Step "Step 3" "Agent Awareness Configuration"
    Set-AgentAwareness
    Write-Host ""

    # Step 4: Install agents
    Write-Step "Step 4" "Install Agents"
    Install-Agents
    Write-Host ""

    # Step 5: Verify
    Test-Installation

    Write-Header "Installation Complete!"
    Write-Host ""
    Write-Host "Installed to:"
    Write-Host "  - Custom instructions: $CustomInstructionsFile"
    Write-Host "  - Agents directory: $AgentsInstallDir"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Start Claude Code: claude"
    Write-Host "  2. Test agent awareness: Ask - help me create a README"
    Write-Host "  3. List agents: .\install\list-agents.ps1"
    Write-Host ""
}

Main
