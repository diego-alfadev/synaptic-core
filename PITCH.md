# SYNAPTIC-CORE — v1.0 Pitch

---

## Tier 1 — What it is (60-second read)

Synaptic is a folder of plain Markdown files that turns your daily work into a knowledge graph any AI agent can navigate in seconds. It travels with you when the project ends, works with any agent you use today or tomorrow, and requires zero installation to run.

**For People**
- Stop re-briefing your agent every session — one boot file loads your full context in seconds
- Your accumulated knowledge is yours: portable, readable without any tool, and never locked to a service
- Hand over a role with something real, not a dump of meeting notes
- Knowledge compounds — every session adds to the graph; it gets smarter with every project

**For Projects**
- An agent reads one file and already knows the scope, conventions, guardrails, and where everything lives — before writing a single line
- Decisions, patterns, and playbooks accumulate through real work; no manual documentation overhead
- No re-briefing between sessions; no tribal-knowledge dependency on the person who left

**For Companies**
- A contractor finishes; their successor picks up the brain and continues — no knowledge walks out the door
- No new platform to procure, no rollout, no vendor dependency — runs on a laptop with a text editor and an AI agent
- Auditable by default: compliance can read every file; nothing is opaque
- Works on-premise, air-gapped, or in any cloud — it is a folder of Markdown files

**Where to start:** read [README.md](README.md) and run `/init` with your agent. See [ROADMAP.md](ROADMAP.md) for what shipped in v1.0 and what is coming next.

---

## Tier 2 — Technical foundations (why it is robust)

### MOC-of-MOCs navigation — O(1)-ish retrieval
`BRAIN.md` (single boot file, ≤110 lines) → `knowledge/INDEX.md` (hub: one-line summary per cluster) → `{cluster}/_index.md` (sub-MOC: one-line summary per node) → open only the 1–2 relevant nodes. The one-line summaries are the mechanism. You never read 10 files to get one insight. A node not reachable from a MOC does not exist.

### The 6-step consolidation formula — the brain grows correctly on its own
An explicit, agent-agnostic algorithm embedded in every `BRAIN.md` as the **capture contract**: (1) Classify — durable knowledge vs. record vs. lesson vs. task artifact vs. noise; (2) Atomicity test — promote only when a pattern recurs (2+ instances) or the decision/lesson is reusable; (3) Generalize — strip the anecdote, keep the concept; (4) Place & link — atomic node in the right cluster, frontmatter, `[[wikilinks]]`, register in `_index.md`; (5) Dedupe / SSOT — search first, update don't duplicate; (6) Quality gate — professional and verifiable only, soft budget or `type: reference`, `updated:` stamped, reachable from a MOC. Any agent that runs this formula produces a navigable graph, not a pile of notes.

### 3-concern separation — knowledge · operating rules · persona
Three concerns are explicitly separated and never mixed:
- **Knowledge** lives in the brain (`knowledge/`, `registries/`, `references/`) and is read on demand via MOC.
- **Operating rules** (commit conventions, guardrails, project skills) live in `harness/` as a **deployable source**: `/init` and `/upgrade` deploy them into the outer harness (AGENTS.md / CLAUDE.md); at work-time the agent reads the outer harness, not the brain's `harness/` folder. The brain keeps the copy so the harness is regenerable on any machine.
- **Persona** (tone, chat language, agent personality) lives in the outer harness only — never in the brain.
The brain stays knowledge-focused; the harness stays rule-focused; portability is preserved. A Jarvis-persona agent and a vanilla agent share the same brain without conflict.

### Write-time curation (schema-on-write) + raw fallback — not read-time RAG-over-raw
Two schools exist: **write-time curation** (our approach) curates knowledge on the way in — expensive ingestion, cheap and near-deterministic retrieval; **read-time reasoning** (RAG-over-raw) stores raw content verbatim and re-derives answers per query — cheap ingestion, expensive and variable retrieval. We chose write-time curation because agents re-read the same context constantly: curate once, read cheap forever. Curated knowledge is auditable, portable, and stable — a teammate or any agent gets the same coherent answer, not a fresh re-derivation. We are a pragmatic hybrid: knowledge nodes are curated (schema-on-write), and verbatim payloads live in `references/raw/` for the rare fine-detail query (schema-on-read fallback). Best of both worlds.

### Frontmatter + tags — FTS-ready surface
Every node carries `description`, `type`, `status`, `updated`, and `tags`. Tags are present in v1 specifically as the indexable surface for future FTS / RAG / semantic search — so the format never needs forking when those layers are added. `description` feeds the `_index.md` one-liner and the embedding input.

### Two-engine migration — mechanical + guided agent rearrange
Upgrading a v0.x brain runs in two distinct engines: **Phase M** (deterministic file operations — safe to run as a script or a cheap agent; stages files, never deletes) and **Phase C** (mandatory capable agent — content judgment for link conversion, MOC creation, consolidation formula applied retroactively, harness triage). The split is deliberate: Phase M is cheap and reversible; Phase C is where the real re-wiring happens and cannot be scripted away.

### Matrioshka layering — 0-install-capable CORE → optional TOOLS → ECOSYSTEM
Three concentric layers, each independent of the outer ones. **CORE**: pure Markdown and YAML, zero dependencies, works everywhere including air-gapped corporate environments. **TOOLS** (optional, zero-dep, Node ≥ 18): `check`, `migrate`, `export`, `vault-open` — the happy path for the ~90% of users who have a runtime. **ECOSYSTEM** (horizon): MCP server, semantic search / RAG, shared team brain, Engram-style SQLite/FTS5 sidecar. Removing the outer layers does not break the inner ones. CORE is the non-negotiable foundation.

### Roadmap
The v1 file contract (frontmatter + tags + INDEX + `[[wikilinks]]` + registries) is the deliberate indexable surface so platform-mode additions attach without forking the format. On the horizon: **MCP server** (expose read/search to sandboxed or remote agents); **semantic search / RAG** (embeddings over nodes — find what you need when you don't know the exact wikilink); **shared / team brain** (committed repo + CODEOWNERS + `validated:` flag for peer-reviewed knowledge); **robust persistence** (Engram-style SQLite/FTS5 sidecar — derived, deletable, files stay authoritative). None of these are built in v1; all are enabled by the v1 contract. See [ROADMAP.md](ROADMAP.md).
