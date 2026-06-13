# Changelog

## v1.0.0 — "LLM-wiki, grounded" · 2026-06-12

**The leap:** synaptic-core goes from a structured-notes convention (v0.3.x) to a **portable
knowledge-graph brain** — bounded navigation, a self-growing contribution formula, a clean
brain-vs-harness separation, safe migration, and zero-dependency tooling. The redesign was rebuilt and
validated against a **real ~60-file brain grown over months of delivery work**, not a toy fixture.

> One brain. Any agent. Zero install. It turns daily work into structured, navigable, agent-usable
> knowledge that any agent picks up in seconds and that travels with you.

### Why it matters
- **People** — a second brain for a role or your whole life: navigable, portable, yours.
- **Projects** — an agent onboards in seconds, no re-briefing; decisions, playbooks and lookups in one navigable graph.
- **Companies** — knowledge continuity across rotation; auditable; no platform rollout; works on a locked-down laptop.

### v0.3.x → v1.0 at a glance

| | v0.3.x | **v1.0** |
|---|---|---|
| **Boot** | eager multi-file load | **one file** (`BRAIN.md`), everything else on demand |
| **Navigation** | folder tree + a phantom-prone index | **MOC-of-MOCs** — `BRAIN → INDEX → cluster → the 1–2 nodes you need` |
| **Linking** | relative file paths | **`[[wikilinks]]`** (Obsidian/Foam/Logseq-native), backlinks by grep |
| **Knowledge units** | `areas`/`domains` overviews | **atomic nodes** + `registries/` (tabular lookups) + `references/` (verbatim, existence-indexed) |
| **Identity / persona** | mixed into the brain | **harness-clean** — knowledge in the brain, operating rules *deployed* to the harness, persona never in the brain |
| **Commands** | generic (`/init`, `/audit`…) — collide with other skills | **`/synaptic-*`** — no collisions, grouped in the agent selector |
| **Growth** | implicit, model-dependent | an **explicit 6-step consolidation formula** (agent-agnostic) + **`/synaptic-weave`** graph gardening |
| **Migration** | none | a **safe, two-engine `/synaptic-upgrade`** (mechanical pass + guided agent rearrange) — runs on a copy, content-preserving |
| **Tooling** | none | optional, zero-dep: `check` · `migrate` · `deploy` · `export` · `graph` · `vault-open` (CORE stays 0-install) |
| **Docs** | one long README | visual README + `PITCH.md` (exec + technical) + `ROADMAP.md` + 3 ADRs |

### Measured
On an internal benchmark over the real ~60-file brain (18 realistic questions, fresh-context agents
navigating the brain):
- **94%** of questions answered (17/18; 0 not-found);
- **17/18 resolved by the index hierarchy alone** — zero keyword/grep fallback;
- **median 4 file-reads** to an answer (a 3-file navigation baseline + the one node you need);
- **0 broken links**.

*Honest caveat: single run, 18 questions, author-adjacent topics, one scale point. This measures
retrieval **efficiency + coverage**, not ground-truth accuracy. The one miss was a cross-cluster
synthesis query — a content gap, not a navigation failure — exactly what `/synaptic-weave` is for.*

### How it works
`BRAIN.md` (the only boot read) → `knowledge/INDEX.md` (hub) → `{cluster}/_index.md` (sub-map, one
line per node) → open only the relevant node(s). Two planes: **wiki** (what you know) and **harness**
(how you work — deployed to your agent, not loaded from the brain). Persona stays in your harness.

### Migrating an existing brain — your data is safe
`/synaptic-upgrade` is **non-destructive** (it stages, never deletes; runs on a copy; the original is
git-versioned) and **content-preserving** (it re-files and re-links; it does not rewrite your facts).
Step-by-step runbook: [`docs/v1-upgrade-and-benchmark.md`](docs/v1-upgrade-and-benchmark.md). Worst case,
you keep your old brain.

### Honest notes
- The tools are zero-dep and **optional** — the CORE is pure files and works with no runtime. Their first
  real execution happens in your environment.
- The benchmark caveats above are real; treat the numbers as directional, not a paper.

### Foundations
See `PITCH.md` (the two-tier value + technical case, including the "Standing on" section mapping the
PKM / agent-skills techniques the design draws from), `ROADMAP.md` (platform horizon: MCP, semantic /
nugget layer, shared brain, robust persistence), and `docs/architecture/` (ADR-001 Minimal Cortex,
ADR-002 LLM-wiki-first, ADR-003 deploy-source + weave). The full technique-to-mechanism table —
Zettelkasten atomicity, MOC-of-MOCs, `[[wikilinks]]`, Karpathy LLM-wiki, Agent Skills progressive
disclosure, frontmatter metadata, consolidation protocol, files-authoritative governance, and the
GraphRAG / FTS5 horizon items — is documented in the README under "Built on proven ideas (and why)".
