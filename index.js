const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');

const app = express();
app.use(express.json());

// =======================
// DATABASE SETUP
// =======================
const db = new sqlite3.Database('./game_comparison.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    category TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT,
    price REAL,
    date TEXT
  )`);
});

// =======================
// GAME DATA API
// =======================

// GET all games
app.get('/api/games', (req, res) => {
  db.all("SELECT * FROM games", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// GET game by ID
app.get('/api/games/:id', (req, res) => {
  db.get("SELECT * FROM games WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row);
  });
});

// POST create game
app.post('/api/games', (req, res) => {
  const { title, category } = req.body;

  db.run(
    "INSERT INTO games (title, category) VALUES (?, ?)",
    [title, category],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// =======================
// SEARCH API
// =======================
app.get('/api/games/search', (req, res) => {
  const keyword = req.query.q;

  db.all(
    "SELECT * FROM games WHERE title LIKE ? OR category LIKE ?",
    [`%${keyword}%`, `%${keyword}%`],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// =======================
// PRICE COMPARISON (EAI)
// =======================
app.get('/api/prices', async (req, res) => {
  const { title } = req.query;

  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    // Step 1: search game
    const search = await axios.get(
      `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(title)}&limit=1`
    );

    if (search.data.length === 0) {
      return res.status(404).json({ error: "Game not found" });
    }

    const gameID = search.data[0].gameID;

    // Step 2: get price details
    const deals = await axios.get(
      `https://www.cheapshark.com/api/1.0/games?id=${gameID}`
    );

    const steam = deals.data.deals.find(d => d.storeID === "1")?.price || "N/A";
    const epic = deals.data.deals.find(d => d.storeID === "25")?.price || "N/A";

    const result = {
      title: deals.data.info.title,
      steam,
      epic
    };

    // Step 3: save history
    const lowestPrice = deals.data.deals[0]?.price || 0;

    db.run(
      "INSERT INTO history (external_id, price, date) VALUES (?, ?, ?)",
      [gameID, lowestPrice, new Date().toISOString()]
    );

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: "Integration error" });
  }
});

// =======================
// SERVER
// =======================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});