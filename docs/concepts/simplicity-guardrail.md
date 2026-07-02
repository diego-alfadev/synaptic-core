# Simplicity guardrail — the standing rule that protects the moat

*What this is: a standing design-time rule that keeps "it's just files, zero runtime, any agent" true as the product grows. Every new surface must pass a one-line, three-point check before it ships in CORE. If it cannot, it is redesigned to be optional or pushed to the Cortex/Ecosystem tier.*

"It's just files, zero runtime, any agent" is both the **moat** and the **pitch**. But the surface keeps growing — a `lifecycle:` enum, `lint: allow-large`, `brain-graph.js`, an interactive `graph.html`, god-node audits, and later a core-lib, a CLI, an MCP, and optional retrieval adapters. Complexity creep is the classic way a simplicity moat dies: **without anyone ever deciding to kill it.** This rule is how we decide, every time, on purpose.

It is modeled on the **deletion-ledger** standing rule in `references/maintain.md` (*"standing rule — not migration-only … applies to every sweep"*): a cheap, always-applied check, recorded in one line.

## The rule

> **Simplicity Guardrail (standing rule).** Every new surface — a frontmatter field, a lint flag, a tool, a lib, an adapter, a viz, a command — MUST satisfy all three before it ships in CORE:
>
> 1. **Optional** — the brain works fully with this surface absent. A v1 brain with none of it still boots, captures, and retrieves.
> 2. **Files-only path intact** — the core job it touches is still achievable by an agent using **grep + reading the MOC**, with no runtime.
> 3. **No schema bump** — it does not force `schema_version` past `1.0`. If it would, it is deferred.
>
> If a surface cannot pass all three, it does **not** ship in CORE — it is either redesigned to be optional or pushed to the Cortex / Ecosystem tier.

## The one-line check

Before any new field, tool, or command lands, record the check in the change's design note (spec / ADR / PR) as a single line — the same one-line discipline the deletion ledger uses:

> *surface · files-first + optional? · files-only path intact? · schema unchanged?*

The lead question is **"files-first + optional?"** — if the answer is not a clean yes on all three, stop and redesign before writing code.

## Worked application

- **The QMD retrieval adapter (a Cortex-tier accelerator).** Check → *optional? YES (grep/MOC is the default fallback); files-only path intact? YES (retrieve works with zero models); schema bump? NO.* → Passes, so it may ship — but **only as an opt-in adapter, never in CORE.**
- **A hypothetical *"require the SQLite index to answer any query."*** Check → *files-only path intact? **NO** — retrieval now depends on a runtime index.* → **Fails point 2**, so it is **redesigned or rejected.**

## Where it applies

- **This doc is the home of the principle** — a concept doc sibling to [local-vs-remote-boundary](./local-vs-remote-boundary.md) and [verb-contract](./verb-contract.md), discoverable via the concepts index.
- **Applied at design time** — every spec and ADR runs the three-point check, the same place the deletion-ledger standing rule (`references/maintain.md`) and the ADR conventions (`docs/architecture/`) already live. It is a design-time checklist item, not a runtime gate.

This item *is* a CORE-safety mechanism: it is docs only, zero-runtime, and its whole job is to keep the files-are-truth / zero-runtime / any-agent invariants enforced as the product grows.

---

**Related:**
- [Local-vs-remote data boundary](./local-vs-remote-boundary.md) — the files-are-truth posture this rule defends
- [Matrioshka architecture — CORE, Cortex, Ecosystem](./architecture-matrioshka.md) — the tiers a failing surface gets pushed to
- [Verb contract](./verb-contract.md) — a worked example of holding the line (why `memify` is not a new CORE verb yet)
- Back to the [concepts index](./_index.md) · the [README](../../README.md)
