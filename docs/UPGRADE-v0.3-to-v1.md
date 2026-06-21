# Upgrade your brain: v0.3.0-beta → v1-beta

> **You won't lose anything.** This upgrade is **non-destructive**: it works on a **copy**, your original brain stays untouched, and you only switch over once you've verified the result. Worst case, you keep your old brain. Tokens are not a concern here — let the agent be thorough.

This is the **first real run** of the v1 migration on a production brain, so do it **supervised**: the agent does the heavy lifting; you eyeball one report before switching. ~10–15 minutes.

---

## Before you start

- **Node is optional** (only for the bundled checks). If `node` is available (directly or via `nvm`), the tools run; if not, the agent does the equivalent checks manually — nothing blocks.
- **Use your normal agent** (Claude Code / Copilot / Cursor — whatever you use on the brain).
- Know where your brain lives: the `.synaptic/` folder in your project.

---

## The 3 steps (the agent does the work)

### 1. Safeguard (copy first)
Make a copy of the brain so the original is never touched:
```
# from the project root, in a terminal:
git add -A && git commit -m "pre-v1-upgrade snapshot"     # if the brain is in git (preferred)
# AND/OR just copy the folder:
cp -r .synaptic .synaptic-v0.3-backup
```
If it's in git, that commit alone is your full rollback. The copy is belt-and-suspenders.

### 2. Run the upgrade (paste this to your agent)
Open your agent in the project and paste:

> Run `/synaptic-upgrade` on the `.synaptic/` brain in this project. It is currently a v0.3.0-beta brain. Migrate it to v1 **non-destructively**: do **Phase M** (mechanical re-structure to the v1 layout + frontmatter), **Phase C** (re-file every page into the MOC-of-MOCs, add obvious typed edges, merge clear duplicates), and **Phase V** (verify). **Do not delete the original**; stage the v1 version alongside it. When done, print the verification report described below. Take your time and be thorough.

The agent will: restructure to the v1 layout (single boot file `BRAIN.md`, `knowledge/INDEX.md` → cluster `_index.md` → nodes), keep every fact, and add the v1 niceties (optional typed edges, provenance fields) **without inventing content** — v1 is **additive** over v0.3, so this is mostly *re-filing*, not rewriting.

### 3. Verify, then switch
Before you replace anything, the agent prints a **report**. Check these three things are green:
- **No content lost** — node/page count of the v1 brain ≥ the v0.3 brain (nothing dropped).
- **No broken links** — every `[[wikilink]]` resolves.
- **Everything reachable** — every node is listed in a MOC (`INDEX.md` → cluster `_index.md`). A page not reachable from a MOC "doesn't exist".

If `node` is available, the agent runs `node tools/check.js .synaptic` to confirm. If all green → replace the old brain with the upgraded one. If anything looks off → **stop, keep the original**, and tell us what the report said.

---

## Rollback (if you ever want it)

You changed nothing destructive, so rollback is trivial:
- In git: `git checkout .synaptic-v0.3-backup` / revert the snapshot commit.
- From the copy: delete the v1 `.synaptic/` and rename `.synaptic-v0.3-backup` back to `.synaptic`.

Keep the backup for a few days of normal use before deleting it.

---

## What actually changes (so nothing surprises you)

| v0.3.0-beta | v1-beta |
|---|---|
| Eager multi-file load | One boot file (`BRAIN.md`, ~500 tokens); everything else on demand |
| Folder tree + index | MOC-of-MOCs: `BRAIN → INDEX → cluster _index → the 1–2 nodes you need` |
| Bare `[[wikilinks]]` | Same, **plus optional typed edges** (`depends_on`, `supersedes`, `contradicts`…) — added only where obvious |
| — | Optional `source:` / `confidence:` provenance fields (additive) |

**Your knowledge is preserved.** The upgrade re-files and re-links; it does not rewrite your facts. Everything that was a page is still a page.

---

## If something's weird

Don't force it. Keep the original brain (you never lost it), note what the report or the agent said, and flag it — this is a supervised first run precisely so we catch edge cases together before generalizing the process.
