# Setup adapter review template

Status: proposal, not accepted. Replace every TBD before acceptance. This is a structured CORE procedure, not executable configuration or authorisation to write. A machine-readable descriptor, when used, must satisfy the selected validator's schema in addition to this review.

## Identity and acceptance

| Field | Value |
| --- | --- |
| Adapter id and revision | TBD |
| Author and origin | TBD — official, owner-written or generated; origin grants no authority |
| Content fingerprint and source | TBD |
| Supported host and version range | TBD |
| Harness and version range | TBD |
| Scope and profile identification | TBD — how identified; unresolved identity must remain unknown |
| Private/portable record boundary | TBD |
| Owner acceptance | Pending — owner, date, exact revision and accepted scope |
| Acceptance limitations | TBD |

Acceptance applies only to this revision and scope. An actual configuration change still requires a reviewed exact plan and fresh preimages. A changed procedure, new destination or broader scope requires renewed review.

## Inspect

- Exact permitted read sources and why each is needed: TBD.
- Root/path confinement and symlink handling: TBD.
- Credential/authentication material excluded: TBD.
- Carrier/configuration precedence rules and primary evidence: TBD.
- Coverage exclusions, inaccessible layers and unknown-state rules: TBD.
- Output sources/timestamps and identity provenance: TBD.
- Confirmation that inspection creates no records, stamps, locks or repairs: TBD.

## Capabilities

| Capability | Supported combinations and versions | Permission/dependency/conflict | Observation and fallback limits |
| --- | --- | --- | --- |
| Files | TBD | TBD | TBD |
| Skill | TBD | TBD | TBD |
| Commands | TBD | TBD | TBD |
| Capture | TBD | TBD | TBD |
| Curation | TBD | TBD | TBD |
| MCP | TBD | TBD | TBD |

Distinguish documented support, known permitted configuration, owner-selected intent, actual configuration and observed execution. Do not call unsupported/unknown options enabled. The strongest recommendation must respect compatibility and permission limits.

## Plan

- Exact create/replace/remove destinations, resolved scope and owned regions: TBD.
- Preservation of unrelated bytes, line endings and stricter/user rules: TBD.
- Trusted immutable source/package identity and inventory checks: TBD.
- Private staging and fresh byte-preserving preimages, including absence: TBD.
- Before/after diffs, expected postconditions and permission/trust boundaries: TBD.
- Plan identity, expiry/drift checks, review presentation and rollback inventory: TBD.
- Setup intent/pending metadata affected, separately disclosed: TBD.

No wildcards, inferred profile roots or arbitrary shell commands may stand in for an exact approved destination inventory. Do not include private/global pointers in committed or synced project carriers.

## Apply

- Required owner acceptance and exact-plan approval evidence: TBD.
- Recheck current paths, source and preimage bytes immediately before change: TBD.
- Bounded operation sequence and progress/partial-failure receipts: TBD.
- Interruption, concurrent writer and retained-lock handling: TBD.
- Preservation and refusal rules for changed/unowned content: TBD.
- Explicit exclusions: no policy/trust bypass, runtime installation or new destination without separate review.

## Verify

- Deterministic inventory, byte/configuration and postcondition checks: TBD.
- Host loading observation source and applicability: TBD or unknown.
- Native firing, host tool connectivity and skill discovery observations: TBD or unknown.
- Source-grounded semantic output/retrieval review, when claimed: TBD or unverified.
- Evidence timestamp, identity/configuration fingerprint and historical retention: TBD.
- Baseline, selected-target gaps, failures and next safe actions: TBD.

File presence does not prove loading. Registration does not prove execution or connectivity. A manual adapter call is not a native event. Context declarations and valid syntax do not supply those observations.

## Rollback

- Fresh preimages/receipt locations and exact touched-target inventory: TBD.
- Current-byte validation and refusal to overwrite later changes: TBD.
- Reverse operation order and treatment of newly created targets: TBD.
- Partial rollback evidence, next action and retained backups: TBD.
- Newer journal/knowledge and unowned content preservation: TBD.

Never restore an older whole brain over newer memory. Do not recursively clean up unowned directories or remove another writer's lock.

## Isolated validation and owner review

| Check | Expected result | Evidence |
| --- | --- | --- |
| Read-only inspection snapshot | No changed source/workspace/configuration/history bytes | TBD |
| Missing/malformed/inaccessible source | Scoped unknown/reason; no false absence or repair | TBD |
| Unbounded/traversal/symlink destination | Refused before write | TBD |
| Unrelated content and CRLF | Byte-preserved | TBD |
| Changed preimage or plan | Refused; requires replanning | TBD |
| Interrupted apply | Pending receipt; no false success or retry loop | TBD |
| Rollback | Touched targets restored; newer/unrelated content retained | TBD |
| Later target edit | Refused automatic overwrite | TBD |
| Evidence separation | No presence-to-loading or registration-to-firing upgrade | TBD |

Owner review outcome: TBD. Structural validation outcome: TBD. Real-host observations: TBD. Keep these separate. A valid descriptor or fixture pass neither accepts arbitrary executable code nor approves live configuration changes.

## Optional descriptor shape

The following illustrates the optional validator's JSON shape. It is a synthetic review example, not an accepted adapter or implementation of its procedure. Replace its operation text with the reviewed environment-specific procedure and retain the full evidence above. Exact project-relative paths have no wildcards, traversal, absolute roots or symlink assumptions.

```json
{
  "format": "synaptic-setup-adapter-v1",
  "id": "example-project-bridge",
  "revision": "1.0.0",
  "origin": "agent",
  "scope": "project",
  "hosts": [
    {"host": "vscode", "harness": "copilot"}
  ],
  "readPaths": ["AGENTS.md"],
  "writePaths": ["AGENTS.md"],
  "operations": {
    "inspect": "Read only the declared file; report any unknown carrier precedence or scope without changing it.",
    "capabilities": "Limit this example to a project bridge; skill discovery, native events and MCP are not established.",
    "plan": "After resolving scope, prepare only an exact owned marker-block diff with fresh byte-preserving preimage and rollback; unresolved ownership stops planning.",
    "apply": "Require owner acceptance of this revision and separate approval of the exact plan, then recheck source, target and preimage bytes before a bounded write.",
    "verify": "Compare actual bytes with approved postconditions; leave startup loading and event execution unknown without genuine host evidence.",
    "rollback": "Restore only the touched owned target from its fresh preimage after checking current bytes; refuse later edits and preserve newer memory."
  },
  "limitations": [
    "Synthetic procedure shape; host behaviour and procedure semantics require review.",
    "Descriptor validity and a matching acceptance receipt never authorise configuration writes."
  ]
}
```

The checker returns a canonical `descriptorSha256`. An owner acceptance receipt binds that digest to the exact canonical absolute workspace using format `synaptic-setup-adapter-acceptance-v1`, `acceptedBy: "owner"` and a UTC `acceptedAt`. It records declared owner intent, not identity authentication. Keep private workspace paths in local receipts. Even a matching receipt and allowed target list return `writesAuthorised: false`; exact-plan approval, preimage checks and permitted execution remain separate requirements.
