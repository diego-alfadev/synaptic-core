# tests/

Executable verification for the parts of synaptic-core that are code. CORE — the skill — is prose and
needs no runtime; nothing here is required to *use* Synaptic. Until these suites existed, every
acceptance criterion in the CHANGELOG was by-inspection.

| Suite | What it verifies | Runs on | Run locally |
|---|---|---|---|
| `capture-floor/run.sh` | the v1.5.0 capture floor (issue #2a): the recipe's A.0–A.3 hooks (marker, breadcrumb, reminder, rescue), alone and chained in the A.4 order, **and** the one-liners `SKILL.md` deploys, POSIX side | Linux, macOS, Windows (Git Bash) | `bash tests/capture-floor/run.sh` |
| `capture-floor/run.ps1` | the same for the PowerShell scripts the recipe ships (A.0–A.2; there is no PowerShell A.3). Runs under whichever engine executes it | Windows PowerShell 5.1, PowerShell 7 | `powershell -NoProfile -ExecutionPolicy Bypass -File tests/capture-floor/run.ps1` |
| `tools.test.js` | `tools/*.js` behaviour: `check.js` rules and regressions, `graph.js` offline output, `export.js`, `deploy.js`, `vault-open.js`, `migrate.js --dry-run` | Node 18 / 22 / 24 on Linux and Windows | `node tests/tools.test.js` |
| `probes/` | open research questions, not product checks — see `.github/workflows/probes.yml` | CI only | — |

## Principles

- **Test the documentation.** The capture-floor suites extract the hook scripts from the fenced blocks
  of `recipes/session-end-consolidate.md` and `standalone/synaptic/SKILL.md` instead of copying them. The
  scripts under test are the scripts a user pastes. If a heading or a fence moves, extraction fails loudly.
- **Launch hooks the way a host does**: a new process whose working directory is the workspace — plus one
  deliberate in-process run, because that is how a user checks a hook from their own terminal.
- **Fixtures live in the OS temp directory.** No suite reads or writes a real brain.
- **Every failure is also a GitHub annotation**, so results are readable from the run page.

## Hazards these suites found, and still guard

- **Windows PowerShell 5.1 encoding defaults** (measured): `>>` and `Out-File` write UTF-16LE + BOM;
  `Add-Content` writes the ANSI code page; `Add-Content -Encoding utf8` writes a BOM whenever the file is
  new or empty. The pinned form is `[IO.File]::AppendAllText(path, text, (New-Object Text.UTF8Encoding $false))`.
- **A relative path handed to a .NET method** resolves against the process directory, not `$PWD`. Run
  in-process after `Set-Location`, it writes nowhere and still exits 0 — the issue #2a failure class.
  Resolve to an absolute path first.
- **Non-ASCII inside PowerShell code.** A BOM-less script is read as cp1252 by 5.1; an em dash becomes
  three characters, the last a typographic quote that PowerShell accepts as a string delimiter, so the
  script stops parsing. Recipe and SKILL.md PowerShell blocks must be ASCII outside comments.
- **CRLF shell scripts.** Git for Windows defaults to `core.autocrlf=true`; a CRLF `.sh` does not run
  under bash. `.gitattributes` pins `*.sh` to LF.
