# ADR-001 — v0.4 "Minimal Cortex" Design

**Status:** Accepted  
**Date:** 2026-06-10  
**Deciders:** Synaptic-Core maintainers (spec-driven, evidence-based)

---

## Context

### The problem: eager boot and structural drift

Synaptic-Core v0.3 was designed around a multi-file eager boot: at session start the agent
was instructed to read BOOTSTRAP.md (instruction manual), MANIFEST.md (brain metadata), and
optionally HEARTBEAT.md (anti-drift protocol), plus cortex.config.yaml. Measurement across
real sessions showed this cost **8–10 files at approximately 5.5–6.4k tokens**, with
**30–40% of that content duplicated** between the boot files and the harness bridge files that
project-level configs (CLAUDE.md, .cursor/rules, etc.) injected into the system prompt. The
net effect was that every session paid a significant knowledge tax before any work began, and
much of it was redundant.

### Evidence from a real brain instance

A real brain instance grown over months of production use revealed four structural patterns that
invalidated core v0.3 assumptions:

**1. The node graph never materialised.**  
`knowledge/_tree.yaml` and `knowledge/INDEX.md` together referenced **32 files**. Zero of those
files existed. Knowledge gravity had pulled content into 2 dense `_overview.md` files — the
brain's most valuable artifacts — bypassing the intended node-graph structure entirely. The tree
was a second index that drifted into phantom territory while real knowledge accumulated elsewhere.

**2. inventory/, references/, and journal/archive/ were never created.**  
Across months of active use, no files appeared in `inventory/` (projects, environments,
glossary) or `references/` (verbatim schemas and specs). The `journal/archive/` convention was
also skipped. Point-in-time facts (endpoints, IDs, config) had been written directly into
knowledge overview pages alongside the context that gave them meaning — a pattern that proved
more durable than the dedicated inventory structure.

**3. Only 1 of 8 standard skills existed on disk.**  
The per-brain skill directories (`skills/init/`, `skills/plan/`, etc.) were intended as the
lifecycle interface. In practice, real tooling was wired through the harness (CLAUDE.md hooks,
slash commands), and the skill files were never instantiated. The 8-skill ceremony added
structural overhead without delivering corresponding value.

**4. The anti-drift heartbeat is a legacy mechanism.**  
The HEARTBEAT.md ceremony (re-read every 3–5 interactions, explicit drift acknowledgment) was
designed for weak pre-2025 models that could not reliably maintain persona over a session.
Modern harnesses pin system context; the ceremony became a maintenance burden with no
measurable anti-drift benefit in the real brain instance.

### External evidence incorporated

Analysis of adjacent patterns validated several convergent directions:

- **Karpathy LLM-wiki / llmwiki.app pattern:** dense linked pages + a single navigable index
  outperforms shallow bullet hierarchies for agent recall. Compilation over RAG at scale.
- **Zettelkasten principle (agent-adapted):** links are the structure; folders are optional
  organisation. A page not reachable from the map does not exist.
- **Arscontexta write-validation gate:** before persisting, confirm the node will be reachable
  from the index. Prevents the phantom-node failure mode observed in the real brain.
- **Engram files-authoritative contract:** files are always the source of truth; derived indexes
  (SQLite/FTS, embeddings) are deletable caches. This is the correct seam between lightweight
  and robust modes.
- **Agent Skills progressive disclosure:** a single skill file with L1 metadata + L2 body +
  L3 on-demand resources avoids the 8-skill proliferation without losing capability.

---

## Decision

Redesign the standard as **v0.4 "Minimal Cortex"** in-place (same repo, name, and matrioshka
layering), replacing the v0.3 skeleton with a structure derived directly from the evidence.

### Core decisions

**1. Single-file mandatory boot — BRAIN.md.**  
BRAIN.md (≤120 lines / target ≤800 tokens) absorbs BOOTSTRAP.md, MANIFEST.md, and HEARTBEAT.md.
It contains: YAML frontmatter (standard, version, name, scope, updated); an identity capsule
(~15 lines: role, language/tone, top constraints); a brain map (one line per directory, naming
the key file); a session-start instruction (resume pointer to journal and worklines); condensed
routing rules (~8 lines); and a commands table. Everything else is on demand.

**2. Single knowledge index — knowledge/INDEX.md as the sole MOC.**  
`_tree.yaml` is deleted. `knowledge/INDEX.md` is the only navigation hub: grouped wikilinks
with one-line summaries. Discovery rule: a page not listed in INDEX.md does not exist. This
makes the phantom-node failure mode a lint error, not a silent inconsistency.

**3. Dense wiki pages legitimised as the canonical knowledge unit.**  
The evidence showed that dense `_overview.md` files were the most valuable artifacts. v0.4
formalises this: each knowledge page is a self-contained dense overview (~150 lines soft
budget), carries lightweight YAML frontmatter (`description`, `updated`, `status`, optional
`type` and `validated`), and uses `[[wikilinks]]` for relations. Point-in-time facts live in
the page about the system they belong to, tagged with `updated:` date. No separate inventory.

**4. Playbooks as first-class citizens.**  
A playbook is an agent-followable recipe distilled from successful work. Its function is to
encode "intention + inertia": it teaches the agent to generate a plan (assess state → identify
gaps → produce prioritised plan), not follow a fixed sequence. Playbooks are indexed in
`playbooks/_index.md`. Lifecycle: recon → draft from a real success → refine per failure.
This is the component that differentiates a Synaptic brain from an inert reference wiki.

**5. Unified synaptic skill with progressive disclosure.**  
One installable skill file replaces the 8 per-brain skill directories. L1 (~100 tokens,
always loaded): trigger conditions. L2 (~1.5–2.5k tokens): brain detection, boot logic,
onboarding interview (scope-aware: project | role | org | life; 3–5 rounds; generates
BRAIN.md + INDEX.md + initial pages + harness bridges). L3 (on demand): operation reference
files (`consolidate.md`, `audit.md`, `plan.md`, `ingest.md`, `upgrade-v03-to-v04.md`).
A brain without the skill installed still works — BRAIN.md is self-describing.

**6. inventory/ and references/ dropped from the standard.**  
Both structures were never created in months of real production use. Facts about systems live
in the knowledge page for that system, tagged with `updated:` dates. Large verbatim assets
(schemas, DDLs) may be stored in an optional `knowledge/assets/` convention linked from pages.
There is no prescribed `inventory/` or `references/` directory in the v0.4 seed.

**7. Harness bridge = pointer only (≤10 lines).**  
Bridge files (CLAUDE.md, .cursor/rules, etc.) contain exactly: "this workspace has a Synaptic
brain at `.synaptic/`; read `.synaptic/BRAIN.md` at session start; available commands." No
protocol content, no routing rules, no identity. The 30–40% boot duplication is eliminated
by contract: bridge files that contain protocol content violate the standard.

**8. Files-authoritative as the lightweight/robust seam.**  
Files are always the source of truth in every mode. Robust mode (out of MVP scope) may add a
derived SQLite/FTS sidecar index and optional MCP server, but those are deletable caches.
The indexable surface is exactly the CORE contract (frontmatter fields + INDEX.md + wikilinks),
so the schema never forks between modes.

---

## Consequences

### Positive

- **Boot cost drops ~10×**: BRAIN.md at ≤800 tokens replaces 5.5–6.4k tokens of eager loading.
  Cheaper sessions, less harness duplication waste.
- **Structure survives real use**: the v0.4 skeleton matches what the evidence brain actually
  grew into — dense pages, a single index, no inventory. No more phantom structure.
- **Playbooks encode compound value**: the brain accumulates not just what is known but how
  the work is done. Each real success or failure sharpens the recipe.
- **Single skill, progressive disclosure**: one file to install, no per-brain skill ceremony.
  A new user gets a complete brain from a Socratic interview with no pre-existing files.
- **Clean seam to robust mode**: the files-authoritative contract means upgrading to
  SQLite-backed search or MCP integration later requires no structural migration.
- **Scope generalises cleanly**: `scope: project | role | org | life` in BRAIN.md frontmatter;
  the interview branches accordingly; the directory structure does not change.

### Honest costs and risks

- **Budget discipline moves to the agent side.** BRAIN.md's ≤120-line limit and per-page
  ≤150-line soft budget are conventions, not enforced by the file format. `tools/check.js`
  (the TOOLS-layer lint) validates these deterministically, but it requires Node ≥ 18 and is
  optional. Brains grown without it can silently exceed budgets.
- **Brains without the skill lose guided lifecycle.** The 0-install CORE promise means a brain
  works without the skill installed, but `/synaptic-consolidate`, `/synaptic-audit`, and `/synaptic-upgrade` all require
  the skill. Teams that do not install the skill lose the consolidation and staleness-review
  workflow.
- **v0.3 migration is non-trivial for large brains.** The `/synaptic-upgrade` procedure covers the
  full path (BOOTSTRAP/MANIFEST/HEARTBEAT → BRAIN.md; areas/domains → flat pages; _tree.yaml
  → INDEX.md with phantom pruning; inventory/references → knowledge pages), but it requires
  reading and re-routing content. The upgrade guide is content-preserving by design, not
  automatic.
- **check.js is not yet runtime-validated.** The TOOLS-layer lint (`tools/check.js`) is
  deterministic and zero-dependency, but it is not yet wired into any CI pipeline. Its
  effectiveness depends on teams choosing to run it.

---

## Alternatives Considered

### Alternative 1: Keep v0.3 and patch incrementally

Rejected. The evidence shows the v0.3 structure was not merely under-used — it was actively
bypassed by real use patterns. Patching BOOTSTRAP.md to be smaller, or making inventory/
optional, would preserve a skeleton that the evidence has already falsified. The cost of
structural confusion (phantom nodes, duplicated boot files, 8 unused skill directories) is
paid on every session start and every new brain setup. Patching does not eliminate the source
of those costs; it only defers them.

### Alternative 2: Rebuild as a vanilla LLM-wiki

Rejected. A vanilla wiki keeps only the *substrate*: linked Markdown pages with an index.
The evidence shows the substrate is the part that needs the least help. What demonstrably
delivered value in the real brain instance were the components that encode **intention and
inertia**: the identity capsule (who/why/constraints), journal continuity (where work stopped),
worklines (active direction and priorities), and harness bridges. A vanilla wiki discards all
of these. v0.4 instead formalises them in BRAIN.md (identity + session start + routing) and
in playbooks (encoded successful work). The Zettelkasten/LLM-wiki convergence informs the
knowledge layer; it does not replace the whole design.

### Alternative 3: Robust-first — Engram/SQLite as the v0.4 foundation

Rejected. Engram-backed or SQLite-indexed brains are a valid target for a "robust mode" but
violate the CORE non-negotiable of 0-install, no hidden services. The evidence brain showed
that the primary failure modes were structural (phantom nodes, boot bloat, unused ceremony),
not retrieval failures that would be solved by full-text search. Introducing a binary
dependency at the CORE layer would break portability, auditability, and the air-gapped
enterprise use case. The files-authoritative contract (§Decision point 8) is precisely the
seam that allows robust mode to be added later without forking the schema — so the correct
move is to fix CORE first, then let robust mode grow on top.

---

## References

- `synaptic-audit/spec/SPEC.md` — the living specification this ADR implements (§0–§4)
- `synaptic-audit/research/` — raw evidence files from the real brain analysis
- `standalone/synaptic/SKILL.md` — the unified skill package
- `standalone/synaptic/references/upgrade-v03-to-v04.md` — migration guide
- `seed/.synaptic/BRAIN.md` — the v0.4 boot file template
- `tools/check.js` — TOOLS-layer lint (BRAIN.md budget, INDEX coverage, frontmatter, wikilinks)
