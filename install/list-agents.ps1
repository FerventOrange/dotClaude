<#
.SYNOPSIS
    Display available agents and their details

.DESCRIPTION
    Lists all agents in the dotClaude repository organized by category,
    with descriptions parsed from YAML frontmatter.

.EXAMPLE
    .\install\list-agents.ps1
#>

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DotClaudeDir = Split-Path -Parent $ScriptDir
$AgentsDir = Join-Path $DotClaudeDir "agents"

# Category colors
$CategoryColors = @{
    "github" = "Blue"
    "documentation" = "Yellow"
    "code" = "Red"
    "testing" = "Green"
    "infrastructure" = "Magenta"
}

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host "           $Text" -ForegroundColor Blue
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host ""
}

function Get-YamlValue {
    param([string]$Content, [string]$Key)
    $match = [regex]::Match($Content, "(?m)^${Key}:\s*(.+)$")
    if ($match.Success) {
        return $match.Groups[1].Value.Trim()
    }
    return $null
}

Write-Header "Available Agents"

# Check if agents directory exists
if (-not (Test-Path $AgentsDir)) {
    Write-Host "No agents directory found at $AgentsDir" -ForegroundColor Yellow
    exit 1
}

$totalCount = 0

# Get category directories
$Categories = Get-ChildItem -Directory $AgentsDir -ErrorAction SilentlyContinue

foreach ($Category in $Categories) {
    $categoryName = $Category.Name
    $color = $CategoryColors[$categoryName]
    if (-not $color) { $color = "Cyan" }

    Write-Host "## $($categoryName.ToUpper())" -ForegroundColor $color
    Write-Host ""

    # Get agents in this category
    $Agents = Get-ChildItem -Directory $Category.FullName -ErrorAction SilentlyContinue

    foreach ($Agent in $Agents) {
        $instructionsPath = Join-Path $Agent.FullName "instructions.md"

        if (Test-Path $instructionsPath) {
            $content = Get-Content $instructionsPath -Raw -ErrorAction SilentlyContinue
            $description = Get-YamlValue -Content $content -Key "description"

            Write-Host "  $($Agent.Name)" -ForegroundColor Cyan
            if ($description) {
                Write-Host "    $description" -ForegroundColor Gray
            }
            $totalCount++
        }
    }
    Write-Host ""
}

Write-Host "================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Total: $totalCount agents"
Write-Host ""
Write-Host "Usage:"
Write-Host "  claude --agent <agent-name>"
Write-Host ""
