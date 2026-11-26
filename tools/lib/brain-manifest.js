'use strict';
// tools/lib/brain-manifest.js — what a check.js argument is (a brain or a node store) and its
// manifest keys. A brain's manifest is its BRAIN.md frontmatter; a store's is the frontmatter of
// the INDEX.md that declares `synaptic: store`. The manifest's location is the root, so there is
// no free root path to mis-set.
//
// brain-graph.js must never require this file: it ships without it in runtime bundles
// (tools/vscode-integration.js RUNTIME_FILES), so it receives this result as an argument.
//
// Zero dependencies: node:fs, node:path only.

const fs   = require('node:fs');
const path = require('node:path');

const LINK_MODES = ['wikilink', 'markdown', 'both'];

/**
 * Parse YAML frontmatter from an array of lines.
 * Handles:
 *   - scalar values:  key: value
 *   - inline lists:   tags: [a, b]
 *   - block lists:    tags:\n  - a\n  - b
 * Returns null if no frontmatter found, else an object where list fields are arrays.
 */
function parseFrontmatter(lines) {
  if (!lines.length || lines[0].trim() !== '---') return null;
  let endIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { endIdx = i; break; }
  }
  if (endIdx === -1) return null;

  const fields = {};
  let currentKey = null;
  let collectingList = false;

  for (let i = 1; i < endIdx; i++) {
    const line = lines[i];

    // Full-line YAML comment: a no-op. It is neither a key nor a list item, so it must not
    // terminate an open block list — a column-0 `#` would otherwise satisfy the non-indented
    // terminator below and silently drop the remaining `- item` values from the list.
    if (/^\s*#/.test(line)) continue;

    // Block list item under a previous key
    if (collectingList && /^\s+-\s+/.test(line)) {
      const val = line.replace(/^\s+-\s+/, '').replace(/^["']|["']$/g, '').trim();
      if (!Array.isArray(fields[currentKey])) fields[currentKey] = [];
      fields[currentKey].push(val);
      continue;
    }
    // Any non-indented line stops list collection
    if (collectingList && !/^\s/.test(line)) {
      collectingList = false;
    }

    const match = line.match(/^([\w-]+):\s*(.*)/);
    if (!match) continue;
    const key = match[1];
    const raw = match[2].trim();
    currentKey = key;
    collectingList = false;

    if (raw === '' || raw === '[]') {
      // Empty value or empty inline list — may be a block list start or genuinely empty
      fields[key] = raw === '[]' ? [] : null;
      if (raw === '') collectingList = true;
    } else if (raw.startsWith('[') && raw.endsWith(']')) {
      // Inline list: [a, b, c]
      const inner = raw.slice(1, -1).trim();
      fields[key] = inner
        ? inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, ''))
        : [];
    } else {
      // Scalar value
      fields[key] = raw.replace(/^["']|["']$/g, '').trim();
    }
  }

  return fields;
}

function frontmatterOf(file) {
  if (!fs.existsSync(file)) return null;
  return parseFrontmatter(fs.readFileSync(file, 'utf8').split('\n'));
}

const asList = (v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);

function normalizePrefix(p) {
  return String(p).trim().replace(/\\/g, '/').replace(/^(\.\/)+/, '').replace(/\/+$/, '');
}

/**
 * @param {string} arg the path given to check.js.
 * @returns {{kind: 'brain'|'store', root: string, nodeRoot: string, file: string,
 *   links: 'wikilink'|'markdown'|'both', exclude: string[], evidenceLevels: string[]|null,
 *   problems: Array<{file: string, message: string}>}}
 *   `file` is the manifest file; `problems` are errors for check.js to report.
 */
function resolveManifest(arg) {
  const root = path.resolve(arg);
  const brainFile = path.join(root, 'BRAIN.md');
  const indexFile = path.join(root, 'INDEX.md');
  const hasBrain = fs.existsSync(brainFile);
  const indexFm = frontmatterOf(indexFile);
  const declaresStore = !!indexFm && String(indexFm.synaptic || '').trim() === 'store';
  const kind = declaresStore && !hasBrain ? 'store' : 'brain';
  const file = kind === 'store' ? indexFile : brainFile;
  const fm = (kind === 'store' ? indexFm : frontmatterOf(brainFile)) || {};
  const problems = [];

  // A store's files are merged into every child repository; a BRAIN.md there would boot a second brain.
  if (hasBrain && declaresStore) {
    problems.push({ file: brainFile, message: 'a store must not carry BRAIN.md (INDEX.md declares "synaptic: store"; remove one of the two)' });
  }

  let links = fm.links === undefined || fm.links === null ? 'wikilink' : String(fm.links).trim();
  if (!LINK_MODES.includes(links)) {
    problems.push({ file, message: `invalid links value "${links}" — expected one of ${LINK_MODES.join(' | ')}` });
    links = 'wikilink';
  }

  const exclude = asList(fm.exclude).map(normalizePrefix).filter(p => p && p !== '.');
  const evidenceLevels = fm.evidence_levels === undefined || fm.evidence_levels === null
    ? null
    : asList(fm.evidence_levels).map(v => String(v).trim()).filter(Boolean);

  return {
    kind, root, file,
    nodeRoot: kind === 'store' ? root : path.join(root, 'knowledge'),
    links, exclude, evidenceLevels, problems,
  };
}

module.exports = { LINK_MODES, parseFrontmatter, resolveManifest };
