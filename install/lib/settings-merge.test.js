'use strict';
// Run: node --test "hooks/*.test.js" "statusline/*.test.js" "install/lib/*.test.js"
// Drives settings-merge.js as a CLI against throwaway temp dirs (never the real ~/.claude).
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync, execFileSync } = require('child_process');

const SCRIPT = path.join(__dirname, 'settings-merge.js');
const REPO = path.resolve(__dirname, '..', '..');
const KNOWN = JSON.parse(fs.readFileSync(path.join(__dirname, 'known-releases.json'), 'utf8'));
const AGENT = 'test-agent.md';
const REL = `agents/${AGENT}`;
const NEW_BODY = '# repo version of test-agent\n';

let root, seq = 0;
before(() => { root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'settings-merge-test-'))); });
after(() => { if (root && root.startsWith(fs.realpathSync(os.tmpdir()))) fs.rmSync(root, { recursive: true, force: true }); });

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

// v3.0.0 released agent bytes from git, or null when the tag is unavailable (e.g. shallow checkout)
let v3Cache;
function v3Agent() {
  if (v3Cache === undefined) {
    try {
      v3Cache = execFileSync('git', ['-C', REPO, 'show', `v3.0.0:${REL}`], { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 24 });
      const norm = v3Cache.toString('utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
      if (!KNOWN[REL].includes(sha(norm))) v3Cache = null; // tag content is not a known release: unusable as fixture
    } catch (e) { v3Cache = null; }
  }
  return v3Cache;
}
const NEEDS_TAG = () => (v3Agent() ? false : (process.env.CI ? (() => { throw new Error('git tag v3.0.0 missing in CI; checkout must fetch tags (fetch-depth: 0)'); })() : 'git tag v3.0.0 unavailable (shallow checkout?); exact-adoption case skipped'));

function env() {
  const dir = path.join(root, `case${++seq}`);
  const cfg = path.join(dir, 'cfg'), src = path.join(dir, 'src');
  fs.mkdirSync(cfg, { recursive: true });
  fs.mkdirSync(path.join(src, 'agents'), { recursive: true });
  fs.writeFileSync(path.join(src, 'agents', AGENT), NEW_BODY);
  return { dir, cfg, src };
}
function run(sub, e, extra = []) {
  const r = spawnSync(process.execPath, [SCRIPT, sub, '--src', e.src, '--cfg', e.cfg, ...extra], { encoding: 'utf8' });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}
const put = (file, data) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, data); };
const manifestFile = (cfg) => path.join(cfg, 'dotclaude', 'manifest.json');
const readMan = (cfg) => JSON.parse(fs.readFileSync(manifestFile(cfg), 'utf8'));
const writeMan = (cfg, m) => put(manifestFile(cfg), JSON.stringify(m, null, 2));
function snapshot(dir) {
  const out = {};
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, ent.name), r = path.relative(dir, p).replace(/\\/g, '/');
      if (ent.isDirectory()) { out[r + '/'] = 'dir'; walk(p); } else out[r] = sha(fs.readFileSync(p));
    }
  };
  walk(dir);
  return out;
}

describe('known-releases.json', () => {
  test('has 8 agent entries, each a list of 64-hex sha256 hashes', () => {
    const keys = Object.keys(KNOWN);
    assert.equal(keys.length, 8);
    for (const k of keys) {
      assert.match(k, /^agents\/[\w.-]+\.md$/);
      assert.ok(Array.isArray(KNOWN[k]) && KNOWN[k].length >= 1, k);
      for (const h of KNOWN[k]) assert.match(h, /^[0-9a-f]{64}$/, k);
    }
  });
});

describe('agents: adoption', () => {
  const variants = {
    'exact v3.0.0 copy': (b) => b,
    'exact copy with CRLF line endings and UTF-8 BOM': (b) => Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(b.toString('utf8').replace(/\r\n/g, '\n').replace(/\n/g, '\r\n'))]),
  };
  for (const [name, mk] of Object.entries(variants)) {
    test(`${name} is adopted without a backup`, { skip: NEEDS_TAG() }, () => {
      const e = env();
      put(path.join(e.cfg, REL), mk(v3Agent()));
      const r = run('agents', e);
      assert.equal(r.code, 0, r.out);
      assert.match(r.out, /adopt agent test-agent/);
      assert.equal(fs.readFileSync(path.join(e.cfg, REL), 'utf8'), NEW_BODY);
      assert.ok(!fs.existsSync(path.join(e.cfg, 'dotclaude', 'backups')));
      const m = readMan(e.cfg);
      assert.deepEqual(m.backups, []);
      assert.ok(m.agents.includes(AGENT));
    });
  }

  test('customized agent (not a known release) is backed up, never adopted', () => {
    const e = env();
    put(path.join(e.cfg, REL), 'my own agent\n');
    const r = run('agents', e);
    assert.equal(r.code, 0, r.out);
    assert.doesNotMatch(r.out, /adopt agent/);
    const m = readMan(e.cfg);
    assert.equal(m.backups.length, 1);
    assert.equal(m.backups[0].from, REL);
    assert.equal(fs.readFileSync(path.join(e.cfg, m.backups[0].to), 'utf8'), 'my own agent\n');
    assert.equal(fs.readFileSync(path.join(e.cfg, REL), 'utf8'), NEW_BODY);
  });

  test('v3.0.0 agent plus one extra line is backed up and remove restores it byte-identical', { skip: NEEDS_TAG() }, () => {
    const e = env();
    const edited = Buffer.concat([v3Agent(), Buffer.from('one local line\r\n')]);
    put(path.join(e.cfg, REL), edited);
    let r = run('agents', e);
    assert.equal(r.code, 0, r.out);
    assert.doesNotMatch(r.out, /adopt agent/);
    const m = readMan(e.cfg);
    assert.equal(m.backups.length, 1);
    const backup = path.join(e.cfg, m.backups[0].to);
    assert.ok(fs.readFileSync(backup).equals(edited));
    assert.equal(fs.readFileSync(path.join(e.cfg, REL), 'utf8'), NEW_BODY);

    r = run('remove', e);
    assert.equal(r.code, 0, r.out);
    assert.ok(fs.readFileSync(path.join(e.cfg, REL)).equals(edited), 'restored bytes differ');
    assert.ok(!fs.existsSync(backup));
    assert.ok(!fs.existsSync(manifestFile(e.cfg)));
    assert.ok(!fs.existsSync(path.join(e.cfg, 'dotclaude')), 'empty dotclaude dir should be pruned');
  });
});

describe('agents: cleanBackups', () => {
  const TO = 'dotclaude/backups/20240101000000/agents/' + AGENT;

  test('stale backup of a pristine released agent is deleted and empty dirs pruned', { skip: NEEDS_TAG() }, () => {
    const e = env();
    put(path.join(e.cfg, TO), v3Agent());
    writeMan(e.cfg, { backups: [{ from: REL, to: TO }] });
    const r = run('agents', e);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /remove stale backup/);
    assert.ok(!fs.existsSync(path.join(e.cfg, TO)));
    assert.ok(!fs.existsSync(path.join(e.cfg, 'dotclaude', 'backups')), 'empty backup dirs should be pruned');
    assert.ok(fs.existsSync(manifestFile(e.cfg)), 'dotclaude dir/manifest must remain');
    assert.deepEqual(readMan(e.cfg).backups, []);
  });

  test('customized backup is kept (file and manifest entry)', () => {
    const e = env();
    put(path.join(e.cfg, TO), 'customized\n');
    writeMan(e.cfg, { backups: [{ from: REL, to: TO }] });
    const r = run('agents', e);
    assert.equal(r.code, 0, r.out);
    assert.equal(fs.readFileSync(path.join(e.cfg, TO), 'utf8'), 'customized\n');
    assert.deepEqual(readMan(e.cfg).backups, [{ from: REL, to: TO }]);
  });

  test('pristine backup deletion keeps a directory that still holds other files', { skip: NEEDS_TAG() }, () => {
    const e = env();
    put(path.join(e.cfg, TO), v3Agent());
    put(path.join(e.cfg, 'dotclaude/backups/20240101000000/agents/other.md'), 'keep me');
    writeMan(e.cfg, { backups: [{ from: REL, to: TO }] });
    assert.equal(run('agents', e).code, 0);
    assert.ok(!fs.existsSync(path.join(e.cfg, TO)));
    assert.equal(fs.readFileSync(path.join(e.cfg, 'dotclaude/backups/20240101000000/agents/other.md'), 'utf8'), 'keep me');
  });

  test('pristine backup whose repo agent no longer exists is kept', { skip: NEEDS_TAG() }, () => {
    const e = env();
    fs.rmSync(path.join(e.src, REL));
    put(path.join(e.src, 'agents', 'other.md'), 'x'); // keep agents dir non-empty
    put(path.join(e.cfg, TO), v3Agent());
    writeMan(e.cfg, { backups: [{ from: REL, to: TO }] });
    assert.equal(run('agents', e).code, 0);
    assert.ok(fs.existsSync(path.join(e.cfg, TO)));
  });

  test('backup `to` outside dotclaude/backups (even inside cfg) is never deleted', { skip: NEEDS_TAG() }, () => {
    const e = env();
    put(path.join(e.cfg, 'notes', 'pristine.md'), v3Agent());
    writeMan(e.cfg, { backups: [{ from: REL, to: 'notes/pristine.md' }] });
    assert.equal(run('agents', e).code, 0);
    assert.ok(fs.existsSync(path.join(e.cfg, 'notes', 'pristine.md')));
  });

  test('backup `to` escaping cfg is ignored: outside file untouched', { skip: NEEDS_TAG() }, () => {
    const e = env();
    const outside = path.join(e.dir, 'outside.md');
    fs.writeFileSync(outside, v3Agent());
    writeMan(e.cfg, { backups: [{ from: REL, to: '../outside.md' }] });
    assert.equal(run('agents', e).code, 0);
    assert.ok(fs.readFileSync(outside).equals(v3Agent()));
    assert.equal(readMan(e.cfg).backups.length, 1);
  });

});

describe('copy: skills backup', () => {
  function skillEnv() {
    const e = env();
    for (const f of ['hooks/guard.js', 'hooks/report-check.js', 'statusline/statusline.js']) put(path.join(e.src, f), '// stub\n');
    put(path.join(e.src, 'skills/foo/SKILL.md'), 'repo skill\n');
    return e;
  }

  test('unmanaged differing skill is backed up; later agents runs keep the backup; remove restores it', () => {
    const e = skillEnv();
    put(path.join(e.cfg, 'skills/foo/SKILL.md'), 'user skill\n');
    let r = run('copy', e);
    assert.equal(r.code, 0, r.out);
    const m = readMan(e.cfg);
    assert.equal(m.backups.length, 1);
    assert.equal(m.backups[0].from, 'skills/foo');
    const backup = path.join(e.cfg, m.backups[0].to, 'SKILL.md');
    assert.equal(fs.readFileSync(backup, 'utf8'), 'user skill\n');
    assert.equal(fs.readFileSync(path.join(e.cfg, 'skills/foo/SKILL.md'), 'utf8'), 'repo skill\n');

    r = run('agents', e);
    assert.equal(r.code, 0, r.out);
    assert.equal(readMan(e.cfg).backups.length, 1);
    assert.ok(fs.existsSync(backup));

    // re-running copy: skill is now managed, so no second backup
    assert.equal(run('copy', e).code, 0);
    assert.equal(readMan(e.cfg).backups.length, 1);

    r = run('remove', e);
    assert.equal(r.code, 0, r.out);
    assert.equal(fs.readFileSync(path.join(e.cfg, 'skills/foo/SKILL.md'), 'utf8'), 'user skill\n');
  });

  test('a backup whose from is not under agents/ is never treated as a stale agent backup', { skip: NEEDS_TAG() }, () => {
    const e = skillEnv();
    const TO = 'dotclaude/backups/20240101000000/agents/' + AGENT;
    put(path.join(e.cfg, TO), v3Agent());
    writeMan(e.cfg, { backups: [{ from: 'skills/' + AGENT, to: TO }] });
    assert.equal(run('agents', e).code, 0);
    assert.ok(fs.existsSync(path.join(e.cfg, TO)));
    assert.equal(readMan(e.cfg).backups.length, 1);
  });

  test('identical unmanaged skill is not backed up', () => {
    const e = skillEnv();
    put(path.join(e.cfg, 'skills/foo/SKILL.md'), 'repo skill\n');
    assert.equal(run('copy', e).code, 0);
    assert.deepEqual(readMan(e.cfg).backups, []);
  });
});

describe('remove: manifest backup handling', () => {
  test('entries missing to/from are skipped without error', () => {
    const e = env();
    put(path.join(e.cfg, 'dotclaude/backups/x/agents/a.md'), 'orig');
    writeMan(e.cfg, { backups: [{ from: 'agents/a.md' }, { to: 'dotclaude/backups/x/agents/a.md' }, null] });
    const r = run('remove', e);
    assert.equal(r.code, 0, r.out);
    assert.equal(fs.readFileSync(path.join(e.cfg, 'dotclaude/backups/x/agents/a.md'), 'utf8'), 'orig');
    assert.ok(!fs.existsSync(path.join(e.cfg, 'agents/a.md')));
  });

  test('`to` escaping cfg is ignored: outside file is not moved', () => {
    const e = env();
    const outside = path.join(e.dir, 'outside.md');
    fs.writeFileSync(outside, 'precious');
    writeMan(e.cfg, { backups: [{ from: 'agents/a.md', to: '../outside.md' }] });
    const r = run('remove', e);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /outside/);
    assert.equal(fs.readFileSync(outside, 'utf8'), 'precious');
    assert.ok(!fs.existsSync(path.join(e.cfg, 'agents/a.md')));
  });

  test('`from` escaping cfg is ignored: nothing written outside', () => {
    const e = env();
    put(path.join(e.cfg, 'dotclaude/backups/x/a.md'), 'orig');
    writeMan(e.cfg, { backups: [{ from: '../escaped.md', to: 'dotclaude/backups/x/a.md' }] });
    const r = run('remove', e);
    assert.equal(r.code, 0, r.out);
    assert.ok(!fs.existsSync(path.join(e.dir, 'escaped.md')));
    assert.equal(fs.readFileSync(path.join(e.cfg, 'dotclaude/backups/x/a.md'), 'utf8'), 'orig');
  });

  test('does not overwrite an existing file at the original location', () => {
    const e = env();
    put(path.join(e.cfg, 'agents/a.md'), 'newer user file');
    put(path.join(e.cfg, 'dotclaude/backups/x/agents/a.md'), 'old');
    writeMan(e.cfg, { backups: [{ from: 'agents/a.md', to: 'dotclaude/backups/x/agents/a.md' }] });
    assert.equal(run('remove', e).code, 0);
    assert.equal(fs.readFileSync(path.join(e.cfg, 'agents/a.md'), 'utf8'), 'newer user file');
    assert.equal(fs.readFileSync(path.join(e.cfg, 'dotclaude/backups/x/agents/a.md'), 'utf8'), 'old');
  });
});

describe('--dry-run writes nothing', () => {
  test('agents --dry-run with adoptable agent, backup candidate and stale backup', { skip: NEEDS_TAG() }, () => {
    const e = env();
    put(path.join(e.src, 'agents', 'other.md'), 'repo other');
    put(path.join(e.cfg, REL), v3Agent());                  // would be adopted
    put(path.join(e.cfg, 'agents/other.md'), 'user other'); // would be backed up
    const TO = 'dotclaude/backups/20240101000000/agents/' + AGENT;
    put(path.join(e.cfg, TO), v3Agent());                   // would be cleaned
    writeMan(e.cfg, { backups: [{ from: REL, to: TO }] });
    const before = snapshot(e.dir);
    const r = run('agents', e, ['--dry-run']);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /\[dry-run\]/);
    assert.deepEqual(snapshot(e.dir), before);
  });

  const stubs = (e) => { for (const f of ['hooks/guard.js', 'hooks/report-check.js', 'statusline/statusline.js']) put(path.join(e.src, f), '// stub\n'); };
  const table = [
    ['copy', (e) => { stubs(e); put(path.join(e.src, 'skills/foo/SKILL.md'), 'repo skill\n'); put(path.join(e.cfg, 'skills/foo/SKILL.md'), 'user skill\n'); }],
    ['remove', (e) => { put(path.join(e.cfg, REL), 'installed'); put(path.join(e.cfg, 'dotclaude/backups/x/agents/a.md'), 'orig'); writeMan(e.cfg, { agents: [AGENT], backups: [{ from: 'agents/a.md', to: 'dotclaude/backups/x/agents/a.md' }] }); }],
  ];
  for (const [sub, setup] of table) {
    test(`${sub} --dry-run changes nothing`, () => {
      const e = env();
      setup(e);
      const before = snapshot(e.dir);
      const r = run(sub, e, ['--dry-run']);
      assert.equal(r.code, 0, r.out);
      assert.deepEqual(snapshot(e.dir), before);
    });
  }
});
