# Contributing to dotClaude

dotClaude deliberately ships a small roster. Before adding an agent, check whether the work belongs to an existing one; extending an owner beats adding an overlapping agent.

## Agent File Format

Each agent is one flat file, `agents/<name>.md`, using Claude Code subagent frontmatter. Use **only** these keys:

```markdown
---
name: example-agent
description: One line: what it does and when the orchestrator should use it. Routing depends on this, so make it precise.
tools: Read, Grep, Glob, Bash, Edit, Write
model: sonnet            # sonnet | opus | inherit
color: blue              # blue | green | yellow | red | purple | orange | pink | cyan
effort: medium           # optional: low | medium | high | xhigh | max
maxTurns: 30             # optional: positive integer
---
```

`effort` and `maxTurns` are optional. `scripts/validate.js` rejects any other key.

## Skill File Format

Each skill is `skills/<name>/SKILL.md`. Frontmatter needs `name` (must equal the directory name) and `description` (what it does and when to use it; routing depends on it). The body is the procedure the root orchestrator follows.

```markdown
---
name: example
description: What the skill does. Use when the user types /example or asks to ...
---
```

Optional keys: `argument-hint`, `disable-model-invocation` (user-only skill, as in `/release` and `/sync-dotclaude`), and `allowed-tools`. The validator rejects any other key.

## Required Sections

`## Scope` comes first; `## Clarification` and `## Output` come last. Domain sections may sit anywhere between.

- `# <Name>` plus a one-sentence purpose.
- `## Scope` - **Does** / **Does not (→ owner agent)** bullets. First section.
- `## Workflow` - numbered steps.
- Domain sections (conventions, checklists, formats) - only what is non-obvious.
- `## Clarification` - the standard block below, verbatim; agent-specific triggers may be appended. Second to last.
- `## Output` - the standard contract below, plus agent-specific fields. Last section.

### Standard Clarification block

```markdown
## Clarification
Subagents cannot talk to the user directly. Before acting, rate your confidence that you understand the intent, scope, and expected result. If it is **below 80%**, or the request is ambiguous, contradictory, or would require a destructive/irreversible step not explicitly authorized, **stop without making changes** and return:

    STATUS: NEEDS_CLARIFICATION
    QUESTIONS:
    1. <specific question> — options: <a> | <b> (recommended: <a>, because ...)
    ASSUMPTIONS_IF_UNANSWERED: <what you would do>

Never guess at user intent to avoid asking.
```

### Standard Output contract

```
STATUS: DONE | NEEDS_CLARIFICATION | BLOCKED
SUMMARY: <1–3 lines>
CHANGES: <files touched, or "none">
FOLLOW_UPS: <out-of-scope issues noticed, or "none">
```

Reviewing agents (`review-agent`, and `docs-agent` in review mode) additionally emit `FINDINGS:`, one per line as `F1 [SEVERITY] file:line — problem — fix` with severity `BLOCKING | MAJOR | MINOR | NIT`, and `VERDICT: APPROVE | CHANGES_REQUESTED`.

## Design Principles

- **Single clear owner per task.** Every kind of work maps to exactly one agent; `Does not` bullets name the owner.
- **Least-privilege tools.** Grant only the tools the workflow needs; review agents should not need `Write`.
- **Short and dense.** Aim for ~60-150 lines per file. No filler, marketing, or emoji.
- **No generic advice.** Keep only rules Claude would not follow by default: project conventions, safety checks, output formats.
- **Stay in scope.** Out-of-scope discoveries go to `FOLLOW_UPS`, never silent fixes.

## Commits and Pull Requests

- Branch from up-to-date main as `<type>/<short-desc>`. Never commit to main.
- Commit and PR title format: `<type>/<scope> : <description>`, where type is one of `feat|fix|docs|refactor|test|chore|perf|ci|build|style`. Lowercase, imperative description; the body explains why.
- PR body sections: Summary, Changes, Test plan, Follow-ups.
- No AI attribution trailers or footers in commits or PRs.
- Never use `--no-verify`; fix the hook failure instead. Never commit secrets.
- Update `CHANGELOG.md` (and `README.md` if the roster or workflow changes).

## Before Opening a PR

1. Run the validator and the unit tests (Node.js 18+, no dependencies):
   ```bash
   node scripts/validate.js
   node --test "hooks/*.test.js" "statusline/*.test.js" "install/lib/*.test.js"
   ```
   CI runs both on every PR.
2. Run `agent-manager` in review mode on every agent file you added or changed, and resolve all BLOCKING and MAJOR findings.
3. Re-run the installer locally (try `./install/install.sh --dry-run` first) and confirm Claude Code lists the agent (`/agents`).
4. Exercise the agent on a real task and check that it ends with the Output contract.
