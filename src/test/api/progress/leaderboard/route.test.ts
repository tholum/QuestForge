/**
 * Progress Leaderboard API Routes Tests
 * 
 * Tests for leaderboard functionality with filtering and ranking
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/v1/progress/leaderboard/route'
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
    getLeaderboard: vi.fn().mockResolvedValue([
      {
        userId: 'user-1',
        userName: 'John Doe',
        totalXp: 1250,
        totalEntries: 42,
        averageProgress: 78.5,
        completedGoals: 8,
        currentStreak: 12,
        rank: 1,
        achievements: ['Consistency Master', 'Goal Crusher']
      },
      {
        userId: 'user-123',
        userName: 'Current User',
        totalXp: 875,
        totalEntries: 28,
        averageProgress: 65.2,
        completedGoals: 5,
        currentStreak: 7,
        rank: 2,
        achievements: ['First Steps', 'Week Warrior']
      },
      {
        userId: 'user-3',
        userName: 'Jane Smith',
        totalXp: 620,
        totalEntries: 35,
        averageProgress: 58.1,
        completedGoals: 3,
        currentStreak: 4,
        rank: 3,
        achievements: ['Getting Started']
      }
    ]),
    getLeaderboardStats: vi.fn().mockResolvedValue({
      totalParticipants: 156,
      averageXpAcrossUsers: 445.2,
      mostActiveUser: {
        userId: 'user-1',
        userName: 'John Doe',
        entriesThisWeek: 8
      },
      topStreak: {
        userId: 'user-1',
        userName: 'John Doe',
        streakDays: 12
      },
      recentMilestones: [
        {
          userId: 'user-5',
          userName: 'Mike Johnson',
          milestone: 'Reached 1000 XP',
          achievedAt: new Date('2024-01-15T10:30:00Z')
        }
      ]
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

describe('Progress Leaderboard API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/v1/progress/leaderboard', () => {
    it('should fetch leaderboard with current user highlighted', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/leaderboard')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.leaderboard).toHaveLength(3)
      expect(data.data.stats).toHaveProperty('totalParticipants')
      expect(data.data.currentUserRank).toBe(2)
      
      // Verify ranking order
      const leaderboard = data.data.leaderboard
      expect(leaderboard[0].rank).toBe(1)
      expect(leaderboard[1].rank).toBe(2)
      expect(leaderboard[2].rank).toBe(3)
      
      // Verify XP descending order
      expect(leaderboard[0].totalXp).toBeGreaterThan(leaderboard[1].totalXp)
      expect(leaderboard[1].totalXp).toBeGreaterThan(leaderboard[2].totalXp)
    })

    it('should filter leaderboard by time period', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/v1/progress/leaderboard?period=week'
      )
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filters.period).toBe('week')
      expect(data.data.leaderboard).toHaveLength(3)
    })

    it('should filter leaderboard by goal difficulty', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/v1/progress/leaderboard?difficulty=hard'
      )
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filters.difficulty).toBe('hard')
    })

    it('should support pagination', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/v1/progress/leaderboard?page=1&limit=10'
      )
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 156,
        hasNextPage: true,
        hasPreviousPage: false
      })
    })

    it('should include leaderboard statistics', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/leaderboard')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.stats).toHaveProperty('totalParticipants')
      expect(data.data.stats).toHaveProperty('averageXpAcrossUsers')
      expect(data.data.stats).toHaveProperty('mostActiveUser')
      expect(data.data.stats).toHaveProperty('topStreak')
      expect(data.data.stats).toHaveProperty('recentMilestones')
      
      expect(data.data.stats.totalParticipants).toBe(156)
      expect(data.data.stats.mostActiveUser.entriesThisWeek).toBe(8)
      expect(data.data.stats.topStreak.streakDays).toBe(12)
    })

    it('should sort leaderboard by different metrics', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/v1/progress/leaderboard?sortBy=averageProgress&order=desc'
      )
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filters).toEqual({
        sortBy: 'averageProgress',
        order: 'desc'
      })
    })

    it('should handle empty leaderboard gracefully', async () => {
      const { ProgressRepository } = await import('@/lib/prisma/repositories/progress-repository')
      const mockProgressRepo = new ProgressRepository()
      vi.mocked(mockProgressRepo.getLeaderboard).mockResolvedValueOnce([])
      vi.mocked(mockProgressRepo.getLeaderboardStats).mockResolvedValueOnce({
        totalParticipants: 0,
        averageXpAcrossUsers: 0,
        mostActiveUser: null,
        topStreak: null,
        recentMilestones: []
      } as any)

      const request = createMockRequest('http://localhost:3000/api/v1/progress/leaderboard')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.leaderboard).toHaveLength(0)
      expect(data.data.currentUserRank).toBeNull()
      expect(data.data.stats.totalParticipants).toBe(0)
    })

    it('should include user achievements in leaderboard', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/leaderboard')
      
      const response = await GET(request)
      const data = await response.json()

      const leaderboard = data.data.leaderboard
      expect(leaderboard[0].achievements).toContain('Consistency Master')
      expect(leaderboard[0].achievements).toContain('Goal Crusher')
      expect(leaderboard[1].achievements).toContain('First Steps')
      expect(leaderboard[1].achievements).toContain('Week Warrior')
    })

    it('should filter by minimum XP threshold', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/v1/progress/leaderboard?minXp=800'
      )
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filters.minXp).toBe(800)
    })

    it('should include recent milestones', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/leaderboard')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      const milestones = data.data.stats.recentMilestones
      expect(milestones).toHaveLength(1)
      expect(milestones[0]).toHaveProperty('userId')
      expect(milestones[0]).toHaveProperty('userName')
      expect(milestones[0]).toHaveProperty('milestone')
      expect(milestones[0]).toHaveProperty('achievedAt')
      expect(milestones[0].milestone).toBe('Reached 1000 XP')
    })
  })

  describe('Leaderboard Ranking Logic', () => {
    it('should rank users correctly by total XP', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/leaderboard')
      
      const response = await GET(request)
      const data = await response.json()

      const leaderboard = data.data.leaderboard
      
      // Verify XP-based ranking
      expect(leaderboard[0].totalXp).toBe(1250) // Rank 1
      expect(leaderboard[1].totalXp).toBe(875)  // Rank 2
      expect(leaderboard[2].totalXp).toBe(620)  // Rank 3
      
      // Verify ranks are assigned correctly
      expect(leaderboard[0].rank).toBe(1)
      expect(leaderboard[1].rank).toBe(2)
      expect(leaderboard[2].rank).toBe(3)
    })

    it('should identify current user position correctly', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/leaderboard')
      
      const response = await GET(request)
      const data = await response.json()

      // Current user (user-123) should be at rank 2
      expect(data.data.currentUserRank).toBe(2)
      
      const currentUser = data.data.leaderboard.find((user: any) => user.userId === 'user-123')
      expect(currentUser).toBeDefined()
      expect(currentUser.rank).toBe(2)
      expect(currentUser.userName).toBe('Current User')
    })
  })
})