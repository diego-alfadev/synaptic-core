<!-- summary: Work outside the CWD — which brain serves a touched path (nearest valid enclosing brain), what a project or user-global brain may capture, what hosts load from added folders, and what capture falls back to there. -->

# Work outside the CWD (multi-folder sessions)

Read this when the work touches files outside the CWD's folder tree: an added session folder, or
any path reached directly. Also read it when another session folder holds `.synaptic/`. Evidence and
host sources are in the repo: `research/multi-folder-workspaces.md`.

## What hosts load from an added folder

The working directory (CWD) is the session's primary folder. Added folders give file access; they
are not configuration roots:

- **Claude Code** (`--add-dir`, desktop "add folders"):
  - the folder's skills are discovered;
  - its `CLAUDE.md` loads only with `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1`;
  - its `AGENTS.md`, and so its `BEGIN:SYNAPTIC` bridge, never loads;
  - its project hooks never run.
- **Codex** (`--add-dir`, app secondary folders): none of the folder's instructions, skills or hooks
  load.
- **OpenCode** has no added-folder concept. Nothing from the folder loads unless it is listed in the
  `instructions`, `skills` or `plugins` config.
- **Cursor** multi-root: every root's `AGENTS.md` loads for the whole workspace, so a relative bridge
  pointer is ambiguous there.

The host does not boot a brain outside the CWD. This procedure is what keeps it from looking active
when it is not, and from being confused with another brain.

## Which brain serves a touched path

1. **The CWD brain resolves at load, unchanged:** CWD `.synaptic/BRAIN.md`, else the brain at the
   `BEGIN:SYNAPTIC` bridge's pointer.
2. **For a path outside the CWD tree, find its brain by the path, not by the session's folder list.**
   Walk up from the touched path to the nearest enclosing `.synaptic/BRAIN.md`. Skip it silently, and
   keep walking, when:
   - its frontmatter has no `schema_version`;
   - its frontmatter declares `fixture: true` (a test or benchmark brain);
   - the `.synaptic/` folder has no `BRAIN.md` at all.
3. **A valid enclosing brain serves that path.** The first time the work touches its tree, read its
   `BRAIN.md` and run COMPAT-CHECK on it (`SKILL.md`, warn-not-gate). Then follow its capture
   contract for that tree's work only.
4. **A path with no enclosing brain:**
   - a **user-global** brain (resolved through a user-level bridge) serves it;
   - a **project** brain (CWD `.synaptic/`, or a bridge in a project carrier) never does, because it
     serves only its own folder tree;
   - with no user-global brain, nothing captures that work. Say so once.
5. **Never cross a brain's boundary.** Work in one brain's tree never goes into another brain. A
   user-global brain never takes work inside a project brain's tree. Global and folder brain on the
   same path is the nesting case: init warns, and full arbitration is 2.0.
6. **Relevance.** If the task touches a brain's tree without concerning that brain (a dependency
   read, a README fix), mention the brain once and continue. Ask only when relevance is genuinely
   ambiguous.

**A node store is not a brain.** An `INDEX.md` with `synaptic: store` never boots and never receives
capture. Changes to it belong to its owner (`references/promote.md`).

## Onboarding

Offer onboarding only for the CWD (`SKILL.md`, Detect-on-Load tree), and only when no brain resolves
there. If a valid brain exists elsewhere in the session, say once that it serves only its own tree.
A folder without a brain gets no offer merely because the work touched it; onboarding there needs
an explicit request.

## Capture: state the limit once

A brain's capture hooks run only in sessions where its folder is the primary folder. For any other
brain, capture is manual:

- journal breadcrumbs;
- playgrounds;
- `/synaptic-consolidate` before the session ends or compacts.

What is written waits for the next session that opens that folder as primary; its SessionStart
rescue offers to consolidate. Audit sees no boots from this session, so the yield is unknown, not
zero (`references/capture-hooks.md`).

## Optional discovery rule

On request, a path-free user-level rule (`references/init.md` §a5) carries steps 2, 3 (without
COMPAT-CHECK, which needs this skill), 5 and 6 into sessions where this skill is not loaded. It is
never offered unprompted.
