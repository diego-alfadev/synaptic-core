'use strict';
// Deterministic CORE facade. Sources: references/contract.md §§1-4 and audit.md.
// No SQLite/MCP import: direct file access remains independent of accelerators.
const fs = require('node:fs');
const path = require('node:path');
const {TextDecoder} = require('node:util');
const graph = require('./brain-graph');
const MAX_DOCUMENT_BYTES = 1024 * 1024;

// The message stays the bare code; `ref` carries the brain-relative path for callers to print.
function fault(code, ref) { const e = new Error(code); e.code = code; if (ref !== undefined) e.ref = ref; return e; }
const isFault = e => Boolean(e && e.code && !e.code.startsWith('E'));
const isScratch = name => name.toLowerCase() === 'scratch';
function inside(root, target) {
  const rel = path.relative(root, target);
  return rel === '' || (!path.isAbsolute(rel) && rel !== '..' && !rel.startsWith('..' + path.sep));
}
function createBrain(input) {
  let root;
  try { root = fs.realpathSync(input); if (!fs.statSync(root).isDirectory()) throw 0; }
  catch (_) { throw fault('BRAIN_NOT_FOUND'); }

  function resolve(ref) {
    if (typeof ref !== 'string' || !ref || ref.includes('\\') || ref.includes('\0') || ref.includes(':') ||
        path.isAbsolute(ref) || /^[A-Za-z]:/.test(ref) || ref.split('/').some(p => !p || p === '.' || p === '..' || p.startsWith('.')) ||
        !ref.endsWith('.md') || ref.split('/').some(isScratch)) throw fault('INVALID_REF');
    const candidate = path.resolve(root, ref);
    if (!inside(root, candidate)) throw fault('INVALID_REF');
    try {
      let cursor = root;
      for (const component of ref.split('/')) {
        cursor = path.join(cursor, component);
        if (fs.lstatSync(cursor).isSymbolicLink()) throw fault('SYMLINK_REF');
      }
      const canonical = fs.realpathSync(candidate);
      if (!inside(root, canonical)) throw fault('INVALID_REF');
      if (!fs.statSync(canonical).isFile()) throw fault('NOT_A_DOCUMENT');
      return canonical;
    } catch (e) { if (e.code && !e.code.startsWith('E')) throw e; throw fault('DOCUMENT_UNAVAILABLE'); }
  }
  function read(ref) {
    try { return readChecked(ref); }
    catch (e) { if (isFault(e) && e.ref === undefined && typeof ref === 'string') e.ref = ref; throw e; }
  }
  function readChecked(ref) {
    const canonical = resolve(ref);
    let fd;
    try {
      fd = fs.openSync(canonical, 'r');
      const stat = fs.fstatSync(fd);
      if (!stat.isFile() || stat.size > MAX_DOCUMENT_BYTES) throw fault('DOCUMENT_TOO_LARGE');
      const bytes = fs.readFileSync(fd);
      if (bytes.length > MAX_DOCUMENT_BYTES) throw fault('DOCUMENT_TOO_LARGE');
      let text;
      try { text = new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes); }
      catch (_) { throw fault('DOCUMENT_INVALID_ENCODING'); }
      return { ref, text };
    } catch (e) { if (e.code && !e.code.startsWith('E')) throw e; throw fault('DOCUMENT_UNAVAILABLE'); }
    finally { if (fd !== undefined) fs.closeSync(fd); }
  }
  // Symbolic links (including junctions), unreadable folders and scratch folders are never traversed;
  // they are reported in `skipped` so one bad entry cannot hide the rest of the corpus.
  function walk(prefix) {
    if (typeof prefix !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(prefix)) throw fault('INVALID_REF');
    const refs = [], skipped = [];
    const dir = path.join(root, prefix);
    if (!fs.existsSync(dir)) return { refs, skipped };
    const relative = full => path.relative(root, full).replace(/\\/g, '/');
    function visit(current) {
      let entries;
      try { entries = fs.readdirSync(current, { withFileTypes: true }); }
      catch (_) { skipped.push({ ref: relative(current), reason: 'CORPUS_UNREADABLE' }); return; }
      entries.sort((a,b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue;
        const full = path.join(current, entry.name);
        if (isScratch(entry.name)) { if (entry.isDirectory()) skipped.push({ ref: relative(full), reason: 'EXCLUDED_SCRATCH' }); continue; }
        if (entry.isSymbolicLink()) { skipped.push({ ref: relative(full), reason: 'SYMLINK_REF' }); continue; }
        let real;
        try { real = fs.realpathSync(full); } catch (_) { skipped.push({ ref: relative(full), reason: 'DOCUMENT_UNAVAILABLE' }); continue; }
        if (!inside(root, real)) { skipped.push({ ref: relative(full), reason: 'INVALID_REF' }); continue; }
        if (entry.isDirectory()) visit(full);
        else if (entry.isFile() && entry.name.endsWith('.md')) refs.push(relative(full));
      }
    }
    if (fs.lstatSync(dir).isSymbolicLink()) throw fault('SYMLINK_REF', prefix);
    visit(dir);
    return { refs, skipped };
  }
  function files(prefix = 'knowledge') { return walk(prefix).refs; }
  function readOrSkip(ref, skipped) {
    try { return read(ref); }
    catch (e) { if (!isFault(e)) throw e; skipped.push({ ref, reason: e.code }); return null; }
  }
  const byRef = (a,b) => a.ref < b.ref ? -1 : a.ref > b.ref ? 1 : 0;
  // Readable knowledge nodes plus `skipped: [{ref, reason}]`. On a duplicate basename the
  // first file in walk order keeps the id and the later one is skipped.
  function scan() {
    const { refs, skipped } = walk('knowledge');
    const ids = new Set(), docs = [];
    for (const ref of refs) {
      if (graph.isMocFile(ref)) continue;
      const id = path.posix.basename(ref, '.md').toLowerCase();
      if (ids.has(id)) { skipped.push({ ref, reason: 'DUPLICATE_NODE_ID' }); continue; }
      ids.add(id);
      const doc = readOrSkip(ref, skipped);
      if (doc) docs.push({ ...doc, id, metadata: graph.parseFrontmatterLite(doc.text.split('\n')) || {} });
    }
    return { refs, documents: docs, skipped };
  }
  function corpus() { const { documents: docs, skipped } = scan(); return { documents: docs, skipped: skipped.sort(byRef) }; }
  function documents() { return scan().documents; }
  function status() {
    const { refs, documents: docs, skipped } = scan();
    for (const ref of refs) if (graph.isMocFile(ref)) readOrSkip(ref, skipped);
    skipped.sort(byRef);
    const result = { schema: (graph.parseFrontmatterLite(read('BRAIN.md').text.split('\n')) || {}).schema_version || null,
      nodeCount: docs.length, edgeCount: null, orphanCount: null, mocReachableCount: null,
      source: 'current-files', coreProcedure: 'references/audit.md', skipped, degraded: skipped.length ? 'documents-skipped' : null };
    // The shared graph reader cannot exclude skipped files, so topology is reported only for a clean corpus.
    if (skipped.length) return result;
    const g = graph.buildBrainGraph(root);
    if (g.nodeCount !== docs.length) throw fault('CORPUS_CHANGED');
    return { ...result, edgeCount: g.edgeCount, orphanCount: g.orphanCount, mocReachableCount: g.mocReachableCount };
  }
  read('BRAIN.md'); // An existing directory is not proof of a valid brain install.
  return Object.freeze({ read, files, documents, corpus, status });
}
module.exports = { createBrain, inside, fault, MAX_DOCUMENT_BYTES };
