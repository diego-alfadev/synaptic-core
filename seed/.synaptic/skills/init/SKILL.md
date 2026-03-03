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

**Workspace Scan** (validated by GSD's `map-codebase` pattern):

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

### Interview Style (from think-through + feature-interview patterns)

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
> (e.g. 'Backend engineer managing feedback tools at a bank')

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
> (e.g. 'Always TypeScript', 'GDPR compliant', 'No direct prod access')

> Q3b: "Are there work processes or rituals I should know about?"
> (e.g. 'Sprint planning Mondays', 'PRs need 2 approvals', 'No deploys on Fridays')

> Q3c: "Is there anything that should NEVER be done?"
> (e.g. 'Never modify the auth module without Thomas', 'Never use ORM for batch operations')

→ Write `identity/PRINCIPLES.md`

**Round 4: Contacts & Routing** (optional but valuable)

> Q4: "Who are the key people for specific topics?"
> (e.g. 'Thomas Jensen for CI/CD', 'Anna for database questions')

If the user gives names, ask:
- "For each person — what's their role, and how should I reach them?"
- "Anyone I should loop in before making certain decisions?"

→ Write `identity/CONTACTS.md` (YAML format with Quick Lookup)

**Round 5: References & Assets** (optional)

> Q5: "Any existing documents, schemas, or specs to bring in?"
> (e.g. 'Our database DDL', 'The API spec', 'Team wiki export')

→ Run `/ingest` for each → `references/` + knowledge nodes

### When to Stop

Stop when:
- The user has provided enough context for a useful brain (~3-5 rounds)
- Further questions feel repetitive or speculative
- The user signals they want to move forward
- You have at least: role, 1+ areas, and some principles

Don't stop too early — a thorough init takes **3-5 minutes**, not 30 seconds.

---

### Step 3: Generate Files

After the interview, generate all brain files:

1. `MANIFEST.md` — with real data (no placeholders)
2. `BOOTSTRAP.md` — standard copy
3. `identity/ROLE.md`, `PRINCIPLES.md`, `CONTACTS.md` — from interview
4. `knowledge/INDEX.md`, `_tree.yaml` — from areas/domains
5. `knowledge/areas/[name]/_overview.md` — per area
6. `inventory/` templates
7. `references/_index.md`
8. `journal/_current.md` — fresh
9. `skills/` — all 4 standard skills + discover

### Step 4: Ingest Queued References

If user provided files in Q5 or workspace scan found schemas/docs:
- `/ingest` each file
- Update `_tree.yaml`

### Step 5: Report

```
🧠 Brain initialized!

Created .synaptic/ with:
  - Role: [summary]
  - Areas: [list]
  - Principles: [count] defined
  - Contacts: [count] people
  - References: [count] ingested

Next steps:
  - Start working — I'll capture decisions in journal/_current.md
  - /consolidate to organize captured knowledge
  - /ingest FILE to add documents
  - /discover to find useful skills for your context
  - /help for quick reference
```
