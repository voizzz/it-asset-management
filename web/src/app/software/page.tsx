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
  const filteredLicenses = licenses.filter(lic => lic.softwareName.toLowerCase().includes(searchQuery.toLowerCase()) || (lic.licenseKey && lic.licenseKey.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div className={styles.dashboard}>
      <Sidebar logoName={logoName} />

      <section className={styles.main}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>Software & Licenses</h2>
            <p className={styles.subtitle}>Manage installed software and tracking license keys.</p>
          </div>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Search software/licenses..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '250px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            />
            <svg style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <button
              onClick={() => setActiveTab('inventory')}
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
              onClick={() => setActiveTab('licenses')}
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
                    filteredSoftware.map(sw => (
                      <tr key={sw.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1rem', fontWeight: 600 }}>{sw.name}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{sw.publisher || '-'}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{sw.version || '-'}</td>
                        <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{sw.installCount} Devices</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'licenses' && (
            <div>
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
                      <th style={{ padding: '1rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLicenses.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No licenses tracked.</td></tr>
                    ) : (
                      filteredLicenses.map(lic => {
                        const expired = lic.expiryDate && new Date(lic.expiryDate) < new Date();
                        return (
                          <tr key={lic.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '1rem', fontWeight: 600 }}>{lic.softwareName}</td>
                            <td style={{ padding: '1rem', fontFamily: 'monospace', background: 'var(--bg-secondary)', borderRadius: '4px' }}>{lic.licenseKey || '-'}</td>
                            <td style={{ padding: '1rem' }}>{lic.totalSeats}</td>
                            <td style={{ padding: '1rem', color: expired ? '#ef4444' : 'var(--text-secondary)', fontWeight: expired ? 700 : 400 }}>
                              {lic.expiryDate ? new Date(lic.expiryDate).toLocaleDateString() : 'Lifetime'}
                              {expired && ' (EXPIRED)'}
                            </td>
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
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Add License Modal */}
      {showAddLicense && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: '500px', background: '#fff', padding: '2rem', borderRadius: '16px' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Add License</h3>
            <form onSubmit={handleAddLicense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Software Name</label>
                <input required type="text" value={newLicense.softwareName} onChange={e => setNewLicense({...newLicense, softwareName: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>License Key</label>
                <input type="text" value={newLicense.licenseKey} onChange={e => setNewLicense({...newLicense, licenseKey: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Total Seats</label>
                <input type="number" min="1" value={newLicense.totalSeats} onChange={e => setNewLicense({...newLicense, totalSeats: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Expiry Date (Optional)</label>
                <input type="date" value={newLicense.expiryDate} onChange={e => setNewLicense({...newLicense, expiryDate: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowAddLicense(false)} style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'transparent', border: '1px solid #e2e8f0', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer' }}>Save License</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit License Modal */}
      {showEditLicense && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ width: '500px', background: '#fff', padding: '2rem', borderRadius: '16px' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700 }}>Edit License</h3>
            <form onSubmit={handleEditLicense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Software Name</label>
                <input required type="text" value={editLicenseData.softwareName} onChange={e => setEditLicenseData({...editLicenseData, softwareName: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>License Key</label>
                <input type="text" value={editLicenseData.licenseKey} onChange={e => setEditLicenseData({...editLicenseData, licenseKey: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Total Seats</label>
                <input type="number" min="1" value={editLicenseData.totalSeats} onChange={e => setEditLicenseData({...editLicenseData, totalSeats: parseInt(e.target.value)})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Expiry Date (Optional)</label>
                <input type="date" value={editLicenseData.expiryDate} onChange={e => setEditLicenseData({...editLicenseData, expiryDate: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowEditLicense(false)} style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'transparent', border: '1px solid #e2e8f0', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.8rem 1.5rem', borderRadius: '8px', background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
