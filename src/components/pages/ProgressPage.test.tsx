import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProgressPage } from './ProgressPage';
import { useProgress } from '@/hooks/useProgress';

// Mock the useProgress hook
vi.mock('@/hooks/useProgress');

// Mock UI components
vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      <div onClick={() => onValueChange?.('recent')} data-testid="tab-recent">
        Recent Tab
      </div>
      <div onClick={() => onValueChange?.('goals')} data-testid="tab-goals">
        Goals Tab
      </div>
      <div onClick={() => onValueChange?.('analytics')} data-testid="tab-analytics">
        Analytics Tab
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

// Mock Recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

const mockRecentProgress = [
  {
    id: 'progress-1',
    goalId: 'goal-1',
    goalTitle: 'Morning Run',
    module: 'fitness',
    value: 3,
    maxValue: 5,
    unit: 'km',
    date: '2024-01-15',
    recordedAt: '2024-01-15T08:00:00Z',
    xpEarned: 25,
    streak: 7,
    note: 'Great run in the park',
  },
  {
    id: 'progress-2',
    goalId: 'goal-2',
    goalTitle: 'Read Technical Book',
    module: 'learning',
    value: 50,
    maxValue: 100,
    unit: 'pages',
    date: '2024-01-14',
    recordedAt: '2024-01-14T20:00:00Z',
    xpEarned: 30,
    streak: 3,
    note: 'Learned about design patterns',
  },
];

const mockGoalProgress = [
  {
    goalId: 'goal-1',
    goalTitle: 'Morning Run',
    module: 'fitness',
    currentValue: 15,
    targetValue: 30,
    unit: 'km',
    progressPercentage: 50,
    streak: 7,
    lastRecorded: '2024-01-15T08:00:00Z',
    totalXp: 175,
    entriesCount: 7,
    averageDaily: 2.14,
    trend: 'up',
  },
  {
    goalId: 'goal-2',
    goalTitle: 'Read Technical Book',
    module: 'learning',
    currentValue: 250,
    targetValue: 400,
    unit: 'pages',
    progressPercentage: 62.5,
    streak: 3,
    lastRecorded: '2024-01-14T20:00:00Z',
    totalXp: 240,
    entriesCount: 5,
    averageDaily: 50,
    trend: 'steady',
  },
];

const mockChartData = [
  { date: '2024-01-10', progress: 5, xp: 50, displayDate: '1/10' },
  { date: '2024-01-11', progress: 3, xp: 30, displayDate: '1/11' },
  { date: '2024-01-12', progress: 7, xp: 70, displayDate: '1/12' },
  { date: '2024-01-13', progress: 2, xp: 20, displayDate: '1/13' },
  { date: '2024-01-14', progress: 4, xp: 40, displayDate: '1/14' },
  { date: '2024-01-15', progress: 6, xp: 60, displayDate: '1/15' },
];

const mockStats = {
  totalEntries: 25,
  totalXp: 650,
  averageDaily: 3.2,
  currentStreak: 7,
  bestStreak: 12,
  weeklyGoals: 5,
  completionRate: 78,
  activeGoals: 8,
};

const mockUseProgress = {
  recentProgress: mockRecentProgress,
  goalProgress: mockGoalProgress,
  chartData: mockChartData,
  stats: mockStats,
  loading: false,
  error: null,
  filter: {
    module: '',
    dateRange: 'week',
    sortBy: 'date',
    sortOrder: 'desc',
  },
  addProgressEntry: vi.fn().mockResolvedValue(undefined),
  updateProgressEntry: vi.fn().mockResolvedValue(undefined),
  deleteProgressEntry: vi.fn().mockResolvedValue(undefined),
  bulkAddProgress: vi.fn().mockResolvedValue(undefined),
  getProgressForGoal: vi.fn(),
  getProgressChart: vi.fn(() => mockChartData),
  getGoalProgress: vi.fn(() => mockGoalProgress),
  getProgressStats: vi.fn(() => mockStats),
  exportProgress: vi.fn().mockResolvedValue(undefined),
  setFilter: vi.fn(),
  refetch: vi.fn().mockResolvedValue(undefined),
};

describe('ProgressPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useProgress as any).mockReturnValue(mockUseProgress);
  });

  describe('Rendering and Layout', () => {
    it('renders the progress page with correct title', () => {
      render(<ProgressPage />);
      
      expect(screen.getByText('Progress')).toBeInTheDocument();
      expect(screen.getByText('Track and analyze your goal progress')).toBeInTheDocument();
    });

    it('renders tabs for different views', () => {
      render(<ProgressPage />);
      
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-recent')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-goals')).toBeInTheDocument();
      expect(screen.getByTestId('tab-trigger-analytics')).toBeInTheDocument();
    });

    it('renders action buttons', () => {
      render(<ProgressPage />);
      
      expect(screen.getByText('Add Progress')).toBeInTheDocument();
      expect(screen.getByText('Export Data')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('displays loading spinner when loading', () => {
      (useProgress as any).mockReturnValue({
        ...mockUseProgress,
        loading: true,
      });

      render(<ProgressPage />);
      
      expect(screen.getByText('Loading progress data...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error alert when there is an error', () => {
      (useProgress as any).mockReturnValue({
        ...mockUseProgress,
        error: new Error('Failed to load progress'),
      });

      render(<ProgressPage />);
      
      expect(screen.getByText('Failed to load progress: Failed to load progress')).toBeInTheDocument();
    });
  });

  describe('Progress Statistics', () => {
    it('displays progress statistics overview', () => {
      render(<ProgressPage />);
      
      expect(screen.getByText('Total Entries')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      
      expect(screen.getByText('Total XP Earned')).toBeInTheDocument();
      expect(screen.getByText('650')).toBeInTheDocument();
      
      expect(screen.getByText('Current Streak')).toBeInTheDocument();
      expect(screen.getByText('7 days')).toBeInTheDocument();
      
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('78%')).toBeInTheDocument();
    });

    it('displays additional stats', () => {
      render(<ProgressPage />);
      
      expect(screen.getByText('Average Daily')).toBeInTheDocument();
      expect(screen.getByText('3.2')).toBeInTheDocument();
      
      expect(screen.getByText('Best Streak')).toBeInTheDocument();
      expect(screen.getByText('12 days')).toBeInTheDocument();
    });
  });

  describe('Recent Progress Tab', () => {
    it('displays recent progress entries by default', () => {
      render(<ProgressPage />);
      
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.getByText('Read Technical Book')).toBeInTheDocument();
    });

    it('shows progress values and units', () => {
      render(<ProgressPage />);
      
      expect(screen.getByText('3/5 km')).toBeInTheDocument();
      expect(screen.getByText('50/100 pages')).toBeInTheDocument();
    });

    it('displays XP earned and streaks', () => {
      render(<ProgressPage />);
      
      expect(screen.getByText('+25 XP')).toBeInTheDocument();
      expect(screen.getByText('+30 XP')).toBeInTheDocument();
      expect(screen.getByText('7-day streak')).toBeInTheDocument();
      expect(screen.getByText('3-day streak')).toBeInTheDocument();
    });

    it('shows progress notes when available', () => {
      render(<ProgressPage />);
      
      expect(screen.getByText('Great run in the park')).toBeInTheDocument();
      expect(screen.getByText('Learned about design patterns')).toBeInTheDocument();
    });

    it('displays modules and dates', () => {
      render(<ProgressPage />);
      
      expect(screen.getByText('fitness')).toBeInTheDocument();
      expect(screen.getByText('learning')).toBeInTheDocument();
      expect(screen.getByText('1/15/2024')).toBeInTheDocument();
      expect(screen.getByText('1/14/2024')).toBeInTheDocument();
    });
  });

  describe('Goal Progress Tab', () => {
    beforeEach(() => {
      render(<ProgressPage />);
      fireEvent.click(screen.getByTestId('tab-goals'));
    });

    it('switches to goal progress tab', () => {
      expect(screen.getByTestId('tab-content-goals')).toBeInTheDocument();
    });

    it('displays goal progress overview', () => {
      expect(screen.getByText('Morning Run')).toBeInTheDocument();
      expect(screen.getByText('Read Technical Book')).toBeInTheDocument();
    });

    it('shows progress percentages', () => {
      const progressBars = screen.getAllByTestId('progress');
      expect(progressBars[0]).toHaveAttribute('data-value', '50');
      expect(progressBars[1]).toHaveAttribute('data-value', '62.5');
    });

    it('displays current vs target values', () => {
      expect(screen.getByText('15/30 km')).toBeInTheDocument();
      expect(screen.getByText('250/400 pages')).toBeInTheDocument();
    });

    it('shows goal statistics', () => {
      expect(screen.getByText('175 XP')).toBeInTheDocument();
      expect(screen.getByText('240 XP')).toBeInTheDocument();
      expect(screen.getByText('7 entries')).toBeInTheDocument();
      expect(screen.getByText('5 entries')).toBeInTheDocument();
    });

    it('displays trend indicators', () => {
      expect(screen.getByText('↗ Trending up')).toBeInTheDocument();
      expect(screen.getByText('→ Steady')).toBeInTheDocument();
    });

    it('shows last recorded dates', () => {
      expect(screen.getByText('Last: 1/15/2024')).toBeInTheDocument();
      expect(screen.getByText('Last: 1/14/2024')).toBeInTheDocument();
    });
  });

  describe('Analytics Tab', () => {
    beforeEach(() => {
      render(<ProgressPage />);
      fireEvent.click(screen.getByTestId('tab-analytics'));
    });

    it('switches to analytics tab', () => {
      expect(screen.getByTestId('tab-content-analytics')).toBeInTheDocument();
    });

    it('displays progress charts', () => {
      expect(screen.getByText('Progress Timeline')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('renders chart components', () => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('shows chart legend and axes', () => {
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });
  });

  describe('Filtering and Sorting', () => {
    it('allows filtering by module', async () => {
      render(<ProgressPage />);
      
      const moduleFilter = screen.getAllByTestId('select').find(select =>
        select.parentElement?.textContent?.includes('Module')
      );
      
      if (moduleFilter) {
        fireEvent.change(moduleFilter, { target: { value: 'fitness' } });
        
        await waitFor(() => {
          expect(mockUseProgress.setFilter).toHaveBeenCalledWith({
            ...mockUseProgress.filter,
            module: 'fitness',
          });
        });
      }
    });

    it('allows changing date range', async () => {
      render(<ProgressPage />);
      
      const dateRangeFilter = screen.getAllByTestId('select').find(select =>
        select.parentElement?.textContent?.includes('Date Range')
      );
      
      if (dateRangeFilter) {
        fireEvent.change(dateRangeFilter, { target: { value: 'month' } });
        
        await waitFor(() => {
          expect(mockUseProgress.setFilter).toHaveBeenCalledWith({
            ...mockUseProgress.filter,
            dateRange: 'month',
          });
        });
      }
    });

    it('allows changing sort options', async () => {
      render(<ProgressPage />);
      
      const sortFilter = screen.getAllByTestId('select').find(select =>
        select.parentElement?.textContent?.includes('Sort By')
      );
      
      if (sortFilter) {
        fireEvent.change(sortFilter, { target: { value: 'xp' } });
        
        await waitFor(() => {
          expect(mockUseProgress.setFilter).toHaveBeenCalledWith({
            ...mockUseProgress.filter,
            sortBy: 'xp',
          });
        });
      }
    });
  });

  describe('Progress Entry Management', () => {
    it('opens add progress dialog', async () => {
      render(<ProgressPage />);
      
      const addButton = screen.getByText('Add Progress');
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument();
        expect(screen.getByText('Add Progress Entry')).toBeInTheDocument();
      });
    });

    it('handles progress entry creation', async () => {
      render(<ProgressPage />);
      
      const addButton = screen.getByText('Add Progress');
      fireEvent.click(addButton);
      
      await waitFor(() => {
        const saveButton = screen.getByText('Save Progress');
        fireEvent.click(saveButton);
      });
      
      expect(mockUseProgress.addProgressEntry).toHaveBeenCalled();
    });

    it('allows editing existing progress entries', async () => {
      render(<ProgressPage />);
      
      const editButton = screen.getAllByText('Edit')[0];
      fireEvent.click(editButton);
      
      await waitFor(() => {
        expect(screen.getByText('Edit Progress Entry')).toBeInTheDocument();
      });
    });

    it('handles progress entry updates', async () => {
      render(<ProgressPage />);
      
      const editButton = screen.getAllByText('Edit')[0];
      fireEvent.click(editButton);
      
      await waitFor(() => {
        const updateButton = screen.getByText('Update Progress');
        fireEvent.click(updateButton);
      });
      
      expect(mockUseProgress.updateProgressEntry).toHaveBeenCalled();
    });

    it('allows deleting progress entries', async () => {
      render(<ProgressPage />);
      
      const deleteButton = screen.getAllByText('Delete')[0];
      fireEvent.click(deleteButton);
      
      await waitFor(() => {
        expect(mockUseProgress.deleteProgressEntry).toHaveBeenCalledWith('progress-1');
      });
    });
  });

  describe('Bulk Operations', () => {
    it('allows bulk adding progress entries', async () => {
      render(<ProgressPage />);
      
      const bulkAddButton = screen.getByText('Bulk Add');
      fireEvent.click(bulkAddButton);
      
      await waitFor(() => {
        expect(screen.getByText('Bulk Add Progress')).toBeInTheDocument();
      });
    });

    it('handles bulk progress submission', async () => {
      render(<ProgressPage />);
      
      const bulkAddButton = screen.getByText('Bulk Add');
      fireEvent.click(bulkAddButton);
      
      await waitFor(() => {
        const submitButton = screen.getByText('Submit All');
        fireEvent.click(submitButton);
      });
      
      expect(mockUseProgress.bulkAddProgress).toHaveBeenCalled();
    });
  });

  describe('Data Export', () => {
    it('handles data export', async () => {
      render(<ProgressPage />);
      
      const exportButton = screen.getByText('Export Data');
      fireEvent.click(exportButton);
      
      await waitFor(() => {
        expect(mockUseProgress.exportProgress).toHaveBeenCalled();
      });
    });

    it('disables export when loading', () => {
      (useProgress as any).mockReturnValue({
        ...mockUseProgress,
        loading: true,
      });

      render(<ProgressPage />);
      
      const exportButton = screen.getByText('Export Data');
      expect(exportButton).toBeDisabled();
    });
  });

  describe('Refresh Functionality', () => {
    it('calls refetch when refresh button is clicked', async () => {
      render(<ProgressPage />);
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockUseProgress.refetch).toHaveBeenCalled();
      });
    });

    it('disables refresh button when loading', () => {
      (useProgress as any).mockReturnValue({
        ...mockUseProgress,
        loading: true,
      });

      render(<ProgressPage />);
      
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Empty States', () => {
    it('displays empty state for no recent progress', () => {
      (useProgress as any).mockReturnValue({
        ...mockUseProgress,
        recentProgress: [],
      });

      render(<ProgressPage />);
      
      expect(screen.getByText('No recent progress')).toBeInTheDocument();
      expect(screen.getByText('Start tracking your goals to see progress here')).toBeInTheDocument();
    });

    it('displays empty state for no goal progress', () => {
      (useProgress as any).mockReturnValue({
        ...mockUseProgress,
        goalProgress: [],
      });

      render(<ProgressPage />);
      
      fireEvent.click(screen.getByTestId('tab-goals'));
      
      expect(screen.getByText('No goals with progress')).toBeInTheDocument();
      expect(screen.getByText('Create goals and start tracking progress')).toBeInTheDocument();
    });
  });

  describe('Quick Actions', () => {
    it('shows quick action buttons for recent entries', () => {
      render(<ProgressPage />);
      
      expect(screen.getAllByText('Quick Add')).toHaveLength(2);
    });

    it('handles quick progress additions', async () => {
      render(<ProgressPage />);
      
      const quickAddButtons = screen.getAllByText('Quick Add');
      fireEvent.click(quickAddButtons[0]);
      
      await waitFor(() => {
        expect(mockUseProgress.addProgressEntry).toHaveBeenCalled();
      });
    });
  });

  describe('Search Functionality', () => {
    it('allows searching progress entries', async () => {
      render(<ProgressPage />);
      
      const searchInput = screen.getByPlaceholderText('Search progress...');
      fireEvent.change(searchInput, { target: { value: 'run' } });
      
      await waitFor(() => {
        // Should filter results based on search
        expect(screen.getByText('Morning Run')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(<ProgressPage />);
      
      expect(screen.getByRole('heading', { level: 1, name: 'Progress' })).toBeInTheDocument();
    });

    it('has accessible tab navigation', () => {
      render(<ProgressPage />);
      
      expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
    });

    it('has accessible form controls', () => {
      render(<ProgressPage />);
      
      expect(screen.getByPlaceholderText('Search progress...')).toBeInTheDocument();
    });

    it('has accessible progress bars', () => {
      render(<ProgressPage />);
      
      fireEvent.click(screen.getByTestId('tab-goals'));
      
      const progressBars = screen.getAllByTestId('progress');
      progressBars.forEach(progressBar => {
        expect(progressBar).toHaveAttribute('data-value');
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      render(<ProgressPage />);
      
      // Should render mobile-appropriate layout
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });
  });
});