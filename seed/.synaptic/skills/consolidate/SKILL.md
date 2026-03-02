---
name: consolidate
description: Consolidate working memory (journal) into structured knowledge. Implements the Persist phase of the session rhythm.
---

# /consolidate — Knowledge Consolidation

## Overview

Moves decisions, lessons, and inventory from `journal/_current.md` into the structured knowledge store. This is the **🟠 Persist phase** of the session rhythm.

## When to Run

- User explicitly invokes `/consolidate`
- `journal/_current.md` exceeds ~200 lines (proactively suggest it)
- End of a productive session with multiple decisions/discoveries

## Execution

### Step 1: Read Journal

Read `journal/_current.md`. Identify:
- **Decisions** — choices made ("we decided to use X")
- **Lessons** — things learned ("I discovered that X causes Y")
- **Inventory** — concrete data (IDs, URLs, endpoints, credentials)
- **Identity** — role/principle updates ("from now on, always do X")
- **Temporal noise** — session-specific status, debug output (discard)

### Step 2: Route Using Decision Tree

For each extracted item, apply the memory routing tree:

```
Identity/methodology → identity/ (ROLE.md, PRINCIPLES.md, CONTACTS.md)
Durable knowledge    → knowledge/ (areas/, domains/, lessons/)
Concrete data        → inventory/ (projects.md, environments.md, glossary.md)
Temporal noise       → Discard (don't persist)
```

### Step 3: Discovery-First Check

For each new knowledge node, verify:
- [ ] Title clearly describes the content
- [ ] Node appears in its parent `_overview.md`
- [ ] Summary for `_tree.yaml` is written (one line, <100 chars)
- [ ] A cold-bootstrapping agent would find this via the tree

If a node fails → reconsider title, placement, or whether it should be a new node vs. appending to an existing one.

### Step 4: Write Changes

For each routed item:
1. If target file exists → **append** the new information in the appropriate section
2. If target file doesn't exist → **create** it with proper template structure
3. If updating `_overview.md` → add entry for new nodes

### Step 5: Rebuild Tree

Rebuild `knowledge/_tree.yaml`:
1. Scan all `_overview.md` files in `areas/` and `domains/`
2. Scan all knowledge nodes
3. Generate tree entries with: id, title, summary (one line), path
4. If `tools/build-tree.js` exists → use it instead (zero tokens)

### Step 6: Archive Session

1. Create `journal/archive/{{DATE}}.md` with a summary of what was consolidated
2. Clear `journal/_current.md` — reset to fresh template
3. Update `knowledge/INDEX.md` to reflect any new areas/domains/lessons

### Step 7: Report

Tell the user:
```
Consolidated:
- {{N}} decisions → knowledge/
- {{N}} lessons → knowledge/lessons/
- {{N}} inventory items → inventory/
- {{N}} identity updates → identity/
- {{N}} items discarded (temporal)

Updated _tree.yaml with {{N}} new/modified nodes.
Session archived to journal/archive/{{DATE}}.md
```

## Anti-Patterns to Avoid

1. **Don't consolidate temporal noise** — "Today I debugged X" is NOT a knowledge node unless there's a durable lesson
2. **Don't create orphan nodes** — Every node must be in `_tree.yaml` and at least one `_overview.md`
3. **Don't duplicate** — Check if the knowledge already exists before creating a new node. Update existing nodes when possible
4. **Don't mix identity and knowledge** — "I prefer TypeScript" goes in `PRINCIPLES.md`, not `domains/`
