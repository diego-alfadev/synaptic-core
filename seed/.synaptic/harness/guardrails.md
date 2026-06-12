---
description: "Hard rules for this project — security, ops, and quality gates that must never be violated."
type: knowledge
status: active
updated: "{{YYYY-MM-DD}}"
deployed: "{{YYYY-MM-DD or never}}"
tags: [harness, guardrails, hard-rules]
---

# Guardrails (source — deployed)

Non-negotiable rules for working on this project. This file is the **source** — `/init` and `/upgrade` deploy it into the outer harness. At work-time the agent reads the deployed copy. The deployed copy is always up-to-date with what is here; no guardrails block is carried in BRAIN.md.

> **Scope test:** rules about how the project/work must run → here. Rules about how the agent behaves toward its owner → AGENTS.md / CLAUDE.md.

---

## Security

- {{RULE — e.g. "Never commit secrets, credentials, tokens, or connection strings to any repository."}}
- {{RULE — e.g. "Rotate any accidentally-exposed secret immediately; treat exposure as an incident."}}
- {{RULE — e.g. "Never log PII or sensitive customer data to any observable output."}}
- {{RULE — e.g. "All external-facing endpoints must go through {{GATEWAY/AUTH_LAYER}}."}}

---

## Operations & Deployments

- {{RULE — e.g. "Never push directly to `main`; all changes via reviewed PRs."}}
- {{RULE — e.g. "Never deploy to production without explicit sign-off from {{ROLE}}."}}
- {{RULE — e.g. "Never run destructive migrations without a tested rollback plan."}}
- {{RULE — e.g. "Never disable CI checks on protected branches."}}

---

## Data & Compliance

- {{RULE — e.g. "Customer data must remain within {{REGION/ENVIRONMENT}}; no cross-border transfer without approval."}}
- {{RULE — e.g. "Access to production data requires {{APPROVAL_PROCESS}}."}}

---

## Agent Discipline

- {{RULE — e.g. "Stop and surface blockers rather than proceeding with a plan that will fail at a governance gate."}}
- {{RULE — e.g. "If a precondition in a playbook is unmet, pause and report — do not skip the gate."}}
- {{RULE — e.g. "Never take irreversible actions (drops, deletes, force-pushes) without explicit confirmation."}}

---

## Quality Gates

- {{RULE — e.g. "All nodes must be reachable from a MOC before a session closes."}}
- {{RULE — e.g. "No node ships without `type`, `status`, `updated`, and `description` frontmatter."}}

---

> This file is the canonical source. Run `/init` or `/upgrade` to (re)deploy it into the outer harness. BRAIN.md carries no guardrails block — it carries a pointer to this source.
