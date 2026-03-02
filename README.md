# 🧠 SYNAPTIC-CORE

> An open standard for portable AI brains — instruction manuals that any agent can assimilate and any human can read.

## What is this?

SYNAPTIC-CORE is a **file-based standard** for building portable AI knowledge systems ("brains") that:

- Any AI agent can **bootstrap from** (vendor-agnostic)
- Any human can **read and edit** (Markdown-first)
- Can be **copied between devices, people, and projects** (portable)
- Work with **zero installations** (corporate-friendly)

## Quick Start

### Option A: Download the seed

1. Download the [latest release](https://github.com/synaptic-core/synaptic-core/releases) zip
2. Unzip `.synaptic/` into your project root
3. Open your project with any AI agent — it will read `BOOTSTRAP.md` and onboard itself

### Option B: Use the standalone skill

1. Copy `standalone/synaptic-init/SKILL.md` to your agent's skills directory
2. Run `/synaptic-init`
3. Answer 3-5 questions — the agent generates your personalized brain

## The Matrioshka Architecture

```
     ┌────────────────────────────────────┐
     │         🌐 ECOSYSTEM              │
     │   Plugins (each its own repo)     │
     │                                    │
     │   ┌────────────────────────┐      │
     │   │      🔧 TOOLS          │      │
     │   │   Automation scripts   │      │
     │   │                        │      │
     │   │   ┌──────────────┐    │      │
     │   │   │  🧠 CORE     │    │      │
     │   │   │  Pure files  │    │      │
     │   │   │  Zero deps   │    │      │
     │   │   └──────────────┘    │      │
     │   └────────────────────────┘      │
     └────────────────────────────────────┘
```

**CORE** always works alone. TOOLS and ECOSYSTEM are optional enhancements.

## Repository Structure

```
synaptic-core/
├── seed/           # 🧠 The reference brain skeleton (packaged in releases)
├── spec/           # 📐 Formal standard specification
├── docs/           # 📚 Development docs & architecture decisions
├── standalone/     # 🚀 Standalone skills (install without the full brain)
└── examples/       # 🧪 Example brains
```

## Brain Structure

```
.synaptic/
├── MANIFEST.md          # Brain metadata & version
├── BOOTSTRAP.md         # Agent initialization protocol
├── identity/            # WHO: role, principles, contacts
├── knowledge/           # WHAT: areas, domains, lessons
├── inventory/           # THINGS: projects, environments, glossary
├── references/          # VERBATIM: schemas, specs, DDLs
├── journal/             # WHEN: session working memory
└── skills/              # HOW: init, consolidate, ingest
```

## Available Commands

| Command | What it does |
|---------|-------------|
| `/init` | Set up or extend the brain |
| `/consolidate` | Move working memory into structured knowledge |
| `/ingest [file]` | Ingest a document into the brain |
| `/help` | List available commands |

## License

MIT
