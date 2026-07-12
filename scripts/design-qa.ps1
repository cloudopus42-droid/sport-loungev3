# design-qa.ps1 — Design Structure QA Agent for Sport Lounge
# Validates design system consistency across all components.
# Usage: .\scripts\design-qa.ps1 [-Verbose]

param(
  [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$root = Split-Path $PSScriptRoot
$clientSrc = Join-Path $root "client\src"
$issues = 0

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host " SPORT LOUNGE - Design QA Agent" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Known palette colors (uppercase)
$KNOWN_COLORS = @(
  "#FFBF00", "#FFD54F", "#B08D57", "#D4AF37", "#8D6B3D", "#8A6623",
  "#1A1815", "#221F1B", "#2A2621", "#0B0807", "#0D0F13", "#12121A",
  "#12100D", "#13161C", "#14121F", "#09090E", "#2D1B69", "#3D1F00",
  "#FFFFFF", "#C6C6C6", "#999999", "#4D4D4D",
  "#FF4D4D", "#8B1A1A", "#4A0010", "#8B3A3A",
  "#4285F4", "#34A853", "#FBBC05", "#EA4335",
  "#00F2FE", "#22C55E", "#EC4899",
  "#FFB800", "#FF5722",
  # Flavor catalog colors (BookingPage fallback data)
  "#4CAF50", "#FF9800", "#FFB07C", "#FF6B52", "#E91E63",
  "#673AB7", "#D32F2F", "#795548", "#D7CCC8", "#FFEB3B",
  "#00BCD4", "#009688", "#9C27B0", "#F44336",
  # Cookie banner gradient
  "#343755", "#3D4066"
)

$KNOWN_FONTS = @("Inter", "Playfair Display", "Space Mono", "system-ui", "Georgia", "serif", "sans-serif", "monospace")
$KNOWN_RADII = @("8px", "12px", "16px", "20px", "24px", "28px", "9999px")
$KNOWN_BLURS = @(24, 32, 48)

# ─────────────────────────────────────────────
# 1. ROGUE COLOR DETECTION
# ─────────────────────────────────────────────
Write-Host "[1/6] Checking for rogue colors..." -ForegroundColor Yellow

$tsxFiles = Get-ChildItem -Path $clientSrc -Include "*.tsx","*.ts" -Recurse -File
$rogueCount = 0

foreach ($file in $tsxFiles) {
  $lines = Get-Content $file.FullName
  $relPath = $file.FullName.Replace($root + [IO.Path]::DirectorySeparatorChar, "")
  
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ($line -match "^\s*//") { continue }
    if ($line -match "import ") { continue }
    
    $hexMatches = [regex]::Matches($line, "#([0-9a-fA-F]{3,8})\b")
    foreach ($m in $hexMatches) {
      $hex = $m.Value.ToUpper()
      if ($hex -in $KNOWN_COLORS) { continue }
      if ($relPath -match "tobaccoBrands|data/") { continue }
      if ($line -match "--color-") { continue }
      
      $rogueCount++
      if ($Verbose) {
        $msg = "  Rogue hex: " + $hex + " at " + $relPath + ":" + ($i + 1)
        Write-Host $msg -ForegroundColor Yellow
      }
    }
  }
}

if ($rogueCount -eq 0) {
  Write-Host "  PASS" -ForegroundColor Green
} else {
  $msg = "  WARN - " + $rogueCount + " rogue colors found"
  Write-Host $msg -ForegroundColor Yellow
  $issues += $rogueCount
}

# ─────────────────────────────────────────────
# 2. FONT FAMILY CONSISTENCY
# ─────────────────────────────────────────────
Write-Host "[2/6] Checking font family consistency..." -ForegroundColor Yellow

$fontIssues = 0
foreach ($file in $tsxFiles) {
  $content = Get-Content $file.FullName -Raw
  $relPath = $file.FullName.Replace($root + [IO.Path]::DirectorySeparatorChar, "")
  
  $fontMatches = [regex]::Matches($content, "font-family:\s*([^;}{]+)")
  foreach ($m in $fontMatches) {
    $fonts = $m.Groups[1].Value
    $fontList = $fonts -split "," | ForEach-Object { $_.Trim().Trim('"').Trim("'") }
    foreach ($f in $fontList) {
      if ($f -and $f -notin $KNOWN_FONTS -and $f -notmatch "var\(--" -and $f -ne "inherit" -and $f -ne "initial") {
        $fontIssues++
        if ($Verbose) {
          $msg = "  Non-standard font: " + $f + " in " + $relPath
          Write-Host $msg -ForegroundColor Yellow
        }
      }
    }
  }
}

if ($fontIssues -eq 0) {
  Write-Host "  PASS" -ForegroundColor Green
} else {
  $msg = "  WARN - " + $fontIssues + " non-standard font references"
  Write-Host $msg -ForegroundColor Yellow
  $issues += $fontIssues
}

# ─────────────────────────────────────────────
# 3. BORDER RADIUS CONSISTENCY
# ─────────────────────────────────────────────
Write-Host "[3/6] Checking border radius consistency..." -ForegroundColor Yellow

$radiusIssues = 0
foreach ($file in $tsxFiles) {
  $lines = Get-Content $file.FullName
  $relPath = $file.FullName.Replace($root + [IO.Path]::DirectorySeparatorChar, "")
  
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ($line -match "rounded-\[(\d+)px\]") {
      $radius = $Matches[1] + "px"
      if ($radius -notin $KNOWN_RADII) {
        $radiusIssues++
        if ($Verbose) {
          $msg = "  Non-standard radius: " + $radius + " at " + $relPath + ":" + ($i + 1)
          Write-Host $msg -ForegroundColor Yellow
        }
      }
    }
  }
}

if ($radiusIssues -eq 0) {
  Write-Host "  PASS" -ForegroundColor Green
} else {
  $msg = "  WARN - " + $radiusIssues + " non-standard radius values"
  Write-Host $msg -ForegroundColor Yellow
  $issues += $radiusIssues
}

# ─────────────────────────────────────────────
# 4. GLASS MORPHISM CONSISTENCY
# ─────────────────────────────────────────────
Write-Host "[4/6] Checking glass morphism consistency..." -ForegroundColor Yellow

$glassIssues = 0
foreach ($file in $tsxFiles) {
  $lines = Get-Content $file.FullName
  $relPath = $file.FullName.Replace($root + [IO.Path]::DirectorySeparatorChar, "")
  
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    if ($line -match "backdrop-filter:\s*blur\((\d+)px\)") {
      $blur = [int]$Matches[1]
      if ($blur -notin $KNOWN_BLURS) {
        $glassIssues++
        if ($Verbose) {
          $msg = "  Non-standard blur: " + $blur + "px at " + $relPath + ":" + ($i + 1)
          Write-Host $msg -ForegroundColor Yellow
        }
      }
    }
    
    if ($line -match "rgba\(15,\s*12,\s*10" -and $line -match "background" -and $line -notmatch "var\(--glass" -and $line -notmatch "bg-liquid-glass" -and $line -notmatch "glass-bg") {
      $glassIssues++
      if ($Verbose) {
        $msg = "  Inline glass bg at " + $relPath + ":" + ($i + 1)
        Write-Host $msg -ForegroundColor Yellow
      }
    }
  }
}

if ($glassIssues -eq 0) {
  Write-Host "  PASS" -ForegroundColor Green
} else {
  $msg = "  WARN - " + $glassIssues + " glass morphism inconsistencies"
  Write-Host $msg -ForegroundColor Yellow
  $issues += $glassIssues
}

# ─────────────────────────────────────────────
# 5. SPACING CONSISTENCY
# ─────────────────────────────────────────────
Write-Host "[5/6] Checking spacing consistency..." -ForegroundColor Yellow

$spacingIssues = 0
foreach ($file in $tsxFiles) {
  $lines = Get-Content $file.FullName
  $relPath = $file.FullName.Replace($root + [IO.Path]::DirectorySeparatorChar, "")
  
  for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    
    if ($line -match "(p|m|gap|space|top|right|bottom|left|inset)-\[(\d+)px\]") {
      $value = [int]$Matches[2]
      if ($value -gt 64 -or ($value % 4 -ne 0 -and $value -notin @(5, 7, 9, 11, 13, 15, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 62))) {
        $spacingIssues++
        if ($Verbose -and $spacingIssues -le 5) {
          $msg = "  Non-scale spacing: " + $value + "px at " + $relPath + ":" + ($i + 1)
          Write-Host $msg -ForegroundColor Yellow
        }
      }
    }
  }
}

if ($spacingIssues -eq 0) {
  Write-Host "  PASS" -ForegroundColor Green
} else {
  $msg = "  WARN - " + $spacingIssues + " non-scale spacing values"
  Write-Host $msg -ForegroundColor Yellow
}

# ─────────────────────────────────────────────
# 6. FOCUS STATES
# ─────────────────────────────────────────────
Write-Host "[6/6] Checking focus states on interactive elements..." -ForegroundColor Yellow

$focusIssues = 0
foreach ($file in $tsxFiles) {
  $content = Get-Content $file.FullName -Raw
  $relPath = $file.FullName.Replace($root + [IO.Path]::DirectorySeparatorChar, "")
  
  $buttonMatches = [regex]::Matches($content, "<button[^>]*>")
  foreach ($m in $buttonMatches) {
    $btn = $m.Value
    if ($btn -notmatch "focus" -and $btn -notmatch "GlowButton" -and $btn -notmatch "focus-visible") {
      if ($btn -notmatch "aria-label") {
        $focusIssues++
      }
    }
  }
}

if ($focusIssues -eq 0) {
  Write-Host "  PASS" -ForegroundColor Green
} else {
  $msg = "  WARN - " + $focusIssues + " buttons may lack focus states"
  Write-Host $msg -ForegroundColor Yellow
}

# ─────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
Write-Host " DESIGN QA REPORT" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

if ($issues -gt 0) {
  $msg = "Issues: " + $issues
  Write-Host $msg -ForegroundColor Yellow
  Write-Host "Review rogue colors, fonts, radii, and glass values." -ForegroundColor Yellow
  Write-Host "Use design tokens from tailwind.config.ts and index.css." -ForegroundColor Yellow
} else {
  Write-Host "Issues: 0" -ForegroundColor Green
  Write-Host "DESIGN OK" -ForegroundColor Green
}

Write-Host ""
return ($issues -eq 0)
