---
name: upgrade
description: Upgrade a Synaptic brain to the latest version. Handles migration of structure, files, and settings between versions. Invoke with /upgrade.
---

# /upgrade — Brain Version Upgrade

## Overview

Upgrades an existing Synaptic brain to the latest standard version.
Preserves user data (identity, knowledge, journal, inventory) while adding new structures and updating protocols.

## Execution

### Step 1: Detect Current Version

```
Read MANIFEST.md → extract version
├── version >= 0.3.0 → "Brain is already up to date (v{version})." Stop.
├── version < 0.3.0 → Continue to Step 2
└── No MANIFEST.md → "Can't determine version. Is this a Synaptic brain?" Stop.
```

### Step 2: Pre-Upgrade Report

Show the user what will change:

```
Upgrading brain from v{current} to v0.3.0

New additions:
  + worklines/_active.yaml     — Work direction tracking
  + worklines/archive/         — Archived worklines
  + cortex.config.yaml         — Agent behavior settings
  + skills/plan/SKILL.md       — Workline management skill
  + skills/upgrade/SKILL.md    — This upgrade skill

Updates:
  ~ BOOTSTRAP.md               — Anti-drift improvements, smart journaling,
                                  Work Mode Detection (Step 5), expanded routing tree
  ~ identity/HEARTBEAT.md      — Drift signals, current focus section
  ~ MANIFEST.md                — Version bump, new skills
  ~ skills/init/SKILL.md       — Aggressive agent detection (12 platforms)

Preserved (no changes):
  ✓ identity/ROLE.md, PRINCIPLES.md, CONTACTS.md
  ✓ knowledge/ (all areas, domains, lessons)
  ✓ inventory/ (all data)
  ✓ references/ (all data)
  ✓ journal/ (all sessions)

Proceed? (yes/no)
```

### Step 3: Execute Upgrade

If user confirms:

**3a. Create new structures:**
- Create `worklines/_active.yaml` (empty template)
- Create `worklines/archive/` directory
- Create `cortex.config.yaml` with default settings

**3b. Update BOOTSTRAP.md:**
- Replace with v0.3.0 standard BOOTSTRAP.md content
- Key changes:
  - Step 0: add Cortex config detection
  - Step 5: Work Mode Detection (worklines)
  - Anti-Drift: heartbeat every 3-5 interactions, drift self-detection signals
  - Smart journaling (trivial = skip, complex = journal)
  - Session Rhythm: mandatory heartbeat checks, workline sync in Planning mode
  - Persist phase: structured handoff template
  - Memory Routing: new worklines branch
  - Commands: add /plan, /upgrade
  - Directory Map: add worklines/, cortex.config.yaml

**3c. Update HEARTBEAT.md:**
- **Preserve** existing user content in "Who you are", "Session rules", "Active constraints"
- **Add** new sections:
  - `## Current focus` — link to worklines and journal
  - `## Drift signals — self-check` — checklist for self-diagnosis
- If HEARTBEAT.md still has `{{placeholders}}`, leave them (user hasn't personalized yet)

**3d. Add new skills:**
- Create `skills/plan/SKILL.md` (workline management)
- Create `skills/upgrade/SKILL.md` (this file — for future upgrades)

**3e. Update MANIFEST.md:**
- Change version to 0.3.0
- Add `plan` and `upgrade` to skills list
- Add `## Worklines` section

**3f. Update agent bridges:**
- Re-detect all agent config paths (using the expanded 12-platform map)
- Update bridge files with v0.3.0 content (~500 tokens)
- Report which bridges were updated

### Step 4: Post-Upgrade Report

```
✅ Brain upgraded to v0.3.0!

Added:
  - worklines/ — ready for /plan
  - cortex.config.yaml — agent behavior settings
  - skills/plan, skills/upgrade

Updated:
  - BOOTSTRAP.md — anti-drift improvements, smart journaling, workline detection
  - HEARTBEAT.md — drift signals, current focus
  - MANIFEST.md — version 0.3.0
  - Agent bridges: [list of updated paths]

Recommended next steps:
  - Review your HEARTBEAT.md — check the new drift signals section
  - /plan to create your first workline
  - /audit to verify brain health after upgrade
```

## Rules

- NEVER delete or overwrite user data in identity/, knowledge/, inventory/, references/, or journal/
- When updating HEARTBEAT.md, preserve user-written content — only add new sections
- Always show the pre-upgrade report and wait for confirmation
- If anything looks wrong during upgrade, stop and tell the user
- After upgrade, suggest /audit to verify brain health
