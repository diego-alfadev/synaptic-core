# Synaptic v1.4.0

**Turn your daily work into a brain your agent can actually use. Plain files. Zero runtime. Any agent.**

The biggest Synaptic release yet. If you're on a bare v1.0, it all arrives in one clean `/synaptic-upgrade`
— additive, no schema change, nothing breaks — and your brain gets a lot more capable.

---

## 🌐 One brain, wherever you work
- Keep your brain scoped to a single project, or let it **follow you across every folder** — you choose, just by where it's wired.
- **Move a project brain to global** (or back) — guided, crash-safe, byte-for-byte, with automatic rollback if anything looks off.
- Every `init` / `upgrade` now **detects how your brain is wired and fixes it** — no more "works in this folder, invisible in the next."

## ⚡ Value in 10 minutes
- **Day-1 walkthrough:** empty brain → first note → first retrieval → your first *"if I vanished tomorrow, here's everything"* handover. Ten minutes, no jargon.
- **`/synaptic-handover`:** a new-joiner or vacation brief straight from the brain, on demand — what it is, the key decisions, the open threads, where to look. The knowledge tax, handled.
- Commands now show up in your agent's **`/` menu, with descriptions.**
- **A path for non-developers** — managers and POs get the value without touching a terminal.

## 🎯 Capture you can trust
- A **structured session protocol** — Goal · Discoveries · Done · Next · Files. Signal, not a wall of text.
- A **"did capture actually fire?" audit** that catches silently-dead hooks — so you never open your brain to an empty journal.

## 🧭 Know what's alive — and what to trust
- **`lifecycle`** (project · area · resource · dormant) **+ `status`** (active · stale · archived): two dials, one grep, instant answers to *"what's live right now?"* and *"can I trust this?"* Archive, don't delete.

## 🕸️ See your brain
- A real **interactive, force-directed graph** — zoom, filter, search, expand. Not a static blob.
- **God-node & surprising-edge audits** — the over-connected hubs, and the links that shouldn't exist.

## 🛡️ Governance, in the box
- A crisp **local-vs-remote data boundary** (code stays 100% local; prose goes to your host LLM) — drop-in text for regulated environments.

---

## The one thing that never changes
It's **just files.** Zero runtime. Any agent. Git-diffable. Portable. Yours.
No daemon, no lock-in, no gigabyte download — works offline, works air-gapped, works with whatever agent you use next year.

## What's next
Retrieval is getting a turbo — faster search now, semantic when you want it. Opt-in, local, and your files
stay the source of truth. Alongside it, we're building toward a brain that gets *better* with use, not just
bigger. It'll always be just files underneath — and the hints are already in the repo if you want to dig.

---

## Get it
- **New:** `/synaptic-init`
- **On v1.x:** `/synaptic-upgrade` — additive, no schema change, nothing breaks
- **On v0.3 (pre-v1):** a guided migration walks you through it — see [`UPGRADE-v0.3-to-v1.md`](UPGRADE-v0.3-to-v1.md)
