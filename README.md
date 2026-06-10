# SYNAPTIC-CORE

**A portable, file-based knowledge-graph memory layer for project work.**

Harness-agnostic. Minimal. Couplable. It complements your agent harness, your task system, and
any memory product you use — it never competes with them.

> **One brain. Any agent. Zero required installations.**

---

## Why does this exist?

If you work with AI coding agents, you've probably hit these walls:

- **Repeating yourself** every new session — "Remember, we use TypeScript here, the database is
  Postgres, talk to Thomas about CI/CD..."
- **Context scattered everywhere** — some in a Gemini gem, some in `.agent/rules`, some in your head
- **Vendor lock-in** — your Claude config doesn't work in Cursor, your Copilot context doesn't
  travel to another agent
- **Tribal knowledge** — a colleague quits and takes two years of project context with them

SYNAPTIC-CORE fixes this by defining a **portable, human-readable brain** — a knowledge graph your
agents maintain, your colleagues can read, and your tools can query — without depending on any
specific agent to stay intact.

---

## The separation rule

**Persona, tone, and behavior live in your harness. The brain holds only knowledge.**

| Concern | Lives in |
|---------|----------|
| Persona, language, global behavior | Your harness — CLAUDE.md, agent instructions, gentle-ai |
| Project coding rules, conventions | Project AGENTS.md (outside `.synaptic/`) |
| "This project has a brain — use it" | Project AGENTS.md — shipped automatically by `/init` |
| Lifecycle commands | Skill package installed in `.claude/skills/` + `.agents/skills/` |
| Knowledge graph + contribution protocol + working memory | `.synaptic/` — this standard |
| Tasks, roadmap, backlog | Your task system — Jira, Trello, MCP tasks, whatever you use |
| Vendor-native agent memory | Treated as a cache; files are authoritative |

Your Jarvis stays Jarvis. Your brain travels.

A Jarvis-persona agent and a vanilla agent must both be able to work the same brain without
any identity conflict. That is the guarantee this design makes.

**Team norms travel with the brain.** Operating agreements (communication languages per channel,
ticket conventions, review etiquette) live in `knowledge/working-agreements.md` — they pass the
ownership test and are part of the brain. The AGENTS.md fragment references them with a single
line; it never duplicates them.

---

## How it works

```
.synaptic/                    ← Drop this into any project
├── BRAIN.md                  ← Agent reads this ONE file at boot (≤100 lines, ~500 tokens)
├── knowledge/                ← Wiki pages (kebab-case, unique names)
│   └── INDEX.md              ← The sole navigation hub — the map of everything
├── playbooks/                ← Action recipes distilled from successful work
├── playgrounds/              ← Per-task workspaces: multi-day, multi-artifact, burnable
├── references/               ← Large verbatim artifacts — indexed, never eager-loaded
├── journal/                  ← Thin working memory — _current.md only, 80-line budget
└── templates/                ← Page and playbook templates
```

When an agent opens your project, it reads `BRAIN.md` — one file, ≤100 lines — and knows:

- **What this brain covers** — the project scope and the owner's role in it (retrieval framing,
  not persona)
- **Where to look** — a brain map that routes every kind of information to the right place
- **What to do next** — a resume pointer to the journal (lists active playgrounds and next step)
- **How to contribute** — the contribution protocol: route, link, name, commit

Boot cost: **~500 tokens** (vs ~5.5–6.4k tokens in v0.3) — roughly 10× cheaper per session.

All of it in Markdown. All of it human-readable. No databases, no APIs, no magic.

---

## Harness integration

At `/init`, the skill writes two things to your project:

**1. An AGENTS.md fragment** — a marker-wrapped block (~12 lines) that tells every AGENTS.md-aware
agent the brain exists and how to use it. Idempotent: upgrade replaces the block, never duplicates it.

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

AGENTS.md is the standard insertion point — adopted by 60,000+ repositories, recognized natively
by Cursor, Claude Code, VS Code Copilot, Codex, Gemini CLI, Windsurf, and OpenCode.

**2. The synaptic skill package** — installed into `.claude/skills/synaptic/` and
`.agents/skills/synaptic/` (both directories; auto-discovered by all major agents). An optional
`.cursor/rules/synaptic.mdc` shim is written if `.cursor/` is detected.

The skill package is the only thing that provides the lifecycle commands. The brain itself
(`BRAIN.md`) is self-describing — it works without the skill, it just loses the guided operations.

> **`CLAUDE.md` is user persona territory.** The skill never touches it. If you want to add a
> brain pointer there, ask explicitly — the skill can do it with your instruction.

---

## Quick Start

### Install in 60 seconds — pick your flow

**Flow 1 — Fresh start (new brain):**
1. Copy [`standalone/synaptic/SKILL.md`](standalone/synaptic/SKILL.md) to your project's skill dir:
   ```
   .claude/skills/synaptic/SKILL.md   # or
   .agents/skills/synaptic/SKILL.md
   ```
2. Tell your agent: `/init` — the skill interviews you, generates the brain, and wires your harness. Done.

**Flow 2 — Adopt a shared brain (clone or handover):**
1. Copy `.synaptic/` from the shared source into your project root.
2. Tell your agent: `/init` — the skill detects the existing brain (skips the interview) and re-wires your machine's harness (AGENTS.md fragment + skill dirs). Nothing else travels because the wiring is regenerable from brain + skill. Done.

**Flow 3 — Upgrade from v0.3 or v0.4:**
1. Tell your agent: `/upgrade` — the skill runs the hybrid migration guide interactively. Done.

**Skill-less fallback (any flow):** paste `"Read .synaptic/BRAIN.md and follow it."` to any agent — no install required.

---

### Option A: Install the `synaptic` skill

Copy [`standalone/synaptic/SKILL.md`](standalone/synaptic/SKILL.md) to your project's skill
directory, then tell your agent: `/init`

```
# The skill auto-discovers both directories; copy to either
.claude/skills/synaptic/SKILL.md
.agents/skills/synaptic/SKILL.md
```

The skill runs a Socratic interview (scope-aware), generates a complete personalized
brain, and wires the harness. No download required beyond that single file.

### Option B: Drop the seed brain

1. Copy [`seed/.synaptic/`](seed/.synaptic/) into your project root
2. Open `BRAIN.md` and fill in the Brain Context block (what this brain covers; your role in it)
3. Open your project with any AI agent — it reads `BRAIN.md` and onboards itself

---

## Playbooks

A playbook is an agent-followable recipe distilled from successful work. Its purpose is to teach
the agent to **generate a plan** — assess current state, identify gaps, produce a prioritised
action list — not follow a fixed sequence blindly.

Playbooks live in `playbooks/`, are indexed in `playbooks/_index.md`, and follow a lifecycle:

> recon (observe a recurring task) → draft (extract from first real success) → refine (add one Gotcha entry per real failure)

A brain without playbooks is a reference. A brain with playbooks is a trained collaborator.

---

## Playgrounds

A playground is an extended-journal workspace for tasks too big for `journal/_current.md`:
multi-day work, multiple artifacts, analysis, data pulls, drafts, deliverables.

**Lifecycle:** open (`playgrounds/{task-id}/`, register in journal) → work freely (no imposed
structure) → consolidate (durable findings → `knowledge/`; deliverables shipped) →
**burn by default** (delete after consolidation; archiving is the exception, not the rule).

Playgrounds are not indexed in `knowledge/INDEX.md` — their registry is `journal/_current.md`.
Use ticket IDs or kebab-case slugs: `feat-123-auth-refactor`, `q2-budget-analysis`.

The burn-by-default convention keeps the brain clean. If you skip consolidation before burning,
you lose context — the consolidation step is what preserves the value.

---

## References

A `references/` entry is a large verbatim artifact that must be **findable but not loaded** at
every turn: DDL schemas, API specs, data exports, large configuration files.

**Rule: index the existence, not the content.** `references/_index.md` lists each artifact with
one line (name, what it is, when it matters). Knowledge pages link to it when relevant. Agents
read fragments on demand — never eager-loaded, never duplicated into pages.

References can rot (the file changes, the index entry doesn't). The `/audit` command checks that
every entry in `_index.md` has a real file and flags missing cross-references.

---

## Obsidian-friendly

Open `.synaptic/` as an Obsidian vault: `[[wikilinks]]` and YAML frontmatter are native.
The knowledge graph renders with no configuration. The optional `tools/obsidian-setup.js`
(zero-dep, Node ≥ 18) writes `.obsidian/` config for graph view hygiene — it excludes
`templates/` and `journal/` from the graph, sets wikilinks to shortest-path resolution, and
ensures new files land in `knowledge/`. It never touches brain content.

**Backlinks:** Obsidian computes them live from `[[wikilinks]]`. In your agent, use:
`grep -r "[[page-name]]" .synaptic/knowledge/` — same result, no runtime required.

---

## Plays well with others

| Tool / pattern | Relationship | What to do |
|----------------|-------------|------------|
| **gentle-ai** | Harness configurator — persona, MCP, SDD, skill registry | Install skill in standard paths; gentle-ai picks it up automatically. Run `gentle-ai skill-registry refresh` after install. |
| **ai-rules-sync / block/ai-rules / rulesync** | Cross-agent rule sync | Add `.agents/skills/synaptic/` and `.claude/skills/synaptic/` to your sync manifest. No other integration needed. |
| **Engram** | Robust memory backend (SQLite + FTS5, MCP-based) | Horizon target: Engram provides fast semantic search over the brain. Use it as a cache layer; files stay authoritative. |
| **GraphRAG / RAG stacks** | Retrieval at scale | Horizon target: the CORE schema (frontmatter + INDEX + wikilinks) is the indexable surface. |
| **Jira / Trello / MCP task systems** | Task management | Tasks stay there. The brain documents context and decisions; it does not track tickets. |
| **Agent-native memory** (Claude Code auto-memory, Copilot Memory) | Vendor-scoped cache | Useful within its harness. Never authoritative. Files win when they conflict. |

---

## Scope: one standard from a project to your whole life

`scope:` in `BRAIN.md` frontmatter declares what the brain covers:

| Scope | What it holds |
|-------|--------------|
| `project` | Deep context for a specific codebase, client, or product |
| `role` | Everything a person in a role knows — spans projects; the enterprise handover asset |
| `org` | Shared team or department knowledge (committed to a shared repo) |
| `life` | Same structure; areas = life domains (finance, health, home, work) |

The structure does not change across scopes. Start with `project`. Graduate when you see what
works for you.

---

## Commands

All commands are provided by the `synaptic` skill package (`standalone/synaptic/`).
A brain without the skill installed still works — `BRAIN.md` is self-describing.

| Command | What it does |
|---------|-------------|
| `/init` | Set up or extend the brain (Socratic interview, scope-aware) |
| `/consolidate` | Route working memory → structured knowledge; update INDEX.md |
| `/ingest [file]` | Summarise a document into a knowledge page; large artifacts to references/ |
| `/audit` | Review brain for staleness, orphan pages, budget violations, broken links |
| `/upgrade` | Migrate a v0.3 or v0.4 brain to v0.5 |

---

## What SYNAPTIC-CORE is NOT

- **Not a task manager** — Use Jira, Linear, Trello, or your MCP task system for backlog and
  project tracking. The brain has no worklines, no task lists, no Gantt charts. It documents
  context and decisions; your task system tracks what needs doing.
- **Not a persona or behavior configurator** — No identity/, no cortex.config, no per-brain
  skill directories. Persona and behavior live in your harness. The brain travels without them.
- **Not an agent framework** — It doesn't replace AGENTS.md, CLAUDE.md, or tool configs. Those
  tell the agent how to behave. Synaptic tells it what you know.
- **Not a database** — No queries, no schemas, no server. Just files.
- **Not domain-specific** — No React patterns, no Kubernetes playbooks, no language-specific
  rules baked in. SYNAPTIC-CORE is a structure, not content. Your brain is yours to fill.
- **Not opinionated about your agent** — Works with Claude Code, Cursor, Copilot, Gemini CLI,
  OpenCode, Windsurf, Codex, or any agent that can read files.

---

## Design philosophy

- **Markdown-first** — Human-readable and human-editable. No proprietary formats.
- **Zero required installations** — No mandatory scripts. Works with just files. A script is a
  convenience, not a requirement.
- **Harness-clean** — No persona or behavior config inside the brain. The brain configures
  nothing about the agent beyond "use this brain correctly."
- **Agent-agnostic** — Any agent that can read files can use a Synaptic brain.
- **Portable** — Copy `.synaptic/` to another machine, project, or colleague. It just works.
- **Knowledge-first** — A structured knowledge graph with a contribution protocol. The protocol
  is what makes it a brain and not a pile of notes.
- **Progressive enhancement** — CORE always works alone. Add TOOLS for lint and Obsidian setup.
  Add ECOSYSTEM for Engram/MCP/RAG integrations.
- **Single boot file** — One mandatory read at session start. Everything else on demand.

---

## The Matrioshka Architecture

SYNAPTIC-CORE follows a layered design where inner layers never depend on outer ones:

```
     ┌────────────────────────────────────┐
     │         ECOSYSTEM                 │
     │   Engram, MCP, RAG, Obsidian      │
     │                                    │
     │   ┌────────────────────────┐      │
     │   │      TOOLS             │      │
     │   │   check.js (lint)      │      │
     │   │   obsidian-setup.js    │      │
     │   │   (require Node ≥ 18)  │      │
     │   │                        │      │
     │   │   ┌──────────────┐    │      │
     │   │   │  CORE        │    │      │
     │   │   │  Pure files  │    │      │
     │   │   │  Zero deps   │    │      │
     │   │   └──────────────┘    │      │
     │   └────────────────────────┘      │
     └────────────────────────────────────┘
```

**CORE** works everywhere, always — even on an air-gapped corporate laptop with nothing installed.
TOOLS and ECOSYSTEM are optional power-ups.

`tools/check.js` (zero-dep Node ≥ 18) validates BRAIN.md line budget, knowledge-page frontmatter,
INDEX.md coverage, kebab-case naming, broken wikilinks, references cross-check, and playground
age warnings — without touching any external service.

---

## Security and enterprise use

There are no hidden scripts, no network calls, no opaque binaries. Every file in `.synaptic/`
is Markdown or YAML — readable, auditable, printable.

- **No data leaves your machine** — CORE is pure files, no APIs
- **Fully auditable** — hand it to compliance, they can read it
- **Your agent, your rules** — Synaptic tells the agent what you know, not how to behave

With a Copilot license and a Synaptic brain, a team can build structured onboarding documentation,
role playbooks, and project context that ensures knowledge continuity — no matter who joins,
leaves, or switches roles.

---

## Upgrading from v0.3 or v0.4

Run `/upgrade` — the skill guides the migration in two phases:

- **Phase M (mechanical)** — deterministic file operations: delete removed structures
  (`identity/`, `worklines/`, `skills/`, `cortex.config.yaml`, BOOTSTRAP/MANIFEST/HEARTBEAT),
  create new directories (`playgrounds/`, `references/`, `templates/`), write the AGENTS.md
  fragment, install the skill package.
- **Phase C (content)** — capable agent judgment required: re-route identity content to BRAIN.md
  context and knowledge pages; triage worklines (active → playgrounds or task system; stale →
  discard); rebuild INDEX.md from files that actually exist; wikilink enrichment pass.

For a manual walkthrough see
[`standalone/synaptic/references/upgrade-to-v05.md`](standalone/synaptic/references/upgrade-to-v05.md).
It covers both v0.3 and v0.4 paths with a full verification checklist.

---

## Repository structure

```
synaptic-core/
├── seed/             # The reference brain skeleton (.synaptic/ seed for v0.5)
├── standalone/       # The synaptic skill package (install without the full repo)
├── docs/             # Development docs & architecture decisions
└── tools/            # Optional lint helpers (check.js, obsidian-setup.js)
```

---

## Acknowledgments & inspiration

- **[Arscontexta](https://github.com/agenticnotetaking/arscontexta)** — The definitive work on
  agent-native note-taking methodology. Synaptic's write-validation gate, session rhythm, and
  discovery-first quality gate are directly inspired by Arscontexta's domain-derived patterns.

- **[Get Shit Done (GSD)](https://github.com/gsd-build/get-shit-done)** — A pragmatic task
  management framework for agentic workflows. GSD excels at planning and execution — Synaptic
  excels at memory and knowledge. They complement each other.

- **[ClawVault](https://github.com/ClawVault/ClawVault)** — Structured memory for AI agents.
  ClawVault's wake/sleep lifecycle pattern influenced our session rhythm and journal design.

- **[Roam-Code](https://github.com/roam-code/roam-code)** — Architectural intelligence layer.
  Roam's aggressive multi-platform config detection shaped our `/init` harness bridge step.

- **[skills.sh / agentskills.io](https://agentskills.io)** — The open agent skills standard.
  The `synaptic` skill package follows the Agent Skills progressive-disclosure format.

- **Zettelkasten / LLM-wiki convergence** — v0.5's wiki-page model follows the Zettelkasten
  principle (links are the structure, folders are optional organisation) as validated by
  Karpathy's LLM-wiki work and the llmwiki.app pattern: dense, linked, agent-navigable pages
  over shallow bullet hierarchies.

We believe in synergy over competition. SYNAPTIC-CORE is a knowledge standard, not an
everything-toolkit.

---

## Contributing

Whether it's:
- Bug reports and edge cases
- Ideas for new skills or patterns
- Example brains for different domains (design, DevOps, data science...)
- Improvements to the spec or documentation
- ECOSYSTEM plugins and integrations

Open an issue or submit a PR. The standard is young and we're actively shaping it.

---

## License

MIT — Use it, fork it, improve it, share it.
