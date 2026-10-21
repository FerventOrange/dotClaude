#!/usr/bin/env node
'use strict';
// dotClaude PreToolUse guard: denies or asks on risky git/gh commands (Bash and PowerShell tools).
// Fails open: any internal error allows the command. Disable with DOTCLAUDE_GUARD=off.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const MAX_BYTES = 1024 * 1024;
// Trailer/footer forms only, matched against message text (not the whole command line).
const ATTRIBUTION = [/^\s*co-authored-by:[^\n]*(claude|noreply@anthropic\.com)/im, /generated with \[claude code\]\(https?:\/\/claude\.(ai|com)/i, /^\s*\u{1F916}\s*generated with/imu];
const PREFIXES = new Set(['sudo', 'env', 'command', 'builtin', 'exec', 'nohup', 'time', 'if', 'then', 'else', 'elif', 'do', 'while', 'until', '!']);
const CD = new Set(['cd', 'pushd', 'chdir', 'set-location', 'sl', 'push-location']);
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash']);
const PWSH = new Set(['pwsh', 'powershell']);
const EVALS = new Set(['eval', 'invoke-expression', 'iex']);
const ECHOS = new Set(['echo', 'printf', 'write-output', 'write', 'write-host']);
// Flags whose value is message text. Long flags shared by git and gh; short letters per tool.
const MESSAGE_LONGS = ['--message', '--body', '--title', '--notes', '--subject', '--trailer'];
const MESSAGE_SHORTS = { git: ['m', 'FCct'], gh: ['btn', ''] }; // [message letters, other value-taking letters]
const MESSAGE_CMDS = new Set(['commit', 'tag', 'notes', 'merge', 'pr create', 'pr edit', 'pr comment', 'pr review', 'pr merge',
  'issue create', 'issue edit', 'issue comment', 'release create', 'release edit']);
const MESSAGE_FILE_FLAGS = ['-F', '--file', '--body-file', '--notes-file'];
const GH_API_RISKY_PATH = /^\/?repos\/[^/]+\/[^/]+(\/(branches|rulesets|git\/refs|collaborators|hooks|environments|actions|keys|pages)(\/.*)?)?\/?$/;

// ---- tokenizer: split into segments on unquoted && || ; | & ( ) { } newlines; strip quotes ----
// Each segment is a word array; non-enumerable `bodies` (heredoc / here-string text),
// `redirects` (redirection targets) and `piped` (stdin comes from the previous segment) are attached when present.
const meta = (w, k) => { if (!w[k]) Object.defineProperty(w, k, { value: [], enumerable: false }); return w[k]; };

function splitSegments(cmd, ps) {
  const esc = ps ? '`' : '\\';
  const segs = [];
  let words = [], word = null, heredocs = [], wantDelim = false, skipNext = false, hereString = false;
  const add = (s) => { word = (word === null ? '' : word) + s; };
  const endWord = () => {
    if (word === null) return;
    if (skipNext) { skipNext = false; meta(words, 'redirects').push(word); }
    else if (wantDelim) { heredocs.push({ delim: word, seg: words }); wantDelim = false; }
    else if (hereString) { meta(words, 'bodies').push(word); hereString = false; }
    else words.push(word);
    word = null;
  };
  const endSeg = () => { endWord(); if (words.length) segs.push(words); words = []; };
  for (let i = 0; i < cmd.length; i++) {
    const c = cmd[i], n = cmd[i + 1];
    if (!ps && c === '$' && n === "'") { // ANSI-C quoting: $'a\nb'
      let j = i + 2, s = '';
      for (; j < cmd.length && cmd[j] !== "'"; j++) {
        if (cmd[j] === '\\' && j + 1 < cmd.length) { j++; s += { n: '\n', t: '\t', r: '\r' }[cmd[j]] || cmd[j]; } else s += cmd[j];
      }
      add(s); i = j;
    } else if (c === "'") {
      let j = i + 1, s = '';
      for (; j < cmd.length; j++) {
        if (cmd[j] === "'") { if (ps && cmd[j + 1] === "'") { s += "'"; j++; continue; } break; }
        s += cmd[j];
      }
      add(s); i = j;
    } else if (c === '"') {
      let j = i + 1, s = '';
      for (; j < cmd.length && cmd[j] !== '"'; j++) {
        if (cmd[j] === esc && j + 1 < cmd.length) {
          j++;
          if (ps) { const e = { n: '\n', r: '\r', t: '\t', 0: '\0' }[cmd[j]]; if (e) { s += e; continue; } }
          else if (!'"\\$`\n'.includes(cmd[j])) s += '\\';
        }
        s += cmd[j];
      }
      add(s); i = j;
    } else if (ps && c === '@' && (n === '"' || n === "'") && /^\r?\n/.test(cmd.slice(i + 2, i + 4))) {
      const close = '\n' + n + '@', end = cmd.indexOf(close, i + 2);
      add(cmd.slice(i + 2, end < 0 ? cmd.length : end).replace(/^\r?\n/, ''));
      i = end < 0 ? cmd.length : end + close.length - 1;
    } else if (c === esc) {
      if (n === '\n') i++;
      else if (n === '\r' && cmd[i + 2] === '\n') i += 2;
      else if (n !== undefined) { add(n); i++; }
    } else if (c === '#' && word === null) {
      while (i + 1 < cmd.length && cmd[i + 1] !== '\n') i++;
    } else if (c === ' ' || c === '\t' || c === '\r') {
      endWord();
    } else if (c === '\n') {
      endWord();
      let pos = i + 1; // heredoc bodies are data: attach to their segment, never parse as commands
      for (const h of heredocs) {
        const lines = [];
        while (pos < cmd.length) {
          let e = cmd.indexOf('\n', pos); if (e < 0) e = cmd.length;
          const line = cmd.slice(pos, e).replace(/\r$/, ''); pos = e + 1;
          if (line.replace(/^\t+/, '') === h.delim) break;
          lines.push(line);
        }
        meta(h.seg, 'bodies').push(lines.join('\n'));
      }
      heredocs = []; i = pos - 1;
      endSeg();
    } else if (!ps && c === '<' && n === '<') {
      endWord();
      if (cmd[i + 2] === '<') { i += 2; hereString = true; } // here-string: next word is data
      else { i++; if (cmd[i + 1] === '-') i++; wantDelim = true; }
    } else if (c === '>' || c === '<') {
      if (word !== null && /^[\d*]*$/.test(word)) word = null; // fd prefix like 2> or PowerShell *>
      endWord();
      while ('>|'.includes(cmd[i + 1] || 'x')) i++;
      if (cmd[i + 1] === '&') { i++; if (/[\d-]/.test(cmd[i + 1] || '')) { i++; continue; } }
      skipNext = true; // next word is the redirection target
    } else if (c === '&') {
      if (n === '>') continue; // &> redirection
      if (n === '&') i++;
      endSeg();
    } else if (c === ';' || c === '|' || c === '(' || c === ')' || ((c === '{' || c === '}') && word === null)) {
      const pipe = c === '|' && n !== '|';
      if (c === '|' && (n === '|' || n === '&')) i++;
      endSeg();
      if (pipe) Object.defineProperty(words, 'piped', { value: true, enumerable: false });
    } else {
      add(c);
    }
  }
  endSeg();
  return segs;
}

// ---- helpers ----
const normProg = (w) => w.split(/[\\/]/).pop().toLowerCase().replace(/\.(exe|cmd|bat)$/, '');

function toPath(base, p, ps) {
  // PowerShell accepts \ as a path separator on every platform (pwsh on Linux/macOS too); path.posix does not.
  if (ps && process.platform !== 'win32') p = p.replace(/\\/g, '/');
  if (p === '~' || /^~[\\/]/.test(p)) p = path.join(os.homedir(), p.slice(1));
  if (process.platform === 'win32') p = p.replace(/^\/([a-zA-Z])(?=\/|$)/, '$1:'); // Git Bash /c/... paths
  return path.resolve(base, p);
}

function stripPrefixes(w) {
  let i = 0;
  while (i < w.length) {
    const p = normProg(w[i]);
    if (/^[A-Za-z_]\w*=/.test(w[i])) i++;
    else if (PREFIXES.has(p)) { i++; while ((p === 'env' || p === 'sudo') && i < w.length && w[i].startsWith('-')) i++; }
    else break;
  }
  return w.slice(i);
}

// True if a long flag (or --flag=value) or a short letter inside a short-flag cluster is present.
function hasFlag(args, longs, short = '', valueShorts = '') {
  for (const a of args) {
    if (a === '--') break;
    if (longs.some((l) => a === l || a.startsWith(l + '='))) return true;
    if (short && /^-[A-Za-z]+$/.test(a)) {
      for (const ch of a.slice(1)) { if (ch === short) return true; if (valueShorts.includes(ch)) break; }
    }
  }
  return false;
}

function flagValues(args, flags) {
  const out = [];
  args.forEach((a, i) => {
    for (const f of flags) {
      if (a === f && args[i + 1] !== undefined) out.push(args[i + 1]);
      else if (f.startsWith('--') && a.startsWith(f + '=')) out.push(a.slice(f.length + 1));
      else if (!f.startsWith('--') && a.startsWith(f) && a.length > f.length) out.push(a.slice(f.length));
    }
  });
  return out;
}

// Values of message-text flags (-m/--message, --body, --title, ...), including short clusters like -am "x".
function messageValues(args, tool) {
  const [shorts, valueShorts] = MESSAGE_SHORTS[tool];
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--') break;
    const long = MESSAGE_LONGS.find((l) => a === l || a.startsWith(l + '='));
    if (long) {
      if (a !== long) out.push(a.slice(long.length + 1));
      else if (args[i + 1] !== undefined) out.push(args[++i]);
    } else if (/^-[A-Za-z]/.test(a)) {
      for (let k = 1; k < a.length; k++) {
        if (shorts.includes(a[k])) {
          if (k + 1 < a.length) out.push(a.slice(k + 1));
          else if (args[i + 1] !== undefined) out.push(args[++i]);
          break;
        }
        if (valueShorts.includes(a[k])) { if (k + 1 === a.length) i++; break; }
      }
    }
  }
  return out;
}

const samePath = (a, b) => (process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b);

function git(dir, args) {
  try {
    return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true }).trim();
  } catch { return null; }
}

function repo(state, dir) {
  if (!state.repos[dir]) {
    const r = { branch: git(dir, ['symbolic-ref', '--short', 'HEAD']), defaults: new Set(['main', 'master']) };
    const head = git(dir, ['rev-parse', '--abbrev-ref', 'origin/HEAD']);
    if (head && head.startsWith('origin/')) r.defaults.add(head.slice(7));
    state.repos[dir] = r;
  }
  return state.repos[dir];
}

const isControl = (args) => args.some((a) => ['--abort', '--continue', '--skip', '--quit'].includes(a));

function parsePush(c) {
  const valueOpts = ['--repo', '-o', '--push-option', '--receive-pack', '--exec'];
  const pos = [];
  let force = hasFlag(c.args, ['--force', '--force-with-lease'], 'f');
  let deletes = hasFlag(c.args, ['--delete', '--mirror'], 'd');
  for (let i = 0; i < c.args.length; i++) {
    const a = c.args[i];
    if (a === '--') { pos.push(...c.args.slice(i + 1)); break; }
    if (valueOpts.includes(a)) i++;
    else if (!a.startsWith('-')) pos.push(a);
  }
  const dsts = [];
  for (let spec of pos.slice(1)) {
    if (spec.startsWith('+')) { force = true; spec = spec.slice(1); }
    if (spec.startsWith(':')) deletes = true;
    let dst = spec.includes(':') ? spec.slice(spec.indexOf(':') + 1) : spec;
    if (dst === 'HEAD') dst = c.branch() || '';
    dsts.push(dst.replace(/^refs\/heads\//, ''));
  }
  if (pos.length < 2 && !hasFlag(c.args, ['--all', '--tags', '--mirror'])) dsts.push(c.branch() || '');
  const hitsDefault = dsts.find((d) => d && c.defaults().has(d));
  return { force, deletes, hitsDefault };
}

function ghApiRisky(args) {
  const method = (flagValues(args, ['-X', '--method'])[0] || '').toUpperCase();
  if (!['DELETE', 'PUT', 'PATCH'].includes(method)) return false;
  const valueOpts = ['-X', '--method', '-f', '-F', '--field', '--raw-field', '-H', '--header', '--input', '-q', '--jq', '-t', '--template', '--hostname', '--cache', '-p', '--preview'];
  let endpoint = null;
  for (let i = 0; i < args.length && endpoint === null; i++) {
    if (valueOpts.includes(args[i])) i++;
    else if (!args[i].startsWith('-')) endpoint = args[i];
  }
  const p = (endpoint || '').replace(/^https?:\/\/[^/]+/, '').split('?')[0];
  return GH_API_RISKY_PATH.test(p) && `gh api ${method} ${p} changes repository settings, branches, or protection. Confirm with the user first.`;
}

// ---- rules: first matching tool+sub, check returns a reason string when it fires ----
const RULES = [
  { decision: 'deny', tool: 'git', subs: ['commit'], check: (c) => c.onDefault() && `Committing directly to the default branch '${c.branch()}' is blocked. Create a feature branch first (git switch -c feat/<name>), commit there, and open a PR.` },
  { decision: 'deny', tool: 'git', subs: ['commit', 'push'], check: (c) => hasFlag(c.args, ['--no-verify'], c.sub === 'commit' ? 'n' : '', 'mFCct') && `--no-verify bypasses the repo's hooks. Fix the hook failure and retry without it.` },
  { decision: 'deny', tool: 'git', subs: ['push'], check: (c) => { const p = c.push(); return p.hitsDefault && `${p.force ? 'Force-pushing' : 'Pushing'} to the default branch '${p.hitsDefault}' is blocked. Push a feature branch and open a PR instead.`; } },
  { decision: 'ask', tool: 'git', subs: ['push'], check: (c) => c.push().force && 'Force push rewrites remote history on a non-default branch. Confirm with the user (prefer --force-with-lease).' },
  { decision: 'ask', tool: 'git', subs: ['push'], check: (c) => c.push().deletes && 'This push deletes remote refs (branch or tag). Confirm with the user first.' },
  { decision: 'ask', tool: 'git', subs: ['reset'], check: (c) => c.args.includes('--hard') && 'git reset --hard discards uncommitted work. Confirm with the user, or use git stash.' },
  { decision: 'ask', tool: 'git', subs: ['clean'], check: (c) => hasFlag(c.args, ['--force'], 'f') && 'git clean -f permanently deletes untracked files. Confirm with the user, or preview with git clean -n.' },
  { decision: 'ask', tool: 'git', subs: ['checkout', 'restore'], check: (c) => c.args.includes('.') && !(c.sub === 'restore' && hasFlag(c.args, ['--staged'], 'S') && !hasFlag(c.args, ['--worktree'], 'W')) && `git ${c.sub} . discards all working-tree changes. Confirm with the user, or use git stash.` },
  { decision: 'ask', tool: 'git', subs: ['merge'], check: (c) => c.onDefault() && !isControl(c.args) && `Merging into the default branch '${c.branch()}' locally bypasses PR review. Confirm with the user.` },
  { decision: 'ask', tool: 'git', subs: ['rebase'], check: (c) => c.onDefault() && !isControl(c.args) && `Rebasing the default branch '${c.branch()}' rewrites shared history. Confirm with the user.` },
  { decision: 'ask', tool: 'git', subs: ['tag'], check: (c) => hasFlag(c.args, ['--delete'], 'd') && 'Deleting a tag. Confirm with the user first.' },
  { decision: 'ask', tool: 'git', subs: ['branch'], check: (c) => (hasFlag(c.args, [], 'D') || (hasFlag(c.args, ['--delete'], 'd') && hasFlag(c.args, ['--force'], 'f'))) && 'git branch -D force-deletes a local branch even if unmerged. Confirm with the user, or use git branch -d.' },
  { decision: 'ask', tool: 'git', subs: ['worktree'], check: (c) => c.args[0] === 'remove' && hasFlag(c.args, ['--force'], 'f') && 'git worktree remove --force discards uncommitted changes in that worktree. Confirm with the user.' },
  { decision: 'ask', tool: 'gh', subs: ['pr merge'], check: () => 'Merging a PR requires explicit user approval.' },
  { decision: 'ask', tool: 'gh', subs: ['release create', 'release delete'], check: (c) => `gh ${c.sub} publishes or removes a release. Confirm with the user.` },
  { decision: 'ask', tool: 'gh', subs: ['repo edit', 'repo delete'], check: (c) => `gh ${c.sub} changes or removes the repository. Confirm with the user.` },
  { decision: 'ask', tool: 'gh', subs: ['api'], check: (c) => ghApiRisky(c.args) },
];

function trackBranch(c) {
  const a = c.args;
  let name = null;
  const create = a.findIndex((x) => (c.sub === 'checkout' ? ['-b', '-B'] : ['-c', '-C', '--create']).includes(x));
  if (create >= 0) name = a[create + 1];
  else if (c.sub === 'switch') name = a.find((x) => !x.startsWith('-'));
  else if (c.sub === 'checkout' && !a.includes('--') && a.length === 1 && c.defaults().has(a[0])) name = a[0];
  if (name) repo(c.state, c.repoDir).branch = name;
}

// Returns [index of the command-string argument, nested tokenizer mode] for shell/eval wrappers, or null.
function wrapper(prog, argv, ps) {
  if (SHELLS.has(prog)) return [argv.findIndex((x, i) => i > 0 && /^-[a-z]*c[a-z]*$/.test(x)), false];
  if (PWSH.has(prog)) return [argv.findIndex((x) => /^-(c|command)$/i.test(x)), true];
  if (prog === 'cmd') return [argv.findIndex((x, i) => i > 0 && /^\/\/?[ck]$/i.test(x)), true];
  if (prog === 'eval') return [0, ps];
  if (EVALS.has(prog)) return [argv.length > 1 && /^-command$/i.test(argv[1]) ? 1 : 0, true];
  return null;
}

// Literal text a segment writes to stdout (its words and heredoc bodies), for `... | git commit -F -`.
function pipedText(seg) {
  if (!seg) return [];
  const unesc = (t) => t.replace(/\\n/g, '\n'); // printf / echo -e escapes
  return [seg.join('\n'), seg.slice(1).join(' '), ...(seg.bodies || [])].map(unesc);
}

// Command string fed to a bare `| iex`: a lone string segment, or echo/Write-Output args.
function pipedCommand(seg) {
  if (!seg || !seg.length) return null;
  if (seg.length === 1) return seg[0];
  return ECHOS.has(normProg(seg[0])) ? seg.slice(1).join(' ') : null;
}

function analyze(cmd, ps, state, depth) {
  let prev = null;
  for (const seg of splitSegments(cmd, ps)) {
    const prevSeg = prev;
    prev = seg;
    const fromPipe = seg.piped ? prevSeg : null;
    if (seg.bodies && seg.redirects) { // e.g. cat > body.md <<'EOF' ... EOF, later used via --body-file
      for (const t of seg.redirects) state.writes.push({ file: toPath(state.cwd, t, ps), text: seg.bodies.join('\n') });
    }
    const argv = stripPrefixes(seg);
    if (!argv.length) continue;
    const prog = normProg(argv[0]);
    const envDir = ps ? /^\$env:GIT_DIR(?:=(.*))?$/i.exec(argv[0]) : null; // $env:GIT_DIR='x' or $env:GIT_DIR = 'x'
    if (envDir) { state.gitDir = envDir[1] !== undefined ? envDir[1] : (argv[1] === '=' ? argv[2] : state.gitDir); continue; }
    if (prog === 'export') {
      for (const a of argv.slice(1)) if (a.startsWith('GIT_DIR=')) state.gitDir = a.slice(8);
      continue;
    }
    if (CD.has(prog)) {
      const t = argv.slice(1).find((x) => !x.startsWith('-'));
      if (t !== '-') state.cwd = toPath(state.cwd, t || os.homedir(), ps);
      continue;
    }
    if (depth < 3) {
      const w = wrapper(prog, argv, ps);
      if (w && w[0] >= 0) {
        let inner = argv.slice(w[0] + 1).join(' ');
        if (!inner && prog !== 'eval' && EVALS.has(prog)) inner = pipedCommand(fromPipe) || ''; // "git push ..." | iex
        analyze(inner, w[1], state, depth + 1);
        continue;
      }
    }
    let c;
    if (prog === 'git') {
      // GIT_DIR from an inline assignment (GIT_DIR=x git ...) or an earlier export / $env:GIT_DIR.
      const assign = seg.slice(0, seg.length - argv.length).filter((x) => x.startsWith('GIT_DIR=')).pop();
      let dir = state.cwd, gitDir = assign ? assign.slice(8) : (state.gitDir || null), i = 1;
      while (i < argv.length && argv[i].startsWith('-')) {
        const a = argv[i];
        if (a === '-C') { dir = toPath(dir, argv[i + 1] || '.', ps); i += 2; }
        else if (a === '--git-dir') { gitDir = argv[i + 1] || '.'; i += 2; }
        else if (a.startsWith('--git-dir=')) { gitDir = a.slice(10); i++; }
        else i += ['-c', '--work-tree', '--namespace', '--config-env'].includes(a) ? 2 : 1;
      }
      // --work-tree does not change which repository git uses (GIT_DIR is still discovered from cwd).
      c = { tool: 'git', sub: argv[i], group: argv[i], args: argv.slice(i + 1), dir, repoDir: gitDir ? toPath(dir, gitDir, ps) : dir };
    } else if (prog === 'gh') {
      c = { tool: 'gh', sub: `${argv[1]} ${argv[2]}`, group: argv[1], args: argv.slice(2), dir: state.cwd, repoDir: state.cwd };
    } else continue;
    c.state = state;
    c.branch = () => repo(state, c.repoDir).branch;
    c.defaults = () => repo(state, c.repoDir).defaults;
    c.onDefault = () => !!c.branch() && c.defaults().has(c.branch());
    let pushInfo = null;
    c.push = () => pushInfo || (pushInfo = parsePush(c));
    for (const r of RULES) {
      if (r.tool !== c.tool || !(r.subs.includes(c.sub) || r.subs.includes(c.group))) continue;
      const reason = r.check(c);
      if (reason) state.hits.push({ decision: r.decision, reason });
    }
    if (MESSAGE_CMDS.has(c.sub)) {
      state.texts.push(...messageValues(c.args, c.tool), ...(seg.bodies || []));
      for (const f of flagValues(c.args, MESSAGE_FILE_FLAGS)) {
        if (f === '-') { state.texts.push(...pipedText(fromPipe)); continue; }
        const p = toPath(c.dir, f, ps);
        state.files.push(p);
        for (const w of state.writes) if (samePath(w.file, p)) state.texts.push(w.text);
      }
    }
    if (c.tool === 'git' && (c.sub === 'checkout' || c.sub === 'switch')) trackBranch(c);
  }
}

function hasAttribution(messages, files) {
  const texts = [...messages];
  for (const f of files) {
    try { if (fs.statSync(f).size < MAX_BYTES) texts.push(fs.readFileSync(f, 'utf8')); } catch { /* missing file: ignore */ }
  }
  return texts.some((t) => ATTRIBUTION.some((re) => re.test(t)));
}

function evaluate(input, env = process.env) {
  if (String(env.DOTCLAUDE_GUARD || '').toLowerCase() === 'off') return null;
  if (!input || (input.tool_name !== 'Bash' && input.tool_name !== 'PowerShell')) return null;
  const cmd = input.tool_input && input.tool_input.command;
  if (typeof cmd !== 'string' || !cmd.trim()) return null;
  const state = { cwd: input.cwd || process.cwd(), repos: {}, hits: [], texts: [], files: [], writes: [] };
  analyze(cmd, input.tool_name === 'PowerShell', state, 0);
  if (hasAttribution(state.texts, state.files)) {
    state.hits.push({ decision: 'deny', reason: 'Claude attribution (a Co-Authored-By: Claude trailer or a "Generated with [Claude Code]" footer) is not allowed in commit messages or PR/issue text. Remove it and retry.' });
  }
  const deny = state.hits.filter((h) => h.decision === 'deny');
  const pick = deny.length ? deny : state.hits;
  if (!pick.length) return null;
  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: deny.length ? 'deny' : 'ask',
      permissionDecisionReason: 'dotClaude guard: ' + [...new Set(pick.map((h) => h.reason))].join(' '),
    },
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
      process.stderr.write(`dotclaude guard: ${e && e.message} (allowing)\n`);
    }
  };
  process.stdin.on('data', (d) => {
    size += d.length;
    if (size > MAX_BYTES && !done) { done = true; process.stderr.write('dotclaude guard: input over 1 MB (allowing)\n'); process.stdin.destroy(); return; }
    chunks.push(d);
  });
  process.stdin.on('end', finish);
  process.stdin.on('error', () => { done = true; });
}

if (require.main === module) main();
module.exports = { evaluate, splitSegments };
