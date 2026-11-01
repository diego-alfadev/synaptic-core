<!-- summary: Capture mechanism — deploy host hooks: the activity marker (a0), Stop breadcrumb, SessionStart rescue + compaction recovery, per-host support, honesty rules, the journal breadcrumb contract. -->

# Capture mechanism — deploy host hooks

> Read when init or the upgrade routine deploys capture hooks (`references/init.md`, Self-Wire step d).

## Capture mechanism — deploy host hooks (CORE; v1-final §5.9)

Wire the **layered, host-aware capture mechanism**. **Hooks are CORE** — a hook config
(`settings.json`, `.github/hooks/*.json`, `.cursor/hooks.json`, `AGENTS.md`) is plain text/JSON
the **host already runs**; it needs no runtime we ship. Each hook calls into the synaptic skill
(e.g. invokes `/synaptic-consolidate` or appends a journal breadcrumb) using the host's own
runtime — Synaptic ships no daemon. **Detect the host, deploy the layers it supports, and degrade
gracefully** — never fail if a layer is unavailable.

**The four layers (deploy each where the host supports it):**

| Layer | Trigger | Host support | What it does |
|---|---|---|---|
| **(a0) Activity marker** | per `Stop` + `SessionStart` | **shell**-hook-capable hosts (see the support table below — "fires hooks" is not enough) | **Host-executed shell append** of ONE deterministic line to `journal/_activity/<host-token>-<date>.log` — see "Deterministic activity marker" below. **The mechanical proof-of-life floor: it fires whether or not the agent does anything.** Content-free; not semantic capture. |
| **(a) Stop breadcrumb** | per assistant turn (`Stop`) | **UNIVERSAL — all 5 agents** | Append **one terse line** to `journal/_current.md` (the meaningful change/decision this turn); where the hook writes `breadcrumb: touched` lines, the agent adds only decision points + the boundary summary (cadence: `templates/BRAIN.md`). The **semantic workhorse** — best-effort: it is an instruction the agent follows, so it is NOT the non-empty guarantee (a0 is). **Fixed cost; NOT governed by `capture_policy`.** |
| **(b) Compaction recovery** | right after a compaction (`SessionStart`, `compact` source) | **Claude Code**; other hosts: check their docs | The hook prints **one line**, injected into the context: re-read `journal/_current.md` and write the session summary there (recipe A.2 `compact`). |
| **(c) SessionStart heartbeat + rescue** | on next boot (`SessionStart`: startup / resume / clear, never `compact`) | most hook-capable hosts | **FIRST**, the capture-INDEPENDENT **boot marker** is written by the layer-(a0) shell append into `journal/_activity/<host-token>-<date>.log` (v1.5.0 — moved out of `journal/_current.md`; see the migration note below) so boots are counted even when nothing else is captured. **THEN** detect **unconsolidated breadcrumbs / active playgrounds** and **offer to consolidate** — recovers abandoned sessions. Pairs with `/synaptic-audit`'s half-done check = the abandonment safety sweep. |
| *(retired in v1.6)* | `PreCompact`, `SessionEnd` | — | Not wired: their stdout does not reach the model on Claude Code, so the old reminder reached no one (recipe A.2). |

> **Deterministic activity marker (v1.5.0 — the mechanical non-empty floor; layer a0).** Layers (a)–(c)
> are **instructions the agent follows** when a hook fires. If the agent does not follow them (long or
> abused sessions, compaction, or simply not doing it), **nothing is written** — which is why journals
> could still end up empty (repo issue #2a). Layer **(a0)** closes that at the floor by having the **host
> itself** run a shell command the agent cannot skip:
>
> - **Write = PURE BLIND APPEND of ONE line.** No read, no dedup, no rewrite — a read-modify-write is
>   program-shaped (not expressible identically across shells) and would risk sync conflict-copies.
> - **Line shape (stable field contract, v1.6):** `<event>` only, where `event ∈ {boot, stop}` — no
>   time of day, so a day-file's line counts are the per-day counts (privacy: no per-turn work profile).
>   Pre-1.6 lines `<ISO-8601-UTC timestamp> <event>` stay valid: readers count the **last field**.
>   Nothing that needs an LLM or a JSON parser.
> - **Destination: `journal/_activity/<host-token>-<YYYY-MM-DD>.log`** — **per host + per day**, where
>   `<host-token>` = the first 12 hex of SHA-256 over the **lower-cased** host name (`hostname` in sh,
>   `%COMPUTERNAME%` in PowerShell). The raw name is never written; the token is not anonymous (anyone
>   who knows the name can recompute it). Pre-1.6 files are named `<host>-<date>.log`. Claim only
>   what that buys: **no cross-host sync conflict copies** (each machine owns its own file, so a synced
>   brain never sees two writers rewriting one file). **Same-host concurrency is NOT eliminated** — two
>   concurrent sessions on the same host+day share a file, and the open-write-close append can hit a
>   transient lock; the one-liner must therefore **swallow its own failures and never block the turn**
>   (a missed marker is acceptable; a broken turn is not).
> - **The directory must exist.** A bare append to a missing parent **fails on both shells**, which
>   would produce a *false* floor — the exact failure class this layer removes. So the one-liner is
>   **self-creating** (`mkdir -p` / `New-Item -Force`, still read-free) **and** `/synaptic-init` /
>   `/synaptic-upgrade` create `journal/_activity/`. Resolve the brain root explicitly — never assume
>   the host's cwd is the brain root.
> - **Not committed by default (v1.6).** The one-liner (and init/upgrade) writes
>   `journal/_activity/.gitignore` = `*` + `!.gitignore` when absent, so the ledger stays out of git
>   unless the owner deletes that file. A synced folder still syncs it; nothing is sent anywhere.
> - **Encoding PINNED: UTF-8, no BOM.** On Windows PowerShell 5.1, `>>` and `Out-File` default to
>   **UTF-16LE + BOM**, `Add-Content` to the **ANSI code page**, and `Add-Content -Encoding utf8` writes a
>   **BOM** whenever the file is new or empty (all measured). Each breaks the ledger as clean UTF-8: a
>   stray BOM defeats `^` anchors, ANSI turns non-ASCII into invalid UTF-8, and UTF-16 makes git treat
>   the file as binary. Use the pinned forms below, which `tests/capture-floor/` executes.
>
> ```sh
> # POSIX sh (Linux/macOS) — Stop; use `boot` for SessionStart. Self-creating; never blocks the turn.
> # No-op if the brain is gone: a stale hook must not recreate a ghost <brain>/journal/_activity.
> B="<brain>"; [ -d "$B" ] || exit 0; D="$B/journal/_activity"; mkdir -p "$D" 2>/dev/null
> [ -e "$D/.gitignore" ] || { printf '*\n!.gitignore\n' > "$D/.gitignore"; } 2>/dev/null
> N=$(hostname 2>/dev/null || uname -n 2>/dev/null); H=; [ -n "$N" ] && H=$(printf '%s' "$N" | tr '[:upper:]' '[:lower:]' | { sha256sum 2>/dev/null || shasum -a 256 2>/dev/null; } | cut -c1-12)
> { printf 'stop\n' >> "$D/${H:-host}-$(date -u +%F).log"; } 2>/dev/null || true
> ```
> ```powershell
> # Windows PowerShell 5.1 — UTF-8 no BOM. Never >> / Out-File (UTF-16LE+BOM) or Add-Content (ANSI;
> # -Encoding utf8 adds a BOM). No-op if the brain is gone. The path is made absolute before the .NET call,
> # which would otherwise resolve it against the process directory instead of $PWD and silently miss.
> try {
>   $b = "<brain>"; if (-not (Test-Path -LiteralPath $b)) { exit 0 }
>   $d = Join-Path (Resolve-Path -LiteralPath $b).ProviderPath "journal\_activity"; [IO.Directory]::CreateDirectory($d) | Out-Null
>   $e = New-Object Text.UTF8Encoding $false; $g = "$d\.gitignore"
>   try { if (-not [IO.File]::Exists($g)) { [IO.File]::WriteAllText($g, "*`n!.gitignore`n", $e) } } catch { }
>   $n = if ($env:COMPUTERNAME) { $env:COMPUTERNAME } else { [Net.Dns]::GetHostName() }
>   $t = -join ([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($n.ToLowerInvariant()))[0..5] | ForEach-Object { $_.ToString('x2') })
>   [IO.File]::AppendAllText("$d\$t-$((Get-Date).ToUniversalTime().ToString('yyyy-MM-dd')).log", "stop`n", $e)
> } catch { }   # a missed marker is acceptable; a broken turn is not
> ```
>
> These are **hook commands**. To test one by hand, save it as a script and run it (`sh marker.sh` /
> `powershell -NoProfile -File marker.ps1`): pasted into an interactive shell, its `exit 0` closes that
> shell when the brain is absent.
>
> **Bound / rollup is AGENT-owned, never the hook.** `/synaptic-consolidate` (Journal Trim) — or
> `/synaptic-maintain` — prunes and rolls up old per-day activity logs. **Not `/synaptic-audit`**: audit
> is diagnose-only and writes nothing; it merely *reports* when the ledger is over its bound. The hook
> only ever blind-appends. **Retention:** a rollup must keep raw logs covering the audit window and
> preserve per-day `boot` counts (they are the yield denominator).
>
> **What this does and does NOT guarantee (read this before quoting it).** The scoping term is
> **SHELL-hook-capable** — a host that demonstrably **executes a shell command** on `Stop` /
> `SessionStart`. That is narrower than "hook-capable": a host may fire hooks that only **surface a
> prompt to the agent**, which is still the instruction layer and therefore still best-effort. Three
> classes, three honest answers:
>
> | Host class | Floor | What we claim |
> |---|---|---|
> | **Shell-hook-capable** | (a0) marker fires | a worked session leaves a **non-empty** activity log regardless of what the agent does |
> | **Hooks present but prompt-only** | **none** | same honesty as hook-less — no mechanical floor |
> | **Hook-less** | **none** | Step 9b reports yield **unknown**; low capture is made **VISIBLE, not prevented** |
>
> The activity marker is **proof-of-life + the yield-audit denominator ONLY** — it is **not** semantic
> capture, and it is **not** the artifact a future Cortex MemoryLog mirrors (that is the semantic
> breadcrumb in `journal/_current.md` — see the dual-write note below).
>
> **Migration (v1.4.0 → v1.5.0).** The v1.4.0 boot heartbeat wrote `- boot: …` **into
> `journal/_current.md`**. v1.5.0 moves the boot event into the activity log so there is **ONE
> authoritative boot ledger**; `/synaptic-upgrade` deploys the (a0) hooks, creates `journal/_activity/`,
> and stops emitting the in-body boot line (existing `- boot:` lines in `_current.md` are harmless
> history — `/synaptic-consolidate` prunes them on its next Journal-Trim pass). `_current.md` keeps only
> its curated Resume Anchor / Watch List / Log + semantic breadcrumbs, protecting its ≤80-line budget.

> **Structured session-summary capture protocol (v1.4.0 — inspired by Engram-class memory-log
> protocols; fully file-based, zero-runtime).** The per-turn `Stop` breadcrumb (layer a) is one terse
> line; **at a session/context boundary** — after a compaction (the `compact` recovery line), at the natural end of the work, or at a manual wrap —
> the agent additionally writes a **short STRUCTURED session summary** into `journal/_current.md`, so
> what survives a context loss is a legible handoff, not a raw scroll. The shape maps onto the journal's
> existing three sections (do not invent a fourth):
>
> - **Goal** → the session's objective, folded into the **Resume Anchor** (*where work stopped / next
>   step*).
> - **Discoveries · Next-Steps** → the open questions, risks, and the next action → the **Watch List** +
>   Resume Anchor's *next step*.
> - **Accomplished** → the dated decisions / consolidation events → one **Log** line each.
> - **Files-touched** → named inline in the relevant Resume-Anchor / Log line (a pointer, not a diff).
>
> This is the **discipline** stolen from Engram's mandatory `mem_session_summary`
> (Goal/Discoveries/Accomplished/Next-Steps/Files) — **not** its engine: no SQLite, no MCP, no runtime,
> no Engram dependency. It is plain text an agent writes to a file the host already has. A future
> **Cortex-mode Engram MemoryLog backend (v2.0)** would supersede this file-journal where a runtime is
> present; this protocol is the **CORE floor** and stands on its own with **zero runtime** (I3).
>
> **Anti-verbosity discipline (binding — the journal is bounded working-memory, not an archive).** The
> session summary is a **concise structured summary, never a "bible."** Four standing rules:
> 1. **Summarize, don't dump.** A handoff a cold agent can act on — objective, what changed, what's next
>    — not a turn-by-turn transcript. (Cross-refs the **Simplicity Guardrail**,
>    `docs/concepts/simplicity-guardrail.md`: keep the surface — here, the journal — small.)
> 2. **Dedup.** Do **not** re-record a breadcrumb/summary line already in `journal/_current.md`; update
>    or extend the existing line instead of appending a near-duplicate.
> 3. **Don't journal what already lives durably in the wiki.** The journal is working-memory/RAM for
>    what must survive context-loss **before** it is consolidated — **not** a copy of curated
>    `knowledge/**` nodes. If a fact is already a durable node, breadcrumb a **pointer** to it, not its
>    contents.
> 4. **Prune/expire on consolidate.** `/synaptic-consolidate` **removes** the breadcrumbs it has promoted
>    or that have gone stale (the Journal Trim step + the retention→structure transform in
>    `references/consolidate.md`) — the journal is bounded (**≤ 80 lines**), never append-forever.
>
> The structured summary is the **expected capture artifact**: `/synaptic-audit`'s capture-yield check
> (`references/audit.md`) reads for this shape, not merely for *any* text.

**Deploy logic (host-gated, idempotent):**

1. **Detect the host harness** from what is present in the project root: `.claude/` → Claude Code
   (`settings.json` hooks); `.github/` → Copilot; Codex / `AGENTS.md` host; `.cursor/` → Cursor
   (`.cursor/hooks.json`); Gemini CLI. Wire **only `Stop` and `SessionStart`** on each (per-host
   coverage: step 5). `PreCompact` and `SessionEnd` exist on some hosts but are **not wired** (their
   stdout does not reach the model; see the layer table).
2. For each supported layer, **write the host's native hook config** (marker-wrapped / idempotent,
   same discipline as the AGENTS.md fragment: replace a `BEGIN:SYNAPTIC-HOOKS` … `END:SYNAPTIC-HOOKS`
   block if present, else add it; never touch unmarked user hooks). The commands are the recipe's
   shell scripts (`recipes/session-end-consolidate.md`, Option A; the skill bundle does not ship the
   recipe, so take them from the repo or a release): `Stop` → the A.0 marker (`stop`) + the A.1
   breadcrumb; `SessionStart` with sources startup / resume / clear → the A.0 marker (`boot`) +
   `synaptic-pending rescue`; `SessionStart` with source `compact` → `synaptic-pending compact` only
   (a compaction is not a new session, so no `boot`). On Windows use the `.ps1` twins. No shell hook can
   run a slash command such as `/synaptic-consolidate`.
2b. **Deploy the layer-(a0) activity marker (v1.5.0) wherever the host runs a shell command on a
   hook** — create `journal/_activity/` and wire the pinned platform-appropriate one-liner (UTF-8
   no-BOM) to `Stop` (`stop`) and to `SessionStart` startup / resume / clear (`boot`; never on `compact`). This is the only layer that does not depend
   on the agent complying, so deploy it first and report whether the host accepted it.
3. **Always deploy `Stop`** (universal). Deploy `SessionStart` (rescue on startup / resume / clear;
   the recovery line on `compact`) where the host supports it. Do not wire `PreCompact` or `SessionEnd`.
4. **Degrade gracefully:** if the host exposes **no usable hooks**, deploy nothing and fall back to
   the **instruction layer**: the breadcrumb contract in `BRAIN.md` still instructs the agent to
   append a one-line journal breadcrumb per meaningful turn *by hand* — **best-effort semantic capture,
   not a floor** (an instruction can simply not be followed). Tell the user plainly: *"This host has no capture hooks — the agent still
   writes per-turn breadcrumbs as an instruction; run `/synaptic-consolidate` manually at the end of
   meaningful work (and `/synaptic-maintain` periodically)."* The brain still works fully; only the
   automation degrades. **Be honest about what remains:** no mechanical floor, so a session CAN end
   with nothing captured; the brain still gives **visibility, not prevention** (Step 9b reports yield
   *unknown*; the half-done/rescue checks still surface abandoned work). That is the CORE-host rule —
   absent → unknown (CORE-host = the optional shell, git, grep and hooks; the repo's matrioshka doc
   states the two tiers).
5. **Per-host degradation floor (what stays when a layer is missing).** The **mechanical** non-empty
   floor is layer (a0) on **shell**-hook-capable hosts only — a host whose hooks merely surface a prompt
   to the agent has **no** mechanical floor, exactly like a hook-less host. The instruction-layer
   breadcrumb is the **best-effort semantic** layer everywhere (never a guarantee):
   - **Claude Code** — Stop + SessionStart (startup / resume / clear, and compact).
   - **Copilot** — Stop + SessionStart; a compaction source is UNVERIFIED → if absent, the next
     boot's rescue (below) or a manual `/synaptic-consolidate` covers it.
   - **Codex / `AGENTS.md` host** — Stop + SessionStart as available; any absent layer →
     instruction-only breadcrumbs + manual `/synaptic-consolidate`.
   - **Cursor** — Stop + SessionStart only → no compaction recovery; the rescue net +
     instruction-only breadcrumbs cover it.
   - **Gemini CLI** — Stop + SessionStart where exposed; anything not exposed →
     instruction-only breadcrumbs + manual `/synaptic-consolidate`.

> **No compaction recovery on this host? SessionStart-rescue is the net.** On any host without a
> compaction source on SessionStart, the next-boot rescue detects the unconsolidated
> breadcrumbs / active playgrounds and offers to consolidate (see `references/audit.md`'s half-done
> check). **Whatever the agent did write** — plus the layer-(a0) activity markers, which are written by
> the host regardless — is still there for the rescue to consolidate on the next session. *(Do not claim
> "nothing is lost": the semantic breadcrumb is best-effort, so an un-captured turn's detail can be
> genuinely gone. What the activity log guarantees is that the session itself is never invisible.)*

> **SessionStart boot marker (capture-INDEPENDENT — the FIRST thing a session writes).** Before the
> rescue detect and before any work, `SessionStart` (startup / resume / clear; not `compact`) records a single **boot marker**. This is
> **decoupled from capture**: it fires even when *nothing else* is captured, so "session opened" is
> counted separately from "work captured." That separation is what lets `/synaptic-audit` (see
> `references/audit.md` Step 9b) distinguish **not-used** (0 boots — benign) from
> **used-but-capture-dead** (boots present, 0 captured — the actionable failure that points to the hook
> smoke-test).
>
> **v1.5.0 changes WHO writes it.** It is no longer "an instruction the agent follows" into
> `journal/_current.md` — it is the **layer-(a0) host shell append** (a `boot` line) into
> `journal/_activity/<host-token>-<date>.log`, so the boot count no longer depends on agent compliance and
> lives in **one authoritative ledger**. On a host with no usable hooks there is no boot marker at all
> (the agent may still note a boot by hand, but Step 9b treats yield as *unknown* there rather than
> inferring anything). No new schema. *(Author-complete; actual firing is verified on a real
> run.)*

> **Per-host activity marker support (v1.5.0 — UNVERIFIED except where stated).** Layer (a0) needs the
> host to run a **shell command** on a hook (not merely surface a prompt to the agent). That capability
> is confirmed only for Claude Code so far; treat the rest as open until a real host proves it — do
> **not** assert parity:
>
> | Host | Config surface | Shell append VERIFIED? |
> |---|---|---|
> | Claude Code | `settings.json` hooks run shell commands | **assumed yes** — both `Stop` and `SessionStart` (same mechanism); verify on a real run |
> | VS Code Copilot | `.github/hooks/*.json` | **UNVERIFIED** |
> | Cursor | `.cursor/hooks.json` | **UNVERIFIED** |
> | Codex / `AGENTS.md` host | as available | **UNVERIFIED** |
> | Gemini CLI | where exposed | **UNVERIFIED** |
>
> **This table is the authority** for which hosts the non-empty guarantee covers. A host is
> **shell-hook-capable** only once its cell says so; "fires hooks" alone is not enough (a prompt-only
> hook is still the instruction layer).
>
> Where (a0) cannot be deployed, say so plainly in the wiring report and fall back to layer (a) as
> best-effort semantic capture + the Step-9b *unknown-yield* posture.

> **Dual-write note (forward contract for a future Cortex MemoryLog).** If a runtime working-memory
> provider is ever wired (Cortex-tier; e.g. an Engram-class MemoryLog), what it must **mirror into the
> brain** is the **semantic journal in `journal/_current.md`** — at **BOTH granularities**, because the
> provider's `append()` is per-entry while a structured summary is only due at a boundary:
>
> 1. **Per-entry / per-turn:** each `append()` mirrors as a **terse one-line breadcrumb** (layer (a)
>    granularity) into `journal/_current.md`.
> 2. **Per session/context boundary:** the **structured 5-field summary** (Goal · Discoveries ·
>    Accomplished · Next-Steps · Files) as described above.
>
> Mirroring **only** at the boundary is not sufficient: a session could make dozens of `append()` calls
> and then die before any session boundary is reached — no summary was ever due, so
> nothing would have been dual-written, and deleting the provider would lose every one of those entries.
> Both granularities together are what keep the git-tracked record *complete* if the provider is deleted.
>
> **Promotion state.** A provider's `promoted` / `promoted_at` fields are explicit **only in its own RAM
> tier**. CORE does **not** gain a journal field for this (that would be a format change): on the CORE
> side an entry is "promoted" **implicitly** — `/synaptic-consolidate` **removes** it from
> `journal/_current.md` once it lives in a `knowledge/**` node. Never in the activity marker.
>
> The layer-(a0) activity log is **not** a mirror target: it is content-free proof-of-life and mirroring
> it would preserve nothing. This distinction is a CORE contract, not an implementation detail.

> **Breadcrumb cadence (decided, v1.6).** Where the `Stop` hook writes breadcrumbs, the agent writes
> only at decision points plus the session-boundary summary; with no hook, one line per meaningful
> turn. The rule's single home is `templates/BRAIN.md` → "Incremental journal breadcrumbs".

**Honest limits (do not overclaim — v1-final §5.9, §9.1):**
- **No agent has native idle detection.** This is **passive, event-driven** capture on hook-capable
  hosts + the per-turn journal as the universal fallback + `SessionStart`-rescue as the safety net —
  **never an unattended idle daemon at CORE**. (An OS-cron/background timer would be **Cortex**, not
  CORE, and is never required.)
- **Compaction recovery is host-conditional;** the `Stop` breadcrumb is best-effort; the only
  mechanical floor is (a0), on the hosts the per-host table marks. Elsewhere: absent → unknown.
- **Breadcrumbs vs promotion are orthogonal:** `capture_policy` governs only how much gets promoted
  into the wiki, never the breadcrumbs.


---

## Journal breadcrumb contract (agent side; moved here from consolidate.md in v1.6)

Consolidation is the *promotion* pass. It sits on top of a cheaper layer that runs continuously and
is **not** governed by `capture_policy`:

- **One terse line per meaningful turn** is written to `journal/_current.md` (where the hook writes
  them, the agent adds only decision points + the boundary summary — cadence note below). This is an
  **instruction the agent follows, not only a hook**: the per-turn `Stop` breadcrumb prompts it where
  wired, but write it even when no hook fires — hooks are host-specific and can silently fail. **Be
  precise about what this is (v1.5.0):** because it is an instruction, it is **best-effort semantic
  capture, NOT the non-empty guarantee** — an agent that does not comply writes nothing, which is
  exactly issue #2a. The **mechanical** floor is the separate layer-(a0) activity marker (layer (a0) above
  — a host-run shell append, agent-independent, **shell**-hook-capable hosts only). This breadcrumb is
  **fixed-cost**: a single line, never a full consolidation, regardless of the capture-policy dial.
- Breadcrumbs **live on disk so they survive a crash** — what only lived in the context window dies;
  what reached the journal can still be consolidated later (including by `SessionStart`-rescue on the
  next boot — see `references/audit.md`).
- Consolidation **consumes** these breadcrumbs: it routes the durable ones into the wiki (consolidate Steps 1–6)
  and trims the rest in the Journal Trim step. A breadcrumb is a *candidate*, not a promotion.
- **Do not** add a second policy dial for breadcrumbs. There are exactly two orthogonal dials:
  `capture_policy` (how aggressively things get **promoted**) and the passivity dial (**when** capture
  triggers). Breadcrumbs are the fixed floor underneath both.

> **Structured session-summary + anti-verbosity discipline (v1.4.0 — inspired by Engram-class
> memory-log protocols; fully file-based, zero-runtime).** At a session/context boundary the agent
> writes a **short STRUCTURED session summary** (not just per-turn lines) mapped onto the journal's
> three sections — **Goal → Resume Anchor · Discoveries/Next-Steps → Watch List + next step ·
> Accomplished → Log · Files-touched → named inline** (see the structured session-summary protocol above for the full shape and
> attribution). The standing discipline: capture **concise structured summaries, never "bibles"**;
> **dedup** (do not re-record a breadcrumb already in the journal); **do not journal what already lives
> durably in the wiki** (breadcrumb a pointer, not the node's contents — the journal is working-memory
> for what must survive context-loss, not a copy of curated knowledge); and **prune/expire** stale
> breadcrumbs on consolidate (`references/consolidate.md` Journal Trim — the journal is bounded, not append-forever).
> Cross-refs the **Simplicity Guardrail** (`docs/concepts/simplicity-guardrail.md`): keep the journal
> surface small. This is the CORE floor; a future **Cortex-mode Engram MemoryLog backend (v2.0)** would
> supersede the file-journal where a runtime is present — this protocol needs **none**.

> **Cadence (decided, v1.6):** where the `Stop` hook writes breadcrumbs, the agent writes only at
> decision points plus the session-boundary summary. Single home: `templates/BRAIN.md` →
> "Incremental journal breadcrumbs".


---

## Why audit Step 9b counts the way it does (rationale; moved here from audit.md in v1.6)

- **"Silent-empty" means used-but-capture-dead**, not "empty brain": boots present, nothing captured.
- **`boot` only, never `stop`, as the session denominator.** `Stop` fires per assistant turn. Summing
  both would turn breadcrumbs-per-**session** into breadcrumbs-per-**turn** and deflate yield by the
  turn count: a 40-turn session with one good summary would score 1/41 instead of 1/1.
- **Per-host scoping.** The ledger is per host by design, and a brain can be shared across machines.
  Globbing every host would (a) let a host with **no** floor compute a yield against another machine's
  boots, and (b) let one host's healthy capture **mask** another host's dead capture.
- **Why the work-signal condition.** Before v1.5.0 a pure-Q&A agent often never wrote the
  instruction-heartbeat, so the brain read as `not-used` → benign *by accident*. Since v1.5.0 the host
  writes activity markers **unconditionally**, so activity is **always** present; without a work
  signal, a legitimate read-only week would fire `HOOKS-APPEAR-DEAD`.
- **The reasoning behind the yield metrics is unchanged from v1.4.0;** only the mechanism moved: the
  countable denominator is the host-written activity ledger instead of the agent-written heartbeat.
