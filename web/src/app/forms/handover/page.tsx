'use client';
import { useState, useEffect } from 'react';
import styles from '../../page.module.css';
import Sidebar from '@/components/Sidebar';

export default function HandoverFormPage() {
  const [logoName, setLogoName] = useState('ITAM');
  const [assets, setAssets] = useState<any[]>([]);
  const [category, setCategory] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [handoverDate, setHandoverDate] = useState('');

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  useEffect(() => {
    fetch('/api/settings/get').then(r => r.json()).then(d => { if (d.logoName) setLogoName(d.logoName); });
    fetch('/api/assets/list').then(r => r.json()).then(d => setAssets(d.assets || []));
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
            <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-heading)', marginBottom: '0.5rem' }}>Serah Terima Barang</h2>
            <p className={styles.subtitle}>Formulir bukti serah terima aset perusahaan.</p>
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
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>Berita Acara Serah Terima Barang</h1>
          </div>

          <div className="no-print" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontWeight: 600 }}>Pilih Tanggal:</span>
            <input 
              type="date" 
              value={handoverDate}
              onChange={(e) => setHandoverDate(e.target.value)}
              style={{ border: '1px solid #ccc', padding: '0.5rem', borderRadius: '4px', fontSize: '15px' }} 
            />
          </div>

          <div style={{ marginBottom: '2rem', fontSize: '15px', lineHeight: '1.6' }}>
            <p>Pada hari ini {handoverDate ? <strong>{days[new Date(handoverDate).getDay()]}</strong> : '_______________________'} tanggal {handoverDate ? <strong>{new Date(handoverDate).getDate()}</strong> : '_______________________'} bulan {handoverDate ? <strong>{months[new Date(handoverDate).getMonth()]}</strong> : '_______________________'} tahun {handoverDate ? <strong>{new Date(handoverDate).getFullYear()}</strong> : '_______________________'}, telah dilakukan serah terima barang dengan rincian sebagai berikut:</p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Pihak Pertama (Yang Menyerahkan)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Nama Lengkap</span>
              <input type="text" style={{ border: 'none', borderBottom: '1px dotted #999', width: '100%', outline: 'none', fontSize: '15px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Departemen</span>
              <input type="text" style={{ border: 'none', borderBottom: '1px dotted #999', width: '100%', outline: 'none', fontSize: '15px' }} />
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Pihak Kedua (Yang Menerima)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Nama Lengkap</span>
              <input type="text" style={{ border: 'none', borderBottom: '1px dotted #999', width: '100%', outline: 'none', fontSize: '15px' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Departemen</span>
              <input type="text" style={{ border: 'none', borderBottom: '1px dotted #999', width: '100%', outline: 'none', fontSize: '15px' }} />
            </div>
          </div>

          <div style={{ marginBottom: '3rem' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Detail Barang / Aset</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Nama Aset</span>
              <input 
                type="text" 
                list="assets-list"
                onChange={(e) => {
                  const val = e.target.value;
                  const selected = assets.find(a => a.hostname === val);
                  if (selected) {
                    setCategory(selected.category || '');
                    setModel(selected.model || selected.brand || '');
                    setSerialNumber(selected.serialNumber || '');
                  }
                }}
                style={{ border: 'none', borderBottom: '1px dotted #999', width: '100%', outline: 'none', fontSize: '15px' }} 
              />
              <datalist id="assets-list">
                {assets.map(a => (
                  <option key={a.id} value={a.hostname}>{a.model || a.brand || ''}</option>
                ))}
              </datalist>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Kategori Aset</span>
              <input 
                type="text" 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{ border: 'none', borderBottom: '1px dotted #999', width: '100%', outline: 'none', fontSize: '15px' }} 
                placeholder="Laptop, PC, Monitor, dll" 
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Merk / Model</span>
              <input 
                type="text" 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                style={{ border: 'none', borderBottom: '1px dotted #999', width: '100%', outline: 'none', fontSize: '15px' }} 
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Serial Number</span>
              <input 
                type="text" 
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                style={{ border: 'none', borderBottom: '1px dotted #999', width: '100%', outline: 'none', fontSize: '15px' }} 
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Kelengkapan</span>
              <input type="text" style={{ border: 'none', borderBottom: '1px dotted #999', width: '100%', outline: 'none', fontSize: '15px' }} placeholder="Charger, Mouse, Tas, dll" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Keterangan</span>
              <input type="text" style={{ border: 'none', borderBottom: '1px dotted #999', width: '100%', outline: 'none', fontSize: '15px' }} placeholder="Kondisi barang saat diserahkan" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4rem', textAlign: 'center' }}>
            <div>
              <p style={{ marginBottom: '5rem' }}>Pihak Pertama<br/><span style={{ fontSize: '12px', color: '#666' }}>(Yang Menyerahkan)</span></p>
              <p style={{ borderTop: '1px solid #000', paddingTop: '0.5rem', width: '200px', margin: '0 auto' }}>(........................................)</p>
            </div>
            <div>
              <p style={{ marginBottom: '5rem' }}>Pihak Kedua<br/><span style={{ fontSize: '12px', color: '#666' }}>(Yang Menerima)</span></p>
              <p style={{ borderTop: '1px solid #000', paddingTop: '0.5rem', width: '200px', margin: '0 auto' }}>(........................................)</p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
