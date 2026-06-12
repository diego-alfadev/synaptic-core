#!/usr/bin/env node
// tools/vault-open.js — Synaptic Brain generic knowledge-tool config (v1.0)
// Usage: node tools/vault-open.js <path-to-.synaptic>
//
// The brain is ALREADY a valid wikilink vault — just open its parent directory
// in any wikilink-aware tool. This script writes MINIMAL optional config for
// common tools and documents multi-tool compatibility.
//
// Supported tools (all work with the same unmodified brain):
//   - Obsidian            → writes .obsidian/{app,graph}.json
//   - Foam (VSCode ext.)  → writes .vscode/settings.json fragment (additive)
//   - Logseq              → writes logseq/config.edn (minimal)
//   - Dendron             → documents how to open (no config written — workspace.yml
//                           requires manual Dendron init)
//
// RULES:
//   - NEVER overwrites existing files (idempotent)
//   - NEVER modifies brain content (only additive config in tool-specific dirs)
//   - Additive to .vscode/settings.json (merge-safe: only writes if key absent)
//
// Node >= 18, zero npm dependencies.

'use strict';

const fs   = require('node:fs');
const path = require('node:path');

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const brainArg = process.argv[2];

if (!brainArg) {
  console.error('Usage: node tools/vault-open.js <path-to-.synaptic>');
  process.exit(1);
}

const brainRoot = path.resolve(brainArg);

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
// Helpers
// ---------------------------------------------------------------------------

function exists(p) { return fs.existsSync(p); }

/**
 * Write a file if it does not already exist. Returns true if written.
 */
function writeIfAbsent(filePath, content) {
  if (exists(filePath)) return false;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

/**
 * Merge JSON keys into an existing JSON file without overwriting keys the
 * user already has. If the file does not exist, create it.
 * Only adds top-level keys that are absent from the existing file.
 * Never removes or changes existing keys.
 */
function mergeJson(filePath, additions) {
  let existing = {};
  if (exists(filePath)) {
    try { existing = JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { /* leave empty */ }
  } else {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  let changed = false;
  for (const [key, value] of Object.entries(additions)) {
    if (!(key in existing)) {
      existing[key] = value;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(existing, null, 2) + '\n', 'utf8');
  }
  return changed;
}

// ---------------------------------------------------------------------------
// 1. Obsidian config (.obsidian/)
// ---------------------------------------------------------------------------

function setupObsidian() {
  const obsidianDir = path.join(brainRoot, '.obsidian');
  const created = [];

  // app.json: use wikilinks, shortest path, auto-update links on rename
  const appJson = path.join(obsidianDir, 'app.json');
  const wrote = writeIfAbsent(appJson, JSON.stringify({
    useMarkdownLinks: false,
    newLinkFormat: 'shortest',
    alwaysUpdateLinks: true,
  }, null, 2) + '\n');
  if (wrote) created.push('.obsidian/app.json');
  else created.push('.obsidian/app.json  (skipped — user config preserved)');

  // graph.json: exclude templates/ and journal/ from graph view (reduce noise)
  const graphJson = path.join(obsidianDir, 'graph.json');
  const wroteGraph = writeIfAbsent(graphJson, JSON.stringify({
    search: '-path:templates -path:journal',
    showTags: false,
  }, null, 2) + '\n');
  if (wroteGraph) created.push('.obsidian/graph.json');
  else created.push('.obsidian/graph.json  (skipped — user config preserved)');

  return created;
}

// ---------------------------------------------------------------------------
// 2. Foam / VSCode config (.vscode/settings.json — additive merge)
// ---------------------------------------------------------------------------

function setupFoam() {
  // The brain's parent directory is the VS Code workspace root
  const vscodeDir      = path.join(brainRoot, '..', '.vscode');
  const settingsFile   = path.join(vscodeDir, 'settings.json');
  const foamAdditions  = {
    // Foam: treat the .synaptic/ folder as the notes location
    'foam.openDailyNote.directory': '.',
    'foam.files.ignore': [
      '**/templates/**',
      '**/playgrounds/**',
      '**/references/raw/**',
    ],
    // Prefer wikilinks over markdown links (matches brain convention)
    'foam.link.style': 'wikilink',
    'foam.link.fileExtension': '',
  };

  const changed = mergeJson(settingsFile, foamAdditions);
  return changed
    ? ['.vscode/settings.json  (Foam keys merged — existing keys untouched)']
    : ['.vscode/settings.json  (skipped — Foam keys already present)'];
}

// ---------------------------------------------------------------------------
// 3. Logseq config (logseq/config.edn — minimal, only if absent)
// ---------------------------------------------------------------------------

function setupLogseq() {
  const logseqDir = path.join(brainRoot, 'logseq');
  const configEdn = path.join(logseqDir, 'config.edn');

  // Minimal EDN config: disable journal (we have our own journal/), set pages dir
  const ednContent = `{;; Synaptic brain — Logseq minimal config (generated by vault-open.js)
 ;; Open the parent of .synaptic/ as a Logseq graph.
 ;; Wikilinks and frontmatter work natively.
 :preferred-format :markdown
 :journal/page-title-format "yyyy-MM-dd"
 :feature/enable-journals? false
 :pages-directory "knowledge"
 :file/name-format :triple-lowbar
}
`;

  const wrote = writeIfAbsent(configEdn, ednContent);
  return wrote
    ? ['logseq/config.edn  (minimal config created)']
    : ['logseq/config.edn  (skipped — user config preserved)'];
}

// ---------------------------------------------------------------------------
// 4. OPEN-IN.md — multi-tool guide at brain root
// ---------------------------------------------------------------------------

function writeOpenInGuide() {
  const openInFile = path.join(brainRoot, 'OPEN-IN.md');
  const content = `# Opening This Brain in a Knowledge Tool

This brain is a plain Markdown wikilink vault. It opens as-is in any
wikilink-aware tool. \`vault-open.js\` writes minimal optional config for
the most common ones (idempotent — never overwrites your settings).

---

## Obsidian

1. Open Obsidian → "Open folder as vault"
2. Select the **parent** directory of \`.synaptic/\` (i.e. the folder that
   *contains* \`.synaptic/\`, so Obsidian sees it as a subfolder).
3. \`vault-open.js\` writes \`.obsidian/app.json\` + \`.obsidian/graph.json\`:
   - Wikilinks kept; shortest-path resolution; auto-update on rename.
   - \`templates/\` and \`journal/\` excluded from the graph view.

## Foam (VSCode extension)

1. Install the **Foam** extension from the VS Code marketplace.
2. Open the parent directory of \`.synaptic/\` as a VS Code workspace.
3. \`vault-open.js\` merges Foam settings into \`.vscode/settings.json\`
   (additive — never removes existing settings).
4. Backlinks, graph, and wikilink navigation work natively.

## Logseq

1. In Logseq → "Add a graph" → select the parent directory of \`.synaptic/\`.
2. \`vault-open.js\` writes \`logseq/config.edn\` with minimal settings:
   - Preferred format: Markdown.
   - Logseq journals disabled (use the brain's own \`journal/_current.md\`).
   - Knowledge pages directory: \`knowledge/\`.

## Dendron (VSCode extension)

1. Install the **Dendron** extension.
2. Run "Dendron: Initialize Workspace" in the parent directory.
3. Dendron uses its own \`dendron.yml\` + \`vault\` layout — manually configure
   the vault to point at the \`.synaptic/\` folder.
4. Wikilinks and frontmatter are compatible; Dendron adds hierarchical lookup.
   (No config is auto-written — Dendron's init is interactive.)

---

## Compatibility summary

| Tool | Wikilinks | Frontmatter | Graph | Notes |
|---|---|---|---|---|
| Obsidian | ✓ native | ✓ | ✓ | Best graph + backlink UX |
| Foam/VSCode | ✓ native | ✓ | ✓ | Best for code-alongside-notes |
| Logseq | ✓ native | ✓ | ✓ | Outline-first editing style |
| Dendron | ✓ native | ✓ | ✓ | Hierarchical lookup on top |

> The brain format (Markdown + YAML frontmatter + wikilinks) is the common
> denominator. You can switch tools at any time without reformatting content.
`;

  const wrote = writeIfAbsent(openInFile, content);
  return wrote
    ? ['OPEN-IN.md  (multi-tool guide created)']
    : ['OPEN-IN.md  (skipped — user file preserved)'];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log(`\nSynaptic vault-open — brain: ${brainRoot}\n`);

const allCreated = [];

console.log('--- Obsidian ---');
for (const item of setupObsidian()) console.log(`  ${item}`);

console.log('--- Foam / VSCode ---');
for (const item of setupFoam()) console.log(`  ${item}`);

console.log('--- Logseq ---');
for (const item of setupLogseq()) console.log(`  ${item}`);

console.log('--- Multi-tool guide ---');
for (const item of writeOpenInGuide()) console.log(`  ${item}`);

console.log(`
Done. No brain content was modified — only additive tool config was written.

Multi-tool note:
  This brain is format-neutral. Obsidian, Foam, Logseq, and Dendron all
  speak the same Markdown + wikilinks + YAML frontmatter format. You can
  open it in any of them without reformatting your notes. The synaptic-core
  CORE layer (the brain files themselves) never requires any of these tools
  — they are optional ergonomic overlays.

To open:
  Obsidian / Foam / Logseq / Dendron → open the PARENT directory of .synaptic/
  (the folder that contains .synaptic/ as a subfolder).
`);
