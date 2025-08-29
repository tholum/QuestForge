import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useAnalytics } from './useAnalytics';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
};

const mockAnalyticsData = {
  success: true,
  data: {
    totalGoals: 25,
    completedGoals: 18,
    totalProgress: 45,
    xpEarned: 1250,
    currentStreak: 7,
    bestStreak: 12,
    averageProgress: 2.5,
    totalActiveTime: 240,
  },
  summary: {
    totalGoals: 25,
    completedGoals: 18,
    completionRate: 72,
    totalXpEarned: 1250,
    currentStreak: 7,
    currentLevel: 4,
  },
  trends: {
    goalsTrend: 15,
    completionTrend: -5,
  },
  moduleBreakdown: [
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
  ],
  timeline: [
    { date: '2024-01-01', progress: 3, xp: 45, displayDate: '1/1' },
    { date: '2024-01-02', progress: 5, xp: 60, displayDate: '1/2' },
    { date: '2024-01-03', progress: 2, xp: 30, displayDate: '1/3' },
  ],
  cached: false,
};

describe('useAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('Data Fetching', () => {
    it('fetches analytics data successfully with default options', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData),
      });

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: createWrapper(),
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockAnalyticsData.data);
      expect(result.current.summary).toEqual(mockAnalyticsData.summary);
      expect(result.current.trends).toEqual(mockAnalyticsData.trends);
      expect(result.current.moduleBreakdown).toEqual(mockAnalyticsData.moduleBreakdown);
      expect(result.current.timeline).toEqual(mockAnalyticsData.timeline);
      expect(result.current.cached).toBe(false);
      expect(result.current.error).toBeNull();

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/analytics?period=month',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('fetches analytics data with custom options', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData),
      });

      const { result } = renderHook(() => useAnalytics({ 
        period: 'week',
        moduleId: 'fitness',
      }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/analytics?period=week&moduleId=fitness',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('handles fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeNull();
    });

    it('handles API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          success: false,
          message: 'Internal server error',
        }),
      });

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.data).toBeNull();
    });

    it('indicates when data is cached', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          ...mockAnalyticsData,
          cached: true,
        }),
      });

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.cached).toBe(true);
    });
  });

  describe('Chart Data Processing', () => {
    it('processes timeline chart data correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData),
      });

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const chartData = result.current.getTimelineChartData();
      expect(chartData).toEqual(mockAnalyticsData.timeline);
      expect(chartData).toHaveLength(3);
      
      const firstDataPoint = chartData[0];
      expect(firstDataPoint).toHaveProperty('date');
      expect(firstDataPoint).toHaveProperty('progress');
      expect(firstDataPoint).toHaveProperty('xp');
      expect(firstDataPoint).toHaveProperty('displayDate');
    });

    it('processes module chart data correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData),
      });

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const moduleData = result.current.getModuleChartData();
      expect(moduleData).toHaveLength(3);
      
      const firstModule = moduleData[0];
      expect(firstModule).toMatchObject({
        moduleId: 'fitness',
        moduleName: 'Fitness',
        name: 'Fitness', // Should include name for charts
        totalGoals: 10,
        completedGoals: 8,
        completed: 8, // Should include completed for charts
        xpEarned: 400,
        completionRate: 80, // Should calculate completion rate
      });
    });

    it('handles empty chart data gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          ...mockAnalyticsData,
          timeline: [],
          moduleBreakdown: [],
        }),
      });

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const timelineData = result.current.getTimelineChartData();
      const moduleData = result.current.getModuleChartData();
      
      expect(timelineData).toHaveLength(0);
      expect(moduleData).toHaveLength(0);
    });
  });

  describe('Data Export', () => {
    it('exports data to CSV successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData),
      });

      // Mock CSV export endpoint
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['csv data'], { type: 'text/csv' })),
      });

      // Mock URL.createObjectURL and click
      const mockCreateObjectURL = vi.fn(() => 'mock-url');
      const mockClick = vi.fn();
      
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = vi.fn();
      
      // Mock document.createElement
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
        style: { display: '' },
      };
      const mockCreateElement = vi.fn(() => mockAnchor);
      document.createElement = mockCreateElement;
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.exportToCsv();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/analytics/export?format=csv&period=month', {
        method: 'GET',
      });
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
    });

    it('exports data to JSON successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['{"data": "json"}'], { type: 'application/json' })),
      });

      const mockCreateObjectURL = vi.fn(() => 'mock-url');
      const mockClick = vi.fn();
      
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = vi.fn();
      
      const mockAnchor = {
        href: '',
        download: '',
        click: mockClick,
        style: { display: '' },
      };
      document.createElement = vi.fn(() => mockAnchor);
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.exportToJson();
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/analytics/export?format=json&period=month', {
        method: 'GET',
      });
    });

    it('handles export errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData),
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.exportToCsv();
        })
      ).rejects.toThrow();
    });
  });

  describe('Cache Management', () => {
    it('refetches analytics data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData),
      });

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);

      await act(async () => {
        await result.current.refetch();
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('invalidates cache', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData),
      });

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.invalidateCache();
      });

      // Should trigger a refetch
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('handles stale data appropriately', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          ...mockAnalyticsData,
          cached: true,
        }),
      });

      const { result } = renderHook(() => useAnalytics({ 
        staleTime: 0, // Consider data stale immediately
      }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.cached).toBe(true);
    });
  });

  describe('Option Changes', () => {
    it('refetches when period changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData),
      });

      const { result, rerender } = renderHook(
        ({ period }) => useAnalytics({ period }),
        {
          wrapper: createWrapper(),
          initialProps: { period: 'month' as const },
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/analytics?period=month',
        expect.any(Object)
      );

      rerender({ period: 'week' as const });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/analytics?period=week',
        expect.any(Object)
      );
    });

    it('refetches when moduleId changes', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData),
      });

      const { result, rerender } = renderHook(
        ({ moduleId }) => useAnalytics({ moduleId }),
        {
          wrapper: createWrapper(),
          initialProps: { moduleId: undefined },
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/analytics?period=month',
        expect.any(Object)
      );

      rerender({ moduleId: 'fitness' });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/analytics?period=month&moduleId=fitness',
        expect.any(Object)
      );
    });

    it('handles undefined moduleId correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData),
      });

      const { result } = renderHook(() => useAnalytics({ 
        moduleId: undefined 
      }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/analytics?period=month',
        expect.any(Object)
      );
    });
  });

  describe('Error Recovery', () => {
    it('retries failed requests', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            retryDelay: 10,
            gcTime: 0,
          },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        React.createElement(QueryClientProvider, { client: queryClient }, children)
      );

      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockAnalyticsData),
        });

      const { result } = renderHook(() => useAnalytics(), { wrapper });

      await waitFor(
        () => {
          expect(result.current.loading).toBe(false);
          expect(result.current.data).toEqual(mockAnalyticsData.data);
        },
        { timeout: 1000 }
      );

      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('handles partial data gracefully', async () => {
      const partialData = {
        success: true,
        data: mockAnalyticsData.data,
        summary: mockAnalyticsData.summary,
        // Missing trends, moduleBreakdown, timeline
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(partialData),
      });

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockAnalyticsData.data);
      expect(result.current.summary).toEqual(mockAnalyticsData.summary);
      expect(result.current.trends).toBeNull();
      expect(result.current.moduleBreakdown).toEqual([]);
      expect(result.current.timeline).toEqual([]);
    });
  });

  describe('Performance', () => {
    it('memoizes chart data processing', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAnalyticsData),
      });

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const firstCall = result.current.getTimelineChartData();
      const secondCall = result.current.getTimelineChartData();

      // Should return the same reference for memoized data
      expect(firstCall).toBe(secondCall);
    });

    it('handles large datasets efficiently', async () => {
      const largeTimeline = Array.from({ length: 365 }, (_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        progress: Math.floor(Math.random() * 10),
        xp: Math.floor(Math.random() * 100),
        displayDate: `1/${i + 1}`,
      }));

      const largeDataset = {
        ...mockAnalyticsData,
        timeline: largeTimeline,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(largeDataset),
      });

      const { result } = renderHook(() => useAnalytics(), {
        wrapper: createWrapper(),
      });

      const startTime = Date.now();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const processingTime = Date.now() - startTime;

      expect(result.current.timeline).toHaveLength(365);
      expect(processingTime).toBeLessThan(1000); // Should process quickly
    });
  });
});