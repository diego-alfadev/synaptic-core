# ADR-002 — v0.5 "LLM-wiki First" Design

**Status:** Accepted — supersedes the `identity/` structure, `worklines/` structure, and the
harness-bridge approach defined in ADR-001. All other ADR-001 decisions remain in force.  
**Date:** 2026-06-11  
**Deciders:** Synaptic-Core maintainers (spec-driven, evidence-based)

---

## Context

### Owner feedback after v0.4 deployment

ADR-001 ("Minimal Cortex") was accepted and implemented. During the first round of real use
and structured owner review, four observations surfaced that required a second design pass.

**Observation 1 — The harness-wiring landscape has consolidated.**

Research into the 2026 harness ecosystem revealed that the pattern for inserting third-party
tool instructions into an AI agent's project context has effectively standardised on two
artifacts: an AGENTS.md fragment and a skill package installed in auto-discovered skill
directories. AGENTS.md (stewarded by the Agentic AI Foundation under the Linux Foundation)
is now adopted by 60,000+ open-source repositories and is recognized natively by every major
agent platform. The Agent Skills open standard (agentskills.io, originally developed by
Anthropic, now open governance) defines `.claude/skills/` and `.agents/skills/` as the
canonical auto-discovery paths.

The consequence for Synaptic: the v0.4 "bridge file" pattern (per-agent ≤10-line pointer
files, one per harness) was already being done better at the ecosystem level. The correct
move was to ship exactly one AGENTS.md fragment plus one skill package, and let cross-agent
sync tools (gentle-ai, ai-rules-sync, block/ai-rules, rulesync) handle the rest.

**Observation 2 — Persona and behavior config is consolidating in the harness, not the brain.**

The market trend is unambiguous: every major agent harness (Claude Code, Cursor, Copilot,
Gemini CLI, OpenCode) has a dedicated user-level config mechanism for persona, tone, and
global behavior. The gentle-ai ecosystem configurator explicitly manages this layer across
15 platforms. The owner feedback confirmed: `identity/` as a brain directory created an
identity-conflict risk — a Jarvis-persona user's brain would carry persona fragments that
conflicted with their harness config, and a vanilla-agent user's brain would carry
role-description fragments that no longer matched their actual setup after a job change.

The separation rule — persona/behavior in the harness, knowledge in the brain — resolves
this cleanly. A brain with no identity directory is unconflicted across any harness persona.

**Observation 3 — Worklines were the least-used structure; ad-hoc per-task folders emerged.**

ADR-001's evidence base removed the v0.3 _tree.yaml and the multi-file boot ceremony
because real use bypassed them. A parallel pattern appeared with worklines: the owner
confirmed that formal workline tracking in the brain was largely skipped in practice, while
informal per-task working folders had emerged organically — a `feat-123/` here, a
`q2-budget/` there — without a spec for them.

The design conclusion: tasks and roadmap belong in the owner's task system (Jira, Trello,
an MCP task tool, whatever is already in use). The brain does not replicate a task manager.
What the brain does need is a sanctioned place for per-task working context that is too large
for the journal — the playground pattern formalises exactly what was already happening.

**Observation 4 — The references/ deletion in v0.4 was wrong.**

ADR-001 dropped `references/` on the grounds that large verbatim artifacts had not appeared
in the evidence brain in months of use. However, the reason they did not appear was that the
v0.3 `references/` had never been created at all — the evidence brain had no reference
artifacts to observe. The function remained valid: there is a real class of content (DDL
schemas, API specs, large exports) that belongs in the brain for discoverability but should
never be eager-loaded. Reinstating `references/` with a redesigned "existence-indexed"
convention addresses this without the loading problem.

### Research evidence incorporated (Round 2)

- **harness-wiring-landscape.md**: AGENTS.md adoption and the Agent Skills standard;
  marker-block fragments as the idempotent pattern; `.agents/skills/` as the most portable
  single discovery path; gentle-ai / ai-rules-sync / block/ai-rules as the correct layer
  for cross-agent rule sync — delegate, do not replicate.
- **journal-vs-memory-layers.md**: journal SLIM, not kill — capture buffer, portable session
  resume, and tool-lock-free colleague handoff have no zero-install native substitute in 2026;
  playgrounds take the fat per-task content; archive/ was never used and never needed; hard
  limit 80 lines codifies the minimum that real use already self-corrected to.
- **freitag-kg-principles.md**: Synaptic v0.4 is ~75% compliant with Obsidian KG principles;
  the three actionable gaps are naming convention (kebab-case, unique across knowledge/),
  Obsidian graph hygiene (templates out of knowledge/, wikilinks inside comments escaped),
  and backlink access (grep recipe for CORE; Obsidian computes live from forward links).

---

## Decision

Redesign as **v0.5 "LLM-wiki first"** in-place, building on v0.4's wins.

### The separation rule (new, central)

The brain is a pure knowledge-graph persistence layer plus its contribution protocol.
Everything persona, behavior, and task-tracking lives in the harness.

| Concern | Lives in |
|---------|----------|
| Persona, tone, language, global behavior | User harness |
| Project coding rules, conventions | Project AGENTS.md (outside `.synaptic/`) |
| "This project has a brain — use it properly" | Project AGENTS.md — shipped by Synaptic (`<!-- BEGIN:SYNAPTIC -->` fragment) |
| Lifecycle commands | Skill package in `.claude/skills/` + `.agents/skills/` |
| Knowledge graph + contribution protocol + working memory | `.synaptic/` |
| Tasks / roadmap / backlog | Owner's task system |
| Vendor-native agent memory | Treated as cache; files authoritative |

### Layout change: v0.4 → v0.5

**Removed:**
- `identity/` — role summary to BRAIN.md Brain Context (2–4 lines, retrieval framing only);
  contacts to a `people-routing.md` knowledge page; behavior rules to the harness.
- `worklines/` — active items to `playgrounds/` or the owner's task system; stale items
  discarded with consent.
- `skills/` (per-brain) — replaced by the skill package installed in project harness skill
  directories by `/init` / `/upgrade`.
- `cortex.config.yaml` — budgets now in `BRAIN.md` frontmatter (`budgets:` block).

**Added:**
- `playgrounds/` — per-task workspaces (see below).
- `references/` — reinstated with existence-indexed convention (see below).
- `templates/` at `.synaptic/` root — out of `knowledge/` for Obsidian graph hygiene.

### Playgrounds

`playgrounds/{task-id}/` are free-form working directories for tasks too large for the
journal: multi-day work, multiple artifacts, analysis, deliverables. No structure imposed.
Registry: `journal/_current.md` (not `knowledge/INDEX.md` — playgrounds are working memory,
not knowledge). Lifecycle: open → work → consolidate → burn (default). Archiving is the
exception; deletion after consolidation is the rule. Burn-by-default risk (below) is
accepted because the alternative — keeping playgrounds indefinitely — recreates exactly the
clutter problem that worklines had in practice.

### References reinstated, existence-indexed

`references/` is a drop-zone for large verbatim artifacts that must be findable but not
loaded at every turn. `references/_index.md` holds exactly one line per artifact (name, what
it is, when it matters). Knowledge pages link to it; agents read fragments on demand.
Never eager-loaded; never duplicated into knowledge pages beyond distilled facts.
The `/audit` command checks that every `_index.md` entry points to a real file.

### Journal: slim to the minimum real use already showed

`journal/_current.md` only. No `archive/` directory — it was never instantiated in months of
production use and is structurally unnecessary given that playgrounds absorb per-task content
and git provides version history when the brain is committed. Hard budget: 80 lines. Three
sections: Resume anchor (where work stopped; active playgrounds) · Watch list (open questions,
transient cross-session items) · Consolidation log (dated routing record: what was promoted,
where). No heartbeat entries in the journal — heartbeat is a behavioral protocol, not a file
format. This is a codification of the minimum the evidence brain actually maintained.

### Harness integration: AGENTS.md fragment + skill install

The v0.4 per-agent bridge file approach is replaced. At `/init` or `/upgrade`, the skill:

1. Writes the AGENTS.md fragment (marker-wrapped, idempotent replace-on-upgrade) — ≤12 lines,
   H2 heading, one-line purpose, read instruction, commands list.
2. Installs the skill package into `.claude/skills/synaptic/` and `.agents/skills/synaptic/`
   — both paths covered; Claude Code, VS Code Copilot, Gemini CLI, OpenCode, and Codex all
   auto-discover at least one of them.
3. Optionally writes `.cursor/rules/synaptic.mdc` if `.cursor/` is detected.

`CLAUDE.md` is not touched — that is user persona territory. Cross-agent rule sync is
delegated to existing tools (gentle-ai, ai-rules-sync, block/ai-rules, rulesync); Synaptic
documents compatibility but does not replicate the sync mechanism.

### Backlinks: queried, not stored

The freitag-kg research recommended materializing a `backlinks:` frontmatter list in each
page, maintained by the consolidate skill. This recommendation is explicitly rejected.

Materialized backlink lists create double bookkeeping: the same relationship is recorded in
the source file's forward `[[wikilink]]` and in the target file's `backlinks:` list. This is
the same failure mode that caused `knowledge/_tree.yaml` to drift into phantom territory in
v0.3 — a derived index that falls out of sync with the source of truth. The v0.3 lesson was
decisive enough to anchor ADR-001; the same lesson applies here.

The correct approach for CORE: `grep -r "[[page-name]]" .synaptic/knowledge/` — zero tooling,
always accurate, never out of sync. Obsidian computes backlinks live from forward links when
the brain is opened as a vault. The ROBUST layer (Engram/FTS5/MCP) provides O(log n)
resolution automatically from the forward-link graph. No materialized list needed at any layer.

### Obsidian-native compatibility

Templates moved to `.synaptic/templates/` (out of `knowledge/`) — prevents phantom nodes
in the graph view. Wikilink syntax inside HTML comments replaced with backtick-escaped
equivalents — prevents Obsidian's link indexer from creating phantom edges. `tools/obsidian-setup.js`
(zero-dep, optional) writes `.obsidian/` graph config to exclude `templates/` and `journal/`.
These are implementation hygiene changes; no architectural consequence.

### No mandatory scripts (constraint relaxation from v0.4)

v0.4 stated "zero installations." v0.5 refines: "zero *required* installations — no mandatory
scripts." Scripts (`tools/check.js`, `tools/obsidian-setup.js`) remain optional TOOLS-layer
conveniences. The `/upgrade` Phase M checklist is explicitly designed to run as either a cheap
agent (no runtime required) or an optional script. The CORE guarantee — plain files, any agent,
zero dependencies — is preserved.

### `/plan` command removed; worklines gone

The `/plan` command managed worklines. Worklines are gone. Tasks belong in the owner's task
system. This is documented in the README "What SYNAPTIC-CORE is NOT" section.

---

## Consequences

### Positive

- **Clean harness boundary.** A brain with no `identity/` directory creates no persona
  conflicts regardless of how the harness is configured. Multiple agents with different
  personas can share the same brain without friction.
- **Reduced structural footprint.** The v0.5 seed has fewer directories and no config file.
  Every directory that exists has a clear, non-overlapping role.
- **Playgrounds match real use.** The per-task working folder pattern was already emerging
  organically; formalising it gives it a name, a lifecycle, and a burn convention.
- **References are findable without being loaded.** The existence-indexed pattern solves the
  "where is that DDL schema?" problem without bloating agent context at boot.
- **Journal size codified.** The 80-line hard budget and three-section format codify the
  minimum the evidence brain already maintained — no ceremony added.
- **Harness integration is future-proof.** AGENTS.md + agent skills directories are the
  ecosystem standard; Synaptic no longer maintains per-harness bridge files.
- **Obsidian opens cleanly out of the box.** No phantom nodes, no phantom edges, correct
  graph view hygiene with optional `.obsidian/` config.

### Honest costs and risks

- **Brains without AGENTS.md-aware harnesses need a manual pointer.** Agents that do not
  read AGENTS.md (uncommon but possible) will not auto-discover the brain unless the owner
  adds the pointer manually. The BRAIN.md file is self-describing, but the automatic read
  instruction depends on AGENTS.md being processed.
- **Playground burn-by-default risks context loss if consolidation is skipped.** If an owner
  burns a playground without consolidating, any findings that were not already in knowledge
  pages are lost. The consolidation step is load-bearing; the convention relies on discipline,
  not enforcement.
- **References can rot.** An entry in `references/_index.md` can point to a file that no
  longer exists or a file that has changed beyond recognition. The `/audit` command checks
  for missing files but cannot validate whether the content description is still accurate.
  This is documented, not solved.
- **`worklines/` removal breaks v0.4 users with active worklines.** Phase C of `/upgrade`
  triages active worklines to playgrounds or the user's task system, and stale ones with
  consent. For users with dense worklines, this is a meaningful migration step — not
  automatic, requires judgment.
- **The `CLAUDE.md` non-touch rule requires discipline.** Because the skill never touches
  `CLAUDE.md`, users whose only harness file is `CLAUDE.md` (no AGENTS.md) will not get the
  brain pointer automatically unless they explicitly ask the skill to write it there. The
  skill documents this; it is not a silent failure.

---

## Alternatives considered

### Alternative 1: Keep identity/ in the brain

Rejected. The separation rule evidence is decisive: persona config is consolidating in the
harness. `identity/` in the brain creates an identity-conflict risk between brain content and
harness config that grows as the harness ecosystem matures. The 2–4-line Brain Context block
in BRAIN.md (retrieval framing: what this brain covers, the owner's role in this project)
preserves the only identity information an agent actually needs for knowledge retrieval —
not persona. Contacts become a knowledge page (project knowledge); behavior rules go to the
harness (agent configuration).

### Alternative 2: Keep worklines

Rejected. Worklines were the least-used structure in the evidence brain and in owner
feedback. The function they served — knowing what is currently in progress — is served better
by a pointer in `journal/_current.md` (listing active playgrounds) combined with the owner's
actual task system. Maintaining a parallel task-tracking structure inside the brain that
diverges from the task system adds maintenance burden without adding value.

### Alternative 3: Materialize backlinks as frontmatter

Rejected. See "Backlinks: queried, not stored" in the Decision section above. The core
objection is double bookkeeping: a forward `[[wikilink]]` plus a corresponding `backlinks:`
entry in the target file means the same fact is stored in two places that can diverge. The
v0.3 `_tree.yaml` was a derived index of exactly this kind, and it drifted into a phantom
state that invalidated 32 entries. The lesson is clear enough to apply universally: the
single source of truth is the forward link; everything else is a derived view. Obsidian
and grep both provide that view without requiring the brain to maintain it.

### Alternative 4: Full vanilla wiki without contribution protocol

Rejected. A vanilla wiki keeps only the substrate — linked Markdown pages with an index.
The evidence shows the substrate is the part that needs the least help. What demonstrably
delivered value in the evidence brain were the components that encode intention and inertia:
the session continuity (where work stopped), the contribution protocol (what to do with new
knowledge), and the playbooks (encoded successful work). A vanilla wiki discards all of
these. v0.5 keeps the wiki layer and adds the protocol layer on top of it. The Zettelkasten
/ LLM-wiki convergence informs the knowledge layer; it does not replace the whole design.

---

## References

- `synaptic-audit/spec/SPEC.md` §0–§5 — the living specification this ADR implements
- `synaptic-audit/research/harness-wiring-landscape.md` — AGENTS.md standard, Agent Skills,
  gentle-ai, ai-rules-sync, autoskills, openskills evidence
- `synaptic-audit/research/journal-vs-memory-layers.md` — journal keep/slim/kill analysis;
  playground pattern validation; native memory landscape 2026
- `synaptic-audit/research/freitag-kg-principles.md` — KG principles compliance check;
  backlink materialization recommendation (rejected with rationale above); Obsidian hygiene
- `docs/architecture/adr-001-minimal-cortex.md` — v0.4 design; decisions this ADR builds on
- `standalone/synaptic/SKILL.md` — the unified skill package (v0.5 implementation)
- `standalone/synaptic/references/upgrade-to-v05.md` — v0.3/v0.4 → v0.5 migration guide
- `seed/.synaptic/BRAIN.md` — the v0.5 boot file template
- `tools/README.md` — TOOLS layer: check.js, obsidian-setup.js
