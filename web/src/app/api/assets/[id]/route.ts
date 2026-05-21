import { NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

async function getUsername() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (sessionCookie) {
      const payload = await verifySession(sessionCookie.value);
      if (payload && payload.username) return payload.username as string;
    }
  } catch (e) {}
  return 'Unknown';
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = await getDb();
    const resolvedParams = await params;
    
    const existing = await db.get(`SELECT hostname FROM Agent WHERE id = ?`, [resolvedParams.id]);
    
    await db.run(`DELETE FROM Agent WHERE id = ?`, [resolvedParams.id]);
    
    if (existing) {
      const username = await getUsername();
      await logAudit(resolvedParams.id, 'DELETED', `MANUAL_WEB:${username}`, { hostname: existing.hostname });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const data = await request.json();
    const db = await getDb();
    const resolvedParams = await params;
    
    const existing = await db.get(`SELECT * FROM Agent WHERE id = ?`, [resolvedParams.id]);
    
    // For manual assets, we allow updating specific fields
    await db.run(`
      UPDATE Agent SET 
        hostname = ?,
        category = ?,
        ipAddress = ?,
        macAddress = ?,
        brand = ?,
        model = ?,
        serialNumber = ?,
        location = ?,
        notes = ?,
        status = ?,
        currentUser = ?,
        realUser = ?,
        extension = ?,
        purchaseDate = ?,
        warrantyMonths = ?
      WHERE id = ?
    `, [
      data.hostname, data.category, data.ipAddress, data.macAddress,
      data.brand, data.model, data.serialNumber, data.location, data.notes, data.status, data.currentUser, data.realUser, data.extension,
      data.purchaseDate || null, data.warrantyMonths ? parseInt(data.warrantyMonths) : null,
      resolvedParams.id
    ]);

    if (existing) {
      const changes: Record<string, any> = {};
      const fieldsToCheck = ['hostname', 'category', 'ipAddress', 'macAddress', 'brand', 'model', 'serialNumber', 'location', 'notes', 'status', 'currentUser', 'realUser', 'extension', 'purchaseDate', 'warrantyMonths'];
      
      for (const field of fieldsToCheck) {
        if (existing[field] !== data[field] && (existing[field] !== null || data[field] !== '')) {
          changes[field] = { from: existing[field], to: data[field] };
        }
      }

      if (Object.keys(changes).length > 0) {
        const username = await getUsername();
        await logAudit(resolvedParams.id, 'UPDATED', `MANUAL_WEB:${username}`, changes);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update asset:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
