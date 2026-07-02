# /synaptic-audit — Brain Health Audit Reference

Cross-session review for staleness, orphan nodes, broken links, MOC coverage, **horizontal
cross-link coverage**, registry integrity, oversized untyped nodes, tag hygiene, and **half-done /
unconsolidated work** (open playgrounds, unconsolidated conversations, pending breadcrumbs). Run
when: user invokes `/synaptic-audit`, after several sessions, on a `SessionStart`-rescue sweep, or
when the brain feels off.

**Prefer `node tools/check.js` if a runtime is available** — it automates the mechanical checks.
Use this file as the manual fallback or to interpret check output. (`tools/check.js` is an optional
Cortex utility; CORE never depends on it — every check here is grep-able by hand.)

> **Audit DIAGNOSES; it does not TREAT.** This procedure only *finds and reports* problems. The
> fixes live in other procedures:
> - broken links / orphans / missing edges / near-duplicates → **`/synaptic-weave`**
> - unconsolidated playgrounds, pending breadcrumbs, half-done work → **`/synaptic-consolidate`**
> - cross-source synthesis, orphan rescue, concept evolution → **`/synaptic-synthesize`**
> - the orchestrated diagnose-then-treat sweep → **`/synaptic-maintain`**
>
> **`/synaptic-audit` + `SessionStart`-rescue = the abandonment safety sweep:** on next boot, the
> rescue net runs the half-done check (Step 9) to recover sessions that ended before consolidation.

Do not auto-fix findings. Surface a prioritised list; ask for confirmation before any change — and
route each finding to the procedure that treats it.

> **Scaffolding exclusion (link checks).** `templates/` and `references/raw/` are **scaffolding,
> not knowledge** — exclude both from the **broken-link check (Step 3)** and the
> **cross-link-coverage check (Step 4b)**. `templates/` holds example nodes whose wikilinks are
> deliberate placeholders (`[[target]]`, `[[related-node]]`, `[[x]]`); `references/raw/` holds
> verbatim captured payloads whose `[[…]]` text is source content, **not an authored edge**. Their
> links are not real edges — scanning them false-flags them as broken (the first dogfood audit
> tripped on ~12 such placeholders). The *other* steps still apply: e.g. `references/raw/` artifacts
> are existence-indexed in Step 6. `tools/check.js` applies this exclusion automatically.

---

## Step 1 — Staleness Pass

Scan all node files under `knowledge/` (recursing into clusters and `lessons/`) and `registries/`:

- Flag any node where `updated:` date is more than **90 days ago**.
- Flag any node with `status: stale`.

For each flagged node: note the staleness age and likely section to review. Present findings; ask before changing.

---

## Step 1a — Lifecycle Completion-Cadence (WARN — optional `lifecycle:` axis)

Advisory hygiene for the optional `lifecycle:` axis (`project | area | resource | dormant`; see
`SKILL.md` "Lifecycle axis"). **Diagnose only, WARN never ERROR** — the fix (flip `lifecycle:`) is
the owner's decision or `/synaptic-maintain`. Reuses the Step 1 staleness machinery, tightened for
live projects. Skip any node with no `lifecycle:` field (absent → `area`, nothing to flag here).

- Flag any `lifecycle: project` node whose `updated:` is older than **60 days** →
  *"active-project gone quiet — archive it (`lifecycle: dormant`) or reactivate?"*
- Flag any `lifecycle: area` node whose `updated:` is older than **90 days** →
  *"area gone silent — still a live responsibility?"* (Reuses the Step 1 staleness threshold.)

> **`lifecycle: dormant` / `resource` are NOT orphans.** A node cooled to `dormant` (or tagged
> `resource`) is still registered in its cluster `_index.md` — cooling is a load-priority signal,
> not de-registration. It **must not** trigger the Step 2 orphan check, and its `updated:` staleness
> is expected (Step 1 may still note age, but it is not a lifecycle-cadence finding).

> **The audit reads ALL statuses and ALL lifecycles.** `lifecycle: dormant` scopes only the **default
> working set** (the load-priority signal), **NOT** what the audit inspects. The audit (like
> `/synaptic-handover`) reads **every** node regardless of `lifecycle` or `status` — a `dormant` or
> `resource` node is still audited; a `status: stale` node is **flagged, not hidden**. Only `lifecycle`
> ever scopes the *default* load; `status` **never** causes omission.

**No runtime required.** Grep `lifecycle:` values and compare `updated:` — same by-hand posture as
every other check here.

---

## Step 1b — `status` / `lifecycle` typo advisory (WARN — cheap grep, non-gating)

Both `status` and `lifecycle` are **optional** frontmatter with **absent-defaults**. A hand-edit typo
(`Active`, `dorment`, `Archived`) would otherwise be treated as *absent* → silently defaulted (failing
open). Surface it instead. **Advisory, WARN never ERROR** (C1 exit-0 discipline):

- Grep every `status:` and `lifecycle:` value; flag any **NOT** in the allowed lowercase token set:
  - `status ∈ {active, stale, archived}`
  - `lifecycle ∈ {project, area, resource, dormant}`
- Report each off-vocabulary value with its node path → *"`status: Active` is not a valid token (did you
  mean `active`?) — a mistyped value is treated as absent and silently defaulted."*

**Absent-default semantics the audit surfaces (do not conflate):**

- **`status` absent → `untriaged`** — neither trusted-current nor stale. Surface a node with **no**
  `status:` as `untriaged`; **never silently promote it to `active`.**
- **`lifecycle` absent → `area`** — a benign role default (loads by default). Not a finding.

**No runtime required.** Pure grep over frontmatter values.

---

## Step 2 — Orphan Nodes

Read `knowledge/INDEX.md` (hub MOC) and every `knowledge/{cluster}/_index.md` (sub-MOCs). Then scan all `.md` files in `knowledge/`:

- Any `.md` file **not listed in any `_index.md`** is an orphan.
- An orphan node is unreachable — it does not effectively exist.

List orphans with their path. Ask: "Register in cluster `_index.md`, move, or delete?"

---

## Step 3 — Broken `[[wikilinks]]`

Scan all nodes for `[[wikilink]]` patterns — **excluding `templates/` and `references/raw/`**
(scaffolding; see the Scaffolding-exclusion note above). For each link:

- Resolve: does a file whose kebab-case name matches the link target exist in `knowledge/`?
- Flag unresolved targets as broken; note source file and broken target name.
- Skip placeholder targets (`[[{{…}}]]`), links inside HTML comments, and inline code spans **and fenced code blocks** (```).

Do not auto-fix. Surface the list; options are: create the target, rename, or remove the link.

---

## Step 4 — MOC Coverage

Read `knowledge/INDEX.md`. For each cluster entry:

- Does the linked `{cluster}/_index.md` exist?
- Does every file physically present in `knowledge/{cluster}/` appear in that `_index.md`?

Flag: missing `_index.md` files; nodes in a cluster directory not listed in the sub-MOC.

Also check: is every cluster directory listed in `knowledge/INDEX.md`? Flag unlisted cluster directories.

---

## Step 4b — Cross-Link Coverage (HORIZONTAL reachability)

MOC coverage (Step 4) guarantees only **vertical** linking — that every node is reachable from a
hub. It says nothing about whether *related* nodes link to **each other**. This check promotes
horizontal cross-link coverage from a convention to a first-order audit finding.

The flagship horizontal relations to check (the cross-linking differentiator — multi-hop relational
retrieval over authored directional edges that embeddings can't infer):

- **playbook ↔ the system it applies to** — a `type: playbook` node should link to the system /
  component it operates on (and ideally carry an `applies_to` typed edge).
- **system ↔ its reference / DDL** — a system node should link to the `type: reference` node (and
  the `references/raw/` artifact) that documents it.
- **situation/problem ↔ solution/decision** — a lesson or problem node should link to the decision
  or pattern that resolves it.
- **concept ↔ the situations it governs** — a concept node should be reachable from the
  playbooks/lessons that invoke it.

For each node — **excluding `templates/` and `references/raw/`** (scaffolding; see the
Scaffolding-exclusion note above) — flag **plausible-but-missing** horizontal links:

- A `type: playbook` node with **no** link to any system/component node → flag "playbook with no
  applies-to target."
- A system/architecture node that references a schema/spec/DDL by name but has **no** link to a
  `type: reference` node or `references/raw/` entry → flag "system with undocumented reference."
- Two nodes that **share 2+ tags or are co-cited from a third node** but do not link to each other →
  flag as a missing cross-link candidate.

> **Diagnose only.** Do not add the links here — surface them and route to **`/synaptic-weave`**
> (Pass 1), which proposes the link **and a typed edge type** for confirmation. Cite GraphRAG only
> as *the direction* (multi-hop relational retrieval); make **no auto-discovery claim** — edges are
> authored, never inferred (C5).

---

## Step 4c — God-Nodes (over-connected hubs)

A **god-node** is a knowledge node with an unusually high **edge degree** — a "kitchen-sink" node
that has quietly absorbed too much and is a candidate to split into atomic sub-nodes (or a
legitimately central concept that is fine as-is). Surfacing it keeps nodes atomic and retrievable.

**Degree (the ONE universe — identical to `tools/check.js` / `tools/graph.js`):** count the
**distinct authored edges** touching the node, over the **knowledge-scoped, MOC-excluded** graph:

- **Nodes counted:** `knowledge/**` files only, **excluding** `templates/` and MOC/sentinel files
  (`_index.md`, `INDEX.md`, `README.md`). `registries/`, `references/`, `references/raw/`, and any
  synthetic INDEX hub are **not** graph nodes.
- **Edges counted:** frontmatter **typed edges** (block-list `- "[[target]]"` under
  `relates_to` / `depends_on` / `supersedes` / `contradicts` / `applies_to` / `causes` / `part_of`)
  **plus** body `[[wikilinks]]` (skip fenced code, inline code, HTML comments, and `{{…}}`
  placeholders). Resolve targets by **kebab-case basename**.
- **MOC links are excluded from the edge set** — a `[[node]]` that appears only inside an `_index.md`
  / `INDEX.md` / `README.md` is navigational scaffolding, not an authored knowledge edge, and does
  NOT count toward degree (same doctrine as the Scaffolding-exclusion note above).
- **Undirected, deduplicated:** an A↔B pair counts as **one** edge no matter how many times or in how
  many directions it is authored; a self-link (A→A) is dropped. Degree = the number of distinct
  neighbours a node has in this deduped undirected graph.

**Threshold (advisory — WARN, never ERROR):** flag a node whose degree is
**≥ 15, OR ≥ 3× the median node degree of the brain — whichever is lower** (so it scales down on a
small brain and does not over-fire on a large one). Both numbers are heuristics, not hard limits.
(Degenerate case: when the median degree is **0** — a very sparse brain where most nodes are
orphans — the "3× median" rule collapses to 0 and would flag every connected node, so ignore it and
apply the absolute **≥ 15** bar only. The 3× rule is meant to *tighten* the bar on a well-connected
brain, never to flood a sparse one.)

> **Diagnose only.** Route the split option to **`/synaptic-weave`** (near-duplicate / split
> proposals) or the owner. Remediation prompt: *"candidate to split into atomic sub-nodes, or a
> legitimate hub — confirm."* A god-node is not an error — a genuinely central concept legitimately
> has many edges; the owner confirms split-vs-keep.

**No runtime required.** Compute degree by counting the `[[…]]` edges per node (typed frontmatter +
body, MOC-excluded, undirected-deduped) by hand — grep-able, matching the "every check here is
grep-able by hand" posture. `tools/check.js` MAY emit this as a WARN reusing the same shared graph,
but CORE never depends on it.

---

## Step 4d — Surprising Edges (cross-cluster links)

A **surprising edge** is an authored edge whose two endpoints live in **different top-level
`knowledge/` clusters** — a **cross-cluster edge**. (The cluster of a node = its
`knowledge/{cluster}/` directory, exactly the top-level grouping the degree computation above uses.)
These are the **high-value multi-hop relations embeddings can't infer** — the same cross-linking
differentiator called out in Step 4b — so surfacing them is dual-purpose:

- **(a) confirm a genuine interdisciplinary link** — keep it, and ensure it carries a typed edge; or
- **(b) catch a mis-filed node or a wrong link** — the "surprise" is a filing/authoring error.

For each cross-cluster edge, list the **endpoint pair + the edge type** (the typed-edge kind, or
`wikilink` for an untyped body link), e.g. `knowledge/auth/jwt-decode.md —[depends_on]→
knowledge/infra/key-vault.md`. Advisory — **WARN, never ERROR**.

> **Diagnose only.** Route confirmation to **`/synaptic-weave`** (which proposes / confirms edge
> types). Make **no auto-discovery claim** — Synaptic does **not** infer edges; every edge here was
> **authored** by hand or by a prior weave, never discovered from embeddings (C5), consistent with
> Step 4b. This check only *surfaces* edges that already exist for the owner to confirm or correct.

**No runtime required.** Cluster membership = the node's top-level `knowledge/` subdirectory; an edge
is cross-cluster iff its two endpoints' subdirectories differ — pure read/grep. `tools/check.js` MAY
emit a cross-cluster-edge count as a WARN reusing the same shared graph; CORE never depends on it.

---

## Step 5 — Registry Integrity

Read `registries/_index.md`. For each entry:

- Does the referenced registry file (`registries/{name}.md`) actually exist?
- Does its frontmatter include `type: registry`, `status`, `updated`, `tags`?

Flag: entries pointing to missing files (phantom entries); registry files not listed in `_index.md`.

Note: row-level accuracy (whether registry values match reality) is unknowable from inside the brain — surface structure-level issues only. Suggest a staleness review if `updated:` is > 90 days old.

---

## Step 6 — References Existence-Index Accuracy

Read `references/_index.md`. For each entry:

- Does the referenced file actually exist (in `references/` or `references/raw/`)?
- Flag phantom entries (indexed but file missing).

Scan `references/raw/` for files with **no entry** in `_index.md`. Flag as unindexed artifacts.

---

## Step 7 — Oversized Untyped Nodes

Scan all nodes in `knowledge/`:

- Flag any node exceeding **~150 lines** that does not have `type: reference` in its frontmatter.
- Oversized untyped nodes are candidates to split into linked sub-nodes or be re-tagged `type: reference` (deliberately long canonical doc).

Soft limit only — `check` warns, never errors. A 500-line walkthrough tagged `type: reference` is valid.

---

## Step 8 — Tag Hygiene

Scan all nodes for `tags:` in frontmatter:

- Flag nodes with a missing or empty `tags:` field.
- Flag nodes using inconsistent tag names for the same concept (e.g. `infra` vs `infrastructure` for the same cluster).

Tags enable `Ctrl+Shift+F` faceted search and the future FTS/RAG surface — blank or inconsistent tags degrade discoverability.

---

## Step 9 — Half-Done / Unconsolidated Check (the abandonment sweep)

Detect **work that was started but never folded into the wiki** — open playgrounds, unconsolidated
conversations, and pending journal breadcrumbs. This is the check that, paired with
`SessionStart`-rescue, recovers abandoned sessions: knowledge that reached disk (the journal,
playground artifacts) but never reached the knowledge store. **Diagnose only — route to
`/synaptic-consolidate` to treat.**

**(a) Open / unconsolidated playgrounds:**

- Count all directories directly under `playgrounds/` that contain at least one `.md` file. These are
  **open playgrounds** — task workspaces not yet consolidated into the wiki or explicitly closed.
- Cross-check against the journal's **Active playgrounds** list: flag playgrounds **present on disk
  but missing from the list** (untracked) and entries **listed but with no directory** (stale entry).

**(b) Pending journal breadcrumbs (unconsolidated `Stop` lines):**

- Count non-empty lines / dated entries in `journal/_current.md` since the last consolidation marker
  (a line matching `consolidated:` or `## Consolidated` or similar). If no marker is found, count all lines.
- These are per-turn breadcrumbs that survived on disk but have **not yet been promoted or trimmed** —
  exactly what `SessionStart`-rescue exists to recover after an abandoned session.

**(c) Half-done / protocolary signals:**

- A `## bias-check` or note that records an **unresolved** `contradicts` pair never reconciled.
- TODO/`{{placeholder}}`/`status: draft` markers left in otherwise-promoted nodes.
- A `references/raw/` artifact whose distilled node carries a `content_hash` that **no longer matches**
  the raw file (the artifact drifted; re-distillation is pending — see consolidate.md Step 4).

**Warn (not error)** when a threshold is exceeded; present as advisory — the user decides whether to
consolidate now or defer:

- Open playgrounds ≥ 3: "Half-done — N open playgrounds. Run `/synaptic-consolidate` to process and close completed task workspaces."
- Journal lines since last consolidation ≥ 60: "Half-done — journal at N pending breadcrumbs since last consolidation. Run `/synaptic-consolidate` before the journal nears 80 lines."
- Any untracked playground, stale active-playground entry, drifted `content_hash`, or unresolved `contradicts`: list each as a half-done finding routed to `/synaptic-consolidate` (or `/synaptic-maintain` for the orchestrated sweep).

---

## Step 9b — Capture-Yield + used-but-capture-dead (WARN — advisory, non-gating)

The thesis verb is **capture**. This advisory answers *does daily work produce breadcrumbs/nodes, or is
the brain silently empty?* — from files alone. **Advisory (exit-0 / never gates)**, like every check here.

**The heartbeat decouples "session opened" from "work captured".** The `SessionStart` boot heartbeat
(`SKILL.md` §d — the FIRST thing a session writes, a one-line `journal/` boot marker) is
**capture-INDEPENDENT**, so boots are counted even when nothing else is captured. That lets this step
distinguish two states the naive "zero artifacts" signal conflates:

- **`not-used`** — **0 boots** in the window → **benign** (nobody worked; not a capture problem). **No
  advisory.**
- **`used-but-capture-dead`** — **boots present, 0 captured** (0 new breadcrumbs, 0 nodes over the
  window) → raise a **distinct "hooks-appear-dead" advisory** pointing to the per-host hook smoke-test.
  This is the actionable failure. *(This is the refined meaning of "silent-empty": used-but-capture-dead,
  NOT "empty brain".)*

**Capture-yield section (compute from files — journal timestamps + git log / frontmatter `updated`):**

- **breadcrumbs-per-session** — journal breadcrumb count ÷ session (boot) count.
- **nodes-added-per-week** — `knowledge/**` nodes whose `updated`/creation falls in the week.
- **% of meaningful sessions that captured something** — of sessions that did real work (heuristic:
  touched files / lasted beyond a trivial threshold), the fraction that left ≥1 breadcrumb or node.

**Bias-check (state it):** directional, single-brain, not statistically robust — a *yield* signal, not
an accuracy claim. The **%-meaningful metric is NON-comparable across hosts** (its "meaningful session"
heuristic resolves differently per host; hook-less hosts have no reliable session boundary, OneDrive
placeholder state skews file-touch counts). For any cross-host or trend reading, **prefer the two robust
counts**: **breadcrumbs per artifact-counted session** (denominator = boots we can actually count via
the heartbeat, not a heuristic) and **nodes-per-week** (from frontmatter `updated` / git log).

**Report example:** *"12 sessions BOOTED, 0 new breadcrumbs, 0 nodes added in 7 days →
HOOKS-APPEAR-DEAD (used-but-capture-dead): capture is likely not firing on this host — run the per-host
hook smoke-test."* A different brain: *"0 boots in 7 days → not-used (benign)"* — no advisory.

**No runtime required.** Degree/count math over files (journal timestamps + frontmatter/git), LLM-free.
*The heartbeat's actual firing is author-complete; verify on a real (Robinson) run.*

---

## Step 10 — Deployed Harness Drift

Check whether the deployed harness block in the outer harness file is in sync with the brain's `harness/` source:

- Look for a `<!-- BEGIN:SYNAPTIC-RULES -->` marker in the project's AGENTS.md (or CLAUDE.md, .cursorrules — wherever the harness was self-wired by `/synaptic-init`).
- If found: compare the content of that block against the current content of `.synaptic/harness/conventions.md` and `.synaptic/harness/guardrails.md`. If the deployed block contains edits not present in the `harness/` source files, **warn**: "Deployed SYNAPTIC-RULES block appears to have been edited directly. The `harness/` source is authoritative — re-run `/synaptic-init` (Deploy step) to re-sync. Direct edits to the deployed block are clobbered on the next deploy."
- If the outer harness file exists but has no `BEGIN:SYNAPTIC-RULES` marker: note that the harness has not been deployed; suggest running `/synaptic-init`.
- If no outer harness file is found: skip silently (not all environments use one).

This check closes the silent drift vector where a user edits the deployed block directly and loses those edits on next `/synaptic-init` or `/synaptic-upgrade`.

---

## Step 11 — Report

Present findings as a prioritised actionable checklist, grouped by category. Cap at **10 highest-impact findings**; note the total count if more exist. Each finding names the **procedure that treats it** (audit diagnoses, it does not fix).

```
Brain audit — N findings (showing top N):  [audit DIAGNOSES; weave/consolidate/synthesize/maintain TREAT]

## Stale nodes (>90 days or status: stale)
1. knowledge/api-integration/legacy-auth.md — last updated 2025-11-03 (221 days ago)
   → Review and update, or set status: stale?

## Orphan nodes (not in any _index.md)
2. knowledge/infra/old-deploy-notes.md — not registered in any sub-MOC
   → [/synaptic-weave] Register, move, or delete?

## Broken [[wikilinks]]
3. knowledge/api-integration/retry-policy.md [[rate-limiter]] — target not found
   → [/synaptic-weave] Create rate-limiter.md, rename, or remove link?

## MOC coverage gaps (vertical)
4. knowledge/auth/ cluster — _index.md missing
   → Create _index.md listing: jwt-decode.md, session-cache.md

## Cross-link coverage gaps (horizontal)
5. knowledge/ci-cd/deploy-playbook.md (type: playbook) — no link to any system it applies to
   → [/synaptic-weave Pass 1] Propose [[deploy-service]] + applies_to edge?

## God-nodes (over-connected)
6. knowledge/architecture/platform-overview.md — degree 18 (≥ 15, and ≥ 3× median 4) [WARN]
   → [/synaptic-weave] Candidate to split into atomic sub-nodes, or a legitimate hub — confirm.

## Surprising edges (cross-cluster)
7. knowledge/auth/jwt-decode.md —[depends_on]→ knowledge/infra/key-vault.md (auth ↔ infra) [WARN]
   → [/synaptic-weave] Confirm the interdisciplinary link (keep + ensure typed) or fix a mis-file.
      (No auto-discovery — this edge was authored, not inferred.)

## Registry integrity
8. registries/_index.md lists "environments" — registries/environments.md not found
   → Remove phantom entry or create the file?

## References _index.md issues
9. references/_index.md lists "schema-v2.sql" — not found in references/raw/
   → Remove entry or restore file?

## Oversized untyped nodes
10. knowledge/architecture/overview.md — 342 lines, type: knowledge
   → Split into sub-nodes or re-tag type: reference?

## Tag hygiene
11. knowledge/infra/load-balancer.md — tags: [] (empty)
   → Add tags: [infra, networking] (or relevant cluster/topic tags)

## Half-done / unconsolidated
12. playgrounds/feat-99-spike/ — open, not in journal Active list; journal at 71 pending breadcrumbs
   → [/synaptic-consolidate] Process & close; promote durable conclusions, burn scratch.
```

> The example above lists **every** category heading for reference; a **live** report still obeys the
> **cap of 10 highest-impact findings** (note the total if more exist). The god-node / surprising-edge
> and BRAIN.md-sanity findings are **WARN-severity advisories** — they rank below ERROR-class findings
> (broken links, orphans, missing MOC coverage) when the list is capped.

Ask: "Apply all? Or pick specific items?" — do not make changes without confirmation. Route each
finding to its treating procedure; audit itself writes nothing.

---

## BRAIN.md Sanity Check

After the main audit, quick-check `BRAIN.md` itself:

- Is `updated:` current (within the last active sprint/week)?
- Does the **Context Capsule** still accurately describe what the brain covers?
- Does the **harness pointer** line still point to the correct `harness/` path? (Operating rules live in the deployed harness, not inline in BRAIN.md — per ADR-003.)
- Is the **Brain Map** table consistent with the actual directory layout?

Flag anything materially out of date. These drifts are low-severity but compound over time.
