#!/usr/bin/env node
'use strict';
// tools/mcp/server.js — the Cortex MCP server SKELETON (spike).
//
// A DRIVING ADAPTER onto the RetrievalPort, SIBLING to tools/cortex.js (the CLI). Both sit
// over the SAME core (tools/lib/retrieval-port.js): the CLI and this MCP server are peers,
// not a shell (the MCP server does NOT shell out to the CLI — roadmap §7 "CLI and MCP are
// sibling adapters"). This file owns NO retrieval logic; it only maps the four MCP tools
// onto the four port methods and marshals the JSON.
//
// ── Why this exists / what it is FOR (roadmap §MCP) ──────────────────────────
//   Agents that CANNOT read files directly — sandboxed runtimes, remote orchestration —
//   gain full brain access through this server without any format change. A LOCAL agent
//   that can read files already has a better path (direct file read); this targets the
//   remote/sandboxed case.
//
// ── The invariant this whole file is subordinate to ──────────────────────────
//   MCP is an ACCESS / ACCELERATOR path, NEVER a CORE dependency. Every operation exposed
//   here — query / get / multi_get / status — is equally doable by reading the .synaptic
//   Markdown files directly (grep + open). The brain is fully operable with this server
//   deleted, uninstalled, or never started. Nothing in CORE ever reaches for it. It is one
//   more Cortex power-up over the files, alongside the CLI and the zero-dep Node utilities.
//
// ── SPIKE STATUS (read this) ─────────────────────────────────────────────────
//   This is a SKELETON, authored + verified BY INSPECTION ONLY — Node and the MCP SDK were
//   NOT available in the authoring environment, so nothing here has been run. The tool
//   SCHEMAS and HANDLERS are complete and call the real port; the only missing piece is the
//   transport wiring (the @modelcontextprotocol/sdk stdio hookup), left as a clearly marked
//   TODO at the bottom with exact completion + run steps. The handlers are exported so they
//   can be unit-tested against the port WITHOUT the SDK (see module.exports).
//
// Zero *runtime* dependency for the handler core: it uses only node stdlib + our own port
// (which is itself node-stdlib-only for the default adapter). The MCP SDK is required ONLY
// to bind the transport — and only when you actually start the server (the require is
// deferred into startStdioServer(), so importing this module for tests pulls in no SDK).

const path = require('node:path');
const { createRetrieval, DEFAULT_ADAPTER, ADAPTERS } = require('../lib/retrieval-port');

// ---------------------------------------------------------------------------
// Server configuration (env-driven; all optional)
// ---------------------------------------------------------------------------
//
// The server binds ONE port instance for its lifetime. Config comes from the environment so
// the same launcher works for any brain without code edits:
//   SYNAPTIC_BRAIN   absolute path to the .synaptic brain dir   (default: ./.synaptic)
//   SYNAPTIC_ADAPTER 'grep-moc' (default) | 'qmd'               (qmd degrades if absent)
//
// The adapter choice is HIDDEN from the MCP client on purpose: query/get/multi_get/status
// behave identically whichever adapter served (LSP — that is the point of the port). A
// client asks the brain a question; it neither knows nor cares whether grep/MOC or qmd
// answered. `status` is the one place the actual backend is surfaced, for operators.

const SERVER_NAME = 'synaptic-cortex';
const SERVER_VERSION = '0.1.0-spike';

function readConfigFromEnv(env = process.env) {
  const requested = env.SYNAPTIC_ADAPTER || DEFAULT_ADAPTER;
  // Unknown adapter ids are tolerated by the factory (they degrade to grep/MOC); we still
  // normalise obviously-bad input to the default so `status.adapter` reads sensibly.
  const adapter = ADAPTERS.includes(requested) ? requested : DEFAULT_ADAPTER;
  const brainRoot = path.resolve(env.SYNAPTIC_BRAIN || './.synaptic');
  return { adapter, brainRoot };
}

/**
 * Build the single RetrievalPort this server drives. `onFallback` is routed to stderr so an
 * operator sees WHY grep/MOC served (e.g. `--adapter qmd` but qmd absent) without polluting
 * the stdio TRANSPORT — MCP uses stdout for the protocol, so all human notices go to stderr.
 *
 * @param {{adapter?:string, brainRoot?:string}} [cfg]
 * @returns {import('../lib/retrieval-port').RetrievalPort & {adapter:string}}
 */
function buildPort(cfg = readConfigFromEnv()) {
  return createRetrieval({
    adapter: cfg.adapter,
    brainRoot: cfg.brainRoot,
    onFallback: (reason) => process.stderr.write(`[${SERVER_NAME}] ${reason}\n`),
  });
}

// ---------------------------------------------------------------------------
// Tool schemas — the MCP surface (JSON Schema for each tool's inputs)
// ---------------------------------------------------------------------------
//
// Four tools, one per port method. The schemas are deliberately the SAME shape the CLI
// exposes as flags, so the two driving adapters stay interchangeable. Every field is
// documented for the calling agent (MCP clients show `description` to the model). We keep
// `additionalProperties:false` so an agent that hallucinates an extra arg gets a clear
// validation error rather than a silently-ignored field.

const TOOL_DEFINITIONS = [
  {
    name: 'query',
    description:
      'Rank Synaptic knowledge nodes by relevance to a natural-language or keyword query. ' +
      'Returns best-first hits, each with a stable node id, the source file path, a score, ' +
      'a short snippet, and a {path,startLine,endLine} citation span. Returns an empty list ' +
      'for a blank query or an empty brain (never an error). This is a READ; it never writes ' +
      'to the brain. Equivalent to grepping the Markdown files directly — MCP is only an ' +
      'accelerator over the same files.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        query: {
          type: 'string',
          description: 'The search text (natural language or keywords). Blank returns [].',
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10,
          description: 'Maximum number of results to return (default 10).',
        },
        ftsOnly: {
          type: 'boolean',
          default: false,
          description:
            'Keyword/lexical only — forbid the semantic path. No-op for the zero-runtime ' +
            'grep/MOC adapter (always lexical); maps to BM25/FTS-only search on the qmd adapter.',
        },
        collections: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Restrict to these top-level knowledge/ cluster names (e.g. ["synaptic"]). ' +
            'Empty or omitted searches all clusters.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get',
    description:
      "Fetch one knowledge node's full Markdown text by its stable kebab-case id (the " +
      "filename without .md, e.g. 'cortex-scope'). Returns {id,path,text}, or null if the " +
      'id is unknown. READ-only. Equivalent to opening the file directly.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
          description: "Stable kebab-case node id (filename without '.md').",
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'multi_get',
    description:
      'Fetch several nodes by id in one call. Returns an array of {id,path,text}; unknown ' +
      'ids are omitted (so the result length may be < the number of ids requested), and the ' +
      'order of resolved docs follows the input order. READ-only.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          description: 'Stable kebab-case node ids to fetch.',
        },
      },
      required: ['ids'],
    },
  },
  {
    name: 'status',
    description:
      'Report retrieval index/adapter health for the brain: node count, edge count, whether ' +
      'a usable corpus is present, the serving adapter id, and a human backend label. Node/' +
      'edge counts come from the shared brain-graph universe, so they always agree with the ' +
      'check/graph tools. Never errors — degrades to zeros on a missing brain.',
    inputSchema: {
      type: 'object',
      additionalProperties: false,
      properties: {},
    },
  },
];

// ---------------------------------------------------------------------------
// Handlers — map each tool's validated args onto the port, return plain JSON
// ---------------------------------------------------------------------------
//
// Each handler is an async (args, port) => <plain JSON>. They are intentionally decoupled
// from the MCP transport so they can be unit-tested directly against a port instance with no
// SDK present (that is exactly what the "HOW TO TEST" recipe in docs/concepts/cortex-boot.md
// exercises before any transport wiring exists). The transport layer (below) is the only
// part that needs the SDK; it merely looks a handler up by name and JSON-wraps its return.
//
// Contract each handler upholds (mirrors the port + the CLI, so all three agree):
//   - never throw for "no results" / "unknown id" — return [] / null
//   - coerce/validate the few numeric+shape constraints the schema can't fully pin down
//   - return ONLY the stable port shapes (RetrievalResult[] / RetrievalDoc|null / status)

const HANDLERS = {
  /** query → RetrievalResult[] */
  async query(args, port) {
    const q = typeof args.query === 'string' ? args.query : '';
    // Defensive clamps around the schema (a non-compliant client may skip validation).
    const limit = clampInt(args.limit, 1, 100, 10);
    const ftsOnly = Boolean(args.ftsOnly);
    const collections = Array.isArray(args.collections)
      ? args.collections.filter((c) => typeof c === 'string')
      : [];
    return port.query(q, { limit, ftsOnly, collections });
  },

  /** get → RetrievalDoc | null */
  async get(args, port) {
    const id = typeof args.id === 'string' ? args.id : '';
    return port.get(id); // null for unknown id — the client sees a JSON null, not an error
  },

  /** multi_get → RetrievalDoc[] */
  async multi_get(args, port) {
    const ids = Array.isArray(args.ids) ? args.ids.filter((x) => typeof x === 'string') : [];
    return port.multiGet(ids);
  },

  /** status → RetrievalStatus */
  async status(_args, port) {
    return port.status();
  },
};

/** Clamp a maybe-number into [min,max]; non-finite → dflt. Floors to an integer. */
function clampInt(v, min, max, dflt) {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

/**
 * Dispatch a tool call by name against a port. Shared by the transport wiring AND by tests.
 * Throws a plain Error for a genuinely unknown TOOL name (a protocol-level error the SDK
 * should surface to the client) — but a handler itself never throws for empty/miss results.
 *
 * @param {string} name          one of 'query' | 'get' | 'multi_get' | 'status'
 * @param {Object} args          the tool arguments (already schema-checked by the SDK)
 * @param {import('../lib/retrieval-port').RetrievalPort} port
 * @returns {Promise<any>}       plain JSON to hand back to the MCP client
 */
async function dispatch(name, args, port) {
  const handler = HANDLERS[name];
  if (!handler) throw new Error(`unknown tool: ${name}`);
  return handler(args || {}, port);
}

// ===========================================================================
// TODO — TRANSPORT WIRING (the ONLY missing piece; the SKELETON above is complete)
// ===========================================================================
//
// The four tools + handlers above already work against the port. All that remains to make
// this a live MCP server is to bind them to the @modelcontextprotocol/sdk stdio transport.
// That require lives INSIDE startStdioServer() (below) so importing this module for tests
// never needs the SDK installed. To complete the spike into a running server:
//
//   1. Add the SDK as a Cortex-only (optional) dependency — it is NOT a CORE dep:
//        cd tools/mcp && npm init -y && npm install @modelcontextprotocol/sdk
//      (Keep this package.json scoped to tools/mcp so the brain's zero-install CORE floor is
//       untouched — nothing outside this dir may require the SDK.)
//
//   2. Replace the body of startStdioServer() below with the real SDK hookup. As of the
//      current SDK the shape is roughly (verify against the installed version's README —
//      class/import paths have drifted across 0.x/1.x, spec §9 upstream-velocity risk):
//
//        const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
//        const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
//        const {
//          ListToolsRequestSchema, CallToolRequestSchema,
//        } = require('@modelcontextprotocol/sdk/types.js');
//
//        const server = new Server(
//          { name: SERVER_NAME, version: SERVER_VERSION },
//          { capabilities: { tools: {} } },
//        );
//        const port = buildPort();
//
//        // Advertise the four tools (schemas straight from TOOL_DEFINITIONS).
//        server.setRequestHandler(ListToolsRequestSchema, async () => ({
//          tools: TOOL_DEFINITIONS,
//        }));
//
//        // Route a call through dispatch() and JSON-wrap the result in an MCP content block.
//        server.setRequestHandler(CallToolRequestSchema, async (req) => {
//          const { name, arguments: args } = req.params;
//          const result = await dispatch(name, args, port);
//          return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
//        });
//
//        await server.connect(new StdioServerTransport());
//        process.stderr.write(`[${SERVER_NAME}] listening on stdio\n`);
//
//   3. Register the server with an MCP client (e.g. Claude Desktop / an agent's mcp config),
//      pointing at THIS file and passing the brain via env:
//        {
//          "mcpServers": {
//            "synaptic-cortex": {
//              "command": "node",
//              "args": ["tools/mcp/server.js"],
//              "env": { "SYNAPTIC_BRAIN": "/abs/path/to/.synaptic",
//                       "SYNAPTIC_ADAPTER": "grep-moc" }
//            }
//          }
//        }
//
//   4. Smoke-test WITHOUT a client first (handlers need no SDK — see the exports below and
//      the recipe in docs/concepts/cortex-boot.md):
//        node -e "const s=require('./tools/mcp/server');(async()=>{const p=s.buildPort();\
//          console.log(await s.dispatch('status',{},p));})()"
//
// The SKELETON is transport-agnostic by design: swapping StdioServerTransport for an
// HTTP/SSE transport later touches ONLY startStdioServer(), never the schemas or handlers.

/**
 * Start the stdio MCP server. LEFT AS A SPIKE STUB — see the TODO block above for the exact
 * SDK hookup. Throws a clear, actionable error until the SDK is installed + wired, so a
 * premature `node tools/mcp/server.js` explains itself instead of failing cryptically.
 *
 * The @modelcontextprotocol/sdk require is intentionally DEFERRED to here: importing this
 * module for tests (which use buildPort + dispatch directly) pulls in NO SDK and stays
 * node-stdlib-only, preserving the accelerator-never-dependency invariant even in test.
 */
async function startStdioServer() {
  // Deferred require so tests / direct handler use never need the SDK on disk.
  let sdkPresent = true;
  try {
    require.resolve('@modelcontextprotocol/sdk/server/index.js');
  } catch (_) {
    sdkPresent = false;
  }
  if (!sdkPresent) {
    throw new Error(
      'MCP transport not wired yet (spike). Install the SDK in tools/mcp and complete the ' +
        'TODO block in tools/mcp/server.js:\n' +
        '  cd tools/mcp && npm install @modelcontextprotocol/sdk\n' +
        'Until then, the tool handlers still run directly against the port — see buildPort() ' +
        'and dispatch() in module.exports, and the "HOW TO TEST" recipe in ' +
        'docs/concepts/cortex-boot.md.',
    );
  }
  // Once the SDK is present, replace this line with the hookup from the TODO block above.
  throw new Error(
    'MCP SDK is installed but the transport hookup is still a TODO — paste the wiring from ' +
      'the TODO block in this file into startStdioServer().',
  );
}

// ---------------------------------------------------------------------------
// Entry point + exports
// ---------------------------------------------------------------------------
//
// When run directly (`node tools/mcp/server.js`) we attempt to start the stdio server; until
// the transport is wired that prints the actionable spike message to stderr and exits 1 — it
// never hangs. When require()'d (tests / embedding), we export the schemas, the config
// reader, the port builder, and dispatch/handlers so the whole surface is exercisable with
// no SDK present.

if (require.main === module) {
  startStdioServer().catch((e) => {
    process.stderr.write(`[${SERVER_NAME}] ${e && e.message ? e.message : e}\n`);
    process.exit(1);
  });
}

module.exports = {
  SERVER_NAME,
  SERVER_VERSION,
  TOOL_DEFINITIONS,
  readConfigFromEnv,
  buildPort,
  dispatch,
  HANDLERS,
  startStdioServer,
};
