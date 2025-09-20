import React, { useState, useEffect } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import GameList from './components/GameList';
import PlayerStats from './components/PlayerStats';
import axios from 'axios';
import io from 'socket.io-client';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';

function App() {
  const [currentView, setCurrentView] = useState('games');
  const [currentGame, setCurrentGame] = useState(null);
  const [games, setGames] = useState([]);
  const [playerStats, setPlayerStats] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Initialize player ID and WebSocket connection
  useEffect(() => {
    // Generate or retrieve player ID
    let storedPlayerId = localStorage.getItem('playerId');
    let storedPlayerName = localStorage.getItem('playerName');
    
    if (!storedPlayerId) {
      storedPlayerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('playerId', storedPlayerId);
    }
    
    if (!storedPlayerName) {
      storedPlayerName = `Player ${Math.floor(Math.random() * 1000)}`;
      localStorage.setItem('playerName', storedPlayerName);
    }
    
    setPlayerId(storedPlayerId);
    setPlayerName(storedPlayerName);

    // Initialize WebSocket connection
    const newSocket = io(WS_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    newSocket.on('game_update', (data) => {
      console.log('Game update received:', data);
      if (data.game) {
        setCurrentGame(data.game);
        // Update games list if the updated game is in the list
        setGames(prevGames => 
          prevGames.map(game => 
            game.id === data.game.id ? data.game : game
          )
        );
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    // Load initial data
    loadGames();

    return () => {
      newSocket.close();
    };
  }, []);

  // Load player stats when player ID changes
  useEffect(() => {
    if (playerId) {
      loadPlayerStats();
    }
  }, [playerId]);

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 5000);
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const loadGames = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/games`);
      if (response.data.success) {
        setGames(response.data.games);
      }
    } catch (error) {
      console.error('Error loading games:', error);
      showError('Failed to load games');
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/players/${playerId}/stats`);
      if (response.data.success) {
        setPlayerStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading player stats:', error);
    }
  };

  const createGame = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/games`, {
        player_id: playerId,
        player_name: playerName
      });
      
      if (response.data.success) {
        const newGame = response.data.game;
        setCurrentGame(newGame);
        setGames(prevGames => [newGame, ...prevGames]);
        setCurrentView('game');
        showSuccess('Game created successfully!');
        
        // Join the WebSocket room for this game
        if (socket) {
          socket.emit('join_game', { gameId: newGame.id });
        }
      }
    } catch (error) {
      console.error('Error creating game:', error);
      showError('Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async (gameId) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/games/${gameId}/join`, {
        player_id: playerId,
        player_name: playerName
      });
      
      if (response.data.success) {
        const updatedGame = response.data.game;
        setCurrentGame(updatedGame);
        setCurrentView('game');
        showSuccess('Joined game successfully!');
        
        // Join the WebSocket room for this game
        if (socket) {
          socket.emit('join_game', { gameId: updatedGame.id });
        }
      }
    } catch (error) {
      console.error('Error joining game:', error);
      showError(error.response?.data?.error || 'Failed to join game');
    } finally {
      setLoading(false);
    }
  };

  const makeMove = async (position) => {
    if (!currentGame) return;
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/games/${currentGame.id}/move`, {
        player_id: playerId,
        position: position
      });
      
      if (response.data.success) {
        const updatedGame = response.data.game;
        setCurrentGame(updatedGame);
        
        // Update games list
        setGames(prevGames => 
          prevGames.map(game => 
            game.id === updatedGame.id ? updatedGame : game
          )
        );

        // Check if game finished and update stats
        if (updatedGame.status === 'finished') {
          loadPlayerStats();
          
          if (updatedGame.winner) {
            const winner = updatedGame.players.find(p => p.symbol === updatedGame.winner);
            if (winner.id === playerId) {
              showSuccess('Congratulations! You won! 🎉');
            } else {
              showSuccess('Game finished! Better luck next time! 🎮');
            }
          } else {
            showSuccess('Game finished! It\'s a draw! 🤝');
          }
        }
      }
    } catch (error) {
      console.error('Error making move:', error);
      showError(error.response?.data?.error || 'Failed to make move');
    }
  };

  const updatePlayerName = (newName) => {
    setPlayerName(newName);
    localStorage.setItem('playerName', newName);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'game':
        return (
          <GameBoard
            game={currentGame}
            playerId={playerId}
            onMove={makeMove}
            onBackToGames={() => setCurrentView('games')}
          />
        );
      case 'stats':
        return (
          <PlayerStats
            playerId={playerId}
            playerName={playerName}
            stats={playerStats}
            onUpdateName={updatePlayerName}
            onRefresh={loadPlayerStats}
          />
        );
      default:
        return (
          <GameList
            games={games}
            playerId={playerId}
            onCreateGame={createGame}
            onJoinGame={joinGame}
            onRefresh={loadGames}
            loading={loading}
          />
        );
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h1>Linera Tic Tac Toe</h1>
        <p>Decentralized gaming on the Linera blockchain</p>
      </header>

      <nav className="nav">
        <button
          className={`nav-item ${currentView === 'games' ? 'active' : ''}`}
          onClick={() => setCurrentView('games')}
        >
          Games
        </button>
        <button
          className={`nav-item ${currentView === 'stats' ? 'active' : ''}`}
          onClick={() => setCurrentView('stats')}
        >
          My Stats
        </button>
      </nav>

      <div className="container">
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        
        <div className="player-info card">
          <h3>Player Info</h3>
          <p><strong>ID:</strong> {playerId}</p>
          <p><strong>Name:</strong> {playerName}</p>
          <p><strong>Status:</strong> {socket?.connected ? '🟢 Connected' : '🔴 Disconnected'}</p>
        </div>

        {renderCurrentView()}
      </div>

      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 Linera Tic Tac Toe. Built with ❤️ on Linera blockchain.</p>
          <p>
            <a href="https://linera.io" target="_blank" rel="noopener noreferrer">
              Learn more about Linera
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
