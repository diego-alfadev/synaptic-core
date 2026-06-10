# /plan — Workline Management Reference

Create or manage worklines (lines of work) and their tasks.
Worklines give the brain direction — lightweight structure for objectives, priorities, and next steps.

---

## Step 1: Detect State

Read `worklines/_active.yaml`.

```
Has active worklines?
├── YES → Present menu (Step 2)
└── NO  → Ask: "What are you working on? Let's define a workline."
          → Jump to Step 3
```

---

## Step 2: Menu (Existing Worklines)

```
Active worklines:
  1. {id}: {summary} ({status}, {open_tasks} open tasks)
  2. ...

Options:
  a) Create a new workline
  b) Add a task to an existing workline
  c) Review / update a workline
  d) Archive a completed workline
```

Route to the corresponding step.

---

## Step 3: New Workline — Brief Interview (3 rounds)

**Round 1 — Objective**
> "What are you working on? What does 'done' look like?"
Probe: "One-time project or ongoing effort?" / "Timeline or urgency?"

**Round 2 — First Steps**
> "What are the first concrete steps? Any blockers or dependencies?"
Probe: "What's the single most important thing to do first?"

**Round 3 — Constraints** (optional — skip if workline is simple)
> "Anything already decided? Anything you explicitly want to NOT do?"

---

## Step 4: Generate Workline Files

```
worklines/{slug}/
├── _meta.md
└── tasks/
    ├── 001-{slug}.md
    └── ...
```

**`_meta.md`** (keep ≤50 lines):
```markdown
# {Workline Title}

## Objective
{What done looks like}

## Context
{Stack, dependencies, constraints}

## Current state
Phase: {initial phase} | Next: {first step}

## Decisions
{Any pre-decided constraints from Round 3}
```

**`tasks/NNN-slug.md`**:
```markdown
# NNN — {Task Title}
- **status**: todo  <!-- todo | in_progress | done | blocked -->
- **created**: {date}
- **workline**: {workline-slug}

## Objective
{Brief description}

## Acceptance criteria
{What "done" looks like}
```

Update `worklines/_active.yaml`: add entry with `id`, `title`, `status`, `priority`, `started`, `last_touched`, `summary`, `open_tasks`.

---

## Step 5: Add Task to Existing Workline

1. Ask: "Describe the task briefly. What does 'done' look like?"
2. Count files in `worklines/{slug}/tasks/` to determine next NNN.
3. Create `tasks/NNN-slug.md`.
4. Increment `open_tasks` in `_active.yaml`.

---

## Step 6: Review / Update Workline

Read `_meta.md` and all task files. Present:

```
Workline: {title} | Status: {status} | Priority: {priority}
  [ ] 001 — {title}
  [→] 002 — {title}   (in_progress)
  [✓] 003 — {title}   (done)

Options: a) Mark task status  b) Update priority/status  c) Edit objective  d) Add notes
```

Apply chosen update to the relevant files. Always update `_active.yaml` after any change.

---

## Step 7: Archive Workline

1. Move `worklines/{slug}/` → `worklines/archive/{slug}/`.
2. Remove entry from `_active.yaml`.
3. Confirm: "Workline archived. Find it in `worklines/archive/{slug}/`."

---

## Rules

- Keep `_meta.md` under 50 lines — focused, not exhaustive.
- If the user gives 1 task, create 1 task file. Do not invent extras.
- Always update `_active.yaml` after any change.
- v0.4 has no knowledge tree file or separate manifest — navigation is through `knowledge/INDEX.md` only.
- Journal entries may reference the active workline: `[workline:{slug}/task:{NNN}]`.
