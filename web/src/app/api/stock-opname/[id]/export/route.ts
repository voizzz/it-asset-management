import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import ExcelJS from 'exceljs';

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');
  if (!sessionCookie) return null;
  return verifySession(sessionCookie.value);
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getSession();
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = await getDb();

  const session = await db.get(`SELECT * FROM StockOpname WHERE id = ?`, [id]);
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const items = await db.all(`SELECT * FROM StockOpnameItem WHERE opnameId = ? ORDER BY status DESC, hostname ASC`, [id]);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Laporan Stock Opname');

  // Add Session Info Header
  sheet.addRow(['Laporan Stock Opname']);
  sheet.addRow(['Nama Sesi:', session.name]);
  sheet.addRow(['Dibuat Oleh:', session.createdBy]);
  sheet.addRow(['Tanggal Dibuat:', new Date(session.createdAt).toLocaleDateString('id-ID')]);
  sheet.addRow(['Tanggal Selesai:', session.completedAt ? new Date(session.completedAt).toLocaleDateString('id-ID') : '-']);
  sheet.addRow(['Status Sesi:', session.status]);
  sheet.addRow([]);

  // Add Summary Stats
  sheet.addRow(['Total Aset:', session.totalItems]);
  sheet.addRow(['✅ Ditemukan:', session.foundItems]);
  sheet.addRow(['❌ Tidak Ditemukan:', session.missingItems]);
  sheet.addRow([]);

  // Add Table Headers
  const headerRow = sheet.addRow([
    'Hostname', 'Kategori', 'Lokasi', 'Pengguna', 'Brand', 'Model', 'Serial Number', 'Status Verifikasi', 'Catatan', 'Dicek Oleh', 'Waktu Cek'
  ]);
  
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' } // Indigo color
  };

  // Add Items
  items.forEach(item => {
    sheet.addRow([
      item.hostname || '-',
      item.category || '-',
      item.location || '-',
      item.currentUser || '-',
      item.brand || '-',
      item.model || '-',
      item.serialNumber || '-',
      item.status === 'Found' ? 'Ditemukan' : item.status === 'Missing' ? 'Tidak Ada' : 'Pending',
      item.notes || '-',
      item.checkedBy || '-',
      item.checkedAt ? new Date(item.checkedAt).toLocaleString('id-ID') : '-'
    ]);
  });

  // Auto-fit columns
  sheet.columns.forEach(column => {
    let maxLen = 10;
    column.eachCell!({ includeEmpty: true }, cell => {
      const colLen = cell.value ? cell.value.toString().length : 10;
      if (colLen > maxLen) {
        maxLen = colLen;
      }
    });
    column.width = maxLen + 2;
  });

  const buffer = await workbook.xlsx.writeBuffer();

  const response = new NextResponse(buffer as any);
  response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  response.headers.set('Content-Disposition', `attachment; filename="Stock_Opname_${session.name.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx"`);
  
  return response;
}
