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

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const db = await getDb();
    const now = new Date().toISOString();

    // Find active assignment
    const activeAssign = await db.get(`SELECT id FROM AssetAssignment WHERE agentId = ? AND returnedAt IS NULL`, [id]);
    
    if (activeAssign) {
      await db.run(`UPDATE AssetAssignment SET returnedAt = ? WHERE id = ?`, [now, activeAssign.id]);
    }

    await db.run(`UPDATE Agent SET employeeId = NULL, realUser = NULL, status = 'spare' WHERE id = ?`, [id]);
    
    const username = await getUsername();
    await logAudit(id, 'UPDATED', `MANUAL_WEB:${username}`, { assignment: { action: 'checkin' } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
