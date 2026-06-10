---
name: synaptic
version: 0.5.0-alpha
description: >
  Knowledge-graph memory layer for project work — a portable, file-based brain that turns
  daily work into structured, indexable, agent-usable knowledge. Triggers: `.synaptic/`
  exists in the workspace, user wants persistent project memory or an AI brain, or user
  invokes /init /consolidate /ingest /audit /upgrade.
---

# Synaptic Brain Skill

## Detect on Load

```
Does .synaptic/BRAIN.md exist?
├── YES → Boot: read BRAIN.md, follow it.
│         Check frontmatter version: < 0.5 → offer /upgrade.
│
└── NO — Does .synaptic/ exist (no BRAIN.md)?
    ├── YES → v0.3 brain detected.
    │         Offer /upgrade: "Found a v0.3 brain — run /upgrade to migrate to v0.5."
    │         Load references/upgrade-to-v05.md when user confirms.
    └── NO  → No brain found.
              Offer onboarding: "No brain found — start the setup interview? (y/n)"
```

When booting: read `BRAIN.md` only. Load all other files on demand via `knowledge/INDEX.md`.

---

## Onboarding Interview v2

Ask **1–2 questions at a time**. Build on answers; give examples when helpful.

**Round 0 — Scope:**
> "Is this brain for a project, a role, an organisation, or your life?"

Tailor subsequent framing to the answer (e.g. "your stack" for project, "your domains" for org).

**Round 1 — Coverage + Owner role:**
> "What should this brain cover? And what is your role in it — developer, lead, analyst?"

The answers become the `Brain Context` block in `BRAIN.md` (2–4 lines: what it covers; the owner's
role in this project). This is *retrieval framing*, **not persona**.

If the user starts describing tone, language preferences, or agent behaviour: gently note that those
belong in their harness (AGENTS.md / CLAUDE.md / agent instructions), not in the brain. Offer to
place them there instead.

**Round 2 — Main topics:**
> "What are the main areas, products, or systems this brain will cover?"

Use the answers to seed `knowledge/INDEX.md` section stubs.

**Round 3 — Constraints worth persisting:**
> "Any hard constraints, rules, or facts that should always be available to an agent working here?"

Route these to a knowledge page (e.g. `project-constraints.md`), **not** an identity file. The brain
has no identity directory.

**Round 4 — Documents to ingest (optional):**
> "Any existing schemas, specs, or docs to bring in now?"

Queue for /ingest after setup. Load `references/ingest.md` for each file.

Stop when: scope + at least one area + one constraint page exist. Further rounds are optional.

---

## Generate

After the interview, instantiate files from the `templates/` directory bundled with this skill
package (synced from the seed at release). If `templates/` is missing, generate files directly
following the v0.5 layout and conventions.

**v0.5 layout to generate:**

```
.synaptic/
├── BRAIN.md                    ← filled from interview (Brain Context, scope, budgets)
├── knowledge/
│   ├── INDEX.md                ← section stubs from Round 2
│   └── project-constraints.md ← from Round 3 (if constraints provided)
├── playbooks/
│   └── _index.md               ← empty
├── playgrounds/
│   └── README.md               ← standard copy
├── references/
│   └── _index.md               ← empty
├── journal/
│   └── _current.md             ← fresh template
└── templates/
    ├── page.md
    └── playbook.md
```

Use real data only — no `{{placeholder}}` values in generated files. Report the full file list
when done.

---

## Harness Integration

Run this after generating (or on /upgrade). The goal: make every agent in the project aware of
the brain automatically, without touching user persona config.

### a. AGENTS.md fragment (idempotent)

Search for `<!-- BEGIN:SYNAPTIC -->` in the project root `AGENTS.md`.

- **Found:** replace the entire `BEGIN:SYNAPTIC … END:SYNAPTIC` block with the block below.
- **Not found:** append the block below to `AGENTS.md` (create the file if it does not exist).

Write exactly this block — no additions, no reformatting:

```
<!-- BEGIN:SYNAPTIC -->
## Synaptic Brain
This project has a Synaptic brain at `.synaptic/` — a portable knowledge graph of project
knowledge, playbooks and working memory. Before working: read `.synaptic/BRAIN.md` and follow
its contribution protocol (route new durable knowledge, lessons, playbooks and task workspaces
as it specifies; files are authoritative over any agent-native memory).
Commands (synaptic skill): /init /consolidate /ingest /audit /upgrade
<!-- END:SYNAPTIC -->
```

Do **not** touch `CLAUDE.md` — that is user persona territory. If the user explicitly asks to add
a brain pointer there, do so, but only with their explicit instruction.

### b. Skill install

Copy this skill package directory into the project at:

- `.claude/skills/synaptic/` — discovered by Claude Code, VS Code Copilot, OpenCode
- `.agents/skills/synaptic/` — discovered by VS Code Copilot, Gemini CLI, OpenCode, Codex

Create the directories if they do not exist. If either target already contains a `SKILL.md` with
the same `version:` in its frontmatter (or no version field), skip and log "already present".
Otherwise overwrite.

### c. Cursor shim (optional)

If `.cursor/` exists in the project root, write `.cursor/rules/synaptic.mdc`:

```
This project has a Synaptic brain. See AGENTS.md (BEGIN:SYNAPTIC block) for instructions.
Read `.synaptic/BRAIN.md` at session start. Commands: /init /consolidate /ingest /audit /upgrade
```

### d. Cross-agent sync compatibility

Cross-agent rule sync tools (gentle-ai, ai-rules-sync, block/ai-rules, rulesync) pick up the
skill directories automatically — nothing else to configure.

---

## Operations

Load the referenced file when the operation is invoked, not at boot.

| Command | What it does | Reference |
|---------|-------------|-----------|
| `/init` | Start setup interview or extend brain structure | this file §Onboarding |
| `/consolidate` | Route working memory → structured knowledge | `references/consolidate.md` |
| `/ingest [file]` | Ingest a document into the brain | `references/ingest.md` |
| `/audit` | Staleness, orphans, budget violations, link health | `references/audit.md` |
| `/upgrade` | Migrate v0.3 or v0.4 brain to v0.5 | `references/upgrade-to-v05.md` |
