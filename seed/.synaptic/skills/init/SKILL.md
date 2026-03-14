---
name: init
description: Initialize or extend a Synaptic brain. Handles fresh setup, existing project detection, and brain extension. Uses Socratic interview patterns to surface non-obvious context.
---

# /init — Brain Setup

## Overview

This skill creates or extends a `.synaptic/` brain. It handles 3 scenarios:
- **Scenario A**: Fresh brain + fresh project (empty workspace)
- **Scenario B**: Fresh brain + existing project (workspace has code/docs)
- **Scenario C**: Extend existing brain (`.synaptic/` already exists)

## Execution

### Step 1: Detect Scenario

```
Check: does .synaptic/ exist in the current workspace?
├── NO → Check: do project files exist (README, package.json, src/, docs/, .agent/)?
│   ├── YES → Scenario B (Fresh brain + existing project)
│   └── NO  → Scenario A (Fresh brain + fresh project)
│
└── YES → Scenario C (Extend existing brain)
```

### Step 2A: Fresh Brain + Fresh Project

Run the **Dialogic Interview** below.

### Step 2B: Fresh Brain + Existing Project

**Workspace Scan**:

1. List top-level directory structure
2. Look for key files:
   - `README.md` → Extract project description, stack, purpose
   - `package.json` / `requirements.txt` / `go.mod` → Detect stack
   - `.agent/` / `.claude/` / `.cursor/` → Existing agent config
   - `docs/` → Existing documentation
   - `*.ddl` / `*.sql` / `schema.*` → Database schemas
   - `*.yaml` / `*.json` (API specs) → API definitions

3. Present findings to user:
   "I found: [description]. Want me to incorporate this?"

4. If yes: queue files for ingestion after brain creation

5. Then: Run the **Dialogic Interview** below, **skipping** anything already auto-detected

### Step 2C: Extend Existing Brain

Read `MANIFEST.md` to understand current state. Present options:

```
Brain exists: {{NAME}} v{{VERSION}} ({{N}} areas, {{M}} domains)

What would you like to do?
  a) Add a new work area
  b) Add a new domain
  c) Ingest new documents
  d) Update identity (role, principles, contacts)
  e) Re-scan workspace for new project files
```

Execute the chosen option, then update `MANIFEST.md` and rebuild `_tree.yaml`.

---

## Dialogic Interview

### Interview Style (Socratic — from think-through + feature-interview)

- Ask **1-2 focused questions** at a time, never a barrage
- Reference previous answers — build on what the user said
- Push back gently: "Have you considered..." / "What about..."
- Be **concrete**, not abstract: "So when a new team member joins..." not "How about onboarding?"
- If the user seems uncertain, offer options: "We could A, B, or C — what resonates?"
- **Go beyond the obvious** — ask questions the user wouldn't think to mention
- Validate productive insights: "That's a good point about..."
- Be comfortable with "I don't know" answers — they're data too

### Question Flow

**Round 1: Role & Context** (always ask)

> Q1: "What's your role and work context?"

Then probe deeper with **one** non-obvious follow-up:
- "What's the hardest part of your day-to-day that better context would help with?"
- "If a new colleague inherited your work tomorrow, what would be hardest to transfer?"
- "What information do you find yourself explaining repeatedly?"

→ Write `identity/ROLE.md`

**Round 2: Work Areas** (always ask)

> Q2: "What are the main areas, products, or tools you work on?"

Then probe:
- "Which of these areas has the most 'tribal knowledge' — stuff that's in your head but not written down?"
- "Are there areas where you depend on specific people's knowledge?"

→ Create `knowledge/areas/[name]/_overview.md` for each

**Round 3: Principles & Work Operatives** (always ask)

> Q3a: "Any hard rules or constraints in your work?"
> Q3b: "Are there work processes or rituals I should know about?"
> Q3c: "Is there anything that should NEVER be done?"

→ Write `identity/PRINCIPLES.md`

**Round 4: Contacts & Routing** (optional but valuable)

> Q4: "Who are the key people for specific topics?"

If the user gives names, ask:
- "For each person — what's their role, and how should I reach them?"
- "Anyone I should loop in before making certain decisions?"

→ Write `identity/CONTACTS.md` (YAML format with Quick Lookup)

**Round 5: References & Assets** (optional)

> Q5: "Any existing documents, schemas, or specs to bring in?"

→ Run `/ingest` for each → `references/` + knowledge nodes

### When to Stop

Stop when:
- The user has provided enough context for a useful brain (~3-5 rounds)
- Further questions feel repetitive or speculative
- The user signals they want to move forward
- You have at least: role, 1+ areas, and some principles

---

### Step 3: Generate Files

After the interview, generate all brain files:

1. `MANIFEST.md` — with real data (no placeholders)
2. `BOOTSTRAP.md` — standard copy
3. `cortex.config.yaml` — default settings
4. `identity/ROLE.md`, `PRINCIPLES.md`, `CONTACTS.md` — from interview
5. `identity/HEARTBEAT.md` — condensed from ROLE + PRINCIPLES (keep under 25 lines), including drift signals checklist
6. `knowledge/INDEX.md`, `_tree.yaml` — from areas/domains
7. `knowledge/areas/[name]/_overview.md` — per area
8. `inventory/` templates
9. `references/_index.md`
10. `journal/_current.md` — fresh
11. `worklines/_active.yaml` — empty template
12. `worklines/archive/` — empty directory
13. `skills/` — all 8 standard skills (init, plan, consolidate, ingest, discover, audit, upgrade, help)

### Step 4: System Prompt Hook (Agent Bridge)

Detect **all** agent platforms in the workspace and write bridge files. Be aggressive — if the directory doesn't exist, **create it**.

```
Agent config detection map:
├── .agents/rules/           → Write synaptic.md             (Antigravity / Gemini)
├── .agent/rules/            → Write synaptic.md             (Generic agents)
├── CLAUDE.md                → Append Synaptic section       (Claude Code, root file)
├── .claude/rules/           → Write synaptic.md             (Claude Code, rules dir)
├── .cursor/rules/           → Write synaptic.mdc            (Cursor)
├── .windsurf/rules/         → Write synaptic.md             (Windsurf)
├── .github/                 → Append to copilot-instructions.md (GitHub Copilot)
├── AGENTS.md                → Append Synaptic section       (Gemini CLI / generic)
├── CONVENTIONS.md           → Append Synaptic section       (Fallback)
├── .clinerules/             → Write synaptic.md             (Cline / Roo Code)
├── .aider/                  → Write synaptic.md             (Aider)
└── .continue/               → Write synaptic.md             (Continue.dev)
```

**Behavior**:
- Check ALL paths, not just the first match. A workspace may have multiple agent configs.
- For directory-based configs (`.agent/rules/`, `.cursor/rules/`, etc.): create the directory if missing, write the bridge file.
- For root files (`CLAUDE.md`, `AGENTS.md`, `CONVENTIONS.md`): if file exists, append a `## Synaptic Brain` section. If not, don't create the root file (it may confuse the agent platform).
- For `.github/copilot-instructions.md`: append only if `.github/` exists.
- Always tell the user which bridges were written.

**Bridge file content** (~500 tokens):

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
- If you feel like you're drifting: STOP and re-read [HEARTBEAT.md](.synaptic/identity/HEARTBEAT.md)
- For complex tasks: write plan in [journal/_current.md](.synaptic/journal/_current.md) first

## Before session ends
- Update [journal/_current.md](.synaptic/journal/_current.md) with where you stopped and what's next
- If in Planning mode: update workline task status
- If substantial content captured → suggest `/consolidate`

## Available commands
/init, /plan, /consolidate, /ingest, /discover, /audit, /upgrade, /help
```

Tell the user: "I've added bridges in [paths] so agents will automatically connect to the brain each session."

### Step 5: Ingest Queued References

If user provided files in Q5 or workspace scan found schemas/docs:
- `/ingest` each file
- Update `_tree.yaml`

### Step 6: Report

```
🧠 Brain initialized!

Created .synaptic/ with:
  - Role: [summary]
  - Areas: [list]
  - Principles: [count] defined
  - Contacts: [count] people
  - References: [count] ingested
  - Worklines: ready (empty)

Agent bridges: [list of paths written]

Next steps:
  - Start working — I'll capture decisions in journal/_current.md
  - /plan to define your first workline (recommended!)
  - /consolidate to organize captured knowledge
  - /ingest FILE to add documents
  - /discover to find useful skills for your context
  - /audit to review what's missing
  - /help for quick reference
```
