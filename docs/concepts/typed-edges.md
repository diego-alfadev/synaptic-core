# Typed edges — what makes the graph relational

*What this is: how synaptic-core turns undifferentiated `[[wikilinks]]` into a relational graph an agent can reason over — the frozen seven-edge vocabulary, the three rules that keep it honest, and the GraphRAG caveat.*

A plain wiki has undifferentiated `[[wikilinks]]`: "A links to B" but never *why*. An AI Brain keeps the wikilink and adds an optional **relationship type**, so the graph carries meaning an agent can reason over — closer to a knowledge graph than a link soup.

## The frozen seven-edge vocabulary

The vocabulary is **frozen at seven edges** — small enough to stay consistent, expressive enough to matter. You author one direction; the inverse is computed by `grep`, never stored.

| Edge (you author) | Inverse (computed by grep) | Use when |
|---|---|---|
| `relates_to` *(default)* | `relates_to` | general association — the safe default |
| `depends_on` | `required_by` | A needs B to function |
| `supersedes` | `superseded_by` | A replaces / obsoletes B |
| `contradicts` | `contradicts` | A and B make incompatible claims |
| `applies_to` | *(lateral)* | a playbook / process → the system it governs |
| `causes` | `caused_by` | A produces / triggers B |
| `part_of` | `has_part` | real composition (system → subsystem → component) |

Why frozen? A small closed vocabulary stays consistent across every agent and every session — anyone (or any agent) reading the brain knows exactly what the seven edges mean, and `/synaptic-weave` can propose them reliably. An open-ended set of relationship types would drift into synonyms (`needs`, `requires`, `uses`, `depends`) that mean the same thing inconsistently, and the graph would stop being machine-reasonable.

## Three rules that keep it honest and portable

- **Authored, not inferred.** Edges are written at capture time (or *proposed* by `/synaptic-weave` and confirmed). The brain makes **no auto-discovery-of-links claim** — we cite [GraphRAG](https://github.com/microsoft/graphrag) only as **the direction** (multi-hop relational retrieval), not as something we run.
- **One direction only.** You write `depends_on`; the inverse `required_by` is computed by `grep`, never stored. No index to keep in sync — there is no second copy of the relationship that can rot or disagree with the first.
- **The frontmatter wikilink *is* the edge.** No separate edges file, no derived graph DB — typed edges are parser-safe block-list `[[wikilinks]]` in a node's frontmatter. Adding them is **backward-compatible** and never bumps the brain `schema_version`.

## The GraphRAG caveat — "direction, not claim"

This matters enough to state plainly: synaptic-core is **not** GraphRAG and makes **no auto-discovery-of-non-intuitive-links claim**. GraphRAG (and LightRAG) are cited only as **the direction** — multi-hop relational retrieval over a typed graph is the destination the field is heading toward, and the typed-edge model is built so a brain can evolve toward it.

But the edges here are **authored**, not inferred by an embedding pipeline. When a semantic layer arrives (a horizon Cortex item), it **proposes** candidate links for `/synaptic-weave` and a human to confirm — it never auto-writes edges. The multi-hop retrieval that runs over this graph runs over **authored directional edges an embedding cannot infer**: a human (or an agent at capture time) decided that A `depends_on` B, and that decision is the authoritative fact.

This keeps the honesty line clean: we get the *relational* payoff (typed, navigable, reasoning-friendly edges) without overclaiming the *automatic-discovery* magic we do not perform.

---

**Related:**
- [Epistemic honesty](./epistemic-honesty.md) — `contradicts` edges pair with the in-node `## bias-check` section
- [Navigation and planes](./navigation-and-planes.md) — how typed edges support multi-hop navigation across the MOC hierarchy
- [RAG vs wiki vs brain](./rag-vs-wiki-vs-brain.md) — why the curated, linked graph beats reassembled chunks
- [Architecture (Matrioshka)](./architecture-matrioshka.md) — where the semantic link-proposal sidecar lives (Cortex horizon)
- Back to the [concepts index](./_index.md) · the [README](../../README.md)
