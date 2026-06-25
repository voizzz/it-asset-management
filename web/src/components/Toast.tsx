'use client';
import { useState, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastEvent {
  message: string;
  type: ToastType;
}

// Global event emitter for toasts
export const toast = {
  success: (message: string) => window.dispatchEvent(new CustomEvent<ToastEvent>('itam-toast', { detail: { message, type: 'success' } })),
  error: (message: string) => window.dispatchEvent(new CustomEvent<ToastEvent>('itam-toast', { detail: { message, type: 'error' } })),
  info: (message: string) => window.dispatchEvent(new CustomEvent<ToastEvent>('itam-toast', { detail: { message, type: 'info' } })),
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<(ToastEvent & { id: number })[]>([]);

  useEffect(() => {
    const handleToast = (e: CustomEvent<ToastEvent> | Event) => {
      const customEvent = e as CustomEvent<ToastEvent>;
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { ...customEvent.detail, id }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };

    window.addEventListener('itam-toast', handleToast);
    return () => window.removeEventListener('itam-toast', handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : '#3b82f6',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.9rem',
          fontWeight: 600,
          animation: 'slideInToast 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          opacity: 0.95
        }}>
          {t.type === 'success' && <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>}
          {t.type === 'error' && <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>}
          {t.type === 'info' && <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
          {t.message}
        </div>
      ))}
      <style>{`
        @keyframes slideInToast {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
