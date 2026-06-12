#!/usr/bin/env node
// tools/deploy.js — Synaptic Brain harness deploy helper (v1.0)
// Usage: node tools/deploy.js <project-root> [--dry-run]
//
// Deploys .synaptic/harness/conventions.md + guardrails.md into the outer harness
// (AGENTS.md at <project-root>) by writing/replacing a marker-bounded block.
//
// SAFETY GUARANTEES:
//   - Refuses (exit 1) if harness/ files contain {{placeholder}} content
//   - Backs up AGENTS.md to AGENTS.md.bak before any write
//   - Prints a diff/preview of the block change before applying
//   - --dry-run: preview only — never writes
//   - Idempotent: replaces only the marked block; never touches unmarked content
//
// EMITTED BLOCK FORMAT:
//   <!-- BEGIN:SYNAPTIC-RULES -->
//   <!-- Auto-generated from .synaptic/harness/ — edit the source there, then re-run deploy; edits here are overwritten. -->
//   ## Working Conventions
//   {conventions content — YAML frontmatter stripped}
//   ## Guardrails
//   {guardrails content — YAML frontmatter stripped}
//   <!-- END:SYNAPTIC-RULES -->
//
// Node >= 18, zero npm dependencies.

'use strict';

const fs   = require('node:fs');
const path = require('node:path');

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const rawArgs    = process.argv.slice(2);
const dryRun     = rawArgs.includes('--dry-run');
const args       = rawArgs.filter(a => a !== '--dry-run');
const projectArg = args[0];

if (!projectArg) {
  console.error('Usage: node tools/deploy.js <project-root> [--dry-run]');
  process.exit(1);
}

const projectRoot = path.resolve(projectArg);
if (!fs.existsSync(projectRoot)) {
  console.error(`ERROR: project root not found: ${projectRoot}`);
  process.exit(1);
}

const brainRoot      = path.join(projectRoot, '.synaptic');
const conventionsPath = path.join(brainRoot, 'harness', 'conventions.md');
const guardrailsPath  = path.join(brainRoot, 'harness', 'guardrails.md');
const agentsPath      = path.join(projectRoot, 'AGENTS.md');
const agentsBackup    = path.join(projectRoot, 'AGENTS.md.bak');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isFile(p) { return fs.existsSync(p) && fs.statSync(p).isFile(); }

/**
 * Strip YAML frontmatter (--- ... ---) from the top of a Markdown file.
 * Returns the body with a single leading newline trimmed.
 */
function stripFrontmatter(content) {
  const lines = content.split('\n');
  if (lines[0].trim() !== '---') return content.trimStart();
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { end = i; break; }
  }
  if (end === -1) return content.trimStart();
  return lines.slice(end + 1).join('\n').replace(/^\n+/, '');
}

/**
 * Returns true if content contains at least one {{...}} placeholder token.
 */
function hasPlaceholders(content) {
  return /\{\{[^}]+\}\}/.test(content);
}

/**
 * Produce a simple line-by-line diff representation between two strings.
 * Not a full unified diff — just enough to preview additions/removals clearly.
 */
function simpleDiff(before, after, label) {
  const oldLines = before ? before.split('\n') : [];
  const newLines = after.split('\n');

  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  const removed = oldLines.filter(l => !newSet.has(l)).map(l => `  - ${l}`);
  const added   = newLines.filter(l => !oldSet.has(l)).map(l => `  + ${l}`);

  if (removed.length === 0 && added.length === 0) {
    return `[${label}] No changes — block already up to date.`;
  }

  const parts = [];
  if (removed.length) parts.push(removed.join('\n'));
  if (added.length)   parts.push(added.join('\n'));
  return parts.join('\n');
}

/**
 * Replace (or insert) the SYNAPTIC-RULES block in AGENTS.md content.
 * Returns the updated full content string.
 */
function spliceBlock(agentsContent, newBlock) {
  const BEGIN = '<!-- BEGIN:SYNAPTIC-RULES -->';
  const END   = '<!-- END:SYNAPTIC-RULES -->';

  const startIdx = agentsContent.indexOf(BEGIN);
  const endIdx   = agentsContent.indexOf(END);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    // Replace existing block
    return (
      agentsContent.slice(0, startIdx) +
      newBlock +
      agentsContent.slice(endIdx + END.length)
    );
  }

  // No existing block — append after BEGIN:SYNAPTIC block if present, else at end
  const synapticEnd = agentsContent.indexOf('<!-- END:SYNAPTIC -->');
  if (synapticEnd !== -1) {
    const insertAt = synapticEnd + '<!-- END:SYNAPTIC -->'.length;
    return (
      agentsContent.slice(0, insertAt) +
      '\n\n' + newBlock +
      agentsContent.slice(insertAt)
    );
  }

  // Fall back: append at end
  return agentsContent.trimEnd() + '\n\n' + newBlock + '\n';
}

/**
 * Extract just the SYNAPTIC-RULES block from existing AGENTS.md content, or empty string.
 */
function extractExistingBlock(agentsContent) {
  const BEGIN = '<!-- BEGIN:SYNAPTIC-RULES -->';
  const END   = '<!-- END:SYNAPTIC-RULES -->';
  const startIdx = agentsContent.indexOf(BEGIN);
  const endIdx   = agentsContent.indexOf(END);
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return agentsContent.slice(startIdx, endIdx + END.length);
  }
  return '';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log('\n=== Synaptic Harness Deploy ===');
console.log(`Project: ${projectRoot}`);
if (dryRun) console.log('Mode: DRY-RUN (no files will be modified)\n');
else console.log('Mode: LIVE\n');

// 1. Verify harness source files exist
if (!isFile(conventionsPath)) {
  console.error(`ERROR: conventions.md not found at ${conventionsPath}`);
  console.error('       Run /init to create the harness files first.');
  process.exit(1);
}
if (!isFile(guardrailsPath)) {
  console.error(`ERROR: guardrails.md not found at ${guardrailsPath}`);
  console.error('       Run /init to create the harness files first.');
  process.exit(1);
}

// 2. Read harness source files
const conventionsRaw = fs.readFileSync(conventionsPath, 'utf8');
const guardrailsRaw  = fs.readFileSync(guardrailsPath, 'utf8');

// 3. Refuse if placeholder content is present
const conventionsHasPlaceholders = hasPlaceholders(conventionsRaw);
const guardrailsHasPlaceholders  = hasPlaceholders(guardrailsRaw);

if (conventionsHasPlaceholders || guardrailsHasPlaceholders) {
  console.error('ERROR: harness/ still contains {{placeholder}} content — refusing to deploy.');
  if (conventionsHasPlaceholders) {
    console.error(`       conventions.md has unfilled placeholders: ${conventionsPath}`);
  }
  if (guardrailsHasPlaceholders) {
    console.error(`       guardrails.md has unfilled placeholders: ${guardrailsPath}`);
  }
  console.error('       Complete the onboarding interview (/init) to fill these before deploying.');
  process.exit(1);
}

// 4. Strip frontmatter and compose the new block
const conventionsBody = stripFrontmatter(conventionsRaw);
const guardrailsBody  = stripFrontmatter(guardrailsRaw);

const WARNING_COMMENT = '<!-- Auto-generated from .synaptic/harness/ — edit the source there, then re-run deploy; edits here are overwritten. -->';

const newBlock = [
  '<!-- BEGIN:SYNAPTIC-RULES -->',
  WARNING_COMMENT,
  '## Working Conventions',
  conventionsBody.trimEnd(),
  '',
  '## Guardrails',
  guardrailsBody.trimEnd(),
  '<!-- END:SYNAPTIC-RULES -->',
].join('\n');

// 5. Read existing AGENTS.md (or empty string if absent)
const agentsExists  = isFile(agentsPath);
const agentsContent = agentsExists ? fs.readFileSync(agentsPath, 'utf8') : '';

// 6. Extract existing block for diff
const existingBlock = extractExistingBlock(agentsContent);

// 7. Print diff preview
console.log('--- SYNAPTIC-RULES block diff ---');
const diffOutput = simpleDiff(existingBlock, newBlock, 'SYNAPTIC-RULES');
console.log(diffOutput);
console.log('---------------------------------\n');

if (dryRun) {
  console.log('[DRY-RUN complete — no files were modified]');
  process.exit(0);
}

// 8. Backup existing AGENTS.md before writing
if (agentsExists) {
  fs.copyFileSync(agentsPath, agentsBackup);
  console.log(`Backed up: AGENTS.md → AGENTS.md.bak`);
}

// 9. Write updated AGENTS.md
const updatedContent = spliceBlock(agentsContent, newBlock);

if (!agentsExists) {
  fs.writeFileSync(agentsPath, newBlock + '\n', 'utf8');
  console.log(`Created:   AGENTS.md (new file with SYNAPTIC-RULES block)`);
} else {
  fs.writeFileSync(agentsPath, updatedContent, 'utf8');
  if (existingBlock) {
    console.log(`Updated:   AGENTS.md — SYNAPTIC-RULES block replaced`);
  } else {
    console.log(`Updated:   AGENTS.md — SYNAPTIC-RULES block appended`);
  }
}

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Deploy complete.                                            ║
║                                                              ║
║  The SYNAPTIC-RULES block in AGENTS.md now reflects the      ║
║  current harness/ source.                                    ║
║                                                              ║
║  REMINDER: Edit operating rules in .synaptic/harness/ and    ║
║  re-run this script to keep AGENTS.md in sync. Direct edits  ║
║  inside the BEGIN:SYNAPTIC-RULES block are overwritten on    ║
║  the next deploy.                                            ║
║                                                              ║
║  Backup saved: AGENTS.md.bak                                 ║
╚══════════════════════════════════════════════════════════════╝
`);
