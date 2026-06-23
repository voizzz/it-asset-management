'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function LogsSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        router.push(`/logs?q=${encodeURIComponent(query)}`);
      } else {
        router.push(`/logs`);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, router]);

  return (
    <div style={{ position: 'relative', width: '350px' }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}>
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input 
        type="text" 
        placeholder="Search logs (action, ID, actor, changes)..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: '100%',
          padding: '0.6rem 1rem 0.6rem 2.5rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          outline: 'none',
          fontSize: '0.9rem',
          transition: 'all 0.2s ease',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
      />
    </div>
  );
}
