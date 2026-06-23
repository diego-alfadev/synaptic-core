# Upgrade your brain: v0.3 → v1 (the narrative)

> **You won't lose anything.** This upgrade is **non-destructive**: it works on a **copy**, your
> original brain stays untouched, and you only switch over once you've verified the result. Worst
> case, you keep your old brain. Tokens are not a concern — let the agent be thorough.

This is the human-readable explanation of *what happens and why*. When you're ready to actually run
it, hand your agent the operational runbook — **[UPGRADE-v0.3-to-v1.AGENT.md](UPGRADE-v0.3-to-v1.AGENT.md)** —
which drives the whole thing step by step. This page is the map; that file is the route.

It is a **supervised** migration: the agent does the heavy lifting, but it asks before any structural
change and you eyeball a before/after report before switching over. For a small single-project brain
it's quick. For a **large or team-shared** brain, plan for a proper session — it's a careful refactor,
not a one-click job.

---

## Before you start

- **Node is optional.** It only accelerates the mechanical steps and the health check; without it the
  agent does the equivalent by hand. The runbook tags every step `[needs Node]` or `[no Node]`.
- **You don't need the repo cloned.** The runbook's first step has the agent self-install the v1
  `synaptic` skill from GitHub (it fetches public skill code only — your brain never leaves the
  machine). If your network blocks that, bring the skill bundle in by hand.
- **Use your normal agent** (Claude Code / VS Code Copilot / Cursor / Codex).
- **Know your brain's shape.** Is it a `.synaptic/` *inside one repo*, or a *shared* `.synaptic/`
  sitting **beside several repos** and serving all of them? That doesn't change the migration — but it
  changes how the harness gets wired (see below).

---

## What the agent does (the shape of it)

1. **Safeguard.** Snapshot the brain in git (it'll `git init` first if the brain isn't tracked yet)
   **and** make a verified folder backup. If your brain lives on OneDrive/a sync share, it moves the
   work somewhere local first so the backup can't be half-synced.
2. **Phase M — mechanical.** Move files into the v1 layout and *stage* (never delete) the old v0.x
   boot files. Deterministic; `migrate.js` does it with Node, or the agent does it by hand.
3. **Phase C — the refactor.** Re-file every page into the new `BRAIN → INDEX → cluster → node`
   structure, convert links to `[[wikilinks]]`, add frontmatter, build the MOCs. This is the bulk of
   the work and it's mostly *re-filing, not rewriting* — your facts are carried through verbatim.
4. **Harness wiring.** Point your agent(s) at the brain and deploy your operating rules. Simple for a
   single-project brain; explicit per-repo for a shared one (see below).
5. **Phase V — verify.** Confirm nothing was lost, no broken links, everything reachable.
6. **(Optional) deep clean.** On request, a full audit + refactor sweep (see "Optional" below).
7. **Report.** A before/after comparison so you can see exactly what changed.

---

## The safety model (how "you won't lose anything" is actually enforced)

- **No silent deletions.** Every merge, split, or removal is shown to you and confirmed, and the
  originals stay in a staging folder until you explicitly close out. Knowledge deletion is human-only.
- **Content-conservation, not a head count.** The naive check "v1 has ≥ as many pages as v0.3" can't
  prove nothing was lost (merging duplicates *lowers* the count; splitting *raises* it). Instead the
  agent snapshots every page up front and accounts for each one afterwards — present, merged, or
  split. Any page neither present nor accounted for is a **stop**.
- **Switch only when green; keep the old.** The backup and a git tag are your rollback the whole time.
- **Shared brain? Freeze first.** If teammates are also writing to the live brain, the agent runs a
  freeze + "delta-reconcile" before swapping, so edits made *during* the migration aren't discarded.
  Don't skip this on a team brain — it's the single biggest data-loss risk otherwise.

---

## Harness wiring: single-project vs shared

A **single-project** brain wires the normal way: a `BEGIN:SYNAPTIC` pointer + your deployed operating
rules go into the project's `AGENTS.md`.

A **global / seat** brain (one `.synaptic/` serving many sibling repos — typically a *private,
per-user* brain) needs explicit wiring, because the default pointer is repo-relative and the skill's
auto-detection, left unpatched, would look for a `.synaptic/` *inside each repo*, not find one, and
offer to create a **new** brain — which would compete with the seat brain. The runbook handles this by
first **detecting** your current wiring, then **preferring a single user-level pointer** that applies
across all repos (for VS Code Copilot, the `applyTo: "**/*"` instructions file — one place, every repo,
and your work repos stay clean of brain references), re-pointed at the brain's fixed path, with the
operating rules deployed (symlink preferred) and the skill patched to stay quiet when a pointer is
already present. Per-repo wiring is only a fallback for hosts that can't do user-level.

---

## Optional: a full audit + refactor sweep

Beyond the strict schema migration, you can ask for a deep clean-up. It's a **diagnose-then-treat**
pass (what `/synaptic-maintain` orchestrates): a health check first, then `/synaptic-audit` to find
issues, then consolidate / reconcile / `/synaptic-synthesize` / `/synaptic-weave` to fix them
(everything proposed before it's written), then a re-check — with a before/after diff against your
backup. Entirely optional and approval-gated.

---

## Rollback (if you ever want it)

You changed nothing destructive, so rollback is trivial:
- **Primary:** delete the v1 `.synaptic/` and rename `*-v0.3-backup` back to `.synaptic`.
  *(Do **not** use `git checkout <backup-path>` — that restores a path into your tree, it does not
  swap the folder back. The rename is the reliable move.)*
- **If the brain is git:** revert to the `pre-v1` tag with a *forward* revert commit (on a shared
  remote, never a force-push/reset).

Keep the backup for a few days of normal use before deleting it.

---

## What actually changes (so nothing surprises you)

| v0.3 | v1 |
|---|---|
| Eager multi-file load | One boot file (`BRAIN.md`, ~500 tokens); everything else on demand |
| Folder tree + index | MOC-of-MOCs: `BRAIN → INDEX → cluster _index → the 1–2 nodes you need` |
| Bare `[[wikilinks]]` | Same, **plus optional typed edges** (`depends_on`, `supersedes`, `contradicts`…) — added only where obvious |
| — | Optional `source:` / `confidence:` provenance fields (additive) |

**Your knowledge is preserved.** The upgrade re-files and re-links; it does not rewrite your facts.
Everything that was a page is still a page.

---

## If something's weird

Don't force it. Keep the original brain (you never lost it), note what the report or the agent said,
and flag it — supervised runs exist precisely so we catch edge cases before generalizing the process.
