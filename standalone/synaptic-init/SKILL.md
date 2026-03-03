---
name: synaptic-init
description: Initialize a Synaptic brain from scratch. Standalone skill — generates the entire .synaptic/ structure via Socratic dialogic setup. No prior download needed.
---

# /synaptic-init — Standalone Brain Setup

> This is the standalone version of the Synaptic init skill. It generates
> a complete `.synaptic/` brain from scratch without needing any download.
> Install this single file in your agent's skills directory to get started.

## Overview

SYNAPTIC-CORE is an open standard for portable AI brains. This skill generates
the `.synaptic/` file structure in your project, personalized through a brief
Socratic dialogue.

Learn more: https://github.com/diego-alfadev/synaptic-core

## Prerequisites

- An AI agent that can read/write files (Claude Code, Antigravity, Cursor, Copilot, etc.)
- A project folder to host the brain

## Execution

### Step 1: Check for Existing Brain

```
Does .synaptic/ exist?
├── YES → "A Synaptic brain already exists. Use /init inside it to extend."
│         Stop. (The brain's own /init skill handles extension.)
│
└── NO  → Continue to Step 2
```

### Step 2: Scan Workspace

Check for existing project files before asking questions (**scan first, ask second**):

| Look for | What it tells us |
|----------|-----------------|
| `README.md` | Project description, stack |
| `package.json` / `requirements.txt` / `go.mod` | Tech stack |
| `.agent/` / `.claude/` / `.cursor/` | Existing agent config |
| `docs/` | Documentation |
| `*.ddl` / `*.sql` / `schema.*` | Database schemas |

If project files found:
- Present findings: "I see [description]. Want me to incorporate this?"
- If yes: queue files for ingestion after brain creation

### Step 3: Socratic Interview

Use a natural, conversational style. Ask **1-2 questions at a time**, reference
previous answers, push back gently on assumptions, and be concrete rather than
abstract. Go beyond the obvious — ask questions the user wouldn't think to mention.

**Round 1: Role & Context**

> "What's your role and work context?"

Then probe deeper with one non-obvious follow-up:
- "What's the hardest part of your day-to-day that better context would help with?"
- "If a new colleague inherited your work tomorrow, what would be hardest to transfer?"

**Round 2: Work Areas**

> "What are the main areas, products, or tools you work on?"

Then: "Which of these has the most 'tribal knowledge' — stuff in your head but not written down?"

**Round 3: Principles & Work Operatives**

> Q3a: "Any hard rules or constraints?"
> Q3b: "Work processes or rituals I should know about?"
> Q3c: "Anything that should NEVER be done?"

**Round 4: Contacts & Routing** (optional)

> "Who are the key people for specific topics?"

If names given: "For each — what's their role, and how should I reach them?"

**Round 5: References** (optional)

> "Any existing documents, schemas, or specs to bring in?"

### Step 4: Generate Brain Structure

Create the following file tree:

```
.synaptic/
├── MANIFEST.md
├── BOOTSTRAP.md
├── identity/
│   ├── ROLE.md
│   ├── PRINCIPLES.md
│   └── CONTACTS.md          ← YAML format with Quick Lookup
├── knowledge/
│   ├── INDEX.md
│   ├── _tree.yaml
│   ├── areas/
│   │   └── [per area from Round 2]/
│   │       └── _overview.md
│   ├── domains/
│   └── lessons/
│       └── _overview.md
├── inventory/
│   ├── projects.md
│   ├── environments.md
│   └── glossary.md
├── references/
│   └── _index.md
├── journal/
│   ├── _current.md
│   └── archive/
└── skills/
    ├── init/SKILL.md
    ├── consolidate/SKILL.md
    ├── ingest/SKILL.md
    ├── discover/SKILL.md
    └── help/SKILL.md
```

### Step 5: Populate Files

Fill each file using the user's answers:

**MANIFEST.md** — brain metadata with version, areas, skills list, and Skill Triggers section.

**BOOTSTRAP.md** — the standard bootstrap protocol containing:
- Bootstrap steps (0-4 + Ready)
- Session rhythm (Orient/Work/Persist)
- Memory routing decision tree
- Discovery-first quality gate
- Conflation warnings (3 anti-patterns)
- Available commands (init, consolidate, ingest, discover, help)
- Size budgets
- Directory map

See the full BOOTSTRAP.md reference at: https://github.com/diego-alfadev/synaptic-core

**identity/ROLE.md** — role, expertise, communication style from Round 1
**identity/PRINCIPLES.md** — constraints, processes, prohibitions from Round 3
**identity/CONTACTS.md** — YAML format with Quick Lookup routing table from Round 4:

```yaml
routing:
  - topic: "Topic area"
    person: "Name"
    channel: slack | email | teams | in-person

people:
  - name: "Name"
    role: "Role"
    team: "Team"
    relation: "Relationship"
    context: "What they own/know"
    channel: preferred contact method
    notes: "Useful context"
```

**knowledge/** — INDEX.md, _tree.yaml, area overviews from Round 2
**Skills** — generate the 5 standard skills (init, consolidate, ingest, discover, help)

### Step 6: Ingest Queued References

If user provided files in Round 5 or workspace scan found schemas/docs:
- Copy to `references/`
- Extract knowledge nodes
- Update `_tree.yaml`

### Step 7: Report

```
🧠 Synaptic brain initialized!

Created .synaptic/ with:
  - Role: [summary]
  - Areas: [list]
  - Principles: [count] defined
  - Contacts: [count] people
  - References: [count] ingested
  - Skills: init, consolidate, ingest, discover, help

Next steps:
  - Start working — I'll capture decisions in journal/_current.md
  - /consolidate to organize captured knowledge
  - /ingest FILE to add documents
  - /discover to find useful skills for your context
  - /help for quick reference
```

## Rules

- ONE or TWO questions at a time, never a barrage
- Reference previous answers — build on what the user said
- Be fast: ~5 minutes total
- Scan first, ask second (if workspace has files)
- Always generate `_tree.yaml` at the end
- Include all 5 standard skills in the generated brain
- Use YAML format for CONTACTS.md
