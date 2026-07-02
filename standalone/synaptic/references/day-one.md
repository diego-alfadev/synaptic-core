<!-- summary: OPTIONAL ~10-minute guided cold-start walkthrough for a FRESH empty brain — first capture → first retrieval → first "aha" (a vacation-handover-shaped snapshot). Non-technical-friendly, zero-runtime. -->

# Day 1 — Guided First-Value Walkthrough (fresh, empty brain)

A short, hand-held **first-run** for a brain that was just created and is still empty. Its only job:
get a newcomer — **especially a non-technical / low-initiative user** — from "the brain exists" to
"the brain gave me something useful" in **~10 minutes**, ending in a tiny artifact in the
**vacation-handover shape**. This is the cold-start counterpart to the migration/upgrade runbooks,
which serve brains that already have content.

> **When this runs.** It is **OFFERED** at the end of `/synaptic-init` on a **fresh (empty) brain**
> only (never on migration — migration is already covered by the upgrade runbooks; never if the brain
> already has nodes). It is **entirely optional** — the user can decline and just start working; the
> brain is fully usable either way. That optionality is what keeps it inside the **Simplicity
> Guardrail** (`docs/concepts/simplicity-guardrail.md`): an *offered* guided path, never a forced one.

> **The offer wording (from `/synaptic-init`).** *"Your brain is set up and empty. Want a 10-minute
> guided first capture? I'll walk you through capturing one thing you own, retrieving it back, and
> turning it into a starter handover brief. Or skip it and just start working — the brain captures as
> you go either way."* Proceed only on a "yes"; on "no", say the brain is ready and stop.

## Non-technical-friendly by design (binding)

Run this as **plain guided prompts** — no harness/Node/CLI/hooks vocabulary *inside the walkthrough*.
The user is answering questions in chat; the agent does the file work. Do **not** ask the user to
touch frontmatter, run a command, or understand the graph. One question at a time, build on the
answer, keep it warm. If the user is a manager/PO, this is exactly their path — point them to
`docs/FOR-MANAGERS-AND-POS.md` at the end for "what you actually do with this."

**Zero-runtime, files-first.** Every step is prose the agent executes with read/grep + one file
write (I2/I3). No tool is required; the retrieval step is the grep/MOC floor. Nothing here depends on
hooks having fired — the agent writes the one node by hand, exactly like the hook-less capture path.

---

## The flow — three beats, ~10 minutes

### Beat 1 — First capture (the vacation question → ONE real node)

Ask **one** framing question, in the handover shape (this is the validated hook — key-person /
vacation dependency):

> *"If you went on vacation tomorrow, what's ONE thing you own that a colleague would need to know to
> keep going? It can be a decision you made, a process only you run, or where something important
> lives."*

Take their answer and capture it as **one real knowledge node** — genuinely useful, **not a toy**:

1. **Classify** the answer into a `type:` (this is invisible to the user — do not ask them):
   - a ratified choice / who-signs-off / a rule → `type: decision`
   - a process / how-to / runbook → `type: playbook`
   - where something lives / a catalog fact → `type: reference` (or a `registries/` row if tabular)
   - anything else durable → `type: knowledge`
2. **Write the node** from `templates/templates/node.md` into the right `knowledge/{cluster}/` folder.
   If no cluster fits yet, create a sensible cluster (e.g. `knowledge/handover/`) — this is the
   brain's first cluster and that is fine. Fill real frontmatter, **no placeholders**: a self-contained
   one-line `description:`, `status: active`, `updated: {today}`, 1–2 `tags`. Leave `lifecycle:` absent
   (→ `area`, loads by default) unless the thing is clearly a live time-boxed effort (then
   `lifecycle: project`). Body = their answer, lightly cleaned into durable prose (strip the anecdote,
   keep the reusable fact — the Step-3 generalize discipline from `references/consolidate.md`).
3. **Register it in the MOC** — add a one-line entry `[[node-name]] — {description}` to the cluster
   `knowledge/{cluster}/_index.md`, and ensure that cluster is listed in `knowledge/INDEX.md`
   (create the `_index.md` if the cluster is new). *A node not reachable from the index does not
   exist* — registration is what makes Beat 2 work.
4. **Leak-safety** (same rule as everywhere): capture *where* things live and *what* was decided —
   never paste raw endpoints, IDs, secrets, or internal identifiers. Describe, don't leak.

Then tell the user, in plain language, what just happened: *"Captured — that's now the first thing in
your brain, filed under {cluster}."*

### Beat 2 — First retrieval (prove the loop closes)

Immediately demonstrate that it is findable — **prove capture → retrieval works**:

> *"Now ask your brain that question back — try: 'who signs off releases?' (or whatever fits what you
> just told me)."*

The agent answers **from the just-captured node via the MOC** — navigate `knowledge/INDEX.md` → the
cluster `_index.md` → the node (or a grep for the node's tags/title). This is the **grep/MOC floor**:
no runtime, no semantic search, no tool. Show the answer **and** name the source node so the loop is
visible: *"Answered from `knowledge/{cluster}/{node}.md` — the note you just made. That's the whole
loop: you told the brain once, it can tell you (or anyone) back."*

> If the user does not know what to ask, ask it *for* them and narrate: *"You said the risk lead signs
> off releases — watch, I'll ask the brain 'who signs off releases?' … here's what it found."* The
> point is that **they see the retrieval succeed**, not that they craft a query.

### Beat 3 — First "aha" (the vacation-handover snapshot)

Turn the single node into the payoff — a **tiny handover-shaped snapshot**, by **reusing
`/synaptic-handover`** (`references/handover.md`) over the day-1 content:

1. Run the `/synaptic-handover` procedure over what exists (right now: the one node + the Context
   Capsule). It is extractive and reproducible-from-files, so on a one-node brain it produces a small,
   honest brief — a **project summary** line + the node under **Owns** / **Key decisions** /
   **Where things live** as its `type:` dictates. Do not pad empty sections; on a one-node brain most
   sections are legitimately short or "nothing captured yet."
2. Show it and name the payoff explicitly (this is the "aha", and it **seeds the handover feature** —
   Item 3): *"That one note is already part of a handover brief — if you left tomorrow, a covering
   colleague could read this without you in the room. Every note you add makes this brief richer,
   automatically. That's the whole idea: your daily work quietly becomes a handover that writes
   itself."*
3. Do **not** write the brief into `knowledge/` (a handover brief is an export artifact, not a node —
   same rule as `references/handover.md`). Offer to save it to a file of the user's choosing, or just
   leave it shown.

**End state (the triad, all three present):** ≥1 real captured node (typed + registered in the MOC) ·
one successful retrieval of it via the MOC/grep floor · the vacation-handover value seen as a small
brief. That is Day 1 delivering tangible value.

---

## Close-out

Leave the user with the two things that keep them going, no jargon:

- *"From here, just work normally — the brain captures as you go, and you can run
  `/synaptic-handover` any time to see the up-to-date brief."*
- If they are a manager / PO or otherwise non-technical, point them at
  `docs/FOR-MANAGERS-AND-POS.md` — "what you actually do with this," no code.

## Worked example (author-complete, by inspection)

A brand-new **non-technical** user (a PO at a regulated-enterprise client), ~10 minutes:

- **Beat 1** — Vacation question → *"The release sign-off must be approved by the risk lead before the
  Friday cutoff."* The agent files it as `knowledge/handover/release-signoff.md`
  (`type: decision`, `status: active`), registers it in `knowledge/handover/_index.md` and lists the
  `handover` cluster in `knowledge/INDEX.md`.
- **Beat 2** — User asks *"who signs off releases?"*; the agent navigates the MOC to that node and
  answers *"the risk lead, before the Friday cutoff — from `knowledge/handover/release-signoff.md`."*
- **Beat 3** — `/synaptic-handover` produces a one-line brief: *Project summary: {capsule}. Key
  decisions: risk-lead sign-off before Friday cutoff [→ release-signoff.md].* The agent closes:
  *"that's your handover brief starting to build itself."*

End state: **one useful captured node + one successful retrieval + the handover value seen.**

## CORE-safety

Zero-runtime prose flow (I3) — every step is read/grep + one file write. The output is a **real file**
(a genuine node), files-first (I2). Optional by construction (I4) — offered on a fresh brain, skippable,
and the brain works fully without it. No new surface, no schema bump (I1): it reuses the existing node
template, the MOC, and the shipped `/synaptic-handover` procedure. Passes the Simplicity Guardrail —
an offered guided path, not a forced one.
