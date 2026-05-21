import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST() {
  try {
    const db = await getDb();
    await db.run('DELETE FROM AuditLog');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to clear logs:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
