# What happens, when, and how

Operating contract for the unreleased candidate. Host execution requires its own evidence.

Synaptic keeps knowledge in files. Your host supplies the agent and any permitted triggers/tools.
At setup, choose a working mode that matches what that environment actually allows and verifies.

For each behaviour ask four questions: **who executes it, what launches it, what proves it worked,
and what happens if it cannot run?** A language model can be part of an automated workflow;
automation comes from a real trigger and observed completion, not from whether the executor is code.

## If MCP cannot be installed

Use files and skills. If native hooks are permitted and proven, they can record activity without MCP.
If Node commands are permitted, CLI tools can read/search/check without MCP. Assess each separately.
If neither is available, capture and curation remain explicit agent actions. Describe that mode clearly.

MCP connects tools to a host; it does not itself activate capture or make the model maintain knowledge.
An optional component that is off is not broken. A required capability that failed must not be hidden
behind an apparently successful setup.

## A useful setup receipt

An illustrative receipt might say:

- Knowledge files: read/write checked at the recorded time.
- Capture: agent-driven; automatic event capture not enabled.
- Curation: requested explicitly; most recent saved result linked.
- Tools: direct files; optional CLI/MCP not enabled in this profile.
- Monitoring: explicit checks only; last-check time displayed.

Another verified host profile may add native capture, connected tools or an automatically triggered
curation workflow. It must name the observed trigger/result rather than reuse the same receipt.

## What "verified" means

A check passed for a specific host, configuration and time. It is not a promise of continuous health.
Without an executable observer, a later disconnect can remain unnoticed until the next check.
Setup and diagnostics must show that limit rather than claim automatic warnings that cannot run.

## Upgrade and resume

Start from one exact release/candidate. The agent stages and verifies that complete bundle, discovers
your existing brain, presents the change and applies recoverably. Your current knowledge and journal
stay in place. Installation, instruction loading, capture and tool connection each get their own checks.

A fresh-session resume proves the agent used retained evidence. It does not prove every future fact
will be captured, or that all model judgments are correct. Keep source links and reversible changes.

## Automatic curation and the stable release gate

The first stable release must demonstrate at least one supported profile where a real event starts
model curation, the agent saves its result, a checker verifies persisted output, and failures remain
visible. Restricted profiles may remain assisted. An optional Codex adapter is being prepared;
its synthetic tests alone cannot satisfy this gate. The model still makes semantic judgments.

The first adapter targets selected saved source files and produces a curated draft. It does not
retain every conversation message or promote the whole wiki automatically. Getting an unsaved fact
into those source files remains separate capture work; that dependency must be visible in setup.
