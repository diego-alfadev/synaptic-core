'use strict';
// tools/lib/adapters/qmd-adapter.js — the OPTIONAL, HIDDEN QMD RetrievalPort adapter.
//
// ── This is decision OPTION (c) from strategy/specs/qmd-build-vs-adopt.md §4/§6 ──
// QMD (`@tobilu/qmd`, MIT — spec F1) is WRAPPED behind our RetrievalPort as ONE optional
// adapter among others. It is NEVER a CORE dependency and NEVER imported by the domain /
// prose-CORE path. The brain stays fully file-operable with qmd absent: if qmd is not
// installed / not on PATH, this adapter reports itself UNAVAILABLE and the factory
// (tools/lib/retrieval-port.js) silently falls back to the zero-runtime grep/MOC adapter.
// This adapter is deliberately swappable for our own (b) core-lib later (§6 fallback) —
// callers depend on the port, not on qmd. That is "accelerator, never dependency" (§2.3).
//
// ── Binding invariants this file honours ─────────────────────────────────────
//  (1) CORE never depends on this layer — this module is only ever require()'d LAZILY by
//      the factory when `adapter:'qmd'` is explicitly requested; a default/air-gapped run
//      never loads it.
//  (2) The DEFAULT adapter is grep/MOC. This adapter does NOT replace it; it augments it,
//      and DELEGATES to a private grep/MOC instance for everything qmd cannot serve
//      cleanly (get/multiGet/status topology, and query-fallback when a qmd call fails).
//  (3) QMD is HIDDEN + OPTIONAL: construction NEVER throws on a missing qmd. `available()`
//      + the static `isAvailable(config)` probe let the factory degrade gracefully.
//  (4) Edge/degree topology is NOT recomputed here — the delegated grep/MOC adapter owns
//      it via the shared tools/lib/brain-graph.js universe, so status() can never disagree
//      with check.js / graph.js on node/edge counts.
//  (6) All qmd invocations shell out with child_process + an ARGV ARRAY (never a shell
//      string), so a query / path can never be interpreted as a shell command (injection-safe).
//
// ── Retrieval-tier mapping (spec §3, F10) ────────────────────────────────────
//   query({ftsOnly:true})  → `qmd search`  = BM25/FTS5, ZERO models    (the LIGHT tier, T2)
//   query() default        → `qmd query`   = BM25 + sqlite-vec + RRF   (the ROBUST tier, T3)
//                            (+ optional `qwen3-reranker-0.6b` when rerank:true — spec F8)
//   get(id) / multi_get     → qmd `get` / `multi-get` where sensible, else grep/MOC delegate.
//   status()                → node/edge counts from grep/MOC (shared graph); backend label
//                             reflects qmd + whether the sidecar index is present.
//
// Zero *new* dependencies: node stdlib only (node:child_process / fs / path). qmd itself is
// reached as an EXTERNAL process — we never `require('@tobilu/qmd')` into our address space
// (its ~2 GB models + native node-llama-cpp runtime must stay out of the CORE path, spec F9).

const cp   = require('node:child_process');
const fs   = require('node:fs');
const path = require('node:path');

const GrepMocAdapter = require('./grep-moc-adapter');

const ADAPTER_ID = 'qmd';

// The qmd package name (spec F2) — probed only to detect presence; never require()'d.
const QMD_PACKAGE = '@tobilu/qmd';

// How long we let a single qmd invocation run before giving up and degrading. A hung /
// model-downloading qmd must never wedge a retrieval call — we bound it and fall back.
const QMD_TIMEOUT_MS = 60_000;

// Cap the bytes we read from qmd's stdout so a pathological index can't OOM us.
const QMD_MAX_BUFFER = 32 * 1024 * 1024; // 32 MiB

// ---------------------------------------------------------------------------
// Capability probe (module-level, cached) — invariant (3)
// ---------------------------------------------------------------------------
//
// `qmd` is "usable" if EITHER a `qmd` binary answers on PATH, OR the `@tobilu/qmd` package
// resolves from here (a local/global install we could `npx`/node-run). We probe the binary
// with an ARGV ARRAY (`spawnSync('qmd', ['--version'])`, invariant 6) and never through a
// shell. The probe result is cached per-process so repeated construction is cheap; a caller
// that installs qmd mid-process is an accepted non-case for a spike.

let _probeCache = null; // { binary: string|null, pkgResolved: boolean, usable: boolean }

/** Try to resolve the qmd package from this module's resolution paths. Never throws. */
function qmdPackageResolves() {
  try {
    require.resolve(QMD_PACKAGE);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Probe whether a `qmd` binary responds to `--version`. Uses spawnSync with an ARGV ARRAY
 * and shell:false (default) — invariant (6), injection-safe. Returns the binary name that
 * answered ('qmd') or null. Any spawn error (ENOENT, timeout) → null (not usable).
 */
function qmdBinaryOnPath() {
  try {
    const r = cp.spawnSync('qmd', ['--version'], {
      timeout: 5_000,
      stdio: ['ignore', 'pipe', 'ignore'],
      windowsHide: true,
      // shell:false is the default — NEVER pass shell:true (would reintroduce injection).
    });
    // Require a clean exit (status 0, no spawn error). A null status means the process was
    // killed (e.g. timeout) — treat that as NOT usable rather than guessing.
    if (r && r.error == null && r.status === 0) return 'qmd';
  } catch (_) { /* fall through → not usable */ }
  return null;
}

/** Compute (and cache) the probe. Never throws. */
function probe() {
  if (_probeCache) return _probeCache;
  const binary = qmdBinaryOnPath();
  const pkgResolved = binary ? true : qmdPackageResolves();
  // Usable iff we have a way to INVOKE qmd. A resolvable package without a binary is only
  // usable if we can run it via node; for the spike we treat binary-on-PATH as the reliable
  // invocation path and mark package-only installs usable but routed through `npx qmd`.
  _probeCache = { binary, pkgResolved, usable: Boolean(binary) || pkgResolved };
  return _probeCache;
}

/** Test-only / defensive: allow the probe cache to be reset (not used in normal flow). */
function _resetProbeCache() { _probeCache = null; }

// ---------------------------------------------------------------------------
// Invocation helpers — ARGV ARRAY only (invariant 6)
// ---------------------------------------------------------------------------

/**
 * Build the [command, args[]] pair to invoke qmd, preferring a real `qmd` binary and
 * falling back to `npx --no-install @tobilu/qmd` when only the package resolves. The
 * returned args are a PLAIN ARRAY — the caller passes them straight to spawnSync without
 * any shell, so no element can be reinterpreted as a shell token (invariant 6).
 *
 * @param {string[]} qmdArgs  the qmd sub-args, e.g. ['search', q, '--json'].
 * @returns {{cmd:string, argv:string[]}|null} null if qmd is not invokable.
 */
function qmdInvocation(qmdArgs) {
  const p = probe();
  if (p.binary) return { cmd: p.binary, argv: qmdArgs };
  if (p.pkgResolved) {
    // `npx --no-install` runs the locally-resolvable package WITHOUT triggering a network
    // fetch — if it is not actually installed, npx fails fast and we degrade. Still an
    // ARGV ARRAY (no shell): `npx --no-install @tobilu/qmd <qmdArgs...>`.
    return { cmd: 'npx', argv: ['--no-install', QMD_PACKAGE, ...qmdArgs] };
  }
  return null;
}

/**
 * Run qmd once, capturing stdout. Returns { ok, stdout, code, error }. NEVER throws — a
 * spawn failure/timeout surfaces as { ok:false } so the caller can degrade to grep/MOC.
 * All args go through as an ARGV ARRAY with shell disabled (invariant 6).
 *
 * @param {string[]} qmdArgs
 * @param {{cwd?:string}} [opts]
 */
function runQmd(qmdArgs, opts = {}) {
  const inv = qmdInvocation(qmdArgs);
  if (!inv) return { ok: false, stdout: '', code: null, error: new Error('qmd not invokable') };
  try {
    const r = cp.spawnSync(inv.cmd, inv.argv, {
      cwd: opts.cwd || undefined,
      timeout: QMD_TIMEOUT_MS,
      maxBuffer: QMD_MAX_BUFFER,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      // shell defaults to false — do NOT enable it (injection-safe, invariant 6).
    });
    if (r.error) return { ok: false, stdout: '', code: r.status, error: r.error };
    return { ok: r.status === 0, stdout: r.stdout || '', code: r.status, error: null };
  } catch (e) {
    return { ok: false, stdout: '', code: null, error: e };
  }
}

/** Parse qmd JSON stdout tolerantly. qmd may emit an array or an object with a hits field. */
function parseQmdHits(stdout) {
  if (!stdout || !stdout.trim()) return [];
  let data;
  try { data = JSON.parse(stdout); }
  catch (_) {
    // Some qmd builds may print a leading log line before the JSON. Try to salvage the
    // first well-formed top-level JSON array/object substring; if that fails, give up.
    const start = stdout.search(/[[{]/);
    if (start === -1) return [];
    try { data = JSON.parse(stdout.slice(start)); }
    catch (_) { return []; }
  }
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    for (const key of ['hits', 'results', 'matches', 'documents']) {
      if (Array.isArray(data[key])) return data[key];
    }
  }
  return [];
}

// ---------------------------------------------------------------------------
// Field mapping — qmd hit → our RetrievalResult { id, path, score, snippet, span }
// ---------------------------------------------------------------------------

/** First defined value among the candidate keys of `obj`. */
function pick(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] != null) return obj[k];
  }
  return undefined;
}

/** kebab-case node id from a file path (matches brain-graph.resolveId identity model). */
function idFromPath(p) {
  if (!p || typeof p !== 'string') return '';
  const base = p.split('/').pop().split('\\').pop();
  return base.replace(/\.md$/i, '');
}

/** Brain-root-relative POSIX path for an absolute-or-relative qmd path. */
function toRelPosix(brainRoot, p) {
  if (!p) return '';
  const posix = String(p).replace(/\\/g, '/');
  if (!path.isAbsolute(p)) return posix; // qmd may already return a relative path
  return path.relative(brainRoot, p).replace(/\\/g, '/');
}

/** Single-line, trimmed, whitespace-collapsed snippet (mirrors grep/MOC snippet shape). */
function cleanSnippet(s) {
  if (s == null) return '';
  return String(s).replace(/\r?\n/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Map one raw qmd hit onto our stable RetrievalResult. qmd's exact field names vary across
 * the 2.x line (spec §9 upstream-velocity risk), so we read a set of likely aliases and
 * normalise. Returns null for a hit we cannot anchor to a path/id (skipped, not fatal).
 *
 * qmd addressing (spec F14): 6-char hash docid (`#abc123`) + path + line range. We prefer
 * the PATH-derived kebab id so results share identity with the rest of the toolchain; the
 * docid is retained only as a last-resort id.
 */
function mapHit(brainRoot, hit) {
  if (!hit || typeof hit !== 'object') return null;

  const rawPath = pick(hit, ['path', 'file', 'filepath', 'filePath', 'document', 'source']);
  const relPath = toRelPosix(brainRoot, rawPath);

  // id: prefer path-derived kebab (shared identity), else an explicit id/docid field.
  let id = idFromPath(rawPath);
  if (!id) {
    const docid = pick(hit, ['id', 'docid', 'docId', 'hash']);
    id = docid != null ? String(docid).replace(/^#/, '') : '';
  }
  if (!id && !relPath) return null; // cannot anchor this hit at all

  const rawScore = pick(hit, ['score', 'rank', 'relevance', 'rrf', '_score']);
  const score = Number.isFinite(Number(rawScore)) ? Number(rawScore) : 0;

  const snippet = cleanSnippet(pick(hit, ['snippet', 'excerpt', 'text', 'context', 'preview']));

  // span: qmd carries a line range (F14). Accept several shapes; default to a 1-line span
  // (or 0 when unknown, which the CLI renders harmlessly). endLine defaults to startLine.
  const startLine = toInt(pick(hit, ['startLine', 'start_line', 'line', 'lineStart', 'from']), 1);
  const endLine   = toInt(pick(hit, ['endLine', 'end_line', 'lineEnd', 'to']), startLine);

  return {
    id,
    path: relPath,
    score,
    snippet,
    span: { path: relPath, startLine, endLine: endLine >= startLine ? endLine : startLine },
  };
}

/** Parse to a finite integer, else the supplied default. */
function toInt(v, dflt) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : dflt;
}

// ---------------------------------------------------------------------------
// The adapter
// ---------------------------------------------------------------------------

class QmdAdapter {
  /**
   * Static capability probe used by the factory BEFORE construction (retrieval-port.js
   * `tryCreateQmd`). Returns false when qmd is unavailable so the factory falls back to
   * grep/MOC without ever constructing this adapter. Never throws (invariant 3).
   *
   * @param {Object} [_config] unused today; present for signature parity / future gating.
   * @returns {boolean}
   */
  static isAvailable(_config) {
    try { return probe().usable; }
    catch (_) { return false; }
  }

  /**
   * @param {Object} [config]
   * @param {string} [config.brainRoot]  absolute path to the .synaptic brain dir.
   * @param {boolean}[config.rerank]     default rerank preference for semantic queries.
   */
  constructor(config = {}) {
    this.adapter = ADAPTER_ID;
    this.brainRoot = path.resolve(config.brainRoot || './.synaptic');
    this._config = config;
    // Private grep/MOC delegate — the guaranteed floor. Owns the shared-graph topology
    // (invariant 4) and serves get/multiGet/status and the query fallback (invariant 2).
    this._fallback = new GrepMocAdapter(config);
    // Cache the availability decision for this instance's lifetime.
    this._available = QmdAdapter.isAvailable(config);
  }

  /** Whether this adapter can actually serve via qmd (invariant 3). */
  available() { return this._available; }

  /**
   * Ensure qmd's sidecar index exists/updated for this brain (spec F13: index is a sidecar
   * in qmd's own cache; the markdown files stay canonical and untouched). Best-effort:
   * returns true on success, false on any failure (the caller then degrades to grep/MOC).
   *
   * @param {string} [brainPath]           brain root; defaults to this.brainRoot.
   * @param {{ftsOnly?:boolean}} [opts]     ftsOnly builds the BM25/FTS5 index only — no
   *                                        semantic model pull (spec F10, the light floor).
   * @returns {boolean}
   */
  ensureIndex(brainPath, opts = {}) {
    if (!this._available) return false;
    const root = brainPath ? path.resolve(brainPath) : this.brainRoot;
    const knowledgeDir = path.join(root, 'knowledge');
    if (!safeIsDir(knowledgeDir)) return false;

    // `qmd index <dir>` builds/refreshes the sidecar. The --fts-only flag (light tier)
    // requests the BM25/FTS5 index with NO embedding/rerank models downloaded (spec F10).
    // Flag names track qmd's CLI; on a surface change the run fails and we degrade — never
    // crash (spec §9 upstream-drift is caught, not silently absorbed).
    const args = ['index', knowledgeDir];
    if (opts.ftsOnly) args.push('--fts-only');
    const r = runQmd(args, { cwd: root });
    return r.ok;
  }

  /**
   * Semantic / lexical ranked retrieval via qmd, degrading to grep/MOC on ANY failure.
   *
   * ftsOnly:true  → `qmd search`  (BM25/FTS5, zero models — the light tier, spec F10)
   * default       → `qmd query`   (BM25 + sqlite-vec + RRF, spec F7; + rerank when opts.rerank)
   *
   * @param {string} q
   * @param {import('../retrieval-port').QueryOptions} [opts]
   * @returns {Promise<import('../retrieval-port').RetrievalResult[]>}
   */
  async query(q, opts = {}) {
    // Match the port contract's empty-query semantics WITHOUT spawning a process.
    if (typeof q !== 'string' || !q.trim()) return [];
    // Not usable → straight to the floor (should not happen: factory gates on isAvailable,
    // but defend anyway so a direct construction still behaves).
    if (!this._available) return this._fallback.query(q, opts);

    const limit    = Number.isFinite(opts.limit) && opts.limit > 0 ? Math.floor(opts.limit) : 10;
    const minScore = Number.isFinite(opts.minScore) ? opts.minScore : 0;
    const ftsOnly  = Boolean(opts.ftsOnly);
    const rerank   = !ftsOnly && Boolean(opts.rerank != null ? opts.rerank : this._config.rerank);

    // Sub-command + flags as an ARGV ARRAY (invariant 6). `--json` requests machine output;
    // `--limit` bounds the set; `--no-rerank` / `--rerank` toggles the cross-encoder on the
    // semantic path only (rerank is meaningless for BM25-only `search`, spec F8/F10).
    const argv = [ftsOnly ? 'search' : 'query', q, '--json', '--limit', String(limit)];
    if (!ftsOnly) argv.push(rerank ? '--rerank' : '--no-rerank');

    const r = runQmd(argv, { cwd: this.brainRoot });
    if (!r.ok) {
      // qmd failed (not installed after all / index missing / surface drift / timeout) →
      // degrade transparently. The caller cannot tell qmd from grep/MOC (LSP) — that is the
      // whole point of the port. We do NOT throw (invariant 3).
      return this._fallback.query(q, opts);
    }

    let hits = parseQmdHits(r.stdout)
      .map(h => mapHit(this.brainRoot, h))
      .filter(Boolean);

    // Collection filter (top-level knowledge/ cluster) applied on OUR side: qmd's collection
    // model (spec F15) differs, so we filter by the node's cluster segment of its rel path to
    // stay identical to the grep/MOC semantics (`knowledge/<cluster>/…`).
    if (Array.isArray(opts.collections) && opts.collections.length) {
      const allow = new Set(opts.collections);
      hits = hits.filter(h => allow.has(clusterOf(h.path)));
    }

    // minScore + limit + deterministic ordering, matching the grep/MOC adapter's contract.
    hits = hits.filter(h => h.score > minScore);
    hits.sort((a, b) => (b.score - a.score) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

    // A qmd success that yields ZERO usable hits for a non-trivial query is suspicious
    // (index not built yet). Fall back so the user still gets the lexical floor rather than
    // an empty page. (An intentionally no-match query returns [] from grep/MOC too.)
    if (hits.length === 0) return this._fallback.query(q, opts);

    return hits.slice(0, limit);
  }

  /**
   * Fetch one node's full text by stable id. qmd `get` addresses by path/docid (spec F12),
   * but OUR identity is the kebab-case node id and the canonical bytes live on disk (files
   * are truth — spec F13). Reading the file directly via the grep/MOC delegate is both
   * simpler and guaranteed-consistent, so get() DELEGATES (invariant 2/4). No process spawn.
   *
   * @param {string} id
   * @returns {Promise<import('../retrieval-port').RetrievalDoc|null>}
   */
  async get(id) {
    return this._fallback.get(id);
  }

  /**
   * Fetch many by id — delegates to the floor (same reasoning as get()). qmd's `multi_get`
   * would return the same canonical files; delegating keeps identity + order semantics
   * identical to grep/MOC without a process round-trip.
   *
   * @param {string[]} ids
   * @returns {Promise<import('../retrieval-port').RetrievalDoc[]>}
   */
  async multiGet(ids) {
    return this._fallback.multiGet(ids);
  }

  /**
   * Index/adapter health. Node/edge counts come from the shared brain-graph universe via
   * the grep/MOC delegate (invariant 4 — status() never disagrees with check.js/graph.js).
   * We overlay the qmd identity + a backend label that reflects whether qmd is actually
   * usable and whether its sidecar index appears present. Never throws.
   *
   * @returns {Promise<import('../retrieval-port').RetrievalStatus>}
   */
  async status() {
    const base = await this._fallback.status(); // { nodeCount, edgeCount, indexed, adapter, backend }
    const usable = this._available;
    const indexPresent = usable && qmdIndexLooksPresent();
    return {
      nodeCount: base.nodeCount,
      edgeCount: base.edgeCount,
      // "indexed" reflects a usable CORPUS: brain has nodes (grep/MOC floor is always
      // ready). The qmd sidecar state is surfaced in the backend label, not by flipping
      // this flag off — grep/MOC can always serve, so the port is never "unindexed".
      indexed: base.indexed,
      adapter: ADAPTER_ID,
      backend: usable
        ? `qmd hybrid (BM25+vector+RRF+rerank) over grep/MOC floor — sidecar index ${indexPresent ? 'present' : 'not built'}`
        : 'qmd requested but unavailable — serving via grep/MOC floor',
    };
  }
}

// ---------------------------------------------------------------------------
// Small path/fs helpers (node stdlib only)
// ---------------------------------------------------------------------------

/** Top-level knowledge/ cluster from a brain-root-relative path (mirrors brain-graph). */
function clusterOf(relPath) {
  if (!relPath) return '';
  const posix = String(relPath).replace(/\\/g, '/');
  const m = posix.match(/^knowledge\/([^/]+)\//);
  return m ? m[1] : '';
}

/** True if `p` exists and is a directory. Never throws. */
function safeIsDir(p) {
  try { return fs.statSync(p).isDirectory(); }
  catch (_) { return false; }
}

/**
 * Cheap best-effort check for a qmd sidecar index in the default cache location (spec F13:
 * `~/.cache/qmd/index.sqlite`) or a project-local `.qmd/`. Purely informational for the
 * status() backend label — its absence never disables the adapter (we still degrade to the
 * grep/MOC floor). Never throws.
 */
function qmdIndexLooksPresent() {
  try {
    const home = process.env.HOME || process.env.USERPROFILE || '';
    const candidates = [
      home && path.join(home, '.cache', 'qmd', 'index.sqlite'),
      path.join(process.cwd(), '.qmd', 'index.yml'),
    ].filter(Boolean);
    return candidates.some(p => { try { return fs.existsSync(p); } catch (_) { return false; } });
  } catch (_) {
    return false;
  }
}

// The class is the default export (the factory does `new QmdAdapter(config)` and reads the
// static `QmdAdapter.isAvailable`). `_resetProbeCache` is attached for tests only.
QmdAdapter._resetProbeCache = _resetProbeCache;

module.exports = QmdAdapter;
