# Simplification ledger

> Every move, removal or rewording made by the simplification round (branch `feat/v1.6.0-simplify`).
> Non-destructive rule: text moves to a single home and leaves a one-line pointer; removed features go
> to `docs/parked/`. Token figures are bytes/4 estimates.
> **Sizes are LF-normalised bytes** (`git show <rev>:<path> | wc -c`, or `tr -d '\r' < file | wc -c`).
> A Windows working copy with `core.autocrlf=true` reads ~1–2% larger (SKILL.md: 60,869 B CRLF =
> 60,064 B LF), so do not compare against CRLF figures.
> Status values: `done` (tested or reviewed), `needs-CI` (needs Node or another platform to verify),
> `parked` (blocked, with the reason).

## Always-loaded baseline (`standalone/synaptic/` at `63e7194`, LF bytes)

| Item | Bytes |
|---|---|
| `SKILL.md` (loaded by every command) | 60,064 (805 lines) |
| `templates/BRAIN.md` (the boot read in every brain) | 7,558 (116 lines) |
| `references/` (11 files) | 179,023 |
| `templates/` (17 files) | 42,660 |
| Whole bundle (30 files) | 282,568 |

## Entries

| # | Item | What changed | Where it went | Bytes before → after (LF) | Status |
|---|---|---|---|---|---|
| Q1-D3 | BRAIN.md floor wording + line budget | Breadcrumbs re-described as a best-effort instruction; the activity marker named as the only mechanical floor and added to the layered table; the retracted "never breadcrumb-empty / closes issue #2" claim removed (not moved: it is false since 1.5.0). The `## Commands` section folded into one `**Commands:**` line under Session Start; the two intro blockquotes merged. Same correction in `SKILL.md` (Round 1b, §d bullet), `consolidate.md:28`, the recipe, `docs/concepts/capture-and-consolidation.md` + its `_index.md` line. | in place | BRAIN.md 7,558 → 7,704 (116 → 108 lines) | done |
| Q1-D4 | PreCompact "run consolidate" | `SKILL.md` layer (b)/(d) rows, Self-Wire d.2, the structured-summary note and the Cursor row; BRAIN.md table; recipe table/heading text; concept doc: "flush / run `/synaptic-consolidate`" → "prints a reminder". Script output strings untouched. | in place | — | done |
| Q1-D5 | MIGRATION_DONE check.js gates | Phases M, C, V.1 and the `upgrade-to-v1.md` phase-commit list accept the manual Phase V greps and ask which check ran. | in place | MIGRATION_DONE 7,745 → 8,248 | done |
| Q1-D6 | Stub placement | Claude Code stubs follow the skill's install scope (project skill → project stubs). New drift step 4b offers to move pre-1.6 user-level stubs, record-listed only. Note that project stubs are committed like the project skill. | `command-discovery.md`, `SKILL.md` Layer 2 | command-discovery 7,905 → 8,946 | done |
| Q1-D7 | `.gitkeep` manifest check | Self-install non-empty check exempts 0-byte `.gitkeep` placeholders. | `SKILL.md` bootstrap step 4 | — | done |
| Q2-X10 | `harness/skills/` out of CORE (closes D2) | Self-Wire c.6 (install `harness/skills/*` at boot) replaced by "install nothing executable from the brain". Template `templates/harness/skills/README.md` **moved** to `docs/parked/harness-skills.md` with a PARKED banner (why, what changed, how to revive). MANIFEST 29 → 28. Init layout tree, BRAIN.md Brain Map, matrioshka tree, navigation-and-planes, PITCH, ROADMAP, ADR-003 (struck through + superseded note), content-is-data clause: "project skills" dropped. Upgrade C9 + AGENT runbook + MIGRATION_DONE: legacy custom skills preserved **inert**, dir created only if any exist. `tools/migrate.js` no longer creates an empty `harness/skills/` (one-line removal; **needs-CI** to execute). | `docs/parked/harness-skills.md` | `templates/` 43,309 → 41,570; SKILL.md 60,511 → 60,555 | done (migrate.js line: needs-CI) |

## Notes per item

- **Q1:** `SKILL.md` 60,064 → 60,511 (+447). These are correctness fixes; they were never meant to
  shrink anything.
- **Q3-D1:** A.1 dedup — one `awk` (sh) / one `[regex]::Matches` (PS) read of the journal, skip when the
  last `breadcrumb: touched` line lists the same files. Tests: bash 40 → 43, PS 43 → 46; the 3 new
  cases per shell fail against the pre-fix recipe (PS checked by running the new suite against
  `git show HEAD:recipes/…` in a scratch tree). Recipe 23,042 → 23,697 B (LF).
