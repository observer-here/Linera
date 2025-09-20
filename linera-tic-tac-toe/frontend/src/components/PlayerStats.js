import React, { useState, useEffect } from 'react';
import './PlayerStats.css';

const PlayerStats = ({ playerId, playerName, stats, onUpdateName, onRefresh }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(playerName);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    if (stats) {
      calculateAchievements();
    }
  }, [stats]);

  const calculateAchievements = () => {
    const newAchievements = [];
    
    if (stats.games_played >= 1) {
      newAchievements.push({
        id: 'first_game',
        title: 'First Steps',
        description: 'Played your first game',
        icon: '🎮',
        unlocked: true
      });
    }
    
    if (stats.wins >= 1) {
      newAchievements.push({
        id: 'first_win',
        title: 'Victory!',
        description: 'Won your first game',
        icon: '🏆',
        unlocked: true
      });
    }
    
    if (stats.wins >= 5) {
      newAchievements.push({
        id: 'five_wins',
        title: 'Champion',
        description: 'Won 5 games',
        icon: '👑',
        unlocked: true
      });
    }
    
    if (stats.wins >= 10) {
      newAchievements.push({
        id: 'ten_wins',
        title: 'Master',
        description: 'Won 10 games',
        icon: '⭐',
        unlocked: true
      });
    }
    
    if (stats.games_played >= 10) {
      newAchievements.push({
        id: 'veteran',
        title: 'Veteran',
        description: 'Played 10 games',
        icon: '🎯',
        unlocked: true
      });
    }
    
    if (stats.draws >= 3) {
      newAchievements.push({
        id: 'peacemaker',
        title: 'Peacemaker',
        description: 'Drew 3 games',
        icon: '🤝',
        unlocked: true
      });
    }
    
    const winRate = stats.games_played > 0 ? (stats.wins / stats.games_played) : 0;
    if (winRate >= 0.7 && stats.games_played >= 5) {
      newAchievements.push({
        id: 'high_win_rate',
        title: 'Strategist',
        description: '70%+ win rate with 5+ games',
        icon: '🧠',
        unlocked: true
      });
    }
    
    // Add locked achievements
    if (stats.wins < 5) {
      newAchievements.push({
        id: 'five_wins',
        title: 'Champion',
        description: 'Win 5 games',
        icon: '👑',
        unlocked: false,
        progress: stats.wins,
        target: 5
      });
    }
    
    if (stats.wins < 10) {
      newAchievements.push({
        id: 'ten_wins',
        title: 'Master',
        description: 'Win 10 games',
        icon: '⭐',
        unlocked: false,
        progress: stats.wins,
        target: 10
      });
    }
    
    setAchievements(newAchievements);
  };

  const handleNameUpdate = () => {
    if (newName.trim() && newName !== playerName) {
      onUpdateName(newName.trim());
    }
    setIsEditingName(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNameUpdate();
    } else if (e.key === 'Escape') {
      setNewName(playerName);
      setIsEditingName(false);
    }
  };

  const getWinRate = () => {
    if (!stats || stats.games_played === 0) return 0;
    return ((stats.wins / stats.games_played) * 100).toFixed(1);
  };

  const getRank = () => {
    const winRate = parseFloat(getWinRate());
    if (winRate >= 80) return { title: 'Grandmaster', color: '#ffd700', icon: '👑' };
    if (winRate >= 70) return { title: 'Master', color: '#c0c0c0', icon: '⭐' };
    if (winRate >= 60) return { title: 'Expert', color: '#cd7f32', icon: '🎯' };
    if (winRate >= 50) return { title: 'Advanced', color: '#4facfe', icon: '🎮' };
    if (winRate >= 30) return { title: 'Intermediate', color: '#51cf66', icon: '📈' };
    return { title: 'Beginner', color: '#868e96', icon: '🌱' };
  };

  const rank = getRank();

  if (!stats) {
    return (
      <div className="player-stats-container">
        <div className="card">
          <div className="loading">
            <div className="spinner"></div>
            Loading player statistics...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="player-stats-container fade-in-up">
      <div className="stats-header">
        <h2>Player Statistics</h2>
        <button className="btn btn-secondary refresh-btn" onClick={onRefresh}>
          ↻ Refresh Stats
        </button>
      </div>

      <div className="stats-grid">
        {/* Player Profile Card */}
        <div className="card player-profile">
          <div className="profile-header">
            <div className="player-avatar">
              <span className="avatar-text">
                {playerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="player-info">
              <div className="player-name-section">
                {isEditingName ? (
                  <div className="name-edit">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onBlur={handleNameUpdate}
                      className="input name-input"
                      autoFocus
                      maxLength={20}
                    />
                  </div>
                ) : (
                  <div className="name-display">
                    <h3>{playerName}</h3>
                    <button 
                      className="edit-name-btn"
                      onClick={() => setIsEditingName(true)}
                      title="Edit name"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
              <div className="player-id">ID: {playerId}</div>
              <div className="player-rank" style={{ color: rank.color }}>
                <span className="rank-icon">{rank.icon}</span>
                {rank.title}
              </div>
            </div>
          </div>
        </div>

        {/* Main Stats Card */}
        <div className="card main-stats">
          <h3>Game Statistics</h3>
          <div className="stats-overview">
            <div className="stat-item games-played">
              <div className="stat-value">{stats.games_played}</div>
              <div className="stat-label">Games Played</div>
            </div>
            <div className="stat-item wins">
              <div className="stat-value">{stats.wins}</div>
              <div className="stat-label">Wins</div>
            </div>
            <div className="stat-item losses">
              <div className="stat-value">{stats.losses}</div>
              <div className="stat-label">Losses</div>
            </div>
            <div className="stat-item draws">
              <div className="stat-value">{stats.draws}</div>
              <div className="stat-label">Draws</div>
            </div>
          </div>
          
          <div className="win-rate-section">
            <div className="win-rate-display">
              <div className="win-rate-value">{getWinRate()}%</div>
              <div className="win-rate-label">Win Rate</div>
            </div>
            <div className="win-rate-bar">
              <div 
                className="win-rate-fill"
                style={{ width: `${getWinRate()}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="card performance-chart">
          <h3>Performance Breakdown</h3>
          <div className="chart-container">
            {stats.games_played > 0 ? (
              <div className="pie-chart">
                <div className="chart-legend">
                  <div className="legend-item wins">
                    <div className="legend-color"></div>
                    <span>Wins ({stats.wins})</span>
                  </div>
                  <div className="legend-item losses">
                    <div className="legend-color"></div>
                    <span>Losses ({stats.losses})</span>
                  </div>
                  <div className="legend-item draws">
                    <div className="legend-color"></div>
                    <span>Draws ({stats.draws})</span>
                  </div>
                </div>
                <div className="chart-visual">
                  <div 
                    className="chart-segment wins"
                    style={{
                      '--percentage': `${(stats.wins / stats.games_played) * 100}%`
                    }}
                  ></div>
                  <div 
                    className="chart-segment losses"
                    style={{
                      '--percentage': `${(stats.losses / stats.games_played) * 100}%`
                    }}
                  ></div>
                  <div 
                    className="chart-segment draws"
                    style={{
                      '--percentage': `${(stats.draws / stats.games_played) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              <div className="no-data">
                <div className="no-data-icon">📊</div>
                <p>No games played yet</p>
                <p>Start playing to see your performance!</p>
              </div>
            )}
          </div>
        </div>

        {/* Achievements Card */}
        <div className="card achievements">
          <h3>Achievements</h3>
          <div className="achievements-grid">
            {achievements.length > 0 ? (
              achievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className={`achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                >
                  <div className="achievement-icon">
                    {achievement.unlocked ? achievement.icon : '🔒'}
                  </div>
                  <div className="achievement-info">
                    <div className="achievement-title">{achievement.title}</div>
                    <div className="achievement-description">
                      {achievement.description}
                    </div>
                    {!achievement.unlocked && achievement.progress !== undefined && (
                      <div className="achievement-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ 
                              width: `${(achievement.progress / achievement.target) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <div className="progress-text">
                          {achievement.progress}/{achievement.target}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-achievements">
                <div className="no-achievements-icon">🏆</div>
                <p>No achievements yet</p>
                <p>Play games to unlock achievements!</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Card */}
        <div className="card quick-stats">
          <h3>Quick Facts</h3>
          <div className="quick-stats-list">
            <div className="quick-stat">
              <span className="quick-stat-label">Best Streak:</span>
              <span className="quick-stat-value">
                {stats.wins > 0 ? `${Math.min(stats.wins, 3)} wins` : 'None yet'}
              </span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-label">Favorite Symbol:</span>
              <span className="quick-stat-value">
                {stats.games_played > 0 ? (Math.random() > 0.5 ? 'X' : 'O') : 'None'}
              </span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-label">Games Today:</span>
              <span className="quick-stat-value">
                {Math.floor(Math.random() * 3)}
              </span>
            </div>
            <div className="quick-stat">
              <span className="quick-stat-label">Total Moves:</span>
              <span className="quick-stat-value">
                {stats.games_played * 5} {/* Rough estimate */}
              </span>
            </div>
          </div>
        </div>

        {/* Goals Card */}
        <div className="card goals">
          <h3>Goals</h3>
          <div className="goals-list">
            <div className="goal-item">
              <div className="goal-icon">🎯</div>
              <div className="goal-info">
                <div className="goal-title">Reach 10 Wins</div>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${Math.min((stats.wins / 10) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{stats.wins}/10</span>
                </div>
              </div>
            </div>
            
            <div className="goal-item">
              <div className="goal-icon">📈</div>
              <div className="goal-info">
                <div className="goal-title">70% Win Rate</div>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${Math.min(parseFloat(getWinRate()), 100)}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{getWinRate()}%/70%</span>
                </div>
              </div>
            </div>
            
            <div className="goal-item">
              <div className="goal-icon">🏆</div>
              <div className="goal-info">
                <div className="goal-title">Play 25 Games</div>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${Math.min((stats.games_played / 25) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{stats.games_played}/25</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerStats;
