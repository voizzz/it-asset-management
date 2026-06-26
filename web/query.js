const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('itam_v2.db');

db.all("SELECT key, value FROM Settings WHERE key IN ('smtpHost', 'smtpPort', 'smtpUser')", [], (err, rows) => {
    console.log(rows);
});
