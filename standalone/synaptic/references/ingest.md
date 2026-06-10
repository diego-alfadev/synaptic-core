# /ingest — Document Ingestion Reference

Summarise an external document into a knowledge page and register it in the brain.
Usage: `/ingest path/to/file.ext`

---

## Step 1: Read the Source

Read the target file. Identify its type to guide extraction:

| Type | Key things to extract |
|------|-----------------------|
| Database schema (`.ddl`, `.sql`) | Tables, relationships, key constraints |
| API spec (`.yaml`/`.json` OpenAPI) | Endpoints, models, auth |
| Documentation (`.md`, `.txt`) | Key concepts, decisions, processes |
| Config file | Notable settings and their purposes |
| Other | Main facts, decisions, constraints |

For files >500 lines: extract only the most important parts. Do not dump verbatim content.

---

## Step 2: Create the Knowledge Page

Create a knowledge page in `knowledge/` at the most appropriate path. Use `knowledge/_page_template.md` as the base. Set frontmatter:

```yaml
---
description: "One-line summary of the source document"
updated: "YYYY-MM-DD"
status: active
type: reference
---
```

Page content should be a dense summary: key facts, structures, decisions — not a copy of the source. Link related pages with [[wikilinks]]. End with a source reference line:

```
> Source: see assets/{filename.ext} (or external path if not stored locally)
```

---

## Step 3: Large Artifacts (Optional)

If the source file is large (>200 lines) and worth preserving verbatim:
- Create `knowledge/assets/` next to the knowledge page (or in the same directory).
- Copy the file to `knowledge/assets/{filename.ext}`.
- Link from the page: `> Full source: [[assets/{filename.ext}]]`

The knowledge page remains the navigation entry point. The asset is reference-only.

---

## Step 4: Register in INDEX.md

Add the new page to `knowledge/INDEX.md` under the most relevant topic group:

```markdown
## {Topic Group}
- [[page-name]] — {one-line summary matching page description}
```

If no suitable group exists, create one.

---

## Step 5: Report

```
Ingested: {filename}
  → Knowledge page: knowledge/{path}.md
  → Registered in: knowledge/INDEX.md
  → Asset stored: knowledge/assets/{filename} (if applicable)
```

---

## Rules

- The knowledge page is a summary, not a replacement for the source.
- Always register the new page in `knowledge/INDEX.md`. An unregistered page does not exist.
- Ask the user if placement is unclear — do not guess at sensitive categorisation.
- Do not create a `references/` directory; in v0.4 ingested artifacts live in `knowledge/assets/`.
