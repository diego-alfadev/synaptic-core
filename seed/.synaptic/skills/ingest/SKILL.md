---
name: ingest
description: Ingest an external document into the brain. Extracts knowledge nodes and stores the original in references/.
---

# /ingest — Document Ingestion

## Overview

Takes an external file (DDL, spec, docs, etc.), stores the original in `references/`, and extracts a knowledge node (summary + key facts) for reasoning-based navigation.

## Usage

```
/ingest path/to/file.ext
```

## Execution

### Step 1: Read the File

Read the target file. Determine its type:
- Database schema (`.ddl`, `.sql`) → extract tables, relationships, key constraints
- API spec (`.yaml`, `.json` OpenAPI) → extract endpoints, models, auth
- Documentation (`.md`, `.txt`) → extract key concepts, decisions, processes
- Config files → extract notable settings and their purposes

### Step 2: Store Original

1. Copy the file to `references/`
2. Update `references/_index.md`:
   ```
   | filename.ext | One-line description | ✅ → knowledge path |
   ```

### Step 3: Extract Knowledge Node

Create a knowledge node in the appropriate location:

**For schemas:** `knowledge/domains/architecture/db-schema.md`
```markdown
# Database Schema

> Summary of the database structure from schema.ddl

## Tables
- **users** — User accounts (id, email, role, created_at)
- **projects** — Project definitions (id, name, owner_id, status)
...

## Key Relationships
- users 1:N projects (via owner_id)
...

## Notes
- Uses UUID primary keys
- All timestamps are UTC

> Full schema: see references/schema.ddl
```

**For API specs:** `knowledge/domains/architecture/api-endpoints.md`
**For docs:** `knowledge/domains/[topic]/[extracted-topic].md` or `knowledge/areas/[area]/[topic].md`

### Step 4: Discovery-First Check

Verify the new node is findable:
- [ ] Title describes content
- [ ] Added to parent `_overview.md`
- [ ] Summary written for `_tree.yaml`

### Step 5: Rebuild Tree

Update `knowledge/_tree.yaml` with the new node.
If `tools/build-tree.js` exists → use it.

### Step 6: Report

```
Ingested: filename.ext
  → Stored in: references/filename.ext
  → Knowledge node: knowledge/domains/architecture/db-schema.md
  → Tree updated: ✅
```

## Rules

- Always keep the original in `references/` — the knowledge node is a summary, not a replacement
- If the file is very large (>500 lines), extract only the most important parts into the knowledge node
- Link back to the original: "Full source: see references/filename.ext"
- Ask the user if you're unsure about where the knowledge node should go (which area/domain)
