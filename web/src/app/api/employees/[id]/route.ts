import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const data = await request.json();
    
    await db.run(
      `UPDATE Employee SET name = ?, department = ?, email = ? WHERE id = ?`,
      [data.name, data.department || '', data.email || '', params.id]
    );
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    
    // Optional: check if they have active assignments
    const activeAssets = await db.get(`
      SELECT COUNT(*) as count FROM AssetAssignment WHERE employeeId = ? AND returnedAt IS NULL
    `, [params.id]);

    if (activeAssets && activeAssets.count > 0) {
      return NextResponse.json({ error: 'Cannot delete employee with active asset assignments.' }, { status: 400 });
    }

    await db.run(`DELETE FROM Employee WHERE id = ?`, [params.id]);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
