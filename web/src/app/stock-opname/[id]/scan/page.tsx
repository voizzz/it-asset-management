'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import styles from '../../../page.module.css';

type Item = {
  id: string; agentId: string; hostname: string; serialNumber: string; status: string;
  category: string; brand: string; model: string; realUser: string;
  checkedBy: string | null;
  isAlreadyScanned?: boolean;
};

export default function MobileScannerPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const [sessionName, setSessionName] = useState('Loading Session...');
  const [items, setItems] = useState<Item[]>([]);
  const [scanMessage, setScanMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);
  const [scanResult, setScanResult] = useState<Item | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  
  const scannedCount = items.filter(i => i.status === 'Found').length;

  useEffect(() => {
    setIsClient(true);
    fetchSessionData();
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      const res = await fetch(`/api/stock-opname/${sessionId}`);
      const data = await res.json();
      if (data.session) {
        setSessionName(data.session.name);
      }
      if (data.items) {
        setItems(data.items);
        setTotalCount(data.items.length);
      }
    } catch (e) {
      console.error(e);
      setScanMessage({ text: 'Gagal memuat data sesi', type: 'error' });
    }
  };

  const handleUpdateItem = async (itemId: string, status: string) => {
    await fetch(`/api/stock-opname/${sessionId}/items`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, status, notes: null })
    });
    // Optimistic UI update
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, status } : i));
  };

  const processScannedText = async (text: string) => {
    if (scanResult) return; // Prevent multiple scans while modal is open

    const tokens = text.toLowerCase().split(/[\s\t,;-]+/);
    
    const match = items.find(i => {
      const idMatch = tokens.includes(i.id.toLowerCase()) || i.id.toLowerCase() === text.toLowerCase();
      const hostMatch = i.hostname && (tokens.includes(i.hostname.toLowerCase()) || i.hostname.toLowerCase() === text.toLowerCase());
      const serialMatch = i.serialNumber && (tokens.includes(i.serialNumber.toLowerCase()) || i.serialNumber.toLowerCase() === text.toLowerCase());
      return idMatch || hostMatch || serialMatch;
    });

    if (match) {
    const isAlreadyScanned = match.status === 'Found';
      
      if (!isAlreadyScanned) {
        await handleUpdateItem(match.id, 'Found');
      }
      
      setScanResult({ ...match, isAlreadyScanned });
      
      if ((window as any).__stockScannerInstance) {
        try {
          (window as any).__stockScannerInstance.pause(true);
        } catch (e) {
          console.warn('Could not pause scanner:', e);
        }
      }
    } else {
      setScanMessage({ text: `❌ Aset tidak ditemukan di sesi ini: ${text}`, type: 'error' });
      setTimeout(() => setScanMessage(null), 3000);
    }
  };

  useEffect(() => {
    let scannerInstance: Html5Qrcode | null = null;
    
    if (items.length > 0) {
      const startScanner = async () => {
        try {
          scannerInstance = new Html5Qrcode("mobile-scanner");
          await scannerInstance.start(
            { facingMode: "environment" },
            { fps: 10 }, // Removed qrbox for cleaner native full-screen look
            (decodedText) => {
              processScannedText(decodedText);
            },
            () => {} 
          );
          (window as any).__stockScannerInstance = scannerInstance;
        } catch (err: any) {
          console.error("Scanner Error:", err);
          let errMsg = "Gagal mengakses kamera.";
          const errString = typeof err === 'string' ? err : err?.message || '';
          if (errString.includes('not supported') || errString.includes('NotAllowedError')) {
            errMsg = "Kamera diblokir. Pastikan koneksi menggunakan HTTPS atau localhost (Bukan IP Address http://).";
          }
          setScanMessage({ text: errMsg, type: 'error' });
        }
      };
      startScanner();
    }

    return () => {
      if (scannerInstance) {
        scannerInstance.stop().catch(e => console.error("Error stopping scanner", e)).then(() => scannerInstance?.clear());
        (window as any).__stockScannerInstance = null;
      }
    };
  }, [items.length]); 

  const handleResumeScan = () => {
    setScanResult(null);
    if ((window as any).__stockScannerInstance) {
      try {
        (window as any).__stockScannerInstance.resume();
      } catch (e) {
        console.warn('Could not resume scanner:', e);
      }
    }
  };

  if (!isClient) {
    return <div style={{ height: '100vh', width: '100vw', background: '#000' }} />;
  }

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column' }}>
      <style dangerouslySetInnerHTML={{__html: `
        #mobile-scanner video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
        #mobile-scanner {
          border: none !important;
        }
      `}} />
      
      {/* Header */}
      <div style={{ padding: '1rem', display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', zIndex: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{sessionName}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Progress: {scannedCount} / {totalCount} aset</div>
        </div>
      </div>

      {/* Scanner Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        <div id="mobile-scanner" style={{ width: '100%', height: '100%', background: '#000', position: 'absolute', top: 0, left: 0 }}></div>
        
        {/* Targeting Reticle overlay */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '250px', height: '250px', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '24px', pointerEvents: 'none', zIndex: 5, boxShadow: '0 0 0 4000px rgba(0,0,0,0.5)' }}>
          <div style={{ position: 'absolute', top: '-2px', left: '-2px', width: '40px', height: '40px', borderTop: '4px solid #22c55e', borderLeft: '4px solid #22c55e', borderTopLeftRadius: '24px' }}></div>
          <div style={{ position: 'absolute', top: '-2px', right: '-2px', width: '40px', height: '40px', borderTop: '4px solid #22c55e', borderRight: '4px solid #22c55e', borderTopRightRadius: '24px' }}></div>
          <div style={{ position: 'absolute', bottom: '-2px', left: '-2px', width: '40px', height: '40px', borderBottom: '4px solid #22c55e', borderLeft: '4px solid #22c55e', borderBottomLeftRadius: '24px' }}></div>
          <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '40px', height: '40px', borderBottom: '4px solid #22c55e', borderRight: '4px solid #22c55e', borderBottomRightRadius: '24px' }}></div>
        </div>

        {/* Overlay Message */}
        {scanMessage && !scanResult && (
          <div style={{ 
            position: 'absolute', top: '10%', left: '5%', right: '5%', 
            background: scanMessage.type === 'success' ? 'rgba(34, 197, 94, 0.95)' : 'rgba(239, 68, 68, 0.95)',
            color: 'white', padding: '1rem', borderRadius: '12px', textAlign: 'center',
            fontWeight: 700, fontSize: '1.1rem', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', zIndex: 20,
            animation: 'slideDown 0.3s ease'
          }}>
            {scanMessage.text}
          </div>
        )}

        {/* Success / Already Scanned Modal */}
        {scanResult && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '2rem', borderRadius: '24px', width: '100%', maxWidth: '400px', textAlign: 'center', animation: 'scaleUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
              
              {scanResult.isAlreadyScanned ? (
                <>
                  <div style={{ width: '64px', height: '64px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', color: '#eab308' }}>Sudah di-Scan!</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem', lineHeight: '1.4' }}>
                    Data ini sudah pernah di-scan sebelumnya oleh <strong>{scanResult.checkedBy || 'Sistem'}</strong>.
                  </p>
                </>
              ) : (
                <>
                  <div style={{ width: '64px', height: '64px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '1rem' }}>Aset Ditemukan!</h3>
                </>
              )}
              
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left', border: '1px solid var(--border-color)' }}>
                <div style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.2rem', fontWeight: 600 }}>Asset Name / Hostname</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{scanResult.hostname}</div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.2rem' }}>Brand & Model</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{scanResult.brand || '-'} {scanResult.model || ''}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.2rem' }}>Serial Number</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{scanResult.serialNumber || '-'}</div>
                  </div>
                </div>
                
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.2rem' }}>User (Real Name)</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {scanResult.realUser || 'Unassigned'}
                  </div>
                </div>
              </div>
              
              <div style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '1.5rem' }}>
                {scanResult.isAlreadyScanned ? 'Apakah Anda ingin merubah kembali data ini?' : 'Apakah ada perubahan data pada aset ini?'}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button onClick={() => router.push(`/asset/${scanResult.agentId}?returnToScan=${sessionId}`)} style={{ padding: '1rem', borderRadius: '12px', background: 'var(--accent-primary)', color: 'white', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                  {scanResult.isAlreadyScanned ? 'Ya, Merubah Kembali' : 'Ya, Ubah Data Aset'}
                </button>
                <button onClick={handleResumeScan} style={{ padding: '1rem', borderRadius: '12px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                  Tidak, Lanjut Scan
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', padding: '1.5rem', textAlign: 'center', zIndex: 10 }}>
          <div style={{ fontSize: '0.9rem', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Arahkan kamera ke QR Code atau Barcode.</div>
        </div>
      </div>
    </div>
  );
}
