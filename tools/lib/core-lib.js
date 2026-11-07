'use strict';
// Deterministic CORE facade. Sources: references/contract.md §§1-4 and audit.md.
// No SQLite/MCP import: direct file access remains independent of accelerators.
const fs = require('node:fs');
const path = require('node:path');
const {TextDecoder} = require('node:util');
const graph = require('./brain-graph');
const MAX_DOCUMENT_BYTES = 1024 * 1024;

function fault(code) { const e = new Error(code); e.code = code; return e; }
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
        !ref.endsWith('.md') || ref.split('/').includes('scratch')) throw fault('INVALID_REF');
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
  // Reject symbolic links, including junctions; do not silently traverse another corpus.
  function files(prefix = 'knowledge') {
    if (typeof prefix !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]*$/.test(prefix)) throw fault('INVALID_REF');
    const result = [];
    const dir = path.join(root, prefix);
    if (!fs.existsSync(dir)) return result;
    function walk(current) {
      let entries;
      try { entries = fs.readdirSync(current, { withFileTypes: true }); }
      catch (_) { throw fault('CORPUS_UNREADABLE'); }
      entries.sort((a,b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'scratch') continue;
        const full = path.join(current, entry.name);
        if (entry.isSymbolicLink()) throw fault('SYMLINK_REF');
        if (!inside(root, fs.realpathSync(full))) throw fault('INVALID_REF');
        if (entry.isDirectory()) walk(full);
        else if (entry.isFile() && entry.name.endsWith('.md')) result.push(path.relative(root, full).replace(/\\/g, '/'));
      }
    }
    if (fs.lstatSync(dir).isSymbolicLink()) throw fault('SYMLINK_REF');
    walk(dir);
    return result;
  }
  function documents() {
    const ids = new Set();
    return files().filter(ref => !graph.isMocFile(ref)).map(ref => {
      const id = path.posix.basename(ref, '.md').toLowerCase();
      if (ids.has(id)) throw fault('DUPLICATE_NODE_ID');
      ids.add(id);
      const doc = read(ref);
      const metadata = graph.parseFrontmatterLite(doc.text.split('\n')) || {};
      return { ...doc, id, metadata };
    });
  }
  function status() {
    // Validate every file before using the existing shared graph's filesystem reader.
    const docs = documents();
    for (const ref of files()) read(ref);
    const g = graph.buildBrainGraph(root);
    if (g.nodeCount !== docs.length) throw fault('CORPUS_CHANGED');
    return { schema: (graph.parseFrontmatterLite(read('BRAIN.md').text.split('\n')) || {}).schema_version || null,
      nodeCount: docs.length, edgeCount: g.edgeCount, orphanCount: g.orphanCount,
      mocReachableCount: g.mocReachableCount, source: 'current-files', coreProcedure: 'references/audit.md' };
  }
  read('BRAIN.md'); // An existing directory is not proof of a valid brain install.
  return Object.freeze({ read, files, documents, status });
}
module.exports = { createBrain, inside, fault, MAX_DOCUMENT_BYTES };
