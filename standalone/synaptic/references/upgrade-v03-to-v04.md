# /upgrade — v0.3 to v0.4 Migration Guide

Content-preserving migration from v0.3 (BOOTSTRAP/MANIFEST structure) to v0.4 (Minimal Cortex).
Read this file fully before making any changes. Work in order. Ask for confirmation before deletions.

---

## What Changed

| v0.3 | v0.4 | Action |
|------|------|--------|
| `BOOTSTRAP.md` | `BRAIN.md` | Migrate — see §1 |
| `MANIFEST.md` | (merged into BRAIN.md) | Migrate then delete |
| `identity/HEARTBEAT.md` | (removed — absorbed by BRAIN.md capsule) | Migrate content then delete |
| `knowledge/areas/*/_overview.md` | `knowledge/{topic}.md` (flat pages) | Migrate — see §2 |
| `knowledge/domains/*/_overview.md` | `knowledge/{topic}.md` (flat pages) | Migrate — see §2 |
| `knowledge/_tree.yaml` | `knowledge/INDEX.md` | Rebuild then delete — see §3 |
| `inventory/{projects,environments,glossary}.md` | Merged into relevant knowledge pages | Migrate — see §4 |
| `references/*` | `knowledge/` pages + `knowledge/assets/` | Migrate — see §5 |
| `skills/{init,plan,consolidate,ingest,discover,audit,upgrade,help}/` | Provided by `synaptic` skill package | Delete — see §6 |
| Local custom skills | `skills/{custom-slug}/` | Keep — do not touch |
| `journal/`, `worklines/` | Unchanged | No action needed |
| `cortex.config.yaml` | Updated version | Replace with v0.4 template |

---

## §1 — Migrate BOOTSTRAP.md + MANIFEST.md + HEARTBEAT.md → BRAIN.md

Create `.synaptic/BRAIN.md` from the v0.4 template bundled with this skill (`templates/BRAIN.md`;
fallback: `seed/.synaptic/BRAIN.md` in the synaptic-core repo).

Map content as follows:

**From `MANIFEST.md`:**
- `name:` → BRAIN.md frontmatter `name:`
- `scope:` (or infer from role) → BRAIN.md frontmatter `scope:`
- `created:` / `updated:` → BRAIN.md frontmatter
- `role:` summary → BRAIN.md Identity Capsule `**Role:**`
- `language:` / `tone:` → BRAIN.md Identity Capsule `**Language/Tone:**`

**From `BOOTSTRAP.md` or `HEARTBEAT.md`:**
- Top 3–5 constraints / hard rules → BRAIN.md Identity Capsule `Top constraints:`
- Any language/tone rules → Identity Capsule

**BRAIN.md must stay ≤120 lines.** Move any detailed role narrative to `identity/ROLE.md`.

After creating BRAIN.md: delete `BOOTSTRAP.md`, `MANIFEST.md`, `identity/HEARTBEAT.md`.

---

## §2 — Migrate knowledge/areas/ and knowledge/domains/ → Flat Pages

For each `_overview.md` file under `areas/` or `domains/`:

1. Create a new page `knowledge/{topic-slug}.md` from `_page_template.md`.
2. Set frontmatter: `description:` (from the overview title/summary), `updated:` (today), `status: active`, `type: overview`.
3. Copy the content (decision lists, tech notes, key facts). Preserve the substance; reformat as needed.
4. At the bottom, add [[wikilinks]] to any sub-pages that were referenced in the old structure.

After migrating all pages: delete the `areas/` and `domains/` directories.

---

## §3 — Rebuild knowledge/INDEX.md from _tree.yaml

**Warning:** v0.3 `_tree.yaml` files often list **phantom files** — entries that were never created. Before registering anything in INDEX.md, confirm the file physically exists.

Steps:
1. Read `_tree.yaml`. For each entry, check if the corresponding `.md` file exists.
2. For files that exist: add to `knowledge/INDEX.md` under the appropriate topic group.
3. For phantom entries (listed in tree but file doesn't exist): skip — do not register.
4. After INDEX.md is populated and verified: delete `knowledge/_tree.yaml`.

---

## §4 — Migrate inventory/ → Knowledge Pages

Each inventory file holds concrete, point-in-time facts. Route them:

- `inventory/projects.md` → merge facts into the relevant knowledge page for each project. If no page exists yet, create one with `type: overview`.
- `inventory/environments.md` → merge server/hosting/endpoint data into the knowledge page for the system they belong to, tagged with `updated:` date.
- `inventory/glossary.md` → if substantial, create `knowledge/glossary.md`; otherwise merge terms into the most relevant knowledge page.

After merging: delete the `inventory/` directory.

---

## §5 — Migrate references/ → knowledge/ Pages + Assets

For each file in `references/` (excluding `_index.md`):

1. If it is a large verbatim artifact (schema, spec, config >100 lines): copy to `knowledge/assets/{filename}` and create a summary knowledge page linking to it (`/ingest` workflow).
2. If it is documentation or notes: create or update the relevant knowledge page directly.
3. Register every new knowledge page in `knowledge/INDEX.md`.

After migrating all references: delete `references/` (including `_index.md`).

---

## §6 — Remove Standard Skills

Delete the following skill directories (all provided by the `synaptic` skill package now):
```
skills/init/
skills/plan/
skills/consolidate/
skills/ingest/
skills/discover/
skills/audit/
skills/upgrade/
skills/help/
```

**Do NOT delete** any custom skill directories (those specific to this brain's use case).

Create `skills/README.md` (the standard v0.4 version will be in the seed).

---

## §7 — Verification Checklist

Before closing the migration:

- [ ] `BRAIN.md` exists, is ≤120 lines, frontmatter fully filled (no `{{placeholders}}`)
- [ ] `BOOTSTRAP.md`, `MANIFEST.md`, `identity/HEARTBEAT.md` deleted
- [ ] `knowledge/INDEX.md` lists all pages that actually exist; no phantom entries
- [ ] `knowledge/_tree.yaml` deleted after INDEX.md verified
- [ ] `areas/` and `domains/` directories deleted after content migrated
- [ ] `inventory/` directory deleted after facts merged into knowledge pages
- [ ] `references/` directory deleted after files migrated to `knowledge/` or `knowledge/assets/`
- [ ] Standard 8 skills deleted; any custom skills preserved
- [ ] All [[wikilinks]] in migrated pages resolve to real files
- [ ] No dangling references to `BOOTSTRAP.md`, `MANIFEST.md`, `HEARTBEAT.md`, or `_tree.yaml` in any surviving file (except this upgrade guide)
- [ ] `cortex.config.yaml` replaced with v0.4 version
- [ ] Harness bridges updated (run `/init` bridge step)

Migration complete when all items are checked.
