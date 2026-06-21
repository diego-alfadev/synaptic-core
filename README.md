<p align="center">
  <img src="https://raw.githubusercontent.com/diego-alfadev/synaptic-core/v1.1.0/docs/assets/synaptic-hero.svg" alt="synaptic-core — one brain, any agent, zero install" width="880">
</p>

<p align="center">
  <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue">
  <img alt="version" src="https://img.shields.io/badge/version-v1%20%C2%B7%20beta-5eead4">
  <img alt="install" src="https://img.shields.io/badge/install-zero-16a34a">
  <img alt="agent" src="https://img.shields.io/badge/agent-agnostic-818cf8">
  <img alt="format" src="https://img.shields.io/badge/format-Markdown%20%2B%20%5B%5Bwikilinks%5D%5D-fbbf24">
</p>

<p align="center"><strong>Create your own AI Brain.</strong><br>One boot file. Any agent. No required installations.</p>

Synaptic-core is an **AI Brain**: a folder of plain Markdown files that turns your daily work into knowledge your agent can pick up in seconds. Instead of re-briefing your agent every session — or watching hard-won context walk out the door when a project ends — you curate it once, as you work, into a small linked graph any agent can navigate. No re-briefing. No tribal knowledge lost. No platform to roll out: it travels as files you own.

---

## Install

Pick the tier that matches your setup. They all end the same way: a `.synaptic/` brain in your project and `/synaptic-init` ready to run.

Works with **any agent that can fetch a URL and write files** — Claude Code, Cursor, Gemini CLI, Codex, OpenCode, and more. Hosts without slash-command support still get the full brain via the skill-less fallback at the end of this section.

### Tier 1 — Self-install (clean machine, just your agent)

No Node, no clone, no manual copying. Paste **one line** to your coding agent and it fetches and installs everything itself:

```
Set up a Synaptic brain in this project: fetch and follow https://raw.githubusercontent.com/diego-alfadev/synaptic-core/main/standalone/synaptic/SKILL.md
```

How it works: the skill's bootstrap header detects a clean environment, pulls the bundle from GitHub (deterministic via `MANIFEST.txt`), writes it into the skill paths, self-wires your harness (your agent's operating-rules files — `AGENTS.md` / `CLAUDE.md`), and offers `/synaptic-init`. It works on any machine that has a coding agent and a network connection — nothing else.

### Tier 2 — One-liner (Node users)

If you have Node, grab the skill folder with `degit`, then initialize:

```
npx degit diego-alfadev/synaptic-core/standalone/synaptic .claude/skills/synaptic
/synaptic-init
```

Use `.agents/skills/synaptic` instead of `.claude/skills/synaptic` for non-Claude hosts (Gemini CLI, Codex, OpenCode). `degit` requires Node and pulls the latest skill from `main`; append `#<tag>` to pin an exact release.

### Tier 3 — Manual (true zero-dependency fallback)

Download or clone the repo and copy the **whole folder** `standalone/synaptic/` into `.claude/skills/synaptic/` (and `.agents/skills/synaptic/` for Gemini CLI / Codex), then run `/synaptic-init`.

> **Copy the whole FOLDER, not one file.** The skill is `SKILL.md` **plus** `references/` and `templates/` — all three are required. (Copying only `SKILL.md` will not work: the templates are the source of your brain, and the references hold the lifecycle commands.)

**Already have a brain (inherited a project)?** Paste `Read .synaptic/BRAIN.md and follow it` — the brain is self-describing (you lose the guided lifecycle commands; the brain still works). Creating a brain from scratch? Use a tier above — Tier 1 bootstraps from nothing.

---

## Your first 5 minutes

1. **Install** — pick a tier above. Tier 1 is one pasted line; you are done in under a minute.
2. **Run `/synaptic-init`** — the skill runs a short scope-aware interview (about 3 questions: what is this brain *for*, who fills the role, where does the work live), generates a complete personalized brain from the templates, and self-wires your harness. No further setup.
3. **Work normally** — just do your work with your agent as usual. At session end, run `/synaptic-consolidate` to distil what you learned into the brain — or let the event-driven hook offer it for you.
4. **Next session, your agent already knows the project** — it boots from `BRAIN.md` (one file, ~500 tokens) and arrives knowing the scope, conventions, guardrails, and where everything lives. No re-briefing.

That is the whole loop: install once, init once, then work → consolidate → boot smarter. The brain compounds with every session.

---

## Why an AI Brain

Every team pays a **knowledge tax**: re-briefing the agent each session, onboarding each new person, reconstructing context after a gap, documentation that drifts out of date, and knowledge that lives only in one person's head until they leave. An AI Brain pays that tax down by turning the work you already do into structured, durable knowledge — once, at write-time — so every future read is cheap and the same for everyone.

**For people — your second brain.** Stop re-briefing your agent. Your accumulated knowledge is yours: portable, readable without any tool, never locked to a service. Hand over a role with something real — not a dump of meeting notes.

**For projects — an agent that onboards in seconds.** An agent reads one file and already knows the scope, conventions, guardrails, and where everything lives — before writing a line. Decisions, patterns, and playbooks accumulate through real work.

**For companies — knowledge continuity without a platform rollout.** A contractor finishes; their successor reads `.synaptic/BRAIN.md` and picks up where they left off. No platform to procure, no rollout, no vendor lock-in. Auditable by default — compliance can read every file. Works on-premise, air-gapped, or in any cloud.

**One-liner on the three approaches:** RAG re-derives an answer on every query; a plain wiki sits inert until a human edits it; an AI Brain grows correctly *as you work* and stays cheap to read. See [the full comparison](docs/concepts/rag-vs-wiki-vs-brain.md) for the why.

---

## Commands

| Command | What it does |
|---|---|
| `/synaptic-init` | Scope-aware interview; generates the brain from the bundle templates; self-wires harness |
| `/synaptic-consolidate` | Run the 6-step capture contract on the current session's output; promotion aggressiveness is a tunable dial (`selective` / `balanced` / `capture-all`) |
| `/synaptic-ingest [file]` | Distil a document into an atomic node + reference entry |
| `/synaptic-audit` | **Diagnose only:** orphans, broken links, stale nodes, MOC coverage, cross-link coverage, unconsolidated work, registry integrity, tag hygiene |
| `/synaptic-weave` | Retroactive graph-gardening: missing links (+ typed-edge proposals), near-duplicates, theme promotion |
| `/synaptic-synthesize` | Generative pass: writes new synthesis nodes (cross-source patterns, concept evolution, orphan rescue), each MOC-registered at write time |
| `/synaptic-maintain` | Orchestrated diagnose-then-treat sweep, approval-gated |
| `/synaptic-upgrade` | Migrate a v0.3 / v0.4 / v0.5 brain to v1 (interactive, two-engine) |

> **MOC** = Map of Content — a hub/index node that lists what is under it, one line each (used by `/synaptic-audit` and `/synaptic-synthesize`).

---

## What it is NOT

- **Not a task manager** — tasks, backlog, and roadmap belong in your task system (Jira, Linear, Trello, MCP). The brain documents context and decisions; it does not track tickets.
- **Not an agent framework** — it does not replace `AGENTS.md`, `CLAUDE.md`, or tool configs. Those configure the agent; Synaptic configures what the agent *knows*.
- **Not a persona configurator** — no identity directory, no behavior config. Persona lives in your harness, not the brain. Your Jarvis stays Jarvis; the brain travels.
- **Not a database** — no queries, no schemas, no server. Just files.
- **Not another platform to roll out** — it is a folder of Markdown files; it works with what you already have.
- **Not domain-specific** — Synaptic-core is a structure; your brain is yours to fill.

---

## Go deeper

The landing invites; the docs explain. Start at the index, then follow the thread you care about:

- [docs/concepts/_index.md](docs/concepts/_index.md) — the concept map (start here)
- [docs/concepts/rag-vs-wiki-vs-brain.md](docs/concepts/rag-vs-wiki-vs-brain.md) — why write-time curation beats RAG-over-raw and a static wiki
- [docs/concepts/typed-edges.md](docs/concepts/typed-edges.md) — the seven typed edges that make the graph *relational*
- [docs/concepts/epistemic-honesty.md](docs/concepts/epistemic-honesty.md) — source, confidence, and bias-check: knowledge that is traceable and falsifiable
- [docs/concepts/navigation-and-planes.md](docs/concepts/navigation-and-planes.md) — MOC-of-MOCs bounded navigation and the two-plane (wiki · harness) model
- [docs/concepts/capture-and-consolidation.md](docs/concepts/capture-and-consolidation.md) — the 6-step formula and the capture dial (`selective` / `balanced` / `capture-all`)
- [docs/concepts/architecture-matrioshka.md](docs/concepts/architecture-matrioshka.md) — CORE · Cortex · Ecosystem, and why hooks are CORE

And the two longer reads:

- [ROADMAP.md](ROADMAP.md) — what shipped and the honest Cortex horizon (optional MCP, vector/semantic search, team brain)
- [PITCH.md](PITCH.md) — the two-tier value framing; Tier 2 covers the technical foundations in depth

---

## A validated pattern

Synaptic-core gave an *existing* industry direction a sharp purpose; it did not invent the substrate. The pattern is recognised across several converging communities:

- **Karpathy's LLM-wiki gist** and **[llmwiki.app](https://llmwiki.app)** — "compile knowledge into a curated wiki" the agent reasons over, rather than re-querying a raw dump.
- **Obsidian / Nick Milo — Maps of Content** — the hub → cluster → node navigation that keeps retrieval bounded.
- **Zettelkasten / Luhmann** — one concept per atomic note; links are the structure, folders are optional.
- **Anthropic Agent Skills — progressive disclosure** — metadata → body → references; one boot file, everything else on demand.
- **Microsoft GraphRAG** — cited only as *the direction* for multi-hop relational retrieval. We make **no auto-link-discovery claim**; our typed edges are authored, not inferred.

---

## Acknowledgments

We studied many peers in the LLM-wiki and PKM space. Synaptic-core converges with them by design — we believe in synergy over competition.

**Origin of the pattern**

- **[Karpathy's LLM-wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)** — the explicit origin of the "compile knowledge into a curated wiki" pattern. We did not invent it; we gave it a direction: accreting a role's knowledge so an agent grows it correctly as you work.

**Design twins and peers we studied**

- **[ScrapingArt/Karpathy-LLM-Wiki-Stack](https://github.com/ScrapingArt/Karpathy-LLM-Wiki-Stack)** — a design twin: its hub/member MOC tree and clean L1/L2 persona split are peers to our MOC-of-MOCs navigation and persona-out model. We cite it as validation of the pattern, not as a rival.
- **[shannhk/llm-wikid](https://github.com/shannhk/llm-wikid)** — its explicit curation discipline (mandatory counter-arguments / data-gaps sections, tiered confidence, source tracing) validated our bias-check + confidence + provenance direction.
- **[nvk/llm-wiki](https://github.com/nvk/llm-wiki)** — the closest zero-runtime substrate peer; its multi-agent, anti-confirmation-bias research approach informed our thinking.
- **[Basic Memory](https://github.com/basicmachines-co/basic-memory)** — a typed Entity-Observation-Relation graph with files authoritative over a rebuildable index; the "robust persistence" horizon our optional Cortex points toward.
- **[AgriciDaniel/claude-obsidian](https://github.com/AgriciDaniel/claude-obsidian)** — its lint-observes-never-auto-fixes stance informed our audit's diagnose-only discipline.

**Project-level credits**

- **[Arscontexta](https://github.com/agenticnotetaking/arscontexta)** — the write-validation gate and discovery-first quality gate are directly inspired by Arscontexta's domain-derived patterns.
- **[GSD (Get Shit Done)](https://github.com/gsd-build/get-shit-done)** — GSD excels at planning and execution; Synaptic excels at memory and knowledge. They complement each other.
- **[ClawVault](https://github.com/ClawVault/ClawVault)** — the wake/sleep lifecycle pattern influenced the session rhythm and journal design.
- **[Roam-Code](https://github.com/roam-code/roam-code)** — multi-platform config detection shaped the `/synaptic-init` harness self-wire step.
- **[skills.sh / agentskills.io](https://agentskills.io)** — the `synaptic` skill package follows the Agent Skills progressive-disclosure format.
- **Zettelkasten / LLM-wiki convergence** — the MOC-of-MOCs navigation and atomic node model follow the Zettelkasten principle (links are the structure; folders are optional organisation), as validated by Karpathy's LLM-wiki work and the llmwiki.app pattern: dense, linked, agent-navigable pages over shallow bullet hierarchies.

We believe in synergy over competition. Synaptic-core is a knowledge standard, not an everything-toolkit.

---

## Contributing

Bug reports, edge cases, example brains for different domains, improvements to the spec, Cortex utilities, and Ecosystem plugins — open an issue or submit a PR. The standard is young and actively evolving.

---

## License

MIT — use it, fork it, improve it, share it.
