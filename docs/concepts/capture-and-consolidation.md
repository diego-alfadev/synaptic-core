# Capture is a dial — and the consolidation formula behind it

*What this is: how a Synaptic brain grows — two orthogonal dials that control when and how much gets captured, the always-on breadcrumbs underneath them (and the one mechanical floor), the six-step consolidation formula that turns raw work into navigable knowledge, the honest manual trade, and a suggested cadence.*

Capture depends on the selected and verified host profile. Files and agent instructions provide an
assisted baseline; native hooks can add actual event-driven recording. An optional model workflow
can curate saved sources when its trigger and persisted result have been demonstrated. These are
separate capabilities. See the [operating contract](../OPERATING-MODEL.md) for current evidence limits.

## Dial 1 — the passivity dial: *when* capture triggers

Set it where you like:

| Setting | What happens | Good for |
|---|---|---|
| **Manual** | You run `/synaptic-consolidate` when you choose | Maximum control |
| **Event-driven recording** | Verified native hooks record their configured event evidence; changed paths require a tested source | Hosts permitting the specific hook dialect |
| **Bounded automatic curation** | A real event requests model work on selected saved sources, with a checked persisted outcome and visible failure | Separately tested profiles; not enabled merely by writing instructions |

### The always-on breadcrumbs (and the one mechanical floor)

Underneath all settings is an **always-on, fixed-cost instruction**: a terse one-line **breadcrumb to the journal** on each meaningful turn (where the `Stop` hook already records the touched files, the agent writes only at decision points plus the session-boundary summary). It lives on disk, so it survives a crash — what only lived in the context window dies; what hit the journal does not. It is *not* governed by `capture_policy`; it is the safety net. It is **best-effort**: an instruction can be skipped. (The ledger has no time of day in its lines; file modification times and a sync service's version history can still reveal timing.) The only mechanical non-empty floor is the activity marker, a content-free line the host itself appends to `journal/_activity/` on hosts that run a shell command on a hook.

### The honest limit on "passive"

Synaptic supplies no universal idle detector. Event-driven behaviour requires a permitted, enabled
and genuinely fired native event in the actual host. A per-turn instruction remains best-effort
agent work. An event marker does not prove semantic capture of the conversation, and a source-based
curation adapter cannot curate unsaved facts it never receives. No running observer means a later
failure may remain unnoticed until an explicit check.

## Dial 2 — the `capture_policy` dial: *how much* reaches the wiki

A separate, orthogonal valve set in `BRAIN.md`. Where the passivity dial controls *when* the formula runs, this controls *how much* of what it sees gets promoted into the curated wiki:

| Policy | Behaviour | Use when |
|---|---|---|
| `selective` | Crown-jewels only — reusable decisions, lessons, and patterns seen 3+ times. The journal/playgrounds absorb the rest. | You want a tight, high-signal wiki. |
| `balanced` *(default)* | Wiki-first with generous journaling — promote at 2+ instances or clearly-reusable knowledge. | Most projects. |
| `capture-all` | Capture almost everything — durable-ish notes promoted on first sight. | This brain is your **only** memory layer (no separate searchable store). |

Same 6-step formula, one tunable valve — it changes *how much* gets promoted, never *how* the graph is built. A custom 1-line policy overrides the presets. (The journal breadcrumbs are unaffected — `capture_policy` governs promotion to the wiki, not the breadcrumbs.)

The two choices are independent: a verified trigger determines when its configured operation runs;
`capture_policy` guides what the model promotes when consolidation actually runs. A recording hook
does not execute the consolidation formula. The candidate's optional automatic curation draft is
also distinct from promotion into the wiki.

## The consolidation formula (6 steps)

The **capture contract** (embedded in every `BRAIN.md`) is a six-step agent-agnostic algorithm. Any agent that runs this formula produces a navigable graph — not a pile of notes.

1. **Classify** — durable knowledge · tabular record → registry · lesson · decision · task → `tasks/INDEX.md` row (playground only if not resumable from the request + current state) · candidate → `proposals/INDEX.md` row · temporal → journal · noise → drop
2. **Atomicity test** — promote only when it recurs (2+ instances → pattern) or is a reusable decision/lesson; incident-specifics stay in playground/journal
3. **Generalize** — strip the anecdote, keep the reusable pattern; name = the concept, not the ticket
4. **Place & link** — atomic node in the right cluster; D1 frontmatter; `[[wikilinks]]`; register in cluster `_index.md`
5. **Dedupe / SSOT** — search first; update, don't duplicate; one source of truth per fact
6. **Quality gate** — professional & verifiable only; soft budget ~150 lines or tag `type: reference`; stamp `updated:`; confirm reachable from a MOC

This formula runs after every session via `/synaptic-consolidate`. It is what makes the brain accrete *correctly* — encoding both **intention** (what belongs) and **inertia** (how it grows). The `capture_policy` dial tunes step 2's threshold; the rest of the formula is identical at every setting.

## The honest manual trade

The dial removes the *fatigue*, not the *trade*. The brain does not grow on its own: somewhere, the 6-step capture contract has to run — whether you trigger it or a hook does. When it runs you pay **~5–10 minutes of curation per active session** (classify, generalize, link, gate). In exchange you erase the re-briefing tax on every future session, the onboarding tax for every new teammate or agent, and the handover tax when the project ends.

Not "zero overhead" — a deliberate trade of a little write-time cost for large read-time leverage. Set the dial to passive and the agent carries most of that cost for you; set it to manual and you keep full control. The contrast with passive auto-notes is the point: an auto-notes pile grows linearly and rots, because volume is the product. A Synaptic brain compounds, because curation is the product and the log is just the safety net underneath it.

## A suggested cadence (whichever dial you choose)

| When | Action |
|---|---|
| **Each session** | `/synaptic-consolidate` (or let the next boot's rescue hook offer it) — apply the 6-step capture contract to what was produced |
| **Weekly** | `/synaptic-audit` — **diagnose** staleness, orphans, broken links, MOC gaps, cross-link (horizontal) coverage, and half-done / unconsolidated work + pending breadcrumbs (audit diagnoses; weave/consolidate/synthesize treat) |
| **Periodically** (after a stretch of consolidation) | `/synaptic-maintain synthesize` — generative pass that writes new synthesis nodes over the curated brain (cross-source patterns, concept evolution, orphan rescue), MOC-validated at write time |
| **Monthly** | `/synaptic-maintain weave` — retroactive graph-gardening: missing links (+ typed-edge proposals), near-duplicates, theme promotion |
| **Monthly, or when audit reports debt** | `/synaptic-maintain` — the orchestrated diagnose-then-treat sweep that runs all of the above in order, approval-gated (CORE procedure; an unattended schedule would be optional Cortex) |

Without some cadence the brain drifts. With it, quality compounds.

> **Tip:** the optional host-run hook config that wires the event-driven setting (the breadcrumbs, the activity marker, a recovery line after a compaction where supported, and a next-session rescue sweep) ships as a recipe in the repo. Hooks are plain host-run config — they are CORE, not a runtime we ship.

---

**Related:**
- [Navigation and planes](./navigation-and-planes.md) — where step 4 ("place & link") puts a node and how it stays reachable
- [Typed edges](./typed-edges.md) — the relationships `/synaptic-maintain weave` proposes during graph-gardening
- [Epistemic honesty](./epistemic-honesty.md) — the source/confidence metadata stamped at the quality gate
- [Architecture (Matrioshka)](./architecture-matrioshka.md) — why hooks are CORE, not a shipped runtime
- [RAG vs wiki vs brain](./rag-vs-wiki-vs-brain.md) — the write-time-curation bet this formula implements
- Back to the [concepts index](./_index.md) · the [README](../../README.md)
