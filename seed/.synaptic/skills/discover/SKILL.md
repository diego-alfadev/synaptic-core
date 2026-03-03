---
name: discover
description: Analyze brain context and suggest relevant skills, tools, or MCPs that could enhance the agent's capabilities. Optionally search skills.sh for installable packages.
---

# /discover — Skill & Tool Discovery

## Overview

Reads the brain's context (areas, domains, inventory, principles) and suggests relevant
skills, tools, or MCPs that could enhance agent capabilities. The user decides what to install.

## Execution

### Step 1: Analyze Brain Context

Read these files to understand the user's domain:
- `MANIFEST.md` → areas, capabilities, existing skills
- `identity/ROLE.md` → role, expertise
- `knowledge/_tree.yaml` → knowledge domains
- `inventory/projects.md` → tech stack, tools in use

Build a profile: "This user works with [tech], in [domain], managing [what]."

### Step 2: Identify Gaps

Based on the profile, suggest skills across these categories:

```
Active skills (things the user does regularly):
  - "You work with Postgres → a postgres/SQL skill could help"
  - "You manage CI/CD → a deployment best-practices skill"
  - "You work with Excel data → excel-mcp for spreadsheet ops"

Meta-cognitive skills (how the agent thinks):
  - "You do planning → a structured-planning skill"
  - "You debug often → systematic-debugging skill"

Tool integrations (MCPs, CLIs):
  - "You use Jira → jira-mcp for ticket management"
  - "You reference Confluence → confluence-mcp for wiki access"
```

### Step 3: Present Recommendations

```
Based on your brain context, I recommend:

  1. 🔧 postgres-skill — Optimized SQL patterns and schema analysis
     → npx skills add [package]

  2. 📊 excel-mcp — Read/write Excel files from the agent
     → npm install -g @mcp/excel

  3. 🧪 systematic-debugging — Structured approach to debugging
     → npx skills add [package]

  Want me to search skills.sh for any of these? Or install one?
```

### Step 4: Install (if accepted)

If the user says yes to a skill:

1. Run `npx skills find [query]` (requires Node.js — TOOLS layer)
2. If found: `npx skills add [package] -g -y`
3. Register in `MANIFEST.md` under `## Skill Triggers`:

```yaml
triggers:
  - context: "SQL queries or database operations"
    tool: postgres-skill
    type: skill
  - context: "Excel or CSV file operations"
    tool: excel-mcp
    type: mcp
```

4. If Node.js not available: provide manual install instructions

### Step 5: Update MANIFEST

Add installed skills to `MANIFEST.md`:
- Under `## Skills`: add the skill name
- Under `## Skill Triggers`: add the context→tool mapping

## Rules

- Never install without explicit user consent
- Always explain what the skill does before suggesting install
- If `npx` is not available, still recommend — just provide manual instructions
- Prioritize skills with high relevance to the brain's existing context
- Don't suggest more than 5 at a time — quality over quantity
