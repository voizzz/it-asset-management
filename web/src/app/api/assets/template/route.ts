import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Assets');

    // Define columns
    sheet.columns = [
      { header: 'Hostname*', key: 'hostname', width: 25 },
      { header: 'Kategori*', key: 'category', width: 20 },
      { header: 'Brand', key: 'brand', width: 20 },
      { header: 'Model', key: 'model', width: 25 },
      { header: 'Serial Number', key: 'serialNumber', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Lokasi', key: 'location', width: 20 },
      { header: 'Real User', key: 'realUser', width: 25 },
      { header: 'OS User', key: 'currentUser', width: 20 },
      { header: 'Ext / IP Phone', key: 'extension', width: 15 },
      { header: 'IP Address', key: 'ipAddress', width: 20 },
      { header: 'MAC Address', key: 'macAddress', width: 20 },
      { header: 'Operating System', key: 'os', width: 25 },
      { header: 'CPU', key: 'cpu', width: 25 },
      { header: 'GPU', key: 'gpu', width: 25 },
      { header: 'Motherboard', key: 'motherboard', width: 25 },
      { header: 'RAM (MB)', key: 'ramMb', width: 15 },
      { header: 'Storage (GB)', key: 'diskGb', width: 15 },
      { header: 'Tgl Pembelian (YYYY-MM-DD)', key: 'purchaseDate', width: 30 },
      { header: 'Garansi (Bulan)', key: 'warrantyMonths', width: 20 },
      { header: 'Notes', key: 'notes', width: 40 },
    ];

    // Add instructions row
    sheet.addRow({
      hostname: 'DESKTOP-IT-01',
      category: 'PC',
      brand: 'Lenovo',
      model: 'ThinkCentre M720q',
      serialNumber: 'LNV12345XYZ',
      status: 'in-use',
      location: 'Ruang IT',
      realUser: 'Budi Santoso',
      currentUser: 'IT-Admin',
      extension: '',
      ipAddress: '192.168.1.50',
      macAddress: '00:1A:2B:3C:4D:5E',
      os: 'Windows 11 Pro',
      cpu: 'Intel Core i5-10400',
      gpu: 'Intel UHD Graphics 630',
      motherboard: 'Lenovo 314A',
      ramMb: 8192,
      diskGb: 256,
      purchaseDate: '2023-01-15',
      warrantyMonths: 36,
      notes: 'Contoh pengisian data. Hapus baris ini sebelum diupload.'
    });

    // Style the header
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' } // Tailwind blue-900
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Create buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="ITAM_Import_Template.xlsx"'
      }
    });

  } catch (error) {
    console.error('Template generation error:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
