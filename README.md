# 🧠 SYNAPTIC-CORE

**An open standard for portable AI brains.**

Your knowledge shouldn't be locked inside a chat thread that expires, scattered across `.md` files without structure, or lost when you switch tools. SYNAPTIC-CORE is a file-based standard that gives AI agents structured memory — and gives *you* a knowledge base you can read, edit, copy, and share.

> **One brain. Any agent. Zero installations.**

---

## Why does this exist?

If you work with AI coding agents, you've probably hit these walls:

- 🔁 **Repeating yourself** every new session — "Remember, we use TypeScript here, the database is Postgres, talk to Thomas about CI/CD..."
- 🧩 **Context scattered everywhere** — some in a Gemini gem, some in `.agent/rules`, some in your head
- 🔒 **Vendor lock-in** — your Claude config doesn't work in Cursor, your Copilot context doesn't travel to Antigravity
- 👻 **Tribal knowledge** — your colleague quits and takes 2 years of project context with them

SYNAPTIC-CORE fixes this by defining a **portable, human-readable brain** that any AI agent can assimilate in seconds.

---

## How it works

```
.synaptic/                    ← Drop this into any project
├── BRAIN.md                  ← Agent reads this ONE file at boot (≤120 lines)
├── cortex.config.yaml        ← Agent behavior settings
├── identity/                 ← WHO: role, principles, contacts (depth-on-demand)
├── knowledge/                ← WHAT: wiki pages, navigated via INDEX.md
│   └── INDEX.md              ← The single navigation hub (map of content)
├── playbooks/                ← HOW: action recipes distilled from successful work
├── worklines/                ← WHERE WE'RE GOING: active work directions & tasks
├── journal/                  ← WHEN: session working memory
└── skills/                   ← Local custom skills for this brain only
```

When an agent opens your project, it reads `BRAIN.md` — one file, ≤120 lines — and knows:
- **Who you are** — your role, expertise, and constraints
- **Where to look** — a brain map that routes every kind of information to the right place
- **What you're working on** — a pointer to your active worklines and journal
- **How to navigate** — `knowledge/INDEX.md` is the sole hub; everything else is on demand

All of it in Markdown. All of it human-readable. No databases, no APIs, no magic.

Boot cost: **~800 tokens** (vs ~5.5–6.4k tokens in v0.3) — roughly 10× cheaper session start.

---

## Quick Start

### Option A: Install the `synaptic` skill 🤖

Copy [`standalone/synaptic/SKILL.md`](standalone/synaptic/SKILL.md) to your agent's skills directory:

```bash
# Example for agents that support .agent/skills/
cp standalone/synaptic/SKILL.md .agent/skills/synaptic/SKILL.md
```

Then tell your agent: `/init`

The skill runs a Socratic interview (3–5 rounds, scope-aware), generates a complete personalized brain, and writes harness bridges for every agent platform it detects. No download needed beyond that single file.

### Option B: Drop the seed brain 📦

1. Copy [`seed/.synaptic/`](seed/.synaptic/) into your project root
2. Open `BRAIN.md` and fill in the identity capsule (role, constraints, scope)
3. Open your project with any AI agent — it reads `BRAIN.md` and onboards itself

---

## Playbooks

A playbook is an agent-followable recipe distilled from successful work. Its purpose is to teach the agent to **generate a plan** — assess the current state, identify gaps, produce a prioritised action list — not follow a fixed sequence blindly.

Playbooks are first-class citizens in v0.4. They live in `playbooks/`, are indexed in `playbooks/_index.md`, and follow a lifecycle:

> recon (observe a recurring task) → draft (extract from first real success) → refine (add one Gotcha entry per real failure)

A brain without playbooks is a reference. A brain with playbooks is a trained collaborator.

---

## Scope: one standard from a project to your whole life

`scope:` in `BRAIN.md` frontmatter declares what the brain covers:

| Scope | What it holds |
|-------|--------------|
| `project` | Deep context for a specific codebase, client, or product |
| `role` | Everything a person in a role knows — spans projects; the enterprise handover asset |
| `org` | Shared team or department knowledge (committed to a shared repo) |
| `life` | Same structure; areas = life domains (finance, health, home, work) |

The structure does not change across scopes. Start with `project`. Graduate when you see what works for you.

---

## Use Cases

### 🔒 Security & Transparency

There are no hidden scripts, no network calls, no opaque binaries. Every file in `.synaptic/` is Markdown or YAML — you can read every line, audit every instruction, and know exactly what your agent sees.

This matters for enterprise environments:
- **No data leaves your machine** — CORE is pure files, no APIs
- **Fully auditable** — print it out, hand it to compliance, they can read it
- **Your agent, your rules** — Synaptic tells the agent *what you know*, not *what to do with external services*

With a Copilot license and a Synaptic brain, a team can build structured onboarding documentation, role playbooks, and project context that ensures **knowledge continuity** — no matter who joins, leaves, or switches roles.

### 📦 Portability & Inheritance

Your `.synaptic/` brain is a folder. It copies, zips, emails, and version-controls like any other folder.

- **Switch tools?** Copy `.synaptic/` to your new agent's workspace. Done.
- **New team member?** Hand them your brain. They get 2 years of context in 30 seconds.
- **Going on leave?** Your replacement reads `BRAIN.md` and knows who does what, where things are, and what the rules are.
- **Want to read it yourself?** Print it. It's Markdown. It's structured. It makes sense without an AI.

### 📝 Documentation generation

One of the most powerful (and least obvious) use cases: **Synaptic as a documentation engine.**

Just work normally — talk to your agent, make decisions, learn things. Your brain captures it all in `journal/_current.md`. Run `/consolidate` and your working memory crystallizes into structured knowledge. Over time, your `.synaptic/` folder becomes a living documentation hub.

Need a formal doc? Ask your agent: *"Write a technical overview of our authentication system based on what's in the brain."* It has all the context. It writes the doc. You review. Done.

---

## The Matrioshka Architecture

SYNAPTIC-CORE follows a layered design where **inner layers never depend on outer ones**:

```
     ┌────────────────────────────────────┐
     │         🌐 ECOSYSTEM              │
     │   Plugins, MCPs, integrations     │
     │                                    │
     │   ┌────────────────────────┐      │
     │   │      🔧 TOOLS          │      │
     │   │   Scripts that enhance │      │
     │   │   (require runtime)    │      │
     │   │                        │      │
     │   │   ┌──────────────┐    │      │
     │   │   │  🧠 CORE     │    │      │
     │   │   │  Pure files  │    │      │
     │   │   │  Zero deps   │    │      │
     │   │   └──────────────┘    │      │
     │   └────────────────────────┘      │
     └────────────────────────────────────┘
```

**CORE** works everywhere, always. Even on an air-gapped corporate laptop with nothing installed. TOOLS and ECOSYSTEM are optional power-ups.

The optional `tools/check.js` (zero-dep Node ≥ 18) is the TOOLS-layer lint: it validates BRAIN.md line budget, knowledge-page frontmatter, INDEX.md coverage, and broken wikilinks without touching any external service.

---

## Commands

All commands are provided by the `synaptic` skill package (`standalone/synaptic/`). A brain without the skill installed still works — `BRAIN.md` is self-describing.

| Command | What it does |
|---------|-------------|
| `/init` | Set up or extend the brain (Socratic interview, scope-aware) |
| `/plan` | Create or manage worklines and tasks |
| `/consolidate` | Route working memory → structured knowledge; update INDEX.md |
| `/ingest [file]` | Summarise a document into a knowledge page |
| `/audit` | Review brain for staleness, orphan pages, budget violations |
| `/upgrade` | Migrate a v0.3 brain to v0.4 |

---

## Design Philosophy

- **Markdown-first** — Human-readable and human-editable. No proprietary formats.
- **Zero installations** — Works with just files. No runtime, no daemon, no database.
- **Agent-agnostic** — Claude Code, Antigravity, Cursor, Copilot, Windsurf... any agent that can read files.
- **Portable** — Copy `.synaptic/` to another machine, project, or colleague. It just works.
- **Knowledge-first** — Not a task manager. Not an ops tool. A structured knowledge base with direction and momentum.
- **Progressive enhancement** — CORE always works alone. Add TOOLS for scripts. Add ECOSYSTEM for integrations.
- **Single boot file** — One mandatory read at session start. Everything else on demand. Discipline enforced by budget, not ceremony.

---

## Upgrading from v0.3

Run `/upgrade` — the skill handles the migration automatically.

For a manual walkthrough, see [`standalone/synaptic/references/upgrade-v03-to-v04.md`](standalone/synaptic/references/upgrade-v03-to-v04.md). It covers the full content-preserving path: merging legacy boot files into BRAIN.md, flattening area/domain folders into wiki pages, rebuilding the index from scratch (with phantom-file pruning), and migrating point-in-time facts and verbatim assets into knowledge pages.

---

## What SYNAPTIC-CORE is NOT

- **Not a full task manager** — Use [GSD](https://github.com/gsd-build/get-shit-done), Jira, or Linear for comprehensive project management. Synaptic has *worklines* — lightweight work tracking that gives your brain direction, priorities, and context. It's a compass, not a Gantt chart.
- **Not an agent framework** — It doesn't replace `.agent/`, `AGENTS.md`, or tool configs. Those tell the agent *how to behave*. Synaptic tells it *what you know* and *where you're going*.
- **Not a database** — No queries, no schemas, no server. Just files.
- **Not domain-specific** — No React patterns, no Kubernetes playbooks, no language-specific rules baked in. SYNAPTIC-CORE is a *structure*, not content. Your brain is yours to fill.
- **Not opinionated about your agent** — Works with Claude Code, Antigravity, Cursor, Copilot, Windsurf, OpenCode, or any agent that can read files. We don't pick favorites.
- **Not heavy** — The seed is a handful of Markdown/YAML files. No dependencies, no build step, no node_modules.

---

## Repository Structure

```
synaptic-core/
├── seed/             # 🧠 The reference brain skeleton (.synaptic/ seed)
├── standalone/       # 🚀 The synaptic skill package (install without the full repo)
├── docs/             # 📚 Development docs & architecture decisions
└── tools/            # 🔧 Optional lint helpers (check.js)
```

---

## Acknowledgments & Inspiration

This project stands on the shoulders of great ideas from the agent-native knowledge management community:

- **[Arscontexta](https://github.com/agenticnotetaking/arscontexta)** — The definitive work on agent-native note-taking methodology. SYNAPTIC-CORE's memory routing decision tree, session rhythm (Orient → Work → Persist), discovery-first quality gate, and conflation warnings are directly inspired by Arscontexta's domain-derived architecture patterns.

- **[Get Shit Done (GSD)](https://github.com/gsd-build/get-shit-done)** — A pragmatic task management framework for agentic workflows. GSD's `map-codebase` pattern validated our "scan first, ask second" approach for workspace detection in `/init`. GSD's state hierarchy and planning model influenced our worklines design. GSD excels at planning and execution — Synaptic excels at memory and knowledge. They complement each other.

- **[ClawVault](https://github.com/ClawVault/ClawVault)** — Structured memory system for AI agents. ClawVault's MEMORY.md/vault duality and explicit `wake`/`sleep`/`checkpoint` lifecycle influenced our session rhythm and journal archiving patterns.

- **[Roam-Code](https://github.com/roam-code/roam-code)** — Architectural intelligence layer for AI coding agents. Roam's aggressive multi-platform config detection directly shaped our `/init` harness bridge step.

- **[skills.sh](https://skills.sh/)** — The open agent skills directory. The `.md`-as-skill convention directly influenced how SYNAPTIC-CORE skills are designed, and the `synaptic` skill package follows the Agent Skills progressive-disclosure standard.

- **Zettelkasten / LLM-wiki convergence** — v0.4's wiki-page model follows the Zettelkasten principle (links are the structure, folders are optional organisation) as validated by Karpathy's LLM-wiki work and the emerging LLM-wiki pattern (llmwiki.app): dense, linked, agent-navigable pages over shallow bullet hierarchies.

We believe in **synergy over competition**. SYNAPTIC-CORE is a knowledge standard, not an everything-toolkit.

---

## Contributing

We'd love your help! Whether it's:
- 🐛 Bug reports and edge cases
- 💡 Ideas for new skills or patterns
- 🧠 Example brains for different domains (design, DevOps, data science...)
- 📝 Improvements to the spec or documentation
- 🔌 ECOSYSTEM plugins and integrations

Open an issue or submit a PR. The standard is young and we're actively shaping it.

---

## License

MIT — Use it, fork it, improve it, share it.
