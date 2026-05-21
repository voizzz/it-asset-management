import { getDb } from '@/lib/db';
import { notFound } from 'next/navigation';
import AssetDetailClient from './AssetDetailClient';

export const dynamic = 'force-dynamic';

export default async function AssetDetail({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const db = await getDb();
  const agent = await db.get(`SELECT * FROM Agent WHERE id = ?`, [resolvedParams.id]);

  if (!agent) {
    notFound();
  }

  // Parse isManual to boolean
  const parsedAgent = {
    ...agent,
    isManual: !!agent.isManual
  };

  return <AssetDetailClient agent={parsedAgent} />;
}
