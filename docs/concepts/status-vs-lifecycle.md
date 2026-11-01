# `status` vs `lifecycle` — two orthogonal axes

*What this is: a plain explainer of the two frontmatter axes a knowledge node carries — `status` (is the content still true?) and `lifecycle` (what role does this play in my work now?). They are independent. `status` is **REQUIRED** on knowledge/registries nodes (as it always has been); `lifecycle` is the **OPTIONAL** advanced axis. Neither bumps the schema. Lead with `status`; `lifecycle` is the advanced payoff.*

A node can carry two small frontmatter fields that answer two different questions. Users mix them up, so keep the questions separate:

- **`status`** — *"is this still true / current?"* — the **trust and freshness of the content**. **REQUIRED** on `knowledge/**` and `registries/` nodes.
- **`lifecycle`** — *"what part does this play in my work now? is it live?"* — the node's **role and actionability**. **OPTIONAL** — the advanced axis.

`lifecycle` is **optional** (absent → `area`); `status` is **required** and unchanged from earlier versions. A skill-less agent ignores the unknown `lifecycle` key, and there is **no schema bump** — this doc adds the optional `lifecycle` axis and leaves `status` exactly as it was, so it is fully backward-compatible.

## `status` — content trust and freshness (lead with this)

```
status: active | stale | archived
```

- **`active`** — the content is current and trusted.
- **`stale`** — the content is out of date or suspect; still readable, flagged for review, not deleted.
- **`archived`** — retired content, kept for the record.

**`status` is REQUIRED — an unknown value reads as `untriaged`.** Every knowledge/registries node MUST carry a `status:` (a missing `status:` is a `check.js` **ERROR**, not a benign default). "untriaged" is the **read-semantics for an UNKNOWN or mistyped value** (`Active`, `stalr`, a trailing-space `active `): such a value is *neither* trusted-current *nor* stale, so it is read as **untriaged** and **never silently promoted to `active`**. The `/synaptic-audit` typo advisory surfaces the off-vocabulary value so a hand-edit slip is caught rather than failing open. (This is deliberately stricter than `lifecycle`'s benign absent-default below — freshness is required, never assumed.)

This is the axis basic users should reach for first: it says whether a node can be trusted, nothing more.

## `lifecycle` — role and actionability (advanced)

```
lifecycle: project | area | resource | dormant
```

This is the PARA actionability axis (shipped in v1.3.0). It is a **label**: it tells a reader (audit, handover, you) what kind of attention a node needs. It is **not a load filter**: an agent reaches nodes through the MOCs, and a node's lifecycle never decides whether it is read. *(Before v1.6 this page described a "default working set" scoped by `lifecycle`; nothing ever consumed it, so it was dropped — decision X11.)*

- **`project`** — live, active work with an end (an open thread).
- **`area`** — standing responsibility / ongoing knowledge (deployment conventions, a subsystem you own).
- **`resource`** — reference material, relevant someday.
- **`dormant`** — parked; no longer active work.

**Absent → treated as `area`** — a benign role default (standing knowledge). Most users can ignore the field until the brain grows enough that an audit or a handover benefits from knowing which nodes are live.

## The two axes combine — worked examples

A node carries both fields independently; they move on their own timelines:

- A **"Q3 migration"** node starts `lifecycle: project` + `status: active` (live work, current). When it ships, it becomes `lifecycle: dormant` (no longer active work) while its content may stay `status: active` (the decisions still hold). If those decisions later go out of date, it flips to `status: stale` — still `dormant`.
- A **"deployment conventions"** node is `lifecycle: area` + `status: active` — standing knowledge, current.

## Which axis governs what (the part people get wrong)

**Neither field hides a node.** `lifecycle` groups and labels; `status` flags.

- **`status` never removes a node** from a handover or a retrieval. A **stale-but-relevant** node is **flagged (`⚠ stale`), not hidden** — you still see it, with a warning.
- **`lifecycle` never removes a node either.** `/synaptic-handover` and `/synaptic-audit` read **ALL statuses and ALL lifecycles**. A `lifecycle: dormant` + `status: active` decision node that is still binding **MUST appear** in the handover brief — hiding it would defeat the whole knowledge-tax / handover thesis.

**Typo guard.** `/synaptic-audit` emits an **advisory** (a cheap grep) listing any `status:` or `lifecycle:` value **not** in the allowed lowercase token set, so a hand-edit typo (`Active`, `dorment`, `Archived`) **surfaces** instead of failing open — a mistyped `status` value is present (so it passes the required-field check) but is an **unknown token**, read as `untriaged` and never silently promoted to `active`; a mistyped `lifecycle` value is read as its `area` default. Advisory only, never gating.

## Combined-value behavior (including the contradictory corners)

The harmonious pairs are obvious; the corners below are where tooling behavior must be explicit:

| `lifecycle` | `status` | In handover / audit? | Behavior |
|---|---|---|---|
| `project` | `active` | Yes | Live work; listed as an open thread. |
| `area` | `active` | Yes | Standing knowledge. |
| **`dormant`** | **`active`** | **Yes — MUST appear** | Binding-but-parked (e.g. a shipped decision still in force). Surfaced in **every** handover/audit — never hidden (the critical corner). |
| **`dormant`** | **`stale`** | Yes, flagged `⚠ stale` | Parked *and* content out of date; still readable, flagged for review, not deleted. |
| **`dormant`** | **`archived`** | Yes, as history only | Retired: the work is parked and the content superseded. Kept and linkable; never presented as a current decision. |
| **`resource`** | **`archived`** | Yes, as retired reference | Reference material retired; retained/linkable; not an open thread. |

## Why this stays simple

`status` is unchanged (still required); `lifecycle` is already-optional frontmatter with a benign absent-default, so this is **explanation, not a format change** — **no schema bump** (justified by `lifecycle` being optional-additive and `status` staying exactly as it was). Lead with `status` (basic: is it true?); reach for `lifecycle` later (advanced: label what is live). An existing brain that never adopts `lifecycle` is unaffected — it already carries `status`.

---

**Related:**
- [Capture is a dial — and the consolidation formula](./capture-and-consolidation.md) — where the PARA `lifecycle` axis shipped and how capture uses it
- [Epistemic honesty](./epistemic-honesty.md) — `status`/freshness sits alongside `source`/`confidence` as trust metadata
- [Simplicity guardrail](./simplicity-guardrail.md) — why both axes stay optional and schema-neutral
- Back to the [concepts index](./_index.md) · the [README](../../README.md)
