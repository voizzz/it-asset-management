$monitors = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorID -ErrorAction SilentlyContinue
$monitorList = @()
foreach ($m in $monitors) {
    $sn = ""
    if ($m.SerialNumberID) {
        $sn = ($m.SerialNumberID | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ }) -join ''
    }
    $model = ""
    if ($m.UserFriendlyName) {
        $model = ($m.UserFriendlyName | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ }) -join ''
    }
    $brand = ""
    if ($m.ManufacturerName) {
        $brand = ($m.ManufacturerName | Where-Object { $_ -ne 0 } | ForEach-Object { [char]$_ }) -join ''
    }
    $monitorList += @{
        serialNumber = $sn.Trim()
        model = $model.Trim()
        brand = $brand.Trim()
    }
}
$monitorList | ConvertTo-Json
