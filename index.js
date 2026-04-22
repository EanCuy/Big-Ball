const express = require("express");
const axios = require("axios");
const db = require("./db");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors());

app.get("/api/prices", async (req, res) => {
  const { title } = req.query;
  if (!title) return res.status(400).json({ error: "Title is required" });

  try {
    // 1. Get ALL matches (removed &limit=1)
    const searchResponse = await axios.get(
      `https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(title)}`,
    );

    if (searchResponse.data.length === 0) {
      return res.status(404).json({ error: "No games found" });
    }

    // 2. Map through the first few results (e.g., top 5) to get details for each
    const topResults = searchResponse.data.slice(0, 5);

    const detailedGames = await Promise.all(
      topResults.map(async (game) => {
        const details = await axios.get(
          `https://www.cheapshark.com/api/1.0/games?id=${game.gameID}`,
        );
        const d = details.data;

        return {
          title: d.info.title,
          gameID: game.gameID,
          steam: d.deals.find((m) => m.storeID === "1")?.price || "N/A",
          epic: d.deals.find((m) => m.storeID === "25")?.price || "N/A",
          cheapestNow: d.cheapestPriceEver.price,
        };
      }),
    );

    res.json(detailedGames); // Returns an array [ {}, {}, {} ]
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Integration error" });
  }
});

app.get("/api/history", async (req, res) => {
  const { gameID } = req.query;
  if (!gameID) return res.status(400).json({ error: "Game ID required" });

  try {
    const deals = await axios.get(
      `https://www.cheapshark.com/api/1.0/games?id=${gameID}`,
    );
    const info = deals.data;

    const historyData = {
      title: info.info.title,
      cheapestPriceEver: info.cheapestPriceEver.price,
      dateOfCheapest: new Date(
        info.cheapestPriceEver.date * 1000,
      ).toLocaleDateString(),
    };

    db.run(
      "INSERT INTO history (external_id, game_title, price, date_recorded) VALUES (?, ?, ?, ?)",
      [
        gameID,
        historyData.title,
        historyData.cheapestPriceEver,
        new Date().toISOString(),
      ],
    );

    res.json(historyData);
  } catch (err) {
    res.status(500).json({ error: "History retrieval failed" });
  }
});

app.get("/api/games", (req, res) => {
  db.all("SELECT * FROM games", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/games", (req, res) => {
  const { title, category } = req.body;
  db.run(
    "INSERT INTO games (title, category) VALUES (?, ?)",
    [title, category],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    },
  );
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
