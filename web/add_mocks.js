const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./itam_v2.db');

const employees = [
  { id: 'emp-1', name: 'Budi Santoso', department: 'IT', email: 'budi@example.com', status: 'active' },
  { id: 'emp-2', name: 'Siti Aminah', department: 'HR', email: 'siti@example.com', status: 'active' },
  { id: 'emp-3', name: 'Joko Widodo', department: 'Finance', email: 'joko@example.com', status: 'active' },
  { id: 'emp-4', name: 'Rina Haryanti', department: 'Marketing', email: 'rina@example.com', status: 'active' },
  { id: 'emp-5', name: 'Agus Pratama', department: 'Operations', email: 'agus@example.com', status: 'active' }
];

const softwares = [
  { id: 'soft-1', name: 'Microsoft Office 365', version: '2023', publisher: 'Microsoft' },
  { id: 'soft-2', name: 'Adobe Creative Cloud', version: '2023', publisher: 'Adobe' },
  { id: 'soft-3', name: 'Figma', version: '99.0', publisher: 'Figma' },
  { id: 'soft-4', name: 'Visual Studio Code', version: '1.80', publisher: 'Microsoft' },
  { id: 'soft-5', name: 'Docker Desktop', version: '4.20', publisher: 'Docker' }
];

const consumables = [
  { id: 'cons-1', name: 'Toner Printer HP LaserJet', category: 'Toner', quantity: 15, minQuantity: 5, location: 'Storage A', notes: 'For IT printers' },
  { id: 'cons-2', name: 'Kertas A4 80gr', category: 'Paper', quantity: 50, minQuantity: 10, location: 'Storage B', notes: 'General use' },
  { id: 'cons-3', name: 'Kabel LAN Cat6 5m', category: 'Cable', quantity: 30, minQuantity: 10, location: 'IT Room', notes: 'Patch cords' },
  { id: 'cons-4', name: 'Baterai AAA', category: 'Battery', quantity: 100, minQuantity: 20, location: 'Storage A', notes: 'For remote/mouse' }
];

const tickets = [
  { id: 'tick-1', title: 'Printer di lantai 3 rusak', description: 'Kertas nyangkut terus saat ngeprint', status: 'Open', priority: 'High', category: 'Hardware', agentId: '', employeeId: 'emp-2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'tick-2', title: 'Request lisensi Figma', description: 'Butuh lisensi Figma untuk tim desain baru', status: 'In Progress', priority: 'Medium', category: 'Software', agentId: '', employeeId: 'emp-4', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'tick-3', title: 'Internet lambat di ruang meeting', description: 'WiFi sering putus', status: 'Resolved', priority: 'Medium', category: 'Network', agentId: '', employeeId: 'emp-1', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() }
];

const licenses = [
  { id: 'lic-1', softwareName: 'Microsoft Office 365', licenseKey: 'AAAA-BBBB-CCCC-DDDD', totalSeats: 50, expiryDate: '2027-01-01', notes: 'Enterprise License' },
  { id: 'lic-2', softwareName: 'Adobe Creative Cloud', licenseKey: 'ADOB-1234-5678', totalSeats: 10, expiryDate: '2026-12-31', notes: 'Marketing Team' }
];

db.serialize(() => {
  // Insert Employees
  const stmtEmp = db.prepare(`INSERT OR IGNORE INTO Employee (id, name, department, email, status) VALUES (?, ?, ?, ?, ?)`);
  employees.forEach(e => stmtEmp.run([e.id, e.name, e.department, e.email, e.status]));
  stmtEmp.finalize();

  // Insert Softwares
  const stmtSoft = db.prepare(`INSERT OR IGNORE INTO Software (id, name, version, publisher) VALUES (?, ?, ?, ?)`);
  softwares.forEach(s => stmtSoft.run([s.id, s.name, s.version, s.publisher]));
  stmtSoft.finalize();

  // Insert Consumables
  const stmtCons = db.prepare(`INSERT OR IGNORE INTO Consumable (id, name, category, quantity, minQuantity, location, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  consumables.forEach(c => stmtCons.run([c.id, c.name, c.category, c.quantity, c.minQuantity, c.location, c.notes]));
  stmtCons.finalize();

  // Insert Tickets
  const stmtTick = db.prepare(`INSERT OR IGNORE INTO Ticket (id, title, description, status, priority, category, agentId, employeeId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  tickets.forEach(t => stmtTick.run([t.id, t.title, t.description, t.status, t.priority, t.category, t.agentId, t.employeeId, t.createdAt, t.updatedAt]));
  stmtTick.finalize();

  // Insert Licenses
  const stmtLic = db.prepare(`INSERT OR IGNORE INTO License (id, softwareName, licenseKey, totalSeats, expiryDate, notes) VALUES (?, ?, ?, ?, ?, ?)`);
  licenses.forEach(l => stmtLic.run([l.id, l.softwareName, l.licenseKey, l.totalSeats, l.expiryDate, l.notes]));
  stmtLic.finalize();

  console.log('Mock data successfully inserted.');
});

db.close();
