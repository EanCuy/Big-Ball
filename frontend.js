// Frontend Logic for Game Price Comparison

const API_BASE_URL = 'http://localhost:3000/api';
const searchInput = document.querySelector('.search');
const tableBody = document.querySelector('tbody');
const emptyMessage = document.querySelector('.empty');

let searchTimeout;

// Event listener for search input
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    
    // Debounce search to avoid too many API calls
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

/**
 * Search for a game and fetch price comparison
 * @param {string} gameTitle - The game title to search for
 */
async function searchGame(gameTitle) {
    try {
        console.log(`Searching for game: ${gameTitle}`);
        hideEmptyMessage();
        
        // For now, we'll use a mock game ID since we need a game ID for the API
        // In a real scenario, you'd first search for the game ID
        const gameID = await getGameID(gameTitle);
        
        if (!gameID) {
            showEmptyMessage();
            return;
        }
        
        // Fetch price comparison from API
        const response = await fetch(`${API_BASE_URL}/prices?gameID=${gameID}`);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const priceData = await response.json();
        console.log('Price data received:', priceData);
        
        // Fetch history data as well
        const historyResponse = await fetch(`${API_BASE_URL}/history?gameID=${gameID}`);
        const historyData = historyResponse.ok ? await historyResponse.json() : null;
        
        // Display the data in table
        displayGamePrice(priceData, historyData);
        
    } catch (error) {
        console.error('Error fetching game data:', error);
        showEmptyMessage();
    }
}

/**
 * Get game ID from title (using CheapShark API)
 * @param {string} gameTitle - The game title to search for
 * @returns {Promise<string|null>} - Game ID if found
 */
async function getGameID(gameTitle) {
    try {
        const response = await fetch(`https://www.cheapshark.com/api/1.0/games?title=${encodeURIComponent(gameTitle)}&limit=1`);
        const data = await response.json();
        
        if (data.length > 0) {
            return data[0].gameID;
        }
        
        return null;
    } catch (error) {
        console.error('Error fetching game ID:', error);
        return null;
    }
}

/**
 * Display game price comparison in the table
 * @param {Object} priceData - Price comparison data from API
 * @param {Object} historyData - Price history data from API
 */
function displayGamePrice(priceData, historyData) {
    clearTable();
    
    // Parse prices (remove $ and convert to numbers)
    const steamPrice = parsePrice(priceData.steam);
    const epicPrice = parsePrice(priceData.epic);
    
    // Calculate savings percentage (lowest price vs highest)
    const prices = [steamPrice, epicPrice].filter(p => p !== null);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const savingsPercent = maxPrice > 0 ? Math.round(((maxPrice - minPrice) / maxPrice) * 100) : 0;
    
    // Create table row
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
    
    // Add price history info if available
    if (historyData) {
        console.log('History data:', historyData);
    }
}

/**
 * Parse price string to number
 * @param {string} priceStr - Price string like "$19.99" or "Not available on Steam"
 * @returns {number|null} - Parsed price or null
 */
function parsePrice(priceStr) {
    if (!priceStr || typeof priceStr !== 'string') return null;
    
    // If contains "Not available", return null
    if (priceStr.includes('Not available')) return null;
    
    // Extract number from price string
    const match = priceStr.match(/\d+\.?\d*/);
    return match ? parseFloat(match[0]) : null;
}

/**
 * Clear all rows from table
 */
function clearTable() {
    tableBody.innerHTML = '';
}

/**
 * Show empty message
 */
function showEmptyMessage() {
    emptyMessage.style.display = 'block';
}

/**
 * Hide empty message
 */
function hideEmptyMessage() {
    emptyMessage.style.display = 'none';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Game Price Comparison app loaded');
    showEmptyMessage();
});
