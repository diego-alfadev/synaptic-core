---
name: init
description: Initialize or extend a Synaptic brain. Handles fresh setup, existing project detection, and brain extension.
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

Ask these questions (skip any the user proactively answers):

**Q1: Role** — "What's your role and context? (e.g. 'Backend engineer managing feedback tools at a bank')"
→ Write `identity/ROLE.md`

**Q2: Areas** — "What are the main areas, products, or tools you work on?"
→ Create `knowledge/areas/[name]/_overview.md` for each

**Q3: Principles** — "Any hard rules or constraints? (e.g. 'Always use TypeScript', 'No external API calls without review')"
→ Write `identity/PRINCIPLES.md`

**Q4: Contacts** — "Key people you work with? (can be minimal or empty)"
→ Write `identity/CONTACTS.md`

**Q5: References** — "Any existing documents, schemas, or specs to ingest?"
→ Run `/ingest` for each → `references/` + knowledge nodes

Then generate: `MANIFEST.md`, `BOOTSTRAP.md` (standard copy), `_tree.yaml`, `INDEX.md`, `journal/_current.md`

### Step 2B: Fresh Brain + Existing Project

**Workspace Scan** (before asking questions):

1. List top-level directory structure
2. Look for key files:
   - `README.md` → Extract project description, stack, purpose
   - `package.json` / `requirements.txt` / `go.mod` → Detect stack
   - `.agent/` / `.claude/` / `.cursor/` → Existing agent config
   - `docs/` → Existing documentation
   - `*.ddl` / `*.sql` / `schema.*` → Database schemas
   - `*.yaml` / `*.json` (API specs) → API definitions

3. Present findings to user:
   "I found: [Node.js project, Postgres schema, existing .agent/ config]. Want me to incorporate this?"

4. If yes:
   - `/ingest` README → knowledge domain node
   - `/ingest` schemas → `references/` + knowledge node
   - Read `.agent/` rules → incorporate into `PRINCIPLES.md`
   - Note existing skills in `MANIFEST.md`

5. Then: Ask Q1-Q5 from Scenario A, **skipping** anything already auto-detected

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

### Step 3: Completion Checklist

After init, verify ALL of these exist:

- [ ] `MANIFEST.md` (with version, timestamp, areas list)
- [ ] `BOOTSTRAP.md` (standard, not customized)
- [ ] `identity/ROLE.md` (at minimum role + expertise)
- [ ] `identity/PRINCIPLES.md` (can be minimal)
- [ ] `identity/CONTACTS.md` (can be empty)
- [ ] `knowledge/INDEX.md` (reflects created areas/domains)
- [ ] `knowledge/_tree.yaml` (auto-generated from created content)
- [ ] At least one area or domain with `_overview.md`
- [ ] `journal/_current.md` (fresh, ready for session)
- [ ] `inventory/projects.md` (can be empty template)
- [ ] `references/_index.md` (lists any ingested files)
- [ ] `skills/` with init, consolidate, ingest, help

Report to user: "Brain initialized. [summary of what was created]"

## Rules

- Ask questions ONE AT A TIME — don't dump all 5 at once
- If the user gives a long answer, extract multiple items (areas, principles, etc.)
- Be fast: 3-5 questions max, ~5 minutes total
- Scan first, ask second (Scenario B)
- Always generate `_tree.yaml` at the end
