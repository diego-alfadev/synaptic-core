---
description: "{{ONE_LINE_DESCRIPTION}}"
updated: "{{YYYY-MM-DD}}"
status: active  # active | stale | archived
---

<!-- LIFECYCLE: recon → draft from a real success → refine on each failure (add one Gotcha entry per real failure) -->

# {{PLAYBOOK TITLE}}

## Intent

<!-- What outcome does this playbook produce, and why does it matter?
     Be concrete: name the artifact or state that exists when the playbook succeeds. -->

## When to use

<!-- Trigger conditions: what situation, signal, or request causes you to reach for this playbook? -->

## Preconditions & access

<!-- THE BUREAUCRATIC / GOVERNANCE LANE — these items BLOCK execution milestones.
     List approvals, accesses, tickets, or environment states that must be in place before
     the corresponding Method steps can proceed. If any precondition is unmet, surface it
     immediately and pause rather than proceeding with a plan that will fail at deployment.

     Example:
     - [ ] Production deploy access granted (ticket: {{TICKET_ID}})
     - [ ] Stakeholder sign-off on approach (contact: {{NAME}})
     - [ ] Feature flag enabled in staging
-->

## Method

<!-- THE TECHNICAL LANE — how to assess current state, identify gaps, and build the plan.
     This lane may run in parallel with Preconditions where safe, but execution milestones
     are gated by the corresponding preconditions above.

     Structure as assessment → gap analysis → prioritised plan, not as a fixed step list.
     The agent should read this and produce a plan tailored to the actual current state.

     Example sections:
     ### 1. Assess current state
     ### 2. Identify gaps
     ### 3. Produce prioritised plan
-->

## Gotchas

<!-- Refined by failure — add one entry per real failure encountered during a run.
     Format: what went wrong → why → how to avoid or recover.

     Example:
     - **Stale lock file**: running the migration while a previous lock was held caused
       a silent rollback. Always check for locks before starting. Recovery: release lock
       manually via {{COMMAND}}.
-->

## Example run

<!-- Link to a real session log, journal excerpt, or workline entry that used this playbook.
     Example:
     - [[journal/2026-05-12]] — first successful run; revealed the lock file gotcha above.
-->
