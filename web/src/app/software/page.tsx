'use client';
import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import Sidebar from '@/components/Sidebar';

export default function SoftwarePage() {
  const [logoName, setLogoName] = useState('ITAM');
  const [activeTab, setActiveTab] = useState('inventory');
  const [software, setSoftware] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  
  // New License State
  const [showAddLicense, setShowAddLicense] = useState(false);
  const [showEditLicense, setShowEditLicense] = useState(false);
  const [editLicenseData, setEditLicenseData] = useState({ id: '', softwareName: '', licenseKey: '', totalSeats: 1, expiryDate: '', notes: '' });
  const [newLicense, setNewLicense] = useState({
    softwareName: '',
    licenseKey: '',
    totalSeats: 1,
    expiryDate: '',
    notes: ''
  });

  // Devices Modal State
  const [showDevicesModal, setShowDevicesModal] = useState<string | null>(null);
  const [softwareDevices, setSoftwareDevices] = useState<any[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);

  useEffect(() => {
    fetch('/api/settings/get').then(r => r.json()).then(d => { if (d.logoName) setLogoName(d.logoName); });
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/software');
      const data = await res.json();
      setSoftware(data.software || []);
      setLicenses(data.licenses || []);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleViewDevices = async (softwareId: string) => {
    setShowDevicesModal(softwareId);
    setIsLoadingDevices(true);
    setSoftwareDevices([]);
    try {
      const res = await fetch(`/api/software?softwareId=${softwareId}`);
      const data = await res.json();
      setSoftwareDevices(data.devices || []);
    } catch (e) {
      console.error('Failed to load devices:', e);
    }
    setIsLoadingDevices(false);
  };

  const handleAddLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/software', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_license', ...newLicense })
      });
      setShowAddLicense(false);
      setNewLicense({ softwareName: '', licenseKey: '', totalSeats: 1, expiryDate: '', notes: '' });
      fetchData();
    } catch (e) {
      alert('Failed to add license');
    }
  };

  const handleEditLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/software', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit_license', ...editLicenseData })
      });
      setShowEditLicense(false);
      fetchData();
    } catch (e) {
      alert('Failed to edit license');
    }
  };

  const handleDeleteLicense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this license?')) return;
    try {
      await fetch('/api/software', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_license', id })
      });
      fetchData();
    } catch (e) {
      alert('Failed to delete license');
    }
  };

  const filteredSoftware = software.filter(sw => sw.name.toLowerCase().includes(searchQuery.toLowerCase()) || (sw.publisher && sw.publisher.toLowerCase().includes(searchQuery.toLowerCase())));
  const filteredLicenses = licenses.filter(lic => 
    lic.softwareName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (lic.licenseKey && lic.licenseKey.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (lic.notes && lic.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const paginatedSoftware = filteredSoftware.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const paginatedLicenses = filteredLicenses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const now = new Date();
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(now.getMonth() + 3);

  const expiringLicenses = licenses.filter(lic => {
    if (!lic.expiryDate) return false;
    const expiryDate = new Date(lic.expiryDate);
    return expiryDate > now && expiryDate <= threeMonthsFromNow;
  });

  const expiredLicenses = licenses.filter(lic => {
    if (!lic.expiryDate) return false;
    return new Date(lic.expiryDate) <= now;
  });

  return (
    <div className={styles.dashboard}>
      <Sidebar logoName={logoName} />

      <section className={styles.main}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>Software &amp; Licenses</h2>
            <p className={styles.subtitle}>Manage installed software and tracking license keys.</p>
          </div>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search software/licenses..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '250px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            />
            <svg style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <button
              onClick={() => { setActiveTab('inventory'); setCurrentPage(1); }}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                border: activeTab === 'inventory' ? 'none' : '1px solid var(--border-color)',
                background: activeTab === 'inventory' ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === 'inventory' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              Software Inventory
            </button>
            <button
              onClick={() => { setActiveTab('licenses'); setCurrentPage(1); }}
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
                border: activeTab === 'licenses' ? 'none' : '1px solid var(--border-color)',
                background: activeTab === 'licenses' ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === 'licenses' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              License Management
            </button>
          </div>

          {activeTab === 'inventory' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '1rem' }}>Software Name</th>
                    <th style={{ padding: '1rem' }}>Publisher</th>
                    <th style={{ padding: '1rem' }}>Version</th>
                    <th style={{ padding: '1rem' }}>Install Count</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSoftware.length === 0 ? (
                    <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No software found.</td></tr>
                  ) : (
                    paginatedSoftware.map(sw => (
                      <tr key={sw.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{sw.name}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{sw.publisher || '-'}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{sw.version || '-'}</td>
                        <td style={{ padding: '1rem', fontWeight: 700 }}>
                          <span 
                            onClick={() => handleViewDevices(sw.id)} 
                            style={{ color: 'var(--accent-primary)', cursor: 'pointer', textDecoration: 'none' }}
                            onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                          >
                            {sw.installCount} Devices
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              
              {software.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1rem 0.5rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Showing {Math.min(((currentPage - 1) * ITEMS_PER_PAGE) + 1, filteredSoftware.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredSoftware.length)} of {filteredSoftware.length} entries
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: currentPage === 1 ? 'transparent' : 'var(--bg-secondary)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}>Previous</button>
                    <span style={{ padding: '0.5rem', fontWeight: 600 }}>{currentPage} / {Math.ceil(filteredSoftware.length / ITEMS_PER_PAGE) || 1}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredSoftware.length / ITEMS_PER_PAGE), p + 1))} disabled={currentPage >= Math.ceil(filteredSoftware.length / ITEMS_PER_PAGE)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: currentPage >= Math.ceil(filteredSoftware.length / ITEMS_PER_PAGE) ? 'transparent' : 'var(--bg-secondary)', color: currentPage >= Math.ceil(filteredSoftware.length / ITEMS_PER_PAGE) ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage >= Math.ceil(filteredSoftware.length / ITEMS_PER_PAGE) ? 'not-allowed' : 'pointer', fontWeight: 600 }}>Next</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'licenses' && (
            <div>
              {(expiringLicenses.length > 0 || expiredLicenses.length > 0) && (
                <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {expiredLicenses.length > 0 && (
                    <div style={{ padding: '1rem', background: '#fee2e2', borderLeft: '4px solid #ef4444', borderRadius: '4px', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      <strong>Alert:</strong> You have {expiredLicenses.length} expired license(s). Please renew or remove them immediately.
                    </div>
                  )}
                  {expiringLicenses.length > 0 && (
                    <div style={{ padding: '1rem', background: '#fef3c7', borderLeft: '4px solid #f59e0b', borderRadius: '4px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <strong>Warning:</strong> You have {expiringLicenses.length} license(s) expiring within the next 3 months.
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button onClick={() => setShowAddLicense(true)} style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: 'var(--accent-success)', color: 'white', fontWeight: 600, cursor: 'pointer' }}>
                  + Add License
                </button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                      <th style={{ padding: '1rem' }}>Software</th>
                      <th style={{ padding: '1rem' }}>Key</th>
                      <th style={{ padding: '1rem' }}>Seats</th>
                      <th style={{ padding: '1rem' }}>Expiry Date</th>
                      <th style={{ padding: '1rem' }}>Notes</th>
                      <th style={{ padding: '1rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLicenses.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No licenses tracked.</td></tr>
                    ) : (
                      paginatedLicenses.map(lic => {
                        const expired = lic.expiryDate && new Date(lic.expiryDate) < now;
                        const isExpiringSoon = lic.expiryDate && !expired && new Date(lic.expiryDate) <= threeMonthsFromNow;
                        return (
                          <tr key={lic.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '1rem', fontWeight: 600 }}>{lic.softwareName}</td>
                            <td style={{ padding: '1rem', fontFamily: 'monospace', background: 'var(--bg-secondary)', borderRadius: '4px' }}>{lic.licenseKey || '-'}</td>
                            <td style={{ padding: '1rem' }}>{lic.totalSeats}</td>
                            <td suppressHydrationWarning style={{ padding: '1rem', color: expired ? '#ef4444' : (isExpiringSoon ? '#f59e0b' : 'var(--text-secondary)'), fontWeight: (expired || isExpiringSoon) ? 700 : 400 }}>
                              {lic.expiryDate ? new Date(lic.expiryDate).toLocaleDateString() : 'Lifetime'}
                              {expired && ' (EXPIRED)'}
                              {isExpiringSoon && ' (Expiring Soon)'}
                            </td>
                            <td style={{ padding: '1rem', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={lic.notes}>{lic.notes || '-'}</td>
                            <td style={{ padding: '1rem' }}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={() => { setEditLicenseData(lic); setShowEditLicense(true); }} style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Edit</button>
                                <button onClick={() => handleDeleteLicense(lic.id)} style={{ padding: '0.4rem 0.8rem', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                {licenses.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1rem 0.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Showing {Math.min(((currentPage - 1) * ITEMS_PER_PAGE) + 1, filteredLicenses.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredLicenses.length)} of {filteredLicenses.length} entries
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: currentPage === 1 ? 'transparent' : 'var(--bg-secondary)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}>Previous</button>
                      <span style={{ padding: '0.5rem', fontWeight: 600 }}>{currentPage} / {Math.ceil(filteredLicenses.length / ITEMS_PER_PAGE) || 1}</span>
                      <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredLicenses.length / ITEMS_PER_PAGE), p + 1))} disabled={currentPage >= Math.ceil(filteredLicenses.length / ITEMS_PER_PAGE)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: currentPage >= Math.ceil(filteredLicenses.length / ITEMS_PER_PAGE) ? 'transparent' : 'var(--bg-secondary)', color: currentPage >= Math.ceil(filteredLicenses.length / ITEMS_PER_PAGE) ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage >= Math.ceil(filteredLicenses.length / ITEMS_PER_PAGE) ? 'not-allowed' : 'pointer', fontWeight: 600 }}>Next</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {showAddLicense && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: '500px', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Add License</h3>
            <form onSubmit={handleAddLicense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Software Name</label>
                <input required type="text" value={newLicense.softwareName} onChange={e => setNewLicense({...newLicense, softwareName: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>License Key</label>
                <input type="text" value={newLicense.licenseKey} onChange={e => setNewLicense({...newLicense, licenseKey: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Total Seats</label>
                <input type="number" min="1" value={newLicense.totalSeats} onChange={e => setNewLicense({...newLicense, totalSeats: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Expiry Date (Optional)</label>
                <input type="date" value={newLicense.expiryDate} onChange={e => setNewLicense({...newLicense, expiryDate: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Notes (Optional)</label>
                <textarea rows={3} value={newLicense.notes} onChange={e => setNewLicense({...newLicense, notes: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddLicense(false)} style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer' }}>Save License</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditLicense && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: '500px', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Edit License</h3>
            <form onSubmit={handleEditLicense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Software Name</label>
                <input required type="text" value={editLicenseData.softwareName} onChange={e => setEditLicenseData({...editLicenseData, softwareName: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>License Key</label>
                <input type="text" value={editLicenseData.licenseKey} onChange={e => setEditLicenseData({...editLicenseData, licenseKey: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Total Seats</label>
                <input type="number" min="1" value={editLicenseData.totalSeats} onChange={e => setEditLicenseData({...editLicenseData, totalSeats: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Expiry Date (Optional)</label>
                <input type="date" value={editLicenseData.expiryDate} onChange={e => setEditLicenseData({...editLicenseData, expiryDate: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Notes (Optional)</label>
                <textarea rows={3} value={editLicenseData.notes} onChange={e => setEditLicenseData({...editLicenseData, notes: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowEditLicense(false)} style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Devices Modal */}
      {showDevicesModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '16px', width: '500px', maxWidth: '90%', border: 'var(--glass-border)' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Installed Devices</h3>
            {isLoadingDevices ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading devices...</div>
            ) : softwareDevices.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No devices found.</div>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '0.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      <th style={{ padding: '0.75rem' }}>Hostname</th>
                      <th style={{ padding: '0.75rem' }}>IP Address</th>
                      <th style={{ padding: '0.75rem' }}>OS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {softwareDevices.map(dev => (
                      <tr key={dev.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{dev.hostname}</td>
                        <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{dev.ipAddress || '-'}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{dev.os || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowDevicesModal(null)} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
