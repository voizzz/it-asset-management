import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const consumables = await db.all(`SELECT * FROM Consumable ORDER BY name ASC`);
    return NextResponse.json({ consumables });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const data = await request.json();
    
    if (data.action === 'add') {
      const id = require('crypto').randomUUID();
      await db.run(
        `INSERT INTO Consumable (id, name, category, quantity, minQuantity, location, notes, unit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, data.name, data.category || 'Toner', data.quantity || 0, data.minQuantity || 0, data.location || '', data.notes || '', data.unit || 'pcs']
      );
      return NextResponse.json({ success: true, id });
    }
    
    if (data.action === 'adjust') {
      const { id, quantityChange, reason, employeeId } = data;
      await db.run(`UPDATE Consumable SET quantity = quantity + ? WHERE id = ?`, [quantityChange, id]);
      
      const txId = require('crypto').randomUUID();
      const now = new Date().toISOString();
      await db.run(
        `INSERT INTO ConsumableTransaction (id, consumableId, employeeId, quantityChange, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
        [txId, id, employeeId || null, quantityChange, reason || '', now]
      );
      return NextResponse.json({ success: true });
    }
    if (data.action === 'edit') {
      await db.run(
        `UPDATE Consumable SET name = ?, category = ?, minQuantity = ?, location = ?, notes = ?, unit = ? WHERE id = ?`,
        [data.name, data.category, data.minQuantity, data.location, data.notes, data.unit || 'pcs', data.id]
      );
      return NextResponse.json({ success: true });
    }

    if (data.action === 'delete') {
      await db.run(`DELETE FROM Consumable WHERE id = ?`, [data.id]);
      // Optional: Delete transactions as well to avoid orphans
      await db.run(`DELETE FROM ConsumableTransaction WHERE consumableId = ?`, [data.id]);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
