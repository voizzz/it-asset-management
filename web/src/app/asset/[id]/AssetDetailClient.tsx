'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './detail.module.css';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

<<<<<<< HEAD
export default function AssetDetailClient({ agent }: { agent: any }) {
=======
export default function AssetDetailClient({ agent, software = [], assignments = [], employees = [] }: { agent: any, software?: any[], assignments?: any[], employees?: any[] }) {
>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editData, setEditData] = useState({
    hostname: agent.hostname,
    category: agent.category || 'PC',
    ipAddress: agent.ipAddress || '',
    macAddress: agent.macAddress || '',
    brand: agent.brand || '',
    model: agent.model || '',
    serialNumber: agent.serialNumber || '',
    location: agent.location || '',
    notes: agent.notes || '',
    status: agent.status || 'in-use',
    currentUser: agent.currentUser || '',
    realUser: agent.realUser || '',
    extension: agent.extension || '',
    purchaseDate: agent.purchaseDate || '',
    warrantyMonths: agent.warrantyMonths || ''
  });

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this asset? This cannot be undone.')) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/assets/${agent.id}`, { method: 'DELETE' });
      router.push('/assets');
    } catch (e) {
      alert('Failed to delete asset');
      setIsDeleting(false);
    }
  };

<<<<<<< HEAD
=======
  const [checkoutEmployeeId, setCheckoutEmployeeId] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutEmployeeId) return alert('Select an employee');
    setIsCheckingOut(true);
    try {
      const res = await fetch(`/api/assets/${agent.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: checkoutEmployeeId, notes: checkoutNotes })
      });
      if (!res.ok) throw new Error('Failed to checkout');
      setCheckoutEmployeeId('');
      setCheckoutNotes('');
      router.refresh();
    } catch (e) {
      alert('Failed to checkout asset');
    }
    setIsCheckingOut(false);
  };

  const handleCheckin = async () => {
    if (!confirm('Return this asset to inventory?')) return;
    try {
      const res = await fetch(`/api/assets/${agent.id}/checkin`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to check in');
      router.refresh();
    } catch (e) {
      alert('Failed to check in asset');
    }
  };

>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)
  const handleEditSave = async (e: any) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/assets/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      if (!res.ok) throw new Error('Failed to update');
      setShowEdit(false);
      router.refresh(); // Refresh server component data
    } catch (e) {
      alert('Failed to update asset. Please check the network connection.');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className={styles.titleArea}>
          <Link href="/assets" className={styles.backBtn}>← Back</Link>
          <h2>Asset: {agent.hostname}</h2>
          <span className={`${styles.status} ${styles[agent.status] || styles['in-use']}`} style={{ marginLeft: '1rem' }}>
            {agent.status.replace('-', ' ').toUpperCase()}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={() => window.print()} className={styles.printBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print Label
          </button>
          <button onClick={() => setShowEdit(true)} className={styles.editBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button onClick={handleDelete} disabled={isDeleting} className={styles.deleteBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            Delete
          </button>
        </div>
      </header>

      <div className={styles.cardGrid}>
        {/* Card 1: Asset Profile */}
        <div className={styles.card}>
          <h3>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            Asset Profile
          </h3>
          <div className={styles.sectionTitle}>Basic Information</div>
          <ul className={styles.list}>
            <li><strong>Category:</strong> {agent.category || 'PC'}</li>
            {agent.category !== 'Network Device' && agent.category !== 'IP Phone' && (
              <li><strong>User-PC:</strong> {agent.currentUser || 'N/A'}</li>
            )}
            {agent.category !== 'Network Device' && (
              <li><strong>User (Real Name):</strong> {agent.realUser || 'N/A'}</li>
            )}
            {agent.category === 'IP Phone' && (
              <li><strong>Extension:</strong> {agent.extension || 'N/A'}</li>
            )}
            <li><strong>Brand:</strong> {agent.brand || 'N/A'}</li>
            <li><strong>Model:</strong> {agent.model || 'N/A'}</li>
            <li><strong>Serial Number:</strong> {agent.serialNumber || 'N/A'}</li>
            {!agent.isManual && <li suppressHydrationWarning><strong>Last Seen:</strong> {new Date(agent.lastSeen).toLocaleString()}</li>}
          </ul>
        </div>

        {/* Card 2: Technical & Network Details */}
        {!['Monitor', 'Other'].includes(agent.category) && (
          <div className={styles.card}>
            <h3>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.82a10 10 0 0 1 14 0"/><path d="M8.5 16.42a5 5 0 0 1 7 0"/></svg>
              Technical & Network Details
            </h3>
            {agent.category !== 'IP Phone' && (
              <>
                <div className={styles.sectionTitle}>System Details</div>
                <ul className={styles.list} style={{ marginBottom: '2rem' }}>
                  <li><strong>OS:</strong> {agent.os || 'N/A'}</li>
                  {agent.category !== 'Network Device' && <li><strong>Motherboard:</strong> {agent.motherboard || 'N/A'}</li>}
                </ul>
              </>
            )}

            <div className={styles.sectionTitle}>Network Configuration</div>
            <ul className={styles.list}>
              <li><strong>IP Address:</strong> {agent.ipAddress || 'N/A'}</li>
              <li><strong>MAC Address:</strong> {agent.macAddress || 'N/A'}</li>
            </ul>
          </div>
        )}

        {/* Card 3: Core Hardware */}
        {!['Monitor', 'Other', 'Network Device', 'IP Phone'].includes(agent.category) && (
          <div className={styles.card}>
            <h3>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>
              Core Hardware
            </h3>
            <ul className={styles.list}>
              <li><strong>Processor:</strong> {agent.cpu || 'N/A'}</li>
              <li><strong>Graphics:</strong> {agent.gpu || 'N/A'}</li>
              <li><strong>Memory (RAM):</strong> {agent.ramMb} MB</li>
              <li><strong>Storage (C:):</strong> {agent.diskGb} GB</li>
            </ul>
          </div>
        )}

<<<<<<< HEAD
=======
      </div>

      <div className={styles.cardGrid} style={{ marginTop: '1.5rem' }}>
>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)
        {/* Card 4: Additional Details */}
        <div className={styles.card}>
          <h3>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            Additional Details
          </h3>
          <ul className={styles.list}>
            <li><strong>{agent.category === 'Monitor' ? 'Attached:' : 'Location:'}</strong> {agent.location || 'N/A'}</li>
            <li><strong>Notes:</strong> {agent.notes || 'N/A'}</li>
          </ul>

          <div className={styles.sectionTitle} style={{ marginTop: '1.5rem' }}>Warranty & Lifecycle</div>
          <ul className={styles.list}>
            <li><strong>Tanggal Pembelian:</strong> {agent.purchaseDate ? new Date(agent.purchaseDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Belum diisi'}</li>
            <li><strong>Durasi Garansi:</strong> {agent.warrantyMonths ? `${agent.warrantyMonths} bulan` : 'Belum diisi'}</li>
            {agent.purchaseDate && agent.warrantyMonths && (() => {
              const expiry = new Date(agent.purchaseDate);
              expiry.setMonth(expiry.getMonth() + agent.warrantyMonths);
              const now = new Date();
              const diff = expiry.getTime() - now.getTime();
              const daysLeft = Math.ceil(diff / (24 * 60 * 60 * 1000));
              return (
                <li>
                  <strong>Status Garansi:</strong>{' '}
                  <span style={{
                    padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700,
                    background: daysLeft < 0 ? 'rgba(239,68,68,0.15)' : daysLeft <= 30 ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                    color: daysLeft < 0 ? '#dc2626' : daysLeft <= 30 ? '#b45309' : '#059669'
                  }}>
                    {daysLeft < 0 ? `Expired (${Math.abs(daysLeft)} hari lalu)` : daysLeft <= 30 ? `⚠️ ${daysLeft} hari lagi` : `✅ Aktif (${daysLeft} hari lagi)`}
                  </span>
                </li>
              );
            })()}
          </ul>
        </div>
<<<<<<< HEAD
=======


        {/* Card 5: Assignment & Checkout */}
        <div className={styles.card}>
          <h3>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            Assignment & Checkout
          </h3>
          
          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
            {agent.employeeId ? (
              <div>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--accent-primary)' }}>Currently Assigned To:</p>
                {(() => {
                  const currAssign = assignments.find(a => !a.returnedAt);
                  return <p style={{ margin: '0.5rem 0', fontSize: '1.1rem', fontWeight: 700 }}>{currAssign?.employeeName || 'Unknown Employee'}</p>;
                })()}
                <button onClick={handleCheckin} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                  Check In (Return to Inventory)
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-secondary)' }}>Asset is currently available.</p>
                <select required value={checkoutEmployeeId} onChange={e => setCheckoutEmployeeId(e.target.value)} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
                  <option value="">-- Select Employee --</option>
                  {employees.map((e: any) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.department || 'No Dept'})</option>
                  ))}
                </select>
                <input type="text" placeholder="Checkout notes..." value={checkoutNotes} onChange={e => setCheckoutNotes(e.target.value)} style={{ padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                <button type="submit" disabled={isCheckingOut} style={{ padding: '0.6rem 1rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                  {isCheckingOut ? 'Assigning...' : 'Checkout Asset'}
                </button>
              </form>
            )}
          </div>

          <div className={styles.sectionTitle}>Assignment History</div>
          <ul className={styles.list} style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {assignments.length === 0 && <li style={{ color: 'var(--text-muted)' }}>No assignment history</li>}
            {assignments.map((a: any) => (
              <li key={a.id} style={{ display: 'flex', flexDirection: 'column', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600 }}>{a.employeeName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {new Date(a.assignedAt).toLocaleDateString()} - {a.returnedAt ? new Date(a.returnedAt).toLocaleDateString() : 'Present'}
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Card 6: Installed Software */}
        <div className={styles.card}>
          <h3>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            Installed Software
          </h3>
          <ul className={styles.list} style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {software.length === 0 && <li style={{ color: 'var(--text-muted)' }}>No software recorded.</li>}
            {software.map((sw: any, i: number) => (
              <li key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600 }}>{sw.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {sw.publisher} {sw.version && `v${sw.version}`}
                </div>
              </li>
            ))}
          </ul>
        </div>
>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)
      </div>

      {/* Edit Modal */}
      {showEdit && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
        }}>
          <div style={{ width: '850px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', background: '#ffffff', padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)' }}></div>
              Edit Asset
            </h2>
            
            <form onSubmit={handleEditSave} style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              
              {/* Section 1: Basic Information */}
              <div>
                <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.95rem', fontWeight: 600, marginBottom: '1.25rem', color: 'var(--accent-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '0.4rem 1rem', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                  Basic Information
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Asset Name / Hostname</label>
                    <input required type="text" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={editData.hostname} onChange={e => setEditData({...editData, hostname: e.target.value})} placeholder="e.g. DESKTOP-PC-A1" />
                  </div>
                  {editData.category !== 'Network Device' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>User (Real Name)</label>
<<<<<<< HEAD
                      <input type="text" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={editData.realUser} onChange={e => setEditData({...editData, realUser: e.target.value})} placeholder="e.g. Budi Santoso" />
=======
                      <select style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', appearance: 'auto', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={editData.realUser} onChange={e => setEditData({...editData, realUser: e.target.value})}>
                        <option value="">Select Employee...</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.name}>{emp.name}</option>
                        ))}
                      </select>
>>>>>>> 5e60c2a (Initialize project and add standardized UX/UI features)
                    </div>
                  )}
                  {editData.category !== 'Network Device' && editData.category !== 'IP Phone' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>User-PC (OS User)</label>
                      <input type="text" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={editData.currentUser} onChange={e => setEditData({...editData, currentUser: e.target.value})} placeholder="e.g. IT-01" />
                    </div>
                  )}
                  {editData.category === 'IP Phone' && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Extension</label>
                      <input type="text" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={editData.extension} onChange={e => setEditData({...editData, extension: e.target.value})} placeholder="e.g. 101" />
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
                    <select style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', appearance: 'auto', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = 'var(--accent-success)'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={editData.category} onChange={e => setEditData({...editData, category: e.target.value})}>
                      {['Laptop', 'PC', 'Monitor', 'Network Device', 'IP Phone', 'Server', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Serial Number</label>
                    <input type="text" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = 'var(--accent-success)'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={editData.serialNumber} onChange={e => setEditData({...editData, serialNumber: e.target.value})} placeholder="Format ABC123XYZ" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Status</label>
                    <select style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', appearance: 'auto', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = 'var(--accent-success)'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})}>
                      <option value="online">Online</option>
                      <option value="offline">Offline</option>
                      <option value="in-use">In Use</option>
                      <option value="broken">Broken</option>
                      <option value="repair">Under Repair</option>
                      <option value="spare">Spare</option>
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
                    <input type="text" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = '#8b5cf6'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={editData.brand} onChange={e => setEditData({...editData, brand: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Model</label>
                    <input type="text" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = '#8b5cf6'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={editData.model} onChange={e => setEditData({...editData, model: e.target.value})} />
                  </div>
                  {!['Monitor', 'Other'].includes(editData.category) && (
                    <>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>IP Address</label>
                        <input type="text" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = '#8b5cf6'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={editData.ipAddress} onChange={e => setEditData({...editData, ipAddress: e.target.value})} />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>MAC Address</label>
                        <input type="text" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = '#8b5cf6'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={editData.macAddress} onChange={e => setEditData({...editData, macAddress: e.target.value})} />
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
                    <input type="date" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = '#dc2626'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={editData.purchaseDate} onChange={e => setEditData({...editData, purchaseDate: e.target.value})} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Durasi Garansi (bulan)</label>
                    <input type="number" min="0" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = '#dc2626'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={editData.warrantyMonths} onChange={e => setEditData({...editData, warrantyMonths: e.target.value})} placeholder="e.g. 12, 24, 36" />
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
                    <input type="text" style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = '#f59e0b'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={editData.location} onChange={e => setEditData({...editData, location: e.target.value})} placeholder={['Monitor', 'Other'].includes(editData.category) ? 'e.g. PC-IT-01' : 'e.g. Room 101'} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>Notes</label>
                    <textarea style={{ width: '100%', height: '100px', resize: 'vertical', padding: '0.8rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', background: '#f8fafc', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem', transition: 'border 0.2s' }} onFocus={e => e.target.style.borderColor = '#f59e0b'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} value={editData.notes} onChange={e => setEditData({...editData, notes: e.target.value})} placeholder="Additional information..." />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
                <button type="button" onClick={() => setShowEdit(false)} style={{ padding: '0.8rem 1.5rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>Cancel</button>
                <button type="submit" style={{ padding: '0.8rem 1.5rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)', transition: 'transform 0.2s', letterSpacing: '0.02em' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Print Label Container (Hidden except during print) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-label, #print-label * {
            visibility: visible;
          }
          #print-label {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
            display: flex;
            justify-content: flex-start;
            align-items: flex-start;
          }
          @page { size: auto;  margin: 0mm; }
        }
        @media screen {
          #print-label { display: none; }
        }
      `}} />
      <div id="print-label">
        <div style={{
          border: '2px solid #000',
          padding: '20px',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '20px',
          width: '350px',
          fontFamily: 'sans-serif'
        }}>
          <div style={{ background: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '8px' }}>
            <QRCodeSVG value={agent.id} size={100} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>ITAM ASSET</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#333' }}><strong>ID:</strong> {agent.hostname}</p>
            <p style={{ margin: 0, fontSize: '14px', color: '#333' }}><strong>Type:</strong> {agent.category || 'PC'}</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#666', marginTop: '5px' }}>Scan to manage asset</p>
          </div>
        </div>
      </div>
      
    </div>
  );
}
