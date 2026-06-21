# /synaptic-maintain — Brain Maintenance Procedure Reference

The **orchestrated diagnose-then-treat sweep** for the whole brain. `/synaptic-maintain` runs the
other lifecycle procedures in the right order and gates every change on approval. It is the single
"keep the brain healthy" entry point — it **coordinates**, it does not re-implement.

Run when: user invokes `/synaptic-maintain`, after a busy stretch, on a periodic cadence, or when
audit reports significant debt.

> **The procedure is CORE-safe; the *timer* is Cortex.** `/synaptic-maintain` is plain skill
> guidance over plain files — pure CORE. Wanting it to run **on a schedule** (e.g. nightly) needs an
> **OS-cron / daemon we add**, which is **Cortex** (no agent has native idle detection). The
> procedure runs identically whether a human invokes it or a Cortex timer triggers it; the brain
> never depends on the timer existing.

---

## What it orchestrates (and what it does NOT re-implement)

`/synaptic-maintain` is a **conductor**. Each leg is an existing procedure with its own reference
file; maintain calls it, never duplicates it:

| Leg | Delegated to | What it does |
|---|---|---|
| **Diagnose** | `references/audit.md` | Find broken links, orphans, stale nodes, **cross-link gaps**, **half-done/unconsolidated** work, pending breadcrumbs. Audit DIAGNOSES; it writes nothing. |
| **Wrap-up / consolidate** | the consolidation/wrap-up prompt in `references/consolidate.md` | Process unconsolidated playgrounds + pending breadcrumbs (rewrite-bias, reconciliation, playground scan, burn scratch). **Maintain INVOKES this prompt — it does not re-implement the algorithm.** |
| **Reconcile** | `references/consolidate.md` Step 5a | Resolve flagged `contradicts`/`supersedes` pairs (supersede-and-rewrite, contradicts-link with `## bias-check`, or flag). |
| **Synthesize** | `references/synthesize.md` | Cross-source patterns, concept evolution, orphan **rescue** (new nodes, MOC-registered at write time). |
| **Repair links/edges** | `references/weave.md` | Treat the cross-link/orphan/missing-edge findings: propose links **+ typed edge type**, near-dup merges. |

> **Diagnose-then-treat is the spine.** `audit` finds; `consolidate` / `synthesize` / `weave` fix.
> Maintain enforces that order so treatment always acts on a fresh diagnosis.

---

## The procedure

Run the legs in order. **Every change is approval-gated** — maintain presents a consolidated plan
and applies only what the user confirms. New, fully-linked synthesis nodes (additive, reversible)
may be written as part of an approved batch; merges, rewrites, deletions are always explicit.

### 1 — Diagnose (audit)

Run the `/synaptic-audit` procedure (`references/audit.md`) end to end. Collect its prioritised
findings, already routed to treating procedures. Write nothing. Carry forward, in particular:

- half-done / unconsolidated playgrounds + pending breadcrumbs → the wrap-up leg
- unresolved `contradicts` / `supersedes` pairs → the reconcile leg
- orphans, cross-link gaps, missing edges, near-duplicates → the synthesize / weave legs

### 2 — Wrap-up / consolidate (INVOKE the consolidation prompt)

For each half-done finding, **invoke the consolidation/wrap-up prompt** from
`references/consolidate.md` — the same algorithm a session-end consolidation runs (classify →
promote → generalize → place-with-rewrite-bias → dedupe → **reconcile (5a)** → quality gate; scan
playground artifacts, distil conclusions, burn scratch; trim the journal). **Do not re-describe or
re-implement those steps here** — there is one consolidation algorithm and it lives in
`consolidate.md`. Maintain's job is to *trigger* it against the diagnosed debt and surface its
proposals for approval.

### 3 — Reconcile contradictions

For each flagged `contradicts` / `supersedes` pair from the diagnosis, apply Step 5a of
`references/consolidate.md`: supersede-and-rewrite the stale page (note *what changed and why*),
or `contradicts`-link with a `## bias-check` note, or flag for human judgment if genuinely unsure.
Diff-traced, git-reversible, archive-before-delete.

### 4 — Synthesize

Run the `/synaptic-synthesize` procedure (`references/synthesize.md`): cross-source patterns,
concept-evolution nodes, and **orphan rescue** for the orphans the diagnosis surfaced. Every new
node is `[[wikilinked]]` + MOC-registered at write time; merges/rewrites are propose-then-approve.

### 5 — Repair links, edges & near-duplicates (weave)

Run the `/synaptic-weave` passes (`references/weave.md`) to treat the remaining structural findings:
add the missing cross-links **with a proposed typed edge type** (Pass 1), connect under-linked
nodes, fill concept gaps, propose near-duplicate merges. Propose, never auto-write.

### 6 — Re-verify & report

Re-run the mechanical portion of `references/audit.md` (or `node tools/check.js` if the optional
Cortex utility is present) to confirm the treatments closed the findings and introduced no broken
links or phantom nodes. Report what was diagnosed, what was treated, and what was deferred.

---

## CORE-safety contract (binding)

- **Approval-gated.** Maintain presents a plan; it applies only confirmed changes. Knowledge deletion
  and persona content are **human-only**; structural changes are propose-then-approve.
- **Every automated edit is diff-traced, git-reversible, archive-before-delete.** This is the bounded,
  reversible AUTO tier — never an autonomous unbounded rewriter.
- **No re-implementation.** Maintain delegates to `audit` / `consolidate` / `synthesize` / `weave`;
  the algorithms live in their own files (single source of truth for each procedure).
- **CORE procedure, Cortex timer.** The procedure is pure files/text. Scheduling it unattended needs
  an OS-cron/daemon we add = Cortex; the brain never depends on it. No native idle detection exists at
  CORE — capture/maintenance is event-driven + journal fallback + `SessionStart`-rescue.
- **No auto-discovery claim (C5).** All edges remain authored; GraphRAG is cited as *the direction*.

---

## Report format

```
MAINTENANCE SWEEP — {date}   [diagnose-then-treat; approval-gated]

Diagnosed (audit): N findings
  - half-done: {playgrounds, pending breadcrumbs}
  - contradictions: {pairs}
  - structural: {orphans, cross-link gaps, near-dups}

Treated (on approval):
  - Consolidated: {playgrounds closed, nodes rewritten, items distilled}   [via consolidate.md prompt]
  - Reconciled: {contradictions resolved / linked / flagged}
  - Synthesized: {new pattern/evolution nodes, orphans rescued}
  - Wove: {links added + edge types, merges}

Deferred (need human judgment): {list}

Re-verify: graph clean / N residual findings.
```

---

## Relationship to the other procedures

- **`/synaptic-audit`** — the diagnosis maintain starts from. Run alone for a read-only health check.
- **`/synaptic-consolidate`** — the wrap-up algorithm maintain invokes. Run alone at session end.
- **`/synaptic-synthesize`** — the generative leg. Run alone to connect an already-curated brain.
- **`/synaptic-weave`** — the link/edge-repair leg. Run alone for a graph-gardening pass.
- **`/synaptic-maintain`** — runs all of the above in diagnose-then-treat order, approval-gated, as
  one sweep. The Cortex OS-cron timer (if installed) simply triggers this same procedure on a cadence.

---

> Maintain conducts; the leg procedures perform. It invokes the consolidation/wrap-up prompt rather
> than re-implementing it, gates every change on approval, and stays CORE-safe — the only Cortex part
> is the optional timer that schedules it.
