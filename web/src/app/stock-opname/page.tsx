'use client';
import { useState, useEffect, useRef } from 'react';
import styles from '../page.module.css';
import Sidebar from '@/components/Sidebar';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeSVG } from 'qrcode.react';
type Session = {
  id: string; name: string; status: string; createdBy: string; createdAt: string;
  completedAt: string | null; notes: string | null;
  totalItems: number; foundItems: number; missingItems: number; differentItems: number;
};
type Item = {
  id: string; opnameId: string; agentId: string; hostname: string; category: string;
  location: string; currentUser: string; brand: string; model: string; serialNumber: string;
  status: string; notes: string | null; checkedAt: string | null; checkedBy: string | null;
};

export default function StockOpnamePage() {
  const [logoName, setLogoName] = useState('ITAM');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [creating, setCreating] = useState(false);
  const [noteModal, setNoteModal] = useState<{ item: Item } | null>(null);
  const [noteText, setNoteText] = useState('');
  const [pendingStatus, setPendingStatus] = useState<string>('');
  const [showReport, setShowReport] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  // Scanner states
  const [showScanner, setShowScanner] = useState(false);
  const [scanMessage, setScanMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);
  const gunScannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/settings/get').then(r => r.json()).then(d => { if (d.logoName) setLogoName(d.logoName); });
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d.user) setCurrentUser(d.user); });
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setIsLoading(true);
    const res = await fetch('/api/stock-opname');
    const data = await res.json();
    setSessions(data.sessions || []);
    setIsLoading(false);
  };

  const fetchSessionDetail = async (id: string) => {
    const res = await fetch(`/api/stock-opname/${id}`);
    const data = await res.json();
    setActiveSession(data.session);
    setItems(data.items || []);
  };

  const handleOpenSession = async (session: Session) => {
    await fetchSessionDetail(session.id);
  };

  const processScannedText = async (text: string) => {
    if (!activeSession) return;
    
    // Split text by whitespace, comma, or tab to handle complex QR contents
    const tokens = text.toLowerCase().split(/[\s\t,;-]+/);
    
    const match = items.find(i => {
      const idMatch = tokens.includes(i.id.toLowerCase()) || i.id.toLowerCase() === text.toLowerCase();
      const hostMatch = i.hostname && (tokens.includes(i.hostname.toLowerCase()) || i.hostname.toLowerCase() === text.toLowerCase());
      const serialMatch = i.serialNumber && (tokens.includes(i.serialNumber.toLowerCase()) || i.serialNumber.toLowerCase() === text.toLowerCase());
      return idMatch || hostMatch || serialMatch;
    });

    if (match) {
      if (match.status !== 'Found') {
        await handleUpdateItem(match.id, 'Found');
        setScanMessage({ text: `✅ ${match.hostname} ditemukan!`, type: 'success' });
      } else {
        setScanMessage({ text: `⚠️ ${match.hostname} sudah diverifikasi sebelumnya.`, type: 'success' });
      }
    } else {
      setScanMessage({ text: `❌ Aset tidak ditemukan di sesi ini: ${text}`, type: 'error' });
    }
    
    // Auto clear message after 3s
    setTimeout(() => setScanMessage(null), 3000);
  };

  const openScanner = () => {
    setShowScanner(true);
    setTimeout(async () => {
      try {
        const scannerInstance = new Html5Qrcode("stock-reader");
        await scannerInstance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            processScannedText(decodedText);
          },
          () => {} // ignore errors
        );
        (window as any).__stockScannerInstance = scannerInstance;
      } catch (err) {
        alert("Gagal membuka kamera. Pastikan menggunakan HTTPS atau Localhost.");
        setShowScanner(false);
      }
    }, 100);
  };

  const closeScanner = () => {
    setShowScanner(false);
    try {
      if ((window as any).__stockScannerInstance) {
        (window as any).__stockScannerInstance.clear();
      }
    } catch (e) {}
  };

  // Handle physical scanner input when modal is open
  const handleGunScannerInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = e.currentTarget.value.trim();
      if (val) {
        processScannedText(val);
        e.currentTarget.value = '';
      }
    }
  };

  useEffect(() => {
    // auto-focus hidden input for gun scanner when modal opens
    if (showScanner && gunScannerInputRef.current) {
      gunScannerInputRef.current.focus();
    }
  }, [showScanner]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await fetch('/api/stock-opname', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, notes: newNotes })
    });
    const data = await res.json();
    setCreating(false);
    setShowNewModal(false);
    setNewName(''); setNewNotes('');
    if (data.id) {
      await fetchSessions();
      await fetchSessionDetail(data.id);
    }
  };

  const handleUpdateItem = async (itemId: string, status: string, notes?: string) => {
    if (!activeSession) return;
    await fetch(`/api/stock-opname/${activeSession.id}/items`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, status, notes: notes || null })
    });
    await fetchSessionDetail(activeSession.id);
    await fetchSessions();
  };

  const handleMarkWithNote = async () => {
    if (!noteModal) return;
    await handleUpdateItem(noteModal.item.id, pendingStatus, noteText);
    setNoteModal(null); setNoteText(''); setPendingStatus('');
  };

  const handleComplete = async () => {
    if (!activeSession) return;
    if (!confirm('Finalisasi sesi ini? Status sesi akan berubah menjadi Completed.')) return;
    await fetch(`/api/stock-opname/${activeSession.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete' })
    });
    await fetchSessionDetail(activeSession.id);
    await fetchSessions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus sesi ini?')) return;
    await fetch(`/api/stock-opname/${id}`, { method: 'DELETE' });
    if (activeSession?.id === id) { setActiveSession(null); setItems([]); }
    await fetchSessions();
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredItems = items.filter(item => {
    const matchFilter = filter === 'All' || item.status === filter;
    const matchSearch = !search ||
      item.hostname?.toLowerCase().includes(search.toLowerCase()) ||
      item.location?.toLowerCase().includes(search.toLowerCase()) ||
      item.currentUser?.toLowerCase().includes(search.toLowerCase()) ||
      item.category?.toLowerCase().includes(search.toLowerCase()) ||
      item.serialNumber?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const pendingCount = items.filter(i => i.status === 'Pending').length;
  const progressPct = activeSession && activeSession.totalItems > 0
    ? Math.round(((activeSession.totalItems - pendingCount) / activeSession.totalItems) * 100)
    : 0;

  const statusColor: Record<string, string> = {
    'Draft': '#6b7280',
    'In Progress': '#3b82f6',
    'Completed': '#22c55e'
  };
  const itemStatusColor: Record<string, string> = {
    'Pending': '#6b7280',
    'Found': '#22c55e',
    'Missing': '#ef4444'
  };
  const itemStatusBg: Record<string, string> = {
    'Pending': 'rgba(107,114,128,0.15)',
    'Found': 'rgba(34,197,94,0.15)',
    'Missing': 'rgba(239,68,68,0.15)'
  };

  return (
    <div className={styles.dashboard}>
      <Sidebar logoName={logoName} />

      <section className={styles.main}>
        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>
              📋 Stock Opname
            </h2>
            <p className={styles.subtitle}>Verifikasi fisik aset — cocokkan data sistem dengan kondisi lapangan.</p>
          </div>
          {currentUser?.role === 'admin' && !activeSession && (
            <button onClick={() => setShowNewModal(true)} style={{ padding: '0.75rem 1.5rem', borderRadius: '10px', background: 'var(--accent-primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Buat Sesi Baru
            </button>
          )}
          {activeSession && (
            <button onClick={() => { setActiveSession(null); setItems([]); setFilter('All'); setSearch(''); }} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
              ← Kembali ke Daftar
            </button>
          )}
        </div>

        {/* SESSION LIST VIEW */}
        {!activeSession && (
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)' }}>
            {isLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
            ) : sessions.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Belum ada sesi stock opname</div>
                <div style={{ color: 'var(--text-muted)' }}>Buat sesi baru untuk mulai verifikasi aset secara fisik.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {sessions.map(s => {
                  const pct = s.totalItems > 0 ? Math.round(((s.foundItems + s.missingItems) / s.totalItems) * 100) : 0;
                  return (
                    <div key={s.id} style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '1.5rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1.25rem', cursor: 'pointer', transition: 'box-shadow 0.2s', position: 'relative' }}
                      onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'}
                      onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
                      onClick={() => handleOpenSession(s)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: '0.25rem' }}>{s.name}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Dibuat oleh {s.createdBy} • <span suppressHydrationWarning>{new Date(s.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ padding: '0.4rem 0.8rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, background: `${statusColor[s.status]}22`, color: statusColor[s.status] }}>
                            {s.status}
                          </span>
                          {currentUser?.role === 'admin' && (
                            <button onClick={e => { e.stopPropagation(); handleDelete(s.id); }} style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '1rem', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Progress</div>
                          <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: s.status === 'Completed' ? '#22c55e' : 'var(--accent-primary)', borderRadius: '99px', transition: 'width 0.5s' }} />
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '0.4rem' }}>{pct}%</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total</div>
                          <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{s.totalItems}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ fontSize: '0.75rem', color: '#22c55e' }}>Ditemukan</div>
                          <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#22c55e' }}>{s.foundItems}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>Missing</div>
                          <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#ef4444' }}>{s.missingItems}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SESSION DETAIL VIEW */}
        {activeSession && (
          <div>
            {/* Session Header Card */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>{activeSession.name}</h3>
                    <span style={{ padding: '0.3rem 0.8rem', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 700, background: `${statusColor[activeSession.status]}22`, color: statusColor[activeSession.status] }}>
                      {activeSession.status}
                    </span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Dibuat oleh <strong>{activeSession.createdBy}</strong> •
                    <span suppressHydrationWarning> {new Date(activeSession.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  {activeSession.status === 'Completed' && (
                    <button onClick={() => window.location.href = `/api/stock-opname/${activeSession.id}/export`} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', background: 'var(--accent-success)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                      📊 Download Laporan (Excel)
                    </button>
                  )}
                  {activeSession.status === 'In Progress' && currentUser?.role === 'admin' && pendingCount === 0 && (
                    <button onClick={handleComplete} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', background: '#22c55e', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                      ✅ Finalisasi Sesi
                    </button>
                  )}
                  {activeSession.status === 'In Progress' && pendingCount > 0 && (
                    <div style={{ padding: '0.6rem 1rem', borderRadius: '8px', background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 600 }}>
                      ⏳ {pendingCount} aset belum dicek
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  <span>Progress Verifikasi</span>
                  <span>{activeSession.totalItems - pendingCount} / {activeSession.totalItems} aset ({progressPct}%)</span>
                </div>
                <div style={{ height: '10px', background: 'var(--bg-secondary)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ width: `${progressPct}%`, height: '100%', background: activeSession.status === 'Completed' ? '#22c55e' : 'var(--accent-primary)', borderRadius: '99px', transition: 'width 0.5s' }} />
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {[
                  { label: 'Total Aset', val: activeSession.totalItems, color: 'var(--text-primary)' },
                  { label: 'Ditemukan', val: activeSession.foundItems, color: '#22c55e' },
                  { label: 'Tidak Ada', val: activeSession.missingItems, color: '#ef4444' },
                  { label: 'Belum Dicek', val: pendingCount, color: '#6b7280' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '0.75rem 1.25rem', textAlign: 'center', minWidth: '90px' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filter & Search */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {['All', 'Pending', 'Found', 'Missing'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '0.4rem 1rem', borderRadius: '99px', border: filter === f ? 'none' : '1px solid var(--border-color)', background: filter === f ? 'var(--accent-primary)' : 'transparent', color: filter === f ? '#fff' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
                  {f} {f !== 'All' && <span style={{ opacity: 0.8 }}>({items.filter(i => i.status === f).length})</span>}
                </button>
              ))}
              
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {activeSession.status === 'In Progress' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => setShowQrModal(true)} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s' }}
                      onMouseOver={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
                      onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = 'var(--text-primary)'; }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><rect x="7" y="7" width="3" height="3"/><rect x="14" y="7" width="3" height="3"/><rect x="7" y="14" width="3" height="3"/><rect x="14" y="14" width="3" height="3"/></svg>
                      Buka di HP (Scan QR)
                    </button>
                  </div>
                )}
                <input
                  type="text" placeholder="Cari hostname, lokasi, user..."
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)', minWidth: '220px' }}
                />
              </div>
            </div>

            {/* Items Table */}
            <div style={{ background: 'var(--bg-card)', borderRadius: '16px', border: 'var(--glass-border)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', background: 'var(--bg-secondary)' }}>
                      <th style={{ padding: '0.9rem 1rem' }}>Hostname</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Kategori</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Lokasi</th>
                      <th style={{ padding: '0.9rem 1rem' }}>User</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Serial No.</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Remark</th>
                      <th style={{ padding: '0.9rem 1rem' }}>Dicek Oleh</th>
                      {activeSession.status === 'In Progress' && <th style={{ padding: '0.9rem 1rem' }}>Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length === 0 ? (
                      <tr><td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Tidak ada aset ditemukan.</td></tr>
                    ) : filteredItems.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)', background: item.status === 'Missing' ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>{item.hostname || '-'}</td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{item.category || '-'}</td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{item.location || '-'}</td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{item.currentUser || '-'}</td>
                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{item.serialNumber || '-'}</td>
                        <td style={{ padding: '0.85rem 1rem' }}>
                          <span style={{ padding: '0.3rem 0.7rem', borderRadius: '99px', fontSize: '0.78rem', fontWeight: 700, background: itemStatusBg[item.status], color: itemStatusColor[item.status] }}>
                            {item.status === 'Pending' ? '⏳ Pending' : item.status === 'Found' ? '✅ Ditemukan' : '❌ Tidak Ada'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {item.notes ? (
                            <div style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.notes}>
                              {item.notes}
                            </div>
                          ) : '-'}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {item.checkedBy ? (
                            <>
                              <div>{item.checkedBy}</div>
                              <div suppressHydrationWarning style={{ fontSize: '0.72rem' }}>{item.checkedAt ? new Date(item.checkedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                            </>
                          ) : '-'}
                        </td>
                        {activeSession.status === 'In Progress' && (
                          <td style={{ padding: '0.85rem 1rem' }}>
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                              {item.status === 'Pending' ? (
                                <>
                                  <button onClick={() => handleUpdateItem(item.id, 'Found')}
                                    style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', border: 'none', background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>
                                    ✅ Ada
                                  </button>
                                  <button onClick={() => { setNoteModal({ item }); setPendingStatus('Missing'); setNoteText(''); }}
                                    style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}>
                                    ❌ Tidak Ada
                                  </button>
                                </>
                              ) : (
                                <button onClick={() => handleUpdateItem(item.id, 'Pending')}
                                  style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem' }}>
                                  Reset
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* NEW SESSION MODAL */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: '480px', background: 'var(--bg-card)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.3rem', fontWeight: 700 }}>Buat Sesi Stock Opname</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Nama Sesi *</label>
                <input required type="text" placeholder="cth: Stock Opname Q3 2025" value={newName} onChange={e => setNewName(e.target.value)}
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Catatan (Opsional)</label>
                <textarea rows={3} value={newNotes} onChange={e => setNewNotes(e.target.value)}
                  placeholder="Keterangan sesi ini..."
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }} />
              </div>
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', fontSize: '0.85rem', color: '#3b82f6' }}>
                💡 Sistem akan otomatis memasukkan <strong>semua aset aktif</strong> ke dalam sesi ini sebagai daftar yang perlu diverifikasi.
              </div>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => { setShowNewModal(false); setNewName(''); setNewNotes(''); }}
                  style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={creating}
                  style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'var(--accent-primary)', color: 'white', border: 'none', fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1 }}>
                  {creating ? 'Membuat...' : '🚀 Mulai Opname'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NOTE MODAL (Missing / Different) */}
      {noteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: '460px', background: 'var(--bg-card)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem', fontWeight: 700 }}>
              ❌ Tandai Tidak Ditemukan
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              Aset: <strong>{noteModal.item.hostname}</strong>
            </p>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Catatan / Keterangan *</label>
              <textarea required rows={4} value={noteText} onChange={e => setNoteText(e.target.value)}
                placeholder={'Jelaskan situasinya, misal: terakhir diketahui di ruang server...'}
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button onClick={() => { setNoteModal(null); setNoteText(''); setPendingStatus(''); }}
                style={{ padding: '0.7rem 1.3rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleMarkWithNote} disabled={!noteText.trim()}
                style={{ padding: '0.7rem 1.3rem', borderRadius: '8px', background: '#ef4444', color: 'white', border: 'none', fontWeight: 700, cursor: !noteText.trim() ? 'not-allowed' : 'pointer', opacity: !noteText.trim() ? 0.6 : 1 }}>
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {showQrModal && activeSession && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setShowQrModal(false)}>
          <div style={{ background: 'var(--bg-card)', padding: '2.5rem', borderRadius: '24px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, fontSize: '1.4rem', textAlign: 'center' }}>📱 Mobile Scanner</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '2rem', lineHeight: '1.5' }}>
              Buka kamera HP Anda dan *scan* QR Code ini untuk mulai memindai aset di lapangan.
            </p>
            
            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
              <QRCodeSVG 
                value={`${typeof window !== 'undefined' ? window.location.origin : ''}/stock-opname/${activeSession.id}/scan`} 
                size={220} 
                level="H"
                includeMargin={false}
              />
            </div>
            
            <div style={{ width: '100%', display: 'flex', gap: '1rem' }}>
              <button onClick={() => {
                const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/stock-opname/${activeSession.id}/scan`;
                if (navigator.clipboard && window.isSecureContext) {
                  navigator.clipboard.writeText(url).then(() => {
                    alert('Link berhasil di-copy!');
                  });
                } else {
                  // Fallback for non-HTTPS (e.g. local IP address)
                  const textArea = document.createElement("textarea");
                  textArea.value = url;
                  textArea.style.position = "fixed"; // Avoid scrolling to bottom
                  document.body.appendChild(textArea);
                  textArea.focus();
                  textArea.select();
                  try {
                    document.execCommand('copy');
                    alert('Link berhasil di-copy!');
                  } catch (err) {
                    alert('Gagal menyalin link. Silakan copy manual: ' + url);
                  }
                  document.body.removeChild(textArea);
                }
              }} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy Link
              </button>
              <button onClick={() => setShowQrModal(false)} style={{ flex: 1, padding: '0.8rem', borderRadius: '12px', background: 'var(--accent-primary)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {showReport && activeSession && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>📊 Laporan Stock Opname</h3>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={handlePrint} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'var(--accent-primary)', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}>🖨️ Cetak</button>
                <button onClick={() => setShowReport(false)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Tutup</button>
              </div>
            </div>
            <div ref={printRef} style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: '0 0 0.25rem' }}>{activeSession.name}</h2>
                <p suppressHydrationWarning style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Dibuat: {new Date(activeSession.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} •
                  Selesai: {activeSession.completedAt ? new Date(activeSession.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </p>
              </div>

              {/* Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Total Aset', val: activeSession.totalItems, bg: 'var(--bg-secondary)', color: 'var(--text-primary)' },
                  { label: '✅ Ditemukan', val: activeSession.foundItems, bg: 'rgba(34,197,94,0.1)', color: '#22c55e' },
                  { label: '❌ Tidak Ada', val: activeSession.missingItems, bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
                  { label: '⚠️ Beda Kondisi', val: activeSession.differentItems, bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} style={{ background: s.bg, borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Detail by status */}
              {['Missing', 'Different', 'Found'].map(st => {
                const filtered = items.filter(i => i.status === st);
                if (filtered.length === 0) return null;
                return (
                  <div key={st} style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ marginBottom: '0.75rem', color: itemStatusColor[st] }}>
                      {st === 'Missing' ? '❌ Aset Tidak Ditemukan' : st === 'Different' ? '⚠️ Aset Kondisi Berbeda' : '✅ Aset Ditemukan'} ({filtered.length})
                    </h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Hostname</th>
                          <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Kategori</th>
                          <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Lokasi</th>
                          <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>User</th>
                          {st !== 'Found' && <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Catatan</th>}
                          <th style={{ padding: '0.6rem 0.75rem', textAlign: 'left' }}>Dicek Oleh</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(item => (
                          <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600 }}>{item.hostname}</td>
                            <td style={{ padding: '0.6rem 0.75rem' }}>{item.category || '-'}</td>
                            <td style={{ padding: '0.6rem 0.75rem' }}>{item.location || '-'}</td>
                            <td style={{ padding: '0.6rem 0.75rem' }}>{item.currentUser || '-'}</td>
                            {st !== 'Found' && <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{item.notes || '-'}</td>}
                            <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)' }}>{item.checkedBy || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* SCANNER MODAL */}
      {showScanner && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, flexDirection: 'column' }}>
          <div style={{ width: '90%', maxWidth: '600px', background: 'var(--bg-card)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)', position: 'relative' }}>
            <h3 style={{ marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.4rem' }}>📷 Scan Barcode / QR Aset</h3>
            
            {/* Camera View */}
            <div id="stock-reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', background: '#000', minHeight: '300px' }}></div>
            
            {/* Hidden Input for Physical Gun Scanner */}
            <input 
              ref={gunScannerInputRef}
              type="text" 
              style={{ position: 'absolute', opacity: 0, left: '-9999px' }} 
              onKeyDown={handleGunScannerInput}
              onBlur={(e) => { if (showScanner) e.target.focus(); }} // Keep focus
            />

            {/* Scan Status Message */}
            <div style={{ minHeight: '60px', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {scanMessage && (
                <div style={{ 
                  padding: '0.8rem 1.5rem', borderRadius: '8px', fontWeight: 600, width: '100%', textAlign: 'center',
                  background: scanMessage.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                  color: scanMessage.type === 'success' ? '#22c55e' : '#ef4444',
                  border: `1px solid ${scanMessage.type === 'success' ? '#22c55e' : '#ef4444'}55`
                }}>
                  {scanMessage.text}
                </div>
              )}
            </div>

            <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Arahkan kamera ke barcode/QR atau tembakkan Gun Scanner Anda.
            </p>

            <button onClick={closeScanner} style={{ marginTop: '1.5rem', width: '100%', padding: '1rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', fontWeight: 700, cursor: 'pointer' }}>
              Tutup Scanner
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
