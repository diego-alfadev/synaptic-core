---
name: help
description: Display available commands, brain status, and quick reference.
---

# /help — Brain Status & Commands

## Execution

When the user invokes `/help`, display:

### 1. Brain Status

Read `MANIFEST.md` and summarize:
```
🧠 Brain: {{NAME}} v{{VERSION}}
   Areas: {{AREA_LIST}}
   Domains: {{DOMAIN_LIST}}
   Tools: {{AVAILABLE/NONE}}
   Journal: {{LINES}} lines in _current.md
```

### 2. Available Commands

```
Commands:
  /init          Set up or extend the brain
  /consolidate   Move working memory → structured knowledge
  /ingest FILE   Ingest a document into the brain
  /discover      Suggest relevant skills/tools for your context
  /audit         Review brain for gaps and missing info
  /help          This help message
```

### 3. Quick Reference

```
Where does it go?
  Decisions, lessons    → journal/_current.md (then /consolidate)
  IDs, URLs, endpoints  → inventory/
  Schemas, specs        → /ingest → references/ + knowledge node
  Role, principles      → identity/

Session rhythm:
  🔵 Orient  → bootstrap (automatic)
  🟢 Work    → capture via routing tree + heartbeat after each subtask
  🟠 Persist → /consolidate before ending
```

### 4. Health Check (optional)

If the user seems to want a health check, also report:
- `_current.md` line count (warn if > 200)
- `_tree.yaml` existence and age
- Any `_overview.md` files that are empty
- Orphan `.md` files not in `_tree.yaml`
- Whether `identity/HEARTBEAT.md` has real data or still has placeholders
