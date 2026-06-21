# Harness Wiring Landscape — Synaptic Research

**Date:** 2026-06-11 · **Hook reality verified / corrected:** 2026-06
**Scope:** How to integrate a file-based knowledge-graph brain into modern agent harnesses without
duplicating what harness-config tools already do better, and how to wire the **layered capture
mechanism** (hooks) across the five major agents.
**Audience:** Synaptic v1 design — architecture and integration decisions.

> **Correction notice (2026-06).** An earlier revision of this doc treated hooks as a Claude-Code-only
> feature and marked Copilot / Cursor / Gemini as "manual" for capture wiring. **That was stale.**
> As of 2026-06, **Claude Code, GitHub Copilot, Cursor, OpenAI Codex, and Gemini all support
> file-configured hooks.** What differs is *which lifecycle events each host fires*, not whether
> hooks exist. Section 5 and the new §5.5 carry the verified per-host event mapping; the old
> "(manual)" labels have been removed.

---

## 1. gentle-ai — Ecosystem Configurator

### What it is

gentle-ai (by Gentleman-Programming, 3.9k stars, 207 releases, active) is a **harness-level
ecosystem configurator** — it is *not* an agent or a skill host, but a layer that wires
system prompts, persona files, Spec-Driven Development (SDD) agent configs, skill registries,
and MCP server connections into each agent's config directory.

It is explicitly the thing that "supercharges existing agents with persistent memory, workflow
orchestration, curated skills, and multi-model assignment."

### Supported platforms (15 total)

| Tier | Agents |
|------|--------|
| Full delegation | Claude Code, OpenCode, Kilo Code, Gemini CLI, Cursor, VS Code Copilot, Kimi Code, Kiro IDE, Qwen Code, Pi |
| Solo-agent | Codex, Windsurf, Antigravity, OpenClaw, Trae |
| Detect-only | Hermes |

### Mechanism

- Single-command install (Homebrew / Scoop / Go binary)
- Stores configs in each agent's **global config directory** by default; `--scope=workspace` for
  project scope
- Maintains a **Skill Registry** (`gentle-ai skill-registry refresh`) that auto-scans and indexes
  installed skills
- Hooks keep the registry fresh for agents that support hooks (Claude Code, Codex, OpenCode, Pi)
- MCP servers registered in gentle-ai become available to delegated tasks
- SDD profiles assign different models to design/implementation/review phases

### What gentle-ai does NOT do

- It does not manage project-level knowledge content (what goes in a brain)
- It does not have a "brain module" concept — it wires instructions and skills, not semantic knowledge
- There is no documented "module" API for third-party tools to register themselves; the pattern is
  to publish a skill package that users install manually and gentle-ai then discovers

### What synaptic should delegate to gentle-ai (or tools like it)

- **Persona, tone, and behavior config** — gentle-ai already installs this per-agent; synaptic must
  NOT duplicate it (and persona stays OUT of the brain — it lives in the harness)
- **MCP server registration** — let gentle-ai or user's own setup handle this
- **Skill registry refresh hooks** — gentle-ai manages this; synaptic's lifecycle skills just need
  to be present in the right directory

### Compatibility posture for synaptic

Synaptic should document: *"If you use gentle-ai, run `gentle-ai skill-registry refresh` after
installing synaptic skills. No further integration required."* A synaptic brain's lifecycle skills
are a standard skill package; gentle-ai sees them automatically.

---

## 2. The AGENTS.md Standard

### Stewardship and adoption

AGENTS.md is stewarded by the **Agentic AI Foundation** under the Linux Foundation. As of mid-2026,
it is adopted by 60,000+ open-source repositories and is the de-facto cross-agent harness file,
recognized natively by Cursor, Claude Code, VS Code Copilot, Codex, Gemini CLI, Windsurf, Devin,
and OpenCode.

### Format

Plain Markdown. No required fields. No schema. The spec explicitly states: "AGENTS.md is just
standard Markdown. Use any headings you like; the agent parses the text you provide." Common
sections (not mandated):

- Project overview
- Build and development commands
- Testing instructions
- Code style and conventions
- Security considerations
- PR and workflow rules

### Scoping model (v1.1 proposal, under review)

1. **Jurisdiction**: Applies to all files and subdirectories within its containing folder
2. **Accumulation**: Child AGENTS.md adds to ancestor guidance; does not replace it
3. **Precedence**: `LLM system prompt → agent system prompt → user prompt → local AGENTS.md →
   ancestor AGENTS.md`
4. **Monorepo support**: Nested AGENTS.md files at subdirectory level are auto-discovered and
   merged

### Third-party tool section ownership — the gap

**There is no official marker convention or section-ownership standard in the AGENTS.md spec**
as of this research. The spec is intentionally format-agnostic. However, observed practices in
the ecosystem are:

1. **Marker-wrapped blocks**: Tools like Claude Code use a `<!-- BEGIN:TOOLNAME -->` /
   `<!-- END:TOOLNAME -->` HTML comment pattern for idempotent appends — the tool searches for
   its markers before writing, replaces the block if found, appends if not
2. **Named H2 sections**: Tools claim a section by a distinctive heading (e.g.
   `## Synaptic Brain`) — simpler, human-readable, but no enforcement of uniqueness
3. **Separate file via import**: Some tools add a `<!-- include: .synaptic/BRAIN.md -->` style
   import directive; support varies by agent

### Recommendation for synaptic

Use **marker-wrapped block + named H2**, combined:

```markdown
<!-- BEGIN:SYNAPTIC -->
## Synaptic Brain

This project uses a Synaptic knowledge brain at `.synaptic/`.
Read `.synaptic/BRAIN.md` for the knowledge graph index and contribution protocol.
Available lifecycle commands: `/synaptic-consolidate`, `/synaptic-audit`, `/synaptic-ingest`.
<!-- END:SYNAPTIC -->
```

- Idempotent: synaptic's init/upgrade scans for `BEGIN:SYNAPTIC` before writing
- Human-readable: the H2 heading is visible in any Markdown renderer
- Non-conflicting: other tools use their own marker namespaces
- ~10 lines maximum: respects AGENTS.md's "lightweight" philosophy

Codex in particular treats `AGENTS.md` as a primary config surface, including for hook-style
directives — so the fragment doubles as a fallback capture instruction for AGENTS.md-only agents.

### Project-level vs user-level

- **Project AGENTS.md** (repo root): the right place for the synaptic fragment — it describes
  project-specific knowledge, not user preferences
- **User-level** (`~/.config/agents.md` or agent-specific global instruction): not applicable
  for synaptic; brain content is always project-scoped

---

## 3. Agent Skills / Slash-Commands Landscape 2026

### The Agent Skills open standard

The Agent Skills format was **originally developed by Anthropic**, released as an open standard,
and is now maintained at [agentskills.io](https://agentskills.io) with community governance on
GitHub. The canonical unit is a **skill directory** containing a `SKILL.md` file.

#### SKILL.md structure

```
skill-name/
├── SKILL.md          # Required: YAML frontmatter + Markdown body
├── scripts/          # Optional: executable code
├── references/       # Optional: additional documentation
└── assets/           # Optional: templates, resources
```

**SKILL.md frontmatter fields:**

| Field | Required | Notes |
|-------|----------|-------|
| `name` | Yes | Max 64 chars, lowercase + hyphens, must match directory name |
| `description` | Yes | Max 1024 chars. Agents use this for progressive-disclosure matching |
| `license` | No | License name or reference |
| `compatibility` | No | Environment requirements (e.g., "Claude Code", "requires Python 3.14+") |
| `metadata` | No | Arbitrary key-value map (author, version, etc.) |
| `allowed-tools` | No | Pre-approved tools (experimental) |

#### Progressive disclosure

1. **Discovery**: agent loads `name` + `description` only (~100 tokens) at session start
2. **Activation**: full `SKILL.md` body loaded when task matches description
3. **Execution**: referenced scripts/references loaded on-demand

Skills should be ≤500 lines; move bulky reference material to `references/` files.

### Platform discovery paths

This is the most critical table for synaptic's install design:

| Platform | Project skill path(s) | User/global skill path(s) | Notes |
|----------|----------------------|--------------------------|-------|
| **Claude Code** | `.claude/skills/<name>/SKILL.md` | `~/.claude/skills/<name>/SKILL.md` | `.claude/commands/` still supported (legacy). Auto-discovers up directory tree to repo root. Also discovers nested paths in subdirs. |
| **VS Code Copilot** | `.github/skills/`, `.claude/skills/`, `.agents/skills/` | `~/.copilot/skills/`, `~/.claude/skills/`, `~/.agents/skills/` | Additional locations via `chat.agentSkillsLocations` setting. All three project paths are equally valid. |
| **Gemini CLI** | `.gemini/skills/` or `.agents/skills/` | `~/.gemini/skills/` or `~/.agents/skills/` | `/skills list`, `/skills reload` commands. Skill at root or one dir deep. |
| **OpenCode** | `.agents/skills/`, `.claude/skills/` | `~/.config/opencode/skills/`, `~/.claude/skills/`, `~/.agents/skills/` | Walks up directory tree to git worktree root. |
| **Cursor** | `.cursor/rules/` (`.mdc` files, rules system) | `~/.cursor/rules/` | Cursor deprecated its own rules format and is migrating toward Agent Skills (`.cursor/skills/` also auto-discovered in some versions). |
| **Codex** | `.agents/skills/`, `.claude/skills/` | `~/.agents/skills/` | Follows Agent Skills standard. |

**Key insight**: `.agents/skills/` is the most portable single path — it is recognized by VS Code
Copilot, Gemini CLI, OpenCode, and Codex. `.claude/skills/` is recognized by Claude Code, VS Code
Copilot, and OpenCode. **Shipping skills in both `.agents/skills/` and `.claude/skills/` covers
all major platforms without per-platform configuration.**

### Slash-command / skill invocation

In Claude Code, skills are invoked as `/skill-name` — both user-typed and auto-invoked (agent
decides based on description). The legacy `.claude/commands/deploy.md` flat-file format still
works and creates `/deploy` identically; the new directory+SKILL.md format adds auto-invocation
and subagent execution features.

For synaptic lifecycle operations:

| Operation | Skill name | Invocation |
|-----------|-----------|------------|
| Consolidate knowledge graph | `synaptic-consolidate` | `/synaptic-consolidate` |
| Audit brain health | `synaptic-audit` | `/synaptic-audit` |
| Ingest new content | `synaptic-ingest` | `/synaptic-ingest` |
| Weave / graph-garden | `synaptic-weave` | `/synaptic-weave` |
| Synthesize cross-source nodes | `synaptic-synthesize` | `/synaptic-synthesize` |
| Upgrade brain format | `synaptic-upgrade` | `/synaptic-upgrade` |

### Install CLIs (optional but available)

- **`npx skills`** (Vercel Labs / agentskills ecosystem): `npx skills add github.com/[org]/skills`
  installs a skill to the current project's skill directories
- **`npx autoskills`**: scans tech stack and installs curated skills from audited registry
- Both write to `.agents/skills/` and/or `.claude/skills/` depending on detected agents

---

## 4. Survey: Who Else Auto-Wires Harness Files?

### 4.1 ai-rules-sync (lbb00)

**Pattern**: Git-repository-backed symlink sync. Maintains a canonical `ai-rules-sync.json` source
of truth, then symlinks rules/skills to 26+ agent-specific paths (`.cursor/rules/`, `.claude/`,
`.github/`, etc.). Supports rules, skills, commands, subagents.

**What to learn**: The symlink model is clean for personal setups but breaks in monorepos or when
multiple team members have different OS path conventions. The config file approach (`ai-rules-sync.json`)
is heavier than synaptic's target weight.

**What to avoid**: Synaptic should NOT require its own sync config file. Skills ship in the repo
and are discovered natively — no sync layer needed.

### 4.2 autoskills (midudev)

**Pattern**: `npx autoskills` detects project tech stack (package.json, Gradle, etc.), matches
against a curated registry with SHA-256 manifest, downloads and writes skills to project skill
directories. Supply-chain safe (prompt-injection scanning, hash verification, `skills-lock.json`).

**What to learn**: The "detect + install from registry" model is the right pattern for broad
ecosystem skills. For synaptic, the analogous pattern is: `/synaptic-init` detects whether
`.synaptic/` exists, writes the AGENTS.md fragment, and installs lifecycle skills to
`.agents/skills/` and `.claude/skills/`.

**What to avoid**: Autoskills is stack-detection-first; synaptic doesn't need stack detection.
Synaptic install should be unconditional — if you want a brain, you install it.

### 4.3 block/ai-rules (Square/Block)

**Pattern**: Source-of-truth `ai-rules/` directory + CLI that generates agent-specific output
files from a single source. Config via `ai-rules-config.yaml`. Supports symlink mode or copy mode.
Targets AMP, Claude, Cline, Codex, Copilot, Cursor, Firebender, Gemini, Goose, Kilocode, Roo.

**What to learn**: The "one source, generate per-agent" pattern is the right answer for teams
managing shared coding guidelines. For synaptic: the lifecycle skills only need one source (the
synaptic skill bundle) and agents discover them natively from the committed directories.

**What to avoid**: The YAML config overhead. Synaptic should not require team-wide config file
adoption just to install a brain.

### 4.4 rulesync (dyoshikawa)

**Pattern**: Utility CLI for AI coding agents that syncs rules between agents in a similar
symlink/copy model to ai-rules-sync. Lighter weight, TypeScript-based.

**What to learn**: Minimal overhead is valued. The tool is usable without a config file for
simple cases.

### 4.5 openskills (numman-ali)

**Pattern**: `npm i -g openskills` — universal skills loader that brings Anthropic's skills system
to every AI coding agent including those that don't natively support it (via AGENTS.md injection).
Skills live in project and can be versioned.

**What to learn**: The "universal adapter" pattern via AGENTS.md injection is the fallback for
agents that don't support SKILL.md yet. Synaptic could include a brief AGENTS.md fragment that
describes its lifecycle commands as plain-text instructions, which any AGENTS.md-reading agent
will pick up even without native skills support.

### 4.6 ECC (affaan-m)

**Pattern**: Agent harness performance optimization — skills, instincts, memory, security for
Claude Code, Codex, OpenCode, Cursor. Adds "instincts" (auto-triggered skills) on top of the
standard skills layer.

**What to learn**: The "instinct" concept (always-on vs on-demand) maps well to synaptic's
layered capture: the always-on layer is the per-turn `Stop` breadcrumb, the on-demand layer is
`/synaptic-consolidate`. ECC's instinct metadata is one way to mark the breadcrumb floor as
always-on, though Synaptic prefers a plain host hook (CORE) over a vendor-specific metadata flag.

---

## 5. Synthesis: Synaptic Harness Integration Design

### 5.1 What the brain ships (the pointer fragment)

The brain ships two artifacts to the harness layer:

**A. AGENTS.md fragment** (~12 lines, idempotent):

```markdown
<!-- BEGIN:SYNAPTIC -->
## Synaptic Brain

This project uses a Synaptic knowledge brain. Read `.synaptic/BRAIN.md` for the
knowledge graph index, entity registry, and contribution protocol before generating
code or architecture decisions involving project-specific context.

**Contribution protocol**: After completing a significant task, run `/synaptic-consolidate`
to distil decisions, patterns, and context into the brain.

**Available commands**: `/synaptic-consolidate` | `/synaptic-audit` | `/synaptic-ingest` | `/synaptic-weave` | `/synaptic-synthesize` | `/synaptic-upgrade`
<!-- END:SYNAPTIC -->
```

This fragment is written by `/synaptic-init` to the project's AGENTS.md. It is idempotent:
`/synaptic-upgrade` replaces the `BEGIN:SYNAPTIC`…`END:SYNAPTIC` block only.

**B. Lifecycle skills** (standard Agent Skills format), generated from the single source of truth —
the **skill bundle's templates** (`standalone/synaptic/templates/`). There is **no `seed/`
directory**: the example brain is assembled on demand by the skill from those templates, so there
is no second tree to drift.

```
.agents/skills/
├── synaptic-consolidate/SKILL.md
├── synaptic-audit/SKILL.md
├── synaptic-ingest/SKILL.md
├── synaptic-weave/SKILL.md
├── synaptic-synthesize/SKILL.md
└── synaptic-upgrade/SKILL.md
```

These are copied/symlinked to `.claude/skills/` during init (for Claude Code coverage).
Both directories are committed to the repo.

### 5.2 Per-platform install mechanism (skills + hooks)

All five agents support **file-configured hooks** as of 2026-06 — the old "(manual)" labels in this
column have been removed. Skill discovery and hook wiring are independent: a host can auto-discover
skills *and* fire hooks; they are configured by different files.

| Platform | Skill discovery | Skill mechanism | Hook config file | Hook coverage (see §5.5) |
|----------|----------------|-----------------|------------------|--------------------------|
| **Claude Code** | `.claude/skills/<name>/SKILL.md` | Copy/symlink from `.agents/skills/` during `/synaptic-init` | `.claude/settings.json` | Stop · PreCompact · SessionStart · SessionEnd (full) |
| **VS Code Copilot** | `.agents/skills/` (primary) or `.github/skills/` | Auto-discovered; no extra step | `.github/hooks/*.json` | Stop · PreCompact · SessionStart (no SessionEnd in IDE) |
| **Gemini CLI** | `.agents/skills/` alias recognized | Auto-discovered at session start | file-configured hooks | Stop/turn-end · SessionStart (PreCompact/SessionEnd host-dependent) |
| **OpenCode** | `.agents/skills/` | Auto-discovered, walks up to git root | host hook config | Stop · SessionStart (others host-dependent) |
| **Cursor** | `.cursor/rules/` or `.cursor/skills/` (partial) | `.cursor/rules/synaptic.mdc` shim → AGENTS.md fragment | `.cursor/hooks.json` | Stop/turn-end · SessionStart (no SessionEnd) |
| **Codex** | `.agents/skills/` | Auto-discovered | `AGENTS.md` / config-driven hooks | Stop · PreCompact · SessionStart · SessionEnd |
| **Any AGENTS.md reader** | AGENTS.md fragment | Pointer text + commands list | n/a (manual) | manual consolidate cadence |

**Minimum viable install** (covers 80% of users):

1. `/synaptic-init` appends the fragment to AGENTS.md
2. Writes skills to `.agents/skills/` (generated from the bundle templates — no seed)
3. Symlinks to `.claude/skills/` (for Claude Code — most common single-agent case)
4. Deploys the layered capture hooks the host supports (§5.5)
5. Done. No config sync file. No registry. No daemon Synaptic runs.

### 5.3 What to explicitly delegate to external tools

| Concern | Delegate to | How to document |
|---------|-------------|-----------------|
| Persona / tone / behavior | gentle-ai, CLAUDE.md, agent's own instructions file | "Synaptic does not configure agent persona — persona stays OUT of the brain. Use your existing harness config (gentle-ai, CLAUDE.md, copilot-instructions.md)." |
| Cross-agent rules sync | ai-rules-sync, block/ai-rules, rulesync | "If you sync rules across agents, add `.agents/skills/synaptic-*` and `.claude/skills/synaptic-*` to your sync manifest." |
| Skill registry refresh | gentle-ai | "gentle-ai users: run `gentle-ai skill-registry refresh` after init." |
| Supply-chain skill install | `npx skills` | Optional: `npx skills add github.com/synaptic-core/skills` as alternative to manual init |
| Stack-detection auto-install | autoskills | Out of scope; synaptic install is intentional not automatic |
| MCP server wiring | User's MCP setup / gentle-ai | MCP over the files = **Cortex** (optional, degrades away). The brain never depends on it; registration is user-managed |

### 5.4 Whether a wiring script is worth building

**Recommendation: a minimal init script (or the `/synaptic-init` skill itself) is worth building; a
daemon/sync is not.**

Rationale:
- The init operation (write AGENTS.md fragment + create skill dirs + symlink to `.claude/skills/` +
  deploy host-supported hooks) is mechanical enough that a script beats instructions for first-time
  users.
- The script should be idempotent and safe to re-run (upgrade scenario).
- A daemon or watch-mode sync would duplicate what ai-rules-sync/gentle-ai already do better — and an
  OS-cron/daemon Synaptic ran would be **Cortex**, not CORE.
- The script must NOT own persona/behavior config — it writes only what belongs to synaptic's
  namespace (the `BEGIN:SYNAPTIC` block, the lifecycle skills, and the synaptic hook entries).
- Cursor shim (`.cursor/rules/synaptic.mdc`) should be optional, written only if `.cursor/` exists.
- **All generation reads the bundle templates** (`standalone/synaptic/templates/`) — the single
  source of truth. There is no `seed/` tree to copy from and no mirror to keep in sync.

**Hooks are CORE.** A hook config (`settings.json`, `.github/hooks/*.json`, `.cursor/hooks.json`,
`AGENTS.md`) is plain text/JSON the **host** already runs — no runtime Synaptic ships — so deploying
hooks does not break the zero-install, air-gapped promise. Only a process Synaptic ships (a Node
script, a future MCP server, an OS-cron timer) is Cortex.

### 5.5 The layered capture mechanism (verified per-host hook events)

Capture is **layered and host-aware**, and **does not depend on `SessionEnd`**. Four host events,
each a different layer; **only `Stop` is universal**.

| Layer | Hook event | Role | Cost | Availability |
|---|---|---|---|---|
| **(a) Breadcrumb** | `Stop` (per turn) | One terse journal line per meaningful turn — the workhorse | Fixed, tiny; **not** governed by `capture_policy` | **Universal** — all 5 agents |
| **(b) Flush** | `PreCompact` | Consolidate before the context window is compacted | One pass when compaction is imminent | Claude / Copilot / Codex |
| **(c) Rescue** | `SessionStart` | On next boot, detect unconsolidated breadcrumbs / open playgrounds and **offer** to consolidate | One check at boot | Where supported |
| **(d) Bonus** | `SessionEnd` | Offer/remind on a clean exit | One check at clean exit | Where present (**not** Copilot-IDE, **not** Cursor) |

**Verified per-host event matrix (2026-06):**

| Agent | Hook config | `Stop` | `PreCompact` | `SessionStart` | `SessionEnd` |
|---|---|---|---|---|---|
| **Claude Code** | `.claude/settings.json` | yes | yes | yes | yes |
| **GitHub Copilot** | `.github/hooks/*.json` | yes (stop/turn-end) | yes (pre-compaction) | yes (session-start) | **no** (no clean SessionEnd in IDE) |
| **Cursor** | `.cursor/hooks.json` | yes (stop/turn-end) | host-dependent | yes (session-start) | **no** |
| **OpenAI Codex** | `AGENTS.md` / config-driven | yes | yes (pre-compaction) | yes | yes |
| **Gemini** | file-configured hooks | yes (turn-end) | host-dependent | yes | host-dependent |

**Reading the matrix:**

- **`Stop` is the only event you can rely on everywhere** — it is the universal capture floor. The
  breadcrumb it writes lives on disk, so it survives a crash; what only lived in context dies.
- **`PreCompact` is the high-value layer** on Claude / Copilot / Codex — it fires at the exact moment
  un-written knowledge is about to be lost, strictly better than waiting for session end.
- **`SessionStart`-rescue + `/synaptic-audit` = the abandonment safety sweep.** Even when no end
  event ever fires (window closed, terminal killed), the next boot finds pending breadcrumbs and
  open playgrounds and offers to consolidate.
- **`SessionEnd` is the weakest assumption** (absent on Copilot-IDE and Cursor) — hence it is a
  bonus, not the foundation.
- **No host exposes native idle detection.** Only an OS-level cron/timer approximates it, and that
  would be **Cortex**, not CORE. "Fully passive" is therefore reworded honestly: *passive,
  event-driven capture on hook-capable agents, with the per-turn journal as the universal fallback
  and `SessionStart`-rescue as the safety net* — never an unattended idle daemon at CORE.

**Two orthogonal dials (do not conflate):**

- **`capture_policy` = how aggressively work is PROMOTED to the wiki.** Presets:
  `selective | balanced | capture-all` (default `balanced`). Breadcrumbs are **outside** this policy.
- **The passivity dial = WHEN capture triggers** — manual ↔ event-driven hooks ↔ where-supported
  automation. Breadcrumbs are the always-on, fixed-cost floor under both.

For the copy-paste hook scripts and `settings.json` wiring, see
[`recipes/session-end-consolidate.md`](../recipes/session-end-consolidate.md).

---

## 6. Key Findings Summary

1. **gentle-ai** is a harness configurator (persona, MCP, SDD, skill registry) — not a brain or
   knowledge system. Synaptic does not compete with it; synaptic skills are just standard skills
   that gentle-ai picks up automatically.

2. **AGENTS.md** has no official third-party marker convention, but the marker-wrapped block
   pattern (`<!-- BEGIN:SYNAPTIC -->…<!-- END:SYNAPTIC -->`) is the de-facto practice for
   idempotent, conflict-free tool fragments. Synaptic should adopt it.

3. **Agent Skills** (SKILL.md, agentskills.io) is the canonical cross-platform skill format,
   originally by Anthropic, now open standard. `.agents/skills/` is the most portable single
   path; `.claude/skills/` covers Claude Code specifically. Both should be shipped — generated
   from the **bundle templates** (single source of truth; no `seed/`).

4. **The wiring tools landscape** (ai-rules-sync, block/ai-rules, autoskills, openskills) all
   converge on: one source of truth + per-agent path mapping. Synaptic should NOT require any
   of these as a dependency — it ships its skills in the standard paths and documents
   compatibility with each tool.

5. **No wiring daemon needed.** A lightweight `/synaptic-init` covers the install; the AGENTS.md
   fragment covers agent discovery; the skill files cover lifecycle invocation; host hooks cover
   capture. External sync tools can manage synaptic skill paths the same way they manage any other
   skill.

6. **Hooks are universal, not Claude-only (corrected).** All five major agents — Claude Code,
   GitHub Copilot, Cursor, Codex, Gemini — support **file-configured hooks** as of 2026-06. The
   layered capture mechanism (universal `Stop` breadcrumb + `PreCompact` flush where supported +
   `SessionStart`-rescue + `SessionEnd` bonus) degrades gracefully across them. **Hooks are CORE**
   (host-run config). No host has native idle detection; only an OS-cron/daemon (which would be
   Cortex) approximates it.

---

## Sources

- [Gentle-AI GitHub](https://github.com/Gentleman-Programming/gentle-ai)
- [Agent Skills specification — agentskills.io](https://agentskills.io/specification)
- [Agent Skills quickstart — agentskills.io](https://agentskills.io/skill-creation/quickstart)
- [AGENTS.md specification — agentsmd/agents.md](https://github.com/agentsmd/agents.md)
- [AGENTS.md homepage](https://agents.md/)
- [AGENTS.md v1.1 proposal — Issue #135](https://github.com/agentsmd/agents.md/issues/135)
- [Claude Code Skills docs](https://code.claude.com/docs/en/skills)
- [Claude Code hooks docs](https://code.claude.com/docs/en/hooks)
- [VS Code Copilot Agent Skills docs](https://code.visualstudio.com/docs/agent-customization/agent-skills)
- [VS Code Copilot Agent Customization overview](https://code.visualstudio.com/docs/agent-customization/overview)
- [GitHub Copilot hooks / agent customization](https://docs.github.com/en/copilot)
- [Gemini CLI skills docs](https://geminicli.com/docs/cli/skills/)
- [OpenCode skills docs](https://opencode.ai/docs/skills/)
- [Cursor rules docs](https://cursor.com/docs/rules)
- [Cursor hooks docs](https://cursor.com/docs/agent/hooks)
- [OpenAI Codex / AGENTS.md hooks](https://developers.openai.com/codex)
- [ai-rules-sync (lbb00)](https://github.com/lbb00/ai-rules-sync)
- [block/ai-rules](https://github.com/block/ai-rules)
- [autoskills (midudev)](https://github.com/midudev/autoskills)
- [openskills](https://github.com/numman-ali/openskills)
- [ECC harness optimization](https://github.com/affaan-m/ecc)
- [Harness Engineering guide — Augment Code](https://www.augmentcode.com/guides/harness-engineering-ai-coding-agents)
- [The Agent-Native Repo — Harness.io](https://www.harness.io/blog/the-agent-native-repo-why-agents-md-is-the-new-standard)
- [duet.so Claude Code Skills Complete Guide](https://duet.so/guides/claude-code-skills-complete-guide)
