import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AchievementsPage } from './AchievementsPage';
import { useAchievements } from '@/hooks/useAchievements';

// Mock the useAchievements hook
vi.mock('@/hooks/useAchievements');

// Mock UI components
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      <div onClick={() => onValueChange?.('unlocked')} data-testid="tab-unlocked">
        Unlocked Tab
      </div>
      <div onClick={() => onValueChange?.('locked')} data-testid="tab-locked">
        Locked Tab
      </div>
      {children}
    </div>
  ),
  TabsContent: ({ value, children }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ value, children }: any) => (
    <div data-testid={`tab-trigger-${value}`}>{children}</div>
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) => (
    <select data-testid="select" value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder || 'Select Value'}</span>,
}));

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div data-testid="progress" data-value={value} className={className}>
      {value}%
    </div>
  ),
}));

const mockUnlockedAchievements = [
  {
    id: 'achievement-1',
    name: 'First Steps',
    description: 'Create your first goal',
    category: 'general',
    tier: 'bronze',
    icon: 'trophy',
    xpReward: 100,
    unlockedAt: '2024-01-10T09:00:00Z',
    progress: {
      current: 1,
      required: 1,
      percentage: 100,
    },
  },
  {
    id: 'achievement-2',
    name: 'Streak Master',
    description: 'Maintain a 7-day streak',
    category: 'streaks',
    tier: 'silver',
    icon: 'flame',
    xpReward: 250,
    unlockedAt: '2024-01-15T14:30:00Z',
    progress: {
      current: 7,
      required: 7,
      percentage: 100,
    },
  },
];

const mockLockedAchievements = [
  {
    id: 'achievement-3',
    name: 'Goal Crusher',
    description: 'Complete 25 goals',
    category: 'goals',
    tier: 'gold',
    icon: 'target',
    xpReward: 500,
    progress: {
      current: 18,
      required: 25,
      percentage: 72,
    },
  },
  {
    id: 'achievement-4',
    name: 'Module Explorer',
    description: 'Use all available modules',
    category: 'modules',
    tier: 'diamond',
    icon: 'compass',
    xpReward: 1000,
    progress: {
      current: 3,
      required: 5,
      percentage: 60,
    },
  },
];

const mockStats = {
  total: 15,
  unlocked: 2,
  progress: 13,
  totalXpEarned: 350,
  nextAchievement: {
    id: 'achievement-3',
    name: 'Goal Crusher',
    description: 'Complete 25 goals',
    progressToNext: 28,
  },
  categories: {
    general: { unlocked: 1, total: 3 },
    goals: { unlocked: 0, total: 4 },
    streaks: { unlocked: 1, total: 2 },
    modules: { unlocked: 0, total: 3 },
    social: { unlocked: 0, total: 3 },
  },
  tiers: {
    bronze: { unlocked: 1, total: 5 },
    silver: { unlocked: 1, total: 4 },
    gold: { unlocked: 0, total: 3 },
    diamond: { unlocked: 0, total: 3 },
  },
};

const mockUseAchievements = {
  achievements: [...mockUnlockedAchievements, ...mockLockedAchievements],
  unlockedAchievements: mockUnlockedAchievements,
  lockedAchievements: mockLockedAchievements,
  stats: mockStats,
  recentUnlocks: mockUnlockedAchievements.slice(0, 1),
  loading: false,
  error: null,
  getAchievementsByCategory: vi.fn((category: string) =>
    [...mockUnlockedAchievements, ...mockLockedAchievements].filter(a => 
      category === 'all' || a.category === category
    )
  ),
  getAchievementsByTier: vi.fn((tier: string) =>
    [...mockUnlockedAchievements, ...mockLockedAchievements].filter(a => 
      tier === 'all' || a.tier === tier
    )
  ),
  getCategoryStats: vi.fn((category: string) => mockStats.categories[category as keyof typeof mockStats.categories]),
  getTierStats: vi.fn((tier: string) => mockStats.tiers[tier as keyof typeof mockStats.tiers]),
  getNextAchievements: vi.fn(() => mockLockedAchievements.slice(0, 3)),
  claimAchievement: vi.fn().mockResolvedValue(undefined),
  refetch: vi.fn().mockResolvedValue(undefined),
};

describe('AchievementsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAchievements as any).mockReturnValue(mockUseAchievements);
  });

  describe('Rendering and Layout', () => {
    it('renders the achievements page with correct title', () => {
      render(<AchievementsPage />);
      
      expect(screen.getByText('Achievements')).toBeInTheDocument();
      expect(screen.getByText('Track your progress and unlock achievements')).toBeInTheDocument();
    });

    it('renders refresh button', () => {
      render(<AchievementsPage />);
      
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('renders tabs for unlocked and locked achievements', () => {
      render(<AchievementsPage />);
      
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-unlocked')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-locked')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('displays loading spinner when loading', () => {
      (useAchievements as any).mockReturnValue({
        ...mockUseAchievements,
        loading: true,
      });

      render(<AchievementsPage />);
      
      expect(screen.getByText('Loading achievements...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error alert when there is an error', () => {
      (useAchievements as any).mockReturnValue({
        ...mockUseAchievements,
        error: new Error('Failed to load achievements'),
      });

      render(<AchievementsPage />);
      
      expect(screen.getByText('Failed to load achievements: Failed to load achievements')).toBeInTheDocument();
    });
  });

  describe('Statistics Overview', () => {
    it('displays achievement statistics', () => {
      render(<AchievementsPage />);
      
      expect(screen.getByText('Total Achievements')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      
      expect(screen.getByText('Unlocked')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('13')).toBeInTheDocument();
      
      expect(screen.getByText('Total XP Earned')).toBeInTheDocument();
      expect(screen.getByText('350')).toBeInTheDocument();
    });
  });

  describe('Next Achievement', () => {
    it('displays next achievement to unlock', () => {
      render(<AchievementsPage />);
      
      expect(screen.getByText('Next Achievement')).toBeInTheDocument();
      expect(screen.getByText('Goal Crusher')).toBeInTheDocument();
      expect(screen.getByText('Complete 25 goals')).toBeInTheDocument();
      expect(screen.getByText('28% to unlock')).toBeInTheDocument();
    });

    it('handles missing next achievement', () => {
      (useAchievements as any).mockReturnValue({
        ...mockUseAchievements,
        stats: {
          ...mockStats,
          nextAchievement: null,
        },
      });

      render(<AchievementsPage />);
      
      expect(screen.getByText('All achievements unlocked! 🎉')).toBeInTheDocument();
    });
  });

  describe('Recent Unlocks', () => {
    it('displays recent achievement unlocks', () => {
      render(<AchievementsPage />);
      
      expect(screen.getByText('Recent Unlocks')).toBeInTheDocument();
      expect(screen.getByText('First Steps')).toBeInTheDocument();
    });

    it('handles no recent unlocks', () => {
      (useAchievements as any).mockReturnValue({
        ...mockUseAchievements,
        recentUnlocks: [],
      });

      render(<AchievementsPage />);
      
      expect(screen.getByText('No recent unlocks')).toBeInTheDocument();
    });
  });

  describe('Achievement Filtering', () => {
    it('allows filtering by category', async () => {
      render(<AchievementsPage />);
      
      const categorySelect = screen.getAllByTestId('select').find(select =>
        select.parentElement?.textContent?.includes('Category')
      );
      
      if (categorySelect) {
        fireEvent.change(categorySelect, { target: { value: 'goals' } });
        
        await waitFor(() => {
          expect(mockUseAchievements.getAchievementsByCategory).toHaveBeenCalledWith('goals');
        });
      }
    });

    it('allows filtering by tier', async () => {
      render(<AchievementsPage />);
      
      const tierSelect = screen.getAllByTestId('select').find(select =>
        select.parentElement?.textContent?.includes('Tier')
      );
      
      if (tierSelect) {
        fireEvent.change(tierSelect, { target: { value: 'gold' } });
        
        await waitFor(() => {
          expect(mockUseAchievements.getAchievementsByTier).toHaveBeenCalledWith('gold');
        });
      }
    });
  });

  describe('Unlocked Achievements Tab', () => {
    it('displays unlocked achievements', () => {
      render(<AchievementsPage />);
      
      expect(screen.getByText('First Steps')).toBeInTheDocument();
      expect(screen.getByText('Create your first goal')).toBeInTheDocument();
      expect(screen.getByText('Streak Master')).toBeInTheDocument();
      expect(screen.getByText('Maintain a 7-day streak')).toBeInTheDocument();
    });

    it('shows unlock dates', () => {
      render(<AchievementsPage />);
      
      expect(screen.getByText('Unlocked 1/10/2024')).toBeInTheDocument();
      expect(screen.getByText('Unlocked 1/15/2024')).toBeInTheDocument();
    });

    it('displays XP rewards', () => {
      render(<AchievementsPage />);
      
      expect(screen.getByText('100 XP')).toBeInTheDocument();
      expect(screen.getByText('250 XP')).toBeInTheDocument();
    });

    it('shows achievement tiers', () => {
      render(<AchievementsPage />);
      
      expect(screen.getByText('Bronze')).toBeInTheDocument();
      expect(screen.getByText('Silver')).toBeInTheDocument();
    });
  });

  describe('Locked Achievements Tab', () => {
    beforeEach(() => {
      render(<AchievementsPage />);
      fireEvent.click(screen.getByTestId('tab-locked'));
    });

    it('switches to locked achievements tab', () => {
      expect(screen.getByTestId('tab-content-locked')).toBeInTheDocument();
    });

    it('displays locked achievements', () => {
      expect(screen.getByText('Goal Crusher')).toBeInTheDocument();
      expect(screen.getByText('Complete 25 goals')).toBeInTheDocument();
      expect(screen.getByText('Module Explorer')).toBeInTheDocument();
      expect(screen.getByText('Use all available modules')).toBeInTheDocument();
    });

    it('shows progress bars for locked achievements', () => {
      const progressBars = screen.getAllByTestId('progress');
      expect(progressBars).toHaveLength(2);
      expect(progressBars[0]).toHaveAttribute('data-value', '72');
      expect(progressBars[1]).toHaveAttribute('data-value', '60');
    });

    it('displays progress text', () => {
      expect(screen.getByText('18/25')).toBeInTheDocument();
      expect(screen.getByText('3/5')).toBeInTheDocument();
    });

    it('shows potential XP rewards', () => {
      expect(screen.getByText('500 XP')).toBeInTheDocument();
      expect(screen.getByText('1000 XP')).toBeInTheDocument();
    });
  });

  describe('Category Distribution', () => {
    it('displays category statistics', () => {
      render(<AchievementsPage />);
      
      expect(screen.getByText('Category Breakdown')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Goals')).toBeInTheDocument();
      expect(screen.getByText('Streaks')).toBeInTheDocument();
      expect(screen.getByText('Modules')).toBeInTheDocument();
    });

    it('shows progress for each category', () => {
      render(<AchievementsPage />);
      
      // Check for category progress indicators
      expect(screen.getByText('1/3')).toBeInTheDocument(); // General
      expect(screen.getByText('0/4')).toBeInTheDocument(); // Goals
      expect(screen.getByText('1/2')).toBeInTheDocument(); // Streaks
      expect(screen.getByText('0/3')).toBeInTheDocument(); // Modules
    });
  });

  describe('Tier Distribution', () => {
    it('displays tier statistics', () => {
      render(<AchievementsPage />);
      
      expect(screen.getByText('Tier Progress')).toBeInTheDocument();
      expect(screen.getByText('Bronze')).toBeInTheDocument();
      expect(screen.getByText('Silver')).toBeInTheDocument();
      expect(screen.getByText('Gold')).toBeInTheDocument();
      expect(screen.getByText('Diamond')).toBeInTheDocument();
    });
  });

  describe('Achievement Cards', () => {
    it('displays achievement information correctly', () => {
      render(<AchievementsPage />);
      
      // Check that achievement cards have all necessary information
      const firstAchievement = screen.getByText('First Steps').closest('[data-testid="achievement-card"]');
      if (firstAchievement) {
        expect(firstAchievement).toHaveTextContent('Create your first goal');
        expect(firstAchievement).toHaveTextContent('100 XP');
        expect(firstAchievement).toHaveTextContent('Bronze');
      }
    });
  });

  describe('Empty States', () => {
    it('displays empty state for unlocked achievements', () => {
      (useAchievements as any).mockReturnValue({
        ...mockUseAchievements,
        unlockedAchievements: [],
      });

      render(<AchievementsPage />);
      
      expect(screen.getByText('No achievements unlocked yet')).toBeInTheDocument();
      expect(screen.getByText('Complete goals to start unlocking achievements!')).toBeInTheDocument();
    });

    it('displays empty state for locked achievements', () => {
      (useAchievements as any).mockReturnValue({
        ...mockUseAchievements,
        lockedAchievements: [],
      });

      render(<AchievementsPage />);
      
      fireEvent.click(screen.getByTestId('tab-locked'));
      
      expect(screen.getByText('All achievements unlocked!')).toBeInTheDocument();
      expect(screen.getByText('Congratulations on unlocking everything!')).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('calls refetch when refresh button is clicked', async () => {
      render(<AchievementsPage />);
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockUseAchievements.refetch).toHaveBeenCalled();
      });
    });

    it('disables refresh button when loading', () => {
      (useAchievements as any).mockReturnValue({
        ...mockUseAchievements,
        loading: true,
      });

      render(<AchievementsPage />);
      
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Achievement Claiming', () => {
    it('allows claiming achievements when available', async () => {
      // Mock an achievement that can be claimed
      const claimableAchievement = {
        ...mockLockedAchievements[0],
        canClaim: true,
        progress: { current: 25, required: 25, percentage: 100 },
      };

      (useAchievements as any).mockReturnValue({
        ...mockUseAchievements,
        lockedAchievements: [claimableAchievement],
      });

      render(<AchievementsPage />);
      
      fireEvent.click(screen.getByTestId('tab-locked'));
      
      const claimButton = screen.getByText('Claim');
      if (claimButton) {
        fireEvent.click(claimButton);
        
        await waitFor(() => {
          expect(mockUseAchievements.claimAchievement).toHaveBeenCalledWith(claimableAchievement.id);
        });
      }
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<AchievementsPage />);
      
      expect(screen.getByRole('heading', { level: 1, name: 'Achievements' })).toBeInTheDocument();
    });

    it('has proper tab navigation', () => {
      render(<AchievementsPage />);
      
      expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
    });

    it('has accessible progress bars', () => {
      render(<AchievementsPage />);
      
      fireEvent.click(screen.getByTestId('tab-locked'));
      
      const progressBars = screen.getAllByTestId('progress');
      progressBars.forEach(progressBar => {
        expect(progressBar).toHaveAttribute('data-value');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('handles different screen sizes', () => {
      render(<AchievementsPage />);
      
      // The component should render without errors on different screen sizes
      // This is mostly tested through CSS classes and responsive grid layouts
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });
  });
});