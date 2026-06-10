# skills/ — Local Custom Skills Only

This directory is for **local custom skills** specific to this brain (e.g., a CLI wrapper, a domain-specific workflow, or a project-specific automation).

Standard lifecycle commands (`/init`, `/plan`, `/consolidate`, `/ingest`, `/audit`, `/upgrade`) are provided by the `synaptic` skill package (`standalone/synaptic/` in the repo). Do not recreate them here.

To add a custom skill: create `skills/{slug}/SKILL.md` with a `name:` and `description:` in the frontmatter.
