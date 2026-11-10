# VS Code project integration candidate

Status: implemented preparation/transaction and synthetic adapter tests; no live editor, native event
or model execution proof. This candidate is project-scoped. The owner-run RC pilot records the actual
VS Code distribution, extension, harness/version and restrictions. It does not update the editor.

## Start with the working mode

The default is **files/skills, no MCP, no Node requirement on the target, assisted capture/curation**.
The agent reads and writes permitted files when requested. A skill can appear as `/synaptic`; this
helper does not generate six per-operation menu stubs. Ask for the operation and argument in ordinary
chat or after the discovered skill name, and verify routing separately.

The selected session harness is independent of the model. Current official documentation uses
`.github/skills/` for Copilot and Local project skills. Local discovery settings do not configure
the shared Copilot runtime. The full skill directory is needed, not SKILL.md alone.

## Prepare, inspect, then explicitly apply

Where Node is permitted, run the trusted release's helper against an existing synthetic project
brain and its independently authenticated complete package. A staging directory must be new and
outside the project and package. The helper never launches VS Code, downloads a runtime, configures
MCP, edits user/global settings, or changes trust/permissions.

```text
node tools/vscode-integration.js prepare --workspace /synthetic/project --package /verified/package --out /private/new-plan --harness copilot --runtime none
node tools/vscode-integration.js status --plan /private/new-plan
```

Inspect `REVIEW.md`, `plan.json`, candidate `files/` and archived `before/` bytes. The plan contains:

- The complete pinned skill in `.github/skills/synaptic/`, including its manifest/source receipt.
- One owned `BEGIN:SYNAPTIC` bridge in the effective supported project carrier, plus a scoped setup
  record. An existing bridge is replaced in place; surrounding user rules and persona are preserved.
- A nonce and an explicit profile, with loading, firing and semantic quality still needing proof.
- Only when independently selected: release-sourced runtime files and a proposed project hook.

```text
node tools/vscode-integration.js apply --plan /private/new-plan
node tools/vscode-integration.js status --plan /private/new-plan
node tools/vscode-integration.js rollback --plan /private/new-plan
```

Apply performs full preflight against fresh archived preimages and refuses changes made after
preparation. It records progress and verifies results. An interrupted/failed transaction remains
pending; it is not automatically resumed or treated as success. Rollback restores only touched
targets, refuses later edits and retains newer knowledge. It can leave new empty parent directories;
there is no recursive cleanup. A retained transaction lock is a busy/interrupted state for explicit
diagnosis, never an invitation to delete another writer's lock.

### Existing installs and scope conflicts

Recognised legacy `.github/skills/synaptic/` bundles without SOURCE.json can be staged when their
name/inventory is coherent, but their source remains **unknown**. Review the actual archived bytes
and explicitly accept that replacement:

```text
node tools/vscode-integration.js apply --plan /private/new-plan --accept-legacy yes
```

This does not authenticate the old bundle. Unknown extras, removed old files, competing
`.agents/skills/synaptic` or `.claude/skills/synaptic` carriers, duplicate/global/unreachable brain
bridges and existing adapter hooks/runtime require review before this helper proceeds. It is not
a universal multi-carrier upgrader. Use the selected package's source-pinned upgrade procedure to
archive/retire or reconcile the old carrier explicitly; preserve knowledge and unowned content.
Do not simply add another Synaptic skill and leave the old engine auto-discoverable. A global or
unreachable bridge is not permission to create a replacement project brain.

The helper checks the known project carriers `AGENTS.md`, `.github/copilot-instructions.md`,
`CLAUDE.md` and `.claude/CLAUDE.md`. A rejected global pointer means one found in those project
blocks; this is not an exhaustive inventory of user/global/remote instructions or their effective
precedence. The selected harness and agent must resolve those additional sources before applying.
An existing readable `BRAIN.md` with schema `1.0` is required; missing, pre-schema or unsupported
formats need a separate reviewed migration, without silently wiring a new brain.

## Optional Copilot native preparation

Select Node commands and each optional capability explicitly:

```text
node tools/vscode-integration.js prepare --workspace /synthetic/project --package /verified/package --out /private/native-plan --harness copilot --runtime node --capture counter --curation native --source journal/_current.md
```

This prepares `.github/hooks/synaptic-vscode.json` with Copilot's `agentStop` event. The dedicated
mapper validates camelCase `sessionId`, epoch-millisecond `timestamp`, `cwd`, `stopReason` and the
documented snake_case `stop_hook_active`. It derives its own request token from session/timestamp;
that is **not a native host turn id or proof that an event fired**. Changed continuation timestamps
do not grant a second curation attempt. Local's legacy hook payload/output differs; native Local
preparation is deliberately refused rather than silently borrowing another harness's format.

The optional counter records validated **adapter invocations**, including continuations, not unique
host turns, touched paths or semantic knowledge. It stores daily counts under the project adapter's
private state, with a 128-day-entry/one-million-per-day bound. A busy/interrupted counter lock or
exhausted bound is pending; nothing is auto-pruned. These files may sync with the project; review
their storage policy before applying. No upload, commit or ignore configuration is performed.

Native curation reuses the bounded shared draft checker: one continuation of the existing permitted
host model, explicit saved sources (journal by default), persisted request/draft/receipt and structural
checks. It never launches another model, adds write MCP tools, promotes knowledge or bypasses approval.
Unsaved chat facts are not covered. Semantic correctness remains a review question.

Only Copilot top-level `decision`/`reason` is emitted. A valid first request uses `block` to request
continuation. Pending work/errors emit `{}`, a sanitized diagnostic and exit 2 without another
continuation, according to the documented Copilot hook error contract. Real visibility and firing
still require the target-host drill. No Codex `systemMessage` output is assumed to reach this model.

## Status and proof

`status` is a new explicit observation, not a watcher. It compares planned files with actual bytes,
reports selected/off options and retained curation outcome, and never upgrades file presence or a
manually invoked command to fresh loading, event firing or model quality. User/global/policy hook
inventory is not covered. MCP stays not enabled; terminal availability is not a connected tool menu.

In a fresh intended session, prove the nonce before file tools, then source-based resume; invoke the
skill/operation with an argument, request useful assisted capture and resume it in another fresh
session. For optional native mode, prove a genuine event, meaningful model draft, subsequent checker
result, failure/pending cases and cold retrieval. Synthetic hand-authored fixtures are not that proof.
Without executable observation, disconnection can remain unnoticed until the next manual check.

No Node on the target? Follow the complete [standalone file-based guide](../../standalone/synaptic/references/vscode.md).
Its agent-managed copy/restore path is procedural, not this executable transaction.

## Primary sources (checked 2026-11-07)

- [VS Code instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions)
  and [harness-specific reference](https://code.visualstudio.com/docs/agents/reference/custom-instructions-reference).
- [Agent skills](https://code.visualstudio.com/docs/agent-customization/agent-skills) and
  [custom agents](https://code.visualstudio.com/docs/agent-customization/custom-agents). No custom agent is installed by this helper.
- [Hooks (Preview)](https://code.visualstudio.com/docs/agent-customization/hooks),
  [Copilot runtime reference](https://docs.github.com/en/copilot/reference/hooks-reference) and
  [legacy Local reference](https://code.visualstudio.com/docs/agents/reference/hooks-reference).

Documentation availability is not permission, version compatibility or live-host proof. Keep the
release gate closed until the agreed real-host profiles and automation workflow are demonstrated.
