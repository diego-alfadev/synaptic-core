<!-- summary: Stage, verify and review one immutable release package before an agent installs or repairs its selected skill carriers. -->

# Source-pinned package installation and repair

This is the shared preparation procedure for bootstrap, init and engine upgrades. It is an
**agent-run procedure**, not an executable transaction installer. The optional package utility
builds/verifies a new staging package; it never edits a live skill, brain or host configuration.
Installation and integration have separate results. Do not call file copying proof of host loading,
hook firing, MCP discovery or semantic curation.

## 1. Resolve the existing setup and selected source before choosing a destination

Read the actual bridge, brain/schema and setup records first. An unreachable brain pointer is not
a missing brain. Identify the selected host/harness and project/user scope; preserve that scope.
Use `references/host-setup.md` and `references/init.md` host adapters. Do not create another brain,
mirror into both carriers, change global guidance or install optional runtimes to compensate for
missing evidence. Show any user-global effect and obtain approval before that change.

Choose the release/candidate the owner requested and its complete package. A package records one
full source commit; never silently substitute `main`, `latest` or a different release. If the user
explicitly chose a mutable branch, resolve it once to a commit before preparing files. If the
origin of a raw `SKILL.md` is missing, ask for the exact release/package or an authorised local
source; do not guess its version from prose or infer a commit from the engine version.

## 2. Obtain a complete package into private staging

The prepared release package has:

- `RELEASE-MANIFEST.json`: source repository/commit, engine version, and SHA-256/byte counts for
  every payload file. It excludes itself; its digest is reported separately by the builder.
- `standalone/synaptic/`: the complete skill plus its retained `MANIFEST.txt` and generated
  `SOURCE.json`. The latter records the same source commit and hashes the listed skill files and
  `MANIFEST.txt`; it excludes its own bytes. The outer release manifest covers `SOURCE.json`.
- The same commit's complete tracked source, including upgrade guides, recipes, migration helpers
  and their dependencies. Do not fetch a missing migration guide or tool from a newer branch.

Release preparation with Node and a local source checkout (not required on the receiving machine):

```sh
node tools/package-release.js --ref <tag-or-commit> --out <NEW-private-package-directory>
```

The builder reads committed Git blobs, not modified worktree files; uses a new staging directory;
verifies it; then renames it to the requested **new** output. It refuses an existing output and
does not touch any installed carrier. Its JSON result includes the resolved commit and manifest
digest. A failed build leaves staging evidence, never a partially overwritten live installation.
This command prepares a directory; it does not create a tag, archive upload or release page.

The receiving agent uses the published package or an authorised complete local copy. Require a
successful transfer response; never save an HTTP error or login page as payload. Preserve the
source metadata and original bytes. A raw tagged `SKILL.md` is an entry instruction, not a complete
release artifact or permission to fetch the rest from `main`.

## 3. Verify completeness and bytes before live writes

**Authenticate before executing received code.** Use an already trusted installed verifier, or
use the host's existing independent hashing capability to compare `RELEASE-MANIFEST.json` with
the digest published by the intended release through a trusted channel. Read that authenticated
manifest as data, then independently hash `tools/package-release.js` and compare its file entry
before executing the received verifier. It imports only Node built-ins. File presence, a self-check
performed by unverified received code, or a model's assertion is not this trust bootstrap. If no
trusted checker or independent hash capability is available, do not execute package code; retain
the assisted file-only path and state its limits, or stop if its minimum safety checks cannot run.

Once trusted, the optional Node verifier needs neither Git nor network access:

```sh
node <package>/tools/package-release.js --verify <package> --sha256 <trusted-release-manifest-digest>
node <package>/tools/package-release.js --verify-skill <selected-installed-skill-directory>
```

The digest must come from the intended release through a trusted channel; do not substitute a
digest computed from the received package and call that authenticity proof. Without `--sha256`,
verification proves internal content consistency only. The program does not prove that a commit
is published, signed, approved or compatible with the selected host.

For no-Node environments, the agent can use permitted existing file/copy/hash capabilities to
check the same inventory and SHA-256 values. No new runtime, shell, MCP or network bypass is
required by CORE. If those capabilities cannot verify bytes, state the actual manual checks and
their limits; never invent hashes or claim full content verification. If the minimum source or
safe-copy/backup capabilities are unavailable, stop before changing the working installation.

Compare all manifest entries, metadata and hashes. Preserve empty `.gitkeep` placeholders. Reject
duplicates, absolute/traversal/stream paths, links, missing files or mismatched bytes. Keep
`MANIFEST.txt` and `SOURCE.json` alongside the installed skill so a later repair can check it.
Do not skip this check because `SKILL.md` has the same `version:`: the engine version is not a
bundle-content identity. Legacy installs without a receipt have unknown source identity; archive
and show their actual diff. They may still be used as files while an upgrade remains unverified.

## 4. Review and apply only the selected carriers recoverably

1. Inventory the source package and **explicit** destination entries. Existing unrelated content or
   an unrecognised skill is a conflict to show, not permission to overwrite or prune. Old owned
   files may be retired only from a trustworthy prior inventory, after archiving and review.
2. Create a fresh private transaction record outside the live destinations: selected source,
   scope, exact plan/diff, byte-preserving preimages, and whether each destination was absent.
   Verify the backup with real tools before the first live write. Do not archive stale pilot
   contents as if they were the current live state.
3. Show the bounded change, affected settings and rollback path. Preserve newer knowledge,
   journal, registries, persona and stricter operating rules. Never copy a template brain over
   an existing one. If the schema is already 1.0, use the light engine/wiring update below.
4. Use permitted reliable file operations to apply the selected changes, recording progress.
   A prose instruction is not an atomic installer. If interrupted or a write fails, stop dependent
   work and keep the transaction pending; inspect actual bytes and either resume its exact plan
   or restore recorded preimages. Never continue with a mixed install and announce success.
5. Verify destination inventory/content against the selected package, re-check protected content,
   and record the installed source commit. `--verify-skill` proves the installed bundle matches
   its receipt; also compare that receipt with the selected verified package, not just its version.
6. Restore only touched entries if necessary. Restore recorded old bytes; remove a newly created
   owned entry only when the transaction proves it was absent. A post-install user edit requires
   review. Never restore a whole stale brain snapshot over newer work.

If the agent cannot execute a safe recoverable apply, it must leave a prepared plan/package and
report that installation is pending. This procedure supplies the safety contract; it does not
claim that merely reading it has executed or mechanically enforced the transaction.

## 5. Dispatch schema work and report the working mode

- **Existing schema 1.0:** update selected engine files and review host wiring; do not run the
  old-schema M→C→V transformation. Work-item adoption and rule changes remain explicit offers.
- **Pre-v1:** read the matching guide under the selected package's `docs/` plus
  `references/upgrade-to-v1.md`. Any older guide's “install current/latest” step is overridden by
  this selected-source rule. Tools are optional; use the guide's no-Node path when necessary.
- **Unknown source/schema:** preserve it and diagnose; do not initialise a replacement brain.

Report installation separately from integration: source/engine/schema, files changed, verification
scope and backup/restore path; then actual host mode, proof dates, off/unavailable options and
manual actions still needed. Fresh-session carrier proof, lifecycle firing, tool discovery and
model-curation output are independent observations. No executable observer means no guaranteed
automatic warning about a later disconnect. No-MCP is a valid selected profile; do not retry it.

Reading the bundle or passing its checks never establishes semantic self-maintenance. A claim of
automatic model curation requires a real permitted trigger/executor, persisted bounded output and
outcome checks in the supported profile; assisted profiles remain labelled assisted.
