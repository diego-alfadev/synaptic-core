# Codex Stop curation candidate

Status: preparatory, opt-in adapter with synthetic tests. No host configuration is installed, no
native event or model execution is proven by these tests, and this is not a stable integration claim.

## What this automates

A synchronous Codex `Stop` command can request **one** continuation from the existing host model.
The continuation asks it to interpret a bounded list of already-saved journal/playground sources,
persist a useful source-grounded summary/decision record, and save provenance plus an artifact hash.
A later command invocation checks actual files, hashes and structural scope before recording the
outcome. Different continuation `turn_id` values are supported through a pending session request.

The result is explicitly `artifactKind: curated-draft`, `promotionState: not_promoted`. It is retrievable
from its fixed playground path and `status`, including in a fresh session. This is **curation of a
saved-source draft**, not automatic wiki consolidation, promotion, semantic correctness or complete
conversation retention. The adapter never calls a model API, launches a model process or exposes a
write MCP tool. The existing host model and its permissions execute the requested continuation.

**Input coverage is only the explicit saved source files.** The default is `journal/_current.md`.
Unsaved chat facts are not covered; some other permitted mechanism or deliberate agent/user work must
first save them. The command does not parse transcripts or retain `last_assistant_message`, raw prompt
text or event bodies by default. Enabling this adapter does not remove that input prerequisite.

## Selection and prerequisites

The default profile is `assisted`: no work request or continuation is created. Continue to ask the
agent explicitly to capture/consolidate within project rules. If native curation was selected but its
inputs/permissions are unavailable, the command reports pending rather than silently claiming assisted
operation meets the selected capability.

This first candidate supports a project brain at `<workspace>/.synaptic`, Node command execution,
an existing readable BRAIN.md and saved sources, and permitted writes to its own state/output paths.
It does not install user/global configuration, change trust/permissions, or bypass enterprise limits.
The event `cwd` must resolve to the configured workspace root. Use the same explicit source selection
for Stop and status. Sources are brain-relative journal/playground Markdown paths, excluding scratch
and the adapter's own output. Root paths may contain Unicode and spaces.

Limits are eight selected sources, 32 KiB per source/64 KiB total, a 16 KiB result, 128 retained
requests, and a protected scope of at most 512 files/1 MiB per file. Limit exhaustion is visible pending;
the command does not silently drop old work or broaden permissions. A larger corpus may need the
assisted profile or a separately reviewed implementation. Missing commands/events cannot produce an
automatic alert: status is an explicit observation, not continuously watched health.

## Command surface

Review the actual Codex version and command-hook configuration before any opt-in native drill. The
following is the command to configure as a **synchronous Stop command**, with fixed operator-chosen
paths and quoting appropriate to that host. It is not an installer or a ready-to-paste cross-shell
configuration:

```text
node /path/to/synaptic/tools/codex-curation.js stop --brain /workspace/.synaptic --workspace /workspace --profile native --source journal/_current.md
```

Codex supplies event JSON on stdin. Its documented fields include `session_id`, `cwd`, `turn_id` and
`stop_hook_active`. Only the first valid request returns `decision: "block"` with a bounded curation
instruction. In Codex this requests real continuation and acts as a new user prompt; it does not grant
extra approval or reject the original work. There is no second request when `stop_hook_active` is true,
when pending work already exists for the session, or when checked selected inputs are unchanged.
Prompt/agent hook types are not used.

```text
node tools/codex-curation.js status --brain /workspace/.synaptic --workspace /workspace --profile native --source journal/_current.md
```

Status distinguishes `missing`, `pending`, `no_change`, `structurally_checked` and `archived_pending`,
with observation time, the persisted artifact path and retained work/lock references. Selection is
separate from the last result. `nativeTrigger: unproven_by_adapter`, `hostInstallation: not_checked`
and `semanticQuality: not_checked` never become verified merely because flags, state or a receipt
exist. A successful structural outcome is scoped to the inspected files and time.

## Persisted result and checks

The request is in `playgrounds/curation/<request-id>/request.json`. It lists the source references and
SHA-256 values, result/receipt paths, required heading order and receipt fields. The existing model
writes `artifact.md` and `receipt.json` in that same request folder. The artifact must contain a useful
plain-prose record, not just an intention to curate; unsupported or approval-dependent changes remain
explicit limitations. The exact ordered sections are:

```text
# Curation result
Request: <request-id>
## Curated notes
<useful source-grounded summary/decision record, or a meaningful no-change explanation>
## Provenance
<relative source links and the exact source hashes from the request>
## Limitations
<uncertainties, semantic review and promotion/approval boundary>
```

The receipt binds the request id, `artifactKind`, `promotionState`, exact source hashes, persisted-byte
artifact SHA-256 and `outcome` (`curated-draft`, `no-durable-change`, or `approval-needed`). The checker
re-reads source/result files, verifies the request fingerprint and provenance links, rejects empty,
duplicate or reordered sections, and compares protected-file hashes. All brain files are protected
except adapter state, its own draft output area and git metadata; workspace AGENTS.md/CLAUDE.md, .github/copilot-instructions.md and the selected Synaptic VS Code hook file are
also checked when present. A changed/missing source, edited protected file, wrong hash or missing artifact is pending.
The adapter does not undo another process's edits.

### Coexisting with the capture floor

The capture-floor hooks keep writing while a draft is pending: a Stop marker under
`journal/_activity/` and a breadcrumb appended to `journal/_current.md`. Neither invalidates the draft:

- `journal/_activity/` is not in the protected scope.
- A selected source is recorded with its byte length. A source that only grew by appends still
  checks: its first recorded bytes must hash to the recorded value. Any other edit is
  `SOURCE_CHANGED`. Selected sources are judged only this way, not again as protected files. The
  receipt still lists `{ref, sha256}` per source, unchanged.
- Keep `journal/_current.md` among the selected sources (the default) while the capture floor runs.
  Otherwise its breadcrumb is an edit to a protected file and the draft goes pending.

`playgrounds/archive/` counts as one protected entry, `brain:playgrounds/archive`: the SHA-256 of its
sorted `path<TAB>size` listing, read with `lstat` only, so closed playgrounds never hit the 512-file
or 1 MiB limits. A symbolic link there is refused. Known gap: an edit inside the archive that keeps the
file size the same is not detected while a request is pending. Added, removed and resized files are.

This is structural evidence, not proof the model's interpretation is correct. Same-user files and
hashes are not a security sandbox against an agent deliberately forging state. Existing project
permissions, autonomy tiers, confidentiality and review remain necessary. No knowledge, persona or
guardrail promotion/edit/delete is authorised by the continuation. The command itself writes only
its bounded state/request area; model-side output scope is observed afterwards, not enforced as an OS
sandbox. Global/outside-workspace edits are not claimed to be monitored.

State lives under `.curation-state/`; request evidence and artifacts remain in the playground.
These may contain private file references or source-derived knowledge. Keep them within the brain's
storage/confidentiality policy and review git/sync exclusions yourself; no automatic configuration,
upload or commit is performed. Source hashes do not conceal file names or make an artifact public-safe.

## Pending work and explicit recovery

Pending requests, drafts and receipts are retained, not silently discarded. Status enumerates retained
requests so an older failure remains discoverable after a later result. A stale source invalidates that
request; editing the receipt cannot make the old source current again. On an explicit owner decision,
archive the unresolved request while keeping every artifact:

```text
node tools/codex-curation.js archive --brain /workspace/.synaptic --request <id> --reason "Owner reviewed stale input; retain evidence and start from current sources"
```

Archive is not success, promotion or an automatic retry. The same original/continued turn cannot
request a second pass. A later original turn may create a new bounded request. The curation continuation
must not invoke archive/recovery as a way to bypass its one-attempt boundary.

A killed observer can leave the brain-global observer lock. It is never removed automatically. Inspect status, verify
the observer is stopped, and explicitly remove only the hash-pinned runtime lock:

```text
node tools/codex-curation.js recover-lock --brain /workspace/.synaptic --lock <lock-id> --expected-sha256 <observed-lock-hash> --confirm-owner-stopped yes
```

The command refuses changed locks and a recorded PID that is still alive. Operator confirmation is
still necessary, especially for corrupt lock metadata or PID reuse. Work/evidence is preserved. If
state itself is corrupt, retain a copy and request diagnosis; do not edit success markers or erase it
to manufacture a verified outcome.

### Retention limit and owner-managed rotation

The 128-request cap counts **all** historical requests, including completed and explicitly archived
ones. It is not a rolling window. At capacity, changed inputs produce visible `REQUEST_LIMIT` pending
instead of another continuation. Status exposes retained count, limit and exhausted capacity; the last
valid result may remain readable as historical evidence, but that does not mean new work can run.

No automatic pruning or rotation is implemented. The owner maintenance route is deliberately explicit:

Stop observers use one brain-global lock for their short check/admission operation; the lock is
released before the host model continuation runs. Concurrent sessions cannot both reserve the final
capacity slot. A busy observer reports pending without requesting continuation. Status reports the
actual retained count and makes any legacy/corrupt overflow explicit; it includes up to 512 retained
records and declares truncation plus the inventory directory if more exist, rather than hiding extra
work behind the 128-request admission cap.

1. Disable the native adapter through the host's normal controls and confirm no observer is running.
   Inspect all retained pending/archived work and keep any unresolved decisions visible in the owner
   handover; reaching capacity is not permission to discard them.
2. Make and verify a private, restorable snapshot of `.curation-state/` together with
   `playgrounds/curation/`, preserving their original relative paths and a handover index of pending
   artifact locations. Archive/move that pair only after owner review. Do not edit source knowledge,
   manufacture success records, or delete the evidence. An archive can stay outside the active brain
   under the same confidentiality policy.
3. With the evidence safely archived, explicitly re-enable a fresh state/output area and run a small
   synthetic drill. Its new state cannot claim the archived history as newly verified; restore the
   preserved pair if the drill fails. After rotation, one unchanged source set may be reconsidered
   because the old dedup state is now archived.

This is operator-managed maintenance, not a tested transactional rotation tool. A claimed stable native
profile must demonstrate its recovery/retention journey on the selected host; the preparatory adapter
does not imply that journey has passed.

## Acceptance still required

`node tests/codex-curation.test.js` uses synthetic event input and hand-authored result fixtures. It
checks bounded continuation, changed-source no-op/recovery, state/artifact binding, path confinement,
raw-input non-retention, interruption visibility and structural rejection. It does **not** invoke a
live model or prove a native event.

Before the narrow native profile can be claimed verified: opt in on an isolated synthetic workspace,
observe a genuine Stop event requesting the permitted model continuation, inspect a meaningful persisted
result and provenance, observe checker failure cases, then retrieve the result from a genuinely fresh
session. Record host/harness/version/config/time and independent semantic review. Broader stable
wiki-maintenance claims remain blocked while this candidate produces drafts only.

Official source (checked 2026-11-07): [Codex command hooks, Stop](https://learn.chatgpt.com/docs/hooks).
