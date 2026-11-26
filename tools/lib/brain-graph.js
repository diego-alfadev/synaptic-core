'use strict';
// tools/lib/brain-graph.js — Canonical shared edge/degree computation for the Synaptic brain.
//
// THE ONE knowledge-scoped, MOC-excluded edge/degree universe. Imported by BOTH
// tools/check.js (retrieval-readiness report) AND tools/graph.js (force-directed viz),
// and referenced by the /synaptic-audit god-node / surprising-edge heuristics (v1.3.0 §3),
// so check.js and graph.html can NEVER disagree on the topology.
//
// Council binding (v1.2.1-v1.3.0-council-verdict.md, C1 + cross-cutting):
//   - Universe = knowledge/ NON-MOC nodes ONLY (mirrors check.js Check 4 exclusions).
//     No references/raw/, no registries, no references, no synthetic INDEX hub as a NODE.
//   - Edges = frontmatter typed edges (block-list `- "[[t]]"` under
//     relates_to/depends_on/supersedes/contradicts/applies_to/causes/part_of)
//     PLUS body [[wikilinks]] (fence/comment/inline-code stripped).
//   - Resolution: by kebab-case BASENAME of the link target.
//   - MOC/_index.md/INDEX.md/README.md are EXCLUDED as edge sources AND edge targets.
//   - Undirected, deduplicated (sorted-pair key). Self-links dropped. When a pair has both a
//     typed edge and a body wikilink, the undirected entry carries the typed kind.
//   - `edges` is the directed view of the same universe: one entry per (from, to, type), the
//     direction authored in the file. neighbours() computes the inverse from it; files still
//     author one direction only (references/weave.md).
//   - edges-per-node = undirected edgeList.length / nodeCount (NOT degree-sum).
//   - orphanCount = degree-0 knowledge nodes.
//   - mocReachableCount = NET-NEW: reachability from knowledge/INDEX.md + cluster _index.md
//     (mirrors check.js Check 4 reachability), NOT ported from the old graph.js.
//
// Zero dependencies: node:fs, node:path only.

const fs   = require('node:fs');
const path = require('node:path');

// The 7 forward typed-edge keys whose block-list values are authored edges.
// (Inverse forms like required_by/superseded_by/caused_by/has_part are derived by grep,
//  not authored as separate blocks — we read the authored forward direction only, and
//  treat the graph as undirected anyway, so inverses would only duplicate.)
const TYPED_EDGE_KEYS = [
  'relates_to', 'depends_on', 'supersedes',
  'contradicts', 'applies_to', 'causes', 'part_of',
];

// --- filesystem helpers -----------------------------------------------------

/** Walk a directory recursively, returning absolute .md file paths. [] if absent. */
function walkMd(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  (function walk(current) {
    let entries;
    try { entries = fs.readdirSync(current, { withFileTypes: true }); }
    catch (_) { return; }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.md')) results.push(full);
    }
  })(dir);
  return results;
}

function readText(filePath) {
  try { return fs.readFileSync(filePath, 'utf8'); }
  catch (_) { return ''; }
}

function readLines(filePath) {
  return readText(filePath).split('\n');
}

/** MOC / sentinel files: excluded from the node set AND the edge set. */
function isMocFile(filePath) {
  const base = path.basename(filePath).toLowerCase();
  return base === 'index.md' || base === 'readme.md' || base === '_index.md';
}

/** True if file lives under templates/ (any depth) relative to brainRoot. */
function isUnderTemplates(brainRoot, filePath) {
  const rel = path.relative(brainRoot, filePath).replace(/\\/g, '/');
  return rel === 'templates' || rel.startsWith('templates/');
}

// --- parsing helpers --------------------------------------------------------

/**
 * Locate the frontmatter block. Returns { start, end } line indices (end = closing ---),
 * or null when there is no leading `---` fence.
 */
function frontmatterBounds(lines) {
  if (!lines.length || lines[0].trim() !== '---') return null;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') return { start: 0, end: i };
  }
  return null;
}

/**
 * Extract authored frontmatter typed-edge targets (raw link strings, pre-normalisation).
 * Reads block-list items `  - "[[target]]"` under the 7 TYPED_EDGE_KEYS only. Other
 * block lists (e.g. `source:` — plain strings, no [[...]]) yield nothing because we only
 * pick [[...]] tokens out of the item; a source line without [[...]] contributes no edge.
 */
function extractFrontmatterEdges(lines) {
  const bounds = frontmatterBounds(lines);
  if (!bounds) return [];
  const out = [];
  let activeKey = null; // one of TYPED_EDGE_KEYS while collecting its block list

  for (let i = bounds.start + 1; i < bounds.end; i++) {
    const line = lines[i];

    // A full-line YAML comment is a no-op: it is neither a key nor a list item, so it must
    // NOT terminate an open block list. A comment at column 0 would otherwise satisfy the
    // `!/^\s/` block-terminator below and silently DROP the remaining `- "[[…]]"` edges.
    if (/^\s*#/.test(line)) continue;

    // A block-list item under the current key: `  - "[[target]]"` (quotes optional).
    if (activeKey && /^\s+-\s+/.test(line)) {
      for (const m of line.matchAll(/\[\[([^\]]+)\]\]/g)) out.push(m[1].trim());
      continue;
    }
    // A non-indented (or non-list) line ends the current block list.
    if (activeKey && !/^\s/.test(line)) activeKey = null;

    // A new `key:` line. Only the 7 typed-edge keys open an edge block.
    const keyMatch = line.match(/^([\w-]+):\s*(.*)$/);
    if (keyMatch) {
      const key = keyMatch[1];
      const rest = keyMatch[2].trim();
      if (TYPED_EDGE_KEYS.includes(key)) {
        activeKey = key;
        // Inline form on the same line, e.g. relates_to: ["[[a]]", "[[b]]"] or a single [[a]]
        for (const m of rest.matchAll(/\[\[([^\]]+)\]\]/g)) out.push(m[1].trim());
      } else {
        activeKey = null;
      }
    }
  }
  return out;
}

/**
 * Walk prose lines from `startAt`, skipping fenced code blocks (``` / ~~~), inline code spans
 * (`...`), and HTML comment blocks (<!-- ... -->). Mirrors check.js stripNonProse.
 */
function walkProse(lines, startAt, onProse) {
  let inComment = false;
  let inFence = false;

  for (let idx = startAt; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    if (inComment) {
      if (rawLine.includes('-->')) inComment = false;
      continue;
    }
    // Fenced code block toggle.
    if (/^\s*(```|~~~)/.test(rawLine)) { inFence = !inFence; continue; }
    if (inFence) continue;
    // Strip inline code spans — MULTI-backtick first, then single. A ``double-backtick``
    // span (used to quote text that itself contains a backtick, e.g. ``[[x]]``) must be
    // blanked before the single-backtick pass, otherwise `/`[^`]*`/` matches the empty
    // run between the two leading backticks and leaves the [[x]] inside exposed as a
    // FALSE body wikilink. Length-preserving so column offsets stay stable.
    let line = rawLine
      .replace(/``[^`]*``/g, m => ' '.repeat(m.length))
      .replace(/`[^`]*`/g, m => ' '.repeat(m.length));
    if (line.includes('<!--')) {
      if (!line.includes('-->')) {
        onProse(line.slice(0, line.indexOf('<!--')));
        inComment = true;
        continue;
      }
      line = line.replace(/<!--.*?-->/g, '');
    }
    onProse(line);
  }
}

function bodyStart(lines) {
  const bounds = frontmatterBounds(lines);
  return bounds ? bounds.end + 1 : 0; // skip frontmatter — its edges are handled separately
}

/** Extract body [[wikilinks]] (frontmatter, fences, inline code and comments skipped). */
function extractBodyWikilinks(lines) {
  const links = [];
  walkProse(lines, bodyStart(lines), (prose) => {
    for (const m of prose.matchAll(/\[\[([^\]]+)\]\]/g)) links.push(m[1].trim());
  });
  return links;
}

// Inline `[text](target "title")` and `![alt](target)`. Reference-style `[text][ref]` is not parsed.
const MARKDOWN_LINK_RE = /(!?)\[[^\]]*\]\(\s*(<[^>]*>|[^\s)]*)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g;

/** Markdown links in one prose string: [{ raw, image }], raw without its <…> wrapper. */
function extractMarkdownLinks(prose) {
  const out = [];
  for (const m of prose.matchAll(MARKDOWN_LINK_RE)) {
    out.push({ raw: m[2].replace(/^<([\s\S]*)>$/, '$1'), image: m[1] === '!' });
  }
  return out;
}

/** Body Markdown links of a node (frontmatter, fences, inline code and comments skipped). */
function extractBodyMarkdownLinks(lines) {
  const out = [];
  walkProse(lines, bodyStart(lines), (prose) => { out.push(...extractMarkdownLinks(prose)); });
  return out;
}

/**
 * Classify a Markdown link target. null = not a file link (URL, //host, #anchor, empty,
 * placeholder). Otherwise { kind: 'relative' | 'absolute', target } with the #fragment
 * removed and percent-decoding applied.
 */
function classifyMarkdownTarget(raw) {
  const t = String(raw || '').trim();
  if (!t || t.startsWith('#') || t.startsWith('//') || t.includes('{{') || /^[a-z][a-z0-9+.-]*:/i.test(t)) return null;
  let target = t.split('#')[0].replace(/\\/g, '/');
  try { target = decodeURIComponent(target); } catch (_) { /* a stray % stays literal */ }
  if (!target) return null;
  return { kind: target.startsWith('/') ? 'absolute' : 'relative', target };
}

/** Absolute paths a file's non-image relative Markdown links point at (whole file, prose only). */
function markdownLinkTargets(filePath) {
  const set = new Set();
  walkProse(readLines(filePath), 0, (prose) => {
    for (const link of extractMarkdownLinks(prose)) {
      const c = link.image ? null : classifyMarkdownTarget(link.raw);
      if (c && c.kind === 'relative') set.add(path.resolve(path.dirname(filePath), c.target));
    }
  });
  return set;
}

/** True if filePath sits under one of the `exclude` prefixes (posix, segment boundaries) of nodeRoot. */
function isExcludedPath(nodeRoot, exclude, filePath) {
  if (!exclude || !exclude.length) return false;
  const rel = path.relative(nodeRoot, filePath).replace(/\\/g, '/');
  return exclude.some(p => rel === p || rel.startsWith(p + '/'));
}

/** Normalise a wikilink target: strip #anchor and |alias, trim. */
function normLink(raw) {
  return raw.split('#')[0].split('|')[0].trim();
}

/** Resolve a link target to a kebab-case node id: last path segment, no .md. */
function resolveId(target) {
  const t = normLink(target);
  if (!t) return '';
  const base = t.split('/').pop().split('\\').pop();
  return base.replace(/\.md$/i, '');
}

// --- the graph --------------------------------------------------------------

/**
 * Build THE canonical knowledge-scoped, MOC-excluded, undirected edge/degree universe.
 *
 * @param {string} brainRoot absolute path to a .synaptic/ directory (or a node store).
 * @param {{nodeRoot: string, links: string, exclude: string[]}} [manifest] resolved by
 *        tools/lib/brain-manifest.js. Absent → the brain defaults: knowledge/, wikilinks, no exclude.
 *        Passed in rather than resolved here: this file ships alone in runtime bundles.
 * @returns {{
 *   nodes: Array<{id,label,cluster,type,tags,lifecycle,status,filePath}>,
 *   nodeById: Object,
 *   edgeList: Array<{a,b,type}>,      // undirected, deduped; a<b; typed kind wins over 'wikilink'
 *   edges: Array<{from,to,type}>,     // directed, one per (from, to, type)
 *   degreeOf: Object,                 // id -> degree
 *   orphanCount: number,              // degree-0 knowledge nodes
 *   nodeCount: number,
 *   edgeCount: number,
 *   edgesPerNode: number,             // undirected edgeCount / nodeCount
 *   mocReachableCount: number,        // reachable from INDEX/_index MOCs
 *   clusters: string[],               // sorted top-level knowledge/ cluster dir names
 *   unresolvedCount: number           // link tokens that pointed at a non-node
 * }}
 */
function buildBrainGraph(brainRoot, manifest) {
  const knowledgeDir = manifest ? manifest.nodeRoot : path.join(brainRoot, 'knowledge');
  const links = manifest ? manifest.links : 'wikilink';
  const exclude = manifest ? manifest.exclude : [];
  const isStore = !!manifest && manifest.kind === 'store';

  // --- node set: knowledge/ NON-MOC nodes only -----------------------------
  const nodes = [];
  const nodeById = Object.create(null);
  const nodeByPath = new Map();
  const clusterSet = new Set();

  for (const filePath of walkMd(knowledgeDir)) {
    if (!isStore && isUnderTemplates(brainRoot, filePath)) continue;
    if (isMocFile(filePath)) continue;
    if (isExcludedPath(knowledgeDir, exclude, filePath)) continue;

    const id = path.basename(filePath, '.md');
    // cluster = immediate subdir of knowledge/ (top-level grouping); '' if directly in knowledge/
    const rel = path.relative(knowledgeDir, filePath).replace(/\\/g, '/');
    const cluster = rel.includes('/') ? rel.split('/')[0] : '';
    if (cluster) clusterSet.add(cluster);

    const lines = readLines(filePath);
    const fm = parseFrontmatterLite(lines);
    const node = {
      id,
      label: id,
      cluster,
      type: (fm && fm.type) || 'knowledge',
      tags: (fm && Array.isArray(fm.tags)) ? fm.tags : [],
      lifecycle: (fm && fm.lifecycle) || null,
      status: (fm && fm.status) || null,
      filePath,
    };
    // First-wins on duplicate basenames (Check 3 forbids dupes in a clean brain).
    if (!nodeById[id]) { nodes.push(node); nodeById[id] = node; nodeByPath.set(path.resolve(filePath), node); }
  }

  // --- edges: over knowledge non-MOC nodes only ----------------------------
  const edgeByPair = new Map();    // "a|b" canonical key -> undirected entry
  const edgeList = [];             // { a, b, type }
  const directedSet = new Set();   // "from|to|type"
  const edges = [];                // { from, to, type }
  let unresolvedCount = 0;

  for (const node of nodes) {
    const lines = readLines(node.filePath);

    // (1) frontmatter typed edges — carry their edge kind
    const typedTargets = extractFrontmatterEdgesTyped(lines, links);
    for (const { target, kind, path: isPath } of typedTargets) {
      if (isPath) addPathEdge(node, target, kind);
      else addEdge(node.id, target, kind);
    }
    // (2) body links — generic kind; a Markdown link is the same body edge as a wikilink
    if (links !== 'markdown') {
      for (const raw of extractBodyWikilinks(lines)) {
        addEdge(node.id, raw, 'wikilink');
      }
    }
    if (links !== 'wikilink') {
      for (const link of extractBodyMarkdownLinks(lines)) {
        if (!link.image) addPathEdge(node, link.raw, 'wikilink');
      }
    }
  }

  function addPathEdge(fromNode, rawTarget, kind) {
    const c = classifyMarkdownTarget(rawTarget);
    if (!c) return;
    const target = c.kind === 'relative' ? nodeByPath.get(path.resolve(path.dirname(fromNode.filePath), c.target)) : null;
    if (!target) { unresolvedCount++; return; }
    if (target.id === fromNode.id) return;
    addResolvedEdge(fromNode.id, target.id, kind);
  }

  function addEdge(fromId, rawTarget, kind) {
    const targetId = resolveId(rawTarget);
    if (!targetId || targetId === fromId) return;
    if (rawTarget.includes('{{')) return;       // placeholder link
    // Target must be a knowledge non-MOC node (MOC targets excluded by construction —
    // nodeById never contains _index/INDEX/README).
    if (!nodeById[targetId]) { unresolvedCount++; return; }
    addResolvedEdge(fromId, targetId, kind);
  }

  function addResolvedEdge(fromId, targetId, kind) {
    const directedKey = `${fromId}|${targetId}|${kind}`;
    if (!directedSet.has(directedKey)) {
      directedSet.add(directedKey);
      edges.push({ from: fromId, to: targetId, type: kind });
    }
    const [a, b] = [fromId, targetId].sort();
    const key = `${a}|${b}`;
    const existing = edgeByPair.get(key);
    if (existing) {
      if (existing.type === 'wikilink' && kind !== 'wikilink') existing.type = kind;
      return;
    }
    const entry = { a, b, type: kind };
    edgeByPair.set(key, entry);
    edgeList.push(entry);
  }

  // --- degree + orphans -----------------------------------------------------
  const degreeOf = Object.create(null);
  for (const node of nodes) degreeOf[node.id] = 0;
  for (const { a, b } of edgeList) {
    degreeOf[a] = (degreeOf[a] || 0) + 1;
    degreeOf[b] = (degreeOf[b] || 0) + 1;
  }
  const orphanCount = nodes.filter(n => degreeOf[n.id] === 0).length;

  const nodeCount = nodes.length;
  const edgeCount = edgeList.length;
  const edgesPerNode = nodeCount > 0 ? edgeCount / nodeCount : 0;

  // --- MOC-reachable (NET-NEW; mirrors check.js Check 4 reachability) --------
  const mocReachableCount = computeMocReachable(brainRoot, knowledgeDir, nodes, links);

  const clusters = [...clusterSet].sort();

  return {
    nodes, nodeById, edgeList, edges, degreeOf,
    orphanCount, nodeCount, edgeCount, edgesPerNode,
    mocReachableCount, clusters, unresolvedCount,
  };
}

/**
 * Depth-1 neighbours of a node over the directed edges of a built graph.
 * @param {object} g          result of buildBrainGraph
 * @param {string} id         node id (kebab-case basename)
 * @param {{type?: string, direction?: 'in'|'out'|'both'}} [opts] type filters one edge kind
 *        (a typed key or 'wikilink'); direction defaults to 'both'.
 * @returns {Array<{id,type,direction}>} sorted by direction, type, id; 'in' means id is the target.
 */
function neighbours(g, id, opts) {
  const { type = null, direction = 'both' } = opts || {};
  const out = [];
  for (const e of g.edges) {
    if (type && e.type !== type) continue;
    if (e.from === id && (direction === 'out' || direction === 'both')) out.push({ id: e.to, type: e.type, direction: 'out' });
    if (e.to === id && (direction === 'in' || direction === 'both')) out.push({ id: e.from, type: e.type, direction: 'in' });
  }
  return out.sort((x, y) => x.direction.localeCompare(y.direction) || x.type.localeCompare(y.type) || x.id.localeCompare(y.id));
}

/**
 * Typed-edge extraction that also records the edge kind (which of the 7 keys produced it).
 * Same block-list walk as extractFrontmatterEdges but tagged with the active key.
 * `links` is the manifest link mode: [[wikilinks]] are read unless it is 'markdown'; relative
 * `.md` path values (scalar, inline list or block item) are read unless it is 'wikilink' and
 * come back with `path: true`.
 */
function extractFrontmatterEdgesTyped(lines, links) {
  const mode = links || 'wikilink';
  const collect = (text, kind, out) => {
    if (mode !== 'markdown') {
      for (const m of text.matchAll(/\[\[([^\]]+)\]\]/g)) out.push({ target: m[1].trim(), kind });
    }
    if (mode === 'wikilink') return;
    const t = text.trim();
    const items = t.startsWith('[') && !t.startsWith('[[') && t.endsWith(']') ? t.slice(1, -1).split(',') : [t];
    for (const item of items) {
      const v = item.trim().replace(/^["']|["']$/g, '').trim();
      if (v && !v.includes('[[') && /\.md(#.*)?$/i.test(v) && classifyMarkdownTarget(v)) out.push({ target: v, kind, path: true });
    }
  };
  const bounds = frontmatterBounds(lines);
  if (!bounds) return [];
  const out = [];
  let activeKey = null;
  for (let i = bounds.start + 1; i < bounds.end; i++) {
    const line = lines[i];
    // Full-line YAML comment: no-op, must not terminate an open block list (see the twin
    // extractFrontmatterEdges above — a column-0 `#` would otherwise drop remaining edges).
    if (/^\s*#/.test(line)) continue;
    if (activeKey && /^\s+-\s+/.test(line)) {
      collect(line.replace(/^\s+-\s+/, ''), activeKey, out);
      continue;
    }
    if (activeKey && !/^\s/.test(line)) activeKey = null;
    const keyMatch = line.match(/^([\w-]+):\s*(.*)$/);
    if (keyMatch) {
      const key = keyMatch[1];
      const rest = keyMatch[2].trim();
      if (TYPED_EDGE_KEYS.includes(key)) {
        activeKey = key;
        collect(rest, key, out);
      } else {
        activeKey = null;
      }
    }
  }
  return out;
}

/**
 * Count knowledge non-MOC nodes reachable from a MOC: linked from knowledge/INDEX.md,
 * or from their own cluster's _index.md — mirroring check.js Check 4's containment test
 * (`[[stem]]` / `[[stem.md]]`). A node is MOC-reachable if listed in either place.
 */
function computeMocReachable(brainRoot, knowledgeDir, nodes, links) {
  const indexFile = path.join(knowledgeDir, 'INDEX.md');
  const indexText = fs.existsSync(indexFile) ? readText(indexFile) : '';
  const wiki = links !== 'markdown';
  const targetsByMoc = new Map();
  const mdLinked = (mocFile, filePath) => {
    if (links === 'wikilink' || !fs.existsSync(mocFile)) return false;
    if (!targetsByMoc.has(mocFile)) targetsByMoc.set(mocFile, markdownLinkTargets(mocFile));
    return targetsByMoc.get(mocFile).has(path.resolve(filePath));
  };

  let reachable = 0;
  for (const node of nodes) {
    const stem = node.id;
    let found = wiki && (
      indexText.includes(`[[${stem}]]`) ||
      indexText.includes(`[[${stem}.md]]`));
    if (!found) found = mdLinked(indexFile, node.filePath);
    if (!found) {
      // cluster _index.md alongside the node
      const clusterIndexPath = path.join(path.dirname(node.filePath), '_index.md');
      if (wiki && fs.existsSync(clusterIndexPath)) {
        const clusterText = readText(clusterIndexPath);
        found = clusterText.includes(`[[${stem}]]`) ||
                clusterText.includes(`[[${stem}.md]]`);
      }
      if (!found) found = mdLinked(clusterIndexPath, node.filePath);
    }
    if (found) reachable++;
  }
  return reachable;
}

/**
 * Minimal frontmatter parser — scalars, inline lists, block lists — enough for
 * type/tags/lifecycle/status. Same shape as check.js parseFrontmatter (kept aligned).
 */
function parseFrontmatterLite(lines) {
  const bounds = frontmatterBounds(lines);
  if (!bounds) return null;
  const fields = {};
  let currentKey = null;
  let collectingList = false;
  for (let i = bounds.start + 1; i < bounds.end; i++) {
    const line = lines[i];
    // Full-line YAML comment: no-op, must not terminate an open block list.
    if (/^\s*#/.test(line)) continue;
    if (collectingList && /^\s+-\s+/.test(line)) {
      const val = line.replace(/^\s+-\s+/, '').replace(/^["']|["']$/g, '').trim();
      if (!Array.isArray(fields[currentKey])) fields[currentKey] = [];
      fields[currentKey].push(val);
      continue;
    }
    if (collectingList && !/^\s/.test(line)) collectingList = false;
    const match = line.match(/^([\w-]+):\s*(.*)/);
    if (!match) continue;
    const key = match[1];
    const raw = match[2].trim();
    currentKey = key;
    collectingList = false;
    if (raw === '' || raw === '[]') {
      fields[key] = raw === '[]' ? [] : null;
      if (raw === '') collectingList = true;
    } else if (raw.startsWith('[') && raw.endsWith(']')) {
      const inner = raw.slice(1, -1).trim();
      fields[key] = inner ? inner.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')) : [];
    } else {
      fields[key] = raw.replace(/^["']|["']$/g, '').trim();
    }
  }
  return fields;
}

module.exports = {
  TYPED_EDGE_KEYS,
  buildBrainGraph,
  neighbours,
  // exported for reuse / testing
  walkMd,
  isMocFile,
  isUnderTemplates,
  extractBodyWikilinks,
  extractBodyMarkdownLinks,
  extractMarkdownLinks,
  classifyMarkdownTarget,
  markdownLinkTargets,
  isExcludedPath,
  walkProse,
  extractFrontmatterEdges,
  extractFrontmatterEdgesTyped,
  normLink,
  resolveId,
  parseFrontmatterLite,
};
