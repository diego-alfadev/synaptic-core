# tests/capture-floor/run.ps1 - runtime tests for the v1.5.0 capture floor (issue #2a), PowerShell side.
#
# Tests the hook scripts EXACTLY as published in recipes/session-end-consolidate.md (extracted from the
# fenced blocks, not copied). Runs under whichever PowerShell executes it, so CI runs it once under
# Windows PowerShell 5.1 and once under PowerShell 7 - the encoding defaults differ between the two,
# and the 5.1 defaults are the original issue #2a PowerShell bug.
#
# Hooks are launched the way an agent host launches them: a NEW process whose working directory is the
# workspace. One test deliberately invokes in-process after Set-Location, because that is how a user
# debugging a hook from their own terminal runs it.
#
# Usage:  powershell -NoProfile -ExecutionPolicy Bypass -File tests/capture-floor/run.ps1
#         pwsh -NoProfile -File tests/capture-floor/run.ps1
# Exit 0 = every assertion passed. Must stay PowerShell 5.1-compatible (no ternary, no ??, no &&).

$ErrorActionPreference = 'Stop'
$Label   = "PS $($PSVersionTable.PSVersion) $($PSVersionTable.PSEdition)"
$PsExe   = (Get-Process -Id $PID).Path
$Root    = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).ProviderPath
$Recipe  = Join-Path $Root 'recipes/session-end-consolidate.md'
$Skill   = Join-Path $Root 'standalone/synaptic/references/capture-hooks.md'   # deployed one-liners (moved out of SKILL.md in v1.6)
$SkillCore = Join-Path $Root 'standalone/synaptic/SKILL.md'
$FpDoc   = Join-Path $Root 'standalone/synaptic/references/fingerprint.md'
$Work    = Join-Path ([IO.Path]::GetTempPath()) ('syncf-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $Work | Out-Null
# Any write that wrongly resolves against the .NET process directory lands here, never in a real brain.
$Decoy   = Join-Path $Work '_process-cwd'
New-Item -ItemType Directory -Path $Decoy | Out-Null
[Environment]::CurrentDirectory = $Decoy
$env:GIT_CEILING_DIRECTORIES = $Work
Remove-Item Env:SYNAPTIC_BRAIN_DIR -ErrorAction SilentlyContinue
$InCi = [bool]$env:GITHUB_ACTIONS

$script:n = 0; $script:fails = 0
function Ok([string]$m)  { $script:n++; Write-Output "ok $($script:n) - [$Label] $m" }
# Workflow-command messages must encode %, CR and LF, or a multi-line detail is cut at its first line.
function Format-GhMessage([string]$s) { return $s.Replace('%', '%25').Replace("`r", '%0D').Replace("`n", '%0A') }
function Nok([string]$m, [string]$d) {
    $script:n++; $script:fails++
    Write-Output "not ok $($script:n) - [$Label] $m"
    if ($d) { Write-Output "  # $d" }
    $t = $m; if ($d) { $t = "$m - $d" }
    if ($InCi) { Write-Output "::error title=capture-floor ($Label)::$(Format-GhMessage $t)" }
}
function Info([string]$m) {
    Write-Output "# info: [$Label] $m"
    if ($InCi) { Write-Output "::notice title=capture-floor ($Label)::$(Format-GhMessage $m)" }
}

function Get-Block([string]$Heading, [string]$Lang, [string]$Path = $Recipe, [string]$Stop = '### ') {
    $lines = [IO.File]::ReadAllLines($Path, [Text.Encoding]::UTF8)
    $inH = $false; $inB = $false; $out = New-Object System.Collections.Generic.List[string]
    foreach ($raw in $lines) {
        $l = $raw.TrimEnd("`r")
        if (-not $inH) { if ($l.StartsWith($Heading)) { $inH = $true }; continue }
        if (-not $inB) {
            if ($l.StartsWith($Stop)) { break }
            if ($l -eq ('```' + $Lang)) { $inB = $true }
            continue
        }
        if ($l -eq '```') { break }
        $out.Add($l)
    }
    return ,$out.ToArray()
}

function Save-Script([string]$Name, [string[]]$Body) {
    # Saved WITHOUT a BOM: that is what most editors (VS Code's default) produce when a user pastes
    # the recipe, and it is the stricter case for Windows PowerShell 5.1.
    $p = Join-Path $Work $Name
    [IO.File]::WriteAllText($p, (($Body -join "`r`n") + "`r`n"), (New-Object Text.UTF8Encoding $false))
    return $p
}

function Start-Hook([string]$File, [string]$Arg, [string]$Cwd, [hashtable]$Vars) {
    $psi = New-Object Diagnostics.ProcessStartInfo
    $psi.FileName = $PsExe
    $psi.Arguments = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File `"$File`" $Arg"
    $psi.WorkingDirectory = $Cwd
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    if ($psi.EnvironmentVariables.ContainsKey('SYNAPTIC_BRAIN_DIR')) { $psi.EnvironmentVariables.Remove('SYNAPTIC_BRAIN_DIR') }
    if ($Vars) { foreach ($k in $Vars.Keys) { $psi.EnvironmentVariables[$k] = $Vars[$k] } }
    # Stdin is always redirected and closed, like a host does: $script:HookIn is the hook's JSON (empty =
    # the host gave no session id). A hook that reads stdin must never hang a test.
    $psi.RedirectStandardInput = $true
    $p = [Diagnostics.Process]::Start($psi)
    if ($script:HookIn) { $p.StandardInput.Write($script:HookIn) }
    $p.StandardInput.Close()
    return $p
}
$script:HookIn = ''
function Invoke-Hook([string]$File, [string]$Arg, [string]$Cwd, [hashtable]$Vars) {
    $p = Start-Hook $File $Arg $Cwd $Vars
    $p.WaitForExit()
    return $p.ExitCode
}

function Get-Ledger([string]$Brain) {
    $d = Join-Path $Brain 'journal/_activity'
    if (-not (Test-Path -LiteralPath $d)) { return $null }
    return Get-ChildItem -LiteralPath $d -Filter '*.log' | Select-Object -First 1
}
function Test-Bom([string]$Path) {
    $b = [IO.File]::ReadAllBytes($Path)
    return ($b.Length -ge 3 -and $b[0] -eq 0xEF -and $b[1] -eq 0xBB -and $b[2] -eq 0xBF)
}
function Test-BomAnywhere([string]$Path) {
    $b = [IO.File]::ReadAllBytes($Path)
    for ($i = 0; $i -le $b.Length - 3; $i++) {
        if ($b[$i] -eq 0xEF -and $b[$i + 1] -eq 0xBB -and $b[$i + 2] -eq 0xBF) { return $true }
    }
    return $false
}
function Test-Byte([string]$Path, [int]$Value) { return ([IO.File]::ReadAllBytes($Path) -contains $Value) }
function Get-Lines([string]$Path) {
    # The leading comma stops PowerShell unrolling a one-element array into a scalar string on return
    # (which would make $lines[0] the first CHARACTER of the line).
    return ,@(([IO.File]::ReadAllText($Path, [Text.Encoding]::UTF8)) -split "`n" | Where-Object { $_ -ne '' })
}
function New-Workspace([string]$Name, [switch]$Brain) {
    $ws = Join-Path $Work $Name
    New-Item -ItemType Directory -Path $ws | Out-Null
    if ($Brain) { New-Item -ItemType Directory -Path (Join-Path $ws '.synaptic') | Out-Null }
    return $ws
}

$LineRe = '^(stop|boot)$'   # [X3] event only: per-day counts, no per-turn timestamps
$NameRe = '^[0-9a-f]{12}-\d{4}-\d{2}-\d{2}\.log$'   # [X3] <host-token>-<UTC date>.log, never the raw host name
# The documented host token: first 12 hex of SHA-256 over the lower-cased host name.
$HostName = if ($env:COMPUTERNAME) { $env:COMPUTERNAME } else { [Net.Dns]::GetHostName() }
$HostToken = -join ([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($HostName.ToLowerInvariant()))[0..5] | ForEach-Object { $_.ToString('x2') })
function Test-LedgerName($Led) { return ($Led.Name -cmatch $NameRe -and $Led.Name.StartsWith("$HostToken-")) }
function Test-LedgerIgnored([string]$Brain) {
    $gi = Join-Path $Brain 'journal/_activity/.gitignore'
    if (-not [IO.File]::Exists($gi)) { return $false }
    $l = Get-Lines $gi
    return (($l -contains '*') -and ($l -contains '!.gitignore'))
}

# Context the findings depend on: the recipe registers Windows hooks as `powershell -File ...` (5.1, on
# every Windows install; pwsh is optional), and a .ps1 only runs under the effective execution policy.
if ($IsWindows -or $env:OS -eq 'Windows_NT') {
    $hasPwsh = [bool](Get-Command pwsh -ErrorAction SilentlyContinue)
    # Report the persistent scopes, not the effective one: this harness itself runs under -ExecutionPolicy
    # Bypass, which would mask what a hook launched WITHOUT that flag would hit.
    $pol = (Get-ExecutionPolicy -List | Where-Object { $_.Scope -ne 'Process' } | ForEach-Object { "$($_.Scope)=$($_.ExecutionPolicy)" }) -join ', '
    Info "pwsh (PowerShell 7) on PATH: $hasPwsh; persistent execution policies: $pol"
}

try {
    # 0. Encoding guard over EVERY ```powershell block in the recipe. Users paste these blocks into an
    #    editor that saves UTF-8 without a BOM (VS Code's default), and Windows PowerShell 5.1 reads a
    #    BOM-less script as ANSI (cp1252). A non-ASCII character inside CODE then changes meaning: the
    #    em dash (E2 80 94) becomes three characters whose last one is a typographic double quote, which
    #    PowerShell accepts as a string delimiter, so the hook stops parsing. Comments are harmless.
    #    Covers the recipe AND SKILL.md, whose blocks sit inside a blockquote (`> ` prefix stripped).
    $blk = 0; $bad = @()
    foreach ($src in @($Recipe, $Skill, $SkillCore, $FpDoc)) {
        $inB = $false; $ln = 0
        foreach ($raw in [IO.File]::ReadAllLines($src, [Text.Encoding]::UTF8)) {
            $ln++; $l = ($raw.TrimEnd("`r")) -replace '^> ?', ''
            if (-not $inB) { if ($l -eq '```powershell') { $inB = $true; $blk++ }; continue }
            if ($l -eq '```') { $inB = $false; continue }
            $code = $l -replace '(^|\s)#.*$', ''
            if ($code -match '[^\x00-\x7F]') { $bad += "$(Split-Path $src -Leaf):${ln}: $($l.Trim())" }
        }
    }
    if ($bad.Count -eq 0) { Ok "recipe + skill PowerShell blocks are ASCII outside comments ($blk blocks)" }
    else { Nok "recipe + skill PowerShell blocks are ASCII outside comments ($blk blocks)" "non-ASCII in code breaks or garbles BOM-less scripts under 5.1 -> $($bad -join ' ; ')" }

    $a0Body = Get-Block '### A.0' 'powershell'
    $a1Body = Get-Block '### A.1' 'powershell'
    if ($a0Body.Count -gt 0) { Ok 'extract A.0 activity-marker (PowerShell) from the recipe' }
    else { Nok 'extract A.0 activity-marker (PowerShell) from the recipe' 'heading or fence changed'; exit 1 }
    if ($a1Body.Count -gt 0) { Ok 'extract A.1 breadcrumb (PowerShell) from the recipe' }
    else { Nok 'extract A.1 breadcrumb (PowerShell) from the recipe' 'heading or fence changed'; exit 1 }
    $A0 = Save-Script 'synaptic-activity.ps1' $a0Body
    $A1 = Save-Script 'synaptic-breadcrumb.ps1' $a1Body

    # --- A.0: the unconditional floor ------------------------------------------------------------
    # 1. The #2a fix itself: a NON-git workspace still gets a marker.
    $ws = New-Workspace 'a0-nogit' -Brain
    $rc = Invoke-Hook $A0 'stop' $ws
    if ($rc -eq 0) { Ok 'A.0 exits 0' } else { Nok 'A.0 exits 0' "rc=$rc" }
    $led = Get-Ledger (Join-Path $ws '.synaptic')
    if ($led) {
        Ok 'A.0 writes a marker in a NON-git workspace (the issue #2a fix)'
        $f = $led.FullName
        $lines = Get-Lines $f
        if ($lines.Count -eq 1) { Ok 'A.0 writes exactly one line' } else { Nok 'A.0 writes exactly one line' "got $($lines.Count)" }
        if ($lines.Count -ge 1 -and $lines[0] -match $LineRe) { Ok "A.0 line format is '<event>' only, no per-turn timestamp [X3]" }
        else { Nok "A.0 line format is '<event>' only, no per-turn timestamp [X3]" "got: $($lines -join ' | ')" }
        if (Test-Bom $f)       { Nok 'A.0 ledger has no UTF-8 BOM' }          else { Ok 'A.0 ledger has no UTF-8 BOM' }
        if (Test-Byte $f 0)    { Nok 'A.0 ledger has no NUL bytes (not UTF-16)' } else { Ok 'A.0 ledger has no NUL bytes (not UTF-16)' }
        if (Test-Byte $f 13)   { Nok 'A.0 ledger uses LF line endings' }      else { Ok 'A.0 ledger uses LF line endings' }
        if (Test-LedgerName $led) { Ok 'A.0 ledger filename is <host-token>-<date>.log with the documented token [X3]' }
        else { Nok 'A.0 ledger filename is <host-token>-<date>.log with the documented token [X3]' "$($led.Name) (expected token $HostToken)" }
        if ($led.Name.ToLowerInvariant().StartsWith($HostName.ToLowerInvariant() + '-')) { Nok 'A.0 ledger filename is not named after the raw host name [X3]' $led.Name }
        else { Ok 'A.0 ledger filename is not named after the raw host name [X3]' }
        if (Test-LedgerIgnored (Join-Path $ws '.synaptic')) { Ok 'A.0 leaves the ledger untracked by default (_activity/.gitignore ignores everything but itself) [X3]' }
        else { Nok 'A.0 leaves the ledger untracked by default (_activity/.gitignore ignores everything but itself) [X3]' 'no or wrong .gitignore' }
        $first = $lines[0]
        $null = Invoke-Hook $A0 'boot' $ws
        $lines2 = Get-Lines $f
        if ($lines2.Count -eq 2 -and $lines2[0] -eq $first) { Ok 'A.0 is append-only: a second event appends and the first line is untouched' }
        else { Nok 'A.0 is append-only' ($lines2 -join ' | ') }
        if (Test-BomAnywhere $f) { Nok 'A.0 ledger stays BOM-free after a second append' } else { Ok 'A.0 ledger stays BOM-free after a second append' }
    } else {
        Nok 'A.0 writes a marker in a NON-git workspace (the issue #2a fix)' 'no ledger file created'
    }

    # 2. No brain present -> silent no-op, creates nothing.
    $ws = New-Workspace 'a0-nobrain'
    $rc = Invoke-Hook $A0 'stop' $ws
    if ($rc -eq 0 -and -not (Test-Path -LiteralPath (Join-Path $ws '.synaptic'))) { Ok 'A.0 with no brain: exit 0 and creates nothing' }
    else { Nok 'A.0 with no brain: exit 0 and creates nothing' "rc=$rc" }

    # 3. SYNAPTIC_BRAIN_DIR override is honoured.
    $ws = New-Workspace 'a0-override'
    New-Item -ItemType Directory -Path (Join-Path $ws 'custom-brain') | Out-Null
    $null = Invoke-Hook $A0 'stop' $ws @{ SYNAPTIC_BRAIN_DIR = 'custom-brain' }
    if (Get-Ledger (Join-Path $ws 'custom-brain')) { Ok 'A.0 honours SYNAPTIC_BRAIN_DIR' } else { Nok 'A.0 honours SYNAPTIC_BRAIN_DIR' }

    # 3b. A brain path containing [ ] (legal in a Windows folder name). Without -LiteralPath, Test-Path
    #     treats the brackets as a wildcard, reports the brain missing, and the hook exits 0 silently.
    $ws = New-Workspace 'a0-brackets'
    [IO.Directory]::CreateDirectory((Join-Path $ws 'brain[1]')) | Out-Null
    $null = Invoke-Hook $A0 'stop' $ws @{ SYNAPTIC_BRAIN_DIR = 'brain[1]' }
    if (Get-Ledger (Join-Path $ws 'brain[1]')) { Ok 'A.0 handles a brain path containing [ ]' }
    else { Nok 'A.0 handles a brain path containing [ ]' 'wildcard Test-Path reported the brain missing: nothing written, exit 0' }

    # 4. A write failure never blocks the turn.
    $ws = New-Workspace 'a0-broken' -Brain
    New-Item -ItemType Directory -Path (Join-Path $ws '.synaptic/journal') | Out-Null
    [IO.File]::WriteAllText((Join-Path $ws '.synaptic/journal/_activity'), '')
    $rc = Invoke-Hook $A0 'stop' $ws
    if ($rc -eq 0) { Ok 'A.0 swallows a write failure and still exits 0' } else { Nok 'A.0 swallows a write failure' "rc=$rc" }

    # 5. Concurrency: 20 parallel host-style launches on one host+day file.
    $ws = New-Workspace 'a0-conc' -Brain
    $procs = @(); for ($i = 0; $i -lt 20; $i++) { $procs += Start-Hook $A0 'stop' $ws }
    foreach ($p in $procs) { $p.WaitForExit() }
    $led = Get-Ledger (Join-Path $ws '.synaptic')
    if ($led) {
        $lines = Get-Lines $led.FullName
        $bad = @($lines | Where-Object { $_ -notmatch $LineRe }).Count
        if ($bad -eq 0) { Ok 'A.0 concurrency: no corrupted line across 20 parallel launches' }
        else { Nok 'A.0 concurrency: no corrupted line across 20 parallel launches' "$bad malformed of $($lines.Count)" }
        Info "A.0 concurrency: $($lines.Count)/20 markers landed (transient same-host locks are swallowed by design; the ledger is the capture-yield denominator)"
    } else {
        Nok 'A.0 concurrency: ledger exists after 20 parallel launches'
    }

    # 6. In-process invocation after Set-Location - how a user debugs a hook from their own terminal.
    #    PowerShell's location ($PWD) and the .NET process directory are different things; a relative
    #    path handed to a .NET method resolves against the latter. Any marker that lands anywhere other
    #    than this workspace is a silent miss reported as success (exit 0) - the #2a failure class.
    $ws = New-Workspace 'a0-inprocess' -Brain
    Push-Location -LiteralPath $ws
    try { & $A0 'stop' } catch { } finally { Pop-Location }
    $strays = @(Get-ChildItem -LiteralPath $Decoy -Recurse -File -ErrorAction SilentlyContinue)
    if (Get-Ledger (Join-Path $ws '.synaptic')) { Ok 'A.0 invoked in-process after Set-Location writes to the right brain' }
    else {
        $where = if ($strays.Count) { "it landed under the process directory instead: $($strays[0].FullName)" } else { 'nothing was written anywhere, and the script still exited 0' }
        Nok 'A.0 invoked in-process after Set-Location writes to the right brain' "relative path resolved against [Environment]::CurrentDirectory, not `$PWD - $where"
    }

    # --- A.1: the conditional semantic layer ------------------------------------------------------
    # $Journal is deliberately UNTYPED: a [string] parameter turns $null into '', which would make the
    # "journal absent" case below silently create an empty journal instead.
    function New-GitWorkspace([string]$Name, $Journal) {
        $ws = New-Workspace $Name -Brain
        New-Item -ItemType Directory -Path (Join-Path $ws '.synaptic/journal') | Out-Null
        if ($null -ne $Journal) { [IO.File]::WriteAllText((Join-Path $ws '.synaptic/journal/_current.md'), $Journal, (New-Object Text.UTF8Encoding $false)) }
        # Windows PowerShell 5.1 turns ANY native stderr line into a terminating error under
        # ErrorActionPreference=Stop, even when redirected; git's CRLF advisory would abort the harness.
        $eap = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
        Push-Location -LiteralPath $ws
        try {
            git -c core.autocrlf=false init -q 2>$null | Out-Null
            [IO.File]::WriteAllText((Join-Path $ws 'tracked.txt'), "a`n")
            git -c core.autocrlf=false add tracked.txt 2>$null | Out-Null
            git -c core.autocrlf=false -c user.name=ci -c user.email=ci@example.invalid commit -qm init 2>$null | Out-Null
            git config core.autocrlf false 2>$null | Out-Null
            [IO.File]::AppendAllText((Join-Path $ws 'tracked.txt'), "b`n")
        } finally { Pop-Location; $ErrorActionPreference = $eap }
        return $ws
    }

    # 7. Reproduce issue #2a: a NON-git workspace gets NOTHING from A.1 (expected; why A.0 exists).
    $ws = New-Workspace 'a1-nogit' -Brain
    New-Item -ItemType Directory -Path (Join-Path $ws '.synaptic/journal') | Out-Null
    $jf = Join-Path $ws '.synaptic/journal/_current.md'
    [IO.File]::WriteAllText($jf, "# Journal`n", (New-Object Text.UTF8Encoding $false))
    $before = [IO.File]::ReadAllText($jf)
    $null = Invoke-Hook $A1 '' $ws
    if ([IO.File]::ReadAllText($jf) -eq $before) { Ok 'A.1 writes nothing in a non-git workspace (reproduces the #2a gate; expected)' }
    else { Nok 'A.1 writes nothing in a non-git workspace' 'recipe says it should not write here' }

    # 8. Gate passes, journal already exists with content (the normal case): one line appended, no BOM.
    $ws = New-GitWorkspace 'a1-git-existing' "# Journal`n"
    $jf = Join-Path $ws '.synaptic/journal/_current.md'
    $null = Invoke-Hook $A1 '' $ws
    $lines = Get-Lines $jf
    if ($lines.Count -ge 2 -and $lines[-1] -match '^- \S+ breadcrumb: touched tracked\.txt\s*$') { Ok 'A.1 appends one breadcrumb when a tracked file changed' }
    else { Nok 'A.1 appends one breadcrumb when a tracked file changed' "last line: $($lines[-1])" }
    if (Test-BomAnywhere $jf) { Nok 'A.1 appending to an existing journal inserts no BOM' } else { Ok 'A.1 appending to an existing journal inserts no BOM' }
    if (Test-Byte $jf 0) { Nok 'A.1 journal has no NUL bytes (not UTF-16)' } else { Ok 'A.1 journal has no NUL bytes (not UTF-16)' }

    # 8b. Dedup [D1]: the SAME uncommitted diff on a later turn appends nothing; an agent-written line in
    #     between does not defeat it; a changed file list appends again.
    function Get-CrumbCount([string]$Path) { $l = Get-Lines $Path; return @($l | Where-Object { $_ -match ' breadcrumb: touched ' }).Count }
    $null = Invoke-Hook $A1 '' $ws
    if ((Get-CrumbCount $jf) -eq 1) { Ok 'A.1 skips a breadcrumb identical to the last one (same files)' }
    else { Nok 'A.1 skips a breadcrumb identical to the last one (same files)' "$(Get-CrumbCount $jf) breadcrumbs" }
    [IO.File]::AppendAllText($jf, "- agent note: decided X`n", (New-Object Text.UTF8Encoding $false))
    $null = Invoke-Hook $A1 '' $ws
    if ((Get-CrumbCount $jf) -eq 1) { Ok 'A.1 dedup keys on the last breadcrumb, not the last line' }
    else { Nok 'A.1 dedup keys on the last breadcrumb, not the last line' "$(Get-CrumbCount $jf) breadcrumbs" }
    $eap = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    Push-Location -LiteralPath $ws
    try {
        [IO.File]::WriteAllText((Join-Path $ws 'second.txt'), "c`n")
        git add second.txt 2>$null | Out-Null
    } finally { Pop-Location; $ErrorActionPreference = $eap }
    $null = Invoke-Hook $A1 '' $ws
    if ((Get-CrumbCount $jf) -eq 2) { Ok 'A.1 appends again when the touched-file list changes' }
    else { Nok 'A.1 appends again when the touched-file list changes' "$(Get-CrumbCount $jf) breadcrumbs" }

    # 9. Gate passes, journal does NOT exist yet (e.g. rotated by a consolidation): A.1 creates it.
    $ws = New-GitWorkspace 'a1-git-missing' $null
    $jf = Join-Path $ws '.synaptic/journal/_current.md'
    if (Test-Path -LiteralPath $jf) { Nok 'fixture: the journal must be ABSENT before A.1 runs' 'otherwise this case silently duplicates the empty-journal case' }
    $null = Invoke-Hook $A1 '' $ws
    if (-not (Test-Path -LiteralPath $jf)) { Nok 'A.1 creates a missing journal' }
    elseif (Test-Bom $jf) { Nok 'A.1 creating a missing journal writes no BOM' '-Encoding utf8 means UTF-8 WITH BOM on Windows PowerShell 5.1' }
    else { Ok 'A.1 creating a missing journal writes no BOM' }

    # 10. Gate passes, journal exists but is EMPTY (0 bytes).
    $ws = New-GitWorkspace 'a1-git-empty' ''
    $jf = Join-Path $ws '.synaptic/journal/_current.md'
    $null = Invoke-Hook $A1 '' $ws
    if (Test-Bom $jf) { Nok 'A.1 appending to an empty journal writes no BOM' '-Encoding utf8 writes a BOM at offset 0 on Windows PowerShell 5.1' }
    else { Ok 'A.1 appending to an empty journal writes no BOM' }

    # --- A.2 pending-work check: one script, modes rescue|compact, one git-free predicate [S7] -------
    # Work = pending breadcrumb lines, or open playground dirs; archive/ and the A.0 ledger are not. [C2 C4]
    # The cases live in tests/capture-floor/pending-cases.txt, which run.sh reads too (sh/PS parity).
    $a2Body = Get-Block '### A.2' 'powershell'
    if ($a2Body.Count -gt 0) { Ok 'extract A.2 pending-work check (PowerShell) from the recipe' }
    else { Nok 'extract A.2 pending-work check (PowerShell) from the recipe' 'heading or fence changed'; exit 1 }
    $A2 = Save-Script 'synaptic-pending.ps1' $a2Body
    function New-BrainWs([string]$Name, [switch]$Git) {
        $ws = New-Workspace $Name -Brain
        foreach ($d in @('.synaptic/journal', '.synaptic/playgrounds')) { New-Item -ItemType Directory -Path (Join-Path $ws $d) | Out-Null }
        [IO.File]::WriteAllText((Join-Path $ws '.synaptic/journal/_current.md'), "# Journal`n", (New-Object Text.UTF8Encoding $false))
        if ($Git) {
            $eap = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
            Push-Location -LiteralPath $ws
            try {
                git -c core.autocrlf=false init -q 2>$null | Out-Null
                git -c core.autocrlf=false add -A 2>$null | Out-Null
                git -c core.autocrlf=false -c user.name=ci -c user.email=ci@example.invalid commit -qm init 2>$null | Out-Null
            } finally { Pop-Location; $ErrorActionPreference = $eap }
        }
        return $ws
    }
    function Get-HookResult([string]$File, [string]$Cwd, [string]$Arg = '') {
        $p = Start-Hook $File $Arg $Cwd $null
        $o = $p.StandardOutput.ReadToEnd(); $e = $p.StandardError.ReadToEnd(); $p.WaitForExit()
        return @{ Out = $o.Trim(); Err = $e.Trim(); Rc = $p.ExitCode }
    }
    function Test-Quiet($r) { return ($r.Rc -eq 0 -and -not $r.Out -and -not $r.Err) }
    function Save-Commit([string]$Ws) {
        $eap = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
        Push-Location -LiteralPath $Ws
        try {
            if (-not (Test-Path -LiteralPath (Join-Path $Ws '.git'))) { git -c core.autocrlf=false init -q 2>$null | Out-Null }
            git -c core.autocrlf=false add -A 2>$null | Out-Null
            git -c core.autocrlf=false -c commit.gpgsign=false -c user.name=ci -c user.email=ci@example.invalid commit -qm c 2>$null | Out-Null
        } finally { Pop-Location; $ErrorActionPreference = $eap }
    }

    $crumb = "- 2026-10-29T10:00Z breadcrumb: touched a.md`n"
    $utf8 = New-Object Text.UTF8Encoding $false

    function Get-SidJson([string]$Sid) { return '{"session_id":"' + $Sid + '","hook_event_name":"x"}' }
    # An earlier hook run of another session (the boot=X / beat=X / end=X setup tokens).
    function Invoke-Side([string]$Ws, [string]$Mode, [string]$Sid) {
        $keep = $script:HookIn; $script:HookIn = Get-SidJson $Sid
        try { $null = Get-HookResult $A2 $Ws $Mode } finally { $script:HookIn = $keep }
    }
    # Every ';'-separated expect item must hold; returns why it failed (empty = all held).
    function Get-ExpectFailure([string]$Ws, $R, [string]$Expect) {
        $why = ''; $act = Join-Path $Ws '.synaptic/journal/_activity'
        if ($R.Rc -ne 0) { $why += " rc=$($R.Rc)" }
        foreach ($e in $Expect.Split(';')) {
            if ($e -eq 'quiet') { if ($R.Out -or $R.Err) { $why += " not-quiet(out='$($R.Out)' err='$($R.Err)')" } }
            elseif ($e.StartsWith('say:')) { if (-not $R.Out.Contains($e.Substring(4))) { $why += " missing:'$($e.Substring(4))'(out='$($R.Out)')" } }
            elseif ($e.StartsWith('nosay:')) { if ($R.Out.Contains($e.Substring(6))) { $why += " unexpected:'$($e.Substring(6))'" } }
            elseif ($e.StartsWith('has:')) { if (-not (Test-Path -LiteralPath (Join-Path $Ws ('.synaptic/' + $e.Substring(4))))) { $why += " absent:$($e.Substring(4))" } }
            elseif ($e.StartsWith('no:')) { if (Test-Path -LiteralPath (Join-Path $Ws ('.synaptic/' + $e.Substring(3)))) { $why += " present:$($e.Substring(3))" } }
            elseif ($e.StartsWith('owner:') -or $e.StartsWith('notowner:')) {
                # .owner: line 1 is the signature; one claimant session id per line after it.
                $of = Join-Path $act '.owner'; $cl = @()
                if ([IO.File]::Exists($of)) { $cl = @([IO.File]::ReadAllText($of).Replace("`r", '').Split("`n") | Select-Object -Skip 1 | Where-Object { $_ -ne '' }) }
                $want = $e.Substring($e.IndexOf(':') + 1); $is = ($cl -ccontains $want)
                if ($e.StartsWith('owner:') -and -not $is) { $why += " not-claimant:$want($($cl -join '|'))" }
                if ($e.StartsWith('notowner:') -and $is) { $why += " claimant:$want" }
            }
            elseif ($e.StartsWith('sig:')) {
                $of = Join-Path $act '.owner'; $s1 = ''
                if ([IO.File]::Exists($of)) { $s1 = [IO.File]::ReadAllText($of).Replace("`r", '').Split("`n")[0] }
                if ($s1 -cne $e.Substring(4)) { $why += " sig='$s1'" }
            }
            else { $why += " unknown-expect:'$e'" }
        }
        return $why
    }

    $cases = [IO.File]::ReadAllLines((Join-Path $Root 'tests/capture-floor/pending-cases.txt'), [Text.Encoding]::UTF8)
    $rows = 0; $wantRows = @($cases | Where-Object { $_.Trim() -and -not $_.Trim().StartsWith("#") }).Count
    foreach ($line in $cases) {
        $f = $line.Split('|'); if ($f.Count -lt 4) { continue }
        $name = $f[0].Trim(); if (-not $name -or $name.StartsWith('#')) { continue }
        $setup = @($f[1].Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ }); $mode = $f[2].Trim(); $expect = $f[3].Trim()
        $rows++; $script:HookIn = ''; $sidIn = ''
        if ($setup -contains 'nobrain') { $ws = New-Workspace "pc-$name" }
        elseif ($setup -contains 'bare') { $ws = New-Workspace "pc-$name" -Brain; New-Item -ItemType Directory -Path (Join-Path $ws '.synaptic/knowledge') | Out-Null }
        elseif ($setup -contains 'pgfile') { $ws = New-Workspace "pc-$name" -Brain; New-Item -ItemType Directory -Path (Join-Path $ws '.synaptic/journal') | Out-Null; [IO.File]::WriteAllText((Join-Path $ws '.synaptic/journal/_current.md'), "# Journal`n", $utf8); [IO.File]::WriteAllText((Join-Path $ws '.synaptic/playgrounds'), '') }
        else { $ws = New-BrainWs "pc-$name" }
        $jf = Join-Path $ws '.synaptic/journal/_current.md'
        $ad = Join-Path $ws '.synaptic/journal/_activity'
        foreach ($item in $setup) {
            if ($item -like 'crumbs=*') { 1..([int]$item.Substring(7)) | ForEach-Object { [IO.File]::AppendAllText($jf, $crumb, $utf8) } }
            elseif ($item -eq 'crumbcase') { [IO.File]::AppendAllText($jf, "- 2026-10-29T10:00Z Breadcrumb: touched a.md`n", $utf8) }
            elseif ($item -eq 'pg') { New-Item -ItemType Directory -Path (Join-Path $ws '.synaptic/playgrounds/task') | Out-Null }
            elseif ($item -eq 'pgz') { foreach ($p in @('Zed', 'a b')) { New-Item -ItemType Directory -Path (Join-Path $ws (".synaptic/playgrounds/" + $p)) | Out-Null } }
            elseif ($item -eq 'archive') { New-Item -ItemType Directory -Path (Join-Path $ws '.synaptic/playgrounds/archive/old') -Force | Out-Null }
            elseif ($item -eq 'ledger') {
                [IO.Directory]::CreateDirectory($ad) | Out-Null
                [IO.File]::WriteAllText((Join-Path $ad '0123456789ab-2026-10-29.log'), "boot`nstop`n", $utf8)
            }
            elseif ($item -like 'sid=*') { $sidIn = Get-SidJson $item.Substring(4) }
            elseif ($item -like 'boot=*') { Invoke-Side $ws 'rescue' $item.Substring(5) }
            elseif ($item -like 'beat=*') { Invoke-Side $ws 'beat' $item.Substring(5) }
            elseif ($item -like 'end=*') { Invoke-Side $ws 'end' $item.Substring(4) }
            elseif ($item -like 'age=*') { [IO.File]::SetLastWriteTimeUtc((Join-Path $ad ('.live/' + $item.Substring(4))), (New-Object DateTime 2020, 1, 1, 0, 0, 0, ([DateTimeKind]::Utc))) }
            elseif ($item -eq 'degraded') { [IO.Directory]::CreateDirectory($ad) | Out-Null; [IO.File]::WriteAllText((Join-Path $ad '_degraded'), "2026-10-29 breadcrumb write-failed`n", $utf8) }
            elseif ($item -eq 'livefile') { [IO.Directory]::CreateDirectory($ad) | Out-Null; [IO.File]::WriteAllText((Join-Path $ad '.live'), '') }
            elseif ($item -eq 'endedfile') { [IO.Directory]::CreateDirectory($ad) | Out-Null; [IO.File]::WriteAllText((Join-Path $ad '.ended'), '') }
        }
        $script:HookIn = $sidIn
        $r = Get-HookResult $A2 $ws $mode
        $script:HookIn = ''
        $why = Get-ExpectFailure $ws $r $expect
        if (-not $why) { Ok "A.2 [$mode] ${name}: $expect" } else { Nok "A.2 [$mode] ${name}: $expect" $why }
    }
    if ($rows -eq $wantRows) { Ok "A.2 fixture table: all $wantRows rows ran" } else { Nok "A.2 fixture table: all $wantRows rows ran" "ran $rows" }

    # PowerShell 5.1 started in a folder whose path contains [ ] reports $PSHOME as its location, so a
    # relative .synaptic was never found and every hook silently did nothing. [S7]
    $bk = Join-Path $Work 'proj[1]'; [IO.Directory]::CreateDirectory((Join-Path $bk '.synaptic/journal')) | Out-Null
    [IO.Directory]::CreateDirectory((Join-Path $bk '.synaptic/playgrounds/task')) | Out-Null
    [IO.File]::WriteAllText((Join-Path $bk '.synaptic/journal/_current.md'), "# Journal`n", $utf8)
    $null = Invoke-Hook $A0 'stop' $bk
    if ([IO.Directory]::Exists((Join-Path $bk '.synaptic/journal/_activity')) -and @([IO.Directory]::GetFiles((Join-Path $bk '.synaptic/journal/_activity'), '*.log')).Count -eq 1) { Ok 'A.0 run from a project folder whose path contains [ ] finds the brain' }
    else { Nok 'A.0 run from a project folder whose path contains [ ] finds the brain' 'no ledger written (PowerShell 5.1 started at $PSHOME)' }
    $r = Get-HookResult $A2 $bk 'rescue'
    if ($r.Out.Contains('1 open playground(s)')) { Ok 'A.2 run from a project folder whose path contains [ ] finds the brain' }
    else { Nok 'A.2 run from a project folder whose path contains [ ] finds the brain' "out='$($r.Out)'" }
    # A.1 also has to run git in the project, not in $PSHOME.
    $bg = Join-Path $Work 'gitproj[2]'; [IO.Directory]::CreateDirectory((Join-Path $bg '.synaptic/journal')) | Out-Null
    [IO.File]::WriteAllText((Join-Path $bg '.synaptic/journal/_current.md'), "# Journal`n", $utf8); [IO.File]::WriteAllText((Join-Path $bg 'tracked.txt'), "a`n")
    $eap = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    Push-Location -LiteralPath $bg
    try { git -c core.autocrlf=false init -q 2>$null | Out-Null; git -c core.autocrlf=false add tracked.txt 2>$null | Out-Null; git -c core.autocrlf=false -c user.name=ci -c user.email=ci@example.invalid commit -qm init 2>$null | Out-Null } finally { Pop-Location; $ErrorActionPreference = $eap }
    [IO.File]::AppendAllText((Join-Path $bg 'tracked.txt'), "b`n")
    $null = Invoke-Hook $A1 '' $bg
    if ([IO.File]::ReadAllText((Join-Path $bg '.synaptic/journal/_current.md')) -match 'breadcrumb: touched tracked.txt') { Ok 'A.1 run from a git project folder whose path contains [ ] writes its breadcrumb' }
    else { Nok 'A.1 run from a git project folder whose path contains [ ] writes its breadcrumb' 'no breadcrumb (git ran outside the project)' }

    $ws = New-BrainWs 'a2ps-untracked' -Git                                                         # C2
    New-Item -ItemType Directory -Path (Join-Path $ws '.synaptic/playgrounds/new') | Out-Null
    [IO.File]::WriteAllText((Join-Path $ws '.synaptic/playgrounds/new/notes.md'), "x`n")
    $r = Get-HookResult $A2 $ws 'rescue'
    if ($r.Rc -eq 0 -and $r.Out -match '0 pending breadcrumb\(s\) and 1 open playground\(s\)') { Ok 'A.2 (PS) reminds for an untracked new playground in a git repo' }
    else { Nok 'A.2 (PS) reminds for an untracked new playground in a git repo' "out='$($r.Out)'" }

    # End to end in the A.4 order (A.0 -> A.1 -> A.2) on a committed git brain. [C2]
    $ws = New-BrainWs 'chainps-qa'
    $null = Invoke-Hook $A0 'boot' $ws; Save-Commit $ws
    $null = Invoke-Hook $A0 'stop' $ws; $null = Invoke-Hook $A1 '' $ws
    $r = Get-HookResult $A2 $ws 'rescue'
    if (Test-Quiet $r) { Ok 'chain (PS): a turn that only wrote the activity ledger leaves no reminder' }
    else { Nok 'chain (PS): a turn that only wrote the activity ledger leaves no reminder' "out='$($r.Out)'" }

    $ws = New-BrainWs 'chainps-cons'
    [IO.File]::AppendAllText((Join-Path $ws '.synaptic/journal/_current.md'), $crumb); Save-Commit $ws
    [IO.File]::WriteAllText((Join-Path $ws '.synaptic/journal/_current.md'), "# Journal`n- [2026-10-29] consolidated`n", (New-Object Text.UTF8Encoding $false))
    $null = Invoke-Hook $A1 '' $ws; Save-Commit $ws
    $r = Get-HookResult $A2 $ws 'rescue'
    if (Test-Quiet $r) { Ok "chain (PS): a journal-only consolidation turn's own Stop does not re-arm the reminder" }
    else { Nok "chain (PS): a journal-only consolidation turn's own Stop does not re-arm the reminder" "out='$($r.Out)'" }

    $nd = 'An' + [char]0x00E1 + 'lisis'   # non-ASCII folder between repo root and brain: git prints the path "quoted"
    $ws = New-Workspace 'chainps-quoted'; $bw = Join-Path $ws $nd
    foreach ($d in @('.synaptic/journal', '.synaptic/playgrounds')) { New-Item -ItemType Directory -Path (Join-Path $bw $d) -Force | Out-Null }
    $jq = Join-Path $bw '.synaptic/journal/_current.md'
    [IO.File]::WriteAllText($jq, "# Journal`n" + $crumb, (New-Object Text.UTF8Encoding $false)); Save-Commit $ws
    [IO.File]::WriteAllText($jq, "# Journal`n- [2026-10-29] consolidated`n", (New-Object Text.UTF8Encoding $false))
    $null = Invoke-Hook $A1 '' $bw; Save-Commit $ws
    $r = Get-HookResult $A2 $bw 'rescue'
    if (Test-Quiet $r) { Ok 'chain (PS): the journal stays filtered when git quotes a non-ASCII path' }
    else { Nok 'chain (PS): the journal stays filtered when git quotes a non-ASCII path' "out='$($r.Out)'" }

    $ws = New-BrainWs 'chainps-work'
    [IO.File]::WriteAllText((Join-Path $ws 'app.txt'), "a`n"); Save-Commit $ws
    [IO.File]::AppendAllText((Join-Path $ws 'app.txt'), "b`n"); $null = Invoke-Hook $A1 '' $ws
    $r = Get-HookResult $A2 $ws 'rescue'
    if ($r.Rc -eq 0 -and $r.Out -match '1 pending breadcrumb\(s\)') { Ok 'chain (PS): a real project edit becomes a breadcrumb and triggers the reminder' }
    else { Nok 'chain (PS): a real project edit becomes a breadcrumb and triggers the reminder' "out='$($r.Out)'" }

    # Fail open, but visibly [K1 2.2]: a breadcrumb that cannot be written leaves one _degraded line, and
    # the next rescue prints it exactly once (here the journal is a directory, so the append fails).
    $ws = New-BrainWs 'chainps-degraded'
    [IO.File]::WriteAllText((Join-Path $ws 'app.txt'), "a`n"); Save-Commit $ws
    [IO.File]::AppendAllText((Join-Path $ws 'app.txt'), "b`n")
    $jd = Join-Path $ws '.synaptic/journal/_current.md'; [IO.File]::Delete($jd); [IO.Directory]::CreateDirectory($jd) | Out-Null
    $r1 = Get-HookResult $A1 $ws; $r2 = Get-HookResult $A1 $ws
    $dg = Join-Path $ws '.synaptic/journal/_activity/_degraded'
    $dn = 0; if ([IO.File]::Exists($dg)) { $dn = @([IO.File]::ReadAllLines($dg) | Where-Object { $_ -match ' breadcrumb write-failed$' }).Count }
    if ($r1.Rc -eq 0 -and $r2.Rc -eq 0 -and -not $r1.Err -and -not $r2.Err -and $dn -eq 1) { Ok 'A.1 that cannot write the journal exits 0 silently and leaves ONE _degraded line [K1]' }
    else { Nok 'A.1 that cannot write the journal exits 0 silently and leaves ONE _degraded line [K1]' "rc=$($r1.Rc)/$($r2.Rc) err='$($r1.Err)' lines=$dn" }
    $first = Get-HookResult $A2 $ws 'rescue'; $second = Get-HookResult $A2 $ws 'rescue'
    if ($first.Out.Contains('breadcrumb write-failed') -and -not $second.Out.Contains('could not run')) { Ok 'chain (PS): the next rescue prints the _degraded line once, then it is gone [K1]' }
    else { Nok 'chain (PS): the next rescue prints the _degraded line once, then it is gone [K1]' "first='$($first.Out)'" }

    # Liveness in the A.4 order [K1]: a turn whose only change is its own breadcrumb (A.1, then beat) is
    # claimed by that session. Once it has ended another session is offered the work; its own resume is not.
    $ws = New-BrainWs 'chainps-live'
    [IO.File]::WriteAllText((Join-Path $ws 'app.txt'), "a`n"); Save-Commit $ws
    [IO.File]::AppendAllText((Join-Path $ws 'app.txt'), "b`n")
    $script:HookIn = Get-SidJson 'L1'; $null = Get-HookResult $A2 $ws 'rescue'
    $script:HookIn = ''; $null = Invoke-Hook $A1 '' $ws
    $script:HookIn = Get-SidJson 'L1'; $null = Get-HookResult $A2 $ws 'beat'; $null = Get-HookResult $A2 $ws 'end'
    $script:HookIn = Get-SidJson 'L2'; $other = Get-HookResult $A2 $ws 'rescue'
    $script:HookIn = Get-SidJson 'L1'; $own = Get-HookResult $A2 $ws 'rescue'; $script:HookIn = ''
    if ($other.Out.Contains('1 pending breadcrumb(s)') -and -not $own.Out) { Ok "chain (PS): a session's own breadcrumb is claimed (A.1 then beat); offered to the next session, not to its own resume [K1]" }
    else { Nok "chain (PS): a session's own breadcrumb is claimed (A.1 then beat); offered to the next session, not to its own resume [K1]" "other='$($other.Out)' own='$($own.Out)'" }

    # --- Work items [R2: P1, T2] ---------------------------------------------------------------------
    # scratch/ never enters git history: the playgrounds/.gitignore template ignores <id>/scratch/ only.
    $tpl = Join-Path $Root 'standalone/synaptic/templates'
    $ws = New-Workspace 'wips-scratch'
    foreach ($d in @('playgrounds/t1/scratch', 'playgrounds/t1/notes')) { [IO.Directory]::CreateDirectory((Join-Path $ws $d)) | Out-Null }
    $gsrc = Join-Path $tpl 'playgrounds/.gitignore'
    if ([IO.File]::Exists($gsrc)) { [IO.File]::Copy($gsrc, (Join-Path $ws 'playgrounds/.gitignore')) }
    foreach ($f in @('playgrounds/t1/scratch/plot.png', 'playgrounds/t1/tasks.md', 'playgrounds/t1/scratch-notes.md', 'playgrounds/t1/notes/a.md')) { [IO.File]::WriteAllText((Join-Path $ws $f), '') }
    $eap = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    Push-Location -LiteralPath $ws
    try {
        git init -q 2>$null | Out-Null
        $ign = @{}
        foreach ($f in @('playgrounds/t1/scratch/plot.png', 'playgrounds/t1/tasks.md', 'playgrounds/t1/scratch-notes.md', 'playgrounds/t1/notes/a.md')) { git check-ignore -q $f 2>$null; $ign[$f] = ($LASTEXITCODE -eq 0) }
    } finally { Pop-Location; $ErrorActionPreference = $eap }
    if ($ign['playgrounds/t1/scratch/plot.png'] -and -not $ign['playgrounds/t1/tasks.md'] -and -not $ign['playgrounds/t1/scratch-notes.md'] -and -not $ign['playgrounds/t1/notes/a.md']) { Ok 'templates/playgrounds/.gitignore ignores <id>/scratch/ and nothing else [P1]' }
    else { Nok 'templates/playgrounds/.gitignore ignores <id>/scratch/ and nothing else [P1]' "ignored: $(($ign.Keys | Where-Object { $ign[$_] }) -join ', ')" }
    # The row schemas in references/contract.md section 6 are the header rows of the two index templates.
    $contract = [IO.File]::ReadAllText((Join-Path $Root 'standalone/synaptic/references/contract.md')).Replace("`r", '').Split("`n")
    function Get-Schema([string]$Index) { $l = @($contract | Where-Object { $_.Contains('**`' + $Index + '` row:** `') }); if ($l.Count -eq 0) { return '' }; return ($l[0] -replace '^.*row:\*\* `(.*)`$', '$1') }
    function Get-Header([string]$File) { $l = @([IO.File]::ReadAllText((Join-Path $tpl ('templates/' + $File))).Replace("`r", '').Split("`n") | Where-Object { $_.StartsWith('| id |') }); if ($l.Count -eq 0) { return '' }; return $l[0].TrimEnd() }
    $bad = ''
    if (-not (Get-Schema 'tasks/INDEX.md') -or (Get-Schema 'tasks/INDEX.md') -cne (Get-Header 'task-index.md')) { $bad += ' tasks' }
    if (-not (Get-Schema 'proposals/INDEX.md') -or (Get-Schema 'proposals/INDEX.md') -cne (Get-Header 'proposal-index.md')) { $bad += ' proposals' }
    if (-not $bad) { Ok 'work-item row schemas in contract.md = the index template headers [T2]' } else { Nok 'work-item row schemas in contract.md = the index template headers [T2]' "differs:$bad" }

    # --- Proposal -> task promotion [R4] ------------------------------------------------------------
    # A promoted pair (fixtures/promotion, read-only) keeps the contract section 6 provenance invariants; a
    # broken copy must be caught, so the check is not vacuous. Columns are found by header name, never by position.
    function Read-Rows([string]$Path) {
        $r = @{ Header = ''; Rows = (New-Object System.Collections.Generic.List[object]) }; $col = $null
        if (-not [IO.File]::Exists($Path)) { return $r }
        foreach ($l in [IO.File]::ReadAllText($Path, [Text.Encoding]::UTF8).Replace("`r", '').Split("`n")) {
            if (-not $l.StartsWith('| ')) { continue }
            $parts = $l.Split('|'); $c = @(); for ($i = 1; $i -lt $parts.Count - 1; $i++) { $c += $parts[$i].Trim() }
            if ($c[0] -ceq 'id') { $r.Header = $l.TrimEnd(); $col = @{}; for ($i = 0; $i -lt $c.Count; $i++) { $col[$c[$i]] = $i }; continue }
            if ($null -eq $col) { continue }
            $o = @{}; foreach ($k in $col.Keys) { $o[$k] = [string]$c[$col[$k]] }; $r.Rows.Add($o)
        }
        return $r
    }
    function Get-ProvDefects([string]$Brain) {
        $d = New-Object System.Collections.Generic.List[string]
        $p = Read-Rows (Join-Path $Brain 'proposals/INDEX.md'); $t = Read-Rows (Join-Path $Brain 'tasks/INDEX.md')
        if (-not $p.Header -or $p.Header -cne (Get-Header 'proposal-index.md')) { $d.Add('header:proposals') }
        if (-not $t.Header -or $t.Header -cne (Get-Header 'task-index.md')) { $d.Add('header:tasks') }
        $seen = @{}; $to = @{}; $from = @{}
        foreach ($set in @(@{ Rows = $p.Rows; Id = '^P[0-9]+$'; Map = $to }, @{ Rows = $t.Rows; Id = '^T[0-9]+$'; Map = $from })) {
            foreach ($r in $set.Rows) {
                $id = $r['id']
                if ($seen.ContainsKey($id)) { $d.Add("dup:$id") }; $seen[$id] = 1; $set.Map[$id] = $r
                if ($id -cnotmatch $set.Id) { $d.Add("id:$id") }
                if (@('[ ]', '[x]', '[-]') -cnotcontains $r['status']) { $d.Add("status:$id") }
                if ($r['updated'] -cnotmatch '^[0-9]{4}-[0-9]{2}-[0-9]{2}$') { $d.Add("updated:$id") }
                if ($r['status'] -ceq '[-]' -and -not $r['note']) { $d.Add("no-reason:$id") }
            }
        }
        foreach ($k in $to.Keys) {
            $tn = $to[$k]['to']; if ($tn -cnotmatch '^T[0-9]+$') { continue }
            if ($to[$k]['status'] -cne '[x]') { $d.Add("promoted-not-x:$k") }
            if (-not $to[$k]['note'].Contains($tn)) { $d.Add("no-proof:$k") }
            if (-not $from.ContainsKey($tn) -or $from[$tn]['from'] -cne $k) { $d.Add("to-without-from:$k") }
        }
        foreach ($k in $from.Keys) {
            $pn = $from[$k]['from']; if ($pn -cnotmatch '^P[0-9]+$') { continue }
            if (-not $to.ContainsKey($pn) -or $to[$pn]['to'] -cne $k) { $d.Add("from-without-to:$k") }
            $h = $from[$k]['home']
            if ($h -cne 'inline' -and -not $h.StartsWith('playgrounds/') -and -not $h.StartsWith("proposals/$pn-")) { $d.Add("home:$k") }
        }
        return ,$d
    }
    $fix = Join-Path $Root 'tests/capture-floor/fixtures/promotion'
    $d = (Get-ProvDefects $fix) -join ' '
    $promo = @((Read-Rows (Join-Path $fix 'proposals/INDEX.md')).Rows | Where-Object { $_['status'] -ceq '[x]' -and $_['to'] -cmatch '^T[0-9]+$' }).Count
    if (-not $d -and $promo -ge 1) { Ok 'promotion fixture: the promoted pair keeps its provenance (from/to, proof, status, ids) [R4]' }
    else { Nok 'promotion fixture: the promoted pair keeps its provenance (from/to, proof, status, ids) [R4]' "defects: $d promoted rows: $promo" }
    $ws = New-Workspace 'prov-broken'
    foreach ($i in @('proposals', 'tasks')) { [IO.Directory]::CreateDirectory((Join-Path $ws $i)) | Out-Null }
    $src = Join-Path $fix 'proposals/INDEX.md'; if ([IO.File]::Exists($src)) { [IO.File]::Copy($src, (Join-Path $ws 'proposals/INDEX.md')) }
    $src = Join-Path $fix 'tasks/INDEX.md'; $keep = @()
    if ([IO.File]::Exists($src)) { $keep = @([IO.File]::ReadAllText($src, [Text.Encoding]::UTF8).Replace("`r", '').Split("`n") | Where-Object { $_ -cnotmatch '^\| T[0-9]+ \|.*\| P[0-9]+ \|' }) }
    [IO.File]::WriteAllText((Join-Path $ws 'tasks/INDEX.md'), ($keep -join "`n"), (New-Object Text.UTF8Encoding $false))
    $d = (Get-ProvDefects $ws) -join ' '
    if ($d.Contains('to-without-from:')) { Ok 'promotion check: a proposal whose task row is gone is broken provenance [R4]' }
    else { Nok 'promotion check: a proposal whose task row is gone is broken provenance [R4]' "defects: $d" }

    # --- The fingerprint primitive (references/fingerprint.md) [X4/S4] -------------------------------
    # In-process here; run.sh checks PowerShell = sh on the same fixture set.
    $fpW = Get-Block '## Whole-file fingerprint' 'powershell' $FpDoc '## '
    $fpB = Get-Block '## Body fingerprint' 'powershell' $FpDoc '## '
    if ($fpW.Count -eq 0 -or $fpB.Count -eq 0) { Nok 'extract the PowerShell fingerprint commands from references/fingerprint.md' 'heading or fence changed' }
    else {
        Ok 'extract the PowerShell fingerprint commands from references/fingerprint.md'
        $fx = Join-Path $Work 'fp'; [IO.Directory]::CreateDirectory($fx) | Out-Null
        $fixtures = @{
            'lf.md' = "---`ntitle: x`n---`nBody line 1`nBody line 2`n"; 'crlf.md' = "---`r`ntitle: x`r`n---`r`nBody line 1`r`nBody line 2`r`n"
            'nofinal.md' = "---`ntitle: x`n---`nBody line 1`nBody line 2"; 'fm2.md' = "---`ntitle: y`nextra: 1`n---`nBody line 1`nBody line 2`n"
            'nofm.md' = "Body line 1`nBody line 2`n"; 'unterminated.md' = "---`ntitle: x`nBody line 1`n"; 'known.txt' = "a`r`nb`r`n"
        }
        foreach ($k in $fixtures.Keys) { [IO.File]::WriteAllText((Join-Path $fx $k), $fixtures[$k], (New-Object Text.UTF8Encoding $false)) }
        function Get-Fp([string[]]$Body, [string]$Name) {
            $code = ($Body -join "`n").Replace('<file>', (Join-Path $fx $Name))
            return [string](& ([scriptblock]::Create($code)))
        }
        $wLf = Get-Fp $fpW 'lf.md'
        if ($wLf -cmatch '^[0-9a-f]{12}$') { Ok 'fingerprint is 12 lower-case hex' } else { Nok 'fingerprint is 12 lower-case hex' "got '$wLf'" }
        if ((Get-Fp $fpW 'crlf.md') -eq $wLf) { Ok 'whole-file fingerprint: CRLF and LF copies agree' } else { Nok 'whole-file fingerprint: CRLF and LF copies agree' }
        if ((Get-Fp $fpW 'fm2.md') -ne $wLf) { Ok 'whole-file fingerprint changes when the frontmatter changes' } else { Nok 'whole-file fingerprint changes when the frontmatter changes' }
        $want = '911169ddaaf1'   # SHA-256 of "a`nb`n", first 12 hex: a fixed literal
        if ((Get-Fp $fpW 'known.txt') -eq $want) { Ok 'whole-file fingerprint = SHA-256 of the CR-stripped bytes (known answer)' }
        else { Nok 'whole-file fingerprint = SHA-256 of the CR-stripped bytes (known answer)' "$(Get-Fp $fpW 'known.txt') vs $want" }
        $bLf = Get-Fp $fpB 'lf.md'
        $bad = @('crlf.md', 'nofinal.md', 'fm2.md', 'nofm.md') | Where-Object { (Get-Fp $fpB $_) -ne $bLf }
        if (@($bad).Count -eq 0) { Ok 'body fingerprint ignores CR, a missing final newline and the frontmatter' }
        else { Nok 'body fingerprint ignores CR, a missing final newline and the frontmatter' "differs for: $($bad -join ', ')" }
        if ((Get-Fp $fpB 'unterminated.md') -eq (Get-Fp $fpW 'unterminated.md')) { Ok 'body fingerprint: an unterminated frontmatter is part of the body' }
        else { Nok 'body fingerprint: an unterminated frontmatter is part of the body' }
    }

    # --- The DEPLOYED copy: the pinned one-liner in references/capture-hooks.md -------------------------------------------
    # /synaptic-init and /synaptic-upgrade wire THIS block into the host, so it is what users run.
    # It sits in a blockquote, and <brain> is a placeholder the agent fills.
    $skillBlock = @(); $inH = $false; $inB = $false
    foreach ($raw in [IO.File]::ReadAllLines($Skill, [Text.Encoding]::UTF8)) {
        $l = ($raw.TrimEnd("`r")) -replace '^> ?', ''
        if (-not $inH) { if ($l.StartsWith('- **Encoding PINNED')) { $inH = $true }; continue }
        if (-not $inB) { if ($l -eq '```powershell') { $inB = $true }; continue }
        if ($l -eq '```') { break }
        $skillBlock += $l
    }
    $onWindows = ($env:OS -eq 'Windows_NT')
    if ($skillBlock.Count -eq 0) { Nok "extract the deployed PowerShell one-liner (capture-hooks.md)" "anchor '- **Encoding PINNED' or the powershell fence moved" }
    elseif (-not $onWindows) {
        # The block is labelled "Windows PowerShell 5.1" (backslash paths, $env:COMPUTERNAME); off Windows
        # the POSIX sh one-liner is the deployed copy, and run.sh covers it.
        $script:n++; Write-Output "ok $($script:n) - [$Label] deployed PowerShell one-liner # SKIP labelled Windows-only"
    }
    else {
        Ok "extract the deployed PowerShell one-liner (capture-hooks.md)"
        $elsewhere = New-Workspace 'skill-elsewhere'

        # 11. Filled with an ABSOLUTE brain path (what the SKILL instructs), launched from elsewhere.
        $ws = New-Workspace 'skill-abs' -Brain
        $sk = Save-Script 'skill-abs.ps1' ($skillBlock | ForEach-Object { $_.Replace('<brain>', (Join-Path $ws '.synaptic')) })
        $rc = Invoke-Hook $sk '' $elsewhere
        $led = Get-Ledger (Join-Path $ws '.synaptic')
        if ($rc -eq 0 -and $led -and ((Get-Lines $led.FullName)[0] -match $LineRe) -and -not (Test-Bom $led.FullName) `
            -and (Test-LedgerName $led) -and (Test-LedgerIgnored (Join-Path $ws '.synaptic'))) {
            Ok 'deployed PowerShell one-liner writes a well-formed, BOM-free marker into an absolute brain path'
        } else { Nok 'deployed PowerShell one-liner writes a well-formed, BOM-free marker into an absolute brain path' "rc=$rc ledger=$(if ($led) { $led.Name } else { 'none' })" }

        # 12. Filled with a RELATIVE path (".synaptic" - what "resolve the brain root explicitly" can
        #     plausibly be read as) and run in-process after Set-Location, as a user checking a hook does.
        $ws = New-Workspace 'skill-rel' -Brain
        $sk = Save-Script 'skill-rel.ps1' ($skillBlock | ForEach-Object { $_.Replace('<brain>', '.synaptic') })
        Push-Location -LiteralPath $ws
        try { & $sk } catch { } finally { Pop-Location }
        if (Get-Ledger (Join-Path $ws '.synaptic')) { Ok 'deployed PowerShell one-liner with a relative brain path, run in-process, writes to the right brain' }
        else { Nok 'deployed PowerShell one-liner with a relative brain path, run in-process, writes to the right brain' 'relative path resolved against the process directory: nothing written, exit 0' }

        # 13. Contract parity with the recipe's A.0: a stale hook for a brain that no longer exists must
        #     not recreate it (moving or deleting a brain would otherwise leave a ghost directory).
        $gone = Join-Path $Work 'skill-gone/.synaptic'
        $sk = Save-Script 'skill-gone.ps1' ($skillBlock | ForEach-Object { $_.Replace('<brain>', $gone) })
        $rc = Invoke-Hook $sk '' $elsewhere
        if ($rc -eq 0 -and -not (Test-Path -LiteralPath $gone)) { Ok 'deployed PowerShell one-liner with an absent brain: exit 0 and recreates nothing' }
        else { Nok 'deployed PowerShell one-liner with an absent brain: exit 0 and recreates nothing' "rc=$rc; it created $gone (a ghost brain directory)" }

        # 14. An absolute brain path containing [ ] - legal in a Windows folder name.
        $ws = Join-Path $Work 'skill-proj[1]'
        [IO.Directory]::CreateDirectory((Join-Path $ws '.synaptic')) | Out-Null
        $sk = Save-Script 'skill-brackets.ps1' ($skillBlock | ForEach-Object { $_.Replace('<brain>', (Join-Path $ws '.synaptic')) })
        $null = Invoke-Hook $sk '' $elsewhere
        if (Get-Ledger (Join-Path $ws '.synaptic')) { Ok 'deployed PowerShell one-liner handles a brain path containing [ ]' }
        else { Nok 'deployed PowerShell one-liner handles a brain path containing [ ]' 'wildcard Test-Path reported the brain missing: nothing written, exit 0' }
    }
}
catch {
    Nok 'harness completed without an unexpected exception' $_.Exception.Message
}
finally {
    [Environment]::CurrentDirectory = [IO.Path]::GetTempPath()
    Remove-Item -LiteralPath $Work -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Output "1..$($script:n)"
if ($script:fails -eq 0) { Write-Output "# all $($script:n) passed" } else { Write-Output "# $($script:fails) of $($script:n) FAILED" }
exit ([int]($script:fails -gt 0))
