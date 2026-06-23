import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.all(`SELECT key, value FROM Settings`);
    const settings = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    
    return NextResponse.json({ 
      logoName: settings.logoName || 'ITAM',
      serverUrl: settings.serverUrl || 'http://localhost:3000/api/agent/report'
    });
  } catch (e) {
    return NextResponse.json({ logoName: 'ITAM', serverUrl: 'http://localhost:3000/api/agent/report' });
  }
}
