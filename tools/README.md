# tools/ — Optional Synaptic Brain Helpers

The optional **TOOLS** layer of synaptic-core. The CORE layer (plain Markdown files)
never requires these scripts — everything they do can be performed manually by an agent.
Use when Node >= 18 is available (the happy path in ~90% of agentic contexts).

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
| Broken `[[wikilinks]]` in non-MOC, non-template files; skips HTML comments, inline code, placeholder targets (`{{...}}`) | ERROR |
| Registry files: `type: registry` frontmatter + listed in `registries/_index.md` | ERROR |
| References files (non-`raw/`): listed in `references/_index.md` | WARN |
| Knowledge nodes > 150 lines and not `type: reference` | WARN |
| `BRAIN.md` > 110 lines | WARN |
| `updated:` > 90 days old (skip placeholders) | WARN |

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

## graph.js — Visual Brain Graph Renderer

```sh
node tools/graph.js [path-to-.synaptic] [--out FILE] [--format html|svg] [--title "..."]

# Examples
node tools/graph.js                                         # reads ./.synaptic, writes synaptic-graph.html
node tools/graph.js /path/to/.synaptic                      # explicit path
node tools/graph.js /path/to/.synaptic --out brain.html     # custom output filename
node tools/graph.js /path/to/.synaptic --format svg         # raw SVG file instead
node tools/graph.js /path/to/.synaptic --title "Q2 Brain"   # override title in the output
```

Renders a **visual graph of your Synaptic brain** as a self-contained HTML file (default) or
raw SVG — no Obsidian, no npm install, no network access required. Open the HTML file in any
browser and the graph is immediately interactive.

**What it shows:**

| Element | Detail |
|---|---|
| **Nodes** | Every knowledge node (coloured by cluster), plus registries and references as their own groups, and a central INDEX hub |
| **Edges** | Undirected `[[wikilink]]` connections between nodes, extracted and deduplicated |
| **Node radius** | Scales with edge degree (more connections → larger circle) |
| **Labels** | Kebab-case basename, shortened for long names; full id in hover tooltip |
| **Tooltips** | Hover any node: full id, `type`, degree, and `tags` |
| **Legend** | Cluster name → colour with node counts; harness presence noted |
| **Title bar** | Brain name (from `BRAIN.md` frontmatter `name:`), node/edge/cluster count, orphan count, most-connected node |

**Deterministic layout — before/after comparable:**

Positions are pure functions of *(sorted cluster index, sorted node index within cluster)* —
no `Math.random`, no time-based seeding. Two runs on the same brain always produce identical
coordinates. Comparing a brain before and after `/synaptic-weave` or `/synaptic-audit` is meaningful: nodes
that moved are new or re-clustered, not randomly shuffled.

**HTML output — pan/zoom in any browser:**

The default `html` format embeds the SVG inside a self-contained HTML page with ~30 lines of
vanilla JavaScript for pan (drag) and zoom (scroll wheel). No CDN, no external resources.
Opens on a locked-down corporate laptop with nothing installed. Use `--format svg` if you
only need the raw image file (for slides, email, or a PDF).

**Great for executive show-and-tell:**

Drop `synaptic-graph.html` in an email or a share drive. The recipient opens it in Chrome or
Edge — no install, no login, no account. The coloured clusters and connection density make the
brain's structure immediately legible to non-technical stakeholders.

**Robustness:**

- Missing `knowledge/`, empty brain, or nodes without frontmatter: handled gracefully; still
  emits a valid output file and prints a clear summary.
- Unresolved wikilinks (cluster-level links like `[[ci-cd-patterns]]`, or links to unknown
  nodes) are counted and reported in the stdout summary but never crash the script.
- Very long node names are shortened in the label; the full id is always in the tooltip.

**No-runtime fallback:** ask your agent to describe the brain's cluster structure and
connection density — the same information `check.js` reports as orphan/link counts.
