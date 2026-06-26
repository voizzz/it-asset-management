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

    // Preserve employee identity in tickets before deleting them
    const emp = await db.get(`SELECT name, email FROM Employee WHERE id = ?`, [resolvedParams.id]);
    if (emp) {
      const legacyInfo = `[Original Reporter (Deleted Employee): ${emp.name} | Email: ${emp.email || '-'}]\\n\\n`;
      await db.run(`UPDATE Ticket SET description = ? || description WHERE employeeId = ?`, [legacyInfo, resolvedParams.id]);
    }

    // Unlink any tickets associated with this employee so they become guest tickets
    await db.run(`UPDATE Ticket SET employeeId = NULL WHERE employeeId = ?`, [resolvedParams.id]);

    await db.run(`DELETE FROM Employee WHERE id = ?`, [resolvedParams.id]);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
