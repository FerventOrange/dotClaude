#!/usr/bin/env node
'use strict';
// dotClaude statusline: <model> | [<agent>] <dir> (<branch>[*]) | ctx:<remaining>% | $<cost>
// Reads Claude Code statusline JSON on stdin. Never throws; prints a minimal line on error.
const { execFileSync } = require('child_process');

function git(dir, args) {
  try {
    return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', timeout: 1000, stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true,
      env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } }).trim(); // no index.lock refresh from git status
  } catch { return null; }
}

function render(input) {
  const i = input && typeof input === 'object' ? input : {};
  const model = (i.model && i.model.display_name) || 'Claude';
  const dir = (i.workspace && i.workspace.current_dir) || i.cwd || '';
  let line = `${model} | `;
  if (i.agent && i.agent.name) line += `[${i.agent.name}] `;
  line += String(dir).split(/[\\/]/).filter(Boolean).pop() || dir;
  if (dir) {
    const branch = git(dir, ['branch', '--show-current']) || git(dir, ['rev-parse', '--short', 'HEAD']);
    if (branch) line += ` (${branch}${git(dir, ['status', '--porcelain']) ? '*' : ''})`;
  }
  const ctx = i.context_window && i.context_window.remaining_percentage;
  if (ctx !== undefined && ctx !== null && ctx !== '') line += ` | ctx:${ctx}%`;
  const cost = i.cost && i.cost.total_cost_usd;
  if (typeof cost === 'number' && Number.isFinite(cost)) line += ` | $${cost.toFixed(2)}`;
  return line;
}

function main() {
  const chunks = [];
  process.stdin.on('data', (d) => chunks.push(d));
  process.stdin.on('error', () => process.stdout.write('Claude\n'));
  process.stdin.on('end', () => {
    let out = 'Claude';
    try { out = render(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { /* minimal output */ }
    process.stdout.write(out + '\n');
  });
}

if (require.main === module) main();
module.exports = { render };
