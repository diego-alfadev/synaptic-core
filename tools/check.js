#!/usr/bin/env node
// tools/check.js — Synaptic Brain lint helper (v0.5)
// Usage: node tools/check.js [path-to-.synaptic]
// Node >= 18, zero npm dependencies.

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readLines(filePath) {
  return readText(filePath).split('\n');
}

/** Returns true if the file lives under the templates/ directory. */
function isUnderTemplates(filePath) {
  const rel = path.relative(brainRoot, filePath);
  return rel.startsWith('templates' + path.sep) || rel.startsWith('templates/');
}

/** Returns true for index/readme sentinel files (excluded from content checks). */
function isIndexOrReadme(filePath) {
  const base = path.basename(filePath).toLowerCase();
  return base === 'index.md' || base === 'readme.md' || base === '_index.md';
}

/** Returns true for {{...}} placeholder values from the seed state. */
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
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkMd(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Parse BRAIN.md frontmatter including the nested `budgets:` block.
 * Returns { fields, budgets } where budgets defaults to { journal:80, page:150, brain:100 }.
 */
function parseBrainFrontmatter(lines) {
  const DEFAULT_BUDGETS = { journal: 80, page: 150, brain: 100 };
  if (lines[0] !== '---') return { fields: {}, budgets: DEFAULT_BUDGETS };
  const endIdx = lines.indexOf('---', 1);
  if (endIdx === -1) return { fields: {}, budgets: DEFAULT_BUDGETS };

  const fields  = {};
  const budgets = {};
  let inBudgets = false;

  for (let i = 1; i < endIdx; i++) {
    const line = lines[i];

    // Detect start of `budgets:` block (key at column 0, no value on same line)
    if (/^budgets:\s*$/.test(line)) {
      inBudgets = true;
      continue;
    }

    if (inBudgets) {
      // Two-space-indented sub-key under budgets
      const sub = line.match(/^  (\w+):\s*(\d+)/);
      if (sub) {
        budgets[sub[1]] = parseInt(sub[2], 10);
        continue;
      }
      // Any non-indented line ends the budgets block
      if (!/^ /.test(line)) inBudgets = false;
    }

    if (!inBudgets) {
      const match = line.match(/^(\w[\w-]*):\s*(.*)/);
      if (match) fields[match[1]] = match[2].trim();
    }
  }

  return {
    fields,
    budgets: {
      journal: budgets.journal ?? DEFAULT_BUDGETS.journal,
      page:    budgets.page    ?? DEFAULT_BUDGETS.page,
      brain:   budgets.brain   ?? DEFAULT_BUDGETS.brain,
    },
  };
}

/**
 * Parse a simple key:value YAML frontmatter block (no nesting).
 * Returns null if no frontmatter found.
 */
function parseFrontmatter(lines) {
  if (lines[0] !== '---') return null;
  const endIdx = lines.indexOf('---', 1);
  if (endIdx === -1) return null;
  const fields = {};
  for (let i = 1; i < endIdx; i++) {
    const match = lines[i].match(/^(\w[\w-]*):\s*(.*)/);
    if (match) fields[match[1]] = match[2].trim();
  }
  return fields;
}

/**
 * Extract all [[wikilinks]] from text, skipping:
 *   - HTML comment blocks (<!-- ... -->)
 *   - inline code spans (`...`)
 */
function extractWikilinks(lines) {
  const links = [];
  let inComment = false;

  for (const rawLine of lines) {
    // --- HTML comment state machine ---
    if (inComment) {
      if (rawLine.includes('-->')) inComment = false;
      continue;
    }

    // Strip inline code spans before any analysis
    // Replace `...` with spaces so wikilinks inside code don't fire
    let line = rawLine.replace(/`[^`]*`/g, (m) => ' '.repeat(m.length));

    // Handle opening of HTML comment on this line
    if (line.includes('<!--')) {
      if (!line.includes('-->')) {
        // Multi-line comment starts here — scan before the comment opens
        const before = line.slice(0, line.indexOf('<!--'));
        const found = [...before.matchAll(/\[\[([^\]]+)\]\]/g)];
        for (const m of found) links.push(m[1].trim());
        inComment = true;
        continue;
      }
      // Single-line comment — strip it and scan the rest
      line = line.replace(/<!--.*?-->/g, '');
    }

    const found = [...line.matchAll(/\[\[([^\]]+)\]\]/g)];
    for (const m of found) links.push(m[1].trim());
  }

  return links;
}

/**
 * Resolve a wikilink name to an existing .md path, or null.
 * Search order: knowledge/, knowledge/lessons/, playbooks/, brain-root-relative.
 */
function resolveLink(linkName, root) {
  // linkName may contain a subpath like "references/_index"
  const withMd = linkName.endsWith('.md') ? linkName : linkName + '.md';
  const candidates = [
    path.join(root, 'knowledge',          withMd),
    path.join(root, 'knowledge', 'lessons', withMd),
    path.join(root, 'playbooks',          withMd),
    path.join(root,                        withMd),
    // also without forcing .md extension (in case linkName already has it)
    path.join(root, 'knowledge',          linkName),
    path.join(root, 'knowledge', 'lessons', linkName),
    path.join(root, 'playbooks',          linkName),
    path.join(root,                        linkName),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

/** Parse a date string; return Date or null. */
function parseDate(str) {
  if (!str || isPlaceholder(str)) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

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
// Read budgets from BRAIN.md frontmatter (used by several checks)
// ---------------------------------------------------------------------------

const brainFile     = path.join(brainRoot, 'BRAIN.md');
const brainExists   = fs.existsSync(brainFile);
const brainLines    = brainExists ? readLines(brainFile) : [];
const { budgets }   = brainExists
  ? parseBrainFrontmatter(brainLines)
  : { budgets: { journal: 80, page: 150, brain: 100 } };

// ---------------------------------------------------------------------------
// Check 1: Required layout files present; v0.4/v0.3 leftovers absent
// ---------------------------------------------------------------------------

function checkLayout() {
  // Required files
  if (!brainExists) {
    err(brainFile, 'BRAIN.md is missing');
  }

  const indexFile = path.join(brainRoot, 'knowledge', 'INDEX.md');
  if (!fs.existsSync(indexFile)) {
    err(indexFile, 'knowledge/INDEX.md is missing');
  }

  // v0.4 / v0.3 leftovers — directories
  const leftoverDirs = ['identity', 'worklines', 'skills'];
  for (const d of leftoverDirs) {
    const p = path.join(brainRoot, d);
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      err(p, `v0.4/v0.3 leftover directory: ${d}/`);
    }
  }

  // Leftover files (at brainRoot level)
  const leftoverRootFiles = ['cortex.config.yaml', 'BOOTSTRAP.md', 'MANIFEST.md'];
  for (const f of leftoverRootFiles) {
    const p = path.join(brainRoot, f);
    if (fs.existsSync(p)) {
      err(p, `v0.4/v0.3 leftover file: ${f}`);
    }
  }

  // Leftover files under knowledge/
  const leftoverKnowledgeFiles = ['_tree.yaml', '_page_template.md'];
  for (const f of leftoverKnowledgeFiles) {
    const p = path.join(brainRoot, 'knowledge', f);
    if (fs.existsSync(p)) {
      err(p, `v0.4/v0.3 leftover file: knowledge/${f}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Check 2: Size budgets (from BRAIN.md frontmatter, with fallback defaults)
// ---------------------------------------------------------------------------

function checkSizeBudgets() {
  // BRAIN.md line budget
  if (brainExists && brainLines.length > budgets.brain) {
    warn(brainFile, `BRAIN.md is ${brainLines.length} lines (budget: ${budgets.brain})`);
  }

  // journal/_current.md line budget
  const journalCurrent = path.join(brainRoot, 'journal', '_current.md');
  if (fs.existsSync(journalCurrent)) {
    const lines = readLines(journalCurrent);
    if (lines.length > budgets.journal) {
      warn(journalCurrent, `journal/_current.md is ${lines.length} lines (budget: ${budgets.journal})`);
    }
  }

  // knowledge/ pages and playbooks/ pages — page budget
  // Exclusions: INDEX.md, README.md, _index.md, files under templates/
  const knowledgeDir = path.join(brainRoot, 'knowledge');
  const playbooksDir = path.join(brainRoot, 'playbooks');

  for (const filePath of [...walkMd(knowledgeDir), ...walkMd(playbooksDir)]) {
    if (isUnderTemplates(filePath) || isIndexOrReadme(filePath)) continue;
    const lines = readLines(filePath);
    if (lines.length > budgets.page) {
      warn(filePath, `page is ${lines.length} lines (budget: ${budgets.page})`);
    }
  }
}

// ---------------------------------------------------------------------------
// Check 3: Frontmatter required fields
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS = ['description', 'updated', 'status'];

function checkFrontmatter() {
  const knowledgeDir = path.join(brainRoot, 'knowledge');
  const playbooksDir = path.join(brainRoot, 'playbooks');

  const candidates = [
    ...walkMd(knowledgeDir),
    ...walkMd(playbooksDir),
  ];

  for (const filePath of candidates) {
    if (isUnderTemplates(filePath) || isIndexOrReadme(filePath)) continue;

    const lines = readLines(filePath);
    const fm    = parseFrontmatter(lines);

    if (!fm) {
      err(filePath, 'missing frontmatter (no --- block found)');
      continue;
    }

    for (const field of REQUIRED_FIELDS) {
      if (!(field in fm)) {
        err(filePath, `frontmatter missing required field: ${field}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Check 4: Naming — knowledge pages must be kebab-case; no duplicate basenames
// ---------------------------------------------------------------------------

const KEBAB_RE = /^[a-z0-9]+(-[a-z0-9]+)*\.md$/;

function checkNaming() {
  const knowledgeDir = path.join(brainRoot, 'knowledge');
  if (!fs.existsSync(knowledgeDir)) return;

  const seen    = new Map();  // basename (without .md) -> first file path
  const dupes   = new Set();  // basenames that are duplicated

  for (const filePath of walkMd(knowledgeDir)) {
    if (isUnderTemplates(filePath) || isIndexOrReadme(filePath)) continue;

    const base = path.basename(filePath);

    // kebab-case check
    if (!KEBAB_RE.test(base)) {
      err(filePath, `filename is not kebab-case: "${base}"`);
    }

    // duplicate basename check
    const stem = path.basename(filePath, '.md');
    if (seen.has(stem)) {
      if (!dupes.has(stem)) {
        err(seen.get(stem), `duplicate basename: "${stem}.md" appears in multiple subdirs`);
        dupes.add(stem);
      }
      err(filePath, `duplicate basename: "${stem}.md" appears in multiple subdirs`);
    } else {
      seen.set(stem, filePath);
    }
  }
}

// ---------------------------------------------------------------------------
// Check 5: Orphan pages (not referenced from their index)
// ---------------------------------------------------------------------------

function checkOrphans() {
  const knowledgeDir   = path.join(brainRoot, 'knowledge');
  const knowledgeIndex = path.join(brainRoot, 'knowledge', 'INDEX.md');
  const indexText      = fs.existsSync(knowledgeIndex) ? readText(knowledgeIndex) : '';

  for (const filePath of walkMd(knowledgeDir)) {
    if (isUnderTemplates(filePath) || isIndexOrReadme(filePath)) continue;
    const name   = path.basename(filePath, '.md');
    const linked = indexText.includes(`[[${name}]]`);
    if (!linked) {
      err(filePath, `knowledge page "${name}" not referenced in knowledge/INDEX.md`);
    }
  }

  const playbooksDir   = path.join(brainRoot, 'playbooks');
  const playbooksIndex = path.join(brainRoot, 'playbooks', '_index.md');
  const pbIndexText    = fs.existsSync(playbooksIndex) ? readText(playbooksIndex) : '';

  for (const filePath of walkMd(playbooksDir)) {
    if (isUnderTemplates(filePath) || isIndexOrReadme(filePath)) continue;
    const name   = path.basename(filePath, '.md');
    const linked = pbIndexText.includes(`[[${name}]]`);
    if (!linked) {
      err(filePath, `playbook "${name}" not referenced in playbooks/_index.md`);
    }
  }
}

// ---------------------------------------------------------------------------
// Check 6: Broken [[wikilinks]] (skip templates/, skip HTML comments, skip inline code)
// ---------------------------------------------------------------------------

function checkBrokenLinks() {
  for (const filePath of walkMd(brainRoot)) {
    if (isUnderTemplates(filePath)) continue;

    const lines = readLines(filePath);
    const links = extractWikilinks(lines);

    for (const link of links) {
      const resolved = resolveLink(link, brainRoot);
      if (!resolved) {
        err(filePath, `broken wikilink: [[${link}]]`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Check 7: References — cross-check files vs _index.md entries
// ---------------------------------------------------------------------------

function checkReferences() {
  const refsDir   = path.join(brainRoot, 'references');
  const refsIndex = path.join(brainRoot, 'references', '_index.md');

  if (!fs.existsSync(refsDir)) return;

  const indexText = fs.existsSync(refsIndex) ? readText(refsIndex) : '';

  // Every non-_index file in references/ must be mentioned in _index.md
  for (const entry of fs.readdirSync(refsDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (entry.name === '_index.md') continue;
    if (!indexText.includes(entry.name)) {
      err(path.join(refsDir, entry.name),
          `file in references/ not mentioned in references/_index.md: ${entry.name}`);
    }
  }

  // Every filename mentioned in _index.md non-comment lines should exist
  // Collect lines outside HTML comment blocks
  const indexLines = indexText.split('\n');
  let inComment = false;
  for (const line of indexLines) {
    if (inComment) {
      if (line.includes('-->')) inComment = false;
      continue;
    }
    if (line.includes('<!--')) {
      if (!line.includes('-->')) { inComment = true; }
      continue;
    }
    // Look for a bare filename pattern: word chars + dot + extension
    const fileMatch = line.match(/`([^`\s]+\.[a-zA-Z0-9]+)`/);
    if (fileMatch) {
      const mentioned = fileMatch[1];
      if (mentioned === '_index.md') continue;
      const candidate = path.join(refsDir, mentioned);
      if (!fs.existsSync(candidate)) {
        warn(refsIndex, `_index.md mentions "${mentioned}" but file does not exist`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Check 8: Playgrounds — warn if a playground dir is not mentioned in journal
// ---------------------------------------------------------------------------

function checkPlaygrounds() {
  const playgroundsDir = path.join(brainRoot, 'playgrounds');
  if (!fs.existsSync(playgroundsDir)) return;

  const journalCurrent = path.join(brainRoot, 'journal', '_current.md');
  const journalText    = fs.existsSync(journalCurrent) ? readText(journalCurrent) : '';

  for (const entry of fs.readdirSync(playgroundsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const dirName = entry.name;
    if (!journalText.includes(dirName)) {
      warn(path.join(playgroundsDir, dirName),
           `playground "${dirName}" is not mentioned in journal/_current.md`);
    }
  }
}

// ---------------------------------------------------------------------------
// Check 9: Staleness — warn on pages with updated: > 90 days ago
// ---------------------------------------------------------------------------

function checkStaleness() {
  const now = Date.now();

  const knowledgeDir = path.join(brainRoot, 'knowledge');
  const playbooksDir = path.join(brainRoot, 'playbooks');

  for (const filePath of [...walkMd(knowledgeDir), ...walkMd(playbooksDir)]) {
    if (isUnderTemplates(filePath) || isIndexOrReadme(filePath)) continue;

    const fm = parseFrontmatter(readLines(filePath));
    if (!fm) continue;

    const updated = parseDate(fm.updated);
    if (!updated) continue;  // placeholder or unparseable — skip

    if (now - updated.getTime() > NINETY_DAYS_MS) {
      const daysAgo = Math.floor((now - updated.getTime()) / (24 * 60 * 60 * 1000));
      warn(filePath, `page is stale: updated ${fm.updated} (${daysAgo} days ago)`);
    }
  }
}

// ---------------------------------------------------------------------------
// Run all checks
// ---------------------------------------------------------------------------

checkLayout();
checkSizeBudgets();
checkFrontmatter();
checkNaming();
checkOrphans();
checkBrokenLinks();
checkReferences();
checkPlaygrounds();
checkStaleness();

// ---------------------------------------------------------------------------
// Report — grouped by file
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

console.log(`\nSummary: ${totalErrors} error(s), ${totalWarnings} warning(s)`);

process.exit(totalErrors > 0 ? 1 : 0);
