#!/usr/bin/env node
'use strict';
// Offline only: installs a historical bundle and checks synthetic/recorded answers.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { check } = require('./check/resume');
function options(argv) {
  const o = { ref: 'HEAD', repo: path.resolve(__dirname, '..'), dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') { o.dryRun = true; continue; }
    const key = { '--ref': 'ref', '--repo': 'repo', '--answer': 'answer' }[a];
    if (!key || !argv[i + 1] || argv[i + 1].startsWith('--')) throw Error('Invalid argument: ' + a);
    o[key] = argv[++i];
  }
  if (!o.dryRun && !o.answer) throw Error('Use --dry-run or --answer; this runner never invokes a model.');
  return o;
}
function git(repo, args) {
  const r = spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8', shell: false, maxBuffer: 16 * 1024 * 1024 });
  if (r.error || r.status !== 0) throw Error('git operation failed: ' + (r.error?.message || r.stderr.trim()));
  return r.stdout;
}
function install(repo, ref, workspace) {
  const commit = git(repo, ['rev-parse', '--verify', '--end-of-options', ref + '^{commit}']).trim();
  if (!/^[a-f0-9]{40,64}$/.test(commit)) throw Error('Invalid resolved commit');
  const prefix = 'standalone/synaptic/';
  const names = git(repo, ['ls-tree', '-rz', '--name-only', commit, '--', prefix]).split('\0').filter(Boolean);
  if (!names.includes(prefix + 'SKILL.md')) throw Error('Selected ref has no standalone Synaptic skill');
  for (const name of names) {
    const rel = name.slice(prefix.length);
    if (!name.startsWith(prefix) || !rel || rel.split('/').some(x => !x || x === '.' || x === '..') || rel.includes('\\'))
      throw Error('Unsafe bundle path');
    const target = path.join(workspace, '.agents', 'skills', 'synaptic', ...rel.split('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    // Git tree symlinks are installed as inert text; no link is followed or executed.
    const content = git(repo, ['show', commit + ':' + name]);
    fs.writeFileSync(target, content, 'utf8');
  }
  return { commit, files: names.length };
}
function run(argv) {
  const o = options(argv);
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'synaptic-bench-'));
  const started = Date.now();
  try {
    fs.cpSync(path.join(__dirname, 'fixtures', 'resume'), workspace, { recursive: true });
    const bundle = install(path.resolve(o.repo), o.ref, workspace);
    const answerPath = o.answer ? path.resolve(o.answer) : path.join(__dirname, 'answers', 'good.json');
    const answer = JSON.parse(fs.readFileSync(answerPath, 'utf8'));
    const result = check(answer);
    const controls = o.dryRun ? {
      good: check(JSON.parse(fs.readFileSync(path.join(__dirname, 'answers', 'good.json'), 'utf8'))),
      bad: check(JSON.parse(fs.readFileSync(path.join(__dirname, 'answers', 'bad.json'), 'utf8'))),
    } : null;
    if (controls && (!controls.good.pass || controls.bad.pass)) throw Error('Checker controls failed');
    return {
      schema: 1, mode: o.dryRun ? 'dry-run' : 'recorded-answer-check',
      task: 'resume', ref: o.ref, commit: bundle.commit, installedFiles: bundle.files,
      host: null, model: null, settings: null, tokens: null, cost: null,
      modelInvoked: false, durationMs: Date.now() - started, timestamp: new Date().toISOString(),
      result, controls,
    };
  } finally {
    // Only this invocation's mkdtemp directory is removed; no supplied path is deleted.
    fs.rmSync(workspace, { recursive: true, force: true });
  }
}
if (require.main === module) {
  try {
    const report = run(process.argv.slice(2));
    process.stdout.write(JSON.stringify(report) + '\n');
    process.exitCode = report.result.pass ? 0 : 1;
  } catch (error) { process.stderr.write(error.message + '\n'); process.exitCode = 2; }
}
module.exports = { run, options };
