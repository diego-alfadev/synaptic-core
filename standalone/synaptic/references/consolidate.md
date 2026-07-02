# /synaptic-consolidate — Knowledge Consolidation Reference

Route working memory from `journal/_current.md` **and scan open playground artifacts** into the
structured knowledge store. Run when: user invokes `/synaptic-consolidate`, journal is approaching
80 lines, a playground task is complete, or end of a productive session. This procedure is also
invoked by `/synaptic-maintain` (see `references/maintain.md`) — it is the one place the
consolidation/wrap-up algorithm lives; other procedures call it, they do not re-implement it.

> **The brain must be DIFFERENT after each ingest, not just bigger.** Consolidation is a
> *rewrite* pass, not an append pass. A successful run updates the pages a source touches,
> reconciles contradictions, and burns scratch — it does not merely add nodes at the end. If
> the only effect of a consolidation run is "the wiki got longer," the run did it wrong.

**Six-step formula** (the capture contract — same algorithm compressed in `BRAIN.md`):

> **Capture policy.** Read `capture_policy:` from `BRAIN.md` frontmatter (`selective` | `balanced` | `capture-all`; default `balanced`, or a custom 1-line rule). It is the **PROMOTION axis** — how aggressively things reach the wiki — and is **orthogonal to the passivity dial** (when capture triggers). It tunes the *threshold* of Step 2 (promotion) and Step 6 (quality gate) — not the steps themselves:
> - `selective` → promote crown-jewels only (reusable decision/lesson, or pattern seen 3+ times); strict gate, small wiki.
> - `balanced` → promote at 2+ instances or clearly-reusable knowledge; standard gate.
> - `capture-all` → promote durable-ish notes on first sight; lenient gate; prune later via `/synaptic-weave`.
>
> Capture policy does **NOT** govern journal breadcrumbs — the per-turn `Stop` breadcrumb is a
> fixed-cost safety net that always runs, regardless of this dial.

---

## Step 1 — Classify (scan the journal AND playground artifacts)

Read **two sources**, not one:

1. `journal/_current.md` — session breadcrumbs and the **Active playgrounds** section.
2. **The artifacts inside each open `playgrounds/{task}/` directory** — drafts, analyses, notes,
   scratch files, intermediate outputs. Consolidation distils **durable conclusions** from these
   and **burns the scratch**; it does not promote raw working material wholesale. (See *Playground
   Artifact Scan* below for the discipline that keeps unfinished/outdated artifacts out — the
   "email" lesson: distil the conclusion, discard the draft.)

For every item, assign one of the following destinations:

| Class | Examples | Destination |
|---|---|---|
| Durable knowledge | Architecture decisions, how a system works, patterns | `knowledge/{cluster}/` node |
| Tabular record | Infra resources, repo inventory, glossary term, environment | `registries/{table}.md` |
| Lesson | "X caused Y", failure post-mortem, changed understanding | `knowledge/lessons/` node |
| Decision | Ratified choice + rationale | `knowledge/{cluster}/` node (`type: decision`) |
| Active big task | Multi-day work, drafts, analysis in flight | `playgrounds/{task-id}/` (keep) |
| Large verbatim artifact | DDL, spec, exported sheet | `references/raw/` + existence entry + distilled node |
| Temporal/journal noise | Debug output, session status, one-off lookups | Discard |
| Playground scratch | Drafts, dead-ends, intermediate outputs, superseded analysis | Distil any durable conclusion, then **burn** |

**Uncertainty test:** "Would a cold agent reading this six months from now benefit from it?" If no, discard.

---

## Step 2 — Atomicity & Promotion Test

For each item classified as durable:

1. **One concept per node.** If an item spans two independent concepts, split it into two nodes with cross-links.
2. **Promotion gate:** create or update a knowledge node *only when* the item:
   - recurs — has appeared 2+ times → promote as a `type: pattern` or `type: knowledge` node, or
   - is a reusable decision or lesson worth carrying forward cold.
   - **Capture-policy threshold:** `selective` raises the bar (crown-jewels / 3+ instances); `capture-all` lowers it (promote durable-ish notes on first sight); `balanced` is the default above.
3. Incident-specifics that do not pass the promotion gate → stay in the playground or journal; do not create a permanent node.

---

## Step 3 — Generalize

Before writing:

- Strip the anecdote; keep the reusable principle.
- Name the file after the *concept*, not the ticket (e.g. `retry-policy.md`, not `FEAT-123-fix.md`).
- The `description:` frontmatter field should read as a self-contained 1-line summary a cold agent can understand without opening the file — it feeds directly into the cluster `_index.md`.

---

## Step 4 — Place & Link (rewrite-bias: update what the source touches)

> **Rewrite-bias (binding).** Prefer **updating an existing page** over appending a new one.
> A source rarely introduces an entirely new concept; more often it changes, sharpens, or
> contradicts something already written. Find the pages the source touches and **rewrite them**
> so the brain reflects the new understanding — append only when the concept is genuinely new.
> "Bigger" is not the goal; "current and correct" is.

1. **Place** the node in the correct cluster under `knowledge/{cluster}/`.
2. **Frontmatter (D1):** fill `description`, `type`, `status: active`, `updated: {today}`, `tags: [cluster-tag, topic-tags]`. No placeholders.
3. **`[[wikilinks]]`:** add wikilinks to related nodes at first mention. One link per target page per source page is sufficient.
3a. **Lifecycle (OPTIONAL):** set `lifecycle:` **only** if the node is a live project (`lifecycle: project`) or clearly a lazy-pull resource (`lifecycle: resource`); otherwise **leave it absent** (absent → treated as `area`, loads by default). Enum: `project | area | resource | dormant`. It is **orthogonal to `status`** — see the table below. A `project` node SHOULD link OUT to a durable `area`/`resource` node so its knowledge survives when it later cools to `dormant`.
4. **Register** the node in `knowledge/{cluster}/_index.md` (one-line entry: `[[node-name]] — {description}`). If the cluster does not exist, create the `_index.md` from `templates/node.md` pattern and add the cluster to `knowledge/INDEX.md`.
5. **Tabular data** → update or create the relevant `registries/{table}.md`; register in `registries/_index.md`.
6. **Large verbatim artifact** → copy to `references/raw/`; add one-line entry to `references/_index.md`; create a distilled knowledge node with `type: reference` that links to the artifact entry. **Record a source `content_hash`** on the distilled node (see below) so future runs can detect that the raw artifact changed.

**`status` vs `lifecycle` — two orthogonal fields (do not conflate):**

`status` and `lifecycle` are independent and both may appear. `status` answers *is this content
current and correct?*; `lifecycle` answers *is this in the current working set?* The literal
`archived`/`dormant` tokens are deliberately different so the two enums never collide.

| Field | Question it answers | Enum | Change it when… |
|---|---|---|---|
| `status` | Editorial / trust — is the content current & correct? | `active` \| `stale` \| `archived` | The content is superseded/dead (pair with a `supersedes`/`superseded_by` edge). |
| `lifecycle` | Actionability — is this LIVE / in the working set? | `project` \| `area` \| `resource` \| `dormant` | A project ends or an area cools (flip to `dormant`); it re-activates (flip back). |

> **Combined example:** a node may be `status: active` + `lifecycle: dormant` — the content is
> **true**, but the project is over, so it does **not** load by default. Perfectly valid. Prefer
> flipping `lifecycle` for actionability changes; reserve `status: archived` for "this content is
> superseded/dead."

**Interaction rules (which axis governs what — the part users get wrong):**

- **Only `lifecycle` scopes the DEFAULT working set.** A `dormant` node drops out of the *default* load
  once a brain grows. **`status` NEVER causes omission** — a stale-but-relevant node is **flagged
  (`⚠ stale`), not hidden.**
- **The `lifecycle: dormant` scoping applies to the DEFAULT working set ONLY.** `/synaptic-handover` and
  `/synaptic-audit` read **ALL statuses and ALL lifecycles** — a binding `lifecycle: dormant` +
  `status: active` decision **MUST still appear** in a handover brief (else it defeats the knowledge-tax
  thesis). See `references/handover.md` and `references/audit.md`.
- **Absent-defaults:** `lifecycle` absent → `area` (benign, loads by default); **`status` absent →
  `untriaged`** — neither trusted-current nor stale; surfaced as `untriaged` in audits, **never silently
  promoted to `active`.** A hand-edit typo (`Active`, `dorment`) surfaces via the `/synaptic-audit`
  typo advisory rather than failing open.

**Source `content_hash` (drift detection — an inline captured fact, NOT a materialized index):**

When you distil a raw artifact into a `type: reference` node, capture the source provenance and a
content hash directly in the node's authored frontmatter:

```yaml
source: "references/raw/{filename.ext}"
content_hash: "sha256:{first-12-hex}"   # of references/raw/{filename.ext} at capture time
```

- This is an **authored fact written once at capture time**, the same as any other frontmatter
  value — it is **not** a generated index, never a must-sync cache, and nothing recomputes it
  automatically. It exists purely so a later consolidation/audit pass can notice "the raw file's
  hash no longer matches what the node recorded → the artifact drifted → re-distil."
- Compute it however the host can (e.g. `git hash-object`, `sha256sum`, or the agent's own hash);
  store a short prefix. If no hashing is available, record the source path alone and skip the hash —
  CORE never requires a runtime.

---

## Step 5 — Dedupe / SSOT + Contradiction Reconciliation

Before creating any new node:

1. **Search first** — check `knowledge/INDEX.md` and the relevant cluster `_index.md` for an existing node covering the same concept.
2. **Update, don't duplicate** — if a matching node exists, append or update it; bump `updated:`.
3. One source of truth per fact: if the same fact appears in multiple places, collapse it to one node and add `[[wikilinks]]` from the others.

### Step 5a — Contradiction Reconciliation (explicit)

Dedupe (above) finds the *same* fact in two places. This sub-step handles the harder case: the new
source **conflicts with** what an existing node says. Do not silently append both — reconcile.

For each item being consolidated, ask: **does this contradict an existing node?**

1. **Detect the conflict.** Compare the new claim against existing nodes (search INDEX + cluster
   `_index.md` by concept). A conflict = the same subject, incompatible claims.
2. **Decide which is current.** Use recency, provenance (`source:`), and explicit decisions stated
   in the session. The bi-temporal markers help: *learned-when* (when we found this out) vs
   *true-when* (the period the fact describes).
3. **If the new source supersedes the old:**
   - **Rewrite the old page** to the current understanding — do not just bolt the new claim on.
   - **Note what changed and why** in the page (a one-line `> Changed {date}: … because …`), so the
     reasoning survives, not just the new value.
   - Where the relationship is structural, record the typed edge `supersedes` on the new/current
     node (inverse `superseded_by` is grep-computed — author one direction only).
4. **If both remain valid / the conflict is genuine and unresolved:**
   - Keep both, link them with the `contradicts` typed edge, and **document the tension in the
     node's `## bias-check` section** (the other side / contradicting evidence). This is epistemic
     honesty on the page, not agent hedging.
5. **If unsure which is correct:** do **not** guess. Flag it for the user / leave it for
   `/synaptic-weave` or `/synaptic-maintain` to surface as a proposal. Reconciliation that needs a
   human judgment is proposed, never auto-applied.

> **CORE-safety:** every rewrite here is **diff-traced in the consolidation log**, recoverable via
> git, and uses **archive-before-delete** for anything removed. This is supervised rewriting over
> plain files — never an unguarded auto-rewriter.

> **Deletion ledger (standing rule — not migration-only).** Any operation that **deletes, moves, or
> archives** a node (a dedupe merge, a split, a burned playground, a re-file) records a one-line ledger
> entry: *what, why, loser→winner or destination, recoverable-via-git*. This is the same discipline the
> upgrade runbook (`references/upgrade-to-v1.md`) uses — it applies to every `/synaptic-consolidate`
> run, not just migrations. Justify every delete/move/archive; **git is the archive.**

---

## Step 6 — Quality Gate

Before marking consolidation complete, every new or updated node must pass:

- [ ] Frontmatter: `description`, `type`, `status`, `updated`, `tags` all filled; no `{{placeholders}}`.
- [ ] Soft budget: ≤ ~150 lines. Over budget → split into linked sub-nodes **or** tag `type: reference` (deliberately long canonical doc). Hard limit does not exist; `check` warns, never errors.
- [ ] MOC-reachable: the node is listed in its cluster `_index.md` and the cluster is listed in `knowledge/INDEX.md`.
- [ ] `[[wikilinks]]` resolve to real files; no broken links introduced.
- [ ] Professional & verifiable only: no opinions, rumors, blame, PII, credentials, or application data.
- [ ] `updated:` stamped with today's date.
- [ ] **Capture-policy strictness:** `selective` prunes hard (split/merge aggressively, keep the wiki small); `capture-all` keeps more and defers pruning to `/synaptic-weave`; `balanced` applies the budgets as written.

If any check fails, fix before proceeding. Do not skip this gate.

---

## Playground Artifact Scan & Closing Flow

Consolidation **scans the artifacts inside playgrounds**, not just the journal's index of them.
The discipline: **distil the durable conclusion, burn the scratch.** A playground accumulates
drafts, dead-ends, intermediate analysis, and superseded versions — most of it is working
material that should never reach the wiki. The **promotion test (Step 2) and quality gate (Step 6)
are the filter** that keeps unfinished or outdated artifacts out.

> **The "email" lesson.** A playground holding five drafts of an email should contribute, at most,
> *one* durable node — the reusable conclusion or pattern (e.g. "how we frame a management update"),
> not the five drafts. Distil the conclusion; discard the drafts. Same for half-finished analyses,
> abandoned experiments, and outputs already superseded later in the same task.

For each playground in the journal's **Active playgrounds** list:

1. Read the playground directory (`playgrounds/{task-id}/`) — **all its artifacts**, not only a summary.
2. Classify its contents (Steps 1–6 above). Apply the promotion test and quality gate strictly:
   unfinished, outdated, or superseded artifacts do **not** pass — distil any durable conclusion and
   discard the rest.
3. Move durable findings → knowledge cluster nodes; procedures → `type: playbook` nodes in their cluster; lessons → `knowledge/lessons/`; verbatim artifacts worth preserving → `references/raw/` (with a `content_hash`, per Step 4).
4. Confirm with user: "Playground `{task-id}` consolidated — burn (delete) or archive?"
   - **Default: burn** — delete the directory (the scratch is gone; the distilled conclusions live in the wiki).
   - Archive (exception): move to `playgrounds/archive/` only on explicit user request.
   - **CORE-safety:** burn is preceded by the consolidation having captured everything durable, the
     log recording what was distilled, and git retaining the deleted content — archive-before-delete
     in spirit (git is the archive).
5. Remove the playground entry from `journal/_current.md`.

---

## Journal Trim

After routing all items:

1. Rewrite `journal/_current.md` keeping only three sections:
   - **Resume Anchor** — where work stopped, next step, updated active-playground list.
   - **Watch List** — open questions and risks; carry forward unresolved items.
   - **Log** — dated one-liners: decisions, consolidation events (keep narrative thread; discard detail).
2. Hard budget: **≤ 80 lines total**. If still over, trim the Log (oldest entries first).
3. No archive directory — history lives in git and in consolidated knowledge nodes.

---

## Tool Check

If `tools/check.js` exists: run `node tools/check.js`. Address any errors before reporting done.
If not available: the quality gate in Step 6 is the manual equivalent. (`tools/check.js` is an
optional Cortex utility; CORE never requires it — the gate stands on its own.)

---

## Report Format

The report should make the **rewrite** visible — what *changed*, not only what was added — so the
"different, not just bigger" intent is auditable.

```
Consolidated:
  - N knowledge nodes added: {list with cluster}
  - N knowledge nodes REWRITTEN/updated: {list — note what changed}
  - N contradictions reconciled: {old-node → resolution (superseded / contradicts-linked / flagged)}
  - N lessons added: knowledge/lessons/{names}
  - N registry entries updated: registries/{tables}
  - N artifacts stored: references/raw/{filenames} (_index.md entries + content_hash added)
  - N playground(s) closed: {task-ids} (scratch burned / archived; durable conclusions distilled)
  - N items discarded (temporal noise / superseded scratch)

Journal trimmed to N lines (budget: 80).
BRAIN.md updated: field bumped to {date}.
```

---

## Worked Mini-Example

> Situation: session on an API integration left two journal notes and a closed playground.

**Journal items:**
- "Retry logic must use exponential backoff with jitter — learned after 3 rate-limit failures."
- "Auth token cached per-request; should be cached per-session for performance."

**Playground `feat-88-api-client/`:** contains a working implementation draft and a raw OpenAPI spec export.

**Step 1 — Classify (scan journal + playground artifacts):**
- Retry note → lesson (specific failure → reusable principle).
- Token caching note → durable knowledge / pattern (performance decision that recurs).
- Implementation draft (playground scratch) → conclusion already distilled into the two notes; burn.
- OpenAPI spec → large verbatim artifact → `references/raw/` (record `content_hash` on the distilled node).

**Step 2 — Atomicity test:** both notes are distinct concepts; two separate nodes.

**Step 3 — Generalize:**
- `exponential-backoff-jitter.md` (not `feat-88-retry-fix.md`).
- `auth-token-session-cache.md`.

**Step 4 — Place & link:**
- `knowledge/api-integration/exponential-backoff-jitter.md` — `type: lesson`; link `[[auth-token-session-cache]]`.
- `knowledge/api-integration/auth-token-session-cache.md` — `type: pattern`; link `[[exponential-backoff-jitter]]`.
- `references/raw/openapi-spec-v2.yaml` + `_index.md` entry + distilled `knowledge/api-integration/api-spec-summary.md` (`type: reference`).
- Register all three in `knowledge/api-integration/_index.md`; ensure cluster listed in `knowledge/INDEX.md`.

**Step 5 — Dedupe:** INDEX search shows no prior `auth-token` node → create new.

**Step 5a — Reconcile:** an existing `[[auth-token-handling]]` node says "cache per request." The
new finding supersedes it → **rewrite** that node to per-session, add `> Changed {date}: per-session
caching, because per-request re-auth was the latency cause`, and record the `supersedes` edge.
(The brain is now *different*, not just bigger.)

**Step 6 — Gate:** frontmatter filled; both nodes < 150 lines; MOC-reachable; no broken links. Pass.

**Outcome:** playground scratch burned; one node rewritten + one reconciliation logged; journal
trimmed to 22 lines; `BRAIN.md` `updated:` stamped.

---

## Journal Breadcrumb Contract (the cheap, always-on safety net)

Consolidation is the *promotion* pass. It sits on top of a cheaper layer that runs continuously and
is **not** governed by `capture_policy`:

- **One terse line per meaningful turn** is written to `journal/_current.md`. This is an
  **instruction the agent follows, not only a hook**: the per-turn `Stop` breadcrumb automates it
  where wired (the universal capture floor across all hook-capable agents), but write it even when no
  hook fires — hooks are host-specific and can silently fail, so the instruction is the floor
  underneath the automation (closes issue #2: a session that neared recompact with no breadcrumbs
  written). It is **fixed-cost**: a single line, never a full consolidation, regardless of the
  capture-policy dial.
- Breadcrumbs **live on disk so they survive a crash** — what only lived in the context window dies;
  what reached the journal can still be consolidated later (including by `SessionStart`-rescue on the
  next boot — see `references/audit.md`).
- Consolidation **consumes** these breadcrumbs: it routes the durable ones into the wiki (Steps 1–6)
  and trims the rest in the Journal Trim step. A breadcrumb is a *candidate*, not a promotion.
- **Do not** add a second policy dial for breadcrumbs. There are exactly two orthogonal dials:
  `capture_policy` (how aggressively things get **promoted**) and the passivity dial (**when** capture
  triggers). Breadcrumbs are the fixed floor underneath both.

> **Provisional — revisit as a token-optimization.** The per-turn breadcrumb is *good for now*, not a
> fixed rule. A future Cortex T2 Engram-style FTS journal index (a derived SQLite/FTS5 layer over the
> journal — see `ROADMAP.md` → "Engram-style searchable journal — Cortex") may make the per-turn
> breadcrumb partly redundant as a search surface. Treat the breadcrumb cadence as a **token-optimization
> item to revisit** when that layer lands — not a change to make now, and never a CORE dependency on it.

---

## Anti-Patterns

- **Do not just append:** consolidation must **rewrite** what a source touches. A run whose only
  effect is a longer wiki violated the rewrite-bias — the brain must be *different*, not just bigger.
- **Do not leave contradictions side-by-side silently:** reconcile (Step 5a) — supersede-and-rewrite,
  `contradicts`-link with a `## bias-check` note, or flag for a human. Never two unlinked conflicting nodes.
- **Do not persist temporal noise:** debug output is not a knowledge node.
- **Do not promote playground scratch wholesale:** distil the durable conclusion; burn the drafts,
  dead-ends, and superseded artifacts (the "email" lesson).
- **Do not create orphan nodes:** every node must appear in its cluster `_index.md`.
- **Do not duplicate:** search first; update existing nodes rather than creating parallel ones.
- **Do not route persona content:** the brain has no identity directory. Hard project constraints → a knowledge node; agent behavior rules → harness (AGENTS.md / CLAUDE.md), never the brain.
- **Do not embed verbatim artifacts inline:** large files go to `references/raw/`; knowledge nodes hold distilled facts + a link.
- **Do not treat `content_hash` as a must-sync index:** it is an authored fact captured once; nothing recomputes it automatically.
- **Do not skip the quality gate:** a node registered in the MOC but failing the gate is worse than no node.
