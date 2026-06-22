import { getDb } from '@/lib/db';
import styles from './logs.module.css';
import ExportCsvButton from '@/components/ExportCsvButton';
import LogoutButton from '@/components/LogoutButton';
import LogoIcon from '@/components/LogoIcon';
<<<<<<< HEAD
=======
import Sidebar from '@/components/Sidebar';
>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)

export const dynamic = 'force-dynamic';

export default async function Logs() {
  const db = await getDb();
  
  // Fetch logs joined with agent hostname (if still exists)
  const logs = await db.all(`
    SELECT AuditLog.*, Agent.hostname as currentHostname
    FROM AuditLog 
    LEFT JOIN Agent ON AuditLog.agentId = Agent.id
    ORDER BY AuditLog.timestamp DESC
  `);
  
  const settingsRow = await db.get(`SELECT value FROM Settings WHERE key = 'logoName'`);
  const logoName = settingsRow?.value || 'ITAM';

  // Group by month
  const groupedLogs: Record<string, any[]> = {};
  
  logs.forEach(log => {
    const date = new Date(log.timestamp);
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!groupedLogs[monthYear]) {
      groupedLogs[monthYear] = [];
    }
    groupedLogs[monthYear].push(log);
  });

  const parseChanges = (changesStr: string) => {
    try {
      return JSON.parse(changesStr);
    } catch {
      return {};
    }
  };

  return (
    <div className={styles.dashboard}>
<<<<<<< HEAD
        <aside className={styles.sidebar}>
          <div className={styles.logo}>
            {logoName.substring(0, logoName.length - 2)}<span>{logoName.substring(logoName.length - 2)}</span>
          </div>
          <nav className={styles.nav}>
            <a href="/" className={styles.navItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
              Dashboard
            </a>
            <a href="/assets" className={styles.navItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
              Assets
            </a>
            <a href="/logs" className={`${styles.navItem} ${styles.active}`}>
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
        <header className={styles.header}>
          <div>
            <h2>Audit Logs</h2>
            <p className={styles.subtitle}>Track automated and manual asset changes over time.</p>
          </div>
        </header>

        <section className={styles.logsContainer}>
          {Object.keys(groupedLogs).length === 0 ? (
            <div className={styles.emptyState}>No logs found.</div>
          ) : (
            Object.keys(groupedLogs).map(monthYear => (
              <div key={monthYear} className={styles.monthGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 className={styles.monthTitle} style={{ margin: 0 }}>{monthYear}</h3>
                  <ExportCsvButton logs={groupedLogs[monthYear]} monthYear={monthYear} />
                </div>
                
                <div className={styles.timeline}>
                  {groupedLogs[monthYear].map((log) => {
                    const changes = parseChanges(log.changes);
                    const isCreate = log.action === 'CREATED';
                    const isDelete = log.action === 'DELETED';
                    const targetName = log.currentHostname || changes.hostname || log.agentId;
                    
                    return (
                      <div key={log.id} className={`${styles.logCard} ${styles[log.action.toLowerCase()]}`}>
                        <div className={styles.arrowFill}></div>
                        <div className={styles.logHeader}>
                          <div className={styles.logMeta}>
                            <span className={`${styles.badge} ${styles[log.action.toLowerCase()]}`}>{log.action}</span>
                            <span className={styles.logTime}>Timestamp: {new Date(log.timestamp).toISOString().split('T')[1].replace('Z', '')}</span>
                          </div>
                          
                          <div className={styles.sourceBadge}>
                            <div className={styles.actorIcon}>
                              {log.source === 'AGENT_AUTO' ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
                              ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                              )}
                            </div>
                            <div className={styles.actorInfo}>
                              <span className={styles.actorTitle}>Actor</span>
                              <span className={styles.actorName}>
                                {log.source === 'AGENT_AUTO' ? 'automated system' : (log.source.startsWith('MANUAL_WEB:') ? `(${log.source.split(':')[1]})` : '(Manual)')}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className={styles.logBody}>
                          {isCreate ? (
                            <>
                              <h4>Asset Created</h4>
                              <div className={styles.targetId}>ID: {targetName}</div>
                            </>
                          ) : isDelete ? (
                            <>
                              <h4>Asset Deleted</h4>
                              <div className={styles.targetId}>ID: {targetName}</div>
                            </>
                          ) : (
                            <>
                              <h4>Asset Updated</h4>
                              <div className={styles.targetId}>ID: {targetName}</div>
                              <div className={styles.changesTableWrapper}>
                                <table className={styles.changesTable}>
                                  <thead>
                                    <tr>
                                      <th>[Property]</th>
                                      <th>[Before]</th>
                                      <th>[After]</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Object.entries(changes).map(([field, vals]: [string, any]) => (
                                      <tr key={field}>
                                        <td className={styles.fieldName}>{field.charAt(0).toUpperCase() + field.slice(1)}</td>
                                        <td className={styles.oldValue}>{vals.from || '(Empty)'}</td>
                                        <td className={styles.newValue}>{vals.to || '(Empty)'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
