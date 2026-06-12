# /weave — Graph-Gardening Operation

A deliberate re-wiring and connection-quality pass over the brain. Run periodically or on
demand. Distinct from `/audit` — see the table below.

---

## /audit vs /weave

| | `/audit` | `/weave` |
|---|---|---|
| **Focus** | Correctness & health | Connection quality & completeness |
| **Finds** | Broken `[[links]]`, orphans, stale nodes, missing frontmatter, budget violations | Missing edges, thin clusters, implied-but-unwritten concepts, near-duplicates, underused themes |
| **Output** | Pass/fail health report | Proposals for human/agent confirmation |
| **Frequency** | After each significant consolidation session | Periodically (e.g. after every 10+ new nodes) or on demand |

---

## The five weave passes

Run all five, in order. After each pass, present proposals to the user (or log them in
autonomous mode) — **never auto-rewrite** without confirmation.

### Pass 1 — Missing links (shared context)

For each pair of nodes that share 2+ tags, share significant terms in their descriptions,
or are co-cited from a third node but do not link to each other:

- Propose: add `[[node-b]]` to node-a and/or `[[node-a]]` to node-b.
- State the reason: "shared tags: `[ci, deployment]`" or "co-cited from `[[deploy-playbook]]`".
- Present as a diff; do not write until confirmed.

*When the semantic layer is available (roadmap):* use embedding similarity to catch
non-obvious relations that shared tags miss.

### Pass 2 — Under-connected nodes (≤1 link)

List every node in `knowledge/` that has 0 or 1 outgoing `[[wikilinks]]`.

- For each: propose the most plausible links (to nodes in the same cluster, or to a
  registry/reference it clearly relates to).
- If no plausible link exists: flag as a true orphan — propose either placing it in a cluster
  `_index.md` that references it, or moving it to `references/` if it is purely a lookup doc.

### Pass 3 — Concept gaps

Scan every node for concepts that are **referenced by name** (in body text or frontmatter
descriptions) but have no corresponding node:

- If a concept appears in 2+ nodes with no home: propose creating a new node for it.
- If a MOC (`_index.md` or `INDEX.md`) lists a cluster or entry that has no corresponding
  file: flag as a phantom — propose creating the node or removing the entry.
- Present the gap list before writing any new nodes.

### Pass 4 — Near-duplicate proposals

Search for nodes whose titles, descriptions, or tag sets overlap significantly:

- Propose merges: "nodes `[[topic-a]]` and `[[topic-b]]` appear to cover the same concept —
  merge into one, with the other redirecting?"
- Do not auto-merge. Present the full content of both nodes so the user can judge.
- If the user declines a merge, note it in the node's frontmatter as
  `weave-reviewed: "not-duplicate — differs because …"` to suppress future proposals.

### Pass 5 — Theme promotion (journal/playground → knowledge)

Review `journal/_current.md` and any open `playgrounds/`:

- Apply the **2+-instances rule in reverse**: if a concept, pattern, or problem appears in
  2 or more recent journal entries or playground artifacts but has no node in `knowledge/`:
  propose promoting it to a new knowledge node (type: pattern or knowledge).
- State: "concept X appeared in [playground/feat-123] and [journal 2026-05-31] — promote?"

---

## Output format

Present the full proposal as a structured list before writing anything:

```
WEAVE PROPOSALS — {date}

Pass 1 — Missing links (N proposals):
  - Link [[node-a]] ↔ [[node-b]]: shared tags [x, y]
  - ...

Pass 2 — Under-connected (N nodes):
  - [[node-c]] (0 links) → suggest [[node-d]], [[registry-name]]
  - ...

Pass 3 — Concept gaps (N gaps):
  - "service-mesh" mentioned in [[node-e]], [[node-f]] — no node exists
  - ...

Pass 4 — Near-duplicates (N pairs):
  - [[node-g]] / [[node-h]] — similar descriptions; review for merge
  - ...

Pass 5 — Theme promotion (N candidates):
  - "slow query pattern" in playground/feat-99 + journal 2026-06-01 — promote?
  - ...

Apply all? (y/n/pick)
```

---

## Worked example (generic)

Brain: a software project brain with clusters `infrastructure/`, `ci-cd/`, `team/`.

**Before weave:**
- `[[deploy-checklist]]` (type: playbook, tags: `[ci, deployment]`) has 0 links.
- `[[rollback-procedure]]` (type: playbook, tags: `[ci, deployment]`) has 1 link.
- `[[incident-2024-03]]` in `knowledge/lessons/` mentions "blue-green" twice; no `[[blue-green-deploy]]` node exists.
- Journal last week mentions "flaky tests" three times; no node for it.

**Weave output:**
- Pass 1: propose `[[deploy-checklist]]` ↔ `[[rollback-procedure]]` (shared tags: `[ci, deployment]`).
- Pass 2: `[[deploy-checklist]]` has 0 links — also propose link to `[[ci-pipeline]]`.
- Pass 3: concept "blue-green" referenced in `[[incident-2024-03]]` but no node — propose `[[blue-green-deploy]]` in `ci-cd/`.
- Pass 5: "flaky tests" in journal (3x this week) — promote to `[[flaky-test-pattern]]` in `ci-cd/`?

**After confirmation:** 4 links added, 1 new node created, 1 new node proposed. Graph connectivity improved; orphans cleared.

---

## Semantic layer (roadmap)

When the semantic layer ships (embeddings over nodes), Pass 1 and Pass 3 will use vector
similarity to find non-obvious relations and gaps that shared tags do not surface. The
interface and proposal format stay the same — the detection engine improves silently.

---

> Weave proposes; the human or agent confirms. Never auto-rewrites silently.
