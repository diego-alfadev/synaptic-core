# Matrioshka architecture — CORE, Cortex, Ecosystem

*What this is: the layered architecture of synaptic-core — the single runtime test that draws the CORE/Cortex line, the proven ideas the substrate is built on, the deliberately-deferred horizon, the optional tooling, and the full directory layout.*

## Three nested rings, one runtime test

Each inner layer is independent of the outer ones. **CORE vs Cortex is one conceptual line in one repo**, decided by a single test: *does it need a runtime we add, beyond the agent's own?* No → CORE (files/text, including host-run hook config). Yes → Cortex (utilities we ship; deletable; the brain never depends on them).

```
  ┌──────────────────────────────────┐
  │           Ecosystem              │
  │  shared / team brain,            │
  │  on-the-fly (future ring)        │
  │  ┌────────────────────────┐      │
  │  │        Cortex          │      │
  │  │  MCP server · check    │      │
  │  │  migrate · export      │      │
  │  │  vault-open · graph    │      │
  │  │  semantic sidecar      │      │
  │  │  (optional runtime)    │      │
  │  │  ┌──────────────────┐  │      │
  │  │  │      CORE        │  │      │
  │  │  │  Pure Markdown   │  │      │
  │  │  │  Zero deps       │  │      │
  │  │  │  Hooks (config)  │  │      │
  │  │  └──────────────────┘  │      │
  │  └────────────────────────┘      │
  └──────────────────────────────────┘
```

**CORE** works everywhere, always — even on an air-gapped corporate laptop with nothing installed. **Cortex** and **Ecosystem** are optional power-ups. Removing the outer layers does not break the inner ones.

- **CORE:** Pure Markdown + YAML, zero dependencies, works everywhere including air-gapped corporate environments. **Hooks are CORE** — they are host-run config the agent already executes, not a runtime we ship.
- **Cortex** (optional, the runtimes we add): the **MCP server** (a tool *over* the files — the brain never depends on it), the zero-dep Node utilities (`check`, `migrate`, `export`, `vault-open`, `graph`, `deploy`), and an optional semantic sidecar. All deletable; all degrade away cleanly.
- **Ecosystem** (future ring): shared / team brain and on-the-fly collaboration — separate repos only if ever split.

> The CORE/Cortex boundary is never drawn at "with/without MCP". **MCP is Cortex** — a tool over the files, alongside the other optional utilities. A brain works fully without it, and it degrades away cleanly.

## Built on proven ideas (and why)

Synaptic-core did not invent its substrate — it converged on patterns that the PKM and agent-skills community had already validated, then applied a specific **direction**: purpose-built to accrete a role's knowledge and encode the explicit formula (intention + inertia) that makes it grow correctly. The value-add is that direction, not the format.

| Technique / source | How synaptic-core uses it | Why it fits an agent-read brain |
|---|---|---|
| **Atomic notes — Zettelkasten / Luhmann** | One concept per node, kebab-case filename (`auth-model.md`), ~150-line soft budget; consolidation formula enforces "promote only when it recurs" | Precise retrieval: the filename IS the concept; composable links work because scope is bounded. Over-atomization is deliberately avoided — agents handle dense pages better than ten micro-files. |
| **Maps of Content / MOC-of-MOCs — Obsidian / Nick Milo** | Three-level hierarchy: `BRAIN.md` → `knowledge/INDEX.md` (hub MOC, 1-line per cluster) → `{cluster}/_index.md` (sub-MOC, 1-line per node) → open only 1–2 nodes | Bounded navigation: ~3–4 hops to any insight regardless of brain size. The 1-line summaries in `_index.md` are the mechanism — an agent reads the summary, not the full node, to decide whether to open it. |
| **Bidirectional `[[wikilinks]]` — wiki / Obsidian** | Every node uses `[[page-name]]` links written at capture time; backlinks resolved via `grep -r "[[node]]"` (CORE) or an optional FTS5 index (horizon Cortex); opens natively in Obsidian / Foam / Logseq | Emergent link-graph: structure comes from links, not rigid folder hierarchy. A concept can belong to multiple clusters simultaneously. Multi-dimensional without duplication. |
| **LLM-wiki / "compile knowledge" — Karpathy** | Curated narrative pages an agent reasons over whole (no chunking); `references/raw/` holds verbatim payloads as schema-on-read fallback; consolidation formula = write-time curation discipline | Curate once, read cheap forever. Agents re-read the same context constantly; schema-on-write means retrieval is near-deterministic. Coherent curated context beats reassembled chunks for reliability and auditability. |
| **Progressive disclosure — Anthropic Agent Skills** | `BRAIN.md` (≤110 lines, ~500 tokens) is the only boot read; skill metadata surfaces in Level 1 (~100 tokens); full skill body loads on trigger; reference files and the bundle templates load only at brain-init | Token economy: awareness costs ~100 tokens per skill; full depth costs only when needed. The same principle governs the brain: one boot file, everything else on demand. |
| **Frontmatter + tags — PKM metadata standard** | Every node carries `description`, `type`, `status`, `updated`, `tags` (D1 decision, SPEC §4.3); `description` feeds the `_index.md` 1-liner and any future embedding input | Machine-readable surface for `/synaptic-audit`, faceted search, and future FTS / semantic search — without forking the format when those layers are added. |
| **Explicit contribution protocol — spec-driven mindset** | The 6-step consolidation formula (classify → atomicity test → generalize → place & link → dedupe/SSOT → quality gate) is embedded in every `BRAIN.md` as the capture contract | Agent-agnostic, consistent: any agent that runs this formula produces a navigable graph, not a pile of notes. The formula encodes both intention (what belongs) and inertia (how it grows). |
| **Files-authoritative / local-first — Engram-inspired governance** | Files are the single source of truth; agent-native memory (auto-memory, etc.) is treated as a cache; tools (`check`, `migrate`, `export`) are derived readers, never writers of truth | Portable, auditable, git-native. The brain works on a locked-down laptop, air-gapped server, or any future agent platform. No runtime dependency can become a single point of failure. |

## On the horizon — deliberately NOT in CORE

| Technique | Why it is a horizon item, not CORE |
|---|---|
| **Vector / semantic search** (GraphRAG, LightRAG, Smart Connections, SQLite-vec — *the direction*) | Curated wikilink pages already give coherent retrieval for agent-authored brains; a full embed-and-retrieve pipeline is over-engineering for CORE and cost-justified only at scale or for unstructured ingestion. We are **not** GraphRAG and make **no auto-discovery-of-links claim** — we cite it as the *direction*. A Cortex semantic sidecar (opt-in, degrades to grep/MOC) is its designed answer at scale. |
| **Engram-style searchable journal** (SQLite/FTS5) | A derived, deletable **searchable layer over the journal** — fast full-text history ("did I solve a ticket like this before?"). It is **never** a graph refiner and never rewrites the authored pages; the forward `[[wikilink]]` stays the only authoritative edge. Optional Cortex, incompatible with the zero-install CORE floor by design. |

> These horizon items are enabled by the v1 file contract (frontmatter + tags + INDEX + `[[wikilinks]]`) — they attach without forking the format. All are optional Cortex utilities the brain never depends on. See [ROADMAP.md](../../ROADMAP.md) for the full horizon detail.

## Optional tooling (check · migrate · export · vault-open · graph · deploy)

These are optional **Cortex** utilities — **zero-dependency** (Node ≥ 18 standard library only). CORE never requires them. When no runtime is available, the `synaptic` skill instructs the agent to perform the equivalent operation manually.

| Tool | Command | What it does |
|---|---|---|
| `check` | `node tools/check.js [.synaptic]` | Graph health: broken `[[wikilinks]]`, MOC coverage, frontmatter, soft budgets (warn), registry/reference integrity, orphan nodes |
| `migrate` | `node tools/migrate.js <.synaptic> [templates-dir] [--dry-run]` | Automates Phase M of a v0.x → v1 upgrade (deterministic, idempotent, non-destructive) |
| `export` | `node tools/export.js <.synaptic> [out.md]` | Bundles the entire brain into a single portable Markdown file (or `--split` into 4 sections) |
| `vault-open` | `node tools/vault-open.js <.synaptic>` | Writes minimal optional config for Obsidian, Foam, and Logseq; produces `OPEN-IN.md` |
| `graph` | `node tools/graph.js [.synaptic] [--out FILE] [--format html\|svg]` | Render a visual graph image of your brain — executive-friendly, no install; deterministic layout makes before/after states visually comparable |
| `deploy` | `node tools/deploy.js <project-root> [--dry-run]` | Materializes the `harness/` rules (conventions + guardrails) into the outer harness (`AGENTS.md`) as a marker-bounded block — backed up, diff-previewed, idempotent |

**Opens in your tools without any conversion:**

| Tool | How to open | Notes |
|---|---|---|
| **Obsidian** | Open project folder as a vault | `[[wikilinks]]` and YAML frontmatter are native; graph view renders immediately |
| **Foam (VS Code)** | Install Foam extension; open workspace | Wikilinks, backlinks, and graph panel work out of the box |
| **Logseq** | Open project folder as a graph | Switch to Markdown mode; Logseq journals disabled in favour of `journal/_current.md` |

`tools/vault-open.js` (optional, zero-dep) writes minimal config for each tool and produces `OPEN-IN.md` at the brain root. If you prefer to skip it, just open the folder — it works.

## Full directory layout

```
.synaptic/
├── BRAIN.md                   # The only boot file: context capsule + capture contract + 1-line harness pointer + brain map
├── knowledge/                 # WIKI — what you know
│   ├── INDEX.md               # Hub MOC: lists clusters + 1-line summary each
│   ├── {cluster}/             # Domain or area (e.g. infrastructure/, customer-feedback/)
│   │   ├── _index.md          # Sub-MOC: 1-line summary per node
│   │   └── {node}.md          # Atomic node — type: knowledge|pattern|playbook|decision|lesson|reference
│   └── lessons/               # type: lesson (dated)
├── registries/                # Tabular SSOTs: resources, repos, db-servers, environments, glossary
├── references/                # Existence index (_index.md) + raw/ verbatim drop-zone (DDL, specs, exports)
├── harness/                   # HARNESS — how you work here (depth-on-demand)
│   ├── conventions.md         # Working agreements: languages per channel, commit style, etiquette
│   ├── guardrails.md          # Hard rules: security, never-push-without-confirm, runner discipline
│   └── skills/                # Project-local executable skills — travel with the brain
├── playgrounds/               # Per-task workspaces {task-id}/ — fat, burnable; registered in journal
├── journal/_current.md        # Thin working memory: resume anchor / watch list / consolidation log (≤80 lines)
└── templates/                 # Node, registry, playbook, lesson templates
```

Repository structure:

```
synaptic-core/
├── standalone/        # The synaptic skill package (installable without the full repo)
│   └── synaptic/templates/   # SINGLE SOURCE OF TRUTH for the .synaptic/ structure
├── docs/              # Architecture decisions (ADR-001, ADR-002, ...) + assets + concepts/
└── tools/             # Optional Cortex utilities (check, migrate, export, vault-open, graph, deploy)
```

> There is no `seed/` directory. The skill bundle's `templates/` are the one source of truth; the example brain is assembled on demand by the skill at `/synaptic-init`.

---

**Related:**
- [Capture and consolidation](./capture-and-consolidation.md) — why hooks are CORE config, not a shipped runtime
- [Navigation and planes](./navigation-and-planes.md) — the MOC-of-MOCs and two-plane model the directory layout implements
- [Typed edges](./typed-edges.md) — the `[[wikilink]]` substrate the semantic sidecar would index (Cortex horizon)
- [RAG vs wiki vs brain](./rag-vs-wiki-vs-brain.md) — the write-time-curation bet that lets CORE stay zero-install
- [Epistemic honesty](./epistemic-honesty.md) — the frontmatter affordances that make the brain auditable
- Back to the [concepts index](./_index.md) · the [README](../../README.md) · the [ROADMAP](../../ROADMAP.md)
