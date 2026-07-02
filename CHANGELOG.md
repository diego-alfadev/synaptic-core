# Changelog

## [1.3.0] - 2026-07-02

> **One combined release.** This single MINOR (`1.3.0`) folds the migration-&-upgrade-hardening work
> (originally scoped as a standalone PATCH `v1.2.1`) together with the additive structural
> improvements. `v1.2.1` is **not released standalone** — its entries ship inside 1.3.0 under the
> labeled sub-group below. The brain **schema is unchanged (still 1.0)**; no `/synaptic-upgrade` is
> needed to adopt this release — reinstall the skill for the new engine behavior.

---

### Migration & upgrade hardening (originally scoped as v1.2.1) · [C1..C7]

- **[C1] Retrieval-readiness report + structural≠retrieval caveat.** `tools/check.js` now prints a
  retrieval-readiness summary (nodes, edges, clusters, orphans, edges/node, MOC-reachable) computed
  over the one canonical knowledge-scoped, MOC-excluded, undirected-deduped edge/degree universe
  (new `tools/lib/brain-graph.js`, shared verbatim with `tools/graph.js` and the audit heuristics so
  the tools can never disagree on topology). When the brain is structurally clean (0 errors) yet a
  connectivity heuristic trips (orphan ratio > 20% OR edges/node < 0.5), it prints an **advisory
  CAVEAT** — *structural-green ≠ retrieval-green* — that **never changes the exit code**.
- **[C2] Flag non-live artifacts in `knowledge/`; `audits/` exclusion.** `tools/check.js` gains a
  fence-aware non-live-artifact check: an **ERROR** only for exact-name / path-segment leaks
  (`MIGRATION_DONE.md` inside `knowledge/`, a `_migration-staging/` path segment leaked inside
  `knowledge/`), and **WARN**-only fuzzy heuristics (surviving prose carrying a `{{...}}` placeholder;
  a filename matching a closed-audit-report pattern). `audits/` is wired into both the exclusion set
  and the link index. `playgrounds/` and `_migration-staging/` are treated as brain-root siblings of
  `knowledge/`, never children.
- **[C3] `lint: allow-large` suppresses the soft-budget WARN.** A node may carry `lint: allow-large`
  (scalar or list form) to opt out of the soft size-budget WARN while `type: reference` continues to
  suppress it — decoupling the budget policy from the node type.
- **[C4] Per-phase `MIGRATION_DONE` gate + mandatory retrieval drill + one-commit-per-phase.** The
  v0.3→v1 upgrade now closes each phase against a binary checklist artifact — a new
  `templates/MIGRATION_DONE.md` (Phase M / C / V boxes, added to `MANIFEST.txt`) that lives at the
  **brain root or `_migration-staging/`, never in `knowledge/`** (a `MIGRATION_DONE.md` under
  `knowledge/` is a `check.js` ERROR). A phase is DONE only when every box under it is checked.
  Phase V adds a **mandatory retrieval drill** with a deterministic question-selection recipe (3
  most-linked nodes + 2 registry lookups + 1 cross-cluster synthesis, answered by MOC navigation
  only) and a binary pass bar (all 5 fact-lookups via navigation, 0 grep-fallbacks; the synthesis
  question may miss as a `/synaptic-weave` gap) — because **`check.js` green is necessary but NOT
  sufficient** (structural-green ≠ retrieval-green). The upgrade runbook now prescribes **≥3 distinct,
  named, independently-revertible commits** on the upgrade branch — `migrate: Phase M …` (check.js may
  still error), `refactor: Phase C …` (check.js at 0 errors), `chore: cleanup + cutover …` — each
  passing `check.js` before the next begins, with the commit hash recorded per phase in the ledger.
  No step says "commit everything at the end." The AGENT runbook and `references/upgrade-to-v1.md`
  mirror the drill and the gate.
- **[C5] Git fast-forward cutover (Windows/OneDrive-safe) + guided-default mode + owner orientation.**
  The v0.3→v1 upgrade now leads its cutover with `git switch main && git merge --ff-only
  <upgrade-branch>` — files rewritten in place, no live-folder rename — with the folder rename/swap
  demoted to a **non-git fallback** and an explicit Windows/OneDrive lock/half-move/conflict-copy
  warning; if `--ff-only` refuses, that surfaces concurrent writers and routes to the shared-brain
  freeze path. A git worktree is noted as the safe way to build the v1 copy. ROLLBACK is reconciled to
  match: a git brain rolls back via git (reset to / forward-revert the `pre-v1` tag), the rename is
  the non-git path only. A **"Mode: guided (default) vs interactive"** callout enumerates the ONLY
  questions guided mode may ask (topology intake, any deletion, private-vs-shared, cutover ack) and
  states that guided vs interactive changes **verbosity, NOT the safety gates** (conservation gate,
  no-silent-deletion ledger, and Phase V drill run identically in every mode). Step 9 gains an
  owner-facing "how to use your new brain" orientation plus a soak/cleanup checklist.
  `references/upgrade-to-v1.md` mirrors the FF cutover, the mode definition, and the worktree note.
- **[C6] CORE breadcrumb instruction robust when hooks are absent (issue #2).** The per-turn journal
  breadcrumb is now stated as an **instruction the agent follows, not only a hook** — the floor
  underneath the automation, so a session that reaches compaction is **never breadcrumb-empty** (the
  issue #2 failure mode: a session neared recompact with no breadcrumbs written). `templates/BRAIN.md`
  Capture Contract names the failure mode and instructs "append the breadcrumb per meaningful turn
  yourself; the `Stop` hook automates it where wired, but write it even when no hook fires — nothing
  fires without you acting, there is no idle daemon." `references/consolidate.md` "Journal Breadcrumb
  Contract" mirrors the instruction-first framing and adds a **provisional note** — the per-turn
  breadcrumb is a **token-optimization to revisit** when a Cortex T2 Engram-style FTS journal lands
  (cross-links `ROADMAP.md` → "Engram-style searchable journal — Cortex"), never a CORE dependency.
  `SKILL.md` §d adds a **per-host degradation floor** (Claude Code / Copilot / Codex / Cursor / Gemini)
  spelling out the **instruction-only breadcrumbs + manual `/synaptic-consolidate`** fallback when a
  host has no usable hooks, plus a **"PreCompact not fired? SessionStart-rescue is the net"**
  cross-reference. Reconciled with the honest-limits section (no native idle detection / never an
  unattended idle daemon at CORE). The size-locked `BEGIN:SYNAPTIC` bridge block is left
  **byte-for-byte untouched** (the instruction already lives in CORE via `BRAIN.md`; per the adversarial
  council, the strengthening was retargeted off the bridge).
- **[C7] Tooling / environment notes + deletion ledger as a standing rule.** The AGENT runbook gains a
  "Tooling / environment notes" appendix framing four host quirks as **ENV diagnostics, not Synaptic
  rules**: Git Bash has no `rg` (use `grep -rn` / `git grep` / the agent's search — every grep-style
  instruction stays portable); `apply_patch` / VS Code fs write failures fall back to direct writes;
  OneDrive/Dropbox locks -> move to a local path (cross-links the Step 2 SYNC GUARD and the FF-cutover
  rationale); and PowerShell `Get-Content`/`WriteAllText` round-trips **corrupt non-ASCII** (em-dash,
  arrows, curly quotes) -> prefer UTF-8-aware writes and keep tool source ASCII-safe. The
  **deletion/move/archive ledger is promoted to a STANDING rule** (not migration-only): a one-line note
  (*what, why, loser->winner or destination, recoverable-via-git; git is the archive*) is added to
  `references/consolidate.md`, `references/maintain.md`, and `references/weave.md`, matching the
  discipline `references/upgrade-to-v1.md` already uses.

### Structural improvements · [§1..§5]

- **[§1] PARA lifecycle axis (optional, backward-compatible).** Knowledge nodes MAY carry one optional
  frontmatter field — `lifecycle: project | area | resource | dormant` — an **actionability** axis
  that is **orthogonal to the editorial `status: active | stale | archived`** field (the enums share
  no token — `dormant` deliberately differs from `archived` to prevent cross-field bleed). It scopes
  the active working set: **`project` + `area` + (absent → area)** load by default; **`resource` +
  `dormant`** are lazy-pull. Absence is legal and behaves exactly as a pre-v1.3.0 node (loads by
  default), so **no schema bump** and a v1.2.0 / skill-less agent simply ignores the unknown key.
  Demotion is **archive-don't-delete**: flip `lifecycle: dormant` (a reversible cooling that keeps
  the file, its `_index.md` entry, and its edges intact — **decoupled from `status`**; do not also
  set `status: archived`); promotion is a single-field flip back. `project` is a *lifecycle* value,
  **not a new `type:` token** (the `type:` enum is unchanged); a `project` node should link OUT to a
  durable `area`/`resource` node. Documented across the node template (commented-out block),
  `SKILL.md` (new "Lifecycle axis" section), `references/consolidate.md` (Step 4 + a `status`-vs-
  `lifecycle` orthogonality table with the `status: active` + `lifecycle: dormant` example),
  `references/audit.md` (a WARN completion-cadence pass: `project` quiet > 60d / `area` quiet > 90d,
  and an explicit note that `dormant`/`resource` are NOT orphans), and `BRAIN.md`. `tools/check.js`
  adds an advisory WARN when a present `lifecycle:` value is out of enum — never required, never an
  ERROR.
- **[§2] Interactive force-directed `graph.html` (replaces the static viz).** `tools/graph.js` is
  rewritten to emit a **single self-contained, zero-network HTML file** (inline CSS + a
  deterministic force-directed simulation seeded from node count) — no CDN, no `<script src>`, no
  fetch. It is **typed-edge aware** (colours/dashes per edge kind) with cluster/edge-type/lifecycle
  filters, search, pan/zoom, and expand/collapse hubs. The graph shares the exact same
  `buildBrainGraph` universe as `check.js` (edge parity guaranteed by construction), and node
  ids/labels/tags reach the DOM only via safe sinks (`textContent`/`setAttribute`), with the embedded
  `DATA` payload escaped so a filename containing `</script>` can't break out of the inline script.
  Force-directed layout + MIT/Graphify attribution lines carried in `tools/README.md`. `--format` is
  swallowed for CLI back-compat; an empty brain renders a graceful empty state.
- **[§3] God-node / surprising-edge audit heuristics.** `/synaptic-audit` gains two diagnose-only
  graph-health passes (prose-CORE, WARN, no runtime required): a **god-node** check that flags an
  over-connected hub (edge degree ≥ 15, or ≥ 3× the brain's median node degree — whichever is lower)
  as a candidate to split into atomic sub-nodes or confirm as a legitimate hub, and a
  **surprising-edge** check that lists authored edges whose endpoints live in different top-level
  `knowledge/` clusters (the high-value multi-hop links embeddings can't infer) for the owner to
  confirm or correct. Both route to `/synaptic-weave`, make no auto-discovery claim (edges are
  authored, never inferred), and compute "degree" over the same knowledge-scoped, MOC-excluded,
  undirected-deduped edge universe as `tools/check.js` / `tools/graph.js`. `check.js` additionally
  emits both as advisory WARN-class counts when the brain is otherwise clean — never an ERROR, never
  a gate.
- **[§4] Local-vs-remote data-boundary governance doc.** New `docs/concepts/local-vs-remote-boundary.md`
  (linked from the concepts `_index.md`) draws the explicit line between what stays 100% local and
  what — if anything — leaves the machine: a four-layer boundary table (CORE files / TOOLS / host
  LLM / future Cortex), the reusable governance one-liner, the "only one egress point" argument (the
  host LLM's context is the sole boundary, governed by the host's policy, not ours — Synaptic adds no
  server, DB, telemetry, or new network boundary), regulated-enterprise applicability (locked-down
  laptop, auditable by inspection, no platform rollout), an honest Cognee contrast framed
  community-over-combat (opaque runtime vs inert auditable files, no overclaim), and an honest-limits
  section stating plainly that Synaptic adds no new egress but does **not** police it — access control
  is the host's and filesystem's job. Swedbank-agnostic ("a regulated enterprise client").
- **[§5] Verb-contract note (memify deferred to P4, gated on usage signal).** New
  `docs/concepts/verb-contract.md` (linked from the concepts `_index.md`) maps our authored verbs
  (`consolidate` / `weave` / `synthesize` / `maintain`) against Cognee's (`add` / `cognify` /
  `memify` / `search`) and records the sharpened conclusion: **`memify` is NOT a separate CORE verb —
  it overlaps weave+maintain; the only genuinely new part (usage-reweighting) needs a usage log CORE
  lacks, so it is deferred to Phase 4 gated on a usage signal.** The note makes no present-tense
  self-improvement / usage-weighting claim — usage-weighted self-improvement is framed as a P4
  direction only, keeping the four-verb contract crisp and non-overlapping.

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
- **Already on v1 (v1.0.0+) →** there is nothing to migrate — the schema is unchanged (still `1.0`). Just reinstall/update the skill to engine `1.3.0` ([`standalone/synaptic/SKILL.md`](standalone/synaptic/SKILL.md)); everything v1.3.0 adds (optional PARA `lifecycle:` axis, interactive `graph.html`, god-node audit, hardened `check.js`) is additive and reversible. See the short feature-adoption guide [`docs/UPGRADE-v1.x-to-v1.3.0.md`](docs/UPGRADE-v1.x-to-v1.3.0.md). `/synaptic-upgrade` invoked on an already-`1.0` brain recognizes the current schema and refreshes the engine + offers PARA — it does **not** run a full migration. One optional, one-word touch if you skipped it earlier: rename your `capture_policy` value (`curated → selective`, `logbook → capture-all`).

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
