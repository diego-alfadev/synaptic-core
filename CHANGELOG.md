# Changelog

## Unreleased

_(nothing yet)_

## v1.2.0 — Upgrade path + seat brains · 2026-06-26

> **Bring your v0.3 brain to v1, and run one brain per workspace.** This release adds the full v0.3→v1
> upgrade path (a paste-to-agent runbook + a hardened skill-side procedure), first-class support for a
> **seat / global brain** that serves a whole workspace of repos (the skill now resolves the brain via
> its `BEGIN:SYNAPTIC` bridge pointer and stays silent when a brain is already wired, so a sibling-repo
> CWD never spawns a competing nested brain), and the zero-tooling three-tier install. The brain
> **schema is unchanged (still 1.0)** — an existing v1 brain has nothing to migrate; just reinstall the
> skill to get the new behavior. Only a **v0.3 brain** runs `/synaptic-upgrade`.

### Added
- **Three-tier install.** Pick the path that fits the machine:
  - **Agent self-install (zero tooling).** A short bootstrap header at the top of `SKILL.md`, paired with a `MANIFEST.txt` listing every file in the bundle, lets a coding agent fetch and install the whole skill on a clean machine — no Node, no clone, no package manager. Point an agent at the skill, it reads the manifest and pulls the rest. The skill engine version bumps to 1.1.0, so existing installs reinstall the updated skill on the next harness wire.
  - **`npx degit` one-liner.** A single copy-paste command that pulls the skill folder for anyone who already has Node.
  - **Manual folder-copy fallback.** Copy the skill folder by hand — the always-works path, no toolchain required.
- **First-run orientation in `/synaptic-init`.** A light, optional walkthrough on first run so a newcomer sees what was created and what to do next, instead of a bare prompt.
- **Agent-paste upgrade runbook (`docs/UPGRADE-v0.3-to-v1.AGENT.md`).** The operational companion to the narrative `UPGRADE-v0.3-to-v1.md`: a self-contained block you paste to your agent that drives a v0.3→v1 upgrade end to end — no-clone skill bootstrap + tools fetch, topology intake, verified git+backup safeguard, Phase M/C/V with `[needs Node]`/`[no Node]` tags, **global/shared multi-repo harness wiring**, a **freeze + delta-reconcile + atomic cutover** for team-shared brains, an optional full audit/refactor sweep, and a before/after report. Each step says whether Node is required.
- **Shared / global brain guidance.** The upgrade procedure (`references/upgrade-to-v1.md`) gains a hardening addendum covering the multi-repo case (one `.synaptic/` serving many sibling repos): preferring a single user-level pointer (per-repo only as a fallback), a re-pointed brain pointer, and the skill's shipped Detect-on-Load "stay silent when a bridge is present" behavior so a wired repo never offers to create a competing nested brain.
- **Seat / global brain support in the skill.** `SKILL.md` Detect-on-Load now **resolves the brain via the `BEGIN:SYNAPTIC` bridge pointer** (not only a CWD-relative `.synaptic/`) and **stays silent — never offers onboarding — when a bridge is present**, so one brain can serve a workspace holding many repos and a sibling-repo CWD no longer spawns a competing nested brain. Harness Self-Wire gains optional **command-discoverability stubs** (thin per-command files that surface `/synaptic-*` in the host's slash menu and point to the skill reference — e.g. VS Code Copilot `*.prompt.md`) and a **`harness/setup/<host>.md` wiring record** the agent writes (re-deploy recipe across machines; travels in the backup).

### Changed
- **README restructured for newcomers.** The landing is now lean and front-loaded: install, a first-5-minutes path, and the commercial rationale — in that order. The deep conceptual material (typed graph, capture contract, layering, honesty lines) moved into `docs/concepts/`, fronted by an `_index` map-of-content and wired with relative links so nothing is lost — it is one click away instead of in your face.
- **Acknowledgments expanded.** Credit broadened to the peers and prior art studied while building this — the Karpathy LLM-wiki gist, ScrapingArt, `shannhk/llm-wikid`, `nvk/llm-wiki`, Basic Memory, and `claude-obsidian` — plus a "validated pattern" references block grouping the proven ideas the design draws on.

### Fixed
- **Install instructions corrected.** The quick-start previously implied you copy only `SKILL.md`. The skill needs its **whole folder** (`references/` + `templates/`) to function — the install steps now say so on every path.
- **Genericized a client-specific governance phrase.** A governance wording in the README and the node template's provenance note is now generic enterprise language ("the governance argument" / "regulated and audit-sensitive work"). The public repo stays client-agnostic.
- **Audit excludes scaffolding from link checks.** `/synaptic-audit` (and `tools/check.js`) now exclude `templates/` and `references/raw/` from the broken-link and cross-link-coverage checks — those directories hold placeholder example wikilinks (`[[target]]`, `[[x]]`) and verbatim captured payloads (scaffolding, not authored edges), which the first dogfood audit false-flagged as "broken."
- **Broken rollback command in the upgrade docs.** The narrative previously suggested `git checkout .synaptic-v0.3-backup` for rollback — that restores a path into the working tree, it does not swap the backup folder back. Corrected to the reliable rename (delete the v1 brain, rename `*-v0.3-backup` back), with the git path being a *forward* "revert to `pre-v1` tag", never a force-push/reset on a shared remote.
- **Upgrade safety, hardened.** The procedure addendum replaces the logically-broken "v1 node count ≥ v0.3 count" no-loss check with a **content-conservation manifest** (every pre-migration node must end up present, logged-merged, or logged-split); keeps `_migration-staging/` until **after** Phase V + a soak (was deleted at the end of Phase C, before verification); makes deletions explicit (ledger, never silent); makes `description:` extractive and defers the "Generalize" prose-rewrite (avoids fact-invention); and adds a verified git+backup gate plus a OneDrive/sync guard.
- **Operating rules out of `BRAIN.md`, into the harness (resolved the Top-Guardrails inconsistency).** `templates/BRAIN.md` no longer ships a `## Top Guardrails` block, and `harness/conventions.md`/`guardrails.md` no longer instruct mirroring rules into it. Conventions + guardrails stay the brain's source in `harness/` but are **deployed into the harnessing / system prompt (symlink preferred over copy)** — read from the brain only when edited or to verify sync, never at session start. The upgrade runbook now **detects the existing harness wiring** (VS Code Copilot chatmode + `applyTo:**/*` instructions, AGENTS.md, Cursor rules), backs it up, and for a global/seat brain prefers a **single user-level pointer** over per-repo edits (keeps work repos clean of brain references). The team-shared freeze/reconcile is now scoped to genuinely-shared brains; a private per-user seat brain takes the simple swap.

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
  capture-all`** (same formula, six steps; promotion threshold only).
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
GraphRAG / FTS5 horizon items — is documented in [`docs/concepts/architecture-matrioshka.md`](docs/concepts/architecture-matrioshka.md).
