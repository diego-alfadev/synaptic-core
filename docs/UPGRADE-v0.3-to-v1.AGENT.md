# Upgrade a Synaptic brain v0.3 → v1 — agent runbook (paste this whole file to your agent)

> **What this is.** The **operational** runbook: copy this entire file into your coding agent
> (Claude Code / VS Code Copilot / Cursor / Codex) on the machine where the brain lives, and let it
> drive the upgrade. For the human-readable narrative (what changes and why, reassurance, rollback in
> prose) read the companion **[UPGRADE-v0.3-to-v1.md](UPGRADE-v0.3-to-v1.md)** first. The
> skill-side procedure the agent executes lives in
> **`standalone/synaptic/references/upgrade-to-v1.md`** (it is fetched in Step 0).
>
> **Design stance (read before running).** This is **non-destructive and minimally-destructive by
> construction**: the work is mostly *refactor + construction* (re-file, re-link, add frontmatter).
> Deletions are **never silent** — every removal is surfaced and confirmed, and originals are kept in
> staging + a backup until you explicitly close out. It runs **on a copy**, it is **interactive**
> (it asks before any structural/breaking change), and it ends with a **report** that compares the
> brain **before vs after** against the backup. Treat it as a **supervised, resumable** first run —
> not a 10-minute job. Tokens are not the constraint; correctness is.
>
> **Node:** OPTIONAL. Each step is tagged **`[needs Node]`** or **`[no Node]`**. The Node steps are
> only accelerators (`tools/*.js`); their **`[no Node]`** fallback is always specified. If you have
> Node, use it for the mechanical steps and the checks; everything else is agent work either way.

---

## Paste-to-agent block

```
You are upgrading my Synaptic brain from schema v0.3 to v1. Follow this runbook top to bottom.
Work on a COPY. Be interactive: STOP and ask before any structural or breaking change, and never
delete anything silently. Keep a running DECISION LOG and a DELETIONS LEDGER from the first step.
At the end, produce the REPORT in Step 9. Do not rush — correctness over speed.

────────────────────────────────────────────────────────────────────────
STEP 0 — Get the v1 skill + tools into THIS environment   [no Node for the skill; tools need Node]
────────────────────────────────────────────────────────────────────────
The brain almost certainly does NOT have the v1 `synaptic` skill installed under .claude/skills or
.agents/skills, and even if a similarly-named skill exists it may be an old version. Do NOT trust an
existing skill copy — (re)install the current one first, because `/synaptic-upgrade` and its
procedure file come WITH the skill.

A) Install the skill (no clone needed — the agent self-installs from GitHub raw):
   1. RAW_BASE = https://raw.githubusercontent.com/diego-alfadev/synaptic-core/main/standalone/synaptic/
      (append a release tag instead of `main` to pin: .../synaptic-core/<tag>/standalone/synaptic/)
   2. Fetch ${RAW_BASE}MANIFEST.txt.
   3. For each path listed (trim whitespace/CR), fetch ${RAW_BASE}<path> and WRITE it to BOTH
      .claude/skills/synaptic/<path> AND .agents/skills/synaptic/<path> (create dirs as needed).
   4. VERIFY: count of files written == manifest entries; each file non-empty and does NOT start
      with "<!DOCTYPE" or "<html" (GitHub raw can return an HTML error page). Re-fetch failures once.
   5. The skill bundle now includes references/upgrade-to-v1.md — that is the procedure you execute.
   • If you CANNOT fetch URLs (no egress — common on locked corporate networks): do not improvise.
     Ask me to provide the skill bundle another way (a colleague's copy of standalone/synaptic/, a
     `degit diego-alfadev/synaptic-core` on a machine with egress, or a manual folder copy), then continue.
   • CONFIDENTIALITY: this only DOWNLOADS public skill code; it uploads nothing. Your brain content
     never leaves the machine. (If even outbound HTTPS to github is disallowed, use the manual copy.)

B) Get the Node tools (only if you intend to use Node — they are NOT in the skill manifest):
   Fetch each to a local tools/ dir from ${RAW_BASE%standalone/synaptic/}tools/ :
     migrate.js  check.js  deploy.js  graph.js  export.js
   (i.e. https://raw.githubusercontent.com/diego-alfadev/synaptic-core/main/tools/<name>.js)
   They are zero-dependency single files (Node >= 18). If you have no Node or no egress, skip this —
   every tool has a manual fallback in this runbook.

────────────────────────────────────────────────────────────────────────
STEP 1 — Intake: identify the brain and its topology (ASK me; do not assume)   [no Node]
────────────────────────────────────────────────────────────────────────
The MIGRATION itself (schema v0.3 → v1) does NOT depend on these answers — but the HARNESS WIRING
and the SAFETY/COORDINATION steps do. Ask me these, record answers in the DECISION LOG, and branch
the relevant later steps on them. Do not block the migration on them; block only the wiring/cutover.

  1. Brain location + scope. Where is the brain folder? Is it scoped to ONE project (a `.synaptic/`
     nested inside a repo) or is it a SHARED / GLOBAL brain (a `.synaptic/` that sits BESIDE several
     repos and serves all of them, e.g. <workspace-root>/.synaptic next to <workspace-root>/<repo-*>)?
     → If GLOBAL/shared, the harness wiring is multi-repo (Step 5B). If single-project, use Step 5A.
  2. Source confirm. Confirm v0.3: a `BOOTSTRAP.md` at the brain root, no `BRAIN.md`, no `version:`
     field. Inventory which of these actually exist (they are optional in v0.3):
     identity/HEARTBEAT.md, identity/ROLE.md, identity/PRINCIPLES.md, identity/CONTACTS.md,
     inventory/, worklines/, skills/, per-cluster _overview.md, and any brain-root context-prompt /
     bridge files (shared-context docs sitting next to BOOTSTRAP.md). List what's present — later
     steps act ONLY on files that exist (never stall on a missing optional file).
  3. Git + sync state. Is the brain folder tracked by git? Is it on a sync share (OneDrive / Dropbox /
     network drive)? (Both gate Step 2.)
  4. Private vs shared. Is this a PRIVATE per-user brain — one writer, one machine, often not even
     git-tracked (the TYPICAL "personal / seat / departmental" brain) — or a GENUINELY SHARED brain
     that several people write to concurrently? If shared, also: does it reach each person via one
     shared/network copy or N local copies? → A private brain takes the simple path (Step 7A: ~couple
     of hours, backup, done). A shared brain needs the freeze + delta-reconcile + atomic cutover (7B).
  5. Host + CURRENT harness wiring (DETECT it; do not assume single-project). Which host is used
     (VS Code Copilot / Claude Code / Cursor / Codex)? Then SCAN for the EXISTING wiring so you know
     the current→desired delta — search user-level AND workspace/repo locations for anything that
     mentions `.synaptic`, `BOOTSTRAP`, or a synaptic command: VS Code Copilot `*.chatmode.md` +
     `*.instructions.md` (a USER-LEVEL/profile instructions file applies across ALL workspaces; its
     `applyTo:` glob only scopes which files WITHIN a workspace it attaches to — globality comes from
     the user-level placement, not from `applyTo`), `.github/copilot-instructions.md` (Copilot also
     reads `AGENTS.md` natively), `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/*`.
     Record: which file the host actually READS, the brain pointer it uses, and every v0.x path/command
     it names (`BOOTSTRAP.md`, `HEARTBEAT.md`, `inventory/`, `identity/…`, `/plan` `/discover` `/help`)
     — those are rewritten in Step 5. For a global/seat brain, note whether wiring is USER-LEVEL
     (one file, applies everywhere — PREFERRED, keeps repos clean of brain refs) or per-repo, and what
     brain path resolves from a repo CWD (the fixed absolute brain path for a local per-user brain;
     `../.synaptic/` only if every repo is exactly one level under the brain's parent).

────────────────────────────────────────────────────────────────────────
STEP 2 — Safeguard: git baseline + verified backup (HARD GATE)   [no Node; uses git CLI]
────────────────────────────────────────────────────────────────────────
Do NOT touch the brain until BOTH of these exist and are verified.

  1. If the brain is NOT a git repo: initialize one AT THE BRAIN FOLDER (not the sibling repos, which
     have their own git): `git -C <brain> init && git -C <brain> add -A && git -C <brain> commit -m
     "pre-v1-upgrade snapshot"`. Then tag it: `git -C <brain> tag pre-v1`. If it IS already git, just
     commit any pending changes and tag `pre-v1`.
  2. Folder backup: copy the whole brain to a SIBLING `*-v0.3-backup` (e.g. `<brain>-v0.3-backup`).
     ALSO back up the EXISTING harness wiring found in Step 1.5 (the `*.chatmode.md` /
     `*.instructions.md` / AGENTS.md / copilot-instructions / `.cursor/rules` files) — the upgrade
     REWRITES them (their v0.x paths and command names change), so you need the originals to diff
     against and to roll back. Note their exact locations in the DECISION LOG.
  3. SYNC GUARD: if Step 1 said the folder is on OneDrive/Dropbox/network, MOVE the backup, the work
     copy, and all migration artifacts to a LOCAL, non-synced path first (or pause sync for the window).
     A sync client can create conflict copies or upload half-written files — your rollback backup must
     be byte-stable and confidential content must not be pushed to a cloud mid-write.
  4. VERIFY the backup is complete: compare file COUNT and total SIZE of the backup vs the live brain;
     they must match. Report both numbers. If they differ, STOP and re-copy.
  5. Make the working copy you will migrate: copy the brain to `./synaptic-v1-work/.synaptic`
     (a scratch location). From here, operate ONLY on the work copy. The live brain + backup are untouched.

  Report: git tag created, backup path + (file-count, size) parity, work-copy path. Only then proceed.

────────────────────────────────────────────────────────────────────────
STEP 3 — Phase M (mechanical, deterministic)   [needs Node for migrate.js; [no Node] fallback below]
────────────────────────────────────────────────────────────────────────
Phase M only MOVES files into the v1 layout and STAGES v0.x boot files — it deletes nothing.

  [needs Node]  node tools/migrate.js ./synaptic-v1-work/.synaptic --dry-run    (preview)
                node tools/migrate.js ./synaptic-v1-work/.synaptic              (apply)
                Pass the v1 templates dir as the 2nd arg to also copy templates:
                node tools/migrate.js ./synaptic-v1-work/.synaptic .claude/skills/synaptic/templates

  [no Node] fallback — do Phase M by hand exactly as references/upgrade-to-v1.md "Phase M" says:
    create the v1 dirs (registries/ harness/ harness/skills/ references/ references/raw/ playgrounds/
    templates/ _migration-staging/); MOVE (never delete) the v0.3 boot files into _migration-staging/
    (BOOTSTRAP.md, MANIFEST.md, identity/HEARTBEAT.md, knowledge/_tree.yaml), MOVE worklines/ and
    inventory/ into staging; M7 frontmatter scaffold; copy v1 templates. COLLISION RULE for manual
    moves: never overwrite a destination — if it exists, write `<name>.bak-N`.

  Report what moved. NOTHING is deleted in Phase M.

────────────────────────────────────────────────────────────────────────
STEP 4 — Phase C (content rearrange) — INTERACTIVE, RESUMABLE, NON-DESTRUCTIVE   [no Node]
────────────────────────────────────────────────────────────────────────
This is the "refactor" phase and the heart of the upgrade. Execute Phase C of
references/upgrade-to-v1.md, with these BINDING reinforcements (they close real failure modes):

  • CONTENT-CONSERVATION MANIFEST (do this FIRST, before editing). Snapshot every existing node as
    (path, title, sha256 of the body-minus-frontmatter). This is the no-loss ground truth — the file
    COUNT is only a smoke check (dedupe lowers it, splits raise it, so a count alone can hide a drop).
  • Work CLUSTER BY CLUSTER with a LEDGER (cluster | C3 links | C4 MOC | C5 consolidate | C11
    frontmatter | every-node-in-_index?). "Phase C complete" = all clusters ticked. This survives a
    context compaction or a multi-session run and stops a half-done pass being mistaken for done.
  • RE-FILE, DON'T REWRITE. Carry every node's body through verbatim. `description:` must be
    EXTRACTIVE (condense the node's own first sentence — never synthesize a new claim). `tags:` from a
    closed vocabulary (the cluster tag + existing topic tags). DEFER the C5 "Generalize" prose-rewrite
    to a later supervised consolidate — do not rewrite prose during the migration (it can silently
    drop a load-bearing caveat). Stamp `updated:` ONLY on nodes you actually rewrote this pass.
  • NO SILENT DELETIONS. Every merge (dedupe), split, or removal goes in the DELETIONS LEDGER with
    before/after, and is shown to me for confirmation. Before any dedupe merge, show BOTH nodes
    side-by-side. Knowledge deletion is HUMAN-ONLY.
  • WIKILINK IDENTITY. When converting `[text](path.md)` → `[[name]]`: first resolve duplicate
    basenames to unique kebab names and build a path→newname map; convert via the FULL path through
    the map; verify each `[[target]]` points to the SAME physical file the old relative path did
    (not merely "resolves to something"). Never create an unresolvable link — log it as a gap.
  • Route per references/upgrade-to-v1.md: identity/boot → BRAIN.md Context Capsule + Capture
    Contract; CONTACTS → knowledge/people-routing.md; PRINCIPLES/working-agreements → harness/
    conventions.md + guardrails.md; brain-root context/bridge files → extract knowledge, then MOVE
    originals to HARNESS_ORIGINALS/ (they are harness material); inventory/ → registries/; worklines/
    → playgrounds or your task system; skills/ → harness/skills/; rebuild knowledge/INDEX.md + each
    cluster _index.md from real files only; journal → thin 3-section format.
  • DO NOT delete _migration-staging/ here — keep it through Step 6 and the soak (Step 10). This
    OVERRIDES the referenced procedure's step C12 ("delete staging as the final step of Phase C") —
    do not act on C12; staging is removed only in Step 10.
  • BRAIN.md carries NO operating-rules block. Conventions + guardrails live in harness/ as the SOURCE
    and are DEPLOYED to the harnessing / system prompt in Step 5 (SYMLINK preferred over copy) — read
    from the brain only when edited or to verify sync, never at session start. Do not invent rules and
    do not add a "## Top Guardrails" block to BRAIN.md (the v1 templates no longer ship one).

────────────────────────────────────────────────────────────────────────
STEP 5 — Harness wiring (DETECT current → deploy desired)   [no Node]
────────────────────────────────────────────────────────────────────────
First fill the shared harness source fully: populate harness/conventions.md + harness/guardrails.md
with NO {{placeholder}} tokens (any placeholder makes the deploy refuse). These are the SOURCE; they
are DEPLOYED into the harnessing / system prompt (SYMLINK preferred over copy) and read from the brain
only when edited / to verify sync — never at session start.

5.0 — DETECT current → desired (from Step 1.5) before changing anything. You have the inventory of the
existing harness files and the v0.x paths/commands they reference. The delta: the v0.3 bridge points at
BOOTSTRAP.md / HEARTBEAT.md / inventory/ / identity/ and lists v0.x commands; the v1 bridge points at
BRAIN.md / knowledge/INDEX.md / registries/ and lists /synaptic-* commands, and DROPS the "re-read
HEARTBEAT every N turns" anti-drift (v1 boots from BRAIN.md). Originals are backed up (Step 2.2).

5A — SINGLE-PROJECT brain (.synaptic nested inside the one repo):
   • Run the skill's Harness Self-Wire (SKILL.md §a–c) on the project root: write the BEGIN:SYNAPTIC
     bridge block + the BEGIN:SYNAPTIC-RULES block into the project root AGENTS.md (or, with Node:
     `node tools/deploy.js <project-root>` for the RULES block — it backs up AGENTS.md, diffs, and
     refuses on placeholders). Remove the old v0.3 bridge fragments.

5B — GLOBAL / SEAT brain (.synaptic beside many repos — typically a PRIVATE per-user brain):
   CURRENT SITUATION: the v1 skill's Detect-on-Load now RESOLVES the bridge pointer and STAYS SILENT
   when a `BEGIN:SYNAPTIC` bridge is present — so a sibling-repo CWD with no local `.synaptic/` no longer
   offers onboarding / risks a competing brain (no manual patch needed). What still needs doing by hand:
   the default bridge text hardcodes `.synaptic/` and `deploy.js` writes one <project-root>/AGENTS.md, so
   the WIRING below is manual.

   Wire by HOST, and PREFER ONE USER-LEVEL pointer that applies across all repos — this keeps the
   repos themselves CLEAN of brain references (important when repo files are committed to a shared
   remote; a private brain must never leak into a work repo):

   • VS Code Copilot (the common case): the wiring is a USER-LEVEL / profile instructions file (which
     applies across ALL workspaces) plus the chatmode file — NOT per-repo committed files. Set
     `applyTo: "**/*"` INSIDE it so it attaches to every file within each workspace; globality itself
     comes from the user-level PLACEMENT, not from `applyTo`. Keep BOTH the pointer and the rules
     content user-level — never write either into a committed work repo.
     Rewrite the detected v0.3 bridge to v1: point at BRAIN.md / knowledge/INDEX.md / registries/
     (not BOOTSTRAP/HEARTBEAT/inventory/identity), list the /synaptic-* commands, drop the HEARTBEAT
     re-read. Point at the brain by its FIXED path — the ABSOLUTE local brain path is fine for a
     per-user brain (cross-machine portability is moot, each user has their own); `../.synaptic/` only
     if the workspace root is the brain's parent. Make conventions+guardrails the always-on rules by
     SYMLINKING the harness/ source into the instructions location where the host allows it (else emit
     the block and note the source). Keep the brain LOCAL — never commit Synaptic refs into the repos.
   • AGENTS.md hosts: one AGENTS.md at the shared workspace root if the host climbs to it; else a
     marker-wrapped BEGIN:SYNAPTIC + BEGIN:SYNAPTIC-RULES block per repo (re-pointed brain path; old
     v0.3 fragment removed in the same edit). Cursor: `.cursor/rules/*`. Per-repo wiring is only needed
     here — and for a genuinely SHARED brain, route each repo edit through its PR flow and track a
     wiring matrix (repo | host-read file | bridge re-pointed | rules | v0.3 fragment removed | done).

   • In ALL cases: install the v1 skill where the host discovers it (user-global is fine for a private
     per-user brain). Detect-on-Load already resolves the bridge pointer + stays silent when bridged —
     no manual patch. Grep the wired file(s): a bare CWD-relative `.synaptic/BRAIN.md` pointer must be
     ZERO. Then RECORD what you wired in `harness/setup/<host>.md` (e.g. `harness/setup/vscode.md`):
     bridge location + pointer, rules target, hooks, command stubs — your re-deploy recipe for the next
     machine, and it travels in the backup.

   (Pointer-resolving + stay-silent Detect-on-Load is SHIPPED in v1. Still a proposed future
   synaptic-core improvement: `deploy.js --brain/--repos` + a `scope: seat|org` + brain-path config to
   automate the wiring above; until then, do it by hand.)

────────────────────────────────────────────────────────────────────────
STEP 6 — Phase V (verify) on the work copy   [needs Node for check.js; [no Node] matrix below]
────────────────────────────────────────────────────────────────────────
  [needs Node]  node tools/check.js ./synaptic-v1-work/.synaptic   → fix every ERROR; aim for exit 0.

  [no Node] fallback — walk check.js's ERROR checks by hand AND add these (the count-only check is not
  enough):
   • Layout present (BRAIN.md, knowledge/INDEX.md, registries/_index.md, references/_index.md,
     journal/_current.md, harness/conventions.md, harness/guardrails.md). No v0.x leftovers
     (BOOTSTRAP/MANIFEST/HEARTBEAT/_tree.yaml/inventory/identity/worklines/), and no leftover brain-root
     context/bridge files (they must be in HARNESS_ORIGINALS/). _migration-staging/ still present (good).
   • Every knowledge + registry node has all 5 D1 frontmatter fields; tags not empty.
   • kebab-case filenames; NO duplicate basenames in knowledge/.
   • Every cluster _index.md linked from INDEX.md; every node reachable from a MOC.
   • Every [[wikilink]] resolves, PLUS a link-IDENTITY spot-check on a sample (old path == new target).
   • registries are type: registry + listed in _index; references/_index has exactly one entry per
     file in references/raw/ (parity).
   • CONTENT-CONSERVATION GATE (replaces the naive count gate): for EVERY node in the Step-4 manifest,
     confirm it is present, OR logged as merged (loser→winner), OR logged as split. Any node neither
     present nor logged = SILENT DROP = STOP and keep the original. Count is a smoke check only, with
     an exact, identical definition run on BOTH the backup and the work copy.
   • GREPS: `grep -n "Top Guardrails" BRAIN.md` must be EMPTY (v1 BRAIN.md carries no rules block —
     rules are deployed to the harness/system prompt); grep the wired harness file(s) for a bare
     `.synaptic/BRAIN.md` → must be ZERO. BRAIN.md ≤110 lines with the harness deploy-source pointer present.
   STOP and keep the original on any ERROR or gate failure.

────────────────────────────────────────────────────────────────────────
STEP 7 — Cut over to the v1 brain   [no Node]
────────────────────────────────────────────────────────────────────────
7A — PRIVATE per-user brain (the TYPICAL case: one writer, one machine):
  No team coordination needed. With Phase V green on the work copy: SWAP — rename the live brain to the
  `*-v0.3-backup` name (you already have the backup + `pre-v1` tag) and move the work copy into place.
  Apply the Step-5 harness rewrite (user-level — one place). Re-run the Step-6 greps against the live
  brain + the wired harness file. Done — this is the ~couple-of-hours path. (If YOU wrote to the live
  brain during the migration, fold those edits into the copy first — same idea as 7B.3, just for one
  person.)

7B — GENUINELY SHARED brain (several concurrent writers — rare; only if Step 1.4 said so):
  Phase C took time; a naive swap would discard teammates' interim edits silently. Before replacing:
  1. Announce a FREEZE and get an explicit ack from everyone. If the brain is git, lock it.
  2. Take the reconcile baseline AT THE LAST MOMENT, after acks.
  3. DELTA-RECONCILE: diff the LIVE brain against the Step-2 baseline (`git -C <brain> diff
     --name-status pre-v1 HEAD`, else an mtime/checksum compare vs the backup). Hand-port each interim
     change into the v1 work copy through Phase C formatting; fold new journal breadcrumbs in BEFORE
     the ≤80-line trim. Re-run Step 6 incl. the conservation gate vs the LIVE brain at freeze time.
  4. ATOMIC CUTOVER, per machine: the brain-folder SWAP (filesystem) and the harness rewrite must land
     TOGETHER on each machine — never on separate schedules (else a v1 pointer over a v0.3 brain, or
     vice-versa). Shared/network copy → one swap for everyone; N local copies → a per-person checklist.

────────────────────────────────────────────────────────────────────────
STEP 8 — OPTIONAL full audit + refactor sweep (ONLY if I ask for it)   [no Node; check.js optional]
────────────────────────────────────────────────────────────────────────
Beyond the strict schema migration, if I request a deep clean-up, run a diagnose-then-treat sweep —
this is exactly what /synaptic-maintain orchestrates (references/maintain.md), approval-gated and
archive-before-delete:
  1. PRE-CHECK baseline: node tools/check.js (or the manual matrix) + record counts/graph stats.
  2. /synaptic-audit (references/audit.md) — DIAGNOSE only: staleness, orphans, broken links, MOC +
     cross-link coverage, half-done work, registry integrity, oversized nodes, tag hygiene.
  3. Treat, in order, each approval-gated: consolidate half-done work → reconcile contradicts/supersedes
     → /synaptic-synthesize (cross-source patterns, orphan rescue; new nodes MOC-registered at write
     time) → /synaptic-weave (propose missing [[links]] + typed edges, near-dup merges; PROPOSE-never-
     auto-write).
  4. POST-CHECK: re-run check.js / the matrix → confirm no new broken links or phantom nodes.
  5. BEFORE/AFTER diff vs the backup: nodes added/split/merged, links added, orphans cleared, broken
     links fixed. Surface every structural change for confirmation; nothing auto-written beyond the
     bounded-reversible AUTO tier.

────────────────────────────────────────────────────────────────────────
STEP 9 — REPORT (always produce this)
────────────────────────────────────────────────────────────────────────
Write a report covering, with emphasis on the refactor + the before/after comparison (you have the
backup to diff against):
  • MIGRATION (Phase M/C): what moved/created; the cluster ledger; Phase V status (or the manual matrix
    result); the CONTENT-CONSERVATION result (every pre-migration node accounted for) and the DELETIONS
    LEDGER (every merge/split/removal, confirmed).
  • HARNESS (Step 5): current→new wiring; for a global brain, the WIRING MATRIX and the pointer/detect
    decisions; what old fragments were removed.
  • REFACTOR before vs after (the headline): node/link/orphan/MOC-coverage counts before (backup) and
    after; what was split, merged (loser→winner), re-typed, re-tagged; broken links fixed; a few
    representative diffs. If Step 8 ran, include its diagnose/treat/defer summary.
    [needs Node] graph.js gives link/orphan counts directly; [no Node] derive node counts and MOC
    coverage by hand from the Step-4 conservation manifest + each _index listing, and mark the
    link/orphan figures best-effort.
  • VERIFICATION + ROLLBACK readiness: check.js status; backup path + git tag; staging still present.
  • OPEN ITEMS: anything deferred, any teammate freeze/cutover coordination still pending, the
    DECISION LOG of non-obvious calls.

────────────────────────────────────────────────────────────────────────
ROLLBACK (trivial — you changed nothing destructive)
────────────────────────────────────────────────────────────────────────
PRIMARY (topology-independent): delete the v1 brain folder and rename `<brain>-v0.3-backup` back to
`<brain>`. (Do NOT use `git checkout <backup-path>` — it does not swap the folder in.)
If the brain is git: a FORWARD "revert to the pre-v1 tag" commit teammates pull — never a force-push/
reset on a shared remote. Revert each wired repo via its PR / `git checkout -- AGENTS.md` / the dated
backup.

────────────────────────────────────────────────────────────────────────
STEP 10 — Soak, then delete staging LAST
────────────────────────────────────────────────────────────────────────
Keep `<brain>-v0.3-backup`, the git tag, per-repo AGENTS.md backups, AND _migration-staging/ for an
agreed soak (a few days of normal use). Delete _migration-staging/ only AFTER Phase V is green AND the
cutover has been stable through the soak (it preserves per-file granularity the flat backup lacks).
"No _migration-staging/" is the LAST action — never a Phase V precondition. Delete the backup only
after the soak.
```

---

## Notes for the human running this

- The brain **type does not change the migration** (schema v0.3→v1 is identical for any brain); it only
  changes the **harness wiring** (Step 5A single-project vs 5B global/multi-repo) and the **team
  coordination** (Step 7). That is why Step 1 *identifies/asks* the topology instead of hard-forking.
- If you have Node, the fast path is: Step 0B fetch tools → `migrate.js` (Step 3) → `check.js` (Step 6)
  → `graph.js` before/after for the report. The agent does Phases C, 5, 7, 8 regardless.
- The three things most likely to bite a **shared** brain are baked into the runbook as hard gates:
  the **freeze + delta-reconcile** (Step 7), the **multi-repo detection patch** (Step 5B.c), and the
  **content-conservation gate** (Steps 4 + 6). Do not skip them on a team brain.
