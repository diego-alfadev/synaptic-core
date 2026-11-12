#!/usr/bin/env node
// tools/export.js — Synaptic Brain single-file export (v1.0)
// Usage:
//   node tools/export.js <path-to-.synaptic> [out.md]           # single-file export
//   node tools/export.js <path-to-.synaptic> [out-prefix] --split  # split into section files
//
// Concatenates all Markdown/YAML in the brain into one Markdown file with:
//   - Table of contents at the top
//   - "## FILE: <relpath>" header before each file's content
//   - references/raw/ binaries listed as "omitted binary payloads" (not embedded)
//   - Deterministic ordering (by section, then alphabetical within section)
//
// --split mode: emits 4 named section files (useful for email/chat size limits):
//   {prefix}-core.md      BRAIN.md + harness/
//   {prefix}-knowledge.md knowledge/
//   {prefix}-registries.md registries/
//   {prefix}-refs-harness.md references/ + templates/ + journal/
//
// Node >= 18, zero npm dependencies.

'use strict';

const fs   = require('node:fs');
const path = require('node:path');

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const rawArgs  = process.argv.slice(2);
const splitMode = rawArgs.includes('--split');
const args     = rawArgs.filter(a => a !== '--split');

const brainArg = args[0];
const outArg   = args[1];

if (!brainArg) {
  console.error('Usage: node tools/export.js <path-to-.synaptic> [out.md] [--split]');
  process.exit(1);
}

const brainRoot = path.resolve(brainArg);

if (!fs.existsSync(brainRoot)) {
  console.error(`ERROR: path not found: ${brainRoot}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readText(p) { return fs.readFileSync(p, 'utf8'); }

function isMarkdown(p) {
  return p.endsWith('.md') || p.endsWith('.yaml') || p.endsWith('.yml');
}

const BINARY_EXTS = new Set([
  '.sql', '.xlsx', '.xls', '.csv', '.pdf', '.png', '.jpg', '.jpeg',
  '.gif', '.svg', '.zip', '.gz', '.tar', '.bin',
]);

function isBinary(p) {
  return BINARY_EXTS.has(path.extname(p).toLowerCase());
}

/**
 * Walk a directory; return { mdFiles, binaryFiles }.
 * mdFiles: paths to .md and .yaml files.
 * binaryFiles: paths to binary payloads.
 */
function walkDir(dir) {
  const mdFiles     = [];
  const binaryFiles = [];
  if (!fs.existsSync(dir)) return { mdFiles, binaryFiles };

  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        if (entry.name === '.gitkeep') continue;
        if (isBinary(full)) binaryFiles.push(full);
        else if (isMarkdown(full)) mdFiles.push(full);
      }
    }
  }
  walk(dir);
  return { mdFiles, binaryFiles };
}

/**
 * Render a single file as an export section.
 */
function renderFile(filePath, brainRoot) {
  const rel     = path.relative(brainRoot, filePath).replace(/\\/g, '/');
  const content = readText(filePath).trimEnd();
  return `## FILE: ${rel}\n\n${content}\n`;
}

/**
 * Render a binary placeholder.
 */
function renderBinary(filePath, brainRoot) {
  const rel  = path.relative(brainRoot, filePath).replace(/\\/g, '/');
  const size = fs.statSync(filePath).size;
  return `## FILE: ${rel}  [OMITTED BINARY PAYLOAD — ${size} bytes]\n`;
}

/**
 * Rows of tasks/INDEX.md as { id, status, home }; columns found by header name.
 * check.js has the same reader (parseWorkIndex) with the same rules for empty cells and brain-side
 * homes; keep them in step. They move to tools/lib/core-lib.js once that file's pending rework lands.
 */
function readTaskRows(brainRoot) {
  const file = path.join(brainRoot, 'tasks', 'INDEX.md');
  if (!fs.existsSync(file)) return [];
  const rows = [];
  let cols = null;
  for (const raw of readText(file).split('\n')) {
    const line = raw.replace(/\r$/, '').trim();
    if (!line.startsWith('|')) continue;
    const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
    if (cells[0] === 'id') { cols = cells; continue; }
    if (!cols || /^-+$/.test(cells[0].replace(/:/g, ''))) continue;
    const row = {};
    cols.forEach((name, i) => { row[name] = cells[i] || ''; });
    rows.push(row);
  }
  return rows;
}

/** True when p, after resolving `..` and symlinks, is inside brainRoot. */
function insideBrain(brainRoot, p) {
  const within = (rel) => rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
  if (!within(path.relative(path.resolve(brainRoot), path.resolve(p)))) return false;
  if (!fs.existsSync(p)) return true;
  return within(path.relative(fs.realpathSync(brainRoot), fs.realpathSync(p)));
}

function collectWorkDocuments(brainRoot) {
  const files = [];
  const notes = [];
  for (const row of readTaskRows(brainRoot)) {
    const home = (row.home || '').replace(/\\/g, '/');
    if (!home || home === 'inline' || home === '—' || home === '-' || home.startsWith('proposals/')) continue; // proposals/ is exported whole
    if (!/^(playgrounds|proposals|tasks)\//.test(home)) {
      notes.push(`${row.id}: \`${home}\` — external: read in place by its owner, not part of the brain`);
      continue;
    }
    const abs = path.join(brainRoot, home);
    if (!insideBrain(brainRoot, abs)) { notes.push(`${row.id}: \`${home}\` — resolves outside the brain; not exported`); continue; }
    let doc = null;
    if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
      if (fs.existsSync(path.join(abs, 'tasks.md'))) doc = path.join(abs, 'tasks.md');
      else { notes.push(`${row.id}: \`${home}\` — a folder with no tasks.md; its other files are not exported`); continue; }
    } else if (fs.existsSync(abs) && isMarkdown(abs)) {
      doc = abs;
    }
    if (!doc) { notes.push(`${row.id}: \`${home}\` — does not resolve in this brain`); continue; }
    if (!insideBrain(brainRoot, doc)) { notes.push(`${row.id}: \`${home}\` — resolves outside the brain; not exported`); continue; }
    if (!files.includes(doc)) files.push(doc);
  }
  return { files, notes };
}

function renderNotes(section) {
  if (!section.notes || !section.notes.length) return '';
  return `## Work documents referenced, not included\n\n${section.notes.map(n => `- ${n}`).join('\n')}\n`;
}

// ---------------------------------------------------------------------------
// Section ordering for single-file export
//
// Sections in deterministic order:
//   1. BRAIN.md (root)
//   2. harness/
//   3. knowledge/
//   4. registries/
//   5. references/ (excluding raw/)
//   6. references/raw/ (binary payloads listed, not embedded)
//   7. templates/
//   8. journal/
//   9. tasks/, proposals/, then the work documents task rows point at (open or archived)
//  10. playgrounds/  (README only; scratch and other playground files are not exported)
// ---------------------------------------------------------------------------

function collectSections(brainRoot) {
  const sections = [];

  // 1. BRAIN.md
  const brainFile = path.join(brainRoot, 'BRAIN.md');
  if (fs.existsSync(brainFile)) {
    sections.push({ label: 'Core — BRAIN.md', files: [brainFile], binaries: [] });
  }

  // 2. harness/
  const harnessWalk = walkDir(path.join(brainRoot, 'harness'));
  if (harnessWalk.mdFiles.length) {
    sections.push({ label: 'Harness', files: harnessWalk.mdFiles, binaries: [] });
  }

  // 3. knowledge/
  const knowledgeWalk = walkDir(path.join(brainRoot, 'knowledge'));
  if (knowledgeWalk.mdFiles.length) {
    sections.push({ label: 'Knowledge', files: knowledgeWalk.mdFiles, binaries: [] });
  }

  // 4. registries/
  const registriesWalk = walkDir(path.join(brainRoot, 'registries'));
  if (registriesWalk.mdFiles.length) {
    sections.push({ label: 'Registries', files: registriesWalk.mdFiles, binaries: [] });
  }

  // 5+6. references/ (split: md vs raw/ binaries)
  const refsDir    = path.join(brainRoot, 'references');
  const refsRawDir = path.join(brainRoot, 'references', 'raw');
  const refsMd     = [];
  const refsBinary = [];
  if (fs.existsSync(refsDir)) {
    for (const f of walkDir(refsDir).mdFiles) {
      // exclude files under raw/ (raw/ may have .md text files — treat as content, not binary)
      refsMd.push(f);
    }
    for (const f of walkDir(refsDir).binaryFiles) {
      refsBinary.push(f);
    }
    // Also pick up any non-binary files directly under raw/
    if (fs.existsSync(refsRawDir)) {
      for (const entry of fs.readdirSync(refsRawDir, { withFileTypes: true })) {
        if (entry.isFile() && isBinary(path.join(refsRawDir, entry.name))) {
          refsBinary.push(path.join(refsRawDir, entry.name));
        }
      }
    }
  }
  if (refsMd.length || refsBinary.length) {
    sections.push({ label: 'References', files: refsMd, binaries: refsBinary });
  }

  // 7. templates/
  const templatesWalk = walkDir(path.join(brainRoot, 'templates'));
  if (templatesWalk.mdFiles.length) {
    sections.push({ label: 'Templates', files: templatesWalk.mdFiles, binaries: [] });
  }

  // 8. journal/
  const journalWalk = walkDir(path.join(brainRoot, 'journal'));
  if (journalWalk.mdFiles.length) {
    sections.push({ label: 'Journal', files: journalWalk.mdFiles, binaries: [] });
  }

  // Work-item records are portable state; playground scratch remains excluded.
  for (const name of ['tasks', 'proposals']) {
    const work = walkDir(path.join(brainRoot, name));
    if (work.mdFiles.length) sections.push({label: name === 'tasks' ? 'Tasks' : 'Proposals', files: work.mdFiles, binaries: []});
  }

  // Work documents: what each tasks/INDEX.md row's `home` points at, open or closed (a closed
  // playground lives under playgrounds/archive/<year>/<id>/). Other playground files and scratch
  // stay out. A home outside the brain, or one that does not resolve, is listed, never embedded.
  const workDocs = collectWorkDocuments(brainRoot);
  if (workDocs.files.length || workDocs.notes.length) {
    sections.push({ label: 'Work documents', files: workDocs.files, binaries: [], notes: workDocs.notes });
  }

  // 9. playgrounds/ — only README if present; other playground files are not exported
  const playgroundsReadme = path.join(brainRoot, 'playgrounds', 'README.md');
  if (fs.existsSync(playgroundsReadme)) {
    sections.push({ label: 'Playgrounds (README only)', files: [playgroundsReadme], binaries: [] });
  }

  return sections;
}

// ---------------------------------------------------------------------------
// Build ToC
// ---------------------------------------------------------------------------

function buildToc(sections, brainRoot) {
  const lines = ['# Table of Contents\n'];
  let globalIdx = 1;
  for (const section of sections) {
    lines.push(`### ${section.label}`);
    for (const f of section.files) {
      const rel = path.relative(brainRoot, f).replace(/\\/g, '/');
      lines.push(`  ${globalIdx++}. \`${rel}\``);
    }
    for (const b of section.binaries) {
      const rel = path.relative(brainRoot, b).replace(/\\/g, '/');
      lines.push(`  ${globalIdx++}. \`${rel}\`  *(omitted binary payload)*`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Single-file export
// ---------------------------------------------------------------------------

function exportSingle(brainRoot, outFile) {
  const sections = collectSections(brainRoot);
  const parts    = [];

  parts.push(`# Synaptic Brain Export\n`);
  parts.push(`> Brain: \`${brainRoot}\`\n> Exported: ${new Date().toISOString()}\n`);
  parts.push('---\n');
  parts.push(buildToc(sections, brainRoot));
  parts.push('---\n');

  for (const section of sections) {
    parts.push(`# ${section.label}\n`);
    for (const f of section.files) {
      parts.push(renderFile(f, brainRoot));
      parts.push('\n---\n');
    }
    for (const b of section.binaries) {
      parts.push(renderBinary(b, brainRoot));
      parts.push('\n---\n');
    }
    if (section.notes && section.notes.length) parts.push(renderNotes(section));
  }

  const content = parts.join('\n');
  fs.writeFileSync(outFile, content, 'utf8');

  const kb = (Buffer.byteLength(content, 'utf8') / 1024).toFixed(1);
  console.log(`Exported ${outFile}  (${kb} KB)`);
  let count = 0;
  for (const s of sections) count += s.files.length + s.binaries.length;
  console.log(`  ${count} files included`);
}

// ---------------------------------------------------------------------------
// Split export
// ---------------------------------------------------------------------------

function exportSplit(brainRoot, prefix) {
  const sections = collectSections(brainRoot);

  // Map section labels to split files
  const splitMap = [
    {
      outFile: `${prefix}-core.md`,
      labels:  new Set(['Core — BRAIN.md', 'Harness']),
    },
    {
      outFile: `${prefix}-knowledge.md`,
      labels:  new Set(['Knowledge']),
    },
    {
      outFile: `${prefix}-registries.md`,
      labels:  new Set(['Registries']),
    },
    {
      outFile: `${prefix}-refs-harness.md`,
      labels:  new Set(['References', 'Templates', 'Journal', 'Tasks', 'Proposals', 'Work documents', 'Playgrounds (README only)']),
    },
  ];

  for (const split of splitMap) {
    const parts = [];
    parts.push(`# Synaptic Brain Export — ${split.outFile}\n`);
    parts.push(`> Brain: \`${brainRoot}\`\n> Exported: ${new Date().toISOString()}\n`);
    parts.push('---\n');

    let fileCount = 0;
    for (const section of sections) {
      if (!split.labels.has(section.label)) continue;
      parts.push(`# ${section.label}\n`);
      for (const f of section.files) {
        parts.push(renderFile(f, brainRoot));
        parts.push('\n---\n');
        fileCount++;
      }
      for (const b of section.binaries) {
        parts.push(renderBinary(b, brainRoot));
        parts.push('\n---\n');
        fileCount++;
      }
      if (section.notes && section.notes.length) { parts.push(renderNotes(section)); fileCount++; }
    }

    if (fileCount === 0) {
      console.log(`Skipped  ${split.outFile}  (no matching sections)`);
      continue;
    }

    const content = parts.join('\n');
    fs.writeFileSync(split.outFile, content, 'utf8');
    const kb = (Buffer.byteLength(content, 'utf8') / 1024).toFixed(1);
    console.log(`Exported ${split.outFile}  (${kb} KB, ${fileCount} files)`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

if (splitMode) {
  const prefix = outArg || 'synaptic-export';
  console.log(`Split export from ${brainRoot}  (prefix: ${prefix})`);
  exportSplit(brainRoot, prefix);
} else {
  const outFile = outArg || 'synaptic-export.md';
  console.log(`Single-file export from ${brainRoot}  →  ${outFile}`);
  exportSingle(brainRoot, outFile);
}
