const API_BASE_URL = "http://localhost:3000/api";
const searchInput = document.querySelector(".search");
const tableBody = document.querySelector("tbody");
const emptyMessage = document.querySelector(".empty");

let searchTimeout;

searchInput.addEventListener("input", (e) => {
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
    clearTable();

    const response = await fetch(
      `${API_BASE_URL}/prices?title=${encodeURIComponent(gameTitle)}`,
    );

    if (!response.ok) throw new Error("No games found");

    const gamesArray = await response.json(); 

    if (gamesArray.length === 0) {
      showEmptyMessage();
      return;
    }

    gamesArray.forEach((game) => {
      displayGamePrice(game);

      fetch(`${API_BASE_URL}/history?gameID=${game.gameID}`).catch(() => {});
    });
  } catch (error) {
    console.error(error);
    showEmptyMessage();
  }
}

function displayGamePrice(gameData) {
  const steamPrice = parsePrice(gameData.steam);
  const epicPrice = parsePrice(gameData.epic);

  const prices = [steamPrice, epicPrice].filter((p) => p !== null);
  let savingsPercent = 0;
  if (prices.length > 1) {
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    savingsPercent = Math.round(((maxPrice - minPrice) / maxPrice) * 100);
  }

  const row = document.createElement("tr");
  row.innerHTML = `
        <td class="savings">${savingsPercent}%</td>
        <td class="game-cell">
            <img src="https://via.placeholder.com/60x80?text=GAME" class="table-img" alt="cover">
            <span>${gameData.title}</span>
        </td>
        <td class="steam-price">${gameData.steam !== "N/A" ? "$" + gameData.steam : "N/A"}</td>
        <td class="epic-price">${gameData.epic !== "N/A" ? "$" + gameData.epic : "N/A"}</td>
        <td class="gog-price">N/A</td>
    `;

  tableBody.appendChild(row);
}

function parsePrice(priceStr) {
  if (!priceStr || typeof priceStr !== "string") return null;

  if (priceStr.includes("Not available")) return null;

  const match = priceStr.match(/\d+\.?\d*/);
  return match ? parseFloat(match[0]) : null;
}

function clearTable() {
  tableBody.innerHTML = "";
}

function showEmptyMessage() {
  emptyMessage.style.display = "block";
}

function hideEmptyMessage() {
  emptyMessage.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  showEmptyMessage();
});
