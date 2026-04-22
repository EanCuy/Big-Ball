const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./game_comparison.db');

db.serialize(() => {
    // Standardizing data preparation for games 
    db.run(`CREATE TABLE IF NOT EXISTS games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        category TEXT
    )`);

    // Wishlist table to allow users to save games 
    db.run(`CREATE TABLE IF NOT EXISTS wishlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        game_id INTEGER
    )`);

    // Updated History table with the external_id column [cite: 12, 17]
    db.run(`CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        external_id TEXT, 
        price REAL,
        date TEXT
    )`);
});

module.exports = db;