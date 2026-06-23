import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { hashPassword } from './auth';

let dbPromise: Promise<Database> | null = null;

export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await open({
        filename: './itam_v2.db',
        driver: sqlite3.Database
      });

      await db.exec(`
        CREATE TABLE IF NOT EXISTS User (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE,
          passwordHash TEXT,
          role TEXT,
          createdAt DATETIME
        );

        CREATE TABLE IF NOT EXISTS Agent (
          id TEXT PRIMARY KEY,
          hostname TEXT UNIQUE,
          os TEXT,
          ipAddress TEXT,
          macAddress TEXT,
          cpu TEXT,
          gpu TEXT,
          motherboard TEXT,
          serialNumber TEXT,
          ramMb INTEGER,
          diskGb INTEGER,
          lastSeen DATETIME,
          createdAt DATETIME,
          status TEXT,
          category TEXT DEFAULT 'PC',
          isManual BOOLEAN DEFAULT 0,
          brand TEXT,
          model TEXT,
          location TEXT,
          notes TEXT,
          currentUser TEXT,
          realUser TEXT,
          extension TEXT,
          purchaseDate TEXT,
          warrantyMonths INTEGER
        );

        CREATE TABLE IF NOT EXISTS AuditLog (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          agentId TEXT,
          action TEXT,
          source TEXT,
          changes TEXT,
          timestamp DATETIME
        );

        CREATE TABLE IF NOT EXISTS Settings (
          key TEXT PRIMARY KEY,
          value TEXT
        );

        CREATE TABLE IF NOT EXISTS Software (
          id TEXT PRIMARY KEY,
          name TEXT,
          version TEXT,
          publisher TEXT
        );

        CREATE TABLE IF NOT EXISTS AgentSoftware (
          agentId TEXT,
          softwareId TEXT,
          installDate TEXT,
          PRIMARY KEY (agentId, softwareId)
        );

        CREATE TABLE IF NOT EXISTS License (
          id TEXT PRIMARY KEY,
          softwareName TEXT,
          licenseKey TEXT,
          totalSeats INTEGER,
          expiryDate TEXT,
          notes TEXT
        );

        CREATE TABLE IF NOT EXISTS Employee (
          id TEXT PRIMARY KEY,
          name TEXT,
          department TEXT,
          email TEXT,
          status TEXT DEFAULT 'active'
        );

        CREATE TABLE IF NOT EXISTS AssetAssignment (
          id TEXT PRIMARY KEY,
          agentId TEXT,
          employeeId TEXT,
          assignedAt DATETIME,
          returnedAt DATETIME,
          notes TEXT
        );

        CREATE TABLE IF NOT EXISTS Consumable (
          id TEXT PRIMARY KEY,
          name TEXT,
          category TEXT,
          quantity INTEGER,
          minQuantity INTEGER,
          location TEXT,
          notes TEXT
        );

        CREATE TABLE IF NOT EXISTS ConsumableTransaction (
          id TEXT PRIMARY KEY,
          consumableId TEXT,
          employeeId TEXT,
          quantityChange INTEGER,
          reason TEXT,
          timestamp DATETIME
        );

        CREATE TABLE IF NOT EXISTS Ticket (
          id TEXT PRIMARY KEY,
          title TEXT,
          description TEXT,
          status TEXT DEFAULT 'Open',
          priority TEXT DEFAULT 'Medium',
          category TEXT,
          agentId TEXT,
          employeeId TEXT,
          createdAt DATETIME,
          updatedAt DATETIME
        );

        CREATE TABLE IF NOT EXISTS TicketComment (
          id TEXT PRIMARY KEY,
          ticketId TEXT,
          content TEXT,
          authorName TEXT,
          createdAt DATETIME
        );

        CREATE TABLE IF NOT EXISTS TicketHistory (
          id TEXT PRIMARY KEY,
          ticketId TEXT,
          oldStatus TEXT,
          newStatus TEXT,
          changedBy TEXT,
          changedAt DATETIME
        );

        CREATE TABLE IF NOT EXISTS Attachment (
          id TEXT PRIMARY KEY,
          entityType TEXT,
          entityId TEXT,
          fileName TEXT,
          fileUrl TEXT,
          fileSize INTEGER,
          mimeType TEXT,
          uploadedBy TEXT,
          createdAt DATETIME
        );

        INSERT INTO Settings (key, value) 
        SELECT 'logoName', 'ITAM'
        WHERE NOT EXISTS (SELECT 1 FROM Settings WHERE key = 'logoName');
        
        INSERT INTO Settings (key, value) 
        SELECT 'serverUrl', 'http://localhost:3000/api/agent/report'
        WHERE NOT EXISTS (SELECT 1 FROM Settings WHERE key = 'serverUrl');

        INSERT INTO Settings (key, value) 
        SELECT 'logRetentionDays', '30'
        WHERE NOT EXISTS (SELECT 1 FROM Settings WHERE key = 'logRetentionDays');

        CREATE TABLE IF NOT EXISTS StockOpname (
          id TEXT PRIMARY KEY,
          name TEXT,
          status TEXT DEFAULT 'Draft',
          createdBy TEXT,
          createdAt DATETIME,
          completedAt DATETIME,
          notes TEXT,
          totalItems INTEGER DEFAULT 0,
          foundItems INTEGER DEFAULT 0,
          missingItems INTEGER DEFAULT 0,
          differentItems INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS StockOpnameItem (
          id TEXT PRIMARY KEY,
          opnameId TEXT,
          agentId TEXT,
          hostname TEXT,
          category TEXT,
          location TEXT,
          currentUser TEXT,
          brand TEXT,
          model TEXT,
          serialNumber TEXT,
          status TEXT DEFAULT 'Pending',
          notes TEXT,
          checkedAt DATETIME,
          checkedBy TEXT
        );
      `);

      try {
        const userCount = await db.get(`SELECT COUNT(*) as count FROM User`);
        if (userCount.count === 0) {
          const hashed = hashPassword('adminpassword');
          await db.run(`INSERT INTO User (id, username, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?)`, ['1', 'admin', hashed, 'admin', new Date().toISOString()]);
        }
      } catch (e) {
        console.error("Failed to seed admin user:", e);
      }

      try { await db.run(`ALTER TABLE Agent ADD COLUMN category TEXT DEFAULT 'PC'`); } catch (e) {}
      try { await db.run(`ALTER TABLE Agent ADD COLUMN isManual BOOLEAN DEFAULT 0`); } catch (e) {}
      try { await db.run(`ALTER TABLE Agent ADD COLUMN gpu TEXT`); } catch (e) {}
      try { await db.run(`ALTER TABLE Agent ADD COLUMN motherboard TEXT`); } catch (e) {}
      try { await db.run(`ALTER TABLE Agent ADD COLUMN brand TEXT`); } catch (e) {}
      try { await db.run(`ALTER TABLE Agent ADD COLUMN macAddress TEXT`); } catch (e) {}
      
      try { await db.run(`ALTER TABLE TicketComment ADD COLUMN authorName TEXT`); } catch (e) {}
      
      try { await db.run(`ALTER TABLE Ticket ADD COLUMN creatorName TEXT`); } catch (e) {}
      try { await db.run(`ALTER TABLE Agent ADD COLUMN notes TEXT`); } catch (e) {}
      try { await db.run(`ALTER TABLE Agent ADD COLUMN currentUser TEXT`); } catch (e) {}
      try { 
        await db.run(`ALTER TABLE Agent ADD COLUMN realUser TEXT`); 
      } catch (e: any) {
        if (!e.message.includes('duplicate column name')) {
          console.error("ALTER TABLE realUser failed:", e);
        }
      }
      try { await db.run(`ALTER TABLE Agent ADD COLUMN extension TEXT`); } catch (e) {}
      try { await db.run(`ALTER TABLE Agent ADD COLUMN purchaseDate TEXT`); } catch (e) {}
      try { await db.run(`ALTER TABLE Agent ADD COLUMN warrantyMonths INTEGER`); } catch (e) {}
      try { await db.run(`ALTER TABLE Agent ADD COLUMN employeeId TEXT`); } catch (e) {}

      return db;
    })();
  }
  
  return dbPromise;
}

export async function closeDb(): Promise<void> {
  if (dbPromise) {
    try {
      const db = await dbPromise;
      await db.close();
    } catch (e) {
      console.error("Failed to close DB:", e);
    }
    dbPromise = null;
  }
}

export async function logAudit(
  agentId: string,
  action: 'CREATED' | 'UPDATED' | 'DELETED',
  source: string,
  changes: Record<string, any>
) {
  const db = await getDb();
  await db.run(
    `INSERT INTO AuditLog (agentId, action, source, changes, timestamp) VALUES (?, ?, ?, ?, ?)`,
    [agentId, action, source, JSON.stringify(changes), new Date().toISOString()]
  );

  // Prune old logs based on retention settings
  try {
    const settingRow = await db.get(`SELECT value FROM Settings WHERE key = 'logRetentionDays'`);
    const retentionDays = parseInt(settingRow?.value || '30', 10);
    
    if (retentionDays > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      await db.run(`DELETE FROM AuditLog WHERE timestamp < ?`, [cutoffDate.toISOString()]);
    }
  } catch (e) {
    console.error("Failed to prune old logs", e);
  }
}
