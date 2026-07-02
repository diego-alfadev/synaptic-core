# Verb contract — our four verbs vs Cognee's (and why `memify` waits)

*What this is: a short alignment note mapping Synaptic's authored-verb contract against Cognee's, and recording the sharpened conclusion on `memify` — why it is not a separate CORE verb today, and what would have to exist first.*

Synaptic exposes a small, deliberately non-overlapping set of verbs. This note lines them up against Cognee's — the strongest engine-class reference point in this space — to keep our contract crisp and to record *why* we are not adding a `memify` verb yet.

## The two verb sets

| Ours (authored) | Cognee's | Overlap |
|---|---|---|
| `consolidate` — the six-step capture contract (classify → promote → place/link) | `add` (ingest raw) + `cognify` (build graph) | Our `consolidate` spans Cognee's `add`+`cognify`: it both takes in raw session output **and** places/links it into the graph. |
| `weave` — propose missing edges + typed-edge proposals (propose-never-write) | part of `cognify` (auto edge-building) | We author edges (propose → confirm); Cognee auto-infers. Same *goal* (graph connectivity), opposite *epistemics* — authored vs inferred (C5). |
| `synthesize` — write cross-source synthesis nodes | part of `cognify` / retrieval | Generative; no clean Cognee analog. |
| `maintain` — reconcile `contradicts`/`supersedes`, orphan/cross-link repair, archive-before-delete | `memify` (prune stale, reweight edges by USAGE) | **Partial** — see below. `maintain` already does staleness + reconcile + archive-before-delete; `memify` adds a *usage-reweighting* dimension we do not have. |
| *(retrieval — deferred to Cortex)* | `search` | Ours is grep/MOC navigation today; QMD-class retrieval is P3. |

## The sharpened conclusion on `memify`

**`memify` is NOT a separate CORE verb — it overlaps weave+maintain; the only new part (usage-reweighting) needs a usage log CORE lacks, so it is deferred to Phase 4 gated on a usage signal.**

Unpacking that:

- **It overlaps `weave` + `maintain`.** `memify`'s two jobs are (a) prune stale / dead memory and (b) reweight edges by *usage*. Job (a) is already covered: `maintain` reconciles `contradicts`/`supersedes` and does archive-before-delete; the optional lifecycle axis + its completion-cadence audit adds the "cool a quiet node" path; `weave` proposes merges / near-duplicate pruning. So (a) needs no new verb.
- **Job (b) — usage-reweighting — is the only genuinely new capability, and CORE cannot honestly do it today.** Reweighting edges by retrieval traffic **requires a usage log** (which edges/nodes actually got retrieved). CORE ships **no usage log** — it is zero-runtime plain files with no telemetry. Inventing a `memify` verb now would either be a no-op alias for `maintain` (verb bloat) or would imply a self-improvement capability we do not have — an overclaim.
- **Therefore it belongs in Phase 4 (Cortex Intelligence), gated on a usage-signal log.** The roadmap already lists a `memify` maintenance pass (prune stale, reweight edges by usage) alongside the usage-signal that would feed it. This note ratifies that placement and records the reason it is not a P2 CORE verb.

## Why keeping four verbs is the win

The value of holding at `consolidate` / `weave` / `synthesize` / `maintain` is a **crisp, non-overlapping contract** an agent (and a reviewer) can reason about. Adding `memify` before a usage signal exists would blur `maintain` and imply self-improvement we cannot back up — both to be avoided. Usage-weighted self-improvement is a real *direction* worth aiming toward; it is not a capability Synaptic has today, and this note deliberately makes no present-tense claim that it does.

---

**Related:**
- [Typed edges](./typed-edges.md) — the authored-not-inferred edge posture (`weave` proposes, never auto-writes)
- [Capture and consolidation](./capture-and-consolidation.md) — the `consolidate` six-step contract in full
- [Local-vs-remote data boundary](./local-vs-remote-boundary.md) — why CORE ships no telemetry / usage log (the reason `memify` waits)
- Back to the [concepts index](./_index.md) · the [README](../../README.md)
