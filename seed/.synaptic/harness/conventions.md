---
description: "Portable working agreements — communication languages per channel, commit style, etiquette."
type: knowledge
status: active
updated: "{{YYYY-MM-DD}}"
deployed: "{{YYYY-MM-DD or never}}"
tags: [harness, conventions, working-agreements]
---

# Conventions (source — deployed)

Portable operating norms of this team or project. This file is the **source** — `/init` and `/upgrade` deploy it into the outer harness. At work-time the agent reads the deployed copy, not this file. A teammate inheriting this brain can regenerate the full harness by running `/init`.

> **Scope test:** if a norm governs how the team works together → it belongs here. If it governs how your personal agent behaves toward you (persona, tone, chat language) → it belongs in AGENTS.md / CLAUDE.md, not here.

---

## Communication Channels

| Channel or context | Language / norm |
|---|---|
| `{{CHANNEL_OR_CONTEXT}}` | `{{LANGUAGE_OR_NORM}}` |

<!-- Examples:
| Jira tickets | English |
| Slack #team-general | English |
| Daily stand-up | {{spoken language}} |
| Internal docs / Confluence | English |
| Code comments | English |
-->

---

## Commit & Branch Style

<!-- Keep entries short: one line per convention. -->

- **Commit format:** `{{e.g. Conventional Commits: feat|fix|chore|docs|refactor(scope): message}}`
- **Branch naming:** `{{e.g. feat/{ticket}-short-description, fix/{ticket}-short-description}}`
- **PR size:** `{{e.g. ≤400 lines changed; split larger changes into stacked PRs}}`
- **Merge strategy:** `{{e.g. squash-and-merge on main; rebase for feature branches}}`

---

## Review Etiquette

- {{CONVENTION — e.g. "Reviewer turnaround: ≤1 business day for standard PRs."}}
- {{CONVENTION — e.g. "Tag `[WIP]` or draft PRs for in-progress work; no review expected."}}
- {{CONVENTION — e.g. "Author resolves own threads after addressing; reviewer closes."}}

---

## Escalation & Decisions

- {{CONVENTION — e.g. "Architectural decisions need sign-off from {{ROLE}} before implementation."}}
- {{CONVENTION — e.g. "Escalate blockers in {{CHANNEL}} with a `@here` mention after 4h unblocked."}}

---

## Team-Level Never-Dos

<!-- Hard rules agreed by the team — not personal agent rules. -->

- {{NEVER_DO — e.g. "Never merge without at least one review."}}
- {{NEVER_DO — e.g. "Never deploy to production on Fridays after 15:00."}}

---

> This file is the canonical source for working conventions. Hard rules that must never be violated go in `harness/guardrails.md`. Run `/init` or `/upgrade` to (re)deploy both into the outer harness.
