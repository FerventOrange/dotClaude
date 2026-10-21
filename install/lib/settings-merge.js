#!/usr/bin/env node
// Shared helper for install.sh / install.ps1 (Node stdlib only).
//   merge   --template F --cfg DIR [--force] [--omit-on-failure] [--dry-run]   merge template into DIR/settings.json
//   unmerge --template F --cfg DIR [--dry-run]             remove dotClaude-owned settings entries
//   copy    --src REPO --cfg DIR [--dry-run]               install hooks/statusline/skills (backs up unmanaged same-name skills to dotclaude/backups/)
//   agents  --src REPO --cfg DIR [--dry-run]               install agents/*.md (backs up unmanaged, differing same-name agents;
//                                                          adopts exact copies of released agents, see known-releases.json)
//   remove  --src REPO --cfg DIR [--dry-run]               remove files listed in <cfg>/dotclaude/manifest.json
// State of what was added lives in <cfg>/dotclaude/manifest.json so uninstall undoes exactly that.
//   version-lt A B                                         exit 0 if version A < B
//   is-ours FILE                                           exit 0 if FILE starts with the dotClaude header
'use strict';
const fs = require('fs');
const path = require('path');

const HEADER = '# Orchestrator Instructions';
const HOOK_MARKS = ['dotclaude/guard.js', 'dotclaude/report-check.js'];
const SL_MARK = 'dotclaude/statusline.js';

const args = process.argv.slice(2);
const cmd = args.shift();
const opt = {};
const pos = [];
while (args.length) {
  const a = args.shift();
  if (a.startsWith('--')) {
    const k = a.slice(2);
    opt[k] = ['force', 'dry-run', 'omit-on-failure'].includes(k) ? true : args.shift();
  } else pos.push(a);
}
const DRY = !!opt['dry-run'];
const fwd = (p) => path.resolve(p).replace(/\\/g, '/');
const say = (m) => console.log(`${DRY ? '[dry-run] ' : ''}${m}`);
const die = (m) => { console.error(`[X] ${m}`); process.exit(1); };
const norm = (c) => String(c || '').replace(/\\/g, '/');
const cmdOf = (x) => norm(x && x.command);
const ownsHook = (h) => HOOK_MARKS.some((m) => cmdOf(h).includes(m));
const clone = (o) => JSON.parse(JSON.stringify(o));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, '')); }
  catch (e) { die(`Cannot parse ${file}: ${e.message}. Fix or move it, then re-run.`); }
}

function loadTemplate(cfg) {
  const t = fs.readFileSync(opt.template, 'utf8').split('<cfg>').join(fwd(cfg));
  const tpl = JSON.parse(t);
  if (opt['omit-on-failure']) { // Claude Code < 2.1.295 does not know hook onFailure
    for (const es of Object.values(tpl.hooks || {})) for (const e of es) for (const h of e.hooks || []) delete h.onFailure;
  }
  return tpl;
}

function stamp() {
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function save(file, before, after, notes) {
  if (same(before, after)) { say(`settings.json: no changes (${file})`); return; }
  notes.forEach((n) => say(`settings.json: ${n}`));
  if (DRY) return;
  if (fs.existsSync(file)) {
    const b = `${file}.backup.${stamp()}`;
    fs.copyFileSync(file, b);
    console.log(`Backup created: ${b}`);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(after, null, 2) + '\n');
  console.log(`[OK] Updated ${file}`);
}

// ---- manifest: <cfg>/dotclaude/manifest.json records exactly what we added ----
const manifestPath = (cfg) => path.join(cfg, 'dotclaude', 'manifest.json');
const uniq = (a) => [...new Set(a)];
function loadManifest(cfg) {
  const f = manifestPath(cfg);
  const base = { addedAllow: [], addedDeny: [], addedKeys: [], replacedStatusLine: null, createdSettings: false, files: [], skills: [], agents: [], backups: [] };
  return { man: { ...base, ...readJson(f, {}) }, exists: fs.existsSync(f) };
}
function writeManifest(cfg, m) {
  if (DRY) return;
  fs.mkdirSync(path.join(cfg, 'dotclaude'), { recursive: true });
  fs.writeFileSync(manifestPath(cfg), JSON.stringify(m, null, 2) + '\n');
}
// resolve a manifest-relative path, refusing anything that escapes cfg
function inside(cfg, rel) {
  const root = path.resolve(cfg), p = path.resolve(root, rel);
  return p.startsWith(root + path.sep) ? p : null;
}

function merge() {
  const cfg = opt.cfg, file = path.join(cfg, 'settings.json');
  const tpl = loadTemplate(cfg), existed = fs.existsSync(file), before = readJson(file, {}), s = clone(before), notes = [];
  const added = { allow: [], deny: [], keys: [] };
  let replaced = null;

  // hooks: drop our previous entries, then append the template entries
  s.hooks = s.hooks || {};
  for (const [ev, entries] of Object.entries(tpl.hooks || {})) {
    const cur = (s.hooks[ev] || [])
      .map((e) => ({ ...e, hooks: (e.hooks || []).filter((h) => !ownsHook(h)) }))
      .filter((e) => e.hooks.length);
    s.hooks[ev] = [...cur, ...entries];
  }
  if (!same(s.hooks, before.hooks)) notes.push('hooks: dotClaude hooks added/updated');

  // statusLine: only if absent, ours, the old jq one, or --force
  if (tpl.statusLine) {
    const c = cmdOf(s.statusLine);
    if (!s.statusLine || c.includes(SL_MARK) || c.includes('jq ') || opt.force) {
      if (!same(s.statusLine, tpl.statusLine)) notes.push(`statusLine: ${s.statusLine ? 'replaced' : 'set'}`);
      if (s.statusLine && !c.includes(SL_MARK) && !same(s.statusLine, tpl.statusLine)) replaced = clone(s.statusLine);
      s.statusLine = tpl.statusLine;
    } else say('settings.json: statusLine: kept existing custom one (use --force to replace)');
  }

  // other keys (permissions, worktree): arrays union, objects recurse, existing scalars win
  const deep = (dst, src, trail) => {
    for (const [k, v] of Object.entries(src)) {
      if (['hooks', 'statusLine'].includes(k) && !trail) continue;
      const where = (trail ? trail + '.' : '') + k;
      if (Array.isArray(v)) {
        const cur = Array.isArray(dst[k]) ? dst[k] : [];
        const add = v.filter((x) => !cur.some((y) => same(x, y)));
        if (add.length) notes.push(`${where}: +${add.length} entr${add.length > 1 ? 'ies' : 'y'}`);
        if (where === 'permissions.allow') added.allow.push(...add);
        if (where === 'permissions.deny') added.deny.push(...add);
        dst[k] = [...cur, ...add];
      } else if (v && typeof v === 'object') {
        dst[k] = dst[k] && typeof dst[k] === 'object' ? dst[k] : {};
        deep(dst[k], v, where);
      } else if (dst[k] === undefined) { dst[k] = v; notes.push(`${where}: set`); added.keys.push(where); }
    }
  };
  deep(s, tpl, '');
  if (!s.hooks || !Object.keys(s.hooks).length) delete s.hooks;
  save(file, before, s, notes);

  // manifest: union with any previous one so re-installs stay idempotent
  const { man } = loadManifest(cfg);
  man.addedAllow = uniq([...man.addedAllow, ...added.allow]);
  man.addedDeny = uniq([...man.addedDeny, ...added.deny]);
  man.addedKeys = uniq([...man.addedKeys, ...added.keys]);
  if (replaced) man.replacedStatusLine = replaced;
  man.createdSettings = man.createdSettings || !existed;
  writeManifest(cfg, man);
}

function unmerge() {
  const cfg = opt.cfg, file = path.join(cfg, 'settings.json');
  if (!fs.existsSync(file)) { say(`settings.json: not present (${file})`); return; }
  const tpl = loadTemplate(cfg), before = readJson(file, {}), s = clone(before), notes = [];
  const { man, exists } = loadManifest(cfg);
  if (s.hooks) {
    for (const ev of Object.keys(s.hooks)) {
      s.hooks[ev] = s.hooks[ev]
        .map((e) => ({ ...e, hooks: (e.hooks || []).filter((h) => !ownsHook(h)) }))
        .filter((e) => e.hooks.length);
      if (!s.hooks[ev].length) delete s.hooks[ev];
    }
    if (!Object.keys(s.hooks).length) delete s.hooks;
    if (!same(s.hooks, before.hooks)) notes.push('hooks: dotClaude hooks removed');
  }
  if (s.statusLine && cmdOf(s.statusLine).includes(SL_MARK)) {
    if (exists && man.replacedStatusLine) { s.statusLine = man.replacedStatusLine; notes.push('statusLine: previous one restored'); }
    else { delete s.statusLine; notes.push('statusLine: removed'); }
  }
  for (const k of ['allow', 'deny']) {
    const mine = exists ? man[k === 'allow' ? 'addedAllow' : 'addedDeny'] : ((tpl.permissions || {})[k] || []);
    const cur = (s.permissions || {})[k];
    if (!Array.isArray(cur)) continue;
    const keep = cur.filter((x) => !mine.some((y) => same(x, y)));
    if (keep.length !== cur.length) notes.push(`permissions.${k}: -${cur.length - keep.length} entries`);
    if (keep.length) s.permissions[k] = keep; else delete s.permissions[k];
  }
  if (s.permissions && !Object.keys(s.permissions).length) delete s.permissions;
  if (exists) {
    for (const p of man.addedKeys) {
      const parts = p.split('.'), leaf = parts.pop(), want = parts.reduce((o, x) => (o || {})[x], tpl)[leaf];
      const parent = parts.reduce((o, x) => (o && typeof o === 'object' ? o[x] : undefined), s);
      if (parent && typeof parent === 'object' && same(parent[leaf], want)) {
        delete parent[leaf]; notes.push(`${p}: removed`);
        for (let i = parts.length; i > 0; i--) {
          const o = parts.slice(0, i).reduce((x, y) => x[y], s);
          if (Object.keys(o).length) break;
          delete parts.slice(0, i - 1).reduce((x, y) => x[y], s)[parts[i - 1]];
        }
      }
    }
    if (man.createdSettings && !Object.keys(s).length) {
      say(`settings.json: only dotClaude content left; deleting ${file}`);
      if (!DRY) { fs.unlinkSync(file); console.log(`[OK] Removed ${file}`); }
      return;
    }
  }
  save(file, before, s, notes);
}

function listFiles(dir, rel = '') {
  const out = [];
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...listFiles(dir, r)); else out.push(r);
  }
  return out;
}

function sameTree(a, b) {
  try {
    const fa = listFiles(a).sort(), fb = listFiles(b).sort();
    return same(fa, fb) && fa.every((f) => fs.readFileSync(path.join(a, f)).equals(fs.readFileSync(path.join(b, f))));
  } catch (e) { return false; }
}

// move an unmanaged user item to <cfg>/dotclaude/backups/<stamp>/<rel>, recording it in the manifest
let runStamp = null;
function backupItem(cfg, man, rel, what) {
  runStamp = runStamp || stamp();
  let to = `dotclaude/backups/${runStamp}/${rel}`;
  for (let n = 1; fs.existsSync(path.join(cfg, to)); n++) to = `dotclaude/backups/${runStamp}-${n}/${rel}`;
  const t = path.join(cfg, rel), b = path.join(cfg, to);
  console.warn(`[!] Existing user ${what} ${t} is not managed by dotClaude; ${DRY ? 'would back it up' : 'backing it up'} to ${b}`);
  if (DRY) return;
  fs.mkdirSync(path.dirname(b), { recursive: true });
  fs.renameSync(t, b);
  man.backups.push({ from: rel, to });
}

// ---- adoption: recognise pristine agents left by an earlier (pre-manifest) dotClaude release ----
// known-releases.json maps "agents/<name>.md" -> [sha256 of normalized content] (strip BOM, CRLF -> LF)
const readText = (p) => { try { return fs.readFileSync(p, 'utf8').replace(/^﻿/, ''); } catch (e) { return null; } };
function knownHashes() {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'known-releases.json'), 'utf8')); } catch (e) { return {}; }
}
const sha = (t) => require('crypto').createHash('sha256').update(t).digest('hex');
// file p is, after normalization, exactly a released dotClaude agent named rel ("agents/<name>.md")
function adoptableAgent(p, rel) {
  const t = readText(p), hs = knownHashes()[rel];
  return t !== null && Array.isArray(hs) && hs.includes(sha(t.replace(/\r\n/g, '\n')));
}
// drop recorded agent backups that are just pristine released copies
function cleanBackups(cfg, man, kind, srcRoot) {
  const root = path.resolve(cfg, 'dotclaude', 'backups');
  const keep = [];
  for (const b of man.backups) {
    if (!b || typeof b.from !== 'string' || typeof b.to !== 'string') { keep.push(b); continue; }
    const parts = b.from.split('/'), to = inside(cfg, b.to);
    const ours = parts.length === 2 && parts[0] === kind ? path.join(srcRoot, kind, parts[1]) : null;
    if (!ours || !to || !to.startsWith(root + path.sep) || !fs.existsSync(to) || !fs.existsSync(ours)
      || !fs.statSync(to).isFile() || !adoptableAgent(to, b.from)) { keep.push(b); continue; }
    say(`remove stale backup ${to} (released dotClaude agent ${parts[1]})`);
    if (DRY) { keep.push(b); continue; }
    fs.rmSync(to, { force: true });
    for (let d = path.dirname(to); d.startsWith(root); d = path.dirname(d)) {
      try { if (!fs.readdirSync(d).length) fs.rmdirSync(d); else break; } catch (e) { break; }
    }
  }
  man.backups = keep;
}

function copyFiles() {
  const cfg = opt.cfg, src = opt.src;
  const { man } = loadManifest(cfg);
  const jobs = [['hooks/guard.js', 'dotclaude/guard.js'], ['hooks/report-check.js', 'dotclaude/report-check.js'], ['statusline/statusline.js', 'dotclaude/statusline.js']];
  const skillNames = [];
  const skills = path.join(src, 'skills');
  if (fs.existsSync(skills)) {
    for (const d of fs.readdirSync(skills, { withFileTypes: true })) {
      if (d.isDirectory()) { jobs.push([`skills/${d.name}`, `skills/${d.name}`]); skillNames.push(d.name); }
    }
  }
  let missing = false;
  const files = [];
  for (const [from, to] of jobs) {
    const f = path.join(src, from), t = path.join(cfg, to);
    if (!fs.existsSync(f)) { console.error(`[X] Missing ${f}`); missing = true; continue; }
    const isSkill = to.startsWith('skills/');
    if (isSkill && fs.existsSync(t) && !man.skills.includes(path.basename(to)) && !sameTree(f, t)) {
      backupItem(cfg, man, to, 'skill');
    }
    say(`install ${to}`);
    if (!DRY) { fs.mkdirSync(path.dirname(t), { recursive: true }); fs.cpSync(f, t, { recursive: true, force: true }); }
    if (fs.statSync(f).isDirectory()) files.push(...listFiles(f).map((r) => `${to}/${r}`)); else files.push(to);
  }
  if (missing) process.exit(1);
  man.files = uniq([...man.files, ...files]);
  man.skills = uniq([...man.skills, ...skillNames]);
  writeManifest(cfg, man);
  if (!DRY) console.log(`[OK] Installed hooks, statusline and ${skillNames.length} skill(s) to ${cfg}`);
}

function copyAgents() {
  const cfg = opt.cfg, src = path.join(opt.src, 'agents');
  const { man } = loadManifest(cfg);
  const agents = fs.existsSync(src) ? fs.readdirSync(src, { withFileTypes: true }).filter((e) => e.isFile() && e.name.endsWith('.md')).map((e) => e.name) : [];
  if (!agents.length) { console.warn(`[!] No agents found in ${src}`); return; }
  const dir = path.join(cfg, 'agents');
  if (!DRY) fs.mkdirSync(dir, { recursive: true });
  for (const name of agents) {
    const f = path.join(src, name), t = path.join(dir, name);
    if (fs.existsSync(t) && !man.agents.includes(name) && !fs.readFileSync(t).equals(fs.readFileSync(f))) {
      if (adoptableAgent(t, `agents/${name}`)) say(`adopt agent ${name.replace(/.md$/, '')} (released dotClaude copy; replacing without backup)`);
      else backupItem(cfg, man, `agents/${name}`, 'agent');
    }
    if (DRY) say(`install agent ${name} -> ${dir}`);
    else { fs.copyFileSync(f, t); console.log(`  Installed: ${name.replace(/.md$/, '')}`); }
  }
  cleanBackups(cfg, man, 'agents', opt.src);
  man.agents = uniq([...man.agents, ...agents]);
  writeManifest(cfg, man);
  if (!DRY) console.log(`[OK] ${agents.length} agent(s) installed to ${dir}`);
}

function removeFiles() {
  const cfg = opt.cfg, src = opt.src;
  const { man, exists } = loadManifest(cfg);
  let files = man.files, agents = man.agents;
  if (!exists) { // no manifest: derive from the repo (files that exist in both, never whole user dirs)
    files = ['dotclaude/guard.js', 'dotclaude/report-check.js', 'dotclaude/statusline.js'];
    const sk = path.join(src, 'skills');
    if (fs.existsSync(sk)) for (const d of fs.readdirSync(sk, { withFileTypes: true })) if (d.isDirectory()) files.push(...listFiles(sk, d.name).map((r) => `skills/${r}`));
    const ag = path.join(src, 'agents');
    agents = fs.existsSync(ag) ? fs.readdirSync(ag).filter((n) => n.endsWith('.md')) : [];
  }
  const targets = [...files, ...agents.map((a) => `agents/${a}`)];
  const dirs = new Set();
  for (const rel of targets) {
    const p = inside(cfg, rel);
    if (!p) { console.warn(`[!] Ignoring path outside ${cfg}: ${rel}`); continue; }
    for (let d = path.dirname(p); d.length > path.resolve(cfg).length; d = path.dirname(d)) dirs.add(d);
    if (!fs.existsSync(p)) continue;
    say(`remove ${p}`);
    if (!DRY) fs.rmSync(p, { force: true });
  }
  if (exists) { say(`remove ${manifestPath(cfg)}`); if (!DRY) fs.rmSync(manifestPath(cfg), { force: true }); }
  dirs.add(path.resolve(path.join(cfg, 'dotclaude')));
  // remove only directories that ended up empty (user files keep their folders)
  const prune = () => {
    for (const d of [...dirs].sort((a, b) => b.length - a.length)) {
      try { if (fs.existsSync(d) && !fs.readdirSync(d).length) fs.rmdirSync(d); } catch (e) { /* not empty */ }
    }
  };
  if (!DRY) prune();
  // put backed-up user skills/agents back where they were
  for (const b of exists ? man.backups : []) {
    if (!b || typeof b.from !== 'string' || typeof b.to !== 'string') continue;
    const from = inside(cfg, b.from), to = inside(cfg, b.to);
    if (!from || !to) { console.warn(`[!] Ignoring backup path outside ${cfg}: ${b.from} <- ${b.to}`); continue; }
    if (!fs.existsSync(to)) continue;
    for (let d = path.dirname(to); d.length > path.resolve(cfg).length; d = path.dirname(d)) dirs.add(d);
    if (fs.existsSync(from)) { console.warn(`[!] ${from} exists; your original is still at ${to}`); continue; }
    say(`restore ${from}`);
    if (!DRY) { fs.mkdirSync(path.dirname(from), { recursive: true }); fs.renameSync(to, from); console.log(`[OK] Restored ${from}`); }
  }
  if (!DRY) prune();
}

function verLt(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) < (pb[i] || 0);
  return false;
}

try {
  if (cmd === 'is-ours') {
    const f = pos[0];
    process.exit(fs.existsSync(f) && fs.readFileSync(f, 'utf8').replace(/^﻿/, '').startsWith(HEADER) ? 0 : 1);
  }
  if (cmd === 'version-lt') process.exit(verLt(pos[0], pos[1]) ? 0 : 1);
  const need = { merge: ['template', 'cfg'], unmerge: ['template', 'cfg'], copy: ['src', 'cfg'], agents: ['src', 'cfg'], remove: ['src', 'cfg'] }[cmd];
  if (!need) die(`Usage: settings-merge.js merge|unmerge|copy|agents|remove|is-ours ...`);
  need.forEach((k) => { if (!opt[k]) die(`Missing --${k}`); });
  ({ merge, unmerge, copy: copyFiles, agents: copyAgents, remove: removeFiles })[cmd]();
} catch (e) {
  die(e.message);
}
