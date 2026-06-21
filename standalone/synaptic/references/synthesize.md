# /synaptic-synthesize — Generative Synthesis Reference

A **generative** pass that runs over the **already-curated brain** and writes **new synthesis
nodes** — connecting what consolidation has already filed. It surfaces cross-source patterns,
captures how a concept has evolved, and rescues orphans by giving them a home.

Run when: user invokes `/synaptic-synthesize`, after a stretch of consolidation has added many
nodes, or as the generative leg of `/synaptic-maintain` (see `references/maintain.md`).

> **Synthesize does NOT replace `/synaptic-consolidate`.** They are different lifecycle stages:
> - **Consolidate** = the *promotion* stage. Routes raw session/journal/playground material **into**
>   the wiki (Steps 1–7 of `references/consolidate.md`).
> - **Synthesize** = the *generative* stage. Runs **over the curated wiki** to write *new* nodes that
>   express relationships consolidation produced but never named (the pattern across five lessons,
>   the arc of a decision over three quarters, the orphan that belongs to a cluster).
>
> Consolidate makes the brain **current**; synthesize makes it **connected and self-aware**. Neither
> substitutes for the other.

---

## CORE-safety contract (binding)

Synthesize **generates; it never silently mutates the SSOT.**

- **MOC write-validation gate (C4/C2).** Every synthesis node it writes gets `[[wikilinks]]` to the
  sources it synthesizes **and** is registered in its cluster `_index.md` (and the cluster in
  `knowledge/INDEX.md`) **at write time** — no phantom nodes, ever. A node that cannot be made
  MOC-reachable is not written.
- **Propose / confirm for merges and promotions.** Generating a *new* synthesis node is the routine
  output. **Merging, rewriting, or deleting existing nodes is propose-then-approve** — synthesize
  surfaces the proposal and waits for confirmation; it does not collapse SSOT on its own.
- **Diff-traced, git-reversible, archive-before-delete** for anything that touches existing content.
- **No auto-discovery claim (C5).** Synthesis is the agent reasoning over **authored** edges and
  content; it does not infer hidden links from embeddings. GraphRAG is cited only as *the direction*.
- **Capture contract applies.** Synthesis nodes obey the same frontmatter (D1), atomicity, and
  quality gate as any consolidated node — they are first-class wiki nodes, not annotations.

---

## The three synthesis passes

Run in order. After each pass, present what would be written/changed and confirm before writing
anything that modifies an existing node. New, fully-linked, MOC-registered synthesis nodes may be
written directly (they are additive and reversible) — but still show them in the report.

### Pass 1 — Cross-source patterns

Look across **multiple already-curated nodes** for a pattern that no single node states:

- A principle that recurs across 3+ lessons (e.g. several incidents all trace to the same root
  cause) → write a `type: pattern` synthesis node that names it and links each contributing node.
- A practice implied by several playbooks but never written as a standalone concept → write the
  concept node; link the playbooks to it (propose the `applies_to` typed edge).
- State the evidence: "synthesized from `[[lesson-a]]`, `[[lesson-b]]`, `[[lesson-c]]` — shared root
  cause." Every cited node is wikilinked from the new node.

### Pass 2 — Concept evolution

Trace how a single concept, decision, or system has **changed over time** using the bi-temporal
markers (*learned-when* / *true-when*), `updated:` dates, and `supersedes`/`superseded_by` edges:

- Where a decision was made, revised, then revised again across separate nodes → write an evolution
  synthesis node that tells the arc ("v1 chose X; superseded by Y in Q2 because …; current state Z"),
  linking each stage in order.
- Where a node's `## bias-check` flags a tension later resolved elsewhere → synthesize the resolution
  narrative and link both.
- Record `supersedes` typed edges where the arc makes the relationship explicit (author one
  direction; inverse via grep). Propose any rewrite of the superseded nodes — do not edit them silently.

### Pass 3 — Orphan rescue

For each node that audit/weave flagged as an **orphan** (unreachable, or 0–1 links) but that holds
durable knowledge:

- Find the cluster and the related nodes it belongs with; **write the connective tissue** — a
  synthesis node or the missing links that give the orphan a home — and register it in the MOC.
- If an orphan has no real home, do not fabricate one: flag it for `/synaptic-weave` (move to a
  cluster `_index.md`, relocate to `references/`, or — with explicit human approval — retire). Orphan
  *rescue* is generative; orphan *deletion* is human-only.

---

## Output format

Present the full proposal before writing anything that modifies existing nodes:

```
SYNTHESIS PROPOSALS — {date}   [generates new nodes; merges/rewrites are propose-then-approve]

Pass 1 — Cross-source patterns (N new nodes):
  - NEW [[shared-root-cause-pattern]] (type: pattern) ← synthesizes [[lesson-a]], [[lesson-b]], [[lesson-c]]
    Registered in: knowledge/lessons/_index.md
  - ...

Pass 2 — Concept evolution (N new nodes):
  - NEW [[auth-strategy-evolution]] ← [[auth-v1]] →(supersedes)→ [[auth-v2]] →(supersedes)→ [[auth-current]]
    Proposes rewrite of [[auth-v1]] status → superseded (CONFIRM)
  - ...

Pass 3 — Orphan rescue (N nodes):
  - [[stray-runbook]] (orphan) → NEW links to [[deploy-service]] + register in knowledge/ops/_index.md
  - [[old-spike-notes]] (orphan, no home) → flag for /synaptic-weave (relocate or retire)
  - ...

Write new nodes? Apply proposed merges/rewrites? (y / n / pick)
```

Every NEW node listed already carries full D1 frontmatter, `[[wikilinks]]` to its sources, and a
cluster `_index.md` registration — that is the precondition for it being written at all.

---

## Worked example (generic)

Brain (post-consolidation): `knowledge/lessons/` holds `[[timeout-incident-q1]]`,
`[[timeout-incident-q2]]`, `[[timeout-incident-q3]]` — three separate post-mortems, each linked only
to its own ticket. `knowledge/ops/retry-playbook.md` exists but links to nothing. `old-spike.md` sits
in `knowledge/` registered in no `_index.md`.

**Synthesize output:**
- Pass 1: the three timeout incidents share one root cause (missing backoff). → NEW
  `[[unbounded-retry-pattern]]` (type: pattern) linking all three; propose `applies_to` from
  `[[retry-playbook]]`.
- Pass 2: the q1→q2→q3 sequence shows the retry policy tightening each quarter. → NEW
  `[[retry-policy-evolution]]` telling the arc, with `supersedes` edges between the policy nodes.
- Pass 3: `old-spike.md` is an orphan whose content matches `ops/`. → propose links + register in
  `knowledge/ops/_index.md`; if no fit existed, flag for `/synaptic-weave`.

**After confirmation:** 2 new pattern/evolution nodes (fully linked + MOC-registered), 1 orphan
rescued. The brain is now more *connected*, with no SSOT mutated without approval.

---

## Anti-Patterns

- **Do not write a phantom node:** no synthesis node without `[[wikilinks]]` + MOC registration at write time.
- **Do not silently merge or delete:** merges, rewrites, and deletions are propose-then-approve.
- **Do not claim auto-discovery:** synthesis reasons over authored edges/content; it does not infer hidden links.
- **Do not duplicate consolidation:** synthesize runs over the *curated* brain; routing raw session/playground material is `/synaptic-consolidate`'s job.
- **Do not invent a home for a true orphan:** rescue where a real cluster fits; otherwise flag for `/synaptic-weave`. Deletion is human-only.

---

> Synthesize generates new, fully-linked nodes over the curated brain; merges and rewrites are
> proposed, never silent. It complements consolidate — it does not replace it.
