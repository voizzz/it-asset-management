import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const db = await getDb();
    const settingsRow = await db.get(`SELECT value FROM Settings WHERE key = 'serverUrl'`);
    const serverUrl = settingsRow?.value || 'http://localhost:3000/api/agent/report';

    // Path to the agent script. Assumes running from the web directory
    const agentPath = path.join(process.cwd(), '../agent/agent.ps1');
    let scriptContent = fs.readFileSync(agentPath, 'utf8');

    // Replace the hardcoded URL with the dynamic one
    scriptContent = scriptContent.replace(
      /\$serverUrl = ".*"/,
      `$serverUrl = "${serverUrl}"`
    );

    // Wrap the PowerShell script in a polyglot Batch header
    const batContent = `<# :
@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$env:AgentPath='%~f0'; iex ((Get-Content '%~f0') -join [Environment]::NewLine)"
exit /b
#>
${scriptContent}`;

    // Return as a downloadable file
    return new NextResponse(batContent, {
      headers: {
        'Content-Type': 'application/x-bat',
        'Content-Disposition': 'attachment; filename="itam-agent.bat"',
      },
    });
  } catch (error) {
    console.error('Download agent error:', error);
    return new NextResponse('Failed to generate agent script. Make sure the agent/agent.ps1 file exists.', { status: 500 });
  }
}
