<#
.SYNOPSIS
    Display available agents and their details

.DESCRIPTION
    Lists all agents in the dotClaude repository with their descriptions,
    versions, and scope information.

.PARAMETER Verbose
    Show additional details like MCP requirements and constraints

.EXAMPLE
    .\install\list-agents.ps1
    .\install\list-agents.ps1 -Verbose
#>

param(
    [switch]$ShowDetails
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$DotClaudeDir = Split-Path -Parent $ScriptDir
$AgentsDir = Join-Path $DotClaudeDir "agents"

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host "           $Text" -ForegroundColor Blue
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host ""
}

Write-Header "Available Agents"

# Check if agents directory exists
if (-not (Test-Path $AgentsDir)) {
    Write-Host "No agents directory found at $AgentsDir" -ForegroundColor Yellow
    exit 1
}

# Get agent directories
$AgentDirs = Get-ChildItem -Directory $AgentsDir -ErrorAction SilentlyContinue

$AgentCount = ($AgentDirs | Measure-Object).Count
Write-Host "Total agents: $AgentCount" -ForegroundColor Green
Write-Host ""

foreach ($AgentDir in $AgentDirs) {
    $AgentName = $AgentDir.Name
    $AgentJsonPath = Join-Path $AgentDir.FullName "agent.json"

    if (Test-Path $AgentJsonPath) {
        try {
            $AgentJson = Get-Content $AgentJsonPath -Raw | ConvertFrom-Json

            $Description = if ($AgentJson.description) { $AgentJson.description } else { "No description" }
            $Version = if ($AgentJson.version) { $AgentJson.version } else { "1.0.0" }
            $Scope = if ($AgentJson.scope) { $AgentJson.scope } else { "general" }

            Write-Host "$AgentName" -ForegroundColor Cyan -NoNewline
            Write-Host " (v$Version)"
            Write-Host "  Description: " -ForegroundColor Green -NoNewline
            Write-Host $Description
            Write-Host "  Scope: " -ForegroundColor Green -NoNewline
            Write-Host $Scope

            if ($ShowDetails) {
                # Show MCP requirements
                $McpFile = Join-Path $AgentDir.FullName "mcp-requirements.txt"
                if (Test-Path $McpFile) {
                    $McpServers = Get-Content $McpFile | Where-Object { $_ -notmatch "^#" -and $_ -ne "" }
                    if ($McpServers) {
                        Write-Host "  MCP Servers: " -ForegroundColor Green -NoNewline
                        Write-Host ($McpServers -join ", ")
                    }
                }

                # Show constraints
                if ($AgentJson.constraints -and $AgentJson.constraints.Count -gt 0) {
                    Write-Host "  Constraints:" -ForegroundColor Green
                    $AgentJson.constraints | Select-Object -First 3 | ForEach-Object {
                        Write-Host "    - $_"
                    }
                }
            }

            Write-Host ""
        } catch {
            Write-Host "$AgentName" -ForegroundColor Cyan
            Write-Host "  (Error reading agent.json)" -ForegroundColor Yellow
            Write-Host ""
        }
    } else {
        Write-Host "$AgentName" -ForegroundColor Cyan
        Write-Host "  (No agent.json found)" -ForegroundColor Yellow
        Write-Host ""
    }
}

Write-Host "================================================" -ForegroundColor Blue
Write-Host ""
Write-Host "Usage:"
Write-Host "  View agent details: Get-Content agents\[agent-name]\README.md"
Write-Host "  Use an agent:       claude --agent [agent-name]"
Write-Host ""

if (-not $ShowDetails) {
    Write-Host "Tip: Use -ShowDetails for more information"
    Write-Host ""
}
