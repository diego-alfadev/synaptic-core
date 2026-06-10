---
name: synaptic
description: >
  Manage a Synaptic brain — a portable, file-based AI memory layer that turns daily work into
  structured, indexable, agent-usable knowledge. Triggers: a `.synaptic/` folder exists in the
  workspace, the user asks to set up persistent memory or an AI brain, or the user invokes
  /init /plan /consolidate /ingest /audit /upgrade.
---

# Synaptic Brain Skill

## 1. Detect on Load

```
Does .synaptic/BRAIN.md exist?
├── YES → Boot: read BRAIN.md, follow it. Done.
│
└── NO — Does .synaptic/ exist (but no BRAIN.md)?
    ├── YES → Offer /upgrade: "Found a v0.3 brain. Run /upgrade to migrate."
    │         Read references/upgrade-v03-to-v04.md before proceeding.
    └── NO  → Offer onboarding: "No brain found. Start the setup interview? (y/n)"
```

When booting: read `BRAIN.md` only. Load everything else on demand via `knowledge/INDEX.md`.

---

## 2. Onboarding Interview

Ask **1–2 questions at a time**. Build on answers. Be concrete. When in doubt, give examples.

**Round 0 — Scope** (always first):
> "Is this brain for a project, a role, an organisation, or your life?"

Branch the framing of later rounds accordingly (e.g., "your stack" for project, "your team" for role, "your domains" for org).

**Round 1 — Role & Context**:
> "What's your role and work context?"

Then one non-obvious probe:
> "If a successor inherited your work tomorrow, what would be hardest to transfer?"

Write `identity/ROLE.md`.

**Round 2 — Areas & Tribal Knowledge**:
> "What are the main areas, products, or topics you work on?"

Then:
> "Where does tribal knowledge live — things in your head that aren't written down anywhere?"

Write `knowledge/INDEX.md` with area stubs.

**Round 3 — Hard Rules & Never-Dos**:
> "What are the hard constraints or rules in your work? Anything that should never be done?"

Write `identity/PRINCIPLES.md`.

**Round 4 — Key People** (optional):
> "Who are the go-to people for specific topics?"

Write `identity/CONTACTS.md`.

**Round 5 — Documents to Ingest** (optional):
> "Any existing documents, schemas, or specs to bring in?"

Queue for `/ingest` after setup. Read `references/ingest.md` for each file.

**Stop when**: role + at least 1 area + some constraints exist. Further rounds are optional.

---

## 3. Generate

After the interview, instantiate the templates bundled with this skill (`templates/`, synced from
the repo seed at release) and populate with real data. If `templates/` is missing, generate the
files directly following the layout and conventions below:

```
.synaptic/
├── BRAIN.md              ← filled from interview (role capsule, scope, constraints)
├── cortex.config.yaml    ← standard copy
├── identity/
│   ├── ROLE.md           ← from Round 1
│   ├── PRINCIPLES.md     ← from Round 3
│   └── CONTACTS.md       ← from Round 4 (omit if skipped)
├── knowledge/
│   ├── INDEX.md          ← area stubs from Round 2
│   └── _page_template.md ← standard copy
├── playbooks/
│   ├── _index.md         ← empty standard copy
│   └── _playbook_template.md ← standard copy
├── journal/
│   └── _current.md       ← fresh template
└── worklines/
    └── _active.yaml      ← empty template
```

State the full file list when reporting completion. Use no placeholders — real data only.

---

## 4. Harness Bridges

After generating, detect agent platforms and write a bridge (≤10 lines) in each detected location:

```
CLAUDE.md                    → append ## Synaptic Brain section
AGENTS.md                    → append (only if file exists)
.github/copilot-instructions → append (only if .github/ exists)
.cursor/rules/synaptic.mdc   → write (create dir if missing)
.windsurf/rules/synaptic.md  → write (create dir if missing)
.clinerules/synaptic.md      → write (create dir if missing)
.aider/synaptic.md           → write (create dir if missing)
.continue/synaptic.md        → write (create dir if missing)
.agent(s)/rules/synaptic.md  → write (create dir if missing)
```

Bridge content — exactly this, no additions:
```markdown
## Synaptic Brain

This workspace has a Synaptic brain at `.synaptic/`.
At session start: read `.synaptic/BRAIN.md` and follow it.
Available commands: /init /plan /consolidate /ingest /audit /upgrade (synaptic skill).
```

Do NOT copy BRAIN.md contents into bridge files. The bridge is a pointer only. Protocol duplication caused 30–40% boot waste in v0.3.

---

## 5. Operations

| Command | What it does | Reference |
|---------|-------------|-----------|
| `/init` | Start setup interview or extend an existing brain | this file §2–4 |
| `/plan` | Create or manage worklines and tasks | `references/plan.md` |
| `/consolidate` | Route working memory into structured knowledge | `references/consolidate.md` |
| `/ingest [file]` | Summarise a document into a knowledge page | `references/ingest.md` |
| `/audit` | Staleness pass, orphan pages, budget violations | `references/audit.md` |
| `/upgrade` | Migrate a v0.3 brain to v0.4 | `references/upgrade-v03-to-v04.md` |

Load the referenced file **when the operation is invoked**, not at boot.
