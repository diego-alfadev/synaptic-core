# 1.7.2 — Baseline floor

Status: implementation candidate; not a release or live-host acceptance claim.

## Problem and scope

A missing setup record or loading proof can send an agent back through generic self-wiring,
even when an effective bridge already works. On an unsupported host, no amount of repeated
wiring can supply the missing adapter. Re-entering setup risks a second carrier, changes to
host configuration, and repeated proof requests.

This patch makes the safe baseline a successful result, preserves selected profiles and
separates configuration from evidence. Brain schema stays 1.0. Discover-and-auto-wire,
multi-binding identity, profile discovery and concurrent session anchors belong to 1.8.

## Required behavior

| Rule | Contract |
|---|---|
| R0 | An older engine acquires and installs one selected verified package, then reloads its entry point. Only the new engine runs host detection. |
| R1 | An effective, scope-safe L1 carrier is successful baseline setup. Optional skill, commands, hooks and MCP never block that result. |
| R2 | Adapter support is independent of `wired`; an unknown adapter is `limited`, maximum L1. |
| R3 | Missing proof and a failed optional level produce diagnosis, never repair or retry. Normal boot reads existing sources without modifying wiring. |
| R4 | `synaptic ping` returns the loaded token with zero tool/file reads. `synaptic status` is its 1.7.x compatibility alias. Init and upgrade never request either canary; a situation report is explicitly requested separately. |
| R5 | A deterministic `setup_id` derives from carrier id plus declared harness. Record adapter, wiring, L3/L4 choices and once-per-engine audit bookkeeping separately. A missing legacy record means baseline, not a search or repair request. |
| R6 | Outside-brain writes require a supported adapter's exact file list, fresh byte-preserving preimages, an approved plan and rollback. Unknown adapters produce user-paste guidance only after the leak/reach gate. |
| R7 | Audit reports unproven/limited once per engine using brain-local bookkeeping. If persistence is unavailable, disclose the limit and suppress repeats within the session. |
| R8 | L3/L4 choices use `declined`, `not-configured`, `configured`. Declined is terminal until the owner explicitly re-runs init. |

The leak/reach gate precedes recognition of L1 and generation of snippets: private/global
brain pointers never become an accepted project baseline in a committed or synced carrier.
Already-approved operating rules may be read from their existing sources without deployment;
unknown approval stays pending. An existing assisted VS Code profile keeps its selected
carrier, harness, skill location and optional capabilities.

## Verification and limits

`tests/baseline-floor.test.js` checks the shipped bundle, not a replacement synthetic skill.
Its filesystem scenarios create a private package from a temporary Git repository, install into
synthetic workspaces and retain the package's content checks. It checks no-record assisted
setup, unchanged settings/MCP/hooks, preserved CRLF and unrelated content, a second preparation
with no changed targets, repeated apply, profile preservation, refusal of a private/global
project pointer and rollback. It also checks entry-point and cross-reference contracts for
the prose-only paths, including unknown adapters and audit suppression.

These tests do not execute a host agent. In particular, they do not prove that an agent starting
from the real 1.6.0 skill reloads the new engine, that Pi obeys the baseline procedure, that two
live audits suppress an advisory, or that a real `synaptic ping` uses zero tools. Those require
separate host transcripts. A double preparation is an observation-only planner check; it is
not represented as a second live init/upgrade run. A passing suite is source and synthetic
transaction evidence, not behavioral acceptance of prose.

Before a supported-host claim, retain two init/upgrade and audit transcripts for (1) a real
1.6.0 entry point upgrading to this package on VS Code Copilot with no host record, and (2) an
unlisted host with a safe existing L1 bridge. Check the write inventory, no requested canary,
no automatic repair, terminal declines and bounded once-only diagnosis. Separately observe a
user-requested fresh-session ping before any reads.

## Provenance

Scope comes from the owner-provided `synaptic-discover-autowire-proposal.md`, revision 4,
2026-11-16, F1 R0–R8 and the 1.7.2 cases in F3. The owner selected implementation of 1.7.2 on
2026-11-17. Source baseline: public main `71d28e7`; released tag `v1.7.1` resolves to `977dee1`.
The earlier `0253d20` boot/profile work is not an ancestor of main: its relevant safeguards are
carried forward selectively. Its parent export documentation is not blindly replayed because
main now exports linked work documents.
