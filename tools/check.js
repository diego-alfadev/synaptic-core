#!/usr/bin/env node
// tools/check.js — Synaptic Brain lint helper (v0.4)
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

function readLines(filePath) {
  return fs.readFileSync(filePath, 'utf8').split('\n');
}

function isTemplate(filePath) {
  return path.basename(filePath).startsWith('_');
}

function isIndexOrReadme(filePath) {
  const base = path.basename(filePath).toLowerCase();
  return base === 'index.md' || base === 'readme.md' || base === '_index.md';
}

function isPlaceholder(value) {
  // Tolerates {{...}} placeholder values from the seed state.
  return typeof value === 'string' && /^\{\{.+\}\}$/.test(value.trim());
}

// Walk a directory recursively, returning absolute .md file paths.
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

// Parse a YAML frontmatter block (simple key: value, no nesting needed).
// Returns null if no frontmatter found.
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

// Extract all [[wikilinks]] from text, skipping HTML comments.
function extractWikilinks(lines) {
  const links = [];
  let inComment = false;
  for (const line of lines) {
    if (inComment) {
      if (line.includes('-->')) inComment = false;
      continue;
    }
    if (line.includes('<!--')) {
      // Detect single-line comments
      const stripped = line.replace(/<!--.*?-->/g, '');
      if (line.includes('<!--') && !line.includes('-->')) {
        inComment = true;
        // Still scan the part before the comment opens
        const before = line.slice(0, line.indexOf('<!--'));
        const found = [...before.matchAll(/\[\[([^\]]+)\]\]/g)];
        for (const m of found) links.push(m[1].trim());
        continue;
      }
      // Single-line comment stripped already — scan stripped
      const found = [...stripped.matchAll(/\[\[([^\]]+)\]\]/g)];
      for (const m of found) links.push(m[1].trim());
      continue;
    }
    const found = [...line.matchAll(/\[\[([^\]]+)\]\]/g)];
    for (const m of found) links.push(m[1].trim());
  }
  return links;
}

// Resolve a wikilink name to an existing .md path, or null.
// Search order: knowledge/, knowledge/lessons/, playbooks/, relative from brainRoot.
function resolveLink(linkName, brainRoot) {
  const candidates = [
    path.join(brainRoot, 'knowledge',         linkName + '.md'),
    path.join(brainRoot, 'knowledge', 'lessons', linkName + '.md'),
    path.join(brainRoot, 'playbooks',         linkName + '.md'),
    path.join(brainRoot,                       linkName + '.md'),
    // journal/... paths (linkName may include subdir like "journal/2026-05-12")
    path.join(brainRoot,                       linkName),
    path.join(brainRoot,                       linkName.endsWith('.md') ? linkName : linkName + '.md'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// Parse a date string; return Date or null.
function parseDate(str) {
  if (!str || isPlaceholder(str)) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Findings collector
// ---------------------------------------------------------------------------

const errors   = [];   // { file, message }
const warnings = [];   // { file, message }

function err(file, message) {
  errors.push({ file: path.relative(brainRoot, file), message });
}

function warn(file, message) {
  warnings.push({ file: path.relative(brainRoot, file), message });
}

// ---------------------------------------------------------------------------
// Check 1: BRAIN.md presence and line count
// ---------------------------------------------------------------------------

function checkBrainMd() {
  const brainFile = path.join(brainRoot, 'BRAIN.md');
  if (!fs.existsSync(brainFile)) {
    err(brainFile, 'BRAIN.md is missing');
    return;
  }
  const lines = readLines(brainFile);
  if (lines.length > 120) {
    warn(brainFile, `BRAIN.md is ${lines.length} lines (budget: 120)`);
  }
}

// ---------------------------------------------------------------------------
// Check 2: File size budgets
// ---------------------------------------------------------------------------

function checkSizeBudgets() {
  const journalCurrent = path.join(brainRoot, 'journal', '_current.md');
  if (fs.existsSync(journalCurrent)) {
    const lines = readLines(journalCurrent);
    if (lines.length > 200) {
      warn(journalCurrent, `journal/_current.md is ${lines.length} lines (budget: 200)`);
    }
  }

  const knowledgeDir = path.join(brainRoot, 'knowledge');
  for (const filePath of walkMd(knowledgeDir)) {
    const base = path.basename(filePath);
    if (isTemplate(filePath) || isIndexOrReadme(filePath)) continue;
    const lines = readLines(filePath);
    if (lines.length > 150) {
      warn(filePath, `knowledge page is ${lines.length} lines (budget: 150)`);
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
    if (isTemplate(filePath) || isIndexOrReadme(filePath)) continue;

    const lines = readLines(filePath);
    const fm = parseFrontmatter(lines);

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
// Check 4: Orphan pages (not listed in their index)
// ---------------------------------------------------------------------------

function readIndexText(indexPath) {
  if (!fs.existsSync(indexPath)) return '';
  return fs.readFileSync(indexPath, 'utf8');
}

function checkOrphans() {
  // Knowledge pages → knowledge/INDEX.md
  const knowledgeDir  = path.join(brainRoot, 'knowledge');
  const knowledgeIndex = path.join(brainRoot, 'knowledge', 'INDEX.md');
  const indexText = readIndexText(knowledgeIndex);

  for (const filePath of walkMd(knowledgeDir)) {
    if (isTemplate(filePath) || isIndexOrReadme(filePath)) continue;
    const name = path.basename(filePath, '.md');
    // Accept [[name]] or plain name as link text
    const linked = indexText.includes(`[[${name}]]`) || indexText.includes(name);
    if (!linked) {
      err(filePath, `knowledge page "${name}" not listed in knowledge/INDEX.md`);
    }
  }

  // Playbooks → playbooks/_index.md
  const playbooksDir   = path.join(brainRoot, 'playbooks');
  const playbooksIndex = path.join(brainRoot, 'playbooks', '_index.md');
  const pbIndexText = readIndexText(playbooksIndex);

  for (const filePath of walkMd(playbooksDir)) {
    if (isTemplate(filePath) || isIndexOrReadme(filePath)) continue;
    const name = path.basename(filePath, '.md');
    const linked = pbIndexText.includes(`[[${name}]]`) || pbIndexText.includes(name);
    if (!linked) {
      err(filePath, `playbook "${name}" not listed in playbooks/_index.md`);
    }
  }
}

// ---------------------------------------------------------------------------
// Check 5: Broken wikilinks
// ---------------------------------------------------------------------------

function checkBrokenLinks() {
  // All .md files inside brainRoot (recursive), excluding template files.
  const allMd = walkMd(brainRoot);

  for (const filePath of allMd) {
    if (isTemplate(filePath)) continue;

    const lines  = readLines(filePath);
    const links  = extractWikilinks(lines);

    for (const link of links) {
      const resolved = resolveLink(link, brainRoot);
      if (!resolved) {
        err(filePath, `broken wikilink: [[${link}]]`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Check 6: Staleness (updated: > 90 days ago)
// ---------------------------------------------------------------------------

function checkStaleness() {
  const now = Date.now();

  const knowledgeDir = path.join(brainRoot, 'knowledge');
  const playbooksDir = path.join(brainRoot, 'playbooks');
  const candidates   = [...walkMd(knowledgeDir), ...walkMd(playbooksDir)];

  for (const filePath of candidates) {
    if (isTemplate(filePath) || isIndexOrReadme(filePath)) continue;

    const lines = readLines(filePath);
    const fm    = parseFrontmatter(lines);
    if (!fm) continue;

    const updated = parseDate(fm.updated);
    if (!updated) continue; // placeholder or unparseable — skip

    if (now - updated.getTime() > NINETY_DAYS_MS) {
      const daysAgo = Math.floor((now - updated.getTime()) / (24 * 60 * 60 * 1000));
      warn(filePath, `page is stale: updated ${fm.updated} (${daysAgo} days ago)`);
    }
  }
}

// ---------------------------------------------------------------------------
// Check 7: Dangling v0.3 references
// ---------------------------------------------------------------------------

const V03_ARTIFACTS = ['BOOTSTRAP.md', 'MANIFEST.md', 'HEARTBEAT.md', '_tree.yaml'];

function checkDanglingV03() {
  const allMd = walkMd(brainRoot);

  for (const filePath of allMd) {
    if (isTemplate(filePath)) continue;

    const text = fs.readFileSync(filePath, 'utf8');
    for (const artifact of V03_ARTIFACTS) {
      if (text.includes(artifact)) {
        err(filePath, `references removed v0.3 artifact: ${artifact}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Run all checks
// ---------------------------------------------------------------------------

checkBrainMd();
checkSizeBudgets();
checkFrontmatter();
checkOrphans();
checkBrokenLinks();
checkStaleness();
checkDanglingV03();

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function printFindings(label, list) {
  if (list.length === 0) return;
  console.log(`\n${label}:`);
  // Group by file
  const byFile = {};
  for (const item of list) {
    (byFile[item.file] = byFile[item.file] || []).push(item.message);
  }
  for (const [file, messages] of Object.entries(byFile)) {
    console.log(`  ${file}`);
    for (const msg of messages) {
      console.log(`    - ${msg}`);
    }
  }
}

printFindings('ERRORS',   errors);
printFindings('WARNINGS', warnings);

const totalErrors   = errors.length;
const totalWarnings = warnings.length;

console.log(`\nSummary: ${totalErrors} error(s), ${totalWarnings} warning(s)`);

process.exit(totalErrors > 0 ? 1 : 0);
