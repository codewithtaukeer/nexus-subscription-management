$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$outDir = "C:\Users\husna\Downloads\DBMS\docs\screenshots"
$tempDataDir = "C:\Users\husna\AppData\Local\Temp\chrome_snap"

if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}

$screens = @(
    @{ name = "01_landing_page.png"; url = "http://localhost:5173/?view=landing" },
    @{ name = "02_member_dashboard.png"; url = "http://localhost:5173/?role=member&view=dashboard" },
    @{ name = "03_my_subscriptions_hub.png"; url = "http://localhost:5173/?role=member&view=personal_subs" },
    @{ name = "04_member_portal.png"; url = "http://localhost:5173/?role=member&view=portal" },
    @{ name = "05_plans_pricing.png"; url = "http://localhost:5173/?role=member&view=plans" },
    @{ name = "06_admin_executive_dashboard.png"; url = "http://localhost:5173/?role=admin&view=dashboard" },
    @{ name = "07_admin_members_directory.png"; url = "http://localhost:5173/?role=admin&view=members" },
    @{ name = "08_admin_all_subscriptions.png"; url = "http://localhost:5173/?role=admin&view=subscriptions" },
    @{ name = "09_admin_billing_invoices.png"; url = "http://localhost:5173/?role=admin&view=billing" },
    @{ name = "10_admin_renewal_radar.png"; url = "http://localhost:5173/?role=admin&view=renewals" },
    @{ name = "11_admin_analytics_revenue.png"; url = "http://localhost:5173/?role=admin&view=analytics" },
    @{ name = "12_admin_retention_intelligence.png"; url = "http://localhost:5173/?role=admin&view=retention" },
    @{ name = "13_dbms_studio.png"; url = "http://localhost:5173/?role=admin&view=dbms" },
    @{ name = "14_dbms_documentation.png"; url = "http://localhost:5173/?role=admin&view=dbms_docs" }
)

foreach ($s in $screens) {
    $dest = Join-Path $outDir $s.name
    Write-Host "Capturing $($s.name)..."
    
    $proc = Start-Process -FilePath $chromePath -ArgumentList @(
        "--headless=new",
        "--no-sandbox",
        "--disable-gpu",
        "--user-data-dir=`"$tempDataDir`"",
        "--virtual-time-budget=2000",
        "--window-size=1440,900",
        "--screenshot=`"$dest`"",
        $s.url
    ) -PassThru

    $finished = $proc.WaitForExit(6000)
    if (!$finished) {
        Write-Host "Timed out on $($s.name), killing..."
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Done! All screenshots captured."
