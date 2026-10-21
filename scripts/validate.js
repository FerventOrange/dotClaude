#!/usr/bin/env node
'use strict';
// Validates agents/*.md, skills/*/SKILL.md and the roster in install/custom-instructions.md.
// Usage: node scripts/validate.js   (exit 0 = ok, 1 = violations)

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const errors = [];
const err = (file, msg) => errors.push(`${path.relative(root, file).split(path.sep).join('/')}: ${msg}`);

const AGENT_KEYS = new Set(['name', 'description', 'tools', 'model', 'color', 'effort', 'maxTurns']);
const SKILL_KEYS = new Set(['name', 'description', 'argument-hint', 'disable-model-invocation', 'allowed-tools']);
const EFFORTS = new Set(['low', 'medium', 'high', 'xhigh', 'max']);
const MODELS = new Set(['sonnet', 'opus', 'haiku', 'inherit']);

const read = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');

function parseFrontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!m) return null;
  const data = {};
  for (const line of m[1].split('\n')) {
    const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (kv) data[kv[1]] = kv[2].trim();
  }
  return { data, body: text.slice(m[0].length) };
}

// H2 headings outside fenced code blocks, with line index.
function h2s(text) {
  const out = [];
  let fence = false;
  text.split('\n').forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    else if (!fence && /^## /.test(line)) out.push({ title: line.slice(3).trim(), line: i });
  });
  return out;
}

// Shared part of the Clarification section: heading through "Never guess..." (agent-specific text after it may differ).
function clarificationBlock(text, headings) {
  const i = headings.findIndex((h) => h.title === 'Clarification');
  if (i < 0) return null;
  const lines = text.split('\n');
  const end = i + 1 < headings.length ? headings[i + 1].line : lines.length;
  const block = lines.slice(headings[i].line, end);
  const cut = block.findIndex((l) => l.startsWith('Never guess at user intent'));
  return (cut >= 0 ? block.slice(0, cut + 1) : block).join('\n').trim();
}

function checkAgents() {
  const dir = path.join(root, 'agents');
  if (!fs.existsSync(dir)) return err(dir, 'agents/ directory missing');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();
  const colors = new Map();
  let refBlock = null;
  let refName = null;

  for (const f of files) {
    const file = path.join(dir, f);
    const text = read(file);
    const base = f.replace(/\.md$/, '');
    const fm = parseFrontmatter(text);

    if (!fm) {
      err(file, 'missing YAML frontmatter');
    } else {
      const { data } = fm;
      for (const k of Object.keys(data)) {
        if (!AGENT_KEYS.has(k)) err(file, `unknown frontmatter key "${k}" (allowed: ${[...AGENT_KEYS].join(', ')})`);
      }
      if (!data.name) err(file, 'frontmatter missing "name"');
      else if (data.name !== base) err(file, `name "${data.name}" does not match filename "${base}"`);
      if (!data.description) err(file, 'frontmatter missing "description"');
      if (data.model && !MODELS.has(data.model)) {
        err(file, `model "${data.model}" not in {${[...MODELS].join(', ')}}`);
      }
      if (data.effort !== undefined && !EFFORTS.has(data.effort)) {
        err(file, `effort "${data.effort}" not in {${[...EFFORTS].join(', ')}}`);
      }
      if (data.maxTurns !== undefined && !/^[1-9]\d*$/.test(data.maxTurns)) {
        err(file, `maxTurns "${data.maxTurns}" must be a positive integer`);
      }
      if (data.color) {
        if (colors.has(data.color)) err(file, `color "${data.color}" already used by ${colors.get(data.color)}`);
        else colors.set(data.color, base);
      }
    }

    const headings = h2s(text);
    const titles = headings.map((h) => h.title);
    if (titles[0] !== 'Scope') err(file, `first H2 must be "Scope" (found "${titles[0] || 'none'}")`);
    if (titles.length < 2 || titles[titles.length - 2] !== 'Clarification' || titles[titles.length - 1] !== 'Output') {
      err(file, `last two H2s must be "Clarification" then "Output" (found "${titles.slice(-2).join('", "')}")`);
    }

    const block = clarificationBlock(text, headings);
    if (block === null) err(file, 'missing "## Clarification" section');
    else if (refBlock === null) { refBlock = block; refName = f; }
    else if (block !== refBlock) err(file, `Clarification block differs from ${refName} (shared text up to "Never guess..." must be identical)`);

    const lineCount = text.replace(/\n$/, '').split('\n').length;
    if (lineCount < 60 || lineCount > 150) err(file, `${lineCount} lines (must be 60-150)`);
  }
  return files.map((f) => f.replace(/\.md$/, ''));
}

function checkSkills() {
  const dir = path.join(root, 'skills');
  if (!fs.existsSync(dir)) return;
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const file = path.join(dir, d.name, 'SKILL.md');
    if (!fs.existsSync(file)) { err(path.join(dir, d.name), 'missing SKILL.md'); continue; }
    const fm = parseFrontmatter(read(file));
    if (!fm) { err(file, 'missing YAML frontmatter'); continue; }
    for (const k of Object.keys(fm.data)) {
      if (!SKILL_KEYS.has(k)) err(file, `unknown frontmatter key "${k}" (allowed: ${[...SKILL_KEYS].join(', ')})`);
    }
    const dmi = fm.data['disable-model-invocation'];
    if (dmi !== undefined && dmi !== 'true' && dmi !== 'false') {
      err(file, `disable-model-invocation "${dmi}" must be true or false`);
    }
    if (!fm.data.name) err(file, 'frontmatter missing "name"');
    else if (fm.data.name !== d.name) err(file, `name "${fm.data.name}" does not match directory "${d.name}"`);
    if (!fm.data.description) err(file, 'frontmatter missing "description"');
  }
}

function checkRoster(agentNames) {
  const file = path.join(root, 'install', 'custom-instructions.md');
  if (!fs.existsSync(file)) return err(file, 'file missing');
  const text = read(file);
  const listed = [];
  let inAgents = false;
  for (const line of text.split('\n')) {
    if (/^## /.test(line)) inAgents = line.trim() === '## Agents';
    else if (inAgents) {
      const m = /^\|\s*`?([a-z][a-z0-9-]*)`?\s*\|/.exec(line);
      if (m && m[1] !== 'agent') listed.push(m[1]);
    }
  }
  if (!listed.length) return err(file, 'no roster table found under "## Agents"');
  for (const a of agentNames) if (!listed.includes(a)) err(file, `roster is missing agent "${a}"`);
  for (const a of listed) if (!agentNames.includes(a)) err(file, `roster lists "${a}" but agents/${a}.md does not exist`);
  const dup = listed.filter((a, i) => listed.indexOf(a) !== i);
  for (const a of new Set(dup)) err(file, `roster lists "${a}" more than once`);
}

const agentNames = checkAgents() || [];
checkSkills();
checkRoster(agentNames);

if (errors.length) {
  console.error(`Validation failed: ${errors.length} problem${errors.length === 1 ? '' : 's'}\n`);
  for (const e of errors) console.error(`  x ${e}`);
  process.exit(1);
}
console.log(`OK: ${agentNames.length} agents, roster in sync${fs.existsSync(path.join(root, 'skills')) ? ', skills valid' : ''}.`);
