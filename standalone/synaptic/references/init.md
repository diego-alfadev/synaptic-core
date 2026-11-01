<!-- summary: Set up or re-wire a brain — onboarding interview, generate from templates/, wire the harness (bridge, skill install, operating rules, capture hooks, Cursor shim). -->

# /synaptic-init — onboarding, generate, self-wire

> Run host-setup detection first: `references/host-setup.md`.

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

**Round 0.5 — Topology (reach): ONE folder or SEVERAL?**
> "Do you work in ONE project folder, or across SEVERAL folders? If several, I'll set up ONE global
> brain that follows you into every folder — you won't have to install it again per folder."

- **"Several folders" → user-global reach is the recommended default.** Take the **global branch**
  below. There is no separate "global mode" — global is just the far end of the reach axis: the bridge
  wired at **user level**.
- **"One folder" →** the existing project-local flow (unchanged), plus a one-line note that they can
  convert to global later (`references/convert-to-global.md`).

> **Nesting setup-check (warn, don't guard).** On any `/synaptic-init` inside a folder, first **check**
> whether a higher / user-level `BEGIN:SYNAPTIC` bridge already resolves a brain that would cover this
> folder. If yes, and the user is about to create a **second** brain nested inside that coverage, warn
> **before generating**: *"A global brain at `<path>` already covers this folder. Nesting a second brain
> here creates two active bridges over the same location — behavior is undefined and both may fire.
> Recommend: keep the one global brain, or convert deliberately."* This is **advisory** — proceed only on
> explicit user confirmation; it never hard-fails (v2.0 coexistence is where arbitration lands).

**Global branch (guided — hide internals; ask only on genuine forks):**
1. **Pick the global root.** Default-propose the home dir (`~/` / `C:/Users/<user>`); confirm; allow a
   chosen broad dev root. The brain is created at `<global-root>/.synaptic/`.
2. **Generate the brain** at the global root from `templates/` (the normal Generate step — no change to
   brain structure).
3. **Detect the host + its user-level instruction context** (see `references/host-setup.md`; record in
   `harness/setup/<host>.md`).
4. **Wire the bridge at user level** — write `BEGIN:SYNAPTIC` into the host's user-level instruction
   context, both pointer lines rewritten to the brain's **absolute** path, **plus the skill's absolute
   path** (grep-recoverable). Never into a foreign committed **or synced** repo.
5. **Deploy rules at user level** — `BEGIN:SYNAPTIC-RULES`. Symlink `harness/` **only** on a POSIX local
   (non-synced) path where allowed; on **Windows or any OneDrive/DFS-synced location, symlinks are NOT
   allowed** — emit the block / generate a pointer file.
6. **Deploy capture hooks at user level, host-gated** (see `references/capture-hooks.md`) so they fire across all folders (e.g. the
   host's user-level hook location, not `.github/hooks` inside one repo). Degrade to the
   instruction-layer breadcrumb if no user-level hook path exists.
7. **Install the skill** in the user-level skill discovery paths; **also** write the skill's absolute
   path into the user-level bridge (step 4) so hosts that don't discover user-level skill dirs can still
   load it by path.
8. **Record + report** — write the wiring to `<global-root>/.synaptic/harness/setup/<host>.md`; report
   which folders it now serves, where the wiring lives, the nesting warning, and any host limitation
   (no user-level skill discovery → skill reachable only via the bridge's absolute path; no user-level
   hook path → breadcrumb-only capture).

> **Confidentiality of going global (state it plainly).** User-level wiring means this brain activates
> on **all** the user's work, including other clients' repos. **That is not a leak — it is the user's own
> memory, and a multi-client global brain is fine.** The one control: **never commit or sync this brain
> into a repo** — that IS the confidentiality control. Per-client separate brains are a future
> convenience (coexistence, deferred), not a requirement.

**Round 1 — Coverage + Owner role:**
> "What should this brain cover? What is your role here — developer, lead, analyst?"

These answers become the **Context Capsule** in `BRAIN.md` (2–4 lines: what it covers + owner's role in this project). This is *retrieval framing*, not persona. If the user describes tone, language preferences, or agent behavior: "Those belong in your own `AGENTS.md` (outside the SYNAPTIC block) or your user-level instructions, not in the brain. Here is the exact text: shall I add it to your own `AGENTS.md`, to your user-level instructions, or nowhere?"

**Round 1b — Capture policy:**
> "How selective should this brain be — crown-jewels only (`selective`), balanced (default), or capture almost everything (`capture-all`, good when you have no other memory layer)?"

Write the answer to `capture_policy:` in `BRAIN.md` frontmatter (default `balanced` if unsure).
`capture_policy` is the **PROMOTION axis** — how aggressively the capture contract promotes work
*into the wiki*. It does **not** change the six-step formula, and it does **not** govern the
always-on journal breadcrumbs (those are a fixed-cost, best-effort instruction — see
`references/capture-hooks.md`). Reassurance if they hesitate: "You can change this one word later;
`/synaptic-maintain weave` can also prune a `capture-all` brain back toward `selective`."

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

**Day-1 first-value offer (fresh brain only — OPTIONAL follow-through).** Once the brain is generated
and wired, and it is still **empty** (a true first run, no existing nodes), **OFFER** the guided
first-value walkthrough — do not force it: *"Your brain is set up and empty. Want a 10-minute guided
first capture? I'll walk you through capturing one thing you own, retrieving it back, and turning it
into a starter handover brief. Or skip it and just start working — the brain captures as you go either
way."* On **yes**, load `references/day-one.md` and run it (first capture → first retrieval → the
vacation-handover "aha"). On **no**, say the brain is ready and stop. Skip this offer entirely on a
migration/upgrade or when the brain already has nodes. This is an *offered* path, never a gate
(Simplicity Guardrail, `docs/concepts/simplicity-guardrail.md`).

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
│   └── guardrails.md           ← from Round 3
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
Commands (synaptic skill): /synaptic-init /synaptic-consolidate /synaptic-ingest /synaptic-audit /synaptic-maintain /synaptic-handover · routine: /synaptic-upgrade
Boot check: asked "synaptic status" before reading any file, reply "SYNAPTIC-BOOT-OK <nonce>".
<!-- END:SYNAPTIC -->
```

**Brain pointer (global / seat brains).** The block above hardcodes `.synaptic/` for a brain nested at
the workspace root. For a **global / seat** brain (one `.synaptic/` serving a workspace that holds many
repos, from a higher root or pointed to from elsewhere), replace `.synaptic/` in BOTH pointer lines with
the brain's actual path — relative to the workspace root, or **absolute** for a fixed local per-user
brain. For a **user-global** brain (reach = user-level placement), the pointer MUST be the brain's
**absolute** path, and the bridge block MUST also carry the **skill's absolute path** on its own line
(e.g. `Skill: <abs-path>/.claude/skills/synaptic/`) so an agent on a host that does **not** discover
user-level skill dirs can still locate + load the skill by **reading the bridge** (grep-recoverable —
this is the safety net when user-level skill discovery is absent). For a **private** brain over committed
work repos, place the bridge AND the deployed rules at **user level** (the host's user-level instructions)
— **never** write either into a foreign committed **or synced** repo (the leak rule; "synced" = under
`%OneDrive%`/`%OneDriveCommercial%` or any DFS/sync-share root, even if never committed). A grep of the
wired file for a bare CWD-relative `.synaptic/BRAIN.md` MUST be ZERO for a global brain.

> **Command listing in the bridge (Layer-1 discoverability floor).** The `Commands (synaptic skill): …`
> line above is the universal floor: any agent that reads the bridge knows the commands and can invoke
> them by name even on a chat-only host. Enrich it with a **one-line description per command DERIVED from
> the SOT** (each command's `references/<cmd>.md` `summary:` line), regenerated on every deploy — see
> `references/command-discovery.md`. There is no hand-authored command description anywhere but the SOT.

> **Boot check (the canary line).** "Wired" must mean *observed loaded*, not *files present*. Init
> replaces `<nonce>` in the `Boot check:` line with a fresh 6-character token (letters and digits; any
> value that appears nowhere else in the project) and writes the same token into
> `harness/setup/<host>.md`. The proof: in a **new** session, before any file is read, the user asks
> `synaptic status` (or runs `claude -p "synaptic status"` on Claude Code). The reply carries the token
> only if the bridge is in the loaded instructions. `/synaptic-audit` Step 10b compares the reply
> with the record.

### a2. Claude Code boot adapter (the `SYNAPTIC-BOOT` block — v1.6, decision X1a)

Per the Claude Code memory docs (read 2026-11-01): Claude Code loads a project `AGENTS.md` only when
the project has no `CLAUDE.md`; otherwise an `@AGENTS.md` import in `CLAUDE.md` is the route. Without
it the bridge is not loaded and the brain freezes silently (this workspace's own brain had no writes for
weeks). Treat this as a claim the boot check verifies on each install, not as settled.

1. **Reach gate.** Only for a **project-reach** brain in a repo the user owns. Skip for a global, seat
   or private brain whose bridge lives at user level, and never write into a foreign committed or synced
   repo (the leak rule above). Those cases are specified separately; record `boot: skipped (reach)`.
2. **Detect** Claude Code (`.claude/` present, or the user says so) and its project memory files:
   `CLAUDE.md`, `.claude/CLAUDE.md`, `CLAUDE.local.md`.
   - **Already wired by the user:** any of them carries an `@AGENTS.md` line outside a code fence →
     write nothing; record `boot: user-import` (never removed by Synaptic).
   - **None exists** → write nothing (native `AGENTS.md` loading should apply); record `boot: native`,
     `wired: expected`, and rely on the boot check.
   - **Otherwise** the target is the committed `CLAUDE.md` (else `.claude/CLAUDE.md`). If only
     `CLAUDE.local.md` exists it may be used, recorded as `personal` (it wires this user only).
3. **Ask first.** Show the exact block, the target file, and the cost: it makes the whole `AGENTS.md`
   (bridge + deployed rules, typically 3–8 KB, about 1–2k tokens) resident in every Claude Code session.
   Write only on a yes; on a no, record `boot: declined` and do not ask again on later boots.
4. **Write or replace, idempotent:** if a `BEGIN:SYNAPTIC-BOOT` … `END:SYNAPTIC-BOOT` block exists,
   replace it whole; otherwise append it after making sure the file ends with a newline and adding one
   blank line. Keep the file's line endings (CRLF stays CRLF). Change nothing else.

   ```
   <!-- BEGIN:SYNAPTIC-BOOT -->
   <!-- Synaptic boot: Claude Code skips AGENTS.md when a CLAUDE.md exists, so import it. Remove this block to unwire. -->
   @AGENTS.md
   <!-- END:SYNAPTIC-BOOT -->
   ```
5. **Record** in `harness/setup/claude-code.md`: `boot: claude-md-import`, the file written, the boot
   nonce, and `wired: unproven` until the boot check passes (then `proven` and the date).
6. **Removable:** delete the four lines. Uninstall, downgrade and convert-to-global remove it from the
   record (`references/command-discovery.md` "Cleanup"). If a future Claude Code also reads `AGENTS.md`
   natively next to a `CLAUDE.md`, the import loads the bridge twice (identical text, double cost):
   remove the block then.

The guarantee is therefore **"at most one marker-wrapped block (one `@AGENTS.md` import line) in a
project `CLAUDE.md`, only with approval"** (ADR-002, amended in v1.6). User-level `~/.claude/CLAUDE.md`
for a global brain, and every other host's adapter, are specified separately and not done here.

### b. Skill install

Copy this skill package directory (where `SKILL.md` lives, with its `references/` and `templates/`) into:

- `.claude/skills/synaptic/` — discovered by Claude Code, VS Code Copilot, OpenCode
- `.agents/skills/synaptic/` — discovered by VS Code Copilot, Gemini CLI, OpenCode, Codex

Create directories if absent. If a target already contains a `SKILL.md` with the same `version:`, skip and report "already present". Otherwise overwrite.

**Command discoverability (layered floor + per-host stubs).** Full procedure:
`references/command-discovery.md`. Two layers:
- **Layer 1 (universal floor):** the `Commands …` line in the bridge (§a) lists every `/synaptic-*`
  command with a one-line description **derived from each `references/<cmd>.md` `summary:`** — works on
  any host with no menu mechanism; the agent can invoke by name.
- **Layer 2 (per-host `/`-menu stubs):** for hosts with a slash/prompt menu, generate thin **pointer
  files** from the ONE SOT (Claude Code `.claude/commands/synaptic-*.md` with `description:`, at the same
  scope as the skill install — project skill → project stubs, user-level skill → `~/.claude/commands/`; VS Code
  Copilot `*.prompt.md`; Cursor's prompt-file mechanism). **NOT symlinks** (fragile on Windows/OneDrive —
  they break on sync/copy). Each stub carries a provenance line
  `generated-from: synaptic-skill@<engine-version> <sot-hash>`. Body: load the skill's `SKILL.md` first, then
  follow `references/<cmd>.md` (by content). Regenerate from the SOT on every deploy; the user
  maintains only one source.
- **Drift + prune (on `/synaptic-upgrade`):** compare recorded stubs/version vs the current SOT command
  list; report added/removed/renamed; **regenerate** changed and **PRUNE** stubs for commands no longer
  in the SOT; clean OneDrive KFM `*-DESKTOP-*` conflict copies. **Cleanup:** on uninstall remove every
  recorded stub then clear the record; on convert-to-global remove the project-level stubs.

**Record the wiring.** After wiring + deploy, write/update `harness/setup/<host>.md` in the brain (e.g.
`harness/setup/vscode.md`) capturing what was deployed where for this host: the bridge location + brain
pointer (+ **absolute skill path** for a global brain), the rules target, the hook config, and — because
stubs live **OUTSIDE** the brain and this record is the **only** map to them — the **command-stub set,
the exact placement dir(s), and the generating engine-version** (matching the stub provenance line); on
Claude Code also the boot lines (`boot: claude-md-import | user-import | native | declined | skipped
(reach)`, the file written, the boot nonce, `wired: expected | unproven | proven <date>`), which audit
Step 10b reads and updates. This
documents the setup, is the **re-deploy recipe when you move machines**, and travels in the backup.

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
6. **Install nothing executable from the brain.** A brain is content, never a code-delivery channel:
   deploy never copies scripts or skills out of `.synaptic/` into host skill folders (the skill
   bundle and the hook commands come from the release, never from the brain). If a legacy
   brain carries `harness/skills/`, leave it in place and tell the user it is inert. (The old
   project-skills feature is parked: `docs/parked/harness-skills.md` in the repo.)

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

### d. Capture mechanism — deploy host hooks (CORE)

The full procedure (layers a0–c, the pinned activity-marker one-liners, per-host support, honesty
rules) is `references/capture-hooks.md`. Run it here.

### e. Cursor shim (optional)

If `.cursor/` exists in the project root, write `.cursor/rules/synaptic.mdc`:

```
This project has a Synaptic brain. See AGENTS.md (BEGIN:SYNAPTIC block) for instructions.
Read `.synaptic/BRAIN.md` at session start. Commands: /synaptic-init /synaptic-consolidate /synaptic-ingest /synaptic-audit /synaptic-maintain /synaptic-handover (routine: /synaptic-upgrade)
```

### f. Cross-agent sync

Cross-agent rule-sync tools (gentle-ai, ai-rules-sync, block/ai-rules, rulesync) pick up the skill directories automatically — nothing else to configure.

