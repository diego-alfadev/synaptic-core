# Upgrade an existing brain

Guide for the unreleased candidate; the final version/tag is not assigned here. The owner-run RC
pilot and real host acceptance remain pending.

## Start from one exact release

Give its GitHub page or authorised local package to your existing agent. The package records its
source commit in `RELEASE-MANIFEST.json`; the skill retains `MANIFEST.txt` and generated `SOURCE.json`.
Use the release page's manifest digest when supplied. Matching a package to its own manifest checks
consistency; a trusted release identity/digest establishes which source you intended to install.

First use trusted host hash capabilities to compare `RELEASE-MANIFEST.json` with the digest from
the selected release page. Before executing a downloaded verifier, independently check its bytes
against that authenticated manifest, or use an already trusted installed verifier. Running unverified
code from the package cannot authenticate that same code.

Then, with permitted Node commands, verify the staged package before any live write:

```sh
node /path/to/package/tools/package-release.js --verify /path/to/package --sha256 <release-manifest-digest>
```

Without Node, the agent uses permitted file/hash capabilities against the same manifest. If it
cannot establish completeness or content integrity, report that limit and stop before installation.
If downloads are denied, accept an authorised complete local package; do not bypass restrictions.
Do not use a floating `main` URL or mix files from different releases.

## Already using the current file format

1. **Keep your brain.** Back up the installed skill and affected host settings. Do not replace your
   knowledge or journal with the release's templates or a stale staging copy.
2. **Update the complete skill bundle.** Discover the actual host and existing scope before selecting
   targets. Do not write both carriers by default or add user/global wiring. Review the
   exact files/settings it changes. All files must come from the same pinned release and be verified
   in staging before live writes. Engine version and brain file format are separate.
3. **Verify your working mode.** Start a fresh session, check loading, resume a known task, and
   confirm capture in the way your environment supports. Setup must distinguish file presence,
   configured hooks/tools and actual execution.

For the current schema1.0 candidate, knowledge files do not need a format migration. A future
release must state explicitly if that changes.

Installation is an agent-led operation, not an unattended installer. The package tool only builds
and verifies files: it does not modify your brain or host settings. The agent must preserve fresh
preimages, show the bounded diff and apply only the selected targets recoverably. Optional hook
activation/trust and MCP registration are separate host actions with their own evidence.

An identical engine version does not mean an intact install. When Node is available:

```sh
node /path/to/package/tools/package-release.js --verify-skill /path/to/installed/skill
```

This checks the retained inventory and byte hashes, including missing or modified files. Modified
files need review; do not overwrite them merely to obtain a passing check. Without Node, perform
the same comparison with permitted host capabilities or state that verification is incomplete.

## Choose the supported path for your environment

| Environment | Expected path |
|---|---|
| MCP cannot be installed | Files/skills remain the working path. Test native hooks separately if allowed. |
| Node tools are available, MCP is not | CLI search/checks may be used independently of MCP. Invocation still needs a user or agent. |
| MCP is permitted | Register it through the verified host integration; check discovery and a real tool call. |
| Hooks cannot run | State that capture is agent-driven. Do not claim passive capture or automatic loss detection. |

## Before you rely on it

Verify the selected host/version, a fresh instruction-loading proof, one useful capture and a cold
resume. During setup or an explicit verification check, review which capabilities were observed.
Where no executable observer is permitted, verification is manual and a change may remain unnoticed
until that check. Retain direct file access; an automatic host switch must be tested before it is claimed.

## Restore

Restore only the files/settings changed by the upgrade. Preserve newer knowledge and journal work.
If a target was edited after installation, review that edit before replacing it. Backups must
preserve source bytes, including line endings. Never use a whole old brain snapshot as a shortcut.

Older file formats use the migration guides and tools from the same package/source commit. Do not
fetch migration dependencies from main. Keep that longer procedure outside short release notes
and the main first-run path.
