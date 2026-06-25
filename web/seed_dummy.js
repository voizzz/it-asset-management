const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function seed() {
  const db = await open({
    filename: './itam_v2.db',
    driver: sqlite3.Database
  });

  const categories = ['Laptop', 'PC', 'Monitor', 'Network Device', 'Server'];
  const statuses = ['in-use', 'online', 'offline', 'broken', 'spare'];
  const employees = ['Januar Ramadhan', 'Andi Lestari', 'Agus Wijaya', 'Siti Aminah', 'Budi Santoso'];
  
  const currentYear = new Date().getFullYear();

  // Generate 30 dummy assets spread from January to May
  for (let i = 1; i <= 30; i++) {
    const month = Math.floor(Math.random() * 5) + 1; // 1 to 5 (Jan to May)
    const day = Math.floor(Math.random() * 28) + 1;
    
    // Create date string like '2026-03-15T10:00:00.000Z'
    const monthStr = month.toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const createdAt = `${currentYear}-${monthStr}-${dayStr}T10:00:00.000Z`;
    
    const category = categories[Math.floor(Math.random() * categories.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const hostname = `DUMMY-${category.toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    const ipAddress = `192.168.1.${Math.floor(Math.random() * 254) + 1}`;
    
    // random warranty: either far in future, or already expired (last year)
    const purchaseYear = currentYear - Math.floor(Math.random() * 3);
    const purchaseDate = `${purchaseYear}-${monthStr}-${dayStr}`;
    const warrantyMonths = Math.random() > 0.5 ? 12 : 36; // 1 or 3 years

    await db.run(
      `INSERT INTO Agent (id, hostname, ipAddress, createdAt, status, category, isManual, purchaseDate, warrantyMonths, notes, os)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `dummy-id-${i}`,
        hostname,
        ipAddress,
        createdAt,
        status,
        category,
        1,
        purchaseDate,
        warrantyMonths,
        'Mock Data for Chart',
        'Windows 11'
      ]
    );
  }

  console.log('Successfully inserted 30 dummy assets spread across Jan - May!');
  await db.close();
}

seed().catch(console.error);
