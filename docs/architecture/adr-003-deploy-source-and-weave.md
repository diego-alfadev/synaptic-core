# ADR-003 — Deploy-Source Harness (T1) + Graph Gardening via /synaptic-weave (T2)

**Status:** Accepted  
**Date:** 2026-06-12  
**Deciders:** Synaptic-Core maintainers (spec-driven, Diego Alfaro Sáez review)  
**Supersedes:** None. Refines and extends ADR-002 §2 (separation model) and §4.6 (harness plane).

---

## Context

### T1 — The harness/ plane was misframed as runtime-loaded

ADR-002 defined `harness/` as a "depth-on-demand" folder: the agent would load it from the
brain when working. This created two problems:

1. **Coupling of work-time to the brain.** The agent should read operating rules (commit style,
   guardrails) from its native harness — the place it was designed to read instructions from.
   Reaching into the brain mid-task to load `harness/guardrails.md` is a detour that bypasses
   the harness's core function.

2. **Portability vs. portability confusion.** The harness plane exists because conventions and
   guardrails must travel with the brain — so a teammate inheriting the brain gets the full
   setup, not just the knowledge. But "travels with the brain" does not mean "loaded from the
   brain at runtime." The correct model: the brain is the **portable source**; the outer
   harness is where the agent actually reads from.

   Diego's framing: *"`harness/` is the security copy — regenerable on any machine. The agent
   should be reading the deployed copy, not the source."*

### T2 — Write-time linking leaves the graph under-connected over time

The v1 consolidation formula governs write-time linking: every new node gets `[[wikilinks]]`
at capture time. This is correct and sufficient for individual nodes. But over time, as the
graph accrues 50, 100, 200 nodes, a gap opens: related nodes written months apart are never
linked; implied concepts accumulate with no node; near-duplicates emerge; recurring themes in
the journal never get promoted. Write-time linking only connects a new node to what the author
remembers — it cannot connect nodes that predate the author's awareness.

PKM literature calls this "link maintenance / MOC gardening." It requires a retroactive pass,
distinct from `/synaptic-audit` (which checks correctness), focused on connection quality.

---

## Decisions

### T1 — Reframe harness/ as a deployable SOURCE (not runtime-loaded)

The brain's `harness/` folder is a **portable source of truth** for operating rules. It is
deployed — not loaded — by `/synaptic-init` and `/synaptic-upgrade`.

**The three-concern model:**

| Concern | Lives in | Agent reads from |
|---|---|---|
| Knowledge | brain `knowledge/`, `registries/`, `references/` | the brain (on demand) |
| Operating rules | brain `harness/` = **deployable SOURCE** | outer harness (deployed copy) |
| Persona | outer harness ONLY | outer harness |

**Mechanism:** `/synaptic-init` and `/synaptic-upgrade` run a **Deploy step** that:
1. Reads `harness/conventions.md` + `harness/guardrails.md` from the brain.
2. Writes a `<!-- BEGIN:SYNAPTIC-RULES --> … <!-- END:SYNAPTIC-RULES -->` block in AGENTS.md.
3. Installs `harness/skills/*` into `.claude/skills/` and `.agents/skills/`.
4. Is idempotent: the marked block is fully replaced on re-deploy; unmarked user content is
   never touched.

**Safety fallback:** BRAIN.md carries a 1-line pointer — *"Operating rules + guardrails are
deployed to your harness from `harness/` (run `/synaptic-init` to (re)deploy). If your harness isn't
wired yet, treat `harness/` as the source."* An agent in an unwired environment can read the
source files; the normal path is the deployed outer copy.

**BRAIN.md change:** the `Top Guardrails` block (which duplicated a compressed subset of
`harness/guardrails.md` inline) is removed. BRAIN.md carries the deploy-source pointer
instead. This brings BRAIN.md below 90 lines and removes a double-bookkeeping risk.

### T2 — Add /synaptic-weave (graph-gardening pass)

`/synaptic-weave` is a deliberate, periodic re-wiring pass. It proposes; the human or agent confirms —
it never auto-rewrites.

Five passes:
1. **Missing links** — propose `[[links]]` between related-but-unconnected nodes (shared
   tags, shared terms, co-citation).
2. **Under-connected nodes** — flag nodes with ≤1 link; propose placements.
3. **Concept gaps** — detect concepts referenced (2+ nodes) or implied by a cluster but with
   no node; detect phantom MOC entries vs. reality.
4. **Near-duplicate merges** — surface nodes with overlapping titles/descriptions/tags and
   propose merges.
5. **Theme promotion** — apply the 2+-instances rule retroactively to journal/playground
   content; propose promoting recurring themes to knowledge nodes.

`/synaptic-weave` is a review of the wiring — it does not replace the consolidation formula, which
governs write-time linking. The two are complementary.

---

## Alternatives considered

**T1 — A: runtime-load-from-brain (ADR-002 model).** Rejected. Couples work-time to the
brain path; bypasses the agent's native harness mechanism; trigger-based load is easily missed.

**T1 — B: move rules out of the brain entirely** (AGENTS.md only, no `harness/`). Rejected.
Loses portability — a teammate inheriting the brain would not get the operating setup.
`harness/` stays in the brain as the portable source; only the *runtime read path* changes.

**T2 — write-time linking only** (no retroactive pass). Rejected. Write-time linking is
bounded by the author's memory at capture time. A node from 6 months ago cannot know about
a node written today. The graph under-connects structurally over time regardless of discipline.
`/synaptic-weave` is the complementary maintenance layer the consolidation formula cannot provide.

---

## Consequences

- BRAIN.md is shorter with no double-bookkeeping guardrails block.
- Agents read rules from their native harness path (the designed reading location).
- The brain stays the portable source: full harness regenerable on any machine.
- `/synaptic-weave` gives the graph a maintenance loop; quality compounds rather than degrades.
- Deploy step adds a small obligation to `/synaptic-init`/`/synaptic-upgrade`; it is idempotent and safe.

---

## References

- `synaptic-audit/proposal/07_v1_refinements.md` §T1 and §T2 — the rationale and decisions
  this ADR implements
- `synaptic-audit/spec/SPEC.md` §2, §4.1, §4.6, §4.8 — the separation model and lifecycle
- `seed/.synaptic/BRAIN.md` — the v1 boot file (deploy-source pointer, no guardrails block)
- `seed/.synaptic/harness/README.md` — the deployable-source explanation
- `standalone/synaptic/SKILL.md` — Harness Self-Wire §c (Deploy step), Operations table
- `standalone/synaptic/references/weave.md` — the full /synaptic-weave specification
- `docs/architecture/adr-001-minimal-cortex.md`, `adr-002-llm-wiki-first.md`
