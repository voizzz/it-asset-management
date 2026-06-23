'use client';
import { useState, useEffect } from 'react';
import styles from '../../page.module.css';
import Sidebar from '@/components/Sidebar';

export default function InspectionFormPage() {
  const [logoName, setLogoName] = useState('ITAM');
  const [items, setItems] = useState([
    'Kondisi Fisik / Casing',
    'Layar / Monitor',
    'Keyboard & Touchpad',
    'Port USB & Display',
    'Kesehatan Baterai (Battery Health)',
    'Sistem Operasi (OS) & Driver',
    'Koneksi Jaringan (Wi-Fi / LAN)',
    'Webcam & Microphone',
    'Speaker / Audio',
    'Kelengkapan Charger / Adaptor'
  ]);

  useEffect(() => {
    fetch('/api/settings/get').then(r => r.json()).then(d => { if (d.logoName) setLogoName(d.logoName); });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.dashboard}>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          aside { display: none !important; }
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-container { 
            width: 100% !important; 
            margin: 0 !important; 
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .main-content {
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}} />
      <Sidebar logoName={logoName} />
      
      <section className={`${styles.main} main-content`}>
        <div className="no-print" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>Device Inspection</h2>
            <p className={styles.subtitle}>Formulir ceklis untuk inspeksi kelayakan aset / perangkat.</p>
          </div>
          <button 
            onClick={handlePrint}
            style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print Form
          </button>
        </div>

        <div className="print-container" style={{ background: 'white', padding: '3rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', color: '#000', maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem', borderBottom: '2px solid #000', paddingBottom: '1rem' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>Device Inspection Checklist</h1>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '14px', color: '#555' }}>Pemeriksaan kondisi aset {logoName}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Tanggal Cek</span>
                <input type="date" style={{ border: 'none', borderBottom: '1px dotted #999', width: '100%', outline: 'none', fontSize: '15px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Nama Aset</span>
                <input type="text" style={{ border: 'none', borderBottom: '1px dotted #999', width: '100%', outline: 'none', fontSize: '15px' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Diperiksa Oleh</span>
                <input type="text" style={{ border: 'none', borderBottom: '1px dotted #999', width: '100%', outline: 'none', fontSize: '15px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Serial Number</span>
                <input type="text" style={{ border: 'none', borderBottom: '1px dotted #999', width: '100%', outline: 'none', fontSize: '15px' }} />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #000' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ border: '1px solid #000', padding: '0.75rem', textAlign: 'left', width: '5%' }}>No</th>
                  <th style={{ border: '1px solid #000', padding: '0.75rem', textAlign: 'left', width: '45%' }}>Item Inspeksi</th>
                  <th style={{ border: '1px solid #000', padding: '0.75rem', textAlign: 'center', width: '10%' }}>Baik</th>
                  <th style={{ border: '1px solid #000', padding: '0.75rem', textAlign: 'center', width: '10%' }}>Rusak</th>
                  <th style={{ border: '1px solid #000', padding: '0.75rem', textAlign: 'left', width: '30%' }}>Keterangan</th>
                  <th className="no-print" style={{ border: '1px solid #000', padding: '0.75rem', textAlign: 'center', width: '5%' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid #000', padding: '0.75rem', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '0.75rem' }}>
                      <input 
                        type="text" 
                        value={item} 
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[i] = e.target.value;
                          setItems(newItems);
                        }}
                        placeholder="Ketik nama item..." 
                        style={{ border: 'none', background: 'transparent', width: '100%', outline: 'none', fontSize: '15px', fontFamily: 'inherit' }} 
                      />
                    </td>
                    <td style={{ border: '1px solid #000', padding: '0.75rem', textAlign: 'center' }}><input type="radio" name={`check_${i}`} /></td>
                    <td style={{ border: '1px solid #000', padding: '0.75rem', textAlign: 'center' }}><input type="radio" name={`check_${i}`} /></td>
                    <td style={{ border: '1px solid #000', padding: '0.75rem' }}><input type="text" style={{ border: 'none', borderBottom: '1px dotted #999', width: '100%', outline: 'none', fontSize: '14px', fontFamily: 'inherit' }} /></td>
                    <td className="no-print" style={{ border: '1px solid #000', padding: '0.75rem', textAlign: 'center' }}>
                      <button 
                        onClick={() => setItems(items.filter((_, idx) => idx !== i))}
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                        title="Hapus baris"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <button 
              className="no-print"
              onClick={() => setItems([...items, ''])}
              style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--bg-secondary)', border: '1px dashed var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Tambah Item Inspeksi Baru
            </button>
          </div>

          <div style={{ marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '0.5rem' }}>Kesimpulan Inspeksi:</h3>
            <textarea style={{ width: '100%', height: '80px', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px', resize: 'none' }} placeholder="Tuliskan catatan tambahan atau rekomendasi di sini..."></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4rem', textAlign: 'center' }}>
            <div>
              <p style={{ marginBottom: '5rem' }}>IT Support / Inspector<br/><span style={{ fontSize: '12px', color: '#666' }}>(Yang Memeriksa)</span></p>
              <p style={{ borderTop: '1px solid #000', paddingTop: '0.5rem', width: '200px', margin: '0 auto' }}>(........................................)</p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
