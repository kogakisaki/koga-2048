<h1 style="text-align: center">Koga 2048</h1>

A modern web implementation of the classic 2048 game with additional features like custom board sizes, dark theme, and game sharing capabilities.

## Features

- **Customizable Board Size**: Play with board sizes from 3x3 to 8x8
- **Theme Support**: Light and dark theme options
- **Game Sharing**:
  - Share game link with others
  - Generate and download game state images
- **Multiple Control Options**:
  - Keyboard arrows
  - Touch swipe gestures
  - Mouse/touch controls
- **Persistent Game State**:
  - Games saved on server
  - Unique game IDs
  - URL-based game loading
- **Responsive Design**:
  - Works on desktop and mobile
  - Adapts to different screen sizes
- **Browser Features**:
  - History navigation support
  - Theme preference saving

## Tech Stack

- **Frontend**:
  - HTML5
  - CSS3
  - Vanilla JavaScript
- **Backend**:
  - Node.js
  - Express.js
  - Canvas API for image generation

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/koga-2048.git
cd koga 2048
```

2. Install dependencies:

```bash
npm install
```

3. Start the server:

```bash
npm start
```

4. Open in browser:

```code
http://localhost:3000
```

## API Endpoints

### Game Management

- `POST /api/games` - Create new game

```json
Request body: { "size": 4 }
```

- `GET /api/games/:gameId` - Get game state
- `POST /api/games/:gameId/move` - Make a move

```json
Request body: { "direction": "up" | "down" | "left" | "right" }
```

- `DELETE /api/games/:gameId` - Delete game

### Image Generation

- GET /api/games/:gameId/image - Generate game board image

```code
Query parameters:
- theme: "light" | "dark"
```

## Game Controls

### Keyboard

- ↑ (Up Arrow): Move up
- ↓ (Down Arrow): Move down
- ← (Left Arrow): Move left
- → (Right Arrow): Move right

### Touch/Mobile

- Swipe up: Move up
- Swipe down: Move down
- Swipe left: Move left
- Swipe right: Move right

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## License

`MIT License` - feel free to use and modify for your projects

## Acknowledgments

- Original 2048 game by Gabriele Cirulli
- Node.js and Express.js communities

## Contact me

[![Join our Discord server!](https://invidget.switchblade.xyz/jKkWadnQhT)](https://discord.com/invite/jKkWadnQhT)
