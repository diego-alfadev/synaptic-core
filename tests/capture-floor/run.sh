#!/usr/bin/env bash
# tests/capture-floor/run.sh - runtime tests for the v1.5.0 capture floor (issue #2a), POSIX side.
#
# Tests the hook scripts EXACTLY as published in recipes/session-end-consolidate.md: they are
# extracted from the fenced blocks, not copied, so the documentation a user copy-pastes is what
# gets verified. If a heading or fence in the recipe changes, extraction fails loudly.
#
# Usage:  bash tests/capture-floor/run.sh          exit 0 = every assertion passed
# Output: TAP-style lines; failures are also emitted as GitHub `::error::` annotations.
set -u

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
RECIPE="$ROOT/recipes/session-end-consolidate.md"
WORK="$(mktemp -d 2>/dev/null || mktemp -d -t syncf)"
trap 'rm -rf "$WORK"' EXIT
# Never let a fixture discover a parent git repo (the A.1 gate depends on git).
export GIT_CEILING_DIRECTORIES="$WORK"
unset SYNAPTIC_BRAIN_DIR

n=0; fails=0
# Workflow-command messages must encode %, CR and LF, or a multi-line detail is cut at its first line.
gh_esc() { local m="$1"; m=${m//%/%25}; m=${m//$'\r'/%0D}; m=${m//$'\n'/%0A}; printf '%s' "$m"; }
ok()   { n=$((n+1)); echo "ok $n - $1"; }
nok()  { n=$((n+1)); fails=$((fails+1)); echo "not ok $n - $1"; [ -n "${2:-}" ] && echo "  # $2"
         [ -n "${GITHUB_ACTIONS:-}" ] && echo "::error title=capture-floor (bash)::$(gh_esc "$1${2:+ - $2}")"; return 0; }
info() { echo "# info: $1"; [ -n "${GITHUB_ACTIONS:-}" ] && echo "::notice title=capture-floor (bash)::$(gh_esc "$1")"; return 0; }

# extract <heading-prefix> <fence-lang> <out-file>
# First fenced block of <fence-lang> after the line starting with <heading-prefix>, stopping at the
# next `### ` heading. Strips CR: on Windows checkouts the recipe is CRLF (core.autocrlf=true), and
# a CRLF shell script does not run under bash - which is itself a user-facing hazard (see README).
extract() {
  awk -v h="$1" -v lang="$2" '
    { sub(/\r$/, "") }
    !inh && index($0, h) == 1 { inh = 1; next }
    inh && /^### /            { exit }
    inh && !inb && $0 == "```" lang { inb = 1; next }
    inb && $0 == "```"        { exit }
    inb                       { print }
  ' "$RECIPE" > "$3"
  [ -s "$3" ]
}

A0="$WORK/synaptic-activity.sh"
A1="$WORK/synaptic-breadcrumb.sh"
extract "### A.0" bash "$A0" && ok "extract A.0 activity-marker (bash) from the recipe" \
  || { nok "extract A.0 activity-marker (bash) from the recipe" "heading or fence changed"; exit 1; }
extract "### A.1" bash "$A1" && ok "extract A.1 breadcrumb (bash) from the recipe" \
  || { nok "extract A.1 breadcrumb (bash) from the recipe" "heading or fence changed"; exit 1; }

LINE_RE='^(stop|boot)$'   # [X3] event only: per-day counts, no per-turn timestamps
NAME_RE='^[0-9a-f]{12}-[0-9]{4}-[0-9]{2}-[0-9]{2}\.log$'   # [X3] <host-token>-<UTC date>.log, never the raw host name
lower() { printf '%s' "$1" | tr '[:upper:]' '[:lower:]'; }
# The documented host token: first 12 hex of SHA-256 over the lower-cased host name (no newline).
host_token() { printf '%s' "$(lower "$(hostname)")" | { sha256sum 2>/dev/null || shasum -a 256; } | cut -c1-12; }
ledger() { ls "$1"/.synaptic/journal/_activity/*.log 2>/dev/null | head -n 1; }
has_bom() { [ "$(head -c 3 "$1" | od -An -tx1 | tr -d ' \n')" = "efbbbf" ]; }
has_nul() { ! tr -d '\000' < "$1" | cmp -s - "$1"; }
has_cr()  { grep -q "$(printf '\r')" "$1"; }

# --- A.0: the unconditional floor -----------------------------------------------------------
# 1. The #2a fix itself: a NON-git workspace still gets a marker.
ws="$WORK/a0-nogit"; mkdir -p "$ws/.synaptic"
( cd "$ws" && sh "$A0" stop ); rc=$?
[ "$rc" -eq 0 ] && ok "A.0 exits 0" || nok "A.0 exits 0" "rc=$rc"
f="$(ledger "$ws")"
if [ -n "$f" ]; then
  ok "A.0 writes a marker in a NON-git workspace (the issue #2a fix)"
  [ "$(wc -l < "$f" | tr -d ' ')" -eq 1 ] && ok "A.0 writes exactly one line" || nok "A.0 writes exactly one line" "$(cat "$f")"
  grep -Eq "$LINE_RE" "$f" && ok "A.0 line format is '<event>' only, no per-turn timestamp [X3]" || nok "A.0 line format is '<event>' only, no per-turn timestamp [X3]" "got: $(head -n 1 "$f")"
  has_bom "$f" && nok "A.0 ledger has no UTF-8 BOM" || ok "A.0 ledger has no UTF-8 BOM"
  has_nul "$f" && nok "A.0 ledger has no NUL bytes (not UTF-16)" || ok "A.0 ledger has no NUL bytes (not UTF-16)"
  has_cr  "$f" && nok "A.0 ledger uses LF line endings" || ok "A.0 ledger uses LF line endings"
  bn="$(basename "$f")"
  if printf '%s' "$bn" | grep -Eq "$NAME_RE" && [ "${bn%%-*}" = "$(host_token)" ]; then
    ok "A.0 ledger filename is <host-token>-<date>.log with the documented token [X3]"
  else
    nok "A.0 ledger filename is <host-token>-<date>.log with the documented token [X3]" "$bn (expected token $(host_token))"
  fi
  case "$(lower "$bn")" in
    "$(lower "$(hostname)")-"*) nok "A.0 ledger filename is not named after the raw host name [X3]" "$bn" ;;
    *) ok "A.0 ledger filename is not named after the raw host name [X3]" ;;
  esac
  gi="$ws/.synaptic/journal/_activity/.gitignore"
  if [ -f "$gi" ] && grep -qx '\*' "$gi" && grep -qx '!.gitignore' "$gi"; then
    ok "A.0 leaves the ledger untracked by default (_activity/.gitignore ignores everything but itself) [X3]"
  else
    nok "A.0 leaves the ledger untracked by default (_activity/.gitignore ignores everything but itself) [X3]" "$(cat "$gi" 2>/dev/null || echo 'no .gitignore')"
  fi
  first="$(head -n 1 "$f")"
  ( cd "$ws" && sh "$A0" boot )
  if [ "$(wc -l < "$f" | tr -d ' ')" -eq 2 ] && [ "$(head -n 1 "$f")" = "$first" ]; then
    ok "A.0 is append-only: a second event appends and the first line is untouched"
  else
    nok "A.0 is append-only" "$(cat "$f")"
  fi
else
  nok "A.0 writes a marker in a NON-git workspace (the issue #2a fix)" "no ledger file created"
fi

# 2. No brain present -> silent no-op, creates nothing.
ws="$WORK/a0-nobrain"; mkdir -p "$ws"
( cd "$ws" && sh "$A0" stop ); rc=$?
[ "$rc" -eq 0 ] && [ ! -e "$ws/.synaptic" ] && ok "A.0 with no brain: exit 0 and creates nothing" \
  || nok "A.0 with no brain: exit 0 and creates nothing" "rc=$rc"

# 3. SYNAPTIC_BRAIN_DIR override is honoured.
ws="$WORK/a0-override"; mkdir -p "$ws/custom-brain"
( cd "$ws" && SYNAPTIC_BRAIN_DIR=custom-brain sh "$A0" stop )
ls "$ws"/custom-brain/journal/_activity/*.log >/dev/null 2>&1 && ok "A.0 honours SYNAPTIC_BRAIN_DIR" \
  || nok "A.0 honours SYNAPTIC_BRAIN_DIR"

# 4. A write failure never blocks the turn (documented contract: a missed marker is acceptable).
ws="$WORK/a0-broken"; mkdir -p "$ws/.synaptic/journal"; : > "$ws/.synaptic/journal/_activity"
( cd "$ws" && sh "$A0" stop ) 2>/dev/null; rc=$?
[ "$rc" -eq 0 ] && ok "A.0 swallows a write failure and still exits 0" || nok "A.0 swallows a write failure" "rc=$rc"

# 5. Concurrency: 20 parallel same-host appends. Corruption is a failure; a missed marker is not
#    (the recipe documents it as acceptable), but the landed count is reported because the ledger
#    is the capture-yield DENOMINATOR - lost boot markers bias /synaptic-audit Step 9b.
ws="$WORK/a0-conc"; mkdir -p "$ws/.synaptic"
for i in $(seq 1 20); do ( cd "$ws" && sh "$A0" stop ) & done; wait
f="$(ledger "$ws")"
if [ -n "$f" ]; then
  got="$(wc -l < "$f" | tr -d ' ')"; bad="$(grep -Evc "$LINE_RE" "$f" || true)"
  [ "$bad" -eq 0 ] && ok "A.0 concurrency: no corrupted line across 20 parallel appends" \
    || nok "A.0 concurrency: no corrupted line across 20 parallel appends" "$bad malformed of $got"
  info "A.0 concurrency: $got/20 markers landed ($(uname -s 2>/dev/null))"
else
  nok "A.0 concurrency: ledger exists after 20 parallel appends"
fi

# --- A.1: the conditional semantic layer -----------------------------------------------------
# 6. Reproduce issue #2a: in a NON-git workspace A.1 writes NOTHING. Expected and documented -
#    this is precisely why A.0 exists. If this ever starts writing, the recipe text is stale.
ws="$WORK/a1-nogit"; mkdir -p "$ws/.synaptic/journal"; printf '# Journal\n' > "$ws/.synaptic/journal/_current.md"
before="$(cat "$ws/.synaptic/journal/_current.md")"
( cd "$ws" && bash "$A1" ) 2>/dev/null
[ "$(cat "$ws/.synaptic/journal/_current.md")" = "$before" ] \
  && ok "A.1 writes nothing in a non-git workspace (reproduces the #2a gate; expected)" \
  || nok "A.1 writes nothing in a non-git workspace" "recipe says it should not write here"

# 7. When the gate passes (git repo + a modified tracked file), A.1 appends one breadcrumb.
ws="$WORK/a1-git"; mkdir -p "$ws/.synaptic/journal"
printf '# Journal\n' > "$ws/.synaptic/journal/_current.md"
( cd "$ws" && git init -q && echo a > tracked.txt && git add tracked.txt \
  && git -c user.name=ci -c user.email=ci@example.invalid commit -qm init && echo b >> tracked.txt ) >/dev/null 2>&1
( cd "$ws" && bash "$A1" ) 2>/dev/null
last="$(tail -n 1 "$ws/.synaptic/journal/_current.md")"
case "$last" in
  "- "*"Z breadcrumb: touched tracked.txt") ok "A.1 appends one breadcrumb when a tracked file changed" ;;
  *) nok "A.1 appends one breadcrumb when a tracked file changed" "last line: $last" ;;
esac
has_bom "$ws/.synaptic/journal/_current.md" && nok "A.1 (bash) leaves the journal BOM-free" \
  || ok "A.1 (bash) leaves the journal BOM-free"

# 7b. Dedup [D1]: a later turn with the SAME uncommitted diff appends nothing (the journal's own
#     dedup rule); a turn that changes the file list appends again, even after an agent-written line.
crumbs() { grep -c ' breadcrumb: touched ' "$ws/.synaptic/journal/_current.md"; }
( cd "$ws" && bash "$A1" ) 2>/dev/null
[ "$(crumbs)" -eq 1 ] && ok "A.1 skips a breadcrumb identical to the last one (same files)" \
  || nok "A.1 skips a breadcrumb identical to the last one (same files)" "$(crumbs) breadcrumbs"
printf -- '- agent note: decided X\n' >> "$ws/.synaptic/journal/_current.md"
( cd "$ws" && bash "$A1" ) 2>/dev/null
[ "$(crumbs)" -eq 1 ] && ok "A.1 dedup keys on the last breadcrumb, not the last line" \
  || nok "A.1 dedup keys on the last breadcrumb, not the last line" "$(crumbs) breadcrumbs"
( cd "$ws" && echo c > second.txt && git add second.txt ) >/dev/null 2>&1
( cd "$ws" && bash "$A1" ) 2>/dev/null
[ "$(crumbs)" -eq 2 ] && ok "A.1 appends again when the touched-file list changes" \
  || nok "A.1 appends again when the touched-file list changes" "$(crumbs) breadcrumbs"

# --- A.2 reminder + A.3 rescue: one git-free "unconsolidated work?" predicate --------------------
# Work = pending breadcrumb lines in journal/_current.md, or open playground directories.
# playgrounds/archive/ is not open, and the A.0 activity ledger is not work. [C2 C4 C6]
A2="$WORK/synaptic-consolidate-reminder.sh"
A3="$WORK/synaptic-rescue.sh"
extract "### A.2" bash "$A2" && ok "extract A.2 consolidation reminder (bash) from the recipe" \
  || { nok "extract A.2 consolidation reminder (bash) from the recipe" "heading or fence changed"; exit 1; }
extract "### A.3" bash "$A3" && ok "extract A.3 rescue check (bash) from the recipe" \
  || { nok "extract A.3 rescue check (bash) from the recipe" "heading or fence changed"; exit 1; }
mkbrain() { mkdir -p "$WORK/$1/.synaptic/journal" "$WORK/$1/.synaptic/playgrounds"
            printf '# Journal\n' > "$WORK/$1/.synaptic/journal/_current.md"; echo "$WORK/$1"; }
commitall() { ( cd "$1" && git add -A \
                && git -c user.name=ci -c user.email=ci@example.invalid -c commit.gpgsign=false commit -qm c ) >/dev/null 2>&1; }
gitinit() { ( cd "$1" && git init -q ) >/dev/null 2>&1; commitall "$1"; }
hook() { ( cd "$1" && bash "$2" ) > "$WORK/out.txt" 2> "$WORK/err.txt"; echo $? > "$WORK/rc.txt"; }
quiet() { [ "$(cat "$WORK/rc.txt")" = 0 ] && [ ! -s "$WORK/out.txt" ] && [ ! -s "$WORK/err.txt" ]; }
said()  { [ "$(cat "$WORK/rc.txt")" = 0 ] && grep -q "$1" "$WORK/out.txt"; }
crumb='- 2026-10-29T10:00Z breadcrumb: touched a.md'

ws=$(mkbrain a3-zero); hook "$ws" "$A3"                                                      # C6
quiet && ok "A.3 with zero breadcrumbs is silent (no shell error on every boot)" \
  || nok "A.3 with zero breadcrumbs is silent" "stderr: $(head -c 160 "$WORK/err.txt")"
ws=$(mkbrain a3-archive); mkdir -p "$ws/.synaptic/playgrounds/archive/old"; hook "$ws" "$A3"   # C4
quiet && ok "A.3 does not count playgrounds/archive/ as an open playground" \
  || nok "A.3 does not count playgrounds/archive/" "$(tr '\n' ' ' < "$WORK/out.txt" | head -c 160)"
ws=$(mkbrain a3-pending); mkdir -p "$ws/.synaptic/playgrounds/task"
printf '%s\n%s\n' "$crumb" "$crumb" >> "$ws/.synaptic/journal/_current.md"; hook "$ws" "$A3"
said "2 pending breadcrumb(s) and 1 open playground(s)" && ok "A.3 reports pending breadcrumbs and open playgrounds" \
  || nok "A.3 reports pending breadcrumbs and open playgrounds" "$(tr '\n' ' ' < "$WORK/out.txt" | head -c 160)"
ws=$(mkbrain a2-nogit); mkdir -p "$ws/.synaptic/playgrounds/task"; hook "$ws" "$A2"            # C2
said "consolidation reminder" && ok "A.2 reminds on a NON-git brain with an open playground" \
  || nok "A.2 reminds on a NON-git brain with an open playground" "no reminder printed"
ws=$(mkbrain a2-untracked); gitinit "$ws"; mkdir -p "$ws/.synaptic/playgrounds/new"           # C2
echo x > "$ws/.synaptic/playgrounds/new/notes.md"; hook "$ws" "$A2"
said "consolidation reminder" && ok "A.2 reminds for an untracked new playground in a git repo" \
  || nok "A.2 reminds for an untracked new playground in a git repo" "no reminder printed"
ws=$(mkbrain a2-marker); mkdir -p "$ws/.synaptic/journal/_activity"                            # C2
echo "2026-10-29T10:00:00Z boot" > "$ws/.synaptic/journal/_activity/h-2026-10-29.log"; gitinit "$ws"
echo "2026-10-29T10:05:00Z stop" >> "$ws/.synaptic/journal/_activity/h-2026-10-29.log"; hook "$ws" "$A2"
quiet && ok "A.2 stays silent when only the activity ledger changed (no reminder every session)" \
  || nok "A.2 stays silent when only the activity ledger changed" "false reminder"
ws=$(mkbrain a2-crumbs); gitinit "$ws"; echo "$crumb" >> "$ws/.synaptic/journal/_current.md"; hook "$ws" "$A2"
said "consolidation reminder" && ok "A.2 reminds when breadcrumbs are pending" \
  || nok "A.2 reminds when breadcrumbs are pending" "no reminder printed"
ws=$(mkbrain a2-archive); mkdir -p "$ws/.synaptic/playgrounds/archive/old"; hook "$ws" "$A2"   # C4
quiet && ok "A.2 does not count playgrounds/archive/ (silent, no stderr)" \
  || nok "A.2 does not count playgrounds/archive/" "$(tr '\n' ' ' < "$WORK/out.txt" | head -c 160)"
ws=$(mkbrain a3-pg); mkdir -p "$ws/.synaptic/playgrounds/task"; hook "$ws" "$A3"   # each half of the OR alone
said "0 pending breadcrumb(s) and 1 open playground(s)" && ok "A.3 reports an open playground on its own" \
  || nok "A.3 reports an open playground on its own" "$(tr '\n' ' ' < "$WORK/out.txt" | head -c 160)"
ws=$(mkbrain a3-crumb); echo "$crumb" >> "$ws/.synaptic/journal/_current.md"; hook "$ws" "$A3"
said "1 pending breadcrumb(s) and 0 open playground(s)" && ok "A.3 reports a pending breadcrumb on its own" \
  || nok "A.3 reports a pending breadcrumb on its own" "$(tr '\n' ' ' < "$WORK/out.txt" | head -c 160)"
ws="$WORK/bare"; mkdir -p "$ws/.synaptic/knowledge"; hook "$ws" "$A2"; r2=$(quiet && echo y); hook "$ws" "$A3"
[ "$r2" = y ] && quiet && ok "A.2 and A.3 are quiet with no journal and no playgrounds/ (exit 0)" \
  || nok "A.2 and A.3 are quiet with no journal and no playgrounds/" "rc=$(cat "$WORK/rc.txt")"
ws=$(mkbrain a2-case); echo '- 2026-10-29T10:00Z Breadcrumb: touched a.md' >> "$ws/.synaptic/journal/_current.md"
hook "$ws" "$A2"; quiet && ok "A.2 counts only the lowercase hook token 'breadcrumb:'" \
  || nok "A.2 counts only the lowercase hook token 'breadcrumb:'" "$(tr '\n' ' ' < "$WORK/out.txt" | head -c 160)"

# --- End to end in the A.4 order (A.0 -> A.1 -> A.2) on a committed git brain [C2] ---------------
# A.1 must not turn the brain's own bookkeeping (the A.0 ledger, the journal it writes) into breadcrumbs,
# or the reminder can never go quiet.
ws=$(mkbrain chain-qa); ( cd "$ws" && bash "$A0" boot ) >/dev/null 2>&1; gitinit "$ws"
( cd "$ws" && bash "$A0" stop; bash "$A1" ) >/dev/null 2>&1; hook "$ws" "$A2"
quiet && ok "chain: a turn that only wrote the activity ledger leaves no reminder" \
  || nok "chain: a turn that only wrote the activity ledger leaves no reminder" "journal: $(tail -n 1 "$ws/.synaptic/journal/_current.md")"
ws=$(mkbrain chain-cons); echo "$crumb" >> "$ws/.synaptic/journal/_current.md"; gitinit "$ws"
printf '# Journal\n- [2026-10-29] consolidated\n' > "$ws/.synaptic/journal/_current.md"
( cd "$ws" && bash "$A1" ) >/dev/null 2>&1; commitall "$ws"; hook "$ws" "$A2"
quiet && ok "chain: a journal-only consolidation turn's own Stop does not re-arm the reminder" \
  || nok "chain: a journal-only consolidation turn's own Stop does not re-arm the reminder" "journal: $(tail -n 1 "$ws/.synaptic/journal/_current.md")"
nd=$'An\xc3\xa1lisis'   # a non-ASCII folder between the repo root and the brain: git prints the path "quoted"
ws="$WORK/chain-quoted"; bw="$ws/$nd"; mkdir -p "$bw/.synaptic/journal" "$bw/.synaptic/playgrounds"
printf '# Journal\n%s\n' "$crumb" > "$bw/.synaptic/journal/_current.md"; gitinit "$ws"
printf '# Journal\n- [2026-10-29] consolidated\n' > "$bw/.synaptic/journal/_current.md"
( cd "$bw" && bash "$A1" ) >/dev/null 2>&1; commitall "$ws"; hook "$bw" "$A2"
quiet && ok "chain: the journal stays filtered when git quotes a non-ASCII path" \
  || nok "chain: the journal stays filtered when git quotes a non-ASCII path" "journal: $(tail -n 1 "$bw/.synaptic/journal/_current.md")"
ws=$(mkbrain chain-work); echo a > "$ws/app.txt"; gitinit "$ws"; echo b >> "$ws/app.txt"
( cd "$ws" && bash "$A1" ) >/dev/null 2>&1; hook "$ws" "$A2"
said "1 pending breadcrumb(s)" && ok "chain: a real project edit becomes a breadcrumb and triggers the reminder" \
  || nok "chain: a real project edit becomes a breadcrumb and triggers the reminder" "$(tr '\n' ' ' < "$WORK/out.txt" | head -c 160)"

# --- The DEPLOYED copy: the pinned one-liner in references/capture-hooks.md --------------------------------------------
# /synaptic-init and /synaptic-upgrade wire THIS block into the host, not the recipe's script, so it is
# the copy users actually run. It lives inside a blockquote; <brain> is a placeholder the agent fills.
SKILL="$ROOT/standalone/synaptic/references/capture-hooks.md"   # the deployed one-liners (moved out of SKILL.md in v1.6)
extract_quoted() {   # like extract(), but strips the blockquote prefix and anchors on a list item
  awk -v h="$1" -v lang="$2" '
    { sub(/\r$/, ""); sub(/^> ?/, "") }
    !inh && index($0, h) == 1 { inh = 1; next }
    inh && !inb && $0 == "```" lang { inb = 1; next }
    inb && $0 == "```"        { exit }
    inb                       { print }
  ' "$SKILL" > "$3"
  [ -s "$3" ]
}
SK="$WORK/skill-oneliner.sh"
if extract_quoted "- **Encoding PINNED" sh "$SK"; then
  ok "extract the deployed sh one-liner (capture-hooks.md)"
  # 8. Filled with an ABSOLUTE brain path (what the SKILL instructs), run from an unrelated directory.
  ws="$WORK/skill-abs"; mkdir -p "$ws/.synaptic" "$WORK/elsewhere"
  sed "s#<brain>#$ws/.synaptic#g" "$SK" > "$WORK/skill-abs.sh"
  ( cd "$WORK/elsewhere" && sh "$WORK/skill-abs.sh" ); rc=$?
  f="$(ledger "$ws")"
  if [ "$rc" -eq 0 ] && [ -n "$f" ] && grep -Eq "$LINE_RE" "$f" && basename "$f" | grep -Eq "$NAME_RE" \
     && [ -f "$ws/.synaptic/journal/_activity/.gitignore" ]; then
    ok "deployed sh one-liner writes a well-formed marker into an absolute brain path"
  else
    nok "deployed sh one-liner writes a well-formed marker into an absolute brain path" "rc=$rc ledger=${f:-none}"
  fi
  # 9. Contract parity with the recipe's A.0: a stale hook pointing at a brain that no longer exists must
  #    not recreate it. Otherwise moving or deleting a brain leaves a ghost .synaptic/journal/_activity.
  gone="$WORK/skill-gone/.synaptic"
  sed "s#<brain>#$gone#g" "$SK" > "$WORK/skill-gone.sh"
  ( cd "$WORK/elsewhere" && sh "$WORK/skill-gone.sh" ); rc=$?
  if [ "$rc" -eq 0 ] && [ ! -e "$gone" ]; then ok "deployed sh one-liner with an absent brain: exit 0 and recreates nothing"
  else nok "deployed sh one-liner with an absent brain: exit 0 and recreates nothing" "rc=$rc; it created $gone (a ghost brain directory)"; fi
else
  nok "extract the deployed sh one-liner (capture-hooks.md)" "anchor '- **Encoding PINNED' or the sh fence moved"
fi

# --- The fingerprint primitive (references/fingerprint.md) [X4/S4] -----------------------------
# The one hash definition. Both forms must ignore CR, the body form must ignore the frontmatter and a
# missing final newline, and sh must equal PowerShell on every fixture (checked further below).
FPDOC="$ROOT/standalone/synaptic/references/fingerprint.md"
extract_doc() {   # <file> <## heading prefix> <fence-lang> <out>: first such fence before the next "## "
  awk -v h="$2" -v lang="$3" '
    { sub(/\r$/, "") }
    !inh && index($0, h) == 1 { inh = 1; next }
    inh && /^## /             { exit }
    inh && !inb && $0 == "```" lang { inb = 1; next }
    inb && $0 == "```"        { exit }
    inb                       { print }
  ' "$1" > "$4"
  [ -s "$4" ]
}
FPW="$WORK/fp-whole.sh"; FPB="$WORK/fp-body.sh"
if extract_doc "$FPDOC" "## Whole-file fingerprint" sh "$FPW" && extract_doc "$FPDOC" "## Body fingerprint" sh "$FPB"; then
  ok "extract the sh fingerprint commands from references/fingerprint.md"
  fx="$WORK/fp"; mkdir -p "$fx"
  printf -- '---\ntitle: x\n---\nBody line 1\nBody line 2\n' > "$fx/lf.md"
  printf -- '---\r\ntitle: x\r\n---\r\nBody line 1\r\nBody line 2\r\n' > "$fx/crlf.md"
  printf -- '---\ntitle: x\n---\nBody line 1\nBody line 2' > "$fx/nofinal.md"
  printf -- '---\ntitle: y\nextra: 1\n---\nBody line 1\nBody line 2\n' > "$fx/fm2.md"
  printf -- 'Body line 1\nBody line 2\n' > "$fx/nofm.md"
  printf -- '---\ntitle: x\nBody line 1\n' > "$fx/unterminated.md"
  printf 'a\r\nb\r\n' > "$fx/known.txt"
  fp() { sed "s#<file>#$2#g" "$1" > "$WORK/fp-run.sh"; sh "$WORK/fp-run.sh"; }
  w_lf="$(fp "$FPW" "$fx/lf.md")"; w_crlf="$(fp "$FPW" "$fx/crlf.md")"; w_fm2="$(fp "$FPW" "$fx/fm2.md")"
  printf '%s' "$w_lf" | grep -Eqx '[0-9a-f]{12}' && ok "fingerprint is 12 lower-case hex" || nok "fingerprint is 12 lower-case hex" "got '$w_lf'"
  [ "$w_lf" = "$w_crlf" ] && ok "whole-file fingerprint: CRLF and LF copies agree" || nok "whole-file fingerprint: CRLF and LF copies agree" "$w_lf vs $w_crlf"
  [ "$w_lf" != "$w_fm2" ] && ok "whole-file fingerprint changes when the frontmatter changes" || nok "whole-file fingerprint changes when the frontmatter changes"
  want=911169ddaaf1   # SHA-256 of "a\nb\n", first 12 hex: a fixed literal, independent of any tool here
  [ "$(fp "$FPW" "$fx/known.txt")" = "$want" ] && ok "whole-file fingerprint = SHA-256 of the CR-stripped bytes (known answer)" \
    || nok "whole-file fingerprint = SHA-256 of the CR-stripped bytes (known answer)" "$(fp "$FPW" "$fx/known.txt") vs $want"
  b_lf="$(fp "$FPB" "$fx/lf.md")"; bad=""
  for f in crlf nofinal fm2 nofm; do [ "$(fp "$FPB" "$fx/$f.md")" = "$b_lf" ] || bad="$bad $f"; done
  [ -z "$bad" ] && ok "body fingerprint ignores CR, a missing final newline and the frontmatter" \
    || nok "body fingerprint ignores CR, a missing final newline and the frontmatter" "differs for:$bad"
  [ "$(fp "$FPB" "$fx/unterminated.md")" = "$(fp "$FPW" "$fx/unterminated.md")" ] \
    && ok "body fingerprint: an unterminated frontmatter is part of the body" \
    || nok "body fingerprint: an unterminated frontmatter is part of the body"
else
  nok "extract the sh fingerprint commands from references/fingerprint.md" "heading or fence changed"
fi

# --- Autonomy-tier default parity [S3] -------------------------------------------------------
# The skill-side default (references/contract.md §5) and the table every new brain copies
# (templates/harness/guardrails.md) must stay identical; only table-less brains ever read the default.
tiers() { tr -d '\r' < "$1" | grep -E '^\| \*\*(AUTO|PROPOSE-THEN-APPROVE|HUMAN-ONLY)\*\*'; }
TDEF="$(tiers "$ROOT/standalone/synaptic/references/contract.md")"
TTPL="$(tiers "$ROOT/standalone/synaptic/templates/harness/guardrails.md")"
if [ -n "$TDEF" ] && [ "$(printf '%s\n' "$TDEF" | wc -l | tr -d ' ')" -eq 3 ] && [ "$TDEF" = "$TTPL" ]; then
  ok "autonomy-tier default in contract.md = the guardrails template table (3 rows) [S3]"
else
  nok "autonomy-tier default in contract.md = the guardrails template table (3 rows) [S3]" "the two tables differ or a row is missing"
fi

# --- Cross-shell consistency ------------------------------------------------------------------
# The sh marker hashes `hostname`; the PowerShell copy hashes $env:COMPUTERNAME on Windows and
# [Net.Dns]::GetHostName() elsewhere, both lower-cased. Mixed sh + PowerShell hooks on one host must land
# in ONE ledger file per day. Windows can still split when the names differ beyond case (a DNS name past
# the 15-character NetBIOS limit). Runs wherever a PowerShell is on PATH (powershell.exe, else pwsh).
PSX="$(command -v powershell.exe 2>/dev/null || command -v pwsh 2>/dev/null || true)"
if [ -n "$PSX" ]; then
  A0PS="$WORK/synaptic-activity.ps1"
  ws="$WORK/xshell"; mkdir -p "$ws/.synaptic"
  if extract "### A.0" powershell "$A0PS"; then
    ( cd "$ws" && sh "$A0" stop && "$PSX" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "$(cygpath -w "$A0PS" 2>/dev/null || echo "$A0PS")" boot ) >/dev/null 2>&1
    nfiles="$(ls "$ws"/.synaptic/journal/_activity/*.log 2>/dev/null | wc -l | tr -d ' ')"
    if [ "$nfiles" -eq 1 ] && [ "$(wc -l < "$(ledger "$ws")" | tr -d ' ')" -eq 2 ]; then
      ok "sh and PowerShell markers on one host share ONE ledger file (same host token) [X3]"
    elif [ -n "${COMPUTERNAME:-}" ] && [ "$(lower "$(hostname)")" != "$(lower "$COMPUTERNAME")" ]; then
      info "bash 'hostname' ($(hostname)) differs from COMPUTERNAME ($COMPUTERNAME) beyond case: mixed sh+PowerShell hooks split the ledger"
    else
      nok "sh and PowerShell markers on one host share ONE ledger file (same host token) [X3]" "$(ls "$ws"/.synaptic/journal/_activity/ 2>/dev/null | tr '\n' ' ')"
    fi
  else
    nok "extract A.0 activity-marker (PowerShell) from the recipe" "heading or fence changed"
  fi
  # Fingerprint parity [X4]: the PowerShell forms must print exactly what the sh forms print.
  if [ -n "${b_lf:-}" ] && extract_doc "$FPDOC" "## Whole-file fingerprint" powershell "$WORK/fpw.ps1.in" \
     && extract_doc "$FPDOC" "## Body fingerprint" powershell "$WORK/fpb.ps1.in"; then
    winp() { cygpath -w "$1" 2>/dev/null || echo "$1"; }
    psfp() { sed "s#<file>#$(winp "$2" | sed 's#\\#\\\\#g')#g" "$1" > "$WORK/fp-run.ps1"
             "$PSX" -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "$(winp "$WORK/fp-run.ps1")" 2>/dev/null | tr -d '\r'; }
    bad=""
    for f in lf crlf nofinal fm2 nofm unterminated; do
      pw="$(psfp "$WORK/fpw.ps1.in" "$fx/$f.md")"; printf '%s' "$pw" | grep -Eqx '[0-9a-f]{12}' || bad="$bad shape:$f"
      [ "$pw" = "$(fp "$FPW" "$fx/$f.md")" ] || bad="$bad whole:$f"
      [ "$(psfp "$WORK/fpb.ps1.in" "$fx/$f.md")" = "$(fp "$FPB" "$fx/$f.md")" ] || bad="$bad body:$f"
    done
    [ -z "$bad" ] && ok "fingerprint: PowerShell = sh on LF, CRLF, no-final-newline and frontmatter fixtures [X4]" \
      || nok "fingerprint: PowerShell = sh on LF, CRLF, no-final-newline and frontmatter fixtures [X4]" "differs:$bad"
  else
    nok "extract the PowerShell fingerprint commands from references/fingerprint.md" "heading or fence changed (or the sh half failed)"
  fi
else
  info "cross-shell ledger + fingerprint tests skipped: no powershell.exe or pwsh on PATH"
fi

echo "1..$n"
[ "$fails" -eq 0 ] && echo "# all $n passed" || echo "# $fails of $n FAILED"
exit $(( fails > 0 ? 1 : 0 ))
