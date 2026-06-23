const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./itam_v2.db');

const firstNames = ['Budi', 'Siti', 'Andi', 'Rina', 'Agus', 'Dewi', 'Eko', 'Sri', 'Januar', 'Fitri', 'Reza', 'Nina'];
const lastNames = ['Santoso', 'Wijaya', 'Kusuma', 'Pratama', 'Sari', 'Ramadhan', 'Saputra', 'Lestari', 'Hidayat', 'Firmansyah'];
const depts = ['IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Sales', 'Purchasing', 'Legal'];

// Generate 50 Employees
const employees = [];
for (let i=1; i<=50; i++) {
   const name = firstNames[Math.floor(Math.random()*firstNames.length)] + ' ' + lastNames[Math.floor(Math.random()*lastNames.length)];
   employees.push({
      id: 'EMP-' + String(i).padStart(3, '0'),
      name,
      department: depts[Math.floor(Math.random()*depts.length)],
      email: name.replace(' ', '.').toLowerCase() + '@company.com'
   });
}

const categories = ['PC', 'Laptop', 'Monitor', 'IP Phone', 'Server', 'Network Device', 'Printer'];
const statuses = ['online', 'offline', 'spare', 'broken', 'in-use'];

const assets = [];
for (let i=1; i<=250; i++) {
  const cat = categories[Math.floor(Math.random()*categories.length)];
  const status = statuses[Math.floor(Math.random()*statuses.length)];
  assets.push({
    id: 'ASSET-' + String(i).padStart(4, '0'),
    hostname: cat.replace(' ', '') + '-' + String(i).padStart(3, '0'),
    category: cat,
    status: status,
    ipAddress: '192.168.1.' + (i % 254 + 1),
    macAddress: '00:1B:44:11:3A:B' + (i%10),
    brand: ['Dell', 'HP', 'Lenovo', 'Cisco', 'Logitech', 'Asus', 'Acer', 'Apple'][Math.floor(Math.random()*8)],
    createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    assignedTo: Math.random() > 0.4 ? employees[Math.floor(Math.random()*employees.length)].name : null
  });
}

// Consumables
const consumableNames = ['Printer Ink Black', 'Printer Ink Color', 'Wireless Mouse', 'Keyboard', 'HDMI Cable 2m', 'RJ45 Connectors (Pack)', 'Thermal Paste', 'SSD 512GB', 'RAM 8GB DDR4', 'CCTV Camera', 'Flashdisk 32GB', 'Webcam 1080p'];
const consumables = consumableNames.map((name, i) => ({
    id: 'CONS-' + i,
    name: name,
    category: name.includes('Ink') ? 'Printer Supplies' : 'Peripherals',
    quantity: Math.floor(Math.random() * 50),
    minQuantity: 10,
    location: 'IT Storage ' + (i%3 + 1)
}));

// Tickets
const ticketTitles = ['Cannot print', 'Internet slow', 'Laptop won\'t turn on', 'Request new mouse', 'Forgot password', 'Monitor flickering', 'VPN disconnected', 'Email not syncing', 'Need access to shared folder', 'Printer paper jam', 'Blue screen error', 'Cannot connect to projector'];
const ticketStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
const priorities = ['Low', 'Medium', 'High'];

const tickets = [];
for(let i=1; i<=150; i++) {
   const tCreated = new Date(Date.now() - Math.random() * 8000000000); // spread over last ~3 months
   tickets.push({
       id: 'TKT-' + String(i).padStart(4, '0'),
       title: ticketTitles[Math.floor(Math.random()*ticketTitles.length)],
       description: 'User reported an issue',
       status: ticketStatuses[Math.floor(Math.random()*ticketStatuses.length)],
       priority: priorities[Math.floor(Math.random()*priorities.length)],
       category: 'Hardware',
       agentId: Math.random() > 0.5 ? assets[Math.floor(Math.random()*assets.length)].id : null,
       employeeId: employees[Math.floor(Math.random()*employees.length)].id,
       createdAt: tCreated.toISOString(),
       updatedAt: new Date(tCreated.getTime() + Math.random() * 100000000).toISOString()
   });
}

db.serialize(() => {
   db.run("BEGIN TRANSACTION");
   
   employees.forEach(e => {
       db.run(`INSERT OR IGNORE INTO Employee (id, name, department, email) VALUES (?, ?, ?, ?)`, [e.id, e.name, e.department, e.email]);
   });

   assets.forEach(a => {
       db.run(`INSERT OR IGNORE INTO Agent (id, hostname, category, status, ipAddress, macAddress, brand, createdAt, realUser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
       [a.id, a.hostname, a.category, a.status, a.ipAddress, a.macAddress, a.brand, a.createdAt, a.assignedTo]);
   });

   consumables.forEach(c => {
       db.run(`INSERT OR IGNORE INTO Consumable (id, name, category, quantity, minQuantity, location) VALUES (?, ?, ?, ?, ?, ?)`, 
       [c.id, c.name, c.category, c.quantity, c.minQuantity, c.location]);
   });

   tickets.forEach(t => {
       db.run(`INSERT OR IGNORE INTO Ticket (id, title, description, status, priority, category, agentId, employeeId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
       [t.id, t.title, t.description, t.status, t.priority, t.category, t.agentId, t.employeeId, t.createdAt, t.updatedAt]);
   });

   db.run("COMMIT", (err) => {
       if (err) console.error(err);
       else console.log("Seeding complete! Injected hundreds of mock rows into database.");
       db.close();
   });
});
