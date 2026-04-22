const express = require('express');
const axios = require('axios');
const db = require('./db');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

app.get('/api/prices', async (req, res) => {
    const { gameID } = req.query; 
    if (!gameID) return res.status(400).json({ error: "Game ID is required" });

    try {
        const deals = await axios.get(`https://www.cheapshark.com/api/1.0/games?id=${gameID}`);
        
        const comparison = {
            title: deals.data.info.title,
            steam: deals.data.deals.find(d => d.storeID === "1")?.price || "Not available on Steam",
            epic: deals.data.deals.find(d => d.storeID === "25")?.price || "Not available on Epic"
        };

        res.json(comparison);
    } catch (err) {
        res.status(500).json({ error: "Comparison retrieval failed" });
    }
});

app.get('/api/history', async (req, res) => {
    const { gameID } = req.query;
    try {
        const deals = await axios.get(`https://www.cheapshark.com/api/1.0/games?id=${gameID}`);
        
        const historyData = {
            title: deals.data.info.title,
            cheapestPriceEver: deals.data.cheapestPriceEver.price,
            dateOfCheapest: new Date(deals.data.cheapestPriceEver.date * 1000).toLocaleDateString()
        };

        db.run("INSERT INTO history (external_id, game_title, price, date_recorded) VALUES (?, ?, ?, ?)", 
               [gameID, historyData.title, historyData.cheapestPriceEver, new Date().toISOString()]);

        res.json(historyData);
    } catch (err) {
        res.status(500).json({ error: "History retrieval failed" });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Group 07 - Price & History API active on port ${PORT}`));