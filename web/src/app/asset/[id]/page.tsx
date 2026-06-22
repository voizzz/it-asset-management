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

<<<<<<< HEAD
  return <AssetDetailClient agent={parsedAgent} />;
=======
  // Fetch software
  const software = await db.all(`
    SELECT s.name, s.version, s.publisher, asw.installDate
    FROM AgentSoftware asw
    JOIN Software s ON s.id = asw.softwareId
    WHERE asw.agentId = ?
  `, [resolvedParams.id]);

  // Fetch assignment history
  const assignments = await db.all(`
    SELECT a.*, e.name as employeeName, e.department as employeeDepartment
    FROM AssetAssignment a
    JOIN Employee e ON e.id = a.employeeId
    WHERE a.agentId = ?
    ORDER BY a.assignedAt DESC
  `, [resolvedParams.id]);

  // Fetch employees for checkout dropdown
  const employees = await db.all(`SELECT * FROM Employee WHERE status = 'active' ORDER BY name ASC`);

  return <AssetDetailClient agent={parsedAgent} software={software} assignments={assignments} employees={employees} />;
>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)
}
