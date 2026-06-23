import { getDb } from '@/lib/db';
import os from 'os';
import fs from 'fs';
import path from 'path';
import styles from './page.module.css';

function getCpuUsage(): Promise<string> {
  return new Promise((resolve) => {
    const cpus1 = os.cpus();
    let idle1 = 0, total1 = 0;
    for(const cpu of cpus1) {
      for(const type in cpu.times) {
        total1 += cpu.times[type as keyof typeof cpu.times];
      }
      idle1 += cpu.times.idle;
    }

    setTimeout(() => {
      const cpus2 = os.cpus();
      let idle2 = 0, total2 = 0;
      for(const cpu of cpus2) {
        for(const type in cpu.times) {
          total2 += cpu.times[type as keyof typeof cpu.times];
        }
        idle2 += cpu.times.idle;
      }

      const idleDiff = idle2 - idle1;
      const totalDiff = total2 - total1;
      const usage = totalDiff === 0 ? 0 : 100 - (100 * idleDiff / totalDiff);
      resolve(usage.toFixed(1));
    }, 100);
  });
}

import LogoutButton from '@/components/LogoutButton';
import LogoIcon from '@/components/LogoIcon';
import Sidebar from '@/components/Sidebar';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const db = await getDb();
  const agents = await db.all(`SELECT * FROM Agent ORDER BY lastSeen DESC`);
  const settingsRow = await db.get(`SELECT value FROM Settings WHERE key = 'logoName'`);
  const logoName = settingsRow?.value || 'ITAM';

  const onlineAgents = agents.filter(a => ['online', 'in-use'].includes(a.status)).length;
  const offlineAgents = agents.filter(a => ['offline'].includes(a.status)).length;
  const brokenAgents = agents.filter(a => ['broken'].includes(a.status)).length;
  const repairAgents = agents.filter(a => ['repair'].includes(a.status)).length;
  const spareAgents = agents.filter(a => ['spare'].includes(a.status)).length;

  // Count warranty attention: expired + expiring within 30 days
  const now = new Date();
  const threshold = 30 * 24 * 60 * 60 * 1000;
  const warrantyAttention = agents.filter(a => {
    if (!a.purchaseDate || !a.warrantyMonths) return false;
    const purchase = new Date(a.purchaseDate);
    if (isNaN(purchase.getTime())) return false;
    const expiry = new Date(purchase);
    expiry.setMonth(expiry.getMonth() + a.warrantyMonths);
    const diff = expiry.getTime() - now.getTime();
    return diff <= threshold; // expired (diff < 0) or expiring soon (diff <= 30d)
  }).length;

  const offlineBroken = offlineAgents + brokenAgents;

  let expiredLicensesCount = 0;
  let expiringLicensesCount = 0;
  try {
    const licenses = await db.all(`SELECT * FROM License`);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(now.getMonth() + 3);
    
    licenses.forEach((lic: any) => {
      if (lic.expiryDate) {
         const expiry = new Date(lic.expiryDate);
         if (expiry <= now) {
            expiredLicensesCount++;
         } else if (expiry <= threeMonthsFromNow) {
            expiringLicensesCount++;
         }
      }
    });
  } catch(e) {}

  const logs = await db.all(`SELECT * FROM AuditLog ORDER BY timestamp DESC LIMIT 10`);

  let openTicketsCount = 0;
  let recentTickets: any[] = [];
  try {
    const ticketRow = await db.get(`SELECT COUNT(*) as count FROM Ticket WHERE status = 'Open' OR status = 'In Progress'`);
    openTicketsCount = ticketRow?.count || 0;
    
    recentTickets = await db.all(`SELECT * FROM Ticket ORDER BY createdAt DESC LIMIT 15`);
  } catch (e) {
    // Ticket table might not exist in old migrations, ignore silently
  }

  const dbPath = path.resolve(process.cwd(), 'itam_v2.db');
  let dbSizeMB = '0.00';
  try {
    const stat = fs.statSync(dbPath);
    dbSizeMB = (stat.size / (1024 * 1024)).toFixed(2);
  } catch (e) {}

  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = ((usedMem / totalMem) * 100).toFixed(1);
  const memTotalGB = (totalMem / (1024 ** 3)).toFixed(1);
  const memUsedGB = (usedMem / (1024 ** 3)).toFixed(1);

  const cpus = os.cpus();
  const cpuModel = cpus[0].model.replace('(R)', '').replace('(TM)', '').trim();
  const cpuCores = cpus.length;
  const cpuUsagePercent = await getCpuUsage();

  const serverStats = {
    cpuModel,
    cpuCores,
    cpuUsagePercent,
    memUsagePercent,
    memUsedGB,
    memTotalGB,
    dbSizeMB
  };

  return (
    <div className={styles.dashboard}>
        <Sidebar logoName={logoName} />
      
      <main className={styles.main}>
        <DashboardClient 
          agents={agents} 
          logs={logs} 
          recentTickets={recentTickets}
          stats={{
            total: agents.length,
            online: onlineAgents,
            offlineBroken: offlineBroken,
            repair: repairAgents,
            spare: spareAgents,
            openTickets: openTicketsCount,
            expiredLicenses: expiredLicensesCount,
            expiringLicenses: expiringLicensesCount
          }} 
          serverStats={serverStats}
        />
      </main>
    </div>
  );
}
