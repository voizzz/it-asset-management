'use client';
import { useState, useEffect } from 'react';
import styles from '../page.module.css';
import Sidebar from '@/components/Sidebar';

export default function NetworkScanPage() {
  const [logoName, setLogoName] = useState('ITAM');
  const [subnet, setSubnet] = useState('192.168.1.0/24');
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/settings/get').then(r => r.json()).then(d => { if (d.logoName) setLogoName(d.logoName); });
  }, []);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subnet) return;
    setIsScanning(true);
    setResults([]);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subnet })
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      alert('Scan failed');
    }
    setIsScanning(false);
  };

  const handleRegister = async (device: any) => {
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostname: `Detected-${device.ip}`,
          ipAddress: device.ip,
          category: device.isWindows ? 'PC' : (device.isSsh ? 'Server' : 'Other'),
          status: 'online',
          isManual: true
        })
      });
      if (res.ok) alert(`Registered ${device.ip} successfully`);
      else alert('Failed to register');
    } catch (e) {
      alert('Failed to register device');
    }
  };

  return (
    <div className={styles.dashboard}>
      <Sidebar logoName={logoName} />
      <section className={styles.main}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>Agentless Discovery</h2>
          <p className={styles.subtitle}>Scan the local network for connected devices without agents.</p>
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '2rem' }}>
          <form onSubmit={handleScan} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, maxWidth: '400px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Target Subnet</label>
              <input type="text" value={subnet} onChange={e => setSubnet(e.target.value)} placeholder="192.168.1.0/24" style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
            </div>
            <button type="submit" disabled={isScanning} style={{ padding: '0.8rem 1.5rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: isScanning ? 'wait' : 'pointer' }}>
              {isScanning ? 'Scanning Network...' : 'Start Discovery'}
            </button>
          </form>
        </div>

        {results.length > 0 && (
          <div style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '1.5rem', border: 'var(--glass-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Discovered Devices ({results.length})</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '1rem' }}>IP Address</th>
                    <th style={{ padding: '1rem' }}>Detected Type</th>
                    <th style={{ padding: '1rem' }}>Open Ports</th>
                    <th style={{ padding: '1rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1rem', fontWeight: 600, fontFamily: 'monospace' }}>{d.ip}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{d.type}</td>
                      <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                        {d.isWindows && <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>135 (RPC)</span>}
                        {d.isSsh && <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>22 (SSH)</span>}
                        {d.isWeb && <span style={{ background: '#dcfce7', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>80 (HTTP)</span>}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button onClick={() => handleRegister(d)} style={{ padding: '0.4rem 0.8rem', background: 'transparent', color: 'var(--accent-primary)', border: '1px solid var(--accent-primary)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
                          Add to Inventory
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
