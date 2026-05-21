import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifySession(sessionCookie.value);
    if (!payload || !payload.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { username, password } = await request.json();
    const db = await getDb();
    
    // Check if new username is already taken by someone else
    if (username && username !== payload.username) {
      const existing = await db.get('SELECT id FROM User WHERE username = ?', [username]);
      if (existing) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
    }

    if (password && username) {
      const hashed = hashPassword(password);
      await db.run(`UPDATE User SET username = ?, passwordHash = ? WHERE id = ?`, [username, hashed, payload.id]);
    } else if (password) {
      const hashed = hashPassword(password);
      await db.run(`UPDATE User SET passwordHash = ? WHERE id = ?`, [hashed, payload.id]);
    } else if (username) {
      await db.run(`UPDATE User SET username = ? WHERE id = ?`, [username, payload.id]);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update me error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
