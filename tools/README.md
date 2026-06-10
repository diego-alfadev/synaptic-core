# tools/ — Optional Synaptic Brain Helpers

The optional **TOOLS** layer of synaptic-core. The CORE layer (plain files) never
requires these scripts — everything they do can be done manually. Use when Node ≥ 18
is available.

## check.js — Brain Lint

```sh
node tools/check.js [path-to-.synaptic]
```

ERRORs exit 1; WARNINGs are informational. Checks: layout (BRAIN.md + INDEX.md
present; no v0.4 leftovers: `identity/`, `worklines/`, `skills/`, `cortex.config.yaml`,
`BOOTSTRAP.md`, `MANIFEST.md`, `knowledge/_tree.yaml`, `knowledge/_page_template.md`) ·
budgets (read from `BRAIN.md` `budgets:` frontmatter; fallback `{journal:80, page:150,
brain:100}`) · frontmatter `description/updated/status` on knowledge pages and playbooks
(`{{…}}` tolerated) · kebab-case naming + no duplicate basenames in `knowledge/` ·
orphans (pages not in INDEX.md; playbooks not in `_index.md`) · broken `[[wikilinks]]`
(HTML comments and inline code skipped; `templates/` skipped entirely) · references
cross-check (file ↔ `references/_index.md`) · playgrounds not mentioned in journal ·
staleness (`updated:` > 90 days).

## obsidian-setup.js — Obsidian Vault Config

```sh
node tools/obsidian-setup.js [path-to-.synaptic]
```

Creates `.obsidian/app.json` (wikilinks, shortest-path, auto-rename), `graph.json`
(excludes `templates/` and `journal/`), `appearance.json` (empty). Idempotent — skips
existing files. Never touches brain content.

**Matrioshka note:** CORE (files) → TOOLS (these scripts) → ECOSYSTEM (Engram/MCP/RAG).
Tools are optional at every layer.
