# v1 Upgrade + Benchmark + Export — paste-to-your-agent runbook

> One self-contained runbook you paste to your coding agent to: **(1)** upgrade your brain to v1 **on a
> copy** (your original is never touched), **(2)** verify it, **(3)** visualize it, **(4)** export it, and
> **(5)** benchmark its retrieval — then package the results to share. Designed for users with Node + Python
> + an agent. Your data cannot be lost: every step runs on a copy; the original stays put.

---

## Before you start
- You have **synaptic-core v1** locally (clone/pull the repo at the v1 tag, or copy its `standalone/synaptic/`
  + `tools/` folders next to your work).
- You know where your current brain lives (the `.synaptic/` folder).
- A Node runtime is on PATH (`node --version`). Python optional.

---

## The prompt — paste everything below to your agent

```
You are going to upgrade my Synaptic brain to v1 ON A COPY, verify it, visualize it, export it, and
benchmark its retrieval. My original brain must NOT be modified. Use the synaptic-core v1 tools and the
guide at standalone/synaptic/references/upgrade-to-v1.md. Work step by step and report after each step.

STEP 0 — Make the test copy (never touch the original)
- Copy my brain folder to a sibling test project, e.g. copy `<MY_BRAIN>/.synaptic` to
  `./synaptic-v1-test/.synaptic`. Confirm the original is untouched. From here, operate ONLY on the copy.

STEP 1 — Phase M (mechanical, deterministic)
- Run: `node <SYNAPTIC>/tools/migrate.js ./synaptic-v1-test/.synaptic`
  (use `--dry-run` first to preview). If the tool errors, fall back to doing Phase M by hand exactly as
  upgrade-to-v1.md describes (stage v0.x boot files + worklines into `_migration-staging/`, rename
  `inventory/`→`registries/`, create the v1 dirs). Report what moved.

STEP 2 — Phase C (the rearrange — you do this with judgment)
- Read standalone/synaptic/references/upgrade-to-v1.md fully and execute Phase C on the copy:
  convert relative-path links to [[wikilinks]]; build the hub knowledge/INDEX.md + each cluster
  _index.md (sub-MOC, one line per node) from the old _overview files; apply the 6-step consolidation
  formula retroactively (atomic nodes, frontmatter incl. tags, type: reference for long canonical docs);
  route identity → harness/ (conventions+guardrails as deploy-source) and contacts → a people-routing
  knowledge node; move any project-local skills to harness/skills/; triage worklines → playgrounds or
  your task system; rewrite journal to the thin 3-section format. Delete `_migration-staging/` last.
- Then DEPLOY the operating rules: `node <SYNAPTIC>/tools/deploy.js ./synaptic-v1-test` (writes the
  SYNAPTIC + SYNAPTIC-RULES blocks into the test project's AGENTS.md; --dry-run to preview).

STEP 3 — Verify
- Run: `node <SYNAPTIC>/tools/check.js ./synaptic-v1-test/.synaptic` and fix any ERRORs it reports
  (broken [[links]], orphan nodes, missing frontmatter). Then run /synaptic-audit and address gaps.
- Goal: check.js exits 0.

STEP 4 — Visualize (before & after)
- Run the graph image on BOTH the old copy and the new one so we can see the change:
  `node <SYNAPTIC>/tools/graph.js <MY_BRAIN>/.synaptic --out brain-v03-graph.html`
  `node <SYNAPTIC>/tools/graph.js ./synaptic-v1-test/.synaptic --out brain-v1-graph.html`
- Open both in a browser. (The layout is deterministic, so before/after are directly comparable.)

STEP 5 — Export (mail-safe single file)
- Run: `node <SYNAPTIC>/tools/export.js ./synaptic-v1-test/.synaptic synaptic-v1-export.md`
  (add `--split` if your mail filter blocks a big file).
- REVIEW the export before sharing: remove anything that must not leave (credentials, raw secrets).
  registries/references hold infra IDs — sanitize as you did before emailing.

STEP 6 — Retrieval benchmark (so we get real numbers)
- Design ~15–20 realistic questions a teammate would ask THIS brain, spread across its clusters
  (mix easy single-node lookups and harder cross-node synthesis). 
- For EACH question, answer it in a FRESH context (a new chat, or a subagent if your agent supports it)
  using ONLY the brain: read BRAIN.md → knowledge/INDEX.md → the cluster _index.md → open only the
  node(s) you need; fall back to grep only if the MOC chain fails. For each, log: files opened (count +
  paths), nav_path (moc | grep | mixed), outcome (found | partial | not-found), and a 1-line answer.
- Then compute and write a short report `benchmark-v1.md`: found-rate, mean & median files-to-answer,
  how often the MOC hierarchy alone located the answer (vs grep), any dead links, and 2–3 example Q/A.
  Mark honestly: this measures retrieval EFFICIENCY + COVERAGE; YOU judge answer ACCURACY.

STEP 7 — Package to share
- Bundle for review/sharing: `synaptic-v1-export.md` (sanitized), `benchmark-v1.md`, `brain-v1-graph.html`
  (+ the v0.3 graph for the before/after). These are the real-brain numbers + visuals for the release
  notes and the talk.

Report a final summary: what moved, check.js status, the benchmark headline numbers, and the file list.
```

---

## What you get back
- A migrated v1 brain (on a copy) you can keep or discard — your original is intact.
- **brain-v1-graph.html** (+ v0.3) — the visual big-picture, no Obsidian needed; great for managers.
- **synaptic-v1-export.md** — the mail-safe bundle (sanitize before sending).
- **benchmark-v1.md** — real retrieval numbers from your productive brain, for the release tag + the talk.

Send the export + benchmark + graph back (email is fine) and they can be remounted as a real test subject.
