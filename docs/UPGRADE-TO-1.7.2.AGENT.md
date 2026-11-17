# Enter the 1.7.2 upgrade from an older engine

This is an instruction the owner gives to the existing agent, before invoking the installed
`/synaptic-upgrade`. It is not an installer. It needs one owner-selected complete package and
the owner's existing permitted file tools. Do not fetch a floating branch or infer permission
from this document alone.

## Why the entry instruction matters

The released 1.6.0 entry point runs its own host detection first. A change shipped only inside
1.7.2 cannot retroactively change that installed procedure. Therefore a bare invocation of the
old command is not the supported handoff. The owner directs the agent to the new package's
procedure first. The acceptance record must state which entry was used; never claim that the
unmodified old command has acquired the new routing by itself.

## Paste to the agent

Replace the package path with the exact complete package you selected. Review its provenance
and digest through the intended source before execution. This prompt authorises read-only
preparation; it does not pre-approve a live installation or configuration change.

```text
I want to prepare an upgrade of this existing Synaptic brain to the complete package at:
<absolute path to the selected verified package>

Read that package's docs/UPGRADE-TO-1.7.2.AGENT.md and
standalone/synaptic/references/package-install.md before invoking any installed Synaptic
command. Use the selected package's entry dispatcher, not the old engine's host-detection
or repair procedure. Do not run the old /synaptic-upgrade first.

First inspect only what is needed to identify the existing brain/schema, selected carrier,
scope and safe package destinations. Preserve the existing harness and assisted/off choices.
Authenticate and verify the complete selected package with trusted existing capabilities;
never execute a received verifier before checking its trust bootstrap.

Prepare a concrete diff, exact destination list, fresh byte-preserving preimages including
absent targets, and rollback. Every outside-brain destination must be named by a supported
adapter. Show that plan before applying it. If the adapter is unknown, stay at the safe L1
baseline and offer user-paste guidance only; do not guess configuration or skill locations.

After I approve the exact plan, install only that selected package, then explicitly reread
the installed SKILL.md and its selected references. Only the new engine then runs host
detection. If rereading or any prerequisite fails, report installed versus pending state
and stop dependent changes; do not fall back to old-engine detection or mixed-source files.

An effective scope-safe L1 bridge completes baseline setup. Missing optional levels or
loading proof never cause repair. Do not request a ping or a fresh chat. Keep L3/L4 declines
terminal until I explicitly re-run init. Report actual evidence separately from configured
files, with no claim of fresh loading, hook firing, MCP discovery or model curation.
```

The approval above is for the concrete plan when the owner supplies it; an agent must not
interpret the quoted future approval as approval already given. Existing explicit session
authorisation for the same exact plan remains valid. Never modify persona or guardrails as a
side effect. Repeating a completed same-source upgrade should propose no new deployment;
retain loading observations as evidence, not as permission to repair.

## Acceptance record

Use an isolated synthetic workspace on the actual target host. Retain the entry prompt, old
engine identity, selected package commit/digest, proposed plan, approval, tool trace, backup
and changed-file inventory. Observe that new-engine reads precede new host detection.
Repeat init/upgrade and audit as separate observed operations. A script that copies files,
a source-contract assertion or a test agent pretending to be another host does not establish
this acceptance. A separately owner-requested fresh-session `synaptic ping` tests only the
loaded carrier token and must occur before any tool/file reads.
