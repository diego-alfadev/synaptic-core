# ROADMAP — SYNAPTIC-CORE

> Horizon traced, not promised. The shipped section describes what is in v1. The Cortex-horizon section describes where this is going and what each item needs to get there — none of it is committed for a specific date.

> **Layer language (v1):** CORE = files/text on the runtime the agent already has, **hooks included** (host-run config). **Cortex** = optional utilities that need a runtime *we* add (the MCP server, the Node tools, a semantic sidecar) — deletable; the brain never depends on them. **Ecosystem** = the future team/shared ring. The horizon items below are **Cortex** unless noted.

---

## What shipped (CORE)

**Status:** shipped in v1.1.0

### The two-plane model

The `.synaptic/` brain is structured around a clean separation between the **wiki** (what you know: patterns, decisions, playbooks, lessons, registries, references) and the **harness** (how you work here: conventions, guardrails, project-local skills). Persona and behavior are explicitly out of scope — they belong in the user harness (AGENTS.md / CLAUDE.md), not in the brain.

### Capture contract

A six-step agent-agnostic consolidation formula is embedded in every `BRAIN.md` as the **capture contract**. It encodes the full contribution cycle: classify → atomicity test → generalize → place & link → dedupe/SSOT → quality gate. This is the mechanism that makes the brain grow correctly on its own regardless of which agent drives it.

### MOC-of-MOCs navigation

`BRAIN.md` (single boot file, ≤110 lines) → `knowledge/INDEX.md` (hub MOC) → `{cluster}/_index.md` (sub-MOC, 1-line per node) → 1–2 relevant nodes. The 1-line summaries in sub-MOC files are the mechanism that delivers bounded, constant-depth navigation (~3–4 hops regardless of brain size) — you never read 10 files to get one insight. A node not reachable from a MOC does not exist (enforced by `check`).

### D1 frontmatter + tags

Every knowledge node and registry carries: `description` (1 line, feeds the `_index` summary), `type`, `status`, `updated`, `tags`. Tags are the deliberate indexable surface for future FTS/RAG — present in v1 so the format never needs forking.

### Registries as first-class citizens

`registries/` holds tabular SSOTs for records looked up by attribute (infra resources, repo catalogs, environments, glossary). One canonical table per record class; "update, don't duplicate". The natural seam to robust-mode FTS when that arrives.

### References: existence-indexed

`references/_index.md` indexes the *existence* of large verbatim artifacts (DDL schemas, API specs, data exports) — one line per artifact. `references/raw/` holds the payloads. Agents read fragments on demand; nothing is eager-loaded; nothing is duplicated into knowledge pages beyond distilled facts.

### Self-wiring harness

`/synaptic-init` writes the `<!-- BEGIN:SYNAPTIC -->` fragment into the project `AGENTS.md` (idempotent; created if absent) and installs the skill package into `.claude/skills/synaptic/` and `.agents/skills/synaptic/`. These are the ecosystem-standard discovery paths adopted across Claude Code, Cursor, VS Code Copilot, Gemini CLI, OpenCode, and Codex. The skill optionally writes a `.cursor/rules/synaptic.mdc` shim when `.cursor/` is detected.

### Zero-install agent self-install (shipped in v1.2.0)

The skill now ships with a bootstrap header in `SKILL.md` plus a `MANIFEST.txt` listing every file in the bundle, so a coding agent can fetch and install the whole skill on a clean machine with **no Node, no clone, no package manager** — reinforcing the 0-install-capable CORE principle from the install side, not just the runtime side. The `npx degit` one-liner and a manual folder-copy fallback round out a three-tier install; all three install the whole skill folder (`references/` + `templates/`), never `SKILL.md` alone. (This three-tier install shipped in v1.2.0.)

### Optional Cortex tools (zero-dep)

| Tool | What it does |
|---|---|
| `check` | Graph health lint: broken wikilinks, MOC coverage, frontmatter, soft budgets, registry/reference integrity |
| `migrate` | Phase M automation: deterministic file ops for v0.x → v1 upgrade |
| `export` | Single-file (or 4-section split) Markdown bundle for sharing, backup, or paste-into-chat |
| `vault-open` | Minimal optional config for Obsidian, Foam (VS Code), and Logseq; produces `OPEN-IN.md` |
| `graph` | Renders the authored `[[wikilink]]` edges as a navigable graph view of the brain |
| `deploy` | Writes the harness `<!-- BEGIN:SYNAPTIC -->` fragment and skill package into the outer harness |

All zero-dependency (Node ≥ 18 standard library). These are **Cortex** — CORE never requires them. No-runtime fallback: the `synaptic` skill performs the equivalent operation manually. (Hooks, by contrast, are CORE: host-run config, not a runtime we ship.)

### Two-engine migration from v0.3 / v0.4 / v0.5

`/synaptic-upgrade` guides the migration in two engines:
- **Phase M** (deterministic; `tools/migrate.js` or cheap agent): directory renames, staging of removed structures, template copy
- **Phase C** (mandatory capable agent): link conversion, MOC creation, consolidation formula applied retroactively, harness triage

Phase C is a breaking change by design — it cannot be scripted away. A capable agent must make content judgments.

### Scope generalisation

`scope: project | role | org | life` in `BRAIN.md` frontmatter. The interview and the directory structure do not change across scopes. Start with `project`; graduate when you see what works.

---

## Cortex — honest horizon

The v1 file contract (frontmatter + tags + INDEX + `[[wikilinks]]` + registries) is deliberately the **indexable surface** for every Cortex item below. None of them require forking the format. None of them are built in v1. Each is **optional and deletable** — the brain never depends on it.

### MCP server — **Cortex**

**What:** expose read and search over the brain to any MCP-capable agent — load a node by name, search by tag, query the INDEX, retrieve a registry row. **MCP is Cortex** — a tool *over* the files, not the CORE line. The CORE/Cortex boundary is never drawn at "with/without MCP"; a brain works fully without it, and it degrades away cleanly.

**Why:** agents that cannot read files directly (sandboxed runtimes, remote orchestration) would gain full brain access without any format change. Local agents that *can* read files already have a better path (direct file read); the MCP server targets the remote/sandboxed case.

**Dependency:** a runtime (Node or Python) at the brain location; the v1 frontmatter and INDEX contract as the query surface. No schema migration needed.

### Vector / semantic search — **Cortex (the direction, not a claim)**

**What:** a two-tier derived layer, both built FROM the authored pages and deletable at any time:

1. **Embeddings over nodes and registry rows** — find the most relevant node for a query even when the exact wikilink is unknown. Candidates: Smart Connections (Obsidian plugin), SQLite-vec sidecar, an embedding layer.
2. **Nugget / proposition index** — extract atomic facts and entities from the narrative pages, embed and index them. Enables (a) fine-grained semantic retrieval over propositions, not whole pages, and (b) **proposing** candidate `[[links]]` for the `/synaptic-weave` graph-gardening operation to review.

**Honesty line:** we are **not** GraphRAG and make **no auto-discovery-of-non-intuitive-links claim**. GraphRAG / LightRAG are cited as *the direction*. Edges stay **authored**; this layer **proposes, never auto-writes** — `/synaptic-weave` and a human confirm. Multi-hop relational retrieval here runs over **authored directional edges** an embedding cannot infer.

**Why:** the MOC-of-MOCs navigation is efficient when you know *where* to look; the semantic sidecar is the **designed answer to the ticket → playbook seam at scale**, when you do not. It degrades to grep/MOC and is never required at CORE.

**Relationship to the wiki:** the wiki (narrative pages) stays the authored, authoritative layer. The derived index does not replace pages, and nothing in CORE reads it. Think of it as a computed view over the same content.

**Dependency:** an embedding runtime; the v1 `tags` frontmatter and `description` field as the primary embedding surface. The derived index is deletable; files remain authoritative. The `/synaptic-weave` skill operation can use this layer when available, but falls back to tag/term overlap when it is not.

**Constraint:** CORE remains 0-install-capable. This entire layer is **Cortex**, never CORE. The authored pages are the substrate; the index is an optional acceleration.

### Shared / team brain — **Ecosystem (future ring)**

**What:** a committed brain repository with governance: CODEOWNERS on `knowledge/`, a `validated:` flag for peer-reviewed nodes, pull-request-based knowledge contribution.

**Why:** a single shared brain for a team eliminates the n-copies-drift problem. Any contributor's agent consolidates into a PR; a maintainer reviews and merges. The knowledge graph becomes auditable by default.

**Dependency:** a Git hosting platform; CODEOWNERS support; a team convention for the `validated:` flag (already in the v1 frontmatter schema). No format change required.

**Constraint:** the governance layer is a social contract, not a technical one. The technical prerequisite (a committed repo + frontmatter contract) is satisfied by v1.

> **Private only.** A shared brain is **private and access-controlled**. A *public* brain pattern is **rejected for any client-facing material** — knowledge bases accrete sensitive context; confidentiality and governance come first. It may be described generically (away from any client context) only as a pattern-with-a-confidentiality-caveat.

### Engram-style searchable journal — **Cortex**

**What:** a derived SQLite + FTS5 layer **over the journal** — fast full-text history ("did I solve a ticket like this before?"), change-history queries, and O(log n) lookups, all built from the files.

**Why:** for large brains and long histories, grep over the journal and linear scans become slow. A derived searchable layer solves this without touching the authoritative files.

**What it is NOT:** it is a **searchable journal layer, never a graph refiner.** It does **not** rewrite the authored pages, does **not** materialize backlinks, and does **not** become the authoritative edge store — the forward `[[wikilink]]` stays the single source of truth for relationships.

**Dependency:** Engram or a compatible SQLite/FTS5 runtime; the v1 frontmatter and wikilink contract as the parse surface. Derivable on demand and deletable — files stay authoritative at all times.

**Constraint:** this layer is **Cortex**, never a CORE requirement. A brain without it is fully functional.

---

## Principles that will not change

These constraints are non-negotiable across every version and every Cortex/Ecosystem addition:

1. **0-install-capable CORE** — the brain works with just files; no tool is ever a hard requirement
2. **Files authoritative** — derived indexes (SQLite, embeddings, MCP caches) are deletable; the Markdown files are always the source of truth
3. **Harness-clean** — no persona, tone, or agent behavior config inside the brain; the brain travels without them
4. **Human-readable** — every node is Markdown or YAML; auditable without a tool, editable without a runtime, printable for compliance
