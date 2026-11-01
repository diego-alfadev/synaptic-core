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
$Skill   = Join-Path $Root 'standalone/synaptic/SKILL.md'
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

function Get-Block([string]$Heading, [string]$Lang) {
    $lines = [IO.File]::ReadAllLines($Recipe, [Text.Encoding]::UTF8)
    $inH = $false; $inB = $false; $out = New-Object System.Collections.Generic.List[string]
    foreach ($raw in $lines) {
        $l = $raw.TrimEnd("`r")
        if (-not $inH) { if ($l.StartsWith($Heading)) { $inH = $true }; continue }
        if (-not $inB) {
            if ($l.StartsWith('### ')) { break }
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
    return [Diagnostics.Process]::Start($psi)
}
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

$LineRe = '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z (stop|boot)$'

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
    foreach ($src in @($Recipe, $Skill)) {
        $inB = $false; $ln = 0
        foreach ($raw in [IO.File]::ReadAllLines($src, [Text.Encoding]::UTF8)) {
            $ln++; $l = ($raw.TrimEnd("`r")) -replace '^> ?', ''
            if (-not $inB) { if ($l -eq '```powershell') { $inB = $true; $blk++ }; continue }
            if ($l -eq '```') { $inB = $false; continue }
            $code = $l -replace '(^|\s)#.*$', ''
            if ($code -match '[^\x00-\x7F]') { $bad += "$(Split-Path $src -Leaf):${ln}: $($l.Trim())" }
        }
    }
    if ($bad.Count -eq 0) { Ok "recipe + SKILL.md PowerShell blocks are ASCII outside comments ($blk blocks)" }
    else { Nok "recipe + SKILL.md PowerShell blocks are ASCII outside comments ($blk blocks)" "non-ASCII in code breaks or garbles BOM-less scripts under 5.1 -> $($bad -join ' ; ')" }

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
        if ($lines.Count -ge 1 -and $lines[0] -match $LineRe) { Ok "A.0 line format is '<UTC ISO-8601> <event>'" }
        else { Nok 'A.0 line format' "got: $($lines -join ' | ')" }
        if (Test-Bom $f)       { Nok 'A.0 ledger has no UTF-8 BOM' }          else { Ok 'A.0 ledger has no UTF-8 BOM' }
        if (Test-Byte $f 0)    { Nok 'A.0 ledger has no NUL bytes (not UTF-16)' } else { Ok 'A.0 ledger has no NUL bytes (not UTF-16)' }
        if (Test-Byte $f 13)   { Nok 'A.0 ledger uses LF line endings' }      else { Ok 'A.0 ledger uses LF line endings' }
        if ($led.Name.StartsWith('-')) { Nok "A.0 ledger filename does not start with '-'" "$($led.Name) - the host-name expression returned empty on this OS" }
        else { Ok "A.0 ledger filename is <host>-<date>.log ($($led.Name))" }
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

    # --- A.2 reminder: the same git-free "unconsolidated work?" predicate as the A.3 rescue ----------
    # Work = pending breadcrumb lines, or open playground dirs; archive/ and the A.0 ledger are not. [C2 C4]
    $a2Body = Get-Block '### A.2' 'powershell'
    if ($a2Body.Count -gt 0) { Ok 'extract A.2 consolidation reminder (PowerShell) from the recipe' }
    else { Nok 'extract A.2 consolidation reminder (PowerShell) from the recipe' 'heading or fence changed'; exit 1 }
    $A2 = Save-Script 'synaptic-consolidate-reminder.ps1' $a2Body
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
    function Get-HookResult([string]$File, [string]$Cwd) {
        $p = Start-Hook $File '' $Cwd $null
        $o = $p.StandardOutput.ReadToEnd(); $e = $p.StandardError.ReadToEnd(); $p.WaitForExit()
        return @{ Out = $o.Trim(); Err = $e.Trim(); Rc = $p.ExitCode }
    }
    $crumb = "- 2026-10-29T10:00Z breadcrumb: touched a.md`n"

    $ws = New-BrainWs 'a2ps-nogit'                                                                  # C2
    New-Item -ItemType Directory -Path (Join-Path $ws '.synaptic/playgrounds/task') | Out-Null
    $r = Get-HookResult $A2 $ws
    if ($r.Out -match 'consolidation reminder') { Ok 'A.2 (PS) reminds on a NON-git brain with an open playground' }
    else { Nok 'A.2 (PS) reminds on a NON-git brain with an open playground' "out='$($r.Out)' err='$($r.Err)'" }

    $ws = New-BrainWs 'a2ps-marker'                                                                 # C2
    $ad = Join-Path $ws '.synaptic/journal/_activity'; New-Item -ItemType Directory -Path $ad | Out-Null
    [IO.File]::WriteAllText((Join-Path $ad 'h-2026-10-29.log'), "2026-10-29T10:00:00Z boot`n")
    $eap = $ErrorActionPreference; $ErrorActionPreference = 'Continue'
    Push-Location -LiteralPath $ws
    try {
        git -c core.autocrlf=false init -q 2>$null | Out-Null
        git -c core.autocrlf=false add -A 2>$null | Out-Null
        git -c core.autocrlf=false -c user.name=ci -c user.email=ci@example.invalid commit -qm init 2>$null | Out-Null
    } finally { Pop-Location; $ErrorActionPreference = $eap }
    [IO.File]::AppendAllText((Join-Path $ad 'h-2026-10-29.log'), "2026-10-29T10:05:00Z stop`n")
    $r = Get-HookResult $A2 $ws
    if (-not $r.Out -and -not $r.Err) { Ok 'A.2 (PS) stays silent when only the activity ledger changed' }
    else { Nok 'A.2 (PS) stays silent when only the activity ledger changed' "false reminder: out='$($r.Out)'" }

    $ws = New-BrainWs 'a2ps-crumbs' -Git
    [IO.File]::AppendAllText((Join-Path $ws '.synaptic/journal/_current.md'), $crumb)
    $r = Get-HookResult $A2 $ws
    if ($r.Out -match 'consolidation reminder') { Ok 'A.2 (PS) reminds when breadcrumbs are pending' }
    else { Nok 'A.2 (PS) reminds when breadcrumbs are pending' "out='$($r.Out)' err='$($r.Err)'" }

    $ws = New-BrainWs 'a2ps-archive'                                                                # C4
    New-Item -ItemType Directory -Path (Join-Path $ws '.synaptic/playgrounds/archive/old') -Force | Out-Null
    $r = Get-HookResult $A2 $ws
    if (-not $r.Out -and -not $r.Err) { Ok 'A.2 (PS) does not count playgrounds/archive/' }
    else { Nok 'A.2 (PS) does not count playgrounds/archive/' "out='$($r.Out)' err='$($r.Err)'" }

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

    $ws = New-BrainWs 'a2ps-case'                                                                   # parity
    [IO.File]::AppendAllText((Join-Path $ws '.synaptic/journal/_current.md'), "- 2026-10-29T10:00Z Breadcrumb: touched a.md`n")
    $r = Get-HookResult $A2 $ws
    if (Test-Quiet $r) { Ok "A.2 (PS) counts only the lowercase hook token 'breadcrumb:' (parity with bash)" }
    else { Nok "A.2 (PS) counts only the lowercase hook token 'breadcrumb:'" "out='$($r.Out)'" }

    $ws = New-Workspace 'a2ps-pgfile' -Brain                                                        # parity
    New-Item -ItemType Directory -Path (Join-Path $ws '.synaptic/journal') | Out-Null
    [IO.File]::WriteAllText((Join-Path $ws '.synaptic/playgrounds'), "not a directory`n")
    $r = Get-HookResult $A2 $ws
    if (Test-Quiet $r) { Ok 'A.2 (PS) does not count a FILE named playgrounds (parity with bash)' }
    else { Nok 'A.2 (PS) does not count a FILE named playgrounds' "out='$($r.Out)' err='$($r.Err)'" }

    $ws = New-Workspace 'a2ps-bare' -Brain
    New-Item -ItemType Directory -Path (Join-Path $ws '.synaptic/knowledge') | Out-Null
    $r = Get-HookResult $A2 $ws
    if (Test-Quiet $r) { Ok 'A.2 (PS) is quiet with no journal and no playgrounds/ (exit 0)' }
    else { Nok 'A.2 (PS) is quiet with no journal and no playgrounds/' "rc=$($r.Rc) err='$($r.Err)'" }

    $ws = New-BrainWs 'a2ps-untracked' -Git                                                         # C2
    New-Item -ItemType Directory -Path (Join-Path $ws '.synaptic/playgrounds/new') | Out-Null
    [IO.File]::WriteAllText((Join-Path $ws '.synaptic/playgrounds/new/notes.md'), "x`n")
    $r = Get-HookResult $A2 $ws
    if ($r.Rc -eq 0 -and $r.Out -match '0 pending breadcrumb\(s\) and 1 open playground\(s\)') { Ok 'A.2 (PS) reminds for an untracked new playground in a git repo' }
    else { Nok 'A.2 (PS) reminds for an untracked new playground in a git repo' "out='$($r.Out)'" }

    # End to end in the A.4 order (A.0 -> A.1 -> A.2) on a committed git brain. [C2]
    $ws = New-BrainWs 'chainps-qa'
    $null = Invoke-Hook $A0 'boot' $ws; Save-Commit $ws
    $null = Invoke-Hook $A0 'stop' $ws; $null = Invoke-Hook $A1 '' $ws
    $r = Get-HookResult $A2 $ws
    if (Test-Quiet $r) { Ok 'chain (PS): a turn that only wrote the activity ledger leaves no reminder' }
    else { Nok 'chain (PS): a turn that only wrote the activity ledger leaves no reminder' "out='$($r.Out)'" }

    $ws = New-BrainWs 'chainps-cons'
    [IO.File]::AppendAllText((Join-Path $ws '.synaptic/journal/_current.md'), $crumb); Save-Commit $ws
    [IO.File]::WriteAllText((Join-Path $ws '.synaptic/journal/_current.md'), "# Journal`n- [2026-10-29] consolidated`n", (New-Object Text.UTF8Encoding $false))
    $null = Invoke-Hook $A1 '' $ws; Save-Commit $ws
    $r = Get-HookResult $A2 $ws
    if (Test-Quiet $r) { Ok "chain (PS): a journal-only consolidation turn's own Stop does not re-arm the reminder" }
    else { Nok "chain (PS): a journal-only consolidation turn's own Stop does not re-arm the reminder" "out='$($r.Out)'" }

    $nd = 'An' + [char]0x00E1 + 'lisis'   # non-ASCII folder between repo root and brain: git prints the path "quoted"
    $ws = New-Workspace 'chainps-quoted'; $bw = Join-Path $ws $nd
    foreach ($d in @('.synaptic/journal', '.synaptic/playgrounds')) { New-Item -ItemType Directory -Path (Join-Path $bw $d) -Force | Out-Null }
    $jq = Join-Path $bw '.synaptic/journal/_current.md'
    [IO.File]::WriteAllText($jq, "# Journal`n" + $crumb, (New-Object Text.UTF8Encoding $false)); Save-Commit $ws
    [IO.File]::WriteAllText($jq, "# Journal`n- [2026-10-29] consolidated`n", (New-Object Text.UTF8Encoding $false))
    $null = Invoke-Hook $A1 '' $bw; Save-Commit $ws
    $r = Get-HookResult $A2 $bw
    if (Test-Quiet $r) { Ok 'chain (PS): the journal stays filtered when git quotes a non-ASCII path' }
    else { Nok 'chain (PS): the journal stays filtered when git quotes a non-ASCII path' "out='$($r.Out)'" }

    $ws = New-BrainWs 'chainps-work'
    [IO.File]::WriteAllText((Join-Path $ws 'app.txt'), "a`n"); Save-Commit $ws
    [IO.File]::AppendAllText((Join-Path $ws 'app.txt'), "b`n"); $null = Invoke-Hook $A1 '' $ws
    $r = Get-HookResult $A2 $ws
    if ($r.Rc -eq 0 -and $r.Out -match '1 pending breadcrumb\(s\)') { Ok 'chain (PS): a real project edit becomes a breadcrumb and triggers the reminder' }
    else { Nok 'chain (PS): a real project edit becomes a breadcrumb and triggers the reminder' "out='$($r.Out)'" }

    # --- The DEPLOYED copy: SKILL.md's pinned one-liner -------------------------------------------
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
    if ($skillBlock.Count -eq 0) { Nok "extract SKILL.md's deployed PowerShell one-liner" "anchor '- **Encoding PINNED' or the powershell fence moved" }
    elseif (-not $onWindows) {
        # The block is labelled "Windows PowerShell 5.1" (backslash paths, $env:COMPUTERNAME); off Windows
        # the POSIX sh one-liner is the deployed copy, and run.sh covers it.
        $script:n++; Write-Output "ok $($script:n) - [$Label] SKILL.md PowerShell one-liner # SKIP labelled Windows-only"
    }
    else {
        Ok "extract SKILL.md's deployed PowerShell one-liner"
        $elsewhere = New-Workspace 'skill-elsewhere'

        # 11. Filled with an ABSOLUTE brain path (what the SKILL instructs), launched from elsewhere.
        $ws = New-Workspace 'skill-abs' -Brain
        $sk = Save-Script 'skill-abs.ps1' ($skillBlock | ForEach-Object { $_.Replace('<brain>', (Join-Path $ws '.synaptic')) })
        $rc = Invoke-Hook $sk '' $elsewhere
        $led = Get-Ledger (Join-Path $ws '.synaptic')
        if ($rc -eq 0 -and $led -and ((Get-Lines $led.FullName)[0] -match $LineRe) -and -not (Test-Bom $led.FullName)) {
            Ok 'SKILL.md PowerShell one-liner writes a well-formed, BOM-free marker into an absolute brain path'
        } else { Nok 'SKILL.md PowerShell one-liner writes a well-formed, BOM-free marker into an absolute brain path' "rc=$rc ledger=$(if ($led) { $led.Name } else { 'none' })" }

        # 12. Filled with a RELATIVE path (".synaptic" - what "resolve the brain root explicitly" can
        #     plausibly be read as) and run in-process after Set-Location, as a user checking a hook does.
        $ws = New-Workspace 'skill-rel' -Brain
        $sk = Save-Script 'skill-rel.ps1' ($skillBlock | ForEach-Object { $_.Replace('<brain>', '.synaptic') })
        Push-Location -LiteralPath $ws
        try { & $sk } catch { } finally { Pop-Location }
        if (Get-Ledger (Join-Path $ws '.synaptic')) { Ok 'SKILL.md PowerShell one-liner with a relative brain path, run in-process, writes to the right brain' }
        else { Nok 'SKILL.md PowerShell one-liner with a relative brain path, run in-process, writes to the right brain' 'relative path resolved against the process directory: nothing written, exit 0' }

        # 13. Contract parity with the recipe's A.0: a stale hook for a brain that no longer exists must
        #     not recreate it (moving or deleting a brain would otherwise leave a ghost directory).
        $gone = Join-Path $Work 'skill-gone/.synaptic'
        $sk = Save-Script 'skill-gone.ps1' ($skillBlock | ForEach-Object { $_.Replace('<brain>', $gone) })
        $rc = Invoke-Hook $sk '' $elsewhere
        if ($rc -eq 0 -and -not (Test-Path -LiteralPath $gone)) { Ok 'SKILL.md PowerShell one-liner with an absent brain: exit 0 and recreates nothing' }
        else { Nok 'SKILL.md PowerShell one-liner with an absent brain: exit 0 and recreates nothing' "rc=$rc; it created $gone (a ghost brain directory)" }

        # 14. An absolute brain path containing [ ] - legal in a Windows folder name.
        $ws = Join-Path $Work 'skill-proj[1]'
        [IO.Directory]::CreateDirectory((Join-Path $ws '.synaptic')) | Out-Null
        $sk = Save-Script 'skill-brackets.ps1' ($skillBlock | ForEach-Object { $_.Replace('<brain>', (Join-Path $ws '.synaptic')) })
        $null = Invoke-Hook $sk '' $elsewhere
        if (Get-Ledger (Join-Path $ws '.synaptic')) { Ok 'SKILL.md PowerShell one-liner handles a brain path containing [ ]' }
        else { Nok 'SKILL.md PowerShell one-liner handles a brain path containing [ ]' 'wildcard Test-Path reported the brain missing: nothing written, exit 0' }
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
