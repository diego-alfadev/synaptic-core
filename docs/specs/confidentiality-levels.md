# CONF-1 — confidentiality levels (spec only)

Status: draft; no runtime enforcement or permission change. Existing guardrails remain authoritative.

Workspace binding selects a default sensitivity, with a stricter per-node override. Do not depend on
a manual work/personal toggle. The level governs capture redaction and what may leave through export,
handover, sync, git or cross-brain promotion. A local multi-context brain is private by default; project
knowledge may travel only within its authorised boundary. Separate brains remain a valid isolation
technique, not a universal replacement for workspace-bound policy.

Before implementation decide: vocabulary and ordering; treatment of missing bindings; detection of
sync destinations; propagation of sensitivity into derived indexes; who may lower sensitivity; and
whether cross-brain operations deny by default. Any ambiguous scope denies egress until resolved.
No feature in this candidate authorises sharing or relaxes an existing confidentiality rule.
