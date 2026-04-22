const API_BASE_URL = 'http://localhost:3000/api';
const searchInput = document.querySelector('.search');
const tableBody = document.querySelector('tbody');
const emptyMessage = document.querySelector('.empty');

let searchTimeout;

searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
        const gameTitle = e.target.value.trim();
        
        if (gameTitle.length === 0) {
            clearTable();
            showEmptyMessage();
            return;
        }
        
        searchGame(gameTitle);
    }, 500);
});

async function searchGame(gameTitle) {
    try {
        hideEmptyMessage();
        
        const gameID = await getGameID(gameTitle);
        
        if (!gameID) {
            showEmptyMessage();
            return;
        }
        
        const response = await fetch(`${API_BASE_URL}/prices?gameID=${gameID}`);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const priceData = await response.json();
        
        const historyResponse = await fetch(`${API_BASE_URL}/history?gameID=${gameID}`);
        const historyData = historyResponse.ok ? await historyResponse.json() : null;
        
        displayGamePrice(priceData, historyData);
        
    } catch (error) {
        showEmptyMessage();
    }
}

async function getGameID(gameTitle) {
    try {
        const response = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(gameTitle)}&limit=1`);
        const data = await response.json();
        
        if (data.length > 0) {
            return data[0].gameID;
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

function displayGamePrice(priceData, historyData) {
    clearTable();
    
    const steamPrice = parsePrice(priceData.steam);
    const epicPrice = parsePrice(priceData.epic);
    
    const prices = [steamPrice, epicPrice].filter(p => p !== null);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const savingsPercent = maxPrice > 0 ? Math.round(((maxPrice - minPrice) / maxPrice) * 100) : 0;
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="savings">${savingsPercent}%</td>
        <td class="game-cell">
            <img src="https://via.placeholder.com/60x80?text=${encodeURIComponent(priceData.title.substring(0, 10))}" 
                 class="table-img" 
                 alt="${priceData.title}"
                 onerror="this.src='https://via.placeholder.com/60x80?text=Game'">
            <span>${priceData.title}</span>
        </td>
        <td class="steam-price">${priceData.steam || 'N/A'}</td>
        <td class="epic-price">${priceData.epic || 'N/A'}</td>
        <td class="gog-price">N/A</td>
    `;
    
    tableBody.appendChild(row);
}

function parsePrice(priceStr) {
    if (!priceStr || typeof priceStr !== 'string') return null;
    
    if (priceStr.includes('Not available')) return null;
    
    const match = priceStr.match(/\d+\.?\d*/);
    return match ? parseFloat(match[0]) : null;
}

function clearTable() {
    tableBody.innerHTML = '';
}

function showEmptyMessage() {
    emptyMessage.style.display = 'block';
}

function hideEmptyMessage() {
    emptyMessage.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    showEmptyMessage();
});
