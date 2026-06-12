---
standard: synaptic-core
version: 1.0.0
name: "{{BRAIN_NAME}}"
scope: "{{project|role|org|life}}"
created: "{{YYYY-MM-DD}}"
updated: "{{YYYY-MM-DD}}"
---

# {{BRAIN_NAME}} — Synaptic Brain

> The only mandatory read at session start. Everything else loads on demand.

## Context Capsule

**What this brain covers:** {{What domain, project, or role this brain captures knowledge for.}}
**Owner's role:** {{Your function in this project — e.g. "Fullstack dev, CI/CD lead, embedded in team X".}}

> Persona, tone, chat-language preference, and agent behavior belong in your harness (AGENTS.md / CLAUDE.md), never here.

---

## Capture Contract

Six-step consolidation formula — run after every work session before closing:

1. **Classify** — durable knowledge · tabular record → registry · lesson · decision · big task → playground · temporal → journal · noise → drop.
2. **Atomicity test** — one concept per node; promote only when it recurs (2+ instances → pattern) or is a reusable decision/lesson. Incident-specifics stay in playground/journal.
3. **Generalize** — strip the anecdote, keep the reusable pattern; name = the concept, not the ticket.
4. **Place & link** — atomic node in the right cluster; fill D1 frontmatter; add `[[wikilinks]]`; register in cluster `_index.md`.
5. **Dedupe / SSOT** — search first; update, don't duplicate; one source of truth per fact.
6. **Quality gate** — professional & verifiable only; soft budget ~150 lines or tag `type: reference`; stamp `updated:`; confirm reachable from a MOC.

---

## Top Guardrails

> Full set in `harness/guardrails.md`. These three to five rules are always on:

- {{GUARDRAIL_1 — e.g. "Never commit secrets or credentials to any repository."}}
- {{GUARDRAIL_2 — e.g. "Never deploy to production without explicit sign-off."}}
- {{GUARDRAIL_3 — e.g. "Never merge a PR without at least one review."}}
- {{GUARDRAIL_4 — optional}}
- {{GUARDRAIL_5 — optional}}

---

## Brain Map

| Directory | Plane | When to load |
|---|---|---|
| `knowledge/` | Wiki — what you know | On demand via `knowledge/INDEX.md` |
| `registries/` | Wiki — tabular SSOTs (resources, repos, glossary) | On demand; never eager-load |
| `references/` | Wiki — existence index + verbatim artifacts (`raw/`) | On demand |
| `harness/` | Harness — conventions, guardrails, project skills | On demand; top subset above |
| `playgrounds/` | Working memory — per-task burnable workspaces | Registered in journal only |
| `journal/` | Working memory — thin anchor/watch/log | Resume: read `_current.md` |
| `templates/` | Scaffolding — node, registry, playbook, lesson | When creating a new node |

**Navigation rule:** `BRAIN.md` → `knowledge/INDEX.md` (hub MOC) → `{cluster}/_index.md` (sub-MOC, 1-line per node) → open only the 1–2 relevant nodes. A node not reachable from a MOC does not exist.

---

## Session Start

**Resuming work:** read `journal/_current.md` (active playgrounds + next step), then proceed.
**Starting fresh:** just work; load knowledge on demand through `knowledge/INDEX.md`.
**Load trigger examples:** "before CI work → read `harness/guardrails.md`"; "for a domain insight → INDEX → cluster `_index` → 1–2 nodes."

---

## Commands

Provided by the `synaptic` skill (installed in `.claude/skills/` or `.agents/skills/`):

| Command | Action |
|---|---|
| `/init` | Scope-aware setup interview; self-wires harness; can import a context-pack seed |
| `/consolidate` | Run the 6-step capture contract on current session output |
| `/ingest [file]` | Distill a document into an atomic node + reference entry |
| `/audit` | Check for orphans, broken links, stale nodes, MOC coverage, registry integrity |
| `/upgrade` | Migrate brain to a newer synaptic-core version |

---

> Anti-drift: if outputs stop following this protocol, re-read this file.
