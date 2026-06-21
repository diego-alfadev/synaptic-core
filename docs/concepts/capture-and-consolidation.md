# Capture is a dial — and the consolidation formula behind it

*What this is: how a Synaptic brain grows — two orthogonal dials that control when and how much gets captured, the always-on breadcrumb floor underneath them, the six-step consolidation formula that turns raw work into navigable knowledge, the honest manual trade, and a suggested cadence.*

The #1 question people ask is *"do I have to babysit this?"* The answer is **no — capture is a dial, and the default leans passive.** You decide how much the agent does for you versus how much you do by hand. There are **two orthogonal dials**, plus an always-on floor underneath them.

## Dial 1 — the passivity dial: *when* capture triggers

Set it where you like:

| Setting | What happens | Good for |
|---|---|---|
| **Manual** | You run `/synaptic-consolidate` when you choose | Maximum control |
| **Event-driven (recommended)** | Hooks fire on agent events — a one-line journal breadcrumb every turn, a flush before the context window compacts, a rescue sweep on next session start | Most people; the agent does the remembering |
| **Where-supported automation** | On hosts that support it, more of the lifecycle runs without prompting | Long or heavy sessions |

### The always-on breadcrumb floor

Underneath all settings is an **always-on, fixed-cost floor**: a terse one-line **breadcrumb to the journal** on each meaningful turn. It lives on disk, so it survives a crash — what only lived in the context window dies; what hit the journal does not. This floor is *not* governed by `capture_policy`; it is the safety net.

### The honest limit on "passive"

**No agent has native idle detection.** "Passive" here means *event-driven on hook-capable hosts* (a per-turn `Stop` breadcrumb on all agents; a pre-compaction flush and a next-session rescue where the host supports them) — plus the journal as the universal fallback. It is **not** an unattended daemon watching you work. We say this plainly so the dial is not mistaken for magic.

## Dial 2 — the `capture_policy` dial: *how much* reaches the wiki

A separate, orthogonal valve set in `BRAIN.md`. Where the passivity dial controls *when* the formula runs, this controls *how much* of what it sees gets promoted into the curated wiki:

| Policy | Behaviour | Use when |
|---|---|---|
| `selective` | Crown-jewels only — reusable decisions, lessons, and patterns seen 3+ times. The journal/playgrounds absorb the rest. | You want a tight, high-signal wiki. |
| `balanced` *(default)* | Wiki-first with generous journaling — promote at 2+ instances or clearly-reusable knowledge. | Most projects. |
| `capture-all` | Capture almost everything — durable-ish notes promoted on first sight. | This brain is your **only** memory layer (no separate searchable store). |

Same 6-step formula, one tunable valve — it changes *how much* gets promoted, never *how* the graph is built. A custom 1-line policy overrides the presets. (The journal breadcrumb floor is unaffected — `capture_policy` governs promotion to the wiki, not the breadcrumbs.)

The two dials are genuinely **orthogonal**: passivity decides *when* the formula fires (manual / hooks / more automation), `capture_policy` decides *how much* survives the formula into the wiki. You can run fully manual with `capture-all`, or fully event-driven with `selective` — any combination is valid.

## The consolidation formula (6 steps)

The **capture contract** (embedded in every `BRAIN.md`) is a six-step agent-agnostic algorithm. Any agent that runs this formula produces a navigable graph — not a pile of notes.

1. **Classify** — durable knowledge · tabular record → registry · lesson · decision · big task → playground · temporal → journal · noise → drop
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
| **Each session** | `/synaptic-consolidate` (or let the event-driven hook offer it) — apply the 6-step capture contract to what was produced |
| **Weekly** | `/synaptic-audit` — **diagnose** staleness, orphans, broken links, MOC gaps, cross-link (horizontal) coverage, and half-done / unconsolidated work + pending breadcrumbs (audit diagnoses; weave/consolidate/synthesize treat) |
| **Periodically** (after a stretch of consolidation) | `/synaptic-synthesize` — generative pass that writes new synthesis nodes over the curated brain (cross-source patterns, concept evolution, orphan rescue), MOC-validated at write time |
| **Monthly** | `/synaptic-weave` — retroactive graph-gardening: missing links (+ typed-edge proposals), near-duplicates, theme promotion |
| **Monthly, or when audit reports debt** | `/synaptic-maintain` — the orchestrated diagnose-then-treat sweep that runs all of the above in order, approval-gated (CORE procedure; an unattended schedule would be optional Cortex) |

Without some cadence the brain drifts. With it, quality compounds.

> **Tip:** the optional host-run hook config that wires the event-driven setting (the breadcrumb floor, a pre-compaction flush where supported, and a next-session rescue sweep) ships as a recipe in the repo. Hooks are plain host-run config — they are CORE, not a runtime we ship.

---

**Related:**
- [Navigation and planes](./navigation-and-planes.md) — where step 4 ("place & link") puts a node and how it stays reachable
- [Typed edges](./typed-edges.md) — the relationships `/synaptic-weave` proposes during graph-gardening
- [Epistemic honesty](./epistemic-honesty.md) — the source/confidence metadata stamped at the quality gate
- [Architecture (Matrioshka)](./architecture-matrioshka.md) — why hooks are CORE, not a shipped runtime
- [RAG vs wiki vs brain](./rag-vs-wiki-vs-brain.md) — the write-time-curation bet this formula implements
- Back to the [concepts index](./_index.md) · the [README](../../README.md)
