# Adopt v1.3.0 — for brains ALREADY on v1 (no migration)

> **TL;DR — there is nothing to migrate.** If your brain is already on v1 (schema `1.0`), moving to
> the v1.3.0 engine is **not** a `/synaptic-upgrade`. The brain **schema is unchanged (still `1.0`)**.
> You **reinstall / update the skill** to engine `1.3.0` and you are done. Everything v1.3.0 adds is
> **additive and reversible** — adopt the new conventions at your own pace, or ignore them entirely
> and your brain keeps working exactly as before.

This doc is for the **feature-adoption** path: you are already running a v1 brain and want the v1.3.0
engine. It is deliberately short. If instead you are still on a **v0.3** (pre-v1) brain, that is a
real schema migration — use **[UPGRADE-v0.3-to-v1.md](UPGRADE-v0.3-to-v1.md)** (narrative) and
**[UPGRADE-v0.3-to-v1.AGENT.md](UPGRADE-v0.3-to-v1.AGENT.md)** (the runbook), which now land you on
v1.3.0 directly.

---

## Why no migration

Synaptic decouples two version numbers (v1-final §5.4):

- **Brain schema/format version** — stamped in `BRAIN.md` frontmatter. v1.3.0 does **not** change it;
  it is still `1.0`.
- **Skill engine semver** — `version:` in `SKILL.md`. This is what moves to `1.3.0`, with
  `supported_schema: ">=1.0 <2.0"`.

A skill-code update = **reinstall the skill, NO brain migration.** Only a schema/format change runs
`/synaptic-upgrade`. v1.3.0 ships **zero** schema changes — every new field is optional, every new
behavior lives in the engine/tools, not in your nodes. The compat-check confirms this at load: a v1
brain (schema `1.0`) is in range for the `1.3.0` engine, so you get **no warning** — it just boots.

---

## The one required step: update the skill to engine 1.3.0

Update the skill wherever your host discovers it — `.claude/skills/synaptic/` and/or
`.agents/skills/synaptic/`. Pick whichever install path you already use:

- **Agent self-install (no Node needed):** point your agent at the skill's bootstrap. It fetches the
  bundle deterministically via `MANIFEST.txt` from GitHub raw and writes it into the skill paths.
  The install tracks `main`:
  `RAW_BASE = https://raw.githubusercontent.com/diego-alfadev/synaptic-core/main/standalone/synaptic/`
  (append a release tag instead of `main` — `.../synaptic-core/<tag>/standalone/synaptic/` — once one
  is published, to pin an exact release). Overwrite the existing skill dir with the fetched files.
- **`degit` (needs Node):**
  `npx degit diego-alfadev/synaptic-core/standalone/synaptic .claude/skills/synaptic`
  (use `.agents/skills/synaptic` for non-Claude hosts; `degit` pulls the latest from `main` — append
  `#<tag>` to pin an exact release once one is published).
- **Manual folder copy:** copy `standalone/synaptic/` over your installed skill dir.

Verify: `SKILL.md` now reads `version: 1.3.0`. That is the whole required upgrade. Your `BRAIN.md`,
your nodes, your harness wiring, your links — **all untouched.**

> The `tools/*.js` accelerators (`check.js`, `graph.js`) are **not** in the skill manifest and need
> **Node ≥ 18**. Re-fetch them separately if you use them
> (`https://raw.githubusercontent.com/diego-alfadev/synaptic-core/main/tools/<name>.js`). They are
> optional — the skill works without them.

---

## What you get — three additive, reversible features

### 1. Optional PARA lifecycle axis (opt-in, ignore-safe)

Knowledge nodes MAY now carry one optional frontmatter field:

```yaml
lifecycle: project | area | resource | dormant
```

It is an **actionability** axis, **orthogonal** to the editorial `status: active | stale | archived`
field (the enums deliberately share no token — `dormant` ≠ `archived` — so the two fields never bleed
into each other).

- `project` — a live, time-boxed effort (a disposable *hot node* that links OUT to durable nodes).
- `area` — an ongoing responsibility / durable domain node. **The default.**
- `resource` — reference material relevant *someday*, not in the current working set.
- `dormant` — cooled off: kept for the record, not loaded by default. **Reversible.**

**Backward-compatible by construction.** A node **without** `lifecycle:` is treated as **`area`** —
it default-loads, exactly as every pre-v1.3.0 node did. Absence is legal, never an error; a
skill-less or older-skill agent simply ignores the unknown key. So you can:

- **Adopt it gradually** — start tagging `lifecycle:` on new or touched nodes; leave the rest absent.
- **Ignore it entirely** — do nothing and every node behaves as `area`, exactly as today.

Active-set scoping (the convention the agent follows — no index, no runtime): **default working set =
`project` + `area` + (absent → area)**; **`resource` + `dormant` are lazy-pull** (loaded only when a
query / MOC path points at them). MOC visibility is unaffected — a node's lifecycle never removes it
from its cluster `_index.md`; cooling is a load-priority signal, not de-registration.

**Archive-don't-delete demotion (reversible).** To cool a node, flip `lifecycle: dormant` — keep the
file, keep its `_index.md` entry, keep its `[[wikilinks]]` and typed edges intact. This is
**decoupled from `status`**: do NOT also set `status: archived` (a node can be `status: active` +
`lifecycle: dormant`). Promotion is a single-field flip back. Fully reversible.

`check.js` adds only an advisory **WARN** if a present `lifecycle:` value is out of enum — never an
ERROR, never a gate.

### 2. Interactive `graph.html` — for free

`tools/graph.js` now emits a **single self-contained, zero-network HTML file** (default
`synaptic-graph.html`): inline CSS + a deterministic force-directed simulation, **no CDN, no fetch**.
It is typed-edge aware (colours/dashes per edge kind) with cluster / edge-type / **lifecycle** filters,
search, pan/zoom, and expand/collapse hubs. It shares the exact same graph universe as `check.js`
(edge parity guaranteed). Just run `node tools/graph.js <brain>` and open the file — nothing to
configure, nothing added to your brain.

### 3. God-node / surprising-edge audit — for free

`/synaptic-audit` gains two diagnose-only, WARN-class graph-health passes (no runtime required):

- **God-node** — flags an over-connected hub (edge degree ≥ 15, or ≥ 3× the brain's median node
  degree, whichever is lower) as a candidate to split into atomic sub-nodes, or to confirm as a
  legitimate hub.
- **Surprising-edge** — lists authored edges whose endpoints live in **different** top-level
  `knowledge/` clusters (the high-value multi-hop links embeddings can't infer) for you to confirm or
  correct.

Both route to `/synaptic-weave`, make **no** auto-discovery claim (edges are authored, never
inferred), and are advisory only. `check.js` also surfaces them as WARN-class counts when the brain
is otherwise clean — never an ERROR.

---

## Reversibility

Everything above is reversible:

- The skill update is just files on disk — reinstall the previous release to roll back the engine.
- No node was rewritten, so there is nothing in the brain to revert.
- Any `lifecycle:` tags you added are optional metadata; delete the field and the node reverts to
  `area` behavior.

There is no cutover, no freeze, no backup gate — because nothing in the brain changed. If you want
the belt-and-braces habit, commit before updating the skill so the engine swap is a one-line revert.

---

See also: **[UPGRADE-v0.3-to-v1.md](UPGRADE-v0.3-to-v1.md)** (the pre-v1 schema migration, which now
also lands on v1.3.0) · the [CHANGELOG](../CHANGELOG.md) `[1.3.0]` entry for the full feature detail.
