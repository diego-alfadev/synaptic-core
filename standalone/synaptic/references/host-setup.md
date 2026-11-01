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

## Host-setup detection (ALWAYS run on `/synaptic-init` and every `/synaptic-upgrade`)

Beyond resolving the brain, **actively detect WHERE + HOW the brain + harness are wired** and
**re-deploy the correct wiring** — never silently assume a repo-local `.synaptic/`. This is prose an
agent executes by read/grep (zero-runtime); it is a **first-class, always-run** step of init and every
upgrade, not just a pre-v1 migration step. (The convert flow, `references/convert-to-global.md`, and
the upgrade addendum, `references/upgrade-to-v1.md`, reuse this same detect+classify+re-deploy step.)

1. **Resolve the brain location** (reuse the resolution above): `CWD/.synaptic/BRAIN.md`, else the brain
   at the `BEGIN:SYNAPTIC` bridge pointer. Record **project-local vs global** (is the brain under CWD, or
   at a higher / absolute path?).
2. **Scan for existing wiring** across all carriers: VS Code Copilot user-level + workspace
   `*.chatmode.md` / `*.instructions.md`, `.github/copilot-instructions.md`, `AGENTS.md`, `CLAUDE.md`,
   `.cursor/rules/*`. Determine **where the bridge + rules currently live** (project vs user level) and
   **which host** (`.claude/`, `.github/`, `.cursor/`, `AGENTS.md`, Gemini).
3. **Reuse the recorded setup:** if `<brain>/harness/setup/<host>.md` exists, read it as the
   authoritative record of the last deployment; reconcile recorded-vs-actual and **report drift**.
4. **Classify the setup** and **emit a one-line classification** stating brain location
   (project-local | global), host, and where wiring lives (project | user level):
   - `{project-local brain + project-level wiring}` → re-deploy **project-level** wiring (existing behavior).
   - `{global brain + user-level wiring}` → re-deploy **user-level** bridge + rules + hooks (absolute
     pointer + absolute skill path; symlink only on a POSIX local non-synced path, else emit block /
     pointer file). A `v1.x → v1.4.0` refresh of a global brain **re-asserts its user-level wiring** even
     on the light (already-schema-`1.0`) no-op path — it never falls back to a bare repo-local bridge.
   - `{global brain but wiring found only at project level = MISCONFIGURED}` (the classic "brain covers
     only one folder" symptom) → **flag it and OFFER to fix**: promote wiring to user level (the convert
     flow, `references/convert-to-global.md`, or just the wiring half if the brain is already at a global
     root).
   - `{bridge points at an unreachable path = broken pointer}` → **report it** (do NOT treat as "no
     brain"; matches the unreachable-pointer branch of `SKILL.md` Detect on Load).
5. **Run the command-discovery stub-drift check** (`references/command-discovery.md`): compare the
   recorded stub set + version against the current SOT command list; regenerate + prune stale stubs;
   clean OneDrive KFM `synaptic-*-DESKTOP-*` conflict copies; regenerate the Layer-1 bridge descriptions.
6. **Update `harness/setup/<host>.md`** with the re-deployed state.

> **Absolute skill path in the bridge (grep-recoverable).** When wiring at user level, the bridge block
> carries the **skill's absolute path** as well as the brain's, so an agent on a host that does **not**
> discover user-level skill dirs can still locate + load the skill by reading the bridge. Surface any
> such host-limitation in the setup report.

