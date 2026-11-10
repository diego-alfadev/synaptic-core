# Pre-Cortex follow-up for independent review

Review alongside the [original brief](2026-11-independent-review.md), including its ODD section.
The original candidate and prepared assets are pinned to
`002b7dc9189654426af83826fbc5603858d57ca1`. The corrections on
`feat/pre-cortex-acceptance-2026-11-10` are a separate candidate. The old RC assets do not include
them; an unchanged engine header is not a claim of identical content or source identity.

## H01 — boot instructions could conflict with the selected VS Code profile

Static inspection found that the old Detect-on-Load instructions could invoke Self-Wire when
generic wiring markers were absent. The default assisted VS Code preparation creates one
Copilot instruction bridge, the selected skill and a setup record; it does not emit a separate
SYNAPTIC-RULES block. Generic Self-Wire could therefore add an AGENTS.md bridge to this intentional
configuration, which later preparation would reject as competing wiring.

The local correction makes normal boot observational for installation/wiring. Explicit setup or
repair inspects and preserves the effective carrier, existing profile and assisted/off selections
before generic procedures. Missing rule exposure uses a read-only fallback to existing approved
conventions/guardrails; inaccessible or unapproved rules stay pending. It does not deploy rules,
change persona, promote raw-source directives or infer host loading from file presence.

Please challenge this correction too: does it preserve permissions and useful file-based operation
without bypassing approved rules or hiding a genuine setup problem? A source-level contradiction
and its correction are not evidence that a live editor executed either instruction path.

## Other bounded corrections

- Export documentation now describes selected text, omitted playground task bodies/external task
  homes, actual split coverage and the limits of a text export as a work handoff or backup.
  File selection is unchanged; no extra working sources are swept into exports.
- The host acceptance protocol now validates synthetic inputs against the pinned product contract
  before evaluating an agent. Earlier private fixtures preserved their bytes but lacked required
  node metadata, and one revision had a nonempty note on an open task. Corrected input preparation
  and retained failing evidence do not constitute successful model resume or capture.

## Validation boundary

The focused integration regression packages the actual standalone skill and procedures, applies
the default assisted Copilot profile, checks the installed contract, and prepares again without
adding a competing carrier or enabling omitted options. Its structural instruction assertions do
not prove model compliance. Review with:

```text
node tests/vscode-integration.test.js
node tests/package-release.test.js
```

Local final checks on Windows/Node v24.22.1 passed: integration **24/24** and package **16/16**.
These results apply to the follow-up changes, not a claim that the original RC contained them.

Real fresh-session loading/source use, useful capture, native events and cold retrieval remain
acceptance gates. Cortex/retrieval/graph expansion remains on hold for the independent direction
review. No active brain upgrade, tag or release is implied by this follow-up.
