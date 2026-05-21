import { NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import ExcelJS from 'exceljs';

async function getUsername() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (sessionCookie) {
      const payload = await verifySession(sessionCookie.value);
      if (payload && payload.username) return payload.username as string;
    }
  } catch (e) {}
  return 'Unknown';
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return NextResponse.json({ error: 'Excel file is empty' }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date().toISOString();
    const username = await getUsername();
    
    let imported = 0;
    let errors = 0;
    
    // Skip header row
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);

      const hostname = row.getCell(1).text?.trim();
      const category = row.getCell(2).text?.trim();
      
      if (!hostname || !category) {
        errors++;
        continue; // Skip invalid rows
      }

      const safeHostname = hostname.toUpperCase();
      const safeCategory = category.toUpperCase();
      const safeBrand = (row.getCell(3).text || '').trim().toUpperCase();
      const safeModel = (row.getCell(4).text || '').trim().toUpperCase();
      const safeSerial = (row.getCell(5).text || '').trim().toUpperCase();
      
      const status = row.getCell(6).text?.trim().toLowerCase() || 'in-use';
      const location = row.getCell(7).text?.trim() || '';
      const realUser = row.getCell(8).text?.trim() || '';
      const currentUser = row.getCell(9).text?.trim() || '';
      const extension = row.getCell(10).text?.trim() || '';
      const purchaseDate = row.getCell(11).text?.trim() || null;
      
      // Warranty might be a number
      const warrantyCell = row.getCell(12).value;
      const warrantyMonths = warrantyCell ? parseInt(warrantyCell.toString()) : null;
      
      const notes = row.getCell(13).text?.trim() || '';

      const id = safeHostname;

      try {
        await db.run(`
          INSERT INTO Agent (id, hostname, category, brand, model, serialNumber, status, location, realUser, currentUser, extension, purchaseDate, warrantyMonths, notes, createdAt, lastSeen, isManual)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            category=excluded.category,
            brand=excluded.brand,
            model=excluded.model,
            serialNumber=excluded.serialNumber,
            status=excluded.status,
            location=excluded.location,
            realUser=excluded.realUser,
            currentUser=excluded.currentUser,
            extension=excluded.extension,
            purchaseDate=excluded.purchaseDate,
            warrantyMonths=excluded.warrantyMonths,
            notes=excluded.notes
        `, [
          id, safeHostname, safeCategory, safeBrand, safeModel, safeSerial, status, location, realUser, currentUser, extension, purchaseDate, warrantyMonths, notes, now, now, 1
        ]);

        await logAudit(id, 'IMPORTED', `EXCEL_WEB:${username}`, { hostname: safeHostname, category: safeCategory });
        imported++;
      } catch (err) {
        console.error('Row import error:', err);
        errors++;
      }
    }

    return NextResponse.json({ success: true, imported, errors });
    
  } catch (error) {
    console.error('Import excel error:', error);
    return NextResponse.json({ error: 'Failed to process Excel file' }, { status: 500 });
  }
}
