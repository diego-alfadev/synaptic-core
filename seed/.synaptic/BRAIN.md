---
standard: synaptic-core
version: 1.0.0
name: "{{BRAIN_NAME}}"
scope: "{{project|role|org|life}}"
capture_policy: balanced   # curated | balanced | logbook — how aggressively work is promoted into the wiki
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

**Capture policy** (`capture_policy:` frontmatter; default `balanced`) tunes how aggressively steps 2 and 6 fire — same formula, different valve:

| Policy | Step 2 — promote when… | Step 6 — gate |
|---|---|---|
| `curated` | crown-jewels only: reusable decision/lesson, or a pattern seen 3+ times | strict — prune hard, keep the wiki small |
| `balanced` *(default)* | pattern at 2+ instances, or clearly reusable knowledge | standard |
| `logbook` | liberally — durable-ish notes on first sight (use when this is your only memory layer) | lenient — keep more; prune later via `/synaptic-weave` |

A custom 1-line policy in frontmatter overrides the preset.

---

> Operating rules + guardrails are **deployed to your harness** from `harness/` (run `/synaptic-init` to (re)deploy). If your harness isn't wired yet, treat `harness/` as the source — do not load it every session.

---

## Brain Map

| Directory | Plane | When to load |
|---|---|---|
| `knowledge/` | Wiki — what you know | On demand via `knowledge/INDEX.md` |
| `registries/` | Wiki — tabular SSOTs (resources, repos, glossary) | On demand; never eager-load |
| `references/` | Wiki — existence index + verbatim artifacts (`raw/`) | On demand |
| `harness/` | Operating-rules SOURCE — deployed to the outer harness by `/synaptic-init`; not loaded at runtime | Run `/synaptic-init` to (re)deploy; read source here only if harness unwired |
| `playgrounds/` | Working memory — per-task burnable workspaces | Registered in journal only |
| `journal/` | Working memory — thin anchor/watch/log | Resume: read `_current.md` |
| `templates/` | Scaffolding — node, registry, playbook, lesson | When creating a new node |

**Navigation rule:** `BRAIN.md` → `knowledge/INDEX.md` (hub MOC) → `{cluster}/_index.md` (sub-MOC, 1-line per node) → open only the 1–2 relevant nodes. A node not reachable from a MOC does not exist.

---

## Session Start

**Resuming work:** read `journal/_current.md` (active playgrounds + next step), then proceed.
**Starting fresh:** just work; load knowledge on demand through `knowledge/INDEX.md`.
**Load trigger examples:** "for a domain insight → INDEX → cluster `_index` → 1–2 nodes"; "for project conventions → read your deployed harness rules (AGENTS.md / instructions)."

**Persist:** at session end, **offer to consolidate** uncaptured durable work — propose what you'd capture per the capture policy; don't force, don't silently skip — then run `/synaptic-consolidate`. Cadence: `/synaptic-audit` weekly · `/synaptic-weave` monthly. Zero-friction auto-capture: install the session-end hook (see `recipes/`).

---

## Commands

Provided by the `synaptic` skill (installed in `.claude/skills/` or `.agents/skills/`):

| Command | Action |
|---|---|
| `/synaptic-init` | Scope-aware setup interview; self-wires harness + deploys operating rules |
| `/synaptic-consolidate` | Run the 6-step capture contract on current session output |
| `/synaptic-ingest [file]` | Distill a document into an atomic node + reference entry |
| `/synaptic-audit` | Check for orphans, broken links, stale nodes, MOC coverage, registry integrity |
| `/synaptic-weave` | Graph-gardening pass: propose missing links, flag thin nodes, detect gaps, suggest merges |
| `/synaptic-upgrade` | Migrate brain to a newer synaptic-core version |

---

> Anti-drift: if outputs stop following this protocol, re-read this file.
