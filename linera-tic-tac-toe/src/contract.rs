use crate::{
    ApplicationState, Game, GameId, Message, Operation, PlayerId, Query, QueryResponse,
    TicTacToeError,
};
use async_trait::async_trait;
use linera_base::{
    data_types::{ApplicationId, BlockHeight, Timestamp},
    identifiers::{ChainId, MessageId},
};
use linera_execution::{
    ApplicationCallResult, ExecutionResult, MessageContext, OperationContext, QueryContext,
    SessionCallResult,
};
use std::sync::Arc;

/// The Tic Tac Toe contract implementation
pub struct TicTacToeContract;

#[async_trait]
impl linera_execution::Contract for TicTacToeContract {
    type Message = Message;
    type Parameters = ();
    type State = ApplicationState;

    async fn load(context: OperationContext) -> Self {
        TicTacToeContract
    }

    async fn instantiate(&mut self, context: OperationContext, argument: Self::Parameters) {
        // Contract instantiation logic
        // Initialize the application state if needed
    }

    async fn execute_operation(
        &mut self,
        context: OperationContext,
        operation: Operation,
    ) -> ExecutionResult<Self::Message> {
        let timestamp = context.execution_state_view.system.timestamp.get();
        let mut state = ApplicationState::load(context.execution_state_view.context().clone())
            .await
            .map_err(|e| ExecutionResult::system_error(format!("Failed to load state: {}", e)))?;

        match operation {
            Operation::CreateGame { player_id, player_name } => {
                let game_id = state
                    .create_game(player_id.clone(), player_name, timestamp)
                    .await
                    .map_err(|e| ExecutionResult::system_error(format!("Failed to create game: {}", e)))?;

                let game = state
                    .get_game(game_id)
                    .await
                    .map_err(|e| ExecutionResult::system_error(format!("Failed to get game: {}", e)))?
                    .ok_or_else(|| ExecutionResult::system_error("Game not found after creation".to_string()))?;

                state
                    .flush()
                    .await
                    .map_err(|e| ExecutionResult::system_error(format!("Failed to flush state: {}", e)))?;

                // Send message to notify about game creation
                let message = Message::GameUpdate { game_id, game };
                ExecutionResult::default().with_message(message)
            }

            Operation::JoinGame {
                game_id,
                player_id,
                player_name,
            } => {
                state
                    .join_game(game_id, player_id.clone(), player_name)
                    .await
                    .map_err(|e| match e {
                        TicTacToeError::GameNotFound => {
                            ExecutionResult::user_error("Game not found".to_string())
                        }
                        TicTacToeError::GameFull => {
                            ExecutionResult::user_error("Game is full".to_string())
                        }
                        _ => ExecutionResult::system_error(format!("Failed to join game: {}", e)),
                    })?;

                let game = state
                    .get_game(game_id)
                    .await
                    .map_err(|e| ExecutionResult::system_error(format!("Failed to get game: {}", e)))?
                    .ok_or_else(|| ExecutionResult::system_error("Game not found".to_string()))?;

                state
                    .flush()
                    .await
                    .map_err(|e| ExecutionResult::system_error(format!("Failed to flush state: {}", e)))?;

                // Send message to notify about player joining
                let message = Message::GameUpdate { game_id, game };
                ExecutionResult::default().with_message(message)
            }

            Operation::MakeMove {
                game_id,
                player_id,
                position,
            } => {
                let game = state
                    .make_move(game_id, player_id.clone(), position, timestamp)
                    .await
                    .map_err(|e| match e {
                        TicTacToeError::GameNotFound => {
                            ExecutionResult::user_error("Game not found".to_string())
                        }
                        TicTacToeError::InvalidMove(pos) => {
                            ExecutionResult::user_error(format!("Invalid move at position {}", pos))
                        }
                        TicTacToeError::NotYourTurn => {
                            ExecutionResult::user_error("Not your turn".to_string())
                        }
                        TicTacToeError::GameNotInProgress => {
                            ExecutionResult::user_error("Game is not in progress".to_string())
                        }
                        TicTacToeError::PlayerNotInGame => {
                            ExecutionResult::user_error("Player not in this game".to_string())
                        }
                        TicTacToeError::InvalidPosition(pos) => {
                            ExecutionResult::user_error(format!("Invalid position: {}", pos))
                        }
                        _ => ExecutionResult::system_error(format!("Failed to make move: {}", e)),
                    })?;

                state
                    .flush()
                    .await
                    .map_err(|e| ExecutionResult::system_error(format!("Failed to flush state: {}", e)))?;

                // Send message to notify about move
                let message = Message::GameUpdate { game_id, game };
                ExecutionResult::default().with_message(message)
            }
        }
    }

    async fn execute_message(
        &mut self,
        context: MessageContext,
        message: Self::Message,
    ) -> ExecutionResult<Self::Message> {
        // Handle incoming messages from other chains
        match message {
            Message::GameUpdate { game_id, game } => {
                // This could be used for cross-chain game synchronization
                // For now, we'll just acknowledge the message
                ExecutionResult::default()
            }
        }
    }

    async fn handle_application_call(
        &mut self,
        context: OperationContext,
        call: Vec<u8>,
    ) -> ApplicationCallResult<Self::Message, Vec<u8>> {
        // Handle application-specific calls
        // This could be used for more complex operations
        ApplicationCallResult::default()
    }

    async fn handle_session_call(
        &mut self,
        context: OperationContext,
        session: Vec<u8>,
        call: Vec<u8>,
    ) -> SessionCallResult<Self::Message, Vec<u8>> {
        // Handle session-specific calls
        SessionCallResult::default()
    }
}

/// Query handler for the contract
pub struct TicTacToeService;

#[async_trait]
impl linera_execution::Service for TicTacToeService {
    type Parameters = ();
    type Query = Query;
    type QueryResponse = QueryResponse;
    type State = ApplicationState;

    async fn load(context: QueryContext) -> Self {
        TicTacToeService
    }

    async fn handle_query(
        &mut self,
        context: QueryContext,
        query: Self::Query,
    ) -> Result<Self::QueryResponse, String> {
        let state = ApplicationState::load(context.execution_state_view.context().clone())
            .await
            .map_err(|e| format!("Failed to load state: {}", e))?;

        match query {
            Query::GetGame { game_id } => {
                let game = state
                    .get_game(game_id)
                    .await
                    .map_err(|e| format!("Failed to get game: {}", e))?;
                Ok(QueryResponse::Game(game))
            }

            Query::GetAllGames => {
                let games = state
                    .get_all_games()
                    .await
                    .map_err(|e| format!("Failed to get games: {}", e))?;
                Ok(QueryResponse::Games(games))
            }

            Query::GetPlayerStats { player_id } => {
                let stats = state
                    .get_player_stats(&player_id)
                    .await
                    .map_err(|e| format!("Failed to get player stats: {}", e))?;
                Ok(QueryResponse::PlayerStats(stats))
            }
        }
    }
}

// Helper functions for contract operations
impl TicTacToeContract {
    /// Validate that a position is within bounds
    fn validate_position(position: usize) -> Result<(), TicTacToeError> {
        if position >= 9 {
            Err(TicTacToeError::InvalidPosition(position))
        } else {
            Ok(())
        }
    }

    /// Check if a player is authorized to make a move
    fn validate_player_turn(game: &Game, player_id: &PlayerId) -> Result<(), TicTacToeError> {
        let player = game
            .players
            .iter()
            .find(|p| p.id == *player_id)
            .ok_or(TicTacToeError::PlayerNotInGame)?;

        if player.symbol != game.current_player {
            return Err(TicTacToeError::NotYourTurn);
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{GameStatus, Player};
    use linera_base::data_types::Timestamp;

    #[test]
    fn test_validate_position() {
        assert!(TicTacToeContract::validate_position(0).is_ok());
        assert!(TicTacToeContract::validate_position(8).is_ok());
        assert!(TicTacToeContract::validate_position(9).is_err());
        assert!(TicTacToeContract::validate_position(100).is_err());
    }

    #[tokio::test]
    async fn test_game_creation() {
        // This would require setting up a proper test context
        // For now, we'll test the basic game logic
        let game = Game::new(
            1,
            "player1".to_string(),
            "Player One".to_string(),
            Timestamp::from(0),
        );

        assert_eq!(game.id, 1);
        assert_eq!(game.players.len(), 1);
        assert_eq!(game.status, GameStatus::WaitingForPlayer);
        assert_eq!(game.current_player, Player::X);
    }
}
