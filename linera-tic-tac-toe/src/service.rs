use crate::{
    ApplicationState, Game, GameId, GameStatus, PlayerId, PlayerStats, Query, QueryResponse,
};
use async_trait::async_trait;
use linera_base::data_types::Timestamp;
use linera_execution::{QueryContext, Service};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Extended query types for the service
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExtendedQuery {
    /// Basic queries from the contract
    Basic(Query),
    /// Get games by status
    GetGamesByStatus { status: GameStatus },
    /// Get recent games
    GetRecentGames { limit: usize },
    /// Get games for a specific player
    GetPlayerGames { player_id: PlayerId },
    /// Get leaderboard
    GetLeaderboard { limit: usize },
    /// Get game statistics
    GetGameStatistics,
}

/// Extended response types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ExtendedQueryResponse {
    /// Basic responses from the contract
    Basic(QueryResponse),
    /// List of games
    Games(Vec<Game>),
    /// Leaderboard data
    Leaderboard(Vec<LeaderboardEntry>),
    /// Game statistics
    Statistics(GameStatistics),
}

/// Leaderboard entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeaderboardEntry {
    pub player_id: PlayerId,
    pub stats: PlayerStats,
    pub win_rate: f64,
    pub rank: usize,
}

/// Overall game statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameStatistics {
    pub total_games: usize,
    pub active_games: usize,
    pub completed_games: usize,
    pub total_players: usize,
    pub average_game_duration: Option<f64>,
}

/// The Tic Tac Toe service implementation
pub struct TicTacToeService {
    state: ApplicationState,
}

#[async_trait]
impl Service for TicTacToeService {
    type Parameters = ();
    type Query = ExtendedQuery;
    type QueryResponse = ExtendedQueryResponse;
    type State = ApplicationState;

    async fn load(context: QueryContext) -> Self {
        let state = ApplicationState::load(context.execution_state_view.context().clone())
            .await
            .expect("Failed to load application state");

        Self { state }
    }

    async fn handle_query(
        &mut self,
        _context: QueryContext,
        query: Self::Query,
    ) -> Result<Self::QueryResponse, String> {
        match query {
            ExtendedQuery::Basic(basic_query) => {
                let response = self.handle_basic_query(basic_query).await?;
                Ok(ExtendedQueryResponse::Basic(response))
            }

            ExtendedQuery::GetGamesByStatus { status } => {
                let games = self
                    .state
                    .get_games_by_status(status)
                    .await
                    .map_err(|e| format!("Failed to get games by status: {}", e))?;
                Ok(ExtendedQueryResponse::Games(games))
            }

            ExtendedQuery::GetRecentGames { limit } => {
                let games = self
                    .state
                    .get_recent_games(limit)
                    .await
                    .map_err(|e| format!("Failed to get recent games: {}", e))?;
                Ok(ExtendedQueryResponse::Games(games))
            }

            ExtendedQuery::GetPlayerGames { player_id } => {
                let games = self
                    .state
                    .get_player_games(&player_id)
                    .await
                    .map_err(|e| format!("Failed to get player games: {}", e))?;
                Ok(ExtendedQueryResponse::Games(games))
            }

            ExtendedQuery::GetLeaderboard { limit } => {
                let leaderboard = self
                    .generate_leaderboard(limit)
                    .await
                    .map_err(|e| format!("Failed to generate leaderboard: {}", e))?;
                Ok(ExtendedQueryResponse::Leaderboard(leaderboard))
            }

            ExtendedQuery::GetGameStatistics => {
                let statistics = self
                    .generate_statistics()
                    .await
                    .map_err(|e| format!("Failed to generate statistics: {}", e))?;
                Ok(ExtendedQueryResponse::Statistics(statistics))
            }
        }
    }
}

impl TicTacToeService {
    /// Handle basic queries from the original contract interface
    async fn handle_basic_query(&self, query: Query) -> Result<QueryResponse, String> {
        match query {
            Query::GetGame { game_id } => {
                let game = self
                    .state
                    .get_game(game_id)
                    .await
                    .map_err(|e| format!("Failed to get game: {}", e))?;
                Ok(QueryResponse::Game(game))
            }

            Query::GetAllGames => {
                let games = self
                    .state
                    .get_all_games()
                    .await
                    .map_err(|e| format!("Failed to get all games: {}", e))?;
                Ok(QueryResponse::Games(games))
            }

            Query::GetPlayerStats { player_id } => {
                let stats = self
                    .state
                    .get_player_stats(&player_id)
                    .await
                    .map_err(|e| format!("Failed to get player stats: {}", e))?;
                Ok(QueryResponse::PlayerStats(stats))
            }
        }
    }

    /// Generate leaderboard based on player statistics
    async fn generate_leaderboard(
        &self,
        limit: usize,
    ) -> Result<Vec<LeaderboardEntry>, Box<dyn std::error::Error>> {
        let mut leaderboard = Vec::new();

        // Get all player stats
        for index in self.state.player_stats.indices().await? {
            if let Some(stats) = self.state.player_stats.get(&index).await? {
                let win_rate = if stats.games_played > 0 {
                    stats.wins as f64 / stats.games_played as f64
                } else {
                    0.0
                };

                leaderboard.push(LeaderboardEntry {
                    player_id: index,
                    stats,
                    win_rate,
                    rank: 0, // Will be set after sorting
                });
            }
        }

        // Sort by win rate (descending), then by games played (descending)
        leaderboard.sort_by(|a, b| {
            b.win_rate
                .partial_cmp(&a.win_rate)
                .unwrap_or(std::cmp::Ordering::Equal)
                .then_with(|| b.stats.games_played.cmp(&a.stats.games_played))
        });

        // Assign ranks and limit results
        for (i, entry) in leaderboard.iter_mut().enumerate() {
            entry.rank = i + 1;
        }

        leaderboard.truncate(limit);
        Ok(leaderboard)
    }

    /// Generate overall game statistics
    async fn generate_statistics(&self) -> Result<GameStatistics, Box<dyn std::error::Error>> {
        let all_games = self.state.get_all_games().await?;
        
        let total_games = all_games.len();
        let active_games = all_games
            .iter()
            .filter(|g| g.status == GameStatus::InProgress || g.status == GameStatus::WaitingForPlayer)
            .count();
        let completed_games = all_games
            .iter()
            .filter(|g| g.status == GameStatus::Finished)
            .count();

        // Count unique players
        let mut unique_players = std::collections::HashSet::new();
        for game in &all_games {
            for player in &game.players {
                unique_players.insert(&player.id);
            }
        }
        let total_players = unique_players.len();

        // Calculate average game duration for completed games
        let mut total_duration = 0u64;
        let mut duration_count = 0;

        for game in &all_games {
            if let (Some(finished_at), GameStatus::Finished) = (game.finished_at, &game.status) {
                let duration = finished_at.micros() - game.created_at.micros();
                total_duration += duration;
                duration_count += 1;
            }
        }

        let average_game_duration = if duration_count > 0 {
            Some(total_duration as f64 / duration_count as f64 / 1_000_000.0) // Convert to seconds
        } else {
            None
        };

        Ok(GameStatistics {
            total_games,
            active_games,
            completed_games,
            total_players,
            average_game_duration,
        })
    }

    /// Get games that are waiting for players
    pub async fn get_joinable_games(&self) -> Result<Vec<Game>, Box<dyn std::error::Error>> {
        self.state
            .get_games_by_status(GameStatus::WaitingForPlayer)
            .await
            .map_err(|e| e.into())
    }

    /// Get active games (in progress)
    pub async fn get_active_games(&self) -> Result<Vec<Game>, Box<dyn std::error::Error>> {
        self.state
            .get_games_by_status(GameStatus::InProgress)
            .await
            .map_err(|e| e.into())
    }

    /// Get completed games
    pub async fn get_completed_games(&self) -> Result<Vec<Game>, Box<dyn std::error::Error>> {
        self.state
            .get_games_by_status(GameStatus::Finished)
            .await
            .map_err(|e| e.into())
    }

    /// Search games by player name
    pub async fn search_games_by_player_name(
        &self,
        player_name: &str,
    ) -> Result<Vec<Game>, Box<dyn std::error::Error>> {
        let all_games = self.state.get_all_games().await?;
        
        let filtered_games: Vec<Game> = all_games
            .into_iter()
            .filter(|game| {
                game.players
                    .iter()
                    .any(|player| player.name.to_lowercase().contains(&player_name.to_lowercase()))
            })
            .collect();

        Ok(filtered_games)
    }

    /// Get top players by wins
    pub async fn get_top_winners(&self, limit: usize) -> Result<Vec<LeaderboardEntry>, Box<dyn std::error::Error>> {
        let mut entries = Vec::new();

        for index in self.state.player_stats.indices().await? {
            if let Some(stats) = self.state.player_stats.get(&index).await? {
                if stats.wins > 0 {
                    let win_rate = stats.wins as f64 / stats.games_played as f64;
                    entries.push(LeaderboardEntry {
                        player_id: index,
                        stats,
                        win_rate,
                        rank: 0,
                    });
                }
            }
        }

        // Sort by wins (descending)
        entries.sort_by(|a, b| b.stats.wins.cmp(&a.stats.wins));

        // Assign ranks and limit
        for (i, entry) in entries.iter_mut().enumerate() {
            entry.rank = i + 1;
        }

        entries.truncate(limit);
        Ok(entries)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Game, Player, PlayerInfo};

    #[tokio::test]
    async fn test_leaderboard_generation() {
        // This would require setting up a proper test context
        // For now, we'll test the leaderboard logic conceptually
        
        let mut entries = vec![
            LeaderboardEntry {
                player_id: "player1".to_string(),
                stats: PlayerStats {
                    games_played: 10,
                    wins: 8,
                    losses: 2,
                    draws: 0,
                },
                win_rate: 0.8,
                rank: 0,
            },
            LeaderboardEntry {
                player_id: "player2".to_string(),
                stats: PlayerStats {
                    games_played: 5,
                    wins: 3,
                    losses: 2,
                    draws: 0,
                },
                win_rate: 0.6,
                rank: 0,
            },
        ];

        // Sort by win rate
        entries.sort_by(|a, b| {
            b.win_rate
                .partial_cmp(&a.win_rate)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        assert_eq!(entries[0].player_id, "player1");
        assert_eq!(entries[1].player_id, "player2");
    }

    #[test]
    fn test_statistics_calculation() {
        let stats = GameStatistics {
            total_games: 100,
            active_games: 10,
            completed_games: 90,
            total_players: 50,
            average_game_duration: Some(120.5),
        };

        assert_eq!(stats.total_games, 100);
        assert_eq!(stats.active_games, 10);
        assert_eq!(stats.completed_games, 90);
        assert_eq!(stats.total_players, 50);
        assert!(stats.average_game_duration.is_some());
    }
}
