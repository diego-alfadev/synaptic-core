# v1.7.0 — Better organised work

Engine version 1.7.0; brain schema stays 1.0, so no knowledge-format migration. This line was tested
as 2.0.0-rc.1 and 2.0.0-rc.2 drafts; nothing in it breaks an existing brain, so it ships as a minor
release. 2.0 stays reserved for Cortex as the core.

Synaptic adds clearer work-item routing and optional local tools for reading and finding knowledge.
Your Markdown brain remains the record.

## What changes for you

- Tasks and proposals retain their context and completion evidence; exports preserve those records.
  Closing a playground now archives it instead of deleting it, and `check.js` flags broken work items.
- Setup distinguishes host wiring from actual loading and capture, with clearer recovery steps.
- Upgrades come as a source-pinned package with a trusted digest (`manifestSha256`) and
  completeness/content checks. Applying it remains an agent-led, recoverable operation.
- Optional previews:
  - VS Code project setup stages a reviewable change and, with Node, supports explicit
    apply/status/rollback. Restricted environments keep an assisted file-based route without MCP or Node.
  - Cortex tools provide current-file reads, lexical search and a read-only MCP interface.
  - A Codex event adapter drafts bounded, source-linked curation of selected saved sources. It is not
    automatic wiki promotion or complete conversation retention.

## Upgrade

Keep your existing brain, update the full skill bundle from the attached package, and verify a
fresh-session resume and capture. Hooks and MCP need their own supported setup; updating files alone
does not activate them. [Upgrade guide](UPGRADING.md).

- **Git brains: add one ignore line before you close a playground.** `playgrounds/.gitignore` needs
  `archive/*/*/scratch/` next to `*/scratch/`. Without it, the next commit records every archived
  scratch asset, which cannot be undone without rewriting history.
- **If you tested the 2.0.0-rc.1 draft with the Codex curation adapter:** requests still pending from
  it read `PROTECTED_SCOPE_CHANGED` after the update, because the protected snapshot changed shape.
  Their artifacts are kept; archive them explicitly (`codex-curation.js archive`) and let a later turn
  create a fresh request.
- `playgrounds/archive/` is protected as one listing of paths and sizes: adding, removing, renaming or
  resizing a file there invalidates a pending curation request; an edit that keeps the same size does not.

## Fixes from the release-candidate round

- New: `prepare-release.js --verify-assets <dir>` checks the four downloaded release files, including
  the archive's manifest digest; `shasum -c SHA256SUMS` passes on them. Stable tags are now prepared too.
- VS Code helper: verification errors name the differing package file; status and rollback survive an
  extra bridge or a killed apply; `recover-lock` clears a stale lock; a recorded setup counts as wired on boot.
- Cortex search and status skip and list unreadable or duplicate notes instead of failing the brain;
  `knowledge/SCRATCH/` is excluded regardless of case; errors no longer echo rejected refs.
- Native curation tolerates the capture floor's own activity files and append-only source growth;
  curation status labels its inventory as recorded at the last check.
- Package verification compares Unicode-normalised names, so packages extracted on macOS verify.

## Evidence and limits

CI passes for the exact release commit on Linux, macOS and Windows with Node 18, 22 and 24.
Filesystem/protocol tests are distinct from host loading, native firing and semantic quality. The
owner-run VS Code journey and a demonstrated automatic-curation profile are still pending, which is
why those features are previews. Automatic capture is claimed only for verified host configurations.
Live benchmark outcomes are not measured. The work-record procedures (archive on close, external task
owners, the status rule) are prose; whether agents follow them has not been piloted on a real host.

Detailed changes belong in the [changelog](CHANGELOG.md).
