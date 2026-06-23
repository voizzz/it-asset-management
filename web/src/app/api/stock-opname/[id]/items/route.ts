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

// PATCH - update item status (Found / Missing / Different)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getSession();
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { itemId, status, notes } = await request.json();

  if (!['Found', 'Missing', 'Pending'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const db = await getDb();
  const now = new Date().toISOString();

  await db.run(`
    UPDATE StockOpnameItem
    SET status = ?, notes = ?, checkedAt = ?, checkedBy = ?
    WHERE (id = ? OR agentId = ?) AND opnameId = ?
  `, [status, notes || null, now, payload.username, itemId, itemId, id]);

  // If marked as Missing → update asset status in Agent table
  if (status === 'Missing') {
    const item = await db.get(`SELECT agentId FROM StockOpnameItem WHERE id = ?`, [itemId]);
    if (item) {
      await db.run(`UPDATE Agent SET status = 'Missing' WHERE id = ?`, [item.agentId]);
    }
  }

  // Recount stats on StockOpname
  const stats = await db.get(`
    SELECT
      SUM(CASE WHEN status = 'Found' THEN 1 ELSE 0 END) as found,
      SUM(CASE WHEN status = 'Missing' THEN 1 ELSE 0 END) as missing,
      SUM(CASE WHEN status = 'Different' THEN 1 ELSE 0 END) as different
    FROM StockOpnameItem WHERE opnameId = ?
  `, [id]);

  await db.run(`
    UPDATE StockOpname
    SET foundItems = ?, missingItems = ?, differentItems = ?
    WHERE id = ?
  `, [stats.found || 0, stats.missing || 0, stats.different || 0, id]);

  return NextResponse.json({ success: true });
}
