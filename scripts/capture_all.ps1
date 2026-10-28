$ErrorActionPreference = 'Continue'
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$baseUrl = "http://localhost:5173"
$outDir  = "C:\Users\husna\.gemini\antigravity\brain\f49209e4-a812-4965-aa56-af714b6489c5\screenshots"
$repoDir = "c:\Users\husna\Downloads\DBMS\docs\screenshots"

# Ensure dirs exist
New-Item -ItemType Directory -Force -Path $outDir  | Out-Null
New-Item -ItemType Directory -Force -Path $repoDir | Out-Null

# Each entry: filename, URL
$pages = @(
  @("01_landing_page",              "$baseUrl/?view=landing"),
  @("02_member_dashboard",          "$baseUrl/?role=member&view=dashboard"),
  @("03_my_subscriptions_hub",      "$baseUrl/?role=member&view=personal_subs"),
  @("04_member_portal",             "$baseUrl/?role=member&view=portal"),
  @("05_plans_pricing",             "$baseUrl/?role=member&view=plans"),
  @("06_admin_executive_dashboard", "$baseUrl/?role=admin&view=dashboard"),
  @("07_admin_members_directory",   "$baseUrl/?role=admin&view=members"),
  @("08_admin_all_subscriptions",   "$baseUrl/?role=admin&view=subscriptions"),
  @("09_admin_billing_invoices",    "$baseUrl/?role=admin&view=billing"),
  @("10_admin_renewal_radar",       "$baseUrl/?role=admin&view=renewals"),
  @("11_admin_analytics_revenue",   "$baseUrl/?role=admin&view=analytics"),
  @("12_admin_retention_intelligence","$baseUrl/?role=admin&view=retention"),
  @("13_dbms_studio",               "$baseUrl/?role=admin&view=dbms"),
  @("14_dbms_documentation",        "$baseUrl/?role=admin&view=dbms_docs")
)

# Use a fresh temp profile for each screenshot to avoid caching issues
foreach ($page in $pages) {
  $name = $page[0]
  $url  = $page[1]
  $outFile = Join-Path $outDir "$name.png"
  $tempProfile = Join-Path $env:TEMP "chrome_ss_$name"

  Write-Host "Capturing: $name => $url"

  # Clean previous temp profile
  if (Test-Path $tempProfile) { Remove-Item -Recurse -Force $tempProfile }

  $proc = Start-Process -FilePath $chrome -ArgumentList @(
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1440,900",
    "--hide-scrollbars",
    "--screenshot=$outFile",
    "--user-data-dir=$tempProfile",
    "--disable-background-timer-throttling",
    "--disable-renderer-backgrounding",
    "--run-all-compositor-stages-before-draw",
    "--virtual-time-budget=8000",
    $url
  ) -PassThru -NoNewWindow

  # Wait up to 20 seconds
  $exited = $proc.WaitForExit(20000)
  if (-not $exited) {
    Write-Host "  [TIMEOUT] Killing Chrome for $name"
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
  }

  if (Test-Path $outFile) {
    $sz = (Get-Item $outFile).Length
    Write-Host "  OK: $outFile ($sz bytes)"
    Copy-Item $outFile $repoDir -Force
  } else {
    Write-Host "  FAILED: No screenshot file created"
  }

  # Clean up
  Start-Sleep -Milliseconds 500
  if (Test-Path $tempProfile) { Remove-Item -Recurse -Force $tempProfile -ErrorAction SilentlyContinue }
}

Write-Host "`nAll screenshots captured!"
