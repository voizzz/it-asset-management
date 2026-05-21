import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.key || data.value === undefined) {
      return NextResponse.json({ error: 'Key and value are required' }, { status: 400 });
    }

    const db = await getDb();
    
    await db.run(`
      INSERT INTO Settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value
    `, [data.key, data.value]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
