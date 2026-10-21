#!/usr/bin/env node
'use strict';
// dotClaude SubagentStop hook: blocks a dotClaude agent from stopping until its final message
// carries the report contract fields (STATUS/SUMMARY/CHANGES/FOLLOW_UPS, plus VERDICT for review-agent).
// Fails open: any internal error or unknown message allows the stop. Disable with DOTCLAUDE_REPORT_CHECK=off.
const fs = require('fs');
const path = require('path');

const MAX_BYTES = 1024 * 1024;
const MAX_TRANSCRIPT_BYTES = 4 * 1024 * 1024; // only the tail of the transcript is read
const BUILTIN_AGENTS = ['git-agent', 'review-agent', 'implement-agent', 'test-agent', 'debug-agent', 'docs-agent', 'infra-agent', 'agent-manager'];
const STATUS_VALUES = ['DONE', 'NEEDS_CLARIFICATION', 'BLOCKED'];

// ---- rule table: required fields per agent ('*' applies to every dotClaude agent) ----
const RULES = {
  '*': ['STATUS', 'SUMMARY', 'CHANGES', 'FOLLOW_UPS'],
  'review-agent': ['VERDICT'],
};
// STATUS: NEEDS_CLARIFICATION uses the agents' Clarification format instead (STATUS + QUESTIONS, any agent).
const CLARIFICATION_FIELDS = ['STATUS', 'QUESTIONS'];

// Line start, optional whitespace / markdown decoration (> * _ # - `), field name (FOLLOW\_UPS tolerated), optional
// closing emphasis, then the colon. `**STATUS:**`, `- **STATUS**: x` and lines inside ``` blocks all match.
const LEAD = '^[ \\t>*_#`-]*';
const fieldRe = (name) => new RegExp(`${LEAD}${name.replace(/_/g, '\\\\?_')}[*_]*:`, 'm');
const STATUS_LINE = new RegExp(`${LEAD}STATUS[*_]*:[ \\t*_\`]*([A-Z\\\\_]+)`, 'gm');

function dotclaudeAgents(manifestFile) {
  try {
    const m = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    const names = Array.isArray(m && m.agents) ? m.agents.filter((a) => typeof a === 'string').map((a) => a.replace(/\.md$/i, '')) : [];
    if (names.length) return new Set(names);
  } catch { /* missing or unreadable manifest: use the built-in list */ }
  return new Set(BUILTIN_AGENTS);
}

// ---- transcript fallback: last assistant text in a JSONL transcript (tail only) ----
function textOf(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.map((c) => (typeof c === 'string' ? c : c && c.type === 'text' && typeof c.text === 'string' ? c.text : '')).join('\n');
}
function lastAssistantFromTranscript(file) {
  if (typeof file !== 'string' || !file) return null;
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const size = fs.fstatSync(fd).size, start = Math.max(0, size - MAX_TRANSCRIPT_BYTES);
    const buf = Buffer.alloc(size - start);
    fs.readSync(fd, buf, 0, buf.length, start);
    const lines = buf.toString('utf8').split(/\r?\n/);
    if (start > 0) lines.shift(); // partial first line
    for (let i = lines.length - 1; i >= 0; i--) {
      if (!lines[i].trim()) continue;
      let e;
      try { e = JSON.parse(lines[i]); } catch { continue; }
      if (!e || typeof e !== 'object') continue;
      const msg = e.message && typeof e.message === 'object' ? e.message : e;
      const role = msg.role || e.role || e.type;
      if (role !== 'assistant') continue;
      const text = textOf(msg.content !== undefined ? msg.content : e.text);
      if (text.trim()) return text;
    }
  } catch { /* unreadable transcript: unknown */ } finally {
    if (fd !== undefined) try { fs.closeSync(fd); } catch { /* ignore */ }
  }
  return null;
}

// Returns the list of missing items (empty when the report is complete).
function missingFields(agent, text) {
  const values = [...text.matchAll(STATUS_LINE)].map((m) => m[1].replace(/\\/g, '')).filter((v) => STATUS_VALUES.includes(v));
  const clarifying = values.length > 0 && values[values.length - 1] === 'NEEDS_CLARIFICATION';
  const required = clarifying ? CLARIFICATION_FIELDS : [...RULES['*'], ...(RULES[agent] || [])];
  const missing = required.filter((f) => !fieldRe(f).test(text)).map((f) => `${f}:`);
  if (!missing.includes('STATUS:') && !values.length) missing.unshift(`a valid STATUS value (${STATUS_VALUES.join(' | ')})`);
  return missing;
}

function evaluate(input, env = process.env, opts = {}) {
  if (String(env.DOTCLAUDE_REPORT_CHECK || '').toLowerCase() === 'off') return null;
  if (!input || typeof input !== 'object') return null;
  const warn = opts.warn || ((s) => process.stderr.write(s + '\n'));
  const agent = typeof input.agent_type === 'string' ? input.agent_type : '';
  const agents = dotclaudeAgents(opts.manifest || path.join(__dirname, 'manifest.json'));
  if (!agents.has(agent)) return null;

  let text = typeof input.last_assistant_message === 'string' ? input.last_assistant_message : null;
  if (text === null) text = lastAssistantFromTranscript(input.agent_transcript_path);
  if (text === null) return null; // unknown final message: fail open

  const missing = missingFields(agent, text);
  if (!missing.length) return null;
  if (input.stop_hook_active === true) {
    warn(`dotclaude report-check: ${agent} still missing ${missing.join(', ')} after one retry (allowing)`);
    return null;
  }
  const fields = `STATUS: ${STATUS_VALUES.join(' | ')}, SUMMARY, CHANGES, FOLLOW_UPS${RULES[agent] ? ', ' + RULES[agent].join(', ') : ''}`;
  return {
    decision: 'block',
    reason: `dotClaude report contract: your final message is missing ${missing.join(', ')}. ` +
      `Append them now in the standard Output format (${fields}). Do not redo the work.`,
  };
}

function main() {
  const chunks = [];
  let size = 0, done = false;
  const finish = () => {
    if (done) return;
    done = true;
    try {
      const raw = Buffer.concat(chunks).toString('utf8');
      const out = raw.trim() ? evaluate(JSON.parse(raw)) : null;
      if (out) process.stdout.write(JSON.stringify(out) + '\n');
    } catch (e) {
      process.stderr.write(`dotclaude report-check: ${e && e.message} (allowing)\n`);
    }
  };
  process.stdin.on('data', (d) => {
    size += d.length;
    if (size > MAX_BYTES && !done) { done = true; process.stderr.write('dotclaude report-check: input over 1 MB (allowing)\n'); process.stdin.destroy(); return; }
    chunks.push(d);
  });
  process.stdin.on('end', finish);
  process.stdin.on('error', () => { done = true; });
}

if (require.main === module) main();
module.exports = { evaluate, missingFields, lastAssistantFromTranscript };
