# SYNAPTIC-CORE — Bootstrap Protocol

> You are reading a Synaptic brain. Follow this protocol to initialize yourself.

## Step 0: Detect Capabilities

1. Check: can you execute `node --version`? → Record `tools:node`
2. Check: can you execute `python --version`? → Record `tools:python`
3. If neither → pure file mode (all operations via prompts)
4. If tools available and `tools/` directory has scripts → use them for mechanical operations

## Step 1: Read MANIFEST.md

Load brain metadata: version, name, areas, domains, capabilities.

## Step 2: Adopt Identity

Read `identity/ROLE.md` → adopt the role, expertise, and communication style.
Read `identity/PRINCIPLES.md` → load decision-making constraints.
Skim `identity/CONTACTS.md` → know who the key people are.
Read `identity/HEARTBEAT.md` → memorize the condensed identity checkpoint.

## Step 3: Load Knowledge Map

Read `knowledge/_tree.yaml` → build your mental map of available knowledge.
Do NOT load full knowledge files yet — only read them when needed for a specific task.
If `_tree.yaml` is missing, scan `knowledge/` directories and rebuild it.

## Step 4: Resume Session

Read `journal/_current.md` → understand where the last session left off.
If empty → fresh session. If populated → resume from last stop point.

## Ready

You now have structured context. Work normally, following the rules below.

---

## ⚠️ Anti-Drift Protocol

**CRITICAL**: In long sessions, you WILL lose your identity. Logs, code, and debug output will crowd out your initial instructions. This is expected LLM behavior — fight it actively.

### Heartbeat

After completing each major subtask:
1. **Re-read `identity/HEARTBEAT.md`** — it takes 5 seconds, prevents identity loss
2. **Update `journal/_current.md`** — capture what you just did and what's next
3. Only then proceed to the next task

If you notice yourself sounding generic, overly formal, or forgetting context: **stop and re-read HEARTBEAT.md immediately**.

### Forced Journaling

When receiving a complex request from the user:
- **FIRST action**: Write your plan in `journal/_current.md`
- **Work**: Execute the plan
- **LAST action**: Update `journal/_current.md` with results and next steps

Do NOT skip journaling. A brain that doesn't write things down is just a chat thread.

---

## Session Rhythm

Every session follows three phases:

### 🔵 Orient (you just did this)
Bootstrap protocol above. You're oriented.

### 🟢 Work
Execute tasks. Route information using the **routing tree** below. Apply the **heartbeat** after each major subtask.

### 🟠 Persist (before session ends)
1. If `_current.md` has actionable content → run `/consolidate`
2. If not enough for full consolidation → update `_current.md` with:
   - Where you stopped
   - What's pending
   - Any open decisions

---

## Memory Routing Decision Tree

When you capture information during a session, route it using this tree:

```
Is this about the brain's identity or methodology?
├── YES: Durable self-knowledge?
│   ├── YES → identity/ (role, principles, contacts)
│   └── NO → journal/_current.md
│
└── NO: Domain/project knowledge?
    ├── YES: Worth finding in a future session?
    │   ├── YES → knowledge/ (areas, domains, lessons)
    │   └── NO → journal/_current.md (may consolidate later)
    │
    └── NO: Concrete data (IDs, URLs, endpoints)?
        ├── YES → inventory/
        └── NO → Don't capture. Your own native memory handles it.
```

**Quick routing rules:**

| Content type | Destination |
|-------------|-------------|
| "We decided to use X" | `journal/_current.md` → consolidate to `knowledge/` |
| "The project ID is ABC-123" | `inventory/projects.md` |
| "I learned that X causes Y" | `journal/_current.md` → consolidate to `knowledge/lessons/` |
| "My role involves X" | `identity/ROLE.md` |
| "Always do X before Y" | `identity/PRINCIPLES.md` |
| Debug output, temp reasoning | Don't capture |

---

## Discovery-First Rule

Before creating ANY knowledge node, ask yourself:

> **"How will a future agent, reading only `_tree.yaml`, find this?"**

Checklist:
- [ ] Title clearly describes the content
- [ ] Node appears in its area/domain `_overview.md`
- [ ] Node is reflected in `_tree.yaml` with a one-line summary
- [ ] A new agent bootstrapping cold would know this exists

If a node fails this checklist, it might as well not exist.

---

## Conflation Warnings

These are the top 3 anti-patterns. Do not fall into them:

1. **Ops → Notes**: If it's temporal ("today I did X"), it stays in `journal/`. Only durable decisions and lessons get consolidated into `knowledge/`.

2. **Notes → Ops**: If `_current.md` exceeds ~200 lines, proactively suggest `/consolidate` to the user. Don't let insights get buried in session logs.

3. **Identity → Knowledge**: "I work best when..." or "Always use TypeScript" belongs in `identity/`, NOT in `knowledge/domains/`. Use the routing tree.

---

## Available Commands

| Command | Skill | What it does |
|---------|-------|-------------|
| `/init` | `skills/init/SKILL.md` | Set up or extend the brain |
| `/consolidate` | `skills/consolidate/SKILL.md` | Move working memory into structured knowledge |
| `/ingest [file]` | `skills/ingest/SKILL.md` | Ingest a document into the brain |
| `/discover` | `skills/discover/SKILL.md` | Suggest relevant skills/tools for your context |
| `/audit` | `skills/audit/SKILL.md` | Review brain for gaps, stale data, missing info |
| `/help` | `skills/help/SKILL.md` | List available commands and brain status |

---

## Size Budgets

Keep files within these limits for optimal agent performance:

| File type | Max lines | Action if exceeded |
|-----------|-----------|-------------------|
| `_tree.yaml` | ~200 | Split into domain-level sub-trees |
| `_overview.md` | ~50 | Summarize more aggressively |
| Knowledge node `.md` | ~150 | Split into sub-topics |
| `_current.md` | ~200 | Trigger `/consolidate` |
| `HEARTBEAT.md` | ~20 | Keep it ultra-condensed |

---

## Directory Map

```
.synaptic/
├── MANIFEST.md          # Brain metadata
├── BOOTSTRAP.md         # This file
├── identity/            # WHO: role, principles, contacts, heartbeat
│   └── HEARTBEAT.md     # Anti-drift checkpoint (re-read after each task)
├── knowledge/           # WHAT: areas, domains, lessons
│   ├── _tree.yaml       # Agent-optimized index (auto-generated)
│   ├── INDEX.md         # Human-readable knowledge map
│   ├── areas/           # Where you work (products, tools)
│   ├── domains/         # Cross-cutting knowledge (architecture, processes)
│   └── lessons/         # Post-task learnings
├── inventory/           # THINGS: project IDs, endpoints, glossary
├── references/          # VERBATIM: schemas, specs, DDLs
├── journal/             # WHEN: session working memory
│   ├── _current.md      # Active session (→ consolidate)
│   └── archive/         # Past sessions
└── skills/              # HOW: init, consolidate, ingest, discover, audit, help
```
