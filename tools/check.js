#!/usr/bin/env node
// tools/check.js — Synaptic Brain lint helper (v1.0)
// Usage: node tools/check.js [path-to-.synaptic]   (default: ./.synaptic)
// Node >= 18, zero npm dependencies — only node:fs, node:path, node:process.

'use strict';

const fs   = require('node:fs');
const path = require('node:path');

// Shared, canonical knowledge-scoped / MOC-excluded edge-graph universe.
// KEEP IN SYNC: this is the SAME module tools/graph.js imports, so check.js and
// graph.html always report the identical topology (council cross-cutting rule).
const { buildBrainGraph } = require('./lib/brain-graph');

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const brainRoot = path.resolve(process.argv[2] || './.synaptic');

if (!fs.existsSync(brainRoot)) {
  console.error(`ERROR: path not found: ${brainRoot}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readLines(filePath) {
  return readText(filePath).split('\n');
}

/** True if file lives under templates/ (any depth). */
function isUnderTemplates(filePath) {
  const rel = path.relative(brainRoot, filePath);
  return rel.startsWith('templates' + path.sep) || rel.startsWith('templates/');
}

/**
 * True if file lives under references/raw/ (any depth).
 * references/raw/ holds verbatim captured payloads — any [[...]] inside is source
 * text, NOT an authored edge — so it is scaffolding excluded from link validation.
 */
function isUnderReferencesRaw(filePath) {
  const rel = path.relative(brainRoot, filePath).replace(/\\/g, '/');
  return rel === 'references/raw' || rel.startsWith('references/raw/');
}

/**
 * True for MOC/sentinel files excluded from content checks.
 * INDEX.md, _index.md, README.md are excluded from frontmatter/naming/orphan checks.
 */
function isMocFile(filePath) {
  const base = path.basename(filePath).toLowerCase();
  return base === 'index.md' || base === 'readme.md' || base === '_index.md';
}

/** True if value is a {{...}} placeholder. */
function isPlaceholder(value) {
  return typeof value === 'string' && /^\{\{.+\}\}$/.test(value.trim());
}

/**
 * Walk a directory recursively, returning absolute .md file paths.
 * Returns [] if the directory does not exist.
 */
function walkMd(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

/**
 * Walk any dir, returning all file paths (any extension).
 * Returns [] if the directory does not exist.
 */
function walkAll(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

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

/**
 * Extract all [[wikilinks]] from lines, skipping:
 *   - HTML comment blocks (<!-- ... -->)
 *   - fenced code blocks (``` ... ``` or ~~~ ... ~~~)
 *   - inline code spans (`...`)
 * Returns an array of raw link strings (may contain # or | — strip those for resolution).
 */
function extractWikilinks(lines) {
  const links = [];
  let inComment = false;
  let inFence = false;

  for (const rawLine of lines) {
    if (inComment) {
      if (rawLine.includes('-->')) inComment = false;
      continue;
    }
    // Fenced code block toggle: a line opening or closing ``` / ~~~ flips the flag;
    // skip wikilink extraction while inside a fence.
    if (/^\s*(```|~~~)/.test(rawLine)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    // Strip inline code spans
    let line = rawLine.replace(/`[^`]*`/g, m => ' '.repeat(m.length));

    if (line.includes('<!--')) {
      if (!line.includes('-->')) {
        const before = line.slice(0, line.indexOf('<!--'));
        for (const m of before.matchAll(/\[\[([^\]]+)\]\]/g)) links.push(m[1].trim());
        inComment = true;
        continue;
      }
      // Single-line comment — strip it
      line = line.replace(/<!--.*?-->/g, '');
    }

    for (const m of line.matchAll(/\[\[([^\]]+)\]\]/g)) links.push(m[1].trim());
  }
  return links;
}

/**
 * Normalise a wikilink target: strip #anchor and |alias, trim.
 */
function normLink(raw) {
  return raw.split('#')[0].split('|')[0].trim();
}

/**
 * Build a lookup set of all resolvable wikilink targets from the brain.
 * Keys: basenames without extension, and relative paths from brainRoot without extension.
 */
function buildLinkIndex(root) {
  const index = new Set();
  const dirs = [
    path.join(root, 'knowledge'),
    path.join(root, 'registries'),
    path.join(root, 'references'),
    path.join(root, 'harness'),
  ];
  // Also add any .md directly at brain root
  for (const entry of (fs.existsSync(root) ? fs.readdirSync(root, { withFileTypes: true }) : [])) {
    if (entry.isFile() && entry.name.endsWith('.md')) {
      index.add(path.basename(entry.name, '.md'));
      index.add(entry.name); // with extension
    }
  }
  for (const dir of dirs) {
    for (const f of walkMd(dir)) {
      const stem = path.basename(f, '.md');
      index.add(stem);
      // Relative from brain root without extension: e.g. "knowledge/example-cluster/_index"
      const rel = path.relative(root, f).replace(/\\/g, '/').replace(/\.md$/, '');
      index.add(rel);
      // Also the filename with extension
      const relWithExt = path.relative(root, f).replace(/\\/g, '/');
      index.add(relWithExt);
    }
  }
  return index;
}

/** Parse a date string; return Date or null. */
function parseDate(str) {
  if (!str || isPlaceholder(str)) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const KNOWLEDGE_BUDGET = 150;
const BRAIN_BUDGET = 110;

// ---------------------------------------------------------------------------
// Findings collector
// ---------------------------------------------------------------------------

const errors   = [];
const warnings = [];

function err(file, message) {
  errors.push({ file: path.relative(brainRoot, file), message });
}

function warn(file, message) {
  warnings.push({ file: path.relative(brainRoot, file), message });
}

// ---------------------------------------------------------------------------
// Check 1: Required layout + v0.x leftovers
// ---------------------------------------------------------------------------

function checkLayout() {
  const brainFile = path.join(brainRoot, 'BRAIN.md');
  if (!fs.existsSync(brainFile)) {
    err(brainFile, 'BRAIN.md is missing');
  }

  const indexFile = path.join(brainRoot, 'knowledge', 'INDEX.md');
  if (!fs.existsSync(indexFile)) {
    err(indexFile, 'knowledge/INDEX.md is missing');
  }

  // v0.x leftover files at brain root
  const leftoverRootFiles = [
    'BOOTSTRAP.md', 'MANIFEST.md', 'HEARTBEAT.md', 'cortex.config.yaml',
  ];
  for (const f of leftoverRootFiles) {
    if (fs.existsSync(path.join(brainRoot, f))) {
      err(path.join(brainRoot, f), `v0.x leftover file: ${f}`);
    }
  }

  // identity/HEARTBEAT.md (v0.3 path)
  const heartbeatInIdentity = path.join(brainRoot, 'identity', 'HEARTBEAT.md');
  if (fs.existsSync(heartbeatInIdentity)) {
    err(heartbeatInIdentity, 'v0.x leftover file: identity/HEARTBEAT.md');
  }

  // _tree.yaml under knowledge/
  const treeYaml = path.join(brainRoot, 'knowledge', '_tree.yaml');
  if (fs.existsSync(treeYaml)) {
    err(treeYaml, 'v0.x leftover file: knowledge/_tree.yaml');
  }

  // inventory/ directory (v0.x name for registries/)
  const inventoryDir = path.join(brainRoot, 'inventory');
  if (fs.existsSync(inventoryDir) && fs.statSync(inventoryDir).isDirectory()) {
    err(inventoryDir, 'v0.x leftover directory: inventory/ (should be registries/)');
  }

  // top-level playbooks/ directory (v0.x silos — now playbooks are typed nodes in knowledge/)
  const playbooksDir = path.join(brainRoot, 'playbooks');
  if (fs.existsSync(playbooksDir) && fs.statSync(playbooksDir).isDirectory()) {
    err(playbooksDir, 'v0.x leftover directory: top-level playbooks/ (playbooks are now typed nodes in knowledge/)');
  }
}

// ---------------------------------------------------------------------------
// Check 2: Frontmatter required fields on knowledge nodes + registries
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS = ['description', 'type', 'status', 'updated', 'tags'];

function checkFrontmatter() {
  // Candidates: knowledge/**/*.md + registries/**/*.md
  // Exclude: INDEX.md, _index.md, README.md, templates/
  const candidates = [
    ...walkMd(path.join(brainRoot, 'knowledge')),
    ...walkMd(path.join(brainRoot, 'registries')),
  ];

  for (const filePath of candidates) {
    if (isUnderTemplates(filePath) || isMocFile(filePath)) continue;

    const lines = readLines(filePath);
    const fm = parseFrontmatter(lines);

    if (!fm) {
      err(filePath, 'missing frontmatter (no --- block found)');
      continue;
    }

    for (const field of REQUIRED_FIELDS) {
      const val = fm[field];
      if (val === undefined || val === null) {
        err(filePath, `frontmatter missing required field: ${field}`);
      }
    }

    // tags: must be a YAML list
    const tags = fm.tags;
    if (tags !== undefined && tags !== null) {
      if (!Array.isArray(tags)) {
        // scalar value — not a list
        warn(filePath, `frontmatter "tags" should be a YAML list, got scalar: "${tags}"`);
      } else if (tags.length === 0) {
        warn(filePath, 'frontmatter "tags" is an empty list — add at least one tag');
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Check 3: Naming — knowledge node files must be kebab-case; no duplicate basenames
// ---------------------------------------------------------------------------

const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*\.md$/;

function checkNaming() {
  const knowledgeDir = path.join(brainRoot, 'knowledge');
  if (!fs.existsSync(knowledgeDir)) return;

  const seen  = new Map(); // stem -> first file path
  const dupes = new Set(); // stems already reported

  for (const filePath of walkMd(knowledgeDir)) {
    if (isUnderTemplates(filePath) || isMocFile(filePath)) continue;

    const base = path.basename(filePath);

    if (!KEBAB_RE.test(base)) {
      err(filePath, `filename is not kebab-case: "${base}"`);
    }

    const stem = path.basename(filePath, '.md');
    if (seen.has(stem)) {
      if (!dupes.has(stem)) {
        err(seen.get(stem), `duplicate basename: "${stem}.md" appears in multiple locations`);
        dupes.add(stem);
      }
      err(filePath, `duplicate basename: "${stem}.md" appears in multiple locations`);
    } else {
      seen.set(stem, filePath);
    }
  }
}

// ---------------------------------------------------------------------------
// Check 4: MOC coverage (orphan nodes)
// ---------------------------------------------------------------------------

function checkMocCoverage() {
  const knowledgeDir   = path.join(brainRoot, 'knowledge');
  const knowledgeIndex = path.join(brainRoot, 'knowledge', 'INDEX.md');

  if (!fs.existsSync(knowledgeDir)) return;

  const indexText = fs.existsSync(knowledgeIndex) ? readText(knowledgeIndex) : '';

  // Discover clusters: immediate subdirectories of knowledge/
  const clusters = [];
  if (fs.existsSync(knowledgeDir)) {
    for (const entry of fs.readdirSync(knowledgeDir, { withFileTypes: true })) {
      if (entry.isDirectory()) clusters.push(entry.name);
    }
  }

  // Each cluster _index.md must be reachable from knowledge/INDEX.md
  for (const cluster of clusters) {
    const clusterIndex = path.join(knowledgeDir, cluster, '_index.md');
    if (!fs.existsSync(clusterIndex)) continue; // no _index to check
    // INDEX.md must link to this cluster somehow: [[cluster/_index]] or [[cluster/_index.md]]
    const stem = cluster + '/_index';
    const stemNoSlash = cluster + '_index';
    const linked =
      indexText.includes(`[[${stem}]]`) ||
      indexText.includes(`[[${stem}.md]]`) ||
      indexText.includes(`[[${stemNoSlash}]]`) ||
      indexText.includes(cluster + '/'); // path reference
    if (!linked) {
      err(clusterIndex, `cluster _index.md not linked from knowledge/INDEX.md: [[${stem}]]`);
    }
  }

  // Every knowledge node must be referenced from its cluster _index.md OR from INDEX.md
  for (const filePath of walkMd(knowledgeDir)) {
    if (isUnderTemplates(filePath) || isMocFile(filePath)) continue;

    const stem = path.basename(filePath, '.md');
    const parentDir = path.dirname(filePath);
    const clusterIndexPath = path.join(parentDir, '_index.md');

    // Check cluster _index.md first
    let found = false;
    if (fs.existsSync(clusterIndexPath)) {
      const clusterText = readText(clusterIndexPath);
      found = clusterText.includes(`[[${stem}]]`) ||
              clusterText.includes(`[[${stem}.md]]`);
    }

    // Fallback: check root INDEX.md
    if (!found) {
      found = indexText.includes(`[[${stem}]]`) ||
              indexText.includes(`[[${stem}.md]]`);
    }

    if (!found) {
      err(filePath, `node "${stem}" not referenced from its cluster _index.md or knowledge/INDEX.md`);
    }
  }
}

// ---------------------------------------------------------------------------
// Check 5: Broken [[wikilinks]]
// ---------------------------------------------------------------------------

function checkBrokenLinks() {
  // Build index of all known link targets
  const linkIndex = buildLinkIndex(brainRoot);

  // Check all .md files in the brain, excluding scaffolding that legitimately
  // carries placeholder/example wikilinks or verbatim payloads (NOT real edges):
  //   - templates/      (example/placeholder content: [[target]], [[related-node]], [[x]])
  //   - references/raw/  (verbatim captured payloads; any [[...]] inside is source text)
  //   - MOC files (_index.md, INDEX.md, README.md): they list nodes that
  //     should exist; the orphan check (check 4) covers the inverse.
  //     In a fresh/seed brain MOC files will always have placeholder links.
  for (const filePath of walkMd(brainRoot)) {
    if (isUnderTemplates(filePath) || isUnderReferencesRaw(filePath) || isMocFile(filePath)) continue;

    const lines = readLines(filePath);
    const rawLinks = extractWikilinks(lines);

    for (const rawLink of rawLinks) {
      const target = normLink(rawLink);
      if (!target) continue;
      // Skip placeholder links like [[{{example-cluster}}/_index]]
      if (target.includes('{{')) continue;
      if (!linkIndex.has(target)) {
        err(filePath, `broken wikilink: [[${rawLink}]]`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Check 6: Registries — type: registry frontmatter + listed in registries/_index.md
// ---------------------------------------------------------------------------

function checkRegistries() {
  const registriesDir   = path.join(brainRoot, 'registries');
  const registriesIndex = path.join(brainRoot, 'registries', '_index.md');

  if (!fs.existsSync(registriesDir)) return;

  const indexText = fs.existsSync(registriesIndex) ? readText(registriesIndex) : '';

  for (const filePath of walkMd(registriesDir)) {
    const base = path.basename(filePath);
    // Skip the index and template files
    if (base === '_index.md' || base === '_registry_template.md') continue;

    // Must have type: registry
    const fm = parseFrontmatter(readLines(filePath));
    if (!fm || fm.type !== 'registry') {
      err(filePath, 'registry file missing "type: registry" frontmatter');
    }

    // Must be listed in registries/_index.md
    const stem = path.basename(filePath, '.md');
    const listed =
      indexText.includes(`[[${stem}]]`) ||
      indexText.includes(`[[${stem}.md]]`) ||
      indexText.includes(base); // plain filename mention
    if (!listed) {
      err(filePath, `registry "${stem}" not listed in registries/_index.md`);
    }
  }
}

// ---------------------------------------------------------------------------
// Check 7: References — each references/* listed in references/_index.md (WARN only)
// ---------------------------------------------------------------------------

function checkReferences() {
  const refsDir   = path.join(brainRoot, 'references');
  const refsIndex = path.join(brainRoot, 'references', '_index.md');

  if (!fs.existsSync(refsDir)) return;

  const indexText = fs.existsSync(refsIndex) ? readText(refsIndex) : '';

  for (const filePath of walkAll(refsDir)) {
    const base = path.basename(filePath);
    const rel  = path.relative(refsDir, filePath).replace(/\\/g, '/');
    // Skip the index itself, and anything under raw/ (binary payloads)
    if (base === '_index.md') continue;
    if (rel.startsWith('raw/') || rel.startsWith('raw\\')) continue;
    // .gitkeep placeholders
    if (base === '.gitkeep') continue;

    if (!indexText.includes(base) && !indexText.includes(rel)) {
      warn(filePath, `file in references/ not mentioned in references/_index.md: ${rel}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Check 8: Soft budget — knowledge nodes >150 lines (not type: reference) → WARN
// ---------------------------------------------------------------------------

function checkBudgets() {
  const brainFile = path.join(brainRoot, 'BRAIN.md');

  // BRAIN.md budget
  if (fs.existsSync(brainFile)) {
    const lines = readLines(brainFile);
    if (lines.length > BRAIN_BUDGET) {
      warn(brainFile, `BRAIN.md is ${lines.length} lines (soft budget: ${BRAIN_BUDGET})`);
    }
  }

  // knowledge nodes
  const knowledgeDir = path.join(brainRoot, 'knowledge');
  for (const filePath of walkMd(knowledgeDir)) {
    if (isUnderTemplates(filePath) || isMocFile(filePath)) continue;

    const lines = readLines(filePath);
    if (lines.length <= KNOWLEDGE_BUDGET) continue;

    // Check type — if type: reference, skip (deliberately long canonical doc)
    const fm = parseFrontmatter(lines);
    if (fm && fm.type === 'reference') continue;

    warn(filePath, `node is ${lines.length} lines (soft budget: ${KNOWLEDGE_BUDGET}; tag "type: reference" to suppress)`);
  }
}

// ---------------------------------------------------------------------------
// Check 9: Staleness — updated: > 90d (skip placeholders)
// ---------------------------------------------------------------------------

function checkStaleness() {
  const now = Date.now();
  const candidates = [
    ...walkMd(path.join(brainRoot, 'knowledge')),
    ...walkMd(path.join(brainRoot, 'registries')),
  ];

  for (const filePath of candidates) {
    if (isUnderTemplates(filePath) || isMocFile(filePath)) continue;

    const fm = parseFrontmatter(readLines(filePath));
    if (!fm) continue;

    const updated = parseDate(fm.updated);
    if (!updated) continue; // placeholder or unparseable

    if (now - updated.getTime() > NINETY_DAYS_MS) {
      const daysAgo = Math.floor((now - updated.getTime()) / (24 * 60 * 60 * 1000));
      warn(filePath, `stale: updated ${fm.updated} (${daysAgo} days ago)`);
    }
  }
}

// ---------------------------------------------------------------------------
// Run all checks
// ---------------------------------------------------------------------------

checkLayout();
checkFrontmatter();
checkNaming();
checkMocCoverage();
checkBrokenLinks();
checkRegistries();
checkReferences();
checkBudgets();
checkStaleness();

// ---------------------------------------------------------------------------
// Report — grouped by file, then summary
// ---------------------------------------------------------------------------

function printFindings(label, list) {
  if (list.length === 0) return;
  console.log(`\n${label}:`);
  const byFile = {};
  for (const item of list) {
    (byFile[item.file] = byFile[item.file] || []).push(item.message);
  }
  for (const [file, messages] of Object.entries(byFile)) {
    console.log(`  ${file}`);
    for (const msg of messages) console.log(`    - ${msg}`);
  }
}

printFindings('ERRORS',   errors);
printFindings('WARNINGS', warnings);

const totalErrors   = errors.length;
const totalWarnings = warnings.length;

// ---------------------------------------------------------------------------
// Retrieval-readiness report (advisory — NEVER gates the exit code)
// ---------------------------------------------------------------------------
// Structural green (0 errors) does not prove the brain can answer anything.
// This block reports the SHARED knowledge-scoped, MOC-excluded edge universe
// (tools/lib/brain-graph.js — identical to graph.js) so check.js and the graph
// viz never disagree on the topology.

function printRetrievalReadiness() {
  let g;
  try {
    g = buildBrainGraph(brainRoot);
  } catch (e) {
    console.log(`\nRetrieval-readiness: (skipped — ${e.message})`);
    return;
  }

  const nodes        = g.nodeCount;
  const edges        = g.edgeCount;
  const orphans      = g.orphanCount;
  const epn          = g.edgesPerNode;         // undirected edgeList.length / nodeCount
  const mocReachable = g.mocReachableCount;
  const orphanRatio  = nodes > 0 ? orphans / nodes : 0;

  const epnStr = nodes > 0 ? epn.toFixed(2) : 'n/a';
  const orphanPctStr = nodes > 0 ? (orphanRatio * 100).toFixed(0) + '%' : 'n/a';

  console.log('\nRetrieval-readiness (knowledge nodes only; MOC/_index/INDEX/README excluded):');
  console.log(`  Nodes            : ${nodes}`);
  console.log(`  Edges            : ${edges} (undirected, deduped; typed frontmatter edges + body [[wikilinks]])`);
  console.log(`  Orphans          : ${orphans} (degree-0 knowledge nodes; ${orphanPctStr} of nodes)`);
  console.log(`  Edges per node   : ${epnStr}`);
  console.log(`  MOC-reachable    : ${mocReachable} / ${nodes} (linked from INDEX.md or a cluster _index.md)`);

  // "structural-green != retrieval-green" caveat — printed only when the brain
  // is structurally clean (0 errors) yet a retrieval-risk heuristic trips.
  // Advisory only: it never changes the exit code.
  const heuristicTrips = nodes > 0 && (orphanRatio > 0.20 || epn < 0.5);
  if (totalErrors === 0 && heuristicTrips) {
    console.log('');
    console.log('  CAVEAT: structural-green != retrieval-green.');
    console.log('  0 errors, but this brain shows low connectivity ' +
      `(orphan ratio ${orphanPctStr} > 20% OR edges/node ${epnStr} < 0.5).`);
    console.log('  A brain can pass every structural check and still be hard to retrieve from.');
    console.log('  Run /synaptic-weave to author missing edges, and do a retrieval drill ' +
      '(BRAIN -> INDEX -> cluster _index -> node). This is advisory; it does NOT fail the check.');
  }
}

printRetrievalReadiness();

console.log(`\nSummary: ${totalErrors} error(s), ${totalWarnings} warning(s)`);

process.exit(totalErrors > 0 ? 1 : 0);
