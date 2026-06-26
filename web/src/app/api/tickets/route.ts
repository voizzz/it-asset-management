import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const db = await getDb();
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const employeeId = url.searchParams.get('employeeId');
    const reporterName = url.searchParams.get('reporterName');

    const userId = request.headers.get('x-user-id');

    if (!userId) {
      if (!employeeId && !reporterName) {
        return NextResponse.json({ error: 'Unauthorized access. Bulk data extraction is prohibited.' }, { status: 401 });
      }
    }

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

    if (employeeId) {
      query += ` AND t.employeeId = ?`;
      params.push(employeeId);
    } else if (reporterName) {
      query += ` AND t.employeeId IS NULL AND t.description LIKE ?`;
      params.push(`%[Reported by: ${reporterName}]%`);
    }

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
    
    // Validate OTP
    if (!data.email) {
      return NextResponse.json({ error: 'Email is required for OTP verification' }, { status: 400 });
    }

    const otpRecord = await db.get(`SELECT verified, expiresAt FROM TicketOTP WHERE email = ?`, [data.email]);
    if (!otpRecord || !otpRecord.verified) {
      return NextResponse.json({ error: `Email has not been verified via OTP. Debug: email=${data.email}, otpRecord=${JSON.stringify(otpRecord)}` }, { status: 403 });
    }

    const nowTime = new Date();
    // Allow a bit of leeway (e.g., 30 mins after expiry) for them to fill out the form
    const formExpiry = new Date(new Date(otpRecord.expiresAt).getTime() + 30 * 60 * 1000); 
    if (nowTime > formExpiry) {
      return NextResponse.json({ error: 'OTP session expired. Please verify your email again.' }, { status: 403 });
    }

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
