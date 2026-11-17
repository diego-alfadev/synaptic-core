# v1.8.0-rc.1 — Scoped setup

Local candidate, not published or live-installed. Brain schema remains 1.0. The published
baseline is v1.7.2; its notes follow below as historical upgrade context.

This candidate adds explicit project diagnostics, independent capability targets and bounded
setup completion for the existing VS Code project adapter. It distinguishes installed content,
known configuration, selected goals and actual execution evidence. It reports unknown where
user/policy/profile information or a reliable host observation is unavailable.

Deferred targets remain visible through a passive notice after each consolidation. No ordinary
boot discovery, interactive reminder, automatic repair or retry is added. Custom structured
adapters are reviewable under a shared contract; owner acceptance and approval of an exact write
plan remain separate. Descriptor validation never executes custom code or approves writes.

Use the [diagnostic guide](docs/integrations/setup-diagnostics.md) and
[implementation specification](docs/specs/setup-1.8.md). CORE retains the file procedure with
no added runtime or MCP. The optional Node CLI stages plans through existing preimage/rollback
checks. It does not configure host MCP/command menus or refresh an existing native adapter
without a separately reviewed migration. Multi-profile discovery and concurrent session
storage are deferred. Synthetic checks do not establish real host loading or native events.

## Published v1.7.2 baseline context

Engine version 1.7.2; brain schema stays 1.0, so no knowledge-format migration.

**New in 1.7.2:** an effective, scope-safe bridge completes baseline setup. Missing loading proof
does not trigger repair; unknown adapters stay limited with user-paste guidance. Optional commands,
hooks and MCP never block the baseline. Outside-brain writes require a supported adapter, an exact
approved plan, fresh byte-preserving preimages and rollback. An upgrade reloads the newly installed
engine before host detection. Existing VS Code selections and declined optional levels are preserved.
Use the selected package's [entry instruction](docs/UPGRADE-TO-1.7.2.AGENT.md) before invoking an
older installed upgrade command. An incomplete optional skill does not initiate repair during
ordinary boot. Loading observations survive an unchanged refresh and are retained as history
when the source, profile or effective carrier changes.

`synaptic ping` is the optional token-only, zero-tool debug check; `synaptic status` is its alias
for 1.7.x. Init/upgrade never request either. Ask explicitly for a situation report to inspect work.
Automatic discovery, profile bindings and wire-to-max remain outside this patch.

The 1.7 line was tested
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

Keep your existing brain and update the full skill bundle from the selected verified package.
Report baseline installation separately from loading and capture. Hooks and MCP need their own supported setup; updating files alone
does not activate them. [Upgrade guide](UPGRADING.md).

- **Git brains: check the ignore rule before you close a playground.** `playgrounds/.gitignore` must
  contain both `*/scratch/` and `archive/*/*/scratch/` (the upgrade creates or completes it; check before
  your first close). Without the second line, the next commit records every archived scratch asset, which cannot be
  undone without rewriting history.
- The work-item model is adopted gradually, per brain; old playgrounds keep working untouched
  ([Work items](docs/concepts/work-items.md)).
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

Local source, package and synthetic transaction checks cover this patch. Publication requires
successful CI for the exact source commit and verification of the prepared release assets.
Filesystem/protocol tests are distinct from host loading, native firing and semantic quality. The
owner-run VS Code journey and a demonstrated automatic-curation profile are still pending, which is
why those features are previews. Automatic capture is claimed only for verified host configurations.
Live benchmark outcomes are not measured. The work-record procedures (archive on close, external task
owners, the status rule) are prose; whether agents follow them has not been piloted on a real host.

Detailed changes belong in the [changelog](CHANGELOG.md).
