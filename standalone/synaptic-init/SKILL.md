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
│         Stop.
└── NO  → Continue to Step 2
```

### Step 2: Scan Workspace

Check for existing project files (**scan first, ask second**):

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

Ask **1-2 questions at a time**, reference previous answers, push back gently, be concrete.

**Round 1: Role & Context**
> "What's your role and work context?"
Then a non-obvious follow-up.

**Round 2: Work Areas**
> "What are the main areas, products, or tools you work on?"
Then: "Which has the most tribal knowledge?"

**Round 3: Principles & Operatives**
> Q3a: "Any hard rules or constraints?"
> Q3b: "Work processes or rituals I should know?"
> Q3c: "Anything that should NEVER be done?"

**Round 4: Contacts** (optional)
> "Who are the key people for specific topics?"

**Round 5: References** (optional)
> "Any existing documents, schemas, or specs to bring in?"

### Step 4: Generate Brain Structure

```
.synaptic/
├── MANIFEST.md
├── BOOTSTRAP.md
├── identity/
│   ├── ROLE.md
│   ├── PRINCIPLES.md
│   ├── CONTACTS.md          ← YAML format with Quick Lookup
│   └── HEARTBEAT.md         ← Condensed identity (anti-drift)
├── knowledge/
│   ├── INDEX.md
│   ├── _tree.yaml
│   ├── areas/[per area]/
│   │   └── _overview.md
│   ├── domains/
│   └── lessons/_overview.md
├── inventory/
│   ├── projects.md
│   ├── environments.md
│   └── glossary.md
├── references/_index.md
├── journal/
│   ├── _current.md
│   └── archive/
└── skills/
    ├── init/SKILL.md
    ├── consolidate/SKILL.md
    ├── ingest/SKILL.md
    ├── discover/SKILL.md
    ├── audit/SKILL.md
    └── help/SKILL.md
```

### Step 5: Populate Files

**BOOTSTRAP.md** — standard protocol with:
- Bootstrap steps (0-4 + Ready)
- Anti-drift protocol (heartbeat + forced journaling)
- Session rhythm (Orient/Work/Persist)
- Memory routing decision tree
- Available commands (init, consolidate, ingest, discover, audit, help)

See reference: https://github.com/diego-alfadev/synaptic-core

**HEARTBEAT.md** — condensed from ROLE + PRINCIPLES (~20 lines max):
```markdown
# Heartbeat — Re-read after each major task
## Who you are
[2-line role summary]
## Session rules
- Update journal/_current.md BEFORE moving to next task
- Respond in [language], [tone]
- If context is getting long: suggest /consolidate
## Active constraints
[Top 3 constraints from PRINCIPLES]
```

**CONTACTS.md** — YAML format:
```yaml
routing:
  - topic: "Topic"
    person: "Name"
    channel: method
people:
  - name: "Name"
    role: "Role"
    team: "Team"
    relation: "Relationship"
    context: "What they own"
    channel: contact method
    notes: "Context"
```

### Step 6: System Prompt Hook

Detect agent platform and write a bridge file:

```
.agent/     → Write .agent/rules/synaptic.md
.claude/    → Write .claude/rules/synaptic.md
.cursor/    → Write .cursor/rules/synaptic.mdc
None found  → Skip (tell user to add manually)
```

Content (~4 lines):
```markdown
# Synaptic Brain
You have a Synaptic brain at .synaptic/.
At session start: read .synaptic/BOOTSTRAP.md and follow the protocol.
After each major task: re-read .synaptic/identity/HEARTBEAT.md.
```

### Step 7: Report

```
🧠 Brain initialized!
Created .synaptic/ with:
  - Role: [summary]
  - Areas: [list]
  - Principles: [count] defined
  - Contacts: [count] people
  - References: [count] ingested
  - Agent bridge: [path]
Next steps:
  - /consolidate to organize knowledge
  - /audit to review what's missing
  - /discover to find useful skills
  - /help for quick reference
```

## Rules

- 1-2 questions at a time, never a barrage
- Reference previous answers
- ~5 minutes total
- Scan first, ask second
- Always generate `_tree.yaml`
- Include all 6 standard skills
- Generate HEARTBEAT.md with real data
- Write system prompt hook if agent config detected
