# create-agent.ps1 - Generate a new agent from template
# Usage: .\scripts\create-agent.ps1 <agent-name>

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$AgentName
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$AgentsDir = Join-Path $RepoRoot "agents"

# Validate agent name (lowercase, hyphens allowed)
if ($AgentName -notmatch "^[a-z][a-z0-9-]*$") {
    Write-Host "Error: Agent name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens" -ForegroundColor Red
    exit 1
}

$AgentDir = Join-Path $AgentsDir $AgentName

# Check if agent already exists
if (Test-Path $AgentDir) {
    Write-Host "Error: Agent '$AgentName' already exists at $AgentDir" -ForegroundColor Red
    exit 1
}

Write-Host "Creating agent: $AgentName" -ForegroundColor Green

# Create directory structure
New-Item -ItemType Directory -Path $AgentDir -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $AgentDir "examples") -Force | Out-Null

# Get current date
$CurrentDate = Get-Date -Format "yyyy-MM-dd"

# Create agent.json
$AgentJson = @{
    name = $AgentName
    version = "1.0.0"
    description = "TODO: Add a brief description"
    scope = "TODO: Define the scope"
    author = "TODO: Your name or team"
    created = $CurrentDate
    updated = $CurrentDate
    mcp_servers = @()
    dependencies = @()
    input_types = @()
    output_types = @()
    constraints = @()
} | ConvertTo-Json -Depth 10

Set-Content -Path (Join-Path $AgentDir "agent.json") -Value $AgentJson

# Create instructions.md
$Instructions = @"
# Agent: $AgentName

## Primary Objective
TODO: One sentence describing what this agent does.

## Scope Boundaries

### This agent DOES:
- TODO: Specific task 1
- TODO: Specific task 2
- TODO: Specific task 3

### This agent DOES NOT:
- TODO: Out of scope task 1
- TODO: Out of scope task 2
- TODO: Redirect to [other-agent] for this

## Required Context
TODO: What information the agent needs to function.

## Workflow
1. TODO: Step 1
2. TODO: Step 2
3. TODO: Step 3

## Output Format
TODO: Describe what the agent produces.

## Error Handling
TODO: How to handle common issues.

## Examples
See the ``examples/`` directory for usage examples.
"@

Set-Content -Path (Join-Path $AgentDir "instructions.md") -Value $Instructions

# Create README.md
$Readme = @"
# $AgentName

TODO: Brief description of what this agent does.

## Installation

This agent is part of the dotClaude repository. Clone the repo to use it:

``````bash
git clone https://github.com/your-org/dotClaude.git ~/dotClaude
``````

## Usage

``````bash
claude-code --agent $AgentName
``````

## MCP Requirements

See ``mcp-requirements.txt`` for required MCP servers.

## Examples

See the ``examples/`` directory.

## Version History

- **1.0.0** ($CurrentDate): Initial release
"@

Set-Content -Path (Join-Path $AgentDir "README.md") -Value $Readme

# Create mcp-requirements.txt
$McpReqs = @"
# MCP servers required for this agent
# Add servers as needed, e.g.:
# filesystem>=1.0.0
# git>=1.0.0
"@

Set-Content -Path (Join-Path $AgentDir "mcp-requirements.txt") -Value $McpReqs

# Create example placeholder
$Example = @"
# Example 1: Basic Usage

## Input
TODO: Describe the input for this example.

## Expected Output
TODO: Describe what the agent should produce.

## Notes
TODO: Any additional context.
"@

Set-Content -Path (Join-Path $AgentDir "examples\example-1.md") -Value $Example

Write-Host "Agent created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Directory: $AgentDir"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Edit $AgentDir\agent.json - Fill in metadata"
Write-Host "  2. Edit $AgentDir\instructions.md - Define agent behavior"
Write-Host "  3. Edit $AgentDir\README.md - Add documentation"
Write-Host "  4. Add examples to $AgentDir\examples\"
Write-Host "  5. Update $AgentDir\mcp-requirements.txt if needed"
Write-Host ""
Write-Host "Remember: Keep the scope narrow and focused!" -ForegroundColor Yellow
