const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

(async () => {
  const db = await open({ filename: 'itam_v2.db', driver: sqlite3.Database });
  
  console.log("== AGENT TABLE ==");
  const agents = await db.all('SELECT id, hostname, serialNumber, status, category FROM Agent');
  const match = agents.find(a => JSON.stringify(a).includes('MT-P-PUR-OCT21-003'));
  console.log("Match in Agent:", match);

  console.log("\n== STOCK OPNAME SESSION ==");
  const opnames = await db.all('SELECT * FROM StockOpname');
  console.log(opnames);

  console.log("\n== ALL AGENTS ==");
  console.log("Total agents:", agents.length);
  console.log("Non-retired agents:", agents.filter(a => a.status !== 'Retired').length);

})();
