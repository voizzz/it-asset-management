import { NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.hostname || !data.os) {
      return NextResponse.json({ error: 'hostname and os are required' }, { status: 400 });
    }

    const db = await getDb();
    
    const now = new Date().toISOString();
    const id = data.hostname;
    
    const existing = await db.get(`SELECT * FROM Agent WHERE id = ?`, [id]);
    
    await db.run(`
      INSERT INTO Agent (id, hostname, os, ipAddress, macAddress, cpu, gpu, motherboard, serialNumber, ramMb, diskGb, lastSeen, createdAt, status, category, isManual, currentUser)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        os=excluded.os,
        ipAddress=excluded.ipAddress,
        macAddress=excluded.macAddress,
        cpu=excluded.cpu,
        gpu=excluded.gpu,
        motherboard=excluded.motherboard,
        serialNumber=excluded.serialNumber,
        ramMb=excluded.ramMb,
        diskGb=excluded.diskGb,
        lastSeen=excluded.lastSeen,
        status=excluded.status,
        category=excluded.category,
        currentUser=excluded.currentUser
    `, [
      id, data.hostname, data.os, data.ipAddress, data.macAddress, data.cpu, data.gpu, data.motherboard, data.serialNumber, data.ramMb, data.diskGb, now, now, 'online', data.category || 'PC', 0, data.currentUser || ''
    ]);

    if (!existing) {
      await logAudit(id, 'CREATED', 'AGENT_AUTO', { hostname: data.hostname, category: data.category || 'PC' });
    } else {
      const changes: Record<string, any> = {};
      if (existing.ipAddress !== data.ipAddress) changes.ipAddress = { from: existing.ipAddress, to: data.ipAddress };
      if (existing.currentUser !== data.currentUser) changes.currentUser = { from: existing.currentUser, to: data.currentUser };
      if (existing.status !== 'online') changes.status = { from: existing.status, to: 'online' };
      if (existing.os !== data.os) changes.os = { from: existing.os, to: data.os };
      if (existing.macAddress !== data.macAddress) changes.macAddress = { from: existing.macAddress, to: data.macAddress };
      
      if (Object.keys(changes).length > 0) {
        await logAudit(id, 'UPDATED', 'AGENT_AUTO', changes);
      }
    }

    // Process attached monitors
    if (data.monitors && Array.isArray(data.monitors)) {
      for (const mon of data.monitors) {
        if (!mon.serialNumber) continue;
        const monHostname = `MON-${mon.serialNumber}`;
        const existingMon = await db.get(`SELECT * FROM Agent WHERE id = ?`, [monHostname]);
        
        await db.run(`
          INSERT INTO Agent (id, hostname, os, ipAddress, macAddress, serialNumber, brand, model, lastSeen, createdAt, status, category, isManual, currentUser, location)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            lastSeen=excluded.lastSeen,
            status=excluded.status,
            currentUser=excluded.currentUser,
            location=excluded.location
        `, [
          monHostname, monHostname, 'N/A', '', '', mon.serialNumber, mon.brand || '', mon.model || '', now, now, 'in-use', 'Monitor', 0, data.currentUser || '', data.hostname
        ]);

        if (!existingMon) {
          await logAudit(monHostname, 'CREATED', 'AGENT_AUTO', { hostname: monHostname, category: 'Monitor' });
        } else {
          const monChanges: Record<string, any> = {};
          if (existingMon.location !== data.hostname) monChanges.location = { from: existingMon.location, to: data.hostname };
          if (existingMon.currentUser !== (data.currentUser || '')) monChanges.currentUser = { from: existingMon.currentUser, to: data.currentUser || '' };
          if (existingMon.status !== 'in-use') monChanges.status = { from: existingMon.status, to: 'in-use' };
          
          if (Object.keys(monChanges).length > 0) {
            await logAudit(monHostname, 'UPDATED', 'AGENT_AUTO', monChanges);
          }
        }
      }
    }

    // Auto Log Cleanup based on retention settings
    try {
      const retentionSetting = await db.get(`SELECT value FROM Settings WHERE key = 'logRetentionDays'`);
      const days = parseInt(retentionSetting?.value || '30', 10);
      if (days > 0) {
        await db.run(`DELETE FROM AuditLog WHERE timestamp < datetime('now', '-' || ? || ' days')`, [days]);
      }
    } catch (cleanupErr) {
      console.error('Failed to cleanup old logs:', cleanupErr);
    }

    return NextResponse.json({ success: true, agentId: id });
  } catch (error: any) {
    console.error('Agent report error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
