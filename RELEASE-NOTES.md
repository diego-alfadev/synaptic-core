# v2.0.0-rc.1 — release candidate draft

Status: prepared candidate notes; no tag or publication yet. Supported host evidence remains scoped
to recorded tests and the owner-run pilot. Engine version is 2.0.0-rc.1; brain schema stays 1.0.
Stable release requires the real VS Code journey and a demonstrated bounded automatic-curation workflow in at least one supported profile.
A clearly labelled RC will let the owner test that migration from its GitHub page.

Synaptic adds clearer work-item routing and optional local tools for reading and finding knowledge.
Your Markdown brain remains the record.

## What changes for you

- Tasks and proposals retain their context and completion evidence; exports preserve those records.
  Closing a playground now archives it instead of deleting it, and `check.js` flags broken work items.
- Setup distinguishes host wiring from actual loading and capture, with clearer recovery steps.
- VS Code project setup stages a reviewable change and, with Node, supports explicit apply/status/
  rollback. Restricted environments retain an assisted file-based route without MCP or Node.
- Optional Cortex tools provide current-file reads, lexical search and a read-only MCP interface.
- Release preparation now builds a source-pinned package with completeness/content checks. Applying
  the upgrade remains an agent-led, recoverable operation; installation and integration are checked separately.
- An optional Codex event adapter is being tested for bounded curation of selected saved sources
  into source-linked drafts. Actual native-event acceptance remains required; this is not automatic
  wiki promotion or complete conversation retention.

## Upgrade

Keep your existing brain, update the full skill bundle, and verify a fresh-session resume and
capture. Schema1.0 is retained in this candidate. Hooks and MCP need their own supported setup;
updating files alone does not activate them. [Upgrade guide](UPGRADING.md).

## Evidence and limits

Use the CI result for the exact candidate commit. Filesystem/protocol tests are distinct from host
loading, native firing and semantic quality. The real owner-run VS Code journey remains pending.
Automatic capture is claimed only for verified host configurations. Live benchmark outcomes are not measured.
The work-record procedures (archive on close, external task owners, the status rule) are prose;
whether agents follow them has not been piloted on a real host.

Detailed changes belong in the changelog. Installation alternatives, protocol details and migration
history belong in linked guides rather than this release announcement.
