---
name: upgrade
description: Upgrade a Synaptic brain to the latest version. Uses Intelligent Seed Sync to merge the current brain with the latest remote release. Preserves all user knowledge. Invoke with /upgrade.
---

# /upgrade — Intelligent Brain Upgrade

## Overview

Upgrades an existing Synaptic brain to any target version (e.g., v0.0.1 to v1.0.0 without intermediate steps).
It acts as a smart merge engine: it fetches the latest `seed/` from the official repository and strategically merges it with your local `.synaptic/`, ensuring no user data is ever lost.

## Execution

### Step 1: Locate Target Seed

Determine where the new version will come from:
1. Ask the user if they want to fetch the latest release from GitHub (`diego-alfadev/synaptic-core`) or use a local directory.
2. If GitHub: Use your available tools (curl, bash, or direct browser) to download the `seed/` directory from the latest `main` branch or latest release on `github.com/diego-alfadev/synaptic-core`. Extract it to a temporary directory (e.g., `/tmp/synaptic-seed`).
3. If local: Ask the user for the path to the downloaded `seed/` directory.

### Step 2: Pre-Upgrade Analysis

Compare the target `seed/.synaptic/` against the local `.synaptic/`.
Present a report to the user summarizing what will happen based on the **3 Golden Rules of Seed Sync**:

1. **Overwrite (Protocol Files)**: System files will be replaced.
   - `BOOTSTRAP.md`, `MANIFEST.md`, `skills/*`, `cortex.config.yaml`
2. **Merge Additive (User Data)**: New sections or templates from the target will be appended, but existing user data (Identity, Knowledge, Journal, Inventory) is STRICTLY PRESERVED.
   - `identity/HEARTBEAT.md`, `identity/ROLE.md`, etc.
3. **Add (Missing Structures)**: Any directories or files in the target that don't exist locally will be copied over.

```
Ready to upgrade brain to [target_version].

Impact:
  - Protocol files will be updated (BOOTSTRAP, skills).
  - Your knowledge, identity, and journal will be PRESERVED.
  - [Number] new structures/files will be added.

Proceed? (yes/no)
```

### Step 3: Execute Intelligent Sync

If user confirms, execute the merge carefully:

**3a. Protocol Update**
- Copy all files from the target's `skills/` to local `skills/`.
- Replace local `BOOTSTRAP.md` with the target's version.
- Replace local `MANIFEST.md` with the target's version, but **retain** the `name`, `role`, `areas`, and `domains` from the original local manifest.

**3b. Structure Addition**
- Iterate through all directories in the target seed. If a directory or file (like `worklines/_active.yaml` or `cortex.config.yaml`) is missing locally, create it.

**3c. Data Merge (Additive)**
- For `identity/HEARTBEAT.md`: Compare headers. If the target has new headers (e.g., `## Drift signals`), append those new sections to the local file without modifying the user's role or constraints.
- Do purely additive merges for any other template files that have evolved. **Never delete** user context.

**3d. Agent Bridges Update**
- Run the "System Prompt Hook" logic (from `skills/init/SKILL.md`) to re-detect all agent config directories in the workspace and inject the updated bridge files.

### Step 4: Post-Upgrade Report

```
✅ Brain upgraded successfully! (Now at v[target_version])

Changes applied:
  - System files and skills updated.
  - New structures added: [list of notable new files/folders].
  - Agent bridges updated in: [paths].

Your identity, knowledge, and journal were safely preserved.
Check `BOOTSTRAP.md` to see the new protocol features.
```

## Rules

- NEVER delete or overwrite user data in `identity/`, `knowledge/`, `inventory/`, `references/`, or `journal/`.
- The Intelligent Sync must work regardless of what version the user is currently on.
- Always ask for confirmation before modifying files in Step 3.
- If anything looks broken or risky during the merge, STOP and warn the user before proceeding.
