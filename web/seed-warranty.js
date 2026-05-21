const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

(async () => {
  const db = await open({ filename: './itam_v2.db', driver: sqlite3.Database });

  // Laptop-001: garansi habis dalam ~8 hari (beli 30 Mei 2024, garansi 24 bulan = habis 30 Mei 2026)
  await db.run("UPDATE Agent SET purchaseDate = '2024-05-30', warrantyMonths = 24 WHERE id = 'Laptop-001'");

  // PC-002: garansi habis dalam ~19 hari (beli 10 Jun 2024, garansi 24 bulan = habis 10 Jun 2026)
  await db.run("UPDATE Agent SET purchaseDate = '2024-06-10', warrantyMonths = 24 WHERE id = 'PC-002'");

  // Monitor-003: garansi SUDAH HABIS (beli 15 Jan 2023, garansi 12 bulan = habis 15 Jan 2024)
  await db.run("UPDATE Agent SET purchaseDate = '2023-01-15', warrantyMonths = 12 WHERE id = 'Monitor-003'");

  // Server-006: garansi masih lama (beli 1 Nov 2023, garansi 36 bulan = habis 1 Nov 2026)
  await db.run("UPDATE Agent SET purchaseDate = '2023-11-01', warrantyMonths = 36 WHERE id = 'Server-006'");

  // DESKTOP-CQ8JMEQ: garansi masih aman (beli 1 Mar 2025, garansi 12 bulan = habis 1 Mar 2026) -> sudah habis
  await db.run("UPDATE Agent SET purchaseDate = '2025-03-01', warrantyMonths = 12 WHERE id = 'DESKTOP-CQ8JMEQ'");

  const result = await db.all("SELECT id, hostname, purchaseDate, warrantyMonths FROM Agent WHERE purchaseDate IS NOT NULL");
  console.log('Warranty data updated:');
  console.log(JSON.stringify(result, null, 2));

  await db.close();
})();
