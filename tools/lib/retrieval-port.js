'use strict';
// tools/lib/retrieval-port.js — the Cortex RetrievalPort contract + adapter factory.
//
// This is the OPTIONAL Cortex / TOOLS layer's retrieval seam (spec: strategy/specs/
// qmd-build-vs-adopt.md §8 item 3; roadmap: strategy/cortex-roadmap.md §2 hexagonal,
// §2.3 accelerator-never-dependency, §3 tiers). It defines ONE port — a written
// interface in OUR terms — behind which any number of retrieval adapters may live.
//
// ── Binding invariants this file encodes ────────────────────────────────────
//  (1) CORE never depends on this layer. The brain stays fully file-operable with
//      Cortex absent — this module is only ever reached from the TOOLS surface
//      (tools/cortex.js), never from the markdown contract / prose-CORE path.
//  (2) The DEFAULT adapter is the zero-runtime grep/MOC one: node stdlib only, no
//      models, no qmd, works air-gapped. `createRetrieval()` with no/unknown
//      `adapter` selects it.
//  (3) QMD is HIDDEN behind this port and OPTIONAL. Requesting `adapter: 'qmd'`
//      when qmd is unavailable falls back to grep/MOC gracefully — never crashes.
//  (4) Edge/degree topology comes from the shared tools/lib/brain-graph.js universe
//      (adapters import it; this file does not duplicate any edge logic).
//
// The port intentionally mirrors QMD's minimal read-side MCP surface
// (query / get / multi_get / status — spec F12) so a future QmdAdapter is mostly
// translation, and so the two adapters are interchangeable (LSP): a caller cannot
// tell which one served a result. That is the whole point of "accelerator, never
// dependency" — the consumer talks to the port, not to an engine.
//
// Zero dependencies: node stdlib only. This file itself imports no adapter eagerly
// beyond the always-present default; optional adapters are require()'d lazily inside
// the factory so their (heavier) transitive surface never loads unless selected.

// ---------------------------------------------------------------------------
// Typedefs — the contract, in our terms (JSDoc; no runtime cost)
// ---------------------------------------------------------------------------

/**
 * A single retrieval hit. Stable, adapter-independent shape — every adapter MUST
 * return results in exactly this form so callers are engine-agnostic.
 *
 * @typedef {Object} RetrievalResult
 * @property {string} id       Stable node identity = the node's kebab-case basename
 *                             (NO extension), matching brain-graph.js `resolveId`.
 *                             This is the brain's identity model (cortex-roadmap §6:
 *                             "stable identifier = the node's kebab-case filename").
 * @property {string} path     Brain-root-relative POSIX path to the source .md file
 *                             (e.g. "knowledge/synaptic/cortex-scope.md").
 * @property {number} score    Relevance score, higher = better. Range is
 *                             adapter-defined and NOT comparable across adapters;
 *                             only the ordering within one result set is meaningful.
 * @property {string} snippet  A short human-readable excerpt around the best match
 *                             (fence-stripped, single-line, trimmed).
 * @property {Span}   span     Where in the file the snippet came from (stable address).
 */

/**
 * A stable citation address into a source file — path + inclusive 1-based line range.
 * Aligns with QMD's path + line-range addressing (spec F14) so a QmdAdapter can map
 * onto the same shape.
 *
 * @typedef {Object} Span
 * @property {string} path       Brain-root-relative POSIX path (same as RetrievalResult.path).
 * @property {number} startLine  1-based inclusive first line of the cited region.
 * @property {number} endLine    1-based inclusive last line of the cited region.
 */

/**
 * A full node fetched by id — the whole document body, for a caller that has a hit
 * and now wants the source. Mirrors QMD `get` (spec F12).
 *
 * @typedef {Object} RetrievalDoc
 * @property {string} id    Stable kebab-case node id (as RetrievalResult.id).
 * @property {string} path  Brain-root-relative POSIX path.
 * @property {string} text  Full UTF-8 file contents. '' if the file could not be read.
 */

/**
 * Index / adapter health. Mirrors QMD `status` (spec F12): index-health + which
 * backend is serving. `nodeCount`/`edgeCount` come from the shared brain-graph
 * universe so `status()` never disagrees with check.js / graph.js on topology.
 *
 * @typedef {Object} RetrievalStatus
 * @property {number}  nodeCount  Knowledge non-MOC node count (brain-graph.js).
 * @property {number}  edgeCount  Undirected deduped edge count (brain-graph.js).
 * @property {boolean} indexed    Whether a usable index/corpus is present (for the
 *                                grep/MOC adapter this is "≥1 node found").
 * @property {string}  adapter    The selected adapter id ('grep-moc' | 'qmd' | …).
 * @property {string}  backend    Human label for the serving engine
 *                                (e.g. "lexical grep/MOC (zero-runtime)").
 */

/**
 * Options for a query. All optional; adapters MUST tolerate an empty options object
 * and apply the documented defaults.
 *
 * @typedef {Object} QueryOptions
 * @property {number}  [limit=10]        Max results to return (>0).
 * @property {number}  [minScore=0]      Drop results scoring at or below this.
 * @property {boolean} [ftsOnly=false]   Keyword/lexical only — forbid the semantic
 *                                       path. The grep/MOC adapter is ALWAYS lexical,
 *                                       so this is a no-op for it; a QmdAdapter maps it
 *                                       to `qmd search` (BM25, zero models — spec F10).
 * @property {boolean} [rerank=false]    Ask for cross-encoder reranking if the adapter
 *                                       supports it. The grep/MOC adapter ignores it
 *                                       (no models). Ignored entirely when ftsOnly.
 * @property {string[]} [collections]    Restrict to these top-level knowledge/ cluster
 *                                       names (brain-graph `cluster`). Empty/absent = all.
 */

/**
 * The RetrievalPort contract. Every adapter is duck-typed against this: the factory
 * returns an object exposing exactly these four methods with these semantics.
 *
 * @typedef {Object} RetrievalPort
 * @property {(q: string, opts?: QueryOptions) => Promise<RetrievalResult[]>} query
 *   Rank nodes by relevance to `q`. Returns [] for an empty/blank query or an empty
 *   brain — NEVER throws for "no results". Ordering is best-first.
 * @property {(id: string) => Promise<(RetrievalDoc|null)>} get
 *   Fetch one node's full text by stable id. Resolves to null if unknown.
 * @property {(ids: string[]) => Promise<RetrievalDoc[]>} multiGet
 *   Fetch many; unknown ids are omitted (result length ≤ ids.length). Order follows
 *   the input order for the ids that resolved.
 * @property {() => Promise<RetrievalStatus>} status
 *   Report index/adapter health. NEVER throws — degrades to zeros on a missing brain.
 */

// ---------------------------------------------------------------------------
// Adapter registry + factory
// ---------------------------------------------------------------------------

/** The default adapter id — the zero-runtime lexical floor. Invariant (2). */
const DEFAULT_ADAPTER = 'grep-moc';

/**
 * Known adapter ids. `grep-moc` is always available (node stdlib only). `qmd` is
 * OPTIONAL — it may not be installed; the factory probes and falls back.
 */
const ADAPTERS = ['grep-moc', 'qmd'];

/**
 * Select and construct a RetrievalPort implementation.
 *
 * Selection rules (encode invariants 2 + 3):
 *   - `config.adapter === 'grep-moc'` (or absent / unknown) → GrepMocAdapter (DEFAULT).
 *   - `config.adapter === 'qmd'` → attempt the OPTIONAL QmdAdapter; if it is absent or
 *     its capability probe fails (qmd not on PATH / module not present), silently fall
 *     back to GrepMocAdapter. Requesting qmd NEVER crashes when qmd is unavailable.
 *
 * The returned object also exposes a read-only `adapter` string (the id that actually
 * served, AFTER any fallback) so the CLI/caller can report what happened.
 *
 * @param {Object}  [config]                Adapter configuration.
 * @param {string}  [config.adapter]        'grep-moc' (default) | 'qmd'.
 * @param {string}  [config.brainRoot]      Absolute path to the .synaptic brain dir.
 *                                          Defaults to './.synaptic' resolved by the adapter.
 * @param {Function}[config.onFallback]     Optional callback(reason:string) invoked when a
 *                                          requested optional adapter degrades to grep/MOC.
 * @returns {RetrievalPort & {adapter: string}}
 */
function createRetrieval(config = {}) {
  const requested = config.adapter || DEFAULT_ADAPTER;

  // Anything that is not a KNOWN optional adapter resolves to the default. Unknown
  // ids never error — they degrade (invariant 3, generalised).
  if (requested === 'qmd') {
    const qmd = tryCreateQmd(config);
    if (qmd) return qmd;
    if (typeof config.onFallback === 'function') {
      config.onFallback('qmd adapter unavailable (not installed / not on PATH) — using grep/MOC');
    }
    // fall through to the default
  } else if (requested !== DEFAULT_ADAPTER) {
    if (typeof config.onFallback === 'function') {
      config.onFallback(`unknown adapter "${requested}" — using grep/MOC`);
    }
  }

  const GrepMocAdapter = require('./adapters/grep-moc-adapter');
  return new GrepMocAdapter(config);
}

/**
 * Attempt to construct the OPTIONAL QmdAdapter. Returns null (never throws) if:
 *   - the adapter module is not present in this build, OR
 *   - it is present but its capability probe reports qmd is unavailable.
 *
 * The module and its (heavier) surface are require()'d LAZILY here so that a build
 * without qmd — the common, air-gapped case — never loads any qmd-facing code and the
 * default path stays node-stdlib-only (invariants 2 + 3).
 *
 * NOTE (Step 1 spike): the QmdAdapter is intentionally NOT authored yet. This probe is
 * the seam that a later step drops it into; today it always returns null, which is the
 * correct, safe behaviour — `--adapter qmd` cleanly degrades to grep/MOC.
 *
 * @param {Object} config
 * @returns {(RetrievalPort & {adapter: string}) | null}
 */
function tryCreateQmd(config) {
  let QmdAdapter;
  try {
    // Guarded require: absence is expected and fine. Kept as a dynamic path so bundlers
    // / linters do not treat the optional adapter as a hard dependency of this layer.
    QmdAdapter = require('./adapters/qmd-adapter');
  } catch (_) {
    return null; // module not shipped in this build → optional path simply absent
  }
  try {
    // The adapter owns its own capability probe (is `qmd` on PATH? is the index built?).
    // If it cannot serve, it returns a falsy `available`, and we fall back.
    if (typeof QmdAdapter.isAvailable === 'function' && !QmdAdapter.isAvailable(config)) {
      return null;
    }
    return new QmdAdapter(config);
  } catch (_) {
    return null; // any construction/probe failure → graceful fallback, never crash
  }
}

module.exports = {
  DEFAULT_ADAPTER,
  ADAPTERS,
  createRetrieval,
};
