# Minimum local Cortex

This is an optional, read-only runtime candidate. Brain Markdown files remain authoritative and the
CORE skill does not invoke this runtime. No model, network access, service or background daemon is
required. Existing tools continue to support Node 18; this SQLite cut is tested on Node 24 with FTS5.

```sh
node tools/cortex.js /path/to/.synaptic status
node tools/cortex.js /path/to/.synaptic search "current decision"
node tools/cortex.js /path/to/.synaptic read knowledge/topic/decision.md
node tools/mcp/server.js /path/to/.synaptic
```

Use `--no-sqlite` for direct current-file lexical search inside Node. A missing node:sqlite capability
falls back to that path automatically. With no Node, read BRAIN.md, the journal and MOCs and search the
files using the host's own tools: the runtime-free CORE floor. These are different fallback levels.

The default FTS index is in-memory. `--cache-dir /existing/private/directory` explicitly opts into an
owned SQLite cache file in that directory. Caches contain derived knowledge text and must respect the
brain's confidentiality and storage policy. Nothing creates, commits, uploads or synchronizes a cache
directory automatically. A corrupt or inaccessible cache degrades to current-file lexical search;
the runtime does not delete a corrupt file. Each process rebuilds its first index from current files;
subsequent searches fingerprint current content and confirm every returned hit against disk.

Search returns a capability declaration. The SQLite path is ranked (uncalibrated BM25); the fallback
is unranked. Scores are never comparable across providers. No status/lifecycle label hides a node.
A note Cortex cannot serve never takes the rest of the brain down. `search` and `status` keep answering
from the readable notes and list each excluded entry in `skipped: [{ref, reason}]`: invalid UTF-8 or
UTF-16 (`DOCUMENT_INVALID_ENCODING`), over 1 MiB (`DOCUMENT_TOO_LARGE`), a symbolic link or junction
(`SYMLINK_REF`, never followed), the later of two notes with the same basename (`DUPLICATE_NODE_ID`),
a `scratch` folder in any letter case (`EXCLUDED_SCRATCH`) and an unreadable folder. Then `degraded`
includes `documents-skipped`; it is a comma-separated list of reasons, or `null`. `nodeCount` counts
readable notes. Edge, orphan and MOC-reachable counts are `null` while anything is skipped, because the
shared graph reader cannot exclude those files. Repair the corpus rather than relying on the skip. An
explicit `read` of a bad or outside ref is still an error; the CLI and `brain_read` print `CODE: ref`.

The MCP surface supports newline-delimited stdio JSON-RPC for protocol 2025-11-25, initialize/initialized,
ping, tools/list/call and resources/list/read. `brain_status`, `brain_search` and `brain_read` delegate
to the same core-lib/retrieval port as the CLI. Each tool names its direct-file CORE procedure.
Read resources are faithful UTF-8 text from the current file. User-controlled refs are relative
Markdown paths within the brain; hidden paths, scratch folders and symlinks/junctions are rejected.
No HTTP transport, write tools, sampling, subscriptions, prompts or universal client compatibility
is claimed. Host installation and fresh-session boot tests remain separate from protocol smoke tests.

Local validation: `node tests/core-conformance.test.js`, `node tests/cortex.test.js`, and
`node tests/mcp.test.js`. Golden fixtures explicitly define counts/status visibility; actual stdio
tests exercise lifecycle, schema enforcement, confinement and MCP termination. The kill test proves
direct files remain accessible; it is not a claim that every host automatically changes tools.

Implementation contract: [ADR-004](../architecture/adr-004-local-cortex-cut.md). CORE procedures:
`standalone/synaptic/references/contract.md` and `references/audit.md`. See the official
[MCP stdio](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports) and
[lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle) specifications.
