import { NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';

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

    await db.run(`UPDATE Agent SET employeeId = NULL, status = 'spare' WHERE id = ?`, [id]);
    
    await logAudit(id, 'UPDATED', 'MANUAL_WEB', { assignment: { action: 'checkin' } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
