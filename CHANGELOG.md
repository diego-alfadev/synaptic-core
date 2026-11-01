# Changelog

## [1.5.1] - 2026-11-01

> **First runtime verification of the capture floor.** Everything in [1.5.0] was accepted by inspection
> ("actual hook firing is verified on the first real run" — that run never happened). `tests/capture-floor/`
> now executes the published hook scripts — the recipe's and the one-liners `SKILL.md` deploys — and
> `.github/workflows/` runs them on every push. The A.0 POSIX script passed unchanged; the PowerShell
> side surfaced five defects and the deployed one-liners two more (the ghost-directory one in both
> shells). A second pass added the A.2 reminder and A.3 rescue: C2 (the reminder, both shells, plus
> its A.1 half in both shells), and C4 and C6 (the bash-only A.3), below. All are fixed here; every one
> a test can observe went red → green in its own commit.
>
> **Scope of the verification — read before quoting it.** Executed locally: **Windows PowerShell 5.1 and
> Git Bash on Windows 11 only** (bash 40/40, PowerShell 5.1 43/43). PowerShell 7, Linux and macOS are
> first exercised by CI; `tools/*.js` and their new tests have **never been executed** yet. Behaviour
> described below for those platforms is reasoned from source, not observed.

### Fixed
- **Recipe `Stop` breadcrumb (A.1, PowerShell) still wrote a BOM.** The [1.5.0] fix switched
  `Add-Content` to `-Encoding utf8`, which on Windows PowerShell 5.1 means UTF-8 **with** a BOM, written
  whenever the journal is new or empty. It now uses `[IO.File]::AppendAllText` with `UTF8Encoding $false`
  and LF (the activity marker's pattern), resolves the brain path, and never breaks a turn on a write
  failure.
- **Activity marker (A.0, PowerShell) silently missed when run in-process.** A relative path handed to
  `[IO.File]::AppendAllText` resolves against the .NET process directory, not `$PWD`, so run from a
  terminal after `cd` — how a user checks that a hook works — it wrote nothing and still exited 0. The
  brain path is now resolved to an absolute path first.
- **Brain paths containing `[ ]` were silently skipped** (A.0, A.1, and the deployed PowerShell
  one-liner). `Test-Path` without `-LiteralPath` treats brackets as a wildcard, so a brain in, say,
  `proj[1]\` was reported missing and the hook exited 0 having written nothing. Now `-LiteralPath`, and
  the directory is created with `[IO.Directory]::CreateDirectory`.
- **Host token in the PowerShell activity marker.** It is `%COMPUTERNAME%` on Windows — unchanged, so
  existing Windows ledger filenames stay the same — and the full host name elsewhere, matching what
  `hostname` prints for the sh marker. (Off Windows, `$env:COMPUTERNAME` is unset, so the [1.5.0]
  script would name the file `-<date>.log`; `[Environment]::MachineName` would truncate at the first dot
  and split the ledger from the sh marker's. Neither has been run off Windows yet.)
- **The Windows hook registration pointed at `pwsh`** (PowerShell 7), which a stock Windows install does
  not have, so the hook never started. The recipe now documents
  `powershell -NoProfile -ExecutionPolicy Bypass -File …` and what each flag is for, and says plainly
  that the A.3 rescue has no PowerShell variant yet (keep it on Git Bash or leave it out — registering
  a `.ps1` that does not exist fails on every `SessionStart`).
- **A.2's PowerShell reminder** had a non-ASCII `·` inside a string, rendered as mojibake under 5.1 when
  the block is pasted into a BOM-less file. Recipe and `SKILL.md` PowerShell blocks are now ASCII outside
  comments, enforced by a test (an em dash or arrow there would break parsing outright: their cp1252
  bytes include a typographic quote that PowerShell treats as a string delimiter).
- **The deployed activity-marker one-liners in `SKILL.md`** — the copies `/synaptic-init` and
  `/synaptic-upgrade` actually wire into the host — **recreated a ghost brain directory** when the brain
  had been moved or deleted: neither had the recipe's brain-exists guard. Both now no-op when `<brain>`
  is absent, and the PowerShell one makes `<brain>` absolute before the .NET call. With an absolute
  `<brain>`, as the SKILL instructs, both already worked; these were edge cases, not the main path.
- **`docs/UPGRADE-v0.3-to-v1.AGENT.md` recommended `Set-Content -Encoding utf8`,** which on 5.1 writes a
  BOM in front of every rewritten node's frontmatter. It now names the ANSI read as the corrupter and
  the BOM-free `[IO.File]` read/write pair as the fix.
- **`tools/migrate.js`'s header promised a confirmation prompt that does not exist.** Without
  `--dry-run` it executes immediately; the header now says so.
- **"Order matters" in the hook registration was wrong.** Claude Code runs the hooks of one event in
  parallel. The guarantee that holds is different: the marker is its own hook entry, so a failing
  sibling cannot stop it.
- **The A.2 reminder and the A.3 rescue now share one predicate, in every shell:** breadcrumb lines
  the A.1 hook wrote (`breadcrumb:`, lowercase), or open playground directories. Three defects are fixed:
  - **C2.** The reminder's `git diff --name-only HEAD` gate had three faults:
    - it never fired on a brain outside git (now an open playground triggers it; the breadcrumb half
      still depends on A.1, which needs git);
    - it missed new untracked playgrounds;
    - it fired on every session once the A.0 day-file was tracked. Fixing that needed A.1 too: it
      recorded the brain's own bookkeeping (the A.0 ledger, the journal it writes) as touched, so the
      reminder could never go quiet. A.1 now leaves `journal/_current.md` and `journal/_activity/` out,
      including when git quotes a path with non-ASCII characters. A consolidation that rewrites wiki
      nodes still leaves one breadcrumb about its own edits, cleared by the next consolidation.
  - **C4.** `playgrounds/archive/` no longer counts as an open playground.
  - **C6.** `grep -c … || echo 0` produced `0\n0`, which made the rescue print "integer expression
    expected" on every boot with no pending breadcrumbs.

  Runtime tests cover each script alone and the A.0 → A.1 → A.2 chain in the A.4 order, in bash and
  PowerShell (there is no PowerShell A.3). The PowerShell predicate is now case-sensitive and ignores a
  file named `playgrounds`, matching bash. A long-lived open playground keeps the reminder firing on
  purpose: it is unconsolidated work until it is burned or archived.
- **Skill prose defects** (no runtime involved; checked by review, not by tests):
  - **`content_hash` has one command, defined once in consolidate Step 4** *(superseded on the
    simplification branch by `references/fingerprint.md`, see "Simplification round" below)*:
    `git -C "<brain>" -c core.autocrlf=input -c core.attributesFile=/dev/null hash-object
    "references/raw/<filename>"`, stored as `git:{first-12}`. Before, the field was labelled `sha256:`
    but could hold a `git hash-object` prefix, a real SHA-256 prefix, or a value the agent "computed",
    which a model cannot do. The command is the same in every shell. Its result no longer depends on
    the clone, the machine's line-ending setting, user-level attributes, or the directory the agent
    runs it from. Without these pins it did: a raw-bytes hash changes when Git for Windows rewrites line
    endings per clone; an unpinned `git hash-object` changes per machine for CRLF files outside git;
    and run from another repo, that repo's `.gitattributes` applies. Measured in Git Bash and Windows
    PowerShell 5.1 on Windows 11, with POSIX simulated by `core.autocrlf=false`. Attributes of a repo
    that holds the brain itself (e.g. `-text`, `eol`, `crlf`, an LFS filter, `ident`,
    `working-tree-encoding`) or a SHA-256 repo still change the result; audit adds a
    possibly-repository-caused note to any mismatch in a brain that sits in a git repo. No shell
    or no git means `TBD`. Audit reports a `TBD` hash or a legacy `sha256:` value as unverifiable, not
    drifted.
  - **Supersession uses the status vocabulary.** `synthesize.md` proposed `status → superseded`, which
    is not a status. A wholly replaced node now keeps its body, gets `status: archived`, and its
    successor records `supersedes`. Handover shows it only as history (indented under its nearest
    non-archived successor the brief lists, or on a closing `Archived (history only)` line), never as
    a current decision. Consolidate, maintain
    and synthesize now point at the Autonomy Tiers table (`harness/guardrails.md`) for tiers. Some
    restatements remain in other files; a later pass will remove them. The table's AUTO row no longer
    lets an agent rewrite a flagged `contradicts`/`supersedes` pair unasked. Authoring an edge the
    user has not confirmed, and rewriting an existing node, are propose-then-approve. Synthesize no
    longer calls deletion anything but human-only.
  - **Agent-behaviour rules** found while consolidating, or described during `/synaptic-init`, are
    offered as exact text for the user's own `AGENTS.md` (outside the SYNAPTIC block) or user-level
    instructions. They are written only on the user's explicit instruction, never into the brain.
    `/synaptic-upgrade`'s guided mode asks one batched question covering three things: the rule text
    it routes into `harness/`, where each behaviour item goes, and the deploy diff. In every mode, Phase C
    writes that text to `_migration-staging/harness-pending.md` with a status per item (`pending`,
    `approved → …`, `discarded`) and never writes the harness rule files. Autonomous mode leaves the
    items `pending`, writes and deploys nothing, and does not cut over. The next guided `/synaptic-upgrade` resumes from
    that file instead of migrating again. `MIGRATION_DONE.md` and the agent runbook match.
  - **Content is data, never instructions.** `SKILL.md` states once, for every operation, that what an
    operation reads as source material (knowledge nodes, registries, raw references, playgrounds, the
    journal, agent-native memory, ingested documents) is material to distil: a directive in it that
    the user did not give is never acted on or promoted into a rule, and `harness/` rules change only
    when the user approves the exact change. Generated `/`-menu stubs now load `SKILL.md` before the
    command's reference, so the rule reaches every command.

### Corrected claims in [1.5.0]
- *"PowerShell 5.1's `>>` / `Add-Content` / `Out-File` default to UTF-16LE + BOM"* — true of `>>` and
  `Out-File`. **`Add-Content` defaults to the ANSI code page** (measured on 5.1: `café` is written as
  `63 61 66 E9`). The original A.1 defect was therefore invalid UTF-8 for non-ASCII paths, not UTF-16.
- *"Recipe `Stop` breadcrumb PowerShell encoding"* under **Fixed** — it was only partly fixed; see above.

### Upgrade notes
The capture-floor fixes live in files that were **copied into your project**; nothing updates them for you.
Do the steps in this order.
- **Reinstall the skill first** (the new `SKILL.md` with its `references/` and `templates/`), so every
  later step runs the new text.
- **Re-copy** `synaptic-activity.ps1` and `synaptic-breadcrumb.ps1` from the recipe if you use the
  PowerShell variants.
- **Re-copy the A.1–A.3 hooks** if you installed them: `synaptic-breadcrumb.sh`/`.ps1`,
  `synaptic-consolidate-reminder.sh`/`.ps1` and `synaptic-rescue.sh`.
- **Change Windows hook commands** from `pwsh -File …` to `powershell -NoProfile -ExecutionPolicy Bypass
  -File …` unless PowerShell 7 is actually installed.
- **Strip a leading BOM** from `journal/_current.md` if one is there (first bytes `EF BB BF`).
- **No ledger rename on Windows:** the activity-ledger filename is unchanged there.
- **Skill prose fixes arrive with the skill**, except your brain's copy of `harness/guardrails.md`.
  Edit it by hand before the re-run below:
  - In the AUTO row, change *"reconcile a flagged `contradicts` / `supersedes` edge"* to *"author the
    `contradicts` / `supersedes` edge for a pair the user confirmed"*.
  - In the PROPOSE-THEN-APPROVE row, add *"author a `contradicts` / `supersedes` edge the user has
    not confirmed"*.
  - In the "Self-improving" line, change *"reconciles flagged edges"* to *"links confirmed pairs"*.
- **Re-run `/synaptic-upgrade` (or `/synaptic-init`)** to re-wire the guarded one-liners, re-deploy
  the edited rules, and regenerate the `/`-menu stubs (they now load `SKILL.md` first). For its drift
  check to notice, the release must bump `SKILL.md`'s `version:`.
- **Existing `content_hash` values** *(superseded by the simplification round: git brains ignore the
  field, others re-record as `sha256-lf:`)* are labelled `sha256:`. Each one may be a `git hash-object`
  prefix, a real SHA-256 prefix, or an invented value. Audit reports them as unverifiable, not drifted.
  Where the hex matches the recomputed prefix, re-label it `git:`. Otherwise, re-record it only with
  your OK.
- **Last, after the re-run, run `/synaptic-consolidate` once.** Journals written by the old A.1 can
  hold breadcrumbs that list only `journal/` paths. Running it last means it runs under the
  re-deployed rules and the new stubs.

### Simplification round (branch `feat/v1.6.0-simplify`, not released)

> Optimisation and simplification pass. Every move or removal is recorded in
> `docs/maintenance/simplification-ledger.md`. **Where this round supersedes the 1.5.1 notes above:** the
> A.2 reminder and A.3 rescue are one `synaptic-pending` script with a PowerShell twin (see "Removed"
> below), the drift hash is `references/fingerprint.md`, and the suites now run bash 54 / PowerShell 62+.

#### Fixed (simplification round)
- **The `Stop` breadcrumb (A.1) no longer repeats itself every turn.** An uncommitted diff persists
  across turns, so both scripts appended the same `breadcrumb: touched …` line on every turn until a
  commit, against the journal's own dedup rule. Both shells now skip the line when the last
  breadcrumb lists the same files; an agent-written line in between does not reset it. The dedup is by
  file list, not by session: a later session that touches exactly the same uncommitted files adds no
  new line. Re-copy the A.1 script from the recipe to pick this up. Tests: 3 new cases per shell, red
  against the old script.
- **The activity ledger (A.0) no longer writes the raw machine name or a per-turn timeline, and is not
  committed by default.** Files were `<hostname>-<date>.log` with one timestamp per turn, in a folder
  init tracked with a `.gitkeep`, while three docs said there was no telemetry. Now:
  - the file name uses a 12-hex host token, SHA-256 of the lower-cased host name. It is unsalted, so
    anyone who can guess the name can recompute it: pseudonymous, not anonymous;
  - each line is just `boot` or `stop`, so a day-file holds per-day counts. File modification times
    and a sync service's version history can still reveal timing;
  - the hooks write `journal/_activity/.gitignore` (`*`, `!.gitignore`); delete it to opt in.

  Audit and consolidate read old and new files (they count the last field). sh and PowerShell on one
  host share one file wherever `hostname` and the PowerShell host name agree up to case. On Windows
  they do not agree for a DNS name longer than 15 characters. A new test runs both shells into the same
  brain, under `powershell.exe` or `pwsh`. Re-deploy the hooks with `/synaptic-upgrade`. If your brain
  already committed the ledger, upgrade offers `git rm --cached`. A synced folder (OneDrive) still
  syncs the ledger.
- **The BRAIN.md template no longer claims a breadcrumb floor.** It said the agent-written breadcrumbs
  were "the always-on, fixed-cost floor" and that a session is "never breadcrumb-empty". Since 1.5.0
  the only mechanical floor is the activity marker. The template now calls breadcrumbs best-effort,
  names the marker, adds it to the layered-capture table, and fits its own ≤110-line budget (116 → 108
  lines). `SKILL.md`, `consolidate.md`, the recipe and the capture concept doc carry the same
  correction. Existing brains keep their wording; nothing is migrated.
- **`PreCompact` and `SessionEnd` no longer "run `/synaptic-consolidate`" or "flush".** No shell hook
  can run a slash command; the shipped A.2 hook prints a reminder. `SKILL.md`, the template, the
  recipe and the concept doc now say "reminder".
- **The migration gates accept the manual check.** MIGRATION_DONE Phases M, C and V.1, and the
  phase-commit list in `upgrade-to-v1.md`, required `tools/check.js`, which a normal skill install
  does not ship. They now allow the manual greps from `upgrade-to-v1.md` Phase V and ask which check
  ran.
- **Claude Code command stubs follow the skill's install scope.** They always went to
  `~/.claude/commands/`, so a project-installed skill's stubs loaded in every workspace and pointed at
  a path that existed in one project only. A project skill now gets project-level stubs. Existing
  stubs stay where they are until `/synaptic-upgrade`, whose stub-drift check now also checks
  placement and offers the move.
- **The self-install check no longer always fails.** It required every manifest file to be non-empty,
  but the manifest lists a 0-byte `.gitkeep`. Placeholders are exempt.

#### Changed (simplification round)
- **One drift and fingerprint primitive, `references/fingerprint.md`.** The raw-artifact hash went
  through several versions in 1.5.1, each depending on some git setting. Its uses now point at one file:
  consolidate, ingest, audit, the stub `<sot-hash>`, and the upgrade and convert-to-global no-loss
  checks.
  - **Brains in git** no longer write `content_hash`. The drift signal is the raw file's last commit,
    compared with the last commit of its node (exact to the second; not the day-granular `updated:`).
    Files committed together compare equal; a shallow clone is reported as unknown, never as drifted.
  - **Brains outside git** record `content_hash: "sha256-lf:<12 hex>"`. That is SHA-256 over the
    bytes with CR removed, so CRLF and LF copies agree, and it uses no git at all. The value comes
    from a pinned sh command or its PowerShell twin.
  - A body form, which ignores frontmatter and a missing final newline, serves the no-loss checks.
  - Legacy `git:` and `sha256:` values are reported as unverifiable, never as drifted.

  Tests: 6 cases per shell, plus a check that PowerShell prints exactly what sh prints on LF, CRLF,
  no-final-newline and frontmatter fixtures. Manifest: 28 → 29 entries (the new reference).
- **Fewer agent-written breadcrumbs where the hook is wired.** Where the `Stop` hook already records
  which files changed, the agent now writes only at decision points (a decision, a lesson, a blocker,
  a change of plan) plus the session-boundary summary. Without hooks, nothing changes: one line per
  meaningful turn. This replaces the "provisional cadence" notes. It saves an agent line per turn
  (an estimated 150–200 tokens), at the cost of losing in-between context if a crash comes before
  the boundary summary. The hook sees only uncommitted changes, so the agent still writes a line for
  a turn whose work it committed. The rule lives once, in `templates/BRAIN.md`.
- **CORE is stated in two tiers, once.** `docs/concepts/architecture-matrioshka.md` defines both.
  **CORE-floor** needs only an agent that reads, writes and searches files; every guarantee holds
  there. **CORE-host** is the optional shell, git, grep and hooks, under one rule: absent → unknown,
  never invented. In `SKILL.md` §d, one repeated honesty note was removed (the per-host table
  already says it) and two passages were shortened. The always-loaded `SKILL.md` drops ~1.1 KB; the
  repo total grows slightly, because the statement and the audit check are new text.
- **`lifecycle` is a label, not a load filter.** The "default working set / lazy-pull" wording is gone
  from `SKILL.md`, the node and playbook templates, consolidate, audit, handover, day-one, upgrade,
  ROADMAP and the concept doc. No agent load path ever filtered on it (the optional graph tool's
  visual filter is separate). The field, its four values and its absent → `area` default are
  unchanged. The concept doc's combined-value table no longer uses `archived` as a `lifecycle` value.
- **MOC lines are routing text.** `- [[node]] — <routing text>` is written for the next agent deciding
  whether to open the node. It is non-empty, at most 120 characters, and no longer a copy of
  `description:`. Consolidate Step 4, day-one and both MOC templates say so. `/synaptic-audit` Step 4
  flags empty or over-long lines (advisory), with optional grep one-liners. Existing MOCs need no
  change unless the audit flags them.
- **Six public commands: weave and synthesize are now passes of maintain.** The menu is `/synaptic-init`,
  `/synaptic-consolidate`, `/synaptic-ingest`, `/synaptic-audit`, `/synaptic-maintain` and
  `/synaptic-handover`. `/synaptic-maintain weave` and `/synaptic-maintain synthesize` run one pass
  alone. Both passes keep their procedures, now headed as passes and under maintain's CORE-safety
  contract, which they no longer restate. **`/synaptic-upgrade` becomes a routine.** It leaves the main
  menu but stays invocable by name. `/synaptic-init` offers it when it finds an older brain, and the
  upgrade runbooks call it.

  **Not breaking in 1.6:** `/synaptic-weave` and `/synaptic-synthesize` still work as deprecated
  aliases, and their stubs are regenerated as alias stubs. Both are **removed in the next minor
  release**, when the stub-drift check prunes their stubs. The bridge's command line, the Cursor shim,
  the skill description and the README list the six commands plus the routine. Re-run
  `/synaptic-upgrade` (or `/synaptic-init`) to redeploy them.
- **One home for the node contract: `references/contract.md`.** It holds the frontmatter schema
  (required fields, enums, `untriaged` read semantics, the `status`/`lifecycle` interaction, the
  lifecycle axis, typed-edge vocabulary) and the **skill-side default autonomy tiers**.
  - `SKILL.md`'s Lifecycle section and consolidate's status/lifecycle block moved there, each leaving a
    pointer. `SKILL.md` drops ~3 KB and consolidate ~2 KB.
  - Audit Step 1b and the node template point to it.
  - Tier precedence: a brain's own `harness/guardrails.md` table **governs entirely**; an action it does
    not name is propose-then-approve, so the default never loosens a stricter brain. The skill default
    applies only to brains whose guardrails have no tier table (new brains copy it at init). A test keeps
    the default and the template table identical.

  No field, enum or default changed. Existing brains need nothing.
- **`SKILL.md` is now a small always-loaded core: 58 KB → 12 KB (≈ −11.6k tokens on every command).**
  It keeps the self-install bootstrap, Detect on Load, a one-paragraph compat-check, and the
  Operations tables. Three new on-demand references take the rest, moved verbatim:
  - `references/init.md`: onboarding interview, Generate, Harness Self-Wire;
  - `references/host-setup.md`: compat-check details, host-setup detection;
  - `references/capture-hooks.md`: the capture mechanism (§d), the pinned activity-marker one-liners,
    and the journal breadcrumb contract moved from consolidate.

  Consolidate (26.6 → 23.7 KB) and audit Step 9b (whose rationale moved to capture-hooks) shrink too.
  `/synaptic-init` reads more than before (about 65 KB across four files); every other command reads
  much less. Stubs still load `SKILL.md` first. The first stub-drift check after upgrading reports the
  init stub as changed, because its source file is now `references/init.md`; it is regenerated. The test suites now
  extract the deployed one-liners from `references/capture-hooks.md`. Manifest: 30 → 33 entries.

#### Removed (simplification round)
- **Project skills (`harness/skills/`) are no longer part of CORE.** Deploy used to copy a brain's
  `harness/skills/*` into the host's skill folders at boot, with no per-item approval. That made a
  shared or handed-over brain a channel for delivering code. Deploy now installs nothing from a brain.
  New brains no longer get `harness/skills/`, and the template is gone from the bundle (29 → 28
  manifest entries). The idea is parked in `docs/parked/harness-skills.md`. **Existing brains:** a
  `harness/skills/` folder stays where it is, inert. `/synaptic-upgrade` still preserves a pre-v1
  brain's custom skill dirs, without installing them. If you relied on auto-install, install those
  skills by hand.
- **The `PreCompact` and `SessionEnd` reminder hooks are gone; one `SessionStart` script replaces A.2
  + A.3.** On Claude Code only `SessionStart` (and `UserPromptSubmit`) stdout reaches the model, so
  the old reminder reached no one. Engram's Claude Code plugin makes the same choice.
  `synaptic-pending.sh` / `.ps1` has two modes, with one git-free predicate:
  - `rescue` (startup / resume / clear) offers to consolidate pending work;
  - `compact` (the `compact` source) injects one line right after a compaction, pointing at the
    journal.

  **Windows gains the rescue,** which was bash-only before. A compaction no longer writes a `boot`
  marker. The rule comes from the Claude Code hook docs and Engram's plugin source; it was not measured on a
  live host.

  **PowerShell 5.1 hooks started in a folder whose path contains `[ ]`** used to start at `$PSHOME`,
  find no brain and silently do nothing. A.0, A.1 and A.2 now resolve the brain against the process
  directory when needed (A.1 also runs git there). The defect was reproduced, and all three cases are now tested.

  One fixture table, `tests/capture-floor/pending-cases.txt`, runs through both shells. **Upgrade:**
  re-deploy the hooks, delete `synaptic-consolidate-reminder.*` and `synaptic-rescue.sh`, and drop
  their `PreCompact` / `SessionEnd` settings entries.

## [1.5.0] - 2026-07-27

> **"Capture you can actually trust."** A MINOR that closes the **floor half of issue #2a** — the
> reported failure where a fully-worked session leaves an **empty journal**. Brain **schema unchanged
> (still 1.0)**; no migration — reinstall the skill (or run `/synaptic-upgrade`, which now also deploys
> the new floor). Additive, CORE-pure, zero-runtime. **NO Node on the authoring machine → runtime
> acceptance is author-complete / by-inspection; actual hook firing is verified on the first real
> (Robinson) run.**
>
> **The honest diagnosis.** Every capture layer we shipped was *"an instruction the agent follows"*, and
> the one script that did write mechanically (`recipes/` `Stop` breadcrumb) only wrote **when `git diff`
> reported touched files** — so it wrote **nothing** on a non-git workspace, a read-only session, or work
> outside the git tree. That gate *is* the empty journal. We also **overclaimed** the fix in three places
> in `SKILL.md` ("no host is ever breadcrumb-empty", "nothing is lost", "closes issue #2 on hook-less
> hosts"). All three claims are retired.

### Added
- **Layer (a0) — the deterministic activity marker (the only *mechanical* non-empty floor).** A
  **host-executed shell append** of one line (`<ISO-8601-UTC> boot|stop`) that the agent cannot skip.
  **Unconditional**: no git dependency, no content gate, no LLM, no JSON parsing.
  - **Destination `journal/_activity/<host>-<YYYY-MM-DD>.log`** — per host + per day, so each machine
    owns its own file. Safe on OneDrive/DFS-synced brains: many small **blind appends**, never a shared
    read-modify-write (which is what spawns `*-<machine>` conflict copies). **It does NOT eliminate
    same-host concurrency** — two sessions on one host+day share a file, so the one-liner **swallows its
    own failures and `exit 0`s**: a missed marker is acceptable, a broken turn is not.
  - **Self-creating + explicitly rooted.** A bare append to a missing parent fails on both shells, which
    would be a *false* floor; the one-liner does `mkdir -p` / `New-Item -Force` (still read-free) and
    `init`/`upgrade` also create `journal/_activity/.gitkeep`. The hook resolves the brain root
    explicitly rather than assuming the host's cwd.
  - **Scoping term is `shell-hook-capable`, not "hook-capable".** A host whose hooks merely *surface a
    prompt* to the agent is still the instruction layer and gets **no** mechanical floor — same honesty
    as a hook-less host. Three classes, three honest answers (table in `SKILL.md` §d).
  - **Encoding pinned to UTF-8 no-BOM.** PowerShell 5.1's `>>` / `Add-Content` / `Out-File` default to
    **UTF-16LE + BOM**, which would make the ledger non-grep-clean and produce binary-ish git diffs;
    the recipe now uses `[IO.File]::AppendAllText` with `UTF8Encoding $false`.
  - **The hook only ever appends** — rollup/prune is agent-owned (`/synaptic-consolidate`).
- **Per-host activity-marker support table** (`SKILL.md` §d) — shell-command-on-hook is confirmed only
  for **Claude Code**; every other host is marked **UNVERIFIED**. We no longer assert parity.
- **`recipes/session-end-consolidate.md` §A.0** — the unconditional activity-marker scripts (sh + ps1),
  registered to run **first** on `Stop` and `SessionStart`.
- **Dual-write forward contract** (`SKILL.md` §d): if a Cortex-tier working-memory provider is ever
  wired, what it must mirror is the **semantic journal in `journal/_current.md`** — at **BOTH
  granularities**: each `append()` as a terse per-turn breadcrumb, **plus** the structured 5-field
  summary at a session/context boundary. Boundary-only mirroring is insufficient (a session can make
  dozens of appends and die before any boundary is due → nothing mirrored → the delete-test fails).
  The content-free activity log is **never** a mirror target. Promotion state (`promoted`/`promoted_at`)
  stays **explicit only in the provider's RAM tier**; in CORE it is **implicit** — an entry is promoted
  once `/synaptic-consolidate` trims it from `_current.md`. **No new journal field, no schema bump.**

### Changed
- **Boot marker moved to one authoritative ledger.** The `SessionStart` boot marker is no longer an
  agent instruction writing `- boot:` into `journal/_current.md`; it is the (a0) shell append into the
  activity ledger. `_current.md` keeps only its curated Resume Anchor / Watch List / Log + semantic
  breadcrumbs, protecting its ≤80-line budget. Legacy `- boot:` lines are harmless history and are
  pruned by the Journal-Trim rollup.
- **`/synaptic-audit` Step 9b hardened, not replaced.** Its `not-used` vs `used-but-capture-dead` logic
  and bias-check are kept (only the *mechanism* reference moved). Specifically:
  - **Denominator = `boot` events ONLY, scoped to THIS host.** `Stop` fires per assistant *turn*, so one
    session emits 1 `boot` + N `stop`; summing them would turn breadcrumbs-per-**session** into
    breadcrumbs-per-**turn** (a healthy 40-turn session would score 1/41). `stop` is kept as a separate
    work-intensity signal. Per-host scoping is **mandatory** on a shared brain — globbing every host
    would let one machine's healthy capture **mask** another's dead capture, or let a floor-less host
    compute a yield against someone else's boots.
  - **`used-but-capture-dead` now requires TWO conditions:** zero well-formed capture across the
    **entire window** (never per-session) **AND** a **work signal** derivable from files
    (`knowledge/**`/`journal/` modifications, frontmatter `updated:`, git log). **This closes a
    regression v1.5.0 would otherwise introduce:** pre-v1.5.0 a pure-Q&A session often wrote no
    heartbeat → `not-used` → benign *by accident*; now markers are written unconditionally, so without
    a work signal a legitimate read-only week would fire `HOOKS-APPEAR-DEAD`. **Activity + no work
    signal = read-only/idle → benign, no advisory.**
  - **Capture is never gated on a consolidation having occurred** (a healthy mid-session has zero by
    construction). `capture_policy` is **not** a factor for breadcrumbs (it governs promotion only) —
    the policy caveat applies to `nodes-added-per-week` alone.
  - **"No floor" vs "DEAD floor" are now distinguished** via the host's hook config: deployed
    `BEGIN:SYNAPTIC-HOOKS` **but** no activity lines → **`shell floor DEPLOYED but DEAD → run the
    per-host hook smoke-test`** (this *is* the #2a failure, never reported as merely "unknown"); no
    shell hook deployed → **`capture-yield: unknown (no activity floor on this host)`**. A window that
    **straddles** the v1.4.0→v1.5.0 upgrade also reports `unknown`.
  - Audit stays **diagnose-only**: it *reports* an over-bound ledger and routes the rollup to
    `/synaptic-consolidate` / `/synaptic-maintain` — it never prunes.
- **`/synaptic-consolidate` Journal Trim** gained the **activity-log rollup** (the treat-side step audit
  routes to), with a **binding retention contract**: **never prune inside the audit window** (keep raw
  per-day logs for ~30 days), and any rollup **must preserve the per-day `boot` count** as a summable
  integer — discarding it would silently destroy Step 9b's denominator and mask a real capture-dead
  condition as `not-used (benign)`. Beyond the window, collapse a day-file to `<date> boot=N stop=M`;
  drop rolled-up files older than ~90 days; prune legacy in-body `- boot:` lines **only after** they are
  counted.
- **`/synaptic-upgrade` + `/synaptic-init`** now create `journal/_activity/`, deploy the (a0) hooks, and
  **report honestly** whether the host accepted them.
- **Recipe `Stop` breadcrumb** is now labelled the *semantic* layer (conditional by design, may
  legitimately write nothing) and its PowerShell variant writes `-Encoding utf8`.

### Fixed
- **Three shipped overclaims retired** (`SKILL.md`): "the instruction-layer breadcrumb closes issue #2
  on hook-less hosts", "on every host the instruction-layer breadcrumb is the floor, so no host is ever
  breadcrumb-empty", and "because the instruction-layer breadcrumb wrote the trail regardless, nothing
  is lost". Matching claims in `references/consolidate.md` are corrected too.
- **Recipe `Stop` breadcrumb PowerShell encoding** (`Add-Content` → UTF-16LE+BOM) — a real, shipped
  corruption path for a git-tracked journal on Windows.

### Honest scope (what this does NOT claim)
- **"Never empty" holds on `shell`-hook-capable hosts only** — hosts that demonstrably *execute a shell
  command* on `Stop`/`SessionStart` (confirmed: Claude Code; all others **UNVERIFIED**). On a hook-less
  host — **or a host whose hooks only surface a prompt** — there is **no mechanical floor**: low or zero
  capture is made **VISIBLE** (Step 9b) — **not prevented**. Saying otherwise would repeat the very
  overclaim this release retires.
- **Same-host concurrency is not solved**, only cross-host sync conflicts are.
- The activity marker is **proof-of-life + an audit denominator**, **not** semantic capture. Mechanical
  *semantic* capture needs a runtime and is the **`#2a-runtime`** half, deferred to the Cortex MemoryLog
  (v2.0). Issue #2a is therefore split: **`#2a-floor` (this release)** / `#2a-runtime` (v2.0).
- Issue **#2b** (the `harness/setup/<host>.md` → `CLAUDE.md` case-collision) is **not** in this release.

## [1.4.0] - 2026-07-02

> **"Brain REACH + Adoption."** One MINOR (`1.4.0`) that makes a brain **reach every folder** (wire the
> bridge at user level) and makes that brain **capture reliably, hand over cleanly, and be found**. The
> brain **schema is unchanged (still 1.0)** — no `/synaptic-upgrade` migration is needed; reinstall the
> skill for the new engine behavior. Additive, CORE-pure, zero-runtime. **NO Node on the authoring
> machine → every runtime acceptance criterion is author-complete / by-inspection; the actual firing
> (hooks, second-folder resolution, `/`-menu render, OneDrive hydration) is verified on the first real
> (Robinson) run.**
>
> **REACH = harness placement, not folder location.** A brain's reach is set by **where its
> `BEGIN:SYNAPTIC` bridge is wired** — a project-level bridge activates it in one folder, a **user-level
> / global** bridge activates it in **any** folder. Folder / broad-root / user-global are one axis, not
> three modes; the brain FOLDER can sit anywhere readable. It stays **one brain per workspace** — **one
> reach at a time** (no simultaneous coexistence — that is deferred to Cortex/v2.0); reach means one brain
> reachable from more folders, not two active brains.

### Added

- **New verb `/synaptic-handover`.** Generates a new-joiner / covering-colleague **day-1 handover brief
  FROM the brain** — project summary · owns · key decisions · where-to-look · open threads — sourced from
  active `project`/`area` synthesis, `lifecycle:`/`type:` frontmatter, `decision` nodes + god-node
  degree, `resource`/`registry` pointers, and active `project` nodes. **Extractive** (every claim links
  to a source node), **reproducible from files alone**, **leak-safe** (describes locations, never raw
  endpoints/IDs), client-agnostic. It **reads ALL statuses and ALL lifecycles** — a binding
  `lifecycle: dormant` + `status: active` decision **still appears** (dormant scopes only the *default*
  load, not exports); a stale-but-open thread is **flagged, not hidden**. New `references/handover.md`;
  added to the `SKILL.md` Operations table + the bridge command listing.
- **Day-1 guided first-value walkthrough (`references/day-one.md`), offered from `/synaptic-init`.** A
  short ~10-minute **cold-start** flow for a **fresh, empty** brain — the counterpart to the
  migration/upgrade runbooks (which serve existing brains) and aimed squarely at a **non-technical /
  low-initiative** user (good for demos, reduces friction). Three beats: **(1) first capture** — the
  agent asks the vacation question (*"if you left tomorrow, what's one thing you own a colleague would
  need?"*) and files the answer as one real typed, MOC-registered knowledge node (not a toy);
  **(2) first retrieval** — the agent asks the brain that question back and answers from the node via
  the grep/MOC floor (proving the loop closes); **(3) first "aha"** — it reuses **`/synaptic-handover`**
  over the day-1 content to show a starter vacation-handover-shaped brief (seeding the handover
  feature). **Non-technical-friendly** (plain guided prompts, no harness/Node/CLI vocabulary; links to
  `docs/FOR-MANAGERS-AND-POS.md`), **zero-runtime / files-first** (read/grep + one file write), and
  **OPTIONAL** — offered on a fresh brain, skippable, passes the Simplicity Guardrail (an offered path,
  never a gate). `/synaptic-init` now OFFERS it after wiring; added to the Operations table and
  `MANIFEST.txt`.
- **REACH model + always-run host-setup detection (`/synaptic-init` + every `/synaptic-upgrade`).** The
  skill now **actively DETECTS where + how the brain + harness are wired** (project-local vs
  user-level/global) and **re-deploys the correct wiring** — never silently assuming a repo-local
  `.synaptic/`. It emits a one-line classification (brain location · host · wiring level), flags the
  **MISCONFIGURED-global** case (brain reachable at a global root but wired only in one folder — the
  classic "covers only one folder" symptom) with an offer to promote wiring to user level, reports a
  **broken/unreachable** pointer instead of treating it as "no brain", and — even on the **light
  already-schema-`1.0`** path — **re-asserts a global brain's user-level wiring**. The user-level bridge
  carries the brain's **absolute** pointer **and the skill's absolute path** so a host that does not
  discover user-level skill dirs can still load the skill by reading the bridge (grep-recoverable). New
  `SKILL.md` "Host-setup detection" section + a v1.4.0 addendum in `references/upgrade-to-v1.md`.
- **Guided user-global setup branch in `/synaptic-init` (Round 0.5 — topology).** Asks "one folder or
  several?"; **several → user-global reach is the default** (pick a global root, generate, wire the
  bridge + rules + hooks + skill at USER level with the absolute-pointer/absolute-skill-path discipline,
  record + report). Includes the **nesting setup-check** (warn-don't-guard: don't create a second brain
  inside a global brain's coverage — advisory, never a hard block) and the **confidentiality control**
  stated plainly: a user-global brain activates on all your work (multi-client is fine — it is your own
  memory); the one control is **never commit or sync the brain into a repo**.
- **Convert a project brain → user-global (`references/convert-to-global.md`).** A guided runbook with
  two sub-cases — **(a) re-wire only** (bridge moves to user level, brain folder stays put — the common,
  lowest-risk path) and **(b) relocate** (also physically move `.synaptic/` to an OS-default root: Win
  `C:/Users/<user>/.synaptic`, *nix/mac `~/.synaptic`). Crash-safe **copy-verify-then-remove** ordering
  (never move-then-rewrite) with a **`convert_in_progress` marker** for deterministic resume/rollback,
  byte-complete backup + content-conservation **+ on-disk hydration** check, a `pre-global` git tag **on
  a brain-ONLY repo**, second-folder resolution verified **before** any old-side removal, and leak-rule
  cleanup that strips the project bridge/rules from **ALL** carriers (not just `AGENTS.md`). First-class
  **STOP** when the brain is already committed inside a **shared work repo** (git-history leak grep;
  history rewrite is out of scope and needs a human decision). Refined **leak rule**: a private/global
  brain is never committed **or synced** into a foreign repo ("synced" = under OneDrive/DFS even if never
  committed); a project-scoped brain in its **own** repo is fine.
- **Command discoverability (`references/command-discovery.md`).** A layered design: **Layer 1** lists
  every `/synaptic-*` command with a one-line description in the bridge/`AGENTS.md` — the universal floor
  that works on any host with no menu (descriptions **derived from each `references/<cmd>.md` summary**,
  regenerated on every deploy, single-source). **Layer 2** generates per-host `/`-menu **stubs** (Claude
  Code `~/.claude/commands/*.md`, Copilot `*.prompt.md`, Cursor prompt files) as thin **pointer files
  (NOT symlinks** — fragile on Windows/OneDrive), each carrying a
  `generated-from: synaptic-skill@<version> <hash>` provenance line. `/synaptic-upgrade` runs a
  **stub-drift check** (report added/removed/renamed → regenerate + **prune** stale stubs, clean OneDrive
  KFM `*-DESKTOP-*` conflict copies). Because stubs live **outside** the brain, `harness/setup/<host>.md`
  records the **stub set + placement dir(s) + generating version** as the only inventory; cleanup on
  uninstall and on convert-to-global reads that record.
- **Capture-INDEPENDENT SessionStart heartbeat + capture-yield audit.** `SessionStart` now appends a
  one-line **boot heartbeat** to `journal/` as its **first** action (before the rescue detect), decoupled
  from capture, so boots are counted even when nothing else is captured. `/synaptic-audit` gains a
  **capture-yield** advisory (breadcrumbs-per-session, nodes-per-week, %-meaningful-captured — computed
  from files) that distinguishes **`not-used`** (0 boots — benign, no advisory) from
  **`used-but-capture-dead`** (boots present, 0 captured → a distinct **"hooks-appear-dead"** advisory
  pointing to the per-host hook smoke-test). Bias-check notes the %-meaningful metric is
  **non-comparable across hosts**; prefer the two robust counts. Advisory / non-gating (C1 exit-0). *(The
  heartbeat's actual firing is author-complete; verify on a real Robinson run.)*
- **Structured session-summary capture protocol + anti-verbosity discipline for the file-journal**
  (inspired by Engram-class memory-log protocols; fully file-based, zero-runtime). At a
  session/context boundary the agent writes a **short STRUCTURED summary** — Goal/Discoveries/
  Accomplished/Next-Steps/Files-touched, mapped onto the journal's existing Resume Anchor · Watch List ·
  Log sections — so what survives a context loss is a legible handoff, not a raw scroll. Standing
  **anti-verbosity** rules: concise summaries never "bibles"; **dedup** (don't repeat a recorded
  breadcrumb); **don't journal what already lives durably in the wiki** (breadcrumb a pointer, not node
  contents); **prune/expire** consumed/stale breadcrumbs on `/synaptic-consolidate` (the journal is
  bounded working-memory, ≤ 80 lines, not append-forever). `/synaptic-consolidate` distills the
  structured summaries into durable knowledge and prunes the consumed breadcrumbs (retention→structure
  transform); `/synaptic-audit`'s capture-yield check reads for the **structured shape**, not merely
  any text. This is the **CORE floor** (no SQLite, no MCP, no Engram dependency); a future Cortex-mode
  Engram MemoryLog backend (v2.0) would supersede the file-journal where a runtime is present, but this
  protocol stands on its own with zero runtime. Documented in `SKILL.md` §d, the `journal/_current.md`
  template, `references/consolidate.md` (Journal Breadcrumb Contract + Journal Trim), and
  `references/audit.md` (capture-yield).

### Changed

- **`status` vs `lifecycle` handling clarified across consolidate + audit.** Only **`lifecycle`** scopes
  the **default working set**; **`status` NEVER causes omission** (a stale-but-relevant node is **flagged
  `⚠ stale`, not hidden**). The `lifecycle: dormant` scoping applies to the **default load ONLY** —
  `/synaptic-handover` and `/synaptic-audit` read **ALL statuses and ALL lifecycles**. Field semantics:
  `status` stays **REQUIRED** on knowledge/registries nodes (a missing `status:` is a `check.js` ERROR);
  `lifecycle` is **OPTIONAL**, absent → `area` (benign). An **unknown/mistyped `status` value** reads as
  **`untriaged`** (neither trusted-current nor stale; never silently promoted to `active`).
  `/synaptic-audit` gains a **typo advisory** (WARN,
  non-gating) that flags any `status:`/`lifecycle:` value outside the allowed lowercase token set so a
  hand-edit typo surfaces instead of failing open. `SKILL.md` Detect-on-Load documents the REACH model;
  the Harness Self-Wire §a global/seat pointer note now mandates the **absolute skill path** in the
  bridge and forbids symlinks on Windows/OneDrive (emit a pointer file instead).

## [1.3.0] - 2026-07-02

> **One combined release.** This single MINOR (`1.3.0`) folds the migration-&-upgrade-hardening work
> (originally scoped as a standalone PATCH `v1.2.1`) together with the additive structural
> improvements. `v1.2.1` is **not released standalone** — its entries ship inside 1.3.0 under the
> labeled sub-group below. The brain **schema is unchanged (still 1.0)**; no `/synaptic-upgrade` is
> needed to adopt this release — reinstall the skill for the new engine behavior.

---

### Migration & upgrade hardening (originally scoped as v1.2.1) · [C1..C7]

- **[C1] Retrieval-readiness report + structural≠retrieval caveat.** `tools/check.js` now prints a
  retrieval-readiness summary (nodes, edges, clusters, orphans, edges/node, MOC-reachable) computed
  over the one canonical knowledge-scoped, MOC-excluded, undirected-deduped edge/degree universe
  (new `tools/lib/brain-graph.js`, shared verbatim with `tools/graph.js` and the audit heuristics so
  the tools can never disagree on topology). When the brain is structurally clean (0 errors) yet a
  connectivity heuristic trips (orphan ratio > 20% OR edges/node < 0.5), it prints an **advisory
  CAVEAT** — *structural-green ≠ retrieval-green* — that **never changes the exit code**.
- **[C2] Flag non-live artifacts in `knowledge/`; `audits/` exclusion.** `tools/check.js` gains a
  fence-aware non-live-artifact check: an **ERROR** only for exact-name / path-segment leaks
  (`MIGRATION_DONE.md` inside `knowledge/`, a `_migration-staging/` path segment leaked inside
  `knowledge/`), and **WARN**-only fuzzy heuristics (surviving prose carrying a `{{...}}` placeholder;
  a filename matching a closed-audit-report pattern). `audits/` is wired into both the exclusion set
  and the link index. `playgrounds/` and `_migration-staging/` are treated as brain-root siblings of
  `knowledge/`, never children.
- **[C3] `lint: allow-large` suppresses the soft-budget WARN.** A node may carry `lint: allow-large`
  (scalar or list form) to opt out of the soft size-budget WARN while `type: reference` continues to
  suppress it — decoupling the budget policy from the node type.
- **[C4] Per-phase `MIGRATION_DONE` gate + mandatory retrieval drill + one-commit-per-phase.** The
  v0.3→v1 upgrade now closes each phase against a binary checklist artifact — a new
  `templates/MIGRATION_DONE.md` (Phase M / C / V boxes, added to `MANIFEST.txt`) that lives at the
  **brain root or `_migration-staging/`, never in `knowledge/`** (a `MIGRATION_DONE.md` under
  `knowledge/` is a `check.js` ERROR). A phase is DONE only when every box under it is checked.
  Phase V adds a **mandatory retrieval drill** with a deterministic question-selection recipe (3
  most-linked nodes + 2 registry lookups + 1 cross-cluster synthesis, answered by MOC navigation
  only) and a binary pass bar (all 5 fact-lookups via navigation, 0 grep-fallbacks; the synthesis
  question may miss as a `/synaptic-weave` gap) — because **`check.js` green is necessary but NOT
  sufficient** (structural-green ≠ retrieval-green). The upgrade runbook now prescribes **≥3 distinct,
  named, independently-revertible commits** on the upgrade branch — `migrate: Phase M …` (check.js may
  still error), `refactor: Phase C …` (check.js at 0 errors), `chore: cleanup + cutover …` — each
  passing `check.js` before the next begins, with the commit hash recorded per phase in the ledger.
  No step says "commit everything at the end." The AGENT runbook and `references/upgrade-to-v1.md`
  mirror the drill and the gate.
- **[C5] Git fast-forward cutover (Windows/OneDrive-safe) + guided-default mode + owner orientation.**
  The v0.3→v1 upgrade now leads its cutover with `git switch main && git merge --ff-only
  <upgrade-branch>` — files rewritten in place, no live-folder rename — with the folder rename/swap
  demoted to a **non-git fallback** and an explicit Windows/OneDrive lock/half-move/conflict-copy
  warning; if `--ff-only` refuses, that surfaces concurrent writers and routes to the shared-brain
  freeze path. A git worktree is noted as the safe way to build the v1 copy. ROLLBACK is reconciled to
  match: a git brain rolls back via git (reset to / forward-revert the `pre-v1` tag), the rename is
  the non-git path only. A **"Mode: guided (default) vs interactive"** callout enumerates the ONLY
  questions guided mode may ask (topology intake, any deletion, private-vs-shared, cutover ack) and
  states that guided vs interactive changes **verbosity, NOT the safety gates** (conservation gate,
  no-silent-deletion ledger, and Phase V drill run identically in every mode). Step 9 gains an
  owner-facing "how to use your new brain" orientation plus a soak/cleanup checklist.
  `references/upgrade-to-v1.md` mirrors the FF cutover, the mode definition, and the worktree note.
- **[C6] CORE breadcrumb instruction robust when hooks are absent (issue #2).** The per-turn journal
  breadcrumb is now stated as an **instruction the agent follows, not only a hook** — the floor
  underneath the automation, so a session that reaches compaction is **never breadcrumb-empty** (the
  issue #2 failure mode: a session neared recompact with no breadcrumbs written). `templates/BRAIN.md`
  Capture Contract names the failure mode and instructs "append the breadcrumb per meaningful turn
  yourself; the `Stop` hook automates it where wired, but write it even when no hook fires — nothing
  fires without you acting, there is no idle daemon." `references/consolidate.md` "Journal Breadcrumb
  Contract" mirrors the instruction-first framing and adds a **provisional note** — the per-turn
  breadcrumb is a **token-optimization to revisit** when a Cortex T2 Engram-style FTS journal lands
  (cross-links `ROADMAP.md` → "Engram-style searchable journal — Cortex"), never a CORE dependency.
  `SKILL.md` §d adds a **per-host degradation floor** (Claude Code / Copilot / Codex / Cursor / Gemini)
  spelling out the **instruction-only breadcrumbs + manual `/synaptic-consolidate`** fallback when a
  host has no usable hooks, plus a **"PreCompact not fired? SessionStart-rescue is the net"**
  cross-reference. Reconciled with the honest-limits section (no native idle detection / never an
  unattended idle daemon at CORE). The size-locked `BEGIN:SYNAPTIC` bridge block is left
  **byte-for-byte untouched** (the instruction already lives in CORE via `BRAIN.md`; per the adversarial
  council, the strengthening was retargeted off the bridge).
- **[C7] Tooling / environment notes + deletion ledger as a standing rule.** The AGENT runbook gains a
  "Tooling / environment notes" appendix framing four host quirks as **ENV diagnostics, not Synaptic
  rules**: Git Bash has no `rg` (use `grep -rn` / `git grep` / the agent's search — every grep-style
  instruction stays portable); `apply_patch` / VS Code fs write failures fall back to direct writes;
  OneDrive/Dropbox locks -> move to a local path (cross-links the Step 2 SYNC GUARD and the FF-cutover
  rationale); and PowerShell `Get-Content`/`WriteAllText` round-trips **corrupt non-ASCII** (em-dash,
  arrows, curly quotes) -> prefer UTF-8-aware writes and keep tool source ASCII-safe. The
  **deletion/move/archive ledger is promoted to a STANDING rule** (not migration-only): a one-line note
  (*what, why, loser->winner or destination, recoverable-via-git; git is the archive*) is added to
  `references/consolidate.md`, `references/maintain.md`, and `references/weave.md`, matching the
  discipline `references/upgrade-to-v1.md` already uses.

### Structural improvements · [§1..§5]

- **[§1] PARA lifecycle axis (optional, backward-compatible).** Knowledge nodes MAY carry one optional
  frontmatter field — `lifecycle: project | area | resource | dormant` — an **actionability** axis
  that is **orthogonal to the editorial `status: active | stale | archived`** field (the enums share
  no token — `dormant` deliberately differs from `archived` to prevent cross-field bleed). It scopes
  the active working set: **`project` + `area` + (absent → area)** load by default; **`resource` +
  `dormant`** are lazy-pull. Absence is legal and behaves exactly as a pre-v1.3.0 node (loads by
  default), so **no schema bump** and a v1.2.0 / skill-less agent simply ignores the unknown key.
  Demotion is **archive-don't-delete**: flip `lifecycle: dormant` (a reversible cooling that keeps
  the file, its `_index.md` entry, and its edges intact — **decoupled from `status`**; do not also
  set `status: archived`); promotion is a single-field flip back. `project` is a *lifecycle* value,
  **not a new `type:` token** (the `type:` enum is unchanged); a `project` node should link OUT to a
  durable `area`/`resource` node. Documented across the node template (commented-out block),
  `SKILL.md` (new "Lifecycle axis" section), `references/consolidate.md` (Step 4 + a `status`-vs-
  `lifecycle` orthogonality table with the `status: active` + `lifecycle: dormant` example),
  `references/audit.md` (a WARN completion-cadence pass: `project` quiet > 60d / `area` quiet > 90d,
  and an explicit note that `dormant`/`resource` are NOT orphans), and `BRAIN.md`. `tools/check.js`
  adds an advisory WARN when a present `lifecycle:` value is out of enum — never required, never an
  ERROR.
- **[§2] Interactive force-directed `graph.html` (replaces the static viz).** `tools/graph.js` is
  rewritten to emit a **single self-contained, zero-network HTML file** (inline CSS + a
  deterministic force-directed simulation seeded from node count) — no CDN, no `<script src>`, no
  fetch. It is **typed-edge aware** (colours/dashes per edge kind) with cluster/edge-type/lifecycle
  filters, search, pan/zoom, and expand/collapse hubs. The graph shares the exact same
  `buildBrainGraph` universe as `check.js` (edge parity guaranteed by construction), and node
  ids/labels/tags reach the DOM only via safe sinks (`textContent`/`setAttribute`), with the embedded
  `DATA` payload escaped so a filename containing `</script>` can't break out of the inline script.
  Force-directed layout + MIT/Graphify attribution lines carried in `tools/README.md`. `--format` is
  swallowed for CLI back-compat; an empty brain renders a graceful empty state.
- **[§3] God-node / surprising-edge audit heuristics.** `/synaptic-audit` gains two diagnose-only
  graph-health passes (prose-CORE, WARN, no runtime required): a **god-node** check that flags an
  over-connected hub (edge degree ≥ 15, or ≥ 3× the brain's median node degree — whichever is lower)
  as a candidate to split into atomic sub-nodes or confirm as a legitimate hub, and a
  **surprising-edge** check that lists authored edges whose endpoints live in different top-level
  `knowledge/` clusters (the high-value multi-hop links embeddings can't infer) for the owner to
  confirm or correct. Both route to `/synaptic-weave`, make no auto-discovery claim (edges are
  authored, never inferred), and compute "degree" over the same knowledge-scoped, MOC-excluded,
  undirected-deduped edge universe as `tools/check.js` / `tools/graph.js`. `check.js` additionally
  emits both as advisory WARN-class counts when the brain is otherwise clean — never an ERROR, never
  a gate.
- **[§4] Local-vs-remote data-boundary governance doc.** New `docs/concepts/local-vs-remote-boundary.md`
  (linked from the concepts `_index.md`) draws the explicit line between what stays 100% local and
  what — if anything — leaves the machine: a four-layer boundary table (CORE files / TOOLS / host
  LLM / future Cortex), the reusable governance one-liner, the "only one egress point" argument (the
  host LLM's context is the sole boundary, governed by the host's policy, not ours — Synaptic adds no
  server, DB, telemetry, or new network boundary), regulated-enterprise applicability (locked-down
  laptop, auditable by inspection, no platform rollout), an honest Cognee contrast framed
  community-over-combat (opaque runtime vs inert auditable files, no overclaim), and an honest-limits
  section stating plainly that Synaptic adds no new egress but does **not** police it — access control
  is the host's and filesystem's job. Client-agnostic ("a regulated enterprise client").
- **[§5] Verb-contract note (memify deferred to P4, gated on usage signal).** New
  `docs/concepts/verb-contract.md` (linked from the concepts `_index.md`) maps our authored verbs
  (`consolidate` / `weave` / `synthesize` / `maintain`) against Cognee's (`add` / `cognify` /
  `memify` / `search`) and records the sharpened conclusion: **`memify` is NOT a separate CORE verb —
  it overlaps weave+maintain; the only genuinely new part (usage-reweighting) needs a usage log CORE
  lacks, so it is deferred to Phase 4 gated on a usage signal.** The note makes no present-tense
  self-improvement / usage-weighting claim — usage-weighted self-improvement is framed as a P4
  direction only, keeping the four-verb contract crisp and non-overlapping.

## v1.2.0 — Upgrade path + seat brains · 2026-06-26

> **Bring your v0.3 brain to v1, and run one brain per workspace.** This release adds the full v0.3→v1
> upgrade path (a paste-to-agent runbook + a hardened skill-side procedure), first-class support for a
> **seat / global brain** that serves a whole workspace of repos (the skill now resolves the brain via
> its `BEGIN:SYNAPTIC` bridge pointer and stays silent when a brain is already wired, so a sibling-repo
> CWD never spawns a competing nested brain), and the zero-tooling three-tier install. The brain
> **schema is unchanged (still 1.0)** — an existing v1 brain has nothing to migrate; just reinstall the
> skill to get the new behavior. Only a **v0.3 brain** runs `/synaptic-upgrade`.

### Added
- **Three-tier install.** Pick the path that fits the machine:
  - **Agent self-install (zero tooling).** A short bootstrap header at the top of `SKILL.md`, paired with a `MANIFEST.txt` listing every file in the bundle, lets a coding agent fetch and install the whole skill on a clean machine — no Node, no clone, no package manager. Point an agent at the skill, it reads the manifest and pulls the rest. The skill engine version bumps to 1.1.0, so existing installs reinstall the updated skill on the next harness wire.
  - **`npx degit` one-liner.** A single copy-paste command that pulls the skill folder for anyone who already has Node.
  - **Manual folder-copy fallback.** Copy the skill folder by hand — the always-works path, no toolchain required.
- **First-run orientation in `/synaptic-init`.** A light, optional walkthrough on first run so a newcomer sees what was created and what to do next, instead of a bare prompt.
- **Agent-paste upgrade runbook (`docs/UPGRADE-v0.3-to-v1.AGENT.md`).** The operational companion to the narrative `UPGRADE-v0.3-to-v1.md`: a self-contained block you paste to your agent that drives a v0.3→v1 upgrade end to end — no-clone skill bootstrap + tools fetch, topology intake, verified git+backup safeguard, Phase M/C/V with `[needs Node]`/`[no Node]` tags, **global/shared multi-repo harness wiring**, a **freeze + delta-reconcile + atomic cutover** for team-shared brains, an optional full audit/refactor sweep, and a before/after report. Each step says whether Node is required.
- **Shared / global brain guidance.** The upgrade procedure (`references/upgrade-to-v1.md`) gains a hardening addendum covering the multi-repo case (one `.synaptic/` serving many sibling repos): preferring a single user-level pointer (per-repo only as a fallback), a re-pointed brain pointer, and the skill's shipped Detect-on-Load "stay silent when a bridge is present" behavior so a wired repo never offers to create a competing nested brain.
- **Seat / global brain support in the skill.** `SKILL.md` Detect-on-Load now **resolves the brain via the `BEGIN:SYNAPTIC` bridge pointer** (not only a CWD-relative `.synaptic/`) and **stays silent — never offers onboarding — when a bridge is present**, so one brain can serve a workspace holding many repos and a sibling-repo CWD no longer spawns a competing nested brain. Harness Self-Wire gains optional **command-discoverability stubs** (thin per-command files that surface `/synaptic-*` in the host's slash menu and point to the skill reference — e.g. VS Code Copilot `*.prompt.md`) and a **`harness/setup/<host>.md` wiring record** the agent writes (re-deploy recipe across machines; travels in the backup).

### Changed
- **README restructured for newcomers.** The landing is now lean and front-loaded: install, a first-5-minutes path, and the commercial rationale — in that order. The deep conceptual material (typed graph, capture contract, layering, honesty lines) moved into `docs/concepts/`, fronted by an `_index` map-of-content and wired with relative links so nothing is lost — it is one click away instead of in your face.
- **Acknowledgments expanded.** Credit broadened to the peers and prior art studied while building this — the Karpathy LLM-wiki gist, ScrapingArt, `shannhk/llm-wikid`, `nvk/llm-wiki`, Basic Memory, and `claude-obsidian` — plus a "validated pattern" references block grouping the proven ideas the design draws on.

### Fixed
- **Install instructions corrected.** The quick-start previously implied you copy only `SKILL.md`. The skill needs its **whole folder** (`references/` + `templates/`) to function — the install steps now say so on every path.
- **Genericized a client-specific governance phrase.** A governance wording in the README and the node template's provenance note is now generic enterprise language ("the governance argument" / "regulated and audit-sensitive work"). The public repo stays client-agnostic.
- **Audit excludes scaffolding from link checks.** `/synaptic-audit` (and `tools/check.js`) now exclude `templates/` and `references/raw/` from the broken-link and cross-link-coverage checks — those directories hold placeholder example wikilinks (`[[target]]`, `[[x]]`) and verbatim captured payloads (scaffolding, not authored edges), which the first dogfood audit false-flagged as "broken."
- **Broken rollback command in the upgrade docs.** The narrative previously suggested `git checkout .synaptic-v0.3-backup` for rollback — that restores a path into the working tree, it does not swap the backup folder back. Corrected to the reliable rename (delete the v1 brain, rename `*-v0.3-backup` back), with the git path being a *forward* "revert to `pre-v1` tag", never a force-push/reset on a shared remote.
- **Upgrade safety, hardened.** The procedure addendum replaces the logically-broken "v1 node count ≥ v0.3 count" no-loss check with a **content-conservation manifest** (every pre-migration node must end up present, logged-merged, or logged-split); keeps `_migration-staging/` until **after** Phase V + a soak (was deleted at the end of Phase C, before verification); makes deletions explicit (ledger, never silent); makes `description:` extractive and defers the "Generalize" prose-rewrite (avoids fact-invention); and adds a verified git+backup gate plus a OneDrive/sync guard.
- **Operating rules out of `BRAIN.md`, into the harness (resolved the Top-Guardrails inconsistency).** `templates/BRAIN.md` no longer ships a `## Top Guardrails` block, and `harness/conventions.md`/`guardrails.md` no longer instruct mirroring rules into it. Conventions + guardrails stay the brain's source in `harness/` but are **deployed into the harnessing / system prompt (symlink preferred over copy)** — read from the brain only when edited or to verify sync, never at session start. The upgrade runbook now **detects the existing harness wiring** (VS Code Copilot chatmode + `applyTo:**/*` instructions, AGENTS.md, Cursor rules), backs it up, and for a global/seat brain prefers a **single user-level pointer** over per-repo edits (keeps work repos clean of brain references). The team-shared freeze/reconcile is now scoped to genuinely-shared brains; a private per-user seat brain takes the simple swap.

## v1.1.0 — "AI Brain, on a dial" · 2026-06-21

> **The brain you already have — now relational, auditable, and self-improving *as you work*, with nothing new to install.** The biggest release since v1.0: a typed knowledge graph, provenance you can audit, a capture mechanism that keeps up while you work, and a sharper story — all on the same zero-runtime files you already own.
>
> The v1.1 line keeps the unchanged CORE floor (pure Markdown/YAML, zero-runtime, files-authoritative,
> persona-out, MOC-of-MOCs, anti-RAG default, MIT) and grows positioning, capture, and the typed
> knowledge graph on top of it. Every change below is additive and backward-compatible; additive
> frontmatter does **not** bump the brain schema version.

### Positioning / commercial
- **"AI Brain" category + "Create your own AI Brain"** front and centre, with the humility framing
  ("an industry pattern given a direction").
- **New positioning line:** *"a way of working with your agents that turns your daily work into
  structured instructions and documentation that makes you more effective."*
- **CORE-only pitch:** you don't install software — you teach your agent a way of working (one skill =
  markdown it reads); knowledge accrues as plain `.md` files you own; no server/DB/runtime; **copy one
  folder and you have the whole CORE.**
- **RAG vs plain wiki vs AI Brain** comparison moved up front (stateless · inert · improves-itself-as-
  you-work-within-bounded-reversible-limits / compounds; Karpathy "only key, distilled info in the
  window").
- **Self-improving, honestly:** the claim now always carries the **bounded, reversible** qualifier —
  improves itself **as you work, within bounded reversible limits**; never an unattended autonomous
  rewriter. Banned phrase *"fill gaps from the session log"* **purged** → "capture decisions explicitly
  stated in the session."
- **Auto-notes objection FAQ** added: this is structure + patterns + curation (capture-with-intention →
  consolidate into linked atomic notes, lessons, playbooks), **not** passive meeting summaries.
- **Three intents documented as MOC lenses** (personal / the seat / department) over the same nodes —
  **recommend starting with the seat.** The **public-brain pattern is rejected** for any client-facing material (private/access-controlled only; generic-with-caveat elsewhere).

### Capture (the dial)
- **Capture reframed as a dial:** lead with **passivity-as-a-dial**, then the honest manual trade.
  Two **orthogonal** axes — the **passivity dial** (when capture triggers: manual ↔ event-driven hooks
  ↔ where-supported automation) and **`capture_policy`** (how much reaches the wiki).
- **`capture_policy` presets renamed:** `curated | balanced | logbook` → **`selective | balanced |
  capture-all`** (same formula, six steps; promotion threshold only).
- **Always-on journal breadcrumb floor:** a terse one-line `Stop` breadcrumb per meaningful turn, fixed
  cost, surviving crashes — **not** governed by `capture_policy`. Honest limit stated: **no agent has
  native idle detection**; "passive" = event-driven on hook-capable hosts + the journal fallback +
  next-session rescue, not an unattended daemon.
- **Hooks are CORE** (host-run config the agent already executes), not a runtime we ship.

### Architecture / layering
- **Single source of truth — no `seed/`.** The skill bundle's `templates/` are the one source; the
  example brain is **assembled on demand**. All `seed/` references removed; the install entry is
  "install the skill."
- **MCP = Cortex** (a tool over the files), not Ecosystem/horizon. The CORE/Cortex line is never drawn
  at with/without MCP.
- **Engram = optional searchable journal layer** (SQLite/FTS5) — never a graph refiner, never rewrites
  pages. **Vector/semantic search = horizon Cortex** ("the direction"; no auto-discovery-of-links claim).
- **Canvas dropped from v1 entirely** (not even later-polish).

### Upgrading — quick, non-destructive, honestly a pleasure

**Your data is safe on every path** — you work on a copy and switch only when you're happy.

- **From v0.3.x →** run `/synaptic-upgrade`, or follow the supervised runbook [`docs/UPGRADE-v0.3-to-v1.md`](docs/UPGRADE-v0.3-to-v1.md). It restructures **on a copy** (Phase M mechanical → Phase C agent re-file → Phase V verify: counts, links, MOC coverage), and you replace the original only once it is green. Worst case, you keep your old brain.
- **Already on v1 (v1.0.0+) →** there is nothing to migrate — the schema is unchanged (still `1.0`). Just reinstall/update the skill to engine `1.3.0` ([`standalone/synaptic/SKILL.md`](standalone/synaptic/SKILL.md)); everything v1.3.0 adds (optional PARA `lifecycle:` axis, interactive `graph.html`, god-node audit, hardened `check.js`) is additive and reversible. See the short feature-adoption guide [`docs/UPGRADE-v1.x-to-v1.3.0.md`](docs/UPGRADE-v1.x-to-v1.3.0.md). `/synaptic-upgrade` invoked on an already-`1.0` brain recognizes the current schema and refreshes the engine + offers PARA — it does **not** run a full migration. One optional, one-word touch if you skipped it earlier: rename your `capture_policy` value (`curated → selective`, `logbook → capture-all`).

Nothing to deploy, no server, no database — the upgrade is files in, files out.

## v1.0.0 — "LLM-wiki, grounded" · 2026-06-12

**The leap:** synaptic-core goes from a structured-notes convention (v0.3.x) to a **portable
knowledge-graph brain** — bounded navigation, a self-growing contribution formula, a clean
brain-vs-harness separation, safe migration, and zero-dependency tooling. The redesign was rebuilt and
validated against a **real ~60-file brain grown over months of delivery work**, not a toy fixture.

> One brain. Any agent. Zero install. It turns daily work into structured, navigable, agent-usable
> knowledge that any agent picks up in seconds and that travels with you.

### Why it matters
- **People** — a second brain for a role or your whole life: navigable, portable, yours.
- **Projects** — an agent onboards in seconds, no re-briefing; decisions, playbooks and lookups in one navigable graph.
- **Companies** — knowledge continuity across rotation; auditable; no platform rollout; works on a locked-down laptop.

### v0.3.x → v1.0 at a glance

| | v0.3.x | **v1.0** |
|---|---|---|
| **Boot** | eager multi-file load | **one file** (`BRAIN.md`), everything else on demand |
| **Navigation** | folder tree + a phantom-prone index | **MOC-of-MOCs** — `BRAIN → INDEX → cluster → the 1–2 nodes you need` |
| **Linking** | relative file paths | **`[[wikilinks]]`** (Obsidian/Foam/Logseq-native), backlinks by grep |
| **Knowledge units** | `areas`/`domains` overviews | **atomic nodes** + `registries/` (tabular lookups) + `references/` (verbatim, existence-indexed) |
| **Identity / persona** | mixed into the brain | **harness-clean** — knowledge in the brain, operating rules *deployed* to the harness, persona never in the brain |
| **Commands** | generic (`/init`, `/audit`…) — collide with other skills | **`/synaptic-*`** — no collisions, grouped in the agent selector |
| **Growth** | implicit, model-dependent | an **explicit 6-step consolidation formula** (agent-agnostic) + **`/synaptic-weave`** graph gardening |
| **Capture tuning** | fixed, one-size | **`capture_policy`** — `curated` · `balanced` · `logbook` *(renamed to `selective` · `balanced` · `capture-all` in v1 — see the v1 (next) entry above)*: same formula, tunable promotion threshold; the agent **offers to consolidate at session end** (discipline in the harness, not your head) |
| **Migration** | none | a **safe, two-engine `/synaptic-upgrade`** (mechanical pass + guided agent rearrange) — runs on a copy, content-preserving |
| **Tooling** | none | optional, zero-dep: `check` · `migrate` · `deploy` · `export` · `graph` · `vault-open` (CORE stays 0-install) |
| **Docs** | one long README | visual README + `PITCH.md` (exec + technical) + `ROADMAP.md` + 3 ADRs |

### Measured
On an internal benchmark over the real ~60-file brain (18 realistic questions, fresh-context agents
navigating the brain):
- **94%** of questions answered (17/18; 0 not-found);
- **17/18 resolved by the index hierarchy alone** — zero keyword/grep fallback;
- **median 4 file-reads** to an answer (a 3-file navigation baseline + the one node you need);
- **0 broken links**.

*Honest caveat: single run, 18 questions, author-adjacent topics, one scale point. This measures
retrieval **efficiency + coverage**, not ground-truth accuracy. The one miss was a cross-cluster
synthesis query — a content gap, not a navigation failure — exactly what `/synaptic-weave` is for.*

### How it works
`BRAIN.md` (the only boot read) → `knowledge/INDEX.md` (hub) → `{cluster}/_index.md` (sub-map, one
line per node) → open only the relevant node(s). Two planes: **wiki** (what you know) and **harness**
(how you work — deployed to your agent, not loaded from the brain). Persona stays in your harness.

### Migrating an existing brain — your data is safe
`/synaptic-upgrade` is **non-destructive** (it stages, never deletes; runs on a copy; the original is
git-versioned) and **content-preserving** (it re-files and re-links; it does not rewrite your facts).
Step-by-step runbook: [`docs/v1-upgrade-and-benchmark.md`](docs/v1-upgrade-and-benchmark.md). Worst case,
you keep your old brain.

### Honest notes
- The tools are zero-dep and **optional** — the CORE is pure files and works with no runtime. Their first
  real execution happens in your environment.
- The benchmark caveats above are real; treat the numbers as directional, not a paper.

### Foundations
See `PITCH.md` (the two-tier value + technical case, including the "Standing on" section mapping the
PKM / agent-skills techniques the design draws from), `ROADMAP.md` (Cortex horizon: MCP = Cortex,
vector/semantic search, shared/team brain, Engram-style searchable journal), and `docs/architecture/` (ADR-001 Minimal Cortex,
ADR-002 LLM-wiki-first, ADR-003 deploy-source + weave). The full technique-to-mechanism table —
Zettelkasten atomicity, MOC-of-MOCs, `[[wikilinks]]`, Karpathy LLM-wiki, Agent Skills progressive
disclosure, frontmatter metadata, consolidation protocol, files-authoritative governance, and the
GraphRAG / FTS5 horizon items — is documented in [`docs/concepts/architecture-matrioshka.md`](docs/concepts/architecture-matrioshka.md).
