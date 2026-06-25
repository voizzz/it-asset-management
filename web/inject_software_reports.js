const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src/app/reports/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Add states
const stateMarker = `  const [ticketReportView, setTicketReportView] = useState<'realtime' | 'yearly'>('realtime');
  const [consumableReportView, setConsumableReportView] = useState<'realtime' | 'yearly'>('realtime');`;
const newStates = `
  const [softwareReportView, setSoftwareReportView] = useState<'realtime' | 'yearly'>('realtime');
  const [licenseReportView, setLicenseReportView] = useState<'realtime' | 'yearly'>('realtime');`;

if (!content.includes('softwareReportView')) {
  content = content.replace(stateMarker, stateMarker + newStates);
}

// 2. Add memos for Software
const memoMarker = `  const consumableMetrics = useMemo(() => {`;
const softwareMemos = `
  // --- SOFTWARE SUMMARY LOGIC ---
  const softwareMetrics = useMemo(() => {
    if (activeTab !== 'software' || softwareReportView !== 'yearly') return { totalTitles: 0, totalInstalls: 0 };
    const totalTitles = reportData.length;
    const totalInstalls = reportData.reduce((acc, s: any) => acc + (Number(s.installCount) || 0), 0);
    return { totalTitles, totalInstalls };
  }, [reportData, activeTab, softwareReportView]);

  const softwareChartData = useMemo(() => {
    if (activeTab !== 'software' || softwareReportView !== 'yearly') return [];
    return [...reportData]
      .sort((a: any, b: any) => (Number(b.installCount) || 0) - (Number(a.installCount) || 0))
      .slice(0, 15)
      .map((s: any) => ({
        name: s.name,
        Installations: Number(s.installCount) || 0
      }));
  }, [reportData, activeTab, softwareReportView]);

  // --- LICENSE SUMMARY LOGIC ---
  const licenseMetrics = useMemo(() => {
    if (activeTab !== 'licenses' || licenseReportView !== 'yearly') return { totalLicenses: 0, totalSeats: 0, usedSeats: 0 };
    const totalLicenses = reportData.length;
    const totalSeats = reportData.reduce((acc, l: any) => acc + (Number(l.totalSeats) || 0), 0);
    const usedSeats = reportData.reduce((acc, l: any) => acc + (Number(l.usedSeats) || 0), 0);
    return { totalLicenses, totalSeats, usedSeats };
  }, [reportData, activeTab, licenseReportView]);

  const licenseChartData = useMemo(() => {
    if (activeTab !== 'licenses' || licenseReportView !== 'yearly') return [];
    return reportData.map((l: any) => ({
      name: l.softwareName,
      'Total Seats': Number(l.totalSeats) || 0,
      'Used Seats': Number(l.usedSeats) || 0
    }));
  }, [reportData, activeTab, licenseReportView]);
`;

if (!content.includes('softwareMetrics')) {
  content = content.replace(memoMarker, softwareMemos + "\n" + memoMarker);
}

// 3. Update Excel logic
// reportTitle
content = content.replace(
  `: activeTab === 'consumables' ? (consumableReportView === 'realtime' ? 'Reguler Report' : 'Summary Report')`,
  `: activeTab === 'consumables' ? (consumableReportView === 'realtime' ? 'Reguler Report' : 'Summary Report')
      : activeTab === 'software' ? (softwareReportView === 'realtime' ? 'Reguler Report' : 'Summary Report')
      : activeTab === 'licenses' ? (licenseReportView === 'realtime' ? 'Reguler Report' : 'Summary Report')`
);
// sheetName
content = content.replace(
  `: activeTab === 'consumables' ? (consumableReportView === 'realtime' ? 'Reguler' : 'Summary')`,
  `: activeTab === 'consumables' ? (consumableReportView === 'realtime' ? 'Reguler' : 'Summary')
      : activeTab === 'software' ? (softwareReportView === 'realtime' ? 'Reguler' : 'Summary')
      : activeTab === 'licenses' ? (licenseReportView === 'realtime' ? 'Reguler' : 'Summary')`
);

// Metrics mapping
const metricExportMarker = `    } else if (activeTab === 'consumables') {`;
const newMetricExports = `    } else if (activeTab === 'software') {
      if (softwareReportView === 'yearly') {
        worksheet.getCell('C4').value = 'Total Titles:';
        worksheet.getCell('C4').font = { bold: true };
        worksheet.getCell('D4').value = softwareMetrics.totalTitles;
        worksheet.getCell('E4').value = 'Total Installations:';
        worksheet.getCell('E4').font = { bold: true };
        worksheet.getCell('F4').value = softwareMetrics.totalInstalls;
      }
    } else if (activeTab === 'licenses') {
      if (licenseReportView === 'yearly') {
        worksheet.getCell('C4').value = 'Total Seats:';
        worksheet.getCell('C4').font = { bold: true };
        worksheet.getCell('D4').value = licenseMetrics.totalSeats;
        worksheet.getCell('E4').value = 'Used Seats:';
        worksheet.getCell('E4').font = { bold: true };
        worksheet.getCell('F4').value = licenseMetrics.usedSeats;
      }
`;
if (!content.includes('activeTab === \'software\'') || !content.match(/else if \(activeTab === 'software'\) {/)) {
    content = content.replace(metricExportMarker, newMetricExports + metricExportMarker);
}

// Data rows mapping
const rowExportMarker = `    } else if (activeTab === 'consumables') {`;
const newRowExports = `    } else if (activeTab === 'software') {
      if (softwareReportView === 'yearly') {
        headers = ['Software Name', 'Installations'];
        softwareChartData.forEach(item => {
           rows.push([item.name, item.Installations]);
        });
      } else {
        headers = ['Software Name', 'Version', 'Publisher', 'Installations'];
        rows = sortedData.map(s => [s.name, s.version, s.publisher, s.installCount]);
      }
    } else if (activeTab === 'licenses') {
      if (licenseReportView === 'yearly') {
        headers = ['Software Name', 'Total Seats', 'Used Seats', 'Available'];
        licenseChartData.forEach(item => {
           rows.push([item.name, item['Total Seats'], item['Used Seats'], item['Total Seats'] - item['Used Seats']]);
        });
      } else {
        headers = ['Software Name', 'License Key', 'Expiry Date', 'Total Seats', 'Used Seats', 'Available'];
        rows = sortedData.map(l => [l.softwareName, l.licenseKey || '-', l.expiryDate || '-', l.totalSeats, l.usedSeats, l.totalSeats - l.usedSeats]);
      }
`;
// find the SECOND occurrence of rowExportMarker
let index1 = content.indexOf(rowExportMarker);
let index2 = content.indexOf(rowExportMarker, index1 + 1);
if (index2 !== -1 && (!content.includes('headers = [\'Software Name\', \'Installations\'];'))) {
  content = content.slice(0, index2) + newRowExports + content.slice(index2);
}

// 4. Update UI Sub-Tabs
const subTabsMarker = `          {activeTab === 'consumables' && (
            <>
              <button 
                onClick={() => setConsumableReportView('realtime')}
                className={\`sub-tab-btn \${consumableReportView === 'realtime' ? 'active' : ''}\`}
              >
                Reguler Report
              </button>
              <button 
                onClick={() => setConsumableReportView('yearly')}
                className={\`sub-tab-btn \${consumableReportView === 'yearly' ? 'active' : ''}\`}
              >
                Summary Report
              </button>
            </>
          )}`;
const newSubTabs = `
          {activeTab === 'software' && (
            <>
              <button 
                onClick={() => setSoftwareReportView('realtime')}
                className={\`sub-tab-btn \${softwareReportView === 'realtime' ? 'active' : ''}\`}
              >
                Reguler Report
              </button>
              <button 
                onClick={() => setSoftwareReportView('yearly')}
                className={\`sub-tab-btn \${softwareReportView === 'yearly' ? 'active' : ''}\`}
              >
                Summary Report
              </button>
            </>
          )}

          {activeTab === 'licenses' && (
            <>
              <button 
                onClick={() => setLicenseReportView('realtime')}
                className={\`sub-tab-btn \${licenseReportView === 'realtime' ? 'active' : ''}\`}
              >
                Reguler Report
              </button>
              <button 
                onClick={() => setLicenseReportView('yearly')}
                className={\`sub-tab-btn \${licenseReportView === 'yearly' ? 'active' : ''}\`}
              >
                Summary Report
              </button>
            </>
          )}
`;
if (!content.includes('setSoftwareReportView(\'realtime\')')) {
  content = content.replace(subTabsMarker, subTabsMarker + newSubTabs);
}

// Update Filter Visibility
content = content.replace(
  `(activeTab === 'consumables' && consumableReportView === 'realtime')) && (`,
  `(activeTab === 'consumables' && consumableReportView === 'realtime') ||
          (activeTab === 'software' && softwareReportView === 'realtime') ||
          (activeTab === 'licenses' && licenseReportView === 'realtime')) && (`
);

// 5. Inject Summary Layouts
const summaryMarker = `        {/* Data Table */}`;
const newSummaries = `
        {/* SOFTWARE SUMMARY */}
        {activeTab === 'software' && softwareReportView === 'yearly' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
              <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(59, 130, 246, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Total Software Titles</div>
                 <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                   <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-2px' }}>
                     {softwareMetrics.totalTitles}
                   </span>
                 </div>
              </div>
              <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Total Installations</div>
                 <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                   <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--accent-success)', letterSpacing: '-2px' }}>
                     {softwareMetrics.totalInstalls}
                   </span>
                 </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Top 15 Most Installed Software</h3>
              </div>
              <div style={{ height: '400px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={softwareChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '1rem' }} />
                    <Bar dataKey="Installations" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* LICENSES SUMMARY */}
        {activeTab === 'licenses' && licenseReportView === 'yearly' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
              <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(59, 130, 246, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Total Licenses</div>
                 <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                   <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-2px' }}>
                     {licenseMetrics.totalLicenses}
                   </span>
                 </div>
              </div>
              <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Total Seats Available</div>
                 <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                   <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--accent-success)', letterSpacing: '-2px' }}>
                     {licenseMetrics.totalSeats}
                   </span>
                 </div>
              </div>
              <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(245, 158, 11, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Used Seats</div>
                 <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                   <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: '#f59e0b', letterSpacing: '-2px' }}>
                     {licenseMetrics.usedSeats}
                   </span>
                 </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>License Utilization</h3>
              </div>
              <div style={{ height: '400px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={licenseChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '1rem' }} />
                    <Bar dataKey="Total Seats" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Used Seats" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
`;

if (!content.includes('SOFTWARE SUMMARY')) {
  content = content.replace(summaryMarker, newSummaries + "\n" + summaryMarker);
}

// 6. Data Table headers and rows
const tableBodyMarker = `                  {activeTab === 'consumables' && (
                    <>
                      <th onClick={() => requestSort('name')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Item Name {renderSortIndicator('name')}</th>
                      <th onClick={() => requestSort('category')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Category {renderSortIndicator('category')}</th>
                      <th onClick={() => requestSort('quantity')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Quantity {renderSortIndicator('quantity')}</th>
                      <th onClick={() => requestSort('minQuantity')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Min Alert {renderSortIndicator('minQuantity')}</th>
                      <th onClick={() => requestSort('location')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Location {renderSortIndicator('location')}</th>
                    </>
                  )}`;

const newHeaders = `
                  {activeTab === 'software' && (
                    <>
                      <th onClick={() => requestSort('name')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Software Name {renderSortIndicator('name')}</th>
                      <th onClick={() => requestSort('version')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Version {renderSortIndicator('version')}</th>
                      <th onClick={() => requestSort('publisher')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Publisher {renderSortIndicator('publisher')}</th>
                      <th onClick={() => requestSort('installCount')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Installations {renderSortIndicator('installCount')}</th>
                    </>
                  )}
                  {activeTab === 'licenses' && (
                    <>
                      <th onClick={() => requestSort('softwareName')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Software Name {renderSortIndicator('softwareName')}</th>
                      <th onClick={() => requestSort('licenseKey')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>License Key {renderSortIndicator('licenseKey')}</th>
                      <th onClick={() => requestSort('expiryDate')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Expiry Date {renderSortIndicator('expiryDate')}</th>
                      <th onClick={() => requestSort('totalSeats')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Total Seats {renderSortIndicator('totalSeats')}</th>
                      <th onClick={() => requestSort('usedSeats')} style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}>Used Seats {renderSortIndicator('usedSeats')}</th>
                      <th style={{ padding: '1rem', userSelect: 'none' }}>Available</th>
                    </>
                  )}
`;
if (!content.includes('Software Name')) {
  content = content.replace(tableBodyMarker, tableBodyMarker + newHeaders);
}

const tableDataMarker = `                      {activeTab === 'consumables' && (
                        <>
                          <td style={{ padding: '1rem' }}><div style={{ fontWeight: 600 }}>{item.name}</div></td>
                          <td style={{ padding: '1rem' }}><span style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', background: 'var(--bg-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>{item.category}</span></td>
                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: item.quantity <= item.minQuantity ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)', color: item.quantity <= item.minQuantity ? '#ef4444' : 'var(--text-primary)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 600 }}>
                              {item.quantity <= item.minQuantity && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>}
                              {item.quantity}
                            </div>
                          </td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.minQuantity}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.location || '-'}</td>
                        </>
                      )}`;

const newDataRows = `
                      {activeTab === 'software' && (
                        <>
                          <td style={{ padding: '1rem' }}><div style={{ fontWeight: 600 }}>{item.name}</div></td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.version}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.publisher}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'var(--bg-secondary)', fontWeight: 600 }}>
                              {item.installCount || 0}
                            </span>
                          </td>
                        </>
                      )}
                      {activeTab === 'licenses' && (
                        <>
                          <td style={{ padding: '1rem' }}><div style={{ fontWeight: 600 }}>{item.softwareName}</div></td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.licenseKey ? \`••••\${item.licenseKey.slice(-4)}\` : '-'}</td>
                          <td style={{ padding: '1rem' }}>
                            {item.expiryDate ? (
                              <span style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: new Date(item.expiryDate) < new Date() ? 'rgba(239,68,68,0.1)' : 'var(--bg-secondary)', color: new Date(item.expiryDate) < new Date() ? '#ef4444' : 'var(--text-primary)', fontWeight: 500 }}>
                                {item.expiryDate}
                              </span>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '1rem', fontWeight: 600 }}>{item.totalSeats}</td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ color: item.usedSeats > item.totalSeats ? '#ef4444' : 'var(--text-primary)', fontWeight: item.usedSeats > item.totalSeats ? 800 : 600 }}>
                              {item.usedSeats || 0}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>
                            <span style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: (item.totalSeats - (item.usedSeats || 0)) <= 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: (item.totalSeats - (item.usedSeats || 0)) <= 0 ? '#ef4444' : 'var(--accent-success)', fontWeight: 600 }}>
                              {item.totalSeats - (item.usedSeats || 0)}
                            </span>
                          </td>
                        </>
                      )}
`;
if (!content.includes('activeTab === \'software\'') || !content.match(/<td style={{ padding: '1rem' }}><div style={{ fontWeight: 600 }}>{item.name}<\/div><\/td>/)) {
    content = content.replace(tableDataMarker, tableDataMarker + newDataRows);
}

fs.writeFileSync(pagePath, content);
console.log("Injected software and licenses into page.tsx");
