#!/usr/bin/env node
// Hook script for Claude Code PreToolUse (Bash matcher)
// Blocks direct git commit/push/tag commands and redirects to the correct agent.
//
// Protocol:
//   stdin  – JSON with { tool_input: { command: "..." } }
//   stdout – JSON with { decision: "block", reason: "..." } to deny
//   exit 0 with no output to allow

"use strict";

// Anchored to command start or after a pipeline/list operator (|, ;, &&, ||)
// to avoid false positives on strings like: echo "git push"
const CMD_PREFIX = String.raw`(?:^|[|;&]\s*)`;

const BLOCKED = [
  {
    pattern: new RegExp(CMD_PREFIX + String.raw`git\s+commit\b`),
    agent: "git-commit-agent",
    label: "git commit",
  },
  {
    pattern: new RegExp(CMD_PREFIX + String.raw`git\s+push\b`),
    agent: "git-pr-agent",
    label: "git push",
  },
  {
    pattern: new RegExp(CMD_PREFIX + String.raw`git\s+tag\b`),
    agent: "git-tags-agent",
    label: "git tag",
  },
  {
    pattern: new RegExp(CMD_PREFIX + String.raw`gh\s+pr\s+edit\b.*(?:--title|--body)\b`),
    agent: "git-pr-agent",
    label: "gh pr edit --title/--body",
  },
];

/**
 * Normalize a command string to defeat simple bypass attempts:
 * - Collapse runs of whitespace into single spaces
 * - Strip ANSI C-style quote wrappers ($'...')
 * - Strip common shell escape chars (backslash before a letter)
 */
function normalize(cmd) {
  return cmd
    .replace(/\$'([^']*)'/g, "$1")       // strip $'...' wrappers
    .replace(/\\(.)/g, "$1")              // strip backslash escapes
    .replace(/\s+/g, " ")                 // collapse whitespace
    .trim();
}

function main(input) {
  let parsed;
  try {
    parsed = JSON.parse(input);
  } catch {
    // Malformed input – allow but warn.
    process.stderr.write("block-git-commands: failed to parse stdin as JSON\n");
    process.exit(0);
  }

  const rawCommand = (parsed.tool_input && parsed.tool_input.command) || "";
  const command = normalize(rawCommand);

  for (const rule of BLOCKED) {
    if (rule.pattern.test(command)) {
      const msg = {
        decision: "block",
        reason:
          `Direct "${rule.label}" is blocked. ` +
          `Use the ${rule.agent} agent instead (per CLAUDE.md git workflow rules).`,
      };
      process.stderr.write(`[block-git-commands] Blocked: "${rule.label}" in command\n`);
      process.stdout.write(JSON.stringify(msg));
      process.exit(0);
    }
  }

  // Allowed – exit silently.
  process.exit(0);
}

// Safety timeout – allow by default if stdin is never closed (hung parent).
const STDIN_TIMEOUT_MS = 5000;
setTimeout(() => {
  process.stderr.write("block-git-commands: stdin timeout, allowing by default\n");
  process.exit(0);
}, STDIN_TIMEOUT_MS).unref();

// Read stdin with a size cap (1 MB) to prevent memory exhaustion.
const MAX_STDIN = 1024 * 1024;
let data = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  data += chunk;
  if (data.length > MAX_STDIN) {
    process.stderr.write("block-git-commands: stdin exceeded 1 MB, allowing by default\n");
    process.exit(0);
  }
});
process.stdin.on("end", () => main(data));
