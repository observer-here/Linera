use crate::{Game, GameId, GameResult, Player, PlayerStats, PlayerId, TicTacToeError, TicTacToeState};
use linera_base::data_types::Timestamp;
use linera_views::{
    common::Context,
    map_view::MapView,
    register_view::RegisterView,
    views::{View, ViewError},
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// The application state stored on the blockchain
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApplicationState {
    /// Counter for generating unique game IDs
    pub next_game_id: RegisterView<GameId>,
    /// Map of all games
    pub games: MapView<GameId, Game>,
    /// Map of player statistics
    pub player_stats: MapView<PlayerId, PlayerStats>,
}

impl ApplicationState {
    /// Create a new game
    pub async fn create_game(
        &mut self,
        player_id: PlayerId,
        player_name: String,
        timestamp: Timestamp,
    ) -> Result<GameId, ViewError> {
        let game_id = self.next_game_id.get();
        let game = Game::new(game_id, player_id.clone(), player_name, timestamp);
        
        self.games.insert(&game_id, game)?;
        self.next_game_id.set(game_id + 1);
        
        // Initialize player stats if they don't exist
        if !self.player_stats.contains_key(&player_id).await? {
            self.player_stats.insert(&player_id, PlayerStats::default())?;
        }
        
        Ok(game_id)
    }

    /// Join an existing game
    pub async fn join_game(
        &mut self,
        game_id: GameId,
        player_id: PlayerId,
        player_name: String,
    ) -> Result<(), TicTacToeError> {
        let mut game = self.games.get(&game_id).await
            .map_err(|_| TicTacToeError::GameNotFound)?
            .ok_or(TicTacToeError::GameNotFound)?;
        
        game.add_player(player_id.clone(), player_name)?;
        self.games.insert(&game_id, game).map_err(|_| TicTacToeError::GameNotFound)?;
        
        // Initialize player stats if they don't exist
        if !self.player_stats.contains_key(&player_id).await.unwrap_or(false) {
            self.player_stats.insert(&player_id, PlayerStats::default())
                .map_err(|_| TicTacToeError::GameNotFound)?;
        }
        
        Ok(())
    }

    /// Make a move in a game
    pub async fn make_move(
        &mut self,
        game_id: GameId,
        player_id: PlayerId,
        position: usize,
        timestamp: Timestamp,
    ) -> Result<Game, TicTacToeError> {
        let mut game = self.games.get(&game_id).await
            .map_err(|_| TicTacToeError::GameNotFound)?
            .ok_or(TicTacToeError::GameNotFound)?;
        
        let was_finished = game.status == crate::GameStatus::Finished;
        game.make_move(&player_id, position, timestamp)?;
        
        // If game just finished, update player stats
        if !was_finished && game.status == crate::GameStatus::Finished {
            self.update_player_stats_after_game(&game).await?;
        }
        
        self.games.insert(&game_id, game.clone()).map_err(|_| TicTacToeError::GameNotFound)?;
        Ok(game)
    }

    /// Get a specific game
    pub async fn get_game(&self, game_id: GameId) -> Result<Option<Game>, ViewError> {
        self.games.get(&game_id).await
    }

    /// Get all games
    pub async fn get_all_games(&self) -> Result<Vec<Game>, ViewError> {
        let mut games = Vec::new();
        for index in self.games.indices().await? {
            if let Some(game) = self.games.get(&index).await? {
                games.push(game);
            }
        }
        Ok(games)
    }

    /// Get player statistics
    pub async fn get_player_stats(&self, player_id: &PlayerId) -> Result<PlayerStats, ViewError> {
        Ok(self.player_stats.get(player_id).await?.unwrap_or_default())
    }

    /// Update player statistics after a game finishes
    async fn update_player_stats_after_game(&mut self, game: &Game) -> Result<(), TicTacToeError> {
        if game.players.len() != 2 {
            return Ok(()); // Can't update stats for incomplete games
        }

        let player1 = &game.players[0];
        let player2 = &game.players[1];

        // Determine results for each player
        let (result1, result2) = match game.winner {
            Some(winner) => {
                if player1.symbol == winner {
                    (GameResult::Win, GameResult::Loss)
                } else {
                    (GameResult::Loss, GameResult::Win)
                }
            }
            None => (GameResult::Draw, GameResult::Draw),
        };

        // Update player 1 stats
        let mut stats1 = self.get_player_stats(&player1.id).await
            .map_err(|_| TicTacToeError::GameNotFound)?;
        stats1.update_after_game(result1);
        self.player_stats.insert(&player1.id, stats1)
            .map_err(|_| TicTacToeError::GameNotFound)?;

        // Update player 2 stats
        let mut stats2 = self.get_player_stats(&player2.id).await
            .map_err(|_| TicTacToeError::GameNotFound)?;
        stats2.update_after_game(result2);
        self.player_stats.insert(&player2.id, stats2)
            .map_err(|_| TicTacToeError::GameNotFound)?;

        Ok(())
    }

    /// Get games by status
    pub async fn get_games_by_status(&self, status: crate::GameStatus) -> Result<Vec<Game>, ViewError> {
        let mut filtered_games = Vec::new();
        for index in self.games.indices().await? {
            if let Some(game) = self.games.get(&index).await? {
                if game.status == status {
                    filtered_games.push(game);
                }
            }
        }
        Ok(filtered_games)
    }

    /// Get recent games (last N games)
    pub async fn get_recent_games(&self, limit: usize) -> Result<Vec<Game>, ViewError> {
        let mut all_games = self.get_all_games().await?;
        
        // Sort by creation time (most recent first)
        all_games.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        
        // Take only the requested number
        all_games.truncate(limit);
        
        Ok(all_games)
    }

    /// Get games for a specific player
    pub async fn get_player_games(&self, player_id: &PlayerId) -> Result<Vec<Game>, ViewError> {
        let mut player_games = Vec::new();
        for index in self.games.indices().await? {
            if let Some(game) = self.games.get(&index).await? {
                if game.players.iter().any(|p| p.id == *player_id) {
                    player_games.push(game);
                }
            }
        }
        Ok(player_games)
    }
}

#[async_trait::async_trait]
impl View<Context> for ApplicationState {
    fn context(&self) -> &Context {
        self.games.context()
    }

    async fn load(context: Context) -> Result<Self, ViewError> {
        let next_game_id = RegisterView::load(context.clone()).await?;
        let games = MapView::load(context.clone()).await?;
        let player_stats = MapView::load(context).await?;
        
        Ok(Self {
            next_game_id,
            games,
            player_stats,
        })
    }

    async fn rollback(&mut self) -> Result<(), ViewError> {
        self.next_game_id.rollback().await?;
        self.games.rollback().await?;
        self.player_stats.rollback().await?;
        Ok(())
    }

    async fn flush(&mut self) -> Result<(), ViewError> {
        self.next_game_id.flush().await?;
        self.games.flush().await?;
        self.player_stats.flush().await?;
        Ok(())
    }

    fn delete(self) -> Result<(), ViewError> {
        self.next_game_id.delete()?;
        self.games.delete()?;
        self.player_stats.delete()?;
        Ok(())
    }
}
