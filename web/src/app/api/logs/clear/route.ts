import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

async function checkAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return false;
  const payload = await verifySession(sessionCookie.value);
  return payload && payload.role === 'admin';
}

export async function POST() {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const db = await getDb();
    await db.run('DELETE FROM AuditLog');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to clear logs:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
