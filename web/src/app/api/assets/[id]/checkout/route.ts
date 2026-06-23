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
    const { employeeId, notes } = await request.json();
    
    if (!employeeId) return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });

    const db = await getDb();
    
    // Get employee name to sync with realUser
    const employee = await db.get(`SELECT name FROM Employee WHERE id = ?`, [employeeId]);
    const realUserName = employee ? employee.name : null;

    const assignmentId = require('crypto').randomUUID();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO AssetAssignment (id, agentId, employeeId, assignedAt, notes) VALUES (?, ?, ?, ?, ?)`,
      [assignmentId, id, employeeId, now, notes || '']
    );

    await db.run(`UPDATE Agent SET employeeId = ?, realUser = ?, status = 'in-use' WHERE id = ?`, [employeeId, realUserName, id]);
    
    const username = await getUsername();
    await logAudit(id, 'UPDATED', `MANUAL_WEB:${username}`, { assignment: { to: employeeId, action: 'checkout' } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
