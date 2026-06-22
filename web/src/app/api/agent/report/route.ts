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
    
    // Enforce uppercase
    const safeHostname = data.hostname.trim().toUpperCase();
    const safeCategory = (data.category || 'PC').trim().toUpperCase();
    const safeSerial = (data.serialNumber || '').trim().toUpperCase();
    const safeMac = (data.macAddress || '').trim().toUpperCase();
    
    const id = safeHostname;
    
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
      id, safeHostname, data.os, data.ipAddress, safeMac, data.cpu, data.gpu, data.motherboard, safeSerial, data.ramMb, data.diskGb, now, now, 'online', safeCategory, 0, data.currentUser || ''
    ]);

    if (!existing) {
      await logAudit(id, 'CREATED', 'AGENT_AUTO', { hostname: safeHostname, category: safeCategory });
    } else {
      const changes: Record<string, any> = {};
      if (existing.ipAddress !== data.ipAddress) changes.ipAddress = { from: existing.ipAddress, to: data.ipAddress };
      if (existing.currentUser !== data.currentUser) changes.currentUser = { from: existing.currentUser, to: data.currentUser };
      if (existing.status !== 'online') changes.status = { from: existing.status, to: 'online' };
      if (existing.os !== data.os) changes.os = { from: existing.os, to: data.os };
      if (existing.macAddress !== safeMac) changes.macAddress = { from: existing.macAddress, to: safeMac };
      
      if (Object.keys(changes).length > 0) {
        await logAudit(id, 'UPDATED', 'AGENT_AUTO', changes);
      }
    }

    // Process attached monitors
    if (data.monitors && Array.isArray(data.monitors)) {
      for (const mon of data.monitors) {
        if (!mon.serialNumber) continue;
        const monSerial = String(mon.serialNumber).trim().toUpperCase();
        const monHostname = `MON-${monSerial}`;
        const existingMon = await db.get(`SELECT * FROM Agent WHERE id = ?`, [monHostname]);
        
        await db.run(`
          INSERT INTO Agent (id, hostname, os, ipAddress, macAddress, serialNumber, brand, model, lastSeen, createdAt, status, category, isManual, currentUser, location)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            lastSeen=excluded.lastSeen,
            status=excluded.status,
            currentUser=excluded.currentUser,
<<<<<<< HEAD
            location=excluded.location
          monHostname, monHostname, 'N/A', '', '', monSerial, (mon.brand || '').trim().toUpperCase(), (mon.model || '').trim().toUpperCase(), now, now, 'in-use', 'MONITOR', 0, data.currentUser || '', safeHostname
        ]);
=======
            location=excluded.location`,
          [monHostname, monHostname, 'N/A', '', '', monSerial, (mon.brand || '').trim().toUpperCase(), (mon.model || '').trim().toUpperCase(), now, now, 'in-use', 'MONITOR', 0, data.currentUser || '', safeHostname]
        );
>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)

        if (!existingMon) {
          await logAudit(monHostname, 'CREATED', 'AGENT_AUTO', { hostname: monHostname, category: 'MONITOR' });
        } else {
          const monChanges: Record<string, any> = {};
          if (existingMon.location !== safeHostname) monChanges.location = { from: existingMon.location, to: safeHostname };
          if (existingMon.currentUser !== (data.currentUser || '')) monChanges.currentUser = { from: existingMon.currentUser, to: data.currentUser || '' };
          if (existingMon.status !== 'in-use') monChanges.status = { from: existingMon.status, to: 'in-use' };
          
          if (Object.keys(monChanges).length > 0) {
            await logAudit(monHostname, 'UPDATED', 'AGENT_AUTO', monChanges);
          }
        }
      }
    }

<<<<<<< HEAD
=======
    // Process installed software
    if (data.softwareList && Array.isArray(data.softwareList)) {
      // Clear old software mappings for this agent
      await db.run(`DELETE FROM AgentSoftware WHERE agentId = ?`, [id]);
      
      for (const sw of data.softwareList) {
        if (!sw.name) continue;
        const name = String(sw.name).trim();
        const version = String(sw.version || '').trim();
        const publisher = String(sw.publisher || '').trim();
        const installDate = String(sw.installDate || '').trim();
        
        // Find existing software by name and version
        let existingSw = await db.get(`SELECT id FROM Software WHERE name = ? AND version = ?`, [name, version]);
        let swId;
        
        if (!existingSw) {
          swId = require('crypto').randomUUID();
          await db.run(
            `INSERT INTO Software (id, name, version, publisher) VALUES (?, ?, ?, ?)`,
            [swId, name, version, publisher]
          );
        } else {
          swId = existingSw.id;
        }
        
        // Add mapping
        await db.run(
          `INSERT INTO AgentSoftware (agentId, softwareId, installDate) VALUES (?, ?, ?) ON CONFLICT(agentId, softwareId) DO NOTHING`,
          [id, swId, installDate]
        );
      }
    }

>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)
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
