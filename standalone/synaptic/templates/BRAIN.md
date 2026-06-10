---
standard: synaptic-core
version: 0.5.0-alpha
name: {{BRAIN_NAME}}
scope: {{SCOPE}}  # project | role | org | life
created: {{CREATED_DATE}}
updated: {{UPDATED_DATE}}
budgets:
  journal: 80
  page: 150
  brain: 100
---

# {{BRAIN_NAME}} — Synaptic Brain

You are reading a Synaptic brain — a portable knowledge graph for this {{scope}}'s work.
This file is the only mandatory read at session start.

---

## Brain Context

**What this brain covers:** {{WHAT_THIS_BRAIN_COVERS}}

**Owner's role in this project:** {{OWNER_ROLE_IN_PROJECT}}

> Persona, tone, language and behavior belong to your harness (AGENTS.md / instructions), never to this brain.

---

## Brain Map

| Directory | Purpose |
|-----------|---------|
| `knowledge/` | Wiki pages (kebab-case, unique names); `knowledge/INDEX.md` is the sole navigation hub |
| `playbooks/` | Action recipes distilled from real work; generates plans, not fixed steps |
| `playgrounds/` | Per-task workspaces: multi-day, multi-artifact; registered in journal, burnable |
| `references/` | Large verbatim artifacts; indexed in `references/_index.md`, never eager-loaded |
| `journal/` | Thin working memory — `_current.md` only, hard budget 80 lines |
| `templates/` | Page and playbook templates |

**Navigation rule:** a knowledge page not reachable from `knowledge/INDEX.md` does not exist.

---

## Session Start

If resuming: read `journal/_current.md` (lists active playgrounds and next step). Otherwise just work; load knowledge on demand via `knowledge/INDEX.md`.

---

## Contribution Protocol

**Routing:**
1. Durable knowledge → `knowledge/` page + register in `knowledge/INDEX.md`.
2. Lesson learned → `knowledge/lessons/` + register in `knowledge/INDEX.md`.
3. Repeatable procedure that worked → `playbooks/` entry + update `playbooks/_index.md`.
4. Task too big for journal (multi-day, multiple artifacts) → `playgrounds/{{task-id}}/`, note in journal.
5. Large verbatim artifact (DDL, spec, export) → `references/` + 1-line entry in `references/_index.md`.
6. Temporal (session notes, decisions in progress) → `journal/_current.md`.
7. Trivia, debug output, one-off lookups → do not capture.
8. Team/project operating norm (language per channel, conventions, etiquette) → `knowledge/working-agreements.md`.

**Conventions:**
- **Naming:** unique kebab-case filenames across `knowledge/` (no duplicates).
- **Linking:** use `[[wikilinks]]` at capture time — link related pages when writing, not retroactively.
- **Backlinks:** queried, not stored: `grep -r "[[page-name]]" .synaptic/` (Obsidian computes them live).
- **Discovery rule:** not reachable from INDEX.md → doesn't exist.
- **Files are authoritative** — harness-native agent memory is a cache.
- **Quality bar:** consolidate generalized, professional, verifiable knowledge — no personal opinions, rumors, or application data.

---

## Commands

Provided by the `synaptic` skill installed in the project's skill dirs.

| Command | What it does |
|---------|-------------|
| `/init` | Set up or extend the brain structure |
| `/consolidate` | Promote working memory into structured knowledge |
| `/ingest [file]` | Ingest a document into the brain |
| `/audit` | Review brain for gaps, stale data, missing coverage |
| `/upgrade` | Upgrade brain to latest synaptic-core version |

---

If you stop following this protocol, re-read this file.
