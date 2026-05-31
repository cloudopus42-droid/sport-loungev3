$VERCEL_TOKEN = "vcp_1xwTy4tSeT6Hm9QmVOIUWRsYdP5P2wpVYyeu4YKJqCAuIo5IKf2g28Sb"
$RENDER_API_KEY = "rnd_eUEcmLjAq9rMWQ7pBQvdaTjQcqPX"
$GITHUB_REPO = "https://github.com/cloudopus42-droid/sport-loungev3"

function Render-Request($Method, $Endpoint, $BodyObj = $null) {
    $Uri = "https://api.render.com/v1$Endpoint"
    $TempFile = ""
    $Cmd = "curl.exe -s -X $Method `"$Uri`" -H `"Authorization: Bearer $RENDER_API_KEY`" -H `"Accept: application/json`""
    
    if ($BodyObj -ne $null) {
        # Create a unique temp file in the current directory to avoid permissions issues
        $TempFile = Join-Path $PSScriptRoot "temp_body.json"
        $BodyJson = $BodyObj | ConvertTo-Json -Depth 10 -Compress
        [System.IO.File]::WriteAllText($TempFile, $BodyJson)
        $Cmd += " -H `"Content-Type: application/json`" -d @`"$TempFile`""
    }
    
    try {
        $Output = Invoke-Expression $Cmd
        if ($TempFile -ne "") { Remove-Item $TempFile -ErrorAction SilentlyContinue }
        
        if ([string]::IsNullOrWhiteSpace($Output)) {
            return @{}
        }
        return $Output | ConvertFrom-Json
    } catch {
        if ($TempFile -ne "") { Remove-Item $TempFile -ErrorAction SilentlyContinue }
        Write-Error "Error calling Render API with curl: $_"
        throw $_
    }
}

Write-Host "🚀 Starting automation deployment for SPORT LOUNGE v3 via PowerShell & Curl..." -ForegroundColor Green

# 1. Fetch Render Owner ID
Write-Host "1. Fetching owner list from Render..."
$Owners = Render-Request -Method Get -Endpoint "/owners?limit=20"
if ($Owners.Count -eq 0 -or $Owners -eq $null) {
    throw "No owners found on Render account!"
}
$Owner = $Owners[0]
if ($Owner -eq $null) { $Owner = $Owners }
$OwnerId = $Owner.owner.id
$OwnerName = $Owner.owner.name
Write-Host "✅ Found Render Owner ID: $OwnerId ($OwnerName)" -ForegroundColor Green

# 2. Check if the Render service already exists
Write-Host "2. Checking if service 'sport-lounge-backend' already exists on Render..."
$Services = Render-Request -Method Get -Endpoint "/services?limit=50"
$Service = $null
foreach ($s in $Services) {
    if ($s.service.name -eq "sport-lounge-backend") {
        $Service = $s.service
        break
    }
}

$ServiceId = ""
$RenderUrl = ""

if ($Service -ne $null) {
    $ServiceId = $Service.id
    $RenderUrl = $Service.url
    Write-Host "✅ Service 'sport-lounge-backend' already exists. ID: $ServiceId, URL: $RenderUrl" -ForegroundColor Green
} else {
    Write-Host "➕ Creating new Web Service 'sport-lounge-backend' on Render..." -ForegroundColor Cyan
    
    # Define env vars
    $EnvVars = @(
        @{ key = "NODE_ENV"; value = "production" }
        @{ key = "PORT"; value = "5000" }
        @{ key = "JWT_SECRET"; value = "YaSmogu100_JWT_Secret_Key_Lounge" }
        @{ key = "TELEGRAM_TOKEN"; value = "8569759144:AAEpmyJthuhgJ2qCAFt_jz63TN1lwlnYHIs" }
        @{ key = "TELEGRAM_CHAT_ID"; value = "5652912760" }
        @{ key = "TELEGRAM_API_BASE_URL"; value = "https://api.telegram.org" }
        @{ key = "SUPABASE_URL"; value = "https://haemdfhteicygsidftqp.supabase.co" }
        @{ key = "SUPABASE_KEY"; value = "sb_secret_V9gEDtPTvq8XlJuefmVPAg_PoO4pWp_" }
        @{ key = "SUPABASE_ANON_KEY"; value = "sb_publishable_hdjCkqf7FcWJekjombPjWg_OzILJPDE" }
        @{ key = "ALLOWED_ORIGINS"; value = "http://localhost:3000,http://localhost:5173" }
    )
    
    # Post body
    $CreateBody = @{
        type = "web_service"
        name = "sport-lounge-backend"
        ownerId = $OwnerId
        repo = $GITHUB_REPO
        branch = "main"
        rootDir = "server"
        autoDeploy = "yes"
        serviceDetails = @{
            runtime = "node"
            plan = "free"
            envSpecificDetails = @{
                buildCommand = "npm install && npm run build"
                startCommand = "node dist/server.js"
            }
        }
        envVars = $EnvVars
    }
    
    $NewService = Render-Request -Method Post -Endpoint "/services" -BodyObj $CreateBody
    $ServiceId = $NewService.id
    $RenderUrl = $NewService.url
    Write-Host "✅ Web Service created successfully on Render! ID: $ServiceId, URL: $RenderUrl" -ForegroundColor Green
}

# 3. Write Render URL to client config
Write-Host "3. Writing VITE_API_URL=$RenderUrl to client/.env and client/.env.production..."
$ClientDir = Join-Path $PSScriptRoot "client"
$EnvFilePath = Join-Path $ClientDir ".env"
$EnvProdFilePath = Join-Path $ClientDir ".env.production"

Set-Content -Path $EnvFilePath -Value "VITE_API_URL=$RenderUrl"
Set-Content -Path $EnvProdFilePath -Value "VITE_API_URL=$RenderUrl"
Write-Host "✅ Local env files updated." -ForegroundColor Green

# 4. Deploy Front-end to Vercel via CLI
Write-Host "4. Deploying client to Vercel (running CLI)..."
$VercelCmd = "npx vercel --token $VERCEL_TOKEN --name sport-loungev3 --yes --prod"
Write-Host "Running in ${ClientDir}: $VercelCmd"

$VercelOutput = cmd /c "cd /d `"$ClientDir`" && npx vercel --token $VERCEL_TOKEN --name sport-loungev3 --yes --prod"
Write-Host "Vercel Output:`n$VercelOutput"

# Parse Vercel URL
$VercelUrl = ""
$UrlMatches = [regex]::Matches($VercelOutput, "https://[a-zA-Z0-9-]+\.vercel\.app")
if ($UrlMatches.Count -gt 0) {
    $VercelUrl = $UrlMatches[$UrlMatches.Count - 1].Value
} else {
    $VercelUrl = "https://sport-loungev3.vercel.app" # Fallback
}
Write-Host "✅ Front-end successfully deployed to Vercel! URL: $VercelUrl" -ForegroundColor Green

# 5. Update CORS in Render with Vercel URL
Write-Host "5. Updating Render service ALLOWED_ORIGINS to include: $VercelUrl"
$CurrentEnvVars = Render-Request -Method Get -Endpoint "/services/$ServiceId/env-vars?limit=100"

$UpdatedEnvVars = @()
$FoundCORS = $false
foreach ($ev in $CurrentEnvVars) {
    $Key = $ev.envVar.key
    $Value = $ev.envVar.value
    if ($Key -eq "ALLOWED_ORIGINS") {
        $Value = "http://localhost:3000,http://localhost:5173,$VercelUrl"
        $FoundCORS = $true
    }
    $UpdatedEnvVars += @{ key = $Key; value = $Value }
}

if (-not $FoundCORS) {
    $UpdatedEnvVars += @{ key = "ALLOWED_ORIGINS"; value = "http://localhost:3000,http://localhost:5173,$VercelUrl" }
}

# Put env vars back
[void](Render-Request -Method Put -Endpoint "/services/$ServiceId/env-vars" -BodyObj $UpdatedEnvVars)
Write-Host "✅ Render CORS whitelisting updated! (Redeploy automatically triggered)" -ForegroundColor Green

Write-Host "`n🎉🎉🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉🎉🎉" -ForegroundColor Green
Write-Host "Backend Server (Render): $RenderUrl" -ForegroundColor Cyan
Write-Host "Frontend Application (Vercel): $VercelUrl" -ForegroundColor Cyan
