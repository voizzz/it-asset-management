import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';
import { signSession } from '@/lib/session';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const db = await getDb();
    const user = await db.get(`SELECT * FROM User WHERE username = ?`, [username]);
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const isValid = verifyPassword(password, user.passwordHash);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // 8 hours in milliseconds
    const sessionDuration = 8 * 60 * 60 * 1000; 
    const expiresAt = Date.now() + sessionDuration;
    
    const payload = {
      id: user.id,
      username: user.username,
      role: user.role,
      expiresAt
    };
    
    const token = await signSession(payload);
    
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours in seconds
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
