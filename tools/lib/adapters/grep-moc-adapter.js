'use strict';
// tools/lib/adapters/grep-moc-adapter.js — the DEFAULT, zero-runtime RetrievalPort.
//
// Invariant (2)/(5): this is the guaranteed floor — node stdlib ONLY (node:fs / path),
// no models, no qmd, no npm. It works air-gapped on a locked-down laptop with nothing
// installed. It is the fallback every other adapter degrades to.
//
// What it does (spec qmd-build-vs-adopt.md §3 "L0 floor" + roadmap §3):
//   query(q)  — a lexical scan over knowledge/ NON-MOC .md nodes. Tokenises the query,
//               scores each node by term hits in title + fence-stripped body, applies a
//               small degree boost from the SHARED brain-graph universe, returns
//               best-first with a snippet + a stable {path,startLine,endLine} span.
//   get(id)   — read one node's full text by kebab-case id.
//   multiGet  — read many; unknown ids omitted, input order preserved.
//   status()  — node/edge counts from brain-graph.js (never disagrees with check.js).
//
// Invariant (4): the node set, edge topology, and degree map come from
// tools/lib/brain-graph.js — the ONE knowledge-scoped, MOC-excluded edge/degree
// universe. This adapter does NOT re-walk for edges or recompute degree; it reuses
// buildBrainGraph so retrieval, check.js and graph.js can never disagree on topology.
//
// Fence handling: body text is stripped of fenced code blocks, HTML comments, and
// inline-code spans using the SAME logic as brain-graph.extractBodyWikilinks /
// check.stripNonProse, so "what counts as prose" is identical across the toolchain.

const fs   = require('node:fs');
const path = require('node:path');

const { buildBrainGraph } = require('../brain-graph');

const ADAPTER_ID = 'grep-moc';
const BACKEND_LABEL = 'lexical grep/MOC (zero-runtime, node stdlib only)';

// Query tokens shorter than this are dropped (noise: "a", "of", punctuation). A single
// short token query (e.g. "AI") still works because we keep tokens with length >= 2.
const MIN_TOKEN_LEN = 2;

// Snippet width around the best-matching line.
const SNIPPET_MAX_CHARS = 200;

// Degree boost: a node that is well-connected in the shared graph gets a mild bump so
// hubs surface above equally-lexically-scored leaves. Deliberately SMALL — lexical
// relevance dominates; connectivity only breaks near-ties. boost = 1 + DEGREE_WEIGHT*deg.
const DEGREE_WEIGHT = 0.05;

// ---------------------------------------------------------------------------
// Local helpers (node stdlib only)
// ---------------------------------------------------------------------------

function readTextSafe(filePath) {
  try { return fs.readFileSync(filePath, 'utf8'); }
  catch (_) { return ''; }
}

/** Brain-root-relative POSIX path for a node's absolute file path. */
function relPosix(brainRoot, absPath) {
  return path.relative(brainRoot, absPath).replace(/\\/g, '/');
}

/**
 * Tokenise a query into lowercased alphanumeric terms (length >= MIN_TOKEN_LEN),
 * de-duplicated. Non-alphanumeric characters are separators, matching how the
 * scorer counts hits.
 */
function tokenize(q) {
  if (typeof q !== 'string') return [];
  const seen = new Set();
  const out = [];
  for (const raw of q.toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < MIN_TOKEN_LEN) continue;
    if (seen.has(raw)) continue;
    seen.add(raw);
    out.push(raw);
  }
  return out;
}

/**
 * Produce fence/comment/inline-code-stripped PROSE lines from a file's raw lines,
 * PRESERVING original line numbers (so a span points at the real file line). Stripped
 * regions become '' at their original index rather than being removed.
 *
 * Kept byte-for-byte consistent with brain-graph.extractBodyWikilinks /
 * check.stripNonProse fence handling: fenced blocks (``` / ~~~), HTML comments
 * (<!-- ... -->), and inline code (double-backtick before single) are removed.
 *
 * @returns {string[]} array parallel to `lines`; non-prose positions are ''.
 */
function proseLinesByIndex(lines) {
  const out = new Array(lines.length).fill('');
  let inComment = false;
  let inFence = false;

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    if (inComment) {
      if (rawLine.includes('-->')) inComment = false;
      continue;
    }
    if (/^\s*(```|~~~)/.test(rawLine)) { inFence = !inFence; continue; }
    if (inFence) continue;

    // Blank inline code spans — MULTI-backtick first, then single (length-preserving),
    // identical to the shared path so a ``[[x]]`` style span cannot leak.
    let line = rawLine
      .replace(/``[^`]*``/g, m => ' '.repeat(m.length))
      .replace(/`[^`]*`/g, m => ' '.repeat(m.length));

    if (line.includes('<!--')) {
      if (!line.includes('-->')) {
        out[idx] = line.slice(0, line.indexOf('<!--'));
        inComment = true;
        continue;
      }
      line = line.replace(/<!--.*?-->/g, '');
    }
    out[idx] = line;
  }
  return out;
}

/**
 * Index of the FIRST body line (after a leading `---` … `---` frontmatter block).
 * Returns 0 when there is no frontmatter. Used so title/H1 detection only looks at the
 * body — a YAML `# comment` in frontmatter must never be mistaken for a Markdown H1.
 * (Frontmatter field VALUES stay searchable for scoring; only title detection skips it.)
 */
function bodyStartIndex(lines) {
  if (!lines.length || lines[0].trim() !== '---') return 0;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') return i + 1;
  }
  return 0; // unterminated fence → treat everything as body (defensive)
}

/**
 * Extract a human title for a node: the first `# H1` in the BODY (post-frontmatter),
 * else the first non-empty body prose line, else the node id. Used to weight title hits
 * and to build a readable snippet fallback.
 */
function extractTitle(proseLines, bodyStart, fallbackId) {
  for (let i = bodyStart; i < proseLines.length; i++) {
    const m = proseLines[i].match(/^\s*#\s+(.+?)\s*$/);
    if (m) return m[1].trim();
  }
  for (let i = bodyStart; i < proseLines.length; i++) {
    const t = proseLines[i].trim();
    if (t) return t;
  }
  return fallbackId;
}

/** Count occurrences of `token` as a substring in `haystackLower`. */
function countHits(haystackLower, token) {
  if (!token) return 0;
  let count = 0;
  let from = 0;
  for (;;) {
    const i = haystackLower.indexOf(token, from);
    if (i === -1) break;
    count++;
    from = i + token.length;
  }
  return count;
}

/**
 * Build a single-line snippet + its span for the best-matching prose line.
 * Picks the prose line with the most token hits; ties → earliest line. Returns a
 * {snippet, span:{startLine,endLine}} using 1-based inclusive line numbers.
 */
function bestSnippet(proseLines, tokens, relPath, titleLineHint) {
  let bestIdx = -1;
  let bestHits = 0;
  for (let idx = 0; idx < proseLines.length; idx++) {
    const lower = proseLines[idx].toLowerCase();
    if (!lower.trim()) continue;
    let hits = 0;
    for (const t of tokens) hits += countHits(lower, t);
    if (hits > bestHits) { bestHits = hits; bestIdx = idx; }
  }
  // No body line matched — fall back to the title line (or line 1) so the caller still
  // gets a stable, non-empty citation rather than an empty snippet.
  if (bestIdx === -1) bestIdx = titleLineHint >= 0 ? titleLineHint : 0;

  const line = (proseLines[bestIdx] || '').trim().replace(/\s+/g, ' ');
  const snippet = line.length > SNIPPET_MAX_CHARS
    ? line.slice(0, SNIPPET_MAX_CHARS - 1).trimEnd() + '…' // ellipsis
    : line;

  const oneBased = bestIdx + 1;
  return { snippet, span: { path: relPath, startLine: oneBased, endLine: oneBased } };
}

// ---------------------------------------------------------------------------
// The adapter
// ---------------------------------------------------------------------------

class GrepMocAdapter {
  /**
   * @param {Object} [config]
   * @param {string} [config.brainRoot]  absolute path to the .synaptic brain dir;
   *                                     defaults to './.synaptic' resolved to absolute.
   */
  constructor(config = {}) {
    this.adapter = ADAPTER_ID;
    this.brainRoot = path.resolve(config.brainRoot || './.synaptic');
    // Lazily built + cached graph (node universe + degree map). Built on first use so a
    // status()-only or get()-only caller pays only for what it uses.
    this._graph = null;
  }

  /** Build (once) and return the shared brain graph. Degrades to an empty graph. */
  _g() {
    if (this._graph) return this._graph;
    try {
      this._graph = buildBrainGraph(this.brainRoot);
    } catch (_) {
      this._graph = {
        nodes: [], nodeById: Object.create(null), edgeList: [],
        degreeOf: Object.create(null), orphanCount: 0, nodeCount: 0,
        edgeCount: 0, edgesPerNode: 0, mocReachableCount: 0,
        clusters: [], unresolvedCount: 0,
      };
    }
    return this._graph;
  }

  /**
   * Lexical ranked retrieval over knowledge/ non-MOC nodes.
   * @param {string} q
   * @param {import('../retrieval-port').QueryOptions} [opts]
   * @returns {Promise<import('../retrieval-port').RetrievalResult[]>}
   */
  async query(q, opts = {}) {
    const tokens = tokenize(q);
    // Empty / blank / all-stopword query → no results (never throw). Spec: query returns
    // [] for an empty query.
    if (tokens.length === 0) return [];

    const limit    = Number.isFinite(opts.limit) && opts.limit > 0 ? Math.floor(opts.limit) : 10;
    const minScore = Number.isFinite(opts.minScore) ? opts.minScore : 0;
    const collections = Array.isArray(opts.collections) && opts.collections.length
      ? new Set(opts.collections)
      : null;
    // ftsOnly / rerank are no-ops for the always-lexical grep/MOC adapter (no models);
    // accepted for interface parity so a caller can pass the same opts to any adapter.

    const g = this._g();
    const scored = [];

    for (const node of g.nodes) {
      // Collection (top-level cluster) filter.
      if (collections && !collections.has(node.cluster)) continue;

      const lines = readTextSafe(node.filePath).split('\n');
      const proseLines = proseLinesByIndex(lines);
      const bodyStart = bodyStartIndex(lines);

      // Title line index (for snippet fallback) + title text (weighted hits). Scan the
      // BODY only for the H1 so a YAML `# comment` in frontmatter is not taken as title.
      let titleLineHint = -1;
      for (let i = bodyStart; i < proseLines.length; i++) {
        if (/^\s*#\s+/.test(proseLines[i])) { titleLineHint = i; break; }
      }
      const title = extractTitle(proseLines, bodyStart, node.id);
      const titleLower = title.toLowerCase();
      const idLower    = node.id.toLowerCase();     // kebab-case identity is searchable text too
      const bodyLower  = proseLines.join('\n').toLowerCase();

      // Score = weighted term hits. A hit in the title or the kebab-case id is worth
      // more than a body hit (the node is "about" that term). Requiring at least one
      // token to appear anywhere keeps zero-hit nodes out of the result set.
      let raw = 0;
      let matchedTokens = 0;
      for (const t of tokens) {
        const bodyHits  = countHits(bodyLower, t);
        const titleHits = countHits(titleLower, t) + countHits(idLower, t);
        if (bodyHits > 0 || titleHits > 0) matchedTokens++;
        raw += bodyHits * 1 + titleHits * 3;
      }
      if (raw === 0) continue; // node is irrelevant to every query token

      // Coverage bonus: reward nodes that match MORE of the distinct query tokens
      // (an AND-leaning signal without hard-requiring all tokens).
      const coverage = matchedTokens / tokens.length; // (0, 1]
      const degree   = g.degreeOf[node.id] || 0;
      const degreeBoost = 1 + DEGREE_WEIGHT * degree;

      const score = raw * (0.5 + 0.5 * coverage) * degreeBoost;
      if (score <= minScore) continue;

      const relPath = relPosix(this.brainRoot, node.filePath);
      const { snippet, span } = bestSnippet(proseLines, tokens, relPath, titleLineHint);

      scored.push({ id: node.id, path: relPath, score, snippet, span });
    }

    // Best-first; stable tiebreak on id so ordering is deterministic across runs
    // (important for CI / before-after comparison — matches graph.js's determinism goal).
    scored.sort((a, b) => (b.score - a.score) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    return scored.slice(0, limit);
  }

  /**
   * Fetch one node's full text by stable kebab-case id.
   * @param {string} id
   * @returns {Promise<import('../retrieval-port').RetrievalDoc|null>}
   */
  async get(id) {
    if (!id || typeof id !== 'string') return null;
    const g = this._g();
    const node = g.nodeById[id];
    if (!node) return null;
    return {
      id: node.id,
      path: relPosix(this.brainRoot, node.filePath),
      text: readTextSafe(node.filePath),
    };
  }

  /**
   * Fetch many nodes by id. Unknown ids are omitted; input order is preserved for the
   * ids that resolved.
   * @param {string[]} ids
   * @returns {Promise<import('../retrieval-port').RetrievalDoc[]>}
   */
  async multiGet(ids) {
    if (!Array.isArray(ids)) return [];
    const out = [];
    for (const id of ids) {
      const doc = await this.get(id);
      if (doc) out.push(doc);
    }
    return out;
  }

  /**
   * Index/adapter health. Never throws — degrades to zeros on a missing/empty brain.
   * Counts come from the shared brain-graph universe (invariant 4).
   * @returns {Promise<import('../retrieval-port').RetrievalStatus>}
   */
  async status() {
    const g = this._g();
    return {
      nodeCount: g.nodeCount,
      edgeCount: g.edgeCount,
      indexed: g.nodeCount > 0,
      adapter: ADAPTER_ID,
      backend: BACKEND_LABEL,
    };
  }
}

module.exports = GrepMocAdapter;
