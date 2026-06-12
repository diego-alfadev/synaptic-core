# ROADMAP — SYNAPTIC-CORE

> Horizon traced, not promised. The v1.0 section describes what shipped. The platform-mode section describes where this is going and what each item needs to get there — none of it is committed for a specific date.

---

## v1.0 — What shipped

**Status:** current branch `audit/improvement-proposal`

### The two-plane model

The `.synaptic/` brain is structured around a clean separation between the **wiki** (what you know: patterns, decisions, playbooks, lessons, registries, references) and the **harness** (how you work here: conventions, guardrails, project-local skills). Persona and behavior are explicitly out of scope — they belong in the user harness (AGENTS.md / CLAUDE.md), not in the brain.

### Capture contract

A six-step agent-agnostic consolidation formula is embedded in every `BRAIN.md` as the **capture contract**. It encodes the full contribution cycle: classify → atomicity test → generalize → place & link → dedupe/SSOT → quality gate. This is the mechanism that makes the brain grow correctly on its own regardless of which agent drives it.

### MOC-of-MOCs navigation

`BRAIN.md` (single boot file, ≤110 lines) → `knowledge/INDEX.md` (hub MOC) → `{cluster}/_index.md` (sub-MOC, 1-line per node) → 1–2 relevant nodes. The 1-line summaries in sub-MOC files are the mechanism that delivers O(1) navigation — you never read 10 files to get one insight. A node not reachable from a MOC does not exist (enforced by `check`).

### D1 frontmatter + tags

Every knowledge node and registry carries: `description` (1 line, feeds the `_index` summary), `type`, `status`, `updated`, `tags`. Tags are the deliberate indexable surface for future FTS/RAG — present in v1 so the format never needs forking.

### Registries as first-class citizens

`registries/` holds tabular SSOTs for records looked up by attribute (infra resources, repo catalogs, environments, glossary). One canonical table per record class; "update, don't duplicate". The natural seam to robust-mode FTS when that arrives.

### References: existence-indexed

`references/_index.md` indexes the *existence* of large verbatim artifacts (DDL schemas, API specs, data exports) — one line per artifact. `references/raw/` holds the payloads. Agents read fragments on demand; nothing is eager-loaded; nothing is duplicated into knowledge pages beyond distilled facts.

### Self-wiring harness

`/init` writes the `<!-- BEGIN:SYNAPTIC -->` fragment into the project `AGENTS.md` (idempotent; created if absent) and installs the skill package into `.claude/skills/synaptic/` and `.agents/skills/synaptic/`. These are the ecosystem-standard discovery paths adopted across Claude Code, Cursor, VS Code Copilot, Gemini CLI, OpenCode, and Codex. The skill optionally writes a `.cursor/rules/synaptic.mdc` shim when `.cursor/` is detected.

### Four tools (zero-dep, optional)

| Tool | What it does |
|---|---|
| `check` | Graph health lint: broken wikilinks, MOC coverage, frontmatter, soft budgets, registry/reference integrity |
| `migrate` | Phase M automation: deterministic file ops for v0.x → v1 upgrade |
| `export` | Single-file (or 4-section split) Markdown bundle for sharing, backup, or paste-into-chat |
| `vault-open` | Minimal optional config for Obsidian, Foam (VS Code), and Logseq; produces `OPEN-IN.md` |

All zero-dependency (Node ≥ 18 standard library). CORE never requires them. No-runtime fallback: the `synaptic` skill performs the equivalent operation manually.

### Two-engine migration from v0.3 / v0.4 / v0.5

`/upgrade` guides the migration in two engines:
- **Phase M** (deterministic; `tools/migrate.js` or cheap agent): directory renames, staging of removed structures, template copy
- **Phase C** (mandatory capable agent): link conversion, MOC creation, consolidation formula applied retroactively, harness triage

Phase C is a breaking change by design — it cannot be scripted away. A capable agent must make content judgments.

### Scope generalisation

`scope: project | role | org | life` in `BRAIN.md` frontmatter. The interview and the directory structure do not change across scopes. Start with `project`; graduate when you see what works.

---

## Platform mode — honest horizon

The v1 file contract (frontmatter + tags + INDEX + `[[wikilinks]]` + registries) is deliberately the **indexable surface** for all four platform items below. None of them require forking the format. None of them are built in v1.

### MCP server

**What:** expose read and search over the brain to any MCP-capable agent — load a node by name, search by tag, query the INDEX, retrieve a registry row.

**Why:** agents that cannot read files directly (sandboxed runtimes, remote orchestration) would gain full brain access without any format change. Local agents that *can* read files already have a better path (direct file read); the MCP server targets the remote/sandboxed case.

**Dependency:** a runtime (Node or Python) at the brain location; the v1 frontmatter and INDEX contract as the query surface. No schema migration needed.

### Semantic search / RAG + nugget layer

**What:** a two-tier derived layer, both built FROM the authored pages and deletable at any time:

1. **Embeddings over nodes and registry rows** — find the most relevant node for a query even when the exact wikilink is unknown. Candidates: Smart Connections (Obsidian plugin), SQLite-vec sidecar, Engram's embedding layer.
2. **Nugget / proposition index** — extract atomic facts and entities from the narrative pages, embed and index them. Enables (a) fine-grained semantic retrieval (RAG over propositions, not whole pages), (b) auto-suggesting `[[links]]` that feed the `/weave` graph-gardening operation, and (c) gap detection (concepts referenced or implied by a cluster but with no authored node).

**Why:** the MOC-of-MOCs navigation is efficient when you know *where* to look; semantic search helps when you do not. The nugget layer adds fine-grained recall and drives automated relation discovery without touching the authoritative pages.

**Relationship to the wiki:** the wiki (narrative pages) stays the authored, authoritative layer. The nugget index is strictly derived — it does not replace pages, and nothing in CORE reads it. Think of it as a computed view over the same content.

**Dependency:** an embedding runtime; the v1 `tags` frontmatter and `description` field as the primary embedding surface. The derived index is deletable; files remain authoritative. The `/weave` skill operation can use this layer when available, but falls back to tag/term overlap when it is not.

**Constraint:** CORE remains 0-install-capable. This entire layer is ECOSYSTEM, never CORE. The authored pages are the substrate; the nugget index is an optional acceleration.

### Shared / team brain

**What:** a committed brain repository with governance: CODEOWNERS on `knowledge/`, a `validated:` flag for peer-reviewed nodes, pull-request-based knowledge contribution.

**Why:** a single shared brain for a team eliminates the n-copies-drift problem. Any contributor's agent consolidates into a PR; a maintainer reviews and merges. The knowledge graph becomes auditable by default.

**Dependency:** a Git hosting platform; CODEOWNERS support; a team convention for the `validated:` flag (already in the v1 frontmatter schema). No format change required.

**Constraint:** the governance layer is a social contract, not a technical one. The technical prerequisite (a committed repo + frontmatter contract) is satisfied by v1.

### Robust persistence (Engram-style sidecar)

**What:** a derived SQLite + FTS5 sidecar built from the file graph — fast full-text search, O(log n) backlink resolution, change-history queries.

**Why:** for large brains (hundreds of nodes, multiple registries), grep-based backlink queries and linear INDEX scans become slow. A derived sidecar index solves this without touching the authoritative files.

**Dependency:** Engram or a compatible SQLite/FTS5 runtime; the v1 frontmatter and wikilink contract as the parse surface. The sidecar is derivable on demand and deletable — files stay authoritative at all times.

**Constraint:** the sidecar is a TOOLS/ECOSYSTEM concern, never a CORE requirement. A brain without the sidecar is fully functional.

---

## Principles that will not change

These constraints are non-negotiable across every version and every platform-mode addition:

1. **0-install-capable CORE** — the brain works with just files; no tool is ever a hard requirement
2. **Files authoritative** — derived indexes (SQLite, embeddings, MCP caches) are deletable; the Markdown files are always the source of truth
3. **Harness-clean** — no persona, tone, or agent behavior config inside the brain; the brain travels without them
4. **Human-readable** — every node is Markdown or YAML; auditable without a tool, editable without a runtime, printable for compliance
