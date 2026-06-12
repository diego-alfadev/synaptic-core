# SYNAPTIC-CORE

**A portable, file-based knowledge-graph brain for project work.**

> One boot file. Any agent. No required installations.

Synaptic turns daily work into structured, navigable, agent-usable knowledge — a brain that any agent can pick up in seconds and that travels with you when the project ends.

---

## The problem: the knowledge tax

If you work with AI coding agents, you pay this tax constantly:

- **Re-briefing every session** — "Remember, we use TypeScript here, the DB is Postgres, talk to Marta about CI/CD..."
- **Scattered context** — some in a gem, some in `.cursor/rules`, some in a colleague's head
- **Onboarding and handover friction** — reconstructing context from scattered notes and tribal memory takes days
- **Documentation drift** — decisions get made but never recorded; six months later nobody knows why
- **Knowledge walking out the door** — a contractor finishes and takes two years of project context with them

SYNAPTIC-CORE addresses this by defining a **portable, human-readable brain**: a knowledge graph that grows through real work, that any agent can navigate efficiently, and that survives every agent change, team reshuffle, and security review.

---

## What it is: two planes, one boot file

A `.synaptic/` brain has exactly **two planes** and one explicit out-of-scope:

| Plane | Holds | Test | Load |
|---|---|---|---|
| **Wiki** (`knowledge/`, `registries/`, `references/`) | What you **know**: patterns, decisions, playbooks, lessons, lookup tables, external references | "Does the agent *reason over* it?" | On demand via MOC |
| **Harness** (`harness/`) | How you **work here**: conventions, guardrails, project-local skills (e.g. a Jira CLI) | "Does the agent *obey or execute* it?" | Compressed subset in BRAIN.md; full depth on demand |
| **OUT — user harness** | Persona, tone, chat-language preference, agent personality | "Is it about how the agent treats *you*?" | Not in the brain at all |

The **only mandatory read** is `BRAIN.md` — one file, target ≤110 lines, ~500 tokens. It carries the context capsule, the capture contract, the top guardrails, the brain map, and the session-start pointer. Everything else loads on demand when the agent has a reason to need it.

**Your Jarvis stays Jarvis. The brain travels.**

---

## Why it is different

Most "AI context" solutions give you a place to dump information. Synaptic gives you three things no dump can provide:

### 1. A consolidation formula — the brain grows correctly on its own

The **capture contract** (embedded in every `BRAIN.md`) is a six-step agent-agnostic algorithm:

1. **Classify** — durable knowledge · tabular record → registry · lesson · decision · big task → playground · temporal → journal · noise → drop
2. **Atomicity test** — promote only when it recurs (2+ instances → pattern) or is a reusable decision/lesson; incident-specifics stay in playground/journal
3. **Generalize** — strip the anecdote, keep the reusable pattern; name = the concept, not the ticket
4. **Place & link** — atomic node in the right cluster; D1 frontmatter; `[[wikilinks]]`; register in cluster `_index.md`
5. **Dedupe / SSOT** — search first; update, don't duplicate; one source of truth per fact
6. **Quality gate** — professional & verifiable only; soft budget ~150 lines or tag `type: reference`; stamp `updated:`; confirm reachable from a MOC

This formula runs after every session. It is what makes the brain accrete *correctly* — not a pile of notes, but a navigable graph of reusable knowledge.

### 2. Non-invasive — survives any enterprise security review

- **Pure Markdown + YAML** — every file is human-readable, auditable, printable
- **0-install-capable CORE** — tools are optional; the brain works with just files
- **No hidden services, no network calls, no opaque binaries**
- **Air-gapped-friendly** — runs on a locked-down corporate laptop with nothing installed
- **Files authoritative** — agent-native memory (Claude Code auto-memory, Copilot Memory) is treated as a cache; the files win when they conflict

### 3. Harness-clean — your agent's persona is not the brain's concern

Persona, tone, and global behavior live in your harness (AGENTS.md / CLAUDE.md / agent instructions). The brain holds only knowledge. A Jarvis-persona agent and a vanilla agent can share the same brain without identity conflict. When you change agents, the brain travels unchanged.

---

## Value by audience

### For people — your second brain

A Synaptic brain scales from a single project to a role to your whole life. `scope: project | role | org | life` in `BRAIN.md` frontmatter — the structure does not change. Start with a project. Graduate when you see what works.

- Your accumulated knowledge is yours, portable, and readable without any tool
- Onboard yourself back into a project in seconds after a break
- Hand over a role with something real, not a dump of meeting notes

### For projects — an agent that onboards in seconds

- An agent reads `BRAIN.md` and knows the scope, the conventions, the guardrails, and where everything lives — before writing a single line
- Decisions, patterns, and playbooks accumulate through real work — the agent gets smarter over time, not just bigger
- No re-briefing across sessions; no tribal knowledge dependency

### For companies — knowledge continuity without a platform rollout

- A contractor finishes; their successor reads `.synaptic/BRAIN.md` and picks up where they left off
- No new platform to procure, no rollout project, no vendor dependency — it runs on a laptop with a text editor and an AI agent
- Auditable by default: compliance can read every file; nothing is opaque
- Works on-prem, air-gapped, or in any cloud environment

---

## How it works: MOC-of-MOCs navigation

The brain is navigable at O(1) cost — you never read 10 files to get one insight:

```
BRAIN.md (boot)
  → knowledge/INDEX.md  (hub MOC: lists clusters + 1-line each)
    → {cluster}/_index.md  (sub-MOC: 1-line summary per node)
      → open only the 1–2 relevant nodes
```

The 1-line summaries in `_index.md` files are the mechanism. `[[wikilinks]]` give lateral traversal. Backlinks are queried (`grep -r "[[node]]" .synaptic/knowledge/`) — never materialized, never out of sync.

**A node not reachable from a MOC does not exist.**

---

## Layout

```
.synaptic/
├── BRAIN.md                   # The only boot file: context capsule + capture contract + top guardrails + brain map
├── knowledge/                 # WIKI — what you know
│   ├── INDEX.md               # Hub MOC: lists clusters + 1-line summary each
│   ├── {cluster}/             # Domain or area (e.g. infrastructure/, customer-feedback/)
│   │   ├── _index.md          # Sub-MOC: 1-line summary per node
│   │   └── {node}.md          # Atomic node — type: knowledge|pattern|playbook|decision|lesson|reference
│   └── lessons/               # type: lesson (dated)
├── registries/                # Tabular SSOTs: resources, repos, db-servers, environments, glossary
├── references/                # Existence index (_index.md) + raw/ verbatim drop-zone (DDL, specs, exports)
├── harness/                   # HARNESS — how you work here (depth-on-demand)
│   ├── conventions.md         # Working agreements: languages per channel, commit style, etiquette
│   ├── guardrails.md          # Hard rules: security, never-push-without-confirm, runner discipline
│   └── skills/                # Project-local executable skills — travel with the brain
├── playgrounds/               # Per-task workspaces {task-id}/ — fat, burnable; registered in journal
├── journal/_current.md        # Thin working memory: resume anchor / watch list / consolidation log (≤80 lines)
└── templates/                 # Node, registry, playbook, lesson templates
```

---

## Install in 60 seconds

### Flow 1 — Fresh brain (recommended)

1. Copy [`standalone/synaptic/SKILL.md`](standalone/synaptic/SKILL.md) to your project's skill directory:
   ```
   .claude/skills/synaptic/SKILL.md    # Claude Code, VS Code Copilot, OpenCode
   .agents/skills/synaptic/SKILL.md    # Gemini CLI, Codex, and all of the above
   ```
2. Tell your agent: `/init`

The skill runs a scope-aware interview (1–2 questions at a time), generates a complete personalized brain, and self-wires your harness: it writes the `<!-- BEGIN:SYNAPTIC -->` fragment into your project `AGENTS.md` (idempotent; created if absent) and installs the skill into both discovery paths. No further steps.

### Flow 2 — Drop the seed

1. Copy [`seed/.synaptic/`](seed/.synaptic/) into your project root
2. Fill in the Context Capsule in `BRAIN.md` (what this brain covers; your role)
3. Tell any agent: "Read `.synaptic/BRAIN.md` and follow it"

### Flow 3 — Upgrading from v0.3 / v0.4 / v0.5

Tell your agent: `/upgrade`

The migration runs in two engines:
- **Phase M (mechanical)** — deterministic file operations: renames, directory creation, staging of removed structures; `tools/migrate.js` automates this, or a cheap agent can do it manually
- **Phase C (mandatory agent rearrange)** — content judgment required: link conversion, MOC creation, consolidation formula applied retroactively, harness triage. A capable agent must do this step; it cannot be scripted away

**Skill-less fallback (any flow):** paste `"Read .synaptic/BRAIN.md and follow it."` to any agent — no install required. You lose the guided lifecycle commands; the brain works.

---

## Opens in your tools

The brain is already openable in any wikilink-aware tool — no conversion, no export:

| Tool | How to open | Notes |
|---|---|---|
| **Obsidian** | Open project folder as a vault | `[[wikilinks]]` and YAML frontmatter are native; graph view renders immediately |
| **Foam (VS Code)** | Install Foam extension; open workspace | Wikilinks, backlinks, and graph panel work out of the box |
| **Logseq** | Open project folder as a graph | Switch to Markdown mode; Logseq journals disabled in favour of `journal/_current.md` |

`tools/vault-open.js` (optional, zero-dep) writes minimal config for each tool and produces `OPEN-IN.md` at the brain root. If you prefer to skip it, just open the folder — it works.

---

## Optional tooling

All tools are **zero-dependency** (Node ≥ 18 standard library only). CORE never requires them. When no runtime is available, the `synaptic` skill instructs the agent to perform the equivalent operation manually.

| Tool | Command | What it does |
|---|---|---|
| `check` | `node tools/check.js [.synaptic]` | Graph health: broken `[[wikilinks]]`, MOC coverage, frontmatter, soft budgets (warn), registry/reference integrity, orphan nodes |
| `migrate` | `node tools/migrate.js <.synaptic> [templates-dir] [--dry-run]` | Automates Phase M of a v0.x → v1 upgrade (deterministic, idempotent, non-destructive) |
| `export` | `node tools/export.js <.synaptic> [out.md]` | Bundles the entire brain into a single portable Markdown file (or `--split` into 4 sections) |
| `vault-open` | `node tools/vault-open.js <.synaptic>` | Writes minimal optional config for Obsidian, Foam, and Logseq; produces `OPEN-IN.md` |

---

## Commands (via the `synaptic` skill)

| Command | What it does |
|---|---|
| `/init` | Scope-aware interview; generates brain; self-wires harness; can import a context-pack seed |
| `/consolidate` | Run the 6-step capture contract on current session output |
| `/ingest [file]` | Distil a document into an atomic node + reference entry |
| `/audit` | Check for orphans, broken links, stale nodes, MOC coverage, registry/reference integrity, tag hygiene |
| `/upgrade` | Migrate a v0.3 / v0.4 / v0.5 brain to v1 (interactive, two-engine) |

A brain without the skill installed still works — `BRAIN.md` is self-describing. You just lose the guided lifecycle operations.

---

## Plays well with others

| Tool / pattern | Relationship |
|---|---|
| **gentle-ai / ai-rules-sync / block/ai-rules / rulesync** | Harness wiring and cross-agent sync — install the skill in standard paths; these tools pick it up automatically |
| **Engram** | Robust memory horizon: SQLite + FTS5 sidecar over the brain. Files stay authoritative; Engram is a derived cache |
| **Smart Connections / SQLite-vec / RAG stacks** | Semantic search horizon: the v1 frontmatter + tags + INDEX + wikilinks contract is the indexable surface — attaches without forking the format |
| **Jira / Trello / MCP task systems** | Tasks live there. The brain documents context and decisions; it does not track tickets |
| **Agent-native memory** (Claude Code auto-memory, Copilot Memory) | Useful within its harness; treated as cache. Files win when they conflict |

---

## Two ways to manage knowledge with AI — and why we curate

There are two schools of AI knowledge management, split by where the reasoning work happens:

- **Write-time curation (schema-on-write):** raw information is consolidated into curated, linked pages once, on the way in. Retrieval is then cheap and near-deterministic — read the right page, get a coherent answer. Auditable, portable, stable across agents and sessions. The consolidation formula is the cost; you pay it once per insight, not once per query.
- **Read-time RAG over raw (schema-on-read):** store raw artifacts verbatim, chunk and embed them, then retrieve and reason on every query. Fast to start, loses no raw detail — but reasoning cost is paid on every read, answers are re-derived rather than stable, and the result is not human-navigable or portable.

We chose write-time curation because agents re-read the same context constantly: curate once, read cheap forever. Curated knowledge is also auditable (a teammate or any new agent gets the same coherent page, not a fresh re-derivation) and portable (pure Markdown, no runtime dependency). We are in practice a pragmatic hybrid: the wiki is schema-on-write, and verbatim payloads are kept in `references/raw/` as a schema-on-read fallback for the rare fine-detail query. Best of both: coherent reads by default, raw available when needed.

---

## What SYNAPTIC-CORE is NOT

- **Not a task manager** — tasks, backlog, and roadmap belong in Jira, Linear, Trello, or your MCP task system
- **Not an agent framework** — it does not replace AGENTS.md, CLAUDE.md, or tool configs; those configure the agent; Synaptic configures what the agent knows
- **Not a persona configurator** — no identity directory, no per-brain behavior config; persona lives in your harness, not the brain
- **Not a database** — no queries, no schemas, no server; just files
- **Not another platform to roll out** — it is a folder of Markdown files; it works with what you already have
- **Not domain-specific** — SYNAPTIC-CORE is a structure; your brain is yours to fill

---

## Design philosophy

The core thesis: a non-invasive pattern that turns daily work into **structured, auditable, transferable, agent-usable knowledge** — reducing the delivery "knowledge tax" (onboarding, handovers, context reconstruction, documentation drift, tribal-knowledge dependency) without requiring a platform, a budget, or a security exception.

The principles:

- **0-install-capable CORE** — tools are optional; the brain works with just files
- **Files authoritative** — agent-native memory is a cache; the source of truth never moves
- **Harness-clean** — persona and behavior belong in the harness; the brain travels without them
- **Single boot file** — one mandatory read at session start; everything else on demand
- **Human-readable** — every file is Markdown or YAML; auditable, printable, editable without a tool
- **Agent-agnostic** — any agent that can read files can use a Synaptic brain

---

## The Matrioshka architecture

Each inner layer is independent of the outer ones:

```
  ┌──────────────────────────────────┐
  │           ECOSYSTEM              │
  │  MCP server, RAG, Engram,        │
  │  semantic search (horizon)       │
  │  ┌────────────────────────┐      │
  │  │        TOOLS           │      │
  │  │  check · migrate       │      │
  │  │  export · vault-open   │      │
  │  │  (Node ≥ 18, optional) │      │
  │  │  ┌──────────────────┐  │      │
  │  │  │      CORE        │  │      │
  │  │  │  Pure Markdown   │  │      │
  │  │  │  Zero deps       │  │      │
  │  │  └──────────────────┘  │      │
  │  └────────────────────────┘      │
  └──────────────────────────────────┘
```

CORE works everywhere, always — even on an air-gapped corporate laptop with nothing installed. TOOLS and ECOSYSTEM are optional power-ups. Removing the outer layers does not break the inner ones.

---

## Repository structure

```
synaptic-core/
├── seed/              # Reference brain skeleton — the v1 .synaptic/ seed
├── standalone/        # The synaptic skill package (installable without the full repo)
├── docs/              # Architecture decisions (ADR-001, ADR-002, ...)
└── tools/             # Optional TOOLS layer (check, migrate, export, vault-open)
```

---

## Acknowledgments

- **[Arscontexta](https://github.com/agenticnotetaking/arscontexta)** — The write-validation gate and discovery-first quality gate are directly inspired by Arscontexta's domain-derived patterns.
- **[GSD (Get Shit Done)](https://github.com/gsd-build/get-shit-done)** — GSD excels at planning and execution; Synaptic excels at memory and knowledge. They complement each other.
- **[ClawVault](https://github.com/ClawVault/ClawVault)** — The wake/sleep lifecycle pattern influenced the session rhythm and journal design.
- **[Roam-Code](https://github.com/roam-code/roam-code)** — Multi-platform config detection shaped the `/init` harness self-wire step.
- **[skills.sh / agentskills.io](https://agentskills.io)** — The `synaptic` skill package follows the Agent Skills progressive-disclosure format.
- **Zettelkasten / LLM-wiki convergence** — The MOC-of-MOCs navigation and atomic node model follow the Zettelkasten principle (links are the structure; folders are optional organisation) as validated by Karpathy's LLM-wiki work and the llmwiki.app pattern: dense, linked, agent-navigable pages over shallow bullet hierarchies.

We believe in synergy over competition. SYNAPTIC-CORE is a knowledge standard, not an everything-toolkit.

---

## Contributing

Bug reports, edge cases, example brains for different domains, improvements to the spec, ECOSYSTEM plugins — open an issue or submit a PR. The standard is young and actively evolving.

---

## License

MIT — Use it, fork it, improve it, share it.

---

See [ROADMAP.md](ROADMAP.md) for what shipped in v1.0 and the honest platform-mode horizon.
