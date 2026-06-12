# Recipe — Session-End Consolidation Reminder

**Purpose:** remind or automatically trigger `/consolidate` when a session ends with
uncommitted knowledge (changes to `journal/` or `playgrounds/`).

**Scope:** optional add-on. CORE never requires hooks. The consolidation cadence works
without this recipe — it just relies on habit rather than automation.

---

## The problem this solves

`/consolidate` is voluntary and pull-based. The most common failure mode: a productive
session ends, the journal has 30 new lines and two open playgrounds, and nothing fires.
Three sessions later the consolidation debt is high and the brain drifts.

This recipe closes that gap for Claude Code users. Other agents (Copilot, Cursor, Gemini
CLI) can adapt the pattern to their equivalent hook mechanism.

---

## Option A — Claude Code Stop / SessionEnd hook (recommended)

Add a `Stop` hook to your project's `.claude/settings.json`. The hook fires after Claude
stops responding at the end of a session; the script checks whether `journal/` or
`playgrounds/` changed during the session, and if so, prints a reminder.

### 1. Create the check script

Create `.claude/hooks/consolidate-reminder.sh` (or `.ps1` on Windows — see below):

```bash
#!/usr/bin/env bash
# consolidate-reminder.sh
# Prints a consolidation reminder if journal/ or playgrounds/ have uncommitted changes.
# Called by Claude Code's Stop hook at session end.

BRAIN_DIR="${SYNAPTIC_BRAIN_DIR:-.synaptic}"

changed=$(git -C "$(pwd)" diff --name-only HEAD 2>/dev/null | grep -E "^${BRAIN_DIR}/(journal|playgrounds)/" || true)

if [ -n "$changed" ]; then
  echo ""
  echo "=== Synaptic: consolidation reminder ==="
  echo "journal/ or playgrounds/ changed this session."
  echo "Run /consolidate before closing to avoid consolidation debt."
  echo "Cadence: /consolidate at session end · /audit weekly · /weave monthly"
  echo "========================================"
fi
```

PowerShell equivalent (`.claude/hooks/consolidate-reminder.ps1`):

```powershell
# consolidate-reminder.ps1
$brainDir = if ($env:SYNAPTIC_BRAIN_DIR) { $env:SYNAPTIC_BRAIN_DIR } else { ".synaptic" }
$changed = git diff --name-only HEAD 2>$null | Where-Object { $_ -match "^$brainDir/(journal|playgrounds)/" }
if ($changed) {
    Write-Output ""
    Write-Output "=== Synaptic: consolidation reminder ==="
    Write-Output "journal/ or playgrounds/ changed this session."
    Write-Output "Run /consolidate before closing to avoid consolidation debt."
    Write-Output "Cadence: /consolidate at session end · /audit weekly · /weave monthly"
    Write-Output "========================================"
}
```

### 2. Register the hook in `.claude/settings.json`

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/consolidate-reminder.sh"
          }
        ]
      }
    ]
  }
}
```

On Windows with PowerShell:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "pwsh -File .claude/hooks/consolidate-reminder.ps1"
          }
        ]
      }
    ]
  }
}
```

### Notes

- The hook fires on every Claude Code `Stop` event, not only when brain files changed. The
  script checks for changes internally and is silent when nothing in `journal/` or
  `playgrounds/` changed — no noise on sessions that did not touch the brain.
- If the project does not use git, replace the `git diff` check with a simple
  `find .synaptic/journal .synaptic/playgrounds -newer .synaptic/BRAIN.md` heuristic.
- The reminder is **informational only** — it does not auto-run `/consolidate`. The agent
  still needs a prompt from the user to execute.

---

## Option B — No hook (default / universal)

No setup required. At the end of every session, simply tell your agent:

```
/consolidate
```

The cadence to remember:

| Frequency | Command | What it does |
|---|---|---|
| Every session end | `/consolidate` | Apply the 6-step capture contract; close playgrounds; update journal |
| Weekly | `/audit` | Surface orphans, broken links, stale nodes, MOC gaps, consolidation debt |
| Monthly | `/weave` | Retroactive graph-gardening: missing links, near-duplicates, theme promotion |

---

## Platform notes

This recipe shows Claude Code syntax (`settings.json` hooks, `.claude/` path). The concept
is adaptable:

| Agent | Hook equivalent |
|---|---|
| **Cursor** | `.cursor/rules` post-session note (manual reminder) |
| **Copilot / VS Code** | VS Code task triggered on workspace close (manual) |
| **Gemini CLI** | Shell alias or wrapper script around the CLI invocation |
| **Any agent** | A cron job or shell function that prints the reminder daily |

CORE itself has no platform dependency. The hook is a convenience layer only.
