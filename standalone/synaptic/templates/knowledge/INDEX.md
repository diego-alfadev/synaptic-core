---
description: "Hub MOC — map of all knowledge clusters in this brain."
type: knowledge
status: active
updated: "{{YYYY-MM-DD}}"
tags: [moc, index]
---

# Knowledge Index

Hub map of content clusters. Navigate here first; load only the cluster and nodes relevant to your task.

**How to use:** each cluster entry links to a sub-MOC (`_index.md`) that lists every node with a 1-line summary. Open only the 1–2 nodes you actually need.

---

## {{Cluster}}

- [[{{example-cluster}}/_index]] — {{1-line description of what this cluster covers}}

<!-- Add a new cluster block here each time a new `knowledge/{cluster}/` folder is created.
     Format:
     ## {Cluster display name}
     - [[{cluster}/_index]] — {{1-line scope summary}}
-->

---

## Lessons

- [[lessons/README]] — Dated lesson nodes (`type: lesson`); captures what went wrong / what changed understanding.

<!-- Lessons are nodes co-located in knowledge/lessons/. Register each new lesson here too. -->

---

> Discovery rule: a node not reachable from this index (directly or via a cluster sub-MOC) does not exist. Register every new node in its cluster `_index.md` and ensure the cluster is listed here.
