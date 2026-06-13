#!/usr/bin/env node
// tools/migrate.js — Synaptic Brain Phase M migration helper (v1.0)
// Usage: node tools/migrate.js <path-to-.synaptic> [path-to-v1-templates-dir] [--dry-run]
//
// Phase M: deterministic, IDEMPOTENT, NON-DESTRUCTIVE file operations.
//   - Detects source version (BOOTSTRAP.md → v0.3; BRAIN.md version field → v0.4/v0.5)
//   - Creates v1 directories if missing
//   - Moves inventory/ → registries/ (if inventory/ exists)
//   - Stages v0.x boot files into _migration-staging/ (NEVER deletes knowledge content)
//   - Copies bundled v1 templates if a templates source dir is given
//   - Prints a dry-run preview first; acts after confirmation (or immediately with --dry-run)
//
// WHAT IT NEVER DOES:
//   - Never rewrites file content
//   - Never converts links
//   - Never deletes knowledge nodes
//   - Never touches knowledge/ content files
//
// After Phase M: run Phase C (agent rearrange, mandatory) per upgrade-to-v1.md.
//
// Node >= 18, zero npm dependencies.

'use strict';

const fs   = require('node:fs');
const path = require('node:path');

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const args     = process.argv.slice(2).filter(a => a !== '--dry-run');
const dryRun   = process.argv.includes('--dry-run');
const brainArg = args[0];
const tmplArg  = args[1];

if (!brainArg) {
  console.error('Usage: node tools/migrate.js <path-to-.synaptic> [templates-source-dir] [--dry-run]');
  process.exit(1);
}

const brainRoot = path.resolve(brainArg);

if (!fs.existsSync(brainRoot)) {
  console.error(`ERROR: path not found: ${brainRoot}`);
  process.exit(1);
}

const templatesSource = tmplArg ? path.resolve(tmplArg) : null;
if (templatesSource && !fs.existsSync(templatesSource)) {
  console.error(`ERROR: templates source path not found: ${templatesSource}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function exists(p) { return fs.existsSync(p); }
function isDir(p)  { return exists(p) && fs.statSync(p).isDirectory(); }
function isFile(p) { return exists(p) && fs.statSync(p).isFile(); }

function ensureDir(p) {
  if (!exists(p)) {
    if (!dryRun) fs.mkdirSync(p, { recursive: true });
    return true; // created
  }
  return false; // already existed
}

/**
 * Move (rename) src to dest. If they are on different filesystems, copies then unlinks.
 * Never overwrites dest if it already exists — stages to dest with a .bak-N suffix instead.
 */
function moveFile(src, dest) {
  if (!isFile(src)) return;
  let target = dest;
  if (exists(target)) {
    // Already staged — find a non-colliding name
    let n = 1;
    while (exists(`${target}.bak-${n}`)) n++;
    target = `${target}.bak-${n}`;
  }
  if (!dryRun) {
    ensureDir(path.dirname(target));
    try {
      fs.renameSync(src, target);
    } catch {
      // Cross-device: copy then unlink
      fs.writeFileSync(target, fs.readFileSync(src));
      fs.unlinkSync(src);
    }
  }
  return target;
}

/**
 * Move a whole directory: copies each file recursively into dest/, then removes src.
 * Idempotent: if dest already exists, merges (files already present are skipped).
 */
function moveDir(src, dest) {
  if (!isDir(src)) return;
  if (!dryRun) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const srcFull  = path.join(src, entry.name);
      const destFull = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        moveDir(srcFull, destFull);
      } else {
        if (!exists(destFull)) {
          fs.copyFileSync(srcFull, destFull);
        }
        fs.unlinkSync(srcFull);
      }
    }
    // Remove src dir if now empty
    try { fs.rmdirSync(src); } catch { /* not empty — leave it */ }
  }
}

/**
 * Copy file src to dest if dest does not exist (idempotent).
 */
function copyIfAbsent(src, dest) {
  if (!isFile(src)) return false;
  if (exists(dest)) return false; // already there
  if (!dryRun) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
  }
  return true;
}

function walkAll(dir) {
  if (!exists(dir)) return [];
  const results = [];
  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) results.push(full);
    }
  }
  walk(dir);
  return results;
}

// ---------------------------------------------------------------------------
// Detect source version
// ---------------------------------------------------------------------------

function detectVersion() {
  const bootstrapFile = path.join(brainRoot, 'BOOTSTRAP.md');
  const brainFile     = path.join(brainRoot, 'BRAIN.md');

  if (isFile(bootstrapFile)) return 'v0.3';

  if (isFile(brainFile)) {
    const content = fs.readFileSync(brainFile, 'utf8');
    const verMatch = content.match(/^version:\s*["']?([^"'\n]+)["']?/m);
    if (verMatch) {
      const ver = verMatch[1].trim();
      if (ver.startsWith('0.4') || ver.startsWith('0.5')) return ver;
      if (ver.startsWith('1.')) return ver; // already v1
    }
    return 'v0.x (BRAIN.md present, version undetected)';
  }

  return 'unknown';
}

// ---------------------------------------------------------------------------
// Build the migration plan
// ---------------------------------------------------------------------------

function buildPlan() {
  const plan = {
    version: detectVersion(),
    dirsToCreate: [],
    inventoryToRegistries: false,
    filesToStage: [],    // { src, dest, label }
    templatesToCopy: [], // { src, dest }
    notes: [],
  };

  // v1 directories to create if missing
  const v1Dirs = [
    'registries', 'harness', 'harness/skills',
    'references', 'references/raw', 'playgrounds', 'templates',
  ];
  for (const d of v1Dirs) {
    if (!isDir(path.join(brainRoot, d))) {
      plan.dirsToCreate.push(d);
    }
  }

  // inventory/ → registries/
  const inventoryDir   = path.join(brainRoot, 'inventory');
  const registriesDir  = path.join(brainRoot, 'registries');
  if (isDir(inventoryDir)) {
    plan.inventoryToRegistries = true;
  }

  // Files to stage into _migration-staging/
  const stagingDir = path.join(brainRoot, '_migration-staging');
  const stageTargets = [
    { src: path.join(brainRoot, 'BOOTSTRAP.md'),              rel: 'BOOTSTRAP.md',              label: 'v0.3 boot file' },
    { src: path.join(brainRoot, 'MANIFEST.md'),               rel: 'MANIFEST.md',               label: 'v0.3 boot file' },
    { src: path.join(brainRoot, 'identity', 'HEARTBEAT.md'),  rel: 'identity/HEARTBEAT.md',     label: 'v0.3 identity file' },
    { src: path.join(brainRoot, 'knowledge', '_tree.yaml'),   rel: 'knowledge/_tree.yaml',      label: 'v0.3 navigation file' },
  ];

  // Stage worklines/ directory (entire)
  const worklinesDir = path.join(brainRoot, 'worklines');
  if (isDir(worklinesDir)) {
    plan.filesToStage.push({
      src:   worklinesDir,
      dest:  path.join(stagingDir, 'worklines'),
      label: 'worklines/ directory (v0.3)',
      isDir: true,
    });
  }

  for (const t of stageTargets) {
    if (isFile(t.src)) {
      plan.filesToStage.push({
        src:   t.src,
        dest:  path.join(stagingDir, t.rel),
        label: t.label,
        isDir: false,
      });
    }
  }

  // Templates to copy
  if (templatesSource) {
    for (const srcFile of walkAll(templatesSource)) {
      const rel  = path.relative(templatesSource, srcFile);
      const dest = path.join(brainRoot, 'templates', rel);
      if (!isFile(dest)) {
        plan.templatesToCopy.push({ src: srcFile, dest });
      }
    }
  } else {
    plan.notes.push('No templates source provided — templates/ will be created empty. Pass a templates dir as the 2nd argument to copy bundled templates.');
  }

  return plan;
}

// ---------------------------------------------------------------------------
// Print the plan (dry-run preview)
// ---------------------------------------------------------------------------

function printPlan(plan) {
  console.log('\n=== Synaptic Phase M Migration ===');
  console.log(`Brain: ${brainRoot}`);
  console.log(`Detected version: ${plan.version}`);
  if (dryRun) console.log('Mode: DRY-RUN (no files will be modified)\n');
  else console.log('Mode: LIVE\n');

  if (plan.dirsToCreate.length) {
    console.log('Directories to create:');
    for (const d of plan.dirsToCreate) console.log(`  + ${d}/`);
  } else {
    console.log('Directories: all v1 dirs already present.');
  }

  if (plan.inventoryToRegistries) {
    console.log('\nRename: inventory/ → registries/  (merge if registries/ exists)');
  }

  if (plan.filesToStage.length) {
    console.log('\nFiles to stage into _migration-staging/:');
    for (const f of plan.filesToStage) {
      console.log(`  [${f.label}]  ${path.relative(brainRoot, f.src)}  →  _migration-staging/${path.relative(brainRoot, f.dest).replace(/\\/g, '/').replace('_migration-staging/', '')}`);
    }
  } else {
    console.log('\nNo v0.x files found to stage.');
  }

  if (plan.templatesToCopy.length) {
    console.log(`\nTemplates to copy from ${templatesSource}:`);
    for (const t of plan.templatesToCopy) {
      console.log(`  + templates/${path.relative(path.join(brainRoot, 'templates'), t.dest).replace(/\\/g, '/')}`);
    }
  }

  if (plan.notes.length) {
    console.log('\nNotes:');
    for (const n of plan.notes) console.log(`  ! ${n}`);
  }
}

// ---------------------------------------------------------------------------
// Execute the plan
// ---------------------------------------------------------------------------

function executePlan(plan) {
  const done = [];

  // 1. Create directories
  for (const d of plan.dirsToCreate) {
    const full = path.join(brainRoot, d);
    ensureDir(full);
    done.push(`Created  ${d}/`);
  }

  // 2. Move inventory/ → registries/
  if (plan.inventoryToRegistries) {
    const inventoryDir  = path.join(brainRoot, 'inventory');
    const registriesDir = path.join(brainRoot, 'registries');
    moveDir(inventoryDir, registriesDir);
    done.push('Moved    inventory/ → registries/');
  }

  // 3. Stage files
  const stagingDir = path.join(brainRoot, '_migration-staging');
  if (plan.filesToStage.length) {
    ensureDir(stagingDir);
  }
  for (const f of plan.filesToStage) {
    if (f.isDir) {
      moveDir(f.src, f.dest);
      done.push(`Staged   ${path.relative(brainRoot, f.src)}/ → _migration-staging/${path.relative(brainRoot, f.dest).replace(/\\/g, '/')}/`);
    } else {
      const actual = moveFile(f.src, f.dest);
      if (actual) {
        done.push(`Staged   ${path.relative(brainRoot, f.src)} → _migration-staging/${path.relative(brainRoot, actual).replace(/\\/g, '/')}`);
      }
    }
  }

  // 4. Copy templates
  for (const t of plan.templatesToCopy) {
    const copied = copyIfAbsent(t.src, t.dest);
    if (copied) done.push(`Copied   templates/${path.relative(path.join(brainRoot, 'templates'), t.dest).replace(/\\/g, '/')}`);
  }

  return done;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const plan = buildPlan();
printPlan(plan);

if (dryRun) {
  console.log('\n[DRY-RUN complete — no files were modified]');
} else {
  console.log('\nExecuting...');
  const done = executePlan(plan);
  if (done.length) {
    console.log('\nCompleted:');
    for (const d of done) console.log(`  ${d}`);
  } else {
    console.log('  Nothing to do (brain already at v1 layout).');
  }
}

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  NEXT STEP — Phase C (mandatory agent rearrange)             ║
║                                                              ║
║  Phase M only moved files. Content rearrangement (link       ║
║  conversion, MOC creation, consolidation formula, harness    ║
║  cleanup) requires a capable agent.                          ║
║                                                              ║
║  1. Open the brain in your agent (read BRAIN.md)             ║
║  2. Run:  /synaptic-upgrade  (or follow upgrade-to-v1.md § Phase C)   ║
║  3. Inspect _migration-staging/ — those files may have       ║
║     content worth promoting before deletion.                 ║
║  4. Verify with:  node tools/check.js ${brainRoot.length < 30 ? brainRoot : '<brain-path>'}
║  5. Delete _migration-staging/ once Phase C is complete.     ║
╚══════════════════════════════════════════════════════════════╝
`);
