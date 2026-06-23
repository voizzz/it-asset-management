import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import fs from 'fs/promises';
import path from 'path';
import { closeDb } from '@/lib/db';

async function checkAdmin() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return false;
  const payload = await verifySession(sessionCookie.value);
  return payload && payload.role === 'admin';
}

export async function POST(request: Request) {
  if (!(await checkAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Check if the uploaded file has a valid SQLite header
    // SQLite header is "SQLite format 3\000"
    const header = buffer.toString('utf-8', 0, 16);
    if (header !== 'SQLite format 3\x00') {
      return NextResponse.json({ error: 'Invalid database file format' }, { status: 400 });
    }

    // Safely close the existing database connection
    await closeDb();

    // Overwrite the database file
    const dbPath = path.resolve(process.cwd(), 'itam_v2.db');
    await fs.writeFile(dbPath, buffer);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Restore error:', error);
    return NextResponse.json({ error: error.message || 'Failed to restore backup' }, { status: 500 });
  }
}
