#!/usr/bin/env node
// tools/graph.js -- Synaptic Brain interactive graph renderer (v1.3.0)
//
// Renders a .synaptic/ brain as a SINGLE self-contained HTML file with an inline,
// vanilla-JS FORCE-DIRECTED simulation (charge/repulsion + link spring + centering),
// plus search, cluster/edge-type filters, and click-to-expand/collapse neighbours.
//
// Usage:
//   node tools/graph.js [path-to-.synaptic] [--out FILE] [--title "..."]
//
// Defaults:
//   path     ./.synaptic
//   --out    synaptic-graph.html
//
// Node >= 18, ZERO npm dependencies -- only node:fs, node:path, node:process.
// Deterministic layout: a SEEDED PRNG (never Math.random, never time-based).
// ZERO external URLs: all JS/CSS is inlined; no CDN, no <script src>, no <link href>.
//
// Interactive single-file graph UX inspired by Graphify (MIT) -- approach reused,
// code re-implemented, no dependency taken.
//
// Edge/degree universe is the SHARED tools/lib/brain-graph.js module -- the SAME
// knowledge-scoped, MOC-excluded universe check.js reports, so the two never disagree.

'use strict';

const fs   = require('node:fs');
const path = require('node:path');

const { buildBrainGraph, parseFrontmatterLite } = require('./lib/brain-graph');

// ---------------------------------------------------------------------------
// CLI parsing (preserve the existing surface: path / --out / --title)
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

let brainRoot = null;
let outFile   = null;
let titleArg  = null;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--out')    { outFile  = args[++i]; continue; }
  if (a === '--title')  { titleArg = args[++i]; continue; }
  if (a === '--format') { i++; continue; } // accepted for back-compat; html is the only mode now
  if (!a.startsWith('--')) { brainRoot = a; continue; }
}

brainRoot = path.resolve(brainRoot || './.synaptic');
if (!outFile) outFile = 'synaptic-graph.html';

if (!fs.existsSync(brainRoot)) {
  console.error(`ERROR: path not found: ${brainRoot}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Read the brain via the shared edge/degree universe
// ---------------------------------------------------------------------------

function readText(filePath) {
  try { return fs.readFileSync(filePath, 'utf8'); }
  catch (_) { return ''; }
}

let g;
try {
  g = buildBrainGraph(brainRoot);
} catch (e) {
  // Graceful degradation -- still emit a valid HTML file and a clear summary.
  g = { nodes: [], nodeById: {}, edgeList: [], degreeOf: {}, orphanCount: 0,
        nodeCount: 0, edgeCount: 0, edgesPerNode: 0, mocReachableCount: 0,
        clusters: [], unresolvedCount: 0 };
  console.error(`WARNING: graph build failed (${e.message}); emitting empty graph.`);
}

// Brain name -- from BRAIN.md frontmatter `name:`, else parent dir of .synaptic.
let brainName = path.basename(path.dirname(brainRoot));
try {
  const bfm = parseFrontmatterLite(readText(path.join(brainRoot, 'BRAIN.md')).split('\n'));
  if (bfm && bfm.name) brainName = bfm.name;
} catch (_) {}

const displayTitle = titleArg || brainName;

// ---------------------------------------------------------------------------
// Colour palette -- cluster to colour, cycled by sorted cluster index (deterministic)
// ---------------------------------------------------------------------------

const PALETTE = [
  '#2563eb', '#16a34a', '#9333ea', '#ea580c', '#0891b2', '#be185d',
  '#854d0e', '#475569', '#0f766e', '#7c3aed', '#c2410c', '#065f46',
];
const NO_CLUSTER_COLOR = '#64748b';

const clusterColor = {};
g.clusters.forEach((c, i) => { clusterColor[c] = PALETTE[i % PALETTE.length]; });

// Edge-type to colour/style. wikilink is the generic body link.
const EDGE_STYLES = {
  relates_to:  { color: '#94a3b8', dash: null,    label: 'relates_to'  },
  depends_on:  { color: '#2563eb', dash: null,    label: 'depends_on'  },
  supersedes:  { color: '#dc2626', dash: null,    label: 'supersedes'  },
  contradicts: { color: '#db2777', dash: '5,4',   label: 'contradicts' },
  applies_to:  { color: '#059669', dash: null,    label: 'applies_to'  },
  causes:      { color: '#d97706', dash: null,    label: 'causes'      },
  part_of:     { color: '#7c3aed', dash: null,    label: 'part_of'     },
  wikilink:    { color: '#cbd5e1', dash: '2,3',   label: 'wikilink'    },
};

// ---------------------------------------------------------------------------
// Build the client-side data model (plain JSON -- no functions, no cycles)
// ---------------------------------------------------------------------------

const clientNodes = g.nodes.map(n => ({
  id:        n.id,
  label:     n.label,
  cluster:   n.cluster || '(root)',
  type:      n.type,
  tags:      n.tags,
  lifecycle: n.lifecycle || null,
  degree:    g.degreeOf[n.id] || 0,
  color:     n.cluster ? (clusterColor[n.cluster] || NO_CLUSTER_COLOR) : NO_CLUSTER_COLOR,
}));

const clientEdges = g.edgeList.map(e => ({ a: e.a, b: e.b, type: e.type }));

const edgeTypesPresent = [...new Set(clientEdges.map(e => e.type))]
  .sort((x, y) => x.localeCompare(y));
const clustersPresent = [...new Set(clientNodes.map(n => n.cluster))]
  .sort((x, y) => x.localeCompare(y));

const generatedOn = new Date().toISOString().slice(0, 10);
const statsLine =
  `${g.nodeCount} nodes | ${g.edgeCount} edges | ${g.clusters.length} clusters | ` +
  `${g.orphanCount} orphans | ${g.edgesPerNode.toFixed(2)} edges/node | ` +
  `MOC-reachable ${g.mocReachableCount}/${g.nodeCount}`;

// ---------------------------------------------------------------------------
// HTML escaping + safe JSON embedding (no close-script break-out)
// ---------------------------------------------------------------------------

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Escape "<" so a literal close-script tag inside a string cannot terminate the
// inline <script>, and escape U+2028 / U+2029 (invalid raw in JS string literals).
// Regexes for the separators are built from char codes to stay pure-ASCII in source.
const RE_LS = new RegExp(String.fromCharCode(0x2028), 'g');
const RE_PS = new RegExp(String.fromCharCode(0x2029), 'g');
function safeJson(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(RE_LS, '\\u2028')
    .replace(RE_PS, '\\u2029');
}

// ---------------------------------------------------------------------------
// The self-contained HTML (inline CSS + inline JS force simulation + UI)
// ---------------------------------------------------------------------------

function buildHTML() {
  const DATA = {
    title: displayTitle,
    stats: statsLine,
    generatedOn,
    nodes: clientNodes,
    edges: clientEdges,
    edgeTypes: edgeTypesPresent,
    clusters: clustersPresent,
    edgeStyles: EDGE_STYLES,
    clusterColor,
    noClusterColor: NO_CLUSTER_COLOR,
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escHtml(displayTitle)} -- Synaptic Graph</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body { background: #f1f5f9; display: flex; flex-direction: column; height: 100vh;
         font-family: system-ui, -apple-system, sans-serif; color: #1e293b; overflow: hidden; }
  #toolbar { background: #0f172a; color: #cbd5e1; padding: 8px 14px; font-size: 12px;
             display: flex; gap: 12px; align-items: center; flex-wrap: wrap; user-select: none; z-index: 5; }
  #toolbar strong { color: #f8fafc; font-size: 13px; }
  #toolbar .stats { color: #94a3b8; }
  #toolbar input[type=search] { background: #1e293b; border: 1px solid #334155; color: #e2e8f0;
             border-radius: 4px; padding: 4px 8px; font-size: 12px; width: 200px; }
  #toolbar button { background: #1e293b; border: 1px solid #334155; color: #cbd5e1;
             border-radius: 4px; padding: 4px 10px; cursor: pointer; font-size: 11px; }
  #toolbar button:hover { background: #334155; }
  #toolbar .spacer { margin-left: auto; font-size: 10px; color: #475569; }
  #main { flex: 1; display: flex; min-height: 0; }
  #panel { width: 224px; background: #0b1220; color: #cbd5e1; overflow-y: auto;
           padding: 10px 12px; font-size: 12px; border-right: 1px solid #1e293b; }
  #panel h4 { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: #64748b;
              margin: 12px 0 6px; }
  #panel h4:first-child { margin-top: 0; }
  #panel label { display: flex; align-items: center; gap: 6px; padding: 2px 0; cursor: pointer; }
  #panel .sw { width: 11px; height: 11px; border-radius: 3px; flex: 0 0 auto; }
  #panel .dash { width: 16px; height: 0; border-top-width: 2px; border-top-style: solid; flex: 0 0 auto; }
  #panel .cnt { color: #64748b; margin-left: auto; font-variant-numeric: tabular-nums; }
  #stage { flex: 1; position: relative; overflow: hidden; cursor: grab; background: #ffffff; }
  #stage.dragging { cursor: grabbing; }
  svg { width: 100%; height: 100%; display: block; }
  .edge { stroke-opacity: .5; }
  .node circle { stroke: #fff; stroke-width: 1.5; cursor: pointer; }
  .node text { font-size: 9px; fill: #1e293b; pointer-events: none; }
  .node.dim { opacity: .12; }
  .edge.dim { opacity: .05; }
  .node.pinned circle { stroke: #0f172a; stroke-width: 2.5; }
  #tip { position: absolute; pointer-events: none; background: #0f172a; color: #e2e8f0;
         font-size: 11px; padding: 6px 8px; border-radius: 5px; max-width: 260px; display: none;
         box-shadow: 0 4px 12px rgba(0,0,0,.3); white-space: pre-line; z-index: 10; }
  #empty { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
           color: #94a3b8; font-size: 14px; text-align: center; padding: 20px; }
  #hint { position: absolute; bottom: 8px; right: 12px; font-size: 10px; color: #94a3b8; pointer-events: none; }
</style>
</head>
<body>
<div id="toolbar">
  <strong>${escHtml(displayTitle)}</strong>
  <span class="stats">${escHtml(statsLine)}</span>
  <input type="search" id="search" placeholder="Search nodes... (Enter to center)" autocomplete="off">
  <button id="resetView">Reset view</button>
  <button id="resetFilters">Show all</button>
  <button id="reheat">Re-run layout</button>
  <span class="spacer">generated ${escHtml(generatedOn)} | synaptic-core graph.js</span>
</div>
<div id="main">
  <aside id="panel">
    <h4>Clusters</h4>
    <div id="clusterFilters"></div>
    <h4>Edge types</h4>
    <div id="edgeFilters"></div>
    <h4>Lifecycle</h4>
    <div id="lifecycleFilters"></div>
  </aside>
  <div id="stage">
    <svg id="svg" xmlns="http://www.w3.org/2000/svg"></svg>
    <div id="tip"></div>
    <div id="hint">Drag canvas to pan | scroll to zoom | drag a node to pin | click to expand/collapse</div>
    <div id="empty" style="display:none">This brain has no knowledge nodes to graph yet.<br>Add nodes under <code>knowledge/</code> and re-run.</div>
  </div>
</div>
<script>
"use strict";
var DATA = ${safeJson(DATA)};
(function(){
  var SVGNS = "http://www.w3.org/2000/svg";
  var svg   = document.getElementById("svg");
  var stage = document.getElementById("stage");
  var tip   = document.getElementById("tip");

  // ---- deterministic seeded PRNG (mulberry32) -- NEVER Math.random / time ----
  function mulberry32(seed){
    return function(){
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  // Seed derived only from node count -- same brain => same seed => same layout.
  var rand = mulberry32(1013904223 + DATA.nodes.length * 2654435761);

  // ---- model ---------------------------------------------------------------
  var nodes = DATA.nodes.map(function(n){ return {
    id:n.id, label:n.label, cluster:n.cluster, type:n.type, tags:n.tags,
    lifecycle:n.lifecycle, degree:n.degree, color:n.color,
    x:0, y:0, vx:0, vy:0, r: Math.max(6, Math.min(22, 7 + n.degree*1.6)),
    pinned:false, _collapsed:false, collapsedHidden:false
  };});
  var byId = {}; nodes.forEach(function(n){ byId[n.id]=n; });
  var edges = DATA.edges.filter(function(e){ return byId[e.a] && byId[e.b]; })
                        .map(function(e){ return { a:byId[e.a], b:byId[e.b], type:e.type }; });

  // adjacency (for expand/collapse + neighbour highlight)
  var adj = {}; nodes.forEach(function(n){ adj[n.id]=[]; });
  edges.forEach(function(e){ adj[e.a.id].push(e.b.id); adj[e.b.id].push(e.a.id); });

  if (nodes.length === 0){ document.getElementById("empty").style.display="flex"; }

  // ---- deterministic initial placement (seeded circle) ----------------------
  var W = stage.clientWidth || 900, H = stage.clientHeight || 600;
  var CX = W/2, CY = H/2;
  nodes.forEach(function(n,i){
    var ang = (i / Math.max(1,nodes.length)) * Math.PI * 2;
    var rad = 40 + rand() * Math.min(W,H) * 0.35;
    n.x = CX + Math.cos(ang)*rad;
    n.y = CY + Math.sin(ang)*rad;
  });

  // ---- force simulation (charge/repulsion + link spring + centering) --------
  var LINK_DIST = 90, LINK_K = 0.04, CHARGE = -1800, CENTER_K = 0.008, DAMP = 0.85;
  var alpha = 1.0;
  function step(){
    if (alpha < 0.005) return false;
    var i, j, n, m, dx, dy, d2, d, f;
    // repulsion (O(n^2) -- fine for brain-scale node counts)
    for (i=0;i<nodes.length;i++){
      n = nodes[i]; if (!n._vis) continue;
      for (j=i+1;j<nodes.length;j++){
        m = nodes[j]; if (!m._vis) continue;
        dx = n.x-m.x; dy = n.y-m.y; d2 = dx*dx+dy*dy || 0.01; d = Math.sqrt(d2);
        f = (CHARGE * alpha) / d2;
        var ux = dx/d, uy = dy/d;
        n.vx += ux*f; n.vy += uy*f; m.vx -= ux*f; m.vy -= uy*f;
      }
    }
    // link spring
    for (i=0;i<edges.length;i++){
      var e = edges[i]; if (!e._vis) continue;
      n = e.a; m = e.b;
      dx = m.x-n.x; dy = m.y-n.y; d = Math.sqrt(dx*dx+dy*dy) || 0.01;
      f = LINK_K * alpha * (d - LINK_DIST);
      var lx = (dx/d)*f, ly = (dy/d)*f;
      n.vx += lx; n.vy += ly; m.vx -= lx; m.vy -= ly;
    }
    // centering + integrate
    for (i=0;i<nodes.length;i++){
      n = nodes[i]; if (!n._vis) continue;
      n.vx += (CX - n.x) * CENTER_K * alpha;
      n.vy += (CY - n.y) * CENTER_K * alpha;
      if (n.pinned){ n.vx=0; n.vy=0; continue; }
      n.vx *= DAMP; n.vy *= DAMP;
      n.x += n.vx; n.y += n.vy;
    }
    alpha *= 0.985;
    return true;
  }

  // ---- rendering ------------------------------------------------------------
  function mk(t){ return document.createElementNS(SVGNS,t); }
  var gRoot  = mk("g"); svg.appendChild(gRoot);
  var gEdges = mk("g"); gRoot.appendChild(gEdges);
  var gNodes = mk("g"); gRoot.appendChild(gNodes);

  edges.forEach(function(e){
    var line = mk("line"); line.setAttribute("class","edge");
    var st = DATA.edgeStyles[e.type] || DATA.edgeStyles.wikilink;
    line.setAttribute("stroke", st.color); line.setAttribute("stroke-width","1.3");
    if (st.dash) line.setAttribute("stroke-dasharray", st.dash);
    gEdges.appendChild(line); e._el = line;
  });

  nodes.forEach(function(n){
    var gN = mk("g"); gN.setAttribute("class","node");
    var c = mk("circle"); c.setAttribute("r", n.r); c.setAttribute("fill", n.color);
    var t = mk("text"); t.setAttribute("text-anchor","middle");
    t.textContent = shorten(n.label);
    gN.appendChild(c); gN.appendChild(t); gNodes.appendChild(gN);
    n._el = gN; n._circle = c; n._text = t;
    wireNode(n, gN, c);
  });

  function shorten(id){
    if (id.length <= 22) return id;
    var p = id.split("-");
    if (p.length >= 3) return p[0]+"-...-"+p[p.length-1];
    return id.slice(0,21)+"...";
  }

  function render(){
    for (var i=0;i<edges.length;i++){
      var e = edges[i];
      e._el.setAttribute("x1", r2(e.a.x)); e._el.setAttribute("y1", r2(e.a.y));
      e._el.setAttribute("x2", r2(e.b.x)); e._el.setAttribute("y2", r2(e.b.y));
    }
    for (var k=0;k<nodes.length;k++){
      var n = nodes[k];
      n._circle.setAttribute("cx", r2(n.x)); n._circle.setAttribute("cy", r2(n.y));
      n._text.setAttribute("x", r2(n.x)); n._text.setAttribute("y", r2(n.y + n.r + 10));
    }
  }
  function r2(v){ return Math.round(v*100)/100; }

  // ---- visibility (filters + expand/collapse) -------------------------------
  var hiddenClusters = {}, hiddenEdgeTypes = {}, hideResource = false, hideArchived = false;
  function passesLifecycle(n){
    if (hideResource && n.lifecycle === "resource") return false;
    if (hideArchived && (n.lifecycle === "archived" || n.lifecycle === "dormant")) return false;
    return true;
  }
  function computeVisibility(){
    nodes.forEach(function(n){
      n._vis = !hiddenClusters[n.cluster] && passesLifecycle(n) && !n.collapsedHidden;
    });
    edges.forEach(function(e){
      e._vis = e.a._vis && e.b._vis && !hiddenEdgeTypes[e.type];
    });
    nodes.forEach(function(n){ n._el.style.display = n._vis ? "" : "none"; });
    edges.forEach(function(e){ e._el.style.display = e._vis ? "" : "none"; });
  }

  // click a node: toggle collapse of its neighbours that have no other anchor
  function toggleExpand(n){
    var neigh = adj[n.id] || [];
    n._collapsed = !n._collapsed;
    neigh.forEach(function(id){
      var m = byId[id];
      if (!m) return;
      var others = (adj[id]||[]).filter(function(o){ return o !== n.id; });
      var hasOtherAnchor = others.some(function(o){ var mm=byId[o]; return mm && !mm._collapsed; });
      if (!hasOtherAnchor){ m.collapsedHidden = n._collapsed; }
    });
    computeVisibility(); reheat(0.4);
  }

  // ---- interaction: hover, drag, pan, zoom ----------------------------------
  function wireNode(n, gN, c){
    gN.addEventListener("mouseenter", function(ev){ showTip(n, ev); highlight(n, true); });
    gN.addEventListener("mousemove", function(ev){ moveTip(ev); });
    gN.addEventListener("mouseleave", function(){ tip.style.display="none"; highlight(n, false); });
    var down=false, moved=false;
    gN.addEventListener("mousedown", function(ev){
      ev.stopPropagation(); down=true; moved=false;
      n.pinned = true; gN.classList.add("pinned");
    });
    window.addEventListener("mousemove", function(ev){
      if (!down) return;
      var p = toWorld(ev.clientX, ev.clientY);
      n.x = p.x; n.y = p.y; moved=true; reheat(0.3);
    });
    window.addEventListener("mouseup", function(){
      if (!down) return; down=false;
      if (!moved){ toggleExpand(n); }
    });
  }
  function highlight(n, on){
    // On mouseleave, do NOT blanket-clear "dim": that would wipe an active search filter
    // (search and hover share the same "dim" class). Restore whatever the search box asks
    // for instead — applySearch() clears all dims when the query is empty, so a plain
    // hover-off with no search behaves exactly as before.
    if (!on){ applySearch(); return; }
    var keep = {}; keep[n.id]=1; (adj[n.id]||[]).forEach(function(id){ keep[id]=1; });
    nodes.forEach(function(m){ if(!keep[m.id]) m._el.classList.add("dim"); });
    edges.forEach(function(e){ if(e.a.id!==n.id && e.b.id!==n.id) e._el.classList.add("dim"); });
  }
  function showTip(n, ev){
    tip.textContent = n.id + "\\n" + "cluster: " + n.cluster + " | type: " + n.type +
      "\\ndegree: " + n.degree + (n.lifecycle ? " | lifecycle: " + n.lifecycle : "") +
      "\\ntags: " + (n.tags && n.tags.length ? n.tags.join(", ") : "-");
    tip.style.display="block"; moveTip(ev);
  }
  function moveTip(ev){
    var b = stage.getBoundingClientRect();
    tip.style.left = (ev.clientX - b.left + 12) + "px";
    tip.style.top  = (ev.clientY - b.top + 12) + "px";
  }

  // pan / zoom
  var scale=1, ox=0, oy=0;
  function applyTransform(){ gRoot.setAttribute("transform","translate("+ox+","+oy+") scale("+scale+")"); }
  function toWorld(cx, cy){ var b=stage.getBoundingClientRect(); return { x:(cx-b.left-ox)/scale, y:(cy-b.top-oy)/scale }; }
  var pan=false, psx=0, psy=0, pox=0, poy=0;
  stage.addEventListener("mousedown", function(ev){ pan=true; psx=ev.clientX; psy=ev.clientY; pox=ox; poy=oy; stage.classList.add("dragging"); });
  window.addEventListener("mousemove", function(ev){ if(!pan) return; ox=pox+(ev.clientX-psx); oy=poy+(ev.clientY-psy); applyTransform(); });
  window.addEventListener("mouseup", function(){ pan=false; stage.classList.remove("dragging"); });
  stage.addEventListener("wheel", function(ev){
    ev.preventDefault();
    var b=stage.getBoundingClientRect(), mx=ev.clientX-b.left, my=ev.clientY-b.top;
    var delta = ev.deltaY<0 ? 1.12 : 0.89;
    var ns = Math.min(8, Math.max(0.12, scale*delta));
    ox = mx-(mx-ox)*(ns/scale); oy = my-(my-oy)*(ns/scale); scale=ns; applyTransform();
  }, {passive:false});

  // ---- filter UI ------------------------------------------------------------
  function swatch(color){ var s=document.createElement("span"); s.className="sw"; s.style.background=color; return s; }
  function dashSwatch(color, dash){ var s=document.createElement("span"); s.className="dash"; s.style.borderTopColor=color; if(dash) s.style.borderTopStyle="dashed"; return s; }

  var clusterCounts={}, edgeCounts={};
  nodes.forEach(function(n){ clusterCounts[n.cluster]=(clusterCounts[n.cluster]||0)+1; });
  edges.forEach(function(e){ edgeCounts[e.type]=(edgeCounts[e.type]||0)+1; });

  var cf = document.getElementById("clusterFilters");
  DATA.clusters.forEach(function(cl){
    var color = DATA.clusterColor[cl] || DATA.noClusterColor;
    var lab=document.createElement("label");
    var cb=document.createElement("input"); cb.type="checkbox"; cb.checked=true;
    cb.addEventListener("change", function(){ hiddenClusters[cl]=!cb.checked; computeVisibility(); reheat(0.3); });
    lab.appendChild(cb); lab.appendChild(swatch(color));
    var tx=document.createElement("span"); tx.textContent=cl; lab.appendChild(tx);
    var cn=document.createElement("span"); cn.className="cnt"; cn.textContent=clusterCounts[cl]||0; lab.appendChild(cn);
    cf.appendChild(lab);
  });

  var ef = document.getElementById("edgeFilters");
  DATA.edgeTypes.forEach(function(et){
    var st = DATA.edgeStyles[et] || DATA.edgeStyles.wikilink;
    var lab=document.createElement("label");
    var cb=document.createElement("input"); cb.type="checkbox"; cb.checked=true;
    cb.addEventListener("change", function(){ hiddenEdgeTypes[et]=!cb.checked; computeVisibility(); });
    lab.appendChild(cb); lab.appendChild(dashSwatch(st.color, st.dash));
    var tx=document.createElement("span"); tx.textContent=et; lab.appendChild(tx);
    var cn=document.createElement("span"); cn.className="cnt"; cn.textContent=edgeCounts[et]||0; lab.appendChild(cn);
    ef.appendChild(lab);
  });

  var lf = document.getElementById("lifecycleFilters");
  [["resource","hide resource"],["archived","hide archived/dormant"]].forEach(function(pair){
    var lab=document.createElement("label");
    var cb=document.createElement("input"); cb.type="checkbox"; cb.checked=false;
    cb.addEventListener("change", function(){
      if(pair[0]==="resource") hideResource=cb.checked; else hideArchived=cb.checked;
      computeVisibility(); reheat(0.3);
    });
    lab.appendChild(cb); var tx=document.createElement("span"); tx.textContent=pair[1]; lab.appendChild(tx);
    lf.appendChild(lab);
  });

  // ---- search ---------------------------------------------------------------
  var searchBox = document.getElementById("search");
  // Apply the current search query to the shared "dim" class. Empty query clears all dims.
  // Defined as a hoisted function declaration so highlight() (above) can call it on
  // mouseleave to restore search state instead of wiping it.
  function applySearch(){
    var q = searchBox.value.trim().toLowerCase();
    nodes.forEach(function(n){
      if (!q){ n._el.classList.remove("dim"); return; }
      if (n.id.toLowerCase().indexOf(q) >= 0) n._el.classList.remove("dim");
      else n._el.classList.add("dim");
    });
    if(!q) edges.forEach(function(e){ e._el.classList.remove("dim"); });
    else edges.forEach(function(e){ e._el.classList.add("dim"); });
  }
  searchBox.addEventListener("input", applySearch);
  searchBox.addEventListener("keydown", function(ev){
    if (ev.key !== "Enter") return;
    var q = searchBox.value.trim().toLowerCase();
    // Empty box: Enter is a no-op. Otherwise indexOf("")===0 would match (and center on)
    // the first visible node, jumping the viewport for no reason.
    if (!q) return;
    var hit = nodes.filter(function(n){ return n._vis && n.id.toLowerCase().indexOf(q)>=0; })[0];
    if (hit){ ox = stage.clientWidth/2 - hit.x*scale; oy = stage.clientHeight/2 - hit.y*scale; applyTransform(); }
  });

  // ---- buttons --------------------------------------------------------------
  document.getElementById("resetView").addEventListener("click", function(){ scale=1; ox=0; oy=0; applyTransform(); });
  document.getElementById("reheat").addEventListener("click", function(){ reheat(1.0); });
  document.getElementById("resetFilters").addEventListener("click", function(){
    hiddenClusters={}; hiddenEdgeTypes={}; hideResource=false; hideArchived=false;
    nodes.forEach(function(n){ n._collapsed=false; n.collapsedHidden=false; });
    var boxes = document.querySelectorAll("#panel input[type=checkbox]");
    for (var i=0;i<boxes.length;i++){
      var inLifecycle = boxes[i].parentNode.parentNode.id === "lifecycleFilters";
      boxes[i].checked = inLifecycle ? false : true;
    }
    computeVisibility(); reheat(0.6);
  });

  // ---- animation loop -------------------------------------------------------
  var running=false;
  function reheat(a){ alpha = Math.max(alpha, a || 1.0); if(!running) loop(); }
  function loop(){
    running=true;
    var alive = step();
    render();
    if (alive) requestAnimationFrame(loop); else running=false;
  }

  computeVisibility();
  applyTransform();
  loop();
})();
</script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

let output;
try {
  output = buildHTML();
} catch (e) {
  console.error('ERROR: failed to render graph:', e.message);
  output = `<!DOCTYPE html><html><body><p style="font-family:sans-serif;color:red">` +
           `graph.js render error: ${escHtml(String(e.message))}</p></body></html>`;
}

try {
  fs.writeFileSync(outFile, output, 'utf8');
} catch (e) {
  console.error('ERROR: could not write output file:', e.message);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\nSynaptic Brain Graph -- ${displayTitle}`);
console.log(`  Brain path    : ${brainRoot}`);
console.log(`  Nodes         : ${g.nodeCount} (knowledge, non-MOC)`);
console.log(`  Edges         : ${g.edgeCount} undirected (typed frontmatter edges + body [[wikilinks]], deduped)`);
console.log(`  Clusters      : ${g.clusters.length} (${g.clusters.join(', ') || 'none'})`);
console.log(`  Orphans       : ${g.orphanCount}`);
console.log(`  Edges/node    : ${g.edgesPerNode.toFixed(2)}`);
console.log(`  MOC-reachable : ${g.mocReachableCount}/${g.nodeCount}`);
console.log(`  Unresolved    : ${g.unresolvedCount} link(s) pointed at a non-node (skipped)`);
console.log(`  Layout        : force-directed, seeded (deterministic), interactive`);
console.log(`  Output        : ${path.resolve(outFile)}`);
console.log();
