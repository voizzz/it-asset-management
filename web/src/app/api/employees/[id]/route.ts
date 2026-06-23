import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = await getDb();
    const data = await request.json();
    const resolvedParams = await params;
    
    await db.run(
      `UPDATE Employee SET name = ?, department = ?, email = ? WHERE id = ?`,
      [data.name, data.department || '', data.email || '', resolvedParams.id]
    );

    // Cascade name update to other tables
    await db.run(`UPDATE AssetAssignment SET employeeName = ? WHERE employeeId = ?`, [data.name, resolvedParams.id]);
    await db.run(`UPDATE Agent SET realUser = ? WHERE employeeId = ?`, [data.name, resolvedParams.id]);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = await getDb();
    const resolvedParams = await params;
    
    // Optional: check if they have active assignments
    const activeAssets = await db.get(`
      SELECT COUNT(*) as count FROM AssetAssignment WHERE employeeId = ? AND returnedAt IS NULL
    `, [resolvedParams.id]);

    if (activeAssets && activeAssets.count > 0) {
      return NextResponse.json({ error: 'Cannot delete employee with active asset assignments.' }, { status: 400 });
    }

    const activeTickets = await db.get(`
      SELECT COUNT(*) as count FROM Ticket WHERE employeeId = ? AND status IN ('Open', 'In Progress')
    `, [resolvedParams.id]);

    if (activeTickets && activeTickets.count > 0) {
      return NextResponse.json({ error: 'Cannot delete employee with active tickets.' }, { status: 400 });
    }

    await db.run(`DELETE FROM Employee WHERE id = ?`, [resolvedParams.id]);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
