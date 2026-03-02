# Research Notes: Adoptable Patterns from GSD & Arscontexta

> Research date: 2026-03-01. Purpose: Identify patterns we can adopt in SYNAPTIC-CORE without compromising lightweight/portable design.

---

## 🏆 Top Findings — Adopt These

### 1. Memory Routing Decision Tree (Arscontexta)

**What it is:** A simple decision tree that tells the agent WHERE to put captured knowledge.

```
Is this about the agent itself?
├── YES: Is it durable self-knowledge?
│   ├── YES → identity/ (role, principles, methodology)
│   └── NO → journal/ (session state, current work)
│
└── NO: Is this domain/project knowledge?
    ├── YES: Worth finding again?
    │   ├── YES → knowledge/ (areas, domains, lessons)
    │   └── NO → journal/ (observation, may consolidate later)
    │
    └── NO: Is it concrete data?
        └── YES → inventory/ (IDs, URLs, contacts, keys)
```

**Why adopt:** This directly maps to our `.synaptic/` structure. Include it in `BOOTSTRAP.md` so every agent knows exactly where things go. Prevents the "everything in journal" anti-pattern.

**Effort:** Zero. Just a section in `BOOTSTRAP.md`.

---

### 2. Discovery-First Quality Gate (Arscontexta)

**What it is:** Before creating any knowledge node, the agent asks: *"How will a future session find this?"*

Checklist for every new node:
- Does the title clearly describe the content?
- Is it linked from at least one `_overview.md`?
- Is it reflected in `_tree.yaml`?
- Would a new agent, reading only the tree, know this exists?

**Why adopt:** Prevents orphan files. Forces the agent to think about retrieval BEFORE writing. This is the single most important quality rule for a growing brain.

**Effort:** A paragraph in `BOOTSTRAP.md` + check in `consolidate/SKILL.md`.

---

### 3. Session Rhythm: Orient → Work → Persist (Arscontexta)

**What it is:** A three-phase cycle for every work session:

| Phase | What agent does | SYNAPTIC mapping |
|-------|----------------|-----------------|
| **Orient** | Load state, understand where we are | Bootstrap protocol (MANIFEST → ROLE → _tree.yaml → _current.md) |
| **Work** | Execute tasks, capture decisions/lessons | Write to journal/_current.md |
| **Persist** | Update knowledge, push state for next session | Run /consolidate (or remind user) |

**Why adopt:** We already have Orient (bootstrap) and Work (journal capture). We're missing the explicit **Persist** phase. Adding a "session close" reminder in `BOOTSTRAP.md` ("When ending a session, run `/consolidate` or at minimum update `_current.md` with where you stopped") closes the loop.

**Effort:** A section in `BOOTSTRAP.md`.

---

### 4. Conflation Failure Modes (Arscontexta)

**What it is:** 6 documented anti-patterns when content ends up in the wrong space.

Most relevant to us:

| Failure | Our risk | Prevention |
|---------|----------|------------|
| **Ops into Notes** — session logs in knowledge | High. Agent dumps journal entries into knowledge/ without consolidation | Consolidate skill explicitly filters temporal vs durable content |
| **Notes into Ops** — insights trapped in journal | High. Agent captures a great lesson in `_current.md` but user never runs `/consolidate` | Budget trigger: when `_current.md` > 200 lines, agent proactively suggests consolidation |
| **Self into Notes** — agent identity mixed with domain knowledge | Medium. Agent writes "I work best when..." in a knowledge node | Memory routing decision tree (point 1) prevents this |

**Why adopt:** Include the top 3 as warnings in `BOOTSTRAP.md`. Make the agent aware of these traps.

**Effort:** 10 lines in `BOOTSTRAP.md`.

---

### 5. Map-Codebase for Brownfield (GSD)

**What it is:** GSD's `/map-codebase` spawns parallel agents to analyze stack, architecture, conventions, and concerns of an existing project.

**Why adopt:** This directly maps to our **Scenario B (Fresh Brain + Existing Project)**. The `init/SKILL.md` should include a "workspace scan" step that:
1. Reads directory structure
2. Identifies key files (README, package.json, schemas, configs, .agent/)
3. Extracts stack, architecture decisions, naming conventions
4. Populates initial knowledge nodes from findings

Unlike GSD, we don't need parallel agents — a single agent scanning top-level files is sufficient for CORE mode.

**Effort:** Already planned in init skill. GSD validates the pattern.

---

## ⚡ Worth Considering — Lower Priority

### 6. Cognitive Grounding for Design Decisions (Arscontexta)

**What it is:** Every kernel primitive in Arscontexta links to specific cognitive science research explaining WHY that design choice exists. Examples:
- MOC hierarchy → context-switching cost (Leroy 2009)
- Description fields → progressive disclosure theory
- Wiki links → spreading activation theory
- Size budgets → LLM quality degradation curves

**For SYNAPTIC:** We don't need 249 research claims, but documenting WHY behind our 2-3 core design choices (size budgets, tree navigation, dual representation) would strengthen the spec and help contributors understand the rationale.

**Effort:** Low. A "Design Rationale" section in a spec doc.

---

### 7. Operational Learning Loop (Arscontexta)

**What it is:** Two capture mechanisms that feed system evolution:
- **Observations:** After significant actions, agent asks "what did I learn?" → captures in structured format
- **Tensions:** When something contradicts existing knowledge → immediately captured

Both accumulate and periodically get reviewed for system improvements.

**For SYNAPTIC:** This maps well to our `lessons/` directory. We could extend `consolidate/SKILL.md` to specifically look for:
- Things that went wrong → lessons
- Contradictions with existing knowledge → update or flag the conflicting node

**Effort:** Medium. Adds complexity to consolidation skill. Good for v1.1.

---

### 8. YAML Frontmatter on Knowledge Nodes (Arscontexta)

**What it is:** Every note has structured YAML metadata:
```yaml
---
title: "Session-based Auth Strategy"
description: "Chose session tokens over JWT for easier revocation"
created: 2026-02-20
source: dialogue_session_3
status: locked
topics: ["architecture", "security"]
---
```

**For SYNAPTIC:** This is very attractive for machine-parseability (building `_tree.yaml` from frontmatter is trivial if every node has structured metadata). But it adds friction for human editing.

**Recommendation:** Make it **optional but encouraged**. If frontmatter exists, the tree builder uses it. If not, the agent infers structure from headings and content.

**Effort:** Low for spec. Medium for skill implementation.

---

## 🔄 GSD Crossover Analysis

### Should SYNAPTIC-CORE absorb GSD's task/planning management?

**Short answer: No. Keep them complementary.**

| Concern | Analysis |
|---------|----------|
| **Canibalization** | GSD is a workflow orchestration system (plan → execute → verify). SYNAPTIC is a knowledge substrate. Different concerns. |
| **Where they overlap** | Context engineering — GSD's STATE.md, PROJECT.md, ROADMAP.md overlap with SYNAPTIC's knowledge store |
| **Best approach** | A **crossover plugin** that syncs GSD state into SYNAPTIC knowledge nodes. GSD generates decisions, summaries, lessons → plugin routes them to SYNAPTIC's brain. |

### Crossover Plugin Concept (future)

```
synaptic-gsd-plugin/
├── SKILL.md              # "After GSD task completion, extract and route to SYNAPTIC"
└── sync-rules.md         # What maps where:
                          #   GSD decisions → SYNAPTIC knowledge/domains/
                          #   GSD lessons   → SYNAPTIC knowledge/lessons/
                          #   GSD STATE.md  → SYNAPTIC journal/_current.md
                          #   GSD PROJECT.md → SYNAPTIC references/
```

**This preserves both products** and creates a "1+1=3" value: GSD builds, SYNAPTIC remembers.

---

## 📋 Summary: What Goes Into MVP

| Pattern | Source | Where in SYNAPTIC | Priority |
|---------|--------|-------------------|----------|
| Memory routing decision tree | Arscontexta | BOOTSTRAP.md | **Must have** |
| Discovery-first quality gate | Arscontexta | BOOTSTRAP.md + consolidate skill | **Must have** |
| Session rhythm (orient/work/persist) | Arscontexta | BOOTSTRAP.md | **Must have** |
| Top 3 conflation warnings | Arscontexta | BOOTSTRAP.md | **Must have** |
| Workspace scan for existing projects | GSD (map-codebase) | init/SKILL.md | **Must have** (already planned) |
| Optional YAML frontmatter | Arscontexta | Spec + tree builder | Should have |
| Operational learning loop | Arscontexta | consolidate/SKILL.md enhancement | v1.1 |
| Cognitive grounding docs | Arscontexta | Spec/design docs | v1.1 |
| GSD crossover plugin | GSD | Separate plugin repo | v2+ |
