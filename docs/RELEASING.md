# Owner release-candidate handoff

This guide prepares a candidate from an exact committed source and leaves GitHub actions to the
owner on a computer with GitHub CLI access. Preparation itself never fetches, tags, pushes, publishes,
merges main, changes host configuration or updates a brain. Integrated Cortex candidates use the
v2.0 line; the example below is **v2.0.0-rc.2**, not a stable release or a schema migration.

## Route A — GitHub CLI only on the owner computer

This route needs gh and its normal authenticated repository access; Node and a local Git checkout
are not required. Pushing the candidate branch triggers the read-only `prepare-rc` workflow, which
builds from that push's exact commit and uploads only the four handoff assets. It cannot tag or publish
a release. Locate the run for the full reviewed commit and verify both preparation and the separate
CI run, rather than selecting the latest run by name alone:

```sh
gh run list --repo diego-alfadev/synaptic-core --workflow prepare-rc.yml --branch release/rc2-integration --commit <FULL_REVIEWED_COMMIT>
gh run view <PREPARE_RUN_ID> --repo diego-alfadev/synaptic-core --json headSha,conclusion,workflowName
gh run list --repo diego-alfadev/synaptic-core --workflow ci.yml --commit <FULL_REVIEWED_COMMIT>
gh run download <PREPARE_RUN_ID> --repo diego-alfadev/synaptic-core --name synaptic-v2.0.0-rc.2-prepared --dir ../synaptic-v2.0.0-rc.2-prepared
```

Choose a new download directory. Inspect `PREPARED-RELEASE.json`: its source commit, tag and engine
version must match the reviewed candidate; the notes must remain prerelease-scoped. Compare the asset
digest against `SHA256SUMS` using the computer's normal SHA-256 facility where available (for example
PowerShell `Get-FileHash -Algorithm SHA256` on Windows). The workflow already verified the full package
and archive before upload; a gh-only machine is not claimed to have independently run the Node checker.

Artifacts expire after **14 days**. Download/archive them before expiry, or arrange a new preparation
of the same immutable commit. Reproduction with another Node/zlib toolchain can produce a different
compressed-file digest; do not replace already published bytes under an existing RC identity.

Manual dispatch is secondary, when GitHub makes this workflow available for dispatch (a new workflow
that exists only on a feature branch may not yet be registered through the default branch). Do not
merge main merely to make a dispatch button appear. When available, the explicit inputs are:

```sh
gh workflow run prepare-rc.yml --repo diego-alfadev/synaptic-core --ref release/rc2-integration -f source_commit=<FULL_REVIEWED_COMMIT> -f version=v2.0.0-rc.2
```

The push preparation route avoids that initial dispatch dependency. Neither route is a publication.
For a manual-dispatch run, its `headSha` identifies the workflow-ref commit and can differ from the
requested `source_commit`. Verify `PREPARED-RELEASE.json.sourceCommit` and the logged build input as
the asset's source identity; do not substitute the workflow run's head SHA. On the push route the
workflow uses the push SHA for the artifact source, so both identities should match.

Before creating a draft with gh, inspect any existing tag:

```sh
gh api repos/diego-alfadev/synaptic-core/git/ref/tags/v2.0.0-rc.2
```

If it exists, follow an annotated tag object with `gh api .../git/tags/<TAG_OBJECT_SHA>` until its
commit target is visible, and compare it to the exact reviewed commit. A mismatched or unknown tag
means stop; never retag/relabel the candidate. `--target` is ignored when the tag already exists.
Only when the tag is confirmed absent (and repository access is valid), or confirmed to point to the
same exact commit, may the owner explicitly create the draft prerelease:

```sh
gh release create v2.0.0-rc.2 --repo diego-alfadev/synaptic-core --target <FULL_REVIEWED_COMMIT> --draft --prerelease --title "Synaptic v2.0.0-rc.2" --notes-file ../synaptic-v2.0.0-rc.2-prepared/RELEASE-NOTES.md ../synaptic-v2.0.0-rc.2-prepared/synaptic-2.0.0-rc.2.tar.gz ../synaptic-v2.0.0-rc.2-prepared/SHA256SUMS ../synaptic-v2.0.0-rc.2-prepared/PREPARED-RELEASE.json ../synaptic-v2.0.0-rc.2-prepared/RELEASE-NOTES.md
```

That command intentionally creates the tag at the supplied commit if it does not exist; it is an
owner publication action, not part of preparation. For an already verified existing tag, add
`--verify-tag` to require it. Do not overwrite an existing release/RC; use a new version for corrections.
The owner reviews and publishes the draft separately. Downloaded workflow assets omit the expanded
`package/` directory: the complete package is inside the tar.gz, including generated receipts.

## Route B — local immutable build (Node and Git available)

### 1. Fetch and pin the reviewed source

Use the final full commit supplied in the handoff, not a remembered older candidate or a moving branch
name. In an existing clone on the owner computer:

```sh
git fetch origin release/rc2-integration
git show --no-patch --format=fuller <FULL_REVIEWED_COMMIT>
git switch --detach <FULL_REVIEWED_COMMIT>
```

Confirm that the expected branch contains that exact commit and that its own CI/reviews passed.
Detached checkout is deliberate; do not merge the feature into main as part of packaging. If Git
reports local edits, preserve them and use a separate clone/worktree rather than discarding anything.

The committed `standalone/synaptic/SKILL.md` must say `version: 2.0.0-rc.2` for the example tag.
If it still says 1.6.0 or another version, **stop**: prepare the explicit source version/changelog in
the candidate branch, commit it, run the required checks and use that new full commit. An uncommitted
version edit does not change immutable source. The helper refuses tag/header/package mismatches; it
never bumps versions or relabels old engine bytes automatically. Brain schema 1.0 is independent.

### 2. Prepare the asset locally

Node 18+ and Git are needed for preparation. Cortex capability testing still has its separately
documented Node/SQLite requirements. No npm install, GitHub CLI or shell-specific archive tool is
needed for this command. Use a **new** destination whose parent already exists, preferably outside
the checkout:

```sh
node tools/prepare-release.js --repo . --ref <FULL_REVIEWED_COMMIT> --version v2.0.0-rc.2 --out ../synaptic-v2.0.0-rc.2-prepared
node tools/prepare-release.js --verify ../synaptic-v2.0.0-rc.2-prepared
```

The new directory contains:

- `package/`: the exact tracked source plus generated `RELEASE-MANIFEST.json` and skill `SOURCE.json`.
- `synaptic-2.0.0-rc.2.tar.gz`: that complete package, including the generated source/integrity files.
- `SHA256SUMS`: archive, handoff metadata and notes digests.
- `PREPARED-RELEASE.json`: source commit, exact engine/tag, package-manifest and archive digests.
- `RELEASE-NOTES.md`: short prerelease notes for owner review.

The archive uses built-in Node gzip and bounded USTAR encoding with UTF-8 PAX path metadata, fixed time/owner metadata and
preserved Git file modes. UTF-8 paths and committed line endings are retained. A path that cannot fit
USTAR fields fails explicitly; it is not truncated. The preparation self-checks the package and exact
archive payload before exposing the final directory. Existing destinations are never overwritten.
If preparation fails after staging, its error reports the private staging path for diagnosis; it does
not recursively delete evidence. Windows EPERM/EACCES/EBUSY rename failures receive at most six
attempts and 575ms total waiting; destination absence is checked on every attempt. Persistent denial
or a destination collision remains a failure, with staging preserved and no permission changes or
existing-directory deletion. Successful reports include the publication attempt count. Compression bytes may depend on the Node/zlib implementation, so
the produced asset digest is the identity to upload and verify, not an unsupported cross-runtime claim.

Optional extraction check with a standard tar consumer:

```sh
mkdir ../synaptic-rc-extract-check
tar -xzf ../synaptic-v2.0.0-rc.2-prepared/synaptic-2.0.0-rc.2.tar.gz -C ../synaptic-rc-extract-check
node tools/package-release.js --verify ../synaptic-rc-extract-check/synaptic-2.0.0-rc.2
```

Use a new extraction directory. Digest checks detect content changes; they do not authenticate a
publisher by themselves. Retain the trusted reviewed commit and independently received digest.

### 3. Owner-only tag and GitHub draft

These commands are **not** run by the preparation helper. The owner first reviews the notes and the
candidate's evidence/remaining integration gates. A candidate publication does not mean stable
acceptance passed. If the tag/release already exists, inspect it and compare its peeled commit and
assets; do not move a tag, overwrite a release identity or upload changed assets under the same RC.
A correction gets a new RC number and a new committed version.

After approving this exact source, create and push only the intended candidate tag:

```sh
git tag -a v2.0.0-rc.2 <FULL_REVIEWED_COMMIT> -m "Synaptic v2.0.0-rc.2"
git push origin refs/tags/v2.0.0-rc.2
git ls-remote --tags origin refs/tags/v2.0.0-rc.2 "refs/tags/v2.0.0-rc.2^{}"
```

Verify that the remote tag's peeled commit is the same full reviewed commit. Do not infer that from
the tag name alone. Then, on the gh-equipped owner computer, create a **draft prerelease**:

```sh
gh release create v2.0.0-rc.2 --repo diego-alfadev/synaptic-core --verify-tag --draft --prerelease --title "Synaptic v2.0.0-rc.2" --notes-file ../synaptic-v2.0.0-rc.2-prepared/RELEASE-NOTES.md ../synaptic-v2.0.0-rc.2-prepared/synaptic-2.0.0-rc.2.tar.gz ../synaptic-v2.0.0-rc.2-prepared/SHA256SUMS ../synaptic-v2.0.0-rc.2-prepared/PREPARED-RELEASE.json ../synaptic-v2.0.0-rc.2-prepared/RELEASE-NOTES.md
```

`--verify-tag` prevents gh from silently creating a missing tag at a default branch tip. It does not
replace the source/version/remote-commit check above. Inspect the draft and attached asset digests.
`RELEASE-NOTES.md` is attached as a file as well as used for the page text, because `SHA256SUMS` lists
it: with all four assets downloaded into one directory, `shasum -a 256 -c SHA256SUMS` exits 0, and
`node tools/prepare-release.js --verify-assets <that directory>` also checks the metadata and that the
archive's `RELEASE-MANIFEST.json` matches `manifestSha256`. The page and `PREPARED-RELEASE.json` both
carry `manifestSha256`; that line is the trusted package digest.

Publishing the draft is a separate owner action; stable release stays gated by the agreed real host
journey and bounded native-curation acceptance. No main merge is required by these instructions.

## 4. What the migration agent must download

Use the attached **prepared `synaptic-2.0.0-rc.2.tar.gz` asset**, then its `UPGRADING.md` and source
receipt. GitHub's automatically generated “Source code” zip/tar archives represent tracked Git source
and **do not contain the generated package SOURCE.json or RELEASE-MANIFEST.json**. They are not the
prepared installation package and must not be substituted for it. Keep installation, loading, native
events, tool discovery and semantic curation evidence separate in the migration report.

Official GitHub CLI reference: [gh release create](https://cli.github.com/manual/gh_release_create).
