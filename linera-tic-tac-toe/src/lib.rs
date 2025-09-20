use async_trait::async_trait;
use linera_base::{
    data_types::{ApplicationId, BlockHeight, Timestamp},
    identifiers::{ChainId, MessageId},
};
use linera_execution::{
    ApplicationCallResult, ExecutionResult, MessageContext, OperationContext, QueryContext,
    SessionCallResult,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use thiserror::Error;

/// Application state for the Tic Tac Toe game
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TicTacToeState {
    pub games: HashMap<GameId, Game>,
    pub player_stats: HashMap<PlayerId, PlayerStats>,
}

/// Unique identifier for a game
pub type GameId = u64;

/// Unique identifier for a player
pub type PlayerId = String;

/// Represents a player in the game
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Player {
    X,
    O,
}

/// Current status of a game
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum GameStatus {
    WaitingForPlayer,
    InProgress,
    Finished,
}

/// Information about a player
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerInfo {
    pub id: PlayerId,
    pub name: String,
    pub symbol: Player,
}

/// Game state structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Game {
    pub id: GameId,
    pub board: [Option<Player>; 9],
    pub current_player: Player,
    pub status: GameStatus,
    pub players: Vec<PlayerInfo>,
    pub winner: Option<Player>,
    pub created_at: Timestamp,
    pub finished_at: Option<Timestamp>,
}

/// Player statistics
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct PlayerStats {
    pub games_played: u32,
    pub wins: u32,
    pub losses: u32,
    pub draws: u32,
}

/// Operations that can be performed on the contract
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Operation {
    CreateGame {
        player_id: PlayerId,
        player_name: String,
    },
    JoinGame {
        game_id: GameId,
        player_id: PlayerId,
        player_name: String,
    },
    MakeMove {
        game_id: GameId,
        player_id: PlayerId,
        position: usize,
    },
}

/// Messages that can be sent between chains
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Message {
    GameUpdate {
        game_id: GameId,
        game: Game,
    },
}

/// Queries that can be made to the contract
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Query {
    GetGame { game_id: GameId },
    GetAllGames,
    GetPlayerStats { player_id: PlayerId },
}

/// Response types for queries
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum QueryResponse {
    Game(Option<Game>),
    Games(Vec<Game>),
    PlayerStats(PlayerStats),
}

/// Custom error types
#[derive(Debug, Error)]
pub enum TicTacToeError {
    #[error("Game not found")]
    GameNotFound,
    #[error("Game is full")]
    GameFull,
    #[error("Invalid move: position {0} is already occupied")]
    InvalidMove(usize),
    #[error("Not your turn")]
    NotYourTurn,
    #[error("Game is not in progress")]
    GameNotInProgress,
    #[error("Player not in game")]
    PlayerNotInGame,
    #[error("Invalid position: {0}")]
    InvalidPosition(usize),
}

impl Game {
    /// Create a new game with the first player
    pub fn new(id: GameId, player_id: PlayerId, player_name: String, created_at: Timestamp) -> Self {
        let player_info = PlayerInfo {
            id: player_id,
            name: player_name,
            symbol: Player::X,
        };

        Self {
            id,
            board: [None; 9],
            current_player: Player::X,
            status: GameStatus::WaitingForPlayer,
            players: vec![player_info],
            winner: None,
            created_at,
            finished_at: None,
        }
    }

    /// Add a second player to the game
    pub fn add_player(&mut self, player_id: PlayerId, player_name: String) -> Result<(), TicTacToeError> {
        if self.players.len() >= 2 {
            return Err(TicTacToeError::GameFull);
        }

        let player_info = PlayerInfo {
            id: player_id,
            name: player_name,
            symbol: Player::O,
        };

        self.players.push(player_info);
        self.status = GameStatus::InProgress;
        Ok(())
    }

    /// Make a move in the game
    pub fn make_move(&mut self, player_id: &PlayerId, position: usize, timestamp: Timestamp) -> Result<(), TicTacToeError> {
        // Validate position
        if position >= 9 {
            return Err(TicTacToeError::InvalidPosition(position));
        }

        // Check if game is in progress
        if self.status != GameStatus::InProgress {
            return Err(TicTacToeError::GameNotInProgress);
        }

        // Check if position is empty
        if self.board[position].is_some() {
            return Err(TicTacToeError::InvalidMove(position));
        }

        // Find the player and check if it's their turn
        let player = self.players.iter()
            .find(|p| p.id == *player_id)
            .ok_or(TicTacToeError::PlayerNotInGame)?;

        if player.symbol != self.current_player {
            return Err(TicTacToeError::NotYourTurn);
        }

        // Make the move
        self.board[position] = Some(self.current_player);

        // Check for winner
        if let Some(winner) = self.check_winner() {
            self.winner = Some(winner);
            self.status = GameStatus::Finished;
            self.finished_at = Some(timestamp);
        } else if self.is_board_full() {
            // It's a draw
            self.status = GameStatus::Finished;
            self.finished_at = Some(timestamp);
        } else {
            // Switch turns
            self.current_player = match self.current_player {
                Player::X => Player::O,
                Player::O => Player::X,
            };
        }

        Ok(())
    }

    /// Check if there's a winner
    fn check_winner(&self) -> Option<Player> {
        let winning_positions = [
            // Rows
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            // Columns
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            // Diagonals
            [0, 4, 8], [2, 4, 6],
        ];

        for positions in &winning_positions {
            if let (Some(a), Some(b), Some(c)) = (
                self.board[positions[0]],
                self.board[positions[1]],
                self.board[positions[2]],
            ) {
                if a == b && b == c {
                    return Some(a);
                }
            }
        }

        None
    }

    /// Check if the board is full
    fn is_board_full(&self) -> bool {
        self.board.iter().all(|cell| cell.is_some())
    }
}

impl PlayerStats {
    /// Update stats after a game
    pub fn update_after_game(&mut self, result: GameResult) {
        self.games_played += 1;
        match result {
            GameResult::Win => self.wins += 1,
            GameResult::Loss => self.losses += 1,
            GameResult::Draw => self.draws += 1,
        }
    }
}

/// Result of a game for a specific player
#[derive(Debug, Clone)]
pub enum GameResult {
    Win,
    Loss,
    Draw,
}

impl Default for TicTacToeState {
    fn default() -> Self {
        Self {
            games: HashMap::new(),
            player_stats: HashMap::new(),
        }
    }
}
