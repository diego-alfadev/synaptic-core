#!/usr/bin/env node
// tests/tools.test.js - behavioural tests for tools/*.js.
//
// Zero dependencies (node:* only) and a tiny built-in runner instead of node:test: tools/ claims
// "Node >= 18", node:test's output format differs across 18 / 20 / 22 / 24, and every failure here is
// also emitted as a GitHub `::error::` annotation so it is readable without opening the job log.
// Every fixture is built in the OS temp directory; nothing here reads or writes a real brain.
//
// Run: node tests/tools.test.js        exit 0 = every test passed
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const TOOLS = path.join(ROOT, 'tools');
const TEMPLATES = path.join(ROOT, 'standalone', 'synaptic', 'templates');
const IN_CI = !!process.env.GITHUB_ACTIONS;
const TODAY = new Date().toISOString().slice(0, 10);

// --- runner -------------------------------------------------------------------------------------
let n = 0;
let failed = 0;
const scratch = [];
const ghEsc = (s) => String(s).replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');

function test(name, fn) {
  n++;
  try {
    fn();
    console.log(`ok ${n} - ${name}`);
  } catch (e) {
    failed++;
    const msg = (e && e.message ? e.message : String(e)).split('\n').slice(0, 14).join('\n');
    console.log(`not ok ${n} - ${name}\n  # ${msg.replace(/\n/g, '\n  # ')}`);
    if (IN_CI) console.log(`::error title=tools.test.js (node ${process.version})::${ghEsc(`${name}\n${msg}`)}`);
  }
}
function info(m) {
  console.log(`# info: ${m}`);
  if (IN_CI) console.log(`::notice title=tools.test.js (node ${process.version})::${ghEsc(m)}`);
}
function assert(cond, msg) { if (!cond) throw new Error(msg); }
const tail = (s) => s.split('\n').slice(-20).join('\n');

// --- fixtures -----------------------------------------------------------------------------------
function tmp(tag) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), `syn-${tag}-`));
  scratch.push(d);
  return d;
}
function write(root, rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return p;
}
function copyDir(src, dst) {   // fs.cpSync is experimental on Node 18; this is the boring version
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}
function snapshot(dir) {   // every directory, file path and content under dir, for "nothing changed"
  const out = {};          // assertions; directories count, since creating them is a tool side effect
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { out[`${path.relative(dir, p)}/`] = 'dir'; walk(p); }
      else out[path.relative(dir, p)] = fs.readFileSync(p, 'base64');
    }
  })(dir);
  return JSON.stringify(out);
}
function tool(name, args) {
  const r = spawnSync(process.execPath, [path.join(TOOLS, name), ...args], {
    encoding: 'utf8', input: '', timeout: 120000,
  });
  if (r.error) throw r.error;
  return { code: r.status, out: `${r.stdout || ''}${r.stderr || ''}` };
}
function node(title, body, frontmatter) {
  const fm = frontmatter || [
    `description: ${title}`, 'type: concept', 'status: active', `updated: ${TODAY}`, 'tags: [ci]',
  ];
  return ['---', ...fm, '---', '', `# ${title}`, '', body || '', ''].join('\n');
}
// A minimal brain that MUST pass check.js. Every negative case below is this brain plus one mutation,
// so a failure points at exactly one rule.
function validBrain() {
  const b = path.join(tmp('brain'), '.synaptic');
  write(b, 'BRAIN.md', '# CI fixture brain\n\nA minimal valid brain built by tests/tools.test.js.\n');
  write(b, 'knowledge/INDEX.md', '# Index\n\n- [[alpha/_index]]\n');
  write(b, 'knowledge/alpha/_index.md', '# Alpha\n\n- [[node-one]]\n- [[node-two]]\n');
  write(b, 'knowledge/alpha/node-one.md', node('Node one', 'Relates to [[node-two]].'));
  write(b, 'knowledge/alpha/node-two.md', node('Node two', 'Relates to [[node-one]].'));
  return b;
}
function check(brain, expectCode, includes) {
  const r = tool('check.js', [brain]);
  assert(r.code === expectCode, `check.js exited ${r.code}, expected ${expectCode}\n${tail(r.out)}`);
  for (const s of includes || []) assert(r.out.includes(s), `check.js output lacks: ${s}\n${tail(r.out)}`);
  return r;
}
const TASK_HEAD = '| id | status | title | home | from | note | updated |\n|---|---|---|---|---|---|---|\n';
const PROP_HEAD = '| id | status | title | from | to | note | updated |\n|---|---|---|---|---|---|---|\n';

// --- check.js: the contract -----------------------------------------------------------------------
test('check.js: a minimal valid brain exits 0', () => { check(validBrain(), 0); });

test('check.js: a missing path exits 1', () => {
  check(path.join(tmp('nopath'), 'does-not-exist'), 1, ['path not found']);
});

test('check.js: missing BRAIN.md is an error', () => {
  const b = validBrain(); fs.rmSync(path.join(b, 'BRAIN.md'));
  check(b, 1, ['BRAIN.md is missing']);
});

test('check.js: missing knowledge/INDEX.md is an error', () => {
  const b = validBrain(); fs.rmSync(path.join(b, 'knowledge', 'INDEX.md'));
  check(b, 1, ['knowledge/INDEX.md is missing']);
});

test('check.js: a v0.3 knowledge/_tree.yaml is an error (issue #4: the artifact v1 deleted)', () => {
  const b = validBrain(); write(b, 'knowledge/_tree.yaml', 'nodes: []\n');
  check(b, 1, ['v0.x leftover file: knowledge/_tree.yaml']);
});

test('check.js: a v0.x inventory/ directory is an error', () => {
  const b = validBrain(); write(b, 'inventory/people.md', '# People\n');
  check(b, 1, ['v0.x leftover directory: inventory/']);
});

test('check.js: a node without frontmatter is an error', () => {
  const b = validBrain(); write(b, 'knowledge/alpha/node-two.md', '# Node two\n\nNo frontmatter.\n');
  check(b, 1, ['missing frontmatter']);
});

for (const field of ['description', 'type', 'status', 'updated', 'tags']) {
  test(`check.js: a node missing required "${field}" is an error`, () => {
    const b = validBrain();
    const fm = [`description: Node two`, 'type: concept', 'status: active', `updated: ${TODAY}`, 'tags: [ci]']
      .filter((l) => !l.startsWith(`${field}:`));
    write(b, 'knowledge/alpha/node-two.md', node('Node two', 'Relates to [[node-one]].', fm));
    check(b, 1, [`frontmatter missing required field: ${field}`]);
  });
}

test('check.js: a node no MOC references is an error', () => {
  const b = validBrain(); write(b, 'knowledge/alpha/orphan-node.md', node('Orphan node', ''));
  check(b, 1, ['node "orphan-node" not referenced']);
});

test('check.js: a cluster _index.md not linked from INDEX.md is an error', () => {
  const b = validBrain(); write(b, 'knowledge/gamma/_index.md', '# Gamma\n');
  check(b, 1, ['cluster _index.md not linked from knowledge/INDEX.md']);
});

test('check.js: a broken wikilink is an error', () => {
  const b = validBrain();
  write(b, 'knowledge/alpha/node-one.md', node('Node one', 'Relates to [[node-two]] and [[does-not-exist]].'));
  check(b, 1, ['broken wikilink: [[does-not-exist]]']);
});

test('check.js: a non-kebab-case filename is an error', () => {
  const b = validBrain();
  write(b, 'knowledge/alpha/_index.md', '# Alpha\n\n- [[node-one]]\n- [[node-two]]\n- [[Bad_Name]]\n');
  write(b, 'knowledge/alpha/Bad_Name.md', node('Bad name', ''));
  check(b, 1, ['filename is not kebab-case']);
});

test('check.js: a duplicate basename across clusters is an error', () => {
  const b = validBrain();
  write(b, 'knowledge/INDEX.md', '# Index\n\n- [[alpha/_index]]\n- [[beta/_index]]\n');
  write(b, 'knowledge/beta/_index.md', '# Beta\n\n- [[node-one]]\n');
  write(b, 'knowledge/beta/node-one.md', node('Node one again', ''));
  check(b, 1, ['duplicate basename: "node-one.md"']);
});

test('check.js: a registry without "type: registry" is an error', () => {
  const b = validBrain();
  write(b, 'registries/_index.md', '# Registries\n\n- [[people]]\n');
  write(b, 'registries/people.md', node('People', ''));
  check(b, 1, ['registry file missing "type: registry" frontmatter']);
});

test('check.js: MIGRATION_DONE.md inside knowledge/ is an error', () => {
  const b = validBrain(); write(b, 'knowledge/MIGRATION_DONE.md', '# Done\n');
  check(b, 1, ['non-live artifact in knowledge/: MIGRATION_DONE.md']);
});

// --- check.js: regressions for shipped fixes (each must stay GREEN) --------------------------------
test('check.js: a wikilink inside a fenced code block is not a broken link (regression: v1.2.0 council fix)', () => {
  const b = validBrain();
  write(b, 'knowledge/alpha/node-one.md', node('Node one', 'Relates to [[node-two]].\n\n```\n[[not-a-real-link]]\n```'));
  check(b, 0);
});

test('check.js: a wikilink inside an HTML comment is not a broken link', () => {
  const b = validBrain();
  write(b, 'knowledge/alpha/node-one.md', node('Node one', 'Relates to [[node-two]].\n\n<!-- [[not-a-real-link]] -->'));
  check(b, 0);
});

test('check.js: a wikilink inside inline code is not a broken link', () => {
  const b = validBrain();
  write(b, 'knowledge/alpha/node-one.md', node('Node one', 'Relates to [[node-two]]; syntax is `[[not-a-real-link]]`.'));
  check(b, 0);
});

test('check.js: a YAML comment before the first list item does not drop the list (regression)', () => {
  const b = validBrain();
  const fm = ['description: Node two', 'type: concept', 'status: active', `updated: ${TODAY}`, 'tags:', '# a comment', '  - ci'];
  write(b, 'knowledge/alpha/node-two.md', node('Node two', 'Relates to [[node-one]].', fm));
  const r = check(b, 0);
  assert(!r.out.includes('"tags" is an empty list'), `tags list was dropped\n${tail(r.out)}`);
});

test('check.js: warnings alone never fail the run (stale node)', () => {
  const b = validBrain();
  const fm = ['description: Node two', 'type: concept', 'status: active', 'updated: 2000-01-01', 'tags: [ci]'];
  write(b, 'knowledge/alpha/node-two.md', node('Node two', 'Relates to [[node-one]].', fm));
  check(b, 0, ['stale:']);
});

test('check.js: an old status: archived node is not reported stale', () => {
  const b = validBrain();
  const fm = ['description: Node two', 'type: concept', 'status: archived', 'updated: 2000-01-01', 'tags: [ci]'];
  write(b, 'knowledge/alpha/node-two.md', node('Node two', 'Relates to [[node-one]].', fm));
  const r = check(b, 0);
  assert(!r.out.includes('stale:'), `archived node reported stale\n${tail(r.out)}`);
});

test('check.js: a mistyped status warns but does not fail', () => {
  const b = validBrain();
  const fm = ['description: Node two', 'type: concept', 'status: actve', `updated: ${TODAY}`, 'tags: [ci]'];
  write(b, 'knowledge/alpha/node-two.md', node('Node two', 'Relates to [[node-one]].', fm));
  check(b, 0, ['"status" is "actve"']);
});

// Informational, never gating: what check.js says about the skill templates copied verbatim. The
// real Day-1 flow is agent-driven (/synaptic-init fills the placeholders), so a verbatim copy is not
// expected to pass - but the first CI run should record exactly which rules fire.
(function templatesVerbatim() {
  try {
    const b = path.join(tmp('templates'), '.synaptic');
    copyDir(TEMPLATES, b);
    const r = tool('check.js', [b]);
    const errs = r.out.split('\n').filter((l) => /error|missing|not linked|not referenced|broken/i.test(l)).slice(0, 4);
    info(`templates copied verbatim: check.js exit ${r.code}${errs.length ? ` - ${errs.map((s) => s.trim()).join(' | ')}` : ''}`);
  } catch (e) {
    info(`templates copied verbatim: could not run (${e.message})`);
  }
})();

// --- graph.js: the offline promise ------------------------------------------------------------------
test('graph.js: writes a single-file HTML graph with no external resources', () => {
  const b = validBrain();
  const out = path.join(tmp('graph'), 'g.html');
  const r = tool('graph.js', [b, '--out', out]);
  assert(r.code === 0, `graph.js exited ${r.code}\n${tail(r.out)}`);
  assert(fs.existsSync(out), 'no HTML written');
  const html = fs.readFileSync(out, 'utf8');
  assert(!/<script[^>]*\bsrc\s*=/i.test(html), 'has <script src=...>');
  assert(!/<link[^>]*\bhref\s*=/i.test(html), 'has <link href=...>');
  assert(!/@import/i.test(html), 'has a CSS @import');
  const urls = (html.match(/https?:\/\/[^\s"'<>)]+/g) || []).filter((u) => !u.startsWith('http://www.w3.org/'));
  assert(urls.length === 0, `references external URLs: ${[...new Set(urls)].slice(0, 5).join(', ')}`);
  assert(html.includes('node-one') && html.includes('node-two'), 'graph does not contain the fixture nodes');
});

test('graph.js: the archived filter keys on status, which the page data carries', () => {
  const b = validBrain();
  const fm = ['description: Node two', 'type: concept', 'status: archived', `updated: ${TODAY}`, 'tags: [ci]'];
  write(b, 'knowledge/alpha/node-two.md', node('Node two', 'Relates to [[node-one]].', fm));
  const out = path.join(tmp('graph'), 'g.html');
  const r = tool('graph.js', [b, '--out', out]);
  assert(r.code === 0, `graph.js exited ${r.code}\n${tail(r.out)}`);
  const html = fs.readFileSync(out, 'utf8');
  assert(/"status":\s*"archived"/.test(html), 'page data lacks status: archived');
  assert(html.includes('n.status === "archived"'), 'archived filter does not test status');
  assert(!html.includes('n.lifecycle === "archived"'), 'archived filter still tests lifecycle');
});

// --- brain-graph.js / graph.js: direction and type --------------------------------------------------
// z-new supersedes a-old; a-old's body links back to z-new. a-old is read first, so an undirected,
// first-type-wins graph records the pair as a plain wikilink.
function supersedeBrain() {
  const b = validBrain();
  write(b, 'knowledge/alpha/_index.md', '# Alpha\n\n- [[node-one]]\n- [[node-two]]\n- [[a-old]]\n- [[z-new]]\n');
  write(b, 'knowledge/alpha/a-old.md', node('Old', 'Replaced by [[z-new]].'));
  write(b, 'knowledge/alpha/z-new.md', node('New', 'The current answer.', [
    'description: New', 'type: concept', 'status: active', `updated: ${TODAY}`, 'tags: [ci]',
    'supersedes:', '  - "[[a-old]]"',
  ]));
  return b;
}

test('brain-graph.js: directed edges keep source, target and type; a typed edge is never replaced by a wikilink', () => {
  const { buildBrainGraph } = require(path.join(TOOLS, 'lib', 'brain-graph.js'));
  const g = buildBrainGraph(supersedeBrain());
  const pair = g.edges.filter((e) => [e.from, e.to].sort().join('|') === 'a-old|z-new');
  assert(JSON.stringify(pair.map((e) => `${e.from}>${e.to}:${e.type}`).sort()) ===
    JSON.stringify(['a-old>z-new:wikilink', 'z-new>a-old:supersedes']), `directed edges: ${JSON.stringify(pair)}`);
  const und = g.edgeList.filter((e) => e.a === 'a-old' && e.b === 'z-new');
  assert(und.length === 1 && und[0].type === 'supersedes', `undirected pair: ${JSON.stringify(und)}`);
});

test('brain-graph.js: neighbours answers "inbound supersedes of B" with A', () => {
  const { buildBrainGraph, neighbours } = require(path.join(TOOLS, 'lib', 'brain-graph.js'));
  const g = buildBrainGraph(supersedeBrain());
  const inbound = neighbours(g, 'a-old', { type: 'supersedes', direction: 'in' });
  assert(JSON.stringify(inbound) === JSON.stringify([{ id: 'z-new', type: 'supersedes', direction: 'in' }]),
    `inbound supersedes of a-old: ${JSON.stringify(inbound)}`);
  assert(neighbours(g, 'a-old', { type: 'supersedes', direction: 'out' }).length === 0, 'a-old supersedes nothing');
  assert(neighbours(g, 'z-new', { direction: 'both' }).length === 2, 'z-new has one edge each way');
});

test('graph.js: --neighbours prints the inbound edge and writes no HTML', () => {
  const b = supersedeBrain();
  const out = path.join(tmp('nb'), 'g.html');
  const r = tool('graph.js', [b, '--neighbours', 'a-old', '--type', 'supersedes', '--direction', 'in', '--out', out]);
  assert(r.code === 0, `graph.js --neighbours exited ${r.code}\n${tail(r.out)}`);
  assert(/z-new\s+--\[supersedes\]-->\s+a-old/.test(r.out), `no inbound supersedes line\n${tail(r.out)}`);
  assert(!fs.existsSync(out), 'HTML written in neighbours mode');
  const missing = tool('graph.js', [b, '--neighbours', 'no-such-node', '--out', out]);
  assert(missing.code === 1 && missing.out.includes('no-such-node'), `unknown node not refused\n${tail(missing.out)}`);
});

// --- export.js -----------------------------------------------------------------------------------
test('export.js: single-file export contains every brain file under a FILE header', () => {
  const b = validBrain();
  const out = path.join(tmp('export'), 'brain.md');
  const r = tool('export.js', [b, out]);
  assert(r.code === 0, `export.js exited ${r.code}\n${tail(r.out)}`);
  const md = fs.readFileSync(out, 'utf8');
  for (const rel of ['BRAIN.md', 'knowledge/INDEX.md', 'knowledge/alpha/node-one.md']) {
    assert(md.includes(`## FILE: ${rel}`), `missing "## FILE: ${rel}"`);
  }
});

test('export.js: --split writes the four section files, each with its own content', () => {
  const b = validBrain();
  write(b, 'registries/_index.md', '# Registries\n');      // the base brain has no registries/ or
  write(b, 'references/_index.md', '# References\n');      // references/, and empty sections are skipped
  const prefix = path.join(tmp('split'), 'brain');
  const r = tool('export.js', [b, prefix, '--split']);
  assert(r.code === 0, `export.js --split exited ${r.code}\n${tail(r.out)}`);
  for (const s of ['core', 'knowledge', 'registries', 'refs-harness']) {
    assert(fs.existsSync(`${prefix}-${s}.md`), `missing ${path.basename(prefix)}-${s}.md`);
  }
  assert(fs.readFileSync(`${prefix}-core.md`, 'utf8').includes('## FILE: BRAIN.md'), 'core split lacks BRAIN.md');
  assert(fs.readFileSync(`${prefix}-knowledge.md`, 'utf8').includes('## FILE: knowledge/alpha/node-one.md'), 'knowledge split lacks node-one');
  assert(fs.readFileSync(`${prefix}-registries.md`, 'utf8').includes('## FILE: registries/_index.md'), 'registries split lacks registries/_index.md');
});

test('export.js: --split skips (does not write) a section with no files, and still exits 0', () => {
  const b = validBrain();
  const prefix = path.join(tmp('split-empty'), 'brain');
  const r = tool('export.js', [b, prefix, '--split']);
  assert(r.code === 0, `export.js --split exited ${r.code}\n${tail(r.out)}`);
  assert(fs.existsSync(`${prefix}-core.md`) && fs.existsSync(`${prefix}-knowledge.md`), 'non-empty sections not written');
  assert(!fs.existsSync(`${prefix}-registries.md`), 'an empty registries section was written');
  assert(r.out.includes('Skipped'), `no "Skipped" notice for empty sections\n${tail(r.out)}`);
});

// --- deploy.js: the harness writer ------------------------------------------------------------------
function project(withTemplatesHarness) {
  const p = tmp('project');
  const b = path.join(p, '.synaptic');
  copyDir(path.join(TEMPLATES, 'harness'), path.join(b, 'harness'));
  if (!withTemplatesHarness) {
    write(b, 'harness/conventions.md', '---\ntype: harness\n---\n\n- Prefer small, reviewable commits.\n');
    write(b, 'harness/guardrails.md', '---\ntype: harness\n---\n\n- Never commit secrets.\n');
  }
  write(p, 'AGENTS.md', '# My project\n\nUser-authored content that must survive.\n');
  return p;
}

test('deploy.js: refuses to deploy a harness that still has {{placeholders}}', () => {
  const p = project(true);
  const before = fs.readFileSync(path.join(p, 'AGENTS.md'), 'utf8');
  const r = tool('deploy.js', [p]);
  assert(r.code === 1, `deploy.js exited ${r.code}, expected 1\n${tail(r.out)}`);
  assert(r.out.includes('refusing to deploy'), `no refusal message\n${tail(r.out)}`);
  assert(fs.readFileSync(path.join(p, 'AGENTS.md'), 'utf8') === before, 'AGENTS.md was modified');
});

test('deploy.js: --dry-run writes nothing', () => {
  const p = project(false);
  const before = snapshot(p);
  const r = tool('deploy.js', [p, '--dry-run']);
  assert(r.code === 0, `deploy.js --dry-run exited ${r.code}\n${tail(r.out)}`);
  assert(snapshot(p) === before, 'files changed under --dry-run');
});

test('deploy.js: writes one marker block, keeps user content, backs up, and is idempotent', () => {
  const p = project(false);
  const agents = path.join(p, 'AGENTS.md');
  const original = fs.readFileSync(agents, 'utf8');
  let r = tool('deploy.js', [p]);
  assert(r.code === 0, `first deploy exited ${r.code}\n${tail(r.out)}`);
  const once = fs.readFileSync(agents, 'utf8');
  assert(once.includes('User-authored content that must survive.'), 'user content lost');
  assert(once.includes('Never commit secrets.'), 'guardrails not deployed');
  assert((once.match(/<!-- BEGIN:SYNAPTIC-RULES -->/g) || []).length === 1, 'not exactly one BEGIN marker');
  assert(fs.existsSync(`${agents}.bak`) && fs.readFileSync(`${agents}.bak`, 'utf8') === original, 'AGENTS.md.bak missing or not the original');
  r = tool('deploy.js', [p]);
  assert(r.code === 0, `second deploy exited ${r.code}\n${tail(r.out)}`);
  assert(fs.readFileSync(agents, 'utf8') === once, 'second deploy changed AGENTS.md (not idempotent)');
});

// --- vault-open.js ------------------------------------------------------------------------------------
test('vault-open.js: writes Obsidian config + OPEN-IN.md and never overwrites user config', () => {
  const b = validBrain();
  let r = tool('vault-open.js', [b]);
  assert(r.code === 0, `vault-open.js exited ${r.code}\n${tail(r.out)}`);
  const app = path.join(b, '.obsidian', 'app.json');
  assert(fs.existsSync(app), 'no .obsidian/app.json');
  assert(fs.existsSync(path.join(b, 'OPEN-IN.md')), 'no OPEN-IN.md');
  fs.writeFileSync(app, '{"userSetting": true}\n');
  r = tool('vault-open.js', [b]);
  assert(r.code === 0, `second vault-open.js exited ${r.code}\n${tail(r.out)}`);
  assert(fs.readFileSync(app, 'utf8') === '{"userSetting": true}\n', 'user .obsidian/app.json was overwritten');
});

// --- migrate.js -----------------------------------------------------------------------------------------
test('migrate.js: --dry-run detects a v0.3 brain and changes nothing', () => {
  const b = path.join(tmp('v03'), '.synaptic');
  write(b, 'BOOTSTRAP.md', '# Bootstrap\n');
  write(b, 'MANIFEST.md', '# Manifest\n');
  write(b, 'knowledge/_tree.yaml', 'nodes: []\n');
  write(b, 'knowledge/topic.md', '# Topic\n');
  write(b, 'inventory/people.md', '# People\n');
  const before = snapshot(b);
  const r = tool('migrate.js', [b, '--dry-run']);
  assert(r.code === 0, `migrate.js --dry-run exited ${r.code}\n${tail(r.out)}`);
  assert(r.out.includes('v0.3'), `did not detect v0.3\n${tail(r.out)}`);
  assert(snapshot(b) === before, 'files or directories changed under --dry-run');
  assert(!fs.existsSync(path.join(b, 'registries')) && !fs.existsSync(path.join(b, '_migration-staging')),
    'a v1 directory was created under --dry-run');
});


// Work-item portability and non-authoritative scratch (v1.7).
test('check.js: ignores playground scratch but still diagnoses ordinary task artifacts', () => {
  const b = validBrain();
  write(b, 'playgrounds/spike/scratch/raw.md', '[[missing-scratch-target]]');
  check(b, 0);
  write(b, 'playgrounds/spike/result.md', '[[missing-real-target]]');
  check(b, 1, ['missing-real-target']);
});
test('export.js: preserves tasks, proposal details and the work documents rows point at, in single and split exports', () => {
  const b = validBrain();
  write(b, 'tasks/INDEX.md', `# Task index\n\n${'| id | status | title | home | from | note | updated |\n|---|---|---|---|---|---|---|\n'}` +
    '| T1 | [ ] | Spike | playgrounds/spike/tasks.md | — |  | 2026-11-01 |\n');
  write(b, 'proposals/P1-example/details.md', '# Proposal detail');
  write(b, 'playgrounds/spike/tasks.md', '# Spike\n\nSPIKE-WORK-DOCUMENT\n');
  write(b, 'playgrounds/spike/scratch/raw.md', 'SCRATCH-MUST-NOT-EXPORT');
  const out = path.join(tmp('work-export'), 'brain.md');
  assert(tool('export.js', [b, out]).code === 0, 'single export failed');
  const text = fs.readFileSync(out, 'utf8');
  assert(text.includes('## FILE: tasks/INDEX.md') && text.includes('## FILE: proposals/P1-example/details.md'), 'work records lost');
  assert(text.includes('## FILE: playgrounds/spike/tasks.md') && text.includes('SPIKE-WORK-DOCUMENT'), 'work document not exported');
  assert(!text.includes('SCRATCH-MUST-NOT-EXPORT'), 'scratch leaked');
  const prefix = path.join(tmp('work-split'), 'brain');
  assert(tool('export.js', [b, prefix, '--split']).code === 0, 'split export failed');
  const split = fs.readFileSync(prefix + '-refs-harness.md', 'utf8');
  assert(split.includes('## FILE: tasks/INDEX.md') && split.includes('## FILE: proposals/P1-example/details.md'), 'split lost work records');
  assert(split.includes('## FILE: playgrounds/spike/tasks.md'), 'split lost the work document');
});

// The record survives close: a closed playground lives under playgrounds/archive/<year>/<id>/.
function closedWorkBrain() {
  const b = validBrain();
  write(b, 'tasks/INDEX.md', `# Tasks\n\n${TASK_HEAD}` + [
    '| T1 | [ ] | Live work | playgrounds/live/tasks.md | — |  | 2026-11-01 |',
    '| T2 | [x] | Closed work | playgrounds/archive/2026/t2-done/tasks.md | — | [[node-one]] updated | 2026-11-03 |',
    '| T3 | [ ] | Upstream work | odd/tasks/search-filters.md | — |  | 2026-11-01 |',
    '| T4 | [x] | Burned long ago | playgrounds/burned/tasks.md | — | [[node-two]] written | 2026-09-01 |',
  ].join('\n') + '\n');
  write(b, 'playgrounds/live/tasks.md', '# Live\n\nLIVE-DOCUMENT\n');
  write(b, 'playgrounds/archive/2026/t2-done/tasks.md', '# Closed\n\nCLOSED-DOCUMENT\n');
  write(b, 'playgrounds/archive/2026/t2-done/scratch/plot.png', 'ASSET-MUST-NOT-EXPORT');
  return b;
}

test('export.js: one open and one closed work item export both documents; external and dead homes are referenced, not included', () => {
  const b = closedWorkBrain();
  const out = path.join(tmp('closed-export'), 'brain.md');
  const r = tool('export.js', [b, out]);
  assert(r.code === 0, `export.js exited ${r.code}\n${tail(r.out)}`);
  const text = fs.readFileSync(out, 'utf8');
  for (const s of ['## FILE: playgrounds/live/tasks.md', 'LIVE-DOCUMENT',
    '## FILE: playgrounds/archive/2026/t2-done/tasks.md', 'CLOSED-DOCUMENT']) assert(text.includes(s), `export lacks: ${s}`);
  assert(!text.includes('ASSET-MUST-NOT-EXPORT'), 'an archived asset was exported');
  assert(/referenced, not included[\s\S]*T3[^\n]*odd\/tasks\/search-filters\.md[^\n]*external/.test(text), 'external home not listed');
  assert(/referenced, not included[\s\S]*T4[^\n]*playgrounds\/burned\/tasks\.md[^\n]*does not resolve/.test(text), 'dead home not listed');
});

test('check.js: a closed row homed under playgrounds/archive/ resolves; one still in a live playground warns', () => {
  const b = closedWorkBrain();
  let r = check(b, 0);
  assert(!r.out.includes('t2-done'), `archived home reported\n${tail(r.out)}`);
  write(b, 'tasks/INDEX.md', `# Tasks\n\n${TASK_HEAD}| T1 | [x] | Closed, not moved | playgrounds/live/tasks.md | — | [[node-one]] updated | 2026-11-03 |\n`);
  r = check(b, 0, ['closed task still homed in a live playground: playgrounds/live/tasks.md']);
});

test('templates/playgrounds/.gitignore: an asset in an archived playground\'s scratch/ is ignored, its document is not', () => {
  if (spawnSync('git', ['--version']).status !== 0) { info('git not available: archive ignore rule not tested'); return; }
  const ws = tmp('archive-ignore');
  copyDir(path.join(TEMPLATES, 'playgrounds'), path.join(ws, 'playgrounds'));
  for (const f of ['playgrounds/archive/2026/t2-done/scratch/plot.png', 'playgrounds/archive/2026/t2-done/tasks.md',
    'playgrounds/archive/2026/t2-done/result.md', 'playgrounds/live/scratch/raw.csv']) write(ws, f, 'x');
  assert(spawnSync('git', ['init', '-q'], { cwd: ws }).status === 0, 'git init failed');
  const ignored = (f) => spawnSync('git', ['check-ignore', '-q', f], { cwd: ws }).status === 0;
  assert(ignored('playgrounds/archive/2026/t2-done/scratch/plot.png'), 'archived scratch asset is not ignored');
  assert(ignored('playgrounds/live/scratch/raw.csv'), 'live scratch is no longer ignored');
  assert(!ignored('playgrounds/archive/2026/t2-done/tasks.md'), 'archived work document is ignored');
  assert(!ignored('playgrounds/archive/2026/t2-done/result.md'), 'archived artifact is ignored');
});

// --- check.js: work items (tasks/INDEX.md, proposals/INDEX.md) --------------------------------------
const PROMOTION = path.join(ROOT, 'tests', 'capture-floor', 'fixtures', 'promotion');
const UPSTREAM_DOC = path.join(ROOT, 'tests', 'fixtures', 'external-home', 'odd', 'tasks', 'search-filters.md');
function summary(out) {
  const m = out.match(/Summary: (\d+) error\(s\), (\d+) warning\(s\)/);
  assert(m, `no summary line\n${tail(out)}`);
  return { errors: Number(m[1]), warnings: Number(m[2]) };
}
// validBrain() plus a sound pair of indexes: every row kind the contract allows, 0 errors, 0 warnings.
function workBrain(taskRows, proposalRows) {
  const b = validBrain();
  write(b, 'playgrounds/t2-spike/tasks.md', '# Spike\n\n## Log\n\n- L1 [2026-11-01] "start"\n');
  write(b, 'tasks/INDEX.md', `# Tasks\n\n${TASK_HEAD}${(taskRows || [
    '| T1 | [ ] | Small fix | inline | — |  | 2026-11-01 |',
    '| T2 | [ ] | Spike | playgrounds/t2-spike/tasks.md | — |  | 2026-11-01 |',
    '| T3 | [x] | Done thing | inline | P1 | README.md, link fixed | 2026-11-02 |',
    '| T4 | [-] | Dropped thing | inline | — | owner dropped it | 2026-11-02 |',
  ]).join('\n')}\n`);
  write(b, 'proposals/INDEX.md', `# Proposals\n\n${PROP_HEAD}${(proposalRows || [
    '| P1 | [x] | Done thing | session 2026-11-01 | T3 | promoted to T3 | 2026-11-02 |',
    '| P2 | [ ] | Maybe later | session 2026-11-01 | — |  | 2026-11-01 |',
  ]).join('\n')}\n`);
  return b;
}

test('check.js: a sound task and proposal index adds no error and no warning', () => {
  const r = check(workBrain(), 0);
  const s = summary(r.out);
  assert(s.errors === 0 && s.warnings === 0, `expected 0/0, got ${s.errors}/${s.warnings}\n${tail(r.out)}`);
});

test('check.js: the read-only promotion fixture passes the work-item check', () => {
  const b = validBrain();
  copyDir(PROMOTION, b);
  const r = check(b, 0);
  assert(summary(r.out).errors === 0, `promotion fixture reported errors\n${tail(r.out)}`);
});

test('check.js: broken open home, unproven [x], duplicate id and invalid status are four distinct errors', () => {
  const b = workBrain([
    '| T1 | [ ] | Open, home gone | playgrounds/no-such-spike/tasks.md | — |  | 2026-11-01 |',
    '| T2 | [x] | Done, no proof | inline | — |  | 2026-11-01 |',
    '| T3 | [ ] | First T3 | inline | — |  | 2026-11-01 |',
    '| T3 | [ ] | Second T3 | inline | — |  | 2026-11-01 |',
    '| T4 | [?] | Bad status | inline | — |  | 2026-11-01 |',
  ], ['| P1 | [ ] | Maybe | session 2026-11-01 | — |  | 2026-11-01 |']);
  const r = check(b, 1, [
    'open task home does not resolve: playgrounds/no-such-spike/tasks.md',
    'done without proof',
    'duplicate id: T3',
    'invalid status "[?]"',
  ]);
  const s = summary(r.out);
  assert(s.errors === 4, `expected exactly 4 errors, got ${s.errors}\n${tail(r.out)}`);
});

test('check.js: a closed row whose home is gone is one warning, exit 0', () => {
  const b = workBrain([
    '| T1 | [x] | Burned playground | playgrounds/burned/tasks.md | — | result recorded in [[node-one]] | 2026-10-01 |',
  ], ['| P1 | [ ] | Maybe | session 2026-11-01 | — |  | 2026-11-01 |']);
  const r = check(b, 0, ['closed task home does not resolve: playgrounds/burned/tasks.md']);
  const s = summary(r.out);
  assert(s.errors === 0 && s.warnings === 1, `expected 0/1, got ${s.errors}/${s.warnings}\n${tail(r.out)}`);
});

test('check.js: an unmodified upstream-shaped feature document as an external home is "unverified", not an error', () => {
  const b = workBrain([
    '| T1 | [ ] | Search filters | odd/tasks/search-filters.md | — |  | 2026-11-01 |',
  ], ['| P1 | [ ] | Maybe | session 2026-11-01 | — |  | 2026-11-01 |']);
  const ws = path.dirname(b);
  write(ws, 'odd/tasks/search-filters.md', fs.readFileSync(UPSTREAM_DOC, 'utf8'));
  const r = check(b, 0, ['unverified', 'odd/tasks/search-filters.md']);
  const s = summary(r.out);
  assert(s.errors === 0 && s.warnings === 0, `expected 0/0, got ${s.errors}/${s.warnings}\n${tail(r.out)}`);
});

test('check.js: the external-owner worked example row in consolidate.md is unverified, not an error', () => {
  const doc = fs.readFileSync(path.join(ROOT, 'standalone', 'synaptic', 'references', 'consolidate.md'), 'utf8');
  const row = (doc.match(/`(\| T12 \|[^`]*)`/) || [])[1];
  assert(row, 'worked example row not found in consolidate.md');
  const b = workBrain([row], ['| P1 | [ ] | Maybe | session 2026-11-01 | — |  | 2026-11-01 |']);
  write(path.dirname(b), 'odd/tasks/search-filters.md', fs.readFileSync(UPSTREAM_DOC, 'utf8'));
  const r = check(b, 0, ['unverified', 'external home odd/tasks/search-filters.md']);
  assert(summary(r.out).errors === 0, `worked example row reported errors\n${tail(r.out)}`);
});

test('check.js: rows appended after the table and missing indexes are tolerated', () => {
  const b = validBrain();
  write(b, 'tasks/INDEX.md', `# Tasks\r\n\r\n${TASK_HEAD.replace(/\n/g, '\r\n')}| T1 | [ ] | One | inline | — |  | 2026-11-01 |\r\n\r\nA note someone appended.\r\n`);
  const r = check(b, 0);
  assert(summary(r.out).errors === 0, `CRLF index or trailing prose reported errors\n${tail(r.out)}`);
});

// The provenance cases tests/capture-floor/run.sh checks with awk, now also enforced by check.js.
for (const [label, tasks, proposals, expect] of [
  ['an id that is not T<n>', ['| X1 | [ ] | Bad id | inline | — |  | 2026-11-01 |'], null, 'id "X1" is not T<n>'],
  ['an updated that is not YYYY-MM-DD', ['| T1 | [ ] | Bad date | inline | — |  | yesterday |'], null, 'updated "yesterday" is not YYYY-MM-DD'],
  ['[-] without a reason', ['| T1 | [-] | Dropped | inline | — |  | 2026-11-01 |'], null, 'dropped without a reason'],
  ['a promoted proposal that is not [x]', null,
    ['| P1 | [ ] | Done thing | session 2026-11-01 | T3 |  | 2026-11-02 |'], 'promoted to T3 but not [x]'],
  ['a promoted proposal whose note does not cite its task', null,
    ['| P1 | [x] | Done thing | session 2026-11-01 | T3 | promoted | 2026-11-02 |'], 'note does not cite T3'],
  ['a proposal to a task that does not name it back', null,
    ['| P1 | [x] | Done thing | session 2026-11-01 | T3 | promoted to T3 | 2026-11-02 |',
      '| P2 | [x] | Other | session 2026-11-01 | T1 | promoted to T1 | 2026-11-02 |'], 'P2 names T1, but T1 is not from P2'],
  ['a task from a proposal that does not name it', [
    '| T1 | [ ] | Small fix | inline | P2 |  | 2026-11-01 |',
    '| T3 | [x] | Done thing | inline | P1 | README.md, link fixed | 2026-11-02 |'], null, 'T1 is from P2, but P2 does not name T1'],
  ['a promoted task homed in another proposal\'s folder', [
    '| T3 | [x] | Done thing | proposals/P2-other/ | P1 | README.md, link fixed | 2026-11-02 |'], null, 'home is another proposal\'s folder'],
]) {
  test(`check.js: work items - ${label} is an error`, () => {
    const b = workBrain(tasks, proposals);
    write(b, 'proposals/P2-other/details.md', '# Other\n');
    check(b, 1, [expect]);
  });
}

// --- done ----------------------------------------------------------------------------------------------
for (const d of scratch) { try { fs.rmSync(d, { recursive: true, force: true }); } catch (_) { /* best effort */ } }
console.log(`1..${n}`);
console.log(failed === 0 ? `# all ${n} passed (node ${process.version}, ${process.platform})` : `# ${failed} of ${n} FAILED (node ${process.version}, ${process.platform})`);
process.exit(failed > 0 ? 1 : 0);
