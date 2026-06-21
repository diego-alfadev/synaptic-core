---
description: "Hard rules for this project — security, ops, and quality gates that must never be violated."
type: knowledge
status: active
updated: "{{YYYY-MM-DD}}"
tags: [harness, guardrails, hard-rules]
---

# Guardrails

Non-negotiable rules for working on this project. Load on demand before any sensitive operation (deploy, secret rotation, production access, external comms). A compressed subset (3–5 rules) is mirrored in `BRAIN.md → Top Guardrails` for always-on awareness.

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

## Anti-Fabrication (epistemic honesty — always on)

These guard the brain's trustworthiness. They are knowledge-epistemic rules for the agent, not persona.

- **No false absence.** "I found nothing" is only valid AFTER an actual search. Never infer absence from not-having-looked; state what you searched (grep/MOC/cluster) and where.
- **Enumerate, don't sample.** When asked "all X" / "every X" / for a count, enumerate the full set from the files — do not generalize from the first few hits or guess a total. Grep the whole tree; report the real count.
- **Mark the unknown as TBD.** If a fact is not in the brain and not verifiable, write `TBD` (or leave the field blank) — never invent a plausible value, ID, URL, owner, or date to fill a gap.
- **Provenance or silence.** Prefer a sourced claim (`source:` frontmatter) over an unsourced one; if you cannot cite where knowledge came from, lower its `confidence:` and say so in `## bias-check`.
- **No gap-filling from the session log.** Capture decisions EXPLICITLY stated in the session; never back-fill the brain with inferred conclusions the human did not actually state.

---

## Autonomy Tiers (what the agent may do unprompted)

Every automated edit is **diff-traced, git-reversible, and archive-before-delete**. The tier sets how much approval is required.

| Tier | Scope | Examples |
|---|---|---|
| **AUTO** (bounded + reversible) | Act without asking; the change is small, reversible, and on record. | Append a journal breadcrumb · reindex / regenerate a derived cache · reconcile a flagged `contradicts` / `supersedes` edge · capture a decision EXPLICITLY stated in the session · fix a broken `[[wikilink]]`. |
| **PROPOSE-THEN-APPROVE** | Draft the change and surface it; apply only on a yes. | Promote a node / merge or split nodes · restructure a cluster or MOC · rewrite an existing node during consolidation · change a registry's schema · supersede a page's substance. |
| **HUMAN-ONLY** | Never automate; the human does it (or explicitly directs it each time). | Delete knowledge · purge / burn anything beyond a consolidated playground · edit persona/behavior (lives in the harness, not the brain) · irreversible ops (force-push, schema migration, secret rotation). |

> **Self-improving is bounded and reversible only** — the AUTO tier reconciles flagged edges, captures explicitly-stated decisions, and reindexes. It is NOT an autonomous unbounded rewriter. Structural change is propose-then-approve; deletion and persona are human-only.

---

> The top 3–5 rules from this file are mirrored in `BRAIN.md → Top Guardrails`. Update both when the top subset changes.
