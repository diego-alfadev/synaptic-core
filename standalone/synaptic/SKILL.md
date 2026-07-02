---
name: synaptic
version: 1.2.0          # engine semver (skill code) — independent of the brain schema/format version stamped in BRAIN.md
supported_schema: ">=1.0 <2.0"   # brain schema/format versions this engine can read. A skill update reinstalls the skill with NO brain migration; only a schema/format change runs /synaptic-upgrade.
description: >
  Knowledge-graph memory layer for project work — a portable, file-based brain that turns
  daily work into structured, indexable, agent-usable knowledge. Two planes: wiki (what you
  know) + harness (deployable operating-rules source). Triggers: `.synaptic/` present in the
  workspace, user wants persistent project memory or an AI brain, or user invokes
  /synaptic-init /synaptic-consolidate /synaptic-ingest /synaptic-audit /synaptic-weave
  /synaptic-synthesize /synaptic-maintain /synaptic-upgrade.
---

## Bootstrap / self-install

**DETECT bootstrap mode.** If you were invoked but the bundle next to this SKILL.md is
**incomplete** — not every path listed in `MANIFEST.txt` is present beside this file (a partial
fetch leaves gaps even when `references/` and `templates/` exist) — the user likely fetched only
`SKILL.md` by URL into a clean project. Self-install the rest:

1. Set `RAW_BASE = https://raw.githubusercontent.com/diego-alfadev/synaptic-core/main/standalone/synaptic/`
2. Fetch `${RAW_BASE}MANIFEST.txt`.
3. For each path listed (trim surrounding whitespace and any trailing carriage return first),
   fetch `${RAW_BASE}<path>` and WRITE it to **both** `.claude/skills/synaptic/<path>` **and**
   `.agents/skills/synaptic/<path>` (create directories as needed). This SKILL.md is in the
   manifest, so both copies get it too.
4. **Verify the install before proceeding.** Confirm the count of files written equals the number
   of manifest entries. Confirm each written file is non-empty and does NOT start with `<!DOCTYPE`
   or `<html` (GitHub raw can return an HTML error page on rate-limit). Re-fetch only the paths that
   failed either check; if any still fail after a retry, report the failed paths and fall back to
   the HONEST fallback below.
5. Then run **Harness Self-Wire** (the section below) and offer `/synaptic-init`.

**CORE-purity note.** This uses the agent's OWN fetch + file-write capability — Synaptic ships no
runtime, downloader, or daemon. `MANIFEST.txt` makes the install deterministic (you get exactly
the listed files); pulling from `main` installs the current stable skill. Append a release tag to
the path (e.g. `.../synaptic-core/<tag>/standalone/synaptic/`) if you need an exact pinned version.

**HONEST fallback.** If you cannot fetch URLs (no network or no fetch tool), do not improvise —
tell the user to use the `degit` one-liner or the manual folder-copy from the README, then stop.

If the bundle IS complete beside this file — every path in `MANIFEST.txt` is present — skip this section entirely and proceed to Detect on Load.

# Synaptic Brain Skill

> **Two version numbers, one bundle (v1-final §5.4 / §8).** `version:` above is the **skill
> ENGINE semver** (the code in this bundle). The **templates define the SCHEMA**, whose
> **schema/format version is stamped in `BRAIN.md`** — a separate number. A skill-code update =
> **reinstall the skill, NO brain migration**. A schema/format change = **also run
> `/synaptic-upgrade`**. `supported_schema` declares the brain schema range this engine reads.

## Detect on Load

**Resolve the brain location FIRST.** A brain is either `.synaptic/` at the workspace root, OR the path
named by a `<!-- BEGIN:SYNAPTIC -->` bridge (in `AGENTS.md` / an instructions file) when one is present.
A **global / seat** brain lives at the bridge's path, NOT at `CWD/.synaptic` — resolve the bridge before
deciding "no brain". This is what lets one brain serve a workspace that holds many repos.

```
Resolve brain: CWD .synaptic/BRAIN.md, else the BRAIN.md at the BEGIN:SYNAPTIC bridge's pointer.
Does a brain resolve?
├── YES → Read BRAIN.md frontmatter schema/format version.
│         Run COMPAT-CHECK (warn-not-gate — see below). Booting NEVER waits on it.
│         schema ≥ 1.0 → Boot: read BRAIN.md, follow it.
│           Is harness wired? (BEGIN:SYNAPTIC bridge AND BEGIN:SYNAPTIC-RULES present AND skill dir present)
│           ├── All present → normal boot.
│           └── Any missing → run Harness Self-Wire (wire + deploy; no interview), then boot.
│         schema < 1.0 (0.4, 0.5) → offer /synaptic-upgrade: "Found a v{X} brain — run /synaptic-upgrade to migrate."
│
└── NO BRAIN.md — but a brain DIRECTORY exists (CWD .synaptic/ or the bridge-pointed dir) with no BRAIN.md?
    ├── YES → pre-v1 brain detected (no BRAIN.md; BOOTSTRAP.md is a corroborating, not required, signal).
    │         Offer /synaptic-upgrade: "Found a pre-v1 brain — run /synaptic-upgrade to migrate to v1."
    │         Load references/upgrade-to-v1.md when the user confirms.
    └── NO brain resolves at all:
        ├── A BEGIN:SYNAPTIC bridge IS present (it names a brain path that is currently unreachable)
        │     → DO NOT offer onboarding. A bridge means a brain is intended; report the unreachable
        │       pointer instead ("bridge points at <path> but no brain is there — fix the path / restore it").
        └── No bridge AND no brain dir → Offer onboarding: "No brain found — start the setup interview? (y/n)"
```

When booting: read `BRAIN.md` only. Load all other files on demand through `knowledge/INDEX.md`.

### Compat-check (warn-not-gate — v1-final §5.4)

The brain carries a **schema/format version** (stamped in `BRAIN.md`); this skill carries an
**engine `version:` + a `supported_schema` range** (frontmatter above). On load, compare the
brain's schema/format version against `supported_schema`:

- **In range** → no message; boot normally.
- **Out of range** → emit **one** warning line, then **boot anyway**:
  - brain schema **newer** than this engine supports → *"This brain uses schema v{X}; this skill engine supports {range}. Reading it anyway — update the synaptic skill (GitHub Releases) for full support."*
  - brain schema **older** than the engine's range (a schema/format bump shipped) → *"This brain is on schema v{X}; the current schema is v{Y}. Reading it anyway — run `/synaptic-upgrade` when convenient to migrate."*
- **Missing version metadata** (brain or skill) → **assume compatible**, emit a **single one-line
  info notice** (*"No schema version found — assuming compatible."*), and boot. Never per-node, never repeated.

**Binding rules (CORE-safety, C1):**
- The compat-check is **warn-not-gate**: it **never blocks reading the brain** and is **never a
  precondition** to boot. A skill-less / older-skill agent boots from `BRAIN.md` unchecked — the
  brain is always readable as plain files on the runtime the agent already has.
- It runs **skill-side only** (no runtime we ship). It is **advisory output**, not a gate.
- It compares the **two decoupled numbers** (BRAIN.md schema/format vs this SKILL.md engine
  `version`/`supported_schema`). A skill update alone never demands a brain migration; only a
  schema/format change does, and even then the brain stays readable while unmigrated.
- **Update-awareness without a registry:** point the user at **GitHub Releases + repo Watch** to
  learn about newer skill engines. An optional Cortex "check-latest" (GitHub Releases API) is the
  only networked path and is never required.

---

## Onboarding Interview — /synaptic-init

Ask **1–2 questions at a time**. Build on answers. Generate files from `templates/` when done.

**First-run orientation (only on a true first run — no existing brain).** Before Round 0, say
something like: *"A brain is a small set of plain files that turns your daily work into structured,
searchable, agent-usable memory. I'll ask a few quick questions, then generate everything and wire
it into this project for you. You can stop anytime, and every choice — especially the capture dial
(how much we keep) — is changeable later. Want to continue with `/synaptic-init`? Or just start
working and consolidate later whenever you like."* No tutorial, no slides — just friendly framing,
then proceed to Round 0. Skip this block entirely if a brain already exists.

**Round 0 — Scope:**
> "Is this brain for a project, a role, an organisation, or your life?"

Tailor framing to the answer (e.g. "your stack" for project, "your domains" for org).

**Round 1 — Coverage + Owner role:**
> "What should this brain cover? What is your role here — developer, lead, analyst?"

These answers become the **Context Capsule** in `BRAIN.md` (2–4 lines: what it covers + owner's role in this project). This is *retrieval framing*, not persona. If the user describes tone, language preferences, or agent behavior: "Those belong in your harness (AGENTS.md / CLAUDE.md), not in the brain — I'll place them there instead."

**Round 1b — Capture policy:**
> "How selective should this brain be — crown-jewels only (`selective`), balanced (default), or capture almost everything (`capture-all`, good when you have no other memory layer)?"

Write the answer to `capture_policy:` in `BRAIN.md` frontmatter (default `balanced` if unsure).
`capture_policy` is the **PROMOTION axis** — how aggressively the capture contract promotes work
*into the wiki*. It does **not** change the six-step formula, and it does **not** govern the
always-on per-turn journal breadcrumbs (those are a fixed-cost floor — see Harness Self-Wire,
capture mechanism). Reassurance if they hesitate: "You can change this one word later;
`/synaptic-weave` can also prune a `capture-all` brain back toward `selective`."

**Round 2 — Main clusters:**
> "What are the main areas, products, or systems this brain will cover?"

Use the answers to seed `knowledge/INDEX.md` cluster stubs and generate a first `{cluster}/_index.md`.

**Round 3 — Working conventions + guardrails:**
> "Any team norms an inheriting teammate must know — languages per channel, commit style, etiquette? Any hard rules that must never be violated?"

Collect conventions → `harness/conventions.md` (instantiate from the bundled `templates/`). Collect hard rules → `harness/guardrails.md`. Both files will be deployed to the outer harness by the Deploy step in Harness Self-Wire — do NOT write a guardrails block into BRAIN.md.

**Round 4 — Registries:**
> "Any lookup tables you reference often — infra resources, repo catalog, glossary, environments?"

Yes → create `registries/{name}.md` from `templates/registry.md` per table; register in `registries/_index.md`.

**Round 5 — Import existing material (optional):**
> "Got an existing context-pack or onboarding doc to import? I can bootstrap the brain from it."

Yes → run /synaptic-ingest on the document now. Queue further documents for post-init.

**Stop condition:** scope + at least one cluster + `harness/conventions.md` exist. Further rounds optional.

After the interview, run **Harness Self-Wire** (wire AGENTS.md + install skill + deploy operating
rules + **deploy capture hooks**), then report the file list.

---

## Generate

**Single source of truth (v1-final §5.1 — NO SEED).** There is **no `seed/` directory**. The
**bundled `templates/` in this skill package are the one and only source** of brain structure.
Instantiate every generated file from `templates/`; the example/starter brain is **assembled on
demand here**, never copied from a hand-edited `seed/` mirror. Structure is **rigid** (the
templates *are* the standard — even weak models fill content, never invent structure); content is
**free**. If `templates/` is missing, generate the layout directly from the spec below and notify
the user.

**v1 layout to generate (instantiated from `templates/`):**

```
.synaptic/
├── BRAIN.md                    ← filled from interview (schema/format version stamp, Context Capsule, capture_policy, Capture Contract, deploy-source pointer, Brain Map)
├── knowledge/
│   ├── INDEX.md                ← cluster stubs from Round 2
│   ├── {cluster}/
│   │   └── _index.md           ← sub-MOC (1-line per node)
│   └── lessons/
│       └── README.md
├── registries/
│   └── _index.md               ← empty index (+ any tables from Round 4)
├── references/
│   ├── _index.md               ← empty existence index
│   └── raw/                    ← verbatim drop-zone
├── harness/
│   ├── conventions.md          ← from Round 3
│   ├── guardrails.md           ← from Round 3
│   └── skills/
│       └── README.md
├── playgrounds/
│   └── README.md
├── journal/
│   └── _current.md
└── templates/
    ├── node.md
    ├── registry.md
    ├── playbook.md
    └── lesson.md
```

Use real data — no `{{placeholder}}` values in generated files. Report the full file list when done.

---

## Lifecycle axis (optional actionability scoping)

Knowledge nodes (and registries, where meaningful) MAY carry one optional frontmatter field —
`lifecycle:` — that scopes the **active working set**. It applies to `knowledge/**` and
`registries/` only; it is **never** used on `playgrounds/` or `journal/` (those are the separate
raw/working layer, governed by consolidation, not by a lifecycle field). Adding it does **not** bump
the brain schema — it is additive optional frontmatter, the same class as typed edges and provenance.

**Field + values (closed enum, exactly four):**

```yaml
lifecycle: project | area | resource | dormant
```

- `project` — a disposable **hot node**: a live, time-boxed effort. Links OUT to durable nodes.
- `area` — an ongoing responsibility / durable domain node with no end date. **The default for
  un-tagged nodes.**
- `resource` — reference material relevant *someday*, not part of the current working set.
- `dormant` — cooled off: kept for the record, not loading by default. Reversible (see below).

**Default / absent (backward-compatible).** A node **without** `lifecycle:` is treated as **`area`**
for scoping — it default-loads, exactly as every pre-v1.3.0 node did. Absence is legal, never an
error; a skill-less or older-skill agent that does not understand the field simply ignores it.

**Active-set scoping rule (the convention the agent follows — no index, no runtime):**

- **Default working context (default-load set) = `project` + `area` + (absent → area).**
- **Lazy-pull set = `resource` + `dormant`** — loaded only when a query / MOC path explicitly
  points at them, or the user asks.
- **MOC visibility is unaffected:** a node's lifecycle never removes it from its cluster `_index.md`.
  Cooling a node is a load-priority signal, not de-registration (de-registration would orphan it).

**Archive-don't-delete demotion (reversible cooling, never a delete).**

- **Demote:** flip `lifecycle: dormant`. Keep the file in place; keep its `_index.md` entry
  (optionally append " (dormant)" to the one-line summary so the MOC stays honest); keep all its
  `[[wikilinks]]` and typed edges intact. Archiving must not sever the graph.
- This is **decoupled from `status`** — demotion flips `lifecycle` **only**; do NOT also set
  `status: archived`. `status` stays the orthogonal editorial-trust field (a node can be
  `status: active` + `lifecycle: dormant`).
- **Promote (reverse):** flip `lifecycle:` back to `project` / `area` when it becomes live again —
  a single-field edit, no other change required. Nothing was deleted, so nothing is lost.
- **Boundary with hard delete:** deletion stays a separate, explicit, approval-gated
  `/synaptic-maintain` action ("archive-before-delete"). The lifecycle `dormant` flip is the softer,
  in-graph, reversible step *before* any maintain-delete.

**`project`-links-out convention (no new `type:` token).** `project` is a *lifecycle* value, not a
`type:`. A project node keeps a normal `type:` (usually `knowledge` or `decision`) and carries
`lifecycle: project` — the `type:` enum is unchanged. A project node SHOULD carry ≥1 outgoing typed
edge (`relates_to` / `depends_on` / `part_of`) to a durable `area`/`resource` node, so when it is
cooled to `dormant` the durable knowledge survives independently. Audit/weave may flag a `project`
node with **zero** outgoing durable edges — a diagnose-only finding, never an auto-fix.

---

## Harness Self-Wire

Run after /synaptic-init or on any boot where wiring is absent. Goal: make every agent in the project aware of the brain automatically, without touching user persona config.

### a. AGENTS.md fragment (idempotent, marker-wrapped)

Search for `<!-- BEGIN:SYNAPTIC -->` in the project root `AGENTS.md`.

- **Found:** replace the entire BEGIN:SYNAPTIC … END:SYNAPTIC block with the block below.
- **Not found:** append the block (create `AGENTS.md` if it does not exist).

Write exactly this block — ≤13 lines, no additions:

```
<!-- BEGIN:SYNAPTIC -->
## Synaptic Brain
This project has a Synaptic brain at `.synaptic/`. Before working: read `.synaptic/BRAIN.md`
and follow its capture contract (route durable knowledge, lessons, playbooks, and task
workspaces as specified; files are authoritative over any agent-native memory).
Operating rules (conventions, guardrails) are in the SYNAPTIC-RULES section below.
Commands (synaptic skill): /synaptic-init /synaptic-consolidate /synaptic-ingest /synaptic-audit /synaptic-weave /synaptic-synthesize /synaptic-maintain /synaptic-upgrade
<!-- END:SYNAPTIC -->
```

**Brain pointer (global / seat brains).** The block above hardcodes `.synaptic/` for a brain nested at
the workspace root. For a **global / seat** brain (one `.synaptic/` serving a workspace that holds many
repos, from a higher root or pointed to from elsewhere), replace `.synaptic/` in BOTH pointer lines with
the brain's actual path — relative to the workspace root, or absolute for a fixed local per-user brain.
For a **private** brain over committed work repos, place the bridge AND the deployed rules at **user
level** (e.g. the host's user-level instructions) — never write either into a committed work repo.

Do **not** touch `CLAUDE.md` (user persona territory). If the user explicitly asks to add a brain pointer there, do so only on their explicit instruction.

### b. Skill install

Copy this skill package directory (where this SKILL.md lives, with its `references/` and `templates/`) into:

- `.claude/skills/synaptic/` — discovered by Claude Code, VS Code Copilot, OpenCode
- `.agents/skills/synaptic/` — discovered by VS Code Copilot, Gemini CLI, OpenCode, Codex

Create directories if absent. If a target already contains a `SKILL.md` with the same `version:`, skip and report "already present". Otherwise overwrite.

**Command discoverability (optional, best-effort).** So the `/synaptic-*` commands surface in the host's
slash menu, optionally emit a thin **command stub** per command that the host lists and that only
**points to the SOT** (the skill's `references/<cmd>.md`) — e.g. for VS Code Copilot a `*.prompt.md` per
command in the host's prompts location, body: *"Run the synaptic skill's `<cmd>` — follow
`references/<cmd>.md`."* **[VERIFY]** the host actually lists them. No fallback needed: the agent already
honors a typed `/synaptic-*` and loads its reference, stubs or not.

**Record the wiring.** After wiring + deploy, write/update `harness/setup/<host>.md` in the brain (e.g.
`harness/setup/vscode.md`) capturing what was deployed where for this host: the bridge location + brain
pointer, the rules target, the hook config, and any command stubs. This documents the setup, is the
**re-deploy recipe when you move machines**, and travels in the backup.

### c. Deploy operating rules (idempotent)

This step materializes `harness/conventions.md` and `harness/guardrails.md` into the outer
harness so the agent reads them natively — without reaching into the brain at work-time.

**If you have cloned the full repo and `tools/` is present:** run `node tools/deploy.js <project-root>`
— it backs up AGENTS.md before writing, prints a diff preview, and refuses to deploy if `harness/`
still contains `{{placeholder}}` content. Use `--dry-run` to preview without writing. Otherwise
(`tools/` is not in the skill bundle) use the manual fallback below — it is the default path.

**Manual fallback (default — no `tools/`):**
1. Read `.synaptic/harness/conventions.md` and `.synaptic/harness/guardrails.md`.
2. **STOP** — if either file still contains `{{placeholder}}` values, do NOT deploy. Inform the
   user: "harness/ contains unfilled placeholders — complete the onboarding interview (/synaptic-init) first."
3. Show the user a diff of the proposed SYNAPTIC-RULES block change and require confirmation
   before writing.
4. Compose a combined rules block from both files.
5. Search for `<!-- BEGIN:SYNAPTIC-RULES -->` in the project root `AGENTS.md`:
   - **Found:** replace the entire BEGIN:SYNAPTIC-RULES … END:SYNAPTIC-RULES block.
   - **Not found:** append the block after the BEGIN:SYNAPTIC block.
   - Never touch content outside the marked block.
6. Install `harness/skills/*` into `.claude/skills/{brain-name}-skills/` and
   `.agents/skills/{brain-name}-skills/` (namespaced by brain to avoid collisions — use the
   brain's root directory name or the `name:` field from `BRAIN.md` frontmatter if set). Same
   idempotent pattern as the synaptic skill install: skip if same version, otherwise overwrite.

The block written looks like:

```
<!-- BEGIN:SYNAPTIC-RULES -->
<!-- Auto-generated from .synaptic/harness/ — edit the source there, then re-run deploy; edits here are overwritten. -->
## Working Conventions
{content from harness/conventions.md — stripped of YAML frontmatter}

## Guardrails
{content from harness/guardrails.md — stripped of YAML frontmatter}
<!-- END:SYNAPTIC-RULES -->
```

**On re-deploy** (any subsequent `/synaptic-init` or `/synaptic-upgrade` run): the marked block is fully replaced
with the current source. Unmarked user content in AGENTS.md is never touched.

### d. Capture mechanism — deploy host hooks (CORE; v1-final §5.9)

Wire the **layered, host-aware capture mechanism**. **Hooks are CORE** — a hook config
(`settings.json`, `.github/hooks/*.json`, `.cursor/hooks.json`, `AGENTS.md`) is plain text/JSON
the **host already runs**; it needs no runtime we ship. Each hook calls into the synaptic skill
(e.g. invokes `/synaptic-consolidate` or appends a journal breadcrumb) using the host's own
runtime — Synaptic ships no daemon. **Detect the host, deploy the layers it supports, and degrade
gracefully** — never fail if a layer is unavailable.

**The four layers (deploy each where the host supports it):**

| Layer | Trigger | Host support | What it does |
|---|---|---|---|
| **(a) Stop breadcrumb** | per assistant turn (`Stop`) | **UNIVERSAL — all 5 agents** | Append **one terse line** to `journal/_current.md` (the meaningful change/decision this turn). The **workhorse + crash-proof floor**. **Fixed cost; NOT governed by `capture_policy`.** |
| **(b) PreCompact flush** | before context compaction (`PreCompact`) | **Claude / Copilot / Codex** | Run `/synaptic-consolidate` (or flush breadcrumbs) **before context is lost** — the gem for long/abused sessions. |
| **(c) SessionStart rescue** | on next boot (`SessionStart`) | most hook-capable hosts | Detect **unconsolidated breadcrumbs / active playgrounds** and **offer to consolidate** — recovers abandoned sessions. Pairs with `/synaptic-audit`'s half-done check = the abandonment safety sweep. |
| **(d) SessionEnd bonus** | clean exit (`SessionEnd`) | **bonus where present** (NOT Copilot-IDE, NOT Cursor) | On clean exit, offer/run consolidation. A bonus only — capture must **never depend on it**. |

**Deploy logic (host-gated, idempotent):**

1. **Detect the host harness** from what is present in the project root: `.claude/` →
   Claude Code (Stop, PreCompact, SessionStart, SessionEnd via `settings.json` hooks);
   `.github/` Copilot → Stop, PreCompact, SessionStart (no SessionEnd in Copilot-IDE);
   Codex / `AGENTS.md` host → Stop, PreCompact, SessionStart, SessionEnd as available;
   `.cursor/` → Stop + SessionStart only (no PreCompact, no SessionEnd; use `.cursor/hooks.json`);
   Gemini CLI → Stop + SessionStart where exposed.
2. For each supported layer, **write the host's native hook config** (marker-wrapped / idempotent,
   same discipline as the AGENTS.md fragment: replace a `BEGIN:SYNAPTIC-HOOKS` … `END:SYNAPTIC-HOOKS`
   block if present, else add it; never touch unmarked user hooks). The hook command invokes the
   skill via the host runtime (append-breadcrumb for `Stop`; `/synaptic-consolidate` for the rest).
3. **Always deploy `Stop`** (universal). Deploy `PreCompact` / `SessionStart` / `SessionEnd` only
   where the detected host supports them.
4. **Degrade gracefully:** if the host exposes **no usable hooks**, deploy nothing and fall back to
   the **instruction layer**: the breadcrumb contract in `BRAIN.md` still instructs the agent to
   append a one-line journal breadcrumb per meaningful turn *by hand*, so the breadcrumb floor holds
   with zero automation. Tell the user plainly: *"This host has no capture hooks — the agent still
   writes per-turn breadcrumbs as an instruction; run `/synaptic-consolidate` manually at the end of
   meaningful work (and `/synaptic-maintain` periodically)."* The brain still works fully; only the
   automation degrades — the instruction-layer breadcrumb is what closes issue #2 on hook-less hosts.
5. **Per-host degradation floor (what stays when a layer is missing).** On **every** host the
   instruction-layer breadcrumb is the floor, so no host is ever breadcrumb-empty:
   - **Claude Code** — full set (Stop, PreCompact, SessionStart, SessionEnd).
   - **Copilot** — Stop + PreCompact + SessionStart; no SessionEnd → clean-exit consolidation falls
     back to the SessionStart-rescue net (below) or a manual `/synaptic-consolidate`.
   - **Codex / `AGENTS.md` host** — Stop + PreCompact + SessionStart + SessionEnd as available; any
     absent layer → instruction-only breadcrumbs + manual `/synaptic-consolidate`.
   - **Cursor** — Stop + SessionStart only; **no PreCompact** → flush-before-compaction falls back to
     the SessionStart-rescue net + instruction-only breadcrumbs.
   - **Gemini CLI** — Stop + SessionStart where exposed; anything not exposed →
     instruction-only breadcrumbs + manual `/synaptic-consolidate`.

> **PreCompact not fired? SessionStart-rescue is the net.** On any host where `PreCompact` is absent
> or silently fails to fire, the next-boot `SessionStart` rescue detects the unconsolidated
> breadcrumbs / active playgrounds and offers to consolidate (see `references/audit.md`'s half-done
> check). Because the instruction-layer breadcrumb wrote the trail regardless, nothing is lost — the
> rescue simply consolidates it on the next session.

> **Breadcrumb cadence is provisional (token-optimization to revisit).** The per-turn breadcrumb is
> good for now, not a fixed rule: a future Cortex T2 Engram-style FTS journal index (`ROADMAP.md` →
> "Engram-style searchable journal — Cortex") may make it partly redundant as a search surface.
> Revisit the cadence when that layer lands — never a CORE dependency.

**Honest limits (do not overclaim — v1-final §5.9, §9.1):**
- **No agent has native idle detection.** This is **passive, event-driven** capture on hook-capable
  hosts + the per-turn journal as the universal fallback + `SessionStart`-rescue as the safety net —
  **never an unattended idle daemon at CORE**. (An OS-cron/background timer would be **Cortex**, not
  CORE, and is never required.)
- **`PreCompact` / `SessionEnd` are host-conditional;** only the `Stop` breadcrumb is the universal
  capture floor.
- **Breadcrumbs vs promotion are orthogonal:** breadcrumbs are the always-on fixed-cost floor and
  are **not** governed by `capture_policy`. `capture_policy` (`selective | balanced | capture-all`)
  governs only **how much gets promoted into the wiki** during consolidation.

### e. Cursor shim (optional)

If `.cursor/` exists in the project root, write `.cursor/rules/synaptic.mdc`:

```
This project has a Synaptic brain. See AGENTS.md (BEGIN:SYNAPTIC block) for instructions.
Read `.synaptic/BRAIN.md` at session start. Commands: /synaptic-init /synaptic-consolidate /synaptic-ingest /synaptic-audit /synaptic-weave /synaptic-synthesize /synaptic-maintain /synaptic-upgrade
```

### f. Cross-agent sync

Cross-agent rule-sync tools (gentle-ai, ai-rules-sync, block/ai-rules, rulesync) pick up the skill directories automatically — nothing else to configure.

---

## Operations

Load the referenced file only when the operation is invoked, not at boot.

| Command | What it does | Reference |
|---|---|---|
| `/synaptic-init` | No brain → interview + generate (from `templates/`) + wire + deploy operating rules + deploy capture hooks. Brain present but unwired → wire + deploy. Brain present + wired → extend (add cluster / registries / ingest). | This file |
| `/synaptic-consolidate` | Run the six-step capture contract on session output (journal + playground artifacts); the manual fallback when no capture hooks are wired | `references/consolidate.md` |
| `/synaptic-ingest [file]` | Distill a document into an atomic node + reference entry | `references/ingest.md` |
| `/synaptic-audit` | DIAGNOSE: staleness, orphans, broken `[[wikilinks]]`, MOC coverage, cross-link coverage, **god-nodes (over-connected hubs, degree ≥ 15 or ≥ 3× median) + surprising edges (cross-cluster links)**, half-done/unconsolidated + pending-breadcrumb check, registry integrity, oversized untyped nodes, tag hygiene | `references/audit.md` |
| `/synaptic-weave` | Graph-gardening pass: propose missing `[[links]]` (typed-edge proposals, propose-never-write), flag under-connected nodes, detect concept gaps, suggest merges, promote recurring themes | `references/weave.md` |
| `/synaptic-synthesize` | Generative pass over the curated brain: write synthesis nodes (cross-source patterns, concept evolution, orphan rescue), each with `[[wikilinks]]` + MOC registration at write time; propose/confirm for merges. Does not replace consolidate. | `references/synthesize.md` |
| `/synaptic-maintain` | Portable maintenance procedure: reconcile flagged `contradicts`/`supersedes` + synthesize + orphan/cross-link repair via diagnose-then-treat, approval-gated; bounded-reversible, diff-traced, archive-before-delete | `references/maintain.md` |
| `/synaptic-upgrade` | Migrate v0.3 / v0.4 / v0.5 brain to v1 (schema/format change); redeploys operating rules + capture hooks | `references/upgrade-to-v1.md` |

**Tools awareness:** if a runtime is available, prefer `tools/` scripts (check/migrate/export/vault-open) for the mechanical steps. If no runtime, perform the operation manually as described in the reference files.
