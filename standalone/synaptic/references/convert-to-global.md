<!-- summary: Convert a project-wired brain to user-global reach — re-wire-only vs relocate, crash-safe copy-verify-then-remove, leak-rule cleanup across all carriers. -->

# Convert a project brain → user-global reach

Give an existing **project-wired** brain **user-global reach** — it then follows the user into
**every** folder they open, not just the one where it was installed. This is a **placement + wiring
change, NOT a schema migration** (`schema_version` stays `1.0`). Reuse the *safety discipline* of the
v0.3→v1 upgrade (backup, git baseline, verified copy, switch-when-green), even though there is no
M→C→V content rearrange.

> **REACH = harness placement, not folder location.** A brain's reach is set by **where its
> `BEGIN:SYNAPTIC` bridge is wired** — project-level bridge → that folder only; **user-level** bridge
> → every folder. "Going global" = moving the bridge up to user level. The brain FOLDER can stay
> exactly where it is. See `SKILL.md` "Detect on Load" and Harness Self-Wire §a. Load this file only
> when a user asks to make a brain global.

## The two sub-cases (pick one up front)

- **(a) Re-wire only — the common case, lowest risk.** Move the **bridge / harness** to user level;
  the **brain folder stays exactly where it is** (its bridge just points at its current **absolute**
  path). No content move, no relocation risk. This is the recommended default and the whole mechanism
  a single-context user needs to go global. → run the steps below with **step 3 (move the brain)
  SKIPPED**.
- **(b) Relocate — re-wire *and* physically move `.synaptic/`.** Chosen when the user wants the brain
  at a standard root (to get it off a committed/synced repo path, or to shape future indexing scope).
  OS-default fallback paths (offer the default, ask to confirm):
  - **Windows:** `C:/Users/<user>/.synaptic`
  - ***nix / macOS:** `~/.synaptic`
  → run the full steps below **including step 3**.

Both sub-cases keep the same guards: **byte-complete backup + a `pre-global` git tag on a BRAIN-ONLY
repo + content-conservation + hydration check + copy-verify-then-remove cutover + switch-when-green**,
and both **reaffirm the leak rule** afterward.

## The leak rule (refined) — what "safe" means

- A **global / private brain** (cross-context / multi-client content) is **NEVER committed, shared, or
  SYNCED into a foreign repo**, and its bridge pointer + SYNAPTIC-RULES are never written into one.
  That user-level placement **is** the confidentiality control.
- A **project-scoped brain that holds ONLY that one project's shareable knowledge MAY** legitimately
  live in and ship with **its own** repo — that is not a leak. This global-convert flow never produces
  that case (the bridge lands at user level).
- **"Local" = OUT of any synced root — OneDrive is the boundary, not git.** A location can leak by
  being **synced** even if never committed. On Windows, "synced" means under `%OneDrive%` /
  `%OneDriveCommercial%` (or any DFS/mapped sync-share root). Detection checks BOTH axes: under a
  synced root, AND committed to a foreign repo. *(Directly relevant: a workspace on OneDrive is synced
  even when nothing is committed.)*
- **Multi-client is fine.** A user-level-wired brain activates on ALL the user's work, including other
  clients' repos. That is the user's own memory, not a leak. The only control is "never commit or sync
  the brain into a repo." Per-client separate brains are a *future convenience* (coexistence, deferred
  to Cortex/v2.0), never a confidentiality requirement.

## 0. Pre-convert classification — "brain committed inside a work repo" is a first-class STOP

**Before any convert step**, classify how the source `.synaptic/` relates to git:

1. **Is `.synaptic/` tracked by git?** (`git ls-files --error-unmatch <brain path>` / `git status`.)
2. **If tracked: its OWN dedicated repo, or a SHARED / work repo?**
   - Its own repo → legitimate, no rescue needed.
   - Tracked inside a **SHARED / work repo → STOP:**
     - **Extend the leak grep to git HISTORY, not just the working tree:**
       `git log --all -p -- <bridge files> <brain files>`. A brain/bridge committed and later deleted
       still lives in history and syncs to every clone.
     - **History rewrite is OUT OF SCOPE** and needs a human decision. This procedure does **not**
       run `filter-repo` / BFG. The agent flags the finding, explains the private content is already
       in the shared repo's history, and stops for a human call.
     - **The `pre-global` tag MUST go on a brain-ONLY repo, NEVER the work repo.** If the brain has no
       dedicated repo, `git init` a **new dedicated** repo for the (backed-up/relocated) brain and tag
       `pre-global` there.
3. **If untracked:** proceed with the normal guards (backup + dedicated `pre-global` tag).

A brain trapped in a shared work repo strongly implies **relocate (b)** to a standard root off that
repo, plus the history warning above.

## Steps (agent runbook, guided mode — crash-safe by construction)

> **Crash-safety principle:** COPY-and-verify the new target BEFORE removing the old one — never
> move-then-rewrite. A `convert_in_progress` marker makes an interrupted run detectable and
> resumable/rollback-able instead of leaving a double-bridge limbo.

1. **Topology intake + classify + confirm.** Confirm the source is a project-wired `.synaptic/`, run
   the git classification (§0), and choose sub-case (a) re-wire-only or (b) relocate (offer the OS
   default root; ask to confirm).
2. **HARD-GATE safeguard (before touching anything):**
   - **`pre-global` tag on a brain-ONLY repo.** Untracked → `git init` a dedicated repo + commit +
     tag `pre-global`. Tracked in a shared work repo → do NOT tag the work repo; create a dedicated
     brain repo for the backed-up/relocated brain and tag there. *(This file prescribes it; the agent
     runs git — the skill performs no git itself.)*
   - **Folder backup, verified byte-complete** (file-count + size parity, logged).
   - **Snapshot EVERY file the convert will edit, at ANY level** — not only the brain folder and the
     project-level bridge, but every pre-existing **user-level** file the convert touches: user-level
     instruction / `AGENTS.md` / `CLAUDE.md` / `*.instructions.md` / `*.chatmode.md`, user-level
     **hook config**, and any user-level **skill** file it will overwrite. This makes out-of-repo
     harness edits fully restorable on rollback.
   - **"Local" = out of any synced root.** If the brain / backup path is under `%OneDrive%` /
     `%OneDriveCommercial%` (Windows) or any DFS/sync-share root, move the backup **and** the work
     copy to a genuinely **local** path first (a sync client can upload half-written files, corrupt a
     rollback, or leak content). Being *committed* is not the boundary; being *synced* is.
   - **Write the convert marker.** Append `convert_in_progress: <ts>` to `harness/setup/<host>.md`
     with the chosen sub-case + intended targets. A later run that sees this marker knows a prior
     convert was interrupted and must resume or roll back deterministically (step 9), never blindly
     re-run into double-bridge limbo.
3. **[Sub-case (b) "relocate" ONLY — SKIP for (a)] COPY the brain (do not move yet)** from
   `<project>/.synaptic/` to the standard root (Windows `C:/Users/<user>/.synaptic`, *nix/mac
   `~/.synaptic`, or the user's chosen root).
   - **Copy-verify-then-remove, never move.** COPY to the destination and **verify content
     conservation + hydration at the destination** (see "Done checklist" AC2.2 / AC2.2a) BEFORE the
     source is touched. For a git brain, prefer preserving history (clone/copy the repo). The **source
     is removed only in step 8**, after the new wiring resolves green.
   - In sub-case (a) the brain does not move; its bridge (step 4) simply points at its **current**
     absolute path.
4. **Wire the bridge at user level FIRST (add; don't yet remove the old one):**
   - **WRITE** the bridge into the host's **user-level** instruction context, pointer = the brain's
     (new) **absolute** path **+ the skill's absolute path** (see `SKILL.md` §a global/seat rewrite
     and the REACH host-setup detection note) — **before** removing the project-level bridge.
   - **VERIFY resolution from a SECOND, unrelated folder** (open a different folder; confirm
     Detect-on-Load resolves the brain via the new user-level bridge). Only once green do the removals
     in step 5 proceed. This guarantees there is never a window with **no** resolvable bridge.
5. **Deploy rules at user level, THEN strip the old project-level carriers:**
   - **Deploy** `BEGIN:SYNAPTIC-RULES` at user level. Symlink `harness/` **only on a POSIX local
     (non-synced) path where allowed; on Windows/OneDrive emit the block / generate a pointer file**
     (symlinks break on sync/copy).
   - **Remove the project bridge + rules from ALL its carriers** — enumerate the same scan list
     host-setup detection uses: the project's `AGENTS.md`, `.github/copilot-instructions.md`, Copilot
     workspace/user `*.instructions.md` + `*.chatmode.md`, Cursor rules (`.cursor/rules/*` / `.mdc`
     shim), `CLAUDE.md`. Removing from only `AGENTS.md` leaves a resolvable duplicate bridge in
     another carrier (double-bridge limbo).
6. **Move hooks + skill install to user level** so they fire from every folder; write the skill's
   **absolute path** into the user-level bridge so it is grep-recoverable on hosts that do not
   discover user-level skill dirs. **Remove the project-level command-discovery stubs** (recorded in
   `harness/setup/<host>.md`) so they don't linger after reach moves up; the user-level stubs replace
   them.
7. **Update `harness/setup/<host>.md`** to the new global wiring (bridge location, absolute brain
   pointer, absolute skill path, rules target, hook config, skill paths, stub set + placement dirs).
8. **NOW remove the old source (relocate sub-case only) and update the Capsule.**
   - **[Sub-case (b) only]** Only after step 4's second-folder resolution is green and step 5's
     carrier cleanup is done, **remove the original `<project>/.synaptic/` source** — the last,
     irreversible-ish action, deliberately ordered after every verification.
   - **Update the brain's own Context Capsule** if it named a single project scope — broaden it to
     reflect global coverage. **Extractive edit only — do not rewrite knowledge.**
9. **Verify (switch-when-green) + clear the marker.** Confirm the brain resolves from a *different*
   folder via the user-level bridge; confirm **exactly ONE** resolvable bridge covers the folder
   (across ALL carriers, committed **and** uncommitted); confirm zero bridge/rules leakage in any
   foreign committed **or synced** repo; confirm the backup + `pre-global` tag are intact. Only then
   **remove the `convert_in_progress` marker** from `harness/setup/<host>.md`.
   - If a run instead finds the marker **already present on entry**, do NOT proceed blind: inspect
     which side (old/new) is resolvable and either **resume** (new side present + verified → finish
     cleanup) or **roll back** (new side incomplete → restore per the rollback rule), then clear the
     marker.
   - **On resume, read the authoritative `convert_in_progress` marker from `harness/setup/<host>.md` in
     whichever brain the user-level bridge currently resolves to** — a partial convert may leave a marker
     in both the old (project-side) and new (relocated) copies, so the resolved brain's copy is the one
     of record; ignore a stale marker in a copy the live bridge no longer points at.
10. **Report + soak note.** Keep the backup + `pre-global` tag until stable, then remove.

## Done checklist (binary — no content loss)

- **AC2.1** A verified byte-complete backup of the original brain exists **before** any move **or
  re-wire** (file-count + size parity logged). *(Both sub-cases.)*
- **AC2.2 [relocate (b) only]** After the **copy** (copy, not move — rollback depends on the source
  still existing until step 8), the destination `.synaptic/` contains **every** file the original had
  (path + `sha256(body)` parity for all `knowledge/**`, `registries/**`, `references/**`, `journal/**`,
  `harness/**`). *(In re-wire (a): the check reduces to confirming the brain folder is byte-identical
  to its backup — no relocation occurred.)*
- **AC2.2a On-disk hydration.** For **every** file asserted above (and, in sub-case (a), every file of
  the in-place brain), the file's **physical on-disk size == its reported size** — no OneDrive
  dehydrated placeholders / cloud-only stubs (a dehydrated file greps as present but has no local
  bytes). Assert hydration alongside the body-hash, not instead of it.
- **AC2.3** `schema_version` **unchanged** (`1.0`) — not a migration.
- **AC2.4** The project's **foreign committed OR synced** files contain **zero** of this brain's bridge
  pointers / SYNAPTIC-RULES blocks (grep every carrier; count MUST be zero). In (b) the old location no
  longer contains a brain; in (a) the brain folder may remain in place (fine — only the
  foreign-committed/synced leak rule must hold).
- **AC2.4a Exactly ONE resolvable bridge after convert.** Across the full carrier scan list
  (`AGENTS.md`, `.github/copilot-instructions.md`, Copilot `*.instructions.md`/`*.chatmode.md`, Cursor
  rules, `CLAUDE.md`), both committed and uncommitted, **exactly one** resolvable `BEGIN:SYNAPTIC`
  bridge covers the folder (the user-level one), and the `convert_in_progress` marker has been cleared.
- **AC2.5** The user-level context contains exactly one `BEGIN:SYNAPTIC` block with the brain's new
  **absolute** pointer **and** the skill's **absolute** path.
- **AC2.6** The brain resolves and boots from a **second, unrelated** folder — verified **before** any
  old-side removal (step 4).

## Rollback (matches the cutover: copy+rewire → rewire-back + copy-back, byte-parity verified)

Restore the pre-convert state from the step-2 snapshot of **every edited file at any level** (brain
folder + project-level bridge/rules + all touched user-level instruction/hook/skill files):

- **(a) re-wire only** → remove the new user-level bridge/rules, **restore every edited user-level
  file** and the project-level bridge/rules from the snapshot (no folder to move back); verify the
  in-place brain is **byte-identical** to its backup.
- **(b) relocate** → git brain → reset to `pre-global` on the **dedicated brain repo** (or a forward
  revert on a shared remote — never force-push); non-git brain → the original source still exists
  (removed only in step 8) so restore is trivial, else copy the backup folder back **verified by
  byte-parity**; in both, remove the new user-level wiring, restore every edited user-level file, and
  re-instate the project-level bridge from the snapshot.

## CORE-safety

Placement + wiring change, zero-runtime, no schema bump. Every gate is grep + file-existence + hash by
hand. The safety discipline mirrors `references/upgrade-to-v1.md`'s addendum. Runtime confirmation
(second-folder resolution, OneDrive hydration behavior) is author-complete; verify on a real
(Robinson) run.
