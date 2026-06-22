import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const db = await getDb();
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');

    let query = `
      SELECT t.*, 
             a.hostname as agentHostname, 
             e.name as employeeName 
      FROM Ticket t
      LEFT JOIN Agent a ON t.agentId = a.id
      LEFT JOIN Employee e ON t.employeeId = e.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status) {
      query += ` AND t.status = ?`;
      params.push(status);
    }
    if (priority) {
      query += ` AND t.priority = ?`;
      params.push(priority);
    }

    query += ` ORDER BY t.createdAt DESC`;

    const tickets = await db.all(query, params);
    return NextResponse.json({ tickets });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const data = await request.json();
    const id = require('crypto').randomUUID();
    const now = new Date().toISOString();
    
    await db.run(
      `INSERT INTO Ticket (id, title, description, status, priority, category, agentId, employeeId, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        data.title, 
        data.description, 
        data.status || 'Open', 
        data.priority || 'Medium', 
        data.category || null, 
        data.agentId || null, 
        data.employeeId || null, 
        now, 
        now
      ]
    );
    
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
