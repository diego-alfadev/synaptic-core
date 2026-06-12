---
description: "{{ONE_LINE: what record class this registry tracks}}"
type: registry
status: active
updated: "{{YYYY-MM-DD}}"
tags:
  - registry
  - "{{record-class-tag}}"
---

# {{Registry Title}}

{{1–2 sentences: what this registry tracks, when to use it, who owns it.}}

**Lookup key:** {{the attribute used most often to look up records}}
**Update rule:** update in place, never add a duplicate row. Bump `updated:` on every change.

---

## {{Record Class}} Table

| {{Column A}} | {{Column B}} | {{Column C}} | Notes |
|---|---|---|---|
| `{{value}}` | `{{value}}` | `{{value}}` | {{optional note}} |

<!-- One record per row. Point-in-time facts (IDs, URLs, credentials hints) belong here, stamped
     with updated: above. When a fact changes: update the row, bump updated:. Archive stale rows
     with a strikethrough comment rather than deleting — stale facts are data too. -->

---

> Registered in `registries/_index.md`. Load only when a lookup is needed — never eager-load.
