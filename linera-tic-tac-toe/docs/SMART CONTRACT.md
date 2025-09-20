# Linera Tic Tac Toe Smart Contract

## Overview

This smart contract implements a decentralized Tic Tac Toe game on the Linera blockchain platform. It leverages Linera's microchains architecture for high-performance, real-time gaming experiences.

## Architecture

### Components

1. **Contract (`contract.rs`)** - Core game logic and state transitions
2. **Service (`service.rs`)** - Query interface and external interactions  
3. **State (`state.rs`)** - Game state management and persistence
4. **Library (`lib.rs`)** - Common types and utilities

### Game State

```rust
pub struct GameState {
    pub board: [Option<Player>; 9],
    pub current_player: Player,
    pub status: GameStatus,
    pub players: Vec<PlayerInfo>,
    pub winner: Option<Player>,
    pub created_at: u64,
}
```

### Key Features

- **Real-time Multiplayer**: Supports 2-player games with instant move validation
- **Decentralized**: All game state stored on Linera blockchain
- **Scalable**: Each game runs on its own microchain for parallel processing
- **Transparent**: All moves and game outcomes are publicly verifiable

## Game Flow

1. **Game Creation**: Player creates a new game instance
2. **Player Joining**: Second player joins the game
3. **Move Making**: Players alternate making moves
4. **Win Detection**: Contract automatically detects wins/draws
5. **Game Completion**: Final state is recorded on blockchain

## Operations

### Contract Operations

- `CreateGame` - Initialize a new game
- `JoinGame` - Join an existing game
- `MakeMove` - Submit a move to the game
- `GetGameState` - Query current game state

### Service Queries

- `games()` - List all games
- `game(game_id)` - Get specific game details
- `player_stats(player_id)` - Get player statistics

## Security Features

- **Move Validation**: Ensures only valid moves are accepted
- **Turn Management**: Enforces proper turn order
- **Immutable History**: All moves are permanently recorded
- **Anti-Cheating**: Blockchain consensus prevents manipulation

## Performance Benefits

- **Low Latency**: Near-instant move confirmation
- **High Throughput**: Parallel game processing
- **Cost Efficient**: Optimized for minimal transaction fees
- **Scalable**: Automatic scaling with demand

## Integration

The smart contract integrates with:
- Frontend React application
- Backend Node.js server (for caching/optimization)
- Linera SDK for blockchain interactions
- WebSocket for real-time updates

## Deployment

```bash
# Build the contract
cargo build --release

# Deploy to Linera network
linera deploy --contract target/wasm32-unknown-unknown/release/tic_tac_toe.wasm

# Initialize application
linera create-application --contract-id <CONTRACT_ID>
```

## Testing

Run the test suite:
```bash
cargo test
```

Tests cover:
- Game creation and joining
- Move validation
- Win condition detection
- Edge cases and error handling

## Future Enhancements

- Tournament mode with multiple games
- Player ranking system
- Spectator mode
- Custom game rules and board sizes
- Integration with Linera's native token system for betting
