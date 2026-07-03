# For managers and POs — what you actually do with an AI Brain

*What this is: the non-technical path. What a delivery manager or product owner actually does with a Synaptic brain, and a minimal way to use one that does not assume you run a developer's agent harness. No code, no install to approve, no platform.*

Most of the Synaptic docs talk to a developer with an agent-driven coding setup. This page does not. If you are a manager or a PO, this is what the brain does **for you**, and how to use it with nothing more than a chat assistant.

## What is it, in one line

An **AI Brain** is a folder of plain text files that holds your team's working knowledge — decisions, who owns what, where things live, open threads — in a form an AI assistant can read and answer from. It is not a platform. It is files.

## What you actually do with it

| You want to… | What happens |
|---|---|
| **Onboard a new joiner** | Hand them the brain. They (or their assistant) get a **day-1 handover brief** — project summary, who owns what, key decisions, where things live, open threads — without booking hours of your time. |
| **Cover a key person on leave** | Before they go, the brain already holds what they own. The covering colleague asks the brain *"who signs off releases?"* and gets the answer — no waiting for the person to come back. |
| **Reduce the knowledge tax** | Less time reconstructing context after a gap, less documentation drift, less risk that knowledge lives only in one person's head. The work being done already becomes durable knowledge as it happens. |

## What you do NOT need

- **No budget** — it is a folder of files; there is nothing to buy.
- **No platform rollout** — nothing to procure, provision, or wait for IT to approve.
- **No security exception** — the brain is plain text on the machine you already use; there is no server, no database, no data leaving that was not already leaving. (A compliance reviewer can open and read every file. See [where the data goes](./concepts/local-vs-remote-boundary.md).)

## The vacation-handover value — the one to remember

The clearest payoff is the **vacation / key-person handover**. When someone goes on leave, the covering person reads the brain and gets productive without the owner in the room. Out comes a one-page brief like:

> *Owns the release-gating pipeline and the Q3 migration. Key decisions: the risk lead signs off releases before the Friday cutoff. Where things live: the gating runbook, the two active repos. Open threads: the migration verify phase is not yet done.*

That brief is built **from the files the team already captured** — not written from scratch when the person leaves. That is the knowledge tax, paid down.

## A minimal way to use it — no developer setup

You do **not** need a coding agent, hooks, or any installation. If you have a plain chat assistant (browser Copilot chat, a desktop assistant), this is the whole path:

1. **Point your assistant at the brain.** Open or share the `.synaptic/` folder and tell the assistant to read `BRAIN.md`. That is the "install" — no tooling.
2. **Ask a question to retrieve.** *"Summarize what we decided about the release gate."* The assistant reads the brain's map of contents and answers.
3. **Ask it to write something down to capture.** After a meeting: *"Add a note — the risk lead now owns release sign-off."* The assistant writes it into the brain as a note.

That is it: install by pointing, ask to retrieve, ask to capture.

## Honest limits

So you know what to expect:

- **Capture is manual on this minimal path** — you have to *ask* the assistant to write things down; there is no automatic capture without a developer's harness.
- **No fast semantic search** — the assistant navigates the brain's index by hand, not by an AI search engine.

But the brain still **exists, captures, and answers** — with nothing installed beyond sharing a folder. Everything above works on the plain files, no code required.

---

**Related:**
- [Where the data goes](./concepts/local-vs-remote-boundary.md) — the governance answer for a regulated enterprise client: no new egress, auditable by inspection
- [Reach](./concepts/reach.md) — one brain that can follow a person across all their folders, and the leak rule that keeps it safe
- Back to the [README](../README.md) · the [concepts index](./concepts/_index.md)
