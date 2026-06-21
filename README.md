<p align="center">
  <img src="https://raw.githubusercontent.com/diego-alfadev/synaptic-core/v1.1.0/docs/assets/synaptic-hero.svg" alt="synaptic-core — one brain, any agent, zero install" width="880">
</p>

<p align="center">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue">
  <img alt="version" src="https://img.shields.io/badge/version-1.1.0-5eead4">
  <img alt="install" src="https://img.shields.io/badge/install-zero-16a34a">
  <img alt="agent" src="https://img.shields.io/badge/agent-agnostic-818cf8">
  <img alt="format" src="https://img.shields.io/badge/format-Markdown%20%2B%20%5B%5Bwikilinks%5D%5D-fbbf24">
</p>

<p align="center"><strong>Create your own AI Brain.</strong><br>One boot file. Any agent. No required installations.</p>

Synaptic-core is an **AI Brain**: a way of working with your agents that turns your daily work into structured instructions and documentation that makes you more effective. Instead of dumping context somewhere, you curate it once (write-time), so every future agent session reads cheap and deterministic — a brain any agent can pick up in seconds and that travels with you when the project ends. No re-briefing. No tribal knowledge walking out the door.

> This is an **industry pattern given a direction**, not a brand-new invention. We did not invent plain-file knowledge bases or wikilinks; we point them at one job — accreting a role's knowledge so an agent grows it correctly as you work.

---

## 🚀 Quick start (60 seconds)

**Recommended — install the skill:**

```
# Claude Code / VS Code Copilot / OpenCode
.claude/skills/synaptic/SKILL.md

# Gemini CLI / Codex / universal fallback
.agents/skills/synaptic/SKILL.md
```

Copy [`standalone/synaptic/SKILL.md`](standalone/synaptic/SKILL.md) into either path above, then tell your agent:

```
/synaptic-init
```

The skill runs a scope-aware interview, generates a complete personalized brain from the bundle templates, and self-wires your harness (writes `AGENTS.md` / `CLAUDE.md` fragment, installs skill in both paths). No further steps.

> **One folder, the whole CORE.** You don't install software — you teach your agent a way of working (one skill = markdown it reads). Your knowledge then accrues as plain `.md` files you own; no server, no database, no runtime we ship. Copy one folder and you have the whole CORE. (There is no separate seed to drop in: the skill's own templates are the single source, and the example brain is assembled on demand.)

**Upgrading from v0.3 / v0.4 / v0.5:**

```
/synaptic-upgrade
```

Two-engine migration: deterministic file ops (Phase M) + mandatory agent rearrange (Phase C). See [`docs/UPGRADE-v0.3-to-v1.md`](docs/UPGRADE-v0.3-to-v1.md) for the supervised, non-destructive runbook (runs on a copy; switch only when green).

**Skill-less fallback (any agent, always works):**

> Paste `"Read .synaptic/BRAIN.md and follow it."` — the brain is self-describing. You lose the guided lifecycle commands; the brain works.

---

## 🧠 How it works

<p align="center">
  <img src="https://raw.githubusercontent.com/diego-alfadev/synaptic-core/v1.1.0/docs/assets/synaptic-architecture.svg" alt="how synaptic works" width="900">
</p>

One boot file (`BRAIN.md`, ≤110 lines, ~500 tokens) is the only mandatory read. It carries the context capsule, the capture contract, a 1-line pointer to the deployed harness rules, the brain map, and the session-start pointer. Everything else loads on demand.

Navigation is bounded at ~3–4 hops regardless of brain size — you never read 10 files to get one insight:

```
BRAIN.md (boot)
  → knowledge/INDEX.md        (hub MOC: 1-line per cluster)
    → {cluster}/_index.md     (sub-MOC: 1-line per node)
      → open only the 1–2 relevant nodes
```

The brain has **two planes** — wiki (what you know) and harness (how you work here) — and one explicit out-of-scope: **persona lives in your agent harness, not the brain**. Your Jarvis stays Jarvis. The brain travels.

---

## 🆚 RAG vs a plain wiki vs an AI Brain

Three ways to give an agent knowledge — they are not the same job:

| | **RAG over raw** | **A plain wiki** | **An AI Brain (synaptic-core)** |
|---|---|---|---|
| **State** | Stateless — re-derives an answer on every query | Inert — sits there until a human edits it | **Improves itself as you work**, within bounded, reversible limits |
| **Reasoning cost** | Paid on every read (chunk → embed → retrieve → reason) | Paid by the human who maintains it | Paid once at write-time; reads stay cheap and near-deterministic |
| **What the agent reads** | Reassembled chunks | Whatever pages a human wrote | A curated, linked graph an agent navigates in ~3–4 hops |
| **Over time** | No accretion — same corpus, re-queried | Drifts and goes stale | **Compounds** — every session adds to the graph |

The Karpathy framing: keep **only the key, distilled information in the window**. An AI Brain is the discipline that produces exactly that — and then keeps producing it as the work continues. It is neither a query engine bolted onto a document dump (RAG) nor a static knowledge base (a wiki): it is a knowledge base that grows correctly *as you work*, with every automated edit diff-traced, git-reversible, and archive-before-delete.

### What makes the graph *relational* — typed edges

A plain wiki has undifferentiated `[[wikilinks]]`: "A links to B" but never *why*. An AI Brain keeps the wikilink and adds an optional **relationship type**, so the graph carries meaning an agent can reason over — closer to a knowledge graph than a link soup.

The vocabulary is **frozen at seven edges** — small enough to stay consistent, expressive enough to matter:

| Edge (you author) | Inverse (computed by grep) | Use when |
|---|---|---|
| `relates_to` *(default)* | `relates_to` | general association — the safe default |
| `depends_on` | `required_by` | A needs B to function |
| `supersedes` | `superseded_by` | A replaces / obsoletes B |
| `contradicts` | `contradicts` | A and B make incompatible claims |
| `applies_to` | *(lateral)* | a playbook / process → the system it governs |
| `causes` | `caused_by` | A produces / triggers B |
| `part_of` | `has_part` | real composition (system → subsystem → component) |

Three rules keep it honest and portable:

- **Authored, not inferred.** Edges are written at capture time (or *proposed* by `/synaptic-weave` and confirmed). The brain makes **no auto-discovery-of-links claim** — we cite [GraphRAG](https://github.com/microsoft/graphrag) only as **the direction** (multi-hop relational retrieval), not as something we run.
- **One direction only.** You write `depends_on`; the inverse `required_by` is computed by `grep`, never stored. No index to keep in sync.
- **The frontmatter wikilink *is* the edge.** No separate edges file, no derived graph DB — typed edges are parser-safe block-list `[[wikilinks]]` in a node's frontmatter. Adding them is **backward-compatible** and never bumps the brain `schema_version`.

### Epistemic honesty — the bank-governance argument

For regulated and audit-sensitive work, "the agent said so" is not good enough. Every node can carry optional, additive epistemic metadata that makes its knowledge **traceable and falsifiable**:

- **`source:`** — where the claim came from (a runbook section, a URL, a ticket, a dated session). **Provenance is the governance argument:** every fact is traceable to its origin.
- **`confidence:`** — how settled the knowledge is, on a three-value enum (`high | medium | low`).
- **`## bias-check`** — an in-node section for what is *not* yet known, contradicting evidence, and the conditions under which the knowledge stops holding (paired with a `contradicts` edge when another node disagrees). It scopes the **knowledge**, never the agent's tone or persona — behaviour lives in the harness, not the brain.

The result is a brain that is not just navigable but **defensible**: a compliance reviewer can read any claim, see where it came from, how confident it is, and what contradicts it — in plain Markdown, with no tool.

---

## ✨ Features

| Feature | What it gives you |
|---|---|
| **MOC-of-MOCs navigation** | Bounded ~3–4 hops to any insight, regardless of brain size |
| **Consolidation formula (6 steps)** | Agent-agnostic algorithm in every `BRAIN.md`; brain grows correctly on its own |
| **Registries** | Tabular SSOTs for records looked up by attribute (infra, repos, environments, glossary) |
| **Harness as deploy-source** | `/synaptic-init` and `/synaptic-upgrade` regenerate your harness from the brain on any machine |
| **Playgrounds** | Per-task workspaces — burnable, registered in journal, never polluting knowledge |
| **Opens in Obsidian / Foam / Logseq** | `[[wikilinks]]` + YAML frontmatter are native; graph view renders immediately, no conversion |

> **Internal, single-run benchmark** (real ~60-file brain; efficiency + coverage measurement, not ground-truth accuracy): median ~4 file-reads per question answered; 17/18 questions resolved by the INDEX hierarchy alone without falling back to grep. One data point — shared for orientation, not as a performance claim.

---

## 👤 Value by audience

**For people — your second brain**

Stop re-briefing your agent every session. Your accumulated knowledge is yours: portable, readable without any tool, never locked to a service. Hand over a role with something real — not a dump of meeting notes. It is a knowledge base that **improves itself as you work, within bounded, reversible limits** — every session adds to the graph.

**For projects — an agent that onboards in seconds**

An agent reads one file and already knows the scope, conventions, guardrails, and where everything lives — before writing a single line. Decisions, patterns, and playbooks accumulate through real work. No re-briefing between sessions; no tribal-knowledge dependency.

**For companies — knowledge continuity without a platform rollout**

A contractor finishes; their successor reads `.synaptic/BRAIN.md` and picks up where they left off. No new platform to procure, no rollout project, no vendor dependency. Auditable by default: compliance can read every file. Works on-premise, air-gapped, or in any cloud.

### Three intents, one brain — pick the lens

The *same* nodes can be navigated through different MOC lenses depending on what the brain is *for*. These are intents, not separate structures — the directory layout never changes:

| Intent | Lens (what the MOC organises around) | When |
|---|---|---|
| **Personal** | Your own work across whatever you touch — a portable second brain | A solo practitioner; knowledge that follows *you* |
| **The seat** *(recommended)* | A **role/position**, independent of who fills it — onboarding, conventions, playbooks, the knowledge a successor needs | Most teams; survives rotation and handover |
| **Department** | A shared area across multiple seats | A team-wide knowledge area, once a seat brain has proven the pattern |

**Recommendation: start with the seat.** A seat brain is the unit that beats the knowledge tax — it onboards the next person, survives a contractor rotation, and does not entangle one individual's personal notes with the role's durable knowledge. Personal is the easiest start; department is the natural growth once a seat brain works.

> **A note on shared/public brains:** a private, access-controlled brain is the supported pattern. A *public* brain that anyone can read is **out of scope for any client-facing material** — knowledge bases accrete sensitive context, and confidentiality + governance must come first. Described generically (away from any client context), it is at most a pattern-with-a-confidentiality-caveat, never a recommendation.

---

## 🧬 Built on proven ideas (and why)

Synaptic-core did not invent its substrate — it converged on patterns that the PKM and agent-skills community had already validated, then applied a specific **direction**: purpose-built to accrete a role's knowledge and encode the explicit formula (intention + inertia) that makes it grow correctly. The value-add is that direction, not the format. See also [Acknowledgments](#acknowledgments) for project-level credits.

| Technique / source | How synaptic-core uses it | Why it fits an agent-read brain |
|---|---|---|
| **Atomic notes — Zettelkasten / Luhmann** | One concept per node, kebab-case filename (`auth-model.md`), ~150-line soft budget; consolidation formula enforces "promote only when it recurs" | Precise retrieval: the filename IS the concept; composable links work because scope is bounded. Over-atomization is deliberately avoided — agents handle dense pages better than ten micro-files. |
| **Maps of Content / MOC-of-MOCs — Obsidian / Nick Milo** | Three-level hierarchy: `BRAIN.md` → `knowledge/INDEX.md` (hub MOC, 1-line per cluster) → `{cluster}/_index.md` (sub-MOC, 1-line per node) → open only 1–2 nodes | Bounded navigation: ~3–4 hops to any insight regardless of brain size. The 1-line summaries in `_index.md` are the mechanism — an agent reads the summary, not the full node, to decide whether to open it. |
| **Bidirectional `[[wikilinks]]` — wiki / Obsidian** | Every node uses `[[page-name]]` links written at capture time; backlinks resolved via `grep -r "[[node]]"` (CORE) or an optional FTS5 index (horizon Cortex); opens natively in Obsidian / Foam / Logseq | Emergent link-graph: structure comes from links, not rigid folder hierarchy. A concept can belong to multiple clusters simultaneously. Multi-dimensional without duplication. |
| **LLM-wiki / "compile knowledge" — Karpathy** | Curated narrative pages an agent reasons over whole (no chunking); `references/raw/` holds verbatim payloads as schema-on-read fallback; consolidation formula = write-time curation discipline | Curate once, read cheap forever. Agents re-read the same context constantly; schema-on-write means retrieval is near-deterministic. Coherent curated context beats reassembled chunks for reliability and auditability. |
| **Progressive disclosure — Anthropic Agent Skills** | `BRAIN.md` (≤110 lines, ~500 tokens) is the only boot read; skill metadata surfaces in Level 1 (~100 tokens); full skill body loads on trigger; reference files and the bundle templates load only at brain-init | Token economy: awareness costs ~100 tokens per skill; full depth costs only when needed. The same principle governs the brain: one boot file, everything else on demand. |
| **Frontmatter + tags — PKM metadata standard** | Every node carries `description`, `type`, `status`, `updated`, `tags` (D1 decision, SPEC §4.3); `description` feeds the `_index.md` 1-liner and any future embedding input | Machine-readable surface for `/synaptic-audit`, `Ctrl+Shift+F` faceted search, and future FTS / semantic search — without forking the format when those layers are added. |
| **Explicit contribution protocol — spec-driven mindset** | The 6-step consolidation formula (classify → atomicity test → generalize → place & link → dedupe/SSOT → quality gate) is embedded in every `BRAIN.md` as the capture contract | Agent-agnostic, consistent: any agent that runs this formula produces a navigable graph, not a pile of notes. The formula encodes both intention (what belongs) and inertia (how it grows). |
| **Files-authoritative / local-first — Engram-inspired governance** | Files are the single source of truth; agent-native memory (Claude Code auto-memory, etc.) is treated as a cache; tools (`check`, `migrate`, `export`) are derived readers, never writers of truth | Portable, auditable, git-native. The brain works on a locked-down laptop, air-gapped server, or any future agent platform. No runtime dependency can become a single point of failure. |

**On the horizon — deliberately NOT in CORE:**

| Technique | Why it is a horizon item, not CORE |
|---|---|
| **Vector / semantic search** (GraphRAG, LightRAG, Smart Connections, SQLite-vec — *the direction*) | Curated wikilink pages already give coherent retrieval for agent-authored brains; a full embed-and-retrieve pipeline is over-engineering for CORE and cost-justified only at scale or for unstructured ingestion. We are **not** GraphRAG and make **no auto-discovery-of-links claim** — we cite it as the *direction*. A Cortex semantic sidecar (opt-in, degrades to grep/MOC) is its designed answer at scale. |
| **Engram-style searchable journal** (SQLite/FTS5) | A derived, deletable **searchable layer over the journal** — fast full-text history ("did I solve a ticket like this before?"). It is **never** a graph refiner and never rewrites the authored pages; the forward `[[wikilink]]` stays the only authoritative edge. Optional Cortex, incompatible with the zero-install CORE floor by design. |

> These horizon items are enabled by the v1 file contract (frontmatter + tags + INDEX + `[[wikilinks]]`) — they attach without forking the format. All are optional Cortex utilities the brain never depends on.

---

## 🔧 Commands

| Command | What it does |
|---|---|
| `/synaptic-init` | Scope-aware interview; generates the brain from the bundle templates; self-wires harness |
| `/synaptic-consolidate` | Run the 6-step capture contract on current session output |
| `/synaptic-ingest [file]` | Distil a document into an atomic node + reference entry |
| `/synaptic-audit` | **Diagnose only:** orphans, broken links, stale nodes, MOC coverage, **cross-link (horizontal) coverage**, **half-done / unconsolidated work + pending breadcrumbs**, registry/reference integrity, oversized untyped nodes, tag hygiene. Audit diagnoses; weave/consolidate/synthesize/maintain treat |
| `/synaptic-weave` | Retroactive graph-gardening: missing links (+ typed-edge proposals), near-duplicates, theme promotion |
| `/synaptic-synthesize` | Generative pass over the curated brain: writes new synthesis nodes (cross-source patterns, concept evolution, orphan rescue), each MOC-registered at write time |
| `/synaptic-maintain` | Orchestrated diagnose-then-treat sweep: audit diagnoses; consolidate / synthesize / weave treat — approval-gated. CORE procedure (an unattended timer would be optional Cortex) |
| `/synaptic-upgrade` | Migrate a v0.3 / v0.4 / v0.5 brain to v1 (interactive, two-engine) |

---

## 🤝 Plays well with others

| Tool / pattern | Relationship |
|---|---|
| **gentle-ai / ai-rules-sync / block/ai-rules / rulesync** | Harness wiring and cross-agent sync — install the skill in standard paths; these tools pick it up automatically |
| **Engram** | Optional searchable **journal** layer (SQLite + FTS5) for fast full-text history — never a graph refiner, never rewrites pages. Files stay authoritative; Engram is a derived, deletable cache |
| **Smart Connections / SQLite-vec / RAG stacks** | Vector / semantic search horizon (the *direction*, opt-in Cortex): the v1 frontmatter + tags + INDEX + wikilinks contract is the indexable surface — attaches without forking the format; degrades to grep/MOC |
| **Jira / Trello / MCP task systems** | Tasks live there. The brain documents context and decisions; it does not track tickets |
| **Agent-native memory** (Claude Code auto-memory, Copilot Memory) | Useful within its harness; treated as cache. Files win when they conflict |

---

## ⚠️ What SYNAPTIC-CORE is NOT

- **Not a task manager** — tasks, backlog, and roadmap belong in Jira, Linear, Trello, or your MCP task system
- **Not an agent framework** — it does not replace AGENTS.md, CLAUDE.md, or tool configs; those configure the agent; Synaptic configures what the agent *knows*
- **Not a persona configurator** — no identity directory, no per-brain behavior config; persona lives in your harness, not the brain
- **Not a database** — no queries, no schemas, no server; just files
- **Not another platform to roll out** — it is a folder of Markdown files; it works with what you already have
- **Not domain-specific** — SYNAPTIC-CORE is a structure; your brain is yours to fill

---

## ❓ FAQ

**"Isn't this just auto-notes — passive meeting summaries the agent dumps somewhere?"**

No. Passive auto-notes (transcripts, meeting summaries, a running log of everything that happened) are exactly what an AI Brain is *not*. The point is **structure + patterns + curation**, not volume:

- You **capture with intention** — a meaningful turn leaves a one-line breadcrumb, not a wall of transcript.
- Then you **consolidate** — the 6-step formula distils that into **linked atomic notes, lessons, and playbooks**: the reusable conclusion, generalized, placed in the right cluster, linked, deduped, gated.
- The scratch is burned. What survives is the distilled, navigable knowledge — not the log.

An auto-notes pile grows linearly and rots. An AI Brain compounds, because curation is the product and the log is just the safety net underneath it.

---

## 🎚️ Capture is a dial — start passive, turn it up or down

The #1 question people ask is *"do I have to babysit this?"* The answer is **no — capture is a dial, and the default leans passive.** You decide how much the agent does for you versus how much you do by hand. Two **orthogonal** dials:

**1. The passivity dial — *when* capture triggers.** Set it where you like:

| Setting | What happens | Good for |
|---|---|---|
| **Manual** | You run `/synaptic-consolidate` when you choose | Maximum control |
| **Event-driven (recommended)** | Hooks fire on agent events — a one-line journal breadcrumb every turn, a flush before the context window compacts, a rescue sweep on next session start | Most people; the agent does the remembering |
| **Where-supported automation** | On hosts that support it, more of the lifecycle runs without prompting | Long or heavy sessions |

Underneath all settings is an **always-on, fixed-cost floor**: a terse one-line **breadcrumb to the journal** on each meaningful turn. It lives on disk, so it survives a crash — what only lived in the context window dies; what hit the journal does not. This floor is *not* governed by `capture_policy`; it is the safety net.

Honest limit: **no agent has native idle detection.** "Passive" here means *event-driven on hook-capable hosts* (a per-turn `Stop` breadcrumb on all agents; a pre-compaction flush and a next-session rescue where the host supports them) — plus the journal as the universal fallback. It is **not** an unattended daemon watching you work.

**2. The `capture_policy` dial — *how much* reaches the wiki.** A separate, orthogonal valve set in `BRAIN.md`:

| Policy | Behaviour | Use when |
|---|---|---|
| `selective` | Crown-jewels only — reusable decisions, lessons, and patterns seen 3+ times. The journal/playgrounds absorb the rest. | You want a tight, high-signal wiki. |
| `balanced` *(default)* | Wiki-first with generous journaling — promote at 2+ instances or clearly-reusable knowledge. | Most projects. |
| `capture-all` | Capture almost everything — durable-ish notes promoted on first sight. | This brain is your **only** memory layer (no Engram, no other store). |

Same 6-step formula, one tunable valve — it changes *how much* gets promoted, never *how* the graph is built. A custom 1-line policy overrides the presets. (The journal breadcrumb floor is unaffected — `capture_policy` governs promotion to the wiki, not the breadcrumbs.)

### Then the honest manual trade

The dial removes the *fatigue*, not the *trade*. The brain does not grow on its own: somewhere, the 6-step capture contract has to run — whether you trigger it or a hook does. When it runs you pay **~5–10 minutes of curation per active session** (classify, generalize, link, gate). In exchange you erase the re-briefing tax on every future session, the onboarding tax for every new teammate or agent, and the handover tax when the project ends. Not "zero overhead" — a deliberate trade of a little write-time cost for large read-time leverage. Set the dial to passive and the agent carries most of that cost for you; set it to manual and you keep full control.

A suggested cadence (whichever dial you choose):

| When | Action |
|---|---|
| **Each session** | `/synaptic-consolidate` (or let the event-driven hook offer it) — apply the 6-step capture contract to what was produced |
| **Weekly** | `/synaptic-audit` — **diagnose** staleness, orphans, broken links, MOC gaps, **cross-link (horizontal) coverage**, and **half-done / unconsolidated work + pending breadcrumbs** (audit diagnoses; weave/consolidate/synthesize treat) |
| **Periodically** (after a stretch of consolidation) | `/synaptic-synthesize` — generative pass that writes new synthesis nodes over the curated brain (cross-source patterns, concept evolution, orphan rescue), MOC-validated at write time |
| **Monthly** | `/synaptic-weave` — retroactive graph-gardening: missing links (+ typed-edge proposals), near-duplicates, theme promotion |
| **Monthly, or when audit reports debt** | `/synaptic-maintain` — the orchestrated diagnose-then-treat sweep that runs all of the above in order, approval-gated (CORE procedure; an unattended schedule would be optional Cortex) |

Without some cadence the brain drifts. With it, quality compounds.

> **Tip:** see [`recipes/session-end-consolidate.md`](recipes/session-end-consolidate.md) for the optional host-run hook config that wires the event-driven setting (the breadcrumb floor, a pre-compaction flush where supported, and a next-session rescue sweep). Hooks are plain host-run config — they are CORE, not a runtime we ship.

---

<details>
<summary>The two-plane model (knowledge · operating rules · persona)</summary>

A `.synaptic/` brain has exactly **two planes** and one explicit out-of-scope:

| Plane | Holds | Test | Load |
|---|---|---|---|
| **Wiki** (`knowledge/`, `registries/`, `references/`) | What you **know**: patterns, decisions, playbooks, lessons, lookup tables, external references | "Does the agent *reason over* it?" | On demand via MOC |
| **Harness** (`harness/`) | How you **work here**: conventions, guardrails, project-local skills (e.g. a Jira CLI) | "Does the agent *obey or execute* it?" | Compressed subset in BRAIN.md; full depth on demand |
| **OUT — user harness** | Persona, tone, chat-language preference, agent personality | "Is it about how the agent treats *you*?" | Not in the brain at all |

The **only mandatory read** is `BRAIN.md` — one file, target ≤110 lines, ~500 tokens. It carries the context capsule, the capture contract, a 1-line pointer to the deployed harness rules, the brain map, and the session-start pointer. Everything else loads on demand when the agent has a reason to need it.

Three concerns are explicitly separated and never mixed:

- **Knowledge** lives in the brain (`knowledge/`, `registries/`, `references/`) and is read on demand via MOC.
- **Operating rules** (commit conventions, guardrails, project skills) live in `harness/` as a **deployable source**: `/synaptic-init` and `/synaptic-upgrade` deploy them into the outer harness (AGENTS.md / CLAUDE.md); at work-time the agent reads the outer harness, not the brain's `harness/` folder. The brain keeps the copy so the harness is regenerable on any machine.
- **Persona** (tone, chat language, agent personality) lives in the outer harness only — never in the brain.

The brain stays knowledge-focused; the harness stays rule-focused; portability is preserved. A Jarvis-persona agent and a vanilla agent share the same brain without conflict.

**Your Jarvis stays Jarvis. The brain travels.**

</details>

<details>
<summary>The consolidation formula (6 steps)</summary>

The **capture contract** (embedded in every `BRAIN.md`) is a six-step agent-agnostic algorithm. Any agent that runs this formula produces a navigable graph — not a pile of notes.

1. **Classify** — durable knowledge · tabular record → registry · lesson · decision · big task → playground · temporal → journal · noise → drop
2. **Atomicity test** — promote only when it recurs (2+ instances → pattern) or is a reusable decision/lesson; incident-specifics stay in playground/journal
3. **Generalize** — strip the anecdote, keep the reusable pattern; name = the concept, not the ticket
4. **Place & link** — atomic node in the right cluster; D1 frontmatter; `[[wikilinks]]`; register in cluster `_index.md`
5. **Dedupe / SSOT** — search first; update, don't duplicate; one source of truth per fact
6. **Quality gate** — professional & verifiable only; soft budget ~150 lines or tag `type: reference`; stamp `updated:`; confirm reachable from a MOC

This formula runs after every session via `/synaptic-consolidate`. It is what makes the brain accrete *correctly*.

</details>

<details>
<summary>Write-time curation vs read-time RAG — and why we curate</summary>

There are two schools of AI knowledge management, split by where the reasoning work happens:

- **Write-time curation (schema-on-write):** raw information is consolidated into curated, linked pages once, on the way in. Retrieval is then cheap and near-deterministic — read the right page, get a coherent answer. Auditable, portable, stable across agents and sessions. The consolidation formula is the cost; you pay it once per insight, not once per query.
- **Read-time RAG over raw (schema-on-read):** store raw artifacts verbatim, chunk and embed them, then retrieve and reason on every query. Fast to start, loses no raw detail — but reasoning cost is paid on every read, answers are re-derived rather than stable, and the result is not human-navigable or portable.

We chose write-time curation because agents re-read the same context constantly: curate once, read cheap forever. Curated knowledge is also auditable (a teammate or any new agent gets the same coherent page, not a fresh re-derivation) and portable (pure Markdown, no runtime dependency).

We are in practice a **pragmatic hybrid**: the wiki is schema-on-write, and verbatim payloads are kept in `references/raw/` as a schema-on-read fallback for the rare fine-detail query. Best of both: coherent reads by default, raw available when needed.

</details>

<details>
<summary>Matrioshka architecture (CORE · Cortex · Ecosystem)</summary>

Each inner layer is independent of the outer ones. **CORE vs Cortex is one conceptual line in one repo**, decided by a single test: *does it need a runtime we add, beyond the agent's own?* No → CORE (files/text, including host-run hook config). Yes → Cortex (utilities we ship; deletable; the brain never depends on them).

```
  ┌──────────────────────────────────┐
  │           Ecosystem             │
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
- **Cortex** (optional, the runtimes we add): the **MCP server** (a tool *over* the files — the brain never depends on it), the zero-dep Node utilities (`check`, `migrate`, `export`, `vault-open`, `graph`), and an optional semantic sidecar. All deletable; all degrade away cleanly.
- **Ecosystem** (future ring): shared / team brain and on-the-fly collaboration — separate repos only if ever split.

> Earlier docs called the middle ring "TOOLS" and put MCP in an outer "ECOSYSTEM/horizon" ring. The v1 model is simpler: **MCP is Cortex** (a tool over the files), alongside the other optional utilities. See [ROADMAP.md](ROADMAP.md).

</details>

<details>
<summary>Full directory layout</summary>

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
├── docs/              # Architecture decisions (ADR-001, ADR-002, ...) + assets
└── tools/             # Optional Cortex utilities (check, migrate, export, vault-open, graph)
```

> There is no `seed/` directory. The skill bundle's `templates/` are the one source of truth; the example brain is assembled on demand by the skill at `/synaptic-init`.

</details>

<details>
<summary>Optional tooling (check · migrate · export · vault-open · graph)</summary>

These are optional **Cortex** utilities — **zero-dependency** (Node ≥ 18 standard library only). CORE never requires them. When no runtime is available, the `synaptic` skill instructs the agent to perform the equivalent operation manually.

| Tool | Command | What it does |
|---|---|---|
| `check` | `node tools/check.js [.synaptic]` | Graph health: broken `[[wikilinks]]`, MOC coverage, frontmatter, soft budgets (warn), registry/reference integrity, orphan nodes |
| `migrate` | `node tools/migrate.js <.synaptic> [templates-dir] [--dry-run]` | Automates Phase M of a v0.x → v1 upgrade (deterministic, idempotent, non-destructive) |
| `export` | `node tools/export.js <.synaptic> [out.md]` | Bundles the entire brain into a single portable Markdown file (or `--split` into 4 sections) |
| `vault-open` | `node tools/vault-open.js <.synaptic>` | Writes minimal optional config for Obsidian, Foam, and Logseq; produces `OPEN-IN.md` |
| `graph` | `node tools/graph.js [.synaptic] [--out FILE] [--format html\|svg]` | Render a visual graph image of your brain — executive-friendly, no install; deterministic layout makes before/after states visually comparable |

**Opens in your tools without any conversion:**

| Tool | How to open | Notes |
|---|---|---|
| **Obsidian** | Open project folder as a vault | `[[wikilinks]]` and YAML frontmatter are native; graph view renders immediately |
| **Foam (VS Code)** | Install Foam extension; open workspace | Wikilinks, backlinks, and graph panel work out of the box |
| **Logseq** | Open project folder as a graph | Switch to Markdown mode; Logseq journals disabled in favour of `journal/_current.md` |

`tools/vault-open.js` (optional, zero-dep) writes minimal config for each tool and produces `OPEN-IN.md` at the brain root. If you prefer to skip it, just open the folder — it works.

</details>

<details>
<summary>Design philosophy</summary>

The core thesis: a non-invasive pattern that turns daily work into **structured, auditable, transferable, agent-usable knowledge** — reducing the delivery "knowledge tax" (onboarding, handovers, context reconstruction, documentation drift, tribal-knowledge dependency) without requiring a platform, a budget, or a security exception.

The principles:

- **0-install-capable CORE** — tools are optional; the brain works with just files
- **Files authoritative** — agent-native memory is a cache; the source of truth never moves
- **Harness-clean** — persona and behavior belong in the harness; the brain travels without them
- **Single boot file** — one mandatory read at session start; everything else on demand
- **Human-readable** — every file is Markdown or YAML; auditable, printable, editable without a tool
- **Agent-agnostic** — any agent that can read files can use a Synaptic brain

</details>

---

## 🗺️ Further reading

- [ROADMAP.md](ROADMAP.md) — what shipped and the honest Cortex horizon (MCP = Cortex, optional vector/semantic search, team brain, Engram-style searchable journal)
- [PITCH.md](PITCH.md) — the two-tier value framing; Tier 2 covers the technical foundations in depth

---

## Acknowledgments

- **[Arscontexta](https://github.com/agenticnotetaking/arscontexta)** — The write-validation gate and discovery-first quality gate are directly inspired by Arscontexta's domain-derived patterns.
- **[GSD (Get Shit Done)](https://github.com/gsd-build/get-shit-done)** — GSD excels at planning and execution; Synaptic excels at memory and knowledge. They complement each other.
- **[ClawVault](https://github.com/ClawVault/ClawVault)** — The wake/sleep lifecycle pattern influenced the session rhythm and journal design.
- **[Roam-Code](https://github.com/roam-code/roam-code)** — Multi-platform config detection shaped the `/synaptic-init` harness self-wire step.
- **[skills.sh / agentskills.io](https://agentskills.io)** — The `synaptic` skill package follows the Agent Skills progressive-disclosure format.
- **Zettelkasten / LLM-wiki convergence** — The MOC-of-MOCs navigation and atomic node model follow the Zettelkasten principle (links are the structure; folders are optional organisation) as validated by Karpathy's LLM-wiki work and the llmwiki.app pattern: dense, linked, agent-navigable pages over shallow bullet hierarchies.

We believe in synergy over competition. SYNAPTIC-CORE is a knowledge standard, not an everything-toolkit.

---

## Contributing

Bug reports, edge cases, example brains for different domains, improvements to the spec, Cortex utilities and Ecosystem plugins — open an issue or submit a PR. The standard is young and actively evolving.

---

## License

MIT — Use it, fork it, improve it, share it.
