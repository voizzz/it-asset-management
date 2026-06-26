const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('itam_v2.db');

const email = 'Januar.r@zinus.com';
const newOtp = '123456';
const newExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

db.run(`UPDATE TicketOTP SET otpCode = ?, expiresAt = ? WHERE email = ?`, [newOtp, newExpiry, email], function(err) {
    if (err) console.error(err);
    else console.log('Updated rows:', this.changes);
});
