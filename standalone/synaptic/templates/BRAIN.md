---
standard: synaptic-core
# schema_version = the brain FORMAT/SCHEMA version (frontmatter fields, dir layout, MOC contract).
# This is DISTINCT from the synaptic SKILL/engine version (see SKILL.md `version:`).
# A skill update reinstalls the skill with NO brain migration; only a schema_version change
# requires `/synaptic-upgrade`. Additive optional frontmatter (typed edges, provenance,
# confidence, bias-check) does NOT bump this number.
schema_version: 1.0
name: "{{BRAIN_NAME}}"
scope: "{{project|role|org|life}}"
created: "{{YYYY-MM-DD}}"
updated: "{{YYYY-MM-DD}}"
---

# {{BRAIN_NAME}} — Synaptic Brain

> The only mandatory read at session start. Everything else loads on demand.

> This brain conforms to **synaptic-core schema `1.0`** (see `schema_version:` above). A skill-less agent can read it directly — no skill, runtime, or version check is required to boot. The synaptic skill's engine version is separate (`SKILL.md`); a skill update never migrates this brain.

## Context Capsule

**What this brain covers:** {{What domain, project, or role this brain captures knowledge for.}}
**Owner's role:** {{Your function in this project — e.g. "Fullstack dev, CI/CD lead, embedded in team X".}}

> Persona, tone, chat-language preference, and agent behavior belong in your harness (AGENTS.md / CLAUDE.md), never here.

---

## Capture Contract

**Capture is a dial, not a switch.** Two orthogonal axes — keep them separate:

- **`capture_policy` = how aggressively durable knowledge is PROMOTED to the wiki.**
  Presets: **`selective | balanced | capture-all`**.
  - `selective` — promote only clearly reusable, recurring knowledge; the rest stays in journal/playground.
  - `balanced` — the default; promote durable knowledge and lessons, hold incident-specifics.
  - `capture-all` — promote liberally; rely on later consolidation to prune.
- **The passivity dial = WHEN capture triggers** (manual ↔ event-driven hooks ↔ where-supported automation). This is set in the harness/hook config, not here.

> Breadcrumbs (below) are the always-on, fixed-cost floor and are **NOT** governed by `capture_policy`. Do not add a second policy for breadcrumbs.

### Incremental journal breadcrumbs (the safety net)

One terse line appended to `journal/_current.md → ## Log` per meaningful turn. **Fixed cost, always on, policy-independent.** They live on disk so they survive a crash; what only lived in context dies. Breadcrumbs are not promotion — they are the raw trail that consolidation later distills.

> **This is an instruction you follow, not only a hook.** Append the breadcrumb per meaningful turn yourself; the `Stop` hook automates it where wired, but write it even when no hook fires. Hooks are host-specific and can silently fail to fire — the instruction is the floor underneath the automation, so a session that reaches compaction is **never breadcrumb-empty** (this closes issue #2: a session neared recompact with no breadcrumbs written). Nothing fires without you acting; there is no idle daemon (see the honest limit below).

### Layered capture (does NOT depend on SessionEnd)

| Layer | Trigger | Availability |
|---|---|---|
| Breadcrumb (workhorse) | `Stop` — per-turn cheap line to the journal | UNIVERSAL across agents |
| Flush before context loss | `PreCompact` — consolidate before compaction | Host-conditional (Claude / Copilot / Codex) |
| Rescue net | `SessionStart` — detect unconsolidated breadcrumbs/active playgrounds, OFFER to consolidate | Universal on next boot |
| Clean-exit bonus | `SessionEnd` — consolidate on graceful close | Bonus only where present (not Copilot-IDE, not Cursor) |

> Honest limit: **no agent has native idle detection.** Capture is event-driven + journal fallback + `SessionStart`-rescue — never an unattended idle daemon at CORE.

### Six-step consolidation formula

Run on consolidation (manual `/synaptic-consolidate`, or offered at session end / on next-boot rescue):

1. **Classify** — durable knowledge · tabular record → registry · lesson · decision · big task → playground · temporal → journal · noise → drop.
2. **Atomicity test** — one concept per node; promote only when it recurs (2+ instances → pattern) or is a reusable decision/lesson, per `capture_policy`. Incident-specifics stay in playground/journal.
3. **Generalize** — strip the anecdote, keep the reusable pattern; name = the concept, not the ticket.
4. **Place & link** — atomic node in the right cluster; fill frontmatter (incl. optional `source` / `confidence` / typed edges, and the optional `lifecycle: project|area|resource|dormant` actionability axis — absent → `area`, loads by default); add `[[wikilinks]]`; register in cluster `_index.md`.
5. **Dedupe / SSOT** — search first; update, don't duplicate; one source of truth per fact.
6. **Quality gate** — professional & verifiable only; soft budget ~150 lines or tag `type: reference`; stamp `updated:`; confirm reachable from a MOC.

> **Session-end OFFER:** when a session closes (or on next-boot rescue if it was abandoned), the agent OFFERS to run this consolidation — it does not silently rewrite the brain. Breadcrumbs already captured the trail; consolidation is the supervised promotion step.

---

## Operating rules — deployed, not read here

> Conventions and guardrails live in `harness/conventions.md` + `harness/guardrails.md` as the
> **source**, and are **deployed into your harnessing** (instruction files / AGENTS.md block —
> **symlink preferred over copy**) so they sit in the agent's **system prompt**. They are **not**
> read from the brain at session start — only when you edit them, or to verify the deployed copy is
> in sync. (No guardrails block lives here: a boot-time read would duplicate the system prompt.)

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
| `/synaptic-init` | Scope-aware setup interview; self-wires harness; assembles the example brain on demand from the skill's bundled templates |
| `/synaptic-consolidate` | Run the 6-step capture contract on current session output |
| `/synaptic-ingest [file]` | Distill a document into an atomic node + reference entry |
| `/synaptic-audit` | Check for orphans, broken links, stale nodes, MOC coverage, registry integrity |
| `/synaptic-upgrade` | Migrate brain to a newer synaptic-core version |

---

> Anti-drift: if outputs stop following this protocol, re-read this file.
