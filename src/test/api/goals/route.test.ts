/**
 * Goals API Route Tests
 * 
 * Tests for the goals API endpoints to ensure CRUD operations work correctly.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/v1/goals/route'
import { GoalRepository } from '@/lib/prisma/repositories/goal-repository'

// Mock the GoalRepository
vi.mock('@/lib/prisma/repositories/goal-repository')

// Mock authentication middleware
vi.mock('@/lib/auth/middleware', () => ({
  withAuth: vi.fn((request, handler) => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      totalXp: 100,
      currentLevel: 1,
      streakCount: 5,
      emailVerified: true,
      lastLoginAt: new Date()
    }
    return handler({ ...request, user: mockUser })
  }),
  withMethodValidation: vi.fn((request, methods) => null)
}))

// Mock error handling
vi.mock('@/lib/prisma/error-handler', () => ({
  withErrorHandling: vi.fn((fn) => fn())
}))

describe('Goals API Routes', () => {
  let mockGoalRepository: any

  beforeEach(() => {
    mockGoalRepository = {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn()
    }
    vi.mocked(GoalRepository).mockImplementation(() => mockGoalRepository)
  })

  describe('GET /api/v1/goals', () => {
    it('should return paginated goals for authenticated user', async () => {
      // Arrange
      const mockGoals = [
        {
          id: 'goal-1',
          title: 'Test Goal',
          description: 'A test goal',
          isCompleted: false,
          userId: 'user-1',
          moduleId: 'fitness',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      mockGoalRepository.findMany.mockResolvedValue(mockGoals)
      mockGoalRepository.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/goals?page=1&limit=20')

      // Act
      const response = await GET(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockGoals)
      expect(data.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      })
    })

    it('should handle search queries', async () => {
      // Arrange
      mockGoalRepository.findMany.mockResolvedValue([])
      mockGoalRepository.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/v1/goals?search=fitness')

      // Act
      await GET(request)

      // Assert
      expect(mockGoalRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'fitness',
          userId: 'user-1'
        })
      )
    })

    it('should handle module filtering', async () => {
      // Arrange
      mockGoalRepository.findMany.mockResolvedValue([])
      mockGoalRepository.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/v1/goals?moduleId=fitness')

      // Act
      await GET(request)

      // Assert
      expect(mockGoalRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          moduleId: 'fitness',
          userId: 'user-1'
        })
      )
    })
  })

  describe('POST /api/v1/goals', () => {
    it('should create a new goal for authenticated user', async () => {
      // Arrange
      const goalData = {
        title: 'New Goal',
        description: 'A new goal to achieve',
        moduleId: 'fitness',
        difficulty: 'medium',
        priority: 'high'
      }

      const createdGoal = {
        id: 'goal-2',
        ...goalData,
        userId: 'user-1',
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockGoalRepository.create.mockResolvedValue(createdGoal)

      const request = new NextRequest('http://localhost:3000/api/v1/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData)
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(createdGoal)
      expect(mockGoalRepository.create).toHaveBeenCalledWith({
        ...goalData,
        userId: 'user-1'
      })
    })

    it('should validate required fields', async () => {
      // Arrange
      const invalidGoalData = {
        description: 'Missing title and moduleId'
      }

      const request = new NextRequest('http://localhost:3000/api/v1/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidGoalData)
      })

      // Act & Assert
      await expect(POST(request)).rejects.toThrow()
    })
  })
})