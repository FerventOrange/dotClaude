'use strict';
// Run: node --test "hooks/*.test.js" "statusline/*.test.js" "install/lib/*.test.js"
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { evaluate } = require('./report-check.js');

const SCRIPT = path.join(__dirname, 'report-check.js');
const NO_MANIFEST = path.join(os.tmpdir(), 'report-check-no-such-dir', 'manifest.json');
let root;
before(() => { root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'report-check-'))); });
after(() => { if (root && root.startsWith(fs.realpathSync(os.tmpdir()))) fs.rmSync(root, { recursive: true, force: true }); });

const REPORT = 'Work done.\n\nSTATUS: DONE\nSUMMARY: did the thing\nCHANGES: a.js\nFOLLOW_UPS: none\n';
const REVIEW = REPORT + 'VERDICT: APPROVE\n';
const warnings = [];
const run = (input, env = {}, manifest = NO_MANIFEST) => evaluate(input, env, { manifest, warn: (s) => warnings.push(s) });
const stop = (agent_type, last_assistant_message, extra = {}) => ({ agent_type, last_assistant_message, stop_hook_active: false, cwd: root, ...extra });
const decision = (out) => (out ? out.decision : null);

function runScript(script, stdin, env = {}) {
  const r = spawnSync(process.execPath, [script], { input: stdin, encoding: 'utf8', env: { ...process.env, DOTCLAUDE_REPORT_CHECK: '', ...env } });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

describe('complete reports are allowed', () => {
  test('implement-agent full report', () => assert.equal(run(stop('implement-agent', REPORT)), null));
  test('review-agent with VERDICT', () => assert.equal(run(stop('review-agent', REVIEW)), null));
  for (const s of ['DONE', 'BLOCKED']) {
    test(`STATUS ${s}`, () => assert.equal(run(stop('git-agent', REPORT.replace('DONE', s))), null));
  }
  test('extra optional fields are fine', () => assert.equal(run(stop('test-agent', REPORT + 'VERIFIED: npm test (pass)\n')), null));
});

describe('missing fields block', () => {
  for (const f of ['STATUS', 'SUMMARY', 'CHANGES', 'FOLLOW_UPS']) {
    test(`missing ${f}`, () => {
      const text = REPORT.split('\n').filter((l) => !l.startsWith(`${f}:`)).join('\n');
      const out = run(stop('implement-agent', text));
      assert.equal(decision(out), 'block');
      assert.match(out.reason, new RegExp(`missing [^.]*${f}:`));
      assert.match(out.reason, /^dotClaude report contract: your final message is missing /);
      assert.match(out.reason, /STATUS: DONE \| NEEDS_CLARIFICATION \| BLOCKED, SUMMARY, CHANGES, FOLLOW_UPS\)\. Do not redo the work\.$/);
    });
  }
  test('lists every missing field', () => {
    const out = run(stop('docs-agent', 'All done, docs updated.'));
    assert.equal(decision(out), 'block');
    assert.match(out.reason, /missing STATUS:, SUMMARY:, CHANGES:, FOLLOW_UPS:\./);
  });
  test('review-agent without VERDICT', () => {
    const out = run(stop('review-agent', REPORT));
    assert.equal(decision(out), 'block');
    assert.match(out.reason, /missing VERDICT:\./);
    assert.match(out.reason, /FOLLOW_UPS, VERDICT\)/);
  });
  test('VERDICT not required for other agents', () => assert.equal(run(stop('implement-agent', REPORT)), null));
  test('field names are case-sensitive', () => assert.equal(decision(run(stop('implement-agent', REPORT.replace('SUMMARY:', 'Summary:')))), 'block'));
  test('field must start a line', () => assert.equal(decision(run(stop('implement-agent', REPORT.replace('\nSUMMARY:', ' see SUMMARY:')))), 'block'));
  test('empty message blocks', () => assert.equal(decision(run(stop('infra-agent', ''))), 'block'));
});

describe('STATUS value', () => {
  test('invalid value blocks', () => {
    const out = run(stop('implement-agent', REPORT.replace('STATUS: DONE', 'STATUS: SUCCESS')));
    assert.equal(decision(out), 'block');
    assert.match(out.reason, /a valid STATUS value \(DONE \| NEEDS_CLARIFICATION \| BLOCKED\)/);
  });
  test('lowercase value blocks', () => assert.equal(decision(run(stop('implement-agent', REPORT.replace('STATUS: DONE', 'STATUS: done')))), 'block'));
  test('empty value blocks', () => assert.equal(decision(run(stop('implement-agent', REPORT.replace('STATUS: DONE', 'STATUS:')))), 'block'));
  test('prefix of a valid value blocks', () => assert.equal(decision(run(stop('implement-agent', REPORT.replace('STATUS: DONE', 'STATUS: DONE_ISH')))), 'block'));
});

describe('clarification format', () => {
  const CLAR = 'STATUS: NEEDS_CLARIFICATION\nQUESTIONS:\n1. Which db? — options: a | b\nASSUMPTIONS_IF_UNANSWERED: a\n';
  test('STATUS + QUESTIONS is accepted', () => assert.equal(run(stop('implement-agent', CLAR)), null));
  test('review-agent clarification needs no VERDICT', () => assert.equal(run(stop('review-agent', CLAR)), null));
  test('clarification without QUESTIONS blocks', () => {
    const out = run(stop('implement-agent', 'STATUS: NEEDS_CLARIFICATION\nI am unsure.\n'));
    assert.equal(decision(out), 'block');
    assert.match(out.reason, /missing QUESTIONS:\./);
  });
});

describe('markdown formatting is accepted', () => {
  test('bold field names', () => assert.equal(run(stop('implement-agent', '**STATUS:** DONE\n**SUMMARY:** x\n**CHANGES:** none\n**FOLLOW_UPS:** none\n')), null));
  test('bold before colon', () => assert.equal(run(stop('implement-agent', '**STATUS**: **DONE**\n**SUMMARY**: x\n**CHANGES**: none\n**FOLLOW_UPS**: none\n')), null));
  test('inside a code block', () => assert.equal(run(stop('review-agent', 'Report:\n```\n' + REVIEW + '```\n')), null));
  test('indented, bulleted, escaped underscore', () => assert.equal(run(stop('implement-agent', '  - STATUS: `DONE`\n  - SUMMARY: x\n  - CHANGES: none\n  - FOLLOW\\_UPS: none\n')), null));
  test('CRLF line endings', () => assert.equal(run(stop('implement-agent', REPORT.replace(/\n/g, '\r\n'))), null));
});

describe('agent selection', () => {
  for (const a of ['Explore', 'general-purpose', 'claude-code-guide', '', undefined]) {
    test(`non-dotClaude agent ${JSON.stringify(a)} allowed`, () => assert.equal(run(stop(a, 'no report here')), null));
  }
  for (const a of ['git-agent', 'review-agent', 'implement-agent', 'test-agent', 'debug-agent', 'docs-agent', 'infra-agent', 'agent-manager']) {
    test(`built-in list includes ${a}`, () => assert.equal(decision(run(stop(a, 'no report here'))), 'block'));
  }

  test('manifest next to the script drives the agent list', () => {
    const dir = path.join(root, 'manifest-copy');
    fs.mkdirSync(dir);
    const script = path.join(dir, 'report-check.js');
    fs.copyFileSync(SCRIPT, script);
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ files: [], agents: ['custom-agent.md', 'git-agent.md'] }));
    const bad = (agent_type) => JSON.stringify(stop(agent_type, 'no report here'));
    const custom = runScript(script, bad('custom-agent'));
    assert.equal(custom.code, 0);
    assert.equal(JSON.parse(custom.stdout).decision, 'block');
    assert.equal(JSON.parse(runScript(script, bad('git-agent')).stdout).decision, 'block');
    const notListed = runScript(script, bad('implement-agent'));
    assert.equal(notListed.code, 0);
    assert.equal(notListed.stdout, '');
  });
  test('manifest with no agents falls back to the built-in list', () => {
    const m = path.join(root, 'empty-manifest.json');
    fs.writeFileSync(m, JSON.stringify({ agents: [] }));
    assert.equal(decision(run(stop('implement-agent', 'x'), {}, m)), 'block');
  });
  test('corrupt manifest falls back to the built-in list', () => {
    const m = path.join(root, 'corrupt-manifest.json');
    fs.writeFileSync(m, '{not json');
    assert.equal(decision(run(stop('implement-agent', 'x'), {}, m)), 'block');
  });
});

describe('loop protection', () => {
  test('stop_hook_active allows and warns', () => {
    warnings.length = 0;
    assert.equal(run(stop('implement-agent', 'still no report', { stop_hook_active: true })), null);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /^dotclaude report-check: implement-agent still missing .*\(allowing\)$/);
    assert.doesNotMatch(warnings[0], /\n/);
  });
  test('stop_hook_active with complete report is silent', () => {
    warnings.length = 0;
    assert.equal(run(stop('implement-agent', REPORT, { stop_hook_active: true })), null);
    assert.equal(warnings.length, 0);
  });
  test('script writes the warning to stderr only', () => {
    const r = runScript(SCRIPT, JSON.stringify(stop('implement-agent', 'nope', { stop_hook_active: true })));
    assert.equal(r.code, 0);
    assert.equal(r.stdout, '');
    assert.match(r.stderr, /still missing/);
  });
});

describe('transcript fallback', () => {
  const line = (o) => JSON.stringify(o) + '\n';
  const write = (name, body) => { const f = path.join(root, name); fs.writeFileSync(f, body); return f; };
  const noMsg = (agent_transcript_path, agent = 'implement-agent') => ({ agent_type: agent, stop_hook_active: false, agent_transcript_path });

  test('complete report in the last assistant entry allows', () => {
    const f = write('t-ok.jsonl',
      line({ type: 'user', message: { role: 'user', content: 'do it' } }) +
      line({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'working' }] } }) +
      line({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: REPORT }] } }));
    assert.equal(run(noMsg(f)), null);
  });
  test('missing fields in the last assistant entry block', () => {
    const f = write('t-bad.jsonl',
      line({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: REPORT }] } }) +
      line({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: 'Done, bye.' }] } }));
    assert.equal(decision(run(noMsg(f))), 'block');
  });
  test('skips tool-only entries, malformed lines and trailing non-assistant entries', () => {
    const f = write('t-mixed.jsonl',
      line({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: REPORT }] } }) +
      line({ type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: 'x', name: 'Bash', input: {} }] } }) +
      '{broken json\n' +
      line({ type: 'system', subtype: 'stop_hook_summary' }) + '\n');
    assert.equal(run(noMsg(f)), null);
  });
  test('flat format with string content', () => {
    const f = write('t-flat.jsonl', line({ role: 'assistant', content: 'nothing here' }));
    assert.equal(decision(run(noMsg(f))), 'block');
  });
  test('missing transcript file allows', () => assert.equal(run(noMsg(path.join(root, 'nope.jsonl'))), null));
  test('transcript without assistant text allows', () => {
    const f = write('t-none.jsonl', line({ type: 'user', message: { role: 'user', content: 'hi' } }));
    assert.equal(run(noMsg(f)), null);
  });
  test('no message and no transcript allows', () => assert.equal(run({ agent_type: 'implement-agent', stop_hook_active: false }), null));
  test('last_assistant_message wins over the transcript', () => {
    const f = write('t-ignored.jsonl', line({ type: 'assistant', message: { role: 'assistant', content: 'bad' } }));
    assert.equal(run(stop('implement-agent', REPORT, { agent_transcript_path: f })), null);
  });
});

describe('disable switch', () => {
  test('DOTCLAUDE_REPORT_CHECK=off allows', () => assert.equal(run(stop('implement-agent', 'x'), { DOTCLAUDE_REPORT_CHECK: 'off' }), null));
  test('OFF is case-insensitive', () => assert.equal(run(stop('implement-agent', 'x'), { DOTCLAUDE_REPORT_CHECK: 'OFF' }), null));
  test('script honours the env var', () => {
    const r = runScript(SCRIPT, JSON.stringify(stop('implement-agent', 'x')), { DOTCLAUDE_REPORT_CHECK: 'off' });
    assert.equal(r.code, 0);
    assert.equal(r.stdout, '');
  });
});

describe('script I/O fails open', () => {
  test('blocks with JSON on stdout and exit 0', () => {
    const r = runScript(SCRIPT, JSON.stringify(stop('implement-agent', 'x')));
    assert.equal(r.code, 0);
    const out = JSON.parse(r.stdout);
    assert.equal(out.decision, 'block');
    assert.equal(typeof out.reason, 'string');
  });
  test('complete report prints nothing', () => {
    const r = runScript(SCRIPT, JSON.stringify(stop('implement-agent', REPORT)));
    assert.equal(r.code, 0);
    assert.equal(r.stdout, '');
  });
  for (const [name, input] of [['malformed JSON', '{not json'], ['empty input', ''], ['JSON null', 'null'], ['JSON array', '[1,2]'], ['wrong types', '{"agent_type":5,"last_assistant_message":{}}']]) {
    test(`${name} allows`, () => {
      const r = runScript(SCRIPT, input);
      assert.equal(r.code, 0);
      assert.equal(r.stdout, '');
    });
  }
  test('malformed JSON notes the error on stderr', () => assert.match(runScript(SCRIPT, '{not json').stderr, /dotclaude report-check: .*\(allowing\)/));
  test('input over 1 MB allows', () => {
    const r = runScript(SCRIPT, JSON.stringify(stop('implement-agent', 'x'.repeat(1024 * 1024 + 10))));
    assert.equal(r.code, 0);
    assert.equal(r.stdout, '');
    assert.match(r.stderr, /over 1 MB/);
  });
});
