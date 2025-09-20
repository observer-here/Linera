import React, { useState, useEffect } from 'react';
import './GameBoard.css';

const GameBoard = ({ game, playerId, onMove, onBackToGames }) => {
  const [selectedCell, setSelectedCell] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);

  useEffect(() => {
    if (game) {
      // Add current game state to history if it's different from the last entry
      setGameHistory(prev => {
        const lastEntry = prev[prev.length - 1];
        if (!lastEntry || JSON.stringify(lastEntry.board) !== JSON.stringify(game.board)) {
          return [...prev, { ...game, timestamp: Date.now() }];
        }
        return prev;
      });
    }
  }, [game]);

  if (!game) {
    return (
      <div className="game-board-container">
        <div className="card">
          <h2>No Game Selected</h2>
          <p>Please select a game to play.</p>
          <button className="btn" onClick={onBackToGames}>
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  const currentPlayer = game.players.find(p => p.id === playerId);
  const opponent = game.players.find(p => p.id !== playerId);
  const isMyTurn = currentPlayer && game.current_player === currentPlayer.symbol;
  const canPlay = game.status === 'playing' && isMyTurn;

  const handleCellClick = (index) => {
    if (!canPlay || game.board[index] !== null) {
      return;
    }
    
    setSelectedCell(index);
    setTimeout(() => {
      onMove(index);
      setSelectedCell(null);
    }, 150);
  };

  const getGameStatusMessage = () => {
    switch (game.status) {
      case 'waiting':
        return 'Waiting for another player to join...';
      case 'playing':
        if (isMyTurn) {
          return "It's your turn!";
        } else {
          return `Waiting for ${opponent?.name || 'opponent'}'s move...`;
        }
      case 'finished':
        if (game.winner) {
          const winner = game.players.find(p => p.symbol === game.winner);
          if (winner.id === playerId) {
            return '🎉 You won! Congratulations!';
          } else {
            return `${winner.name} won! Better luck next time.`;
          }
        } else {
          return "It's a draw! Good game!";
        }
      default:
        return 'Unknown game status';
    }
  };

  const getStatusClass = () => {
    switch (game.status) {
      case 'waiting':
        return 'status-waiting';
      case 'playing':
        return 'status-playing';
      case 'finished':
        return 'status-finished';
      default:
        return '';
    }
  };

  const getCellContent = (index) => {
    const cellValue = game.board[index];
    if (cellValue === 'X') {
      return <span className="symbol symbol-x">✕</span>;
    } else if (cellValue === 'O') {
      return <span className="symbol symbol-o">◯</span>;
    }
    return null;
  };

  const getCellClass = (index) => {
    let className = 'cell';
    
    if (game.board[index] !== null) {
      className += ' occupied';
    } else if (canPlay) {
      className += ' playable';
    }
    
    if (selectedCell === index) {
      className += ' selected';
    }
    
    // Add winning line highlight if game is finished
    if (game.status === 'finished' && game.winner) {
      const winningLines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
      ];
      
      const winningLine = winningLines.find(line => 
        line.every(pos => game.board[pos] === game.winner)
      );
      
      if (winningLine && winningLine.includes(index)) {
        className += ' winning-cell';
      }
    }
    
    return className;
  };

  const resetGame = () => {
    // This would typically create a new game
    setGameHistory([]);
    onBackToGames();
  };

  return (
    <div className="game-board-container fade-in-up">
      <div className="game-header">
        <button className="btn btn-secondary back-btn" onClick={onBackToGames}>
          ← Back to Games
        </button>
        <h2>Game #{game.id}</h2>
        <div className={`game-status ${getStatusClass()}`}>
          {getGameStatusMessage()}
        </div>
      </div>

      <div className="game-content">
        <div className="players-info card">
          <h3>Players</h3>
          <div className="players-list">
            {game.players.map((player, index) => (
              <div 
                key={player.id} 
                className={`player-item ${player.id === playerId ? 'current-player' : ''} ${
                  game.current_player === player.symbol ? 'active-turn' : ''
                }`}
              >
                <div className="player-symbol">
                  {player.symbol === 'X' ? '✕' : '◯'}
                </div>
                <div className="player-details">
                  <div className="player-name">
                    {player.name} {player.id === playerId && '(You)'}
                  </div>
                  <div className="player-symbol-text">
                    Playing as {player.symbol}
                  </div>
                </div>
                {game.current_player === player.symbol && game.status === 'playing' && (
                  <div className="turn-indicator">
                    <span className="pulse">●</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {game.players.length < 2 && (
            <div className="waiting-message">
              <div className="spinner"></div>
              Waiting for another player to join...
            </div>
          )}
        </div>

        <div className="board-container card">
          <div className="board">
            {Array.from({ length: 9 }, (_, index) => (
              <button
                key={index}
                className={getCellClass(index)}
                onClick={() => handleCellClick(index)}
                disabled={!canPlay || game.board[index] !== null}
                aria-label={`Cell ${index + 1}`}
              >
                {getCellContent(index)}
                {canPlay && game.board[index] === null && (
                  <span className="hover-preview">
                    {currentPlayer.symbol === 'X' ? '✕' : '◯'}
                  </span>
                )}
              </button>
            ))}
          </div>
          
          {game.status === 'finished' && (
            <div className="game-over-overlay">
              <div className="game-over-content">
                <h3>Game Over!</h3>
                <p>{getGameStatusMessage()}</p>
                <div className="game-over-actions">
                  <button className="btn btn-success" onClick={resetGame}>
                    New Game
                  </button>
                  <button className="btn" onClick={onBackToGames}>
                    Back to Games
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="game-info card">
          <h3>Game Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span className={`info-value status ${getStatusClass()}`}>
                {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Current Turn:</span>
              <span className="info-value">
                {game.status === 'playing' ? (
                  <>
                    {game.current_player} ({game.players.find(p => p.symbol === game.current_player)?.name || 'Unknown'})
                  </>
                ) : (
                  'N/A'
                )}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Created:</span>
              <span className="info-value">
                {new Date(game.created_at).toLocaleString()}
              </span>
            </div>
            {game.finished_at && (
              <div className="info-item">
                <span className="info-label">Finished:</span>
                <span className="info-value">
                  {new Date(game.finished_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {gameHistory.length > 1 && (
        <div className="game-history card">
          <h3>Move History</h3>
          <div className="history-list">
            {gameHistory.slice(1).map((state, index) => {
              const moveIndex = state.board.findIndex((cell, i) => 
                gameHistory[index].board[i] !== cell && cell !== null
              );
              const player = state.players.find(p => p.symbol === state.board[moveIndex]);
              
              return (
                <div key={index} className="history-item">
                  <span className="move-number">#{index + 1}</span>
                  <span className="move-player">{player?.name || 'Unknown'}</span>
                  <span className="move-symbol">{state.board[moveIndex]}</span>
                  <span className="move-position">Position {moveIndex + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
