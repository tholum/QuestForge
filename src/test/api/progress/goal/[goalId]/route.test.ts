/**
 * Progress by Goal API Routes Tests
 * 
 * Tests for goal-specific progress endpoints with filtering and aggregation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/v1/progress/goal/[goalId]/route'
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

vi.mock('@/lib/prisma/repositories/goal-repository', () => ({
  GoalRepository: vi.fn().mockImplementation(() => ({
    findById: vi.fn().mockResolvedValue({
      id: 'goal-123',
      title: 'Test Goal',
      description: 'A test goal for fitness',
      difficulty: 'medium',
      priority: 'high',
      userId: 'user-123',
      isCompleted: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15')
    })
  }))
}))

vi.mock('@/lib/prisma/repositories/progress-repository', () => ({
  ProgressRepository: vi.fn().mockImplementation(() => ({
    findMany: vi.fn().mockResolvedValue([
      {
        id: 'progress-1',
        value: 25,
        maxValue: 100,
        xpEarned: 7,
        notes: 'Good start',
        recordedAt: new Date('2024-01-05'),
        userId: 'user-123',
        goalId: 'goal-123'
      },
      {
        id: 'progress-2',
        value: 45,
        maxValue: 100,
        xpEarned: 12,
        notes: 'Making progress',
        recordedAt: new Date('2024-01-08'),
        userId: 'user-123',
        goalId: 'goal-123'
      },
      {
        id: 'progress-3',
        value: 68,
        maxValue: 100,
        xpEarned: 18,
        notes: 'Almost there',
        recordedAt: new Date('2024-01-12'),
        userId: 'user-123',
        goalId: 'goal-123'
      }
    ]),
    count: vi.fn().mockResolvedValue(3),
    getGoalSummary: vi.fn().mockResolvedValue({
      goalId: 'goal-123',
      totalEntries: 3,
      latestProgress: {
        value: 68,
        maxValue: 100,
        percentage: 68,
        recordedAt: new Date('2024-01-12')
      },
      firstEntry: {
        value: 25,
        recordedAt: new Date('2024-01-05')
      },
      progressGain: 43, // 68 - 25
      totalXpEarned: 37, // 7 + 12 + 18
      averageProgressPerEntry: 46, // (25 + 45 + 68) / 3
      streakInfo: {
        currentStreak: 5,
        longestStreak: 7,
        isActive: true
      },
      milestones: [
        { percentage: 25, achievedAt: new Date('2024-01-05'), xpEarned: 7 },
        { percentage: 50, achievedAt: null, xpEarned: 0 }, // Not yet achieved
        { percentage: 75, achievedAt: null, xpEarned: 0 }
      ],
      projectedCompletion: new Date('2024-01-25')
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

describe('Progress by Goal API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/v1/progress/goal/[goalId]', () => {
    it('should fetch progress entries for specific goal', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/goal/goal-123')
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.progress).toHaveLength(3)
      expect(data.data.summary).toHaveProperty('totalEntries')
      expect(data.data.summary).toHaveProperty('latestProgress')
      expect(data.data.summary).toHaveProperty('streakInfo')
      expect(data.data.goal).toHaveProperty('id')
      expect(data.data.goal.id).toBe('goal-123')
    })

    it('should return 404 for non-existent goal', async () => {
      const { GoalRepository } = await import('@/lib/prisma/repositories/goal-repository')
      const mockGoalRepo = new GoalRepository()
      vi.mocked(mockGoalRepo.findById).mockResolvedValueOnce(null)

      const request = createMockRequest('http://localhost:3000/api/v1/progress/goal/non-existent')
      
      const response = await GET(request, { params: { goalId: 'non-existent' } })
      
      expect(response.status).toBe(404)
    })

    it('should return 403 for unauthorized goal access', async () => {
      const { GoalRepository } = await import('@/lib/prisma/repositories/goal-repository')
      const mockGoalRepo = new GoalRepository()
      vi.mocked(mockGoalRepo.findById).mockResolvedValueOnce({
        id: 'goal-123',
        title: 'Test Goal',
        difficulty: 'medium',
        userId: 'different-user', // Different user ID
        isCompleted: false
      } as any)

      const request = createMockRequest('http://localhost:3000/api/v1/progress/goal/goal-123')
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      
      expect(response.status).toBe(403)
    })

    it('should filter progress by date range', async () => {
      const startDate = new Date('2024-01-08').toISOString()
      const endDate = new Date('2024-01-15').toISOString()
      
      const request = createMockRequest(
        `http://localhost:3000/api/v1/progress/goal/goal-123?startDate=${startDate}&endDate=${endDate}`
      )
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filters).toEqual({
        startDate: startDate,
        endDate: endDate
      })
    })

    it('should paginate progress entries', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/v1/progress/goal/goal-123?page=1&limit=2'
      )
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false
      })
    })

    it('should include goal summary with progress analytics', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/goal/goal-123')
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      const data = await response.json()

      const summary = data.data.summary
      expect(summary.totalEntries).toBe(3)
      expect(summary.latestProgress.percentage).toBe(68)
      expect(summary.progressGain).toBe(43)
      expect(summary.totalXpEarned).toBe(37)
      expect(summary.averageProgressPerEntry).toBe(46)
      expect(summary.streakInfo.currentStreak).toBe(5)
      expect(summary.streakInfo.longestStreak).toBe(7)
      expect(summary.streakInfo.isActive).toBe(true)
    })

    it('should include milestone tracking', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/goal/goal-123')
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      const data = await response.json()

      const milestones = data.data.summary.milestones
      expect(milestones).toHaveLength(3)
      
      // 25% milestone achieved
      expect(milestones[0].percentage).toBe(25)
      expect(milestones[0].achievedAt).toBeTruthy()
      expect(milestones[0].xpEarned).toBe(7)
      
      // 50% and 75% not yet achieved
      expect(milestones[1].percentage).toBe(50)
      expect(milestones[1].achievedAt).toBeNull()
      expect(milestones[2].percentage).toBe(75)
      expect(milestones[2].achievedAt).toBeNull()
    })

    it('should provide completion projection', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/goal/goal-123')
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      const data = await response.json()

      expect(data.data.summary.projectedCompletion).toBeTruthy()
      expect(new Date(data.data.summary.projectedCompletion)).toBeInstanceOf(Date)
    })

    it('should handle goals with no progress entries', async () => {
      const { ProgressRepository } = await import('@/lib/prisma/repositories/progress-repository')
      const mockProgressRepo = new ProgressRepository()
      vi.mocked(mockProgressRepo.findMany).mockResolvedValueOnce([])
      vi.mocked(mockProgressRepo.count).mockResolvedValueOnce(0)
      vi.mocked(mockProgressRepo.getGoalSummary).mockResolvedValueOnce({
        goalId: 'goal-123',
        totalEntries: 0,
        latestProgress: null,
        firstEntry: null,
        progressGain: 0,
        totalXpEarned: 0,
        averageProgressPerEntry: 0,
        streakInfo: {
          currentStreak: 0,
          longestStreak: 0,
          isActive: false
        },
        milestones: [
          { percentage: 25, achievedAt: null, xpEarned: 0 },
          { percentage: 50, achievedAt: null, xpEarned: 0 },
          { percentage: 75, achievedAt: null, xpEarned: 0 }
        ],
        projectedCompletion: null
      } as any)

      const request = createMockRequest('http://localhost:3000/api/v1/progress/goal/goal-123')
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.progress).toHaveLength(0)
      expect(data.data.summary.totalEntries).toBe(0)
      expect(data.data.summary.latestProgress).toBeNull()
      expect(data.data.summary.projectedCompletion).toBeNull()
    })

    it('should sort progress entries by date', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/v1/progress/goal/goal-123?sortBy=recordedAt&order=asc'
      )
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filters).toEqual({
        sortBy: 'recordedAt',
        order: 'asc'
      })

      const progress = data.data.progress
      // Should be sorted in ascending order by recordedAt
      const dates = progress.map((p: any) => new Date(p.recordedAt).getTime())
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i-1])
      }
    })

    it('should filter progress by minimum value', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/v1/progress/goal/goal-123?minValue=40'
      )
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filters.minValue).toBe(40)
    })

    it('should include progress trend analysis', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/v1/progress/goal/goal-123?includeTrends=true'
      )
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Verify trend information is included
      const summary = data.data.summary
      expect(summary.progressGain).toBe(43) // Positive trend
      expect(summary.latestProgress.percentage).toBe(68) // Latest value
      expect(summary.firstEntry.value).toBe(25) // Starting value
    })
  })

  describe('Progress Analytics for Goal', () => {
    it('should calculate progress velocity correctly', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/goal/goal-123')
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      const data = await response.json()

      const summary = data.data.summary
      
      // Progress gain from 25 to 68 = 43 points
      expect(summary.progressGain).toBe(43)
      
      // Average per entry: (25 + 45 + 68) / 3 = 46
      expect(summary.averageProgressPerEntry).toBe(46)
      
      // Total XP: 7 + 12 + 18 = 37
      expect(summary.totalXpEarned).toBe(37)
    })

    it('should track milestone achievements accurately', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/goal/goal-123')
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      const data = await response.json()

      const milestones = data.data.summary.milestones
      
      // Only 25% milestone should be achieved (latest progress is 68%)
      const achieved = milestones.filter((m: any) => m.achievedAt !== null)
      const notAchieved = milestones.filter((m: any) => m.achievedAt === null)
      
      expect(achieved).toHaveLength(1) // Only 25%
      expect(notAchieved).toHaveLength(2) // 50% and 75%
      expect(achieved[0].percentage).toBe(25)
    })
  })
})