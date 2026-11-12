# Synaptic operating model — review baseline

Status: agreed product contract for the unreleased candidate; implementation claims remain scoped to observed evidence.
Validation sequence: model → implement the agreed subset → Codex here → GitHub RC → owner-run VS Code migration → stable.
Conceptual source of truth; host-specific acceptance evidence remains separate.

## One product, a declared working mode

Synaptic retains useful knowledge in user-owned files. Host integration determines what triggers
work, which tools are available and which checks can run. Setup explains the observed working mode
before the user relies on it. Optional components being off is a normal choice.

The baseline needs readable brain files and an agent able to follow its entry procedure. Capturing
knowledge also needs write permission. A read-only environment is labelled read-only, not ready for
capture. MCP, a new runtime and global configuration are not prerequisites for file-based operation.

## Four questions for each capability

1. **Who executes it?** Deterministic code, the host's model workflow, or an explicit human action.
2. **What launches it?** A request, a real native event, or an explicitly enabled scheduler.
3. **What was observed?** Evidence tied to brain/workspace, host/harness/version, config and time.
4. **What if it cannot run?** A declared alternative, a visible pending/failure state, or a stop.

Trigger and executor are independent. Model-based curation can be automated: an actual mechanism
must launch the work, a permitted model must execute it, and persisted output plus outcome checks
must be observed. "Remember to curate" is not that mechanism. Code on disk is not an event trigger.

## Independent capabilities

| Capability | Effect | Does not imply |
|---|---|---|
| Files | Persistent readable knowledge; writable when permitted | Loaded context, automatic capture, complete session retention |
| Instructions/skills | Host supplies an entry point; agent reads relevant sources | MCP connection, hook execution, correct semantic choices |
| Native capture | Mechanically records the configured event evidence | Complete path coverage, semantic summary or consolidation |
| CLI | Code performs read/search/check operations when invoked | Tool-menu integration or automatic invocation |
| MCP | Registered host tools can reach the domain interface | Capture, scheduling or semantic maintenance |
| Curation | Model interprets sources and persists linked knowledge | Deterministic judgment or lossless/universally correct memory |

The Cortex read/search CLI and MCP surface is read-only: it has no curation/write MCP tools.
The separate optional Codex curation adapter can request model-written results; it does not add writes to MCP.
The Codex build loop is external orchestration, not a maintenance daemon shipped by Synaptic.

## Working profiles

- **Files and agent procedures:** read, capture, consolidate and resume through explicit agent work.
  It can be a verified baseline while every optional component is off.
- **Native capture without MCP:** add tested events where allowed. Assess semantic curation separately;
  an event counter or changed-path breadcrumb is not curated knowledge.
- **CLI without MCP:** invoke deterministic tools through the host's permitted command surface.
- **Connected tools:** add verified MCP registration/discovery/use. Capture remains independent.
- **Automated curation (required in at least one supported profile before stable):** require trigger, permitted executor, persisted output, checks,
  bounded retries and visible pending/failure. Never silently discard unresolved work.

Do not silently downgrade a selected required capability to assisted operation. Explain the available
alternative and record the accepted profile. A no-MCP profile must not repeatedly attempt installation
or treat the omission as a broken setup.

## User-visible states and evidence

Describe knowledge access, capture, curation and optional tools. Put internal layer/port/shell details
behind diagnostics, not in the first-run path.

- **Verified as of …:** the scoped check passed, with date and evidence.
- **Not enabled:** an optional capability was not selected; this is not a failure.
- **Needs checking:** missing proof, stale evidence or configuration that is present but untested.
- **Unavailable here:** a known permission/capability constraint, with the available alternative.
- **Failed/pending:** an observed operation did not complete; show what remains and the next action.

Capability state and last-run result differ. "Files accessible" is not "agent loaded the brain";
topology status is not connection health. Internally retain selection/configuration, trigger,
executor/permission, evidence source/time/config fingerprint, observer mode, fallback and last outcome.
For model work retain persisted artifact/provenance and review outcome. An enable flag, manifest or
model self-report alone does not prove execution.

## Disconnection and honest observation

Verified means checked at a time and scope, not continuously healthy. A native observer detects
changes only while it actually runs. Without one, show last-check age and manual verification;
a disconnect can remain unnoticed until that check. Do not claim an unseen change automatically
invalidated a green label.

An observer for MCP availability must not depend exclusively on that MCP. Config changes invalidate
proofs when observed by a checker. No event observed does not prove no work happened. No executable
observer permitted means no guaranteed automatic alert.

SQLite→file-lexical fallback exists in current code. MCP→agent file-procedure recovery is a documented
path, not proven mechanical host failover. Keep that boundary until the adapter implements and tests it.

## Upgrade from the GitHub page

One owner path: choose the exact release/candidate, ask the existing agent to upgrade, receive an
installation result and a separate integration result. Keep deep details in a linked guide.

1. Pin files, metadata and migration references to one immutable release identity. A tagged entry
   point must never silently fetch the rest from main.
2. Resolve the existing brain, schema, host and scope before choosing destinations. An unreachable
   pointer is not a missing brain. Do not create another brain/global wiring to compensate.
3. Stage the complete bundle and verify before live writes. Preserve manifest/source identity.
   Same version must not skip completeness/content checks.
4. Present the bounded diff, archive fresh preimages and apply recoverably. Preserve newer knowledge,
   journal, persona and stricter rules; never copy a template or old pilot over live memory.
5. Test installation separately from loading, event firing, tool discovery and capture/resume.
   Report observed mode, proof date, off/unavailable options and any remaining manual action.

If downloads are blocked, accept an authorised locally supplied bundle. If Node/MCP/commands cannot
run, choose the permitted file route and state its verification limits. Do not bypass restrictions
or repeatedly retry denied capabilities. If minimum access is unmet, stop before changing the install.

## Validation and release sequence

1. Close the model; align README, upgrade guide, status language and release-note draft.
2. Implement the agreed behaviour/status/documentation subset before testing it. Existing candidate
   tests cannot prove unimplemented model behaviour. Package fixes may start here and are mandatory before RC.
3. Test Codex here on isolated synthetic data: real fresh-chat carrier proof, source-based resume,
   capture/consolidation and second fresh-session resume. An inherited subagent is not a fresh-host
   proof. No paid headless/API batch or client data. Native events/MCP are separate optional drills.
4. Resolve remaining package/upgrade blockers; prepare a clearly labelled GitHub RC for the pilot. Its public page
   is not a stable-integration claim. Shared version/source/artifacts stay immutable.
5. The owner migrates from that page with his own agent on the chosen VS Code environment. Record the
   actual distribution/harness/version and restrictions then. No editor update/test here now.
6. Stable needs the real journey, operating/failure cases and agreed automation criterion to pass.
   Failed pilots produce a new candidate, not a silent rewrite of the old one.

First-stable curation scope: **decided explicitly** — require one bounded automatic model-curation
workflow in at least one supported profile. A real native event must initiate permitted model work;
the agent persists a result and provenance; a checker verifies the persisted outcome. Exhausted
attempts, interruptions and failures remain visible with pending work retained. No unbounded retry,
approval bypass or raw transcript capture by default. Structural checks do not prove semantic accuracy.
Synthetic tests establish adapter behaviour; real event firing and fresh-session retrieval establish
the live acceptance evidence. Restricted profiles may remain explicitly assisted. MCP stays optional.

The first implementation candidate is an opt-in Codex Stop command adapter: the native event can
request one continuation from the existing agent, then check its scoped output. This is a build
choice, not a support claim. No host configuration/trust change or live activation is implied.

## Implementation and evidence boundaries

The source candidate repairs the previous bootstrap's implicit-main/live-write path: it prepares
one committed package, retains source metadata and verifies completeness/content before the agent
applies selected targets. Same-version content checks and same-source migration dependencies are
included. General package application remains an agent-run recoverable procedure. The VS Code helper
adds a bounded, explicit project-file transaction when Node is available: staged candidates and
preimages, current-byte checks, apply and targeted rollback. The no-Node path remains procedural.
Neither path can establish loading or native execution merely by installing files.

The optional Codex adapter has synthetic state/structure tests and creates unpromoted curated drafts
from selected saved sources. Native firing, model quality, cold-session retrieval and the host's
retention/recovery journey still need live evidence. It does not curate unsaved chat facts or maintain
the canonical wiki automatically.

The integrated engine identity is 2.0.0-rc.2; brain schema stays 1.0. CI results belong to their exact
source commit. Real host acceptance remains independent. Preparing source, workflow assets or a
project transaction does not create a release or satisfy the stable integration gates.
