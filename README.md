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

## Use Cases

### 🏗️ Per-project brain vs. global brain

You can use SYNAPTIC-CORE in two ways, depending on your workflow:

| Approach | How | Best for |
|----------|-----|----------|
| **Per-project** | Drop `.synaptic/` in each project folder | Deep context for a specific codebase, client, or product. More focused, less noise. |
| **Global** | Place `.synaptic/` in a parent folder that contains all your projects | Broader context across projects. The agent always has your full knowledge, regardless of which project you're working on. |

Both work. Per-project brains are more focused and efficient (smaller context = faster reasoning). Global brains give you cross-project knowledge at the cost of a larger context window. Start per-project and graduate to global once you see what works for you.

### 🔒 Security & Transparency

There are no hidden scripts, no network calls, no opaque binaries. Every file in `.synaptic/` is Markdown or YAML — you can read every line, audit every instruction, and know exactly what your agent sees.

This matters for enterprise environments:
- **No data leaves your machine** — CORE is pure files, no APIs
- **Fully auditable** — print it out, hand it to compliance, they can read it
- **Your agent, your rules** — Synaptic tells the agent *what you know*, not *what to do with external services*

With a Copilot license and a Synaptic brain, a team can build perfect onboarding documentation, role templates, and project playbooks that make every team member more productive — and yes, more replaceable. That's a feature for organizations, not a bug.

### 📦 Portability & Inheritance

Your `.synaptic/` brain is a folder. It copies, zips, emails, and version-controls like any other folder.

- **Switch tools?** Copy `.synaptic/` to your new agent's workspace. Done.
- **New team member?** Hand them your brain. They get 2 years of context in 30 seconds.
- **Going on leave?** Your replacement reads `BOOTSTRAP.md` and knows who does what, where things are, and what the rules are.
- **Want to read it yourself?** Print it. It's Markdown. It's structured. It makes sense without an AI.

### 📝 Documentation generation

One of the most powerful (and least obvious) use cases: **Synaptic as a documentation engine.**

Just work normally — talk to your agent, make decisions, learn things. Your brain captures it all in `journal/_current.md`. Run `/consolidate` and your working memory crystallizes into structured knowledge. Over time, your `.synaptic/` folder becomes a living documentation hub.

Need a formal doc? Ask your agent: *"Write a technical overview of our authentication system based on what's in the brain."* It has all the context. It writes the doc. You review. Done.

This works especially well with voice — dictate to your agent while working, and let Synaptic organize it later.

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

## What SYNAPTIC-CORE is NOT

- **Not a task manager** — Use [GSD](https://github.com/gsd-build/get-shit-done), Jira, or Linear for that. Synaptic stores *knowledge*, not *to-do lists*.
- **Not an agent framework** — It doesn't replace `.agent/`, `AGENTS.md`, or tool configs. Those tell the agent *how to behave*. Synaptic tells it *what you know*.
- **Not a database** — No queries, no schemas, no server. Just files.
- **Not domain-specific** — No React patterns, no Kubernetes playbooks, no language-specific rules baked in. SYNAPTIC-CORE is a *structure*, not content. Your brain is yours to fill.
- **Not opinionated about your agent** — Works with Claude Code, Antigravity, Cursor, Copilot, Windsurf, OpenCode, or any agent that can read files. We don't pick favorites.
- **Not heavy** — The seed is ~30 files, all Markdown/YAML. No dependencies, no build step, no node_modules.

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
