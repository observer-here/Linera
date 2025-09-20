import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock axios
jest.mock('axios');
const mockedAxios = require('axios');

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const mockSocket = {
    on: jest.fn(),
    emit: jest.fn(),
    close: jest.fn(),
    connected: true
  };
  return jest.fn(() => mockSocket);
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockedAxios.get.mockResolvedValue({
      data: { success: true, games: [] }
    });
  });

  test('renders main header', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Linera Tic Tac Toe')).toBeInTheDocument();
      expect(screen.getByText('Decentralized gaming on the Linera blockchain')).toBeInTheDocument();
    });
  });

  test('renders navigation tabs', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Games')).toBeInTheDocument();
      expect(screen.getByText('My Stats')).toBeInTheDocument();
    });
  });

  test('switches between views', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Games')).toBeInTheDocument();
    });

    // Click on My Stats tab
    fireEvent.click(screen.getByText('My Stats'));
    
    await waitFor(() => {
      expect(screen.getByText('Player Statistics')).toBeInTheDocument();
    });
  });

  test('displays player info', async () => {
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Player Info')).toBeInTheDocument();
      expect(screen.getByText(/ID:/)).toBeInTheDocument();
      expect(screen.getByText(/Name:/)).toBeInTheDocument();
      expect(screen.getByText(/Status:/)).toBeInTheDocument();
    });
  });

  test('creates new game', async () => {
    const mockGame = {
      id: 1,
      players: [{ id: 'player1', name: 'Test Player', symbol: 'X' }],
      status: 'waiting',
      board: Array(9).fill(null),
      current_player: 'X',
      created_at: new Date().toISOString()
    };

    mockedAxios.post.mockResolvedValue({
      data: { success: true, game: mockGame }
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('+ Create New Game')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Create New Game'));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3001/api/games',
        expect.objectContaining({
          player_id: expect.any(String),
          player_name: expect.any(String)
        })
      );
    });
  });

  test('handles API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load games')).toBeInTheDocument();
    });
  });

  test('displays success messages', async () => {
    const mockGame = {
      id: 1,
      players: [{ id: 'player1', name: 'Test Player', symbol: 'X' }],
      status: 'waiting',
      board: Array(9).fill(null),
      current_player: 'X',
      created_at: new Date().toISOString()
    };

    mockedAxios.post.mockResolvedValue({
      data: { success: true, game: mockGame }
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('+ Create New Game')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ Create New Game'));

    await waitFor(() => {
      expect(screen.getByText('Game created successfully!')).toBeInTheDocument();
    });
  });

  test('loads games on mount', async () => {
    const mockGames = [
      {
        id: 1,
        players: [{ id: 'player1', name: 'Player 1', symbol: 'X' }],
        status: 'waiting',
        board: Array(9).fill(null),
        current_player: 'X',
        created_at: new Date().toISOString()
      }
    ];

    mockedAxios.get.mockResolvedValue({
      data: { success: true, games: mockGames }
    });

    render(<App />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:3001/api/games');
    });
  });

  test('refreshes games list', async () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, games: [] }
    });

    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText('↻ Refresh')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('↻ Refresh'));

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Once on mount, once on refresh
    });
  });

  test('generates unique player ID', () => {
    render(<App />);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'playerId',
      expect.stringMatching(/^player_\d+_[a-z0-9]+$/)
    );
  });

  test('uses stored player ID if available', () => {
    const storedId = 'stored_player_id';
    const storedName = 'Stored Player';
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'playerId') return storedId;
      if (key === 'playerName') return storedName;
      return null;
    });

    render(<App />);
    
    expect(localStorageMock.getItem).toHaveBeenCalledWith('playerId');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('playerName');
  });
});

describe('App Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  test('complete game flow', async () => {
    const mockGame = {
      id: 1,
      players: [
        { id: 'player1', name: 'Player 1', symbol: 'X' },
        { id: 'player2', name: 'Player 2', symbol: 'O' }
      ],
      status: 'playing',
      board: Array(9).fill(null),
      current_player: 'X',
      created_at: new Date().toISOString()
    };

    // Mock initial games load
    mockedAxios.get.mockResolvedValue({
      data: { success: true, games: [] }
    });

    // Mock game creation
    mockedAxios.post.mockResolvedValue({
      data: { success: true, game: mockGame }
    });

    render(<App />);
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('+ Create New Game')).toBeInTheDocument();
    });

    // Create a new game
    fireEvent.click(screen.getByText('+ Create New Game'));

    // Should switch to game view
    await waitFor(() => {
      expect(screen.getByText('Game #1')).toBeInTheDocument();
    });
  });

  test('error handling and recovery', async () => {
    // First call fails
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));
    
    // Second call succeeds
    mockedAxios.get.mockResolvedValueOnce({
      data: { success: true, games: [] }
    });

    render(<App />);
    
    // Should show error
    await waitFor(() => {
      expect(screen.getByText('Failed to load games')).toBeInTheDocument();
    });

    // Click refresh
    fireEvent.click(screen.getByText('↻ Refresh'));

    // Should recover and show games
    await waitFor(() => {
      expect(screen.getByText('+ Create New Game')).toBeInTheDocument();
    });
  });
});
