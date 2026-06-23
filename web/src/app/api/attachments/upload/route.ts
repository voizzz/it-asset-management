import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as string;
    const entityId = formData.get('entityId') as string;

    if (!file || !entityType || !entityId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate size (e.g. max 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    // Determine uploader
    let uploader = 'System User';
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (sessionCookie) {
      const payload = await verifySession(sessionCookie.value);
      if (payload && payload.username) {
        uploader = payload.username as string;
      }
    }

    // Save file
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'attachments');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileId = crypto.randomUUID();
    const extension = path.extname(file.name) || '';
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const diskFileName = `${fileId}${extension}`;
    const filePath = path.join(uploadsDir, diskFileName);
    const fileUrl = `/uploads/attachments/${diskFileName}`;

    fs.writeFileSync(filePath, buffer);

    // Insert to DB
    const db = await getDb();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO Attachment (id, entityType, entityId, fileName, fileUrl, fileSize, mimeType, uploadedBy, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fileId, entityType, entityId, safeFileName, fileUrl, buffer.length, file.type, uploader, now]
    );

    return NextResponse.json({
      success: true,
      attachment: {
        id: fileId,
        entityType,
        entityId,
        fileName: safeFileName,
        fileUrl,
        fileSize: buffer.length,
        mimeType: file.type,
        uploadedBy: uploader,
        createdAt: now
      }
    });

  } catch (error: any) {
    console.error('Upload attachment error:', error);
    return NextResponse.json({ error: 'Failed to upload attachment' }, { status: 500 });
  }
}
