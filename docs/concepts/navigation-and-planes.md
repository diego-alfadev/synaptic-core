# Navigation and the two-plane model

*What this is: how an agent boots and navigates a Synaptic brain in bounded hops, and the clean separation between the two planes a brain contains — wiki (what you know) and harness (how you work here) — with persona deliberately left out of both.*

## How it works — one boot file, bounded navigation

One boot file (`BRAIN.md`, ≤110 lines, ~500 tokens) is the only mandatory read. It carries the context capsule, the capture contract, a 1-line pointer to the deployed harness rules, the brain map, and the session-start pointer. Everything else loads on demand.

Navigation is bounded at ~3–4 hops regardless of brain size — you never read 10 files to get one insight:

```
BRAIN.md (boot)
  → knowledge/INDEX.md        (hub MOC: 1-line per cluster)
    → {cluster}/_index.md     (sub-MOC: 1-line per node)
      → open only the 1–2 relevant nodes
```

The mechanism that makes this work is the **1-line summary in each `_index.md`**. An agent reads the *summary* to decide whether to open the full node — it does not open the node to find out what is in it. This is what keeps navigation bounded as the brain grows: the cost of *deciding where to look* stays roughly constant, because the agent is always reading a short list of one-liners, never a pile of full pages. A node that is not reachable from a MOC effectively does not exist (and `check` flags it as an orphan).

This is MOC-of-MOCs navigation — Maps of Content pointing at Maps of Content — and it is the same pattern this very `docs/concepts/` folder dogfoods through its [`_index.md`](./_index.md).

## The two planes (and the one explicit out-of-scope)

A `.synaptic/` brain has exactly **two planes** and one explicit out-of-scope:

| Plane | Holds | Test | Load |
|---|---|---|---|
| **Wiki** (`knowledge/`, `registries/`, `references/`) | What you **know**: patterns, decisions, playbooks, lessons, lookup tables, external references | "Does the agent *reason over* it?" | On demand via MOC |
| **Harness** (`harness/`) | How you **work here**: conventions, guardrails, project-local skills (e.g. a task-system CLI) | "Does the agent *obey or execute* it?" | Compressed subset in `BRAIN.md`; full depth on demand |
| **OUT — user harness** | Persona, tone, chat-language preference, agent personality | "Is it about how the agent treats *you*?" | Not in the brain at all |

The simple test that sorts any piece of content: **do you reason over it, or do you obey it?** If you reason over it (a decision, a pattern, a lookup table), it is wiki. If you obey or execute it (a commit convention, a guardrail, a project skill), it is harness. If it is about how the agent treats *you* (tone, personality, what language to chat in), it is neither — it belongs in your outer agent harness.

## Three concerns, never mixed

- **Knowledge** lives in the brain (`knowledge/`, `registries/`, `references/`) and is read on demand via MOC.
- **Operating rules** (commit conventions, guardrails, project skills) live in `harness/` as a **deployable source**: `/synaptic-init` and `/synaptic-upgrade` deploy them into the outer harness (`AGENTS.md` / `CLAUDE.md`); at work-time the agent reads the outer harness, not the brain's `harness/` folder. The brain keeps the copy so the harness is regenerable on any machine.
- **Persona** (tone, chat language, agent personality) lives in the outer harness only — never in the brain.

The brain stays knowledge-focused; the harness stays rule-focused; portability is preserved. A persona-rich agent and a vanilla agent share the same brain without conflict.

## Persona-out — why it matters

The single out-of-scope is deliberate and load-bearing. Persona is the one thing that should *not* travel with the knowledge. The brain is the asset that survives a handover, a contractor rotation, the end of a project — it is meant to be picked up by *any* agent, configured however the next person likes. If persona lived inside the brain, every handover would drag one person's preferred tone and personality into the next person's setup. By keeping persona in the outer harness, the knowledge travels clean.

**Your Jarvis stays Jarvis. The brain travels.**

---

**Related:**
- [Capture and consolidation](./capture-and-consolidation.md) — how nodes get placed in a cluster and registered in its `_index.md`
- [Typed edges](./typed-edges.md) — the relationships that connect nodes across the MOC hierarchy
- [Epistemic honesty](./epistemic-honesty.md) — why behaviour/persona is kept out of the brain even at the metadata level
- [Architecture (Matrioshka)](./architecture-matrioshka.md) — how the harness plane is deployed by `/synaptic-init` (CORE)
- [RAG vs wiki vs brain](./rag-vs-wiki-vs-brain.md) — why bounded navigation beats read-time reassembly
- Back to the [concepts index](./_index.md) · the [README](../../README.md)
