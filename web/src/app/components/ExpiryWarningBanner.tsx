'use client';

import { useMemo } from 'react';
import Link from 'next/link';

interface Agent {
  hostname: string;
  purchaseDate?: string;
  warrantyMonths?: number | null;
}

export default function ExpiryWarningBanner({ agents }: { agents: Agent[] }) {
  const { expiringAgents, expiredAgents, totalWithWarranty } = useMemo(() => {
    const now = new Date();
    const threshold = 30 * 24 * 60 * 60 * 1000; // 30 days
    const expiring: { hostname: string; daysLeft: number }[] = [];
    const expired: { hostname: string }[] = [];
    let withWarranty = 0;

    agents.forEach((a) => {
      if (!a.purchaseDate || !a.warrantyMonths) return;
      const purchase = new Date(a.purchaseDate);
      if (isNaN(purchase.getTime())) return;
      withWarranty++;
      const expiry = new Date(purchase);
      expiry.setMonth(expiry.getMonth() + (a.warrantyMonths as number));
      const diff = expiry.getTime() - now.getTime();

      if (diff < 0) {
        expired.push({ hostname: a.hostname });
      } else if (diff <= threshold) {
        expiring.push({ hostname: a.hostname, daysLeft: Math.ceil(diff / (24 * 60 * 60 * 1000)) });
      }
    });

    return { expiringAgents: expiring, expiredAgents: expired, totalWithWarranty: withWarranty };
  }, [agents]);

  const hasIssues = expiringAgents.length > 0 || expiredAgents.length > 0;

  return (
    <div style={{
      background: hasIssues
        ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(245, 158, 11, 0.18))'
        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.15))',
      border: `1px solid ${hasIssues ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.3)'}`,
      padding: '1.25rem 1.75rem',
      borderRadius: '16px',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1rem',
    }}>
      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: '12px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hasIssues ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
        border: `1px solid ${hasIssues ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
      }}>
        {hasIssues ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <h3 style={{
          margin: 0, fontSize: '1.05rem', fontWeight: 700, letterSpacing: '-0.01em',
          color: hasIssues ? '#92400e' : '#065f46'
        }}>
          {hasIssues
            ? `Peringatan Garansi — ${expiredAgents.length + expiringAgents.length} aset perlu perhatian`
            : 'Status Garansi — Semua aset aman ✓'}
        </h3>

        {!hasIssues && (
          <p style={{ margin: '0.35rem 0 0', fontSize: '0.88rem', color: '#047857' }}>
            {totalWithWarranty > 0
              ? `${totalWithWarranty} aset memiliki data garansi dan semuanya masih berlaku.`
              : 'Belum ada aset dengan data garansi. Tambahkan tanggal pembelian & durasi garansi di detail aset.'}
          </p>
        )}

        {expiredAgents.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Garansi Sudah Habis:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.3rem' }}>
              {expiredAgents.map((a) => (
                <Link key={a.hostname} href={`/asset/${a.hostname}`} style={{ textDecoration: 'none' }}>
                  <span style={{
                    padding: '0.2rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                    background: 'rgba(239, 68, 68, 0.15)', color: '#b91c1c', border: '1px solid rgba(239, 68, 68, 0.25)',
                    textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.15s',
                    display: 'inline-block',
                  }}>
                    {a.hostname}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {expiringAgents.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Akan Habis dalam 30 Hari:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.3rem' }}>
              {expiringAgents.map((a) => (
                <Link key={a.hostname} href={`/asset/${a.hostname}`} style={{ textDecoration: 'none' }}>
                  <span style={{
                    padding: '0.2rem 0.65rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600,
                    background: 'rgba(245, 158, 11, 0.15)', color: '#92400e', border: '1px solid rgba(245, 158, 11, 0.25)',
                    textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.15s',
                    display: 'inline-block',
                  }}>
                    {a.hostname} ({a.daysLeft}d)
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
