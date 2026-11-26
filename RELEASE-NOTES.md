# v1.8.0 — Node stores

Engine version 1.8.0; brain schema stays 1.0, so no knowledge-format migration.

**New in 1.8.0:** a folder of curated docs can be linted in place without becoming a brain. An
`INDEX.md` whose frontmatter declares `synaptic: store` makes its folder a node store: every `.md`
under it except MOC files is a node, and `tools/check.js <folder>` checks it. A store never boots and
must not carry `BRAIN.md`. Brains and stores may choose `links: wikilink | markdown | both`, so
relative Markdown links count as edges and hub membership. A brain without the new keys gets
byte-identical `check.js` output.

## What changes for you

- **Markdown links are checked.** In `markdown` or `both` mode a relative link or typed-edge path to
  a missing file is an error. A path whose case differs from the file on disk is an error too, on
  every filesystem: macOS and Windows open it, Linux and GitHub do not. Wikilinks are unchanged.
- **`exclude`** lists path prefixes under the node root that are payloads, not nodes.
- **`evidence`** is an optional node field, separate from `confidence`, validated (WARN) against the
  `evidence_levels` ladder the root declares. A compound claim is written as its weakest level. The
  node template lists it.
- **Promotion playbook.** `references/promote.md` moves a child brain's node into a parent's store:
  parent first, git as transport, propose-then-approve with a confidentiality gate. `/synaptic-maintain`
  points to it.
- **Pin a release from another repository.** The README shows how a consumer records a version and
  the tarball's SHA-256, then runs that release's `tools/check.js` on its brain or store.

Read-only mounts of a store from a brain are planned, not part of this release.

## Upgrade

Keep your existing brain and update the full skill bundle from the selected verified package
([Upgrade guide](UPGRADING.md)). From 1.7.2, the installed `/synaptic-upgrade` already installs the
package and reloads it before host detection. An engine older than 1.7.2 starts from the package's
[entry instruction](docs/UPGRADE-TO-1.7.2.AGENT.md) instead.

- `links`, `exclude` and `evidence_levels` in `BRAIN.md`, and `evidence` on a node, now carry
  meaning. A brain that already used one of these names for something else gets new warnings (or an
  "invalid links value" error) until the key is renamed.
- A brain that stays in the default wikilink mode sees no new findings.

## Evidence and limits

Local tool, package and synthetic checks cover this release; CI runs the tool suites on Linux, macOS
and Windows with Node 18, 22 and 24. A real brain in wikilink mode gave byte-identical `check.js` output before and
after. The Markdown parser does not read reference-style links or unencoded spaces in targets
(`references/contract.md` §8). Real host acceptance for the optional previews (VS Code, automatic
curation) remains pending, as in 1.7.2.

Detailed changes belong in the [changelog](CHANGELOG.md).
