# Epistemic honesty — the governance argument

*What this is: the optional, additive metadata that makes a brain's knowledge traceable and falsifiable — source, confidence, and an in-node bias-check — and why it makes a brain not just navigable but defensible for regulated and audit-sensitive work.*

For regulated and audit-sensitive work, "the agent said so" is not good enough. A claim that cannot be traced to an origin, sized for confidence, or checked against contradicting evidence is a liability, not knowledge. Every node in a Synaptic brain can carry optional, additive epistemic metadata that makes its knowledge **traceable and falsifiable**.

## The three epistemic affordances

- **`source:`** — where the claim came from (a runbook section, a URL, a ticket reference, a dated session). **Provenance is the governance argument for regulated and audit-sensitive work:** every fact is traceable to its origin. A reviewer never has to take a claim on faith; they can follow it back to where it entered the brain.

- **`confidence:`** — how settled the knowledge is, on a three-value enum (`high | medium | low`). This is deliberately coarse. A finer scale would invite false precision (is this 0.7 or 0.75 confident?); three values force an honest, defensible judgment — settled, working assumption, or tentative.

- **`## bias-check`** — an in-node section for what is *not* yet known, contradicting evidence, and the conditions under which the knowledge stops holding (paired with a `contradicts` edge when another node disagrees). Crucially, it scopes the **knowledge**, never the agent's tone or persona — behaviour lives in the harness, not the brain. The bias-check answers "when would this be wrong?" and "what am I not seeing?" — it is the falsifiability surface of the node.

## Why this makes a brain defensible

The result is a brain that is not just navigable but **defensible**: a compliance reviewer can read any claim, see where it came from, how confident it is, and what contradicts it — in plain Markdown, with no tool.

This is the difference between a knowledge base that *holds* answers and one that can *stand up to scrutiny*. In a governed environment, the question is rarely "does the system know this?" — it is "can we show *why* the system believes this, and *when* it might be wrong?" Provenance answers the first; the confidence enum and bias-check answer the second. Together they turn the brain from an opaque oracle into an auditable record.

And because all three affordances are **optional and additive**, they cost nothing where they are not needed. A personal brain can ignore them entirely; a brain supporting regulated work can lean on them heavily. The format is the same either way — nothing forks when the governance requirement appears.

## The clean separation

Note the boundary one more time, because it is load-bearing: the bias-check (and all epistemic metadata) scopes **knowledge**, not the agent. "This claim is low-confidence and contradicted by X" is a fact about the knowledge. "Be cautious and hedge your tone" is a behavioural instruction — and that belongs in the harness, never in the brain. Keeping the two apart is what lets the brain travel between a cautious agent and a confident one without either of them inheriting the wrong instructions.

---

**Related:**
- [Typed edges](./typed-edges.md) — the `contradicts` edge that pairs with a node's `## bias-check`
- [Navigation and planes](./navigation-and-planes.md) — why persona/behaviour lives in the harness plane, not the brain
- [RAG vs wiki vs brain](./rag-vs-wiki-vs-brain.md) — why a curated, auditable read beats a re-derived RAG answer for governed work
- [Capture and consolidation](./capture-and-consolidation.md) — the quality gate where source/confidence get stamped
- Back to the [concepts index](./_index.md) · the [README](../../README.md)
