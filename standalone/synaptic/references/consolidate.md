# /consolidate — Knowledge Consolidation Reference

Route working memory from `journal/_current.md` and open playgrounds into the structured
knowledge store. Run when: user invokes `/consolidate`, journal is approaching 80 lines,
a playground task is complete, or end of a productive session.

---

## Step 1: Read Journal and Open Playgrounds

Read `journal/_current.md`. Note the **Active playgrounds** list in the Resume Anchor section.
Classify each item in the journal:

| Category | Examples | Destination |
|----------|---------|-------------|
| Durable knowledge | Architectural decisions, how a system works | `knowledge/` page |
| Lesson learned | "X caused Y", failure post-mortem | `knowledge/lessons/` page |
| Playbook candidate | Procedure that worked ≥2 times | `playbooks/` entry |
| Task workspace content | Multi-day analysis, drafts, artifacts | Playground (already routed) |
| Large verbatim artifact | DDL, spec, export | `references/` + `_index.md` entry |
| Temporal noise | Debug output, session status, one-off lookups | Discard |

When uncertain: "Would a cold agent reading this six months from now benefit from it?" If no, discard.

---

## Step 2: Route Per BRAIN.md Protocol

Apply the routing rules from `BRAIN.md §Contribution Protocol` (in memory from boot; reload only
if context was cleared). For each durable item:

- Target page exists → append in the appropriate section; bump `updated:` date.
- Target page does not exist → create from `templates/page.md` with real frontmatter.

**References routing:** if the source is a large verbatim artifact, copy it to `references/`,
then add a 1-line entry to `references/_index.md`: name, what it is, when it matters. Create a
distilled knowledge page in `knowledge/` that links to the references entry.

---

## Step 3: Playground Closing Flow

For each playground listed in the journal **Active playgrounds** section:

1. Read the playground directory (`playgrounds/{task-id}/`).
2. Classify its contents per the routing table above.
3. Move durable findings → `knowledge/` pages; procedures → `playbooks/`; lessons → `knowledge/lessons/`; verbatim artifacts → `references/`.
4. Confirm with user: "Playground `{task-id}` consolidated — burn (delete) or archive it?"
   - **Default: burn** — delete the directory entirely.
   - Archive (exception): move to a `playgrounds/archive/` subfolder only if the user explicitly requests it.
5. Remove the playground's entry from `journal/_current.md` Active playgrounds list.

---

## Step 4: Write-Validation Gate

Before marking consolidation complete, verify every new or updated page passes:

- [ ] Frontmatter present: `description:`, `updated:`, `status:` all filled (no `{{placeholders}}`)
- [ ] Page is ≤150 lines; if longer, split into linked sub-pages with `[[wikilinks]]`
- [ ] Page is listed in `knowledge/INDEX.md` (or `playbooks/_index.md` for playbooks) with a 1-line summary
- [ ] `references/_index.md` has a 1-line entry for each file added to `references/`
- [ ] All `[[wikilinks]]` inside the page resolve to real files
- [ ] Filenames are unique kebab-case (no spaces, no camelCase, no duplicates in `knowledge/`)

**Quality rules (apply before writing):**
- [ ] Generalize before persisting — strip incident-specific noise unless it is a transferable lesson
- [ ] No personal opinions, rumors, or blame — professional and verifiable content only
- [ ] No application data (credentials, PII, secrets, raw environment-specific values)

If any check fails, fix before proceeding. Do not skip this gate.

---

## Step 5: Trim Journal

After routing all items:

1. Rewrite `journal/_current.md` keeping only the three canonical sections:
   - **Resume Anchor** — where work stopped, next step, updated active-playground list
   - **Watch List** — open questions and risks (carry forward unresolved items)
   - **Log** — dated one-liners: decisions taken, consolidation events (keep the narrative thread, discard detail)
2. Hard budget: **≤80 lines total**. If still over, trim the Log (oldest entries first).
3. No archive directory — history lives in git and in consolidated knowledge.

---

## Step 6: Bump BRAIN.md

Update the `updated:` field in `BRAIN.md` frontmatter to today's date.

---

## Step 7: Tool Check

If `tools/check.js` exists in the project root: run `node tools/check.js`. Address any errors.
If not available: the write-validation gate in Step 4 serves as the manual equivalent.

---

## Step 8: Report

```
Consolidated:
  - N durable knowledge items → knowledge/ (list pages)
  - N lessons → knowledge/lessons/
  - N playbook entries → playbooks/
  - N artifacts → references/ (list entries added to _index.md)
  - N playground(s) closed: {task-ids} (burned / archived)
  - N items discarded (temporal noise)

Journal trimmed to N lines (budget: 80).
BRAIN.md updated: bumped to {date}.
```

---

## Anti-Patterns

- **Do not persist temporal noise**: debug output is not a knowledge node.
- **Do not create orphan pages**: every page must appear in `knowledge/INDEX.md` or `playbooks/_index.md`.
- **Do not duplicate**: check whether knowledge already exists before creating a new page; prefer appending.
- **Do not route identity/persona content**: the brain has no `identity/` directory. Hard constraints become a `project-constraints.md` knowledge page; behavior rules belong in the harness (AGENTS.md).
- **Do not store verbatim artifacts inline**: large files go to `references/`; knowledge pages hold distilled facts + a link.
