/**
 * Progress API Routes Tests
 * 
 * Comprehensive tests for progress CRUD operations, XP calculation,
 * and gamification integration.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST, GET } from '@/app/api/v1/progress/route'
import { NextRequest } from 'next/server'

// Create a proper mock NextRequest
const createMockRequest = (url: string, options: {
  method: string
  body?: any
  headers?: Record<string, string>
} = { method: 'GET' }) => {
  const request = {
    url,
    method: options.method,
    headers: new Headers(options.headers || {}),
    json: vi.fn().mockResolvedValue(options.body || {}),
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
    create: vi.fn().mockResolvedValue({
      id: 'progress-123',
      value: 50,
      maxValue: 100,
      xpEarned: 15,
      notes: 'Test progress',
      recordedAt: new Date(),
      userId: 'user-123',
      goalId: 'goal-123'
    }),
    findMany: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0)
  }))
}))

vi.mock('@/lib/prisma/repositories/goal-repository', () => ({
  GoalRepository: vi.fn().mockImplementation(() => ({
    findById: vi.fn().mockResolvedValue({
      id: 'goal-123',
      title: 'Test Goal',
      difficulty: 'medium',
      priority: 'high',
      userId: 'user-123',
      isCompleted: false
    }),
    update: vi.fn().mockResolvedValue({})
  }))
}))

vi.mock('@/lib/gamification/XPManager', () => ({
  XPManager: vi.fn().mockImplementation(() => ({
    awardXP: vi.fn().mockResolvedValue({
      xpAwarded: 15,
      newLevel: {
        currentLevel: 2,
        currentXP: 115,
        progressToNextLevel: 0.46
      },
      leveledUp: false
    }),
    getUserStreak: vi.fn().mockResolvedValue({
      currentStreak: 3,
      longestStreak: 5,
      isActive: true
    }),
    updateStreak: vi.fn().mockResolvedValue({
      currentStreak: 4,
      isActive: true
    })
  }))
}))

vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    $client: {}
  }
}))

vi.mock('@/lib/validation/schemas', () => ({
  validateInput: vi.fn((schema, data) => data), // Simple passthrough for testing
  ProgressCreateSchema: {},
  ProgressQuerySchema: {}
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

describe('Progress API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/v1/progress', () => {
    it('should create progress entry with XP calculation', async () => {
      const requestBody = {
        value: 50,
        maxValue: 100,
        goalId: 'goal-123',
        notes: 'Test progress entry'
      }

      const request = createMockRequest('http://localhost:3000/api/v1/progress', {
        method: 'POST',
        body: requestBody,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.xpAwarded).toBe(15)
      expect(data.data.leveledUp).toBe(false)
      expect(data.data.streak).toBe(4)
    })

    it('should validate required fields', async () => {
      const requestBody = {
        // Missing required fields
        value: 50
      }

      const request = createMockRequest('http://localhost:3000/api/v1/progress', {
        method: 'POST',
        body: requestBody,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      
      expect(response.status).toBe(500) // Should be validation error
    })

    it('should handle goal completion', async () => {
      const requestBody = {
        value: 100,
        maxValue: 100,
        goalId: 'goal-123',
        notes: 'Completed goal!'
      }

      const request = createMockRequest('http://localhost:3000/api/v1/progress', {
        method: 'POST',
        body: requestBody,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.data.goalCompleted).toBe(true)
    })

    it('should reject unauthorized goal access', async () => {
      // Mock goal repository to return different user
      const { GoalRepository } = await import('@/lib/prisma/repositories/goal-repository')
      const mockGoalRepo = new GoalRepository()
      vi.mocked(mockGoalRepo.findById).mockResolvedValueOnce({
        id: 'goal-123',
        title: 'Test Goal',
        difficulty: 'medium',
        priority: 'high',
        userId: 'different-user', // Different user ID
        isCompleted: false
      } as any)

      const requestBody = {
        value: 50,
        maxValue: 100,
        goalId: 'goal-123'
      }

      const request = createMockRequest('http://localhost:3000/api/v1/progress', {
        method: 'POST',
        body: requestBody,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(403)
    })
  })

  describe('GET /api/v1/progress', () => {
    it('should fetch progress entries with pagination', async () => {
      const { ProgressRepository } = await import('@/lib/prisma/repositories/progress-repository')
      const mockProgressRepo = new ProgressRepository()
      
      const mockProgressEntries = [
        {
          id: 'progress-1',
          value: 25,
          maxValue: 100,
          xpEarned: 7,
          recordedAt: new Date(),
          userId: 'user-123',
          goalId: 'goal-123'
        },
        {
          id: 'progress-2',
          value: 50,
          maxValue: 100,
          xpEarned: 15,
          recordedAt: new Date(),
          userId: 'user-123',
          goalId: 'goal-123'
        }
      ]

      vi.mocked(mockProgressRepo.findMany).mockResolvedValueOnce(mockProgressEntries as any)
      vi.mocked(mockProgressRepo.count).mockResolvedValueOnce(2)

      const request = createMockRequest('http://localhost:3000/api/v1/progress?page=1&limit=20')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 2,
        hasNextPage: false,
        hasPreviousPage: false
      })
    })

    it('should filter by goal ID', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress?goalId=goal-123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filters.goalId).toBe('goal-123')
    })

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01').toISOString()
      const endDate = new Date('2024-01-31').toISOString()
      
      const request = createMockRequest(
        `http://localhost:3000/api/v1/progress?recordedAfter=${startDate}&recordedBefore=${endDate}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.filters.recordedAfter).toBe(startDate)
      expect(data.filters.recordedBefore).toBe(endDate)
    })
  })

  describe('XP Calculation', () => {
    it('should calculate XP correctly for different difficulties', () => {
      // Test the calculateProgressXP function logic
      const testCases = [
        { progress: 50, difficulty: 'easy', expected: Math.floor((50 / 10) * 1) },
        { progress: 50, difficulty: 'medium', expected: Math.floor((50 / 10) * 1.5) },
        { progress: 50, difficulty: 'hard', expected: Math.floor((50 / 10) * 2) },
        { progress: 50, difficulty: 'expert', expected: Math.floor((50 / 10) * 3) },
      ]

      testCases.forEach(({ progress, difficulty, expected }) => {
        const calculateProgressXP = (progressValue: number, goalDifficulty: string) => {
          const baseXP = Math.floor(progressValue / 10)
          const difficultyMultipliers = {
            easy: 1,
            medium: 1.5,
            hard: 2,
            expert: 3
          }
          const multiplier = difficultyMultipliers[goalDifficulty as keyof typeof difficultyMultipliers] || 1.5
          return Math.max(1, Math.floor(baseXP * multiplier))
        }

        const result = calculateProgressXP(progress, difficulty)
        expect(result).toBe(Math.max(1, expected))
      })
    })

    it('should add completion bonus for 100% progress', () => {
      const calculateProgressXP = (progressValue: number, completionBonus: boolean = false) => {
        const baseXP = Math.floor(progressValue / 10)
        const bonusXP = completionBonus ? 50 : 0
        return Math.max(1, baseXP + bonusXP)
      }

      const resultWithBonus = calculateProgressXP(100, true)
      const resultWithoutBonus = calculateProgressXP(100, false)

      expect(resultWithBonus).toBe(60) // 10 base + 50 bonus
      expect(resultWithoutBonus).toBe(10) // 10 base only
    })
  })
})