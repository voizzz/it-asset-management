import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ entityType: string, entityId: string }> }) {
  try {
    const { entityType, entityId } = await params;
    const db = await getDb();
    
    const attachments = await db.all(
      `SELECT * FROM Attachment WHERE entityType = ? AND entityId = ? ORDER BY createdAt DESC`,
      [entityType, entityId]
    );

    return NextResponse.json({ attachments });
  } catch (error: any) {
    console.error('Fetch attachments error:', error);
    return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 });
  }
}
