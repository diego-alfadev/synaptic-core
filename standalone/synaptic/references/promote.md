<!-- summary: Cross-brain promotion — move a general node from a child brain into a parent's node store: parent first, git as transport, PROPOSE-THEN-APPROVE with a confidentiality gate. -->

# Cross-brain promotion — child node → parent store

The one procedure for making a child brain's node part of a parent's **node store**
(`references/contract.md` §8), when the child repository inherits that store from the parent by git
(a fork, or a remote it merges from). It is **PROPOSE-THEN-APPROVE** (`references/contract.md` §5):
draft each step, apply it only on the owner's yes. It is not proposal → task promotion
(`references/contract.md` §6).

**Parent first, git does the transport.** Write in the parent, check it there, merge it into the
child, then leave a pointer in the child. This is the only order without merge conflicts: the store's
files have one owner, and the child receives them like any other parent change. Synaptic adds no
command and no sync; the owner runs git.

## The playbook

1. **Propose.** Pick a child node and add a `proposals/INDEX.md` row for it (`from:` the node). The
   owner approves before anything below is written.
2. **Generality test.** Does the claim still hold with another brand, palette, language or topic? If
   not, stop: it stays in the child. A consumer may add its own tests here.
3. **Confidentiality gate.** The promoted text leaves the child, so it is egress. Remove third-party
   material, client or brand specifics, absolute paths and personal names. When unsure, deny: the
   node stays in the child. This rule binds now; it follows CONF-1, which is still a draft spec in the
   Synaptic repository (`docs/specs/confidentiality-levels.md`) with no enforcement.
4. **Write in the parent's checkout.** Add the node with full frontmatter (contract §1), `evidence` at its floor
   (the weakest level the parent can stand behind), `source:` as an opaque child locator
   (`<child-id>:<repo-relative path>@<commit>`, never an absolute path), and a line in the store's MOC.
   Run `node <synaptic>/tools/check.js <store>`. The parent's owner commits.
5. **Merge the parent into the child** (git). The new node arrives with every other parent change.
6. **Reduce the child node.** Keep only its case-specific remainder, keep it `status: active`, and link
   it to the inherited node (a relative Markdown link, or a `relates_to` / `applies_to` path value;
   needs `links: markdown` or `both`). Do **not** archive it: its successor would be computed from an
   inbound `supersedes`, which would have to live in the parent, so an archived child node would read
   as "no replacement recorded" (status rule, `references/weave.md`). If nothing case-specific remains,
   the node becomes a one-line pointer and stays `active`. Until read-only mounts ship (planned), that
   link is existence-checked only, not an edge.
7. **Record it in the ledger.** Append one row: date, child locator, parent commit, evidence before →
   after. Then close the proposal row (`[x]`, the parent commit as proof).

## The ledger

One per child. Either a registry (`registries/promotions.md`, a `type: registry` node listed in
`registries/_index.md`), or an existing ledger file the consumer already keeps (for example a
calibration log) with the same columns. The owner names the choice once (a line in `BRAIN.md`, like
the `Task files:` line, is enough); never infer it per session.

## What promotion never does

- No `promoted_from` / `promoted_to` edges: the typed-edge vocabulary is frozen, and a parent never
  points at its children. Provenance is the parent node's `source:` plus the child's ledger row.
- No writes into the parent from the child's checkout: change the store at its owner.
- No commit by the agent. Each owner commits in their own repository (steps 4 and 5).
