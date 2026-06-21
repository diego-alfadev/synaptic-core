# RAG vs a plain wiki vs an AI Brain

*What this is: the conceptual distinction at the heart of synaptic-core — three different ways to give an agent knowledge, why they are not the same job, and why we chose write-time curation over read-time retrieval.*

Three ways to give an agent knowledge — they are not the same job. RAG over raw documents, a plain wiki, and an AI Brain each make a different bet about *where the reasoning work happens* and *what the agent actually reads*.

## The comparison

| | **RAG over raw** | **A plain wiki** | **An AI Brain (synaptic-core)** |
|---|---|---|---|
| **State** | Stateless — re-derives an answer on every query | Inert — sits there until a human edits it | **Improves itself as you work**, within bounded, reversible limits |
| **Reasoning cost** | Paid on every read (chunk → embed → retrieve → reason) | Paid by the human who maintains it | Paid once at write-time; reads stay cheap and near-deterministic |
| **What the agent reads** | Reassembled chunks | Whatever pages a human wrote | A curated, linked graph an agent navigates in ~3–4 hops |
| **Over time** | No accretion — same corpus, re-queried | Drifts and goes stale | **Compounds** — every session adds to the graph |

The Karpathy framing: keep **only the key, distilled information in the window**. An AI Brain is the discipline that produces exactly that — and then keeps producing it as the work continues. It is neither a query engine bolted onto a document dump (RAG) nor a static knowledge base (a wiki): it is a knowledge base that grows correctly *as you work*, with every automated edit diff-traced, git-reversible, and archive-before-delete.

## Write-time curation vs read-time RAG — and why we curate

There are two schools of AI knowledge management, split by where the reasoning work happens:

- **Write-time curation (schema-on-write):** raw information is consolidated into curated, linked pages once, on the way in. Retrieval is then cheap and near-deterministic — read the right page, get a coherent answer. Auditable, portable, stable across agents and sessions. The consolidation formula is the cost; you pay it once per insight, not once per query.
- **Read-time RAG over raw (schema-on-read):** store raw artifacts verbatim, chunk and embed them, then retrieve and reason on every query. Fast to start, loses no raw detail — but reasoning cost is paid on every read, answers are re-derived rather than stable, and the result is not human-navigable or portable.

We chose write-time curation because **agents re-read the same context constantly: curate once, read cheap forever.** Curated knowledge is also:

- **Auditable** — a teammate or any new agent gets the same coherent page, not a fresh re-derivation that may differ from the last one.
- **Portable** — pure Markdown, no runtime dependency. The page reads the same on a locked-down laptop as on a cloud host.
- **Stable** — the answer does not drift with the retriever's mood, the chunk boundaries, or the embedding model version.

## A pragmatic hybrid, not a purist position

We are in practice a **pragmatic hybrid**: the wiki is schema-on-write, and verbatim payloads are kept in `references/raw/` as a schema-on-read fallback for the rare fine-detail query. Best of both: coherent reads by default, raw available when needed.

This is the honest framing of where synaptic-core sits. It does not reject retrieval; it puts the reasoning work at write-time so the common case (an agent re-reading known context) is cheap and deterministic, and keeps the raw payloads around for the uncommon case (a one-off, fine-grained query) where re-derivation is actually justified.

---

**Related:**
- [Navigation and planes](./navigation-and-planes.md) — *how* the curated graph is read in ~3–4 bounded hops
- [Capture and consolidation](./capture-and-consolidation.md) — the write-time discipline that produces the curated pages
- [Typed edges](./typed-edges.md) — what makes the curated graph relational rather than a link soup
- [Epistemic honesty](./epistemic-honesty.md) — why a curated, auditable read beats a re-derived one for governed work
- [Matrioshka architecture](./architecture-matrioshka.md) — where the optional semantic/RAG sidecar lives (Cortex, the *direction*)
- Back to the [concepts index](./_index.md) · the [README](../../README.md)
