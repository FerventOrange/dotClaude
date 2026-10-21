'use strict';
// Run: node --test "hooks/*.test.js" "statusline/*.test.js" "install/lib/*.test.js"
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { render } = require('./statusline.js');

let root, repo, plain;
before(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'statusline-sandbox-')));
  repo = path.join(root, 'proj');
  plain = path.join(root, 'plain');
  fs.mkdirSync(repo);
  fs.mkdirSync(plain);
  execFileSync('git', ['-C', repo, 'init', '-q'], { stdio: 'ignore' });
  execFileSync('git', ['-C', repo, 'symbolic-ref', 'HEAD', 'refs/heads/feat/x'], { stdio: 'ignore' });
});
after(() => { if (root && root.startsWith(fs.realpathSync(os.tmpdir()))) fs.rmSync(root, { recursive: true, force: true }); });

test('full line with agent, branch, context and cost', () => {
  const line = render({ model: { display_name: 'Opus' }, workspace: { current_dir: repo }, agent: { name: 'review-agent' },
    context_window: { remaining_percentage: 72 }, cost: { total_cost_usd: 0.1234 } });
  assert.equal(line, 'Opus | [review-agent] proj (feat/x) | ctx:72% | $0.12');
});

test('dirty marker when working tree has changes', () => {
  fs.writeFileSync(path.join(repo, 'new.txt'), 'x');
  try {
    assert.equal(render({ model: { display_name: 'Opus' }, cwd: repo }), 'Opus | proj (feat/x*)');
  } finally { fs.rmSync(path.join(repo, 'new.txt')); }
});

test('non-git directory and missing optional fields', () => {
  assert.equal(render({ model: { display_name: 'Sonnet' }, cwd: plain }), 'Sonnet | plain');
});

test('defaults when fields are missing', () => {
  assert.equal(render({}), 'Claude | ');
  assert.equal(render(null), 'Claude | ');
});

test('process: malformed input prints a minimal line', () => {
  const r = spawnSync(process.execPath, [path.join(__dirname, 'statusline.js')], { input: 'not json', encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.equal(r.stdout.trim(), 'Claude');
});

test('process: sample JSON from stdin', () => {
  const input = JSON.stringify({ model: { display_name: 'Opus' }, workspace: { current_dir: plain }, context_window: { remaining_percentage: 40 } });
  const r = spawnSync(process.execPath, [path.join(__dirname, 'statusline.js')], { input, encoding: 'utf8' });
  assert.equal(r.stdout.trim(), 'Opus | plain | ctx:40%');
});
