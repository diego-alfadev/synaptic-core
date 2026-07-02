# /synaptic-upgrade — Migration Guide to v1.0

> **Canonical runbook:** the authoritative, user-facing v0.3-beta → v1-beta migration runbook is
> **`docs/UPGRADE-v0.3-to-v1.md`**. Point all real migration work there — it is the deliverable the
> 4 production users run. This reference file is the **skill-side companion** that the agent follows
> during the supervised **M → C → V** flow; where the two ever diverge, `docs/UPGRADE-v0.3-to-v1.md`
> wins. Always migrate **on a copy** and **switch only when green** (see below).

---

## v1.1 hardening addendum — read alongside the phases below

> The phase-by-phase body below is correct; these reinforcements close real failure modes surfaced by
> a readiness review (especially for **large** and **team-shared / global** brains). The operational,
> paste-to-your-agent form of all of this is **`docs/UPGRADE-v0.3-to-v1.AGENT.md`** — prefer driving a
> real migration from there. Where this addendum and the older body differ, **the addendum wins.**

- **Topology first (does NOT change the migration — only the wiring).** Detect/ask whether the brain
  is a single-project `.synaptic/` *inside* one repo, or a **shared/global** `.synaptic/` sitting
  *beside* several repos and serving all of them (commonly a PRIVATE per-user "seat" brain). The schema
  migration (M/C/V) is identical either way; only **Harness wiring** and **cutover coordination** branch
  on it. Also **detect the existing harness wiring** (the host's chatmode/instructions/AGENTS files) so
  you know the current→desired state — this detection belongs in `/synaptic-init` and every
  `/synaptic-upgrade`, not just this one.
- **Safeguard is a HARD GATE.** Before touching anything: if the brain isn't git-tracked, `git init` it
  and commit a `pre-v1` tag; make a folder backup; **verify the backup is byte-complete** (file-count +
  size parity). If the brain is on OneDrive/a sync share, move the backup + work copy to a **local**
  path first (a sync client can upload half-written files and corrupt the rollback / leak confidential
  content). Back up the **existing harness wiring** too (chatmode/instructions/AGENTS files) — the
  upgrade rewrites them. No-clone case: the agent self-installs the skill from GitHub raw (see SKILL.md
  Bootstrap) and fetches `tools/` separately (they are NOT in the skill manifest).
- **No silent deletions.** Every merge/split/removal goes in a DELETIONS LEDGER, shown and confirmed;
  knowledge deletion is human-only. Mostly this migration is *refactor + construction*, not deletion.
- **Content-conservation gate REPLACES the node-count gate.** "v1 count ≥ v0.3 count" cannot prove
  no-loss (dedupe lowers it, splits raise it). Instead: before Phase C, snapshot every node as
  `(path, title, sha256(body-minus-frontmatter))`; afterwards each must be **present, logged-merged
  (loser→winner), or logged-split**. Any node neither present nor logged = SILENT DROP = STOP. Keep the
  count only as a smoke check, defined identically on both sides.
- **Re-file, don't rewrite.** `description:` is EXTRACTIVE (condense the node's own first sentence —
  never synthesize); `tags:` from a closed vocabulary; **DEFER the C5 "Generalize" prose rewrite** to a
  later supervised consolidate (it can silently drop a load-bearing caveat). On wikilink conversion,
  resolve duplicate basenames first and verify each `[[target]]` resolves to the SAME physical file the
  old path did (link **identity**, not just "resolves to something").
- **Resumable.** Run Phase C cluster-by-cluster with a ledger (per cluster: C3/C4/C5/C11 +
  every-node-in-_index?). A large supervised pass will span sessions/compactions — "Phase C complete"
  means all clusters ticked, the precondition to Phase V.
- **Staging is deleted LAST, never at Phase V time.** Keep `_migration-staging/` through Phase V **and**
  a post-cutover soak; deleting it is the final action after stability — this OVERRIDES the C12 step's
  "delete as final step of Phase C". A mis-file found in Phase V/early-soak must still be recoverable.
- **Global/seat harness wiring — DETECT current, then deploy (prefer user-level, prefer symlink).**
  First SCAN for the existing wiring (VS Code Copilot `*.chatmode.md` + `*.instructions.md` with
  `applyTo:`, `.github/copilot-instructions.md`, `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/*`) to learn
  the current→desired delta. The default bridge TEXT hardcodes a CWD-relative `.synaptic/`, and
  `deploy.js` writes one `<project-root>/AGENTS.md` — neither fits a sibling brain. (Detection itself is
  handled: the v1 skill's Detect-on-Load resolves a bridge pointer + stays silent when bridged.)
  PREFER ONE USER-LEVEL pointer that applies across all repos (a Copilot USER-LEVEL/profile instructions
  file applies across all workspaces — globality comes from the user-level PLACEMENT, not from `applyTo`,
  whose glob only scopes which files within a workspace it attaches to). Keep work repos CLEAN: never
  write the bridge pointer OR the rules content into a committed repo file (it leaks brain-sourced
  material). Copilot reads `AGENTS.md` natively too; Gemini CLI (`GEMINI.md`) is the notable non-reader. Rewrite the detected v0.x bridge to v1 (BRAIN.md / INDEX /
  registries paths; `/synaptic-*` commands; drop the HEARTBEAT re-read). Point at the brain by its
  fixed path (absolute is fine for a per-user brain; `../.synaptic/` only if the workspace root is the
  brain's parent). Deploy conventions+guardrails as the always-on rules — **SYMLINK the `harness/`
  source where the host allows it**, else emit the block. Only AGENTS.md / Cursor hosts that don't
  climb to a shared root need per-repo wiring. In ALL cases install the current v1 skill — its
  Detect-on-Load already resolves the bridge pointer and stays silent when a `BEGIN:SYNAPTIC` bridge is
  present (NO manual patch). Grep the wired file(s): a bare CWD-relative `.synaptic/BRAIN.md` must be ZERO.
- **Cutover depends on private-vs-shared.** A PRIVATE per-user brain (the typical seat/departmental
  case — one writer, one machine) just swaps the folder once Phase V is green (~couple of hours). Only
  a GENUINELY SHARED brain (several concurrent writers) needs the FREEZE + delta-reconcile, since
  "work on a copy, switch when green" would otherwise silently discard interim edits: announce + ack a
  freeze (lock the repo if git), baseline at the last moment, port each interim delta through Phase C,
  re-verify; the brain-folder swap (filesystem) and the harness rewrite land **together per machine**.
- **Rollback that actually works.** PRIMARY: delete the v1 brain and **rename** `*-v0.3-backup` back.
  Do NOT `git checkout <backup-path>` (it does not swap the folder in). On a shared git brain, a forward
  "revert to `pre-v1`" — never a force-push/reset.
- **Optional deep clean (on request only).** After the strict migration, a diagnose-then-treat sweep =
  `/synaptic-maintain` (`references/maintain.md`): pre-check → `/synaptic-audit` → consolidate /
  reconcile / `/synaptic-synthesize` / `/synaptic-weave` → post-check, approval-gated, with a
  before/after diff against the backup.
- **Report (always).** Emphasize the **refactor before vs after** (counts: nodes/links/orphans/MOC
  coverage, what split/merged/re-typed, broken links fixed — diffed against the backup), plus the
  migration summary, the harness wiring matrix, the conservation result + deletions ledger, and the
  decision log.

> **Operating rules live in the harness, not in BRAIN.md (resolved).** Conventions + guardrails are the
> brain's SOURCE in `harness/`, and are **deployed into the harnessing / system prompt** (SYMLINK
> preferred over copy) — read from the brain only when edited or to verify sync, never at session
> start. The v1 `templates/BRAIN.md` no longer ships a `## Top Guardrails` block (a boot-time read
> would duplicate the system prompt); BRAIN.md carries only the harness deploy-source pointer. Phase V
> greps `BRAIN.md` for `Top Guardrails` (must be empty).

---

## The supervised, non-destructive M → C → V flow

The migration is **one-time, supervised, and non-destructive**, run **on a copy**, with three phases:

- **M (mechanical):** deterministic file transforms / staging — no content judgment.
- **C (content rearrange):** a capable agent re-files and re-links into the v1 structure — each
  change proposed before it is written.
- **V (verify):** counts / links / MOC checks pass → **switch only when green; keep the old.**

This file details all three. Run **M** first (safe), then **C** (judgment), then **V**.

---

## Your data is safe — read this first

**You will not lose knowledge. Worst case, you keep your old brain exactly as it was.**

The migration is non-destructive, content-preserving, and fully reversible:

- **Non-destructive:** Phase M *stages* files (moves them to `_migration-staging/` inside the brain) — it never deletes content that Phase C still needs. Your original brain is git-versioned. Phase C runs and you verify the result *before* anything is removed from staging.
- **Content-preserving:** every node's content is carried through. The agent re-files and re-links nodes into the v1 structure — it does not rewrite your facts, decisions, or knowledge.
- **Reversible:** run the migration on a branch or a copy of the repo (**switch only when green; keep the old**). If you are not happy with the result, you merge nothing and your old brain is intact on the original branch.

### Practical runbook (typical case: Node + Python + an agent)

> Superseded by the v1.1 hardening addendum above and `docs/UPGRADE-v0.3-to-v1.AGENT.md` — the
> branch/merge form below is the in-repo variant only; the addendum's copy + verified-backup +
> folder-swap + conservation gate take precedence.

1. **Branch:** `git switch -c v1-upgrade` — work on a copy; the original branch is your fallback.
2. **Phase M (mechanical):** if `tools/migrate.js` exists, run `node tools/migrate.js .synaptic` (use `--dry-run` first to preview moves without writing anything) — deterministic file staging, safe and scriptable; otherwise do the manual equivalent (stage files to `_migration-staging/` per the M-step checklist below by hand).
3. **Phase C (agent rearrange):** tell your agent `/synaptic-upgrade` — the capable-agent phase: link conversion, MOC creation, consolidation formula applied retroactively, harness triage. The agent proposes each change; you confirm before it is written.
4. **Verify:** if `tools/check.js` exists, run `node tools/check.js .synaptic` for graph health; otherwise do the manual equivalent (the Phase V checklist greps / inspection below). Then `/synaptic-audit` in the agent for staleness and coverage. Review the result in Obsidian or Foam before proceeding.
5. **Merge:** once satisfied, `git switch main && git merge v1-upgrade`. The old branch remains as a rollback point.

> If anything looks wrong after Phase C, do not merge — you have the original branch. Open an issue or re-run Phase C with more conservative settings.

---

Content-preserving migration from v0.3, v0.4, or v0.5 to v1.0 "two-plane wiki + harness".

**Read this file fully before making any changes.** Run Phase M first (mechanical, safe),
then Phase C (mandatory content rearrange; requires judgment), then verify with Phase V.

**Autonomous mode** (no user available — batch/rehearsal run): make the reasonable choice at
every junction, never destroy ambiguous content (prefer staging/moving over deleting), and
record every non-obvious judgment in a migration decision log delivered with the result.

---

## What Changed: Source-Version Mapping

| Old location / structure | v1 destination | Notes |
|---|---|---|
| `BRAIN.md` (v0.4/0.5 boot file) | `BRAIN.md` (updated to v1 layout) | Add Context Capsule, Capture Contract, deploy-source pointer, Brain Map. **No guardrails block** — operating rules go to `harness/` as source and are **deployed** by `/synaptic-init`/`/synaptic-upgrade`; they are NOT left for runtime load. |
| `BOOTSTRAP.md` / `MANIFEST.md` / `HEARTBEAT.md` (v0.3) | → `BRAIN.md` Context Capsule (2–4 lines) | Remainder discarded after Phase C |
| `identity/ROLE.md` (v0.4) | → `BRAIN.md` Context Capsule | Not persona |
| `identity/CONTACTS.md` (v0.4) | → `knowledge/people-routing.md` (type: knowledge) | Project routing knowledge |
| `identity/PRINCIPLES.md` (v0.4) | Split: project constraints → knowledge node; team norms → `harness/conventions.md`; agent behavior → AGENTS.md/CLAUDE.md (user harness, not brain) | Ownership test: "would a teammate inheriting this brain need it?" |
| `inventory/` (v0.3) | `registries/` | Tabular SSOTs reinstated as first-class |
| `worklines/` (v0.3/0.4) | Active → `playgrounds/`; BAU → playbook node; stale → discard with consent | Never auto-delete |
| `skills/` inside `.synaptic/` | `harness/skills/` | Project-local skills travel with brain |
| `knowledge/_tree.yaml` (v0.3) | Replaced by `knowledge/INDEX.md` (only real files) | Phantom entries dropped |
| `playbooks/` directory (v0.5) | Nodes moved to `knowledge/{cluster}/` (type: playbook) | Playbooks are typed co-located nodes, not a silo |
| `knowledge/working-agreements.md` (v0.5 pattern) | `harness/conventions.md` | Team conventions belong in harness |
| Old harness bridge files (≤10-line pointer files) | Replaced by AGENTS.md marker fragment | Idempotent BEGIN/END:SYNAPTIC |
| `cortex.config.yaml` (v0.4) | Budgets → `BRAIN.md` frontmatter | Delete after migration |
| Path-style links `[text](path/to/file.md)` | `[[wikilinks]]` | Phase C conversion |
| Per-cluster `_overview.md` (v0.3) | Splits into `{cluster}/_index.md` sub-MOC + atomic nodes | Phase C content rearrange |

---

## Phase M — Mechanical (Deterministic)

Phase M is pure file operations: no content judgment. Safe to run as a cheap agent or script
(or `tools/migrate` if available). **Phase M never destroys content Phase C still needs** —
move to `_migration-staging/` inside the brain; Phase C consumes and deletes it.

Tick each item. Work in order.

### M1 — Stage or delete by source version

**From v0.3 source:**

- [ ] MOVE to `_migration-staging/`: `BOOTSTRAP.md`, `MANIFEST.md`, `identity/HEARTBEAT.md`, `knowledge/_tree.yaml`
- [ ] Leave `identity/ROLE.md`, `identity/PRINCIPLES.md`, `identity/CONTACTS.md` in place (Phase C consumes them)
- [ ] MOVE `worklines/` (whole directory, if present) to `_migration-staging/worklines/`
- [ ] MOVE `inventory/` to `_migration-staging/inventory/` (Phase C migrates it to `registries/`)
- [ ] Delete standard lifecycle skill dirs: `skills/init/`, `skills/plan/`, `skills/consolidate/`, `skills/ingest/`, `skills/discover/`, `skills/audit/`, `skills/upgrade/`, `skills/help/`. Preserve any custom skill dirs (Phase C will relocate them).
- [ ] Remove old v0.3 synaptic bridge files (≤10-line pointer files at harness paths): `.github/copilot-instructions`, `.cursor/rules/synaptic.mdc`, `.windsurf/rules/synaptic.md`, `.clinerules/synaptic.md`, `.aider/synaptic.md`, `.continue/synaptic.md`, `.agents/rules/synaptic.md`. Remove only the synaptic fragment; leave non-synaptic content untouched.
- [ ] Brain-root context-prompt files (v0.3 pattern — shared dept context next to BOOTSTRAP.md): leave in place; list them for C1b.

**From v0.4 source (in addition to applicable v0.3 items):**

- [ ] Delete `cortex.config.yaml` (superseded by BRAIN.md frontmatter)
- [ ] Leave `identity/` in place (Phase C)
- [ ] MOVE `worklines/` to `_migration-staging/worklines/`
- [ ] Delete standard lifecycle `skills/` dirs; preserve custom skills (Phase C relocates them)

**From v0.5 source:**

- [ ] MOVE `playbooks/` directory to `_migration-staging/playbooks/` (Phase C disperses nodes to clusters)
- [ ] MOVE `knowledge/working-agreements.md` (if present) to `_migration-staging/working-agreements.md` (Phase C routes to harness/conventions.md)
- [ ] Old harness bridge files (≤10 lines): remove.

### M2 — Directory creation

Create these if absent:

- [ ] `.synaptic/harness/`
- [ ] `.synaptic/harness/skills/`
- [ ] `.synaptic/registries/`
- [ ] `.synaptic/references/`
- [ ] `.synaptic/references/raw/`
- [ ] `.synaptic/playgrounds/`
- [ ] `.synaptic/templates/`
- [ ] `.synaptic/_migration-staging/`

### M3 — AGENTS.md fragment (idempotent)

Write to project root `AGENTS.md`. Search for `<!-- BEGIN:SYNAPTIC -->` first:
- Found → replace entire block.
- Not found → append.
- No `AGENTS.md` → create with just this block.

<!-- canonical block — mirror any change in SKILL.md §a -->
```
<!-- BEGIN:SYNAPTIC -->
## Synaptic Brain
This project has a Synaptic brain at `.synaptic/`. Before working: read `.synaptic/BRAIN.md`
and follow its capture contract (route durable knowledge, lessons, playbooks, and task
workspaces as specified; files are authoritative over any agent-native memory).
Operating rules (conventions, guardrails) are in the SYNAPTIC-RULES section below.
Commands (synaptic skill): /synaptic-init /synaptic-consolidate /synaptic-ingest /synaptic-audit /synaptic-weave /synaptic-synthesize /synaptic-maintain /synaptic-upgrade
<!-- END:SYNAPTIC -->
```

Do **not** touch `CLAUDE.md` (user persona territory).

### M4 — Skill install

Copy the synaptic skill package (this skill directory) into:

- `.claude/skills/synaptic/` (create if absent; skip if present at same version)
- `.agents/skills/synaptic/` (create if absent; skip if present at same version)

### M5 — Optional Cursor shim

If `.cursor/` exists at the project root, write `.cursor/rules/synaptic.mdc`:

```
This project has a Synaptic brain. See AGENTS.md (BEGIN:SYNAPTIC block) for instructions.
Read `.synaptic/BRAIN.md` at session start. Commands: /synaptic-init /synaptic-consolidate /synaptic-ingest /synaptic-audit /synaptic-weave /synaptic-synthesize /synaptic-maintain /synaptic-upgrade
```

### M6 — BRAIN.md frontmatter update

**v0.3 source:** BRAIN.md does not exist yet — Phase C creates it (step C1). Skip M6.

**v0.4/0.5 source:** Open `BRAIN.md`. Update or add:

```yaml
standard: synaptic-core
schema_version: 1.0      # BRAIN.md = the SCHEMA/FORMAT version (distinct from SKILL.md engine semver)
```

> **Two version numbers, one bundle (§5.4).** `BRAIN.md schema_version:` is the **schema/format**
> version of the brain; `SKILL.md version:` is the **engine semver** of the skill code (with a
> `supported_schema` range). A skill-code update = reinstall the skill, **no brain migration**; only
> a schema/format change runs `/synaptic-upgrade`. This migration is exactly such a schema change.

Remove `budgets:` block (budgets are now soft limits documented in the skill, not in BRAIN.md).
Set `updated:` to today.

**`capture_policy` presets (renamed in v1).** If `BRAIN.md` frontmatter carries a `capture_policy:`
value from a pre-v1 brain, map it to the v1 names: `curated → selective`, `logbook → capture-all`,
`balanced → balanced` (unchanged). These are the PROMOTION axis only — orthogonal to the passivity
dial; do not invent a second policy for breadcrumbs.

### M7 — Frontmatter scaffolding pass

For each `.md` file in `knowledge/` that lacks full D1 frontmatter:

- Add scaffold: `description: ""`, `type: knowledge`, `status: active`, `updated: ""`, `tags: []`.
- Leave values empty for Phase C to fill — do not guess content.

### M8 — Templates sync

Copy v1 templates into `.synaptic/templates/`:

- `node.md`, `registry.md`, `playbook.md`, `lesson.md` — from the skill package `templates/` directory.

Delete stale v0.3/0.4/0.5 template files that no longer exist in v1: `page.md`, `_page_template.md`, `_playbook_template.md`.

### M9 — Skeleton files

Create from the skill bundle's `templates/` (the single source of truth — there is no `seed/`) if absent:

- [ ] `references/_index.md`
- [ ] `registries/_index.md`
- [ ] `playgrounds/README.md`
- [ ] `harness/skills/README.md`
- [ ] `knowledge/INDEX.md` (if truly absent — preserve if it exists)
- [ ] `journal/_current.md` (if absent)

---

## Phase C — Content Rearrange (MANDATORY — Capable Agent Required)

Phase C re-routes content from removed structures into v1 locations. This is a **breaking change**;
judgment is required. **Present each proposed change to the user before writing; do not bulk-apply
silently.** In autonomous mode: make the reasonable choice + log.

Phase C consumes `_migration-staging/` and **deletes it as its final step**.

### C1 — Identity / boot content re-routing

**From `BOOTSTRAP.md` / `MANIFEST.md` / `HEARTBEAT.md` (v0.3) or `identity/ROLE.md` (v0.4):**

- Extract a 2–4-line summary of what the brain covers + the owner's role. Write as the **Context Capsule** block in `BRAIN.md`.
- Extract the **Capture Contract** (consolidation formula) block into `BRAIN.md` using the v1 `templates/BRAIN.md` format.
- **Do NOT write a Top Guardrails block in BRAIN.md.** Operating rules (guardrails + conventions) go to `harness/` as the **deployable source** — they are then deployed by the Deploy step in Harness Self-Wire (`/synaptic-init`), not left for runtime load from the brain. BRAIN.md carries only the 1-line deploy-source pointer.
- Do NOT copy persona, tone, language preferences, or agent behavior rules into BRAIN.md.

**From `identity/CONTACTS.md` (v0.4):**

- Create `knowledge/people-routing.md` — a knowledge node listing go-to contacts per topic area. `type: knowledge`. Register in `knowledge/INDEX.md` (create a cluster or add to a relevant one).

**From `identity/PRINCIPLES.md` (v0.4) — ownership test: "would a teammate inheriting this brain need it?":**

- **Yes, team/project norm** (communication languages per channel, commit conventions, ticket etiquette, escalation rules) → `harness/conventions.md`. These travel with the brain.
- **Yes, hard project rule** (security rules, architecture constraints, deployment gates) → `harness/guardrails.md`. These will be deployed to the outer harness by the Deploy step — do NOT mirror them in `BRAIN.md → Top Guardrails` (that block no longer exists in v1).
- **No, personal agent behavior** (tone rules, chat-language with owner, output style) → offer to place in project `AGENTS.md` (outside the SYNAPTIC block) or the user's global harness. Do NOT place in the brain. If the user declines, discard with explicit consent.

### C1b — Brain-root context/bridge files (v0.3 pattern)

If Phase M listed context-prompt or bridge-like files at the brain root: extract durable project knowledge (systems, environments, people-routing, glossary facts) into typed knowledge nodes registered in INDEX.md; route persona/behavior content per C1; then MOVE original files to a `HARNESS_ORIGINALS/` folder at the project root for the user to re-home. They are harness material, not brain material.

### C2 — Worklines triage (source: `_migration-staging/worklines/`)

For each item in staged `worklines/_active.yaml` or `worklines/{slug}/`:

- **Still active** (specific in-flight work) → create `playgrounds/{task-id}/`; register in `journal/_current.md`. Ask: "Move to playground or to your external task system (Jira/etc.)?"
- **Perpetual / BAU** (always-on maintenance, no specific in-flight state) → distil the operating rhythm into a knowledge node or `type: playbook` node in its cluster. Not a stale item.
- **Stale** → extract any durable lessons first, then: "This workline appears stale — delete?" Delete only on explicit consent (autonomous: discard + log).

### C3 — Path-links → `[[wikilinks]]`

Scan all files in `knowledge/` for Markdown path-style links `[text](../path/file.md)` or `[text](./file.md)`:

- Convert each to `[[target-kebab-name]]` (filename without extension).
- Update the target file's name to kebab-case if it is not already.
- Do not introduce new wikilinks to files that do not exist — resolve discrepancy first.

### C4 — Build hub INDEX + per-cluster sub-MOCs

**Hub `knowledge/INDEX.md`:**

- Rebuild from the physical files that exist. List every cluster directory with a 1-line description and a link to its `_index.md`.
- Do NOT register files from old `_tree.yaml` that do not physically exist. If gaps matter, add an HTML comment: `<!-- Known gaps: ... -->`.

**Per-cluster `_index.md`:**

- For each cluster directory, create or rebuild `_index.md` from the skill bundle's `templates/` pattern.
- Add a 1-line entry per node: `[[node-name]] — {description copied from node's frontmatter}`.
- Migrate content from old `_overview.md` files: split into atomic kebab-case nodes (≤150 lines each); each gets full D1 frontmatter; listed in `_index.md`. After verifying, delete the empty source directory.

### C5 — Apply consolidation formula retroactively

For each node in `knowledge/`:

- **Re-atomize**: does this node cover more than one independent concept? If yes, split into linked sub-nodes.
- **Tag oversized → `type: reference`**: nodes >150 lines that are deliberately long canonical docs → add `type: reference` to frontmatter. Nodes >150 lines that are not canonical → split.
- **Dedupe**: search for nodes covering the same concept. Collapse to one SSOT; delete duplicates; add `[[wikilinks]]` from dependent nodes.
- **Tags**: fill `tags: [cluster-tag, topic-tags]` for every node that has empty tags.

### C6 — Route working-agreements / conventions

**From v0.5 `knowledge/working-agreements.md`** (staged in `_migration-staging/`):

- Route team/project norms → `harness/conventions.md` (merge or create from the skill bundle's `templates/harness/conventions.md`).
- Route hard rules → `harness/guardrails.md`. Both files are the **deployable source** — after routing, run the Deploy step (Harness Self-Wire §c via `/synaptic-init`) to materialize them into the outer harness. Do NOT mirror rules in `BRAIN.md → Top Guardrails` (that block is dropped in v1).
- Persona/agent behavior content → offer to place in AGENTS.md (user harness). Never into the brain.
- Delete the staged file after routing is confirmed.

### C7 — Route playbooks (v0.5 source)

**From `_migration-staging/playbooks/`:**

- For each playbook node: identify which knowledge cluster it belongs to.
- MOVE it to `knowledge/{cluster}/{playbook-name}.md`; set `type: playbook`.
- Register in `knowledge/{cluster}/_index.md` under a `<!-- Playbooks: -->` comment if desired.
- Ensure `knowledge/INDEX.md` lists the cluster.
- After all nodes are moved, the `playbooks/` silo no longer exists.

### C8 — Inventory → registries (v0.3 source)

**From `_migration-staging/inventory/`** (projects.md, environments.md, glossary.md, etc.):

- Convert each inventory file to a `registries/{table}.md` (create from `templates/registry.md`; format content as a proper table).
- Register in `registries/_index.md`.
- Merge facts that already exist in a knowledge node rather than duplicating them.
- After migration confirmed, delete the staged `inventory/` directory.

### C9 — Relocate project skills (v0.3/0.4 source)

**Custom skill dirs preserved from M1:**

- MOVE each custom skill dir to `harness/skills/{skill-name}/`.
- Register in `harness/skills/README.md`.

### C10 — Journal rewrite

Rewrite `journal/_current.md` to v1 three-section format:

- **Resume Anchor** — distilled from most recent journal content.
- **Watch List** — carry forward unresolved open questions.
- **Log** — dated one-liners; summarize older entries; keep the narrative thread.

Trim to ≤80 lines total. Register any in-flight playgrounds in the Active playgrounds list.

### C11 — Frontmatter fill

For all nodes with scaffolded (empty) frontmatter from M7:

- Fill `description:` from the node title and opening paragraph.
- Set `type:` to the most accurate type (`knowledge | pattern | playbook | decision | reference | lesson`).
- Set `updated:` to the file's last known date or today.
- Fill `tags:` with cluster-tag + 1–2 topic tags.

### C12 — Delete staging area

When all Phase C steps are confirmed complete: delete `_migration-staging/`.

---

## Phase V — Verification Checklist

Close the migration only when all items are checked. Run `node tools/check.js` if available;
otherwise use manual greps / inspection.

> **`check.js` green is NECESSARY but NOT SUFFICIENT.** A brain can pass every structural check (0
> errors) and still be unusable for retrieval (evidence: 0 errors yet dozens of practical orphans and
> almost no edges — structural-green ≠ retrieval-green). Phase V is DONE only when the structural
> checklist below passes AND the **mandatory retrieval drill** at the end of this section passes. Tick
> the per-phase gate in `MIGRATION_DONE.md` (kept at the brain root / `_migration-staging/`, never in
> `knowledge/`) — a phase is DONE only when every box under it is checked.

**Layout (v1):**
- [ ] `BRAIN.md`, `knowledge/INDEX.md`, `registries/_index.md`, `references/_index.md`, `journal/_current.md`, `harness/conventions.md`, `harness/guardrails.md`, `harness/skills/README.md`, `playgrounds/README.md`, `templates/node.md`, `templates/registry.md`, `templates/playbook.md`, `templates/lesson.md`

**BRAIN.md:**
- [ ] ≤110 lines; `schema_version: 1.0` in frontmatter (matches `templates/BRAIN.md` + the SKILL.md compat-check `supported_schema`)
- [ ] No `{{placeholders}}`
- [ ] Context Capsule present (2–4 lines; no persona/tone content)
- [ ] Capture Contract block present (6-step compressed)
- [ ] Deploy-source pointer present (1 line pointing to `harness/`; NO Top Guardrails block)
- [ ] Brain Map table present and consistent with actual layout

**Knowledge:**
- [ ] `knowledge/INDEX.md` lists every cluster that physically exists; no phantom entries
- [ ] Every cluster has a `_index.md` sub-MOC listing its nodes
- [ ] No node exceeds ~150 lines without `type: reference`
- [ ] All `[[wikilinks]]` resolve to real files
- [ ] All frontmatter D1 fields filled (`description`, `type`, `status`, `updated`, `tags`) — no empty `tags: []`
- [ ] All filenames are kebab-case

**Harness (source):**
- [ ] `harness/conventions.md` exists with team norms (no persona content) — header says "(source — deployed)"
- [ ] `harness/guardrails.md` exists with hard rules — header says "(source — deployed)"
- [ ] Custom project skills in `harness/skills/` (if any existed)

**Harness (deployed — outer harness):**
- [ ] `AGENTS.md` contains `<!-- BEGIN:SYNAPTIC-RULES --> … <!-- END:SYNAPTIC-RULES -->` block with deployed conventions + guardrails
- [ ] Project skills from `harness/skills/` installed in `.claude/skills/` and/or `.agents/skills/`

**Registries:**
- [ ] `registries/_index.md` lists every registry file; all files exist
- [ ] Old `inventory/` deleted (v0.3)

**References:**
- [ ] `references/_index.md` has an entry for every file in `references/raw/`
- [ ] No phantom entries in `references/_index.md`

**Removals (by source version):**
- [ ] v0.3: No `BOOTSTRAP.md`, `MANIFEST.md`, `HEARTBEAT.md`, `identity/`, `worklines/`, `skills/` inside brain, `_tree.yaml`, `cortex.config.yaml`
- [ ] v0.4: No `identity/`, `worklines/`, `skills/` inside brain, `cortex.config.yaml`
- [ ] v0.5: No `playbooks/` silo; no `knowledge/working-agreements.md`
- [ ] All versions: No `_migration-staging/`

**Harness wiring:**
- [ ] `AGENTS.md` has `<!-- BEGIN:SYNAPTIC --> … <!-- END:SYNAPTIC -->` block
- [ ] Old synaptic bridge files removed
- [ ] Skill package present in `.claude/skills/synaptic/` and/or `.agents/skills/synaptic/`

**Journal:**
- [ ] `journal/_current.md` ≤80 lines, three-section format

**Retrieval drill (MANDATORY — `check.js` green is necessary but NOT sufficient):**

Prove the brain can actually be *retrieved from* by walking `BRAIN → INDEX → cluster _index → node`.
Question-selection recipe (deterministic — pick the same way every run):

- [ ] 3 fact-lookup questions from the **3 most-linked nodes** (highest edge degree) answered by MOC
      navigation only, recording the hop path.
- [ ] 2 lookup questions from **2 registry entries** answered by MOC navigation only.
- [ ] 1 **cross-cluster synthesis** question attempted (answer needs two nodes in different top-level
      clusters).
- [ ] **Pass bar:** all 5 fact-lookups answered via MOC navigation with **0 grep-fallbacks**. The
      synthesis question MAY miss — a miss is a `/synaptic-weave` content gap (per the v1.0 benchmark
      caveat), not a navigation failure. A fact-lookup that needs grep is a navigation failure — fix
      the MOC/links and re-run.

**Phase → commit mapping (one commit per phase — mirror of the AGENT runbook):**

The migration lands as **≥3 distinct, independently-revertible commits** on the upgrade branch, each
passing `check.js` before the next begins — never one blended mega-commit:

- [ ] `migrate: Phase M mechanical file moves` — deterministic moves + staging only (check.js **may
      still ERROR** here — expected).
- [ ] `refactor: Phase C content rearrange` — links / MOC / frontmatter / consolidation (check.js
      **must reach 0 errors**).
- [ ] `chore: cleanup + cutover` — staging deletion, harness rewrite, backups pruned (check.js
      re-verifies; retrieval drill passes before cutover). The upgrade branch's 3 phase commits then
      promote to `main` by a single `git merge --ff-only` (see the cutover section / AGENT runbook).

Migration complete when all items are checked. **Switch only when green; keep the old branch as a
rollback point.**

---

## Going forward — versioning after v1 (§5.4 / §8)

This one-time v0.3-beta → v1-beta migration is the last *whole-brain* upgrade you should need. From
here, versioning is **decoupled**, so most updates need **no** migration:

- **Skill-code update** (bug fix, new procedure, better wording) → **reinstall the skill, no brain
  migration.** The brain's `BRAIN.md version:` is unchanged.
- **Schema/format change** (a new structural rule in the templates) → compat-check **warns**, and you
  run a small `/synaptic-upgrade` for that specific change. Only these touch the brain.
- **Compat-check is warn-not-gate.** At skill load it compares `SKILL.md` `supported_schema` against
  `BRAIN.md version:`. Missing version metadata → **"assume compatible" + a one-line info notice**,
  never per-node, and **never a precondition for reading the brain** — a skill-less agent still boots
  from `BRAIN.md` unchecked (C1 untouched).
- **Update-awareness without a registry:** **GitHub Releases + repo Watch** (zero infra). An optional
  Cortex "check-latest" can hit the GitHub Releases API — opt-in, never required at CORE.

> The authoritative end-to-end migration runbook remains **`docs/UPGRADE-v0.3-to-v1.md`**.
