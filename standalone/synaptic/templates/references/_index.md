---
description: "Existence index for large/verbatim/external artifacts — indexes what exists, not the content."
type: knowledge
status: active
updated: "{{YYYY-MM-DD}}"
tags: [moc, references]
---

# References Index

Large verbatim artifacts — findable, never eager-loaded. This index records **that** an artifact exists and what it is; agents read fragments on demand. Knowledge nodes link here instead of embedding raw content.

**Verbatim payloads** (DDL `.sql`, `.xlsx`, large specs) live in `references/raw/`.

---

## Index

<!-- Format: - `filename.ext` — {{what it is, when it matters, path under raw/ if applicable}}
     Use backticks for filenames; do not use raw wikilinks in this index (they break on binary files).
     One line per artifact. -->

<!-- - `schema-export-2026-01.sql` — full DDL export for the {{schema}} database, captured {{DATE}} -->
<!-- - `spec-v2.xlsx` — stakeholder requirements spreadsheet for {{feature}}, received {{DATE}} -->

---

> Add an entry here when any file lands in `references/raw/`. Knowledge nodes reference these entries rather than embedding their content.
