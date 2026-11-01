---
summary: "The one drift/fingerprint primitive: git history for brains in git, a line-ending-normalised SHA-256 otherwise."
---

# Fingerprint and drift — the one primitive

> **The only place a hash or drift command is defined.** consolidate, ingest, audit, upgrade,
> convert-to-global, MIGRATION_DONE and the command stubs point here. Never "compute" a hash yourself — a
> model cannot hash, so the value would be invented. No shell → the answer is **unknown**, never guessed
> (CORE-host rule: absent → unknown).

## Which form applies

Paths below are relative to `<brain>` (the folder holding `BRAIN.md`; on Windows pass it as `C:/…`).
`<raw>` = `references/raw/<file>`, `<node>` = the distilled node's path.

| The brain… | Drift signal for `<raw>` | `content_hash` field |
|---|---|---|
| **is in git and `<raw>` is tracked** — `git -C "<brain>" ls-files --error-unmatch -- "<raw>"` exits 0 | **git history:** drifted when the raw file's last commit is newer than the node's: `git -C "<brain>" log -1 --format=%ct -- "<raw>"` **>** the same for `"<node>"` (Unix seconds, integer compare). An uncommitted raw change (`git -C "<brain>" status --porcelain -- "<raw>"` non-empty) is reported as **pending**, not drifted | **not written** (git already knows) |
| **is not in git, or `<raw>` is untracked or ignored** | **fingerprint:** recompute the whole-file form below and compare with the node's value | `content_hash: "sha256-lf:<12 hex>"` at capture time; `TBD` with no shell |

- **Why two forms:** git already records when a file changed, with no extra field. A fingerprint is
  only needed where git does not track the file, and there it must not depend on any git setting
  (line endings, attributes, LFS): plain SHA-256 over the bytes with every CR removed, so a CRLF and
  an LF copy of the same text agree.
- **Why commit times, not `updated:`:** `updated:` is a date (same-day edits look equal) and is bumped
  for unrelated rewrites. Comparing the two files' own commits is exact to the second. **Re-distilling
  means committing the rewritten node**, which clears the signal.
- **Limits of the git form (say so, do not guess):** the raw file and node committed together, or a
  history import that squashed them into one commit, compare equal (read as not drifted); a shallow
  clone gives both the boundary commit (equal). A node rewritten later for another reason masks an
  older raw change. When the history looks rewritten or shallow (`git -C "<brain>" rev-parse
  --is-shallow-repository` prints `true`), report drift as **unknown**.
- **Backfilling a `TBD`** later hashes the file as it is *now*, not as it was distilled: write the
  value and a body line `> Changed <date>: content_hash backfilled (hashes today's file)`.
- **Legacy values** (written before 1.6): `git:<hex>` and `sha256:<hex>`. Treat them as
  **unverifiable, not drifted**. In a git brain, ignore the field and use git history; elsewhere,
  propose re-recording it as `sha256-lf:` — only with the owner's OK.
- **Stub provenance** (`generated-from: synaptic-skill@<version> <sot-hash>`): `<sot-hash>` is the
  whole-file fingerprint of the command's `references/<cmd>.md`, always this form (the skill folder
  may or may not be in git).
- **No-loss parity** (upgrade, convert-to-global): compare the **body fingerprint** (below) of every
  file before and after, on the same machine. A changed frontmatter is expected; a changed body is a
  loss unless logged.

## Whole-file fingerprint

First 12 hex characters of SHA-256 over the file's bytes with every CR (`0x0D`) byte removed.
`<file>` is an absolute path. Quoting: in sh it sits inside `"…"` (a path holding `"`, `$` or a backtick must
be escaped); in PowerShell inside `'…'` (double any `'`). Whole-file mode does not normalise a final
newline, so an editor that adds one reads as a change. PowerShell holds about three copies of the file in
memory: fine for documents, slow for very large binaries.

```sh
tr -d '\r' < "<file>" | { sha256sum 2>/dev/null || shasum -a 256; } | cut -c1-12
```

```powershell
$l = [Text.Encoding]::GetEncoding(28591)   # Latin-1 maps each byte to one char: byte-exact round trip
$b = $l.GetBytes($l.GetString([IO.File]::ReadAllBytes('<file>')).Replace("`r", ''))
-join ([Security.Cryptography.SHA256]::Create().ComputeHash($b)[0..5] | ForEach-Object { $_.ToString('x2') })
```

## Body fingerprint (file minus its leading frontmatter)

Same hash over the text after a leading frontmatter block: line 1 is exactly `---` and a later line is
exactly `---`. With no closing `---`, the whole file is the body. The body always ends with one
newline unless it is empty (so a missing final newline does not change the result). For Markdown and
other text only. A UTF-8 BOM before `---` means no frontmatter is recognised (both shells agree).

```sh
tr -d '\r' < "<file>" | awk 'NR==1 && $0=="---" {fm=1; buf=$0 "\n"; next} fm {buf=buf $0 "\n"; if ($0=="---") {fm=0; buf=""}; next} {print} END {if (fm) printf "%s", buf}' | { sha256sum 2>/dev/null || shasum -a 256; } | cut -c1-12
```

```powershell
$l = [Text.Encoding]::GetEncoding(28591)
$t = $l.GetString([IO.File]::ReadAllBytes('<file>')).Replace("`r", '')
$m = [regex]::Match($t, '\A---\n(?:.*?\n)?---(?:\n|\z)', 'Singleline')
if ($m.Success) { $t = $t.Substring($m.Length) }
if ($t.Length -gt 0 -and -not $t.EndsWith("`n")) { $t += "`n" }
-join ([Security.Cryptography.SHA256]::Create().ComputeHash($l.GetBytes($t))[0..5] | ForEach-Object { $_.ToString('x2') })
```

`tests/capture-floor/` runs both shells' forms on LF, CRLF, no-final-newline, changed-frontmatter, no-frontmatter
and unterminated-frontmatter fixtures, plus a known answer, and requires the same 12 hex from each.
