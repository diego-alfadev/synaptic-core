# tools/check.js — Synaptic Brain Lint Helper

## What it checks

1. `BRAIN.md` present (ERROR if missing); line count ≤ 120 (WARN if over).
2. `journal/_current.md` ≤ 200 lines; each `knowledge/` page ≤ 150 lines (WARN).
3. Every knowledge page and playbook (non-template, non-index) has `description`, `updated`,
   and `status` in its YAML frontmatter — `{{PLACEHOLDER}}` values are tolerated (ERROR per missing field).
4. Every knowledge page appears in `knowledge/INDEX.md`; every playbook in `playbooks/_index.md` (ERROR).
5. Every `[[wikilink]]` resolves to an existing `.md` file; links inside HTML comments or
   template files (`_*.md`) are skipped (ERROR per broken link).
6. Pages whose `updated:` date is older than 90 days (WARN).
7. Any non-template file that references removed v0.3 artifacts (`BOOTSTRAP.md`, `MANIFEST.md`,
   `HEARTBEAT.md`, `_tree.yaml`) (ERROR).

## Usage

```sh
node tools/check.js                     # checks ./.synaptic
node tools/check.js path/to/.synaptic  # explicit path
```

Exit code 0 = no errors. Exit code 1 = one or more errors.

## Matrioshka note

This file is the optional **TOOLS** layer of the synaptic-core matrioshka architecture.
The **CORE** layer is plain files — it never requires this script.
Everything this tool checks can be done manually by reading the files.
Agents should run it when Node ≥ 18 is available; skip it otherwise.
