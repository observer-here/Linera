use linera_tic_tac_toe::{
    ApplicationState, Game, GameId, GameStatus, Operation, Player, PlayerInfo, PlayerStats,
    PlayerId, Query, QueryResponse, TicTacToeError,
};
use linera_base::data_types::Timestamp;
use tokio_test;

/// Test helper to create a mock timestamp
fn mock_timestamp(seconds: u64) -> Timestamp {
    Timestamp::from(seconds * 1_000_000) // Convert to microseconds
}

/// Test helper to create a basic game
fn create_test_game(id: GameId, player_id: &str, player_name: &str) -> Game {
    Game::new(
        id,
        player_id.to_string(),
        player_name.to_string(),
        mock_timestamp(0),
    )
}

#[cfg(test)]
mod game_logic_tests {
    use super::*;

    #[test]
    fn test_game_creation() {
        let game = create_test_game(1, "player1", "Alice");
        
        assert_eq!(game.id, 1);
        assert_eq!(game.players.len(), 1);
        assert_eq!(game.players[0].id, "player1");
        assert_eq!(game.players[0].name, "Alice");
        assert_eq!(game.players[0].symbol, Player::X);
        assert_eq!(game.status, GameStatus::WaitingForPlayer);
        assert_eq!(game.current_player, Player::X);
        assert_eq!(game.winner, None);
        assert!(game.board.iter().all(|&cell| cell.is_none()));
    }

    #[test]
    fn test_add_second_player() {
        let mut game = create_test_game(1, "player1", "Alice");
        
        let result = game.add_player("player2".to_string(), "Bob".to_string());
        assert!(result.is_ok());
        
        assert_eq!(game.players.len(), 2);
        assert_eq!(game.players[1].id, "player2");
        assert_eq!(game.players[1].name, "Bob");
        assert_eq!(game.players[1].symbol, Player::O);
        assert_eq!(game.status, GameStatus::InProgress);
    }

    #[test]
    fn test_add_third_player_fails() {
        let mut game = create_test_game(1, "player1", "Alice");
        game.add_player("player2".to_string(), "Bob".to_string()).unwrap();
        
        let result = game.add_player("player3".to_string(), "Charlie".to_string());
        assert!(matches!(result, Err(TicTacToeError::GameFull)));
    }

    #[test]
    fn test_valid_move() {
        let mut game = create_test_game(1, "player1", "Alice");
        game.add_player("player2".to_string(), "Bob".to_string()).unwrap();
        
        let result = game.make_move(&"player1".to_string(), 0, mock_timestamp(1));
        assert!(result.is_ok());
        
        assert_eq!(game.board[0], Some(Player::X));
        assert_eq!(game.current_player, Player::O);
        assert_eq!(game.status, GameStatus::InProgress);
    }

    #[test]
    fn test_invalid_move_occupied_position() {
        let mut game = create_test_game(1, "player1", "Alice");
        game.add_player("player2".to_string(), "Bob".to_string()).unwrap();
        
        // Make first move
        game.make_move(&"player1".to_string(), 0, mock_timestamp(1)).unwrap();
        
        // Try to move to same position
        let result = game.make_move(&"player2".to_string(), 0, mock_timestamp(2));
        assert!(matches!(result, Err(TicTacToeError::InvalidMove(0))));
    }

    #[test]
    fn test_invalid_move_wrong_turn() {
        let mut game = create_test_game(1, "player1", "Alice");
        game.add_player("player2".to_string(), "Bob".to_string()).unwrap();
        
        // Player 2 tries to move first (should be Player 1's turn)
        let result = game.make_move(&"player2".to_string(), 0, mock_timestamp(1));
        assert!(matches!(result, Err(TicTacToeError::NotYourTurn)));
    }

    #[test]
    fn test_invalid_position() {
        let mut game = create_test_game(1, "player1", "Alice");
        game.add_player("player2".to_string(), "Bob".to_string()).unwrap();
        
        let result = game.make_move(&"player1".to_string(), 9, mock_timestamp(1));
        assert!(matches!(result, Err(TicTacToeError::InvalidPosition(9))));
    }

    #[test]
    fn test_win_condition_row() {
        let mut game = create_test_game(1, "player1", "Alice");
        game.add_player("player2".to_string(), "Bob".to_string()).unwrap();
        
        // Player X wins with top row
        game.make_move(&"player1".to_string(), 0, mock_timestamp(1)).unwrap(); // X
        game.make_move(&"player2".to_string(), 3, mock_timestamp(2)).unwrap(); // O
        game.make_move(&"player1".to_string(), 1, mock_timestamp(3)).unwrap(); // X
        game.make_move(&"player2".to_string(), 4, mock_timestamp(4)).unwrap(); // O
        game.make_move(&"player1".to_string(), 2, mock_timestamp(5)).unwrap(); // X wins
        
        assert_eq!(game.status, GameStatus::Finished);
        assert_eq!(game.winner, Some(Player::X));
    }

    #[test]
    fn test_win_condition_column() {
        let mut game = create_test_game(1, "player1", "Alice");
        game.add_player("player2".to_string(), "Bob".to_string()).unwrap();
        
        // Player X wins with left column
        game.make_move(&"player1".to_string(), 0, mock_timestamp(1)).unwrap(); // X
        game.make_move(&"player2".to_string(), 1, mock_timestamp(2)).unwrap(); // O
        game.make_move(&"player1".to_string(), 3, mock_timestamp(3)).unwrap(); // X
        game.make_move(&"player2".to_string(), 2, mock_timestamp(4)).unwrap(); // O
        game.make_move(&"player1".to_string(), 6, mock_timestamp(5)).unwrap(); // X wins
        
        assert_eq!(game.status, GameStatus::Finished);
        assert_eq!(game.winner, Some(Player::X));
    }

    #[test]
    fn test_win_condition_diagonal() {
        let mut game = create_test_game(1, "player1", "Alice");
        game.add_player("player2".to_string(), "Bob".to_string()).unwrap();
        
        // Player X wins with main diagonal
        game.make_move(&"player1".to_string(), 0, mock_timestamp(1)).unwrap(); // X
        game.make_move(&"player2".to_string(), 1, mock_timestamp(2)).unwrap(); // O
        game.make_move(&"player1".to_string(), 4, mock_timestamp(3)).unwrap(); // X
        game.make_move(&"player2".to_string(), 2, mock_timestamp(4)).unwrap(); // O
        game.make_move(&"player1".to_string(), 8, mock_timestamp(5)).unwrap(); // X wins
        
        assert_eq!(game.status, GameStatus::Finished);
        assert_eq!(game.winner, Some(Player::X));
    }

    #[test]
    fn test_draw_condition() {
        let mut game = create_test_game(1, "player1", "Alice");
        game.add_player("player2".to_string(), "Bob".to_string()).unwrap();
        
        // Create a draw scenario
        // X O X
        // O O X
        // O X O
        let moves = [
            ("player1", 0), // X
            ("player2", 1), // O
            ("player1", 2), // X
            ("player2", 3), // O
            ("player2", 4), // O
            ("player1", 5), // X
            ("player2", 6), // O
            ("player1", 7), // X
            ("player2", 8), // O
        ];
        
        for (i, (player, pos)) in moves.iter().enumerate() {
            game.make_move(&player.to_string(), *pos, mock_timestamp(i as u64 + 1)).unwrap();
        }
        
        assert_eq!(game.status, GameStatus::Finished);
        assert_eq!(game.winner, None); // Draw
    }

    #[test]
    fn test_move_after_game_finished() {
        let mut game = create_test_game(1, "player1", "Alice");
        game.add_player("player2".to_string(), "Bob".to_string()).unwrap();
        
        // Player X wins
        game.make_move(&"player1".to_string(), 0, mock_timestamp(1)).unwrap();
        game.make_move(&"player2".to_string(), 3, mock_timestamp(2)).unwrap();
        game.make_move(&"player1".to_string(), 1, mock_timestamp(3)).unwrap();
        game.make_move(&"player2".to_string(), 4, mock_timestamp(4)).unwrap();
        game.make_move(&"player1".to_string(), 2, mock_timestamp(5)).unwrap(); // X wins
        
        // Try to make another move
        let result = game.make_move(&"player2".to_string(), 5, mock_timestamp(6));
        assert!(matches!(result, Err(TicTacToeError::GameNotInProgress)));
    }
}

#[cfg(test)]
mod player_stats_tests {
    use super::*;
    use linera_tic_tac_toe::GameResult;

    #[test]
    fn test_player_stats_initialization() {
        let stats = PlayerStats::default();
        
        assert_eq!(stats.games_played, 0);
        assert_eq!(stats.wins, 0);
        assert_eq!(stats.losses, 0);
        assert_eq!(stats.draws, 0);
    }

    #[test]
    fn test_player_stats_update_win() {
        let mut stats = PlayerStats::default();
        stats.update_after_game(GameResult::Win);
        
        assert_eq!(stats.games_played, 1);
        assert_eq!(stats.wins, 1);
        assert_eq!(stats.losses, 0);
        assert_eq!(stats.draws, 0);
    }

    #[test]
    fn test_player_stats_update_loss() {
        let mut stats = PlayerStats::default();
        stats.update_after_game(GameResult::Loss);
        
        assert_eq!(stats.games_played, 1);
        assert_eq!(stats.wins, 0);
        assert_eq!(stats.losses, 1);
        assert_eq!(stats.draws, 0);
    }

    #[test]
    fn test_player_stats_update_draw() {
        let mut stats = PlayerStats::default();
        stats.update_after_game(GameResult::Draw);
        
        assert_eq!(stats.games_played, 1);
        assert_eq!(stats.wins, 0);
        assert_eq!(stats.losses, 0);
        assert_eq!(stats.draws, 1);
    }

    #[test]
    fn test_player_stats_multiple_games() {
        let mut stats = PlayerStats::default();
        
        stats.update_after_game(GameResult::Win);
        stats.update_after_game(GameResult::Loss);
        stats.update_after_game(GameResult::Draw);
        stats.update_after_game(GameResult::Win);
        
        assert_eq!(stats.games_played, 4);
        assert_eq!(stats.wins, 2);
        assert_eq!(stats.losses, 1);
        assert_eq!(stats.draws, 1);
    }
}

#[cfg(test)]
mod integration_tests {
    use super::*;

    #[test]
    fn test_complete_game_flow() {
        // Test a complete game from creation to finish
        let mut game = create_test_game(1, "alice", "Alice");
        
        // Initially waiting for player
        assert_eq!(game.status, GameStatus::WaitingForPlayer);
        assert_eq!(game.players.len(), 1);
        
        // Add second player
        game.add_player("bob".to_string(), "Bob".to_string()).unwrap();
        assert_eq!(game.status, GameStatus::InProgress);
        assert_eq!(game.players.len(), 2);
        
        // Play a complete game where Alice (X) wins
        game.make_move(&"alice".to_string(), 4, mock_timestamp(1)).unwrap(); // X center
        game.make_move(&"bob".to_string(), 0, mock_timestamp(2)).unwrap();   // O top-left
        game.make_move(&"alice".to_string(), 1, mock_timestamp(3)).unwrap(); // X top-center
        game.make_move(&"bob".to_string(), 2, mock_timestamp(4)).unwrap();   // O top-right
        game.make_move(&"alice".to_string(), 7, mock_timestamp(5)).unwrap(); // X bottom-center (wins)
        
        // Check final state
        assert_eq!(game.status, GameStatus::Finished);
        assert_eq!(game.winner, Some(Player::X));
        assert!(game.finished_at.is_some());
        
        // Verify board state
        assert_eq!(game.board[0], Some(Player::O)); // Bob
        assert_eq!(game.board[1], Some(Player::X)); // Alice
        assert_eq!(game.board[2], Some(Player::O)); // Bob
        assert_eq!(game.board[4], Some(Player::X)); // Alice
        assert_eq!(game.board[7], Some(Player::X)); // Alice
    }

    #[test]
    fn test_error_conditions() {
        let mut game = create_test_game(1, "alice", "Alice");
        
        // Can't make move with only one player
        let result = game.make_move(&"alice".to_string(), 0, mock_timestamp(1));
        assert!(matches!(result, Err(TicTacToeError::GameNotInProgress)));
        
        // Add second player
        game.add_player("bob".to_string(), "Bob".to_string()).unwrap();
        
        // Invalid player ID
        let result = game.make_move(&"charlie".to_string(), 0, mock_timestamp(1));
        assert!(matches!(result, Err(TicTacToeError::PlayerNotInGame)));
        
        // Wrong turn
        let result = game.make_move(&"bob".to_string(), 0, mock_timestamp(1));
        assert!(matches!(result, Err(TicTacToeError::NotYourTurn)));
        
        // Valid move
        game.make_move(&"alice".to_string(), 0, mock_timestamp(1)).unwrap();
        
        // Try to move to occupied position
        let result = game.make_move(&"bob".to_string(), 0, mock_timestamp(2));
        assert!(matches!(result, Err(TicTacToeError::InvalidMove(0))));
        
        // Invalid position
        let result = game.make_move(&"bob".to_string(), 10, mock_timestamp(2));
        assert!(matches!(result, Err(TicTacToeError::InvalidPosition(10))));
    }
}

#[cfg(test)]
mod benchmark_tests {
    use super::*;
    use std::time::Instant;

    #[test]
    fn test_game_creation_performance() {
        let start = Instant::now();
        
        for i in 0..1000 {
            let _game = create_test_game(i, &format!("player{}", i), &format!("Player {}", i));
        }
        
        let duration = start.elapsed();
        println!("Created 1000 games in {:?}", duration);
        
        // Should be very fast
        assert!(duration.as_millis() < 100);
    }

    #[test]
    fn test_move_performance() {
        let mut game = create_test_game(1, "alice", "Alice");
        game.add_player("bob".to_string(), "Bob".to_string()).unwrap();
        
        let start = Instant::now();
        
        // Make alternating moves
        for i in 0..9 {
            let player = if i % 2 == 0 { "alice" } else { "bob" };
            if game.status == GameStatus::InProgress {
                let _ = game.make_move(&player.to_string(), i, mock_timestamp(i as u64 + 1));
            }
        }
        
        let duration = start.elapsed();
        println!("Made moves in {:?}", duration);
        
        // Should be very fast
        assert!(duration.as_micros() < 1000);
    }
}
