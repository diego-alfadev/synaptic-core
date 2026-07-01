# tools/ — Optional Synaptic Brain Helpers

The optional **TOOLS** layer of synaptic-core. The CORE layer (plain Markdown files)
never requires these scripts — everything they do can be performed manually by an agent.
Use when a Node runtime is available (the common case in agentic setups).

## D3 rule — optional, zero-dep, no-runtime fallback

These tools are governed by **Decision D3**:

- **Optional:** CORE is 0-install-capable. No tool is ever a hard requirement.
- **Zero dependencies:** only `node:fs`, `node:path`, `node:process` — no npm install.
- **Runtime auto-detected:** a runtime is present in most agentic contexts; tools
  run transparently when available.
- **No-runtime fallback:** when Node is absent, the `synaptic` skill instructs
  the agent to perform the equivalent operation manually. Each tool's fallback
  is documented in the skill file (`harness/skills/` or the installed lifecycle skill).

**Matrioshka note:** CORE (files) → TOOLS (these scripts) → ECOSYSTEM (MCP/RAG/Engram).
Each layer is independently optional; removing the outer layers does not break the inner ones.

---

## deploy.js — Harness Deploy

```sh
node tools/deploy.js <project-root> [--dry-run]
```

Deploys `.synaptic/harness/conventions.md` and `.synaptic/harness/guardrails.md` into the
outer harness (`<project-root>/AGENTS.md`) by writing/replacing a marker-bounded
`<!-- BEGIN:SYNAPTIC-RULES --> … <!-- END:SYNAPTIC-RULES -->` block.

**Safety guarantees:**

| Guarantee | Detail |
|---|---|
| Placeholder refusal | Exits 1 with a clear message if `harness/` files still contain `{{placeholder}}` content — never deploys an unfilled template |
| Backup | Copies `AGENTS.md` → `AGENTS.md.bak` before any write |
| Diff preview | Prints a before/after diff of the block change before applying |
| Dry-run | `--dry-run` prints the preview only — no files modified |
| Idempotent | Replaces only the marked block; never touches unmarked user content in AGENTS.md |
| Warning comment | Emits an auto-generated comment as the first line inside the block: "edit the source in `harness/`, not here" |

**No-runtime fallback:** follow `SKILL.md` §c Deploy step — show the user a diff of the
proposed SYNAPTIC-RULES block, require confirmation, and refuse if `harness/` contains
`{{placeholders}}`.

---

## check.js — Brain Health Lint

```sh
node tools/check.js [path-to-.synaptic]   # default: ./.synaptic
```

Validates the brain structure and exits 1 on ERRORs (0 on WARNINGS-only).
Output is grouped by file.

**What it checks:**

| Check | Severity |
|---|---|
| `BRAIN.md` and `knowledge/INDEX.md` present | ERROR |
| v0.x leftovers: `BOOTSTRAP.md`, `MANIFEST.md`, `HEARTBEAT.md`, `_tree.yaml`, `inventory/`, `playbooks/`, `cortex.config.yaml` | ERROR |
| D1 frontmatter (`description`, `type`, `status`, `updated`, `tags`) on knowledge nodes + registries; excludes `INDEX.md`/`_index.md`/`README.md`/`templates/`; `{{PLACEHOLDER}}` values tolerated | ERROR per missing field |
| `tags` must be a YAML list (not scalar, not empty) | WARN |
| Knowledge node filenames kebab-case; no duplicate basenames across `knowledge/` | ERROR |
| MOC coverage: every node referenced from its cluster `_index.md` or `INDEX.md`; every cluster `_index.md` linked from `INDEX.md` | ERROR |
| Broken `[[wikilinks]]`; excludes scaffolding (`templates/`, `references/raw/`) and MOC files; skips HTML comments, inline code, placeholder targets (`{{...}}`) | ERROR |
| Registry files: `type: registry` frontmatter + listed in `registries/_index.md` | ERROR |
| References files (non-`raw/`): listed in `references/_index.md` | WARN |
| Knowledge nodes > 150 lines and not `type: reference` | WARN |
| `BRAIN.md` > 110 lines | WARN |
| `updated:` > 90 days old (skip placeholders) | WARN |

**Retrieval-readiness report (advisory, never gates):** after the checks, `check.js` prints a
retrieval-readiness block computed over the **shared knowledge-scoped, MOC-excluded edge universe**
(`tools/lib/brain-graph.js` — the same module `graph.js` uses, so the two tools never disagree on
topology): total **nodes**, total **edges** (undirected, deduped — typed frontmatter edges + body
`[[wikilinks]]`), **orphans** (degree-0 knowledge nodes), **edges-per-node** (undirected
`edges / nodes`), and **MOC-reachable** count. When `errors == 0` **and** a retrieval-risk heuristic
trips (orphan ratio > 20% **OR** edges-per-node < 0.5), it prints a **"structural-green ≠
retrieval-green"** caveat. This is advisory only — the exit code stays **ERROR-driven**; the report
never fails the check.

**No-runtime fallback:** run `/synaptic-audit` — the synaptic skill replicates this checklist
using agent read/grep operations.

---

## migrate.js — Phase M Migration Helper

```sh
node tools/migrate.js <path-to-.synaptic> [templates-source-dir] [--dry-run]
```

Automates **Phase M** (deterministic file operations) of a v0.x → v1 upgrade.

**What it does (deterministic, idempotent, non-destructive):**
- Detects source version (`BOOTSTRAP.md` → v0.3; `BRAIN.md` version field → v0.4/v0.5)
- Creates missing v1 directories: `registries/`, `harness/`, `harness/skills/`,
  `references/`, `references/raw/`, `playgrounds/`, `templates/`
- Renames `inventory/` → `registries/` (merges if both exist)
- Stages v0.x boot files (`BOOTSTRAP.md`, `MANIFEST.md`, `identity/HEARTBEAT.md`,
  `knowledge/_tree.yaml`) and `worklines/` into `_migration-staging/`
- Copies bundled v1 templates if a templates source path is given as 2nd argument

**What it never does:**
- Never rewrites file content
- Never converts wikilinks or path-links
- Never deletes knowledge nodes
- Never touches knowledge content files

Prints a dry-run preview first; pass `--dry-run` to preview only (no files modified).

After Phase M, run **Phase C** (mandatory agent rearrange) per `upgrade-to-v1.md`.
Phase C requires a capable agent: link conversion, MOC creation, consolidation formula,
harness triage.

**No-runtime fallback:** follow `upgrade-to-v1.md` Phase M checklist manually.

---

## export.js — Single-File Export

```sh
# Single combined file (default out: synaptic-export.md)
node tools/export.js <path-to-.synaptic> [out.md]

# Split into 4 section files (useful for email/chat size limits)
node tools/export.js <path-to-.synaptic> [out-prefix] --split
```

Bundles the entire brain into portable Markdown for sharing, backup, or
pasting into a chat context. Equivalent to exporting a brain by hand for a handoff or backup — automated and deterministic.

**Single-file output:** one `.md` with a table of contents + `## FILE: <relpath>` headers.
Binary payloads in `references/raw/` are listed as "omitted binary payload (N bytes)"
rather than embedded.

**Split output (`--split`):** emits 4 named files:

| File | Contents |
|---|---|
| `{prefix}-core.md` | `BRAIN.md` + `harness/` |
| `{prefix}-knowledge.md` | `knowledge/` |
| `{prefix}-registries.md` | `registries/` |
| `{prefix}-refs-harness.md` | `references/` + `templates/` + `journal/` |

**Ordering:** deterministic (section priority, then alphabetical within section).
`playgrounds/` README is included in single-file mode; actual task dirs are omitted
(they are burnable working memory, not knowledge).

**No-runtime fallback:** run `/export` — the skill reads files in the same order and
concatenates them into the chat context or a file.

---

## vault-open.js — Generic Knowledge-Tool Config

```sh
node tools/vault-open.js <path-to-.synaptic>
```

The brain is already openable in any wikilink-aware tool without modification.
This script writes **minimal optional config** for the common tools and produces
`OPEN-IN.md` documenting multi-tool usage. Idempotent — never overwrites existing
user config.

**What it writes (additive only, never overwrites):**

| Tool | File(s) written | Notes |
|---|---|---|
| **Obsidian** | `.obsidian/app.json`, `.obsidian/graph.json` | Wikilinks on; `templates/`+`journal/` excluded from graph |
| **Foam / VSCode** | `.vscode/settings.json` (merge) | Only adds absent keys; never removes existing settings |
| **Logseq** | `logseq/config.edn` | Markdown format; Logseq journals disabled (use `journal/_current.md`) |
| **Dendron** | *(none)* | Dendron init is interactive; `OPEN-IN.md` documents setup |
| **All tools** | `OPEN-IN.md` | Multi-tool guide at brain root |

**Multi-tool note:** Obsidian, Foam, Logseq, and Dendron all speak the same
Markdown + YAML frontmatter + wikilinks format. You can switch tools at any time
without reformatting notes. The synaptic-core CORE layer never requires any of them.

**No-runtime fallback:** open the parent directory of `.synaptic/` directly in
Obsidian or Foam — wikilinks and frontmatter work natively with zero config.

---

## graph.js — Interactive Force-Directed Brain Graph

```sh
node tools/graph.js [path-to-.synaptic] [--out FILE] [--title "..."]

# Examples
node tools/graph.js                                         # reads ./.synaptic, writes synaptic-graph.html
node tools/graph.js /path/to/.synaptic                      # explicit path
node tools/graph.js /path/to/.synaptic --out brain.html     # custom output filename
node tools/graph.js /path/to/.synaptic --title "Q2 Brain"   # override title in the output
```

Renders a **force-directed, interactive graph of your Synaptic brain** as a single
self-contained HTML file — no Obsidian, no npm install, **no network access**. Open the file in
any browser and interrogate the graph directly. All JS and CSS are inlined; the emitted HTML has
**zero external resource URLs** (no CDN, no `<script src>`, no `<link href>`), so it opens on a
locked-down corporate laptop with nothing installed.

**Interactive single-file graph UX inspired by Graphify (MIT) — approach reused, code
re-implemented, no dependency taken.** (Graphify's Tree-sitter/NetworkX + LLM extraction and
blob-as-truth model are explicitly rejected; we read only OUR authored edges, zero LLM tokens.)

**Shared topology.** Edges/degrees come from the shared `tools/lib/brain-graph.js` module — the
**same knowledge-scoped, MOC-excluded edge universe `check.js` reports**, so the two tools never
disagree on the graph.

**What it shows:**

| Element | Detail |
|---|---|
| **Nodes** | Every `knowledge/` node (non-MOC), coloured by top-level cluster; radius scales with edge degree |
| **Edges** | **Typed frontmatter edges** (`relates_to`/`depends_on`/`supersedes`/`contradicts`/`applies_to`/`causes`/`part_of`, block-list `- "[[t]]"`) **plus** body `[[wikilinks]]` — undirected, deduplicated. Edge colour/style encodes the edge type |
| **Typed-edge aware** | Frontmatter block-list edges the old renderer missed are now first-class (a pair joined only by a `depends_on` edge shows a link) |
| **MOC-edge exclusion** | `_index.md` / `INDEX.md` / `README.md` are excluded as edge **sources and targets** — their wikilinks are navigation scaffolding, not knowledge edges, so INDEX is never a false super-hub |
| **Tooltips** | Hover any node: full id, cluster, `type`, degree, `lifecycle` (if set), and `tags` |
| **Legend / filters** | Left panel: per-cluster and per-edge-type toggles with counts; lifecycle toggles to hide `resource` / `archived`+`dormant` nodes |

**Interactive controls (all in-browser, no server):**

- **Zoom / pan** — scroll to zoom, drag the canvas to pan.
- **Search** — the search box highlights nodes by id substring; **Enter** centers the match.
- **Filter** — toggle clusters and edge-types on/off; hide `resource`/`archived` lifecycle nodes.
- **Expand / collapse** — click a node to hide/show its exclusive neighbours, so a large brain
  starts legible and drills down on demand. Drag a node to pin it.

**Deterministic layout — before/after comparable:**

The force simulation (charge/repulsion + link spring + centering) is driven by a **seeded PRNG**
(`mulberry32`, seeded from node count) — **never `Math.random`, never time-based**. Two runs on
the same brain converge to the same layout, so comparing a brain before and after
`/synaptic-weave` or `/synaptic-audit` is meaningful.

**Robustness:**

- Missing `knowledge/`, empty brain, or nodes without frontmatter: handled gracefully — still
  emits a valid HTML file (with an empty-state message) and prints a clear stdout summary.
- Unresolved wikilinks (links to unknown nodes) are counted in the summary, never crash the run.
- Very long node names are shortened in the label; the full id is always in the tooltip.

**Self-test:** run `node tools/graph.js <repo>/.synaptic --out /tmp/g.html`, open `/tmp/g.html`,
then confirm: (i) a settled force-directed layout, (ii) search highlights a known id, (iii) a
cluster toggle hides/shows that cluster, (iv) clicking a node expands/collapses neighbours, (v) a
`depends_on`-only pair shows a link, (vi) an `_index.md`-only wikilink shows no link, (vii) the
emitted HTML has zero external resource URLs.

**No-runtime fallback:** ask your agent to describe the brain's cluster structure and
connection density — the same information `check.js` reports as orphan/link counts.
