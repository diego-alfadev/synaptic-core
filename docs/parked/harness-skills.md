# PARKED — `harness/skills/` (project skills that travel with a brain)

> **Status: parked, not part of CORE** (decision X10, 2026-11-01). Kept as a possible Cortex idea.
> **Why parked:** Self-Wire step c.6 copied `harness/skills/*` executables into the host's skill
> folders at boot with no per-item approval, so a shared or handed-over brain became a code-delivery
> channel that the content-is-data rule never sees (review defect D2). The author's own brain carried
> no project skills when it was parked (n=1).
> **What changed:** new brains no longer get `harness/skills/`; init and upgrade install nothing from a
> brain. `/synaptic-upgrade` still preserves a legacy brain's custom skill dirs as inert files.
> **To revive it (Cortex):** per-item approval, never during boot, never an install path built from
> BRAIN.md `name:`, and a scan of what is being installed.
> The original template follows (frontmatter dropped, one step marked historical).

---

# Project Skills

This folder holds **project-local executable skills** — small agent programs that are specific to *this* project and must travel with the brain (e.g. a Jira CLI wrapper, a deploy helper, a custom linter runner).

---

## Distinction: project skills vs. the `synaptic` skill

| | Project skills (this folder) | `synaptic` lifecycle skill |
|---|---|---|
| **What** | Project-specific executables (Jira, deploy, linting…) | Brain lifecycle: `/synaptic-init /synaptic-consolidate /synaptic-ingest /synaptic-audit /synaptic-upgrade` |
| **Where installed** | `harness/skills/` — travels with the brain | Agent's own skill dirs (`.claude/skills/`, `.agents/skills/`) |
| **Scope** | This project only | Any brain running synaptic-core |
| **Installed by** | `/synaptic-init` (if declared) or manually | `/synaptic-init` or manual install |

---

## Adding a project skill

1. Create `harness/skills/{skill-name}.md` — document intent, trigger, and usage.
2. If the skill is executable (a script), place it alongside the `.md` doc.
3. Register it in the index below.
4. *(Historical — no longer done:)* declare it during `/synaptic-init` so it auto-installs on new machines.

---

## Skill Index

<!-- Format: - `[[skill-name]]` — {{1-line: what it does and when to reach for it}} -->

<!-- - `[[jira-cli]]` — create and update Jira tickets from the terminal without browser access -->
<!-- - `[[deploy-helper]]` — run the staged deployment sequence with pre-flight checks -->

---

> Project skills are part of *the work*; persona/tone/behavior skills belong in AGENTS.md / CLAUDE.md.
