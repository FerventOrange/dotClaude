# dotClaude Install Script for Windows
# Installs Claude Code (if needed) and configures agent awareness
#
# Usage: .\install\install.ps1 [-SkipClaudeInstall] [-InstallLevel user|project|both] [-ProjectPath C:\path\to\project]

param(
    [switch]$SkipClaudeInstall,
    [ValidateSet("user", "project", "both")]
    [string]$InstallLevel = "",
    [string]$ProjectPath = ""
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

# Prompt for installation level
function Get-InstallLevel {
    if (-not [string]::IsNullOrWhiteSpace($script:InstallLevel)) {
        return
    }

    Write-Host "Select installation level:" -ForegroundColor Blue
    Write-Host "  1) User-level only    (~/.claude/CLAUDE.md + ~/.claude/agents/)"
    Write-Host "  2) Project-level only (<project>/.claude/CLAUDE.md + .claude/agents/ + .gitignore)"
    Write-Host "  3) Both               (user-level + project-level)"
    Write-Host ""
    $choice = Read-Host "Choice [1/2/3] (default: 1)"

    switch ($choice) {
        "2" { $script:InstallLevel = "project" }
        "3" { $script:InstallLevel = "both" }
        default { $script:InstallLevel = "user" }
    }
}

# Prompt for project path and validate
function Get-ProjectPath {
    if ([string]::IsNullOrWhiteSpace($script:ProjectPath)) {
        $script:ProjectPath = Read-Host "Enter project root path"
    }

    if ([string]::IsNullOrWhiteSpace($script:ProjectPath)) {
        Write-Err "No path provided."
        exit 1
    }

    # Resolve to absolute path
    $script:ProjectPath = (Resolve-Path $script:ProjectPath -ErrorAction Stop).Path

    if (-not (Test-Path $script:ProjectPath -PathType Container)) {
        Write-Err "Directory does not exist: $script:ProjectPath"
        exit 1
    }

    # Validate it's a git repo
    $gitDir = Join-Path $script:ProjectPath ".git"
    if (-not (Test-Path $gitDir)) {
        Write-Err "Not a git repository: $script:ProjectPath"
        Write-Host "    No .git directory found. Project-level install requires a git repository."
        exit 1
    }

    Write-Success "Valid git repository: $script:ProjectPath"
}

# Configure agent awareness at user level
function Set-AgentAwarenessUser {
    Write-Host "Configuring user-level agent awareness..." -ForegroundColor Yellow

    # Create config directory
    if (-not (Test-Path $ClaudeConfigDir)) {
        New-Item -ItemType Directory -Path $ClaudeConfigDir -Force | Out-Null
    }

    # Check for existing instructions
    if (Test-Path $CustomInstructionsFile) {
        Write-Warn "Existing custom instructions found at $CustomInstructionsFile"
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
        Write-Success "Custom instructions installed to $CustomInstructionsFile"
    } else {
        Write-Warn "custom-instructions.md not found in install directory"
    }
}

# Configure agent awareness at project level
function Set-AgentAwarenessProject {
    Write-Host "Configuring project-level agent awareness..." -ForegroundColor Yellow

    $projectClaudeDir = Join-Path $script:ProjectPath ".claude"
    $projectClaudeMd = Join-Path $projectClaudeDir "CLAUDE.md"

    # Create .claude directory
    if (-not (Test-Path $projectClaudeDir)) {
        New-Item -ItemType Directory -Path $projectClaudeDir -Force | Out-Null
    }

    # Check if CLAUDE.md already exists in project
    if (Test-Path $projectClaudeMd) {
        Write-Warn "Existing CLAUDE.md found at $projectClaudeMd"
        $overwrite = Read-Host "Overwrite? (y/n)"
        if ($overwrite -ne "y") {
            Write-Host "Keeping existing project CLAUDE.md."
            # Still update .gitignore
            Update-Gitignore
            return
        }
        # Backup existing
        $timestamp = Get-Date -Format "yyyyMMddHHmmss"
        $backupFile = "$projectClaudeMd.backup.$timestamp"
        Copy-Item $projectClaudeMd $backupFile
        Write-Host "Backup created: $backupFile"
    }

    # Copy custom instructions to project .claude/ directory
    $sourceFile = Join-Path $DotClaudeDir "install\custom-instructions.md"
    if (Test-Path $sourceFile) {
        Copy-Item $sourceFile $projectClaudeMd -Force
        Write-Success "Custom instructions installed to $projectClaudeMd"
    } else {
        Write-Warn "custom-instructions.md not found in install directory"
    }

    # Update .gitignore
    Update-Gitignore
}

# Add .claude/ to .gitignore
function Update-Gitignore {
    $gitignoreFile = Join-Path $script:ProjectPath ".gitignore"
    $entry = ".claude/"

    if (Test-Path $gitignoreFile) {
        $content = Get-Content $gitignoreFile -Raw -ErrorAction SilentlyContinue
        if ($content -and ($content -split "`n" | ForEach-Object { $_.Trim() }) -contains $entry) {
            Write-Success ".claude/ already in .gitignore"
            return
        }
        # Append entry
        Add-Content -Path $gitignoreFile -Value "`n# dotClaude - project-level Claude Code configuration"
        Add-Content -Path $gitignoreFile -Value $entry
        Write-Success "Added .claude/ to existing .gitignore"
    } else {
        # Create .gitignore with entry
        Set-Content -Path $gitignoreFile -Value "# dotClaude - project-level Claude Code configuration`n$entry"
        Write-Success "Created .gitignore with .claude/ entry"
    }
}

# Install agents to a target directory (copy agent directories from category folders)
function Install-Agents {
    param(
        [string]$TargetDir,
        [string]$Label
    )
    Write-Host "Installing agents ($Label)..." -ForegroundColor Yellow

    # Create agents directory
    if (-not (Test-Path $TargetDir)) {
        New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
        Write-Host "Created agents directory: $TargetDir"
    }

    # Source agents directory
    $sourceAgentsDir = Join-Path $DotClaudeDir "agents"

    if (-not (Test-Path $sourceAgentsDir)) {
        Write-Warn "Source agents directory not found"
        return
    }

    # Get category directories (github, documentation, code, frontend, backend, data, testing, infrastructure)
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
            $destAgentDir = Join-Path $TargetDir $agent.Name

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
        Write-Success "$installedCount agent(s) installed to $TargetDir"
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

    # Check user-level custom instructions
    if ($script:InstallLevel -eq "user" -or $script:InstallLevel -eq "both") {
        if (Test-Path $CustomInstructionsFile) {
            Write-Success "User-level instructions: $CustomInstructionsFile"
        } else {
            Write-Err "User-level instructions not found"
        }
    }

    # Check project-level custom instructions
    if ($script:InstallLevel -eq "project" -or $script:InstallLevel -eq "both") {
        $projectClaudeMd = Join-Path (Join-Path $script:ProjectPath ".claude") "CLAUDE.md"
        if (Test-Path $projectClaudeMd) {
            Write-Success "Project-level instructions: $projectClaudeMd"
        } else {
            Write-Err "Project-level instructions not found"
        }
        $gitignoreFile = Join-Path $script:ProjectPath ".gitignore"
        if ((Test-Path $gitignoreFile) -and ((Get-Content $gitignoreFile -Raw) -match "\.claude/")) {
            Write-Success ".claude/ in .gitignore"
        } else {
            Write-Warn ".claude/ not in .gitignore"
        }
    }

    # Check installed agents directory (per level)
    if ($script:InstallLevel -eq "user" -or $script:InstallLevel -eq "both") {
        if (Test-Path $AgentsInstallDir) {
            $agentCount = (Get-ChildItem -Path $AgentsInstallDir -Directory -ErrorAction SilentlyContinue | Measure-Object).Count
            Write-Success "User agents directory: $AgentsInstallDir ($agentCount agents)"
        } else {
            Write-Err "User agents directory not found"
        }
    }
    if ($script:InstallLevel -eq "project" -or $script:InstallLevel -eq "both") {
        $projectAgentsDir = Join-Path (Join-Path $script:ProjectPath ".claude") "agents"
        if (Test-Path $projectAgentsDir) {
            $agentCount = (Get-ChildItem -Path $projectAgentsDir -Directory -ErrorAction SilentlyContinue | Measure-Object).Count
            Write-Success "Project agents directory: $projectAgentsDir ($agentCount agents)"
        } else {
            Write-Err "Project agents directory not found"
        }
    }

    # List agents (show from whichever level was installed)
    $listDir = $AgentsInstallDir
    if ($script:InstallLevel -eq "project") {
        $listDir = Join-Path (Join-Path $script:ProjectPath ".claude") "agents"
    }
    Write-Host ""
    Write-Host "Installed agents:" -ForegroundColor Cyan
    Get-ChildItem -Path $listDir -Directory -ErrorAction SilentlyContinue | ForEach-Object {
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

    # Step 3: Select installation level
    Write-Step "Step 3" "Installation Level"
    Get-InstallLevel
    Write-Success "Install level: $script:InstallLevel"

    # If project or both, get and validate project path
    if ($script:InstallLevel -eq "project" -or $script:InstallLevel -eq "both") {
        Get-ProjectPath
    }
    Write-Host ""

    # Step 4: Configure agent awareness
    Write-Step "Step 4" "Agent Awareness Configuration"
    if ($script:InstallLevel -eq "user" -or $script:InstallLevel -eq "both") {
        Set-AgentAwarenessUser
    }
    if ($script:InstallLevel -eq "project" -or $script:InstallLevel -eq "both") {
        Set-AgentAwarenessProject
    }
    Write-Host ""

    # Step 5: Install agents to matching scope
    Write-Step "Step 5" "Install Agents"
    if ($script:InstallLevel -eq "user" -or $script:InstallLevel -eq "both") {
        Install-Agents -TargetDir $AgentsInstallDir -Label "user-level"
    }
    if ($script:InstallLevel -eq "project" -or $script:InstallLevel -eq "both") {
        $projectAgentsDir = Join-Path (Join-Path $script:ProjectPath ".claude") "agents"
        Install-Agents -TargetDir $projectAgentsDir -Label "project-level"
    }
    Write-Host ""

    # Step 6: Verify
    Test-Installation

    Write-Header "Installation Complete!"
    Write-Host ""
    Write-Host "Installed to:"
    if ($script:InstallLevel -eq "user" -or $script:InstallLevel -eq "both") {
        Write-Host "  - User instructions: $CustomInstructionsFile"
        Write-Host "  - User agents: $AgentsInstallDir"
    }
    if ($script:InstallLevel -eq "project" -or $script:InstallLevel -eq "both") {
        Write-Host "  - Project instructions: $(Join-Path (Join-Path $script:ProjectPath '.claude') 'CLAUDE.md')"
        Write-Host "  - Project agents: $(Join-Path (Join-Path $script:ProjectPath '.claude') 'agents')"
        Write-Host "  - .gitignore updated: $(Join-Path $script:ProjectPath '.gitignore')"
    }
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Start Claude Code: claude"
    Write-Host "  2. Test agent awareness: Ask - help me create project documentation"
    Write-Host "  3. List agents: .\install\list-agents.ps1"
    Write-Host ""
}

Main
