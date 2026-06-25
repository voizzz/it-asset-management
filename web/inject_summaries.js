const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src/app/reports/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

const injectMarker = `        )}

        {/* Data Table */}`;

const ticketSummaryJSX = `
        {/* TICKET SUMMARY */}
        {activeTab === 'tickets' && ticketReportView === 'yearly' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
              <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', flex: '1 1 350px', maxWidth: '500px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', textAlign: 'center' }}>Total Tickets per Category</h3>
                <div style={{ height: '250px', width: '100%', minHeight: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ticketCategoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => \`\${name} (\${value})\`}
                        labelLine={true}
                      >
                        {ticketCategoryChartData.map((entry, index) => (
                          <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-card)', border: 'var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ flex: '2 1 400px', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                 <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(59, 130, 246, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', borderRadius: '50%', background: ticketYearlyMetrics.resolutionRate >= 75 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' }} />
                   <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Resolution Rate</div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1rem', zIndex: 1 }}>
                     <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: ticketYearlyMetrics.resolutionRate >= 75 ? 'var(--accent-success)' : ticketYearlyMetrics.resolutionRate >= 50 ? '#f59e0b' : '#ef4444', letterSpacing: '-2px' }}>
                       {ticketYearlyMetrics.resolutionRate}%
                     </span>
                   </div>
                   <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1rem', zIndex: 1 }}>
                     <div style={{ width: \`\${ticketYearlyMetrics.resolutionRate}%\`, height: '100%', background: ticketYearlyMetrics.resolutionRate >= 75 ? 'var(--accent-success)' : ticketYearlyMetrics.resolutionRate >= 50 ? '#f59e0b' : '#ef4444', borderRadius: '3px', transition: 'width 1s ease-in-out' }} />
                   </div>
                   <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, zIndex: 1 }}>
                     <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{ticketYearlyMetrics.resolvedCount}</span> dari {ticketYearlyMetrics.totalCount} tiket berhasil diselesaikan
                   </div>
                 </div>
                 
                 <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(239, 68, 68, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', borderRadius: '50%', background: ticketYearlyMetrics.openCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)' }} />
                   <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Open Tickets</div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                     <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: ticketYearlyMetrics.openCount > 0 ? '#ef4444' : 'var(--text-primary)', letterSpacing: '-2px' }}>
                       {ticketYearlyMetrics.openCount}
                     </span>
                     <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tiket Aktif</span>
                   </div>
                 </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Ticket Summary Report</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select 
                    value={ticketYearlyChartGroupBy} 
                    onChange={e => setTicketYearlyChartGroupBy(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontWeight: 600 }}
                  >
                    <option value="month">Per Bulan</option>
                    <option value="year">Per Tahun (Semua)</option>
                  </select>
                  
                  {ticketYearlyChartGroupBy === 'month' && (
                    <select 
                      value={ticketSelectedYear} 
                      onChange={e => setTicketSelectedYear(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none', fontWeight: 600 }}
                    >
                      {ticketAvailableYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  )}
                </div>
              </div>
              <div style={{ height: '400px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={ticketYearlyChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '1rem' }} />
                    <Bar dataKey="Total Tickets" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Resolved" fill="var(--accent-success)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Open" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}`;

const consumableSummaryJSX = `

        {/* CONSUMABLE SUMMARY */}
        {activeTab === 'consumables' && consumableReportView === 'yearly' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
              <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', flex: '1 1 350px', maxWidth: '500px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', textAlign: 'center' }}>Total Quantity per Category</h3>
                <div style={{ height: '250px', width: '100%', minHeight: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={consumableCategoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => \`\${name} (\${value})\`}
                        labelLine={true}
                      >
                        {consumableCategoryChartData.map((entry, index) => (
                          <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-card)', border: 'var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ flex: '2 1 400px', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                 <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(16, 185, 129, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)' }} />
                   <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Total Quantity</div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                     <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-2px' }}>
                       {consumableMetrics.totalQuantity}
                     </span>
                     <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Items</span>
                   </div>
                   <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500, zIndex: 1 }}>
                     Spread across <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{consumableMetrics.totalItems}</span> unique types
                   </div>
                 </div>
                 
                 <div style={{ flex: '1 1 200px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(245, 158, 11, 0.05) 100%)', padding: '2rem', borderRadius: '16px', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                   <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '150px', height: '150px', borderRadius: '50%', background: consumableMetrics.lowStockCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(107, 114, 128, 0.1)' }} />
                   <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', zIndex: 1 }}>Low Stock Alerts</div>
                   <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '1.5rem', zIndex: 1 }}>
                     <span style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1, color: consumableMetrics.lowStockCount > 0 ? '#f59e0b' : 'var(--text-primary)', letterSpacing: '-2px' }}>
                       {consumableMetrics.lowStockCount}
                     </span>
                     <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Types</span>
                   </div>
                 </div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Consumable Inventory Deficit (Top 15)</h3>
              </div>
              <div style={{ height: '400px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={consumableInventoryChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                    <YAxis stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '1rem' }} />
                    <Bar dataKey="Quantity" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Min Quantity" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
`;

content = content.replace(injectMarker, ticketSummaryJSX + consumableSummaryJSX + "\n" + injectMarker);
fs.writeFileSync(pagePath, content);
console.log("Injected JSX layouts!");
