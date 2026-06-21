# Changelog

## Unreleased

### Fixed
- **Audit excludes scaffolding from link checks.** `/synaptic-audit` (and `tools/check.js`) now
  exclude `templates/` and `references/raw/` from the broken-link (Step 3) and cross-link-coverage
  (Step 4b) checks. Those directories legitimately hold placeholder example wikilinks
  (`[[target]]`, `[[related-node]]`, `[[x]]`) and verbatim captured payloads — scaffolding, not
  authored edges. The first dogfood audit false-flagged ~12 of them as "broken." CORE-safe:
  skill-guidance + optional-tool change, pure files, no new dependencies. (`references/raw/` was
  the gap in `check.js`; `templates/` was already excluded there — `audit.md` now states both
  exclusions explicitly for the no-runtime path.)

## v1.1.0 — "AI Brain, on a dial" · 2026-06-21

> **The brain you already have — now relational, auditable, and self-improving *as you work*, with nothing new to install.** The biggest release since v1.0: a typed knowledge graph, provenance you can audit, a capture mechanism that keeps up while you work, and a sharper story — all on the same zero-runtime files you already own.
>
> The v1.1 line keeps the unchanged CORE floor (pure Markdown/YAML, zero-runtime, files-authoritative,
> persona-out, MOC-of-MOCs, anti-RAG default, MIT) and grows positioning, capture, and the typed
> knowledge graph on top of it. Every change below is additive and backward-compatible; additive
> frontmatter does **not** bump the brain schema version.

### Positioning / commercial
- **"AI Brain" category + "Create your own AI Brain"** front and centre, with the humility framing
  ("an industry pattern given a direction").
- **New positioning line:** *"a way of working with your agents that turns your daily work into
  structured instructions and documentation that makes you more effective."*
- **CORE-only pitch:** you don't install software — you teach your agent a way of working (one skill =
  markdown it reads); knowledge accrues as plain `.md` files you own; no server/DB/runtime; **copy one
  folder and you have the whole CORE.**
- **RAG vs plain wiki vs AI Brain** comparison moved up front (stateless · inert · improves-itself-as-
  you-work-within-bounded-reversible-limits / compounds; Karpathy "only key, distilled info in the
  window").
- **Self-improving, honestly:** the claim now always carries the **bounded, reversible** qualifier —
  improves itself **as you work, within bounded reversible limits**; never an unattended autonomous
  rewriter. Banned phrase *"fill gaps from the session log"* **purged** → "capture decisions explicitly
  stated in the session."
- **Auto-notes objection FAQ** added: this is structure + patterns + curation (capture-with-intention →
  consolidate into linked atomic notes, lessons, playbooks), **not** passive meeting summaries.
- **Three intents documented as MOC lenses** (personal / the seat / department) over the same nodes —
  **recommend starting with the seat.** The **public-brain pattern is rejected** for any client-facing material (private/access-controlled only; generic-with-caveat elsewhere).

### Capture (the dial)
- **Capture reframed as a dial:** lead with **passivity-as-a-dial**, then the honest manual trade.
  Two **orthogonal** axes — the **passivity dial** (when capture triggers: manual ↔ event-driven hooks
  ↔ where-supported automation) and **`capture_policy`** (how much reaches the wiki).
- **`capture_policy` presets renamed:** `curated | balanced | logbook` → **`selective | balanced |
  capture-all`** (same formula, now seven steps; promotion threshold only).
- **Always-on journal breadcrumb floor:** a terse one-line `Stop` breadcrumb per meaningful turn, fixed
  cost, surviving crashes — **not** governed by `capture_policy`. Honest limit stated: **no agent has
  native idle detection**; "passive" = event-driven on hook-capable hosts + the journal fallback +
  next-session rescue, not an unattended daemon.
- **Hooks are CORE** (host-run config the agent already executes), not a runtime we ship.

### Architecture / layering
- **Single source of truth — no `seed/`.** The skill bundle's `templates/` are the one source; the
  example brain is **assembled on demand**. All `seed/` references removed; the install entry is
  "install the skill."
- **MCP = Cortex** (a tool over the files), not Ecosystem/horizon. The CORE/Cortex line is never drawn
  at with/without MCP.
- **Engram = optional searchable journal layer** (SQLite/FTS5) — never a graph refiner, never rewrites
  pages. **Vector/semantic search = horizon Cortex** ("the direction"; no auto-discovery-of-links claim).
- **Canvas dropped from v1 entirely** (not even later-polish).

### Upgrading — quick, non-destructive, honestly a pleasure

**Your data is safe on every path** — you work on a copy and switch only when you're happy.

- **From v0.3.x →** run `/synaptic-upgrade`, or follow the supervised runbook [`docs/UPGRADE-v0.3-to-v1.md`](docs/UPGRADE-v0.3-to-v1.md). It restructures **on a copy** (Phase M mechanical → Phase C agent re-file → Phase V verify: counts, links, MOC coverage), and you replace the original only once it is green. Worst case, you keep your old brain.
- **From v1.0.0 →** just re-copy the skill ([`standalone/synaptic/SKILL.md`](standalone/synaptic/SKILL.md)). Your brain keeps working as-is — the schema is unchanged. One optional, one-word touch: rename your `capture_policy` value (`curated → selective`, `logbook → capture-all`).

Nothing to deploy, no server, no database — the upgrade is files in, files out.

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
| **Capture tuning** | fixed, one-size | **`capture_policy`** — `curated` · `balanced` · `logbook` *(renamed to `selective` · `balanced` · `capture-all` in v1 — see the v1 (next) entry above)*: same formula, tunable promotion threshold; the agent **offers to consolidate at session end** (discipline in the harness, not your head) |
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
PKM / agent-skills techniques the design draws from), `ROADMAP.md` (Cortex horizon: MCP = Cortex,
vector/semantic search, shared/team brain, Engram-style searchable journal), and `docs/architecture/` (ADR-001 Minimal Cortex,
ADR-002 LLM-wiki-first, ADR-003 deploy-source + weave). The full technique-to-mechanism table —
Zettelkasten atomicity, MOC-of-MOCs, `[[wikilinks]]`, Karpathy LLM-wiki, Agent Skills progressive
disclosure, frontmatter metadata, consolidation protocol, files-authoritative governance, and the
GraphRAG / FTS5 horizon items — is documented in the README under "Built on proven ideas (and why)".
