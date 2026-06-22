import { NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { employeeId, notes } = await request.json();
    
    if (!employeeId) return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });

    const db = await getDb();
    const assignmentId = require('crypto').randomUUID();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO AssetAssignment (id, agentId, employeeId, assignedAt, notes) VALUES (?, ?, ?, ?, ?)`,
      [assignmentId, id, employeeId, now, notes || '']
    );

    await db.run(`UPDATE Agent SET employeeId = ?, status = 'in-use' WHERE id = ?`, [employeeId, id]);
    
    await logAudit(id, 'UPDATED', 'MANUAL_WEB', { assignment: { to: employeeId, action: 'checkout' } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
