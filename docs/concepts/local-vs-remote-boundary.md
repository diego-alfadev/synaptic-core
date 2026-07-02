# Local-vs-remote data boundary — where does the data actually go?

*What this is: the explicit governance line between what stays 100% local on your machine and what — if anything — ever leaves it. The short answer: Synaptic introduces no new egress. The only boundary is the one your host LLM already has and your organisation already governs.*

For a regulated enterprise client the first question is rarely "is it useful?" — it is "where does the data go?" This doc answers that in one table and one reusable sentence, and it is honest about the one thing Synaptic does *not* do.

## The one-liner

> *Synaptic's knowledge substrate is 100% local, inert, human-readable files — nothing leaves the machine to store, index, or read it. The only data egress is the one the client already has and governs: whatever prose an agent chooses to load into its host LLM's context to reason over. Synaptic introduces no server, no database, no telemetry, and no new network boundary; on a local/on-prem model the entire loop stays on-device.*

## The boundary — four layers

| Layer | Data path | Governance line |
|---|---|---|
| **CORE (files)** | **100% LOCAL.** Plain Markdown/YAML on disk; git-diffable; readable with no runtime. | Nothing leaves the machine. The knowledge substrate is inert files the client already controls. |
| **TOOLS (`tools/*.js`)** | **100% LOCAL.** Zero-dependency Node (`node:fs`/`path`/`process` only); **no network** — the interactive `graph.html` embeds all JS/CSS inline, with no CDN, `<script src>`, or `<link href>`. | Deterministic local processing; no telemetry, no fetch. |
| **The agent / harness (host LLM)** | **REMOTE where the host is remote.** When an agent reads brain prose to reason, that prose enters the host LLM's context — governed by **the host's** data policy, not by Synaptic. | This is the **only** egress point, and it is the host's boundary, not ours. Synaptic adds no new egress. On a local/on-prem model, even this stays local. |
| **Cortex (future, P3)** | Designed all-local (QMD-class on-device models, a sidecar SQLite index built *from* the files). | Named as a future accelerator that **preserves** the local posture; never a mandatory remote service. |

## Only one egress point

There is exactly one place data can leave, and Synaptic does not create it: the host LLM's context window. When an agent decides to read a node to reason over it, that node's prose is sent to whatever model the agent runs on — a cloud model or a local one. That path already exists the moment you use an agent at all; it is **the host's boundary, governed by the host's data policy**, and it is unchanged by whether the knowledge came from a Synaptic brain, a wiki, or a pasted document. Synaptic adds no server to phone home to, no database to replicate, no background sync, and no telemetry. The substrate never initiates a network call. So the egress question reduces to a question the client has already answered: *what is our policy for the LLM our agents run on?*

## Contrast with runtime-heavy memory (Cognee, honestly)

Runtime-heavy memory layers take the opposite posture. Cognee — the strongest engine-class reference point in this space — stores memory inside a mandatory Python + graph + vector-DB runtime: the knowledge is not readable or auditable without standing that runtime up, and the boundary of what the runtime touches is opaque to inspection. Synaptic keeps the same knowledge as plain, human-readable, git-diffable Markdown that any agent reads with **zero runtime**, and can bolt Cognee-class retrieval on later as an *optional* accelerator without surrendering the files-are-truth, auditable core. This is stated **community-over-combat**: Cognee's self-improving retrieval is a genuine capability and a direction worth aiming toward — the contrast here is about the *data-boundary posture* (opaque runtime vs inert auditable files), not a claim of superiority on every axis.

## Applicability for a regulated enterprise client

For a regulated enterprise client, the local-first posture is the governance argument made concrete:

- **Works on a locked-down laptop** — no install, no server to provision, no platform rollout to approve; a folder of files and one skill the agent reads.
- **Auditable by inspection** — a compliance reviewer opens the files in any text editor and reads exactly what the agent reads; there is no hidden index or opaque store to reconcile. (Provenance metadata — `source:`, `confidence:` — makes each claim traceable; see [epistemic honesty](./epistemic-honesty.md).)
- **No new network boundary to review** — the security review reduces to the host-LLM decision the client has already made, plus ordinary filesystem access control. There is no new data processor to assess.
- **Portable and inert** — the knowledge survives without Synaptic; it is just Markdown. Nothing is locked inside a runtime.

## Honest limits — Synaptic does not police egress

Be precise about what this boundary *is not*. **Synaptic does not sandbox, intercept, or police the host LLM.** It cannot stop an agent from loading a sensitive node into a remote model's context — access control over which files an agent may read is the **host's and the filesystem's job**, not Synaptic's. The guarantee is *"Synaptic adds no new egress"* — not *"Synaptic prevents egress."* If a node must never reach a remote model, that is enforced by where the file lives and who/what can read it (filesystem permissions, repo placement, the host's data policy), exactly as it would be for any other file on the machine. Synaptic's contribution to governance is that the substrate is inert and inspectable — not that it acts as a data-loss-prevention layer.

---

**Related:**
- [Epistemic honesty](./epistemic-honesty.md) — provenance/confidence as the auditability argument
- [RAG vs wiki vs brain](./rag-vs-wiki-vs-brain.md) — why inert curated files beat a re-derived retrieval store for governed work
- [Matrioshka architecture](./architecture-matrioshka.md) — the CORE / Cortex / Ecosystem layering and the all-local Cortex horizon
- Back to the [concepts index](./_index.md) · the [README](../../README.md)
