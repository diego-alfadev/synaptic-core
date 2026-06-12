# /ingest — Document Ingestion Reference

Ingest an external document into the brain. Usage: `/ingest path/to/file.ext`

Applies the consolidation formula (Steps 2–6 from `references/consolidate.md`) to a single
external source rather than session output.

---

## Step 1 — Read the Source and Assess

Read the target file. Identify type and size:

| Type | Key things to extract |
|---|---|
| Database schema (`.ddl`, `.sql`) | Tables, relationships, key constraints, naming conventions |
| API spec (`.yaml` / `.json` OpenAPI) | Endpoints, models, auth, notable limits |
| Documentation (`.md`, `.txt`) | Key concepts, decisions, processes, constraints |
| Tabular data (`.csv`, `.xlsx`) | Records → determine if these belong in a registry |
| Config file | Notable settings and their purposes, non-default values |
| Other | Main facts, decisions, constraints, who owns it |

**Size and route decision:**

| Source | Route |
|---|---|
| Large (>200 lines) or verbatim artifact worth preserving | `references/raw/` + distilled knowledge node (§2a) |
| Tabular data — records looked up by attribute | `registries/{table}.md` (§2b) |
| Small / already structured prose | Knowledge node directly (§2c) |

---

## §2a — Large Verbatim Artifact

1. Copy the source file to `references/raw/{filename.ext}` (keep original filename or a clear slug).
2. Add a 1-line entry to `references/_index.md`:
   ```
   - `{filename.ext}` — {what it is, when it matters, captured {DATE}}
   ```
3. Create a distilled knowledge node `knowledge/{cluster}/{topic-slug}.md` from `templates/node.md`. Set `type: reference`. Populate with:
   - Key structures, decisions, and constraints — **not** a verbatim copy.
   - A source pointer at the bottom:
     ```
     > Full artifact: `references/raw/{filename.ext}` — see [[references/_index]]
     ```
4. Add `[[wikilinks]]` to related nodes.
5. Register the node in `knowledge/{cluster}/_index.md` and the cluster in `knowledge/INDEX.md`.

---

## §2b — Tabular Data → Registry

1. Determine the record class and lookup key (e.g. environment name, repo slug, term).
2. If a registry for this class already exists (`registries/{table}.md`): add the new rows and bump `updated:`.
3. If no matching registry exists: create `registries/{table}.md` from `templates/registry.md`; populate table; register in `registries/_index.md`.
4. Do NOT copy registry data into knowledge nodes — link from knowledge nodes to the registry instead.

---

## §2c — Small Document → Knowledge Node Directly

1. Create `knowledge/{cluster}/{topic-slug}.md` from `templates/node.md`.
2. Populate with a dense summary: key facts, decisions, constraints. No verbatim copy.
3. Set `type: reference` (or the most appropriate type if clearly a pattern/playbook/decision).
4. Add `[[wikilinks]]` to related nodes.
5. Register in `knowledge/{cluster}/_index.md` and ensure cluster is in `knowledge/INDEX.md`.
6. No file is added to `references/raw/` for small documents.

---

## Step 3 — Apply Consolidation Formula (Steps 2–6)

Before writing, run the atomicity + promotion test, generalize, place & link, dedupe/SSOT, and quality gate from `references/consolidate.md`. Specifically:

- [ ] Frontmatter D1: `description`, `type`, `status: active`, `updated: {today}`, `tags: [...]` — filled, no placeholders.
- [ ] Soft budget: node ≤ ~150 lines, or `type: reference` if deliberately long.
- [ ] MOC-reachable: listed in cluster `_index.md`; cluster listed in `knowledge/INDEX.md`.
- [ ] If artifact stored in `references/raw/`: corresponding entry exists in `references/_index.md`.
- [ ] `[[wikilinks]]` in the node resolve to real files.
- [ ] Professional & verifiable: no PII, credentials, or application-specific secrets.

---

## Step 4 — Report

```
Ingested: {filename}
  → Route: {large verbatim | tabular data | small document}
  → Knowledge node: knowledge/{cluster}/{topic-slug}.md (type: {type})
  → Registered in: knowledge/{cluster}/_index.md + knowledge/INDEX.md
  → Artifact stored: references/raw/{filename.ext}  [if §2a]
  → _index.md entry added: references/_index.md     [if §2a]
  → Registry updated: registries/{table}.md          [if §2b]
```

---

## Rules

- The knowledge node is a summary — never a replacement for the source artifact.
- Always register the node in its cluster `_index.md` — an unregistered node does not exist.
- Always add a `references/_index.md` entry for every file stored in `references/raw/`.
- Never eager-load `references/raw/` files during brain boot — agents read them on demand.
- Never copy registry data into knowledge nodes — link to the registry instead.
- If placement is unclear, ask. Do not guess at sensitive categorisation.
