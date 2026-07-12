# pre-deploy.ps1 — Autonomous QA agent for Sport Lounge
# Runs ALL checks before deploy. Returns $false if deploy should be blocked.
# Usage: .\scripts\pre-deploy.ps1 [-AutoFix] [-Verbose] [-SkipBuild]

param(
  [switch]$AutoFix,
  [switch]$Verbose,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Continue"
$root = Split-Path $PSScriptRoot
$clientDir = Join-Path $root "client"
$serverDir = Join-Path $root "server"
$issueCount = 0
$errorCount = 0
$warnCount = 0
$fixCount = 0

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " SPORT LOUNGE - Pre-Deploy QA Agent" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ─────────────────────────────────────────────
# 1. TypeScript Type Check (Server)
# ─────────────────────────────────────────────
Write-Host "[1/7] TypeScript type check (server)..." -ForegroundColor Yellow
$tscOutput = & cmd /c "cd /d `"$serverDir`" && npx tsc --noEmit 2>&1"
$tscExit = $LASTEXITCODE
if ($tscExit -ne 0) {
  $tscErrors = $tscOutput | Where-Object { $_ -match "error TS" }
  foreach ($err in $tscErrors) {
    Write-Host "  ERROR: $err" -ForegroundColor Red
    $errorCount++
  }
  Write-Host "  FAIL - $($tscErrors.Count) TypeScript errors" -ForegroundColor Red
} else {
  Write-Host "  PASS" -ForegroundColor Green
}

# ─────────────────────────────────────────────
# 2. Client Build
# ─────────────────────────────────────────────
if ($SkipBuild) {
  Write-Host "[2/7] Client build - SKIPPED" -ForegroundColor DarkGray
} else {
  Write-Host "[2/7] Client build (Vite)..." -ForegroundColor Yellow
  $buildOutput = & cmd /c "cd /d `"$clientDir`" && npx vite build 2>&1"
  $buildExit = $LASTEXITCODE
  if ($buildExit -ne 0) {
    $buildErrors = $buildOutput | Select-String -Pattern "error" -SimpleMatch
    foreach ($err in $buildErrors) {
      Write-Host "  ERROR: $($err.Line.Trim())" -ForegroundColor Red
      $errorCount++
    }
    Write-Host "  FAIL - Build errors detected" -ForegroundColor Red
  } else {
    Write-Host "  PASS" -ForegroundColor Green
  }
}

# ─────────────────────────────────────────────
# 3. Unhandled Promise Rejections (Server)
# ─────────────────────────────────────────────
Write-Host "[3/7] Unhandled promise rejections (server)..." -ForegroundColor Yellow
$serverFiles = Get-ChildItem -Path $serverDir -Filter "*.ts" -Recurse -File | Where-Object { $_.FullName -notmatch "node_modules|dist" }
$unhandledCount = 0
foreach ($file in $serverFiles) {
  $lines = Get-Content $file.FullName
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ($line -match "\.then\(" -and $line -notmatch "\.catch\(" -and $line -notmatch "void ") {
      $relPath = $file.FullName.Replace($root + "\", "")
      Write-Host "  WARN: ${relPath}:$($i+1) - Promise chain without .catch()" -ForegroundColor Yellow
      $warnCount++
      $unhandledCount++
    }
  }
}
if ($unhandledCount -eq 0) {
  Write-Host "  PASS" -ForegroundColor Green
} else {
  Write-Host "  WARN - $unhandledCount unhandled promise chains" -ForegroundColor Yellow
}

# ─────────────────────────────────────────────
# 4. Silent Catch Blocks (Server + Client)
# ─────────────────────────────────────────────
Write-Host "[4/7] Silent catch blocks..." -ForegroundColor Yellow
$silentCatchCount = 0
$allTsFiles = Get-ChildItem -Path $root -Include "*.ts","*.tsx" -Recurse -File | Where-Object { $_.FullName -notmatch "node_modules|dist" }
foreach ($file in $allTsFiles) {
  $content = Get-Content $file.FullName -Raw
  $hasSilentCatch = $false
  if ($content -match "catch\s*\(\s*_?\s*\)\s*\{\s*\}") {
    $hasSilentCatch = $true
  }
  if ($content -match "catch\s*\{\s*\}") {
    $hasSilentCatch = $true
  }
  if ($hasSilentCatch) {
    $relPath = $file.FullName.Replace($root + "\", "")
    if ($AutoFix) {
      $newContent = $content -replace "catch\s*\(\s*_?\s*\)\s*\{\s*\}", "catch (e) { console.warn('Silent catch:', e); }"
      $newContent = $newContent -replace "catch\s*\{\s*\}", "catch (e) { console.warn('Silent catch:', e); }"
      Set-Content -Path $file.FullName -Value $newContent -NoNewline
      Write-Host "  FIXED: $relPath - Replaced silent catch" -ForegroundColor Green
      $fixCount++
    } else {
      Write-Host "  WARN: $relPath - Silent catch block hides errors" -ForegroundColor Yellow
      $warnCount++
    }
    $silentCatchCount++
  }
}
if ($silentCatchCount -eq 0) {
  Write-Host "  PASS" -ForegroundColor Green
}

# ─────────────────────────────────────────────
# 5. Text Sizes Below Minimum (Client)
# ─────────────────────────────────────────────
Write-Host "[5/7] Accessibility: text sizes below 9px..." -ForegroundColor Yellow
$tsxFiles = Get-ChildItem -Path (Join-Path $root "client\src") -Include "*.tsx" -Recurse -File
$smallTextCount = 0
foreach ($file in $tsxFiles) {
  $content = Get-Content $file.FullName -Raw
  $matches = [regex]::Matches($content, "text-\[(\d+)px\]")
  $changed = $false
  foreach ($m in $matches) {
    $size = [int]$m.Groups[1].Value
    if ($size -lt 9) {
      $relPath = $file.FullName.Replace($root + "\", "")
      if ($AutoFix) {
        $content = $content.Replace("text-[$($size)px]", "text-[9px]")
        $changed = $true
        $smallTextCount++
      } else {
        Write-Host "  WARN: ${relPath} - Text size ${size}px below 9px minimum" -ForegroundColor Yellow
        $warnCount++
        $smallTextCount++
      }
    }
  }
  if ($changed) {
    Set-Content -Path $file.FullName -Value $content -NoNewline
    $relPath = $file.FullName.Replace($root + "\", "")
    Write-Host "  FIXED: $relPath - Bumped small text to 9px" -ForegroundColor Green
    $fixCount++
  }
}
if ($smallTextCount -eq 0) {
  Write-Host "  PASS" -ForegroundColor Green
} elseif ($AutoFix) {
  Write-Host "  FIXED - $smallTextCount text elements bumped" -ForegroundColor Green
}

# ─────────────────────────────────────────────
# 6. Touch Targets Below 44px (Client)
# ─────────────────────────────────────────────
Write-Host "[6/7] Accessibility: touch targets below 44px..." -ForegroundColor Yellow
$touchCount = 0
foreach ($file in $tsxFiles) {
  $lines = Get-Content $file.FullName
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ($line -match 'p-1[^0-9]' -and ($line -match 'button|onClick|trash|delete|close|edit|Icon')) {
      $relPath = $file.FullName.Replace($root + "\", "")
      Write-Host "  WARN: ${relPath}:$($i+1) - Small touch target (p-1 on interactive)" -ForegroundColor Yellow
      $warnCount++
      $touchCount++
    }
  }
}
if ($touchCount -eq 0) {
  Write-Host "  PASS" -ForegroundColor Green
} else {
  Write-Host "  WARN - $touchCount small touch targets found" -ForegroundColor Yellow
}

# ─────────────────────────────────────────────
# 7. Error Boundary Check
# ─────────────────────────────────────────────
Write-Host "[7/7] Error boundary presence..." -ForegroundColor Yellow
$appFile = Join-Path $clientDir "src\App.tsx"
$appFound = Test-Path $appFile
if ($appFound) {
  $appContent = Get-Content $appFile -Raw
  if ($appContent -match "ErrorBoundary") {
    Write-Host "  PASS" -ForegroundColor Green
  } else {
    Write-Host "  FAIL - No ErrorBoundary in App.tsx" -ForegroundColor Red
    $errorCount++
  }
} else {
  Write-Host "  SKIP - App.tsx not found" -ForegroundColor DarkGray
}

# ─────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " QA REPORT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Errors:   $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Green" })
Write-Host "Warnings: $warnCount" -ForegroundColor $(if ($warnCount -gt 0) { "Yellow" } else { "Green" })
Write-Host "Fixes:    $fixCount" -ForegroundColor $(if ($fixCount -gt 0) { "Green" } else { "Gray" })
Write-Host ""

$blocked = $errorCount -gt 0
if ($blocked) {
  Write-Host "DEPLOY BLOCKED - Fix errors above before deploying." -ForegroundColor Red
} else {
  Write-Host "DEPLOY OK" -ForegroundColor Green
}

Write-Host ""
return (-not $blocked)
