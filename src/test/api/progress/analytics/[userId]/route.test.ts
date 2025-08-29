/**
 * Progress Analytics API Routes Tests
 * 
 * Tests for user progress analytics endpoints with comprehensive metrics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/v1/progress/analytics/[userId]/route'
import { NextRequest } from 'next/server'

// Create a proper mock NextRequest
const createMockRequest = (url: string, options: {
  method: string
  headers?: Record<string, string>
} = { method: 'GET' }) => {
  const request = {
    url,
    method: options.method,
    headers: new Headers(options.headers || {}),
  } as any
  
  return request as NextRequest
}

// Mock dependencies
vi.mock('@/lib/auth/middleware', () => ({
  withAuth: vi.fn((req, handler) => handler({
    ...req,
    user: { id: 'user-123', email: 'test@example.com' }
  })),
  withMethodValidation: vi.fn(() => null)
}))

vi.mock('@/lib/prisma/repositories/progress-repository', () => ({
  ProgressRepository: vi.fn().mockImplementation(() => ({
    getUserAnalytics: vi.fn().mockResolvedValue({
      totalEntries: 25,
      totalXpEarned: 375,
      averageProgressPerEntry: 68.4,
      completedGoals: 8,
      currentStreak: 7,
      longestStreak: 12,
      progressByDifficulty: {
        easy: { count: 10, avgProgress: 82.5, totalXp: 125 },
        medium: { count: 12, avgProgress: 65.2, totalXp: 180 },
        hard: { count: 3, avgProgress: 45.8, totalXp: 70 }
      },
      weeklyTrends: [
        { week: '2024-01-01', entries: 4, avgProgress: 65 },
        { week: '2024-01-08', entries: 6, avgProgress: 72 },
        { week: '2024-01-15', entries: 5, avgProgress: 58 }
      ],
      topGoals: [
        { goalId: 'goal-1', title: 'Fitness Goal', entries: 8, totalXp: 120 },
        { goalId: 'goal-2', title: 'Learning Goal', entries: 6, totalXp: 95 }
      ]
    }),
    getCompletionRate: vi.fn().mockResolvedValue({
      overall: 0.72,
      byDifficulty: {
        easy: 0.85,
        medium: 0.68,
        hard: 0.42
      },
      byTimeframe: {
        thisWeek: 0.78,
        thisMonth: 0.74,
        thisYear: 0.72
      }
    })
  }))
}))

vi.mock('@/lib/prisma/error-handler', () => ({
  withErrorHandling: vi.fn(async (fn) => {
    try {
      return await fn()
    } catch (error) {
      throw error
    }
  })
}))

describe('Progress Analytics API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/v1/progress/analytics/[userId]', () => {
    it('should fetch comprehensive user analytics', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/analytics/user-123')
      
      const response = await GET(request, { params: { userId: 'user-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveProperty('analytics')
      expect(data.data).toHaveProperty('completionRate')
      
      // Verify analytics structure
      expect(data.data.analytics.totalEntries).toBe(25)
      expect(data.data.analytics.totalXpEarned).toBe(375)
      expect(data.data.analytics.currentStreak).toBe(7)
      expect(data.data.analytics.progressByDifficulty).toHaveProperty('easy')
      expect(data.data.analytics.weeklyTrends).toHaveLength(3)
      expect(data.data.analytics.topGoals).toHaveLength(2)
    })

    it('should return 403 for unauthorized user access', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/analytics/different-user')
      
      const response = await GET(request, { params: { userId: 'different-user' } })
      
      expect(response.status).toBe(403)
    })

    it('should filter analytics by date range', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/v1/progress/analytics/user-123?startDate=2024-01-01&endDate=2024-01-31'
      )
      
      const response = await GET(request, { params: { userId: 'user-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filters).toEqual({
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-31T23:59:59.999Z'
      })
    })

    it('should filter analytics by goal difficulty', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/v1/progress/analytics/user-123?difficulty=medium'
      )
      
      const response = await GET(request, { params: { userId: 'user-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filters).toEqual({
        difficulty: 'medium'
      })
    })

    it('should include completion rate predictions', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/v1/progress/analytics/user-123?includePredictions=true'
      )
      
      const response = await GET(request, { params: { userId: 'user-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.completionRate).toHaveProperty('overall')
      expect(data.data.completionRate).toHaveProperty('byDifficulty')
      expect(data.data.completionRate).toHaveProperty('byTimeframe')
    })

    it('should handle analytics for users with no progress', async () => {
      const { ProgressRepository } = await import('@/lib/prisma/repositories/progress-repository')
      const mockProgressRepo = new ProgressRepository()
      vi.mocked(mockProgressRepo.getUserAnalytics).mockResolvedValueOnce({
        totalEntries: 0,
        totalXpEarned: 0,
        averageProgressPerEntry: 0,
        completedGoals: 0,
        currentStreak: 0,
        longestStreak: 0,
        progressByDifficulty: {},
        weeklyTrends: [],
        topGoals: []
      } as any)

      const request = createMockRequest('http://localhost:3000/api/v1/progress/analytics/user-123')
      
      const response = await GET(request, { params: { userId: 'user-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.analytics.totalEntries).toBe(0)
      expect(data.data.analytics.weeklyTrends).toHaveLength(0)
    })
  })

  describe('Analytics Calculations', () => {
    it('should calculate accurate progress trends', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/analytics/user-123')
      
      const response = await GET(request, { params: { userId: 'user-123' } })
      const data = await response.json()

      const weeklyTrends = data.data.analytics.weeklyTrends
      expect(weeklyTrends).toHaveLength(3)
      
      // Verify trend calculation
      const avgProgress = weeklyTrends.reduce((sum: number, week: any) => sum + week.avgProgress, 0) / weeklyTrends.length
      expect(avgProgress).toBeCloseTo(65, 0) // Approximately 65% average
    })

    it('should calculate difficulty-based XP multipliers correctly', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/analytics/user-123')
      
      const response = await GET(request, { params: { userId: 'user-123' } })
      const data = await response.json()

      const progressByDifficulty = data.data.analytics.progressByDifficulty
      
      // Hard difficulty should have lower average progress but higher XP per entry
      expect(progressByDifficulty.hard.avgProgress).toBeLessThan(progressByDifficulty.easy.avgProgress)
      expect(progressByDifficulty.hard.totalXp / progressByDifficulty.hard.count)
        .toBeGreaterThan(progressByDifficulty.easy.totalXp / progressByDifficulty.easy.count)
    })
  })
})