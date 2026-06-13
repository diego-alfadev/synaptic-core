---
description: "{{ONE_LINE: what record class this registry tracks}}"
type: registry
status: active
updated: "{{YYYY-MM-DD}}"
tags: [registry, "{{record-class-tag}}"]
---

# {{Registry Title}}

{{1–2 sentences: what this registry tracks, when to use it, who owns it.}}

**Lookup key:** {{the attribute used most often to look up records — e.g. "name", "environment", "repo slug"}}
**Update rule:** update in place; never add a duplicate row. Bump `updated:` in the frontmatter on every change.

---

## {{Record Class}} Table

| {{Column A}} | {{Column B}} | {{Column C}} | Notes |
|---|---|---|---|
| `{{value}}` | `{{value}}` | `{{value}}` | {{optional note}} |

<!-- Add columns as needed. Keep each row atomic — one record per row.
     Point-in-time facts (IDs, URLs, credentials hints) belong here, stamped with updated: above.
     When a fact changes: update the row, bump updated:. Never keep stale rows — archive them
     with a strikethrough or move to a commented-out section. -->

---

> Registered in `registries/_index.md`. Load this file only when a lookup is needed.
