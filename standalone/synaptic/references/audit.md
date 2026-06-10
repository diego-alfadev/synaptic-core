# /audit — Brain Health Audit Reference

Cross-session review for staleness, orphan pages, broken links, budget violations, and identity drift.
Run when: user asks to audit the brain, after several sessions, or when something feels off.

---

## Step 1: Staleness Pass

Scan all pages under `knowledge/` and `playbooks/`:

- Flag any page where `updated:` date is more than 90 days ago.
- Flag any page with `status: stale`.
- For each flagged page: note the staleness age and the likely section to review.

Do **not** auto-update pages — present findings first and ask before changing anything.

---

## Step 2: Orphan Detection

Read `knowledge/INDEX.md` and `playbooks/_index.md`. Then scan all `.md` files in `knowledge/` and `playbooks/`:

- Any `.md` file not listed in INDEX.md (or `_index.md`) is an **orphan**.
- List orphans with their path. Ask: "Register in INDEX.md, move, or delete?"

---

## Step 3: Broken Wikilinks

Scan all pages for `[[wikilink]]` patterns. For each link:
- Resolve: does a file with that name exist in `knowledge/`?
- Flag unresolved links as broken. Note the source page and the broken target.

Do not attempt to auto-fix — surface the list and let the user decide (create the target page, rename, or remove the link).

---

## Step 4: Budget Violations

Check size budgets from `cortex.config.yaml`:
- `BRAIN.md` — must be ≤120 lines. Flag if exceeded; suggest trimming the Identity Capsule or moving detail to `identity/ROLE.md`.
- `journal/_current.md` — must be ≤200 lines. Flag if exceeded; suggest `/consolidate`.
- Any `knowledge/` page — soft limit 150 lines. Flag pages exceeding this; suggest splitting.

---

## Step 5: Identity Drift Check

Read `identity/ROLE.md` and `identity/PRINCIPLES.md`. Compare with the Identity Capsule in `BRAIN.md`:
- Are the role summary and top constraints still accurate?
- Are there constraints in PRINCIPLES.md that are not reflected in BRAIN.md?
- If drift detected: suggest updating the Identity Capsule in BRAIN.md.

---

## Step 6: Report

Present findings as an actionable checklist, grouped by category. Maximum 10 findings; prioritise by impact.

```
Brain audit — N findings:

## Stale pages (>90 days or status: stale)
1. knowledge/foo.md — last updated YYYY-MM-DD (NNN days ago)
   → Review section: [likely section]

## Orphan pages (not in INDEX.md)
2. knowledge/bar.md — not registered
   → Register, move, or delete?

## Broken wikilinks
3. knowledge/baz.md [[missing-page]] — target not found
   → Create target, rename, or remove link?

## Budget violations
4. journal/_current.md — 247 lines (limit: 200)
   → Run /consolidate

## Identity drift
5. PRINCIPLES.md has constraint not in BRAIN.md capsule
   → Update Identity Capsule?
```

Ask: "Apply all? Or pick specific items?" — do not make changes without confirmation.
