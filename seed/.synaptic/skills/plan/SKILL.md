---
name: plan
description: Create or manage worklines (lines of work) and tasks. Use when the user wants to plan a project, track work direction, or break down objectives into tasks. Invoke with /plan.
---

# /plan — Workline Management

## Overview

Worklines give the brain **direction**. They're not a full task manager — they're a lightweight structure that helps the agent understand where you're going, what the next steps are, and how to prioritize.

Use `/plan` to:
- Create a new workline (line of work)
- Add tasks to an existing workline
- Review and update workline status
- Archive completed worklines

## Execution

### Step 1: Detect State

```
Read worklines/_active.yaml
├── Has active worklines?
│   └── YES → Present menu (Step 2B)
└── NO (empty or file missing)
    └── Ask: "What are you working on? Let's define a workline."
        → Go to Step 3 (New Workline)
```

### Step 2B: Menu (existing worklines)

```
Active worklines:
  1. [workline-1]: [summary] ([status], [open_tasks] tasks)
  2. [workline-2]: [summary] ([status], [open_tasks] tasks)

What would you like to do?
  a) Create a new workline
  b) Add a task to an existing workline
  c) Review/update a workline
  d) Archive a completed workline
```

Route to the appropriate step based on user choice.

### Step 3: New Workline (Socratic Interview)

Brief, focused interview (~3 rounds).

**Round 1: Objective**
> "What are you working on? What does 'done' look like?"

Probe:
- "Is this a one-time project or an ongoing effort?"
- "What's the timeline or urgency?"

**Round 2: First Steps**
> "What are the first concrete steps? Are there blockers or dependencies?"

Probe:
- "What's the single most important thing to do first?"
- "Is there anything you're waiting on from someone else?"

**Round 3: Constraints & Decisions**
> "Anything already decided? Anything you want to explicitly NOT do?"

This round is optional — skip if the workline is simple.

### Step 4: Generate Workline Files

After the interview, create:

1. **Directory**: `worklines/{workline-slug}/`
2. **Meta file**: `worklines/{workline-slug}/_meta.md`

```markdown
# {Workline Title}

## Objective
[What the user described as the goal]

## Context
[Stack, dependencies, constraints — from interview]

## Current state
Phase: [initial phase] | Next: [first step]

## Decisions
[Any decisions already made — from Round 3]
```

3. **Task files**: `worklines/{workline-slug}/tasks/NNN-slug.md` for each identified step:

```markdown
# NNN — {Task Title}
- **status**: todo  <!-- todo | in_progress | done | blocked -->
- **created**: {date}
- **workline**: {workline-slug}

## Objective
[Brief description]

## Acceptance criteria
[What "done" looks like for this task — if provided]
```

4. **Update `_active.yaml`**: add the new workline entry with proper metadata

### Step 5: Add Task (to existing workline)

When adding a task to an existing workline:

1. Ask: "Describe the task briefly. Is there a clear definition of 'done'?"
2. Count existing tasks in `worklines/{slug}/tasks/` to determine next NNN
3. Create `tasks/NNN-slug.md`
4. Update `_active.yaml` (increment `open_tasks`)

### Step 6: Review/Update Workline

When reviewing:

1. Read `_meta.md` and all task files
2. Present:
```
Workline: {title}
Status: {status} | Priority: {priority}
Open tasks: {count}

  [ ] 001 — {title} (todo)
  [→] 002 — {title} (in_progress)
  [✓] 003 — {title} (done)

What would you like to update?
  a) Mark a task as done / in progress / blocked
  b) Update workline priority or status
  c) Edit the objective or context
  d) Add notes to a task
```

3. Apply the chosen update to the relevant files

### Step 7: Archive Workline

When archiving:

1. Move `worklines/{slug}/` to `worklines/archive/{slug}/`
2. Remove the entry from `_active.yaml`
3. Tell the user: "Workline archived. You can still find it in `worklines/archive/`."

---

## Integration with Session Rhythm

- **Planning mode**: When the user selects a workline during bootstrap Step 5, the agent loads `_meta.md` and active tasks. Work is tracked against tasks.
- **Journal linking**: During Planning mode, journal entries in `_current.md` should reference the active workline and task: `[workline:proyecto-recredit/task:002]`
- **Persist phase**: Before session ends in Planning mode, update task progress in `worklines/`.

## Rules

- Keep `_meta.md` under 50 lines — focused, not exhaustive
- Task files should be short — objective + acceptance criteria + progress notes
- Don't over-structure: if the user gives 1 task, create 1 task file (don't invent extras)
- Reference the interview: build on what the user said, don't add assumptions
- Always update `_active.yaml` after any change
