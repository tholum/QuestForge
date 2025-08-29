/**
 * useProgress Hook Tests
 * 
 * Tests for React Query integration, optimistic updates,
 * error handling, and cache management.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import {
  useProgress,
  useCreateProgress,
  useUpdateProgress,
  useDeleteProgress,
  useGoalProgress,
  useUserAnalytics
} from '@/hooks/useProgress'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useProgress Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('useProgress', () => {
    it('should fetch progress entries with default parameters', async () => {
      const mockProgressData = {
        success: true,
        data: [
          {
            id: 'progress-1',
            value: 50,
            maxValue: 100,
            xpEarned: 15,
            recordedAt: new Date().toISOString(),
            userId: 'user-123',
            goalId: 'goal-123'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockProgressData)
      })

      const { result } = renderHook(() => useProgress(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockProgressData)
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/progress?')
    })

    it('should apply query filters correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      })

      const filters = {
        goalId: 'goal-123',
        recordedAfter: new Date('2024-01-01'),
        minValue: 25
      }

      renderHook(() => useProgress(filters), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('goalId=goal-123')
        )
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('recordedAfter=2024-01-01T00:00:00.000Z')
        )
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('minValue=25')
        )
      })
    })

    it('should handle fetch errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useProgress(), {
        wrapper: createWrapper()
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
    })
  })

  describe('useCreateProgress', () => {
    it('should create progress entry successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'progress-123',
          value: 75,
          maxValue: 100,
          xpEarned: 22,
          xpAwarded: 22,
          leveledUp: false,
          newLevel: {
            currentLevel: 2,
            currentXP: 150,
            progressToNextLevel: 0.6
          },
          streak: 5,
          goalCompleted: false,
          userId: 'user-123',
          goalId: 'goal-123'
        },
        message: 'Progress recorded successfully'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const { result } = renderHook(() => useCreateProgress(), {
        wrapper: createWrapper()
      })

      const progressData = {
        value: 75,
        maxValue: 100,
        goalId: 'goal-123',
        userId: 'user-123',
        xpEarned: 0,
        recordedAt: new Date()
      }

      let mutationResult
      await waitFor(async () => {
        mutationResult = await result.current.mutateAsync(progressData)
      })

      expect(mutationResult).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(progressData),
      })
    })

    it('should handle validation errors', async () => {
      const errorResponse = {
        success: false,
        error: 'Validation failed: value: Must be positive'
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(errorResponse)
      })

      const { result } = renderHook(() => useCreateProgress(), {
        wrapper: createWrapper()
      })

      const invalidData = {
        value: -10, // Invalid negative value
        maxValue: 100,
        goalId: 'goal-123',
        userId: 'user-123',
        xpEarned: 0,
        recordedAt: new Date()
      }

      await expect(result.current.mutateAsync(invalidData)).rejects.toThrow(
        'Validation failed: value: Must be positive'
      )
    })
  })

  describe('useUpdateProgress', () => {
    it('should update progress entry successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: 'progress-123',
          value: 85,
          maxValue: 100,
          xpEarned: 25,
          userId: 'user-123',
          goalId: 'goal-123'
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const { result } = renderHook(() => useUpdateProgress(), {
        wrapper: createWrapper()
      })

      const updateData = {
        id: 'progress-123',
        data: {
          value: 85,
          notes: 'Updated progress'
        }
      }

      let mutationResult
      await waitFor(async () => {
        mutationResult = await result.current.mutateAsync(updateData)
      })

      expect(mutationResult).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/progress/progress-123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData.data),
      })
    })
  })

  describe('useDeleteProgress', () => {
    it('should delete progress entry successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Progress entry deleted successfully'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const { result } = renderHook(() => useDeleteProgress(), {
        wrapper: createWrapper()
      })

      let mutationResult
      await waitFor(async () => {
        mutationResult = await result.current.mutateAsync('progress-123')
      })

      expect(mutationResult).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/progress/progress-123', {
        method: 'DELETE',
      })
    })
  })

  describe('useGoalProgress', () => {
    it('should fetch goal-specific progress data', async () => {
      const mockResponse = {
        success: true,
        data: {
          goal: {
            id: 'goal-123',
            title: 'Test Goal',
            difficulty: 'medium',
            isCompleted: false
          },
          progressEntries: [
            {
              id: 'progress-1',
              value: 50,
              maxValue: 100,
              recordedAt: new Date().toISOString()
            }
          ],
          summary: {
            totalEntries: 1,
            totalXpEarned: 15,
            averageProgress: 50,
            progressTrend: 'stable' as const
          }
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const { result } = renderHook(
        () => useGoalProgress('goal-123', {
          days: 30,
          includeChart: true,
          includeSummary: true
        }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/progress/goal/goal-123')
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('days=30')
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('includeChart=true')
      )
    })
  })

  describe('useUserAnalytics', () => {
    it('should fetch user analytics data', async () => {
      const mockResponse = {
        success: true,
        data: {
          userId: 'user-123',
          timeframe: {
            days: 30,
            startDate: new Date(),
            endDate: new Date()
          },
          analytics: {
            totalEntries: 15,
            totalXpEarned: 225,
            averageProgress: 65.5,
            progressTrend: 'increasing' as const,
            streakDays: 7,
            peakProgress: 100,
            consistencyScore: 85
          },
          gamification: {
            level: {
              currentLevel: 3,
              currentXP: 225,
              progressToNextLevel: 0.45
            },
            streak: {
              currentStreak: 7,
              longestStreak: 12,
              isActive: true
            }
          },
          insights: {
            dailyAverage: 0.5,
            xpPerEntry: 15,
            streakHealth: 'excellent' as const,
            consistencyGrade: 'A' as const
          }
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      })

      const { result } = renderHook(
        () => useUserAnalytics('user-123', 30),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/progress/analytics/user-123')
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('days=30')
      )
    })
  })

  describe('Query Key Management', () => {
    it('should use correct query keys for caching', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      })

      const wrapper = createWrapper()
      
      // Test that different queries use different keys
      const { result: result1 } = renderHook(
        () => useProgress({ goalId: 'goal-1' }),
        { wrapper }
      )
      
      const { result: result2 } = renderHook(
        () => useProgress({ goalId: 'goal-2' }),
        { wrapper }
      )

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true)
        expect(result2.current.isSuccess).toBe(true)
      })

      // Should have made separate API calls
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})