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
├── BOOTSTRAP.md              ← Agent reads this first (instruction manual)
├── MANIFEST.md               ← Brain metadata & capabilities
├── identity/                 ← WHO: role, principles, contacts
├── knowledge/                ← WHAT: areas, domains, lessons learned
├── inventory/                ← THINGS: project IDs, endpoints, glossary
├── references/               ← VERBATIM: schemas, specs, DDLs
├── journal/                  ← WHEN: session working memory
└── skills/                   ← HOW: init, consolidate, ingest, discover, help
```

When an agent opens your project, it reads `BOOTSTRAP.md` and knows:
- **Who you are** — your role, expertise, and constraints
- **What you know** — your structured knowledge across areas and domains
- **What you're working on** — your current session context
- **How to route new info** — where to store decisions, lessons, and data

All of it in Markdown. All of it human-readable. No databases, no APIs, no magic.

---

## Quick Start

### Option A: Download the seed 📦

1. Go to [Releases](https://github.com/diego-alfadev/synaptic-core/releases)
2. Download `synaptic-seed.zip`
3. Extract `.synaptic/` into your project root
4. Open your project with any AI agent — it reads `BOOTSTRAP.md` and onboards itself
5. Run `/init` to personalize your brain through a brief dialogue

### Option B: Install the standalone skill 🤖

Copy [`standalone/synaptic-init/SKILL.md`](standalone/synaptic-init/SKILL.md) to your agent's skills directory:

```bash
# Example for agents that support .agent/skills/
cp standalone/synaptic-init/SKILL.md .agent/skills/synaptic-init/SKILL.md
```

Then just tell your agent: `/synaptic-init`

It scans your workspace, asks 3-5 questions, and generates a complete personalized brain. No download needed beyond that single file.

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

---

## Commands

| Command | What it does |
|---------|-------------|
| `/init` | Set up or extend the brain (with Socratic interview) |
| `/consolidate` | Move working memory → structured knowledge |
| `/ingest [file]` | Ingest a document (DDL, spec, etc.) into the brain |
| `/discover` | Suggest relevant skills/tools for your context |
| `/help` | Show brain status and quick reference |

---

## Design Philosophy

- **Markdown-first** — Human-readable and human-editable. No proprietary formats.
- **Zero installations** — Works with just files. No runtime, no daemon, no database.
- **Agent-agnostic** — Claude Code, Antigravity, Cursor, Copilot, Windsurf... any agent that can read files.
- **Portable** — Copy `.synaptic/` to another machine, project, or colleague. It just works.
- **Knowledge-first** — Not a task manager. Not an ops tool. A structured knowledge base.
- **Progressive enhancement** — CORE always works alone. Add TOOLS for scripts. Add ECOSYSTEM for integrations.

---

## Repository Structure

```
synaptic-core/
├── seed/             # 🧠 The reference brain skeleton (released as zip)
├── standalone/       # 🚀 Standalone skills (install without the full brain)
├── spec/             # 📐 Formal standard specification
├── docs/             # 📚 Development docs & architecture decisions
└── examples/         # 🧪 Example brains for learning
```

---

## Acknowledgments & Inspiration

This project stands on the shoulders of great ideas from the agent-native knowledge management community:

- **[Arscontexta](https://github.com/agenticnotetaking/arscontexta)** — The definitive work on agent-native note-taking methodology. SYNAPTIC-CORE's memory routing decision tree, session rhythm (Orient → Work → Persist), discovery-first quality gate, and conflation warnings are directly inspired by Arscontexta's domain-derived architecture patterns.

- **[Get Shit Done (GSD)](https://github.com/gsd-build/get-shit-done)** — A pragmatic task management framework for agentic workflows. GSD's `map-codebase` pattern validated our "scan first, ask second" approach for workspace detection in `/init`. GSD excels at planning and execution — Synaptic excels at memory and knowledge. They complement each other.

- **[skills.sh](https://skills.sh/)** — The open agent skills directory. Our `/discover` skill integrates with the skills.sh ecosystem to help users find and install relevant capabilities. The broader skills convention (`.md` files as agent instructions) directly influenced how SYNAPTIC-CORE skills are designed.

We believe in **synergy over competition**. SYNAPTIC-CORE is a knowledge standard, not an everything-toolkit. We'd love to see crossover plugins between these projects.

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
