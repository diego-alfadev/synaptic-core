# /synaptic-consolidate — Knowledge Consolidation Reference

Route working memory from `journal/_current.md` and open playgrounds into the structured
knowledge store. Run when: user invokes `/synaptic-consolidate`, journal is approaching 80 lines,
a playground task is complete, or end of a productive session.

**Six-step formula** (the capture contract — same algorithm compressed in `BRAIN.md`):

> **Capture policy.** Read `capture_policy:` from `BRAIN.md` frontmatter (`curated` | `balanced` | `logbook`; default `balanced`, or a custom 1-line rule). It tunes the *threshold* of Step 2 (promotion) and Step 6 (quality gate) — not the steps themselves:
> - `curated` → promote crown-jewels only (reusable decision/lesson, or pattern seen 3+ times); strict gate, small wiki.
> - `balanced` → promote at 2+ instances or clearly-reusable knowledge; standard gate.
> - `logbook` → promote durable-ish notes on first sight; lenient gate; prune later via `/synaptic-weave`.

---

## Step 1 — Classify

Read `journal/_current.md` and each open playground listed in its **Active playgrounds** section.
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

**Uncertainty test:** "Would a cold agent reading this six months from now benefit from it?" If no, discard.

---

## Step 2 — Atomicity & Promotion Test

For each item classified as durable:

1. **One concept per node.** If an item spans two independent concepts, split it into two nodes with cross-links.
2. **Promotion gate:** create or update a knowledge node *only when* the item:
   - recurs — has appeared 2+ times → promote as a `type: pattern` or `type: knowledge` node, or
   - is a reusable decision or lesson worth carrying forward cold.
   - **Capture-policy threshold:** `curated` raises the bar (crown-jewels / 3+ instances); `logbook` lowers it (promote durable-ish notes on first sight); `balanced` is the default above.
3. Incident-specifics that do not pass the promotion gate → stay in the playground or journal; do not create a permanent node.

---

## Step 3 — Generalize

Before writing:

- Strip the anecdote; keep the reusable principle.
- Name the file after the *concept*, not the ticket (e.g. `retry-policy.md`, not `FEAT-123-fix.md`).
- The `description:` frontmatter field should read as a self-contained 1-line summary a cold agent can understand without opening the file — it feeds directly into the cluster `_index.md`.

---

## Step 4 — Place & Link

1. **Place** the node in the correct cluster under `knowledge/{cluster}/`.
2. **Frontmatter (D1):** fill `description`, `type`, `status: active`, `updated: {today}`, `tags: [cluster-tag, topic-tags]`. No placeholders.
3. **`[[wikilinks]]`:** add wikilinks to related nodes at first mention. One link per target page per source page is sufficient.
4. **Register** the node in `knowledge/{cluster}/_index.md` (one-line entry: `[[node-name]] — {description}`). If the cluster does not exist, create the `_index.md` from `templates/node.md` pattern and add the cluster to `knowledge/INDEX.md`.
5. **Tabular data** → update or create the relevant `registries/{table}.md`; register in `registries/_index.md`.
6. **Large verbatim artifact** → copy to `references/raw/`; add one-line entry to `references/_index.md`; create a distilled knowledge node with `type: reference` that links to the artifact entry.

---

## Step 5 — Dedupe / SSOT

Before creating any new node:

1. **Search first** — check `knowledge/INDEX.md` and the relevant cluster `_index.md` for an existing node covering the same concept.
2. **Update, don't duplicate** — if a matching node exists, append or update it; bump `updated:`.
3. One source of truth per fact: if the same fact appears in multiple places, collapse it to one node and add `[[wikilinks]]` from the others.

---

## Step 6 — Quality Gate

Before marking consolidation complete, every new or updated node must pass:

- [ ] Frontmatter: `description`, `type`, `status`, `updated`, `tags` all filled; no `{{placeholders}}`.
- [ ] Soft budget: ≤ ~150 lines. Over budget → split into linked sub-nodes **or** tag `type: reference` (deliberately long canonical doc). Hard limit does not exist; `check` warns, never errors.
- [ ] MOC-reachable: the node is listed in its cluster `_index.md` and the cluster is listed in `knowledge/INDEX.md`.
- [ ] `[[wikilinks]]` resolve to real files; no broken links introduced.
- [ ] Professional & verifiable only: no opinions, rumors, blame, PII, credentials, or application data.
- [ ] `updated:` stamped with today's date.
- [ ] **Capture-policy strictness:** `curated` prunes hard (split/merge aggressively, keep the wiki small); `logbook` keeps more and defers pruning to `/synaptic-weave`; `balanced` applies the budgets as written.

If any check fails, fix before proceeding. Do not skip this gate.

---

## Playground Closing Flow

For each playground in the journal's **Active playgrounds** list:

1. Read the playground directory (`playgrounds/{task-id}/`).
2. Classify its contents (Steps 1–6 above).
3. Move durable findings → knowledge cluster nodes; procedures → `type: playbook` nodes in their cluster; lessons → `knowledge/lessons/`; verbatim artifacts → `references/raw/`.
4. Confirm with user: "Playground `{task-id}` consolidated — burn (delete) or archive?"
   - **Default: burn** — delete the directory.
   - Archive (exception): move to `playgrounds/archive/` only on explicit user request.
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
If not available: the quality gate in Step 6 is the manual equivalent.

---

## Report Format

```
Consolidated:
  - N knowledge nodes added/updated: {list with cluster}
  - N lessons added: knowledge/lessons/{names}
  - N registry entries updated: registries/{tables}
  - N artifacts stored: references/raw/{filenames} (_index.md entries added)
  - N playground(s) closed: {task-ids} (burned / archived)
  - N items discarded (temporal noise)

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

**Step 1 — Classify:**
- Retry note → lesson (specific failure → reusable principle).
- Token caching note → durable knowledge / pattern (performance decision that recurs).
- Implementation draft → already distilled; burn.
- OpenAPI spec → large verbatim artifact → `references/raw/`.

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

**Step 6 — Gate:** frontmatter filled; both nodes < 150 lines; MOC-reachable; no broken links. Pass.

**Outcome:** playground burned; journal trimmed to 22 lines; `BRAIN.md` `updated:` stamped.

---

## Anti-Patterns

- **Do not persist temporal noise:** debug output is not a knowledge node.
- **Do not create orphan nodes:** every node must appear in its cluster `_index.md`.
- **Do not duplicate:** search first; update existing nodes rather than creating parallel ones.
- **Do not route persona content:** the brain has no identity directory. Hard project constraints → a knowledge node; agent behavior rules → harness (AGENTS.md / CLAUDE.md), never the brain.
- **Do not embed verbatim artifacts inline:** large files go to `references/raw/`; knowledge nodes hold distilled facts + a link.
- **Do not skip the quality gate:** a node registered in the MOC but failing the gate is worse than no node.
