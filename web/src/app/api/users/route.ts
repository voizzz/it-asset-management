import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

async function checkAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return false;
  const payload = await verifySession(sessionCookie.value);
  return payload && payload.role === 'admin';
}

export async function GET() {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  
  try {
    const db = await getDb();
    const users = await db.all(`SELECT id, username, role, createdAt FROM User ORDER BY createdAt DESC`);
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  
  try {
    const { username, password, role } = await request.json();
    if (!username || !password || !role) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    
    const db = await getDb();
    // Check if user exists
    const existing = await db.get(`SELECT id FROM User WHERE username = ?`, [username]);
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }
    
    const hashed = hashPassword(password);
    const id = Date.now().toString(); // simple ID
    
    await db.run(
      `INSERT INTO User (id, username, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [id, username, hashed, role, new Date().toISOString()]
    );
    
    return NextResponse.json({ success: true, user: { id, username, role } });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
