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

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.hostname || !data.category) {
      return NextResponse.json({ error: 'hostname and category are required' }, { status: 400 });
    }

    // Enforce uppercase for consistency
    const safeHostname = data.hostname.trim().toUpperCase();
    const safeCategory = data.category.trim().toUpperCase();
    const safeBrand = (data.brand || '').trim().toUpperCase();
    const safeModel = (data.model || '').trim().toUpperCase();
    const safeSerial = (data.serialNumber || '').trim().toUpperCase();
    const safeMac = (data.macAddress || '').trim().toUpperCase();

    const db = await getDb();
    const now = new Date().toISOString();
    const id = safeHostname; // Simple ID generation, could use UUID
    
    await db.run(`
      INSERT INTO Agent (id, hostname, os, ipAddress, macAddress, lastSeen, createdAt, status, category, isManual, brand, model, serialNumber, location, notes, currentUser, realUser, extension, purchaseDate, warrantyMonths)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        os=excluded.os,
        ipAddress=excluded.ipAddress,
        macAddress=excluded.macAddress,
        category=excluded.category,
        lastSeen=excluded.lastSeen,
        status=excluded.status,
        brand=excluded.brand,
        model=excluded.model,
        serialNumber=excluded.serialNumber,
        location=excluded.location,
        notes=excluded.notes,
        currentUser=excluded.currentUser,
        realUser=excluded.realUser,
        extension=excluded.extension,
        purchaseDate=excluded.purchaseDate,
        warrantyMonths=excluded.warrantyMonths
    `, [
      id, safeHostname, data.os || 'Unknown', data.ipAddress || '', safeMac, now, now, data.status || 'online', safeCategory, 1,
      safeBrand, safeModel, safeSerial, data.location || '', data.notes || '', data.currentUser || '', data.realUser || '', data.extension || '', data.purchaseDate || null, data.warrantyMonths ? parseInt(data.warrantyMonths) : null
    ]);

    const username = await getUsername();
    await logAudit(id, 'CREATED', `MANUAL_WEB:${username}`, { hostname: safeHostname, category: safeCategory });

    return NextResponse.json({ success: true, assetId: id });
  } catch (error) {
    console.error('Add asset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
