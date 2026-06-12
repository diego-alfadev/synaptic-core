---
name: synaptic
version: 1.0.0
description: >
  Knowledge-graph memory layer for project work — a portable, file-based brain that turns
  daily work into structured, indexable, agent-usable knowledge. Two planes: wiki (what you
  know) + harness (how you work here). Triggers: `.synaptic/` present in the workspace, user
  wants persistent project memory or an AI brain, or user invokes /init /consolidate /ingest
  /audit /upgrade.
---

# Synaptic Brain Skill — v1.0

## Detect on Load

```
Does .synaptic/BRAIN.md exist?
├── YES → Read BRAIN.md frontmatter version.
│         version ≥ 1.0 → Boot: read BRAIN.md, follow it.
│           Is harness wired? (BEGIN:SYNAPTIC in AGENTS.md AND skill dir present)
│           ├── Both present → normal boot.
│           └── Either missing → wire harness now (Harness Self-Wire; no interview), then boot.
│         version < 1.0 (0.4, 0.5) → offer /upgrade: "Found a v{X} brain — run /upgrade to migrate."
│
└── NO — Does .synaptic/ exist (no BRAIN.md)?
    ├── YES → v0.3 brain detected (BOOTSTRAP.md pattern).
    │         Offer /upgrade: "Found a v0.3 brain — run /upgrade to migrate to v1."
    │         Load references/upgrade-to-v1.md when user confirms.
    └── NO  → No brain found.
              Offer onboarding: "No brain found — start the setup interview? (y/n)"
```

When booting: read `BRAIN.md` only. Load all other files on demand through `knowledge/INDEX.md`.

---

## Onboarding Interview — /init

Ask **1–2 questions at a time**. Build on answers. Generate files from `templates/` when done.

**Round 0 — Scope:**
> "Is this brain for a project, a role, an organisation, or your life?"

Tailor framing to the answer (e.g. "your stack" for project, "your domains" for org).

**Round 1 — Coverage + Owner role:**
> "What should this brain cover? What is your role here — developer, lead, analyst?"

These answers become the **Context Capsule** in `BRAIN.md` (2–4 lines: what it covers + owner's role in this project). This is *retrieval framing*, not persona. If the user describes tone, language preferences, or agent behavior: "Those belong in your harness (AGENTS.md / CLAUDE.md), not in the brain — I'll place them there instead."

**Round 2 — Main clusters:**
> "What are the main areas, products, or systems this brain will cover?"

Use the answers to seed `knowledge/INDEX.md` cluster stubs and generate a first `{cluster}/_index.md`.

**Round 3 — Working conventions + guardrails:**
> "Any team norms an inheriting teammate must know — languages per channel, commit style, etiquette? Any hard rules that must never be violated?"

Collect conventions → `harness/conventions.md` (create from seed template). Collect hard rules → `harness/guardrails.md`. Extract the top 3–5 hard rules and write them into `BRAIN.md → Top Guardrails`.

**Round 4 — Registries:**
> "Any lookup tables you reference often — infra resources, repo catalog, glossary, environments?"

Yes → create `registries/{name}.md` from `templates/registry.md` per table; register in `registries/_index.md`.

**Round 5 — Seed import (optional):**
> "Got an existing context-pack or onboarding doc to import? I can bootstrap the brain from it."

Yes → run /ingest on the document now. Queue further documents for post-init.

**Stop condition:** scope + at least one cluster + `harness/conventions.md` exist. Further rounds optional.

After the interview, run **Harness Self-Wire**, then report the file list.

---

## Generate

Instantiate files from `templates/` (bundled with this skill package — mirrors the full seed `.synaptic/` layout). If `templates/` is missing, generate directly and notify the user.

**v1 layout to generate:**

```
.synaptic/
├── BRAIN.md                    ← filled from interview (Context Capsule, Capture Contract, Top Guardrails, Brain Map)
├── knowledge/
│   ├── INDEX.md                ← cluster stubs from Round 2
│   ├── {cluster}/
│   │   └── _index.md           ← sub-MOC (1-line per node)
│   └── lessons/
│       └── README.md
├── registries/
│   └── _index.md               ← empty index (+ any tables from Round 4)
├── references/
│   ├── _index.md               ← empty existence index
│   └── raw/                    ← verbatim drop-zone
├── harness/
│   ├── conventions.md          ← from Round 3
│   ├── guardrails.md           ← from Round 3
│   └── skills/
│       └── README.md
├── playgrounds/
│   └── README.md
├── journal/
│   └── _current.md
└── templates/
    ├── node.md
    ├── registry.md
    ├── playbook.md
    └── lesson.md
```

Use real data — no `{{placeholder}}` values in generated files. Report the full file list when done.

---

## Harness Self-Wire

Run after /init or on any boot where wiring is absent. Goal: make every agent in the project aware of the brain automatically, without touching user persona config.

### a. AGENTS.md fragment (idempotent, marker-wrapped)

Search for `<!-- BEGIN:SYNAPTIC -->` in the project root `AGENTS.md`.

- **Found:** replace the entire BEGIN:SYNAPTIC … END:SYNAPTIC block with the block below.
- **Not found:** append the block (create `AGENTS.md` if it does not exist).

Write exactly this block — ≤13 lines, no additions:

```
<!-- BEGIN:SYNAPTIC -->
## Synaptic Brain
This project has a Synaptic brain at `.synaptic/`. Before working: read `.synaptic/BRAIN.md`
and follow its capture contract (route durable knowledge, lessons, playbooks, and task
workspaces as specified; files are authoritative over any agent-native memory).
Honor team conventions in `.synaptic/harness/conventions.md`. Top guardrails in BRAIN.md.
Full harness (conventions/guardrails/skills) in `.synaptic/harness/` — load on demand.
Commands (synaptic skill): /init /consolidate /ingest /audit /upgrade
<!-- END:SYNAPTIC -->
```

Do **not** touch `CLAUDE.md` (user persona territory). If the user explicitly asks to add a brain pointer there, do so only on their explicit instruction.

### b. Skill install

Copy this skill package directory (where this SKILL.md lives, with its `references/` and `templates/`) into:

- `.claude/skills/synaptic/` — discovered by Claude Code, VS Code Copilot, OpenCode
- `.agents/skills/synaptic/` — discovered by VS Code Copilot, Gemini CLI, OpenCode, Codex

Create directories if absent. If a target already contains a `SKILL.md` with the same `version:`, skip and report "already present". Otherwise overwrite.

### c. Cursor shim (optional)

If `.cursor/` exists in the project root, write `.cursor/rules/synaptic.mdc`:

```
This project has a Synaptic brain. See AGENTS.md (BEGIN:SYNAPTIC block) for instructions.
Read `.synaptic/BRAIN.md` at session start. Commands: /init /consolidate /ingest /audit /upgrade
```

### d. Cross-agent sync

Cross-agent rule-sync tools (gentle-ai, ai-rules-sync, block/ai-rules, rulesync) pick up the skill directories automatically — nothing else to configure.

---

## Operations

Load the referenced file only when the operation is invoked, not at boot.

| Command | What it does | Reference |
|---|---|---|
| `/init` | No brain → interview + generate + wire. Brain present but unwired → wire only. Brain present + wired → extend (add cluster / registries / ingest). | This file |
| `/consolidate` | Run the 6-step capture contract on session output | `references/consolidate.md` |
| `/ingest [file]` | Distill a document into an atomic node + reference entry | `references/ingest.md` |
| `/audit` | Staleness, orphans, broken `[[wikilinks]]`, MOC coverage, registry integrity, oversized untyped nodes, tag hygiene | `references/audit.md` |
| `/upgrade` | Migrate v0.3 / v0.4 / v0.5 brain to v1 | `references/upgrade-to-v1.md` |

**Tools awareness:** if a runtime is available, prefer `tools/` scripts (check/migrate/export/vault-open) for the mechanical steps. If no runtime, perform the operation manually as described in the reference files.
