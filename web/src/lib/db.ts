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

        INSERT INTO Settings (key, value) 
        SELECT 'logoName', 'ITAM'
        WHERE NOT EXISTS (SELECT 1 FROM Settings WHERE key = 'logoName');
        
        INSERT INTO Settings (key, value) 
        SELECT 'serverUrl', 'http://localhost:3000/api/agent/report'
        WHERE NOT EXISTS (SELECT 1 FROM Settings WHERE key = 'serverUrl');

        INSERT INTO Settings (key, value) 
        SELECT 'logRetentionDays', '30'
        WHERE NOT EXISTS (SELECT 1 FROM Settings WHERE key = 'logRetentionDays');
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
      try { await db.run(`ALTER TABLE Agent ADD COLUMN brand TEXT`); } catch (e) {}
      try { await db.run(`ALTER TABLE Agent ADD COLUMN model TEXT`); } catch (e) {}
      try { await db.run(`ALTER TABLE Agent ADD COLUMN location TEXT`); } catch (e) {}
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

      return db;
    })();
  }
  
  return dbPromise;
}

export async function logAudit(
  agentId: string,
  action: 'CREATED' | 'UPDATED' | 'DELETED',
  source: 'AGENT_AUTO' | 'MANUAL_WEB',
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
