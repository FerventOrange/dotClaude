# <Project Name>

> Project instructions for Claude Code and dotClaude agents. Overrides the global orchestrator file for project specifics. Keep it short and exact.
> Delete any line you do not fill in; agents treat what remains as authoritative.

## Overview
<One or two lines: what this project is, main language/framework, where the entry point lives.>

## Commands
Exact commands agents must use (run from the repo root):
- Install: `<e.g. npm ci>`
- Build: `<e.g. npm run build>`
- Test: `<e.g. npm test>` — single test: `<e.g. npx vitest run path/to/file.test.ts>`
- Lint: `<e.g. npm run lint>`
- Format: `<e.g. npm run format>`
- Run: `<e.g. npm run dev>`

## Conventions
- Style: <formatter/linter config is the source of truth; notable rules not enforced by tools>
- Commit scopes: <allowed `<type>/<scope>` scope names, e.g. `api`, `ui`, `db`, `ci`>
- Branches: `<type>/<short-desc>` from `<default branch>`
- <Other project-specific patterns: error handling, logging, file layout>

## Boundaries
- Do not touch: <paths, e.g. `vendor/`, `legacy/`>
- Generated (edit the source, not the output): <e.g. `src/gen/` from `proto/`>
- Data / secrets: <e.g. `data/`, `.env*` — never read, commit, or modify>
- Requires user approval: <e.g. migrations, dependency upgrades, public API changes>

## Notes for agents
- <Known flaky tests, slow suites, required services (DB, Docker), env vars needed for tests>
