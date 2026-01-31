#!/usr/bin/env node
// Hook script for Claude Code PreToolUse (Bash matcher)
// Blocks direct git commit/push/tag commands and redirects to the correct agent.
//
// Protocol:
//   stdin  – JSON with { tool_input: { command: "..." } }
//   stdout – JSON with { decision: "block", reason: "..." } to deny
//   exit 0 with no output to allow

"use strict";

const BLOCKED = [
  {
    pattern: /\bgit\s+commit\b/,
    agent: "git-commit-agent",
    label: "git commit",
  },
  {
    pattern: /\bgit\s+push\b/,
    agent: "git-pr-agent",
    label: "git push",
  },
  {
    pattern: /\bgit\s+tag\b/,
    agent: "git-tags-agent",
    label: "git tag",
  },
];

function main(input) {
  let parsed;
  try {
    parsed = JSON.parse(input);
  } catch {
    // Malformed input – allow by default so we don't break unrelated calls.
    process.exit(0);
  }

  const command = (parsed.tool_input && parsed.tool_input.command) || "";

  for (const rule of BLOCKED) {
    if (rule.pattern.test(command)) {
      const msg = {
        decision: "block",
        reason:
          `Direct "${rule.label}" is blocked. ` +
          `Use the ${rule.agent} agent instead (per CLAUDE.md git workflow rules).`,
      };
      process.stdout.write(JSON.stringify(msg));
      process.exit(0);
    }
  }

  // Allowed – exit silently.
  process.exit(0);
}

// Read all of stdin then process.
let data = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => (data += chunk));
process.stdin.on("end", () => main(data));
