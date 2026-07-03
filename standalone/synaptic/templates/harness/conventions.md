---
description: "Portable working agreements — communication languages per channel, commit style, etiquette."
type: knowledge
status: active
updated: "{{YYYY-MM-DD}}"
tags: [harness, conventions, working-agreements]
---

# Conventions

Portable operating norms of this team or project. Load on demand (e.g. before writing a commit, ticket, or PR). A teammate inheriting this brain should find everything needed to work here without asking.

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

> This file is the **source**; it is **deployed into your harnessing** (instruction file / AGENTS.md block — **copy, or a symlink ONLY on a POSIX local, non-synced path**) so it sits in the agent's system prompt, not read from the brain at session start. Full security/ops rules in `harness/guardrails.md`.
