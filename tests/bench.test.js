'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { run, options } = require('../bench/run');
const { check } = require('../bench/check/resume');
test('resume checks facts, rejecting absent, partial and incorrect answers', () => {
  const good = require('../bench/answers/good.json');
  assert.equal(check(good).pass, true);
  assert.equal(check({}).score, 0);
  assert.equal(check({ ...good, next_step: 'Deploy immediately.' }).score, 2 / 3);
  assert.equal(check(require('../bench/answers/bad.json')).pass, false);
  assert.throws(() => options(['--ref']));
  assert.throws(() => options([]));
});
test('offline runner installs requested committed bundle and rejects invalid refs', () => {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'synaptic-bench-test-'));
  function git(args) {
    const p = spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8', shell: false });
    assert.equal(p.status, 0, p.stderr);
    return p.stdout.trim();
  }
  try {
    fs.mkdirSync(path.join(repo, 'standalone', 'synaptic'), { recursive: true });
    fs.writeFileSync(path.join(repo, 'standalone', 'synaptic', 'SKILL.md'), '# Synthetic skill\n');
    git(['init', '--quiet']);
    git(['add', 'standalone']);
    git(['-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=' + path.join(repo, 'no-hooks'), '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--quiet', '-m', 'fixture']);
    const report = run(['--dry-run', '--repo', repo]);
    assert.equal(report.commit, git(['rev-parse', 'HEAD']));
    assert.equal(report.installedFiles, 1);
    assert.equal(report.mode, 'dry-run');
    assert.equal(report.result.pass, true);
    assert.equal(report.controls.bad.pass, false);
    assert.equal(report.modelInvoked, false);
    assert.equal(report.cost, null);
    const bad = run(['--dry-run', '--repo', repo, '--answer', path.join(__dirname, '../bench/answers/bad.json')]);
    assert.equal(bad.result.pass, false);
    assert.throws(() => run(['--dry-run', '--repo', repo, '--ref', 'unknown-ref']));
  } finally { fs.rmSync(repo, { recursive: true, force: true }); }
});
