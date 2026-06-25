'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../app/page.module.css';
import LogoutButton from './LogoutButton';

export default function Sidebar({ logoName }: { logoName: string }) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(pathname === '/settings');
  const [activeHash, setActiveHash] = useState('profile');
  const [reportsOpen, setReportsOpen] = useState(pathname === '/reports');
  const [activeReportHash, setActiveReportHash] = useState('assets');
  const safePathname = pathname || '';
  const [formsOpen, setFormsOpen] = useState(safePathname.startsWith('/forms'));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (pathname === '/settings') {
        const hash = window.location.hash.replace('#', '') || 'profile';
        setActiveHash(current => hash !== current ? hash : current);
      }
      if (pathname === '/reports') {
        const hash = window.location.hash.replace('#', '') || 'assets';
        setActiveReportHash(current => hash !== current ? hash : current);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [pathname]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <aside className={styles.sidebar}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div className={styles.logo} style={{ fontSize: logoName.length > 10 ? '1.5rem' : '2rem' }}>
          {(() => {
            const words = logoName.trim().split(' ');
            if (words.length > 1) {
              const lastWord = words.pop();
              const rest = words.join(' ');
              return (
                <>
                  {rest} <span style={{ display: 'block' }}>{lastWord}</span>
                </>
              );
            }
            return (
              <>
                {logoName.substring(0, logoName.length - 2)}<span>{logoName.substring(logoName.length - 2)}</span>
              </>
            );
          })()}
        </div>
        
        {/* Mobile Hamburger Button */}
        <button 
          className={styles.mobileMenuBtn}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isMobileMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </>
            )}
          </svg>
        </button>
      </div>
      <nav className={`${styles.nav} ${isMobileMenuOpen ? styles.navOpen : ''}`}>
        <Link href="/" className={`${styles.navItem} ${pathname === '/' ? styles.active : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
          Dashboard
        </Link>
        <Link href="/assets" className={`${styles.navItem} ${safePathname.startsWith('/asset') ? styles.active : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
          Assets
        </Link>
        <Link href="/logs" className={`${styles.navItem} ${safePathname.startsWith('/logs') ? styles.active : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><polyline points="14 2 14 8 20 8"/><path d="M2 15h10"/><path d="M9 18l3-3-3-3"/></svg>
          Logs
        </Link>
        <Link href="/employees" className={`${styles.navItem} ${safePathname.startsWith('/employees') ? styles.active : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Employees
        </Link>
        <Link href="/software" className={`${styles.navItem} ${safePathname.startsWith('/software') ? styles.active : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
          Software
        </Link>
        <Link href="/consumables" className={`${styles.navItem} ${safePathname.startsWith('/consumables') ? styles.active : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          Consumables
        </Link>
        <Link href="/stock-opname" className={`${styles.navItem} ${safePathname.startsWith('/stock-opname') ? styles.active : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          Stock Opname
        </Link>
        <Link href="/tickets" className={`${styles.navItem} ${pathname === '/tickets' || safePathname.startsWith('/tickets/') ? styles.active : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
          Tickets
        </Link>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div 
            onClick={() => setFormsOpen(!formsOpen)} 
            className={`${styles.navItem} ${safePathname.startsWith('/forms') ? styles.active : ''}`}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            <span style={{ marginLeft: '8px' }}>Formulir</span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s ease', transform: formsOpen ? 'rotate(90deg)' : 'none' }}><polyline points="9 18 15 12 9 6"></polyline></svg>
            </span>
          </div>
          {formsOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
              <Link href="/forms/handover" className={`${styles.navItem} ${pathname === '/forms/handover' ? styles.active : ''}`} style={{ padding: '0.5rem 1rem 0.5rem 3.2rem', fontSize: '0.85rem' }}>Serah Terima Barang</Link>
              <Link href="/forms/inspection" className={`${styles.navItem} ${pathname === '/forms/inspection' ? styles.active : ''}`} style={{ padding: '0.5rem 1rem 0.5rem 3.2rem', fontSize: '0.85rem' }}>Device Inspection</Link>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div 
            onClick={() => {
              if (pathname !== '/reports') {
                window.location.href = '/reports#assets';
              } else {
                setReportsOpen(!reportsOpen);
              }
            }} 
            className={`${styles.navItem} ${pathname === '/reports' ? styles.active : ''}`}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            <span style={{ marginLeft: '8px' }}>Reports</span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s ease', transform: reportsOpen ? 'rotate(90deg)' : 'none' }}><polyline points="9 18 15 12 9 6"></polyline></svg>
            </span>
          </div>
          {reportsOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
              <a href="/reports#assets" className={`${styles.navItem} ${pathname === '/reports' && activeReportHash === 'assets' ? styles.active : ''}`} style={{ padding: '0.5rem 1rem 0.5rem 3.2rem', fontSize: '0.85rem' }}>Report Assets</a>
              <a href="/reports#tickets" className={`${styles.navItem} ${pathname === '/reports' && activeReportHash === 'tickets' ? styles.active : ''}`} style={{ padding: '0.5rem 1rem 0.5rem 3.2rem', fontSize: '0.85rem' }}>Report Ticketing</a>
              <a href="/reports#consumables" className={`${styles.navItem} ${pathname === '/reports' && activeReportHash === 'consumables' ? styles.active : ''}`} style={{ padding: '0.5rem 1rem 0.5rem 3.2rem', fontSize: '0.85rem' }}>Report Consumables</a>
              <a href="/reports#software" className={`${styles.navItem} ${pathname === '/reports' && activeReportHash === 'software' ? styles.active : ''}`} style={{ padding: '0.5rem 1rem 0.5rem 3.2rem', fontSize: '0.85rem' }}>Report Software</a>
              <a href="/reports#licenses" className={`${styles.navItem} ${pathname === '/reports' && activeReportHash === 'licenses' ? styles.active : ''}`} style={{ padding: '0.5rem 1rem 0.5rem 3.2rem', fontSize: '0.85rem' }}>Report Licenses</a>
            </div>
          )}
        </div>
        <Link href="/scan" className={`${styles.navItem} ${pathname === '/scan' ? styles.active : ''}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle><line x1="12" y1="9" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="15"></line><line x1="9" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="15" y2="12"></line></svg>
          Discovery
        </Link>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div 
            onClick={() => setSettingsOpen(!settingsOpen)} 
            className={`${styles.navItem} ${pathname === '/settings' ? styles.active : ''}`}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            <span style={{ marginLeft: '8px' }}>Settings</span>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.2s ease', transform: settingsOpen ? 'rotate(90deg)' : 'none' }}><polyline points="9 18 15 12 9 6"></polyline></svg>
            </span>
          </div>
          {settingsOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
              <a href="/settings#general" className={`${styles.navItem} ${pathname === '/settings' && activeHash === 'general' ? styles.active : ''}`} style={{ padding: '0.5rem 1rem 0.5rem 3.2rem', fontSize: '0.85rem' }}>General Config</a>
              <a href="/settings#agent" className={`${styles.navItem} ${pathname === '/settings' && activeHash === 'agent' ? styles.active : ''}`} style={{ padding: '0.5rem 1rem 0.5rem 3.2rem', fontSize: '0.85rem' }}>Agent Config</a>
              <a href="/settings#account" className={`${styles.navItem} ${pathname === '/settings' && activeHash === 'account' ? styles.active : ''}`} style={{ padding: '0.5rem 1rem 0.5rem 3.2rem', fontSize: '0.85rem' }}>Accounts</a>
            </div>
          )}
        </div>
      </nav>

      <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', position: 'relative', zIndex: 10 }}>
        <LogoutButton className={styles.actionBtn} style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)' }} />
      </div>
    </aside>
  );
}
