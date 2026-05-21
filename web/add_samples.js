const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./itam_v2.db');

const categories = ['Laptop', 'PC', 'Monitor', 'Network Device', 'IP Phone', 'Server', 'Other'];

const samples = categories.map((cat, i) => ({
  id: `${cat.replace(' ', '')}-00${i+1}`,
  hostname: `${cat.replace(' ', '')}-00${i+1}`,
  category: cat,
  ipAddress: cat === 'Monitor' || cat === 'Other' ? '' : `192.168.1.${100+i}`,
  macAddress: cat === 'Monitor' || cat === 'Other' ? '' : `00:1A:2B:3C:4D:5${i}`,
  brand: cat === 'Laptop' ? 'ThinkPad' : cat === 'Monitor' ? 'Dell' : cat === 'IP Phone' ? 'Grandstream' : 'Cisco',
  model: cat === 'Laptop' ? 'T14 Gen 2' : cat === 'Monitor' ? 'U2720Q' : 'Catalyst 9300',
  serialNumber: `SN-${cat.substring(0,3).toUpperCase()}-${1000+i}`,
  location: `Room ${100 + i}`,
  notes: `Sample ${cat} added for demonstration.`,
  status: i % 2 === 0 ? 'in-use' : 'spare',
  os: cat === 'Laptop' || cat === 'PC' ? 'Windows 11' : cat === 'Server' ? 'Ubuntu 22.04' : 'N/A',
  currentUser: cat === 'Monitor' || cat === 'Other' || cat === 'Network Device' || cat === 'Server' ? '' : `IT-0${i}`,
  realUser: cat === 'Monitor' || cat === 'Other' || cat === 'Network Device' || cat === 'Server' ? '' : `John Doe ${i}`
}));

db.serialize(() => {
  const stmt = db.prepare(`
    INSERT INTO Agent (id, hostname, os, ipAddress, macAddress, lastSeen, createdAt, status, category, isManual, brand, model, serialNumber, location, notes, currentUser, realUser)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      os=excluded.os,
      ipAddress=excluded.ipAddress,
      macAddress=excluded.macAddress,
      category=excluded.category,
      lastSeen=excluded.lastSeen,
      status=excluded.status,
      brand=excluded.brand,
      model=excluded.model,
      serialNumber=excluded.serialNumber,
      location=excluded.location,
      notes=excluded.notes,
      currentUser=excluded.currentUser,
      realUser=excluded.realUser
  `);

  const now = new Date().toISOString();

  samples.forEach(s => {
    stmt.run([
      s.id, s.hostname, s.os, s.ipAddress, s.macAddress, now, now, s.status, s.category, 1,
      s.brand, s.model, s.serialNumber, s.location, s.notes, s.currentUser, s.realUser
    ], (err) => {
      if (err) console.error(err);
      else console.log('Inserted', s.category);
    });
  });

  stmt.finalize();
});

db.close();
