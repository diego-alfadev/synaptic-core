---
description: "{{ONE_LINE: what outcome this playbook produces — copied into cluster _index.md}}"
type: playbook
status: active
updated: "{{YYYY-MM-DD}}"
tags:
  - playbook
  - "{{cluster-tag}}"
  - "{{topic-tag}}"
---

# {{Playbook Title}}

<!-- A playbook is a typed node (type: playbook) co-located in its knowledge cluster — not a separate silo.
     It teaches the agent to GENERATE a plan for the current state, not follow a fixed sequence blindly.
     Lifecycle: recon (observe recurring task) → draft (first real success) → refine (one Gotcha per real failure). -->

## Intent

<!-- What outcome does this playbook produce, and why does it matter?
     Be concrete: name the artifact or state that exists when the playbook succeeds. -->

## When to use

<!-- Trigger conditions: what situation, signal, or request causes you to reach for this playbook? -->

---

## Preconditions & access

<!-- THE GOVERNANCE LANE — these items BLOCK execution milestones.
     List approvals, accesses, tickets, or environment states that must be in place.
     If any precondition is unmet, surface it immediately and pause rather than proceeding.

     - [ ] {{Access or approval required}} (contact: {{NAME or ROLE}})
     - [ ] {{Environment state required}}
     - [ ] {{Ticket or sign-off required}}
-->

## Method

<!-- THE TECHNICAL LANE — how to assess current state, identify gaps, and build the plan.
     May run in parallel with Preconditions where safe, but execution milestones are gated above.
     Structure as: assessment → gap analysis → prioritised plan. Not a fixed step list.

     ### 1. Assess current state
     ### 2. Identify gaps
     ### 3. Produce prioritised plan
-->

---

## Gotchas

<!-- Refined by failure — add one entry per real failure encountered during a run.
     Format: **{{what went wrong}}**: why → how to avoid or recover.
-->

## Example run

<!-- Link to a real session log or journal excerpt that used this playbook.
     - `journal/_current.md` entry [{{DATE}}] — {{what happened / what the run revealed}}
-->

---

> Registered in `knowledge/{{cluster}}/_index.md`. A playbook not reachable from a MOC does not exist.
