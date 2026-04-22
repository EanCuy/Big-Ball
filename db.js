const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./game_comparison.db');

db.serialize(() => {
    // Table to track historical price changes for analysis 
    db.run(`CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        external_id TEXT,
        game_title TEXT,
        price REAL,
        date_recorded TEXT
    )`);
});

module.exports = db;