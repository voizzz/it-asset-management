'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import styles from '../page.module.css';
import { QRCodeSVG } from 'qrcode.react';
import LogoutButton from '@/components/LogoutButton';
import LogoIcon from '@/components/LogoIcon';
import Sidebar from '@/components/Sidebar';

const CATEGORIES = ['All', 'Laptop', 'PC', 'Monitor', 'Network Device', 'IP Phone', 'Server', 'Other'];

function getWarrantyStatus(agent: any): 'expired' | 'expiring' | null {
  if (!agent.purchaseDate || !agent.warrantyMonths) return null;
  const purchase = new Date(agent.purchaseDate);
  if (isNaN(purchase.getTime())) return null;
  const expiry = new Date(purchase);
  expiry.setMonth(expiry.getMonth() + agent.warrantyMonths);
  const diff = expiry.getTime() - new Date().getTime();
  if (diff < 0) return 'expired';
  if (diff <= 30 * 24 * 60 * 60 * 1000) return 'expiring';
  return null;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; dot: string }> = {
  online:   { bg: '#d1fae5', color: '#059669', dot: '#059669' },
  offline:  { bg: '#fef2f2', color: '#dc2626', dot: '#dc2626' },
  broken:   { bg: '#fef2f2', color: '#dc2626', dot: '#dc2626' },
  repair:   { bg: '#fef3c7', color: '#d97706', dot: '#d97706' },
  spare:    { bg: '#ede9fe', color: '#7c3aed', dot: '#7c3aed' },
  'in-use': { bg: '#dbeafe', color: '#2563eb', dot: '#2563eb' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES['offline'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.25rem 0.75rem', borderRadius: '9999px',
      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em',
      background: s.bg, color: s.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, display: 'inline-block', flexShrink: 0 }} />
      {status.toUpperCase()}
    </span>
  );
}

export default function AssetsPage() {
  const [logoName, setLogoName] = useState('ITAM');
  const [activeTab, setActiveTab] = useState('All');
  const [agents, setAgents] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const [showScanner, setShowScanner] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // New Asset Form State
  const [newAsset, setNewAsset] = useState({
    hostname: '',
    category: 'Monitor',
    ipAddress: '',
    macAddress: '',
    brand: '',
    model: '',
    serialNumber: '',
    location: '',
    notes: '',
    status: 'spare',
    os: 'N/A',
    currentUser: '',
    realUser: '',
    employeeId: '',
    extension: '',
    purchaseDate: '',
    warrantyMonths: ''
  });

  useEffect(() => {
    // Fetch settings
    fetch('/api/settings/get').then(r => r.json()).then(d => { if (d.logoName) setLogoName(d.logoName); });
    
    // Check url params for quick actions from dashboard
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const searchParam = params.get('search');
      
      if (action === 'add') setShowAddModal(true);
      if (action === 'scan') setShowScanner(true);
      if (searchParam) setSearchQuery(searchParam);
      
      // Clean up URL so refresh doesn't trigger it again
      if (action) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }

    // Fetch assets and employees
    fetchAssets();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      setEmployees(data.employees || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets/list?t=' + Date.now());
      if (!res.ok) throw new Error('API returned ' + res.status);
      const data = await res.json();
      setAgents(data.assets || []);
    } catch (e: any) {
      setErrorMsg('Fetch Error: ' + e.message);
      console.error(e);
    }
  };

  useEffect(() => {
    // We handle scanner init via the Script onLoad callback instead of dynamic import
    return () => {
      // Cleanup happens on modal close
    };
  }, []);

  const initScanner = () => {
    try {
      const Html5QrcodeScanner = (window as any).Html5QrcodeScanner;
      if (!Html5QrcodeScanner) return;
      
      const scannerInstance = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      
      scannerInstance.render(
        (text: string) => {
          setSearchQuery(text);
          scannerInstance.clear();
          setShowScanner(false);
        },
        (err: any) => {
          // ignore scanning errors
        }
      );

      // Save instance to window for cleanup
      (window as any).__scannerInstance = scannerInstance;
    } catch (err: any) {
      alert("Scanner failed to initialize. Make sure you are using HTTPS or Localhost.");
    }
  };

  const closeScanner = () => {
    setShowScanner(false);
    try {
      if ((window as any).__scannerInstance) {
        (window as any).__scannerInstance.clear();
      }
    } catch (e) {}
  };

  const handleAddAsset = async (e: any) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset)
      });
      if (!response.ok) throw new Error('API Error');
      setShowAddModal(false);
      setNewAsset({
        hostname: '', category: 'Monitor', ipAddress: '', macAddress: '', brand: '',
        model: '', serialNumber: '', location: '', notes: '', status: 'spare', os: 'N/A',
        currentUser: '', realUser: '', employeeId: '', extension: '', purchaseDate: '', warrantyMonths: ''
      });
      fetchAssets();
    } catch (error) {
      alert('Failed to add asset');
    }
  };

  const handleImportExcel = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/assets/import', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Berhasil import ${data.imported} data. Gagal: ${data.errors}`);
        fetchAssets();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert('Gagal menghubungi server untuk import.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredAgents = agents.filter(a => {
    const matchesTab = activeTab === 'All' ? true : (a.category || 'PC').toUpperCase() === activeTab.toUpperCase();
    if (!matchesTab) return false;
    
    if (!searchQuery) return true;
    
    const q = searchQuery.toLowerCase();
    return (
      (a.id && a.id.toLowerCase().includes(q)) ||
      (a.hostname && a.hostname.toLowerCase().includes(q)) ||
      (a.serialNumber && a.serialNumber.toLowerCase().includes(q)) ||
      (a.ipAddress && a.ipAddress.toLowerCase().includes(q)) ||
      (a.macAddress && a.macAddress.toLowerCase().includes(q)) ||
      (a.brand && a.brand.toLowerCase().includes(q)) ||
      (a.model && a.model.toLowerCase().includes(q)) ||
      (a.realUser && a.realUser.toLowerCase().includes(q)) ||
      (a.currentUser && a.currentUser.toLowerCase().includes(q))
    );
  });

  try {
    return (
      <div className={styles.dashboard}>
      <Sidebar logoName={logoName} />

      <section className={styles.main}>
        {errorMsg && (
          <div style={{ background: '#ef4444', color: 'white', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <strong>Debug Error:</strong> {errorMsg}
          </div>
        )}
        
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>Asset Inventory</h2>
          <p className={styles.subtitle}>Manage and track all company IT assets.</p>
        </div>

        {/* Main Card Container */}
        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`${styles.tabBtn} ${activeTab === cat ? styles.active : ''}`}
                onClick={() => {setActiveTab(cat); setCurrentPage(1);}}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  border: activeTab === cat ? 'none' : '1px solid var(--border-color)',
                  background: activeTab === cat ? 'var(--accent-primary)' : 'transparent',
                  color: activeTab === cat ? '#fff' : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Toolbar: Search & Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', outline: 'none' }}
                  placeholder="Search hostname, serial number, IP..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button onClick={() => setShowScanner(true)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="2" ry="2"/></svg>
                Scan Barcode
              </button>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <input type="file" accept=".xlsx" ref={fileInputRef} onChange={handleImportExcel} style={{ display: 'none' }} />
              
              {/* Group 1: Data Entry / Input */}
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <button 
                  onClick={() => window.open('/api/assets/template', '_blank')} 
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem' }}
                  title="Download Excel Template"
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Template
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isImporting}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, cursor: isImporting ? 'wait' : 'pointer', fontSize: '0.85rem' }}
                  onMouseOver={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
                  onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {isImporting ? <span>Wait...</span> : (
                    <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Import</>
                  )}
                </button>
                <button onClick={() => setShowAddModal(true)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'var(--accent-primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(37,99,235,0.2)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Manual
                </button>
              </div>

              {/* Group 2: Export & Print */}
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <button onClick={() => window.print()} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem' }} onMouseOver={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                  Print Label
                </button>
                <button onClick={() => window.open('/api/report', '_blank')} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 2px 4px rgba(15,23,42,0.2)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  Export Report
                </button>
              </div>

              {/* Group 3: Agent Download */}
              <a href="/api/agent/download" style={{ padding: '0.5rem 1rem', borderRadius: '10px', border: '1px dashed var(--accent-primary)', background: 'rgba(37,99,235,0.05)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, textDecoration: 'none', cursor: 'pointer', fontSize: '0.85rem' }} onMouseOver={e => (e.currentTarget.style.background = 'rgba(37,99,235,0.1)')} onMouseOut={e => (e.currentTarget.style.background = 'rgba(37,99,235,0.05)')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Agent (.bat)
              </a>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {['HOSTNAME', 'CATEGORY', 'SERIAL NUMBER', 'USER', 'TYPE', 'STATUS', 'ACTION'].map(col => (
                    <th key={col} style={{ padding: '1rem', fontWeight: 700 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {col}
                        {col !== 'ACTION' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 15l5 5 5-5"/><path d="M7 9l5-5 5 5"/></svg>}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAgents.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No assets found.</td></tr>
                ) : (
                  filteredAgents.map(agent => (
                    <tr key={agent.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s', cursor: 'pointer' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'} onClick={() => router.push(`/asset/${agent.id}`)}>
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{agent.hostname}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.03em' }}>{agent.category || 'PC'}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.03em' }} title={agent.serialNumber || 'No serial'}>{agent.serialNumber || '-'}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.03em' }}>{agent.realUser || '-'}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.03em' }}>{agent.isManual ? 'Manual' : 'Agent'}</td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <StatusBadge status={agent.status || 'in-use'} />
                          {(() => {
                            const ws = getWarrantyStatus(agent);
                            if (!ws) return null;
                            return (
                              <span style={{
                                fontSize: '0.7rem', padding: '0.25rem 0.55rem', borderRadius: '20px', fontWeight: 700,
                                letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                background: ws === 'expired' ? 'rgba(220,38,38,0.12)' : 'rgba(245,158,11,0.12)',
                                color: ws === 'expired' ? '#dc2626' : '#b45309',
                                border: `1px solid ${ws === 'expired' ? 'rgba(220,38,38,0.3)' : 'rgba(245,158,11,0.3)'}`,
                              }}>
                                ⚠ {ws === 'expired' ? 'WARRANTY EXPIRED' : 'WARRANTY WARN'}
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button 
                          onClick={(e) => { e.stopPropagation(); router.push(`/asset/${agent.id}`); }}
                          style={{ padding: '0.4rem 1rem', borderRadius: '6px', border: '1px solid var(--accent-primary)', background: 'transparent', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                          onMouseOver={e => { e.currentTarget.style.background = 'var(--accent-primary)'; e.currentTarget.style.color = 'white'; }}
                          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {agents.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1rem 0.5rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {(() => {
                     const filtered = agents.filter(a => (activeTab === 'All' || a.category === activeTab) && (a.hostname.toLowerCase().includes(searchQuery.toLowerCase()) || (a.brand && a.brand.toLowerCase().includes(searchQuery.toLowerCase()))));
                     return `Showing ${Math.min(((currentPage - 1) * ITEMS_PER_PAGE) + 1, filtered.length)} to ${Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of ${filtered.length} entries`;
                  })()}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: currentPage === 1 ? 'transparent' : 'var(--bg-secondary)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                  >
                    Previous
                  </button>
                  {(() => {
                     const filtered = agents.filter(a => (activeTab === 'All' || a.category === activeTab) && (a.hostname.toLowerCase().includes(searchQuery.toLowerCase()) || (a.brand && a.brand.toLowerCase().includes(searchQuery.toLowerCase()))));
                     const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
                     return <span style={{ padding: '0.5rem', fontWeight: 600 }}>{currentPage} / {totalPages}</span>;
                  })()}
                  <button 
                    onClick={() => {
                      const filtered = agents.filter(a => (activeTab === 'All' || a.category === activeTab) && (a.hostname.toLowerCase().includes(searchQuery.toLowerCase()) || (a.brand && a.brand.toLowerCase().includes(searchQuery.toLowerCase()))));
                      const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
                      setCurrentPage(p => Math.min(totalPages, p + 1));
                    }} 
                    disabled={(() => {
                      const filtered = agents.filter(a => (activeTab === 'All' || a.category === activeTab) && (a.hostname.toLowerCase().includes(searchQuery.toLowerCase()) || (a.brand && a.brand.toLowerCase().includes(searchQuery.toLowerCase()))));
                      return currentPage >= Math.ceil(filtered.length / ITEMS_PER_PAGE);
                    })()}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: (() => {
                      const filtered = agents.filter(a => (activeTab === 'All' || a.category === activeTab) && (a.hostname.toLowerCase().includes(searchQuery.toLowerCase()) || (a.brand && a.brand.toLowerCase().includes(searchQuery.toLowerCase()))));
                      return currentPage >= Math.ceil(filtered.length / ITEMS_PER_PAGE) ? 'transparent' : 'var(--bg-secondary)';
                    })(), color: (() => {
                      const filtered = agents.filter(a => (activeTab === 'All' || a.category === activeTab) && (a.hostname.toLowerCase().includes(searchQuery.toLowerCase()) || (a.brand && a.brand.toLowerCase().includes(searchQuery.toLowerCase()))));
                      return currentPage >= Math.ceil(filtered.length / ITEMS_PER_PAGE) ? 'var(--text-muted)' : 'var(--text-primary)';
                    })(), cursor: (() => {
                      const filtered = agents.filter(a => (activeTab === 'All' || a.category === activeTab) && (a.hostname.toLowerCase().includes(searchQuery.toLowerCase()) || (a.brand && a.brand.toLowerCase().includes(searchQuery.toLowerCase()))));
                      return currentPage >= Math.ceil(filtered.length / ITEMS_PER_PAGE) ? 'not-allowed' : 'pointer';
                    })(), fontWeight: 600 }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Scanner Modal */}
      {showScanner && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <Script 
            src="https://unpkg.com/html5-qrcode" 
            onLoad={initScanner}
          />
          <div className={styles.tableSection} style={{ width: '500px', maxWidth: '95vw', background: 'var(--bg-secondary)', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Scan Barcode / QR Code</h2>
              <button onClick={closeScanner} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div id="reader" style={{ width: '100%', minHeight: '300px', background: '#000', borderRadius: '12px', overflow: 'hidden' }}></div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: '1rem' }}>
              Position the barcode inside the camera frame to scan. Make sure you access this via HTTPS or localhost.
            </p>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div style={{ width: '850px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)' }}></div>
              Add Manual Asset
            </h2>
            
            <form onSubmit={handleAddAsset} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              
              {/* Section 1: Basic Information */}
              <div>
                <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--accent-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '0.4rem 1rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  Basic Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Asset Name / Hostname</label>
                    <input type="text" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={newAsset.hostname} onChange={e => setNewAsset({...newAsset, hostname: e.target.value})} placeholder="e.g. DESKTOP-PC-A1 (Optional)" />
                  </div>
                  {newAsset.category !== 'Network Device' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>User (Real Name)</label>
                      <select style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', appearance: 'auto', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={newAsset.employeeId} onChange={e => {
                        const emp = employees.find(x => x.id === e.target.value);
                        setNewAsset({...newAsset, employeeId: e.target.value, realUser: emp ? emp.name : ''});
                      }}>
                        <option value="">Select Employee...</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {newAsset.category !== 'Network Device' && newAsset.category !== 'IP Phone' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>User-PC (OS User)</label>
                      <input type="text" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={newAsset.currentUser} onChange={e => setNewAsset({...newAsset, currentUser: e.target.value})} placeholder="e.g. IT-01" />
                    </div>
                  )}
                  {newAsset.category === 'IP Phone' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Extension</label>
                      <input type="text" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={newAsset.extension} onChange={e => setNewAsset({...newAsset, extension: e.target.value})} placeholder="e.g. 101" />
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Classification & Status */}
              <div>
                <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--accent-success)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem 1rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  Classification & Status
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Category</label>
                    <select style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', appearance: 'auto', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = 'var(--accent-success)'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={newAsset.category} onChange={e => setNewAsset({...newAsset, category: e.target.value})}>
                      {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Serial Number</label>
                    <input type="text" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = 'var(--accent-success)'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={newAsset.serialNumber} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})} placeholder="Format ABC123XYZ" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Status</label>
                    <select style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', appearance: 'auto', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = 'var(--accent-success)'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={newAsset.status} onChange={e => setNewAsset({...newAsset, status: e.target.value})}>
                      <option value="in-use" style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)'}}>In Use</option>
                      <option value="broken" style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)'}}>Broken</option>
                      <option value="repair" style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)'}}>Under Repair</option>
                      <option value="spare" style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)'}}>Spare</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Device Specifications */}
              <div>
                <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.25rem', color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)', padding: '0.4rem 1rem', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
                  Device Specifications
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Brand</label>
                    <input type="text" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = '#8b5cf6'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={newAsset.brand} onChange={e => setNewAsset({...newAsset, brand: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Model</label>
                    <input type="text" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = '#8b5cf6'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={newAsset.model} onChange={e => setNewAsset({...newAsset, model: e.target.value})} />
                  </div>
                  {!['Monitor', 'Other'].includes(newAsset.category) && (
                    <>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>IP Address</label>
                        <input type="text" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = '#8b5cf6'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={newAsset.ipAddress} onChange={e => setNewAsset({...newAsset, ipAddress: e.target.value})} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>MAC Address</label>
                        <input type="text" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = '#8b5cf6'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={newAsset.macAddress} onChange={e => setNewAsset({...newAsset, macAddress: e.target.value})} />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Section 4: Warranty & Lifecycle */}
              <div>
                <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.25rem', color: '#dc2626', background: 'rgba(220, 38, 38, 0.1)', padding: '0.4rem 1rem', borderRadius: '12px', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Warranty & Lifecycle
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Tanggal Pembelian</label>
                    <input type="date" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = '#dc2626'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={newAsset.purchaseDate} onChange={e => setNewAsset({...newAsset, purchaseDate: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Durasi Garansi (bulan)</label>
                    <input type="number" min="0" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = '#dc2626'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={newAsset.warrantyMonths} onChange={e => setNewAsset({...newAsset, warrantyMonths: e.target.value})} placeholder="e.g. 12, 24, 36" />
                  </div>
                </div>
              </div>

              {/* Section 5: Additional Details */}
              <div>
                <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.25rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '0.4rem 1rem', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  Additional Details
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Location / Attached To</label>
                    <input type="text" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = '#f59e0b'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={newAsset.location} onChange={e => setNewAsset({...newAsset, location: e.target.value})} placeholder={['Monitor', 'Other'].includes(newAsset.category) ? 'e.g. PC-IT-01' : 'e.g. Room 101'} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Notes</label>
                    <textarea style={{ width: '100%', height: '100px', resize: 'vertical', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = '#f59e0b'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={newAsset.notes} onChange={e => setNewAsset({...newAsset, notes: e.target.value})} placeholder="Additional information..." />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '0.8rem 1.5rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Cancel</button>
                <button type="submit" style={{ padding: '0.8rem 1.5rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)', transition: 'transform 0.2s', letterSpacing: '0.02em' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>Save Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Labels Container (Hidden except during print) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #print-labels-container, #print-labels-container * { visibility: visible; }
          #print-labels-container {
            position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px;
            background: white !important; color: black !important;
            display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;
            align-content: start; justify-content: center;
          }
          @page { size: auto; margin: 5mm; }
          .label-card { page-break-inside: avoid; }
        }
        @media screen {
          #print-labels-container { display: none; }
        }
      `}} />
      <div id="print-labels-container">
        {filteredAgents.map(agent => (
          <div key={agent.id} className="label-card" style={{
            border: '2px solid #000', padding: '15px', borderRadius: '12px',
            display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '15px',
            fontFamily: 'sans-serif', background: '#fff'
          }}>
            <div style={{ background: '#fff', padding: '5px', border: '1px solid #ccc', borderRadius: '8px' }}>
              <QRCodeSVG value={agent.id} size={80} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>ITAM ASSET</h2>
              <p style={{ margin: 0, fontSize: '12px', color: '#333' }}><strong>ID:</strong> {agent.hostname}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#333' }}><strong>Type:</strong> {agent.category || 'PC'}</p>
              <p style={{ margin: 0, fontSize: '10px', color: '#666', marginTop: '4px' }}>Scan to manage</p>
            </div>
          </div>
        ))}
      </div>

    </div>
    );
  } catch (err: any) {
    return (
      <div style={{ padding: '2rem', background: 'red', color: 'white', minHeight: '100vh' }}>
        <h1>CRITICAL RENDER ERROR</h1>
        <pre>{err.toString()}</pre>
      </div>
    );
  }
}
