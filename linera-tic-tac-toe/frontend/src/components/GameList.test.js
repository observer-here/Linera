import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GameList from './GameList';

const mockGames = [
  {
    id: 1,
    players: [
      { id: 'player1', name: 'Alice', symbol: 'X' },
      { id: 'player2', name: 'Bob', symbol: 'O' }
    ],
    status: 'playing',
    board: ['X', null, null, null, 'O', null, null, null, null],
    current_player: 'X',
    created_at: '2024-01-01T00:00:00Z',
    finished_at: null,
    winner: null
  },
  {
    id: 2,
    players: [{ id: 'player3', name: 'Charlie', symbol: 'X' }],
    status: 'waiting',
    board: Array(9).fill(null),
    current_player: 'X',
    created_at: '2024-01-01T01:00:00Z',
    finished_at: null,
    winner: null
  },
  {
    id: 3,
    players: [
      { id: 'player1', name: 'Alice', symbol: 'X' },
      { id: 'player4', name: 'David', symbol: 'O' }
    ],
    status: 'finished',
    board: ['X', 'X', 'X', 'O', 'O', null, null, null, null],
    current_player: 'X',
    created_at: '2024-01-01T02:00:00Z',
    finished_at: '2024-01-01T02:30:00Z',
    winner: 'X'
  }
];

const mockProps = {
  games: mockGames,
  playerId: 'player1',
  onCreateGame: jest.fn(),
  onJoinGame: jest.fn(),
  onRefresh: jest.fn(),
  loading: false
};

describe('GameList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders game lobby header', () => {
    render(<GameList {...mockProps} />);
    
    expect(screen.getByText('Game Lobby')).toBeInTheDocument();
  });

  test('displays create new game button', () => {
    render(<GameList {...mockProps} />);
    
    expect(screen.getByText('+ Create New Game')).toBeInTheDocument();
  });

  test('displays refresh button', () => {
    render(<GameList {...mockProps} />);
    
    expect(screen.getByText('↻ Refresh')).toBeInTheDocument();
  });

  test('renders all games', () => {
    render(<GameList {...mockProps} />);
    
    expect(screen.getByText('Game #1')).toBeInTheDocument();
    expect(screen.getByText('Game #2')).toBeInTheDocument();
    expect(screen.getByText('Game #3')).toBeInTheDocument();
  });

  test('displays correct game statuses', () => {
    render(<GameList {...mockProps} />);
    
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Waiting for Player')).toBeInTheDocument();
    expect(screen.getByText('Finished')).toBeInTheDocument();
  });

  test('shows player information for each game', () => {
    render(<GameList {...mockProps} />);
    
    expect(screen.getByText('Alice (You)')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
    expect(screen.getByText('David')).toBeInTheDocument();
  });

  test('highlights user games', () => {
    render(<GameList {...mockProps} />);
    
    const gameCards = document.querySelectorAll('.game-card');
    const userGameCards = Array.from(gameCards).filter(card => 
      card.classList.contains('my-game')
    );
    
    expect(userGameCards).toHaveLength(2); // Games 1 and 3 have player1
  });

  test('shows join button for joinable games', () => {
    render(<GameList {...mockProps} />);
    
    expect(screen.getByText('Join Game')).toBeInTheDocument();
  });

  test('shows continue button for user games in progress', () => {
    render(<GameList {...mockProps} />);
    
    expect(screen.getByText('Continue Game')).toBeInTheDocument();
  });

  test('shows view button for finished games', () => {
    render(<GameList {...mockProps} />);
    
    expect(screen.getByText('View Game')).toBeInTheDocument();
  });

  test('handles create game button click', () => {
    render(<GameList {...mockProps} />);
    
    fireEvent.click(screen.getByText('+ Create New Game'));
    
    expect(mockProps.onCreateGame).toHaveBeenCalled();
  });

  test('handles join game button click', () => {
    render(<GameList {...mockProps} />);
    
    fireEvent.click(screen.getByText('Join Game'));
    
    expect(mockProps.onJoinGame).toHaveBeenCalledWith(2); // Game 2 is joinable
  });

  test('handles refresh button click', () => {
    render(<GameList {...mockProps} />);
    
    fireEvent.click(screen.getByText('↻ Refresh'));
    
    expect(mockProps.onRefresh).toHaveBeenCalled();
  });

  test('displays loading state', () => {
    render(<GameList {...mockProps} loading={true} />);
    
    expect(screen.getByText('Creating...')).toBeInTheDocument();
  });

  test('shows empty state when no games', () => {
    render(<GameList {...mockProps} games={[]} />);
    
    expect(screen.getByText('No games found')).toBeInTheDocument();
    expect(screen.getByText('Be the first to create a game!')).toBeInTheDocument();
  });

  test('displays game summary', () => {
    render(<GameList {...mockProps} />);
    
    expect(screen.getByText('Showing 3 of 3 games')).toBeInTheDocument();
  });

  test('shows current turn information', () => {
    render(<GameList {...mockProps} />);
    
    expect(screen.getByText('Current Turn: Alice (X)')).toBeInTheDocument();
  });

  test('displays game results for finished games', () => {
    render(<GameList {...mockProps} />);
    
    expect(screen.getByText('You Won!')).toBeInTheDocument();
  });

  test('shows created and finished timestamps', () => {
    render(<GameList {...mockProps} />);
    
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
    expect(screen.getByText(/Finished:/)).toBeInTheDocument();
  });
});

describe('GameList Filtering', () => {
  test('filters by all games', () => {
    render(<GameList {...mockProps} />);
    
    fireEvent.click(screen.getByText('All Games'));
    
    expect(screen.getByText('Game #1')).toBeInTheDocument();
    expect(screen.getByText('Game #2')).toBeInTheDocument();
    expect(screen.getByText('Game #3')).toBeInTheDocument();
  });

  test('filters by joinable games', () => {
    render(<GameList {...mockProps} />);
    
    fireEvent.click(screen.getByText('Joinable'));
    
    expect(screen.getByText('Game #2')).toBeInTheDocument();
    expect(screen.queryByText('Game #1')).not.toBeInTheDocument();
    expect(screen.queryByText('Game #3')).not.toBeInTheDocument();
  });

  test('filters by my games', () => {
    render(<GameList {...mockProps} />);
    
    fireEvent.click(screen.getByText('My Games'));
    
    expect(screen.getByText('Game #1')).toBeInTheDocument();
    expect(screen.getByText('Game #3')).toBeInTheDocument();
    expect(screen.queryByText('Game #2')).not.toBeInTheDocument();
  });

  test('filters by waiting games', () => {
    render(<GameList {...mockProps} />);
    
    fireEvent.click(screen.getByText('Waiting'));
    
    expect(screen.getByText('Game #2')).toBeInTheDocument();
    expect(screen.queryByText('Game #1')).not.toBeInTheDocument();
    expect(screen.queryByText('Game #3')).not.toBeInTheDocument();
  });

  test('filters by playing games', () => {
    render(<GameList {...mockProps} />);
    
    fireEvent.click(screen.getByText('Playing'));
    
    expect(screen.getByText('Game #1')).toBeInTheDocument();
    expect(screen.queryByText('Game #2')).not.toBeInTheDocument();
    expect(screen.queryByText('Game #3')).not.toBeInTheDocument();
  });

  test('filters by finished games', () => {
    render(<GameList {...mockProps} />);
    
    fireEvent.click(screen.getByText('Finished'));
    
    expect(screen.getByText('Game #3')).toBeInTheDocument();
    expect(screen.queryByText('Game #1')).not.toBeInTheDocument();
    expect(screen.queryByText('Game #2')).not.toBeInTheDocument();
  });

  test('displays correct filter counts', () => {
    render(<GameList {...mockProps} />);
    
    expect(screen.getByText('All Games')).toBeInTheDocument();
    expect(screen.getByText('(3)')).toBeInTheDocument(); // All games count
    expect(screen.getByText('(1)')).toBeInTheDocument(); // Joinable count
    expect(screen.getByText('(2)')).toBeInTheDocument(); // My games count
  });
});

describe('GameList Searching', () => {
  test('searches by game ID', () => {
    render(<GameList {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search by game ID or player name...');
    fireEvent.change(searchInput, { target: { value: '2' } });
    
    expect(screen.getByText('Game #2')).toBeInTheDocument();
    expect(screen.queryByText('Game #1')).not.toBeInTheDocument();
    expect(screen.queryByText('Game #3')).not.toBeInTheDocument();
  });

  test('searches by player name', () => {
    render(<GameList {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search by game ID or player name...');
    fireEvent.change(searchInput, { target: { value: 'Charlie' } });
    
    expect(screen.getByText('Game #2')).toBeInTheDocument();
    expect(screen.queryByText('Game #1')).not.toBeInTheDocument();
    expect(screen.queryByText('Game #3')).not.toBeInTheDocument();
  });

  test('shows no results for invalid search', () => {
    render(<GameList {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search by game ID or player name...');
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });
    
    expect(screen.getByText('No games found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filters or search term.')).toBeInTheDocument();
  });

  test('updates summary with search results', () => {
    render(<GameList {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search by game ID or player name...');
    fireEvent.change(searchInput, { target: { value: 'Alice' } });
    
    expect(screen.getByText('Showing 2 of 3 games matching "Alice"')).toBeInTheDocument();
  });
});

describe('GameList Sorting', () => {
  test('sorts by newest first', () => {
    render(<GameList {...mockProps} />);
    
    const sortSelect = screen.getByDisplayValue('Newest First');
    fireEvent.change(sortSelect, { target: { value: 'newest' } });
    
    const gameCards = screen.getAllByText(/Game #/);
    expect(gameCards[0]).toHaveTextContent('Game #3'); // Most recent
  });

  test('sorts by oldest first', () => {
    render(<GameList {...mockProps} />);
    
    const sortSelect = screen.getByDisplayValue('Newest First');
    fireEvent.change(sortSelect, { target: { value: 'oldest' } });
    
    const gameCards = screen.getAllByText(/Game #/);
    expect(gameCards[0]).toHaveTextContent('Game #1'); // Oldest
  });

  test('sorts by status', () => {
    render(<GameList {...mockProps} />);
    
    const sortSelect = screen.getByDisplayValue('Newest First');
    fireEvent.change(sortSelect, { target: { value: 'status' } });
    
    // Should sort alphabetically by status
    expect(screen.getAllByText(/Game #/)).toHaveLength(3);
  });

  test('sorts by player count', () => {
    render(<GameList {...mockProps} />);
    
    const sortSelect = screen.getByDisplayValue('Newest First');
    fireEvent.change(sortSelect, { target: { value: 'players' } });
    
    // Should sort by number of players (descending)
    expect(screen.getAllByText(/Game #/)).toHaveLength(3);
  });
});

describe('GameList Edge Cases', () => {
  test('handles empty games array', () => {
    render(<GameList {...mockProps} games={[]} />);
    
    expect(screen.getByText('No games found')).toBeInTheDocument();
    expect(screen.getByText('Create First Game')).toBeInTheDocument();
  });

  test('handles loading state with existing games', () => {
    render(<GameList {...mockProps} loading={true} />);
    
    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(screen.getByText('Game #1')).toBeInTheDocument(); // Still shows existing games
  });

  test('handles games with missing player data', () => {
    const gamesWithMissingData = [
      {
        ...mockGames[0],
        players: [{ id: 'player1', name: '', symbol: 'X' }]
      }
    ];
    
    render(<GameList {...mockProps} games={gamesWithMissingData} />);
    
    expect(screen.getByText('Game #1')).toBeInTheDocument();
  });

  test('handles games with invalid status', () => {
    const gamesWithInvalidStatus = [
      {
        ...mockGames[0],
        status: 'unknown'
      }
    ];
    
    render(<GameList {...mockProps} games={gamesWithInvalidStatus} />);
    
    expect(screen.getByText('Game #1')).toBeInTheDocument();
  });

  test('shows waiting indicator for full games', () => {
    const fullGame = {
      ...mockGames[1],
      players: [
        { id: 'other1', name: 'Player1', symbol: 'X' },
        { id: 'other2', name: 'Player2', symbol: 'O' }
      ]
    };
    
    render(<GameList {...mockProps} games={[fullGame]} />);
    
    expect(screen.getByText('Waiting for players')).toBeInTheDocument();
  });
});
