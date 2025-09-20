const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for games (in production, this would be on Linera blockchain)
const games = new Map();
const players = new Map();

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: 8080 });

// Game state management
class TicTacToeGame {
  constructor(gameId) {
    this.id = gameId;
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.players = [];
    this.status = 'waiting'; // waiting, playing, finished
    this.winner = null;
    this.createdAt = new Date();
  }

  addPlayer(playerId, playerName) {
    if (this.players.length < 2) {
      const symbol = this.players.length === 0 ? 'X' : 'O';
      this.players.push({ id: playerId, name: playerName, symbol });
      if (this.players.length === 2) {
        this.status = 'playing';
      }
      return true;
    }
    return false;
  }

  makeMove(playerId, position) {
    if (this.status !== 'playing') return false;
    if (this.board[position] !== null) return false;
    
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.symbol !== this.currentPlayer) return false;

    this.board[position] = this.currentPlayer;
    
    if (this.checkWinner()) {
      this.winner = this.currentPlayer;
      this.status = 'finished';
    } else if (this.board.every(cell => cell !== null)) {
      this.status = 'finished';
      this.winner = 'draw';
    } else {
      this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
    }

    return true;
  }

  checkWinner() {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    return winPatterns.some(pattern => {
      const [a, b, c] = pattern;
      return this.board[a] && 
             this.board[a] === this.board[b] && 
             this.board[a] === this.board[c];
    });
  }

  getState() {
    return {
      id: this.id,
      board: this.board,
      currentPlayer: this.currentPlayer,
      players: this.players,
      status: this.status,
      winner: this.winner,
      createdAt: this.createdAt
    };
  }
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleWebSocketMessage(ws, data);
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

function handleWebSocketMessage(ws, data) {
  switch (data.type) {
    case 'join_game':
      const game = games.get(data.gameId);
      if (game) {
        ws.gameId = data.gameId;
        broadcastToGame(data.gameId, {
          type: 'game_update',
          game: game.getState()
        });
      }
      break;
  }
}

function broadcastToGame(gameId, message) {
  wss.clients.forEach(client => {
    if (client.gameId === gameId && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// REST API Routes

// Create a new game
app.post('/api/games', (req, res) => {
  const gameId = uuidv4();
  const game = new TicTacToeGame(gameId);
  games.set(gameId, game);
  
  res.json({
    success: true,
    game: game.getState()
  });
});

// Get all games
app.get('/api/games', (req, res) => {
  const gamesList = Array.from(games.values()).map(game => game.getState());
  res.json({
    success: true,
    games: gamesList
  });
});

// Get specific game
app.get('/api/games/:gameId', (req, res) => {
  const game = games.get(req.params.gameId);
  if (!game) {
    return res.status(404).json({
      success: false,
      error: 'Game not found'
    });
  }
  
  res.json({
    success: true,
    game: game.getState()
  });
});

// Join a game
app.post('/api/games/:gameId/join', (req, res) => {
  const { playerId, playerName } = req.body;
  const game = games.get(req.params.gameId);
  
  if (!game) {
    return res.status(404).json({
      success: false,
      error: 'Game not found'
    });
  }
  
  const joined = game.addPlayer(playerId, playerName);
  if (!joined) {
    return res.status(400).json({
      success: false,
      error: 'Game is full'
    });
  }
  
  // Broadcast game update
  broadcastToGame(req.params.gameId, {
    type: 'game_update',
    game: game.getState()
  });
  
  res.json({
    success: true,
    game: game.getState()
  });
});

// Make a move
app.post('/api/games/:gameId/move', (req, res) => {
  const { playerId, position } = req.body;
  const game = games.get(req.params.gameId);
  
  if (!game) {
    return res.status(404).json({
      success: false,
      error: 'Game not found'
    });
  }
  
  const moveSuccess = game.makeMove(playerId, position);
  if (!moveSuccess) {
    return res.status(400).json({
      success: false,
      error: 'Invalid move'
    });
  }
  
  // Broadcast game update
  broadcastToGame(req.params.gameId, {
    type: 'game_update',
    game: game.getState()
  });
  
  res.json({
    success: true,
    game: game.getState()
  });
});

// Player stats endpoint
app.get('/api/players/:playerId/stats', (req, res) => {
  // In a real implementation, this would query the Linera blockchain
  const stats = {
    playerId: req.params.playerId,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0
  };
  
  res.json({
    success: true,
    stats
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Linera Tic Tac Toe backend server running on port ${PORT}`);
  console.log(`WebSocket server running on port 8080`);
});

module.exports = app;
