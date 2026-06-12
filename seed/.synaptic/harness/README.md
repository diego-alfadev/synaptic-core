---
description: "Deployable source of operating rules — conventions, guardrails, and project skills for this brain."
type: knowledge
status: active
updated: "{{YYYY-MM-DD}}"
tags: [harness, deploy-source]
---

# Harness — Deployable Source of Operating Rules

This folder is a **portable source of truth** for the outer harness. It is NOT loaded at
runtime from the brain. The agent reads operating rules from the **deployed outer harness**
(AGENTS.md marker section, instruction files, `.claude/skills/`) after `/init` has materialized
them there.

The brain keeps this copy so the harness is **regenerable on any machine** — if you start
fresh on a new workstation, run `/init` and your full project setup is restored.

---

## What lives here

| File / Folder | Purpose |
|---|---|
| `conventions.md` (source — deployed) | Working agreements: commit style, branch naming, PR workflow, communication languages per channel |
| `guardrails.md` (source — deployed) | Hard rules: security, deployment gates, never-dos, agent discipline |
| `skills/` (source — deployed) | Project-local executable skills (e.g. a Jira CLI, deploy helper) — travel with the brain |

---

## How deployment works

`/init` and `/upgrade` both run the **Deploy step**:

1. Reads `harness/conventions.md` + `harness/guardrails.md`.
2. Writes (or replaces) a `<!-- BEGIN:SYNAPTIC-RULES --> … <!-- END:SYNAPTIC-RULES -->` block in
   the project's outer harness file (AGENTS.md, or platform-specific instruction files).
3. Installs `harness/skills/*` into `.claude/skills/synaptic-rules/` and `.agents/skills/synaptic-rules/`.
4. Idempotent: the marked block is fully replaced on each deploy; unmarked user content is never touched.

The agent at work-time reads the **deployed rules** (outer harness), not this folder.

---

## The three-concern separation

| Concern | Lives in | Agent reads from |
|---|---|---|
| **Knowledge** — what you reason over | brain `knowledge/`, `registries/`, `references/` | the brain (on demand) |
| **Operating rules** — how work is done here | brain `harness/` (this folder) = **source** | outer harness (deployed copy) |
| **Persona** — tone, chat language, agent personality | outer harness ONLY | outer harness |

---

## Safety fallback

If the harness is not yet wired (no `BEGIN:SYNAPTIC-RULES` in AGENTS.md), an agent that reads
`BRAIN.md` will find the pointer: *"treat `harness/` as the source."* This is the fallback
path only — normal operation always reads the deployed copy.
