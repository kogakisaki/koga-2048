let currentGameId = null;
let board = [];
let score = 0;
let size = 4;
let isDark = localStorage.getItem("isDark") === "true";

// Set initial theme
if (isDark) {
  document.documentElement.setAttribute("data-theme", "dark");
}

function showGameControls() {
  document.querySelector(".score-container").style.display = "block";
  document.querySelector(".game-container").style.display = "block";
  document.getElementById("copyLinkBtn").style.display = "block";
  document.getElementById("shareImageBtn").style.display = "block";
  document.getElementById("instructions").style.display = "none";
}

function hideGameControls() {
  document.querySelector(".score-container").style.display = "none";
  document.querySelector(".game-container").style.display = "none";
  document.getElementById("copyLinkBtn").style.display = "none";
  document.getElementById("shareImageBtn").style.display = "none";
  document.getElementById("instructions").style.display = "block";
}

async function startNewGame() {
  const newSize = parseInt(document.getElementById("boardSize").value);
  size = Math.max(3, Math.min(8, newSize));

  try {
    const response = await fetch("/api/games", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ size }),
    });

    if (!response.ok) throw new Error("Failed to create game");

    const game = await response.json();
    currentGameId = game.gameId;

    window.history.pushState({}, "", `/${currentGameId}`);

    board = game.board;
    score = game.score;

    document.getElementById(
      "gameId"
    ).textContent = `${currentGameId} | ${size}×${size}`;
    document.getElementById("score").textContent = score;
    showGameControls();
    renderBoard();
  } catch (error) {
    console.error("Error creating game:", error);
    alert("Failed to create new game");
  }
}

async function loadGame() {
  if (!currentGameId) return;

  try {
    const response = await fetch(`/api/games/${currentGameId}`);
    if (!response.ok) {
      if (response.status === 404) {
        if (window.location.pathname !== "/") {
          window.location.href = "/";
        }
        return;
      }
      throw new Error("Failed to load game");
    }

    const game = await response.json();
    board = game.board;
    score = game.score;
    size = game.size;

    document.getElementById("boardSize").value = size;
    document.getElementById(
      "gameId"
    ).textContent = `${currentGameId} | ${size}×${size}`;
    document.getElementById("score").textContent = score;
    showGameControls();
    renderBoard();
  } catch (error) {
    console.error("Error loading game:", error);
  }
}

function renderBoard() {
  const grid = document.getElementById("grid");
  grid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
  grid.innerHTML = "";

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      if (board[i][j] !== 0) {
        cell.textContent = board[i][j];
        cell.style.backgroundColor = `var(--tile-${board[i][j]}-color)`;
        if (board[i][j] > 4) {
          cell.style.color = "#fff";
        }
      }
      grid.appendChild(cell);
    }
  }
}

async function move(direction) {
  if (!currentGameId) return;

  try {
    const response = await fetch(`/api/games/${currentGameId}/move`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ direction }),
    });

    if (!response.ok) throw new Error("Failed to make move");

    const game = await response.json();
    if (game.moved) {
      board = game.board;
      score = game.score;
      document.getElementById("score").textContent = score;
      renderBoard();

      if (game.gameOver) {
        setTimeout(() => alert("Game Over!"), 200);
      }
    }
  } catch (error) {
    console.error("Error making move:", error);
  }
}

function copyGameLink() {
  const url = window.location.href;
  navigator.clipboard
    .writeText(url)
    .then(() => alert("Game link copied to clipboard!"))
    .catch((err) => console.error("Failed to copy link:", err));
}

async function shareImage() {
  if (!currentGameId) return;

  try {
    const theme =
      document.documentElement.getAttribute("data-theme") || "light";
    const response = await fetch(
      `/api/games/${currentGameId}/image?theme=${theme}`
    );

    if (!response.ok) throw new Error("Failed to generate image");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `2048-game-${currentGameId}-${theme}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error sharing image:", error);
    alert("Failed to generate image");
  }
}

function handleKeydown(e) {
  switch (e.key) {
    case "ArrowLeft":
      move("left");
      break;
    case "ArrowRight":
      move("right");
      break;
    case "ArrowUp":
      move("up");
      break;
    case "ArrowDown":
      move("down");
      break;
  }
}

let touchStartX = 0;
let touchStartY = 0;

function handleTouchStart(e) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}

function handleTouchEnd(e) {
  const diffX = e.changedTouches[0].clientX - touchStartX;
  const diffY = e.changedTouches[0].clientY - touchStartY;
  const absDiffX = Math.abs(diffX);
  const absDiffY = Math.abs(diffY);

  if (Math.max(absDiffX, absDiffY) > 30) {
    if (absDiffX > absDiffY) {
      move(diffX > 0 ? "right" : "left");
    } else {
      move(diffY > 0 ? "down" : "up");
    }
  }
}

function toggleTheme() {
  isDark = !isDark;
  localStorage.setItem("isDark", isDark);
  document.documentElement.setAttribute(
    "data-theme",
    isDark ? "dark" : "light"
  );
}

document.addEventListener("keydown", handleKeydown);
document
  .getElementById("gameBoard")
  .addEventListener("touchstart", handleTouchStart);
document
  .getElementById("gameBoard")
  .addEventListener("touchend", handleTouchEnd);

// Handle browser back/forward buttons
window.addEventListener("popstate", () => {
  const pathGameId = window.location.pathname.slice(1);
  if (pathGameId && pathGameId.length === 9) {
    currentGameId = pathGameId;
    loadGame();
  } else if (window.location.pathname === "/") {
    hideGameControls();
    currentGameId = null;
  }
});

// Initial URL handling
const pathGameId = window.location.pathname.slice(1);
if (pathGameId && pathGameId.length === 9) {
  currentGameId = pathGameId;
  loadGame();
}
