# Recipe — Layered Capture Hooks (breadcrumbs + consolidation)

**Purpose:** wire the **layered capture mechanism** so knowledge survives a session even when you
forget to consolidate — a universal per-turn breadcrumb to the journal, a flush before context is
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
| **(a) Breadcrumb** | `Stop` (per turn) | One terse journal line per meaningful turn — the workhorse | Fixed, tiny; **not** governed by `capture_policy` | **Universal** — all 5 agents |
| **(b) Flush** | `PreCompact` | Consolidate before the context window is compacted (the gem for long/abused sessions) | One consolidation pass when compaction is imminent | Where supported (Claude / Copilot / Codex) |
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
> (`selective | balanced | capture-all`). Breadcrumbs are the always-on, fixed-cost floor under both.

---

## Option A — Claude Code layered hooks (reference implementation)

Claude Code exposes all four events. Configure them in your project's `.claude/settings.json` plus
small scripts under `.claude/hooks/`. The same shapes port to the other hosts (§4).

### A.1 The breadcrumb script (the `Stop` workhorse)

Create `.claude/hooks/synaptic-breadcrumb.sh` (or `.ps1` on Windows). It appends one terse line to
the journal on every meaningful turn — fixed cost, no LLM call, no promotion decision.

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
touched=$(git -C "$(pwd)" diff --name-only HEAD 2>/dev/null | head -n 5 | paste -sd ',' - || true)

if [ -n "$touched" ]; then
  printf -- "- %s breadcrumb: touched %s\n" "$ts" "$touched" >> "$JOURNAL"
fi
```

PowerShell equivalent (`.claude/hooks/synaptic-breadcrumb.ps1`):

```powershell
# synaptic-breadcrumb.ps1
$brainDir = if ($env:SYNAPTIC_BRAIN_DIR) { $env:SYNAPTIC_BRAIN_DIR } else { ".synaptic" }
$journal  = Join-Path $brainDir "journal/_current.md"
if (-not (Test-Path $brainDir)) { exit 0 }
$ts = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mmK")
$touched = (git diff --name-only HEAD 2>$null | Select-Object -First 5) -join ','
if ($touched) {
    Add-Content -Path $journal -Value "- $ts breadcrumb: touched $touched"
}
```

### A.2 The consolidation-reminder script (`PreCompact` / `SessionEnd`)

Create `.claude/hooks/synaptic-consolidate-reminder.sh`. It checks whether `journal/` or
`playgrounds/` changed and, if so, prints a reminder to consolidate. Use it on `PreCompact` (flush
before context loss) and on `SessionEnd` (clean-exit bonus).

```bash
#!/usr/bin/env bash
# synaptic-consolidate-reminder.sh
# Prints a consolidation reminder if journal/ or playgrounds/ have uncommitted changes.
# Wire to PreCompact (flush before compaction) and SessionEnd (clean-exit bonus).

BRAIN_DIR="${SYNAPTIC_BRAIN_DIR:-.synaptic}"

changed=$(git -C "$(pwd)" diff --name-only HEAD 2>/dev/null | grep -E "^${BRAIN_DIR}/(journal|playgrounds)/" || true)

if [ -n "$changed" ]; then
  echo ""
  echo "=== Synaptic: consolidation reminder ==="
  echo "journal/ or playgrounds/ changed and is not yet consolidated."
  echo "Run /synaptic-consolidate to distil durable conclusions before context is lost."
  echo "Cadence: consolidate at flush/exit · /synaptic-audit weekly · /synaptic-weave monthly"
  echo "========================================"
fi
```

PowerShell equivalent (`.claude/hooks/synaptic-consolidate-reminder.ps1`):

```powershell
# synaptic-consolidate-reminder.ps1
$brainDir = if ($env:SYNAPTIC_BRAIN_DIR) { $env:SYNAPTIC_BRAIN_DIR } else { ".synaptic" }
$changed = git diff --name-only HEAD 2>$null | Where-Object { $_ -match "^$brainDir/(journal|playgrounds)/" }
if ($changed) {
    Write-Output ""
    Write-Output "=== Synaptic: consolidation reminder ==="
    Write-Output "journal/ or playgrounds/ changed and is not yet consolidated."
    Write-Output "Run /synaptic-consolidate to distil durable conclusions before context is lost."
    Write-Output "Cadence: consolidate at flush/exit · /synaptic-audit weekly · /synaptic-weave monthly"
    Write-Output "========================================"
}
```

### A.3 The rescue check (`SessionStart`)

Create `.claude/hooks/synaptic-rescue.sh`. On the next boot it detects pending breadcrumbs or open
playgrounds left by an abandoned session and offers to consolidate. This is the layer that recovers
sessions where **no** end event ever fired.

```bash
#!/usr/bin/env bash
# synaptic-rescue.sh
# On SessionStart: if breadcrumbs/playgrounds are unconsolidated, offer to consolidate.

BRAIN_DIR="${SYNAPTIC_BRAIN_DIR:-.synaptic}"
JOURNAL="${BRAIN_DIR}/journal/_current.md"

[ -d "$BRAIN_DIR" ] || exit 0

pending_crumbs=$(grep -c "breadcrumb:" "$JOURNAL" 2>/dev/null || echo 0)
open_playgrounds=$(find "${BRAIN_DIR}/playgrounds" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)

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

On Windows, swap each command for `pwsh -File .claude/hooks/<script>.ps1`.

### Notes

- The breadcrumb hook fires on **every** `Stop`; the scripts check for changes internally and stay
  silent when nothing relevant happened — no noise on sessions that did not touch the brain.
- If the project does not use git, replace the `git diff` check with a
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

Without hooks you lose the *automatic* breadcrumb floor and the rescue sweep — so consolidate more
deliberately, especially before long sessions that may hit compaction.

---

## 4. Per-host hook events (verified 2026-06)

All five agents support **file-configured hooks**. The difference is *which lifecycle events each
host fires* — so the layered model degrades gracefully: every host gets the universal `Stop`
breadcrumb floor, and picks up `PreCompact` / `SessionStart` / `SessionEnd` where exposed.

| Agent | Config file | `Stop` (breadcrumb) | `PreCompact` (flush) | `SessionStart` (rescue) | `SessionEnd` (bonus) |
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
