import { getDb } from '@/lib/db';
import styles from './logs.module.css';
import ExportCsvButton from '@/components/ExportCsvButton';
import LogoutButton from '@/components/LogoutButton';
import LogoIcon from '@/components/LogoIcon';
import Sidebar from '@/components/Sidebar';
import LogsSearch from './LogsSearch';
import LogsPagination from './LogsPagination';

export const dynamic = 'force-dynamic';

export default async function Logs(props: { searchParams: Promise<{ q?: string, page?: string }> }) {
  const db = await getDb();
  const searchParams = await props.searchParams;
  const query = (searchParams?.q || '').toLowerCase();
  const currentPage = parseInt(searchParams?.page || '1', 10);
  const ITEMS_PER_PAGE = 15;
  
  // Fetch logs joined with agent hostname (if still exists)
  let logs = await db.all(`
    SELECT AuditLog.*, Agent.hostname as currentHostname
    FROM AuditLog 
    LEFT JOIN Agent ON AuditLog.agentId = Agent.id
    ORDER BY AuditLog.timestamp DESC
  `);
  
  const settingsRow = await db.get(`SELECT value FROM Settings WHERE key = 'logoName'`);
  const logoName = settingsRow?.value || 'ITAM';

  const employees = await db.all(`SELECT id, name FROM Employee`);
  const empMap = employees.reduce((acc: any, emp: any) => {
    acc[emp.id] = emp.name;
    return acc;
  }, {});

  if (query) {
    logs = logs.filter((log: any) => {
      const targetName = (log.currentHostname || log.agentId || '').toLowerCase();
      const action = (log.action || '').toLowerCase();
      const source = (log.source || '').toLowerCase();
      const changesStr = (log.changes || '').toLowerCase();
      return targetName.includes(query) || action.includes(query) || source.includes(query) || changesStr.includes(query);
    });
  }

  const totalPages = Math.ceil(logs.length / ITEMS_PER_PAGE) || 1;
  const paginatedLogs = logs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Group by month
  const groupedLogs: Record<string, any[]> = {};
  
  paginatedLogs.forEach(log => {
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
        <Sidebar logoName={logoName} />
      
      <main className={styles.main}>
        <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>Audit Logs</h2>
            <p className={styles.subtitle}>Track automated and manual asset changes over time.</p>
          </div>
          <LogsSearch />
        </header>

        <section className={styles.logsContainer}>
          {Object.keys(groupedLogs).length === 0 ? (
            <div className={styles.emptyState}>No logs found.</div>
          ) : (
            Object.keys(groupedLogs).map(monthYear => (
              <div key={monthYear} className={styles.monthGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 className={styles.monthTitle} style={{ margin: 0 }}>{monthYear}</h3>
                  <ExportCsvButton logs={groupedLogs[monthYear]} monthYear={monthYear} empMap={empMap} />
                </div>
                
                <div className={styles.timeline}>
                  {groupedLogs[monthYear].map((log) => {
                    const changes = parseChanges(log.changes);
                    const isCreate = log.action === 'CREATED' || log.action === 'IMPORTED';
                    const isDelete = log.action === 'DELETED';
                    const targetName = log.currentHostname || changes.hostname || log.agentId;
                    
                    let actorName = '(Manual)';
                    if (log.source === 'AGENT_AUTO') actorName = 'Automated System';
                    else if (log.source.includes(':')) actorName = `(${log.source.split(':')[1]})`;
                    else if (log.source === 'MANUAL_WEB' || log.source === 'EXCEL_WEB') actorName = `(Web UI)`;
                    
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
                              <span className={styles.actorName}>{actorName}</span>
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
                                    {Object.entries(changes).map(([field, vals]: [string, any]) => {
                                      if (field === 'assignment') {
                                        return (
                                          <tr key={field}>
                                            <td className={styles.fieldName}>Assignment</td>
                                            <td className={styles.oldValue}>-</td>
                                            <td className={styles.newValue}>{vals.action === 'checkin' ? 'Checked In (Returned)' : `Checked Out to: ${empMap[vals.to] ? `${empMap[vals.to]} (${vals.to})` : vals.to}`}</td>
                                          </tr>
                                        );
                                      }
                                      return (
                                        <tr key={field}>
                                          <td className={styles.fieldName}>{field.charAt(0).toUpperCase() + field.slice(1)}</td>
                                          <td className={styles.oldValue}>{vals.from || '(Empty)'}</td>
                                          <td className={styles.newValue}>{vals.to || '(Empty)'}</td>
                                        </tr>
                                      );
                                    })}
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
          {Object.keys(groupedLogs).length > 0 && (
            <LogsPagination totalPages={totalPages} currentPage={currentPage} />
          )}
        </section>
      </main>
    </div>
  );
}
