# Recipe — Layered Capture Hooks (breadcrumbs + consolidation)

**Purpose:** wire the **layered capture mechanism** so knowledge survives a session even when you
forget to consolidate — a universal per-turn breadcrumb to the journal, a reminder before context is
lost, and a rescue sweep on the next boot. Consolidation-at-session-end is one layer of this, not
the whole story.

**Scope:** optional add-on, but **hooks are CORE** — a hook config is plain text/JSON the *host*
already runs (no runtime Synaptic ships), so wiring them does not break the zero-install,
air-gapped promise. CORE never *requires* hooks: the capture cadence works on habit alone. Hooks
just move it from "remember to" to "happens on its own where the host supports it."

> **Verified hook reality (as of 2026-06).** Claude Code, GitHub Copilot, Cursor, OpenAI Codex,
> and Gemini all support **file-configured hooks** — you commit a config file and the host fires
> your command on lifecycle events. What differs is *which events each host exposes*, not whether
> hooks exist. The earlier "Cursor/Copilot/Gemini = manual only" framing in this repo was stale;
> see the per-host event table in §4 and `research/harness-wiring-landscape.md` for the wiring
> details.

---

## The problem this solves

`/synaptic-consolidate` is voluntary and pull-based. The most common failure modes:

1. **Forgotten consolidation.** A productive session ends, the journal has 30 new lines and two
   open playgrounds, and nothing fires. Three sessions later the consolidation debt is high and
   the brain drifts.
2. **Context loss mid-session.** A long or "abused" session hits compaction; everything that only
   lived in the context window — and was never written to disk — is gone before you ever reach
   session end.
3. **Abandoned sessions.** The window is closed, the terminal is killed, the machine sleeps. There
   is no clean exit event at all, so a session-end-only hook never fires.

A capture mechanism that depends only on a clean **session-end** event misses (2) and (3) entirely.
The layered design below closes all three gaps, and — honest limit — there is **no native idle
detection on any agent**, so "fully passive" means *event-driven where the host supports it, with
the on-disk journal as the universal floor*, not an unattended idle daemon.

---

## The layered capture model

Four host events, each a different layer. **Only `Stop` is universal**; the rest are host-conditional
bonuses that strengthen capture where the host exposes them.

| Layer | Hook event | Role | Cost | Availability |
|---|---|---|---|---|
| **(a0) Activity marker** | `Stop` + `SessionStart` | **UNCONDITIONAL** one-line proof-of-life to `journal/_activity/` — no git, no gate, no LLM. **The only mechanical non-empty floor**; also the capture-yield denominator | Fixed, one short append | Any host that runs a **shell command** on a hook (confirmed: Claude Code; others UNVERIFIED) |
| **(a) Breadcrumb** | `Stop` (per turn) | One terse *semantic* journal line per meaningful turn — the workhorse. **Conditional by design** (reports what changed), so it can legitimately write nothing | Fixed, tiny; **not** governed by `capture_policy` | **Universal** — all 5 agents |
| **(b) Flush reminder** | `PreCompact` | Print a reminder to consolidate before the context window is compacted (A.2; a shell hook cannot run `/synaptic-consolidate` itself) | One check when compaction is imminent | Where supported (Claude / Copilot / Codex) |
| **(c) Rescue** | `SessionStart` | On next boot, detect unconsolidated breadcrumbs / open playgrounds and **offer** to consolidate | One check at boot | Where supported |
| **(d) Bonus** | `SessionEnd` | Offer/remind to consolidate on a clean exit | One check at clean exit | Where present (**not** Copilot-IDE, **not** Cursor) |

Why this shape:

- **Breadcrumbs live on disk, so they survive a crash.** What only lived in context dies; one
  terse line per `Stop` is the cheap safety net that does not. They are **always fixed cost** and
  are deliberately **outside `capture_policy`** — the policy tunes *promotion to the wiki*
  (`selective | balanced | capture-all`), not the breadcrumb floor.
- **`PreCompact` is the one that saves long sessions.** It fires before the context is compacted,
  the exact moment un-written knowledge is about to be lost — strictly better than waiting for
  session end on hosts that expose it.
- **`SessionStart`-rescue + `/synaptic-audit` together = the abandonment safety sweep.** Even if no
  end event ever fired, the next boot finds the pending breadcrumbs and offers to consolidate.
- **`SessionEnd` is a bonus, not the foundation.** It only fires on a clean exit and does not exist
  on every host, so the design no longer hangs on it.

> **Capture is a dial, not a switch.** *When* capture triggers runs from manual → event-driven hooks
> → where-supported automation; *how much* reaches the wiki is the separate `capture_policy` axis
> (`selective | balanced | capture-all`). Breadcrumbs are an always-on, fixed-cost, best-effort instruction under both; the mechanical floor is the A.0 marker.

---

## Option A — Claude Code layered hooks (reference implementation)

Claude Code exposes all four events. Configure them in your project's `.claude/settings.json` plus
small scripts under `.claude/hooks/`. The same shapes port to the other hosts (§4).

### A.0 The activity marker (v1.5.0 — the UNCONDITIONAL floor; fixes issue #2a)

> **Why this exists (read it — it is the bug).** The A.1 breadcrumb script below only writes **when
> `git diff` reports touched files**. So it writes **nothing** when: the brain/workspace is **not a git
> repo at all**, the session was read-only / Q&A, or the work happened outside the git tree. That gate
> is exactly how a fully-worked session ends with an **empty journal** (issue #2a). A.0 fixes it with an
> **unconditional** append: no git dependency, no content gate, nothing to be skipped.

Create `.claude/hooks/synaptic-activity.sh` (and `.ps1` on Windows). One line, always.

```bash
#!/usr/bin/env sh
# synaptic-activity.sh — UNCONDITIONAL proof-of-life marker. Arg 1 = event (stop|boot).
# No git, no LLM, no content gate. Blind append only: never reads or rewrites the file.
BRAIN_DIR="${SYNAPTIC_BRAIN_DIR:-.synaptic}"
[ -d "$BRAIN_DIR" ] || exit 0
EVENT="${1:-stop}"
DIR="$BRAIN_DIR/journal/_activity"
mkdir -p "$DIR" 2>/dev/null
# Local data, not committed by default: the folder ignores everything but this file (a synced folder
# such as OneDrive still syncs it; delete the .gitignore to opt in to committing the ledger).
[ -e "$DIR/.gitignore" ] || { printf '*\n!.gitignore\n' > "$DIR/.gitignore"; } 2>/dev/null
# Host token, never the raw name: the first 12 hex of SHA-256 over the lower-cased host name. It hides
# the name from a casual reader; it is not anonymous (anyone who knows the name can recompute it).
H=$(printf '%s' "$(hostname | tr '[:upper:]' '[:lower:]')" | { sha256sum 2>/dev/null || shasum -a 256 2>/dev/null; } | cut -c1-12)
# The line is the event only: the file is per day, so its line counts ARE the per-day counts.
# Swallow failures: a missed marker is acceptable, a broken turn is not.
{ printf '%s\n' "$EVENT" >> "$DIR/${H:-host}-$(date -u +%Y-%m-%d).log"; } 2>/dev/null || true
exit 0
```

```powershell
# synaptic-activity.ps1 — UNCONDITIONAL proof-of-life marker. Param = event (stop|boot).
# UTF-8 NO BOM: PowerShell 5.1's >> and Out-File default to UTF-16LE+BOM, and Add-Content to the ANSI
# code page; either makes the ledger non-grep-clean with binary-ish git diffs. Do not "simplify" this line.
param([string]$Event = "stop")
try {
    $brainDir = if ($env:SYNAPTIC_BRAIN_DIR) { $env:SYNAPTIC_BRAIN_DIR } else { ".synaptic" }
    if (-not (Test-Path -LiteralPath $brainDir)) { exit 0 }   # -LiteralPath: [ ] in a path is not a wildcard
    # Absolute path: .NET methods resolve a relative path against the PROCESS directory, not $PWD, so
    # run in-process after a Set-Location a relative path writes nowhere and still exits 0.
    $brainDir = (Resolve-Path -LiteralPath $brainDir).ProviderPath
    $dir = Join-Path $brainDir "journal/_activity"
    [IO.Directory]::CreateDirectory($dir) | Out-Null   # idempotent; no provider wildcard semantics
    $utf8 = New-Object Text.UTF8Encoding $false
    # Local data, not committed by default (same .gitignore as the sh marker). Its own try: a race with a
    # concurrent session must not cost the marker.
    $gi = Join-Path $dir ".gitignore"
    try { if (-not [IO.File]::Exists($gi)) { [IO.File]::WriteAllText($gi, "*`n!.gitignore`n", $utf8) } } catch { }
    # Host token, never the raw name: first 12 hex of SHA-256 over the lower-cased host name, the same
    # token the sh marker computes. %COMPUTERNAME% on Windows, else the full host name (what `hostname`
    # prints; [Environment]::MachineName would truncate at the first dot on Unix).
    $h    = if ($env:COMPUTERNAME) { $env:COMPUTERNAME } else { [Net.Dns]::GetHostName() }
    $tok  = -join ([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($h.ToLowerInvariant()))[0..5] | ForEach-Object { $_.ToString('x2') })
    $path = Join-Path $dir "$tok-$((Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')).log"
    # The line is the event only: the file is per day, so its line counts ARE the per-day counts.
    [IO.File]::AppendAllText($path, "$Event`n", $utf8)
} catch { }   # two concurrent same-host sessions can hit a transient lock; never block the turn
exit 0
```

**Per host + per day** so each machine owns its own file — that is what keeps it safe on
OneDrive/DFS-synced brains (many small appends, **no shared rewrite**, so no cross-host conflict
copies). It does **not** eliminate same-host concurrency: two sessions on one host+day share a file, so
both scripts swallow failures and `exit 0` rather than ever blocking a turn. The hook **never prunes** —
`/synaptic-consolidate` (Journal Trim) rolls up old day-files, and must keep per-day `boot` counts
because they are the capture-yield denominator. This ledger is **proof-of-life + the capture-yield
denominator only** — it is *not* semantic capture, and nothing should mirror it.

**Privacy (v1.6).** The file name carries a 12-hex **host token**, not the machine's name, and each line
is just `boot` or `stop`: no time of day, so the ledger holds per-day counts, not a per-turn work
profile. `_activity/.gitignore` keeps it out of git by default; delete that file to commit the ledger
(for a shared brain where per-host yield matters). A synced folder (OneDrive, Dropbox) still syncs it.
Nothing is ever sent anywhere: this is local data the audit reads. Ledgers from before v1.6
(`<hostname>-<date>.log`, `<timestamp> <event>` lines) stay readable: count the last field of each line.

### A.1 The breadcrumb script (the `Stop` semantic layer)

Create `.claude/hooks/synaptic-breadcrumb.sh` (or `.ps1` on Windows). It appends one terse line to
the journal on every meaningful turn — fixed cost, no LLM call, no promotion decision.

> **This is the SEMANTIC layer, not the floor.** It is deliberately conditional (it reports *what
> changed*), so **it can legitimately write nothing** — see A.0 for the unconditional floor. Do not
> treat this script as a guarantee that the journal is non-empty.

```bash
#!/usr/bin/env bash
# synaptic-breadcrumb.sh
# Appends a one-line breadcrumb to the journal on each Stop turn.
# Fixed cost; NOT governed by capture_policy. Called by Claude Code's Stop hook.

BRAIN_DIR="${SYNAPTIC_BRAIN_DIR:-.synaptic}"
JOURNAL="${BRAIN_DIR}/journal/_current.md"

# Only act if the brain exists and the working tree shows recent activity.
[ -d "$BRAIN_DIR" ] || exit 0

ts="$(date -u +%Y-%m-%dT%H:%MZ)"
# The brain's own bookkeeping (this journal, the A.0 ledger) is not work: counting it would make
# every later turn - and the A.2/A.3 predicate - see "pending" breadcrumbs forever. The optional `"`
# matches git's quoting of paths with non-ASCII characters (core.quotePath); -a keeps grep in text mode.
touched=$(git -C "$(pwd)" diff --name-only HEAD 2>/dev/null | grep -a -v -E '(^|/)journal/(_current\.md"?$|_activity/)' | head -n 5 | paste -sd ',' - || true)

# Dedup: an uncommitted diff persists across turns, so skip the line when the LAST breadcrumb already
# lists the same files (agent-written lines in between do not count). One awk, read-only.
last=$(awk -F' breadcrumb: touched ' 'NF>1{l=$2} END{sub(/\r$/,"",l); print l}' "$JOURNAL" 2>/dev/null)

if [ -n "$touched" ] && [ "$touched" != "$last" ]; then
  printf -- "- %s breadcrumb: touched %s\n" "$ts" "$touched" >> "$JOURNAL"
fi
```

PowerShell equivalent (`.claude/hooks/synaptic-breadcrumb.ps1`):

```powershell
# synaptic-breadcrumb.ps1
$brainDir = if ($env:SYNAPTIC_BRAIN_DIR) { $env:SYNAPTIC_BRAIN_DIR } else { ".synaptic" }
if (-not (Test-Path -LiteralPath $brainDir)) { exit 0 }
try {
    $journal = Join-Path (Resolve-Path -LiteralPath $brainDir).ProviderPath "journal/_current.md"
    $ts = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mmK")
    # The brain's own bookkeeping (this journal, the A.0 ledger) is not work - same filter as bash.
    $touched = (git diff --name-only HEAD 2>$null | Where-Object { $_ -cnotmatch '(^|/)journal/(_current\.md"?$|_activity/)' } | Select-Object -First 5) -join ','
    # Dedup: skip when the LAST breadcrumb already lists the same files - same rule as bash.
    $last = ''
    if (Test-Path -LiteralPath $journal) {
        $m = [regex]::Matches([IO.File]::ReadAllText($journal), ' breadcrumb: touched ([^\r\n]*)')
        if ($m.Count -gt 0) { $last = $m[$m.Count - 1].Groups[1].Value }
    }
    if ($touched -and $touched -cne $last) {
        # NOT Add-Content. On Windows PowerShell 5.1 its default is the ANSI code page (a non-ASCII path
        # becomes invalid UTF-8), and `-Encoding utf8` means UTF-8 WITH a BOM, written whenever the
        # journal is new or empty. This writes UTF-8 without a BOM, and LF, on every version.
        [IO.File]::AppendAllText($journal, "- $ts breadcrumb: touched $touched`n", (New-Object Text.UTF8Encoding $false))
    }
} catch { }   # a missed breadcrumb is acceptable; a broken turn is not
exit 0
```

### A.2 The consolidation-reminder script (`PreCompact` / `SessionEnd`)

Create `.claude/hooks/synaptic-consolidate-reminder.sh`. It prints a reminder to consolidate when the
brain holds unconsolidated work: breadcrumb lines the A.1 hook wrote (`breadcrumb:`) in
`journal/_current.md`, or open playgrounds. This is the same predicate as the A.3 rescue. It reads no
git itself, so it sees new untracked playgrounds and works for a brain outside git. When the project
itself is not a git repo, only open playgrounds can trigger it, because A.1 needs git to write
breadcrumbs. `playgrounds/archive/` is not counted. Use it on `PreCompact` (a reminder before context loss) and on `SessionEnd` (clean-exit bonus).

```bash
#!/usr/bin/env bash
# synaptic-consolidate-reminder.sh
# Prints a consolidation reminder if breadcrumbs are pending or playgrounds are open (git-free).
# Wire to PreCompact (flush before compaction) and SessionEnd (clean-exit bonus).

BRAIN_DIR="${SYNAPTIC_BRAIN_DIR:-.synaptic}"
JOURNAL="${BRAIN_DIR}/journal/_current.md"

[ -d "$BRAIN_DIR" ] || exit 0

pending_crumbs=$(grep -c "breadcrumb:" "$JOURNAL" 2>/dev/null); pending_crumbs=${pending_crumbs:-0}
open_playgrounds=$(find "${BRAIN_DIR}/playgrounds" -mindepth 1 -maxdepth 1 -type d ! -name archive 2>/dev/null | wc -l | tr -d ' ')

if [ "$pending_crumbs" -gt 0 ] || [ "$open_playgrounds" -gt 0 ]; then
  echo ""
  echo "=== Synaptic: consolidation reminder ==="
  echo "${pending_crumbs} pending breadcrumb(s) and ${open_playgrounds} open playground(s) are not yet consolidated."
  echo "Run /synaptic-consolidate to distil durable conclusions before context is lost."
  echo "Cadence: consolidate at flush/exit · /synaptic-audit weekly · /synaptic-weave monthly"
  echo "========================================"
fi
```

PowerShell equivalent (`.claude/hooks/synaptic-consolidate-reminder.ps1`):

```powershell
# synaptic-consolidate-reminder.ps1
# Same git-free predicate as the bash script: pending breadcrumbs, or open playgrounds (not archive/).
$brainDir = if ($env:SYNAPTIC_BRAIN_DIR) { $env:SYNAPTIC_BRAIN_DIR } else { ".synaptic" }
if (-not (Test-Path -LiteralPath $brainDir)) { exit 0 }
$journal = Join-Path $brainDir "journal/_current.md"
$playgrounds = Join-Path $brainDir "playgrounds"
$crumbs = 0
if (Test-Path -LiteralPath $journal -PathType Leaf) { $crumbs = @(Select-String -LiteralPath $journal -SimpleMatch -CaseSensitive -Pattern "breadcrumb:").Count }
$open = 0
if (Test-Path -LiteralPath $playgrounds -PathType Container) { $open = @(Get-ChildItem -LiteralPath $playgrounds -Directory -Force | Where-Object { $_.Name -cne "archive" }).Count }
if ($crumbs -gt 0 -or $open -gt 0) {
    Write-Output ""
    Write-Output "=== Synaptic: consolidation reminder ==="
    Write-Output "$crumbs pending breadcrumb(s) and $open open playground(s) are not yet consolidated."
    Write-Output "Run /synaptic-consolidate to distil durable conclusions before context is lost."
    Write-Output "Cadence: consolidate at flush/exit | /synaptic-audit weekly | /synaptic-weave monthly"
    Write-Output "========================================"
}
```

### A.3 The rescue check (`SessionStart`)

Create `.claude/hooks/synaptic-rescue.sh`. On the next boot it detects pending breadcrumbs or open
playgrounds left by an abandoned session and offers to consolidate. This is the layer that recovers
sessions where **no** end event ever fired. `playgrounds/archive/` is not counted as open.

```bash
#!/usr/bin/env bash
# synaptic-rescue.sh
# On SessionStart: if breadcrumbs/playgrounds are unconsolidated, offer to consolidate.

BRAIN_DIR="${SYNAPTIC_BRAIN_DIR:-.synaptic}"
JOURNAL="${BRAIN_DIR}/journal/_current.md"

[ -d "$BRAIN_DIR" ] || exit 0

# grep -c already prints 0 when nothing matches (it just exits 1), so `|| echo 0` would yield "0\n0".
pending_crumbs=$(grep -c "breadcrumb:" "$JOURNAL" 2>/dev/null); pending_crumbs=${pending_crumbs:-0}
# playgrounds/archive/ holds finished work kept on request - it is not an open playground.
open_playgrounds=$(find "${BRAIN_DIR}/playgrounds" -mindepth 1 -maxdepth 1 -type d ! -name archive 2>/dev/null | wc -l | tr -d ' ')

if [ "$pending_crumbs" -gt 0 ] || [ "$open_playgrounds" -gt 0 ]; then
  echo ""
  echo "=== Synaptic: rescue sweep ==="
  echo "Found ${pending_crumbs} pending breadcrumb(s) and ${open_playgrounds} open playground(s)"
  echo "from a previous session. Run /synaptic-consolidate (or /synaptic-audit) to recover them."
  echo "=============================="
fi
```

### A.4 Register the hooks in `.claude/settings.json`

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "sh .claude/hooks/synaptic-activity.sh stop" },
          { "type": "command", "command": "bash .claude/hooks/synaptic-breadcrumb.sh" }
        ]
      }
    ],
    "PreCompact": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/synaptic-consolidate-reminder.sh" }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "sh .claude/hooks/synaptic-activity.sh boot" },
          { "type": "command", "command": "bash .claude/hooks/synaptic-rescue.sh" }
        ]
      }
    ],
    "SessionEnd": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "bash .claude/hooks/synaptic-consolidate-reminder.sh" }
        ]
      }
    ]
  }
}
```

On Windows, swap each command for
`powershell -NoProfile -ExecutionPolicy Bypass -File .claude/hooks/<script>.ps1` (the activity marker
takes its event as an argument: `... -File .claude/hooks/synaptic-activity.ps1 stop` / `... boot`).
Only A.0, A.1 and A.2 have a PowerShell variant. The A.3 rescue does not yet: on Windows keep it as
`bash .claude/hooks/synaptic-rescue.sh` (needs Git Bash) or leave it out; registering a `.ps1` that does
not exist fails on every `SessionStart`.
Use `powershell` (Windows PowerShell 5.1, present on every Windows install), **not** `pwsh` (PowerShell
7, which is not installed by default, so the hook would fail to start and write nothing). `-ExecutionPolicy
Bypass` is needed because the Windows client default policy (`Restricted`) refuses to run any `.ps1`; if
your organisation enforces a policy through Group Policy, that policy wins and the hooks must be signed
or allowed. `-NoProfile` keeps a user profile from changing error handling or encoding under the hook.

> **Keep the marker its own hook entry.** Claude Code runs the hooks of one event in parallel, so the
> activity marker does not depend on its siblings — provided it is a separate entry and never chained
> after another command in the same command string, where an earlier failure could stop it.

### Notes

- The breadcrumb hook (A.1) fires on **every** `Stop`; it writes nothing while no tracked file differs
  from `HEAD`, and the brain's own journal and A.0 ledger never count. It reports the uncommitted
  state, not just this turn, so a consolidation that rewrites wiki nodes leaves one breadcrumb about
  its own edits; the next consolidation (or a commit before the turn ends) clears it.
- The reminder (A.2) and the rescue (A.3) report **standing state**: they fire while breadcrumbs are
  pending or any playground is open, whether or not this session touched the brain. An open
  playground stays "unconsolidated" until it is burned or archived — that is by design.
- If the project does not use git, A.1 writes nothing; replace its `git diff` check with a
  `find .synaptic/journal .synaptic/playgrounds -newer .synaptic/BRAIN.md` heuristic.
- The reminders are **informational** — they do not auto-run `/synaptic-consolidate`. Consolidation
  is propose-then-approve (bounded, reversible). The breadcrumb write is the only thing that happens
  unattended, and it is append-only to the journal (git-reversible, archive-before-delete discipline
  applies downstream at consolidation).

---

## Option B — No hook (default / universal)

No setup required. Drive the layers by habit:

```
/synaptic-consolidate
```

The cadence to remember:

| Frequency | Command | What it does |
|---|---|---|
| Mid-/end of session | `/synaptic-consolidate` | Apply the capture contract; scan journal **and playgrounds**; close playgrounds; update the brain |
| Weekly | `/synaptic-audit` | Diagnose orphans, broken links, stale nodes, MOC gaps, **half-done / unconsolidated** debt, pending breadcrumbs |
| Monthly | `/synaptic-weave` | Retroactive graph-gardening: missing links, near-duplicates, theme promotion |

Without hooks you lose the *automatic* breadcrumb layer, the **activity-marker floor**, and the rescue
sweep — so consolidate more deliberately, especially before long sessions that may hit compaction. With
no activity floor there is nothing mechanical writing on your behalf, so `/synaptic-audit` reports
capture-yield as **unknown** rather than pretending to measure it.

---

## 4. Per-host hook events (verified 2026-06)

All five agents support **file-configured hooks**. The difference is *which lifecycle events each
host fires* — so the layered model degrades gracefully: every host gets the universal `Stop`
breadcrumb layer (and the **activity-marker floor** wherever the host runs a shell command on that
event), and picks up `PreCompact` / `SessionStart` / `SessionEnd` where exposed.

| Agent | Config file | `Stop` (breadcrumb) | `PreCompact` (reminder) | `SessionStart` (rescue) | `SessionEnd` (bonus) |
|---|---|---|---|---|---|
| **Claude Code** | `.claude/settings.json` | yes | yes | yes | yes |
| **GitHub Copilot** | `.github/hooks/*.json` (config-driven) | yes (stop/turn-end) | yes (pre-compaction) | yes (session-start) | **no** (Copilot-IDE has no clean SessionEnd) |
| **Cursor** | `.cursor/hooks.json` | yes (stop/turn-end) | host-dependent | yes (session-start) | **no** |
| **OpenAI Codex** | `AGENTS.md` / config-driven hooks | yes | yes (pre-compaction) | yes | yes |
| **Gemini** | file-configured hooks | yes (turn-end) | host-dependent | yes | host-dependent |

**Read this as:** `Stop` is the only event you can rely on everywhere — it is the capture floor.
`PreCompact` is the high-value layer on Claude / Copilot / Codex. `SessionEnd` is the weakest
assumption (absent on Copilot-IDE and Cursor), which is exactly why the design treats it as a bonus
and leans on `SessionStart`-rescue instead. **No host exposes native idle detection** — only an
OS-level cron/timer approximates it, and a cron/daemon Synaptic would ship is **Cortex**, not CORE.

For the full per-host wiring details (config paths, discovery, idempotent install), see
[`research/harness-wiring-landscape.md`](../research/harness-wiring-landscape.md).

---

## CORE-safety recap

- **Hooks are CORE.** The configs are host-run text/JSON; Synaptic ships no runtime to execute them.
- **Breadcrumbs are append-only to the journal** — they live on disk, survive crashes, fixed cost,
  outside `capture_policy`.
- **Consolidation stays propose-then-approve** — diff-traced, git-reversible, archive-before-delete;
  never an unguarded auto-rewrite, never an unattended idle daemon.
- **Only an OS-cron/daemon WE ship would be Cortex** — everything in this recipe is CORE.
