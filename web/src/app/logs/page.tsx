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
                
                <div style={{ overflowX: 'auto', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '1rem' }}>Timestamp</th>
                        <th style={{ padding: '1rem' }}>Action</th>
                        <th style={{ padding: '1rem' }}>Asset / Hostname</th>
                        <th style={{ padding: '1rem' }}>Actor</th>
                        <th style={{ padding: '1rem' }}>Changes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedLogs[monthYear].map((log) => {
                        const changes = parseChanges(log.changes);
                        const isCreate = log.action === 'CREATED' || log.action === 'IMPORTED';
                        const isDelete = log.action === 'DELETED';
                        const targetName = log.currentHostname || changes.hostname || log.agentId;
                        
                        let actorName = 'Manual';
                        if (log.source === 'AGENT_AUTO') actorName = 'System';
                        else if (log.source.includes(':')) actorName = log.source.split(':')[1];
                        else if (log.source === 'MANUAL_WEB' || log.source === 'EXCEL_WEB') actorName = 'Web UI';
                        
                        return (
                          <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                            <td style={{ padding: '1rem', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                              <span suppressHydrationWarning>{new Date(log.timestamp).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            </td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{ 
                                padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700,
                                background: log.action === 'CREATED' || log.action === 'IMPORTED' ? 'rgba(34,197,94,0.1)' : log.action === 'DELETED' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                                color: log.action === 'CREATED' || log.action === 'IMPORTED' ? '#22c55e' : log.action === 'DELETED' ? '#ef4444' : '#3b82f6'
                              }}>
                                {log.action}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', fontWeight: 600 }}>{targetName}</td>
                            <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{actorName}</td>
                            <td style={{ padding: '1rem' }}>
                              {isCreate || isDelete ? (
                                <span style={{ color: 'var(--text-muted)' }}>-</span>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                  {Object.entries(changes).map(([field, vals]: [string, any]) => {
                                    if (field === 'assignment') {
                                      return (
                                        <div key={field} style={{ fontSize: '0.85rem' }}>
                                          <strong style={{ color: 'var(--text-primary)' }}>Assignment:</strong>{' '}
                                          <span style={{ color: 'var(--text-muted)' }}>{vals.action === 'checkin' ? 'Checked In' : `Checkout to ${empMap[vals.to] || vals.to}`}</span>
                                        </div>
                                      );
                                    }
                                    return (
                                      <div key={field} style={{ fontSize: '0.85rem' }}>
                                        <strong style={{ color: 'var(--text-primary)' }}>{field.charAt(0).toUpperCase() + field.slice(1)}:</strong>{' '}
                                        <span style={{ color: '#ef4444', textDecoration: 'line-through', marginRight: '0.35rem' }}>{vals.from || 'Empty'}</span>
                                        <span>→</span>
                                        <span style={{ color: '#22c55e', marginLeft: '0.35rem' }}>{vals.to || 'Empty'}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
