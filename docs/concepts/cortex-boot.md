# Cortex boot — the retrieval port and its two driving adapters

*What this is: how the optional Cortex retrieval layer is wired — one written port with two interchangeable adapters behind it (a zero-runtime grep/MOC default, and a hidden, optional qmd accelerator), driven by two sibling front-ends (the CLI and the MCP server). It ends with the invariant that keeps all of this an accelerator and never a dependency, and a copy-paste "how to test once Node is available" recipe. **This is a SPIKE — authored and verified by inspection only; nothing here has been run.***

Cortex is the outer ring in the [Matrioshka architecture](./architecture-matrioshka.md): utilities that need a runtime *we* add, over files the brain already owns. This doc describes the retrieval slice of that ring. Everything below is optional and deletable; the brain works fully with all of it removed.

## The shape in one picture

```
                        ┌──────────────────────────────────────────┐
   DRIVING ADAPTERS     │   CLI                    MCP server       │
   (siblings, peers)    │   tools/cortex.js        tools/mcp/       │
                        │   (argv → port)          server.js        │
                        │                          (4 MCP tools →   │
                        │                           port)           │
                        └───────────────┬───────────────┬──────────┘
                                        │  same 4 methods │
                                        ▼                 ▼
                        ┌──────────────────────────────────────────┐
   THE PORT             │        RetrievalPort  (written contract)  │
   tools/lib/           │   query · get · multiGet · status         │
   retrieval-port.js    │   createRetrieval(config) → picks adapter │
                        └───────┬──────────────────────────┬────────┘
                                │                           │
              DEFAULT (always)  ▼                           ▼  HIDDEN + OPTIONAL
                        ┌───────────────────┐     ┌────────────────────────────┐
   DRIVEN ADAPTERS      │ grep-moc-adapter  │     │ qmd-adapter                │
   tools/lib/adapters/  │ node stdlib only  │     │ shells out to `qmd`        │
                        │ no models, no net │     │ (BM25 / vector / RRF);     │
                        │ works air-gapped  │     │ DELEGATES to grep/MOC for   │
                        │  ── the floor ──  │◀────│ get/multiGet/status + any   │
                        └─────────┬─────────┘     │ query it can't serve        │
                                  │               └──────────────┬──────────────┘
                                  │  shared edge/degree universe │
                                  ▼                              │
                        ┌──────────────────────────────────────────┐
   ONE TOPOLOGY         │        tools/lib/brain-graph.js           │
   (never duplicated)   │  node set · typed edges · degree map      │
                        │  (also feeds check.js + graph.js)         │
                        └──────────────────────────────────────────┘
```

Read it top-down: a front-end (CLI or MCP) calls one of four methods on the port; the port's `createRetrieval` factory has already chosen an adapter; the adapter answers, reusing the one shared graph for topology. The two front-ends are **siblings** — the MCP server does not shell out to the CLI, and vice versa. Both are thin driving adapters over the same core.

## The port — DOMAIN ← RetrievalPort ← adapters

`tools/lib/retrieval-port.js` defines **one port**: a written interface in our own terms, with four methods.

| Method | Returns | Contract |
|---|---|---|
| `query(q, opts)` | `RetrievalResult[]` | Best-first ranked hits. `[]` for a blank query or empty brain — never throws for "no results". |
| `get(id)` | `RetrievalDoc \| null` | One node's full text by stable kebab-case id. `null` if unknown. |
| `multiGet(ids)` | `RetrievalDoc[]` | Many by id; unknown ids omitted; input order preserved. |
| `status()` | `RetrievalStatus` | Node/edge counts + which backend is serving. Never throws — degrades to zeros. |

`RetrievalResult` is a stable, adapter-independent shape — `{ id, path, score, snippet, span:{path,startLine,endLine} }` — so a caller **cannot tell which adapter served a result** (Liskov substitutability). That interchangeability is the entire point: the consumer talks to the port, not to an engine.

`createRetrieval(config)` is the factory. Selection rules:

- `adapter: 'grep-moc'` (or absent, or any unknown id) → the **default** grep/MOC adapter.
- `adapter: 'qmd'` → attempt the optional qmd adapter; if qmd is unavailable, **silently fall back** to grep/MOC (an optional `onFallback(reason)` callback fires so the front-end can print a one-line notice). Requesting qmd **never crashes** when qmd is absent.

The returned object exposes a read-only `adapter` string — the id that *actually* served, after any fallback — so a front-end can report what happened.

## The default adapter — grep/MOC (the floor)

`tools/lib/adapters/grep-moc-adapter.js` is the guaranteed floor: **node stdlib only** (`node:fs` / `node:path`), no models, no `qmd`, no npm, no network. It works air-gapped on a locked-down laptop with nothing installed, and it is the fallback every other adapter degrades to.

- `query` tokenises the query and does a lexical scan over `knowledge/` non-MOC nodes, weighting title/id hits above body hits, adding a small degree boost from the shared graph so hubs break near-ties, and returning a snippet + stable span.
- Node set, edges, and the degree map come from `tools/lib/brain-graph.js` — the **one** knowledge-scoped, MOC-excluded edge/degree universe that also feeds `check.js` and `graph.js`. Retrieval never re-walks for edges, so the three tools can never disagree on topology (invariant 4).

This is the default in `createRetrieval`, in the CLI (`--adapter` defaults to `grep-moc`), and in the MCP server (`SYNAPTIC_ADAPTER` defaults to `grep-moc`).

## The qmd adapter — hidden, optional accelerator

`tools/lib/adapters/qmd-adapter.js` is **option (c)** from the build-vs-adopt spec: [`qmd`](https://www.npmjs.com/package/@tobilu/qmd) wrapped behind the port as one optional adapter, invoked as an **external process** (never `require()`'d into our address space — its ~2 GB models and native runtime must stay out of every code path). Key properties:

- **Hidden behind the port.** A caller asks for `adapter: 'qmd'`; whether qmd actually serves is invisible in the result shape.
- **Optional + graceful.** A static `isAvailable(config)` probe (is `qmd` on PATH? does the package resolve?) lets the factory degrade *before* construction. Even after construction, **any** qmd failure — not installed after all, index missing, CLI-surface drift, timeout, zero hits on a real query — degrades transparently to the grep/MOC floor. It never throws for these (invariant 3).
- **Delegates for consistency.** `get` / `multiGet` / `status` and the query-fallback path all delegate to a private grep/MOC instance, so identity, ordering, and node/edge counts stay identical to the floor and the shared graph owns topology (invariants 2 + 4).
- **Injection-safe.** Every qmd invocation shells out with `child_process` and an **argv array** (never a shell string), with `shell:false` — so a query or path can never be reinterpreted as a shell command (invariant 6).

Retrieval-tier mapping: `query({ftsOnly:true})` → `qmd search` (BM25/FTS5, **zero models** — the light tier); `query()` default → `qmd query` (BM25 + sqlite-vec + RRF, plus optional cross-encoder rerank — the robust tier).

## The two driving adapters — CLI and MCP as siblings

Both front-ends own **no retrieval logic**. Each parses its own input, drives the same four port methods, and marshals output. They are peers over one core (not "MCP shells out to the CLI").

**CLI — `tools/cortex.js`** (zero-dep, `node:fs`/`path`/`process` only):

```sh
node tools/cortex.js query "<q>" [--adapter grep-moc|qmd] [--fts-only] \
                                 [--limit N] [--collection C]... [--json] [--brain DIR]
node tools/cortex.js get <id>    [--json] [--brain DIR]
node tools/cortex.js status      [--adapter grep-moc|qmd] [--json] [--brain DIR]
```

**MCP server — `tools/mcp/server.js`** exposes four tools mapped one-to-one onto the port:

| MCP tool | Port method | Notes |
|---|---|---|
| `query` | `query(q, {limit, ftsOnly, collections})` | Read-only ranked search; `[]` on blank/empty. |
| `get` | `get(id)` | Read-only; JSON `null` for an unknown id. |
| `multi_get` | `multiGet(ids)` | Read-only batch; unknown ids omitted. |
| `status` | `status()` | Health + which backend is serving (the one place the adapter is surfaced). |

The server reads config from the environment so one launcher works for any brain: `SYNAPTIC_BRAIN` (default `./.synaptic`) and `SYNAPTIC_ADAPTER` (`grep-moc` default | `qmd`). All human notices go to **stderr** because MCP uses stdout for the protocol frame.

> **Spike status of the MCP server:** the tool **schemas + handlers are complete and call the real port**; the only missing piece is the transport hookup (`@modelcontextprotocol/sdk` stdio server), left as a clearly-marked `TODO` block with exact completion steps. Importing the module for tests pulls in **no SDK** — the SDK require is deferred into `startStdioServer()`. Running `node tools/mcp/server.js` before the SDK is installed prints an actionable message and exits 1; it never hangs.

## Install / config — an optional accelerator, an FTS-only floor

The install surface is a ladder, floor-first:

| Tier | Needs | Egress | When |
|---|---|---|---|
| **CORE (no Cortex at all)** | Nothing — plain Markdown + an agent that reads files | None new | Air-gapped, regulated, or "just files". Always works. |
| **grep/MOC via CLI or MCP** | A Node runtime only (zero npm deps) | None | The common agentic setup; the guaranteed retrieval floor. |
| **qmd, FTS-only** | `qmd` on PATH + a BM25/FTS5 index (`qmd index <dir> --fts-only`) | Local only — **no models pulled** | Faster keyword search for larger brains where models are unwanted/forbidden. |
| **qmd, semantic** | `qmd` + its embedding/rerank models (**~2 GB**, on first index/query) | Local (on-device models) | When lexical isn't enough and you can afford the model footprint. |

`qmd` is **OPTIONAL at every point** — absent, the port serves grep/MOC and nothing errors. The **FTS-only tier is the recommended ceiling for air-gapped / regulated** deployments: it adds BM25 speed with zero model download and no network. The ~2 GB models are for the semantic tier only, and even then they run on-device (see [Local-vs-remote data boundary](./local-vs-remote-boundary.md) — Cortex is designed to *preserve* the local posture).

MCP client registration (once the transport is wired):

```json
{
  "mcpServers": {
    "synaptic-cortex": {
      "command": "node",
      "args": ["tools/mcp/server.js"],
      "env": { "SYNAPTIC_BRAIN": "/abs/path/to/.synaptic", "SYNAPTIC_ADAPTER": "grep-moc" }
    }
  }
}
```

## The invariant — accelerator, never dependency

Every operation reachable through this layer — `query` / `get` / `multi_get` / `status`, from the CLI or from MCP, on grep/MOC or on qmd — is **equally doable by reading the `.synaptic` Markdown files directly** (grep + open). Concretely:

- **CORE never imports this layer.** The port, its adapters, the CLI, and the MCP server are only ever reached from the TOOLS surface — never from the prose-CORE / markdown contract path.
- **The default is zero-runtime.** With no adapter requested and nothing installed, retrieval is node-stdlib-only lexical scan. No models, no qmd, no network.
- **qmd is hidden and optional.** Requesting it when it is absent degrades silently to the floor; it never crashes and never becomes required.
- **Deleting the whole layer changes nothing about the brain.** The files remain the single source of truth; an agent that can read files loses only speed, never capability.

That is the CORE/Cortex line drawn exactly where the [architecture doc](./architecture-matrioshka.md) draws it: this is a tool *over* the files, not the files.

## How to test — once Node is available

This slice was authored and checked **by inspection only** — Node and the MCP SDK were not available, so none of it has been run. When you have Node ≥ 18:

```sh
# 0. From the repo root, with a real .synaptic brain present (the dogfood brain works).

# 1. grep/MOC floor — ZERO deps, no install. This must work air-gapped.
node tools/cortex.js status
node tools/cortex.js query "cortex retrieval port" --limit 5
node tools/cortex.js query "cortex retrieval port" --json | head -40
node tools/cortex.js get cortex-scope | head -20

# 2. Determinism + fallback safety: asking for qmd when it is ABSENT must NOT crash —
#    it prints a one-line "qmd unavailable — using grep/MOC" notice on stderr and serves
#    the floor. stdout stays identical to the grep/MOC run above.
node tools/cortex.js query "cortex retrieval port" --adapter qmd --limit 5

# 3. OPTIONAL qmd accelerator (only if you want the semantic/BM25 path):
#    3a. install qmd (external process — never required into our address space)
npm install -g @tobilu/qmd        # or a local install; the adapter also tries `npx --no-install`
#    3b. build a LIGHT index (BM25/FTS5, NO ~2GB models) over knowledge/
qmd index .synaptic/knowledge --fts-only
#    3c. FTS-only path (should now route through qmd; --fts-only forbids the semantic path)
node tools/cortex.js query "cortex retrieval port" --adapter qmd --fts-only --limit 5
#    3d. (heavier) semantic path — pulls the models on first run (~2 GB); on-device.
qmd index .synaptic/knowledge
node tools/cortex.js query "cortex retrieval port" --adapter qmd --limit 5
#    Compare with/without --fts-only and against the grep/MOC baseline from step 1.

# 4. MCP server — handlers WITHOUT the SDK (the transport is a TODO; handlers already work):
node -e "const s=require('./tools/mcp/server');(async()=>{const p=s.buildPort();\
  console.log(JSON.stringify(await s.dispatch('status',{},p),null,2));\
  console.log(JSON.stringify(await s.dispatch('query',{query:'cortex',limit:3},p),null,2));\
})()"

# 5. MCP server — live transport (after wiring the SDK, per the TODO in tools/mcp/server.js):
cd tools/mcp && npm install @modelcontextprotocol/sdk && cd ../..
#    then paste the SDK hookup from the TODO block into startStdioServer(), register the
#    server in your MCP client (step "MCP client registration" above), and call the tools.
```

Expected: steps 1, 2, and 4 pass on a bare Node install with **no npm dependencies**. Step 2 in particular must degrade — not error — proving qmd is optional. Steps 3 and 5 are the optional accelerator tiers.

---

See also: [Matrioshka architecture](./architecture-matrioshka.md) (the CORE/Cortex/Ecosystem rings) · [Local-vs-remote data boundary](./local-vs-remote-boundary.md) (where the data goes) · [RAG vs a plain wiki vs an AI Brain](./rag-vs-wiki-vs-brain.md) (why write-time curation is the substrate this only accelerates) · the [ROADMAP](../../ROADMAP.md) (the honest Cortex horizon).
