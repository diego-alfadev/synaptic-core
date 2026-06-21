---
description: "Index of all registries — tabular SSOTs for records looked up by attribute."
type: registry
status: active
updated: "{{YYYY-MM-DD}}"
tags: [moc, registries]
---

# Registries

Registries are tabular single-sources-of-truth for records that are looked up by attribute — infrastructure resources, repository catalogs, database/server inventory, environments, glossary terms. They are **never eager-loaded**; open only when a lookup is required.

**Core rule:** one canonical table per record class. Update, don't duplicate. Never copy registry data into knowledge nodes — link to the registry instead.

---

## Index

<!-- Add one line per registry file when you create it.
     Format: - `[[registry-filename]]` — {{what record class it covers}} -->

<!-- - `[[environments]]` — runtime environments (dev/staging/prod) with URLs, credentials hints, and owners -->
<!-- - `[[repositories]]` — repo catalog with stack, CI status, and migration state -->
<!-- - `[[glossary]]` — canonical term definitions; link from knowledge nodes instead of redefining -->
<!-- - `[[resources]]` — infra resources (cloud, servers, services) with IDs and ownership -->

---

> Use `templates/registry.md` when creating a new registry file.
