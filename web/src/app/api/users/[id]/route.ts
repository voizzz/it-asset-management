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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  
  try {
    const { id } = await params;
    const db = await getDb();
    
    // Prevent deleting the only admin
    const adminCount = await db.get(`SELECT COUNT(*) as count FROM User WHERE role = 'admin'`);
    const user = await db.get(`SELECT role FROM User WHERE id = ?`, [id]);
    
    if (user?.role === 'admin' && adminCount.count <= 1) {
      return NextResponse.json({ error: 'Cannot delete the last admin' }, { status: 400 });
    }
    
    await db.run(`DELETE FROM User WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  
  try {
    const { id } = await params;
    const { username, password, role } = await request.json();
    const db = await getDb();
    
    // update logic with username
    if (password) {
      const hashed = hashPassword(password);
      await db.run(`UPDATE User SET username = ?, passwordHash = ?, role = ? WHERE id = ?`, [username, hashed, role, id]);
    } else {
      await db.run(`UPDATE User SET username = ?, role = ? WHERE id = ?`, [username, role, id]);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
