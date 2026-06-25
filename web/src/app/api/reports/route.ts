import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'summary';
    const db = await getDb();

    if (type === 'summary') {
      const totalAssets = await db.get(`SELECT COUNT(*) as count FROM Agent`);
      const totalEmployees = await db.get(`SELECT COUNT(*) as count FROM Employee`);
      const totalSoftware = await db.get(`SELECT COUNT(*) as count FROM Software`);
      
      const byStatus = await db.all(`SELECT status, COUNT(*) as count FROM Agent GROUP BY status`);
      const byCategory = await db.all(`SELECT category, COUNT(*) as count FROM Agent GROUP BY category`);
      
      return NextResponse.json({ 
        totalAssets: totalAssets.count, 
        totalEmployees: totalEmployees.count, 
        totalSoftware: totalSoftware.count,
        byStatus,
        byCategory
      });
    } else if (type === 'assets') {
      const data = await db.all(`
        SELECT a.hostname, a.category, a.status, a.ipAddress, a.createdAt, a.purchaseDate, a.warrantyMonths, e.name as assignedTo
        FROM Agent a
        LEFT JOIN Employee e ON a.employeeId = e.id
        ORDER BY a.hostname ASC
      `);
      return NextResponse.json({ data });
    } else if (type === 'tickets') {
      const data = await db.all(`
        SELECT t.id, t.title, t.status, t.priority, t.category, t.createdAt, t.updatedAt, e.name as creatorName, a.hostname as assetName, a.category as assetCategory,
        (SELECT changedAt FROM TicketHistory WHERE ticketId = t.id AND newStatus = 'Closed' ORDER BY changedAt DESC LIMIT 1) as historyClosedAt,
        (SELECT changedBy FROM TicketHistory WHERE ticketId = t.id AND newStatus = 'Closed' ORDER BY changedAt DESC LIMIT 1) as historyClosedBy
        FROM Ticket t
        LEFT JOIN Employee e ON t.employeeId = e.id
        LEFT JOIN Agent a ON t.agentId = a.id
        ORDER BY t.createdAt DESC
      `);
      return NextResponse.json({ data });
    } else if (type === 'consumables') {
      const data = await db.all(`
        SELECT name, category, quantity, minQuantity, location
        FROM Consumable
        ORDER BY category ASC, name ASC
      `);
      return NextResponse.json({ data });
    } else if (type === 'software') {
      const data = await db.all(`
        SELECT s.id, s.name, s.version, s.publisher, COUNT(asw.agentId) as installCount,
               GROUP_CONCAT(a.hostname || ' (' || COALESCE(e.name, a.currentUser, 'No User') || ')', ', ') as installedAssets
        FROM Software s
        LEFT JOIN AgentSoftware asw ON s.id = asw.softwareId
        LEFT JOIN Agent a ON asw.agentId = a.id
        LEFT JOIN Employee e ON a.employeeId = e.id
        GROUP BY s.id
        ORDER BY installCount DESC
      `);
      return NextResponse.json({ data });
    } else if (type === 'licenses') {
      const data = await db.all(`
        SELECT l.*,
        (SELECT COUNT(asw.agentId) 
         FROM AgentSoftware asw 
         JOIN Software s ON asw.softwareId = s.id 
         WHERE s.name = l.softwareName) as usedSeats
        FROM License l
        ORDER BY l.expiryDate ASC
      `);
      return NextResponse.json({ data });
    }

    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
