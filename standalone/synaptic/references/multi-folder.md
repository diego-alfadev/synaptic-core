<!-- summary: Multi-folder sessions — which brain serves which folder's work when a session has several folders, what hosts load from an added folder, and what capture falls back to there. -->

# Multi-folder sessions

Read this when another folder of the session holds `.synaptic/`, or when the work touches such a folder.
Evidence and host sources are in the repo: `research/multi-folder-workspaces.md`.

## What hosts load from an added folder

The working directory (CWD) is the session's primary folder. Added folders are file access, not
configuration roots:

- **Claude Code** (`--add-dir`, desktop "add folders"): the folder's skills are discovered; its
  `CLAUDE.md` loads only with `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1`. Its `AGENTS.md`, and so
  its `BEGIN:SYNAPTIC` bridge, never loads. Its project hooks never run.
- **Codex** (`--add-dir`, app secondary folders) and **OpenCode** (no added-folder concept): none of
  the folder's instructions, skills or hooks load.
- **Cursor** multi-root: every root's `AGENTS.md` loads for the whole workspace, so a relative bridge
  pointer is ambiguous there.

A brain in an added folder is therefore not booted by the host. This procedure is what keeps it from
looking active when it is not, or from being confused with another brain.

## Which brain serves which work

1. **The CWD brain resolves at load, unchanged:** CWD `.synaptic/BRAIN.md`, else the brain at the
   `BEGIN:SYNAPTIC` bridge's pointer. That includes a user-global brain.
2. **A folder that holds its own `.synaptic/BRAIN.md` is served only by that brain.** The first time
   the work touches files there, read that `BRAIN.md` and run COMPAT-CHECK on it (`SKILL.md`,
   warn-not-gate). Then follow its capture contract for that folder's work only.
3. **A folder without its own brain is served as before.** A brain resolved through the bridge, such
   as a user-global one, keeps capturing that folder's work. With no bridge, nothing captures it.
4. **Never cross the boundary of a folder brain.** Work in a folder with its own brain never goes into
   another brain, and that brain never receives work from outside its folder.
5. **Relevance.** If the task touches such a folder without concerning its brain (a dependency read,
   a README fix), mention the brain once and continue. Ask only when relevance is genuinely ambiguous.

## Onboarding

Offer onboarding only for the CWD (`SKILL.md`, Detect-on-Load tree), and only when no brain resolves
there. If another session folder holds a brain, say once that it exists and that it serves only its
own folder's work. A session folder without a brain gets no offer merely because the work touched it.
Onboarding there needs an explicit request.

## Capture: state the limit once

That brain's capture hooks run only in sessions where its folder is the primary folder. Here,
capture is manual:

- journal breadcrumbs;
- playgrounds;
- `/synaptic-consolidate` before the session ends or compacts.

What is written waits for the next session that opens the folder as primary; its SessionStart rescue
offers to consolidate. Audit sees no boots from this session, so the yield is unknown, not zero
(`references/capture-hooks.md`).

## Optional discovery rule

A user who asks for it can have a path-free user-level rule that carries steps 2–5 into sessions
where this skill is not loaded (`references/init.md` §a5). It is never offered unprompted.
