import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifySession(sessionCookie.value);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const db = await getDb();
    
    // Get attachment
    const attachment = await db.get(`SELECT fileUrl, uploadedBy FROM Attachment WHERE id = ?`, [id]);
    
    if (attachment) {
      if (payload.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Only admins can delete attachments' }, { status: 403 });
      }

      if (attachment.fileUrl) {
      // fileUrl is like /uploads/attachments/123.pdf
      const fileName = path.basename(attachment.fileUrl);
      const filePath = path.join(process.cwd(), 'public', 'uploads', 'attachments', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      }
    }

    await db.run(`DELETE FROM Attachment WHERE id = ?`, [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete attachment error:', error);
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 });
  }
}
