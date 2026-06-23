import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return null;
  return verifySession(sessionCookie.value);
}

// GET - detail sesi + items
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getSession();
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = await getDb();

  const session = await db.get(`SELECT * FROM StockOpname WHERE id = ?`, [id]);
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const items = await db.all(`
    SELECT 
      StockOpnameItem.id, StockOpnameItem.opnameId, StockOpnameItem.agentId, 
      StockOpnameItem.status, StockOpnameItem.notes, StockOpnameItem.checkedAt, StockOpnameItem.checkedBy,
      Agent.hostname, Agent.category, Agent.location, Agent.currentUser, 
      Agent.brand, Agent.model, Agent.serialNumber, Agent.realUser
    FROM StockOpnameItem 
    LEFT JOIN Agent ON Agent.id = StockOpnameItem.agentId 
    WHERE opnameId = ? 
    ORDER BY Agent.hostname
  `, [id]);

  return NextResponse.json({ session, items });
}

// PATCH - update session (complete it)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getSession();
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { action, notes } = await request.json();
  const db = await getDb();

  if (action === 'complete') {
    const now = new Date().toISOString();

    // Recount stats
    const stats = await db.get(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Found' THEN 1 ELSE 0 END) as found,
        SUM(CASE WHEN status = 'Missing' THEN 1 ELSE 0 END) as missing,
        SUM(CASE WHEN status = 'Different' THEN 1 ELSE 0 END) as different
      FROM StockOpnameItem WHERE opnameId = ?
    `, [id]);

    await db.run(`
      UPDATE StockOpname
      SET status = 'Completed', completedAt = ?, notes = COALESCE(?, notes),
          foundItems = ?, missingItems = ?, differentItems = ?
      WHERE id = ?
    `, [now, notes || null, stats.found || 0, stats.missing || 0, stats.different || 0, id]);

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

// DELETE - hapus sesi (hanya Draft)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getSession();
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const db = await getDb();

  const session = await db.get(`SELECT status FROM StockOpname WHERE id = ?`, [id]);
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.run(`DELETE FROM StockOpnameItem WHERE opnameId = ?`, [id]);
  await db.run(`DELETE FROM StockOpname WHERE id = ?`, [id]);

  return NextResponse.json({ success: true });
}
