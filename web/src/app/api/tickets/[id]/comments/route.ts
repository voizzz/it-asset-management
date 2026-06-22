import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request, context: any) {
  try {
    const params = await context.params;
    const db = await getDb();
    
    const comments = await db.all(`
      SELECT * FROM TicketComment 
      WHERE ticketId = ? 
      ORDER BY createdAt ASC
    `, [params.id]);

    return NextResponse.json({ comments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, context: any) {
  try {
    const params = await context.params;
    const db = await getDb();
    const data = await request.json();
    const id = require('crypto').randomUUID();
    const now = new Date().toISOString();
    
    if (!data.content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    
    await db.run(
      `INSERT INTO TicketComment (id, ticketId, content, createdAt) VALUES (?, ?, ?, ?)`,
      [id, params.id, data.content, now]
    );
    
    // Also update the ticket's updatedAt timestamp
    await db.run(
      `UPDATE Ticket SET updatedAt = ? WHERE id = ?`,
      [now, params.id]
    );
    
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
