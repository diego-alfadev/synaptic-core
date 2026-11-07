<!-- summary: The node contract — one home for the frontmatter schema (fields, enums, read semantics, lifecycle, typed edges), the skill-side default autonomy tiers, and the work-item formats (proposals, tasks, playgrounds). -->

# Node contract — frontmatter schema + default autonomy tiers + work items

> **One home.** This file is the only skill-side definition of the frontmatter schema and of the
> default autonomy tiers (the typed-edge vocabulary stays in `references/weave.md`, §4 below), and of the
> work-item formats (§6).
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
| **AUTO** (bounded + reversible) | Act without asking; the change is small, reversible, and on record. | Append a journal breadcrumb · reindex / regenerate a derived cache · author the `contradicts` / `supersedes` edge for a pair the user confirmed · capture a decision EXPLICITLY stated in the session · fix a broken `[[wikilink]]` · consolidate may add a proposal row (a candidate nobody committed to; reversible). |
| **PROPOSE-THEN-APPROVE** | Draft the change and surface it; apply only on a yes. | Promote a node / merge or split nodes · restructure a cluster or MOC · rewrite an existing node during consolidation · author a `contradicts` / `supersedes` edge the user has not confirmed · change a registry's schema · supersede a page's substance · promote or drop a proposal. |
| **HUMAN-ONLY** | Never automate; the human does it (or explicitly directs it each time). | Delete knowledge · purge / burn anything beyond a consolidated playground · edit persona/behavior (lives in the harness, not the brain) · irreversible ops (force-push, schema migration, secret rotation). |

Self-improving is bounded and reversible only: structural change is propose-then-approve; deletion
and persona are human-only.

## 6. Work items — proposals, tasks, playgrounds (v1.7)

One pipeline, one shape: an **index table plus one folder per item that needs more than a row**.

```
proposals/INDEX.md   ── promote ──▶   tasks/INDEX.md   ── grows large ──▶   playgrounds/<id>/tasks.md
(candidates)                          (every task, one row)                 (only when the resume test fails)
```

**Nothing exists until it is used.** A new brain has no `proposals/` and no `tasks/`; the first
proposal or task creates its index from `templates/proposal-index.md` / `templates/task-index.md`.
No empty ceremony.

**Ids.** `P<n>` and `T<n>`, one sequence each per brain (`P1`, `P2`, …), never reused, never
renumbered. A row that is done or dropped keeps its id.

**Not every "proposal" is a `P<n>`.** A change that maintain or consolidate drafts for approval (a merge,
a rewrite) is an approval request, not a work item; only a candidate the owner may want to do later
gets a `proposals/INDEX.md` row.

**Stale work items:** a row not updated within its `stale_after` (when the brain sets one) or 14 days is
stale. Audit and the situation report use the same rule.

**Status vocabulary (one, for every work item and every task line):**

| Mark | Meaning | Rule |
|---|---|---|
| `[ ]` | open | the default |
| `[x]` | done | only with observed proof: a path, a result, a link (for a promoted proposal, its `T<n>`). No proof → it stays open |
| `[-]` | dropped | always with a reason |

A checkbox grants no approval: ticking `[x]` never authorises an action the autonomy tiers (§5) gate.

**`tasks/INDEX.md` row:** `| id | status | title | home | from | note | updated |`

- `home` is one of (brain-relative paths; another tool's file is resolved from the workspace root): `inline` (a small task: the row **is** the task); `playgrounds/<id>/tasks.md` (or
  `playgrounds/<id>/` for a playground without a `tasks.md`, such as one moved from an older journal); an
  `odd/tasks/<feature>.md` file (or another tool's task file), **read in place, never copied**; or
  `proposals/P<n>-<slug>/` when the details still live with the proposal.
- `from` is `P<n>` when the task was promoted from a proposal, else `—`.
- `note` is the proof when `[x]` (a path, a result, a link) or the reason when `[-]`; empty while open.
- Opening a playground for an existing task changes that row's `home`: same row, same `T<n>`, never a
  second row.
- `updated` is `YYYY-MM-DD`, stamped when the row (or its home) actually changes.

**`proposals/INDEX.md` row:** `| id | status | title | from | to | note | updated |`

- `from` is the provenance: a journal date, a node, a session (`session YYYY-MM-DD`).
- `note` is the proof or the reason, as for tasks.
- `to` is `T<n>` once promoted (*Promotion*, below), else `—`.
- A proposal that needs more than a row gets `proposals/P<n>-<slug>/` with its details and references.

**Promotion (proposal → task; the one home of this procedure).** PROPOSE-THEN-APPROVE (§5): the owner
approves each promotion. Then the agent:

1. takes the next free `T<n>`;
2. writes the task row with `from: P<n>` and a `home`: a playground if the resume test (below) fails;
   otherwise `inline`, or the proposal's `proposals/P<n>-<slug>/` when its details live there;
3. sets the proposal row to `[x]` with `to: T<n>` and the task id as the proof in `note`;
4. stamps `updated` on both rows.

Never renumber; never delete the proposal row. Dropping a proposal is `[-]` with the reason in `note`,
also owner-approved. Consolidate may add proposal rows (AUTO in the default tiers) and list candidates to promote; it never
promotes by itself. Promotion grants no approval for the work itself: the task's actions stay gated by §5.

**The resume test (the playground gate, workflow-neutral).** Open a playground, with a `tasks.md`, only
when the work is **not** resumable from the request plus the work's current state: a diff, a document,
a spreadsheet, whatever the work is. Otherwise the task is one `inline` row. No git assumption, no
workflow assumption.

**`playgrounds/<id>/tasks.md`** (template `templates/tasks.md`) has five parts: a header (goal, owner,
links); `## Specs` (`S1`, `S2`, … quoted verbatim from the requester, assumptions marked);
`## Tasks` (`- [ ] T1 (S1) what · proof`, optional `Risk:` line); `## Log` (`L1` = the original request
verbatim, then dated, append-only lines); `## Key Learnings` (1–5 items, the first thing consolidate
reads). Task ids inside a `tasks.md` are local to that file; its brain-level row has its own `T<n>`, and a
reference from outside the file uses the qualified form `T7/T1` (brain task `T7`, its local `T1`). The shape is compatible with ODD task files; Synaptic adopts the artifact, not a workflow.

**`playgrounds/<id>/scratch/`** holds intermediates (images, generated files, data pulls). It is never
consolidated unless `tasks.md` or an artifact references a file in it, never audited, and deleted when
the playground is burned or archived (archiving keeps the artifacts, never the scratch). In a git brain,
`playgrounds/.gitignore` (`*/scratch/`) keeps it out of history; a `scratch/` that git already tracks
needs `git rm -r --cached` once, with the owner's OK. A synced folder still syncs it (accepted: the point is no history bloat).

**Read sources in place (SRC-1).** A task file another tool owns (`odd/tasks/*.md`, a host's task list)
is linked from a row and read where it is. Synaptic never copies it into the brain.

**Registry of playgrounds.** A playground is registered by a row in `tasks/INDEX.md` whose `home` is its
`tasks.md`; opening the first playground creates the index if it is absent. An older brain without the
index keeps the journal's *Active playgrounds* list until it adopts one (`/synaptic-upgrade` offers the
move, never forces it); once the index exists, that journal list holds only a pointer to it.

## 7. Skills portability — data-only registry

On the first owner-approved registration, copy templates/skills-registry.md to registries/skills.md
and link it from registries/_index.md. A row records name, purpose, source, recovery instructions,
installed location/scope, SKILL.md fingerprint, whether scripts exist, and last verified date.
Source is a team/personal repository ref or local-only. Unknown values stay TBD. It records no skill
code and installs nothing. Prefer one team repository plus a personal one; host-specific packaging
and syntax must be verified before suggesting them.

Audit reads local files only: if an explicitly resolved, authorised skill folder lacks SKILL.md,
report skill-missing; unresolved scopes or plugin layouts are unknown. Compare a recorded fingerprint
using references/fingerprint.md, Whole-file fingerprint (sha256-lf:12hex), only when the normalised
file bytes can actually be read and hashed; otherwise fingerprint drift is unknown. If hashing
would require registry text in command arguments, leave it unknown in this file-read-only cut.
Source-ref drift is unknown in this read-only cut. A local-only source is a recovery risk.
No registry field is interpolated into shell code, an executable name, argv or an eval expression.
Recovery text is displayed inertly and never executed. Use a fence longer than any backtick run in
the text if printing commands; redact private repository paths from shareable handovers.

Init may display recovery guidance; consolidate may propose a row; registration requires approval.
None of these readers installs, edits or deletes the owner's skills. Existing skill provenance and
delete/overwrite protection in command-discovery remains in force.
