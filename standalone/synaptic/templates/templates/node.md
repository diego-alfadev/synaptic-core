---
description: "{{ONE_LINE — copied verbatim into the cluster _index.md summary}}"
type: knowledge
# type options: knowledge | pattern | playbook | decision | reference | lesson | registry
status: active
# status options: active | stale | archived
updated: "{{YYYY-MM-DD}}"
tags:
  - "{{cluster-tag}}"
  - "{{topic-tag}}"
# tags enable Ctrl+Shift+F faceted search and the future FTS/RAG index surface

# --- Provenance & confidence (OPTIONAL, additive — adding these does NOT bump brain schema) ---
# source: where this knowledge came from (footnote / URL / doc / "session 2026-06-21" / ticket).
#         Provenance is the bank-governance argument: every claim is traceable.
# source: "{{e.g. internal runbook §3 · https://… · session YYYY-MM-DD · ticket KEY}}"
# confidence: how settled this knowledge is. Three-value enum ONLY: high | medium | low.
# confidence: medium
# Bi-temporal recency (OPTIONAL): distinguish when the fact became TRUE from when you LEARNED it.
# true_since: "{{YYYY-MM-DD — when the fact started being true in the world}}"
# learned_on: "{{YYYY-MM-DD — when this brain captured it}}"

# --- Typed edges (OPTIONAL, additive — the frontmatter wikilink IS the edge) ---
# Author ONE direction only; the inverse is computed by grep, never stored.
# PARSER-SAFE BLOCK-LIST FORM ONLY — always `- "[[target]]"`, one per line.
# NEVER inline (e.g. `depends_on: [[x]]`) — inline form mangles the frontmatter parser.
# weave/audit may PROPOSE an edge type; they never auto-write one.
#
# relates_to:            # default; absorbs the old `documented_in`. Inverse: relates_to
#   - "[[related-node]]"
# depends_on:            # this node needs the target. Inverse (grep): required_by
#   - "[[prerequisite-node]]"
# supersedes:            # this node replaces the target. Inverse (grep): superseded_by
#   - "[[old-node]]"
# contradicts:           # this node conflicts with the target. Inverse: contradicts
#   - "[[conflicting-node]]"
# applies_to:            # this node applies to the target (e.g. ticket-type → playbook). Lateral.
#   - "[[target-context]]"
# causes:                # this node causes the target. Inverse (grep): caused_by
#   - "[[effect-node]]"
# part_of:               # this node is a real component of the target. Inverse (grep): has_part
#   - "[[whole-system]]"
#
# part_of MISUSE RULE: `part_of` is for REAL composition of entities
# (system → subsystem → component), NOT to mirror the folder/cluster a node is filed in.
# Cluster membership is expressed by the MOC, not by `part_of`. (Protects bounded navigation.)
---

# {{Title}}

<!-- STYLE NOTES
- Atomic: one concept per file. If this node covers two independent concepts, split it.
- Soft budget: ~150 lines. Over budget → split into linked sub-nodes and replace excess with
  `[[subpage-name]]` links — OR tag `type: reference` if this is a deliberately long canonical doc.
- Links: write `[[wikilinks]]` at capture time; never retroactively.
- Typed edges (optional): authored as block-list frontmatter above (`- "[[x]]"`), one direction only.
- Naming: unique kebab-case filename across all of knowledge/ (no duplicates, no spaces).
- Registration: add this node to its cluster `_index.md` before the session closes.
- Quality bar: professional & verifiable only; no opinions, rumors, or application data.
-->

<!-- Write content below this line -->

---

## bias-check

<!-- EPISTEMIC SCOPING RULE (binding): this section documents gaps / contradictions / the other
     side of the KNOWLEDGE on this page — NOT agent behavior, tone, or hedging.
     Behavior and persona live in the harness (AGENTS.md / CLAUDE.md), never in the brain.

     Capture, when relevant:
     - What is NOT known yet / open questions this node does not answer.
     - Contradicting evidence or a credible opposing view (pair with a `contradicts:` typed edge).
     - The conditions under which this knowledge stops holding.
     Omit the section entirely if there is genuinely nothing to flag — do not pad it. -->
