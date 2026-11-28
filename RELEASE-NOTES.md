# v1.8.1 — Multi-folder workspaces

Engine version 1.8.1; brain schema stays 1.0, so no knowledge-format migration. Only the skill text
changed: no tool or runtime change, and no change to generated bridge wording.

**New in 1.8.1:** a brain whose folder is only an additional folder of a session is no longer
mistaken for an active one, nor confused with another folder's brain. No host checked boots an added
folder's bridge or runs its project hooks (Claude Code `--add-dir` and desktop "add folders", Codex
secondary folders; OpenCode has no added-folder concept). The skill now says which brain serves a
touched path, and states the manual-capture limit once.

## What changes for you

- **Each brain serves only its own tree.** A path's brain is its nearest enclosing valid
  `.synaptic/BRAIN.md`, found by the path. A project brain never captures work outside its tree. A
  user-global brain serves only paths with no brain of their own, and never takes work inside a
  project brain's tree.
- **No cross-brain leaks.** A session summary or consolidation carries only the work of the brain it
  is written into.
- **Safe edges.** The walk uses symlink-resolved paths, stops at a linked worktree or submodule, and
  captures nothing when a candidate brain cannot be read.
- **`fixture: true`** in `BRAIN.md` marks a test or benchmark brain. It still boots as the primary
  folder's brain, but is never resolved or announced from another folder.
- **Node stores are not brains.** An `INDEX.md` with `synaptic: store` never boots and never receives
  capture.
- **Optional discovery rule.** A path-free `BEGIN:SYNAPTIC-DISCOVERY` block for the user-level
  carrier carries these rules into sessions where the skill is not loaded. It is installed only on
  explicit request (`references/init.md` §a5), never offered unprompted.

The guard lives in an on-demand reference, `references/multi-folder.md`. `SKILL.md` grows by about
138 tokens per load.

## Upgrade

Keep your existing brain and update the full skill bundle from the selected verified package
([Upgrade guide](UPGRADING.md)). From 1.7.2, the installed `/synaptic-upgrade` already installs the
package and reloads it before host detection. An engine older than 1.7.2 starts from the package's
[entry instruction](docs/UPGRADE-TO-1.7.2.AGENT.md) instead. A single-folder session behaves as in
1.8.0.

## Evidence and limits

Claude Code 2.1.327 was probed headless in a scratch directory, including end-to-end runs with and
without this change ([spike](research/multi-folder-workspaces.md)). Codex and OpenCode rest on their
official documentation, and Cursor on forum posts; none of them was probed live. Full automatic
capture needs the brain's folder as the session's primary folder; elsewhere capture is manual
(journal breadcrumbs, `/synaptic-consolidate`). A global brain and a folder brain on the same path
stays the nesting case: init warns, and full arbitration is 2.0. Real host acceptance for the
optional previews (VS Code, automatic curation) remains pending, as in 1.7.2.

Detailed changes belong in the [changelog](CHANGELOG.md).
