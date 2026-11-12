# Work items — proposals, tasks and playgrounds

*What this is: a plain explainer, for people, of how a Synaptic brain (engine 1.7) records work: ideas
not yet committed to (proposals), work to do (tasks), and room for large work (playgrounds). The agent-facing
rules live in the skill's `references/contract.md` §6; where this page and the contract differ, the contract wins.*

## The pipeline

```
proposals/INDEX.md   ── promote ──▶   tasks/INDEX.md   ── grows large ──▶   playgrounds/<id>/tasks.md
(candidates)                          (every task, one row)                 (only when the resume test fails)
```

Each stage is an **index table plus a folder only for the items that need more than a row**. Nothing
exists until it is used: a new brain has no `proposals/` and no `tasks/`; the first proposal or task
creates its index.

- **Proposals** (`P1`, `P2`, …) are candidates someone may want to do later. The agent may add a row
  (in the default autonomy tiers); only you promote or drop one.
- **Tasks** (`T1`, `T2`, …) are work to do or in flight. Every task is one row in `tasks/INDEX.md`, whether
  the row is the whole task or points at a larger home.
- **Playgrounds** are folders for work too large for a row.

Ids are never reused or renumbered; a finished or dropped row keeps its id. Every row uses the same three
marks: `[ ]` open, `[x]` done (only with proof: a path, a result, a link), `[-]` dropped (always with a
reason). A tick never approves an action the autonomy tiers gate. A row not updated for 14 days (or the
brain's `stale_after`) is stale.

## The resume test: row or playground?

A task gets a playground with a `tasks.md` only when it **cannot** be resumed from the original request
plus the work's current state (a diff, a document, a spreadsheet). Otherwise it stays one `inline` row.
Most tasks are rows. The test assumes no git and no particular workflow.

## Inside a playground

```
playgrounds/t3-cost-review/
├── tasks.md      # header · Specs (quoted from the requester) · Tasks · Log (append-only) · Key Learnings
├── analysis.md   # artifacts: tracked like any file
└── scratch/      # local-only assets: images, generated files, data pulls
```

`scratch/` is never committed: in a git brain, `playgrounds/.gitignore` holds `*/scratch/` and
`archive/*/*/scratch/`, which ignore it in live and archived playgrounds. Anything outside `scratch/` is
tracked. Task ids inside a `tasks.md` are local to that file; from outside it they are written `T3/T1`.

**Closing does not delete anything.** After consolidation, and on your OK, the agent writes an **asset
manifest** (each `scratch/` file's name and size) into `tasks.md`, moves the whole folder to
`playgrounds/archive/<year>/<id>/`, and closes the row with its proof and the new `home`. The assets stay
on the machine that produced them; the manifest tells a reader elsewhere that they existed. You may
later free disk with `git clean -X` scoped to one archive year; the record stays.

## Promotion needs your approval

Turning a proposal into a task is propose-then-approve. On your yes, the agent takes the next free
`T<n>`, writes the task row with `from: P<n>`, marks the proposal `[x]` with `to: T<n>`, and stamps both
rows. Approving the promotion does not approve the work itself.

## Task files another tool owns

If a harness such as ODD already keeps task files (`odd/tasks/<feature>.md`), the brain does not copy
them. You decide once, at init or when such files first appear, who owns task files; the answer is one
line in `BRAIN.md`: `Task files: brain`, or `Task files: owned by ODD at odd/tasks/*.md`. In that
**external-owner mode** the brain keeps one row whose `home` is the external file, read in place and
never reformatted. A playground for that work holds analysis only. A file without checkboxes shows
progress as "not stated", never 0 of 0. At close the external file is not moved: its record stays with
its owner.

## A worked example

`tasks/INDEX.md` in a brain upgraded from 1.6:

```markdown
| id | status | title | home | from | note | updated |
|---|---|---|---|---|---|---|
| T1 | [ ] | Vendor comparison | playgrounds/vendor-comparison/ | — |  | 2026-11-01 |
| T2 | [x] | Fix the staging DNS entry | inline | — | registries/environments.md, row "staging" | 2026-11-03 |
| T3 | [ ] | Quarterly cost review | playgrounds/t3-cost-review/tasks.md | P1 |  | 2026-11-08 |
| T4 | [ ] | Search filters | odd/tasks/search-filters.md | — |  | 2026-11-05 |
```

- **T1** is a legacy playground from the 1.6 journal, registered when the upgrade created the index:
  its `home` is the folder, which has no `tasks.md`.
- **T2** is an inline task: the row is the task, done with its proof in `note`.
- **T3** failed the resume test, so it has a playground with a `tasks.md`; it was promoted from `P1`.
- **T4** lives in ODD's file; `tools/check.js` lists that home as unverified (outside the brain), never
  as an error.

## Coming from 1.6: adopting gradually

In 1.6, playgrounds were listed only in the journal's *Active playgrounds* section and removed at close.
Adoption is per brain, at your pace, and never strands old work:

1. When the journal lists active playgrounds, `/synaptic-upgrade` offers to create `tasks/INDEX.md`. If
   you decline, nothing changes until the first task creates the index anyway. You can also ask to adopt
   at any time.
2. Whenever the index is first created, each playground the journal lists (and that still exists on
   disk) becomes an open legacy row with `home: playgrounds/<id>/`, like T1 above. Its folder is not
   touched. The journal list becomes one pointer line to `tasks/INDEX.md`.
3. New work uses the new shape. Converting a legacy playground to a `tasks.md` is optional, one item at
   a time, and only when you ask.
4. When you close a legacy playground, the whole folder moves to the archive like any other; its close
   line and asset manifest go in a new `CLOSED.md`, since it has no `tasks.md`.

**Check the ignore rule before your first close.** In a git brain, `playgrounds/.gitignore` must contain
both `*/scratch/` and `archive/*/*/scratch/`. A 1.6 brain usually has no such file; the upgrade creates
it or adds the missing line. Without the second line, the next commit after a close records the archived
scratch assets, which cannot be undone without rewriting history.

---

See also: [Capture is a dial — and the consolidation formula](./capture-and-consolidation.md) ·
[Matrioshka architecture](./architecture-matrioshka.md) (directory layout) ·
[Upgrade guide](../../UPGRADING.md).
