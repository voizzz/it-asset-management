const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src/app/reports/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Update licenseMetrics
const oldMetrics = `  const licenseMetrics = useMemo(() => {
    if (activeTab !== 'licenses' || licenseReportView !== 'yearly') return { totalLicenses: 0, totalSeats: 0, usedSeats: 0 };
    const totalLicenses = reportData.length;
    const totalSeats = reportData.reduce((acc, l: any) => acc + (Number(l.totalSeats) || 0), 0);
    const usedSeats = reportData.reduce((acc, l: any) => acc + (Number(l.usedSeats) || 0), 0);
    return { totalLicenses, totalSeats, usedSeats };
  }, [reportData, activeTab, licenseReportView]);`;

const newMetrics = `  const licenseMetrics = useMemo(() => {
    if (activeTab !== 'licenses' || licenseReportView !== 'yearly') return { totalLicenses: 0, totalSeats: 0, usedSeats: 0, expiredCount: 0 };
    const totalLicenses = reportData.length;
    const totalSeats = reportData.reduce((acc, l: any) => acc + (Number(l.totalSeats) || 0), 0);
    const usedSeats = reportData.reduce((acc, l: any) => acc + (Number(l.usedSeats) || 0), 0);
    const expiredCount = reportData.filter((l: any) => l.expiryDate && new Date(l.expiryDate) < new Date()).length;
    return { totalLicenses, totalSeats, usedSeats, expiredCount };
  }, [reportData, activeTab, licenseReportView]);`;

content = content.replace(oldMetrics, newMetrics);

// 2. Update Excel Export
const oldExcel = `    } else if (activeTab === 'licenses') {
      if (licenseReportView === 'yearly') {
        headers = ['Software Name', 'Total Seats', 'Used Seats', 'Available'];
        licenseChartData.forEach(item => {
           rows.push([item.name, item['Total Seats'], item['Used Seats'], item['Total Seats'] - item['Used Seats']]);
        });
      } else {
        headers = ['Software Name', 'License Key', 'Expiry Date', 'Total Seats', 'Used Seats', 'Available'];
        rows = sortedData.map(l => [l.softwareName, l.licenseKey || '-', l.expiryDate || '-', l.totalSeats, l.usedSeats, l.totalSeats - l.usedSeats]);
      }
    }`;

const newExcel = `    } else if (activeTab === 'licenses') {
      if (licenseReportView === 'yearly') {
        headers = ['Software Name', 'Total Seats', 'Used Seats', 'Available'];
        licenseChartData.forEach(item => {
           rows.push([item.name, item['Total Seats'], item['Used Seats'], item['Total Seats'] - item['Used Seats']]);
        });
      } else {
        headers = ['Software Name', 'License Key', 'Expiry Date', 'Status', 'Total Seats', 'Used Seats', 'Available'];
        rows = sortedData.map(l => [
          l.softwareName, 
          l.licenseKey || '-', 
          l.expiryDate || '-', 
          (l.expiryDate && new Date(l.expiryDate) < new Date()) ? 'Expired' : 'Active',
          l.totalSeats, 
          l.usedSeats, 
          l.totalSeats - l.usedSeats
        ]);
      }
    }`;
content = content.replace(oldExcel, newExcel);

// 3. Update Summary UI
const oldSummaryCard = `<div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(59, 130, 246, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Total Licenses</div>
                 <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                   <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-2px' }}>
                     {licenseMetrics.totalLicenses}
                   </span>
                 </div>
              </div>`;
const newSummaryCard = `<div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(59, 130, 246, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Total Licenses</div>
                 <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                   <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-2px' }}>
                     {licenseMetrics.totalLicenses}
                   </span>
                 </div>
              </div>
              <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(239, 68, 68, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Expired Licenses</div>
                 <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                   <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: licenseMetrics.expiredCount > 0 ? '#ef4444' : 'var(--text-primary)', letterSpacing: '-2px' }}>
                     {licenseMetrics.expiredCount}
                   </span>
                 </div>
              </div>`;
content = content.replace(oldSummaryCard, newSummaryCard);

// 4. Update Table Header
const oldHeaders = `<th onClick={() => requestSort('expiryDate')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Expiry Date {renderSortIndicator('expiryDate')}</th>
                      <th onClick={() => requestSort('totalSeats')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Total Seats {renderSortIndicator('totalSeats')}</th>`;
const newHeaders = `<th onClick={() => requestSort('expiryDate')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Expiry Date {renderSortIndicator('expiryDate')}</th>
                      <th style={{ padding: '1rem', userSelect: 'none' }}>Status</th>
                      <th onClick={() => requestSort('totalSeats')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Total Seats {renderSortIndicator('totalSeats')}</th>`;
content = content.replace(oldHeaders, newHeaders);

// 5. Update Table Rows
const oldRows = `<td style={{ padding: '1rem' }}>
                            {item.expiryDate ? (
                              <span style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: new Date(item.expiryDate) < new Date() ? 'rgba(239,68,68,0.1)' : 'var(--bg-secondary)', color: new Date(item.expiryDate) < new Date() ? '#ef4444' : 'var(--text-primary)', fontWeight: 500 }}>
                                {item.expiryDate}
                              </span>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 600 }}>{item.totalSeats}</td>`;

const newRows = `<td style={{ padding: '1rem' }}>
                            {item.expiryDate ? (
                              <span style={{ fontWeight: 500 }}>
                                {item.expiryDate}
                              </span>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '1rem' }}>
                            {item.expiryDate && new Date(item.expiryDate) < new Date() ? (
                               <span style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}>Expired</span>
                            ) : (
                               <span style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-success)', fontWeight: 600, fontSize: '0.85rem' }}>Active</span>
                            )}
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 600 }}>{item.totalSeats}</td>`;
content = content.replace(oldRows, newRows);

fs.writeFileSync(pagePath, content);
console.log("Injected expired logic into page.tsx");
