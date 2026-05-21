<#
.SYNOPSIS
Installs the ITAM Core Agent as a Windows Scheduled Task.

.DESCRIPTION
This script will:
1. Create a hidden directory in C:\ProgramData\ITAMCore
2. Copy agent.ps1 to the directory
3. Create a Scheduled Task that runs the agent on system startup and every 1 hour
#>

$ErrorActionPreference = "Stop"
$agentSourcePath = Join-Path -Path $PSScriptRoot -ChildPath "agent.ps1"
$installDir = "C:\ProgramData\ITAMCore"
$agentDestPath = Join-Path -Path $installDir -ChildPath "agent.ps1"
$taskName = "ITAM_Core_Agent"

Write-Host "Installing ITAM Core Agent..." -ForegroundColor Cyan

# 1. Verify agent.ps1 exists
if (-Not (Test-Path $agentSourcePath)) {
    Write-Host "Error: agent.ps1 not found in the current directory." -ForegroundColor Red
    Exit
}

# 2. Create directory
if (-Not (Test-Path $installDir)) {
    Write-Host "Creating directory $installDir..."
    New-Item -ItemType Directory -Force -Path $installDir | Out-Null
    
    # Optional: Hide the directory
    $dirInfo = Get-Item $installDir
    $dirInfo.Attributes = 'Hidden'
}

# 3. Copy script
Write-Host "Copying agent script..."
Copy-Item -Path $agentSourcePath -Destination $agentDestPath -Force

# 4. Create Scheduled Task
Write-Host "Registering Scheduled Task..."
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-WindowStyle Hidden -ExecutionPolicy Bypass -File `"$agentDestPath`""

# Trigger 1: At System Startup
$trigger1 = New-ScheduledTaskTrigger -AtStartup
# Trigger 2: Repeat every 1 hour (Requires repetition interval on a daily trigger as a workaround)
$trigger2 = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 9999)

$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -Hidden

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger @($trigger1, $trigger2) -Principal $principal -Settings $settings -Force | Out-Null

Write-Host "Installation Complete! The agent will now run silently in the background." -ForegroundColor Green
Write-Host "Starting the agent for the first time..."
Start-ScheduledTask -TaskName $taskName
