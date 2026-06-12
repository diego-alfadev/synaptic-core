#!/usr/bin/env node
// tools/graph.js — Synaptic Brain Visual Graph Renderer (v1.0)
// Renders a visual graph of a .synaptic/ brain as a self-contained HTML or SVG file.
//
// Usage:
//   node tools/graph.js [path-to-.synaptic] [--out FILE] [--format html|svg] [--title "..."]
//
// Defaults:
//   path     ./.synaptic
//   --out    synaptic-graph.html
//   --format html
//
// Node >= 18, zero npm dependencies — only node:fs, node:path, node:process.
// Deterministic layout: no Math.random, no time-based seeding.

'use strict';

const fs   = require('node:fs');
const path = require('node:path');

// ─────────────────────────────────────────────────────────────────────────────
// CLI parsing
// ─────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

let brainRoot = null;
let outFile   = null;
let format    = 'html';
let titleArg  = null;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--out')    { outFile  = args[++i]; continue; }
  if (a === '--format') { format   = args[++i]; continue; }
  if (a === '--title')  { titleArg = args[++i]; continue; }
  if (!a.startsWith('--')) { brainRoot = a; continue; }
}

brainRoot = path.resolve(brainRoot || './.synaptic');
format    = (format === 'svg') ? 'svg' : 'html';
if (!outFile) outFile = format === 'svg' ? 'synaptic-graph.svg' : 'synaptic-graph.html';

// ─────────────────────────────────────────────────────────────────────────────
// Guard
// ─────────────────────────────────────────────────────────────────────────────

if (!fs.existsSync(brainRoot)) {
  console.error(`ERROR: path not found: ${brainRoot}`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers (consistent with check.js)
// ─────────────────────────────────────────────────────────────────────────────

function readText(filePath) {
  try { return fs.readFileSync(filePath, 'utf8'); }
  catch (_) { return ''; }
}

function readLines(filePath) {
  return readText(filePath).split('\n');
}

/** Walk a directory recursively, returning absolute .md file paths. */
function walkMd(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  function walk(current) {
    let entries;
    try { entries = fs.readdirSync(current, { withFileTypes: true }); }
    catch (_) { return; }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.md')) results.push(full);
    }
  }
  walk(dir);
  return results;
}

/**
 * Parse YAML frontmatter — same logic as check.js (scalar, inline list, block list).
 * Returns null if none found, else an object.
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

/**
 * Extract [[wikilinks]] from lines, skipping HTML comments and inline code.
 * Same logic as check.js.
 */
function extractWikilinks(lines) {
  const links = [];
  let inComment = false;
  for (const rawLine of lines) {
    if (inComment) {
      if (rawLine.includes('-->')) inComment = false;
      continue;
    }
    let line = rawLine.replace(/`[^`]*`/g, m => ' '.repeat(m.length));
    if (line.includes('<!--')) {
      if (!line.includes('-->')) {
        const before = line.slice(0, line.indexOf('<!--'));
        for (const m of before.matchAll(/\[\[([^\]]+)\]\]/g)) links.push(m[1].trim());
        inComment = true;
        continue;
      }
      line = line.replace(/<!--.*?-->/g, '');
    }
    for (const m of line.matchAll(/\[\[([^\]]+)\]\]/g)) links.push(m[1].trim());
  }
  return links;
}

/** Normalise a wikilink: strip #anchor and |alias. */
function normLink(raw) {
  return raw.split('#')[0].split('|')[0].trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Brain parsing
// ─────────────────────────────────────────────────────────────────────────────

const knowledgeDir  = path.join(brainRoot, 'knowledge');
const registriesDir = path.join(brainRoot, 'registries');
const referencesDir = path.join(brainRoot, 'references');
const harnessDir    = path.join(brainRoot, 'harness');
const brainFile     = path.join(brainRoot, 'BRAIN.md');

// --- Brain name ---
let brainName = path.basename(path.dirname(brainRoot));
try {
  const bfm = parseFrontmatter(readLines(brainFile));
  if (bfm && bfm.name) brainName = bfm.name;
} catch (_) {}

// --- Identify excluded filenames ---
function isMocOrIndex(name) {
  const lower = name.toLowerCase();
  return lower === 'index.md' || lower === '_index.md' || lower === 'readme.md';
}

// ── Collect knowledge clusters and nodes ──────────────────────────────────────

// Group: { id, label, group, type, tags }
// id = basename without .md
const nodes = [];  // all nodes
const nodeById = {};  // id → node object

// Hub: knowledge/INDEX.md gets a special HUB node
const indexFile = path.join(knowledgeDir, 'INDEX.md');
const hubId = 'INDEX';
const hubNode = { id: hubId, label: 'INDEX', group: '__hub__', type: 'hub', tags: [] };
nodes.push(hubNode);
nodeById[hubId] = hubNode;

// knowledge/ clusters
const clusterMap = {};  // clusterName → [node, ...]
let clusterNames = [];

if (fs.existsSync(knowledgeDir)) {
  let entries;
  try { entries = fs.readdirSync(knowledgeDir, { withFileTypes: true }); }
  catch (_) { entries = []; }

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const clusterName = entry.name;
    const clusterDir  = path.join(knowledgeDir, clusterName);
    const clusterNodes = [];

    const mdFiles = walkMd(clusterDir).sort((a, b) =>
      path.basename(a).localeCompare(path.basename(b))
    );

    for (const filePath of mdFiles) {
      const base = path.basename(filePath);
      if (isMocOrIndex(base)) continue;
      const id = path.basename(filePath, '.md');
      const lines = readLines(filePath);
      const fm    = parseFrontmatter(lines) || {};
      const node  = {
        id,
        label:    id,
        group:    clusterName,
        type:     fm.type  || 'knowledge',
        tags:     Array.isArray(fm.tags) ? fm.tags : [],
        filePath,
        lines,
      };
      nodes.push(node);
      nodeById[id] = node;
      clusterNodes.push(node);
    }

    if (clusterNodes.length > 0 || fs.existsSync(path.join(clusterDir, '_index.md'))) {
      clusterMap[clusterName] = clusterNodes;
    }
  }
  clusterNames = Object.keys(clusterMap).sort();
}

// registries
const registryNodes = [];
for (const filePath of walkMd(registriesDir).sort()) {
  const base = path.basename(filePath);
  if (isMocOrIndex(base)) continue;
  const id = path.basename(filePath, '.md');
  const lines = readLines(filePath);
  const fm    = parseFrontmatter(lines) || {};
  const node  = { id, label: id, group: '__registries__', type: fm.type || 'registry', tags: Array.isArray(fm.tags) ? fm.tags : [], filePath, lines };
  nodes.push(node);
  nodeById[id] = node;
  registryNodes.push(node);
}

// references
const referenceNodes = [];
for (const filePath of walkMd(referencesDir).sort()) {
  const base = path.basename(filePath);
  if (isMocOrIndex(base)) continue;
  const id = path.basename(filePath, '.md');
  const lines = readLines(filePath);
  const fm    = parseFrontmatter(lines) || {};
  const node  = { id, label: id, group: '__references__', type: fm.type || 'reference', tags: Array.isArray(fm.tags) ? fm.tags : [], filePath, lines };
  nodes.push(node);
  nodeById[id] = node;
  referenceNodes.push(node);
}

// harness presence
const hasHarness = fs.existsSync(harnessDir) && fs.statSync(harnessDir).isDirectory();

// ─────────────────────────────────────────────────────────────────────────────
// Edge extraction (wikilinks → undirected edges between known nodes)
// ─────────────────────────────────────────────────────────────────────────────

const edgeSet  = new Set();   // "sorted-a|sorted-b"
const edgeList = [];          // [{ from, to }]
let unresolvedCount = 0;

// Build a strip-fenced-code helper (graph.js strips fenced code too)
function stripFencedCode(text) {
  return text.replace(/```[\s\S]*?```/g, m => ' '.repeat(m.length));
}

for (const node of nodes) {
  if (!node.filePath) continue;  // hub has no file to scan
  const rawText   = readText(node.filePath);
  const stripped  = stripFencedCode(rawText);
  const scanLines = stripped.split('\n');
  const rawLinks  = extractWikilinks(scanLines);

  for (const rawLink of rawLinks) {
    const target = normLink(rawLink);
    if (!target || target === node.id) continue;
    if (target.includes('{{')) continue;  // placeholder link

    // Resolve by basename (last path segment)
    const resolvedId = path.basename(target, '.md');

    if (!nodeById[resolvedId]) {
      unresolvedCount++;
      continue;
    }
    if (resolvedId === node.id) continue;  // self-link

    // Undirected: sort ids for canonical key
    const [a, b] = [node.id, resolvedId].sort();
    const key = `${a}|${b}`;
    if (!edgeSet.has(key)) {
      edgeSet.add(key);
      edgeList.push({ from: node.id, to: resolvedId });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Degree map (for node radius scaling)
// ─────────────────────────────────────────────────────────────────────────────

const degreeOf = {};
for (const node of nodes) degreeOf[node.id] = 0;
for (const { from, to } of edgeList) {
  degreeOf[from] = (degreeOf[from] || 0) + 1;
  degreeOf[to]   = (degreeOf[to]   || 0) + 1;
}

const orphanCount = nodes.filter(n => degreeOf[n.id] === 0).length;
let mostConnectedNode = nodes[0] || { id: 'none' };
for (const node of nodes) {
  if ((degreeOf[node.id] || 0) > (degreeOf[mostConnectedNode.id] || 0)) {
    mostConnectedNode = node;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DETERMINISTIC LAYOUT
// ─────────────────────────────────────────────────────────────────────────────
// Strategy:
//   - Hub (INDEX) at center (0, 0)
//   - Knowledge clusters: evenly spaced around a circle, sorted by name
//   - Registries group: one dedicated slot after clusters
//   - References group: one dedicated slot after registries
//   - Within each cluster: nodes on a small arc/spiral at that angle
//   - Harness: noted as present/absent but not drawn as nodes (no harness node files)
//
// All positions are pure functions of (sorted cluster index, sorted node index).
// NO Math.random, NO Date-based seeding.

const CANVAS_W = 1400;
const CANVAS_H = 900;
const CX = CANVAS_W / 2;
const CY = CANVAS_H / 2;

const CLUSTER_ORBIT_R = 300;   // radius of cluster-group centres from hub
const NODE_ORBIT_R    = 90;    // radius of node spread around its cluster centre
const NODE_R_MIN      = 8;
const NODE_R_MAX      = 22;
const NODE_R_BASE     = 12;

// Groups: knowledge clusters + __registries__ + __references__
// hub is centre.
const groups = [...clusterNames];
if (registryNodes.length > 0)  groups.push('__registries__');
if (referenceNodes.length > 0) groups.push('__references__');

const totalGroups = groups.length;

function groupAngle(groupIndex) {
  // Evenly space groups around a full circle, starting from top (-π/2)
  return -Math.PI / 2 + (2 * Math.PI * groupIndex) / Math.max(totalGroups, 1);
}

function groupCentre(groupIndex) {
  const angle = groupAngle(groupIndex);
  return {
    x: CX + CLUSTER_ORBIT_R * Math.cos(angle),
    y: CY + CLUSTER_ORBIT_R * Math.sin(angle),
  };
}

function nodePosition(groupIndex, nodeIndex, nodeCount) {
  const centre = groupCentre(groupIndex);
  if (nodeCount === 1) return centre;  // single node sits at the group centre

  // Arc around group centre, perpendicular to the radial direction
  const baseAngle = groupAngle(groupIndex) + Math.PI / 2;
  // Spread nodes evenly across a 120-degree arc
  const arcSpan = (2 * Math.PI) / 3;
  const step    = nodeCount > 1 ? arcSpan / (nodeCount - 1) : 0;
  const angle   = baseAngle - arcSpan / 2 + step * nodeIndex;

  // Scale orbit radius with node count so they don't overlap
  const orbitR = Math.min(NODE_ORBIT_R, 30 + nodeCount * 12);

  return {
    x: centre.x + orbitR * Math.cos(angle),
    y: centre.y + orbitR * Math.sin(angle),
  };
}

// Assign positions
hubNode.x = CX;
hubNode.y = CY;

for (let gi = 0; gi < groups.length; gi++) {
  const groupName = groups[gi];
  let groupNodes;

  if (groupName === '__registries__') {
    groupNodes = [...registryNodes].sort((a, b) => a.id.localeCompare(b.id));
  } else if (groupName === '__references__') {
    groupNodes = [...referenceNodes].sort((a, b) => a.id.localeCompare(b.id));
  } else {
    groupNodes = [...(clusterMap[groupName] || [])].sort((a, b) => a.id.localeCompare(b.id));
  }

  for (let ni = 0; ni < groupNodes.length; ni++) {
    const pos = nodePosition(gi, ni, groupNodes.length);
    groupNodes[ni].x = pos.x;
    groupNodes[ni].y = pos.y;
  }
}

// Nodes without a position (safety fallback)
for (const node of nodes) {
  if (node.x === undefined) { node.x = CX; node.y = CY; }
}

// Node radius: clamp degree-based scaling
function nodeRadius(id) {
  const deg = degreeOf[id] || 0;
  if (id === hubId) return NODE_R_MAX;
  return Math.min(NODE_R_MAX, Math.max(NODE_R_MIN, NODE_R_BASE + deg * 1.5));
}

// ─────────────────────────────────────────────────────────────────────────────
// Colour palette (fixed, cycled by sorted group index)
// ─────────────────────────────────────────────────────────────────────────────

// Readable on white, executive-appropriate
const PALETTE = [
  '#2563eb', // blue-600
  '#16a34a', // green-600
  '#9333ea', // purple-600
  '#ea580c', // orange-600
  '#0891b2', // cyan-600
  '#be185d', // pink-700
  '#854d0e', // yellow-800
  '#475569', // slate-600
  '#0f766e', // teal-700
  '#7c3aed', // violet-600
  '#c2410c', // red-600
  '#065f46', // emerald-800
];

const HUB_COLOR      = '#1e293b';  // slate-800
const REG_COLOR      = '#d97706';  // amber-600
const REF_COLOR      = '#7c3aed';  // violet-600

function groupColor(groupName, groupIndex) {
  if (groupName === '__hub__')         return HUB_COLOR;
  if (groupName === '__registries__')  return REG_COLOR;
  if (groupName === '__references__')  return REF_COLOR;
  return PALETTE[groupIndex % PALETTE.length];
}

// Pre-assign color to each node
const clusterColorMap = {};
for (let gi = 0; gi < groups.length; gi++) {
  clusterColorMap[groups[gi]] = groupColor(groups[gi], gi);
}
clusterColorMap['__hub__'] = HUB_COLOR;

function nodeColor(node) {
  return clusterColorMap[node.group] || '#64748b';
}

// ─────────────────────────────────────────────────────────────────────────────
// Label shortening
// ─────────────────────────────────────────────────────────────────────────────

function shortenLabel(id, maxLen = 22) {
  if (id.length <= maxLen) return id;
  // Split kebab-case — keep first + last word
  const parts = id.split('-');
  if (parts.length >= 3) {
    return parts[0] + '-…-' + parts[parts.length - 1];
  }
  return id.slice(0, maxLen - 1) + '…';
}

// ─────────────────────────────────────────────────────────────────────────────
// Compute viewBox with margin
// ─────────────────────────────────────────────────────────────────────────────

const MARGIN = 80;
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const node of nodes) {
  const r = nodeRadius(node.id);
  minX = Math.min(minX, node.x - r - 30);  // 30 for label
  minY = Math.min(minY, node.y - r - 14);
  maxX = Math.max(maxX, node.x + r + 30);
  maxY = Math.max(maxY, node.y + r + 14);
}
if (!isFinite(minX)) { minX = 0; minY = 0; maxX = CANVAS_W; maxY = CANVAS_H; }
const vbX = minX - MARGIN;
const vbY = minY - MARGIN;
const vbW = (maxX - minX) + MARGIN * 2;
const vbH = (maxY - minY) + MARGIN * 2;

// ─────────────────────────────────────────────────────────────────────────────
// Stats
// ─────────────────────────────────────────────────────────────────────────────

const totalNodes    = nodes.length;
const totalEdges    = edgeList.length;
const totalClusters = clusterNames.length;
const generatedOn   = new Date().toISOString().slice(0, 10);

// Title bar: displayed in SVG, not used for viewBox
const displayTitle = titleArg || brainName;
const statsLine    = `${totalNodes} nodes · ${totalEdges} edges · ${totalClusters} clusters · ${orphanCount} orphans · most connected: ${mostConnectedNode.id} (${degreeOf[mostConnectedNode.id] || 0})`;

// ─────────────────────────────────────────────────────────────────────────────
// SVG generation
// ─────────────────────────────────────────────────────────────────────────────

// Legend entries
const legendEntries = [];
legendEntries.push({ label: 'INDEX (hub)', color: HUB_COLOR, count: 1 });
for (let gi = 0; gi < clusterNames.length; gi++) {
  const cn = clusterNames[gi];
  const c  = groupColor(cn, gi);
  legendEntries.push({ label: cn, color: c, count: (clusterMap[cn] || []).length });
}
if (registryNodes.length > 0)
  legendEntries.push({ label: 'registries', color: REG_COLOR, count: registryNodes.length });
if (referenceNodes.length > 0)
  legendEntries.push({ label: 'references', color: REF_COLOR, count: referenceNodes.length });
if (hasHarness)
  legendEntries.push({ label: 'harness (files)', color: '#94a3b8', count: null });

// Title bar height (drawn above the graph viewBox)
const TITLE_H  = 56;
const LEGEND_W = 220;
const LEGEND_ENTRY_H = 22;
const LEGEND_H = legendEntries.length * LEGEND_ENTRY_H + 24;

// Final SVG dimensions: viewBox is the graph area; we shift the graph down by TITLE_H
// and allocate LEGEND_W on the right.
const svgW = vbW + LEGEND_W;
const svgH = vbH + TITLE_H;

function buildSVG() {
  const lines = [];
  lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" font-family="system-ui,sans-serif">`);

  // Background
  lines.push(`  <rect width="${svgW}" height="${svgH}" fill="#ffffff"/>`);

  // Title bar
  lines.push(`  <rect x="0" y="0" width="${svgW}" height="${TITLE_H}" fill="#1e293b"/>`);
  lines.push(`  <text x="16" y="22" font-size="16" font-weight="700" fill="#f8fafc">${escXml(displayTitle)}</text>`);
  lines.push(`  <text x="16" y="40" font-size="10" fill="#94a3b8">${escXml(statsLine)}</text>`);
  lines.push(`  <text x="${svgW - 12}" y="40" font-size="9" fill="#64748b" text-anchor="end">generated ${generatedOn} · synaptic-core graph.js</text>`);

  // Graph area: shifted by TITLE_H in y
  // Transform group to offset (−vbX, TITLE_H − vbY)
  const tx = -vbX;
  const ty = TITLE_H - vbY;
  lines.push(`  <g transform="translate(${tx},${ty})">`);

  // Edges (drawn first, under nodes)
  lines.push(`    <g id="edges" opacity="0.45">`);
  for (const { from, to } of edgeList) {
    const fn = nodeById[from];
    const tn = nodeById[to];
    if (!fn || !tn) continue;
    lines.push(`      <line x1="${r2(fn.x)}" y1="${r2(fn.y)}" x2="${r2(tn.x)}" y2="${r2(tn.y)}" stroke="#94a3b8" stroke-width="1.2"/>`);
  }
  lines.push(`    </g>`);

  // Nodes
  lines.push(`    <g id="nodes">`);
  for (const node of nodes) {
    const rad   = nodeRadius(node.id);
    const color = nodeColor(node);
    const lbl   = shortenLabel(node.label);
    const title = escXml(`${node.id}\ntype: ${node.type}\ndegree: ${degreeOf[node.id] || 0}\ntags: ${node.tags.join(', ') || '—'}`);
    lines.push(`      <g>`);
    lines.push(`        <title>${title}</title>`);
    lines.push(`        <circle cx="${r2(node.x)}" cy="${r2(node.y)}" r="${rad}" fill="${color}" stroke="#fff" stroke-width="1.5"/>`);
    // Label below node
    lines.push(`        <text x="${r2(node.x)}" y="${r2(node.y + rad + 11)}" text-anchor="middle" font-size="9" fill="#1e293b" font-weight="${node.id === hubId ? '700' : '400'}">${escXml(lbl)}</text>`);
    lines.push(`      </g>`);
  }
  lines.push(`    </g>`);
  lines.push(`  </g>`);

  // Legend panel (right side, within full SVG coords)
  const legX = vbW + 8;
  const legY = TITLE_H + 8;
  lines.push(`  <rect x="${legX - 4}" y="${legY - 4}" width="${LEGEND_W - 4}" height="${LEGEND_H}" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1"/>`);
  lines.push(`  <text x="${legX + 4}" y="${legY + 14}" font-size="10" font-weight="700" fill="#1e293b">Clusters &amp; groups</text>`);
  for (let i = 0; i < legendEntries.length; i++) {
    const ey  = legY + 22 + i * LEGEND_ENTRY_H;
    const { label, color, count } = legendEntries[i];
    const countStr = count !== null ? ` (${count})` : '';
    lines.push(`  <rect x="${legX + 4}" y="${ey}" width="12" height="12" rx="3" fill="${color}"/>`);
    lines.push(`  <text x="${legX + 20}" y="${ey + 10}" font-size="10" fill="#334155">${escXml(label)}${escXml(countStr)}</text>`);
  }

  lines.push(`</svg>`);
  return lines.join('\n');
}

function escXml(s) {
  return String(s)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

function r2(n) {
  return Math.round(n * 100) / 100;
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML wrapper with pan/zoom (~30 lines of vanilla JS)
// ─────────────────────────────────────────────────────────────────────────────

function buildHTML(svgContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escXml(displayTitle)} — Synaptic Graph</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f1f5f9; display: flex; flex-direction: column; height: 100vh; font-family: system-ui, sans-serif; }
  #toolbar { background: #0f172a; color: #94a3b8; padding: 6px 14px; font-size: 12px; display: flex; gap: 16px; align-items: center; user-select: none; }
  #toolbar strong { color: #f8fafc; }
  #toolbar button { background: #1e293b; border: 1px solid #334155; color: #cbd5e1; border-radius: 4px; padding: 3px 10px; cursor: pointer; font-size: 11px; }
  #toolbar button:hover { background: #334155; }
  #container { flex: 1; overflow: hidden; position: relative; cursor: grab; }
  #container.dragging { cursor: grabbing; }
  #svgwrap { position: absolute; top: 0; left: 0; transform-origin: 0 0; }
  #hint { position: absolute; bottom: 10px; right: 14px; font-size: 11px; color: #94a3b8; pointer-events: none; }
</style>
</head>
<body>
<div id="toolbar">
  <strong>${escXml(displayTitle)}</strong>
  <span>${escXml(statsLine)}</span>
  <button onclick="resetView()">Reset view</button>
  <span style="margin-left:auto;font-size:10px;color:#475569">generated ${generatedOn} · synaptic-core graph.js</span>
</div>
<div id="container">
  <div id="svgwrap">
${svgContent}
  </div>
  <div id="hint">Drag to pan · Scroll to zoom</div>
</div>
<script>
(function() {
  var el = document.getElementById('container');
  var wrap = document.getElementById('svgwrap');
  var scale = 1, ox = 0, oy = 0;
  var dragging = false, sx = 0, sy = 0, sox = 0, soy = 0;

  function applyTransform() {
    wrap.style.transform = 'translate(' + ox + 'px,' + oy + 'px) scale(' + scale + ')';
  }

  el.addEventListener('mousedown', function(e) {
    dragging = true; sx = e.clientX; sy = e.clientY; sox = ox; soy = oy;
    el.classList.add('dragging');
  });
  window.addEventListener('mousemove', function(e) {
    if (!dragging) return;
    ox = sox + (e.clientX - sx); oy = soy + (e.clientY - sy);
    applyTransform();
  });
  window.addEventListener('mouseup', function() {
    dragging = false; el.classList.remove('dragging');
  });
  el.addEventListener('wheel', function(e) {
    e.preventDefault();
    var rect = el.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var delta = e.deltaY < 0 ? 1.12 : 0.89;
    var newScale = Math.min(8, Math.max(0.15, scale * delta));
    ox = mx - (mx - ox) * (newScale / scale);
    oy = my - (my - oy) * (newScale / scale);
    scale = newScale;
    applyTransform();
  }, { passive: false });

  function resetView() { scale = 1; ox = 0; oy = 0; applyTransform(); }
  window.resetView = resetView;
})();
</script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Write output
// ─────────────────────────────────────────────────────────────────────────────

let output;
try {
  const svg = buildSVG();
  output = format === 'svg' ? svg : buildHTML(svg);
} catch (err) {
  console.error('ERROR: failed to render graph:', err.message);
  // Emit a minimal error SVG so the output contract is always satisfied
  output = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100"><rect width="400" height="100" fill="#fff"/><text x="10" y="50" font-family="sans-serif" fill="red">graph.js render error: ${escXml(String(err.message))}</text></svg>`;
  if (format === 'html') output = `<!DOCTYPE html><html><body>${output}</body></html>`;
}

try {
  fs.writeFileSync(outFile, output, 'utf8');
} catch (err) {
  console.error('ERROR: could not write output file:', err.message);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

console.log(`\nSynaptic Brain Graph — ${displayTitle}`);
console.log(`  Brain path  : ${brainRoot}`);
console.log(`  Nodes       : ${totalNodes} (hub + ${totalNodes - 1} content nodes)`);
console.log(`  Edges       : ${totalEdges} undirected (deduplicated)`);
console.log(`  Clusters    : ${totalClusters} (${clusterNames.join(', ') || 'none'})`);
console.log(`  Registries  : ${registryNodes.length}`);
console.log(`  References  : ${referenceNodes.length}`);
console.log(`  Harness     : ${hasHarness ? 'present' : 'not found'}`);
console.log(`  Orphans     : ${orphanCount}`);
console.log(`  Unresolved  : ${unresolvedCount} wikilinks skipped (cluster-level or missing targets)`);
console.log(`  Most linked : ${mostConnectedNode.id} (degree ${degreeOf[mostConnectedNode.id] || 0})`);
console.log(`  Format      : ${format}`);
console.log(`  Output      : ${path.resolve(outFile)}`);
console.log();
