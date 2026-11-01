<!-- summary: The node contract — one home for the frontmatter schema (fields, enums, read semantics, lifecycle, typed edges) and the skill-side default autonomy tiers. -->

# Node contract — frontmatter schema + default autonomy tiers

> **One home.** This file is the only skill-side definition of the frontmatter schema and of the
> default autonomy tiers (the typed-edge vocabulary stays in `references/weave.md`, §4 below).
> consolidate, audit, handover, maintain and the node template point here; `tools/check.js`
> (`STATUS_ENUM`) is the mechanical enforcer where Node exists. `templates/` copies into every brain
> and drifts, so the node template keeps only the field list plus a short gloss a skill-less agent can
> work from. Adding an **optional** field never bumps the brain `schema_version`.

## 1. Fields

| Field | Required | Values | Read semantics |
|---|---|---|---|
| `description` | yes | one self-contained line | what a cold agent needs to know without opening the node (MOC lines carry their own routing text: `references/consolidate.md` Step 4) |
| `type` | yes | `knowledge` \| `pattern` \| `playbook` \| `decision` \| `reference` \| `lesson` \| `registry` | — |
| `status` | yes | `active` \| `stale` \| `archived` | missing → a `check.js` ERROR, never a default; an **unknown/mistyped** value reads as **`untriaged`** (neither trusted-current nor stale), never silently promoted to `active` |
| `updated` | yes | `YYYY-MM-DD` | stamped only when the node is actually rewritten (never from mtime, never mass-stamped) |
| `tags` | yes | list | the faceted-search / future index surface |
| `lifecycle` | no | `project` \| `area` \| `resource` \| `dormant` | absent → `area`; a label, never a filter (§3) |
| `source` | no | path / URL / "session YYYY-MM-DD" | provenance: every claim traceable to its origin |
| `content_hash` | no | `sha256-lf:<12 hex>` \| `TBD` | brains **outside git** only; legacy `git:` / `sha256:` = unverifiable. Commands: `references/fingerprint.md` |
| `confidence` | no | `high` \| `medium` \| `low` | how settled the knowledge is |
| `true_since` / `learned_on` | no | `YYYY-MM-DD` | bi-temporal recency: when the fact became true vs when the brain captured it |
| typed edges | no | §4 | the frontmatter wikilink **is** the edge |

A `## bias-check` section in the body records what is not yet known, contradicting evidence, and the
conditions under which the node would change.

## 2. `status` vs `lifecycle` — two orthogonal fields

`status` answers *is this content current and correct?*; `lifecycle` answers *what kind of attention
does it need (live, standing, reference, parked)?* The tokens `archived` / `dormant` differ on purpose
so the two enums never collide.

- **Neither field hides a node.** `lifecycle` labels; `status` flags — a stale-but-relevant node is
  **flagged (`⚠ stale`), not hidden**. Audit and handover read ALL statuses and ALL lifecycles: a
  binding `lifecycle: dormant` + `status: active` decision MUST still appear in a handover brief.
- **Combined example:** `status: active` + `lifecycle: dormant` is valid (true content, finished
  project). Flip `lifecycle` for actionability changes; reserve `status: archived` for superseded or
  dead content (pair it with a `supersedes` edge). An archived node keeps its `_index.md` line and SHOULD
  get the suffix ` (archived — superseded by [[successor]])` on its routing text, so the MOC stays honest
  (same idea as the optional ` (dormant)` suffix; no `check.js` change is needed).
- **Typos:** an off-vocabulary `status` reads as `untriaged`; an off-vocabulary `lifecycle` reads as
  `area`. `/synaptic-audit` Step 1b surfaces both (advisory).

## 3. Lifecycle axis (optional actionability label)


Knowledge nodes (and registries, where meaningful) MAY carry one optional frontmatter field —
`lifecycle:` — that labels **what kind of attention a node needs** (live effort, standing
responsibility, someday reference, cooled off). Audit and handover read it. It is **not a load
filter**: retrieval always goes through the MOCs, and a node's lifecycle never decides whether it is
read. It applies to `knowledge/**` and
`registries/` only; it is **never** used on `playgrounds/` or `journal/` (those are the separate
raw/working layer, governed by consolidation, not by a lifecycle field). Adding it does **not** bump
the brain schema — it is additive optional frontmatter, the same class as typed edges and provenance.

**Field + values (closed enum, exactly four):**

```yaml
lifecycle: project | area | resource | dormant
```

- `project` — a disposable **hot node**: a live, time-boxed effort. Links OUT to durable nodes.
- `area` — an ongoing responsibility / durable domain node with no end date. **The default for
  un-tagged nodes.**
- `resource` — reference material relevant *someday*, not current work.
- `dormant` — cooled off: kept for the record. Reversible (see below).

**Default / absent (backward-compatible).** A node **without** `lifecycle:` is treated as **`area`**.
Absence is legal, never an error; a skill-less or older-skill agent that does not understand the field
simply ignores it.

**MOC visibility is unaffected:** a node's lifecycle never removes it from its cluster `_index.md`
(de-registration would orphan it). *(Before v1.6 this section also defined a "default-load set";
nothing ever consumed it, so it was dropped — decision X11.)*

**Archive-don't-delete demotion (reversible cooling, never a delete).**

- **Demote:** flip `lifecycle: dormant`. Keep the file in place; keep its `_index.md` entry
  (optionally append " (dormant)" to its routing text so the MOC stays honest); keep all its
  `[[wikilinks]]` and typed edges intact. Archiving must not sever the graph.
- This is **decoupled from `status`** — demotion flips `lifecycle` **only**; do NOT also set
  `status: archived`. `status` stays the orthogonal editorial-trust field (a node can be
  `status: active` + `lifecycle: dormant`).
- **Promote (reverse):** flip `lifecycle:` back to `project` / `area` when it becomes live again —
  a single-field edit, no other change required. Nothing was deleted, so nothing is lost.
- **Boundary with hard delete:** deletion stays a separate, explicit, approval-gated
  `/synaptic-maintain` action ("archive-before-delete"). The lifecycle `dormant` flip is the softer,
  in-graph, reversible step *before* any maintain-delete.

**`project`-links-out convention (no new `type:` token).** `project` is a *lifecycle* value, not a
`type:`. A project node keeps a normal `type:` (usually `knowledge` or `decision`) and carries
`lifecycle: project` — the `type:` enum is unchanged. A project node SHOULD carry ≥1 outgoing typed
edge (`relates_to` / `depends_on` / `part_of`) to a durable `area`/`resource` node, so when it is
cooled to `dormant` the durable knowledge survives independently. Audit/weave may flag a `project`
node with **zero** outgoing durable edges — a diagnose-only finding, never an auto-fix.


## 4. Typed edges (frozen vocabulary)

Optional frontmatter wikilink lists; the frontmatter wikilink **is** the edge. The frozen vocabulary,
its inverses, the block-list (parser-safe) form and the `part_of` misuse rule are defined once, in
`references/weave.md` ("Frozen typed-edge vocabulary"); the node template lists the same keys.

## 5. Autonomy tiers — the skill-side default

**Precedence:** if the brain's own `harness/guardrails.md` (deployed into the harness) has an Autonomy
Tiers table, **that table governs entirely**, and an action it does not name is **PROPOSE-THEN-APPROVE**
(a default must never loosen a stricter brain). This table applies **only** to a brain whose
guardrails have no tier table at all (an older brain). New brains get a copy of it from
`templates/harness/guardrails.md` at init, so a later change to this default reaches only table-less
brains; it never rewrites a brain's guardrails.

Every automated edit is **diff-traced, git-reversible, and archive-before-delete**. The tier sets how
much approval is required.

| Tier | Scope | Examples |
|---|---|---|
| **AUTO** (bounded + reversible) | Act without asking; the change is small, reversible, and on record. | Append a journal breadcrumb · reindex / regenerate a derived cache · author the `contradicts` / `supersedes` edge for a pair the user confirmed · capture a decision EXPLICITLY stated in the session · fix a broken `[[wikilink]]`. |
| **PROPOSE-THEN-APPROVE** | Draft the change and surface it; apply only on a yes. | Promote a node / merge or split nodes · restructure a cluster or MOC · rewrite an existing node during consolidation · author a `contradicts` / `supersedes` edge the user has not confirmed · change a registry's schema · supersede a page's substance. |
| **HUMAN-ONLY** | Never automate; the human does it (or explicitly directs it each time). | Delete knowledge · purge / burn anything beyond a consolidated playground · edit persona/behavior (lives in the harness, not the brain) · irreversible ops (force-push, schema migration, secret rotation). |

Self-improving is bounded and reversible only: structural change is propose-then-approve; deletion
and persona are human-only.
