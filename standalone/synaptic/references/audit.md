# /audit — Brain Health Audit Reference

Cross-session review for staleness, orphan pages, broken links, budget violations, naming
violations, and stale playgrounds. Run when: user asks to audit, after several sessions, or
when the brain feels off.

---

## Step 1: Staleness Pass

Scan all pages under `knowledge/` and `playbooks/`:

- Flag any page where `updated:` date is more than 90 days ago.
- Flag any page with `status: stale`.

For each flagged page: note the staleness age and the likely section to review.
Do **not** auto-update pages — present findings first and ask before changing anything.

---

## Step 2: Orphan Detection

Read `knowledge/INDEX.md` and `playbooks/_index.md`. Then scan all `.md` files in `knowledge/`
and `playbooks/`:

- Any `.md` file not listed in INDEX.md (or `_index.md`) is an **orphan**.
- List orphans with their path. Ask: "Register in INDEX.md, move, or delete?"

---

## Step 3: Broken Wikilinks

Scan all pages for `[[wikilink]]` patterns. For each link:

- Resolve: does a file with that name exist in `knowledge/`?
- Flag unresolved links as broken. Note source page and broken target.

Do not auto-fix — surface the list and let the user decide (create the target, rename, or
remove the link).

---

## Step 4: Budget Violations

Read budgets from `BRAIN.md` frontmatter (`budgets:` block). Defaults if absent: journal 80,
page 150, brain 100.

- `BRAIN.md` — must be ≤ `budgets.brain` lines. Flag if exceeded.
- `journal/_current.md` — must be ≤ `budgets.journal` lines (80). Flag if exceeded; suggest `/consolidate`.
- Any `knowledge/` page — soft limit `budgets.page` lines (150). Flag pages exceeding this; suggest splitting.

---

## Step 5: References Index Accuracy

Read `references/_index.md`. For each entry in the index:

- Does the referenced file actually exist in `references/`?
- Flag entries pointing to missing files (phantom entries).

Also scan `references/` for files that have **no entry** in `_index.md`:

- Flag unindexed files as orphan references. Ask: "Add to _index.md or remove?"

---

## Step 6: Stale Playground Nudge

Read the **Active playgrounds** list in `journal/_current.md`. For each playground:

- Check the `playgrounds/{task-id}/` directory. If the most recent file modification is
  older than ~30 days, flag it.
- Nudge: "Playground `{task-id}` has been open for 30+ days — consolidate findings and burn, or is it still active?"

Do not delete automatically.

---

## Step 7: Naming Convention Check

Scan filenames in `knowledge/`:

- Flag any filename that is not kebab-case (contains spaces, uppercase, or underscores other than `_index`).
- Flag any duplicate base names (same stem, different extension).

---

## Step 8: Brain Context Staleness

Read the **Brain Context** section in `BRAIN.md` (the 2–4 lines describing what the brain covers
and the owner's role in this project):

- Is this description still accurate given the knowledge pages that exist?
- Flag if the Brain Context appears significantly out of date relative to current knowledge.

(There is no identity directory — this check replaces the v0.4 identity-drift check.)

---

## Step 9: Report

Present findings as an actionable checklist, grouped by category. Maximum 10 findings;
prioritise by impact.

```
Brain audit — N findings:

## Stale pages (>90 days or status: stale)
1. knowledge/foo.md — last updated YYYY-MM-DD (NNN days ago)

## Orphan pages (not in INDEX.md)
2. knowledge/bar.md — not registered
   → Register, move, or delete?

## Broken wikilinks
3. knowledge/baz.md [[missing-page]] — target not found
   → Create target, rename, or remove link?

## Budget violations
4. journal/_current.md — 94 lines (limit: 80)
   → Run /consolidate

## References _index.md issues
5. references/_index.md lists "schema-v2.ddl" — file not found
   → Remove phantom entry or restore file?

## Stale playgrounds
6. playgrounds/feat-42-auth/ — last modified 2026-04-10 (>30 days open)
   → Consolidate and burn, or still active?

## Naming violations
7. knowledge/MyFeature.md — not kebab-case
   → Rename to my-feature.md?

## Brain Context staleness
8. Brain Context describes "analytics platform" but 70% of knowledge pages are about auth
   → Update Brain Context?
```

Ask: "Apply all? Or pick specific items?" — do not make changes without confirmation.
