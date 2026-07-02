#!/usr/bin/env node
// tools/cortex.js — the Cortex retrieval CLI (spike).
//
// A DRIVING ADAPTER (roadmap §2) onto the RetrievalPort: it parses argv, drives one of
// query / get / status through the port, and prints results. It owns NO retrieval logic
// itself — that all lives behind tools/lib/retrieval-port.js so the CLI and a future MCP
// adapter are siblings over the same core (roadmap §2.4 SRP/OCP; §7 "CLI and MCP are
// sibling adapters, not MCP-shells-out-to-CLI").
//
// Usage:
//   node tools/cortex.js query "<q>" [--adapter grep-moc|qmd] [--fts-only]
//                                    [--limit N] [--collection C]... [--json] [--brain DIR]
//   node tools/cortex.js get <id> [--json] [--brain DIR]
//   node tools/cortex.js status [--adapter grep-moc|qmd] [--json] [--brain DIR]
//
// Defaults:
//   --adapter  grep-moc   (the zero-runtime lexical floor; invariant 2)
//   --limit    10
//   --brain    ./.synaptic
//
// Node >= 18, ZERO npm dependencies — node:fs/path/process only (invariant 5). The qmd
// adapter is OPTIONAL and hidden behind the port; `--adapter qmd` degrades to grep/MOC
// gracefully when qmd is unavailable (invariant 3), printing a one-line notice to stderr.

'use strict';

const path = require('node:path');
const { createRetrieval, DEFAULT_ADAPTER, ADAPTERS } = require('./lib/retrieval-port');

// ---------------------------------------------------------------------------
// Tiny arg parser (mirrors graph.js's hand-rolled style — no dependency)
// ---------------------------------------------------------------------------

/**
 * Parse argv into { command, positionals, flags }.
 * Recognised value flags: --adapter, --limit, --brain, --collection (repeatable).
 * Recognised boolean flags: --fts-only, --json, --help/-h.
 */
function parseArgs(argv) {
  const flags = { adapter: null, limit: null, brain: null, collections: [],
                  ftsOnly: false, json: false, help: false };
  const positionals = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '--adapter':    flags.adapter = argv[++i]; break;
      case '--limit':      flags.limit   = argv[++i]; break;
      case '--brain':      flags.brain   = argv[++i]; break;
      case '--collection': flags.collections.push(argv[++i]); break;
      case '--fts-only':   flags.ftsOnly = true; break;
      case '--json':       flags.json    = true; break;
      case '--help':
      case '-h':           flags.help    = true; break;
      default:
        if (a && a.startsWith('--')) {
          // Unknown flag — warn but do not crash (graceful handling).
          process.stderr.write(`cortex: ignoring unknown flag "${a}"\n`);
        } else {
          positionals.push(a);
        }
    }
  }
  const command = positionals.shift() || null;
  return { command, positionals, flags };
}

const HELP = `cortex — Synaptic retrieval CLI (optional TOOLS layer; zero-runtime default)

USAGE
  node tools/cortex.js query "<q>" [options]     rank knowledge nodes by relevance to <q>
  node tools/cortex.js get <id>    [options]     fetch one node's full text by kebab-case id
  node tools/cortex.js status      [options]     report index/adapter health

OPTIONS
  --adapter <${ADAPTERS.join('|')}>   retrieval backend (default: ${DEFAULT_ADAPTER}).
                              'qmd' is OPTIONAL — falls back to grep-moc if unavailable.
  --fts-only                  keyword/lexical only (forbid the semantic path).
  --limit N                   max results for 'query' (default: 10).
  --collection C              restrict 'query' to top-level cluster C (repeatable).
  --brain DIR                 path to the .synaptic brain (default: ./.synaptic).
  --json                      machine-readable JSON output.
  -h, --help                  show this help.

NOTES
  The default 'grep-moc' adapter is zero-runtime (node stdlib only, no models, no
  network) and works air-gapped. It is the guaranteed fallback for every other adapter.
`;

// ---------------------------------------------------------------------------
// Output helpers
// ---------------------------------------------------------------------------

function printJson(obj) {
  process.stdout.write(JSON.stringify(obj, null, 2) + '\n');
}

function fail(msg, code = 1) {
  process.stderr.write(`cortex: ${msg}\n`);
  process.exit(code);
}

// ---------------------------------------------------------------------------
// Subcommands
// ---------------------------------------------------------------------------

async function cmdQuery(port, positionals, flags) {
  const q = positionals.join(' ').trim();
  if (!q) {
    // Graceful empty handling — not an error condition, just nothing to do.
    if (flags.json) { printJson({ query: '', adapter: port.adapter, results: [] }); }
    else { process.stdout.write('cortex query: no query text given. Try: cortex query "your terms"\n'); }
    return 0;
  }

  const limit = flags.limit != null ? Number(flags.limit) : undefined;
  if (limit != null && (!Number.isFinite(limit) || limit <= 0)) {
    fail(`--limit must be a positive number, got "${flags.limit}"`);
  }

  const results = await port.query(q, {
    limit,
    ftsOnly: flags.ftsOnly,
    collections: flags.collections,
  });

  if (flags.json) {
    printJson({ query: q, adapter: port.adapter, count: results.length, results });
    return 0;
  }

  if (results.length === 0) {
    process.stdout.write(`No matches for "${q}" (adapter: ${port.adapter}).\n`);
    return 0;
  }

  process.stdout.write(`${results.length} result(s) for "${q}" (adapter: ${port.adapter}):\n\n`);
  let rank = 1;
  for (const r of results) {
    const loc = `${r.span.path}:${r.span.startLine}`;
    process.stdout.write(`  ${rank}. ${r.id}  [score ${r.score.toFixed(2)}]  ${loc}\n`);
    if (r.snippet) process.stdout.write(`     ${r.snippet}\n`);
    rank++;
  }
  return 0;
}

async function cmdGet(port, positionals, flags) {
  const id = positionals[0];
  if (!id) fail('get: missing <id>. Usage: cortex get <node-id>');

  const doc = await port.get(id);
  if (!doc) {
    if (flags.json) { printJson(null); }
    else { process.stdout.write(`Node not found: "${id}" (adapter: ${port.adapter}).\n`); }
    return flags.json ? 0 : 1; // human path signals miss via exit 1; JSON callers see null
  }

  if (flags.json) { printJson(doc); return 0; }
  process.stdout.write(`# ${doc.id}  (${doc.path})\n\n${doc.text}\n`);
  return 0;
}

async function cmdStatus(port, flags) {
  const st = await port.status();
  if (flags.json) { printJson(st); return 0; }
  process.stdout.write('Cortex retrieval status:\n');
  process.stdout.write(`  adapter    : ${st.adapter}\n`);
  process.stdout.write(`  backend    : ${st.backend}\n`);
  process.stdout.write(`  indexed    : ${st.indexed ? 'yes' : 'no'}\n`);
  process.stdout.write(`  nodes      : ${st.nodeCount}\n`);
  process.stdout.write(`  edges      : ${st.edgeCount}\n`);
  return 0;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const { command, positionals, flags } = parseArgs(process.argv.slice(2));

  if (flags.help || !command) {
    process.stdout.write(HELP);
    // No command is a usage prompt, not a failure → exit 0 so `--help`-style probes pass.
    return 0;
  }

  const known = ['query', 'get', 'status'];
  if (!known.includes(command)) {
    fail(`unknown command "${command}". Expected one of: ${known.join(', ')} (see --help).`);
  }

  // Build the port. `onFallback` surfaces an optional-adapter degrade on stderr so the
  // human sees WHY grep/MOC served, without polluting stdout / JSON.
  const port = createRetrieval({
    adapter: flags.adapter || DEFAULT_ADAPTER,
    brainRoot: path.resolve(flags.brain || './.synaptic'),
    onFallback: (reason) => process.stderr.write(`cortex: ${reason}\n`),
  });

  switch (command) {
    case 'query':  return cmdQuery(port, positionals, flags);
    case 'get':    return cmdGet(port, positionals, flags);
    case 'status': return cmdStatus(port, flags);
    default:       return 1; // unreachable (guarded above)
  }
}

main()
  .then((code) => process.exit(typeof code === 'number' ? code : 0))
  .catch((e) => fail(`unexpected error: ${e && e.message ? e.message : e}`, 1));
