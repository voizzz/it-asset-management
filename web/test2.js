const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

(async () => {
  const db = await open({ filename: 'itam_v2.db', driver: sqlite3.Database });
  
  const opnameItems = await db.all('SELECT * FROM StockOpnameItem');
  const match = opnameItems.find(i => i.hostname === 'MT-P-PUR-OCT21-003' || i.serialNumber === 'H4ZN600803');
  console.log("Match in StockOpnameItem:", match);
  console.log("Total StockOpnameItem:", opnameItems.length);
})();
