# Synaptic Core — Release Notes v1.3.0

**Date:** 2026-07-02 · **Engine:** 1.2.0 → **1.3.0** · **Brain schema:** unchanged (still **1.0**)

> **One combined release.** This single MINOR folds the migration-&-upgrade-hardening work
> (originally scoped as a standalone PATCH `v1.2.1`) together with the additive structural
> improvements. `v1.2.1` is **not released standalone** — its entries ship inside 1.3.0.
> The brain schema is **unchanged**; no `/synaptic-upgrade` is required to adopt this release.
> Reinstall the skill for the new engine behavior.

This document has two parts. **Part A** is for a brain owner or user — plain language, no
jargon. **Part B** is the change-level technical detail.

---

## Part A — What v1.3.0 gives you

- **Safer, more honest migrations.** A brain can be *structurally* clean and still be hard to
  retrieve from — well-formed files, but too few links between them. Before, the checker said
  "all good" and stopped there. Now it prints a plain retrieval-readiness summary and, when your
  brain looks structurally fine but poorly connected, it tells you so with an advisory caveat.
  A brain that "passes" is no longer silently allowed to be retrieval-poor — you're told.

- **A "dormant" shelf for finished or idle knowledge.** You can now mark a note as `dormant` so
  it stops cluttering your everyday working context, while staying fully searchable and one flip
  away from active again. Nothing is deleted; the note, its index entry, and its links all stay
  intact. It's an archive-don't-delete cooling shelf — reversible with a single field change.

- **A real interactive graph you can actually explore.** The old graph produced a static picture
  that was unreadable once a brain grew. v1.3.0 ships a single self-contained HTML file you open
  in a browser and *use*: search for a note, filter by cluster or link type, zoom and pan, and
  expand or collapse busy hubs. No internet connection, no external downloads — one local file.

- **Cleaner, guided upgrades.** Bringing an older brain up to date is now walked through step by
  step, with a clear checklist you tick off per phase and a short "does retrieval actually work?"
  test at the end. The default mode keeps things quiet and safe; the safety checks run the same
  either way. You end up with a short before/after record of what moved and why.

- **Nothing new to install, and your data stays where it is.** The upgrade is files in, files
  out — no server, no database. Migrations run on a copy and only switch over once you're happy,
  and a new short document spells out plainly what stays 100% on your machine.

---

## Part B — Technical detail

**No schema bump** — the brain schema stays **1.0**; a v1.2.0 or skill-less agent simply ignores
the one new optional frontmatter key. **Engine** moves **1.2.0 → 1.3.0**. Two paths are served:
the **v0.3 → v1.3 migration** (for late adopters bringing an old brain forward) and the
**v1.2 → v1.3 upgrade** (an existing v1 brain has nothing to migrate — reinstall the skill).

### Migration & upgrade hardening

*(Originally scoped as v1.2.1. Ships inside 1.3.0.)*

- **Retrieval-readiness report + structural-green ≠ retrieval-green.** `tools/check.js` now
  prints a retrieval-readiness summary (nodes, edges, clusters, orphans, edges/node,
  MOC-reachable) computed over one canonical knowledge-scoped, MOC-excluded, undirected-deduped
  edge/degree universe (new shared `tools/lib/brain-graph.js`, used verbatim by `tools/graph.js`
  and the audit heuristics so the tools can never disagree on topology). When the brain is
  structurally clean (0 errors) yet a connectivity heuristic trips (orphan ratio > 20% **or**
  edges/node < 0.5), it prints an **advisory CAVEAT** — *structural-green ≠ retrieval-green* —
  that **never changes the exit code**.

- **Non-live-artifact check in `knowledge/` + `audits/` exclusion.** `tools/check.js` gains a
  fence-aware check: an **ERROR** only for exact-name / path-segment leaks (`MIGRATION_DONE.md`
  inside `knowledge/`, a `_migration-staging/` path segment inside `knowledge/`), and **WARN**-only
  fuzzy heuristics (surviving prose carrying a `{{...}}` placeholder; a filename matching a
  closed-audit-report pattern). `audits/` is wired into both the exclusion set and the link index;
  `playgrounds/` and `_migration-staging/` are treated as brain-root siblings of `knowledge/`,
  never children.

- **`lint: allow-large` suppresses the soft-budget WARN.** A node may carry `lint: allow-large`
  (scalar or list form) to opt out of the soft size-budget WARN, decoupling the budget policy from
  the node type (`type: reference` continues to suppress it as well).

- **`MIGRATION_DONE` gate + mandatory retrieval drill + one-commit-per-phase.** The v0.3 → v1
  migration now closes each phase against a binary checklist artifact — a new
  `templates/MIGRATION_DONE.md` (Phase M / C / V boxes, added to `MANIFEST.txt`) that lives at the
  **brain root or `_migration-staging/`, never in `knowledge/`** (a `MIGRATION_DONE.md` under
  `knowledge/` is a `check.js` ERROR). A phase is DONE only when every box under it is checked.
  Phase V adds a **mandatory retrieval drill** with a deterministic question-selection recipe
  (3 most-linked nodes + 2 registry lookups + 1 cross-cluster synthesis, answered by MOC
  navigation only) and a binary pass bar (all 5 fact-lookups via navigation, 0 grep-fallbacks; the
  synthesis question may miss as a `/synaptic-weave` gap) — because **check.js green is necessary
  but NOT sufficient**. The runbook prescribes **≥3 distinct, named, independently-revertible
  commits** on the upgrade branch (`migrate: Phase M …` → `refactor: Phase C …` → `chore: cleanup
  + cutover …`), each passing `check.js` before the next begins, with the commit hash recorded per
  phase in the ledger. The AGENT runbook and `references/upgrade-to-v1.md` mirror the drill and the
  gate.

- **Git fast-forward cutover (Windows/OneDrive-safe) + guided-default mode + owner orientation.**
  The cutover now leads with `git switch main && git merge --ff-only <upgrade-branch>` — files
  rewritten in place, no live-folder rename — with the folder rename/swap demoted to a **non-git
  fallback** and an explicit Windows/OneDrive lock/half-move/conflict-copy warning; if `--ff-only`
  refuses, that surfaces concurrent writers and routes to the shared-brain freeze path. A git
  worktree is noted as the safe way to build the v1 copy. ROLLBACK is reconciled to match (a git
  brain rolls back via git — reset to / forward-revert the `pre-v1` tag; the rename is the non-git
  path only). A **"Mode: guided (default) vs interactive"** callout enumerates the ONLY questions
  guided mode may ask (topology intake, any deletion, private-vs-shared, cutover ack) and states
  that guided vs interactive changes **verbosity, NOT the safety gates** (conservation gate,
  no-silent-deletion ledger, and the Phase V drill run identically in every mode). Step 9 gains an
  owner-facing "how to use your new brain" orientation plus a soak/cleanup checklist.
  `references/upgrade-to-v1.md` mirrors the FF cutover, the mode definition, and the worktree note.

- **Tooling / environment notes + deletion ledger as a standing rule.** The AGENT runbook gains a
  "Tooling / environment notes" appendix framing four host quirks as **ENV diagnostics, not
  Synaptic rules**: Git Bash has no `rg` (use `grep -rn` / `git grep` / the agent's search — every
  grep-style instruction stays portable); `apply_patch` / VS Code fs-write failures fall back to
  direct writes; OneDrive/Dropbox locks → move to a local path (cross-links the Step 2 SYNC GUARD
  and the FF-cutover rationale); and PowerShell `Get-Content` / `WriteAllText` round-trips
  **corrupt non-ASCII** (em-dash, arrows, curly quotes) → prefer UTF-8-aware writes and keep tool
  source ASCII-safe. The **deletion/move/archive ledger is promoted to a STANDING rule** (not
  migration-only): a one-line note (*what, why, loser → winner or destination, recoverable-via-git;
  git is the archive*) is added to `references/consolidate.md`, `references/maintain.md`, and
  `references/weave.md`, matching the discipline `references/upgrade-to-v1.md` already uses.

- **CORE breadcrumb as an instruction, robust when hooks are absent (issue #2).** The per-turn
  journal breadcrumb is now stated as an **instruction the agent follows, not only a hook** — the
  floor underneath the automation, so a session that reaches compaction is **never
  breadcrumb-empty** (the issue #2 failure mode: a session neared recompact with no breadcrumbs
  written). `templates/BRAIN.md` Capture Contract names the failure mode and instructs the agent to
  append the breadcrumb per meaningful turn itself; the `Stop` hook automates it where wired, but
  it is written even when no hook fires — "nothing fires without you acting, there is no idle
  daemon." `references/consolidate.md` mirrors the instruction-first framing and adds a
  **provisional note** — the per-turn breadcrumb is a **token-optimization to revisit** when a
  Cortex T2 Engram-style FTS journal lands (cross-links `ROADMAP.md`), never a CORE dependency.
  `SKILL.md` §d adds a **per-host degradation floor** (Claude Code / Copilot / Codex / Cursor /
  Gemini) spelling out the instruction-only breadcrumbs + manual `/synaptic-consolidate` fallback
  when a host has no usable hooks, plus a "PreCompact not fired? SessionStart-rescue is the net"
  cross-reference. The size-locked `BEGIN:SYNAPTIC` bridge block is left **byte-for-byte untouched**
  (the instruction already lives in CORE via `BRAIN.md`).

### Structural improvements

- **PARA `lifecycle` axis (optional, backward-compatible).** Knowledge nodes MAY carry one
  optional frontmatter field — `lifecycle: project | area | resource | dormant` — an
  **actionability** axis **orthogonal to the editorial `status: active | stale | archived`** field
  (the enums share no token — `dormant` deliberately differs from `archived` to prevent cross-field
  bleed). It scopes the active working set: **`project` + `area` + (absent → area)** load by
  default; **`resource` + `dormant`** are lazy-pull. Absence is legal and behaves exactly as a
  pre-1.3.0 node, so **no schema bump** and a v1.2.0 / skill-less agent simply ignores the unknown
  key. Demotion is **archive-don't-delete**: flip `lifecycle: dormant` (a reversible cooling that
  keeps the file, its `_index.md` entry, and its edges intact — decoupled from `status`; do not
  also set `status: archived`); promotion is a single-field flip back. `project` is a *lifecycle*
  value, **not a new `type:` token** (the `type:` enum is unchanged); a `project` node should link
  OUT to a durable `area`/`resource` node. Documented across the node template (commented-out
  block), `SKILL.md` (new "Lifecycle axis" section), `references/consolidate.md` (Step 4 + a
  `status`-vs-`lifecycle` orthogonality table), `references/audit.md` (a WARN completion-cadence
  pass: `project` quiet > 60d / `area` quiet > 90d, with an explicit note that `dormant`/`resource`
  are NOT orphans), and `BRAIN.md`. `tools/check.js` adds an advisory WARN when a present
  `lifecycle:` value is out of enum — never required, never an ERROR.

- **Interactive force-directed `graph.html` (replaces the static viz).** `tools/graph.js` is
  rewritten to emit a **single self-contained, zero-network HTML file** (inline CSS + a
  deterministic force-directed simulation seeded from node count) — no CDN, no `<script src>`, no
  fetch. It is **typed-edge aware** (colours/dashes per edge kind) with cluster / edge-type /
  lifecycle filters, search, pan/zoom, and expand/collapse hubs. The graph shares the exact same
  `buildBrainGraph` universe as `check.js` (edge parity guaranteed by construction, via the shared
  `tools/lib/brain-graph.js`), and node ids/labels/tags reach the DOM only via safe sinks
  (`textContent` / `setAttribute`), with the embedded `DATA` payload escaped so a filename
  containing `</script>` can't break out of the inline script. Force-directed layout + MIT/Graphify
  attribution lines carried in `tools/README.md`. `--format` is swallowed for CLI back-compat; an
  empty brain renders a graceful empty state.

- **God-node / surprising-edge audit heuristics.** `/synaptic-audit` gains two diagnose-only
  graph-health passes (prose-CORE, WARN, no runtime required): a **god-node** check that flags an
  over-connected hub (edge degree ≥ 15, or ≥ 3× the brain's median node degree — whichever is
  lower) as a candidate to split into atomic sub-nodes or confirm as a legitimate hub, and a
  **surprising-edge** check that lists authored edges whose endpoints live in different top-level
  `knowledge/` clusters (the high-value multi-hop links embeddings can't infer) for the owner to
  confirm or correct. Both route to `/synaptic-weave`, make **no auto-discovery claim** (edges are
  authored, never inferred), and compute "degree" over the same knowledge-scoped, MOC-excluded,
  undirected-deduped edge universe as `check.js` / `graph.js`. `check.js` additionally emits both as
  advisory WARN-class counts when the brain is otherwise clean — never an ERROR, never a gate.

- **Local-vs-remote data-boundary governance doc.** New
  `docs/concepts/local-vs-remote-boundary.md` (linked from the concepts `_index.md`) draws the
  explicit line between what stays 100% local and what — if anything — leaves the machine: a
  four-layer boundary table (CORE files / TOOLS / host LLM / future Cortex), the reusable
  governance one-liner, the "only one egress point" argument (the host LLM's context is the sole
  boundary, governed by the host's policy, not ours — Synaptic adds no server, DB, telemetry, or
  new network boundary), regulated-enterprise applicability (locked-down laptop, auditable by
  inspection, no platform rollout), an honest Cognee contrast framed community-over-combat (opaque
  runtime vs inert auditable files, no overclaim), and an honest-limits section stating plainly that
  Synaptic adds no new egress but does **not** police it — access control is the host's and
  filesystem's job. Swedbank-agnostic ("a regulated enterprise client").

- **Verb-contract note (memify deferred to P4, gated on usage signal).** New
  `docs/concepts/verb-contract.md` (linked from the concepts `_index.md`) maps our authored verbs
  (`consolidate` / `weave` / `synthesize` / `maintain`) against Cognee's (`add` / `cognify` /
  `memify` / `search`) and records the sharpened conclusion: **`memify` is NOT a separate CORE verb
  — it overlaps weave+maintain; the only genuinely new part (usage-reweighting) needs a usage log
  CORE lacks, so it is deferred to Phase 4 gated on a usage signal.** The note makes no
  present-tense self-improvement / usage-weighting claim — usage-weighted self-improvement is framed
  as a P4 direction only, keeping the four-verb contract crisp and non-overlapping.

---

## Honest caveat

This release is **author-complete and inspection-verified only.** Node was unavailable in the
authoring environment, so no tool was executed here — every executable acceptance criterion is at
most pass-by-inspection. The **first real runtime validation rides on a Node environment**,
specifically the late-adopter **v0.3 → v1.3 migration** (running `tools/check.js` for the
retrieval-readiness figures and caveat behavior, and opening the generated `graph.html` to walk the
render / filters / search / pan-zoom / expand-collapse / empty-state / determinism checklist). Two
independent adversarial inspection passes verified the shared edge/degree universe, the injection
safety of `graph.html`, the advisory-never-gates behavior, and the byte-untouched `BEGIN:SYNAPTIC`
bridge; a short list of flagged UX and edge-extraction nits is tracked for follow-up. Treat runtime
behavior as expected-correct pending that first execution.
