# MIGRATION_DONE — per-phase binary gate (v0.3 → v1)

> **What this file is.** The binary, per-phase completion gate for a `/synaptic-upgrade` run. One
> checkbox per item; a phase is **DONE only when every box under it is checked**. Fill in the hash and
> timestamp as you close each phase. This is a *migration work artifact*, not knowledge.
>
> **WHERE THIS FILE LIVES (hard rule).** Keep this file at the **brain root** (next to `BRAIN.md`) or
> inside **`_migration-staging/`**. **NEVER place it under `knowledge/`** — `tools/check.js` flags a
> `MIGRATION_DONE.md` under `knowledge/` as an ERROR (it is a non-live artifact, not a graph node). It
> is git-ignored or removed at soak-end (Step 10), never a Phase V precondition to keep.
>
> **One commit per phase.** Each phase closes with its own commit on the upgrade branch (see the
> `commit:` line in each block). `check.js` green is **necessary but NOT sufficient** — Phase V is not
> DONE until the retrieval drill below passes.

Brain: `{{brain-path}}`  ·  Source schema: `{{v0.3 | v0.4 | v0.5}}`  ·  Run started: `{{YYYY-MM-DD}}`

---

## Phase M — mechanical (deterministic file moves + staging)

`check.js` expectation at this boundary: **may still have ERRORS** (v0.x leftovers staged, frontmatter
scaffolded-but-empty). That is expected and documented — running the check early is the point.

- [ ] All v0.x boot files MOVED (never deleted) into `_migration-staging/` (per source-version list).
- [ ] v1 directories created (`registries/ harness/ harness/skills/ references/ references/raw/
      playgrounds/ templates/ _migration-staging/`).
- [ ] `worklines/` and `inventory/` moved into staging (if present).
- [ ] M7 frontmatter scaffold added to every `knowledge/` node that lacked D1 fields.
- [ ] v1 templates copied into `templates/`.
- [ ] NOTHING deleted in Phase M (staging holds every moved original).
- [ ] `node tools/check.js <brain>` was run at the END of Phase M (errors expected — recorded, not fixed yet).
- [ ] DECISION LOG + DELETIONS LEDGER started and current.

**Phase M DONE only when every box above is checked.**
Closed: `{{YYYY-MM-DD HH:MM}}`  ·  commit: `{{migrate: Phase M mechanical file moves — <hash>}}`

---

## Phase C — content rearrange (re-file, re-link, MOC, frontmatter)

`check.js` expectation at this boundary: **0 ERRORS** (this is the phase that reaches structural green).

- [ ] CONTENT-CONSERVATION MANIFEST snapshotted BEFORE editing: every node as `(path, title,
      sha256(body-minus-frontmatter))`.
- [ ] Every cluster ticked in the Phase-C ledger (C3 links · C4 MOC · C5 consolidate · C11 frontmatter ·
      every-node-in-`_index`?).
- [ ] Identity/boot, CONTACTS, PRINCIPLES/working-agreements, brain-root context files all routed per
      the runbook (knowledge vs `harness/` vs `HARNESS_ORIGINALS/`).
- [ ] `inventory/` → `registries/`; `worklines/` → playgrounds/task system; `skills/` → `harness/skills/`.
- [ ] `knowledge/INDEX.md` + every cluster `_index.md` rebuilt from real files only (no phantom entries).
- [ ] Every `[[wikilink]]` resolves AND passes a link-IDENTITY spot-check (new target == old path's file).
- [ ] `updated:` stamped ONLY on nodes actually rewritten this pass (NOT mass-stamped, NOT from mtime).
- [ ] NO silent deletions — every merge/split/removal is in the DELETIONS LEDGER, confirmed.
- [ ] `_migration-staging/` still present (it is deleted LAST, in Step 10 — not here).
- [ ] `node tools/check.js <brain>` → **0 ERRORS** (fix every ERROR before closing this phase).

**Phase C DONE only when every box above is checked AND check.js is at 0 errors.**
Closed: `{{YYYY-MM-DD HH:MM}}`  ·  commit: `{{refactor: Phase C content rearrange — <hash>}}`

---

## Phase V — verify (structural green + MANDATORY retrieval drill)

> **`check.js` green is NECESSARY but NOT SUFFICIENT.** A brain can pass every structural check (0
> errors) and still be unusable for retrieval (evidence: 0 errors yet dozens of practical orphans and
> almost no edges). Phase V is DONE only when BOTH the structural checklist AND the retrieval drill pass.

### V.1 — Structural (check.js green, or the manual matrix)

- [ ] `node tools/check.js <brain>` exits 0 (no ERRORS). Record the retrieval-readiness summary block
      it prints: nodes `{{N}}`, edges `{{N}}`, orphans `{{N}}`, edges-per-node `{{x.xx}}`,
      MOC-reachable `{{N}}`.
- [ ] If the caveat line printed ("structural-green ≠ retrieval-green": orphan ratio > 20% OR
      edges-per-node < 0.5), the retrieval risk was reviewed and is acknowledged in the DECISION LOG.
- [ ] CONTENT-CONSERVATION GATE: every node in the Phase-C manifest is present, OR logged-merged
      (loser→winner), OR logged-split. Any node neither present nor logged = SILENT DROP = STOP.
- [ ] No v0.x leftovers; `grep -n "Top Guardrails" BRAIN.md` empty; the wired harness file has ZERO
      bare `.synaptic/BRAIN.md` pointers; BRAIN.md ≤110 lines with the harness deploy-source pointer.

### V.2 — Retrieval drill (MANDATORY — check.js cannot satisfy this)

> Prove the brain can actually be *retrieved from* by walking `BRAIN → INDEX → cluster _index → node`
> and recording the hop path. This is the gate check.js structurally cannot perform.

**Question-selection recipe (deterministic — pick the SAME way every run):**

1. **N most-linked nodes** (take N = 3): from the readiness report / a degree scan, pick the 3 nodes
   with the highest edge degree. Formulate one fact-lookup question each ("what does `<node>` say
   about X?").
2. **N registry lookups** (take N = 2): pick 2 entries from `registries/` (e.g. an environment, a repo,
   a glossary term). Formulate one lookup question each.
3. **1 cross-cluster synthesis question**: one question whose answer requires combining two nodes in
   *different* top-level clusters.

Answer **each** by MOC navigation ONLY — `BRAIN.md` → `knowledge/INDEX.md` → cluster `_index.md` →
node (or `registries/_index.md` → registry). Record the hop path per question. **No grep/keyword
fallback is allowed** — a question that needs grep to answer is a navigation failure, log it.

| # | Question (source) | Hop path (BRAIN→INDEX→…→node) | Answered by MOC nav? | Grep needed? |
|---|---|---|---|---|
| 1 | `{{most-linked node A}}` | `{{…}}` | `{{Y/N}}` | `{{N}}` |
| 2 | `{{most-linked node B}}` | `{{…}}` | `{{Y/N}}` | `{{N}}` |
| 3 | `{{most-linked node C}}` | `{{…}}` | `{{Y/N}}` | `{{N}}` |
| 4 | `{{registry lookup A}}` | `{{…}}` | `{{Y/N}}` | `{{N}}` |
| 5 | `{{registry lookup B}}` | `{{…}}` | `{{Y/N}}` | `{{N}}` |
| 6 | `{{cross-cluster synthesis}}` | `{{…}}` | `{{Y/N}}` | `{{N}}` |

**Pass bar (binary):**

- [ ] **All 5 fact-lookups (Q1–Q5) answered via MOC navigation, with 0 grep-fallbacks required.**
- [ ] The synthesis question (Q6) MAY miss — a miss is a `/synaptic-weave` content gap, not a
      navigation failure (per the v1.0 benchmark caveat). If it missed, it is noted as a weave to-do.

**Phase V DONE only when V.1 is all-checked AND the V.2 pass bar is met.**
Closed: `{{YYYY-MM-DD HH:MM}}`  ·  verified against backup: `{{<brain>-v0.3-backup}}` · git tag: `pre-v1`

---

> After all three phases are DONE: cut over (Step 7), produce the REPORT (Step 9), then soak and delete
> `_migration-staging/` + this file LAST (Step 10). This file is a migration artifact — it does not
> travel into the live v1 brain's `knowledge/`.
