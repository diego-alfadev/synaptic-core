#!/usr/bin/env node
// tests/probes/fts5-probe.js - settles a claim the Phase 5 build-vs-adopt decision rests on:
// node:sqlite ships SQLite compiled WITH FTS5 (so real bm25() ranking) from Node 22.16.0, with zero
// npm dependencies - and NOT on 22.13-22.15 or the 23.x line. The 2026-09-20 SOTA delta established
// this from build configuration only (deps/sqlite/sqlite.gyp); this executes it.
//
// EXPECT_FTS5=1|0 makes the probe assert the expectation for this Node version; unset, it only reports.
'use strict';

const expect = process.env.EXPECT_FTS5;
const IN_CI = !!process.env.GITHUB_ACTIONS;

function finish(result) {
  const have = !!(result.fts5 && result.bm25);
  // The negative claim is only proven by a WORKING node:sqlite whose SQLite lacks FTS5 - not by any
  // other failure (module missing, or FTS5 present but a later query throwing).
  const absent = typeof result.sqlite === 'string' && result.fts5 === false && result.compile_option_fts5 === false;
  const ok = expect === undefined ? true : expect === '1' ? have : absent;
  const line = `node=${process.version} ${process.platform} ` +
    Object.entries(result).map(([k, v]) => `${k}=${v}`).join(' ') +
    (expect === undefined ? '' : ` expected_fts5=${expect}`);
  console.log(line);
  if (IN_CI) console.log(`::${ok ? 'notice' : 'error'} title=fts5 probe (node ${process.version} ${process.platform})::${line}`);
  process.exit(ok ? 0 : 1);
}

let sqlite;
try {
  sqlite = require('node:sqlite');
} catch (e) {
  finish({ node_sqlite: 'unavailable', reason: e.code || e.message, fts5: false, bm25: false });
}

const result = { sqlite: null, compile_option_fts5: false, fts5: false, bm25: false, porter: false, top: 'none' };
const db = new sqlite.DatabaseSync(':memory:');
try { result.sqlite = db.prepare('SELECT sqlite_version() AS v').get().v; } catch (_) { /* report as null */ }
try {
  result.compile_option_fts5 = db.prepare(
    "SELECT count(*) AS c FROM pragma_compile_options WHERE compile_options = 'ENABLE_FTS5'").get().c > 0;
} catch (_) { /* pragma unavailable: leave false */ }
try {
  db.exec("CREATE VIRTUAL TABLE docs USING fts5(title, body, tokenize = 'porter unicode61')");
  result.fts5 = true;
  const ins = db.prepare('INSERT INTO docs (title, body) VALUES (?, ?)');
  ins.run('Activity marker', 'unconditional proof of life appended on every stop and boot');
  ins.run('Breadcrumb', 'one semantic line written when a tracked file changed');
  ins.run('Consolidation', 'promote durable conclusions from the journal into curated knowledge nodes');
  const rows = db.prepare('SELECT title, bm25(docs) AS score FROM docs WHERE docs MATCH ? ORDER BY score').all('journal OR nodes');
  result.bm25 = rows.length > 0 && typeof rows[0].score === 'number';
  if (rows.length) result.top = JSON.stringify(rows[0].title);
  result.porter = db.prepare("SELECT count(*) AS c FROM docs WHERE docs MATCH 'promoted'").get().c > 0;
} catch (e) {
  result.error = JSON.stringify(e.message);
}
finish(result);
