'use client';
import { useState, useEffect } from 'react';
import Script from 'next/script';
import styles from './page.module.css';
import AssetDistributionChart from './components/AssetDistributionChart';
import ExpiryWarningBanner from './components/ExpiryWarningBanner';
import Link from 'next/link';

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

export default function DashboardClient({ agents, logs, stats, serverStats }: { agents: any[], logs: any[], stats: any, serverStats: any }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const handleAddManual = () => { window.location.href = '/assets?action=add'; };
  const handleScanBarcode = () => { window.location.href = '/assets?action=scan'; };
  const handleCetakLabel = () => { window.location.href = '/assets'; };

  return (
    <div className={styles.dashboardLayout}>
      <header className={styles.dashboardHeader}>
        <button onClick={toggleMenu} className={styles.menuToggle} style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1.5rem', display: 'none' }}>☰</button>
        <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 700, letterSpacing: '-0.02em', color: '#1f2937' }}>Overview</h2>
      </header>

      {/* Stats Grid */}
      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statTitle}>TOTAL ASET</span>
            <span className={styles.statValue}>{stats.total}</span>
          </div>
          <div className={`${styles.statIcon} ${styles.iconBlue}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statTitle}>AKTIF</span>
            <span className={styles.statValue} style={{color: 'var(--accent-success)'}}>{stats.online}</span>
            <span style={{fontSize:'0.72rem',color:'#6b7280',marginTop:'2px'}}>Online + In-Use</span>
          </div>
          <div className={`${styles.statIcon} ${styles.iconGreen}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statTitle}>OFFLINE / RUSAK</span>
            <span className={styles.statValue} style={{color: 'var(--accent-danger)'}}>{stats.offlineBroken}</span>
            <span style={{fontSize:'0.72rem',color:'#6b7280',marginTop:'2px'}}>Perangkat offline & rusak</span>
          </div>
          <div className={`${styles.statIcon} ${styles.iconRed}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statTitle}>DALAM PERBAIKAN</span>
            <span className={styles.statValue} style={{color: '#f59e0b'}}>{stats.repair}</span>
          </div>
          <div className={`${styles.statIcon} ${styles.iconOrange}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statTitle}>TERSEDIA</span>
            <span className={styles.statValue} style={{color: '#8b5cf6'}}>{stats.spare}</span>
          </div>
          <div className={`${styles.statIcon} ${styles.iconPurple}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
        </div>
      </section>

      {/* Warranty expiry warning banner */}
      <ExpiryWarningBanner agents={agents} />

      {/* Asset Distribution Chart */}
      <div className={styles.chartCard}>
        <h3 className={styles.cardHeading}>Distribusi Aset per Kategori</h3>
        <AssetDistributionChart agents={agents} />
      </div>

      {/* Main Grid Content */}
      <div className={styles.contentGrid}>
        
        {/* Left Column: Recent Assets */}
        <div className={styles.recentAssetsCard}>
          <h3 className={styles.cardHeading}>Aset Terbaru & Status</h3>
          <div className={styles.tableWrapper}>
            <table className={styles.modernTable}>
              <thead>
                <tr>
                  <th>HOSTNAME</th>
                  <th>STATUS</th>
                  <th style={{textAlign: 'right'}}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {agents.slice(0, 5).map(agent => (
                  <tr key={agent.id}>
                    <td>
                      <div style={{fontWeight: 700, color: '#1f2937', textTransform: 'uppercase', letterSpacing: '0.03em'}}>{agent.hostname}</div>
                      {agent.serialNumber && <div style={{fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.03em'}}>{agent.serialNumber}</div>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <StatusBadge status={agent.status || 'offline'} />
                        {(() => {
                          const ws = getWarrantyStatus(agent);
                          if (!ws) return null;
                          return (
                            <span style={{
                              fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '20px', fontWeight: 700,
                              letterSpacing: '0.04em',
                              background: ws === 'expired' ? 'rgba(220,38,38,0.12)' : 'rgba(245,158,11,0.12)',
                              color: ws === 'expired' ? '#dc2626' : '#b45309',
                              border: `1px solid ${ws === 'expired' ? 'rgba(220,38,38,0.3)' : 'rgba(245,158,11,0.3)'}`,
                              whiteSpace: 'nowrap'
                            }}>
                              ⚠ {ws === 'expired' ? 'EXPIRED' : 'WARNING'}
                            </span>
                          );
                        })()}
                      </div>
                    </td>
                    <td style={{textAlign: 'right'}}>
                      <Link href={`/asset/${agent.id}`} className={styles.detailsBtn}>Details</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Logs, Charts, Quick Actions */}
        <div className={styles.rightColumnGrid}>
          
          <div className={styles.bottomRightGrid}>
            {/* Hardware Analysis / Server Status */}
            <div className={styles.chartCard}>
              <h3 className={styles.cardHeading}>Status Server & Sistem</h3>
              <div className={styles.chartItem} style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>CPU (Processor)</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: Number(serverStats.cpuUsagePercent) > 80 ? '#dc2626' : '#10b981' }}>
                    {serverStats.cpuUsagePercent}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', marginTop: '0.5rem', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${serverStats.cpuUsagePercent}%`, background: Number(serverStats.cpuUsagePercent) > 80 ? '#ef4444' : '#10b981', borderRadius: '4px' }}></div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.35rem' }}>
                  {serverStats.cpuModel} ({serverStats.cpuCores} Cores)
                </div>
              </div>
              <div className={styles.chartItem} style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Memory (RAM)</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: Number(serverStats.memUsagePercent) > 80 ? '#dc2626' : '#10b981' }}>
                    {serverStats.memUsagePercent}%
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', marginTop: '0.5rem', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${serverStats.memUsagePercent}%`, background: Number(serverStats.memUsagePercent) > 80 ? '#ef4444' : '#10b981', borderRadius: '4px' }}></div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.35rem' }}>
                  {serverStats.memUsedGB} GB / {serverStats.memTotalGB} GB Digunakan
                </div>
              </div>
              <div className={styles.chartItem}>
                <span>Ukuran Database (SQLite)</span>
                <div style={{ fontSize: '1.25rem', color: '#1f2937', fontWeight: 800, marginTop: '0.25rem' }}>
                  {serverStats.dbSizeMB} <span style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: 600 }}>MB</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.actionsCard}>
              <h3 className={styles.cardHeading}>Tindakan Cepat</h3>
              <div className={styles.actionsList}>
                <button onClick={handleAddManual} className={`${styles.quickBtn} ${styles.btnPrimary}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Tambah Aset Manual
                </button>
                <button onClick={handleScanBarcode} className={`${styles.quickBtn} ${styles.btnSecondary}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
                  Pindai Barcode
                </button>
                <button onClick={handleCetakLabel} className={`${styles.quickBtn} ${styles.btnSuccess}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                  Cetak Label
                </button>
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className={styles.logsCard}>
            <h3 className={styles.cardHeading}>Ringkasan Log Perubahan Terbaru</h3>
            <div className={styles.timelineContainer}>
              {logs.slice(0, 3).map((log, i) => (
                <div key={log.id} className={styles.timelineItem}>
                  <div className={styles.timelineDot} style={{ background: log.action === 'CREATED' ? 'var(--accent-success)' : 'var(--accent-primary)' }}></div>
                  <div className={styles.timelineContent}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={styles.logActionBadge} style={{ background: log.action === 'CREATED' ? '#d1fae5' : log.action === 'DELETED' ? '#fee2e2' : '#dbeafe', color: log.action === 'CREATED' ? '#059669' : log.action === 'DELETED' ? '#dc2626' : '#2563eb' }}>
                        {log.action === 'CREATED' ? 'DIBUAT' : log.action === 'UPDATED' ? 'DIUPDATE' : 'DIHAPUS'}
                      </span>
                      <span className={styles.logTime}>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className={styles.logDesc}>Aset <strong style={{textTransform:'uppercase'}}>{log.agentId}</strong> telah {log.action === 'CREATED' ? 'ditambahkan' : log.action === 'UPDATED' ? 'diperbarui' : 'dihapus'}.</p>
                    <div className={styles.logSource}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      {log.source.split(':')[1] || 'System'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
