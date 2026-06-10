---
standard: synaptic-core
version: 0.4.0-alpha
name: {{BRAIN_NAME}}
scope: {{SCOPE}}  # project | role | org | life
created: {{CREATED_DATE}}
updated: {{UPDATED_DATE}}
---

# {{BRAIN_NAME}} — Synaptic Brain

You are reading a Synaptic brain. This file is the only mandatory read at session start.

---

## Identity Capsule

**Role:** {{ROLE_SUMMARY}}

**Language:** {{LANGUAGE}} — **Tone:** {{TONE}}

**Top constraints:**
- {{CONSTRAINT_1}}
- {{CONSTRAINT_2}}
- {{CONSTRAINT_3}}
<!-- Add up to 5 constraints total. Delete unused bullets. -->

---

## Brain Map

| Directory | Purpose | Key file |
|-----------|---------|----------|
| `identity/` | Depth on demand: role, principles, stakeholders — read when task needs it | ROLE.md, PRINCIPLES.md, CONTACTS.md |
| `knowledge/` | Wiki pages; never eager-load — navigate via INDEX only | `knowledge/INDEX.md` ← sole navigation hub |
| `playbooks/` | Action recipes distilled from successful work — they generate plans, not fixed steps | `playbooks/_index.md` |
| `worklines/` | Direction, objectives, priorities | `worklines/_active.yaml` |
| `journal/` | Working memory — temporal, session-scoped | `journal/_current.md` |
| `skills/` | LOCAL custom skills for this brain only | per skill directory |

**Navigation rule:** a knowledge page not reachable from `knowledge/INDEX.md` does not exist.

---

## Session Start

If resuming work: read `journal/_current.md`, check `worklines/_active.yaml`, and offer to
continue the active workline. Otherwise just work. Load everything else on demand via
`knowledge/INDEX.md`.

---

## Routing Rules

1. Durable knowledge → `knowledge/` page; update `knowledge/INDEX.md` to register it.
2. Lesson learned → `knowledge/lessons/` page; update `knowledge/INDEX.md`.
3. Repeatable procedure that worked → `playbooks/` entry; update `playbooks/_index.md`.
4. Direction, priorities, objectives → `worklines/`; update `worklines/_active.yaml`.
5. Identity or hard constraints → `identity/` (ROLE.md or PRINCIPLES.md).
6. Everything temporal (session notes, decisions in progress) → `journal/_current.md`.
7. Trivia, debug output, one-off lookups → do not capture.
8. Discovery rule: before creating any node, confirm it will be reachable from `knowledge/INDEX.md`.

---

## Anti-Drift

If your persona, language, or constraints drift, re-read this file.

---

## Commands

Skills below are provided by the `synaptic` skill package (`standalone/synaptic/` in the repo).
If not installed, the brain still works — follow the routing rules above.

| Command | What it does |
|---------|-------------|
| `/init` | Set up or extend the brain structure |
| `/plan` | Create or manage worklines and tasks |
| `/consolidate` | Promote working memory into structured knowledge |
| `/ingest [file]` | Ingest a document into the brain |
| `/audit` | Review brain for gaps, stale data, missing coverage |
| `/upgrade` | Upgrade brain to latest synaptic-core version |
