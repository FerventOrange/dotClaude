'use strict';
// Run: node --test "hooks/*.test.js" "statusline/*.test.js" "install/lib/*.test.js"
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { evaluate, splitSegments } = require('./guard.js');

const GUARD = path.join(__dirname, 'guard.js');
let root, mainRepo, masterRepo, featRepo, developRepo, plainDir;

const sh = (dir, ...args) => execFileSync('git', ['-C', dir, ...args], { stdio: 'ignore' });
function initRepo(name, branch) {
  const dir = path.join(root, name);
  fs.mkdirSync(dir);
  sh(dir, 'init', '-q');
  sh(dir, 'symbolic-ref', 'HEAD', `refs/heads/${branch}`);
  return dir;
}

before(() => {
  root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'guard-sandbox-')));
  mainRepo = initRepo('main', 'main');
  masterRepo = initRepo('master', 'master');
  featRepo = initRepo('feat', 'feat/x');
  developRepo = initRepo('develop', 'develop');
  sh(developRepo, '-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '-q', '--allow-empty', '-m', 'init');
  sh(developRepo, 'update-ref', 'refs/remotes/origin/develop', 'HEAD');
  sh(developRepo, 'symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/develop');
  plainDir = path.join(root, 'plain');
  fs.mkdirSync(plainDir);
});
after(() => { if (root && root.startsWith(fs.realpathSync(os.tmpdir()))) fs.rmSync(root, { recursive: true, force: true }); });

function decide(command, cwd = featRepo, tool = 'Bash', env = {}) {
  const out = evaluate({ tool_name: tool, tool_input: { command }, cwd }, env);
  return out ? out.hookSpecificOutput.permissionDecision : null;
}
function cases(title, list) {
  describe(title, () => {
    for (const [cmd, expected, cwdFn, tool] of list) {
      test(`${expected || 'allow'}: ${cmd.replace(/\n/g, '\\n').slice(0, 90)}`, () => {
        assert.equal(decide(cmd, cwdFn ? cwdFn() : featRepo, tool), expected);
      });
    }
  });
}
const M = () => mainRepo;
const PS = 'PowerShell';

cases('commit on default branch', [
  ['git commit -m "x"', 'deny', M],
  ['git commit -m "x"', null],
  ['git commit -m "x"', 'deny', () => masterRepo],
  ['git commit -m "x"', 'deny', () => developRepo],
  ['git commit -m "x"', null, () => plainDir],
  ['git commit --amend --no-edit', 'deny', M],
  ['git add -A && git commit -m x', 'deny', M],
  ['echo "git commit" ; git status', null, M],
  ['g"i"t com\'mit\' -m x', 'deny', M],
  ['GIT_AUTHOR_NAME=x git commit -m x', 'deny', M],
  ['/usr/bin/git commit -m x', 'deny', M],
  ['bash -c "git commit -m x"', 'deny', M],
  ['git checkout -b feat/y && git commit -m x', null, M],
  ['git switch -c feat/y; git commit -m x', null, M],
  ['git switch main && git commit -m x', 'deny'],
  ['git checkout main\ngit commit -m x', 'deny'],
]);

describe('git -C and cd respect the target directory', () => {
  test('git -C main repo from feature cwd denies', () => assert.equal(decide(`git -C "${mainRepo}" commit -m x`), 'deny'));
  test('git -C feature repo from main cwd allows', () => assert.equal(decide(`git -C "${featRepo}" commit -m x`, mainRepo), null));
  test('git -C relative path', () => assert.equal(decide('git -C ../main commit -m x'), 'deny'));
  test('cd into feature repo then commit allows', () => assert.equal(decide(`cd "${featRepo}" && git commit -m x`, mainRepo), null));
  test('cd into main repo then commit denies', () => assert.equal(decide(`cd '${mainRepo}'; git commit -m x`), 'deny'));
  test('PowerShell Set-Location then commit denies', () => assert.equal(decide(`Set-Location -Path '${mainRepo}'; git commit -m "x"`, featRepo, PS), 'deny'));
  test('PowerShell git -C with backslash path', () => assert.equal(decide(`git -C ${mainRepo} commit -m "x"`, featRepo, PS), 'deny'));
  test('PowerShell Push-Location then commit denies', () => assert.equal(decide(`Push-Location '${mainRepo}'; git commit -m "x"`, featRepo, PS), 'deny'));
  test('--git-dir= selects the repository', () => assert.equal(decide(`git --git-dir="${mainRepo}/.git" commit -m x`), 'deny'));
  test('--git-dir <path> selects the repository', () => assert.equal(decide(`git --git-dir "${mainRepo}/.git" commit -m x`), 'deny'));
  test('relative --git-dir after -C', () => assert.equal(decide('git -C .. --git-dir=main/.git commit -m x'), 'deny'));
  test('--git-dir of feature repo from main cwd allows', () => assert.equal(decide(`git --git-dir="${featRepo}/.git" commit -m x`, mainRepo), null));
  test('--work-tree= alone keeps the cwd repository', () => assert.equal(decide(`git --work-tree="${featRepo}" commit -m x`, mainRepo), 'deny'));
  test('--work-tree <path> alone keeps the cwd repository', () => assert.equal(decide(`git --work-tree "${mainRepo}" commit -m x`), null));
  test('--git-dir with --work-tree uses --git-dir', () => assert.equal(decide(`git --work-tree "${featRepo}" --git-dir "${mainRepo}/.git" commit -m x`), 'deny'));
});

cases('push to default branch', [
  ['git push origin main', 'deny'],
  ['git push origin HEAD:main', 'deny'],
  ['git push origin feat/x:refs/heads/main', 'deny'],
  ['git push origin master', 'deny'],
  ['git push', 'deny', M],
  ['git push origin', 'deny', M],
  ['git push origin HEAD', 'deny', M],
  ['git push', null],
  ['git push origin HEAD', null],
  ['git push -u origin feat/x', null],
  ['git push --tags', null, M],
  ['git push origin main', 'deny', () => plainDir],
  ['git push origin develop', 'deny', () => developRepo],
  ['git push origin develop', null],
]);

cases('force push', [
  ['git push --force origin main', 'deny'],
  ['git push -f', 'deny', M],
  ['git push origin +main', 'deny'],
  ['git push --force-with-lease origin feat/x', 'ask'],
  ['git push --force-with-lease=feat/x:abc123 origin feat/x', 'ask'],
  ['git push -uf origin feat/x', 'ask'],
  ['git push origin +feat/x', 'ask'],
  ['git push --force', 'ask'],
  ['git push --follow-tags origin feat/x', null],
  ['git push origin main -f', 'deny'],
  ['git push origin main --force-with-lease', 'deny'],
  ['git push origin feat/x -f', 'ask'],
  ['git push origin feat/x --force', 'ask'],
  ['git push origin feat/x --force-with-lease=feat/x:abc123', 'ask'],
  ['git push origin +feat/x:feat/x', 'ask'],
  ['git push origin +HEAD:main', 'deny'],
  ['git push origin feat/x +feat/y', 'ask'],
]);

cases('--no-verify', [
  ['git commit --no-verify -m x', 'deny'],
  ['git commit -nm x', 'deny'],
  ['git commit -am "x -n --no-verify"', null],
  ['git push --no-verify origin feat/x', 'deny'],
  ['git push -n origin feat/x', null],
  ['git log --no-verify', null],
]);

describe('attribution', () => {
  const tests = [
    ["git commit -F - <<'EOF'\nfeat: x\n\nCo-Authored-By: Claude Opus <noreply@anthropic.com>\nEOF", 'deny'],
    ["git commit -m \"$(cat <<'EOF'\nfeat: x\n\nCo-Authored-By: Claude <noreply@anthropic.com>\nEOF\n)\"", 'deny'],
    ['git commit -m "feat: x" -m "Co-authored-by: Claude"', 'deny'],
    ['gh pr create --title x --body "Summary\n\n\u{1F916} Generated with [Claude Code](https://claude.com/claude-code)"', 'deny'],
    ['gh issue comment 3 --body "Generated with [Claude Code](https://claude.ai/code)"', 'deny'],
    ['gh pr create --title "x" --body \'Co-Authored-By: "Claude"\'', 'deny'],
    ['gh pr create -t x -b "Summary\n\nCo-Authored-By: Claude <noreply@anthropic.com>"', 'deny'],
    ['git commit -am "feat: x\n\nCo-Authored-By: Claude <noreply@anthropic.com>"', 'deny'],
    ['git commit --message="feat: x\n\nCo-Authored-By: Someone <noreply@anthropic.com>"', 'deny'],
    ['git commit -m x --trailer "Co-authored-by: Claude <noreply@anthropic.com>"', 'deny'],
    ["git commit -F - <<< 'feat: x\n\nCo-Authored-By: Claude'", 'deny'],
    ["git commit -m $'feat: x\\n\\nCo-Authored-By: Claude'", 'deny'],
    ["cat > msg.txt <<'EOF'\nfeat: x\n\nCo-Authored-By: Claude <noreply@anthropic.com>\nEOF\ngit commit -F msg.txt", 'deny'],
    ['bash -c "git commit -m \'feat: x\n\nCo-Authored-By: Claude\'"', 'deny'],
    ['git commit -m "fix: handle noreply addresses"', null],
    ['grep -r noreply@anthropic.com .', null],
    ['gh pr view 3 --comments', null],
    ['git log --author=noreply@anthropic.com && git commit -m "fix: x"', null],
    ['grep -rn "Co-Authored-By: Claude" agents/ ; git commit -m "x"', null],
    ['git commit -m "docs: forbid Generated with Claude Code footer"', null],
    ['git commit -m "docs: block Co-Authored-By: Claude trailers"', null],
    ["cat <<'EOF'\nCo-Authored-By: Claude\nEOF\ngit commit -m x", null],
  ];
  for (const [cmd, exp] of tests) test(`${exp || 'allow'}: ${cmd.replace(/\n/g, '\\n').slice(0, 80)}`, () => assert.equal(decide(cmd), exp));
  test('PowerShell here-string message', () => {
    assert.equal(decide('git commit -m @"\nfeat: x\n\nCo-Authored-By: Claude <noreply@anthropic.com>\n"@', featRepo, PS), 'deny');
  });
  test('PowerShell backtick-n newline in message', () => {
    assert.equal(decide('git commit -m "feat: x`n`nCo-Authored-By: Claude <noreply@anthropic.com>"', featRepo, PS), 'deny');
  });
  test('PR body file describing the feature mid-sentence is allowed', () => {
    fs.writeFileSync(path.join(featRepo, 'feature.md'), '## Summary\n\nThe guard now blocks the Co-Authored-By: Claude trailer and the Generated with Claude Code footer.\n- Rejects \u{1F916} footers and noreply@anthropic.com trailers\n');
    assert.equal(decide('gh pr create --title "feat: guard" --body-file feature.md'), null);
  });
  test('heredoc body lines are not treated as commands', () => {
    assert.equal(decide("git commit -F - <<'EOF'\nfeat: x\ngit push --force origin main\nEOF"), null);
  });
  test('-F / --body-file files are read', () => {
    fs.writeFileSync(path.join(featRepo, 'bad.md'), 'Body\n\nCo-Authored-By: Claude <noreply@anthropic.com>\n');
    fs.writeFileSync(path.join(featRepo, 'good.md'), 'Body only\n');
    assert.equal(decide('gh pr create --title x --body-file bad.md'), 'deny');
    assert.equal(decide('gh pr create --title x -F bad.md'), 'deny');
    assert.equal(decide('git commit -F bad.md'), 'deny');
    assert.equal(decide('git commit --file=bad.md'), 'deny');
    assert.equal(decide('gh pr create --title x --body-file good.md'), null);
    assert.equal(decide('git commit -F missing.md'), null);
  });
});

cases('destructive working-tree commands ask', [
  ['git reset --hard', 'ask'],
  ['git reset --hard HEAD@{1}', 'ask'],
  ['git reset --hard origin/main', 'ask', M],
  ['git reset --soft HEAD~1', null],
  ['git clean -fdx', 'ask'],
  ['git clean --force -d', 'ask'],
  ['git clean -n', null],
  ['git checkout -- .', 'ask'],
  ['git checkout .', 'ask'],
  ['git checkout -- src/a.js', null],
  ['git restore .', 'ask'],
  ['git restore --staged .', null],
]);

cases('merge / rebase / tags / remote deletes', [
  ['git merge feat/x', 'ask', M],
  ['git merge main', null],
  ['git merge --abort', null, M],
  ['git rebase origin/main', 'ask', M],
  ['git rebase origin/main', null],
  ['git rebase --continue', null, M],
  ['git tag -d v1.0.0', 'ask'],
  ['git tag --delete v1.0.0', 'ask'],
  ['git tag -a v1.0.0 -m "v1.0.0"', null],
  ['git push origin --delete feat/old', 'ask'],
  ['git push origin -d feat/old', 'ask'],
  ['git push origin :feat/old', 'ask'],
  ['git push origin :refs/tags/v1.0.0', 'ask'],
  ['git push origin --delete main', 'deny'],
  ['git branch -D feat/old', 'ask'],
  ['git branch --delete --force feat/old', 'ask'],
  ['git branch -d -f feat/old', 'ask'],
  ['git branch -d feat/old', null],
  ['git branch -f feat/new main', null],
  ['git branch --list', null],
  ['git worktree remove --force ../wt', 'ask'],
  ['git worktree remove -f ../wt', 'ask'],
  ['git worktree remove ../wt', null],
  ['git worktree prune', null],
]);

cases('gh commands', [
  ['gh pr merge 5 --squash', 'ask'],
  ['gh pr view 5', null],
  ['gh pr create --title x --body y', null],
  ['gh release create v1.0.0 --notes x', 'ask'],
  ['gh release delete v1.0.0', 'ask'],
  ['gh release list', null],
  ['gh repo edit --visibility public', 'ask'],
  ['gh repo delete o/r --yes', 'ask'],
  ['gh repo view', null],
  ['gh api -X DELETE repos/o/r/branches/main/protection', 'ask'],
  ['gh api --method PUT repos/{owner}/{repo}/branches/main/protection --input p.json', 'ask'],
  ['gh api --method=DELETE repos/o/r/git/refs/heads/x', 'ask'],
  ['gh api -XPATCH repos/o/r -f visibility=public', 'ask'],
  ['gh api -X PATCH https://api.github.com/repos/o/r/rulesets/1', 'ask'],
  ['gh api repos/o/r/branches/main/protection', null],
  ['gh api -X PATCH repos/o/r/issues/1 -f state=closed', null],
  ['gh api -X POST repos/o/r/issues -f title=x', null],
]);

cases('chained, quoted and wrapped commands', [
  ['git status && git push --force origin main', 'deny'],
  ['git log | head || git push -f origin feat/x', 'ask'],
  ['git reset --hard && git push origin main', 'deny'],
  ['git fetch\ngit push origin main', 'deny'],
  ['git fetch & git push origin main', 'deny'],
  ['(cd sub && git push origin main)', 'deny'],
  ['if true; then git push origin main; fi', 'deny'],
  ['git push origin main 2>&1 | tee log.txt', 'deny'],
  ['git push origin main>log.txt', 'deny'],
  ['echo "git push origin main && git push -f"', null],
  ["echo 'a; git push origin main'", null],
  ['sh -c \'git push origin main\'', 'deny'],
  ['eval "git push --force origin main"', 'deny'],
  ['git   push    origin    main', 'deny'],
  ['git status # git push origin main', null],
]);

cases('PowerShell commands', [
  ['git push origin main', 'deny', null, PS],
  ['git status; git push --force origin main', 'deny', null, PS],
  ['& "C:\\Program Files\\Git\\cmd\\git.exe" push origin main', 'deny', null, PS],
  ['git.exe commit -m "x"', 'deny', M, PS],
  ['git commit -m "it`"s fine"', null, null, PS],
  ["git commit -m 'it''s fine'", null, null, PS],
  ['git log --oneline | Select-Object -First 5', null, null, PS],
  ['git reset --hard 2>&1 | Out-Null', 'ask', null, PS],
  ['pwsh -NoProfile -Command "git push origin main"', 'deny', null, PS],
  ['Get-ChildItem | ForEach-Object { git push origin main }', 'deny', null, PS],
  ['gh pr merge 5 --squash', 'ask', null, PS],
  ['iex "git push origin main"', 'deny', null, PS],
  ['Invoke-Expression -Command "git push --force origin main"', 'deny', null, PS],
  ["Invoke-Expression 'git status'", null, null, PS],
  ['cmd /c "git push origin main"', 'deny', null, PS],
  ['cmd.exe /C "git status && git push origin main"', 'deny', null, PS],
  ['cmd //c "git push origin main"', 'deny'],
  ['cmd /c "git status"', null, null, PS],
]);

cases('stdin-piped messages and commands', [
  ["printf 'x\\n\\nCo-Authored-By: Claude <noreply@anthropic.com>' | git commit -F -", 'deny'],
  ['echo "Co-Authored-By: Claude <noreply@anthropic.com>" | git commit --file -', 'deny'],
  ['echo "Summary\n\nGenerated with [Claude Code](https://claude.com/claude-code)" | gh pr create --title x --body-file -', 'deny'],
  ["cat <<'EOF' | git commit -F -\nfeat: x\n\nCo-Authored-By: Claude <noreply@anthropic.com>\nEOF", 'deny'],
  ['Write-Output "feat: x`n`nCo-Authored-By: Claude" | git commit -F -', 'deny', null, PS],
  ['echo hi | git commit -F -', null],
  ["echo 'Co-Authored-By: Claude'; git commit -F -", null],
  ['"git push -f origin main" | iex', 'deny', null, PS],
  ["'git push origin main' | Invoke-Expression", 'deny', null, PS],
  ['Write-Output "git push origin main" | iex', 'deny', null, PS],
  ['"git status" | iex', null, null, PS],
]);

describe('GIT_DIR selects the repository', () => {
  test('inline GIT_DIR=<main> denies commit', () => assert.equal(decide(`GIT_DIR="${mainRepo}/.git" git commit -m x`), 'deny'));
  test('env GIT_DIR=<main> denies commit', () => assert.equal(decide(`env GIT_DIR="${mainRepo}/.git" git commit -m x`), 'deny'));
  test('export GIT_DIR=<main> then commit denies', () => assert.equal(decide(`export GIT_DIR="${mainRepo}/.git"; git commit -m x`), 'deny'));
  test('inline GIT_DIR=<feat> from main cwd allows', () => assert.equal(decide(`GIT_DIR="${featRepo}/.git" git commit -m x`, mainRepo), null));
  test('PowerShell $env:GIT_DIR then commit denies', () => assert.equal(decide(`$env:GIT_DIR='${mainRepo}\\.git'; git commit -m "x"`, featRepo, PS), 'deny'));
  test('PowerShell $env:GIT_DIR = <path> with spaces denies', () => assert.equal(decide(`$env:GIT_DIR = "${mainRepo}/.git"\ngit commit -m "x"`, featRepo, PS), 'deny'));
  test('PowerShell $env:GIT_DIR of feature repo from main cwd allows', () => assert.equal(decide(`$env:GIT_DIR='${featRepo}/.git'; git commit -m "x"`, mainRepo, PS), null));
});

describe('non-matching input and escape hatch', () => {
  test('other tools are ignored', () => assert.equal(evaluate({ tool_name: 'Read', tool_input: { file_path: 'x' } }, {}), null));
  test('empty command', () => assert.equal(decide('   '), null));
  test('missing tool_input', () => assert.equal(evaluate({ tool_name: 'Bash' }, {}), null));
  test('DOTCLAUDE_GUARD=off disables', () => assert.equal(decide('git push --force origin main', featRepo, 'Bash', { DOTCLAUDE_GUARD: 'off' }), null));
  test('deny reason explains alternative', () => {
    const out = evaluate({ tool_name: 'Bash', tool_input: { command: 'git commit -m x' }, cwd: mainRepo }, {});
    assert.match(out.hookSpecificOutput.permissionDecisionReason, /feature branch/);
  });
});

describe('splitSegments', () => {
  test('keeps quoted separators', () => assert.deepEqual(splitSegments('a "b; c" && d', false), [['a', 'b; c'], ['d']]));
  test('drops redirections', () => assert.deepEqual(splitSegments('a b 2>&1 >out.txt', false), [['a', 'b']]));
  test('PowerShell backslash is literal', () => assert.deepEqual(splitSegments('git -C C:\\x\\y status', true), [['git', '-C', 'C:\\x\\y', 'status']]));
});

describe('process contract', () => {
  const run = (input, env = {}) => spawnSync(process.execPath, [GUARD], { input, encoding: 'utf8', env: { ...process.env, ...env } });
  test('prints PreToolUse JSON and exits 0', () => {
    const r = run(JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'git push origin main' }, cwd: featRepo }));
    assert.equal(r.status, 0);
    const out = JSON.parse(r.stdout);
    assert.equal(out.hookSpecificOutput.hookEventName, 'PreToolUse');
    assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
    assert.equal(typeof out.hookSpecificOutput.permissionDecisionReason, 'string');
  });
  test('allowed command prints nothing', () => {
    const r = run(JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'git status' }, cwd: featRepo }));
    assert.equal(r.status, 0);
    assert.equal(r.stdout, '');
  });
  test('malformed JSON fails open', () => {
    const r = run('{not json');
    assert.equal(r.status, 0);
    assert.equal(r.stdout, '');
    assert.match(r.stderr, /dotclaude guard/);
  });
  test('input over 1 MB fails open', () => {
    const r = run(JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'git push origin main ' + 'x'.repeat(1100000) } }));
    assert.equal(r.status, 0);
    assert.equal(r.stdout, '');
  });
  test('DOTCLAUDE_GUARD=off via environment', () => {
    const r = run(JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'git push origin main' }, cwd: featRepo }), { DOTCLAUDE_GUARD: 'off' });
    assert.equal(r.stdout, '');
  });
});
