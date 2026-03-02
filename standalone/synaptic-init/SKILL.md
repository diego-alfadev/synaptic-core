---
name: synaptic-init
description: Initialize a Synaptic brain from scratch. Standalone skill — generates the entire .synaptic/ structure via dialogic setup. No prior download needed.
---

# /synaptic-init — Standalone Brain Setup

> This is the standalone version of the Synaptic init skill. It can generate
> a complete `.synaptic/` brain from scratch without needing the seed download.
> Install this single file in your agent's skills directory to get started.

## Overview

SYNAPTIC-CORE is an open standard for portable AI brains. This skill generates
the `.synaptic/` file structure in your project, personalized through a brief
dialogue.

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

Check for existing project files:

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

### Step 3: Dialogic Setup (3-5 questions)

**Q1: Role** — "What's your role? (e.g. 'Backend engineer managing feedback tools at a bank')"

**Q2: Areas** — "What are the main areas, products, or tools you work on?"

**Q3: Principles** — "Any hard rules or constraints I should know?"

**Q4: Contacts** — "Key people you work with?" (can skip)

**Q5: References** — "Any documents or schemas to ingest now?" (can skip)

### Step 4: Generate Brain Structure

Create the following file tree:

```
.synaptic/
├── MANIFEST.md
├── BOOTSTRAP.md
├── identity/
│   ├── ROLE.md
│   ├── PRINCIPLES.md
│   └── CONTACTS.md
├── knowledge/
│   ├── INDEX.md
│   ├── _tree.yaml
│   ├── areas/
│   │   └── [per area from Q2]/
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
    └── help/SKILL.md
```

### Step 5: Populate Files

Fill each file using the user's answers:

**MANIFEST.md:**
```markdown
# SYNAPTIC-CORE Brain Manifest
## Metadata
- **standard**: synaptic-core
- **version**: 0.1.0
- **created**: [today's date]
- **last_modified**: [today's date]
## Identity
- **name**: [from Q1]
- **role**: [from Q1]
## Areas
[from Q2]
## Capabilities
- **tools_available**: false
- **runtime**: none
## Skills
- init, consolidate, ingest, help
```

**BOOTSTRAP.md:** Use the standard bootstrap protocol. Key sections:
- Bootstrap steps (0-4 + Ready)
- Session rhythm (Orient/Work/Persist)
- Memory routing decision tree
- Discovery-first quality gate
- Conflation warnings (3 anti-patterns)
- Available commands
- Size budgets
- Directory map

See the full BOOTSTRAP.md reference at: https://github.com/synaptic-core/synaptic-core

**identity/ROLE.md:** Fill from Q1 answers
**identity/PRINCIPLES.md:** Fill from Q3 answers
**identity/CONTACTS.md:** Fill from Q4 answers (or empty template)
**knowledge/areas/[name]/_overview.md:** One per area from Q2
**_tree.yaml:** Generate from created areas/domains

**Skills:** Generate the standard skill files (init, consolidate, ingest, help) with the standard protocol. These should follow the SYNAPTIC-CORE skill convention.

### Step 6: Ingest Queued References

If user provided files in Q5 or workspace scan found schemas/docs:
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
  - References: [count] ingested
  - Skills: init, consolidate, ingest, help

Next steps:
  - Start working normally — I'll capture decisions in journal/_current.md
  - Run /consolidate when you want to organize captured knowledge
  - Run /ingest FILE to add documents to your brain
  - Run /help for quick reference
```

## Rules

- ONE question at a time
- Be fast: ~5 minutes total
- Scan first, ask second (if workspace has files)
- Always generate `_tree.yaml` at the end
- Include all 4 standard skills in the generated brain
