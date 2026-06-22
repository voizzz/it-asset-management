import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request, context: any) {
  try {
    const params = await context.params;
    const db = await getDb();
    
    const ticket = await db.get(`
      SELECT t.*, 
             a.hostname as agentHostname, 
             e.name as employeeName 
      FROM Ticket t
      LEFT JOIN Agent a ON t.agentId = a.id
      LEFT JOIN Employee e ON t.employeeId = e.id
      WHERE t.id = ?
    `, [params.id]);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ ticket });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: any) {
  try {
    const params = await context.params;
    const db = await getDb();
    const data = await request.json();
    const now = new Date().toISOString();
    
    // We only update the fields that are provided
    const fields = [];
    const values = [];
    
    const updatableFields = ['title', 'description', 'status', 'priority', 'category', 'agentId', 'employeeId'];
    for (const field of updatableFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }
    
    if (fields.length === 0) {
      return NextResponse.json({ success: true, message: 'No fields to update' });
    }
    
    fields.push('updatedAt = ?');
    values.push(now);
    values.push(params.id);
    
    await db.run(
      `UPDATE Ticket SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
  try {
    const params = await context.params;
    const db = await getDb();
    
    // First delete associated comments
    await db.run(`DELETE FROM TicketComment WHERE ticketId = ?`, [params.id]);
    
    // Then delete the ticket
    await db.run(`DELETE FROM Ticket WHERE id = ?`, [params.id]);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
