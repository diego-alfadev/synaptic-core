# Playgrounds

A playground is an extended-journal workspace for tasks that are too big for one row in
`tasks/INDEX.md`: multi-day work, multiple artifacts, analysis, data pulls, drafts, deliverables.
Open one only when the work is **not resumable from the request plus its current state** (a diff, a
document, a spreadsheet); otherwise the task is a single `inline` row. No other structure is imposed.

## Layout

```
playgrounds/<task-id>/
  tasks.md     # Specs / Tasks / Log / Key Learnings (copy of templates/tasks.md)
  <artifacts>  # free layout; consolidate scans these
  scratch/     # intermediates (images, generated files, data pulls): never consolidated unless
               # tasks.md or an artifact references a file in it; local-only, moves with the folder
```

`playgrounds/.gitignore` (`*/scratch/`, `archive/*/*/scratch/`) keeps every `scratch/` out of git history,
live or archived. A synced folder still syncs it.

## Lifecycle

1. **Open** — create `playgrounds/{{task-id}}/` with its `tasks.md`, and register it (below).
2. **Work** — artifacts accumulate freely; keep `tasks.md` current (statuses, Log, Key Learnings).
3. **Consolidate** — run the capture contract: Key Learnings first, then the artifacts. Durable findings → atomic knowledge nodes in the right cluster; repeatable procedures → `type: playbook` node in its cluster; lessons → `knowledge/lessons/`; deliverables shipped.
4. **Close** — after consolidation, with no curation request pending: write the asset manifest into
   `tasks.md`, move the whole folder to `playgrounds/archive/<year>/<task-id>/` and point the row's `home`
   there. Nothing is deleted; `scratch/` assets stay local and ignored, and may be cleaned later with
   `git clean -X` scoped to an archive year. Procedure: the synaptic skill's `references/consolidate.md`.

## Registry

Playgrounds are **not** indexed in `knowledge/INDEX.md`. Their registry is `tasks/INDEX.md` (the first task, inline
or not, creates it from `templates/task-index.md`): one row whose `home` is the playground's `tasks.md`.
An older brain with no `tasks/INDEX.md` keeps the journal's `### Active playgrounds` list until it
adopts the index. If it is in neither, it is invisible.

Formats and status marks: the synaptic skill's `references/contract.md` §6 (Work items).

## Naming

Use the ticket id or a kebab-case slug that identifies the task: `feat-123-auth-refactor`,
`q2-budget-analysis`, `onboarding-pack-may`.
