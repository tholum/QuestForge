/**
 * Progress Chart API Routes Tests
 * 
 * Tests for chart data endpoints with various time ranges and aggregations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '@/app/api/v1/progress/chart/[goalId]/route'
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
      difficulty: 'medium',
      userId: 'user-123',
      isCompleted: false
    })
  }))
}))

vi.mock('@/lib/prisma/repositories/progress-repository', () => ({
  ProgressRepository: vi.fn().mockImplementation(() => ({
    getChartData: vi.fn().mockResolvedValue([
      {
        date: '2024-01-01',
        value: 25,
        maxValue: 100,
        percentage: 25,
        xpEarned: 5,
        cumulativeProgress: 25
      },
      {
        date: '2024-01-02',
        value: 45,
        maxValue: 100,
        percentage: 45,
        xpEarned: 12,
        cumulativeProgress: 45
      },
      {
        date: '2024-01-03',
        value: 68,
        maxValue: 100,
        percentage: 68,
        xpEarned: 18,
        cumulativeProgress: 68
      }
    ]),
    getProgressStats: vi.fn().mockResolvedValue({
      totalEntries: 15,
      averageProgress: 62.4,
      bestDay: { date: '2024-01-15', value: 95 },
      worstDay: { date: '2024-01-08', value: 12 },
      streakInfo: {
        currentStreak: 5,
        longestStreak: 8,
        streakStartDate: '2024-01-10'
      },
      progressVelocity: {
        daily: 3.2,
        weekly: 22.4,
        trend: 'increasing'
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

describe('Progress Chart API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/v1/progress/chart/[goalId]', () => {
    it('should fetch chart data for specific goal', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/chart/goal-123')
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.chartData).toHaveLength(3)
      expect(data.data.stats).toHaveProperty('totalEntries')
      expect(data.data.stats).toHaveProperty('averageProgress')
      expect(data.data.stats).toHaveProperty('streakInfo')
    })

    it('should return 404 for non-existent goal', async () => {
      const { GoalRepository } = await import('@/lib/prisma/repositories/goal-repository')
      const mockGoalRepo = new GoalRepository()
      vi.mocked(mockGoalRepo.findById).mockResolvedValueOnce(null)

      const request = createMockRequest('http://localhost:3000/api/v1/progress/chart/non-existent')
      
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

      const request = createMockRequest('http://localhost:3000/api/v1/progress/chart/goal-123')
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      
      expect(response.status).toBe(403)
    })

    it('should filter chart data by date range', async () => {
      const startDate = new Date('2024-01-01').toISOString()
      const endDate = new Date('2024-01-31').toISOString()
      
      const request = createMockRequest(
        `http://localhost:3000/api/v1/progress/chart/goal-123?startDate=${startDate}&endDate=${endDate}`
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

    it('should support different chart types', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/v1/progress/chart/goal-123?chartType=area&aggregation=weekly'
      )
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.config).toEqual({
        chartType: 'area',
        aggregation: 'weekly'
      })
    })

    it('should include progress velocity calculations', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/chart/goal-123')
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.stats.progressVelocity).toHaveProperty('daily')
      expect(data.data.stats.progressVelocity).toHaveProperty('weekly')
      expect(data.data.stats.progressVelocity).toHaveProperty('trend')
      expect(data.data.stats.progressVelocity.trend).toBe('increasing')
    })

    it('should handle goals with no progress data', async () => {
      const { ProgressRepository } = await import('@/lib/prisma/repositories/progress-repository')
      const mockProgressRepo = new ProgressRepository()
      vi.mocked(mockProgressRepo.getChartData).mockResolvedValueOnce([])
      vi.mocked(mockProgressRepo.getProgressStats).mockResolvedValueOnce({
        totalEntries: 0,
        averageProgress: 0,
        bestDay: null,
        worstDay: null,
        streakInfo: {
          currentStreak: 0,
          longestStreak: 0,
          streakStartDate: null
        },
        progressVelocity: {
          daily: 0,
          weekly: 0,
          trend: 'none'
        }
      } as any)

      const request = createMockRequest('http://localhost:3000/api/v1/progress/chart/goal-123')
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.chartData).toHaveLength(0)
      expect(data.data.stats.totalEntries).toBe(0)
    })

    it('should support cumulative progress tracking', async () => {
      const request = createMockRequest(
        'http://localhost:3000/api/v1/progress/chart/goal-123?showCumulative=true'
      )
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      const chartData = data.data.chartData
      
      // Verify cumulative progress is increasing or stays same
      for (let i = 1; i < chartData.length; i++) {
        expect(chartData[i].cumulativeProgress).toBeGreaterThanOrEqual(chartData[i-1].cumulativeProgress)
      }
    })
  })

  describe('Chart Data Validation', () => {
    it('should validate chart data structure', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/chart/goal-123')
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      const data = await response.json()

      const chartData = data.data.chartData
      chartData.forEach((entry: any) => {
        expect(entry).toHaveProperty('date')
        expect(entry).toHaveProperty('value')
        expect(entry).toHaveProperty('maxValue')
        expect(entry).toHaveProperty('percentage')
        expect(entry).toHaveProperty('xpEarned')
        expect(typeof entry.percentage).toBe('number')
        expect(entry.percentage).toBeGreaterThanOrEqual(0)
        expect(entry.percentage).toBeLessThanOrEqual(100)
      })
    })

    it('should calculate percentage correctly', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/chart/goal-123')
      
      const response = await GET(request, { params: { goalId: 'goal-123' } })
      const data = await response.json()

      const chartData = data.data.chartData
      chartData.forEach((entry: any) => {
        const calculatedPercentage = (entry.value / entry.maxValue) * 100
        expect(entry.percentage).toBeCloseTo(calculatedPercentage, 1)
      })
    })
  })
})