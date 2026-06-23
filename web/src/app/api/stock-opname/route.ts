import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import { randomUUID } from 'crypto';

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return null;
  return verifySession(sessionCookie.value);
}

// GET - list all stock opname sessions
export async function GET() {
  const payload = await getSession();
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await getDb();
  const sessions = await db.all(`
    SELECT * FROM StockOpname ORDER BY createdAt DESC
  `);
  return NextResponse.json({ sessions });
}

// POST - create new stock opname session
export async function POST(request: Request) {
  const payload = await getSession();
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { name, notes } = await request.json();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const db = await getDb();

  // Get all active assets
  const assets = await db.all(`
    SELECT id, hostname, category, location, currentUser, brand, model, serialNumber
    FROM Agent
    WHERE status != 'Retired'
    ORDER BY hostname
  `);

  const id = randomUUID();
  const now = new Date().toISOString();

  await db.run(`
    INSERT INTO StockOpname (id, name, status, createdBy, createdAt, notes, totalItems, foundItems, missingItems, differentItems)
    VALUES (?, ?, 'In Progress', ?, ?, ?, ?, 0, 0, 0)
  `, [id, name, payload.username, now, notes || null, assets.length]);

  // Insert all assets as Pending items
  for (const asset of assets) {
    await db.run(`
      INSERT INTO StockOpnameItem (id, opnameId, agentId, hostname, category, location, currentUser, brand, model, serialNumber, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
    `, [
      randomUUID(), id, asset.id, asset.hostname, asset.category,
      asset.location, asset.currentUser, asset.brand, asset.model, asset.serialNumber
    ]);
  }

  return NextResponse.json({ success: true, id });
}
