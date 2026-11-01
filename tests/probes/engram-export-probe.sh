#!/usr/bin/env bash
# tests/probes/engram-export-probe.sh - records Engram's real GET /export contract.
#
# The Phase 6 promotion adapter is blocked on it: in v2.0.0, DOCS.md documented a versioned JSON backup
# (format 0.2.0, ?project= / ?all_projects=), while the first-party Obsidian plugin called ?since= and
# declared a different body with no version field. v3.0.0's notes say the plugin was changed to consume
# /export "as full snapshots". This probe asks the server itself, for each version it is given.
#
# REPORTS ONLY - it never asserts a shape. It fails only if it cannot obtain or start a verified binary.
# Linux only. The release binary is verified against that release's checksums.txt (integrity, not
# authenticity: both come from the same release). It runs on a CI runner, never on a developer machine.
#
# Usage: ENGRAM_VERSION=3.6.0 bash tests/probes/engram-export-probe.sh
set -u
VER="${ENGRAM_VERSION:?set ENGRAM_VERSION, e.g. 3.6.0}"
OUT="${PROBE_OUT:-$(mktemp -d)}"; mkdir -p "$OUT"; cd "$OUT" || exit 1
API="http://127.0.0.1:7437"

note() { echo "$1"; [ -n "${GITHUB_ACTIONS:-}" ] && echo "::notice title=engram ${VER} export probe::$1"; return 0; }
fail() { echo "FAIL: $1"; [ -n "${GITHUB_ACTIONS:-}" ] && echo "::error title=engram ${VER} export probe::$1"; exit 1; }

base="https://github.com/Gentleman-Programming/engram/releases/download/v${VER}"
asset="engram_${VER}_linux_amd64.tar.gz"
DL="curl -fsSL --retry 3 --retry-all-errors --connect-timeout 10 --max-time 180"
$DL -o "$asset" "$base/$asset" || fail "could not download $asset"
$DL -o checksums.txt "$base/checksums.txt" || fail "could not download checksums.txt"
grep " ${asset}\$" checksums.txt | sha256sum -c - >/dev/null 2>&1 || fail "checksum mismatch for $asset"
tar xzf "$asset" || fail "could not extract $asset"
BIN="$(find . -maxdepth 3 -type f -name engram | head -n 1)"
[ -n "$BIN" ] || fail "no engram binary inside $asset"
chmod +x "$BIN"
note "binary $("$BIN" version 2>&1 | head -n 1)"

export ENGRAM_DATA_DIR="$OUT/data" ENGRAM_PORT=7437
unset ENGRAM_HTTP_TOKEN ENGRAM_CLOUD_AUTOSYNC ENGRAM_MANAGED_LOCAL
"$BIN" serve > serve.log 2>&1 &
PID=$!
trap 'kill "$PID" 2>/dev/null' EXIT
up=0
for _ in $(seq 1 30); do curl -fs --max-time 2 "$API/health" >/dev/null 2>&1 && { up=1; break; }; sleep 1; done
[ "$up" -eq 1 ] || { tail -n 30 serve.log; fail "engram serve never answered /health"; }

# Seed one session and one observation so /export has a body to describe. Failures are REPORTED, not
# fatal: the response itself documents what the write contract wants.
post() {   # post <label> <path> <json>
  local code; code=$(curl -s --max-time 15 -o "$1.json" -w '%{http_code}' -X POST "$API$2" -H 'Content-Type: application/json' -d "$3")
  note "POST $2 -> HTTP $code $(head -c 240 "$1.json" | tr '\n' ' ')"
}
post seed-session /sessions '{"id":"ci-probe","project":"ci-probe","directory":"/tmp/ci-probe"}'
post seed-obs /observations '{"session_id":"ci-probe","project":"ci-probe","scope":"project","type":"decision","title":"CI probe observation","content":"**What**: record the export contract"}'

get() {   # get <label> <path>  - reports the envelope AND the body size, so "honoured" and "ignored"
  local code shape   # parameters are distinguishable (a shape alone is identical either way)
  code=$(curl -s --max-time 15 -o "$1.json" -w '%{http_code}' "$API$2")
  shape=$(jq -c 'if type == "object"
                 then {keys: keys, version: (.version // .format_version // .format // null),
                       n_obs: ((.observations // []) | length), n_sess: ((.sessions // []) | length)}
                 else {type: type} end' "$1.json" 2>/dev/null || echo '"not JSON"')
  note "GET $2 -> HTTP $code shape=$shape"
}
get export-proj   '/export?project=ci-probe'
# Discriminating: with a FUTURE cursor an honoured ?since= returns n_obs=0; an ignored one returns the
# same n_obs as export-proj. (Read in the source at both tags: handleExport parses project,
# all_projects and cwd only - this confirms it on the running server.)
get export-since  '/export?project=ci-probe&since=2100-01-01T00:00:00Z'
get export-all    '/export?all_projects=true'
# With no selector the server resolves a project from ITS OWN working directory (here the probe dir),
# which is not the seeded project - so an empty body here means "phantom project", not "empty store".
get export-bare   '/export'
get export-cwd    '/export?cwd=/tmp/ci-probe'

# The keys of the first observation-like object, so the adapter is designed against reality.
k=$(jq -c '[.. | objects | select(has("title") and has("content"))][0] | keys' export-proj.json 2>/dev/null)
note "first observation keys: ${k:-none found}"
# Plain echo, not an annotation: GitHub caps annotations per step, and the HTTP codes above already
# answer it - every /export call ran with ENGRAM_HTTP_TOKEN unset (delta item S4: open by default?).
echo "note: all /export calls above ran with ENGRAM_HTTP_TOKEN unset"
exit 0
