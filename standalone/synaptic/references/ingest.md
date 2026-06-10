# /ingest — Document Ingestion Reference

Ingest an external document into the brain. Usage: `/ingest path/to/file.ext`

---

## Step 1: Read the Source and Assess Size

Read the target file. Identify its type:

| Type | Key things to extract |
|------|-----------------------|
| Database schema (`.ddl`, `.sql`) | Tables, relationships, key constraints |
| API spec (`.yaml`/`.json` OpenAPI) | Endpoints, models, auth |
| Documentation (`.md`, `.txt`) | Key concepts, decisions, processes |
| Config file | Notable settings and their purposes |
| Other | Main facts, decisions, constraints |

**Size decision:**

| Source size | Route |
|-------------|-------|
| Large (>200 lines) or verbatim artifact worth preserving | → `references/` + distilled knowledge page (see §2a) |
| Small / already prose | → knowledge page directly (see §2b) |

---

## §2a: Large Verbatim Artifact → references/ + distilled page

1. Copy the source file to `references/{filename.ext}` (keep original filename or a clear slug).
2. Add a 1-line entry to `references/_index.md`:
   ```
   - `{filename.ext}` — {what it is, when it matters}
   ```
3. Create a distilled knowledge page in `knowledge/{topic-slug}.md` from `templates/page.md`.
   Set frontmatter `type: reference`. Populate with distilled facts: key structures, decisions,
   constraints — **not** a verbatim copy. End with a source pointer:
   ```
   > Full artifact: `references/{filename.ext}` (see [[references/_index]])
   ```
4. Register the knowledge page in `knowledge/INDEX.md`.

---

## §2b: Small Document → knowledge page directly

Create `knowledge/{topic-slug}.md` from `templates/page.md`. Populate with a dense summary of
key facts, structures, and decisions. Set frontmatter `type: reference`. Link related pages with
`[[wikilinks]]`. Register in `knowledge/INDEX.md`.

No file is added to `references/` for small documents.

---

## Step 3: Write-Validation Gate

Before finishing, verify the new page passes:

- [ ] Frontmatter filled (`description:`, `updated:`, `status:`, `type: reference`)
- [ ] No `{{placeholders}}` in the file
- [ ] Page ≤150 lines; if longer, split with `[[wikilinks]]`
- [ ] Registered in `knowledge/INDEX.md`
- [ ] If artifact was stored in `references/`: a corresponding entry exists in `references/_index.md`

---

## Step 4: Report

```
Ingested: {filename}
  → Knowledge page: knowledge/{topic-slug}.md
  → Registered in: knowledge/INDEX.md
  → Artifact stored: references/{filename.ext} (if large artifact)
  → _index.md entry added (if artifact stored)
```

---

## Rules

- The knowledge page is a summary, not a replacement for the source.
- Always register the new page in `knowledge/INDEX.md` — an unregistered page does not exist.
- Always add a `references/_index.md` entry for every file stored in `references/`.
- Never eager-load `references/` files during brain boot — agents read them on demand.
- Ask the user if placement is unclear; do not guess at sensitive categorisation.
