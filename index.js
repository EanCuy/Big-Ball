const express = require('express');
const axios = require('axios');
const db = require('./db');
const app = express();

app.use(express.json());

// Main Function: Price Comparison across platforms 
app.get('/api/prices', async (req, res) => {
    const { title } = req.query;
    if (!title) return res.status(400).json({ error: "Title is required" });

    try {
        // 1. Search for game via Integration Layer 
        const search = await axios.get(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(title)}&limit=1`);
        if (search.data.length === 0) return res.status(404).json({ error: "Game not found" });

        const gameID = search.data[0].gameID;

        // 2. Fetch live pricing [cite: 9, 18]
        const deals = await axios.get(`https://www.cheapshark.com/api/1.0/games?id=${gameID}`);
        
        const result = {
            title: deals.data.info.title,
            steam: deals.data.deals.find(d => d.storeID === "1")?.price || "N/A",
            epic: deals.data.deals.find(d => d.storeID === "25")?.price || "N/A"
        };

        // 3. Track historical price changes 
        const lowestCurrent = deals.data.deals[0].price;
        db.run("INSERT INTO history (external_id, price, date) VALUES (?, ?, ?)", 
               [gameID.toString(), lowestCurrent, new Date().toISOString()]);

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Integration Layer Error" });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Group 07 API active on port ${PORT}`));