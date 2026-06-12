# /audit — Brain Health Audit Reference

Cross-session review for staleness, orphan nodes, broken links, MOC coverage, registry integrity,
oversized untyped nodes, and tag hygiene. Run when: user invokes `/audit`, after several sessions,
or when the brain feels off.

**Prefer `node tools/check.js` if a runtime is available** — it automates Steps 2–7. Use this file
as the manual fallback or to interpret check output.

Do not auto-fix findings. Surface a prioritised list; ask for confirmation before any change.

---

## Step 1 — Staleness Pass

Scan all node files under `knowledge/` (recursing into clusters and `lessons/`) and `registries/`:

- Flag any node where `updated:` date is more than **90 days ago**.
- Flag any node with `status: stale`.

For each flagged node: note the staleness age and likely section to review. Present findings; ask before changing.

---

## Step 2 — Orphan Nodes

Read `knowledge/INDEX.md` (hub MOC) and every `knowledge/{cluster}/_index.md` (sub-MOCs). Then scan all `.md` files in `knowledge/`:

- Any `.md` file **not listed in any `_index.md`** is an orphan.
- An orphan node is unreachable — it does not effectively exist.

List orphans with their path. Ask: "Register in cluster `_index.md`, move, or delete?"

---

## Step 3 — Broken `[[wikilinks]]`

Scan all nodes for `[[wikilink]]` patterns. For each link:

- Resolve: does a file whose kebab-case name matches the link target exist in `knowledge/`?
- Flag unresolved targets as broken; note source file and broken target name.

Do not auto-fix. Surface the list; options are: create the target, rename, or remove the link.

---

## Step 4 — MOC Coverage

Read `knowledge/INDEX.md`. For each cluster entry:

- Does the linked `{cluster}/_index.md` exist?
- Does every file physically present in `knowledge/{cluster}/` appear in that `_index.md`?

Flag: missing `_index.md` files; nodes in a cluster directory not listed in the sub-MOC.

Also check: is every cluster directory listed in `knowledge/INDEX.md`? Flag unlisted cluster directories.

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

## Step 9 — Report

Present findings as a prioritised actionable checklist, grouped by category. Cap at **10 highest-impact findings**; note the total count if more exist.

```
Brain audit — N findings (showing top N):

## Stale nodes (>90 days or status: stale)
1. knowledge/api-integration/legacy-auth.md — last updated 2025-11-03 (221 days ago)
   → Review and update, or set status: stale?

## Orphan nodes (not in any _index.md)
2. knowledge/infra/old-deploy-notes.md — not registered in any sub-MOC
   → Register, move, or delete?

## Broken [[wikilinks]]
3. knowledge/api-integration/retry-policy.md [[rate-limiter]] — target not found
   → Create rate-limiter.md, rename, or remove link?

## MOC coverage gaps
4. knowledge/auth/ cluster — _index.md missing
   → Create _index.md listing: jwt-decode.md, session-cache.md

## Registry integrity
5. registries/_index.md lists "environments" — registries/environments.md not found
   → Remove phantom entry or create the file?

## References _index.md issues
6. references/_index.md lists "schema-v2.sql" — not found in references/raw/
   → Remove entry or restore file?

## Oversized untyped nodes
7. knowledge/architecture/overview.md — 342 lines, type: knowledge
   → Split into sub-nodes or re-tag type: reference?

## Tag hygiene
8. knowledge/infra/load-balancer.md — tags: [] (empty)
   → Add tags: [infra, networking] (or relevant cluster/topic tags)
```

Ask: "Apply all? Or pick specific items?" — do not make changes without confirmation.

---

## BRAIN.md Sanity Check

After the main audit, quick-check `BRAIN.md` itself:

- Is `updated:` current (within the last active sprint/week)?
- Does the **Context Capsule** still accurately describe what the brain covers?
- Are the **Top Guardrails** still the right top-5 from `harness/guardrails.md`?
- Is the **Brain Map** table consistent with the actual directory layout?

Flag anything materially out of date. These drifts are low-severity but compound over time.
