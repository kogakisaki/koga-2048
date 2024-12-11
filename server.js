const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const path = require("path");
const { createCanvas } = require("canvas");

const app = express();
const port = process.env.PORT || 3000;
const GAMES_DIR = path.join(__dirname, "games");

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Serve game by ID
app.get("/:gameId([a-zA-Z0-9]{9})", async (req, res) => {
  try {
    // Try to load the game first to verify it exists
    const game = await loadGame(req.params.gameId);
    if (!game) {
      return res.redirect("/"); // Redirect to home if game not found
    }

    // Read the template HTML
    let html = await fs.readFile(path.join(__dirname, "public", "index.html"), "utf8");

    // Inject the game ID into the HTML
    html = html.replace(
      "let currentGameId = localStorage.getItem('currentGameId');",
      `let currentGameId = '${req.params.gameId}';`
    );

    res.send(html);
  } catch (error) {
    console.error("Error serving game page:", error);
    res.redirect("/");
  }
});

// Theme configurations
const themes = {
  light: {
    background: "#faf8ef",
    text: "#776e65",
    tile: {
      2: { bg: "#eee4da", text: "#776e65" },
      4: { bg: "#ede0c8", text: "#776e65" },
      8: { bg: "#f2b179", text: "#f9f6f2" },
      16: { bg: "#f59563", text: "#f9f6f2" },
      32: { bg: "#f67c5f", text: "#f9f6f2" },
      64: { bg: "#f65e3b", text: "#f9f6f2" },
      128: { bg: "#edcf72", text: "#f9f6f2" },
      256: { bg: "#edcc61", text: "#f9f6f2" },
      512: { bg: "#edc850", text: "#f9f6f2" },
      1024: { bg: "#edc53f", text: "#f9f6f2" },
      2048: { bg: "#edc22e", text: "#f9f6f2" },
    },
  },
  dark: {
    background: "#1a1a1a",
    text: "#ffffff",
    tile: {
      2: { bg: "#3d3d3d", text: "#ffffff" },
      4: { bg: "#4d4d4d", text: "#ffffff" },
      8: { bg: "#f2b179", text: "#ffffff" },
      16: { bg: "#f59563", text: "#ffffff" },
      32: { bg: "#f67c5f", text: "#ffffff" },
      64: { bg: "#f65e3b", text: "#ffffff" },
      128: { bg: "#edcf72", text: "#ffffff" },
      256: { bg: "#edcc61", text: "#ffffff" },
      512: { bg: "#edc850", text: "#ffffff" },
      1024: { bg: "#edc53f", text: "#ffffff" },
      2048: { bg: "#edc22e", text: "#ffffff" },
    },
  },
};

// Game logic class
class Game2048 {
  constructor(size = 4) {
    this.size = size;
    this.score = 0;
    this.board = Array(size)
      .fill()
      .map(() => Array(size).fill(0));
    this.addNewTile();
    this.addNewTile();
    this.lastUpdated = new Date().toISOString();
  }

  addNewTile() {
    const emptyCells = [];
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.board[i][j] === 0) {
          emptyCells.push({ i, j });
        }
      }
    }
    if (emptyCells.length > 0) {
      const { i, j } =
        emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.board[i][j] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  move(direction) {
    let moved = false;
    const oldBoard = this.board.map((row) => [...row]);

    if (direction === "left" || direction === "right") {
      for (let i = 0; i < this.size; i++) {
        let row = this.board[i];
        if (direction === "right") row = row.reverse();

        row = row.filter((x) => x !== 0);
        for (let j = 0; j < row.length - 1; j++) {
          if (row[j] === row[j + 1]) {
            row[j] *= 2;
            this.score += row[j];
            row.splice(j + 1, 1);
          }
        }
        while (row.length < this.size) row.push(0);
        if (direction === "right") row = row.reverse();
        this.board[i] = row;
      }
    } else {
      for (let j = 0; j < this.size; j++) {
        let column = this.board.map((row) => row[j]);
        if (direction === "down") column = column.reverse();

        column = column.filter((x) => x !== 0);
        for (let i = 0; i < column.length - 1; i++) {
          if (column[i] === column[i + 1]) {
            column[i] *= 2;
            this.score += column[i];
            column.splice(i + 1, 1);
          }
        }
        while (column.length < this.size) column.push(0);
        if (direction === "down") column = column.reverse();
        for (let i = 0; i < this.size; i++) {
          this.board[i][j] = column[i];
        }
      }
    }

    moved = !this.board.every((row, i) =>
      row.every((cell, j) => cell === oldBoard[i][j])
    );
    if (moved) {
      this.addNewTile();
      this.lastUpdated = new Date().toISOString();
    }
    return moved;
  }

  isGameOver() {
    // Check for empty cells
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.board[i][j] === 0) return false;
      }
    }

    // Check for possible merges
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (
          (i < this.size - 1 && this.board[i][j] === this.board[i + 1][j]) ||
          (j < this.size - 1 && this.board[i][j] === this.board[i][j + 1])
        ) {
          return false;
        }
      }
    }
    return true;
  }

  getState() {
    return {
      board: this.board,
      score: this.score,
      size: this.size,
      gameOver: this.isGameOver(),
      lastUpdated: this.lastUpdated,
    };
  }
}

// File operations
async function ensureGamesDir() {
  try {
    await fs.access(GAMES_DIR);
  } catch {
    await fs.mkdir(GAMES_DIR);
  }
}

async function saveGame(gameId, gameState) {
  const filePath = path.join(GAMES_DIR, `${gameId}.json`);
  await fs.writeFile(filePath, JSON.stringify(gameState, null, 2));
}

async function loadGame(gameId) {
  const filePath = path.join(GAMES_DIR, `${gameId}.json`);
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function deleteGameFile(gameId) {
  const filePath = path.join(GAMES_DIR, `${gameId}.json`);
  try {
    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

// Cleanup old games
async function cleanupOldGames() {
  const files = await fs.readdir(GAMES_DIR);
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  for (const file of files) {
    try {
      const filePath = path.join(GAMES_DIR, file);
      const stats = await fs.stat(filePath);

      if (stats.mtime < oneDayAgo) {
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.error(`Error cleaning up file ${file}:`, error);
    }
  }
}

// Tile rendering function
function renderTile(value, theme = "light", size = 100) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  const themeConfig = themes[theme];
  const tileConfig = themeConfig.tile[value] || themeConfig.tile["2048"];

  // Draw background
  ctx.fillStyle = tileConfig.bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.1);
  ctx.fill();

  // Draw text
  ctx.fillStyle = tileConfig.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Adjust font size based on number length
  const fontSize =
    size *
    (value.toString().length <= 2
      ? 0.5
      : value.toString().length === 3
      ? 0.4
      : 0.3);
  ctx.font = `bold ${fontSize}px Arial`;

  ctx.fillText(value.toString(), size / 2, size / 2);

  return canvas;
}

// API Routes
app.post("/api/games", async (req, res) => {
  try {
    const { size = 4 } = req.body;
    if (size < 3 || size > 8) {
      return res
        .status(400)
        .json({ error: "Invalid board size (3-8 allowed)" });
    }

    const gameId = Math.random().toString(36).substr(2, 9);
    const game = new Game2048(size);

    await saveGame(gameId, game.getState());

    res.json({
      gameId,
      ...game.getState(),
    });
  } catch (error) {
    console.error("Create game error:", error);
    res.status(500).json({ error: "Failed to create game" });
  }
});

app.get("/api/games/:gameId", async (req, res) => {
  try {
    const gameState = await loadGame(req.params.gameId);

    if (!gameState) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.json({
      gameId: req.params.gameId,
      ...gameState,
    });
  } catch (error) {
    console.error("Get game error:", error);
    res.status(500).json({ error: "Failed to get game state" });
  }
});

app.post("/api/games/:gameId/move", async (req, res) => {
  try {
    const { direction } = req.body;
    const gameState = await loadGame(req.params.gameId);

    if (!gameState) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (!["up", "down", "left", "right"].includes(direction)) {
      return res.status(400).json({ error: "Invalid direction" });
    }

    const game = Object.assign(new Game2048(), gameState);
    const moved = game.move(direction);

    if (moved) {
      await saveGame(req.params.gameId, game.getState());
    }

    res.json({
      gameId: req.params.gameId,
      moved,
      ...game.getState(),
    });
  } catch (error) {
    console.error("Move error:", error);
    res.status(500).json({ error: "Failed to make move" });
  }
});

app.get("/api/tiles/:value", async (req, res) => {
  try {
    const value = parseInt(req.params.value);
    const theme = req.query.theme || "light";
    const size = parseInt(req.query.size) || 100;

    if (
      isNaN(value) ||
      value <= 0 ||
      !Object.keys(themes.light.tile).includes(value.toString())
    ) {
      return res.status(400).json({ error: "Invalid tile value" });
    }

    if (!["light", "dark"].includes(theme)) {
      return res.status(400).json({ error: "Invalid theme" });
    }

    if (isNaN(size) || size < 32 || size > 512) {
      return res.status(400).json({ error: "Invalid size (32-512 allowed)" });
    }

    const canvas = renderTile(value, theme, size);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    canvas.createPNGStream().pipe(res);
  } catch (error) {
    console.error("Tile generation error:", error);
    res.status(500).json({ error: "Failed to generate tile" });
  }
});

// Board image endpoint with theme support and improved text display
app.get("/api/games/:gameId/image", async (req, res) => {
  try {
    const game = await loadGame(req.params.gameId);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    const theme = req.query.theme === "dark" ? "dark" : "light";

    // Theme colors
    const colors = {
      light: {
        background: "#faf8ef",
        board: "#bbada0",
        text: "#776e65",
        emptyCell: "#cdc1b4",
        tiles: {
          2: { bg: "#eee4da", text: "#776e65" },
          4: { bg: "#ede0c8", text: "#776e65" },
          8: { bg: "#f2b179", text: "#fff" },
          16: { bg: "#f59563", text: "#fff" },
          32: { bg: "#f67c5f", text: "#fff" },
          64: { bg: "#f65e3b", text: "#fff" },
          128: { bg: "#edcf72", text: "#fff" },
          256: { bg: "#edcc61", text: "#fff" },
          512: { bg: "#edc850", text: "#fff" },
          1024: { bg: "#edc53f", text: "#fff" },
          2048: { bg: "#edc22e", text: "#fff" },
        },
      },
      dark: {
        background: "#1a1a1a",
        board: "#2d2d2d",
        text: "#ffffff",
        emptyCell: "#3d3d3d",
        tiles: {
          2: { bg: "#3d3d3d", text: "#ffffff" },
          4: { bg: "#4d4d4d", text: "#ffffff" },
          8: { bg: "#f2b179", text: "#ffffff" },
          16: { bg: "#f59563", text: "#ffffff" },
          32: { bg: "#f67c5f", text: "#ffffff" },
          64: { bg: "#f65e3b", text: "#ffffff" },
          128: { bg: "#edcf72", text: "#ffffff" },
          256: { bg: "#edcc61", text: "#ffffff" },
          512: { bg: "#edc850", text: "#ffffff" },
          1024: { bg: "#edc53f", text: "#ffffff" },
          2048: { bg: "#edc22e", text: "#ffffff" },
        },
      },
    };

    const currentTheme = colors[theme];

    const padding = 20;
    const cellSize = 100;
    const cellGap = 10;
    const headerHeight = 80; // Increased header height
    const footerHeight = 80; // Increased footer height

    const boardSize = game.size * cellSize + (game.size + 1) * cellGap;
    const canvasWidth = boardSize + padding * 2;
    const canvasHeight = boardSize + headerHeight + footerHeight + padding * 2;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = currentTheme.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Header
    ctx.fillStyle = currentTheme.text;
    ctx.font = "bold 32px Arial"; // Increased font size
    ctx.textAlign = "left";
    ctx.fillText("2048", padding, padding + 32);

    ctx.textAlign = "right";
    ctx.fillText(`Score: ${game.score}`, canvasWidth - padding, padding + 32);

    // Board background
    ctx.fillStyle = currentTheme.board;
    ctx.fillRect(padding, padding + headerHeight, boardSize, boardSize);

    // Cells
    for (let i = 0; i < game.size; i++) {
      for (let j = 0; j < game.size; j++) {
        const value = game.board[i][j];
        const x = padding + cellGap + j * (cellSize + cellGap);
        const y = padding + headerHeight + cellGap + i * (cellSize + cellGap);

        // Cell background
        const tileStyle =
          value === 0
            ? { bg: currentTheme.emptyCell, text: currentTheme.text }
            : currentTheme.tiles[value.toString()] ||
              currentTheme.tiles["2048"];

        ctx.fillStyle = tileStyle.bg;
        ctx.beginPath();
        ctx.roundRect(x, y, cellSize, cellSize, 6);
        ctx.fill();

        if (value !== 0) {
          ctx.fillStyle = tileStyle.text;
          ctx.font = `bold ${
            value < 128 ? 48 : value < 1024 ? 40 : 34
          }px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(value.toString(), x + cellSize / 2, y + cellSize / 2);
        }
      }
    }

    const footerY = canvasHeight - footerHeight / 2;

    ctx.fillStyle = currentTheme.text;
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      `${req.params.gameId} | ${game.size}×${game.size}`,
      canvasWidth / 2,
      footerY
    );

    // Game Over status (if applicable)
    if (game.gameOver) {
      // Semi-transparent overlay
      ctx.fillStyle = `${currentTheme.background}CC`;
      ctx.fillRect(padding, padding + headerHeight, boardSize, boardSize);

      // Game Over text
      ctx.fillStyle = currentTheme.text;
      ctx.font = "bold 60px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "Game Over!",
        canvasWidth / 2,
        padding + headerHeight + boardSize / 2
      );
    }

    // Send the image
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-cache");
    canvas.createPNGStream().pipe(res);
  } catch (error) {
    console.error("Error generating board image:", error);
    res.status(500).json({ error: "Failed to generate board image" });
  }
});

app.delete("/api/games/:gameId", async (req, res) => {
  try {
    if (await deleteGameFile(req.params.gameId)) {
      res.json({ message: "Game deleted successfully" });
    } else {
      res.status(404).json({ error: "Game not found" });
    }
  } catch (error) {
    console.error("Delete game error:", error);
    res.status(500).json({ error: "Failed to delete game" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Setup and start server
async function setupServer() {
  try {
    await ensureGamesDir();

    // Initial cleanup
    await cleanupOldGames();

    // Schedule cleanup every hour
    setInterval(async () => {
      try {
        await cleanupOldGames();
      } catch (error) {
        console.error("Scheduled cleanup error:", error);
      }
    }, 60 * 60 * 1000);

    app.listen(port, () => {
      console.log(`2048 Game API running on port ${port}`);
      console.log(`Games directory: ${GAMES_DIR}`);
    });
  } catch (error) {
    console.error("Server setup error:", error);
    process.exit(1);
  }
}

setupServer();
