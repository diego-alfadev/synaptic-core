# /consolidate — Knowledge Consolidation Reference

Move working memory from `journal/_current.md` into the structured knowledge store.
Run when: user invokes `/consolidate`, `_current.md` exceeds ~200 lines, or end of a productive session.

---

## Step 1: Read Journal

Read `journal/_current.md`. Classify each item:

| Category | Examples | Destination |
|----------|---------|-------------|
| Durable knowledge | Architectural decisions, how a system works | `knowledge/` page |
| Lesson learned | "X caused Y", failure post-mortem | `knowledge/lessons/` page |
| Playbook candidate | Repeated procedure that worked ≥2 times | `playbooks/` — see §5 |
| Direction / priority | New objective, changed scope | `worklines/_active.yaml` or `worklines/{slug}/_meta.md` |
| Identity / constraint | "Always do X", hard rule discovered | `identity/PRINCIPLES.md` or `ROLE.md` |
| Temporal noise | Debug output, session status, one-off lookup | Discard — do not persist |

When uncertain, ask: "Would a cold agent reading this six months from now benefit from it?" If no, discard.

---

## Step 2: Route Per BRAIN.md Rules

Apply the routing rules from `BRAIN.md §Routing Rules` (already in memory from boot). Do not re-read BRAIN.md unless context was cleared.

For each durable item:
- If target page exists → append in the appropriate section; bump `updated:` date.
- If no target page exists → create from `knowledge/_page_template.md` with real frontmatter.

---

## Step 3: Write-Validation Gate

Before marking consolidation complete, verify every new or updated page passes:

- [ ] Frontmatter present: `description:`, `updated:`, `status:` all filled (no placeholders)
- [ ] Page is ≤~150 lines; if longer, split into linked sub-pages with [[wikilinks]]
- [ ] Page is listed in `knowledge/INDEX.md` (or `playbooks/_index.md` for playbooks) with a 1-line summary
- [ ] All [[wikilinks]] inside the page resolve to real files

If any check fails, fix before proceeding. Do not skip this gate.

---

## Step 4: Playbook Promotion

If a procedure has been successfully followed ≥2 times and it appears in the journal:
- Suggest: "This looks like a repeatable playbook. Want me to create one?"
- If yes: create `playbooks/{slug}.md` from `playbooks/_playbook_template.md`, populate Intent + When to use + Method from the journal record. Add first Gotcha if a failure was noted.
- Register in `playbooks/_index.md`.

---

## Step 5: Archive & Reset

1. Create `journal/archive/{YYYY-MM-DD}.md` with a brief summary: what was consolidated, what was discarded, date.
2. Reset `journal/_current.md` to the blank template (keep the header comment, clear all content sections).
3. Bump `updated:` in `BRAIN.md` frontmatter to today's date.

---

## Step 6: Tool Check

If `tools/check.js` exists in the brain root: run `node tools/check.js`. Address any errors before finishing.
If not available: the write-validation gate in Step 3 serves as the manual equivalent.

---

## Step 7: Report

```
Consolidated:
  - N durable knowledge items → knowledge/ (list pages)
  - N lessons → knowledge/lessons/
  - N direction items → worklines/
  - N identity updates → identity/
  - N items discarded (temporal noise)

Session archived → journal/archive/{date}.md
BRAIN.md updated: bumped
```

---

## Anti-Patterns

- **Do not persist temporal noise**: "Today I debugged X" is not a knowledge node unless there is a durable lesson.
- **Do not create orphan pages**: every page must appear in `knowledge/INDEX.md` or `playbooks/_index.md`.
- **Do not duplicate**: check whether the knowledge already exists before creating a new page; prefer appending.
- **Do not mix identity and knowledge**: "I prefer TypeScript" belongs in `PRINCIPLES.md`, not a knowledge page.
