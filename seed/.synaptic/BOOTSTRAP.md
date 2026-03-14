# SYNAPTIC-CORE — Bootstrap Protocol

> You are reading a Synaptic brain. Follow this protocol to initialize yourself.

## Step 0: Detect Capabilities

1. Check: can you execute `node --version`? → Record `tools:node`
2. Check: can you execute `python --version`? → Record `tools:python`
3. If neither → pure file mode (all operations via prompts)
4. If tools available and `tools/` directory has scripts → use them for mechanical operations
5. If `cortex.config.yaml` exists → read settings (checkpoint interval, size thresholds)

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

## Step 5: Work Mode Detection

Read `worklines/_active.yaml` → check for active work lines.

```
Has active worklines with recent activity?
├── YES → Present to user:
│         "Tienes líneas de trabajo activas:
│           - [workline]: [summary] (última actividad: [date])
│         ¿Quieres que revisemos alguna, o prefieres trabajar en modo rápido?"
│
│   ├── User chooses a workline → Load _meta.md + tasks/
│   │   → Enter Planning mode for that workline
│   │
│   └── User says "modo rápido" / gives a direct task → Fast mode
│
├── NO worklines exist → Fast mode
│   (If user mentions a project or sustained effort → suggest /plan)
│
└── File missing → Fast mode (brain may need /upgrade)
```

## Ready

You now have structured context. Work normally, following the rules below.

---

## ⚠️ Anti-Drift Protocol

**CRITICAL**: In long sessions, you WILL lose your identity. Logs, code, and debug output will crowd out your initial instructions. This is expected LLM behavior — fight it actively.

### Heartbeat

**Every 3-5 interactions**, or whenever the topic changes significantly:
1. **Re-read `identity/HEARTBEAT.md`** — it takes 5 seconds, prevents identity loss
2. **Update `journal/_current.md`** — capture what you just did and what's next
3. Only then proceed to the next task

### Drift Self-Detection

If ANY of these are true, **STOP immediately** and re-read `HEARTBEAT.md`:
- You're responding in a different language than configured in ROLE.md
- Your responses sound generic, overly formal, or could come from any agent
- You haven't referenced any brain file in your last 3 responses
- You've forgotten the user's role, constraints, or current project context
- You're making assumptions instead of checking knowledge/ or inventory/

After re-reading, tell the user: *"Un momento — recalibro contexto."* Then summarize what you remember about the current work.

### Smart Journaling

Not everything needs journaling. Use this decision:

```
When receiving a request:
├── Trivial? (< 1 min, no decisions, no new knowledge)
│   └── Just do it. Don't journal.
├── A question? (no changes, no decisions)
│   └── Answer it. Don't journal.
└── Complex? (multiple files, decisions, architecture, production impact)
    └── FIRST: Write plan in journal/_current.md
        THEN: Execute
        LAST: Update journal/_current.md with results
```

A brain that journals everything wastes tokens. A brain that journals nothing is just a chat thread. **Journal decisions and discoveries, not routine actions.**

---

## Session Rhythm

Every session follows three phases:

### 🔵 Orient (you just did this)
Bootstrap protocol above. You're oriented.

### 🟢 Work
Execute tasks. Route information using the **routing tree** below.

**Mandatory during work:**
- **Heartbeat check**: Re-read `HEARTBEAT.md` every 3-5 interactions, or when topic changes
- **Drift self-check**: If you notice drift signals → STOP → re-read HEARTBEAT.md
- **Size check**: If `_current.md` exceeds ~150 lines → suggest `/consolidate`
- **Workline sync** (Planning mode only): Update task progress in `worklines/` when completing steps

### 🟠 Persist (before session ends)
1. Update `journal/_current.md` with:
   - What was accomplished this session
   - Where you stopped
   - What's pending / next steps
   - Any open decisions
2. If in Planning mode → update workline task status
3. If `_current.md` has substantial content → suggest `/consolidate`
4. If useful content accumulated → suggest archiving to `journal/archive/`

---

## Memory Routing Decision Tree

When you capture information during a session, route it using this tree:

```
Is this about the brain's identity or methodology?
├── YES: Durable self-knowledge?
│   ├── YES → identity/ (role, principles, contacts)
│   └── NO → journal/_current.md
│
└── NO: Work planning? (objectives, tasks, direction, priorities)
    ├── YES → worklines/ (update _meta.md or task files)
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
| "The next step for project X is..." | `worklines/{project}/tasks/` |
| "We need to prioritize A over B" | `worklines/_active.yaml` (update priorities) |
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
| `/plan` | `skills/plan/SKILL.md` | Create or manage worklines and tasks |
| `/consolidate` | `skills/consolidate/SKILL.md` | Move working memory into structured knowledge |
| `/ingest [file]` | `skills/ingest/SKILL.md` | Ingest a document into the brain |
| `/discover` | `skills/discover/SKILL.md` | Suggest relevant skills/tools for your context |
| `/audit` | `skills/audit/SKILL.md` | Review brain for gaps, stale data, missing info |
| `/upgrade` | `skills/upgrade/SKILL.md` | Upgrade brain to latest version |
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
| `HEARTBEAT.md` | ~25 | Keep it ultra-condensed |
| `_meta.md` (workline) | ~50 | Keep objectives focused |

---

## Directory Map

```
.synaptic/
├── MANIFEST.md          # Brain metadata
├── BOOTSTRAP.md         # This file
├── cortex.config.yaml   # Cortex settings (checkpoint interval, thresholds)
├── identity/            # WHO: role, principles, contacts, heartbeat
│   └── HEARTBEAT.md     # Anti-drift checkpoint (re-read every 3-5 interactions)
├── knowledge/           # WHAT: areas, domains, lessons
│   ├── _tree.yaml       # Agent-optimized index (auto-generated)
│   ├── INDEX.md         # Human-readable knowledge map
│   ├── areas/           # Where you work (products, tools)
│   ├── domains/         # Cross-cutting knowledge (architecture, processes)
│   └── lessons/         # Post-task learnings
├── worklines/           # WHERE WE'RE GOING: active work directions
│   ├── _active.yaml     # Index of active worklines
│   ├── {workline}/      # Per-workline directory
│   │   ├── _meta.md     # Objective, context, decisions
│   │   └── tasks/       # Individual tasks
│   └── archive/         # Completed worklines
├── inventory/           # THINGS: project IDs, endpoints, glossary
├── references/          # VERBATIM: schemas, specs, DDLs
├── journal/             # WHEN: session working memory
│   ├── _current.md      # Active session (→ consolidate)
│   └── archive/         # Past sessions
└── skills/              # HOW: init, plan, consolidate, ingest, discover, audit, upgrade, help
```
