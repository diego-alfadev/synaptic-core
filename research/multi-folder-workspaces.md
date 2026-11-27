# Spike: a brain in an additional folder of a multi-folder workspace

Status: research spike, 2026-11-27, decision recorded the same day (D4). No engine change; the
skill-text changes ship on the same branch. Engine under study: 1.8.0.

## Question

How should a Synaptic brain behave when its folder is not the session's primary working directory
but an additional folder of a multi-folder workspace (Claude Code `--add-dir` / desktop "add folders",
Codex `--add-dir` and app secondary folders, OpenCode, Cursor multi-root)?

## Short answer

- **A project brain in an additional folder is inert on every host checked, except Cursor.** Claude
  Code, Codex and OpenCode do not load that folder's `AGENTS.md`. No host runs its project hooks. On
  Cursor the root `AGENTS.md` of every folder is loaded, but for the whole workspace (a known issue
  per Cursor staff), so a relative `.synaptic/` pointer becomes ambiguous.
- **The dangerous case is the skill, not the bridge.** Claude Code does discover the additional
  folder's `.claude/skills/`. A loaded `synaptic` skill resolves the brain from the primary folder
  (`CWD/.synaptic/`). It can then offer onboarding in the wrong folder, or boot the primary folder's
  brain for work done in the other folder.
- **Decision (owner, 2026-11-27): D4.** It combines a Detect-on-Load guard in the skill, an optional
  path-free discovery rule at user level, and the limitation stated plainly: full automation needs the
  brain's folder as the primary folder. The router (D2) was rejected as too much for the core. A single
  global brain stays parked for the 2.0 Cortex decision.

## Evidence labels and method

| Label | Meaning |
|---|---|
| **docs** | Stated in current official documentation (URL in Sources). |
| **source** | Stated in the host's published source code. |
| **forum** | Stated on the vendor's forum, not in documentation. |
| **probed** | Observed in a run on this machine (Claude Code only, see below). |
| **inferred** | Follows from the above, not stated or observed. |

Probe setup (Claude Code 2.1.327, macOS):
- Synthetic folders (primary `P*`, additional `A*`) sat in a fresh OS temp directory. Each held only
  marker files: `CLAUDE.md` / `AGENTS.md` lines with unique `TOKEN-…` strings, a marker skill, marker
  commands, and `SessionStart` / `UserPromptSubmit` hooks that append a line to a log.
- Runs used `claude -p --no-session-persistence --setting-sources project,local`, a clean environment
  and `--debug-file`. Each run asked the model to quote every `TOKEN-` line it saw, then to read a file
  in a subfolder and report anything new.
- Hook firing was read from the logs. Instruction loading is the model's own report, cross-checked
  against positive controls and debug lines.
- **Limit:** everything ran in non-interactive `-p` mode. Interactive behaviour (trust and import
  dialogs) is unverified.
- **Probe-design note:** Claude Code refuses to load instruction files from its own session scratch
  directory. The debug log says it "is in a session scratch dir". The fixtures therefore lived in a
  separate OS temp directory.

Codex, OpenCode and Cursor were **not probed**:
- Codex and OpenCode keep sessions and credentials under the user's home directory, and this spike
  writes nothing there.
- Cursor is not installed.

Their rows rely on docs, source and forum posts only.

## Host matrix

P = primary folder, A = additional folder.

| | Claude Code (CLI; desktop maps "add folders" to `--add-dir`) | Codex (CLI + app) | OpenCode | Cursor |
|---|---|---|---|---|
| Instructions from P | `CLAUDE.md`, or `AGENTS.md` only if no `CLAUDE.md` is in P or above it (default mode `claude-md-or-agents-md`; `claude-md-and-agents-md` loads both, settable only in user, `--settings` or managed settings) — docs, probed R1/R3 | `AGENTS.md` chain from the project root (`.git` marker) down to cwd; an override wins; 32 KiB cap — docs | `AGENTS.md` from cwd up to the project root; `CLAUDE.md` fallback — docs | Root and nested `AGENTS.md`, `.cursor/rules` — docs |
| Ancestors of P | Loaded at launch — docs | Only down from the project root — docs, source | Up to the project root — docs | Not documented |
| Subfolders of P on demand | `CLAUDE.md` on first read there — docs, probed. A subfolder with only `AGENTS.md` is **not** loaded when a `CLAUDE.md` governs — probed R7 | Not documented (cwd chain only) | Lazily, on read/list — docs | Nested files scoped to their folder — docs |
| A's `CLAUDE.md` | Not loaded — docs, probed R1. With `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1`: its `CLAUDE.md`, `.claude/CLAUDE.md`, `CLAUDE.local.md` and rules load — docs, probed R2 | n/a | n/a | n/a |
| A's `AGENTS.md` | **Never**, even with the variable — docs, probed R4 | **No**: `--add-dir` only adds writable roots (source); the app does not discover `AGENTS.md`, skills or `config.toml` in secondary folders (docs) | No multi-root concept; only via absolute paths in `instructions` — docs | **Every root's top-level `AGENTS.md` applies to the whole workspace** — forum (staff, "known issue") |
| `@` imports in A's `CLAUDE.md` | Not loaded in `-p` (R4/R5). **Confounded:** an import from P to a file outside P was not loaded in `-p` either (R6). Docs: an import resolving outside the working directory is "external" and needs a one-time approval dialog; declining disables it. Whether A's imports count as external is not stated. Most likely cause: the external-import gate, not an extra-folder rule (inferred) | n/a | n/a | n/a |
| Subfolders of A on demand | `A/sub/CLAUDE.md` not loaded after a read there, with or without the variable — probed R1/R2 | n/a | n/a | Not documented |
| Project hooks from A | **Not run.** A's settings are read only for `enabledPlugins` / `extraKnownMarketplaces` (docs); P's hooks fired, A's did not (probed R1/R2). `CLAUDE_PROJECT_DIR` is P (docs) | **No**: hooks come only from trusted `.codex/` layers root→cwd (docs); none from A (inferred) | Plugins only, from discovered `.opencode/plugins/` or the `plugins` array — docs | `<project-root>/.cursor/hooks.json`; hook input lists all `workspace_roots` (docs); local multi-root resolution not documented |
| Project skills from A | **Discovered** (docs, probed). On a name clash both appear, A's scoped as `A:<name>` (probed R7). A command clash keeps P's command (docs, probed R7) | **No**: `.agents/skills` from cwd up to the repo root; no extra search path (docs) | Only via the `skills` config array (absolute paths allowed) — docs | All roots — forum (non-staff) |
| Workspace trust | Interactive sessions ask to trust an added folder (2.1.326+) — docs; skipped in `-p` | Project config and hooks need a trusted project — docs | n/a | n/a |

**Desktop app observation (n=1, AGENTS.md only).** This spike ran in a Claude desktop session with
four extra folders, each holding an `AGENTS.md`. None of them appeared in the loaded instructions.
The primary folder's `AGENTS.md` and an ancestor's did. This is consistent with the CLI rows. Whether
the desktop "add folders" action loads exactly what `--add-dir` loads is **inferred**: the docs state
only that the two map to each other.

## Probe results (Claude Code 2.1.327, `-p`)

| Run | Setup | Observed |
|---|---|---|
| R1 | cwd P (`CLAUDE.md` + `AGENTS.md`), `--add-dir A` | P `CLAUDE.md` loaded; P `AGENTS.md` not (a `CLAUDE.md` exists); A skill listed; A `CLAUDE.md`, `AGENTS.md` and `sub/CLAUDE.md` not loaded; hooks: only P's fired |
| R2 | R1 + `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` | Adds A `CLAUDE.md`; A `AGENTS.md` and `A/sub/CLAUDE.md` still not loaded; only P's hooks fired |
| R3 | cwd P2 (`AGENTS.md` only), A, variable on | P2 `AGENTS.md` loaded natively; A `CLAUDE.md` loaded; no hook fired (P2 has none, A's did not run) |
| R4 | cwd P; A2 (`AGENTS.md` only) and A3 (`CLAUDE.md` with the Synaptic boot block `@AGENTS.md`); variable off and on | Off: nothing from A2/A3. On: A3 `CLAUDE.md` text loaded, its `@AGENTS.md` import **not** followed; A2 nothing |
| R5 | cwd P3 (`CLAUDE.md` with `@AGENTS.md`); A3; A4 (`@BRIDGE.md`); variable on | P3 import followed (positive control); A3 and A4 imports not followed |
| R6 | cwd P3 with an extra import `@../A4/BRIDGE.md`, no add-dir | The in-folder import loaded; the out-of-folder import did **not** (external import, and `-p` shows no approval dialog), which confounds R4/R5 |
| R7 | cwd P4 (`CLAUDE.md`, skill `probe-dup`, command `probe-cmd`, `sub2/AGENTS.md` only); `--add-dir A5` (same skill and command names) | Two skills: `probe-dup` (P4) and `A5:probe-dup` (A5); one command, P4's; `sub2/AGENTS.md` not loaded on read |

**End-to-end runs with the real skill (after D4).** Setup:
- primary folder `main`, with no brain;
- added folder `lab`, with `.synaptic/BRAIN.md` and the Synaptic skill as a project skill;
- task: "add a line to `lab/notes.md`"; n=1 each, same model.

| Run | Skill version | Observed |
|---|---|---|
| R8 | This branch | Invoked the `synaptic` skill and read `references/multi-folder.md` and `BRAIN.md`. It added the journal line to the lab brain only, and said three things: the brain covers only `lab/`, its hooks do not run in this session, and `/synaptic-consolidate` or the next session opened in `lab/` picks the capture up |
| R9 | 1.8.0 (control) | Never invoked the skill. It found `.synaptic/` only because it listed the folder, followed the `BRAIN.md` line, and offered to delete that journal line. It mentioned neither the hooks nor consolidation |

The change is what makes the agent load the skill and state the limit. Without it, the outcome depends
on whether the agent happens to list the folder.

A mis-run whose cwd was the common parent of P and A also showed something useful. When the extra
folder sits *inside* the primary folder, its `CLAUDE.md` and nested `CLAUDE.md` load on demand like
any subfolder of P.

## Consequences for Synaptic's wiring

Case: a project-reach brain in folder A, used in a session whose primary folder is P.

| Wiring piece (`references/init.md`, `SKILL.md`) | Effect when A is an additional folder |
|---|---|
| **L1 bridge** (`BEGIN:SYNAPTIC` in A's root `AGENTS.md`) | Not loaded on Claude Code, Codex or OpenCode, so the brain does not boot. On Cursor it is loaded for the whole workspace. The bridge text "This project has a Synaptic brain at `.synaptic/`" then reads as applying to every root, and the relative pointer may resolve against the wrong folder. |
| **Claude boot adapter** (§a2, `@AGENTS.md` in A's `CLAUDE.md`) | Without the variable, nothing loads. With it, the `CLAUDE.md` text loads but the import was not followed in `-p`. Interactively it may load after the external-import approval (unverified). Otherwise the bridge only reaches the model if it is written inline in `CLAUDE.md`, which duplicates the `AGENTS.md` block and breaks the "one import line" guarantee. |
| **Rules block** (`BEGIN:SYNAPTIC-RULES` in the same carrier) | Same as the bridge: inert, or workspace-global on Cursor. |
| **L2 skill** (project `.claude/skills/synaptic/` in A) | Discovered on Claude Code, but not on Codex or OpenCode. Once loaded, Detect-on-Load resolves `CWD/.synaptic/BRAIN.md` (P), then a bridge. It never looks at A. If P has no brain, it offers onboarding in P. If P has its own brain, it boots that brain for A's work. That is cross-brain contamination, and a confidentiality leak when P is a client repo. |
| **L4 capture hooks** (project-scope settings in A) | Never run on any host checked (probed on Claude Code, documented for Codex and OpenCode, undocumented for Cursor). Capture silently drops to assisted, but only if the agent knows the brain exists, which needs a working L1. With no activity marker either, audit sees a frozen brain: the failure class that motivated §a2. If P has its own hooks, they record P activity for turns that were about A. |
| **Round 0.5 "several folders"** | Treats "several folders" as "one global brain". It has no answer for "several project brains used together in one session", which is exactly the first consumer's situation. |
| **Nesting setup-check** | Looks only at higher and user-level bridges covering the folder. It does not see brains in sibling session folders, so two brains active in one session go undetected. A brain nested *inside* the primary folder is reachable on Claude Code (subfolder `CLAUDE.md` on demand; `AGENTS.md` only when no `CLAUDE.md` governs) and on OpenCode (lazy), but not on Codex. |
| **Setup record** (`wired`, `carrier_id`) | `wired: baseline` is true only for sessions where A is primary. L1 "effective" depends on the session, and the record cannot express that. |

## Designs

### D1 — Per-folder bridge, a primary-folder rule, and a guard

- Keep the wiring as is and document the rule: **a project brain boots only in sessions whose primary
  folder is the brain's folder (or below it, host permitting)**.
- Add a read-only guard to Detect-on-Load. Before offering onboarding, or booting a CWD brain for
  work in another folder:
  - if the host lists additional session folders (Claude Code shows them to the model), check each
    for `.synaptic/BRAIN.md`;
  - when one is found, do not onboard and do not route its work into another brain;
  - report it once instead: "the brain in `<folder>` is not booted in this session; open that folder
    as the primary folder to use it".
- Hardening the bridge text (pointer relative to the folder holding the carrier, for Cursor) was
  considered and **dropped**. 1.8.0 keeps generated bridge wording fixed so installed bridges do not
  drift; a wording change belongs in a release that announces it.

### D2 — User-level workspace router

- One marker block in the user-level, non-synced carrier maps each registered folder to its brain by
  absolute path: "work under `<folder>` follows `<brain>/BRAIN.md`".
- The agent boots a brain lazily when the session touches its folder, and routes capture by path.
- This works on any host with user-level instructions: Claude `~/.claude/CLAUDE.md`, Codex global
  `AGENTS.md`, OpenCode global `AGENTS.md`, Cursor user rules. It does not depend on any host's
  `--add-dir` semantics.

### D3 — Skill-level discovery across session folders

- Detect-on-Load scans every session folder the host exposes and boots each brain on demand.
- There are no new carriers.
- It depends on the skill being loaded, and on the host telling the model which folders the session
  has.

### D4 — Guard + path-free discovery rule + stated limitation (adopted)

This design came out of the owner review. It takes D1's guard, and replaces D2's registry with a
**rule**: "a folder of this session that holds `.synaptic/BRAIN.md` has its own brain; use it for work
that touches that folder only".

- **Pattern: engine global, brain local.** This is how a globally installed tool such as gentle-ai
  serves per-project data. The skill and the rule can sit at user level while every brain stays in its
  own folder.
- **Trigger: the files the task touches, not the working directory.** The cwd is always the primary
  folder. A README fix or a dependency read in that folder mentions the brain once and moves on.
  Asking every time would be noise.
- **Contract first, rule only on request.** At the pure-contract level the skill description is the
  trigger. On Claude Code a project skill in an added folder is discovered (probed R7, R8), so this works
  with no extra setup. The user-level rule (`references/init.md` §a5) is installed only when asked for,
  never offered: an unexplained optional question gets answered blind and goes stale. It is refused
  while a user-global bridge is wired, which is the 2.0 coexistence case.
- **Limitation stated, not hidden.** Hooks of an additional folder never run, so capture there is
  manual. What is written waits for the rescue of the next session that opens the folder as primary.

### Scoring

| Criterion | D1 primary-folder rule + guard | D2 user-level router | D3 skill-level discovery | **D4 guard + discovery rule** |
|---|---|---|---|---|
| L1 when A is additional, without the host loading anything from A | No (inert, but announced) | **Yes**, on all four hosts | Only where the skill loads: Claude Code from A; Codex and OpenCode need a user-level skill install | **Yes** where the rule is installed and the host names its folders; otherwise D1 |
| Capture when A is additional (no host runs A's hooks) | None for A; P is unaffected | Assisted breadcrumbs routed by path. No deterministic activity marker for A: a user-level hook sees only the primary cwd | Assisted, and only after the skill triggers; a skill is not an always-on boot | Assisted (manual), stated plainly; the next primary session's rescue recovers playgrounds |
| Detect-on-Load hazard (wrong brain / second brain) | **Removed** by the guard | Removed, provided arbitration is defined | Removed where the folder list is exposed; otherwise unchanged | **Removed** (guard, plus the rule's "that folder's work only") |
| New external writes | None (skill text only) | One approval-gated user-level block, plus upkeep when folders move | None, or a user-level skill install | One optional, approval-gated user-level block that never changes |
| Contract impact | Fits 1.8 | **Multi-binding**: `host-setup.md` says "not 1.8 multi-binding", and `init.md` defers coexistence to 2.0. It needs arbitration when P and A both have brains, and a registry schema | Implicit multi-binding without a registry; still needs arbitration | Fits 1.8: no registry; scoping by folder is the arbitration; excluded alongside a global bridge |
| Privacy | Unchanged | Every session sees the list of brain paths, the same posture as a global brain; never in a repo | Unchanged | No paths or names anywhere |
| Cost per session | ~0 | Router block resident everywhere | ~0 until triggered | ~124 tokens per skill load and ~15 in the description; the rule (~110 tokens) only if requested |

## Recommendation (decided: D4)

1. **Ship D4 in the next 1.8.x.** It is skill and reference text only, with no engine code and no
   schema change. Changes on this branch:
   - **`references/multi-folder.md`** (new, loaded on demand) holds the rules:
     - the CWD brain resolves at load as before;
     - a folder with its own brain is served only by it, read lazily and COMPAT-checked;
     - a folder without one is served as before, so a user-global brain keeps capturing there;
     - onboarding is offered only for the CWD;
     - the manual-capture limit is stated once.
   - **`SKILL.md`:** a three-line pointer, and a description trigger for `.synaptic/` in any session
     folder.
   - **`init.md`:**
     - a Round 0.5 multi-folder answer that states the rule and asks nothing more;
     - the nesting check also reports brains in sibling session folders;
     - §a5, the `BEGIN:SYNAPTIC-DISCOVERY` rule, installed **only on request**: an optional question
       asked without context gets answered blind and goes stale.
   - **`host-setup.md`:** the record field `discovery: configured | not-configured`.
   - **`capture-hooks.md`:** no layer runs for a brain in an additional folder.

   **Cost (bytes/4):**
   - `SKILL.md` +499 bytes (~124 tokens) per skill load;
   - the description +~15 tokens, always resident;
   - everything else on demand.

   A first draft put the whole guard in `SKILL.md`: +2.2 KB, ~550 tokens per load. It was moved out to
   keep the 1.6 small-core budget.
2. **For the first consumer now:** start sessions in the consumer's own folder and add the other
   folders as extras. Its project-scope capture hooks fire only then. Do not rely on
   `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`:
   - it never loads `AGENTS.md`;
   - the boot import was not followed in `-p`;
   - it never makes A's hooks run.
3. **Reject D2.** It would need a registry and arbitration, which is 2.0 work and too heavy for the core.
4. **Reject D3 as the primary mechanism.** A skill is not a boot, and the session folder list is not
   exposed uniformly across hosts. Its scanning idea survives inside the guard.
5. **Revisit if hosts standardise multi-folder configuration.** If a host starts loading an added
   folder's instructions and hooks, the limitation shrinks to a host-version note.

## Note for the 2.0 decision: a single global brain

**A user-global brain solves this problem completely.** Its bridge and its hooks sit at user level
with absolute paths, so:
- they load and fire whatever the primary folder is;
- the activity marker, breadcrumbs and rescue all work in every session.

This joins earlier cases where a global brain was the simpler answer. The open risk is unchanged:
discovery and performance when one brain spans several *areas*, not only several repositories of one
area. That is what the 2.0 Cortex layer is meant to answer.

Project brains keep their place for isolation: shared with colleagues, a work-only brain, a client.
D4 does not block a later move to a global brain. It is excluded while a global bridge is wired.

## Follow-up spike: a deterministic path hook (core full, not this change)

A user-level `PostToolUse` hook could walk up from each touched file path to the nearest
`.synaptic/BRAIN.md` and act once per brain per session:
- inject one line of context;
- optionally append that brain's (a0) activity marker.

That would be the only way to restore a mechanical capture floor for a brain in an added folder.
- **Cost:** no tokens beyond that one line, but a process spawn on every matching tool call, in every
  session, including the many where it never fires.
- **Owner condition:** it must not become a hook that slows the harness or needs watching.

The spike must measure p50/p99 latency per call. It must also decide the matcher scope (file tools
only), opt-in installation, the per-session state and its edge cases (symlinks, very deep trees,
network mounts). Whether Claude Code accepts `additionalContext` on `PostToolUse`, and what Codex
offers, is unverified.

## Open questions (not verified)

- Interactive Claude Code: does approving the external-import dialog make A's `@AGENTS.md` import
  load (variable on)? If it does, §a2 works in an additional folder after a one-time approval per
  project. That is still Claude-only and needs the variable. Does the desktop "add folders" action
  load exactly what `--add-dir` loads?
- `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD` can be kept on through the `env` block of user
  settings (docs, memory and env-vars pages). Not probed; a change needs a relaunch (inferred).
- Codex, OpenCode and Cursor live probes need an isolated home with throwaway credentials. Not done.
- Cursor multi-root behaviour rests on forum posts; Cursor stays an unknown adapter in Synaptic.
- OpenCode `references` and `external_directory`: effect on what loads is undocumented.

## Sources (checked 2026-11-27)

- Claude Code: [memory](https://code.claude.com/docs/en/memory.md) ·
  [permissions — additional directories](https://code.claude.com/docs/en/permissions.md) ·
  [skills](https://code.claude.com/docs/en/skills.md) · [sub-agents](https://code.claude.com/docs/en/sub-agents.md) ·
  [hooks](https://code.claude.com/docs/en/hooks.md) · [settings](https://code.claude.com/docs/en/settings.md) ·
  [CLI reference](https://code.claude.com/docs/en/cli-reference.md) · [desktop](https://code.claude.com/docs/en/desktop.md)
- Codex: [AGENTS.md discovery](https://learn.chatgpt.com/docs/agent-configuration/agents-md) ·
  [advanced config](https://learn.chatgpt.com/docs/config-file/config-advanced.md) ·
  [skills](https://learn.chatgpt.com/docs/build-skills) · [hooks](https://learn.chatgpt.com/docs/hooks) ·
  [projects (app)](https://learn.chatgpt.com/docs/projects.md) ·
  source [`agents_md.rs`](https://github.com/openai/codex/blob/main/codex-rs/core/src/agents_md.rs),
  [`shared_options.rs`](https://github.com/openai/codex/blob/main/codex-rs/utils/cli/src/shared_options.rs)
- OpenCode: [rules](https://opencode.ai/docs/rules/) · [skills](https://opencode.ai/docs/skills/) ·
  [plugins](https://opencode.ai/docs/plugins/) · [config](https://opencode.ai/docs/config/) ·
  [permissions](https://opencode.ai/docs/permissions/)
- Cursor: [rules](https://cursor.com/docs/context/rules) · [skills](https://cursor.com/docs/skills) ·
  [hooks](https://cursor.com/docs/agent/hooks) ·
  forum: [AGENTS.md leaks across roots](https://forum.cursor.com/t/agents-md-leaks-into-other-repositories-in-multi-repo-workspace/155477),
  [folders in multi-root workspaces](https://forum.cursor.com/t/cursor-folders-in-multi-root-workspaces/158433)
- Related in this repo: [harness wiring landscape](harness-wiring-landscape.md),
  `standalone/synaptic/references/init.md`, `standalone/synaptic/SKILL.md`,
  `standalone/synaptic/references/host-setup.md`, `standalone/synaptic/references/capture-hooks.md`
