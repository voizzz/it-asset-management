import { NextResponse } from 'next/server';
import { getDb, logAudit } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/session';
import ExcelJS from 'exceljs';
import crypto from 'crypto';

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
    await workbook.xlsx.load(buffer as any);
    
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

      const hostname = row.getCell(1).text?.trim() || '';
      const category = row.getCell(2).text?.trim();
      
      if (!category) {
        errors++;
        continue; // Skip invalid rows
      }

      const id = crypto.randomUUID();
      let safeHostname = hostname.toUpperCase();
      if (!safeHostname) {
        safeHostname = `ASSET-${id.split('-')[0].toUpperCase()}`;
      }
      const safeCategory = category.toUpperCase();
      const safeBrand = (row.getCell(3).text || '').trim().toUpperCase();
      const safeModel = (row.getCell(4).text || '').trim().toUpperCase();
      const safeSerial = (row.getCell(5).text || '').trim().toUpperCase();
      
      const status = row.getCell(6).text?.trim().toLowerCase() || 'in-use';
      const location = row.getCell(7).text?.trim() || '';
      const realUser = row.getCell(8).text?.trim() || '';
      const currentUser = row.getCell(9).text?.trim() || '';
      const extension = row.getCell(10).text?.trim() || '';
      const ipAddress = row.getCell(11).text?.trim() || '';
      const macAddress = row.getCell(12).text?.trim() || '';
      const os = row.getCell(13).text?.trim() || '';
      const cpu = row.getCell(14).text?.trim() || '';
      const gpu = row.getCell(15).text?.trim() || '';
      const motherboard = row.getCell(16).text?.trim() || '';
      
      const ramCell = row.getCell(17).value;
      const ramMb = ramCell ? parseInt(ramCell.toString()) : null;
      
      const diskCell = row.getCell(18).value;
      const diskGb = diskCell ? parseInt(diskCell.toString()) : null;

      const purchaseDate = row.getCell(19).text?.trim() || null;
      
      // Warranty might be a number
      const warrantyCell = row.getCell(20).value;
      const warrantyMonths = warrantyCell ? parseInt(warrantyCell.toString()) : null;
      
      const notes = row.getCell(21).text?.trim() || '';

      try {
        await db.run(`
          INSERT INTO Agent (id, hostname, category, brand, model, serialNumber, status, location, realUser, currentUser, extension, ipAddress, macAddress, os, cpu, gpu, motherboard, ramMb, diskGb, purchaseDate, warrantyMonths, notes, createdAt, lastSeen, isManual)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            hostname=excluded.hostname,
            category=excluded.category,
            brand=excluded.brand,
            model=excluded.model,
            serialNumber=excluded.serialNumber,
            status=excluded.status,
            location=excluded.location,
            realUser=excluded.realUser,
            currentUser=excluded.currentUser,
            extension=excluded.extension,
            ipAddress=excluded.ipAddress,
            macAddress=excluded.macAddress,
            os=excluded.os,
            cpu=excluded.cpu,
            gpu=excluded.gpu,
            motherboard=excluded.motherboard,
            ramMb=excluded.ramMb,
            diskGb=excluded.diskGb,
            purchaseDate=excluded.purchaseDate,
            warrantyMonths=excluded.warrantyMonths,
            notes=excluded.notes
        `, [
          id, safeHostname, safeCategory, safeBrand, safeModel, safeSerial, status, location, realUser, currentUser, extension, ipAddress, macAddress, os, cpu, gpu, motherboard, ramMb, diskGb, purchaseDate, warrantyMonths, notes, now, now, 1
        ]);

        await logAudit(id, 'CREATED', `EXCEL_WEB:${username}`, { hostname: safeHostname, category: safeCategory });
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
