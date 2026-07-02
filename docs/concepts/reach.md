# Reach — how far a brain sees, set by harness placement

*What this is: the model for how far a Synaptic brain reaches — one folder, a whole dev tree, or every folder you open. The short answer: reach is decided by **where you wire the harness bridge**, not by where the brain folder physically sits. There is no separate "global mode"; there is one reach axis, and "global" is just its far end.*

Real people do not have one giant workspace — they work across several project folders. A common early confusion is *"do I install a brain in each folder?"* The answer is no: you place the brain once and choose its **reach** by where you wire the bridge. This doc explains that one model.

## Reach = harness placement, not folder location

Every Synaptic brain activates through a small **bridge** — a `BEGIN:SYNAPTIC` block in the harness (your agent's operating-rules file: `AGENTS.md`, `CLAUDE.md`, or the host's equivalent) that points an agent at the brain's location. What decides how far the brain reaches is **which harness the bridge lives in**:

- Wire the bridge in a **project-level** `AGENTS.md` → the brain activates **only in that folder**.
- Wire the bridge in a **user-level / global** `AGENTS.md` → the brain activates in **any** agent session, following you everywhere.

The **brain folder location is orthogonal**. The `.synaptic/` folder can sit anywhere the host can read — a dev root, your home directory, even the Desktop — because activation follows the *bridge*, and the bridge points at the brain's absolute path. Where the folder lives is trivial for activation; only *where the bridge is wired* changes reach.

## Three reference points on one axis

These are not three products or three modes. They are the same brain with its bridge placed at different levels — three points on a single **reach axis**:

| Reference point | Bridge wired in… | Reach |
|---|---|---|
| **Folder brain** | the *project-level* `AGENTS.md` (or host equivalent) | activates only in that folder |
| **Workspace / broad brain** | an `AGENTS.md` rooted at a broad dev root | activates across that subtree |
| **User-global brain** | the *user-level / global* `AGENTS.md` | activates in **any** session, follows you everywhere |

"Going global" is simply moving the bridge up to user level — **with no need to move the brain folder.** The far end of the axis (a truly-global brain that serves all your folders) is nothing more special than *the bridge wired at user level.*

## One reach at a time (v1.4.0)

v1.4.0 ships **one reach at a time**: whichever point on the axis you pick, exactly **one** brain is active over a given workspace. Choosing a reach point is *not* running two brains — it is one brain reachable from more folders. Two active bridges over the same location remains undefined and unsupported.

This is the same **one-brain-per-workspace** contract Synaptic has always held, just stated on the reach axis: reach means one brain reaching *farther*, never two brains overlapping. Multi-brain **coexistence** — deliberately running, say, a separate per-client brain alongside a global one — is a *convenience* deferred to a later release (v2.0 / Cortex). It is not a confidentiality requirement (see below), and until it ships you keep one brain per workspace.

## The confidentiality control — the leak rule

Wiring a brain at user level means it activates on **all** your work, including other clients' repos. **That is not a leak — it is your own memory.** A private global brain that knows all of your clients is fine. There is no per-folder allowlist to configure and no capture-scope guard to add.

The **one** control is the **leak rule**:

> A **global / private brain** — one holding cross-context or multi-client knowledge — must **never** be committed, shared, or synced into a **foreign** repo, and its bridge pointer + rules must never be written into one either.

"Foreign" means any repo that is not the brain's own dedicated repo. And "synced" matters as much as "committed": a location can leak by being uploaded to a cloud sync share (OneDrive / DFS) even if it is never committed to git. So keep a private/global brain out of any foreign **committed or synced** location — and because a user-level bridge lives at user level, not inside any repo, that condition holds by construction.

The exception, so the rule is not over-read: a **project-scoped brain that holds ONLY that one project's shareable knowledge MAY legitimately live in and ship with its own repo** (a repo whose own brain lives alongside it). That is not a leak. The rule is about *what* is committed/synced *where* — a private brain in a foreign repo — not a blanket "no brain in any repo."

## A note on VS Code Copilot (`*.instructions.md`)

VS Code Copilot splits what other hosts keep in one `AGENTS.md` into `*.instructions.md` (and `*.chatmode.md`) files. Its `applyTo:` globs only scope *which files within a workspace* a fragment attaches to — they do **not** grant reach. Reach still comes from **placement level**: a user-level `*.instructions.md` fragment *is* "the bridge at user level"; a workspace fragment gives project reach. Treat Copilot's `*.instructions.md` as the same bridge content other hosts hold in `AGENTS.md`, fragmented per Copilot's convention. `AGENTS.md` is the emerging cross-tool standard for this content; other hosts' files are host-specific carriers of the same thing.

---

**Related:**
- [Local-vs-remote data boundary](./local-vs-remote-boundary.md) — where the data goes; the leak rule here is the placement side of that governance line
- [Navigation and the two-plane model](./navigation-and-planes.md) — the wiki/harness planes; the bridge lives in the harness plane
- [Simplicity guardrail](./simplicity-guardrail.md) — why "reach" adds no new mode or schema, only placement
- Back to the [concepts index](./_index.md) · the [README](../../README.md)
