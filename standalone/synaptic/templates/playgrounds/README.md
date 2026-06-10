# Playgrounds

A playground is an extended-journal workspace for tasks that are too big for `journal/_current.md`:
multi-day work, multiple artifacts, analysis, data pulls, drafts, deliverables. No structure is
imposed — use whatever layout the task needs.

## Lifecycle

1. **Open** — create `playgrounds/{{task-id}}/` and register it in `journal/_current.md`.
2. **Work** — artifacts accumulate freely; no required structure.
3. **Consolidate** — durable findings → `knowledge/` pages or `knowledge/lessons/`; procedures →
   `playbooks/`; deliverables shipped.
4. **Burn (default)** — delete the playground after consolidation. Archiving is the exception,
   not the rule.

## Registry

Playgrounds are **not** indexed in `knowledge/INDEX.md`. Their registry is `journal/_current.md`
(the `### Active playgrounds` list). If it's not in the journal, it's invisible.

## Naming

Use the ticket id or a kebab-case slug that identifies the task: `feat-123-auth-refactor`,
`q2-budget-analysis`, `onboarding-pack-may`.
