$ErrorActionPreference = "SilentlyContinue"

$serverUrl = "http://localhost:3000/api/agent/report"

# --- INSTALLATION LOGIC ---
$installDir = "$env:APPDATA\ITAMAgent"
$targetScript = "$installDir\agent.ps1"
$taskName = "ITAM_Agent_Report"

# Only install if we have AgentPath (launched via bat) and not already in AppData
if ($env:AgentPath -and ($env:AgentPath -ne $targetScript)) {
    Write-Host "Installing ITAM Agent for automatic background reporting..." -ForegroundColor Cyan
    if (-not (Test-Path $installDir)) { New-Item -ItemType Directory -Force -Path $installDir | Out-Null }
    
    Copy-Item -Path $env:AgentPath -Destination $targetScript -Force
    
    $schtasksCmd = "powershell.exe -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$targetScript`""
    schtasks.exe /Create /TN $taskName /TR $schtasksCmd /SC HOURLY /MO 1 /F | Out-Null
    schtasks.exe /Create /TN "$taskName`_Logon" /TR $schtasksCmd /SC ONLOGON /F | Out-Null
    
    Write-Host "Successfully installed Task Scheduler to run every 1 hour!" -ForegroundColor Green
}
# --------------------------

# Collect Data
$hostname = [System.Net.Dns]::GetHostName()
$os = (Get-CimInstance Win32_OperatingSystem).Caption

# Gold standard IP retrieval: get the interface used for the default route (internet/LAN)
$defaultRoute = Get-NetRoute -DestinationPrefix "0.0.0.0/0" -ErrorAction SilentlyContinue | Sort-Object RouteMetric | Select-Object -First 1
if ($defaultRoute) {
    $ipAddress = (Get-NetIPAddress -InterfaceIndex $defaultRoute.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress
} else {
    $ipAddress = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.InterfaceAlias -notmatch 'Loopback|Pseudo|vEthernet' -and $_.IPAddress -notmatch '^169\.254\.' -and $_.IPAddress -notmatch '^127\.' } | Select-Object -First 1).IPAddress
}
if (-not $ipAddress) { $ipAddress = "127.0.0.1" }

$macAddress = (Get-CimInstance Win32_NetworkAdapterConfiguration | Where-Object { $_.IPEnabled -eq $true } | Select-Object -First 1).MACAddress
$cpu = (Get-CimInstance Win32_Processor | Select-Object -First 1).Name
$gpu = (Get-CimInstance Win32_VideoController | Select-Object -First 1).Name
$baseboard = Get-CimInstance Win32_BaseBoard
$motherboard = "$($baseboard.Manufacturer) $($baseboard.Product)"
$serialNumber = (Get-CimInstance Win32_BIOS).SerialNumber

$ramBytes = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory
$ramMb = [math]::Round($ramBytes / 1MB)
$disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
$diskGb = [math]::Round($disk.Size / 1GB)

$chassis = (Get-CimInstance Win32_SystemEnclosure).ChassisTypes
$category = "PC"

$laptopTypes = @(8, 9, 10, 11, 14, 31, 32)
$serverTypes = @(17, 23)
$isLaptop = $false
$isServer = $false

foreach ($type in $chassis) {
    if ($laptopTypes -contains $type) { $isLaptop = $true }
    if ($serverTypes -contains $type) { $isServer = $true }
}

$battery = Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue
if ($battery) { $isLaptop = $true }

if ($isLaptop) {
    $category = "Laptop"
} elseif ($isServer -or $os -match "Server") {
    $category = "Server"
}

if ($os -match "Server") { $category = "Server" }

# Collect Monitors
$monitorsData = @()
$wmiMonitors = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorID -ErrorAction SilentlyContinue
foreach ($m in $wmiMonitors) {
    $sn = ""
    if ($m.SerialNumberID) { $sn = ($m.SerialNumberID | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ }) -join '' }
    $model = ""
    if ($m.UserFriendlyName) { $model = ($m.UserFriendlyName | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ }) -join '' }
    $brand = ""
    if ($m.ManufacturerName) { $brand = ($m.ManufacturerName | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ }) -join '' }
    
    $sn = $sn.Trim()
    $model = $model.Trim()
    
    # Ignore internal displays with generic '0' serial or missing models
    if ($sn -and $sn -ne "0" -and $model) {
        $monitorsData += @{
            serialNumber = $sn
            model = $model
            brand = $brand.Trim()
        }
    }
}

$payload = @{
    hostname = $hostname
    os = $os
    category = $category
    currentUser = $env:USERNAME
    ipAddress = $ipAddress
    macAddress = $macAddress
    cpu = $cpu
    gpu = $gpu
    motherboard = $motherboard
    serialNumber = $serialNumber
    ramMb = $ramMb
    diskGb = $diskGb
    monitors = $monitorsData
}

$jsonPayload = $payload | ConvertTo-Json -Depth 10

$jsonPayload | Out-File "$PSScriptRoot\debug_payload.json" -ErrorAction SilentlyContinue

# Send Data
Write-Host "Sending data to $serverUrl..."
try {
    Invoke-RestMethod -Uri $serverUrl -Method Post -Body $jsonPayload -ContentType "application/json" | Out-Null
    Write-Host "Successfully reported to ITAM Core!" -ForegroundColor Green
} catch {
    Write-Host "Failed to report: $_" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errResponse = $reader.ReadToEnd()
        Write-Host "Server Response: $errResponse" -ForegroundColor Red
    }
}

Write-Host "Window will close in 3 seconds..."
Start-Sleep -Seconds 3
