# Synaptic

**Useful knowledge that survives the chat.**

Synaptic keeps decisions, lessons and playbooks in linked Markdown files you own. Your agent reads
those files to resume work and curates useful knowledge from it. Optional local tools provide
current-file search and structural checks. The files remain usable without those tools.

> **v1.7.0; brain schema stays 1.0.** Source CI, installation checks and real host acceptance are
> separate evidence. Cortex, VS Code integration and Codex curation are optional previews until the
> VS Code pilot and a demonstrated bounded automatic-curation profile. See [release notes](RELEASE-NOTES.md).

## Start or upgrade

Choose one exact release or candidate from the [releases page](https://github.com/diego-alfadev/synaptic-core/releases).
Give its page or complete local bundle to your existing agent and ask:

```text
Install or upgrade Synaptic from this exact release. Find my existing brain and project scope
first. Stage and verify the full bundle, show the changes, preserve my knowledge and rules,
then verify which capabilities actually work here. Do not install MCP if unavailable.
```

Use the prepared `synaptic-<version>.tar.gz` asset or an authorised local package. GitHub's automatic
Source code archives omit generated package receipts. The agent needs permitted file access;
downloading additionally needs network access. It must report a missing capability before relying on it.

Already have a brain? [Keep it and upgrade the engine](UPGRADING.md). Engine and brain-format versions
are separate. Updating the skill does not activate hooks or MCP.

For VS Code, follow [the project setup guide](docs/integrations/vscode.md). Start with the permitted
file-based profile; optional native hooks need their own actual-harness checks. Node users can stage,
apply, inspect and restore project wiring with the integration helper. A no-Node/no-MCP environment
uses the explicit assisted path; it is not labelled automatic.

## What works, and what starts it?

| Behaviour | Executor | Trigger and evidence |
|---|---|---|
| Resume retained work | Agent reads source files | Request or verified host entry; fresh-session resume drill |
| Record activity | Capture script | An enabled, genuinely fired native hook; persisted event evidence |
| Search, read and inspect | Optional Node CLI | Explicit invocation; result checked against current files |
| Expose read-only tools | Optional MCP server | Registered host connection; actual discovery and tool call |
| Curate useful knowledge | Agent | Explicit request, or a separately verified event-driven workflow; saved source-linked result |

**MCP is optional.** With no MCP, use files and skills. Native hooks and CLI tools can work
independently when permitted. Without verified triggers, capture and curation are assisted agent
actions. A configured file or an instruction to remember is not proof of automation.

Setup should show what is **verified as of a time**, **not enabled**, **needs checking**,
**unavailable here**, or **failed/pending**. Without a running observer, a later disconnect can remain
unnoticed until the next check. [How it works](HOW-IT-WORKS.md) explains these limits with examples.

## Daily use

| Operation | Purpose |
|---|---|
| Init | Initialise or wire an existing brain |
| Consolidate | Turn captured work into linked knowledge |
| Ingest | Distil an existing source |
| Audit | Diagnose structural problems |
| Maintain | Review and treat maintenance findings |
| Handover | Explain recorded work from its sources |

Invoke these as /synaptic-init, /synaptic-consolidate, /synaptic-ingest, /synaptic-audit,
/synaptic-maintain or /synaptic-handover. Command discovery depends on the host; ordinary requests
can invoke the same documented procedures. Model judgment remains fallible. Keep provenance,
bounded changes and a recoverable history.

## Optional local tools

[Cortex](docs/concepts/cortex-local.md) provides a CLI and read-only stdio MCP for current-file reads,
lexical search and structural status. It uses Node; its disposable index needs no model API.
No model-quality or cost advantage has been measured by the offline benchmark pilot.

The optional [Codex automatic-curation adapter](docs/integrations/codex-curation.md) is under preparation.
Its native-event acceptance must pass before support is claimed. Restricted environments may use
the assisted profile without installing a runtime or MCP.
The adapter curates selected saved sources into drafts; unsaved chat facts and wiki promotion are separate work.

## Learn more

- [Operating contract and release gates](docs/OPERATING-MODEL.md)
- [Concept map](docs/concepts/_index.md) and [brain reach](docs/concepts/reach.md)
- [Guide for managers and product owners](docs/FOR-MANAGERS-AND-POS.md)
- [Executable checks and evidence limits](tests/README.md)
- [Owner handoff: prepare assets and create a draft with gh](docs/RELEASING.md)
- [Changelog](CHANGELOG.md), [roadmap](ROADMAP.md), and [acknowledgments](docs/CREDITS.md)

MIT licensed. Contributions of bug reports, examples and verified host integrations are welcome.
