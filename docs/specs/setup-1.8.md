# Synaptic 1.8 setup implementation specification

Status: owner-selected implementation scope, 2026-11-17. This specification defines the focused 1.8 build. It does not claim publication, live-host acceptance or approval to change an active installation. Brain schema remains 1.0; setup records are operational metadata and must remain tolerantly readable by existing procedures.

## Product outcome

A user can ask how much of Synaptic is configured in a declared environment, what has actually been observed and what remains to reach their selected target. An effective scope-safe bridge remains a successful baseline. The target can remain incomplete without blocking memory work or triggering automatic repair.

The first deterministic integration is bounded to VS Code project workspaces with a declared Copilot or Local harness. It reuses the existing project helper and package verifier. CORE provides the same inspection and review procedure through ordinary file tools, with no additional runtime, daemon or MCP requirement.

## Accepted scope and decisions

- Implement scoped diagnostics, independent capability targets, bounded setup completion and owner-local custom adapter review.
- Recommend the strongest known supported, permitted and compatible configuration. Preserve existing owner selections and refusals. An unknown permission is not permission to enable a capability.
- Re-offers belong to explicit setup/upgrade reviews after relevant changes or an explicit completion request. Ordinary boot reads memory without discovery, prompts, configuration changes or retries.
- Each consolidation includes a short passive setup-pending notice drawn from the known setup pool. The notice keeps gaps visible; it never asks for approval, starts repair or opens a setup workflow.
- Accept custom adapters locally through owner review of a named revision. Applying any accepted adapter still needs an exact reviewed plan and fresh preimages.
- Defer cross-profile discovery/binding identity, machine-wide inventory and concurrent session-anchor storage to separately scoped work. A single-profile report discloses this coverage limit.

This supersedes the archived proposal's per-session discovery and “not now” prompt loop for this build. The 1.7.2 release and its outstanding host observations remain separate.

## Architecture and reuse

The public optional CLI is `tools/setup.js`. Its `inspect` and `recommend` operations read without altering the workspace, configuration or setup history. `prepare` creates a new private plan outside the workspace/package; it does not apply that plan. The VS Code transaction continues to own exact destination checks, preimages, receipts and rollback. No general installer or host process is introduced.

Use [the package verifier](../../tools/package-release.js) for inventory/content checks and [the VS Code helper](../../tools/vscode-integration.js) for supported project preparation. A receipt matching its installed files proves content consistency; trusted provenance additionally requires an independently trusted source or digest. Never execute unverified package helpers merely to inspect package metadata.

Use the standalone [diagnostic procedure](../../standalone/synaptic/references/setup-diagnostics.md) as the semantic contract for CORE. Optional deterministic code enforces only the checks it implements; procedural fallback must disclose its enforcement limits.

## Inspection contract

Every report identifies the workspace, declared host/harness, profile/session where known, adapter revision, check time and observer mode. Record whether values were inspected, owner-declared, inferred or unavailable. Context JSON is a declaration channel, not authenticated runtime or loading evidence.

List the files/configuration layers inspected and the layers excluded or inaccessible. A project carrier's presence does not establish effective precedence across user, remote, policy and other host configuration. Report partial or unknown configuration when those layers cannot be resolved. Do not read authentication material to identify an account or profile.

Separate these results:

| Dimension | Required meaning |
| --- | --- |
| Installation | Installed inventory/content, engine/source metadata, trust basis and check outcome. Same-version files still need content checks. |
| Configuration | Known carriers, overrides, selected options and actual files. Label their scope; do not call uninspected precedence effective. |
| Support | What this adapter can prepare, dependency/conflict constraints and what the declared environment permits. Unknown support remains unknown. |
| Target | Recommended compatible capabilities and the independent owner-selected target. An unknown legacy target is not automatically the current configuration. |
| Execution | Dated observations tied to the relevant host, harness, profile, configuration and session. File presence is not execution. |
| Freshness | Evidence age, applicability to inspected identities/fingerprints and a reason when unknown or historical. A recent timestamp alone does not make evidence applicable. |
| Recovery | Pending transaction/failure references and next safe action, without replaying apply or modifying records during inspection. |

Capabilities are `files`, `skill`, `commands`, `capture`, `curation` and `mcp`. These are independent semantic categories, not one ladder. For example, a skill may be present without a discovered menu, and native capture need not use MCP. The current VS Code helper does not configure MCP or a per-operation command menu. Local native-event configuration is outside the current helper's implemented dialect. Show those limits instead of recommending unsupported writes.

The CLI's native recommendation is a candidate based on the implemented Copilot dialect and supplied permission declarations. It does not validate compatibility with the target editor/extension versions or demonstrate genuine event firing. Keep target-version compatibility unknown until independently established; do not describe the recommendation as a new host-support claim.

Do not infer initial model-context loading from file reads, hook firing from registration, host MCP connection from a server entry, or semantic quality from a structurally valid artifact. Genuine observations remain separate from metadata supplied through a context file. Historical evidence remains available when current applicability changes.

## Target selection and preparation

Explicit setup first inspects the declared boundary and computes a recommendation. Existing choices remain selected unless the owner changes them. A new target may select fewer capabilities than recommended. Support, permission and compatibility must be known before offering their concrete configuration; unmet required capabilities remain visible rather than silently becoming assisted/off.

The target file consumed by `prepare` selects the capability categories. The CLI validates its supported combinations and maps the actionable subset to the existing helper's runtime/capture/curation choices. Deferred or not-offered capabilities remain selected but are excluded from that configuration plan; a declined capability cannot simultaneously be selected. It rejects unsupported host wiring rather than inventing paths. An actionable subset with skill false or commands/MCP true requires another adapter; deferred commands/MCP may remain in the outstanding target without being configured. Preserve an existing chosen runtime when preparing assisted capture/curation; assisted operation is not a request to switch a previously selected Node runtime off. Target intent and planned configuration stay separate in the result and retained setup metadata.

The reviewed transaction persists `.synaptic/harness/setup/intent-vscode-<harness>.json` with format `synaptic-setup-record-v1`, harness, optional declared profile, declaration time, intent/decisions and the configured boolean snapshot. The snapshot is recorded setup state, not a later live inspection. A non-null profile that does not match the declared current profile, including when that identity is unknown, makes that record historical for the current report; do not borrow its target or notices. A null profile is shared project/harness intent and supplies no individual profile identity claim.

Preparation must produce the pinned package identity, exact create/replace/remove inventory, changed regions, fresh byte-preserving preimages including absence, candidate bytes, postconditions and rollback. A new staging directory is required outside the project and source package. Approval applies only to this concrete plan. Recheck current bytes immediately before apply; changed destinations, source or preimages require a new review.

Existing helper restrictions remain real boundaries: competing skill carriers, ambiguous/global project bridges, unrecognised files and already-present native adapter material can require a separately reviewed migration. Diagnostics may explain those gaps; they do not bypass the restriction or imply that every installation can be completed by one automated prepare call.

The project inspector does not load retained plans or transaction receipts. For an already-known private plan, separately use `vscode-integration.js status` to inspect transaction state and planned-file drift. Its output remains plan-scoped evidence and does not establish host execution or effective machine-wide configuration.

## Recovery and pending visibility

Keep support, owner decision, configured state and last outcome separate. A configured capability can have a failed run. A failed attempt, missing record, deferred action and explicit refusal are different facts. Missing history means unknown history, not a refusal or proof that an offer never happened.

Retain the last offer/event, scoped decision, deferred revisit condition, attempted plan/outcome and pending gap. A version change alone does not cancel a decline. A materially new option can be explained once during a relevant explicit review; materially new means changed mechanism, capability, permissions or cost. No automatic retry follows a failed optional level.

Consolidation reads the known setup pool without launching environment discovery. It emits one compact notice, for example: “Setup pending: capture deferred until hook-permission review. No setup action taken.” This notice uses the recorded intent/configuration snapshot; it does not assert current activation or infer missing loading evidence from that snapshot. Declined options are choices, not outstanding enablement work. If the pool is absent, unreadable or has unresolved scope, state that its pending status is unknown. If no pending items are recorded, say so within the inspected scope; this is not a claim of full activation or continuous health. Repeat this passive notice on each consolidation, without turning it into an interactive reminder.

Interrupted apply keeps its receipt, preimages and pending diagnosis. Restore only touched targets through the existing rollback contract; later edits require reviewed recovery. Never restore a whole older brain over newer journal or knowledge. A lock is diagnosis requiring explicit ownership review, not permission to remove another writer's lock.

## Custom adapter contract

Official, user-written and agent-generated adapters share these obligations:

| Operation | Required contract |
| --- | --- |
| inspect | Read only bounded, relevant sources; disclose scope, precedence limits and unknowns; avoid credentials. |
| capabilities | Declare supported combinations, versions, dependencies, policy/permission prerequisites, conflicts and observation limits. |
| plan | Enumerate exact owned destinations and regions, fresh preimages, candidate diffs, expected checks and recovery. |
| apply | Require accepted adapter revision and approved concrete plan; recheck preimages, preserve unrelated bytes and refuse drift. |
| verify | Check bytes/configuration separately from loading, native firing, connectivity and semantic review. |
| rollback | Restore only touched targets with current-byte checks; preserve later changes and retain partial recovery evidence. |

A CORE adapter can be a structured procedure based on [the adapter template](../../standalone/synaptic/templates/templates/setup-adapter.md). Validation checks completeness and bounded destinations; it does not authenticate arbitrary code or authorise writes. Review the actual procedure/code, run its confinement/preservation/drift/failure/rollback fixtures in an isolated workspace, then record owner acceptance of the exact revision and scope. Accepting an adapter and approving its concrete write plan are separate events. Until acceptance, the unknown-adapter safe limit remains in force. Inspection never dynamically loads or executes an untrusted adapter.

## Acceptance and evidence boundaries

| Layer | Required checks |
| --- | --- |
| Deterministic | Inspection/recommendation leave workspace and history bytes unchanged. Missing plan, incomplete package, unreadable/malformed data, duplicate carriers and symlinks produce scoped diagnosis, never false absence. Identical snapshots produce identical findings apart from check metadata. |
| Targets | Exercise baseline success with unmet target, unknown legacy intent, explicit lower target, deferred/failed/declined differences and incompatible selections. Do not enable unsupported MCP/commands/Local native hooks. |
| Evidence | Files cannot pass loading; manual invocation cannot pass native firing; MCP entries cannot pass connectivity. Changed fingerprints make evidence historical. Unknown profile/session cannot inherit another profile's proof. |
| Transactions | Reuse approved destinations, fresh preimages, drift refusal, CRLF/unrelated-byte preservation, interruption receipts, idempotent repeated apply and targeted rollback. |
| Custom adapters | Validate one isolated structured example and negative fixtures for missing operations, unbounded paths, unsupported claims and absent rollback. A valid descriptor alone cannot enable apply. |
| CORE | The standalone file procedure performs the same semantic inspection and review without a runtime, daemon or MCP. It discloses which checks were procedural. |
| Consolidation | Every consolidate emits one passive pool notice; it neither scans the machine nor prompts, retries, repairs, writes host configuration or changes a refusal. |
| Real host | Retain versions, restrictions and genuine host/session evidence for loading, discovery, native firing, host tool use and retrieval when those capabilities are claimed. Synthetic checks and context declarations do not satisfy these observations. |

Release preparation must label the observed implementation and its limits. No 1.8 publication or live installation follows from completing this local build. Real-host acceptance can remain unverified only when the published support claims state that boundary explicitly and the owner separately authorises release.
