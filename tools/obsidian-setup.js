#!/usr/bin/env node
// tools/obsidian-setup.js — Add minimal Obsidian vault config to a .synaptic/ folder.
// Usage: node tools/obsidian-setup.js [path-to-.synaptic]
// Node >= 18, zero npm dependencies.
// IMPORTANT: never modifies brain content — purely additive .obsidian/ config.

'use strict';

const fs   = require('node:fs');
const path = require('node:path');

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const brainRoot = path.resolve(process.argv[2] || './.synaptic');

if (!fs.existsSync(brainRoot)) {
  console.error(`ERROR: path not found: ${brainRoot}`);
  process.exit(1);
}

const brainFile = path.join(brainRoot, 'BRAIN.md');
if (!fs.existsSync(brainFile)) {
  console.error(`ERROR: ${brainRoot} does not appear to be a Synaptic brain (BRAIN.md not found)`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Config files to create
// ---------------------------------------------------------------------------

const obsidianDir = path.join(brainRoot, '.obsidian');

/**
 * app.json: disable Markdown links (keep wikilinks); use shortest path resolution;
 * always update links on rename.
 */
const APP_JSON = JSON.stringify({
  useMarkdownLinks: false,
  newLinkFormat: 'shortest',
  alwaysUpdateLinks: true,
}, null, 2);

/**
 * graph.json: exclude templates and journal from the graph view.
 * Obsidian graph.json search field uses the same query syntax as Obsidian search.
 * "-path:templates -path:journal" hides nodes whose vault-relative path contains
 * those strings. showTags: false reduces graph noise.
 * NOTE: This schema was validated against Obsidian's documented graph.json format.
 * If a future Obsidian version changes the schema, edit this file manually.
 */
const GRAPH_JSON = JSON.stringify({
  search: '-path:templates -path:journal',
  showTags: false,
}, null, 2);

/**
 * appearance.json: empty object — use Obsidian defaults.
 * Present so Obsidian does not prompt for theme choices on first open.
 */
const APPEARANCE_JSON = JSON.stringify({}, null, 2);

const CONFIG_FILES = [
  { name: 'app.json',        content: APP_JSON },
  { name: 'graph.json',      content: GRAPH_JSON },
  { name: 'appearance.json', content: APPEARANCE_JSON },
];

// ---------------------------------------------------------------------------
// Write — idempotent (never overwrite existing files)
// ---------------------------------------------------------------------------

// Create .obsidian/ dir if absent
if (!fs.existsSync(obsidianDir)) {
  fs.mkdirSync(obsidianDir, { recursive: true });
  console.log(`Created  .obsidian/`);
} else {
  console.log(`Exists   .obsidian/  (skipped)`);
}

for (const { name, content } of CONFIG_FILES) {
  const dest = path.join(obsidianDir, name);
  if (fs.existsSync(dest)) {
    console.log(`Exists   .obsidian/${name}  (skipped — user config preserved)`);
  } else {
    fs.writeFileSync(dest, content, 'utf8');
    console.log(`Created  .obsidian/${name}`);
  }
}

// ---------------------------------------------------------------------------
// Summary note
// ---------------------------------------------------------------------------

console.log(`
Open .synaptic/ as a vault in Obsidian.
Wikilinks and frontmatter work natively; this script only adds graph hygiene.

Tips:
  - graph.json excludes templates/ and journal/ from the graph view (noise reduction).
  - app.json keeps wikilink syntax and enables auto-link-update on rename.
  - appearance.json is empty — Obsidian will use its defaults; edit freely.
  - None of your brain content was modified.
`);
