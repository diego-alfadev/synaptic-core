<!-- summary: Make /synaptic-* commands discoverable — universal AGENTS.md floor listing + per-host generated /-menu stubs (pointer files, no symlinks), with drift-check, prune, and cleanup. -->

# Command discoverability — bridge floor + per-host `/`-menu stubs

A user in an agent box does not read the skill — they type `/` and expect the `/synaptic-*` commands
to appear with a one-line description each. Hosts have **not** converged on a slash-command standard.
This procedure closes the discoverability gap **without duplicating the single source of truth (the
skill) and without symlinks**, in **two layers**.

> **Single source of truth (SOT) = the skill.** The one authoritative description of each command is
> the **`summary:` line (or first line) of that command's `references/<cmd>.md`**. Both layers below
> **DERIVE** from it. There is **no hand-authored** command description anywhere but the SOT.

## Layer 1 — Universal FLOOR (any agent/host, zero host-specific mechanism)

List the `/synaptic-*` commands **plus a one-line description of each** directly in the bridge /
`AGENTS.md` the agent already reads. Any agent that loads the bridge therefore knows the commands
exist and can **invoke them by name** — even a chat-only host with no slash-menu.

- **Descriptions are DERIVED from the SOT**, regenerated on every harness deploy (exactly like the
  Layer-2 stubs). Each command's one-liner = the `summary:` / first line of its `references/<cmd>.md`.
  This preserves single-source (hub-and-spoke): the description lives in **one** place; the floor and
  the stubs both derive from it.
- **How to generate:** for each row of the Operations table (`SKILL.md`), then the routine row of
  its "Routine and aliases" table (never the alias rows), read the `summary:` line of the **first** file in the
  row's Reference column and emit `  /synaptic-<cmd> — <summary>` into the bridge block.
  **Deterministic fallback:** when a `references/<cmd>.md` has **no** `<!-- summary: … -->` line, use
  the **H1 title tail** — the text after the `# /synaptic-<cmd> — ` prefix on the file's first heading
  — as the description. Never hand-author or invent a description; the `summary:` line is preferred and
  the H1 tail is the deterministic fill so generation always resolves from the file itself.
- **Grep-checkable invariant:** each bridge description must match its `references/<cmd>.md` summary —
  no hand-authored divergence.

## Layer 2 — Per-host ENHANCEMENT (the nice `/`-menu-with-description UX)

For hosts that support a slash/prompt menu, generate thin **discovery stubs** from the ONE SOT —
**hub-and-spoke: 1 source → N native targets**. Each stub is a **few-line pointer file** whose content
points (by content, not by symlink) back to the SOT command definition and carries just enough native
metadata for the host to show the command + its description in the `/` menu.

**Do NOT use symlinks.** On Windows + OneDrive, symlinks are fragile and break on sync/copy. Stubs are
**generated thin pointer files** (a few lines that point *by content* to the SOT), never symlinks.
Regenerate them from the SOT when it changes; the user still maintains only **one** source.

**Every generated stub carries a provenance line** so drift and version are legible on inspection:

```
generated-from: synaptic-skill@<engine-version> <sot-hash>
```

`<engine-version>` = the skill/engine `version:` that generated it; `<sot-hash>` = the whole-file
fingerprint of that command's `references/<cmd>.md` (`references/fingerprint.md`; no shell → omit it
and rely on the version). This is the anchor the drift check and the
uninstall cleanup key off — a stub whose provenance version/hash no longer matches the current SOT is
stale and gets regenerated or pruned.

**Native targets (generate for the hosts the deploy detects):**

- **Claude Code** → `<scope>/.claude/commands/synaptic-*.md`, where `<scope>` matches **where the
  skill is installed**: a project-level skill (`<project>/.claude/skills/synaptic/`, the default) gets
  project-level stubs in `<project>/.claude/commands/`; only a user-level skill (global or seat brain,
  `~/.claude/skills/synaptic/`) gets user-level stubs in `~/.claude/commands/`. A user-level stub
  loads in every workspace on the machine, so it must never point at a project-only skill. Project
  stubs live in the repo next to the project skill and are committed with it, like the skill; a
  user who does not want them shared gitignores both. One stub per command, with frontmatter
  `description:` so the command surfaces in the `/` menu with its one-liner. Body (every host's stub):
  *"Run the synaptic skill's `<cmd>`: load the skill's `SKILL.md` first (its Operations preamble
  applies to every command), then follow `references/<cmd>.md`."* A command that takes an argument
  (`maintain [weave|synthesize]`, `ingest [file]`) ends its body with *"Argument: `<host token>`
  (empty → the default)"*, using the host's own token (`$ARGUMENTS` in Claude Code; the
  host's equivalent elsewhere, UNVERIFIED per host). Where the host substitutes nothing, the text typed
  after the command name is the argument.
- **Which commands get a stub (v1.6).** Every row of `SKILL.md`'s Operations table (the six public
  verbs) **and** of its "Routine and aliases" table (`/synaptic-upgrade`, plus the deprecated 1.6
  aliases `/synaptic-weave` and `/synaptic-synthesize`). An **alias stub** says what it maps to:
  *"Deprecated alias (1.6, removed in the next minor): run `/synaptic-maintain weave` — load the
  skill's `SKILL.md`, then follow `references/weave.md` under the `references/maintain.md` CORE-safety
  contract."* When the alias rows leave the table, the drift check below prunes their stubs. The
  Layer-1 bridge line lists the six verbs plus the routine, never the aliases.
- **VS Code Copilot** → `*.prompt.md` files (the Copilot prompt-file mechanism), one per command.
- **Cursor** → its prompt-file mechanism (native equivalent).
- **MCP-capable hosts** → MCP "prompts" can **also** surface the commands (complementary, not
  required) — a host exposing Cortex over MCP may list the commands as MCP prompts.

**Justification-by-necessity:** *why* a prompt in VS Code, a command in Claude Code? Host limitation,
not our choice — hosts have not converged, so per-host stubs are forced by the hosts. We minimize the
cost the only way available: one SOT, N generated stubs (hub-and-spoke), never hand-kept.

## Recorded per host — `harness/setup/<host>.md` is the ONLY inventory

Generating and placing stubs is part of **deploying the harness** (not a brain-content concern). Host
command dirs (`<project>/.claude/commands/` or `~/.claude/commands/`, the Copilot/Cursor prompt-file locations) sit **OUTSIDE
`.synaptic/`** — nothing inside the brain can see or clean them. So `harness/setup/<host>.md` is the
**authoritative inventory** and MUST record:

- the **stub set** (which commands),
- the **exact placement dir(s)** for that host,
- the **generating engine-version** (matching the stub provenance line).

## Drift check on `/synaptic-upgrade` (part of host-setup detection)

When `/synaptic-upgrade` runs host-setup detection, it MUST perform a **stub-drift check**:

1. Compare the **recorded stub set + generating version** (from `harness/setup/<host>.md` / the stub
   provenance lines) against the **current SOT command list**: the rows of `SKILL.md`'s Operations
   and "Routine and aliases" tables (not every `references/*.md` file is a command).
2. **Report** added / removed / renamed commands (SOT gained a command → stub missing; SOT dropped or
   renamed one → stub stale).
3. **REGENERATE** stubs for added/changed commands and **PRUNE** stale stubs — stubs for commands **no
   longer in the SOT** are deleted (not left orphaned in the `/` menu pointing at a gone command).
4. **Regenerate the Layer-1 bridge descriptions** from the current SOT summaries in the same pass.
4b. **Check placement, not only set and version.** If the recorded Claude Code stubs sit in
   `~/.claude/commands/` but the skill is installed at project level (stubs placed before v1.6), show
   the move and, with the user's OK, regenerate them in `<project>/.claude/commands/` and remove the
   user-level copies listed in the host record. Remove only stubs the record lists; never guess.
5. Update `harness/setup/<host>.md` to the new stub set + version + placement dir.

**OneDrive KFM conflict-copy cleanup.** Host command dirs under OneDrive Known-Folder-Move can
accumulate **`*-DESKTOP-XXX` conflict copies** (e.g. `synaptic-audit-DESKTOP-AB12CD.md`) when sync
collides across machines. They are not real stubs — they shadow the canonical one and can surface a
stale duplicate in the `/` menu. The drift sweep MUST **detect and clean these `*-DESKTOP-*` variants**.
*(Author-complete; verify on a real run — actual filesystem/sync behavior needs a real host.)*

## Cleanup — uninstall / downgrade / convert-to-global

Because stubs live outside the brain, removing the brain does NOT remove them. Clean them explicitly
using the `harness/setup/<host>.md` inventory (never guess):

- **On uninstall** — remove every stub listed in the host record (the record is the only map to their
  out-of-brain locations), then clear the stub section from the record.
- **On convert-to-global** — remove the **project-level** stubs (scoped to the old project location)
  so they don't linger after reach moves to the user level; the user-level stubs replace them (see
  `references/convert-to-global.md` step 6).
- **The Claude Code boot block** (`references/init.md` §a2) — on uninstall, on a downgrade below 1.6,
  and on convert-to-global, delete the `BEGIN:SYNAPTIC-BOOT` … `END:SYNAPTIC-BOOT` lines from the file
  the record names (`boot: claude-md-import`) and clear the `boot:` lines. Never remove a `boot:
  user-import` line: the user wrote it.

## CORE-safety (Simplicity Guardrail — passes)

- **Optional** — a host with no stubs still has the Layer-1 bridge floor (the commands are listed +
  invokable by name); the brain works fully.
- **Files-only path intact** — the floor is text in files the agent already reads; no runtime, no host
  menu required.
- **No schema bump** — stubs are generated pointer files outside the brain; no symlink dependency.

Runtime confirmation that a given host actually renders the `/` menu from the stubs — and the
drift/cleanup filesystem behavior — is author-complete; verify on a real / Node host.
