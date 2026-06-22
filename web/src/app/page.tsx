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
<<<<<<< HEAD
=======
import Sidebar from '@/components/Sidebar';
>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)
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

  const logs = await db.all(`SELECT * FROM AuditLog ORDER BY timestamp DESC LIMIT 10`);

<<<<<<< HEAD
=======
  let openTicketsCount = 0;
  let recentTickets: any[] = [];
  try {
    const ticketRow = await db.get(`SELECT COUNT(*) as count FROM Ticket WHERE status = 'Open' OR status = 'In Progress'`);
    openTicketsCount = ticketRow?.count || 0;
    
    recentTickets = await db.all(`SELECT * FROM Ticket ORDER BY createdAt DESC LIMIT 5`);
  } catch (e) {
    // Ticket table might not exist in old migrations, ignore silently
  }

>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)
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
<<<<<<< HEAD
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          {logoName.substring(0, logoName.length - 2)}<span>{logoName.substring(logoName.length - 2)}</span>
        </div>
        <nav className={styles.nav}>
          <a href="/" className={`${styles.navItem} ${styles.active}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
            Dashboard
          </a>
          <a href="/assets" className={styles.navItem}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
            Assets
          </a>
          <a href="/logs" className={styles.navItem}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            Logs
          </a>
          <a href="/settings" className={styles.navItem}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            Settings
          </a>
        </nav>
        
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <LogoutButton className={styles.actionBtn} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)' }} />
        </div>
      </aside>
=======
        <Sidebar logoName={logoName} />
>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)
      
      <main className={styles.main}>
        <DashboardClient 
          agents={agents} 
          logs={logs} 
<<<<<<< HEAD
=======
          recentTickets={recentTickets}
>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)
          stats={{
            total: agents.length,
            online: onlineAgents,
            offlineBroken: offlineBroken,
            repair: repairAgents,
<<<<<<< HEAD
            spare: spareAgents
=======
            spare: spareAgents,
            openTickets: openTicketsCount
>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)
          }} 
          serverStats={serverStats}
        />
      </main>
    </div>
  );
}
