<!-- summary: Compat-check wording and binding rules, and the host-setup detection shared by /synaptic-init and the /synaptic-upgrade routine. -->

# Host setup — compat-check and host-setup detection

> Read by `/synaptic-init` and the `/synaptic-upgrade` routine, and at boot only when the compat-check has to warn.

## Compat-check (warn-not-gate — v1-final §5.4)

The brain carries a **schema/format version** (stamped in `BRAIN.md`); this skill carries an
**engine `version:` + a `supported_schema` range** (`SKILL.md` frontmatter). On load, compare the
brain's schema/format version against `supported_schema`:

- **In range** → no message; boot normally.
- **Out of range** → emit **one** warning line, then **boot anyway**:
  - brain schema **newer** than this engine supports → *"This brain uses schema v{X}; this skill engine supports {range}. Reading it anyway — update the synaptic skill (GitHub Releases) for full support."*
  - brain schema **older** than the engine's range (a schema/format bump shipped) → *"This brain is on schema v{X}; the current schema is v{Y}. Reading it anyway — run `/synaptic-upgrade` when convenient to migrate."*
- **Missing version metadata** (brain or skill) → **assume compatible**, emit a **single one-line
  info notice** (*"No schema version found — assuming compatible."*), and boot. Never per-node, never repeated.

**Binding rules (CORE-safety, C1):**
- The compat-check is **warn-not-gate**: it **never blocks reading the brain** and is **never a
  precondition** to boot. A skill-less / older-skill agent boots from `BRAIN.md` unchecked — the
  brain is always readable as plain files on the runtime the agent already has.
- It runs **skill-side only** (no runtime we ship). It is **advisory output**, not a gate.
- It compares the **two decoupled numbers** (BRAIN.md schema/format vs the `SKILL.md` engine
  `version`/`supported_schema`). A skill update alone never demands a brain migration; only a
  schema/format change does, and even then the brain stays readable while unmigrated.
- **Update-awareness without a registry:** point the user at **GitHub Releases + repo Watch** to
  learn about newer skill engines. An optional Cortex "check-latest" (GitHub Releases API) is the
  only networked path and is never required.

## Host-setup detection (explicit setup only)

Run read-only inspection during an owner-requested init, upgrade or repair, never during normal
boot. During upgrade the old engine only acquires/verifies/installs the selected new package through
`references/package-install.md`; reload its `SKILL.md` and references before the **new engine alone**
runs host detection. Do not run old-engine detection or deployment recipes before that reload.

### Baseline and adapter contract (1.7.2)

- **L0:** readable files. **L1:** a bridge in the effective instruction carrier after the leak/reach
  gate. L1 means installation succeeded; L2 skill discovery, L3 menus and L4 hooks/MCP are optional,
  separately selected capabilities and never block completion.
- **Leak/reach gate first:** project brains use repo-relative pointers in project carriers.
  Global/private brain and skill pointers belong only in effective user-level, non-synced carriers,
  never a repo. Apply this gate before accepting L1 or generating a paste snippet. A private pointer
  in a repo is a leak to report, not a successful baseline.
- Record `adapter: supported | unknown` separately from `wired`. Supported means the declared
  harness/scope has a documented procedure covering the exact targets. Unknown or ambiguous
  harness/profile means `adapter: unknown`, `wired: limited`, maximum L1: zero agent writes outside
  the brain, no guessed settings, skill, menu, hook or MCP paths. Offer only a leak-safe bridge
  snippet for the user to paste into the carrier they identify. A folder does not identify a host.
- Every write outside the brain, including carriers, skills, stubs, `settings.json`, `mcp.json`,
  hooks and `config.toml`, requires an adapter listing that exact file, fresh byte-preserving
  preimages (including absence), an approved concrete plan and rollback. Recheck preimages just
  before apply; drift requires replanning. Preserve unrelated bytes and line endings. List removals
  too; generic fallback procedures never bypass an adapter's file allowlist.
- Missing proof, absent legacy metadata or `failed` is diagnosis only, never a repair trigger.
  Boot performs no setup writes. Explicit setup permits only its reviewed delta, preserving the
  selected profile and assisted/off choices.
- Init/upgrade never request a canary or fresh chat. Optional user-initiated `synaptic ping` replies
  only `SYNAPTIC-BOOT-OK <nonce>` from loaded instructions, with zero tools/file reads.
  `synaptic status` is a token-only alias for 1.7.x; situation reporting has its own explicit request
  (`references/situation.md`). Missing loading proof never blocks L1 completion.

### Inspect, classify, plan

1. Resolve the brain through the existing bridge or `CWD/.synaptic/BRAIN.md`. An unreachable bridge
   is a broken pointer; report it without onboarding another brain.
2. Identify the declared harness and effective carrier from the session/instruction chain. Inspect
   only relevant configuration, never auth material. Record scope and overrides. Codex follows
   `references/init.md` §a3; VS Code follows §a4. Historical chatmode files, folder names and the
   selected language model do not identify the active harness.
3. Preserve the effective carrier, selected skill path and assisted/off choices. For an existing
   VS Code profile use its already-known `harness/setup/vscode-<harness>.md` when present and
   `references/vscode.md` before generic init steps. A helper record or assisted carrier needs no
   separate RULES marker; do not append another bridge because that marker is absent. Use SKILL.md's
   read-only approved-rules fallback when approved rule exposure is missing or unknown.
4. Read an already-known legacy record if present; compare its claims with actual files. Its absence
   means baseline, not broken integration: never search for another host-named record, invent a
   legacy record or repair. Derive the current deterministic record below only from inspected facts
   during this explicit setup operation.
5. Report brain reach, carrier scope, declared harness, adapter and L1 result. Global brain with
   project-only wiring needs reach review, not automatic relocation. Unknown adapters stop at the
   user-paste route; supported adapters prepare only the selected reviewed delta.
6. Check stub drift read-only when L3 is configured; retain the installed bootstrap init stub even
   when optional menus are declined. Regeneration/pruning and conflict-copy cleanup are writes:
   list every adapter-owned target, preimage and rollback in the approved plan first.
7. Apply only that plan and verify baseline and selected capabilities separately; record results.
   On failure restore touched files from preimages and retain diagnosis/evidence. Do not retry a
   failed optional level automatically or turn missing proof into another deployment.

### Minimal setup record (not 1.8 multi-binding)

`carrier_id` is the scope-qualified effective carrier location: `project:<repo-relative-path>` for
project scope, `user:<logical-user-root-relative-path>` for user scope. Use forward slashes. Hash the canonical UTF-8 text
`carrier_id + "\n" + declared_harness` with SHA-256; the full lowercase hex digest is `setup_id`.
Store a new record at `harness/setup/setups/<setup_id>.md`. Existing helper-owned records such as
`harness/setup/vscode-<harness>.md` may retain that path and add the same fields in place; do not
duplicate them or migrate all records. Audit deduplicates by `setup_id`. This is not a profile UUID, binding stamp
or discovery feature. If carrier/harness cannot be resolved, report limited/unresolved; invent no id.

Required fields (keep unknown evidence explicit):

```yaml
setup_id: <deterministic sha256>
carrier_id: <scope-qualified effective carrier>
declared_harness: <declared harness>
adapter: supported # or unknown
wired: baseline # none | baseline | partial | full | limited
l3: not-configured # declined | not-configured | configured
l4: not-configured # declined | not-configured | configured
proof: unproven # separate from wired; never inferred from installed bytes
canary_offered_minor: null # legacy bookkeeping only; never prompts from init/upgrade
audit_reported_engine: null # audit stamps current engine after its one advisory
```

Also retain engine, scope, skill path, exact deployed file inventory, nonce when present, static
checks, failure/evidence details and existing adapter metadata. `declined` is terminal until the user
explicitly re-runs init; upgrade, audit and boot neither re-offer nor deploy that level. `failed` is
diagnosis only. Audit reports `unproven`/`limited` once per engine by checking/updating
`audit_reported_engine`; a repeated audit stays quiet. An absent legacy `<host>.md` is not itself an
advisory or permission to invent one. Canary metadata never reintroduces a setup proof prompt.
