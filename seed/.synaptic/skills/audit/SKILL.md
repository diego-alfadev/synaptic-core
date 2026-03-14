---
name: audit
description: Review the brain for gaps, stale data, empty templates, and missing information. Cross-references existing content and suggests targeted fixes.
---

# /audit — Brain Gap Analysis

## Overview

Proactive review of the entire brain. Unlike `/consolidate` (which routes current session data), `/audit` looks **cross-session** for what's missing, stale, or incomplete.

## When to use

- After initial setup (`/init`) has settled and a few sessions have passed
- When the user asks "what's missing?" or "what should we fill in?"
- Periodically, to keep the brain healthy

## Execution

### Step 1: Read brain structure

Read `MANIFEST.md` and `knowledge/_tree.yaml` to understand what should exist.

### Step 2: Scan for gaps

Check each section for completeness:

```
identity/
  ├── ROLE.md         → Is it filled or still a template?
  ├── PRINCIPLES.md   → Are there actual constraints listed?
  ├── CONTACTS.md     → Any "TBD" or "unknown" entries?
  └── HEARTBEAT.md    → Does it have real data or placeholders?

knowledge/
  ├── areas/          → Any _overview.md that's mostly empty?
  ├── domains/        → Is domains/ completely empty? Should it have content?
  └── lessons/        → Expected to be empty early on — don't flag this

inventory/
  ├── projects.md     → Empty? We might have data to fill from references/
  ├── environments.md → Empty? Check references/ for server/hosting data
  └── glossary.md     → Empty is OK early on

references/
  └── _index.md       → Any references listed but not cross-referenced?
```

### Step 3: Cross-reference

This is the key differentiator from other skills:

- **references/ → inventory/**: Look for concrete data in reference docs (IPs, URLs, SSH paths, credentials references, endpoints) that should be extracted into inventory files
- **references/ → knowledge/**: Look for architectural knowledge in reference docs that should become knowledge nodes
- **areas/ → domains/**: Are there patterns that apply across multiple areas? (e.g., deployment process used by more than one project)

### Step 4: Workspace scan (light)

Do a **non-recursive, top-level** scan of the workspace:
- Any new folders or files since last scan?
- Any README.md, package.json, or docs/ not yet ingested?
- Don't recurse into directories — just note what's new at the surface

### Step 5: Present findings

Format as an actionable checklist:

```
🔍 Brain audit — [N] findings:

## Gaps (empty or placeholder content)
1. 📦 inventory/environments.md is empty
   → references/despliegue-vue.md has server data
   → Want me to extract it?

2. 👤 contacts: "Contacto de hosting" has no name
   → Do you know it now?

## Promotion opportunities (data in refs that belongs elsewhere)
3. 🔄 references/despliegue-vue.md contains SSH access info
   → Should be in inventory/environments.md

## Potential new content
4. 🌐 "Plesk deployment" applies to both NM and BPI
   → Worth creating as a cross-cutting domain?

## Workspace changes
5. 📂 New folder detected: analytics/
   → Want me to ingest anything from it?

Apply all? Or pick specific items? [a/1,2,3/skip]
```

### Step 6: Apply

For each accepted finding:
- Extract/move content to the right location
- Update `_tree.yaml`
- Update `MANIFEST.md` if areas/domains changed

## Rules

- Don't recurse into git repos or large directories during workspace scan
- Don't flag `lessons/` as empty in young brains — that's normal
- Present findings grouped by category, not a flat list
- Maximum 10 findings per audit — prioritize by impact
- Always ask before making changes
