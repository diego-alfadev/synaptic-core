# /upgrade — Migration Guide to v0.5

Content-preserving migration from v0.3 or v0.4 to v0.5 "LLM-wiki first".

Read this file fully before making any changes. Work Phase M first, then Phase C.
Ask for confirmation before any deletion. Phase M is deterministic; Phase C requires judgment.

---

## What Changed (overview)

| Removed in v0.5 | What happened to the content |
|-----------------|------------------------------|
| `identity/` directory | Role summary → `BRAIN.md` Brain Context (2–4 lines). Contacts → `people-routing.md` knowledge page. Principles → split: project constraints → `project-constraints.md` knowledge page; behavior/tone rules → harness (AGENTS.md / CLAUDE.md). |
| `worklines/` directory | Active tasks → `playgrounds/` workspaces or user's task system. Stale tasks → discard with consent. |
| `skills/` directory | Provided by the skill package installed in `.claude/skills/` and `.agents/skills/`. |
| `cortex.config.yaml` | Budgets now live in `BRAIN.md` frontmatter (`budgets:` block). |
| `_tree.yaml` | Replaced by `knowledge/INDEX.md` (only real files indexed). |
| `BOOTSTRAP.md` / `MANIFEST.md` / `HEARTBEAT.md` (v0.3) | Content migrated into `BRAIN.md` Brain Context; remainder discarded. |
| Old harness bridges (v0.3/v0.4 ≤10-line bridge files) | Replaced by the `AGENTS.md` marker-wrapped fragment. |

**Added in v0.5:** `playgrounds/`, `references/` (reinstated), slimmer journal (80-line budget),
`templates/` at root of `.synaptic/`, budgets in `BRAIN.md` frontmatter.

---

## Phase M — Mechanical (deterministic; safe to run as cheap agent or script)

Phase M is pure file operations: no content judgment. Run it in order; tick each item.

### M1 — File deletions by source version

**From v0.3:**

- [ ] Delete `BOOTSTRAP.md`
- [ ] Delete `MANIFEST.md`
- [ ] Delete `identity/HEARTBEAT.md` (after extracting content in Phase C)
- [ ] Delete `knowledge/_tree.yaml` (after INDEX.md is rebuilt in Phase C)
- [ ] Delete standard skills: `skills/init/`, `skills/plan/`, `skills/consolidate/`, `skills/ingest/`, `skills/discover/`, `skills/audit/`, `skills/upgrade/`, `skills/help/`
  - Preserve any custom skill directories (not in the list above).
- [ ] Delete v0.3 bridge files (any ≤10-line files in harness paths that point to the brain):
  check `CLAUDE.md` (Synaptic section only), `.github/copilot-instructions`, `.cursor/rules/synaptic.mdc`, `.windsurf/rules/synaptic.md`, `.clinerules/synaptic.md`, `.aider/synaptic.md`, `.continue/synaptic.md`, `.agent(s)/rules/synaptic.md`.
  Remove only the synaptic-bridge fragment or file; leave non-synaptic content untouched.

**From v0.4 (in addition to v0.3 items if upgrading from v0.4 directly):**

- [ ] Delete `cortex.config.yaml`
- [ ] Delete `identity/` directory (after extracting content in Phase C)
- [ ] Delete `worklines/` directory (after triaging in Phase C)
- [ ] Delete `skills/` directory (all contents; they are now in project harness skill dirs)
- [ ] Remove old skill dir references from any surviving files

**Both versions:**

- [ ] Remove old harness bridge files that are ≤10 lines and contain only a brain pointer
  (now replaced by the AGENTS.md fragment written in M3).

### M2 — Directory creation

- [ ] Create `.synaptic/playgrounds/` (if absent)
- [ ] Create `.synaptic/references/` (if absent)
- [ ] Create `.synaptic/templates/` (if absent)

### M3 — AGENTS.md fragment (idempotent)

Write the following block to the project root `AGENTS.md`. Search for `<!-- BEGIN:SYNAPTIC -->` first:
- Found → replace the entire `BEGIN:SYNAPTIC … END:SYNAPTIC` block.
- Not found → append.
- No `AGENTS.md` → create with just this block.

```
<!-- BEGIN:SYNAPTIC -->
## Synaptic Brain
This project has a Synaptic brain at `.synaptic/` — a portable knowledge graph of project
knowledge, playbooks and working memory. Before working: read `.synaptic/BRAIN.md` and follow
its contribution protocol (route new durable knowledge, lessons, playbooks and task workspaces
as it specifies; files are authoritative over any agent-native memory).
Commands (synaptic skill): /init /consolidate /ingest /audit /upgrade
<!-- END:SYNAPTIC -->
```

Do **not** touch `CLAUDE.md` (user persona territory).

### M4 — Skill install

Copy the synaptic skill package into:

- `.claude/skills/synaptic/` (create if absent; skip if already present at same version)
- `.agents/skills/synaptic/` (create if absent; skip if already present at same version)

### M5 — Optional Cursor shim

If `.cursor/` exists at the project root, write `.cursor/rules/synaptic.mdc`:

```
This project has a Synaptic brain. See AGENTS.md (BEGIN:SYNAPTIC block) for instructions.
Read `.synaptic/BRAIN.md` at session start. Commands: /init /consolidate /ingest /audit /upgrade
```

### M6 — BRAIN.md frontmatter budgets

Open `BRAIN.md`. If the frontmatter does not have a `budgets:` block, add:

```yaml
budgets:
  journal: 80
  page: 150
  brain: 100
```

Set `version: 0.5.0-alpha` (or update from lower version).

### M7 — Templates sync

Copy the v0.5 templates into `.synaptic/templates/`:

- `templates/page.md` — from the skill package `templates/page.md`
- `templates/playbook.md` — from the skill package `templates/playbook.md`

Delete any stale v0.4 template files that no longer exist in the v0.5 set:
`_page_template.md`, `_playbook_template.md`, `cortex.config.yaml` (template copy), `worklines/`, `skills/` (template copies), `identity/` (template copies).

### M8 — Skeleton files

- If `references/_index.md` does not exist, create it from the skill package template.
- If `playgrounds/README.md` does not exist, create it from the skill package template.
- If `journal/_current.md` does not exist, create it from the skill package template.
- If `knowledge/INDEX.md` does not exist, create it from the skill package template.
- If `playbooks/_index.md` does not exist, create it from the skill package template.

---

## Phase C — Content (capable agent; judgment required)

Phase C re-routes content from the removed structures into v0.5 locations. Run after Phase M.
**Present each proposed change to the user before writing; do not bulk-apply silently.**

### C1 — Identity content re-routing

**From `MANIFEST.md` / `BOOTSTRAP.md` / `HEARTBEAT.md` (v0.3) or `identity/ROLE.md` (v0.4):**

- Extract a 2–4-line summary of what the brain covers and the owner's role in this project.
  Write this as the **Brain Context** block in `BRAIN.md` (framing for retrieval, not persona).
- Do NOT copy persona, tone, language, or agent behavior rules into BRAIN.md.

**From `identity/CONTACTS.md` (v0.4):**

- Create `knowledge/people-routing.md` — a knowledge page listing go-to contacts per topic.
  This is project knowledge, not identity. Register in `knowledge/INDEX.md`.

**From `identity/PRINCIPLES.md` (v0.4):**

- Split:
  - Durable project constraints (hard rules about the codebase, architecture, domain) →
    `knowledge/project-constraints.md` knowledge page. Register in `knowledge/INDEX.md`.
  - Agent behavior rules / tone rules / persona preferences →
    **Offer** to place in the project `AGENTS.md` (outside the SYNAPTIC block) or the user's
    global agent instructions (CLAUDE.md etc.). Do NOT place these in the brain.
    If the user declines, discard with explicit consent.

### C2 — Worklines triage (v0.4 only)

For each item in `worklines/_active.yaml` or `worklines/{slug}/`:

- Still active → ask: "Move to a playground (`playgrounds/{task-id}/`) or to your task system (Jira/Trello/etc.)?"
- Stale → confirm discard: "This workline appears stale — delete?" Only delete on explicit consent.

### C3 — Knowledge page migration (v0.3 especially)

For each `_overview.md` under `knowledge/areas/` or `knowledge/domains/`:

1. Create `knowledge/{topic-slug}.md` from `templates/page.md`.
2. Copy substantive content (architecture decisions, key facts). Do not copy session noise.
3. Add `[[wikilinks]]` to related pages.
4. Register in `knowledge/INDEX.md`.
5. After verifying, delete the source directory if empty.

### C4 — Inventory migration (v0.3)

For each file in `inventory/` (projects.md, environments.md, glossary.md):

- Merge facts into the relevant knowledge page for the system/project.
- If no target page exists, create one.
- After merging, delete the `inventory/` directory (confirm with user).

### C5 — References migration (v0.3 behavior: references/ was deleted in v0.4)

If `references/` contains files from a v0.3 brain that were not yet migrated:

- Large verbatim artifacts (>200 lines): keep in `references/`, add `_index.md` entry, create a distilled knowledge page linking to it.
- Documentation or notes: create or update the relevant knowledge page directly. No file stays in `references/` for prose-only sources.

### C6 — INDEX.md rebuild

Rebuild `knowledge/INDEX.md` from **only the files that physically exist** in `knowledge/`.
Do **not** register files from `_tree.yaml` that do not actually exist on disk (v0.3 phantoms).

For each real `.md` file in `knowledge/` (recursing into `lessons/`):
- Add a 1-line entry under the most relevant section heading.
- Delete `knowledge/_tree.yaml` after INDEX.md is verified.

### C7 — Naming normalization

For any knowledge file with a non-kebab-case name (spaces, uppercase, underscores):
- Propose a kebab-case rename.
- Update all `[[wikilinks]]` pointing to the old name in any surviving file.
- Confirm rename with user before executing.

### C8 — Wikilink enrichment pass

For each knowledge page that mentions a topic for which another page exists:
- Add `[[page-name]]` at the first mention if not already linked.
- Do not over-link; one link per target page per source page is sufficient.

### C9 — Journal rewrite

Rewrite `journal/_current.md` to the v0.5 three-section format:
- **Resume Anchor** — distilled from the most recent journal content.
- **Watch List** — carry forward unresolved open questions.
- **Log** — dated one-liners (summarize older entries, keep the narrative thread).

Trim to ≤80 lines total.

---

## Verification Checklist

Close the migration only when all items below are checked. Run `node tools/check.js` if
available; otherwise use manual greps.

**Layout:**
- [ ] v0.5 layout present: `BRAIN.md`, `knowledge/INDEX.md`, `playbooks/_index.md`, `playgrounds/README.md`, `references/_index.md`, `journal/_current.md`, `templates/page.md`, `templates/playbook.md`

**BRAIN.md:**
- [ ] ≤100 lines
- [ ] No `{{placeholders}}`
- [ ] Frontmatter has `version: 0.5.0-alpha` and `budgets:` block
- [ ] Brain Context present (2–4 lines, no persona/tone content)

**Knowledge:**
- [ ] `knowledge/INDEX.md` lists every `.md` file that actually exists in `knowledge/`; no phantom entries
- [ ] No page exceeds 150 lines
- [ ] All `[[wikilinks]]` resolve to real files
- [ ] All filenames in `knowledge/` are kebab-case

**References:**
- [ ] Every file in `references/` has a corresponding entry in `references/_index.md`
- [ ] No entries in `references/_index.md` point to missing files

**Removals:**
- [ ] No `identity/` directory
- [ ] No `worklines/` directory
- [ ] No `skills/` directory inside `.synaptic/`
- [ ] No `cortex.config.yaml` inside `.synaptic/`
- [ ] No `_tree.yaml` anywhere
- [ ] No `BOOTSTRAP.md`, `MANIFEST.md`, `HEARTBEAT.md`

**Harness:**
- [ ] `AGENTS.md` has `<!-- BEGIN:SYNAPTIC --> … <!-- END:SYNAPTIC -->` block
- [ ] Old synaptic bridge files (≤10-line pointer files) removed from harness paths
- [ ] Skill package present in `.claude/skills/synaptic/` and/or `.agents/skills/synaptic/`

**Journal:**
- [ ] `journal/_current.md` ≤80 lines, three-section format, no archive/ directory

Migration complete when all items are checked.
