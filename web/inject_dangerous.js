const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src/app/reports/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Update softwareMetrics
const oldSoftwareMetrics = `  // --- SOFTWARE SUMMARY LOGIC ---
  const softwareMetrics = useMemo(() => {
    if (activeTab !== 'software' || softwareReportView !== 'yearly') return { totalTitles: 0, totalInstalls: 0 };
    const totalTitles = reportData.length;
    const totalInstalls = reportData.reduce((acc, s: any) => acc + (Number(s.installCount) || 0), 0);
    return { totalTitles, totalInstalls };
  }, [reportData, activeTab, softwareReportView]);`;

const newSoftwareMetrics = `  // --- SOFTWARE SUMMARY LOGIC ---
  const dangerousKeywords = ['torrent', 'crack', 'keygen', 'kmsauto', 'patcher', 'nmap', 'wireshark', 'metasploit', 'cheat', 'miner', 'nicehash', 'hack'];
  
  const dangerousSoftware = useMemo(() => {
    if (activeTab !== 'software') return [];
    return reportData.filter((s: any) => {
       const nameLower = (s.name || '').toLowerCase();
       return dangerousKeywords.some(kw => nameLower.includes(kw));
    }).map((s: any) => ({
       ...s,
       riskLevel: 'High Risk'
    }));
  }, [reportData, activeTab]);

  const softwareMetrics = useMemo(() => {
    if (activeTab !== 'software' || softwareReportView !== 'yearly') return { totalTitles: 0, totalInstalls: 0, dangerousCount: 0 };
    const totalTitles = reportData.length;
    const totalInstalls = reportData.reduce((acc, s: any) => acc + (Number(s.installCount) || 0), 0);
    return { totalTitles, totalInstalls, dangerousCount: dangerousSoftware.length };
  }, [reportData, activeTab, softwareReportView, dangerousSoftware]);`;
content = content.replace(oldSoftwareMetrics, newSoftwareMetrics);


// 2. Update Summary Cards
const oldSoftwareCards = `<div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Total Installations</div>
                 <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                   <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--accent-success)', letterSpacing: '-2px' }}>
                     {softwareMetrics.totalInstalls}
                   </span>
                 </div>
              </div>`;
const newSoftwareCards = `<div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Total Installations</div>
                 <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                   <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--accent-success)', letterSpacing: '-2px' }}>
                     {softwareMetrics.totalInstalls}
                   </span>
                 </div>
              </div>
              <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(239, 68, 68, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', borderRadius: '50%', background: softwareMetrics.dangerousCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(107, 114, 128, 0.05)', animation: softwareMetrics.dangerousCount > 0 ? 'pulse 2s infinite' : 'none' }} />
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Threats Detected</div>
                 <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                   <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: softwareMetrics.dangerousCount > 0 ? '#ef4444' : 'var(--text-primary)', letterSpacing: '-2px' }}>
                     {softwareMetrics.dangerousCount}
                   </span>
                 </div>
              </div>`;
content = content.replace(oldSoftwareCards, newSoftwareCards);

// 3. Add Threats Table
const threatsTable = `
            {dangerousSoftware.length > 0 && (
              <div style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(239, 68, 68, 0.02) 100%)', borderRadius: '16px', padding: '1.5rem', border: '1px solid rgba(239, 68, 68, 0.2)', boxShadow: '0 4px 20px rgba(239,68,68,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    High Risk Software Detected
                  </h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '1rem' }}>Software Name</th>
                        <th style={{ padding: '1rem' }}>Publisher</th>
                        <th style={{ padding: '1rem' }}>Installations</th>
                        <th style={{ padding: '1rem' }}>Risk Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dangerousSoftware.map((item: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.1)', background: 'rgba(239, 68, 68, 0.02)' }}>
                          <td style={{ padding: '1rem', fontWeight: 600, color: '#ef4444' }}>{item.name}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.publisher || '-'}</td>
                          <td style={{ padding: '1rem', fontWeight: 700 }}>{item.installCount || 0}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}>
                              {item.riskLevel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
`;
const insertionPoint = `            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Top 15 Most Installed Software</h3>`;

content = content.replace(insertionPoint, threatsTable + "\n" + insertionPoint);

fs.writeFileSync(pagePath, content);
console.log("Injected dangerous software UI into page.tsx");
