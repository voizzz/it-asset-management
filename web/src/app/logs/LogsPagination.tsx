'use client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LogsPagination({ totalPages, currentPage }: { totalPages: number, currentPage: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/logs?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5rem', gap: '1rem', marginTop: '1rem' }}>
      <button 
        onClick={() => handlePageChange(currentPage - 1)} 
        disabled={currentPage === 1}
        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: currentPage === 1 ? 'transparent' : 'var(--bg-secondary)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
      >
        Previous
      </button>
      <span style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>{currentPage} / {totalPages}</span>
      <button 
        onClick={() => handlePageChange(currentPage + 1)} 
        disabled={currentPage >= totalPages}
        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: currentPage >= totalPages ? 'transparent' : 'var(--bg-secondary)', color: currentPage >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', fontWeight: 600 }}
      >
        Next
      </button>
    </div>
  );
}
