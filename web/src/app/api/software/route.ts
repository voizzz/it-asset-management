import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const db = await getDb();
    
    // Get software list with install counts
    const software = await db.all(`
      SELECT s.*, COUNT(asw.agentId) as installCount
      FROM Software s
      LEFT JOIN AgentSoftware asw ON s.id = asw.softwareId
      GROUP BY s.id
      ORDER BY installCount DESC
    `);
    
    // Get licenses
    const licenses = await db.all(`
      SELECT * FROM License ORDER BY expiryDate ASC
    `);
    
    return NextResponse.json({ software, licenses });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const data = await request.json();
    
    if (data.action === 'add_license') {
      const id = require('crypto').randomUUID();
      await db.run(
        `INSERT INTO License (id, softwareName, licenseKey, totalSeats, expiryDate, notes) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, data.softwareName, data.licenseKey || '', data.totalSeats || 0, data.expiryDate || '', data.notes || '']
      );
      return NextResponse.json({ success: true });
    }
    
    if (data.action === 'delete_license') {
      await db.run(`DELETE FROM License WHERE id = ?`, [data.id]);
      return NextResponse.json({ success: true });
    }
    if (data.action === 'edit_license') {
      await db.run(
        `UPDATE License SET softwareName = ?, licenseKey = ?, totalSeats = ?, expiryDate = ?, notes = ? WHERE id = ?`,
        [data.softwareName, data.licenseKey || '', data.totalSeats || 0, data.expiryDate || '', data.notes || '', data.id]
      );
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
