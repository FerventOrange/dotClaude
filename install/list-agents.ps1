# list-agents.ps1 - List dotClaude agents (agents/*.md) with their descriptions
#
# Usage: .\install\list-agents.ps1

$AgentsDir = Join-Path (Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)) "agents"

if (-not (Test-Path $AgentsDir)) {
    Write-Host "No agents directory found at $AgentsDir" -ForegroundColor Yellow
    exit 1
}

# Value of $Key in the leading --- frontmatter block
function Get-FrontmatterValue {
    param([string]$Content, [string]$Key)
    $frontmatter = [regex]::Match($Content, '(?s)\A---\r?\n(.*?)\r?\n---')
    if (-not $frontmatter.Success) { return $null }
    $match = [regex]::Match($frontmatter.Groups[1].Value, "(?m)^${Key}:\s*(.+?)\s*$")
    if ($match.Success) { return $match.Groups[1].Value }
    return $null
}

$agents = @(Get-ChildItem -Path $AgentsDir -Filter "*.md" -File | Sort-Object Name)
foreach ($agent in $agents) {
    $content = Get-Content $agent.FullName -Raw
    $name = Get-FrontmatterValue $content "name"
    if (-not $name) { $name = $agent.BaseName }
    Write-Host $name -ForegroundColor Cyan
    $description = Get-FrontmatterValue $content "description"
    if ($description) { Write-Host "    $description" -ForegroundColor Gray }
}

Write-Host ""
Write-Host "Total: $($agents.Count) agents"
