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
├── worklines/
│   ├── _active.yaml
│   └── archive/
├── cortex.config.yaml
└── skills/
    ├── init/SKILL.md
    ├── plan/SKILL.md
    ├── consolidate/SKILL.md
    ├── ingest/SKILL.md
    ├── discover/SKILL.md
    ├── audit/SKILL.md
    ├── upgrade/SKILL.md
    └── help/SKILL.md
```

### Step 5: Populate Files

**BOOTSTRAP.md** — standard protocol with:
- Bootstrap steps (0-5 + Ready)
- Anti-drift protocol (heartbeat every 3-5 interactions + drift self-detection)
- Smart journaling (trivial = skip, complex = journal)
- Session rhythm (Orient/Work/Persist)
- Memory routing decision tree (with worklines branch)
- Work Mode Detection (Fast vs Planning based on worklines)
- Available commands (init, plan, consolidate, ingest, discover, audit, upgrade, help)

See reference: https://github.com/diego-alfadev/synaptic-core

**HEARTBEAT.md** — condensed from ROLE + PRINCIPLES (~25 lines max):
```markdown
# Heartbeat — Re-read every 3-5 interactions
## Who you are
[2-line role summary]
## Session rules
- Update journal/_current.md BEFORE moving to next task
- Respond in [language], [tone]
- If context is getting long: suggest /consolidate
## Active constraints
[Top 3 constraints from PRINCIPLES]
## Current focus
- Workline: Check worklines/_active.yaml
- Last journal: Check journal/_current.md
## Drift signals — self-check
If 2+ fail, STOP and re-read this file:
- [ ] Am I responding in [language]?
- [ ] Do I remember the user's role and constraints?
- [ ] Have I referenced the brain in my last 3 responses?
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

Detect **all** agent platforms and write bridge files. Be aggressive — create directories if missing.

```
Agent config detection map:
├── .agents/rules/           → Write synaptic.md             (Antigravity / Gemini)
├── .agent/rules/            → Write synaptic.md             (Generic agents)
├── CLAUDE.md                → Append Synaptic section       (Claude Code)
├── .claude/rules/           → Write synaptic.md             (Claude Code rules dir)
├── .cursor/rules/           → Write synaptic.mdc            (Cursor)
├── .windsurf/rules/         → Write synaptic.md             (Windsurf)
├── .github/                 → Append to copilot-instructions.md (GitHub Copilot)
├── AGENTS.md                → Append Synaptic section       (Gemini CLI)
├── CONVENTIONS.md           → Append Synaptic section       (Fallback)
├── .clinerules/             → Write synaptic.md             (Cline / Roo Code)
├── .aider/                  → Write synaptic.md             (Aider)
└── .continue/               → Write synaptic.md             (Continue.dev)
```

- Check ALL paths. Create directory if missing for dir-based configs.
- For root files (CLAUDE.md, AGENTS.md): append section only if file exists.
- For .github/copilot-instructions.md: append only if .github/ exists.

Bridge content (~500 tokens):
```markdown
# Synaptic Brain — Auto-injected by /init

You have a Synaptic brain at `.synaptic/`. This gives you structured, persistent memory.

## At session start
1. Read [.synaptic/BOOTSTRAP.md](.synaptic/BOOTSTRAP.md) — follow the boot protocol
2. You'll load identity, knowledge map, and session state automatically
3. Check for active worklines — offer Planning or Fast mode

## During work
- Route new information using the [Memory Routing Tree](.synaptic/BOOTSTRAP.md) (in BOOTSTRAP.md)
- Every 3-5 responses: re-read [.synaptic/identity/HEARTBEAT.md](.synaptic/identity/HEARTBEAT.md)
- For complex tasks: write plan in [journal/_current.md](.synaptic/journal/_current.md) first

## Before session ends
- Update [journal/_current.md](.synaptic/journal/_current.md) with where you stopped
- If in Planning mode: update workline task status
- If substantial content captured → suggest `/consolidate`

## Available commands
/init, /plan, /consolidate, /ingest, /discover, /upgrade, /help
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
  - Worklines: ready (empty)
  - Agent bridges: [list of paths]
Next steps:
  - /plan to define your first workline (recommended!)
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
- Include all 8 standard skills (init, plan, consolidate, ingest, discover, audit, upgrade, help)
- Generate HEARTBEAT.md with real data and drift signals checklist
- Write system prompt hooks for ALL detected agent platforms
- Create `worklines/_active.yaml` template and `cortex.config.yaml`
