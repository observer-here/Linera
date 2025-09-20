import React, { useState, useEffect } from 'react';
import './GameList.css';

const GameList = ({ games, playerId, onCreateGame, onJoinGame, onRefresh, loading }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'waiting':
        return { text: 'Waiting for Player', class: 'status-waiting' };
      case 'playing':
        return { text: 'In Progress', class: 'status-playing' };
      case 'finished':
        return { text: 'Finished', class: 'status-finished' };
      default:
        return { text: status, class: '' };
    }
  };

  const getGameResult = (game) => {
    if (game.status !== 'finished') return null;
    
    if (!game.winner) return 'Draw';
    
    const winner = game.players.find(p => p.symbol === game.winner);
    if (winner?.id === playerId) return 'You Won!';
    
    return `${winner?.name || 'Opponent'} Won`;
  };

  const canJoinGame = (game) => {
    return game.status === 'waiting' && 
           game.players.length < 2 && 
           !game.players.some(p => p.id === playerId);
  };

  const isPlayerInGame = (game) => {
    return game.players.some(p => p.id === playerId);
  };

  const filteredAndSortedGames = React.useMemo(() => {
    let filtered = games;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(game => {
        switch (filter) {
          case 'joinable':
            return canJoinGame(game);
          case 'my-games':
            return isPlayerInGame(game);
          case 'waiting':
            return game.status === 'waiting';
          case 'playing':
            return game.status === 'playing';
          case 'finished':
            return game.status === 'finished';
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(game => 
        game.id.toString().includes(searchTerm) ||
        game.players.some(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'players':
          return b.players.length - a.players.length;
        default:
          return 0;
      }
    });

    return filtered;
  }, [games, filter, sortBy, searchTerm, playerId]);

  const getFilterCounts = () => {
    return {
      all: games.length,
      joinable: games.filter(canJoinGame).length,
      'my-games': games.filter(isPlayerInGame).length,
      waiting: games.filter(g => g.status === 'waiting').length,
      playing: games.filter(g => g.status === 'playing').length,
      finished: games.filter(g => g.status === 'finished').length,
    };
  };

  const counts = getFilterCounts();

  return (
    <div className="game-list-container fade-in-up">
      <div className="game-list-header">
        <div className="header-top">
          <h2>Game Lobby</h2>
          <div className="header-actions">
            <button 
              className="btn btn-success create-game-btn" 
              onClick={onCreateGame}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Creating...
                </>
              ) : (
                '+ Create New Game'
              )}
            </button>
            <button 
              className="btn btn-secondary refresh-btn" 
              onClick={onRefresh}
              disabled={loading}
            >
              {loading ? (
                <div className="spinner"></div>
              ) : (
                '↻ Refresh'
              )}
            </button>
          </div>
        </div>

        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by game ID or player name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input search-input"
            />
          </div>

          <div className="filter-tabs">
            {[
              { key: 'all', label: 'All Games' },
              { key: 'joinable', label: 'Joinable' },
              { key: 'my-games', label: 'My Games' },
              { key: 'waiting', label: 'Waiting' },
              { key: 'playing', label: 'Playing' },
              { key: 'finished', label: 'Finished' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`filter-tab ${filter === key ? 'active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {label}
                <span className="count">({counts[key]})</span>
              </button>
            ))}
          </div>

          <div className="sort-section">
            <label htmlFor="sort-select" className="sort-label">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="status">Status</option>
              <option value="players">Player Count</option>
            </select>
          </div>
        </div>
      </div>

      <div className="games-grid">
        {loading && games.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading games...</p>
          </div>
        ) : filteredAndSortedGames.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎮</div>
            <h3>No games found</h3>
            <p>
              {searchTerm || filter !== 'all' 
                ? 'Try adjusting your filters or search term.'
                : 'Be the first to create a game!'
              }
            </p>
            {!searchTerm && filter === 'all' && (
              <button className="btn btn-success" onClick={onCreateGame}>
                Create First Game
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedGames.map((game) => {
            const statusInfo = getStatusDisplay(game.status);
            const gameResult = getGameResult(game);
            const playerInGame = isPlayerInGame(game);
            const canJoin = canJoinGame(game);

            return (
              <div key={game.id} className={`game-card ${playerInGame ? 'my-game' : ''}`}>
                <div className="game-card-header">
                  <div className="game-id">Game #{game.id}</div>
                  <div className={`game-status ${statusInfo.class}`}>
                    {statusInfo.text}
                  </div>
                </div>

                <div className="game-card-body">
                  <div className="players-section">
                    <h4>Players ({game.players.length}/2)</h4>
                    <div className="players-list">
                      {game.players.map((player, index) => (
                        <div 
                          key={player.id} 
                          className={`player ${player.id === playerId ? 'current-player' : ''}`}
                        >
                          <span className="player-symbol">{player.symbol}</span>
                          <span className="player-name">
                            {player.name}
                            {player.id === playerId && ' (You)'}
                          </span>
                        </div>
                      ))}
                      {game.players.length < 2 && (
                        <div className="empty-slot">
                          <span className="empty-symbol">?</span>
                          <span className="empty-text">Waiting for player...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {game.status === 'playing' && (
                    <div className="current-turn">
                      <strong>Current Turn:</strong> {
                        game.players.find(p => p.symbol === game.current_player)?.name || 'Unknown'
                      } ({game.current_player})
                    </div>
                  )}

                  {gameResult && (
                    <div className={`game-result ${
                      gameResult === 'You Won!' ? 'win' : 
                      gameResult === 'Draw' ? 'draw' : 'loss'
                    }`}>
                      {gameResult}
                    </div>
                  )}

                  <div className="game-meta">
                    <div className="created-time">
                      Created: {new Date(game.created_at).toLocaleString()}
                    </div>
                    {game.finished_at && (
                      <div className="finished-time">
                        Finished: {new Date(game.finished_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="game-card-actions">
                  {canJoin && (
                    <button 
                      className="btn btn-success join-btn"
                      onClick={() => onJoinGame(game.id)}
                      disabled={loading}
                    >
                      Join Game
                    </button>
                  )}
                  
                  {playerInGame && game.status !== 'finished' && (
                    <button 
                      className="btn continue-btn"
                      onClick={() => onJoinGame(game.id)}
                    >
                      Continue Game
                    </button>
                  )}
                  
                  {game.status === 'finished' && (
                    <button 
                      className="btn btn-secondary view-btn"
                      onClick={() => onJoinGame(game.id)}
                    >
                      View Game
                    </button>
                  )}
                  
                  {!canJoin && !playerInGame && game.status === 'waiting' && (
                    <div className="waiting-indicator">
                      <div className="spinner small"></div>
                      Waiting for players
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {filteredAndSortedGames.length > 0 && (
        <div className="games-summary">
          <p>
            Showing {filteredAndSortedGames.length} of {games.length} games
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>
      )}
    </div>
  );
};

export default GameList;
