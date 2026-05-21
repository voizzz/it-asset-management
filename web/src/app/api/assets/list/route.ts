import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDb();
    const assets = await db.all(`SELECT * FROM Agent ORDER BY lastSeen DESC`);
    
    // We parse isManual back to boolean for UI convenience if needed
    const parsedAssets = assets.map(a => ({
      ...a,
      isManual: !!a.isManual
    }));

    return NextResponse.json({ assets: parsedAssets });
  } catch (error) {
    console.error('List assets error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
