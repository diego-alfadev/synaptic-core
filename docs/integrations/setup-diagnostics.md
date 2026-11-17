# Scoped setup diagnostics

Synaptic 1.8 adds an explicit setup inspection and recommendation surface. The first deterministic scope is one existing VS Code project workspace with a declared `copilot` or `local` harness. It does not scan the computer, authenticate an account, discover every profile, launch an editor or provide continuous health monitoring.

The equivalent no-runtime procedure is [setup diagnostics](../../standalone/synaptic/references/setup-diagnostics.md). File-based CORE use does not need Node, a daemon, MCP or this CLI.

## Inspect without changing the setup

Run tools only from a trusted complete package. The optional CLI uses Node 18 or newer and built-ins only:

```text
node tools/setup.js inspect --workspace /synthetic/project --harness copilot
node tools/setup.js recommend --workspace /synthetic/project --harness copilot
```

For the Local harness, use `--harness local`. Supplying a model name is not selecting a harness.

An optional context file carries explicitly supplied environment declarations:

```text
node tools/setup.js inspect --workspace /synthetic/project --harness copilot --context /private/context.json
node tools/setup.js recommend --workspace /synthetic/project --harness copilot --context /private/context.json
```

Context values are not authenticated host observations. A declared version, permission or profile must retain that provenance; it cannot prove startup loading, native hook firing or MCP connectivity. Omitted, inaccessible or unresolved facts remain unknown. Do not put credentials or private transcript content in this file.

Example context, supplied by the owner rather than measured by the CLI:

```json
{
  "format": "synaptic-setup-context-v1",
  "source": "owner declaration",
  "observedAt": "2026-11-17T10:00:00Z",
  "hostVersion": "owner-supplied version",
  "harnessVersion": "owner-supplied version",
  "profile": "Work",
  "permissions": {
    "node": "allowed",
    "hooks": "unknown"
  }
}
```

`session` is optional. Permission values are `allowed`, `denied` or `unknown`. A supplied timestamp dates the declaration; it does not turn it into a host observation. Unknown hook permission leaves native options conditional rather than enabled.

`inspect` and `recommend` do not modify the workspace, configuration, setup history or audit-suppression metadata. They report their check time, selected scope, inspected sources, uninspected layers and reasons for unknowns. Installed receipts and the known intent record can contribute scoped evidence; neither is a prerequisite for readable memory or a diagnostic report. This inspector does not load retained private plans or transaction receipts. Check an already-known plan separately with `node tools/vscode-integration.js status --plan /private/known-plan`; that result remains plan-scoped byte/transaction evidence.

The output separates package content/integrity, known configuration, supported capabilities, recommended and selected target, execution evidence and applicability/freshness. A self-consistent source receipt is not independently trusted provenance. A project carrier's presence is not a complete effective user/policy instruction chain. Missing plan/metadata is a limitation to report, not permission to create records or repair.

Native recommendations are candidates based on this adapter's implemented Copilot dialect and the supplied permission declarations. The inspector does not validate target editor/extension version compatibility; that remains unknown until independently established. An allowed declaration, candidate recommendation or staged hook is not a current-host support or execution proof.

## Select a target and prepare a concrete plan

Targets select independent capability categories: `files`, `skill`, `commands`, `capture`, `curation` and `mcp`. Choose the supported compatible combination after inspecting the recommendation and permission constraints. Preserve existing owner targets and refusals; recommendation is not consent.

Example target with native capture still selected but deferred pending permission review:

```json
{
  "format": "synaptic-setup-intent-v1",
  "selected": {
    "files": true,
    "skill": true,
    "commands": false,
    "capture": true,
    "curation": false,
    "mcp": false
  },
  "decisions": [
    {
      "capability": "capture",
      "state": "deferred",
      "at": "2026-11-17T10:00:00Z",
      "reason": "Hook permission review pending",
      "revisitOn": "permission-change"
    }
  ]
}
```

This target records intent, not approval to configure capture. `files` is true for this file-based setup; all six selected fields are booleans. Optional decisions use `deferred`, `declined` or `not-offered`, with timestamp and reason; revisit conditions are `permission-change`, `adapter-change` or `explicit-request`. Deferred/not-offered selected options remain outstanding but are excluded from the present configuration plan. A declined option must have its selected field false; conflicting target data is rejected. A failed operation belongs to its attempt/outcome evidence, not a fabricated decline. An explicit `not-offered` entry requires known offer history.

```text
node tools/setup.js prepare --workspace /synthetic/project --harness copilot --context /private/context.json --package /verified/package --out /private/new-plan --target /private/target.json
```

`prepare` validates the selected target and uses the existing VS Code project planner. Its staging directory must be new and outside the project and source package. Preparation changes no active configuration. It produces exact candidate files/preimages and a plan for review; it does not install the strongest recommendation automatically.

The current helper can prepare a pinned project skill, one project bridge and independently selected Copilot-native capture/curation configuration using its implemented dialect where runtime and hook requirements are declared permitted. Target-version compatibility and actual firing still need separate validation. It does not configure host MCP or per-operation command menus; Local native hooks are not implemented by this helper. Unsupported actionable targets are rejected rather than silently lowered. A scope-safe baseline can succeed while a selected capability remains outstanding.

Preparing native configuration requires declared `node` and `hooks` permissions to be `allowed`. In the example above capture is deferred, so the planner can prepare the files/skill subset while preserving capture in the outstanding target; it must not configure capture as though permission had been granted. The existing planner always includes the pinned skill. An actionable subset with skill false or commands/MCP true fails with `TARGET_REQUIRES_ANOTHER_ADAPTER`. Deferred commands/MCP may remain selected as outstanding intent without being configured. Use the reviewed CORE file procedure for a baseline-only choice rather than silently adding unwanted optional setup. Assisted preparation preserves an existing chosen runtime; it does not switch a previously selected Node runtime off merely because native capture/curation is not in the current actionable subset.

The plan includes `.synaptic/harness/setup/intent-vscode-<harness>.json` with the selected target/decisions and a configured boolean snapshot. Apply persists it through the same reviewed transaction. That snapshot describes the recorded setup, not live activation. It retains the declared profile and declaration time when supplied. A non-null recorded profile must match the declared current profile; mismatch or unresolved current identity makes it historical rather than a source of borrowed target/notices. A null profile represents shared project/harness intent, not individual identity proof.

Review `REVIEW.md`, `plan.json`, candidate `files/` and archived `before/` bytes before approving any change. Once the owner approves the exact plan, use the existing transaction commands:

```text
node tools/vscode-integration.js apply --plan /private/new-plan
node tools/vscode-integration.js status --plan /private/new-plan
node tools/vscode-integration.js rollback --plan /private/new-plan
```

These commands retain the [VS Code transaction and recovery limits](vscode.md). Current-byte drift requires replanning. Competing skill carriers, existing native adapter material, unknown extras and ambiguous/global project bridges may need a separately reviewed migration; this interface does not make the helper a universal upgrader. Rollback only restores touched targets and refuses later edits. Keep interrupted receipts/preimages and diagnose retained locks explicitly.

## Pending work remains visible

Deferred, failed, unsupported and explicitly declined mean different things. A failure or omission never becomes a permanent rejection. A configured capability can have failed execution. Keep owner-selected intent, actual configuration, last attempt/outcome and evidence separately.

Setup completion is revisited by explicit request or a relevant change during an explicit setup/upgrade review. Version bumps alone do not reopen a decline. Ordinary boot performs no discovery, prompts, configuration changes or retries.

Each consolidation emits one passive notice from the already-known setup pool, such as “Setup pending: capture deferred until permission review; no setup action taken.” It never starts setup, asks for consent, retries a failed plan or overrides a refusal. An absent/unreadable pool means unknown pending status. No pending rows in the inspected pool does not prove full activation or current health.

For a separately requested notice, the optional CLI reads saved intent without starting environment inspection:

```text
node tools/setup.js notify --workspace /synthetic/project --harness copilot
```

`notify` reads only the saved intent record and its configured snapshot. It does not check current files or continuous health. The CORE consolidation procedure reads the known intent directly. It does not automatically launch this CLI, acquire a runtime or inspect the machine to produce its passive notice.

## Custom procedures and honest evidence

Use the [adapter review template](../../standalone/synaptic/templates/templates/setup-adapter.md) for a custom CORE procedure. Every adapter origin must define inspect, capabilities, plan, apply, verify and rollback; disclose exact destinations, fresh preimages and preservation/recovery rules; and pass isolated negative fixtures. The owner locally accepts one named revision and scope. Concrete-plan approval remains a separate requirement. Validation never executes an untrusted adapter or grants permission merely because a descriptor says `supported`.

The optional descriptor checker takes JSON source data, never executable adapter code:

```text
node tools/setup.js adapter-check --descriptor /private/adapter.json --workspace /synthetic/project
node tools/setup.js adapter-check --descriptor /private/adapter.json --workspace /synthetic/project --acceptance /private/acceptance.json --targets /private/targets.json
```

The descriptor has format `synaptic-setup-adapter-v1`, an id/revision/origin, project scope, declared host/harness combinations, exact project-relative read/write paths, all six procedure texts and limitations. The template contains an illustrative JSON shape. `--targets` supplies a JSON array of exact relative path strings to check against the declared write allowlist. Validation rejects malformed/unbounded paths and incompatible descriptor/acceptance data; it does not check actual filesystem ownership, policy, preimage freshness or procedure semantics on the strength of that array.

Acceptance JSON uses format `synaptic-setup-adapter-acceptance-v1`, `descriptorSha256` from the validated canonical descriptor, `acceptedBy: "owner"`, UTC `acceptedAt` and the exact canonical absolute `workspace` identity. Review before recording acceptance. The receipt represents supplied owner intent, not authenticated identity or an independent security boundary against the agent that can write it. A changed descriptor digest or workspace cannot borrow the receipt. The result keeps `writesAuthorised: false`, even with a matching receipt and target allowlist; a fresh exact plan and owner approval remain required. This checker does not make the VS Code planner execute a custom adapter.

Synthetic tests establish inspection findings, data transitions and file transactions. They do not prove a host loaded instructions, fired a native event, discovered/used MCP tools or produced useful semantic knowledge. Keep each such claim tied to a genuine dated host/session observation and applicable configuration. Context declarations cannot replace that evidence. No host integration is activated by running inspection or preparation.

Activation diagnostics are separate from the work-item situation report and the zero-read `synaptic ping` canary. Do not repurpose an installed token-only `synaptic status` alias into a tool-reading report.
