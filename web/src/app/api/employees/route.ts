import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const employees = await db.all(`
      SELECT e.*, 
             (SELECT COUNT(id) FROM AssetAssignment WHERE employeeId = e.id AND returnedAt IS NULL) as activeAssets,
             (SELECT COUNT(id) FROM Ticket WHERE employeeId = e.id AND status IN ('Open', 'In Progress')) as activeTickets
      FROM Employee e
      ORDER BY e.name ASC
    `);
    return NextResponse.json({ employees });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const data = await request.json();
    const id = require('crypto').randomUUID();
    
    await db.run(
      `INSERT INTO Employee (id, name, department, email, status) VALUES (?, ?, ?, ?, 'active')`,
      [id, data.name, data.department || '', data.email || '']
    );
    
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
