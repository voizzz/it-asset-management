'use client';
import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import Sidebar from '@/components/Sidebar';

export default function ReportsPage() {
  const [logoName, setLogoName] = useState('ITAM');
  const [activeTab, setActiveTab] = useState('assets');
  const [reportData, setReportData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/settings/get').then(r => r.json()).then(d => { if (d.logoName) setLogoName(d.logoName); });
    
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['assets', 'tickets', 'consumables'].includes(hash)) {
        setActiveTab(hash);
      }
    };
    
    // Initial check
    if (typeof window !== 'undefined') {
      handleHashChange();
      window.addEventListener('hashchange', handleHashChange);
    }
    
    return () => {
      if (typeof window !== 'undefined') window.removeEventListener('hashchange', handleHashChange);
    }
  }, []);

  useEffect(() => {
    fetchReportData(activeTab);
  }, [activeTab]);

  const fetchReportData = async (tab: string) => {
    try {
      const res = await fetch(`/api/reports?type=${tab}`);
      const data = await res.json();
      setReportData(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) return alert('No data to export');
    
    let headers: string[] = [];
    let rows: any[][] = [];

    if (activeTab === 'assets') {
      headers = ['Hostname', 'Category', 'Status', 'IP Address', 'Assigned To'];
      rows = reportData.map(a => [a.hostname, a.category, a.status, a.ipAddress || '', a.assignedTo || 'Unassigned']);
    } else if (activeTab === 'tickets') {
      headers = ['Title', 'Asset', 'Status', 'Priority', 'Creator', 'Created At'];
      rows = reportData.map(t => [t.title, t.assetName || 'Umum', t.status, t.priority, t.creatorName || 'Unknown', new Date(t.createdAt).toLocaleString()]);
    } else if (activeTab === 'consumables') {
      headers = ['Item Name', 'Category', 'Quantity', 'Min Alert', 'Location'];
      rows = reportData.map(c => [c.name, c.category, c.quantity, c.minQuantity, c.location || '-']);
    }
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.map(item => `"${item}"`).join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `itam_${activeTab}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.dashboard}>
      <Sidebar logoName={logoName} />
      <section className={styles.main}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>Reports</h2>
            <p className={styles.subtitle}>Generate and export inventory reports.</p>
          </div>
          <button onClick={handleExportCSV} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export to CSV
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {activeTab === 'assets' && (
            <>
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Assets</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.5rem' }}>{reportData.length}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Active/In-Use</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-success)', marginTop: '0.5rem' }}>{reportData.filter(a => ['online', 'in-use'].includes(a.status)).length}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Broken/Offline</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ef4444', marginTop: '0.5rem' }}>{reportData.filter(a => ['offline', 'broken'].includes(a.status)).length}</div>
              </div>
            </>
          )}
          
          {activeTab === 'tickets' && (
            <>
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Tickets</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.5rem' }}>{reportData.length}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Open / In Progress</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#d97706', marginTop: '0.5rem' }}>{reportData.filter(t => ['Open', 'In Progress'].includes(t.status)).length}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Resolved / Closed</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-success)', marginTop: '0.5rem' }}>{reportData.filter(t => ['Resolved', 'Closed'].includes(t.status)).length}</div>
              </div>
            </>
          )}

          {activeTab === 'consumables' && (
            <>
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Items</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)', marginTop: '0.5rem' }}>{reportData.length}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Low Stock</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ef4444', marginTop: '0.5rem' }}>{reportData.filter(c => (Number(c.quantity) || 0) <= (Number(c.minQuantity) || 0)).length}</div>
              </div>
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '16px', border: 'var(--glass-border)' }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Total Quantity (Units)</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-success)', marginTop: '0.5rem' }}>{reportData.reduce((acc, c) => acc + (Number(c.quantity) || 0), 0)}</div>
              </div>
            </>
          )}
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', textTransform: 'capitalize' }}>{activeTab} Report Preview</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  {activeTab === 'assets' && (
                    <>
                      <th style={{ padding: '1rem' }}>Hostname</th>
                      <th style={{ padding: '1rem' }}>Category</th>
                      <th style={{ padding: '1rem' }}>Status</th>
                      <th style={{ padding: '1rem' }}>IP Address</th>
                      <th style={{ padding: '1rem' }}>Assigned To</th>
                    </>
                  )}
                  {activeTab === 'tickets' && (
                    <>
                      <th style={{ padding: '1rem' }}>Title</th>
                      <th style={{ padding: '1rem' }}>Asset</th>
                      <th style={{ padding: '1rem' }}>Status</th>
                      <th style={{ padding: '1rem' }}>Priority</th>
                      <th style={{ padding: '1rem' }}>Creator</th>
                    </>
                  )}
                  {activeTab === 'consumables' && (
                    <>
                      <th style={{ padding: '1rem' }}>Item Name</th>
                      <th style={{ padding: '1rem' }}>Category</th>
                      <th style={{ padding: '1rem' }}>Quantity</th>
                      <th style={{ padding: '1rem' }}>Min Alert</th>
                      <th style={{ padding: '1rem' }}>Location</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {reportData.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No data available.</td></tr>
                ) : (
                  reportData.slice(0, 10).map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      {activeTab === 'assets' && (
                        <>
                          <td style={{ padding: '1rem', fontWeight: 600 }}>{item.hostname}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.category || '-'}</td>
                          <td style={{ padding: '1rem' }}><span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--bg-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>{item.status}</span></td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{item.ipAddress || '-'}</td>
                          <td style={{ padding: '1rem', color: item.assignedTo ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: item.assignedTo ? 600 : 400 }}>{item.assignedTo || 'Unassigned'}</td>
                        </>
                      )}
                      {activeTab === 'tickets' && (
                        <>
                          <td style={{ padding: '1rem', fontWeight: 600 }}>{item.title}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.assetName || 'Umum'}</td>
                          <td style={{ padding: '1rem' }}>{item.status}</td>
                          <td style={{ padding: '1rem', color: item.priority === 'High' ? '#ef4444' : 'inherit' }}>{item.priority}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.creatorName || '-'}</td>
                        </>
                      )}
                      {activeTab === 'consumables' && (
                        <>
                          <td style={{ padding: '1rem', fontWeight: 600 }}>{item.name}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.category}</td>
                          <td style={{ padding: '1rem', fontWeight: 700 }}>{item.quantity}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.minQuantity}</td>
                          <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{item.location || '-'}</td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {reportData.length > 10 && (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Showing 10 of {reportData.length} rows. Export to CSV to see all.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
