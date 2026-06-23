import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request, context: any) {
  try {
    const params = await context.params;
    const db = await getDb();
    
    const history = await db.all(`
      SELECT * FROM TicketHistory 
      WHERE ticketId = ? 
      ORDER BY changedAt DESC
    `, [params.id]);

    return NextResponse.json({ history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
