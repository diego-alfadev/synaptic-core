# ADR-004: minimum operational Cortex and CORE completion

Status: accepted direction; local implementation candidate, not a release. Date: 2026-11-07.

## Context

The current CORE candidate already contains work-item routing and hook liveness changes. The prior
Cortex spike is inspection-only and predates the capability-based retrieval contract. Its Node
grep adapter is a runtime implementation, not the runtime-free CORE floor. Maintaining new domain
behaviour twice in shell would grow the existing maintenance cost.

## Decision

1. Preserve the CORE file/prose path and schema 1.0. Complete situation reporting as prose and skills
   portability as data with read-only inspection. Keep existing shell capture coverage; add no new
   shell business logic.
2. Grow the existing shared graph module into a small core-lib facade: safe file reads, current
   knowledge documents, graph/metadata reuse. Verify deterministic behaviour against golden fixtures
   derived from the CORE contract before adding delivery adapters. Curation judgment remains prose.
3. CLI and MCP are sibling adapters over that library. The minimal MCP surface is read-only, stdio
   JSON-RPC: status, search, current-file reads and resources. No automated curation or write tool.
4. Implement a small owned lexical adapter with node:sqlite/FTS5. The existing spike is design evidence,
   not a source of verified code. Do not copy external QMD code or install QMD for this cut: that spike's
   external CLI/JSON assumptions remain unverified. QMD/full retrieval remains an optional future
   adapter. This resolves the first-cut provider choice without claiming an upstream capability is absent.
5. Probe node:sqlite and FTS5 instead of inferring capability from a version alone; probe private
   cache access only when persistent storage is explicitly selected (the default index is in-memory).
   Existing tools retain Node >=18; Cortex recommends Node 24 LTS with a verified SQLite capability.
   If SQLite is unavailable, direct current-file lexical search remains available within Node; without
   Node, the agent follows CORE prose. Keep these two fallback levels distinct.
6. Search validates hits against current source files. Derived caches may be discarded/rebuilt;
   errors, stale entries and a killed MCP process must never hide the CORE procedures.
7. Host adapters follow available evidence: Codex, Copilot, then Claude live verification as access
   permits. Host/model are separate axes. Templates do not authorise global configuration changes.
8. Use a host-neutral benchmark contract, synthetic fixtures and deterministic dry-run checkers.
   No paid batch and no comparison claim across changed models/settings.

## Scope and exit criteria

Local checkpoint: complete CORE candidate, conformance fixtures, CLI, lexical retrieval, real stdio
MCP smoke tests, and a private staged brain upgrade with a tested restore path. MemoryLog, embeddings,
multi-brain promotion and unattended maintenance are deferred. Keep MemoryLog's dual-write and
no-expire-unpromoted requirements when it is later implemented.

Tests must cover current-file reads, path confinement including symlinks, Unicode/spaced paths,
missing/corrupt caches, changed/deleted documents, malformed protocol input, and fallback. A small
purpose-built MCP stdio implementation may be used with explicit lifecycle/transport tests and a narrow
capability declaration. It is not a claim of support for every MCP client or protocol extension.

No release/tag/version bump, main merge, push or external publication occurs at this checkpoint.
CI and unavailable live-host proofs are listed as external landing gates, never inferred from local tests.

## Sources

- CORE procedures: the bundled contract, audit and fingerprint references; existing brain-graph module.
- Prior inspection-only Cortex spike: retained on the existing feature ref, not automatically merged.
- MCP lifecycle and newline stdio: https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle
  and https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
- Runtime capability: https://nodejs.org/api/sqlite.html
