import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlayerStats from './PlayerStats';

const mockStats = {
  games_played: 10,
  wins: 6,
  losses: 3,
  draws: 1
};

const mockProps = {
  playerId: 'player123',
  playerName: 'TestPlayer',
  stats: mockStats,
  onUpdateName: jest.fn(),
  onRefresh: jest.fn()
};

describe('PlayerStats Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders player statistics header', () => {
    render(<PlayerStats {...mockProps} />);
    
    expect(screen.getByText('Player Statistics')).toBeInTheDocument();
  });

  test('displays refresh button', () => {
    render(<PlayerStats {...mockProps} />);
    
    expect(screen.getByText('↻ Refresh Stats')).toBeInTheDocument();
  });

  test('shows player profile information', () => {
    render(<PlayerStats {...mockProps} />);
    
    expect(screen.getByText('TestPlayer')).toBeInTheDocument();
    expect(screen.getByText('ID: player123')).toBeInTheDocument();
  });

  test('displays player avatar with first letter', () => {
    render(<PlayerStats {...mockProps} />);
    
    expect(screen.getByText('T')).toBeInTheDocument(); // First letter of TestPlayer
  });

  test('shows correct rank based on win rate', () => {
    render(<PlayerStats {...mockProps} />);
    
    // 60% win rate should be "Expert"
    expect(screen.getByText('Expert')).toBeInTheDocument();
  });

  test('displays main game statistics', () => {
    render(<PlayerStats {...mockProps} />);
    
    expect(screen.getByText('10')).toBeInTheDocument(); // Games played
    expect(screen.getByText('6')).toBeInTheDocument();  // Wins
    expect(screen.getByText('3')).toBeInTheDocument();  // Losses
    expect(screen.getByText('1')).toBeInTheDocument();  // Draws
  });

  test('calculates and displays win rate correctly', () => {
    render(<PlayerStats {...mockProps} />);
    
    expect(screen.getByText('60.0%')).toBeInTheDocument(); // 6/10 = 60%
  });

  test('shows performance breakdown legend', () => {
    render(<PlayerStats {...mockProps} />);
    
    expect(screen.getByText('Wins (6)')).toBeInTheDocument();
    expect(screen.getByText('Losses (3)')).toBeInTheDocument();
    expect(screen.getByText('Draws (1)')).toBeInTheDocument();
  });

  test('displays achievements section', () => {
    render(<PlayerStats {...mockProps} />);
    
    expect(screen.getByText('Achievements')).toBeInTheDocument();
  });

  test('shows unlocked achievements', () => {
    render(<PlayerStats {...mockProps} />);
    
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getByText('Victory!')).toBeInTheDocument();
    expect(screen.getByText('Champion')).toBeInTheDocument();
    expect(screen.getByText('Veteran')).toBeInTheDocument();
  });

  test('displays quick facts section', () => {
    render(<PlayerStats {...mockProps} />);
    
    expect(screen.getByText('Quick Facts')).toBeInTheDocument();
    expect(screen.getByText('Best Streak:')).toBeInTheDocument();
    expect(screen.getByText('Favorite Symbol:')).toBeInTheDocument();
  });

  test('shows goals section with progress', () => {
    render(<PlayerStats {...mockProps} />);
    
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Reach 10 Wins')).toBeInTheDocument();
    expect(screen.getByText('70% Win Rate')).toBeInTheDocument();
    expect(screen.getByText('Play 25 Games')).toBeInTheDocument();
  });

  test('handles refresh button click', () => {
    render(<PlayerStats {...mockProps} />);
    
    fireEvent.click(screen.getByText('↻ Refresh Stats'));
    
    expect(mockProps.onRefresh).toHaveBeenCalled();
  });

  test('allows editing player name', async () => {
    render(<PlayerStats {...mockProps} />);
    
    const editButton = screen.getByTitle('Edit name');
    fireEvent.click(editButton);
    
    const nameInput = screen.getByDisplayValue('TestPlayer');
    expect(nameInput).toBeInTheDocument();
    
    fireEvent.change(nameInput, { target: { value: 'NewName' } });
    fireEvent.blur(nameInput);
    
    await waitFor(() => {
      expect(mockProps.onUpdateName).toHaveBeenCalledWith('NewName');
    });
  });

  test('cancels name editing on escape key', () => {
    render(<PlayerStats {...mockProps} />);
    
    const editButton = screen.getByTitle('Edit name');
    fireEvent.click(editButton);
    
    const nameInput = screen.getByDisplayValue('TestPlayer');
    fireEvent.change(nameInput, { target: { value: 'NewName' } });
    fireEvent.keyDown(nameInput, { key: 'Escape' });
    
    expect(mockProps.onUpdateName).not.toHaveBeenCalled();
  });

  test('saves name on enter key', async () => {
    render(<PlayerStats {...mockProps} />);
    
    const editButton = screen.getByTitle('Edit name');
    fireEvent.click(editButton);
    
    const nameInput = screen.getByDisplayValue('TestPlayer');
    fireEvent.change(nameInput, { target: { value: 'NewName' } });
    fireEvent.keyDown(nameInput, { key: 'Enter' });
    
    await waitFor(() => {
      expect(mockProps.onUpdateName).toHaveBeenCalledWith('NewName');
    });
  });

  test('shows loading state when stats is null', () => {
    render(<PlayerStats {...mockProps} stats={null} />);
    
    expect(screen.getByText('Loading player statistics...')).toBeInTheDocument();
  });

  test('displays no data message for new players', () => {
    const newPlayerStats = {
      games_played: 0,
      wins: 0,
      losses: 0,
      draws: 0
    };
    
    render(<PlayerStats {...mockProps} stats={newPlayerStats} />);
    
    expect(screen.getByText('No games played yet')).toBeInTheDocument();
    expect(screen.getByText('Start playing to see your performance!')).toBeInTheDocument();
  });

  test('calculates correct rank for different win rates', () => {
    // Test Grandmaster (80%+)
    const grandmasterStats = { games_played: 10, wins: 9, losses: 1, draws: 0 };
    const { rerender } = render(<PlayerStats {...mockProps} stats={grandmasterStats} />);
    expect(screen.getByText('Grandmaster')).toBeInTheDocument();
    
    // Test Master (70%+)
    const masterStats = { games_played: 10, wins: 7, losses: 3, draws: 0 };
    rerender(<PlayerStats {...mockProps} stats={masterStats} />);
    expect(screen.getByText('Master')).toBeInTheDocument();
    
    // Test Beginner (<30%)
    const beginnerStats = { games_played: 10, wins: 2, losses: 8, draws: 0 };
    rerender(<PlayerStats {...mockProps} stats={beginnerStats} />);
    expect(screen.getByText('Beginner')).toBeInTheDocument();
  });

  test('shows progress bars for goals', () => {
    render(<PlayerStats {...mockProps} />);
    
    const progressBars = document.querySelectorAll('.progress-bar');
    expect(progressBars.length).toBeGreaterThan(0);
  });

  test('displays achievement progress for locked achievements', () => {
    const lowStatsPlayer = {
      games_played: 3,
      wins: 2,
      losses: 1,
      draws: 0
    };
    
    render(<PlayerStats {...mockProps} stats={lowStatsPlayer} />);
    
    // Should show progress towards Champion achievement (5 wins)
    expect(screen.getByText('2/5')).toBeInTheDocument();
  });

  test('handles empty achievements gracefully', () => {
    const noAchievementsStats = {
      games_played: 0,
      wins: 0,
      losses: 0,
      draws: 0
    };
    
    render(<PlayerStats {...mockProps} stats={noAchievementsStats} />);
    
    expect(screen.getByText('No achievements yet')).toBeInTheDocument();
    expect(screen.getByText('Play games to unlock achievements!')).toBeInTheDocument();
  });
});

describe('PlayerStats Achievements Logic', () => {
  test('unlocks first game achievement', () => {
    const firstGameStats = { games_played: 1, wins: 0, losses: 1, draws: 0 };
    
    render(<PlayerStats {...mockProps} stats={firstGameStats} />);
    
    expect(screen.getByText('First Steps')).toBeInTheDocument();
    expect(screen.getByText('Played your first game')).toBeInTheDocument();
  });

  test('unlocks first win achievement', () => {
    const firstWinStats = { games_played: 1, wins: 1, losses: 0, draws: 0 };
    
    render(<PlayerStats {...mockProps} stats={firstWinStats} />);
    
    expect(screen.getByText('Victory!')).toBeInTheDocument();
    expect(screen.getByText('Won your first game')).toBeInTheDocument();
  });

  test('unlocks veteran achievement', () => {
    const veteranStats = { games_played: 10, wins: 5, losses: 5, draws: 0 };
    
    render(<PlayerStats {...mockProps} stats={veteranStats} />);
    
    expect(screen.getByText('Veteran')).toBeInTheDocument();
    expect(screen.getByText('Played 10 games')).toBeInTheDocument();
  });

  test('unlocks peacemaker achievement', () => {
    const peacemakerStats = { games_played: 6, wins: 1, losses: 2, draws: 3 };
    
    render(<PlayerStats {...mockProps} stats={peacemakerStats} />);
    
    expect(screen.getByText('Peacemaker')).toBeInTheDocument();
    expect(screen.getByText('Drew 3 games')).toBeInTheDocument();
  });

  test('unlocks strategist achievement for high win rate', () => {
    const strategistStats = { games_played: 10, wins: 8, losses: 2, draws: 0 };
    
    render(<PlayerStats {...mockProps} stats={strategistStats} />);
    
    expect(screen.getByText('Strategist')).toBeInTheDocument();
    expect(screen.getByText('70%+ win rate with 5+ games')).toBeInTheDocument();
  });
});

describe('PlayerStats Edge Cases', () => {
  test('handles division by zero for win rate', () => {
    const noGamesStats = { games_played: 0, wins: 0, losses: 0, draws: 0 };
    
    render(<PlayerStats {...mockProps} stats={noGamesStats} />);
    
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  test('handles invalid stats data', () => {
    const invalidStats = { games_played: -1, wins: null, losses: undefined, draws: 'invalid' };
    
    render(<PlayerStats {...mockProps} stats={invalidStats} />);
    
    // Should still render without crashing
    expect(screen.getByText('Player Statistics')).toBeInTheDocument();
  });

  test('handles very long player names', () => {
    const longName = 'VeryLongPlayerNameThatExceedsNormalLength';
    
    render(<PlayerStats {...mockProps} playerName={longName} />);
    
    expect(screen.getByText(longName)).toBeInTheDocument();
  });

  test('handles special characters in player name', () => {
    const specialName = 'Player@#$%^&*()';
    
    render(<PlayerStats {...mockProps} playerName={specialName} />);
    
    expect(screen.getByText(specialName)).toBeInTheDocument();
  });

  test('limits name input length', () => {
    render(<PlayerStats {...mockProps} />);
    
    const editButton = screen.getByTitle('Edit name');
    fireEvent.click(editButton);
    
    const nameInput = screen.getByDisplayValue('TestPlayer');
    expect(nameInput).toHaveAttribute('maxLength', '20');
  });

  test('trims whitespace from name updates', async () => {
    render(<PlayerStats {...mockProps} />);
    
    const editButton = screen.getByTitle('Edit name');
    fireEvent.click(editButton);
    
    const nameInput = screen.getByDisplayValue('TestPlayer');
    fireEvent.change(nameInput, { target: { value: '  NewName  ' } });
    fireEvent.blur(nameInput);
    
    await waitFor(() => {
      expect(mockProps.onUpdateName).toHaveBeenCalledWith('NewName');
    });
  });

  test('does not update name if unchanged', () => {
    render(<PlayerStats {...mockProps} />);
    
    const editButton = screen.getByTitle('Edit name');
    fireEvent.click(editButton);
    
    const nameInput = screen.getByDisplayValue('TestPlayer');
    fireEvent.blur(nameInput); // No change made
    
    expect(mockProps.onUpdateName).not.toHaveBeenCalled();
  });
});
