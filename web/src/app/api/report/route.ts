import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function getWarrantyInfo(purchaseDate: string, warrantyMonths: number): { label: string; color: string } {
  const purchase = new Date(purchaseDate);
  if (isNaN(purchase.getTime())) return { label: '-', color: '#6b7280' };
  const expiry = new Date(purchase);
  expiry.setMonth(expiry.getMonth() + warrantyMonths);
  const diff = expiry.getTime() - new Date().getTime();
  const daysLeft = Math.ceil(diff / (24 * 60 * 60 * 1000));
  if (daysLeft < 0) return { label: `Expired (${Math.abs(daysLeft)}d ago)`, color: '#dc2626' };
  if (daysLeft <= 30) return { label: `⚠ ${daysLeft}d left`, color: '#d97706' };
  return { label: `✓ ${daysLeft}d left`, color: '#059669' };
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  online:   { bg: '#d1fae5', color: '#065f46' },
  'in-use': { bg: '#dbeafe', color: '#1e3a8a' },
  offline:  { bg: '#fee2e2', color: '#7f1d1d' },
  broken:   { bg: '#fee2e2', color: '#7f1d1d' },
  repair:   { bg: '#fef3c7', color: '#78350f' },
  spare:    { bg: '#ede9fe', color: '#4c1d95' },
};

export async function GET() {
  const db = await getDb();
  const agents = await db.all(`SELECT * FROM Agent ORDER BY category, hostname ASC`);

  const total = agents.length;
  const online = agents.filter(a => ['online', 'in-use'].includes(a.status)).length;
  const offline = agents.filter(a => a.status === 'offline').length;
  const broken = agents.filter(a => a.status === 'broken').length;
  const repair = agents.filter(a => a.status === 'repair').length;
  const spare = agents.filter(a => a.status === 'spare').length;

  const now = new Date();
  const threshold = 30 * 24 * 60 * 60 * 1000;

  const expiredAgents = agents.filter(a => {
    if (!a.purchaseDate || !a.warrantyMonths) return false;
    const exp = new Date(a.purchaseDate);
    exp.setMonth(exp.getMonth() + a.warrantyMonths);
    return exp.getTime() < now.getTime();
  });
  const warningAgents = agents.filter(a => {
    if (!a.purchaseDate || !a.warrantyMonths) return false;
    const exp = new Date(a.purchaseDate);
    exp.setMonth(exp.getMonth() + a.warrantyMonths);
    const diff = exp.getTime() - now.getTime();
    return diff >= 0 && diff <= threshold;
  });

  const categories: Record<string, number> = {};
  for (const a of agents) {
    const cat = (a.category || 'PC').toUpperCase();
    categories[cat] = (categories[cat] || 0) + 1;
  }

  const reportDate = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const reportTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const refId = `ITAM-RPT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;

  const tableRows = agents.map((a, i) => {
    const sc = STATUS_COLORS[a.status] || { bg: '#f3f4f6', color: '#374151' };
    let warrantyCell = '<span style="color:#9ca3af">-</span>';
    if (a.purchaseDate && a.warrantyMonths) {
      const wi = getWarrantyInfo(a.purchaseDate, a.warrantyMonths);
      warrantyCell = `<span style="color:${wi.color};font-weight:600;font-size:10px;text-transform:uppercase">${wi.label}</span>`;
    }
    return `
      <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'}">
        <td style="padding:7px 8px;color:#9ca3af;font-size:10px;text-align:center">${i + 1}</td>
        <td style="padding:7px 8px;font-weight:700;color:#111827;font-size:11px;text-transform:uppercase">${a.hostname}</td>
        <td style="padding:7px 8px">
          <span style="background:${sc.bg};color:${sc.color};padding:2px 7px;border-radius:20px;font-size:9px;font-weight:700;white-space:nowrap;display:inline-block">
            ${(a.status || 'in-use').toUpperCase()}
          </span>
        </td>
        <td style="padding:7px 8px;font-size:10px">${warrantyCell}</td>
        <td style="padding:7px 8px;color:#374151;font-size:11px;text-transform:uppercase">${a.category || 'PC'}</td>
        <td style="padding:7px 8px;color:#374151;font-size:11px;text-transform:uppercase">${a.brand || '-'}</td>
        <td style="padding:7px 8px;color:#374151;font-size:11px;text-transform:uppercase">${a.model || '-'}</td>
        <td style="padding:7px 8px;color:#6b7280;font-size:10px;font-family:monospace;text-transform:uppercase">${a.serialNumber || '-'}</td>
        <td style="padding:7px 8px;color:#6b7280;font-size:10px;font-family:monospace">${a.ipAddress || '-'}</td>
      </tr>`;
  }).join('');

  const statusBreakdown = [
    { label: 'Online',   count: agents.filter(a => a.status === 'online').length,   color: '#059669', bg: '#d1fae5' },
    { label: 'In-Use',  count: agents.filter(a => a.status === 'in-use').length,    color: '#1d4ed8', bg: '#dbeafe' },
    { label: 'Spare',   count: spare,   color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Offline', count: offline, color: '#dc2626', bg: '#fee2e2' },
    { label: 'Repair',  count: repair,  color: '#d97706', bg: '#fef3c7' },
    { label: 'Broken',  count: broken,  color: '#dc2626', bg: '#fee2e2' },
  ];

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>ITAM Report — ${refId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #f1f5f9; color: #111827; font-size: 13px; }

    /* ── Letter page wrapper ── */
    .letter {
      width: 8.5in;
      min-height: 11in;
      margin: 32px auto;
      background: white;
      padding: 0.55in 0.65in 0.55in 0.65in;
      box-shadow: 0 4px 40px rgba(0,0,0,0.12);
    }

    /* ── Header ── */
    .rpt-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding-bottom: 16px; margin-bottom: 22px;
      border-bottom: 2.5px solid #0f172a;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(135deg, #1e40af, #7c3aed);
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 800; font-size: 15px; flex-shrink: 0;
    }
    .brand-name { font-size: 18px; font-weight: 800; letter-spacing: -0.4px; }
    .brand-sub { font-size: 11px; color: #6b7280; margin-top: 1px; }
    .rpt-meta { text-align: right; }
    .rpt-badge { font-size: 10px; font-weight: 700; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; }
    .rpt-date { font-size: 11px; color: #6b7280; margin-top: 3px; }
    .rpt-ref { font-size: 10px; color: #9ca3af; margin-top: 2px; font-family: monospace; }

    /* ── Section label ── */
    .sec { font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 1.5px;
           padding-left: 8px; border-left: 3px solid #1e40af; margin-bottom: 10px; }

    /* ── Stat cards row ── */
    .stat-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
    .stat-card { border-radius: 10px; padding: 14px 16px; border: 1px solid #e5e7eb; }
    .stat-label { font-size: 9px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.7px; }
    .stat-val { font-size: 28px; font-weight: 800; letter-spacing: -1px; margin-top: 4px; line-height: 1; }
    .stat-sub { font-size: 10px; color: #9ca3af; margin-top: 3px; }

    /* ── Two-column mini tables ── */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
    .mini-card { border-radius: 10px; border: 1px solid #e5e7eb; overflow: hidden; }
    .mini-card-header { padding: 10px 14px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; }
    .mini-table { width: 100%; border-collapse: collapse; }
    .mini-table th { padding: 6px 10px; font-size: 9px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.7px; text-align: left; }
    .mini-table td { padding: 6px 10px; font-size: 11px; border-top: 1px solid #f3f4f6; }

    /* ── Warranty alerts ── */
    .warranty-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
    .alert-card { border-radius: 10px; border: 1px solid #e5e7eb; overflow: hidden; }
    .alert-card.expired { border-left: 4px solid #dc2626; }
    .alert-card.warning { border-left: 4px solid #d97706; }
    .alert-body { padding: 12px 14px; }
    .alert-title { font-size: 11px; font-weight: 700; margin-bottom: 5px; }
    .alert-chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .chip { font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }

    /* ── Main asset table ── */
    .asset-table-wrap { border-radius: 10px; border: 1px solid #e5e7eb; overflow: hidden; margin-bottom: 20px; }
    .asset-table { width: 100%; border-collapse: collapse; }
    .asset-table th {
      background: #0f172a; color: #cbd5e1;
      padding: 8px 10px; font-size: 9px; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.7px; text-align: left;
    }
    .asset-table td { border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .asset-table tr:last-child td { border-bottom: none; }

    /* ── Footer ── */
    .rpt-footer {
      border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 4px;
      display: flex; justify-content: space-between; align-items: center;
    }
    .footer-txt { font-size: 9px; color: #9ca3af; }

    /* ── Print button (hidden on print) ── */
    .print-btn {
      position: fixed; bottom: 24px; right: 24px;
      padding: 11px 22px; border-radius: 10px; border: none;
      background: linear-gradient(135deg, #1e40af, #7c3aed);
      color: white; font-weight: 700; font-size: 14px;
      cursor: pointer; box-shadow: 0 4px 18px rgba(30,64,175,0.4);
      display: flex; align-items: center; gap: 8px;
      font-family: 'Inter', sans-serif;
    }
    .print-btn:hover { opacity: 0.9; }

    @page { size: letter portrait; margin: 0; }
    @media print {
      body { background: white; }
      .letter { margin: 0; box-shadow: none; width: 100%; min-height: auto; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>

<div class="letter">

  <!-- HEADER -->
  <div class="rpt-header">
    <div class="brand">
      <div class="brand-icon">IT</div>
      <div>
        <div class="brand-name">IT Asset Management</div>
        <div class="brand-sub">Summary Report — Seluruh Aset Terdaftar</div>
      </div>
    </div>
    <div class="rpt-meta">
      <div class="rpt-badge">📄 Official Report</div>
      <div class="rpt-date">${reportDate}, ${reportTime}</div>
      <div class="rpt-ref">REF: ${refId}</div>
    </div>
  </div>

  <!-- OVERVIEW STATS -->
  <div class="sec">Overview</div>
  <div class="stat-row">
    <div class="stat-card" style="border-top:3px solid #1e40af">
      <div class="stat-label">Total Aset</div>
      <div class="stat-val" style="color:#1e40af">${total}</div>
      <div class="stat-sub">Semua perangkat terdaftar</div>
    </div>
    <div class="stat-card" style="border-top:3px solid #059669">
      <div class="stat-label">Aktif (Online / In-Use)</div>
      <div class="stat-val" style="color:#059669">${online}</div>
      <div class="stat-sub">Sedang digunakan</div>
    </div>
    <div class="stat-card" style="border-top:3px solid #7c3aed">
      <div class="stat-label">Tersedia (Spare)</div>
      <div class="stat-val" style="color:#7c3aed">${spare}</div>
      <div class="stat-sub">Siap dialokasikan</div>
    </div>
    <div class="stat-card" style="border-top:3px solid #dc2626">
      <div class="stat-label">Offline / Terkendala</div>
      <div class="stat-val" style="color:#dc2626">${offline + broken + repair}</div>
      <div class="stat-sub">${offline} Offline, ${broken} Rusak, ${repair} Servis</div>
    </div>
  </div>

  <!-- CATEGORY + STATUS BREAKDOWN -->
  <div class="two-col">
    <div class="mini-card">
      <div class="mini-card-header"><div class="sec" style="margin-bottom:0">Distribusi per Kategori</div></div>
      <table class="mini-table">
        <thead><tr><th>Kategori</th><th style="text-align:center">Jumlah</th><th style="text-align:center">%</th></tr></thead>
        <tbody>
          ${Object.entries(categories).map(([cat, count]) => `
          <tr>
            <td style="font-weight:500;color:#374151">${cat}</td>
            <td style="text-align:center;font-weight:700;color:#111827">${count}</td>
            <td style="text-align:center;color:#9ca3af">${((count / total) * 100).toFixed(1)}%</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div class="mini-card">
      <div class="mini-card-header"><div class="sec" style="margin-bottom:0">Distribusi per Status</div></div>
      <table class="mini-table">
        <thead><tr><th>Status</th><th style="text-align:center">Jumlah</th><th style="text-align:center">%</th></tr></thead>
        <tbody>
          ${statusBreakdown.map(s => `
          <tr>
            <td><span style="background:${s.bg};color:${s.color};padding:2px 9px;border-radius:20px;font-size:9px;font-weight:700">${s.label.toUpperCase()}</span></td>
            <td style="text-align:center;font-weight:700;color:#111827">${s.count}</td>
            <td style="text-align:center;color:#9ca3af">${((s.count / total) * 100).toFixed(1)}%</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <!-- WARRANTY ALERTS (only if there are issues) -->
  ${expiredAgents.length > 0 || warningAgents.length > 0 ? `
  <div class="sec">Status Garansi</div>
  <div class="warranty-row" style="margin-bottom:20px">
    ${expiredAgents.length > 0 ? `
    <div class="alert-card expired">
      <div class="alert-body">
        <div class="alert-title" style="color:#dc2626">🔴 ${expiredAgents.length} Aset — Garansi Sudah Habis</div>
        <div class="alert-chips">
          ${expiredAgents.map(a => `<span class="chip" style="background:#fee2e2;color:#7f1d1d">${a.hostname}</span>`).join('')}
        </div>
      </div>
    </div>` : '<div></div>'}
    ${warningAgents.length > 0 ? `
    <div class="alert-card warning">
      <div class="alert-body">
        <div class="alert-title" style="color:#d97706">🟡 ${warningAgents.length} Aset — Garansi Habis &lt; 30 Hari</div>
        <div class="alert-chips">
          ${warningAgents.map(a => `<span class="chip" style="background:#fef3c7;color:#78350f">${a.hostname}</span>`).join('')}
        </div>
      </div>
    </div>` : '<div></div>'}
  </div>` : ''}

  <!-- FULL ASSET TABLE -->
  <div class="sec">Daftar Lengkap Aset (${total} Perangkat)</div>
  <div class="asset-table-wrap">
    <table class="asset-table">
      <thead>
        <tr>
          <th style="width:24px;text-align:center">#</th>
          <th>Hostname</th>
          <th>Status</th>
          <th>Garansi</th>
          <th>Kategori</th>
          <th>Brand</th>
          <th>Model</th>
          <th>Serial Number</th>
          <th>IP Address</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
  </div>

  <!-- FOOTER -->
  <div class="rpt-footer">
    <div class="footer-txt">© ${now.getFullYear()} IT Asset Management System — Laporan dibuat otomatis oleh sistem</div>
    <div class="footer-txt">Total ${total} aset | ${reportDate} ${reportTime} | REF: ${refId}</div>
  </div>

</div><!-- end .letter -->

<button class="print-btn" onclick="window.print()">
  🖨 Print / Save PDF
</button>

</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
