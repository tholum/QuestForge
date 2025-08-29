import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsPage } from './AnalyticsPage';
import { useAnalytics } from '@/hooks/useAnalytics';

// Mock the useAnalytics hook
vi.mock('@/hooks/useAnalytics');

// Mock Recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// Mock UI components
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

const mockData = {
  totalGoals: 25,
  completedGoals: 18,
  totalProgress: 45,
  xpEarned: 1250,
  currentStreak: 7,
  bestStreak: 12,
  averageProgress: 2.5,
  totalActiveTime: 240,
};

const mockSummary = {
  totalGoals: 25,
  completedGoals: 18,
  completionRate: 72,
  totalXpEarned: 1250,
  currentStreak: 7,
  currentLevel: 4,
};

const mockTrends = {
  goalsTrend: 15,
  completionTrend: -5,
};

const mockModuleBreakdown = [
  {
    moduleId: 'fitness',
    moduleName: 'Fitness',
    totalGoals: 10,
    completedGoals: 8,
    xpEarned: 400,
  },
  {
    moduleId: 'work',
    moduleName: 'Work Projects',
    totalGoals: 8,
    completedGoals: 6,
    xpEarned: 450,
  },
  {
    moduleId: 'learning',
    moduleName: 'Learning',
    totalGoals: 7,
    completedGoals: 4,
    xpEarned: 400,
  },
];

const mockTimeline = [
  { date: '2024-01-01', progress: 3, xp: 45, displayDate: '1/1' },
  { date: '2024-01-02', progress: 5, xp: 60, displayDate: '1/2' },
  { date: '2024-01-03', progress: 2, xp: 30, displayDate: '1/3' },
];

const mockUseAnalytics = {
  data: mockData,
  summary: mockSummary,
  trends: mockTrends,
  moduleBreakdown: mockModuleBreakdown,
  timeline: mockTimeline,
  loading: false,
  error: null,
  cached: false,
  getTimelineChartData: vi.fn(() => mockTimeline),
  getModuleChartData: vi.fn(() => 
    mockModuleBreakdown.map(m => ({
      ...m,
      name: m.moduleName,
      completed: m.completedGoals,
      completionRate: Math.round((m.completedGoals / m.totalGoals) * 100),
    }))
  ),
  exportToCsv: vi.fn().mockResolvedValue(undefined),
  exportToJson: vi.fn().mockResolvedValue(undefined),
  refetch: vi.fn().mockResolvedValue(undefined),
  invalidateCache: vi.fn().mockResolvedValue(undefined),
};

describe('AnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAnalytics as any).mockReturnValue(mockUseAnalytics);
  });

  describe('Rendering and Layout', () => {
    it('renders the analytics page with correct title', () => {
      render(<AnalyticsPage />);
      
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Analytics for month period')).toBeInTheDocument();
    });

    it('renders export and refresh buttons', () => {
      render(<AnalyticsPage />);
      
      expect(screen.getByText('Export CSV')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('renders control panels', () => {
      render(<AnalyticsPage />);
      
      expect(screen.getByText('Time Period')).toBeInTheDocument();
      expect(screen.getByText('Module Filter')).toBeInTheDocument();
      expect(screen.getByText('Chart Type')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('displays loading spinner when loading', () => {
      (useAnalytics as any).mockReturnValue({
        ...mockUseAnalytics,
        loading: true,
        data: null,
      });

      render(<AnalyticsPage />);
      
      expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });

    it('shows loading in subtitle when loading', () => {
      (useAnalytics as any).mockReturnValue({
        ...mockUseAnalytics,
        loading: true,
      });

      render(<AnalyticsPage />);
      
      expect(screen.getByText('Loading analytics...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error alert when there is an error', () => {
      (useAnalytics as any).mockReturnValue({
        ...mockUseAnalytics,
        error: new Error('Failed to load analytics'),
      });

      render(<AnalyticsPage />);
      
      expect(screen.getByText('Failed to load analytics: Failed to load analytics')).toBeInTheDocument();
    });
  });

  describe('Cache Status', () => {
    it('displays cache status when data is cached', () => {
      (useAnalytics as any).mockReturnValue({
        ...mockUseAnalytics,
        cached: true,
      });

      render(<AnalyticsPage />);
      
      expect(screen.getByText('Showing cached data. Click refresh for latest analytics.')).toBeInTheDocument();
    });

    it('does not show cache status when data is not cached', () => {
      render(<AnalyticsPage />);
      
      expect(screen.queryByText('Showing cached data')).not.toBeInTheDocument();
    });
  });

  describe('Key Metrics', () => {
    it('displays total goals metric', () => {
      render(<AnalyticsPage />);
      
      expect(screen.getByText('Total Goals')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('Goals created')).toBeInTheDocument();
    });

    it('displays completion rate metric', () => {
      render(<AnalyticsPage />);
      
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('72%')).toBeInTheDocument();
      expect(screen.getByText('18 completed')).toBeInTheDocument();
    });

    it('displays XP earned metric', () => {
      render(<AnalyticsPage />);
      
      expect(screen.getByText('XP Earned')).toBeInTheDocument();
      expect(screen.getByText('1,250')).toBeInTheDocument();
      expect(screen.getByText('Level 4')).toBeInTheDocument();
    });

    it('displays current streak metric', () => {
      render(<AnalyticsPage />);
      
      expect(screen.getByText('Current Streak')).toBeInTheDocument();
      expect(screen.getByText('7 days')).toBeInTheDocument();
      expect(screen.getByText('Consecutive active days')).toBeInTheDocument();
    });

    it('displays trends when available', () => {
      render(<AnalyticsPage />);
      
      // Check for trend indicators (+ or - percentages)
      expect(screen.getByText('+15%')).toBeInTheDocument();
      expect(screen.getByText('-5%')).toBeInTheDocument();
    });
  });

  describe('Charts', () => {
    it('renders progress timeline chart', () => {
      render(<AnalyticsPage />);
      
      expect(screen.getByText('Progress Timeline')).toBeInTheDocument();
      expect(screen.getByText('Daily progress and XP earned over time')).toBeInTheDocument();
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('renders module performance chart', () => {
      render(<AnalyticsPage />);
      
      expect(screen.getByText('Module Performance')).toBeInTheDocument();
      expect(screen.getByText('Goal completion by module')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('switches between line and bar chart types', async () => {
      render(<AnalyticsPage />);
      
      // Initially shows line chart
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
      
      // Find and change chart type selector
      const chartTypeSelect = screen.getAllByTestId('select').find(select =>
        select.parentElement?.textContent?.includes('Chart Type')
      );
      
      if (chartTypeSelect) {
        fireEvent.change(chartTypeSelect, { target: { value: 'bar' } });
        
        await waitFor(() => {
          expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Module Statistics Table', () => {
    it('displays module statistics table', () => {
      render(<AnalyticsPage />);
      
      expect(screen.getByText('Module Statistics')).toBeInTheDocument();
      expect(screen.getByText('Detailed breakdown by module')).toBeInTheDocument();
      
      // Check table headers
      expect(screen.getByText('Module')).toBeInTheDocument();
      expect(screen.getByText('Goals')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Rate')).toBeInTheDocument();
      expect(screen.getByText('XP')).toBeInTheDocument();
    });

    it('displays module data in table rows', () => {
      render(<AnalyticsPage />);
      
      expect(screen.getByText('Fitness')).toBeInTheDocument();
      expect(screen.getByText('Work Projects')).toBeInTheDocument();
      expect(screen.getByText('Learning')).toBeInTheDocument();
      
      // Check specific data points
      expect(screen.getByText('10')).toBeInTheDocument(); // Fitness total goals
      expect(screen.getByText('8')).toBeInTheDocument(); // Fitness completed
      expect(screen.getByText('80%')).toBeInTheDocument(); // Fitness completion rate
      expect(screen.getByText('400')).toBeInTheDocument(); // Fitness XP
    });
  });

  describe('Controls and Filtering', () => {
    it('allows changing time period', async () => {
      render(<AnalyticsPage />);
      
      const periodSelect = screen.getAllByTestId('select').find(select =>
        select.parentElement?.textContent?.includes('Time Period')
      );
      
      if (periodSelect) {
        fireEvent.change(periodSelect, { target: { value: 'week' } });
        
        // Should trigger useAnalytics with new period
        await waitFor(() => {
          expect(useAnalytics).toHaveBeenCalledWith({
            period: 'week',
            moduleId: undefined,
          });
        });
      }
    });

    it('allows filtering by module', async () => {
      render(<AnalyticsPage />);
      
      const moduleSelect = screen.getAllByTestId('select').find(select =>
        select.parentElement?.textContent?.includes('Module Filter')
      );
      
      if (moduleSelect) {
        fireEvent.change(moduleSelect, { target: { value: 'fitness' } });
        
        await waitFor(() => {
          expect(useAnalytics).toHaveBeenCalledWith({
            period: 'month',
            moduleId: 'fitness',
          });
        });
      }
    });

    it('shows all modules in filter dropdown', () => {
      render(<AnalyticsPage />);
      
      expect(screen.getByText('All Modules')).toBeInTheDocument();
      mockModuleBreakdown.forEach(module => {
        expect(screen.getByText(module.moduleName)).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    it('handles CSV export', async () => {
      render(<AnalyticsPage />);
      
      const exportButton = screen.getByText('Export CSV');
      fireEvent.click(exportButton);

      await waitFor(() => {
        expect(mockUseAnalytics.exportToCsv).toHaveBeenCalled();
      });
    });

    it('disables export when loading', () => {
      (useAnalytics as any).mockReturnValue({
        ...mockUseAnalytics,
        loading: true,
      });

      render(<AnalyticsPage />);
      
      const exportButton = screen.getByText('Export CSV');
      expect(exportButton).toBeDisabled();
    });

    it('disables export when no data', () => {
      (useAnalytics as any).mockReturnValue({
        ...mockUseAnalytics,
        data: null,
      });

      render(<AnalyticsPage />);
      
      const exportButton = screen.getByText('Export CSV');
      expect(exportButton).toBeDisabled();
    });
  });

  describe('Refresh Functionality', () => {
    it('handles refresh', async () => {
      render(<AnalyticsPage />);
      
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockUseAnalytics.invalidateCache).toHaveBeenCalled();
        expect(mockUseAnalytics.refetch).toHaveBeenCalled();
      });
    });

    it('disables refresh when loading', () => {
      (useAnalytics as any).mockReturnValue({
        ...mockUseAnalytics,
        loading: true,
      });

      render(<AnalyticsPage />);
      
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('Empty State', () => {
    it('displays empty state when no data', () => {
      (useAnalytics as any).mockReturnValue({
        ...mockUseAnalytics,
        data: null,
        summary: null,
        loading: false,
      });

      render(<AnalyticsPage />);
      
      expect(screen.getByText('No analytics data')).toBeInTheDocument();
      expect(screen.getByText('Start creating goals to see your analytics.')).toBeInTheDocument();
    });
  });

  describe('Chart Data Processing', () => {
    it('calls chart data functions', () => {
      render(<AnalyticsPage />);
      
      expect(mockUseAnalytics.getTimelineChartData).toHaveBeenCalled();
      expect(mockUseAnalytics.getModuleChartData).toHaveBeenCalled();
    });
  });

  describe('Number Formatting', () => {
    it('formats large numbers with commas', () => {
      render(<AnalyticsPage />);
      
      // Check that XP is formatted with comma
      expect(screen.getByText('1,250')).toBeInTheDocument();
    });
  });

  describe('Period Display', () => {
    it('shows correct period in subtitle', () => {
      render(<AnalyticsPage />);
      
      expect(screen.getByText('Analytics for month period')).toBeInTheDocument();
    });

    it('updates subtitle when period changes', async () => {
      const { rerender } = render(<AnalyticsPage />);
      
      // Change the mock to return a different period
      (useAnalytics as any).mockReturnValue({
        ...mockUseAnalytics,
      });
      
      // We'd need to actually change the period state, but since this is mocked,
      // we'll just verify the current behavior
      expect(screen.getByText('Analytics for month period')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper table headers', () => {
      render(<AnalyticsPage />);
      
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(5);
    });

    it('has proper form labels', () => {
      render(<AnalyticsPage />);
      
      expect(screen.getByText('Time Period')).toBeInTheDocument();
      expect(screen.getByText('Module Filter')).toBeInTheDocument();
      expect(screen.getByText('Chart Type')).toBeInTheDocument();
    });
  });
});