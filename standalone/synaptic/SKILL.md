---
name: synaptic
version: 1.0.0
description: >
  Knowledge-graph memory layer for project work — a portable, file-based brain that turns
  daily work into structured, indexable, agent-usable knowledge. Two planes: wiki (what you
  know) + harness (deployable operating-rules source). Triggers: `.synaptic/` present in the
  workspace, user wants persistent project memory or an AI brain, or user invokes
  /init /consolidate /ingest /audit /weave /upgrade.
---

# Synaptic Brain Skill — v1.0

## Detect on Load

```
Does .synaptic/BRAIN.md exist?
├── YES → Read BRAIN.md frontmatter version.
│         version ≥ 1.0 → Boot: read BRAIN.md, follow it.
│           Is harness wired? (BEGIN:SYNAPTIC in AGENTS.md AND BEGIN:SYNAPTIC-RULES present AND skill dir present)
│           ├── All present → normal boot.
│           └── Any missing → run Harness Self-Wire (wire + deploy; no interview), then boot.
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

Collect conventions → `harness/conventions.md` (create from seed template). Collect hard rules → `harness/guardrails.md`. Both files will be deployed to the outer harness by the Deploy step in Harness Self-Wire — do NOT write a guardrails block into BRAIN.md.

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
├── BRAIN.md                    ← filled from interview (Context Capsule, Capture Contract, deploy-source pointer, Brain Map)
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
Operating rules (conventions, guardrails) are in the SYNAPTIC-RULES section below.
Commands (synaptic skill): /init /consolidate /ingest /audit /weave /upgrade
<!-- END:SYNAPTIC -->
```

Do **not** touch `CLAUDE.md` (user persona territory). If the user explicitly asks to add a brain pointer there, do so only on their explicit instruction.

### b. Skill install

Copy this skill package directory (where this SKILL.md lives, with its `references/` and `templates/`) into:

- `.claude/skills/synaptic/` — discovered by Claude Code, VS Code Copilot, OpenCode
- `.agents/skills/synaptic/` — discovered by VS Code Copilot, Gemini CLI, OpenCode, Codex

Create directories if absent. If a target already contains a `SKILL.md` with the same `version:`, skip and report "already present". Otherwise overwrite.

### c. Deploy operating rules (idempotent)

This step materializes `harness/conventions.md` and `harness/guardrails.md` into the outer
harness so the agent reads them natively — without reaching into the brain at work-time.

**Preferred (Node runtime available):** run `node tools/deploy.js <project-root>` — it backs up
AGENTS.md before writing, prints a diff preview, and refuses to deploy if `harness/` still
contains `{{placeholder}}` content. Use `--dry-run` to preview without writing.

**Manual fallback (no Node runtime):**
1. Read `.synaptic/harness/conventions.md` and `.synaptic/harness/guardrails.md`.
2. **STOP** — if either file still contains `{{placeholder}}` values, do NOT deploy. Inform the
   user: "harness/ contains unfilled placeholders — complete the onboarding interview first."
3. Show the user a diff of the proposed SYNAPTIC-RULES block change and require confirmation
   before writing.
4. Compose a combined rules block from both files.
5. Search for `<!-- BEGIN:SYNAPTIC-RULES -->` in the project root `AGENTS.md`:
   - **Found:** replace the entire BEGIN:SYNAPTIC-RULES … END:SYNAPTIC-RULES block.
   - **Not found:** append the block after the BEGIN:SYNAPTIC block.
   - Never touch content outside the marked block.
6. Install `harness/skills/*` into `.claude/skills/{brain-name}-skills/` and
   `.agents/skills/{brain-name}-skills/` (namespaced by brain to avoid collisions — use the
   brain's root directory name or the `name:` field from `BRAIN.md` frontmatter if set). Same
   idempotent pattern as the synaptic skill install: skip if same version, otherwise overwrite.

The block written looks like:

```
<!-- BEGIN:SYNAPTIC-RULES -->
<!-- Auto-generated from .synaptic/harness/ — edit the source there, then re-run deploy; edits here are overwritten. -->
## Working Conventions
{content from harness/conventions.md — stripped of YAML frontmatter}

## Guardrails
{content from harness/guardrails.md — stripped of YAML frontmatter}
<!-- END:SYNAPTIC-RULES -->
```

**On re-deploy** (any subsequent `/init` or `/upgrade` run): the marked block is fully replaced
with the current source. Unmarked user content in AGENTS.md is never touched.

### d. Cursor shim (optional)

If `.cursor/` exists in the project root, write `.cursor/rules/synaptic.mdc`:

```
This project has a Synaptic brain. See AGENTS.md (BEGIN:SYNAPTIC block) for instructions.
Read `.synaptic/BRAIN.md` at session start. Commands: /init /consolidate /ingest /audit /weave /upgrade
```

### e. Cross-agent sync

Cross-agent rule-sync tools (gentle-ai, ai-rules-sync, block/ai-rules, rulesync) pick up the skill directories automatically — nothing else to configure.

---

## Operations

Load the referenced file only when the operation is invoked, not at boot.

| Command | What it does | Reference |
|---|---|---|
| `/init` | No brain → interview + generate + wire + deploy operating rules. Brain present but unwired → wire + deploy. Brain present + wired → extend (add cluster / registries / ingest). | This file |
| `/consolidate` | Run the 6-step capture contract on session output | `references/consolidate.md` |
| `/ingest [file]` | Distill a document into an atomic node + reference entry | `references/ingest.md` |
| `/audit` | Staleness, orphans, broken `[[wikilinks]]`, MOC coverage, registry integrity, oversized untyped nodes, tag hygiene | `references/audit.md` |
| `/weave` | Graph-gardening pass: propose missing `[[links]]`, flag under-connected nodes, detect concept gaps, suggest merges, promote recurring themes | `references/weave.md` |
| `/upgrade` | Migrate v0.3 / v0.4 / v0.5 brain to v1; redeploys operating rules | `references/upgrade-to-v1.md` |

**Tools awareness:** if a runtime is available, prefer `tools/` scripts (check/migrate/export/vault-open) for the mechanical steps. If no runtime, perform the operation manually as described in the reference files.
