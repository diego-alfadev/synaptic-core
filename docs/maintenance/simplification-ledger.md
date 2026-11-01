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
  `git show HEAD:recipes/…` in a scratch tree). Recipe 23,042 → 23,722 B (LF).
- **Q3-X3:** A.0 ledger privacy. Line shape `<ts> <event>` → `<event>`; file name `<host>-<date>` →
  `<12-hex SHA-256 of the lower-cased host>-<date>`; hooks write `_activity/.gitignore` (`*`,
  `!.gitignore`), replacing init's `.gitkeep`. Readers (audit Step 9b, consolidate Journal Trim,
  SKILL §d) count the last field, so pre-1.6 files stay valid. Upgrade v1.5.0 addendum gains a v1.6
  bullet (`git rm --cached` offer, with OK). Boundary doc gains a capture-hooks row. Tests: bash
  43 → 45, PS 46 → 48 (+ 4 changed assertions per shell, + a real sh↔PS same-file test); red first
  (bash 7/45, PS 6/48 failed). SKILL.md 60555 → 61642 B.
- **Q3-X12:** cadence rule written once in `templates/BRAIN.md` (decision points + boundary summary
  where the hook writes breadcrumbs; per meaningful turn otherwise). The two "provisional cadence"
  notes in `SKILL.md` (§d honest limits) and `consolidate.md` replaced by a 3-line pointer each.
- **Q3 review:** GO after fixes. Fixed: two stale `<host>-<date>` names in SKILL.md; X12 wording
  in SKILL (a) row, Round 1b, the concept doc; committed-turn gap (agent writes the line itself);
  `hostname` missing → `uname -n`, else the literal `host` (no shared empty-string hash); PS
  one-liner falls back to `[Net.Dns]::GetHostName()`; cross-shell test also runs under `pwsh` and
  reports when skipped; raw-host test checks the name prefix (hex-only host names); `git -C`
  for the `rm --cached` offer; audit counts `*.log` day-files; CHANGELOG wording (unsalted token,
  mtime timing, the 15-character split, dedup by file list). Suites: bash 45/45, PS 48/48.
- **Q4-X4/S4/S5:** one drift/fingerprint primitive in the new `references/fingerprint.md` (5,547 B,
  on demand). **Moved there** from consolidate Step 4 (the anchored `git hash-object` command and its
  caveats, replaced by a pointer: consolidate 29,000 → 28,218 B) and audit's drift paragraph (33,726 →
  33,345 B). **Repointed:** ingest, command-discovery `<sot-hash>`, upgrade content-conservation,
  convert-to-global AC2.2, MIGRATION_DONE, the AGENT runbook. Git brains drop `content_hash` (the drift
  signal is the raw file's last commit vs its node's, `%ct`); others record `sha256-lf:`. The v1.5.1
  CHANGELOG lines that taught the old command are marked superseded, not deleted. Tests: bash 45 → 53,
  PS 48 → 55, including a real sh = PS parity loop over 6 fixtures and a fixed known answer
  (`911169ddaaf1`). Review: NO-GO (day-granular `updated:` rule, missing tracked-check command,
  leftover docs, quoting); all fixed.
- **Q5-X6:** CORE-floor / CORE-host stated once (new subsection in the matrioshka doc, 13,171 →
  14,421 B). **Collapsed to pointers** in `SKILL.md` §d: the "(Host coverage … UNVERIFIED …)" note
  (removed; the per-host table already says it), the Self-Wire step-4 honesty paragraph and the
  honest-limits bullets 2–3 (shortened). Nothing parked.
- **Q5-X11:** "default-load set / lazy-pull / load-priority" wording removed from SKILL.md Lifecycle
  axis, `templates/templates/node.md`, consolidate (status/lifecycle table + interaction rules),
  audit (Step 1a note, typo step), handover, day-one, BRAIN.md step 4, the concept doc (rewritten
  middle; also fixes the carried defect "status-vs-lifecycle.md:68 uses `archived` as a lifecycle
  value") and the concepts index line. SKILL.md keeps a one-line "dropped — X11" note.
- **Q5-Δ8:** MOC routing-text rule written once in consolidate Step 4; templates (`INDEX.md`,
  `example-cluster/_index.md`) and day-one point to it; audit Step 4 gains an advisory check with
  two CORE-host grep one-liners.
- **Q5 sizes (LF):** SKILL.md 61,843 → 60,725 (−1,118, always-loaded); handover 7,210 → 7,079;
  concept doc 7,437 → 7,153; audit 33,345 → 33,795 (+ the Δ8 check); consolidate 28,218 → 28,469.
- **Q5 review:** NO-GO → fixed. Leftover X11 phrases (consolidate, handover table, ROADMAP);
  Δ8 contradictions in `templates/templates/node.md`, `playbook.md`, upgrade C-step MOC rebuild,
  ROADMAP, PITCH (factual: `description` no longer feeds the MOC line), matrioshka table; CORE-floor
  row no longer claims the non-empty-capture guarantee (that one is CORE-host, the (a0) "mechanical
  floor"); audit greps restricted to `INDEX.md`/`_index.md`, backtick and `-`/`*` bullet forms,
  UTF-8 locale note, tested on a fixture; concept-doc corner row `dormant`+`archived`; SKILL.md
  pointer self-contained (docs/ is not in the bundle). A person's name used as a codename for "a real
  run" removed from the bundle and from two `tools/check.js` comments (historical CHANGELOG entries
  left as they are). **Net bytes:** always-loaded SKILL.md −~1.1 KB; repo total slightly up.
- **Q6-X7:** verb fold. Public menu 9 → 6 (+1 routine, +2 deprecated aliases for one minor).
  `SKILL.md` frontmatter trigger list, bridge Commands line, Cursor shim, Operations table (weave and
  synthesize rows **moved** into the maintain row as named passes; upgrade row **moved** to a new
  "Routine and aliases" table with the two alias rows); init row routes older brains to the upgrade
  routine. `maintain.md` gains an Invocation paragraph. `weave.md` / `synthesize.md` keep their
  procedures, re-headed as passes; synthesize's general safety bullets and weave's deletion-ledger
  paragraph **replaced by pointers** to maintain's CORE-safety contract. `command-discovery.md`: which
  rows get stubs, alias-stub body, drift check keyed on the tables (not `references/*.md`). Every
  in-procedure `/synaptic-weave` / `/synaptic-synthesize` reference repointed (audit routing, consolidate,
  upgrade, MIGRATION_DONE, recipe cadence output + table, concept docs, README, tools/README,
  verb-contract note). Sizes (LF): SKILL.md 60,748 → 61,205 (+457: the routine/alias table; Q8 moves
  it out); synthesize 8,192 → 8,088; weave 8,416 → 8,483; maintain 8,177 → 8,698; command-discovery
  8,997 → 9,754.
- **Q6 review (3 lenses + refuter):** token, host and contract lenses each NO-GO (one claimed
  blocker: no argument pass-through in the stub body). The refuter narrowed everything to five fixes,
  all applied: a named pass uses the latest audit findings or scans only what it needs (never loads
  audit.md); the sweep's steps 4–5 say "the synthesize/weave pass" (no self-reference); the maintain
  summary names the passes; stub bodies gain an argument clause (`$ARGUMENTS` in Claude Code; other
  hosts UNVERIFIED) and the bridge is generated from the Operations rows + the routine row via the
  Reference column; init **offers** the upgrade routine (it never silently ran it). User-facing
  alias mentions repointed: `tools/check.js` advisories (two output strings; **needs-CI**), both
  v0.3→v1 runbooks, ROADMAP's forward-looking lines. Dropped by the refuter: the "1.6 aliases" bytes
  in the skill description (trigger vocabulary), a hand-authored "Deprecated" menu prefix (breaks the
  no-hand-authored-description rule), historical docs.
- **Q7-S2/S3:** new `references/contract.md` (9,026 B, on demand). **Moved there:** SKILL.md
  "Lifecycle axis" body (verbatim; SKILL.md 61,294 → 58,310, always-loaded −2,984), consolidate's
  `status` vs `lifecycle` table + interaction rules (consolidate 28,502 → 26,560), audit Step 1b's
  value-semantics bullets (34,232 → 33,975), the node template's lifecycle comment block (5,005 →
  4,348). Each leaves a pointer. **Written once there:** the field table, typed-edge vocabulary,
  and the default Autonomy Tiers table (a copy of the template's) with the precedence rule; the
  brain's `harness/guardrails.md` keeps its table and gains a one-line "this copy wins" note (5,256
  → 5,434); consolidate and maintain name the default. Operational restatements kept on purpose:
  audit Step 1a/1b's token lists (they are the checks) and handover's include/flag table (its own
  behaviour). MANIFEST 29 → 30. **Not cut (needs Diego, n=1 evidence):** `true_since` / `learned_on` /
  `confidence` have no reader; the review suggested checking a colleague's brain first.
- **Q7 review:** NO-GO → fixed. Precedence no longer lets the default loosen a stricter brain
  (brain table governs entirely; unnamed action = propose-then-approve; default only for table-less
  brains). Dangling/stale pointers (consolidate 3a, audit Step 1a, handover) → `contract.md` §2/§3.
  Typed-edge vocabulary: contract §4 now points to weave.md's existing single source instead of
  restating it. Node template keeps three gloss lines for skill-less agents. The always-deployed
  guardrails note shortened to "This table wins over any skill default." `updated:` row no longer
  generalises a migration-only rule. New bash test: tier default = template table (checked to fail
  on a mutated copy). Known drift risk, accepted: `docs/concepts/status-vs-lifecycle.md` is a
  human-facing copy of contract §1–3 outside the bundle.
- **Q8-S1/S6:** SKILL.md split. **Moved verbatim** (headings adjusted, internal "above/below/this
  file" references repointed):
  - lines "Compat-check" + "Host-setup detection" → new `references/host-setup.md` (5,730 B);
  - "Onboarding Interview", "Generate", "Harness Self-Wire" §a–c, §e, §f → new `references/init.md`
    (19,787 B, with a §d pointer);
  - §d "Capture mechanism" → new `references/capture-hooks.md`, plus consolidate's "Journal Breadcrumb
    Contract" (consolidate keeps a 5-line pointer) and audit Step 9b's rationale (audit keeps the
    rules) — 28,125 B.

  SKILL.md keeps frontmatter, bootstrap (must stay: it is the only file a URL-only install has),
  Detect on Load, a compat-check paragraph, host-setup / lifecycle / self-wire pointers, Operations.
  External pointers repointed (audit, consolidate, upgrade-to-v1, convert-to-global, AGENT runbook,
  ADR-003, tools/README). Tests: extraction path → `capture-hooks.md`; the PS encoding guard covers
  both SKILL.md and capture-hooks.md. MANIFEST 30 → 33.

  | Item (LF bytes) | Before (`9f90780`) | After |
  |---|---|---|
  | `SKILL.md` (every command) | 58,310 | 11,832 |
  | consolidate path (SKILL + consolidate) | 84,883 | 35,578 |
  | audit path (SKILL + audit) | 92,286 | 44,929 |
  | maintain sweep (SKILL + maintain + audit + consolidate + weave + synthesize) | ~144 KB | ~94 KB |
  | init path (SKILL + init + host-setup + capture-hooks) | 58,310 | 65,474 |
  | bundle total | 282,568 at round start | 300,272 (34 files) |

  **"Files alone still boot, capture and retrieve" check: pass.** A skill-less agent reads only
  `BRAIN.md` (unchanged contract text), captures through its breadcrumb section, retrieves through
  `knowledge/INDEX.md` → `_index.md`; nothing on that path reads SKILL.md or the moved references.
- **Q8 review (3 lenses: contract, tokens, host — all GO with should-fixes):** losslessness checked
  by script (every non-blank old SKILL.md line present or an explained repoint). Fixed: plain
  `summary:` lines for the three new files (no "/synaptic-init —" prefix or "moved" tail leaking into
  the bridge/menu), one-line headers instead of provenance blockquotes, Layer-1 derivation uses the
  **first** Reference-column file; core SKILL.md says paths are skill-folder-relative, names
  `references/init.md` on the no-brain leaf and in bootstrap step 5, and restores the compat-check
  "missing → assume compatible" meaning; host-setup's header admits the boot-time warning read;
  upgrade-to-v1 (canonical host-setup procedure, Self-Wire §c), consolidate (breadcrumb pointer),
  capture-hooks self-pointers, tests/README, ci.yml comment, PS guard label repointed. Token lens:
  audit Step 9b now carries the ~300 B host-token formula inline, and its and consolidate's pointers
  into capture-hooks are marked optional (audit stays at ~45 KB, not ~73 KB). Not done (lens nits, Q8
  scope kept): further core trims (REACH paragraph, Operations column) ~3 KB; init's +7 KB. No
  separate refuter: no lens returned NO-GO.
