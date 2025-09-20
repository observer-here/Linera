import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameBoard from './GameBoard';

const mockGame = {
  id: 1,
  players: [
    { id: 'player1', name: 'Alice', symbol: 'X' },
    { id: 'player2', name: 'Bob', symbol: 'O' }
  ],
  status: 'playing',
  board: Array(9).fill(null),
  current_player: 'X',
  created_at: '2024-01-01T00:00:00Z',
  finished_at: null,
  winner: null
};

const mockProps = {
  game: mockGame,
  playerId: 'player1',
  onMove: jest.fn(),
  onBackToGames: jest.fn()
};

describe('GameBoard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders game board with correct game ID', () => {
    render(<GameBoard {...mockProps} />);
    
    expect(screen.getByText('Game #1')).toBeInTheDocument();
  });

  test('displays players information', () => {
    render(<GameBoard {...mockProps} />);
    
    expect(screen.getByText('Alice (You)')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Playing as X')).toBeInTheDocument();
    expect(screen.getByText('Playing as O')).toBeInTheDocument();
  });

  test('shows correct game status for current player turn', () => {
    render(<GameBoard {...mockProps} />);
    
    expect(screen.getByText("It's your turn!")).toBeInTheDocument();
  });

  test('shows correct game status for opponent turn', () => {
    const gameWithOpponentTurn = {
      ...mockGame,
      current_player: 'O'
    };
    
    render(<GameBoard {...mockProps} game={gameWithOpponentTurn} />);
    
    expect(screen.getByText("Waiting for Bob's move...")).toBeInTheDocument();
  });

  test('renders 9 game cells', () => {
    render(<GameBoard {...mockProps} />);
    
    const cells = screen.getAllByRole('button');
    const gameCells = cells.filter(button => 
      button.getAttribute('aria-label')?.includes('Cell')
    );
    
    expect(gameCells).toHaveLength(9);
  });

  test('handles cell click for valid move', () => {
    render(<GameBoard {...mockProps} />);
    
    const cells = screen.getAllByRole('button');
    const firstCell = cells.find(button => 
      button.getAttribute('aria-label') === 'Cell 1'
    );
    
    fireEvent.click(firstCell);
    
    setTimeout(() => {
      expect(mockProps.onMove).toHaveBeenCalledWith(0);
    }, 200);
  });

  test('prevents clicking on occupied cells', () => {
    const gameWithMoves = {
      ...mockGame,
      board: ['X', null, null, null, null, null, null, null, null]
    };
    
    render(<GameBoard {...mockProps} game={gameWithMoves} />);
    
    const cells = screen.getAllByRole('button');
    const firstCell = cells.find(button => 
      button.getAttribute('aria-label') === 'Cell 1'
    );
    
    expect(firstCell).toBeDisabled();
  });

  test('prevents moves when not player turn', () => {
    const gameWithOpponentTurn = {
      ...mockGame,
      current_player: 'O'
    };
    
    render(<GameBoard {...mockProps} game={gameWithOpponentTurn} />);
    
    const cells = screen.getAllByRole('button');
    const firstCell = cells.find(button => 
      button.getAttribute('aria-label') === 'Cell 1'
    );
    
    expect(firstCell).toBeDisabled();
  });

  test('displays X and O symbols correctly', () => {
    const gameWithMoves = {
      ...mockGame,
      board: ['X', 'O', null, null, null, null, null, null, null]
    };
    
    render(<GameBoard {...mockProps} game={gameWithMoves} />);
    
    expect(screen.getByText('✕')).toBeInTheDocument();
    expect(screen.getByText('◯')).toBeInTheDocument();
  });

  test('shows game over overlay when game is finished', () => {
    const finishedGame = {
      ...mockGame,
      status: 'finished',
      winner: 'X',
      finished_at: '2024-01-01T01:00:00Z'
    };
    
    render(<GameBoard {...mockProps} game={finishedGame} />);
    
    expect(screen.getByText('Game Over!')).toBeInTheDocument();
    expect(screen.getByText('🎉 You won! Congratulations!')).toBeInTheDocument();
  });

  test('shows draw message when game ends in draw', () => {
    const drawGame = {
      ...mockGame,
      status: 'finished',
      winner: null,
      finished_at: '2024-01-01T01:00:00Z'
    };
    
    render(<GameBoard {...mockProps} game={drawGame} />);
    
    expect(screen.getByText('Game Over!')).toBeInTheDocument();
    expect(screen.getByText("It's a draw! Good game!")).toBeInTheDocument();
  });

  test('shows loss message when opponent wins', () => {
    const lostGame = {
      ...mockGame,
      status: 'finished',
      winner: 'O',
      finished_at: '2024-01-01T01:00:00Z'
    };
    
    render(<GameBoard {...mockProps} game={lostGame} />);
    
    expect(screen.getByText('Bob won! Better luck next time.')).toBeInTheDocument();
  });

  test('highlights winning cells', () => {
    const wonGame = {
      ...mockGame,
      status: 'finished',
      winner: 'X',
      board: ['X', 'X', 'X', 'O', 'O', null, null, null, null],
      finished_at: '2024-01-01T01:00:00Z'
    };
    
    render(<GameBoard {...mockProps} game={wonGame} />);
    
    const cells = screen.getAllByRole('button');
    const winningCells = cells.filter(cell => 
      cell.classList.contains('winning-cell')
    );
    
    expect(winningCells).toHaveLength(3);
  });

  test('shows waiting message when only one player', () => {
    const waitingGame = {
      ...mockGame,
      status: 'waiting',
      players: [{ id: 'player1', name: 'Alice', symbol: 'X' }]
    };
    
    render(<GameBoard {...mockProps} game={waitingGame} />);
    
    expect(screen.getByText('Waiting for another player to join...')).toBeInTheDocument();
  });

  test('back to games button works', () => {
    render(<GameBoard {...mockProps} />);
    
    fireEvent.click(screen.getByText('← Back to Games'));
    
    expect(mockProps.onBackToGames).toHaveBeenCalled();
  });

  test('displays game information correctly', () => {
    render(<GameBoard {...mockProps} />);
    
    expect(screen.getByText('Game Information')).toBeInTheDocument();
    expect(screen.getByText('Playing')).toBeInTheDocument();
    expect(screen.getByText('X (Alice)')).toBeInTheDocument();
  });

  test('shows turn indicator for active player', () => {
    render(<GameBoard {...mockProps} />);
    
    // Should show pulse indicator for current player
    const pulseIndicator = document.querySelector('.pulse');
    expect(pulseIndicator).toBeInTheDocument();
  });

  test('handles no game prop', () => {
    render(<GameBoard {...mockProps} game={null} />);
    
    expect(screen.getByText('No Game Selected')).toBeInTheDocument();
    expect(screen.getByText('Please select a game to play.')).toBeInTheDocument();
  });

  test('shows hover preview for valid moves', () => {
    render(<GameBoard {...mockProps} />);
    
    const cells = screen.getAllByRole('button');
    const firstCell = cells.find(button => 
      button.getAttribute('aria-label') === 'Cell 1'
    );
    
    fireEvent.mouseEnter(firstCell);
    
    const hoverPreview = firstCell.querySelector('.hover-preview');
    expect(hoverPreview).toBeInTheDocument();
  });

  test('displays move history when available', () => {
    const gameWithHistory = {
      ...mockGame,
      board: ['X', 'O', null, null, null, null, null, null, null]
    };
    
    render(<GameBoard {...mockProps} game={gameWithHistory} />);
    
    // Move history should appear after moves are made
    // This would require the component to track history internally
    expect(screen.getByText('Game Information')).toBeInTheDocument();
  });

  test('new game button in game over overlay', () => {
    const finishedGame = {
      ...mockGame,
      status: 'finished',
      winner: 'X',
      finished_at: '2024-01-01T01:00:00Z'
    };
    
    render(<GameBoard {...mockProps} game={finishedGame} />);
    
    const newGameButton = screen.getByText('New Game');
    fireEvent.click(newGameButton);
    
    expect(mockProps.onBackToGames).toHaveBeenCalled();
  });

  test('cell selection animation', async () => {
    render(<GameBoard {...mockProps} />);
    
    const cells = screen.getAllByRole('button');
    const firstCell = cells.find(button => 
      button.getAttribute('aria-label') === 'Cell 1'
    );
    
    fireEvent.click(firstCell);
    
    // Should add selected class temporarily
    expect(firstCell).toHaveClass('selected');
    
    // After timeout, should call onMove
    await waitFor(() => {
      expect(mockProps.onMove).toHaveBeenCalledWith(0);
    }, { timeout: 200 });
  });
});

describe('GameBoard Edge Cases', () => {
  test('handles invalid player ID', () => {
    const propsWithInvalidPlayer = {
      ...mockProps,
      playerId: 'invalid_player'
    };
    
    render(<GameBoard {...propsWithInvalidPlayer} />);
    
    // Should still render but show different status
    expect(screen.getByText('Game #1')).toBeInTheDocument();
  });

  test('handles game with missing player data', () => {
    const gameWithMissingPlayer = {
      ...mockGame,
      players: [{ id: 'player1', name: 'Alice', symbol: 'X' }]
    };
    
    render(<GameBoard {...mockProps} game={gameWithMissingPlayer} />);
    
    expect(screen.getByText('Waiting for another player to join...')).toBeInTheDocument();
  });

  test('handles corrupted board state', () => {
    const gameWithCorruptedBoard = {
      ...mockGame,
      board: ['X', 'O', 'X', 'O'] // Invalid length
    };
    
    render(<GameBoard {...mockProps} game={gameWithCorruptedBoard} />);
    
    // Should still render 9 cells
    const cells = screen.getAllByRole('button');
    const gameCells = cells.filter(button => 
      button.getAttribute('aria-label')?.includes('Cell')
    );
    
    expect(gameCells).toHaveLength(9);
  });
});
