# /upgrade — Migration Guide to v1.0

---

## Your data is safe — read this first

**You will not lose knowledge. Worst case, you keep your old brain exactly as it was.**

The migration is non-destructive, content-preserving, and fully reversible:

- **Non-destructive:** Phase M *stages* files (moves them to `_migration-staging/` inside the brain) — it never deletes content that Phase C still needs. Your original brain is git-versioned. Phase C runs and you verify the result *before* anything is removed from staging.
- **Content-preserving:** every node's content is carried through. The agent re-files and re-links nodes into the v1 structure — it does not rewrite your facts, decisions, or knowledge.
- **Reversible:** run the migration on a branch or a copy of the repo. If you are not happy with the result, you merge nothing and your old brain is intact on the original branch.

### Practical runbook (typical case: Node + Python + an agent)

1. **Branch:** `git switch -c v1-upgrade` — work on a copy; the original branch is your fallback.
2. **Phase M (mechanical):** `node tools/migrate.js .synaptic` — deterministic file staging; safe and scriptable. Use `--dry-run` first to preview moves without writing anything.
3. **Phase C (agent rearrange):** tell your agent `/upgrade` — the capable-agent phase: link conversion, MOC creation, consolidation formula applied retroactively, harness triage. The agent proposes each change; you confirm before it is written.
4. **Verify:** `node tools/check.js .synaptic` for graph health, then `/audit` in the agent for staleness and coverage. Review the result in Obsidian or Foam before proceeding.
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
| `BRAIN.md` (v0.4/0.5 boot file) | `BRAIN.md` (updated to v1 layout) | Add Context Capsule, Capture Contract, deploy-source pointer, Brain Map. **No guardrails block** — operating rules go to `harness/` as source and are **deployed** by `/init`/`/upgrade`; they are NOT left for runtime load. |
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

```
<!-- BEGIN:SYNAPTIC -->
## Synaptic Brain
This project has a Synaptic brain at `.synaptic/`. Before working: read `.synaptic/BRAIN.md`
and follow its capture contract (route durable knowledge, lessons, playbooks, and task
workspaces as specified; files are authoritative over any agent-native memory).
Honor team conventions in `.synaptic/harness/conventions.md`. Top guardrails in BRAIN.md.
Full harness (conventions/guardrails/skills) in `.synaptic/harness/` — load on demand.
Commands (synaptic skill): /init /consolidate /ingest /audit /upgrade
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
Read `.synaptic/BRAIN.md` at session start. Commands: /init /consolidate /ingest /audit /upgrade
```

### M6 — BRAIN.md frontmatter update

**v0.3 source:** BRAIN.md does not exist yet — Phase C creates it (step C1). Skip M6.

**v0.4/0.5 source:** Open `BRAIN.md`. Update or add:

```yaml
standard: synaptic-core
version: 1.0.0
```

Remove `budgets:` block (budgets are now soft limits documented in the skill, not in BRAIN.md).
Set `updated:` to today.

### M7 — Frontmatter scaffolding pass

For each `.md` file in `knowledge/` that lacks full D1 frontmatter:

- Add scaffold: `description: ""`, `type: knowledge`, `status: active`, `updated: ""`, `tags: []`.
- Leave values empty for Phase C to fill — do not guess content.

### M8 — Templates sync

Copy v1 templates into `.synaptic/templates/`:

- `node.md`, `registry.md`, `playbook.md`, `lesson.md` — from the skill package `templates/` directory.

Delete stale v0.3/0.4/0.5 template files that no longer exist in v1: `page.md`, `_page_template.md`, `_playbook_template.md`.

### M9 — Skeleton files

Create from seed/skill-package templates if absent:

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
- Extract the **Capture Contract** (consolidation formula) block into `BRAIN.md` using the v1 seed format.
- **Do NOT write a Top Guardrails block in BRAIN.md.** Operating rules (guardrails + conventions) go to `harness/` as the **deployable source** — they are then deployed by the Deploy step in Harness Self-Wire, not left for runtime load from the brain. BRAIN.md carries only the 1-line deploy-source pointer.
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

- For each cluster directory, create or rebuild `_index.md` from the seed template.
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

- Route team/project norms → `harness/conventions.md` (merge or create from seed template).
- Route hard rules → `harness/guardrails.md`. Both files are the **deployable source** — after routing, run the Deploy step (Harness Self-Wire §c) to materialize them into the outer harness. Do NOT mirror rules in `BRAIN.md → Top Guardrails` (that block is dropped in v1).
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

**Layout (v1):**
- [ ] `BRAIN.md`, `knowledge/INDEX.md`, `registries/_index.md`, `references/_index.md`, `journal/_current.md`, `harness/conventions.md`, `harness/guardrails.md`, `harness/skills/README.md`, `playgrounds/README.md`, `templates/node.md`, `templates/registry.md`, `templates/playbook.md`, `templates/lesson.md`

**BRAIN.md:**
- [ ] ≤110 lines; `version: 1.0.0` in frontmatter
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

Migration complete when all items are checked.
