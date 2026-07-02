# `status` vs `lifecycle` — two orthogonal, optional axes

*What this is: a plain explainer of the two optional frontmatter axes a knowledge node MAY carry — `status` (is the content still true?) and `lifecycle` (what role does this play in my work now?). They are independent, both optional, both have absent-defaults, and neither bumps the schema. Lead with `status`; `lifecycle` is the advanced payoff.*

A node can carry two small frontmatter fields that answer two different questions. Users mix them up, so keep the questions separate:

- **`status`** — *"is this still true / current?"* — the **trust and freshness of the content**.
- **`lifecycle`** — *"what part does this play in my work now? is it live?"* — the node's **role and actionability**.

Both are **optional**. A brain with neither field keeps working exactly as before, a skill-less agent ignores unknown keys, and there is **no schema bump** — adding or omitting either is fully backward-compatible.

## `status` — content trust and freshness (lead with this)

```
status: active | stale | archived
```

- **`active`** — the content is current and trusted.
- **`stale`** — the content is out of date or suspect; still readable, flagged for review, not deleted.
- **`archived`** — retired content, kept for the record.

**Absent → `untriaged`.** An absent `status` is *neither* trusted-current *nor* stale — it is **untriaged**. Audits surface it as "untriaged"; it is **never silently promoted to `active`**. (This is deliberately different from `lifecycle`'s benign default below — freshness should not be assumed.)

This is the axis basic users should reach for first: it says whether a node can be trusted, nothing more.

## `lifecycle` — role and actionability (advanced)

```
lifecycle: project | area | resource | dormant
```

This is the PARA actionability axis (shipped in v1.3.0). Its payoff appears once a brain grows: it **scopes the default working set** an agent loads.

- **`project`** — live, active work with an end (an open thread).
- **`area`** — standing responsibility / ongoing knowledge (deployment conventions, a subsystem you own).
- **`resource`** — reference material, pulled on demand.
- **`dormant`** — parked; no longer active work.

**Absent → treated as `area`** — a benign role default (standing knowledge, loaded by default). Present `lifecycle` as the advanced option: most users can ignore it until the default load gets noisy, then use it to keep the active set small.

## The two axes combine — worked examples

A node carries both fields independently; they move on their own timelines:

- A **"Q3 migration"** node starts `lifecycle: project` + `status: active` (live work, current). When it ships, it becomes `lifecycle: dormant` (no longer active work) while its content may stay `status: active` (the decisions still hold). If those decisions later go out of date, it flips to `status: stale` — still `dormant`.
- A **"deployment conventions"** node is `lifecycle: area` + `status: active` — standing knowledge, current, loaded by default.

## Which axis governs what (the part people get wrong)

**Only `lifecycle` scopes the default load; `status` NEVER causes omission.**

- The **default working set** an agent loads is scoped by `lifecycle`: once a brain grows, a `dormant` node drops out of the *default* load (you can still pull it on demand). `resource` is lazy-pulled too.
- **`status` never removes a node** from a handover or a retrieval. A **stale-but-relevant** node is **flagged (`⚠ stale`), not hidden** — you still see it, with a warning.
- **`lifecycle: dormant` scoping applies to the DEFAULT WORKING SET only.** `/synaptic-handover` and `/synaptic-audit` are export/audit-class and read **ALL statuses and ALL lifecycles**. A `lifecycle: dormant` + `status: active` decision node that is still binding **MUST appear** in the handover brief — hiding it would defeat the whole knowledge-tax / handover thesis. `dormant + active` is never hidden from handover or audit.

**Typo guard.** `/synaptic-audit` emits an **advisory** (a cheap grep) listing any `status:` or `lifecycle:` value **not** in the allowed lowercase token set, so a hand-edit typo (`Active`, `dorment`, `Archived`) **surfaces** instead of failing open — a mistyped value would otherwise be read as absent and silently defaulted. Advisory only, never gating.

## Combined-value behavior (including the contradictory corners)

The harmonious pairs are obvious; the corners below are where tooling behavior must be explicit:

| `lifecycle` | `status` | In default working set? | In handover / audit? | Behavior |
|---|---|---|---|---|
| `project` | `active` | **Yes** | Yes | Live work; loaded by default; listed as an open thread. |
| `area` | `active` | Yes | Yes | Standing knowledge; loaded by default. |
| **`dormant`** | **`active`** | **No** (out of default set) | **Yes — MUST appear** | Binding-but-parked (e.g. a shipped decision still in force). Excluded from the *default* load, surfaced in **every** handover/audit — never hidden (the critical corner). |
| **`dormant`** | **`stale`** | No | Yes, flagged `⚠ stale` | Parked *and* content out of date; still readable, flagged for review, not deleted. |
| **`archived`** | **`active`** | No | Yes, flagged (contradiction) | Contradictory pair — content marked current yet archived. The audit **flags the contradiction** (advisory); tooling does not silently resolve it. |
| **`resource`** | **`archived`** | No | Yes, as retired reference | Reference material retired; retained/linkable, excluded from default load; not an open thread. |

## Why this stays simple

Both axes are already-optional frontmatter with absent-defaults, so this is **explanation, not a format change** — **no schema bump**. Lead with `status` (basic: is it true?); reach for `lifecycle` later (advanced: scope my active set). An existing brain with neither field is unaffected.

---

**Related:**
- [Capture is a dial — and the consolidation formula](./capture-and-consolidation.md) — where the PARA `lifecycle` axis shipped and how capture uses it
- [Epistemic honesty](./epistemic-honesty.md) — `status`/freshness sits alongside `source`/`confidence` as trust metadata
- [Simplicity guardrail](./simplicity-guardrail.md) — why both axes stay optional and schema-neutral
- Back to the [concepts index](./_index.md) · the [README](../../README.md)
