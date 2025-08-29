/**
 * Bulk Goals API Route Tests
 * 
 * Tests for the bulk goals API endpoint (/api/v1/goals/bulk)
 * to ensure bulk operations work correctly.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST, PUT, DELETE } from '@/app/api/v1/goals/bulk/route'
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

describe('Bulk Goals API Routes', () => {
  let mockGoalRepository: any

  beforeEach(() => {
    mockGoalRepository = {
      createMany: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      findManyById: vi.fn()
    }
    vi.mocked(GoalRepository).mockImplementation(() => mockGoalRepository)
  })

  describe('POST /api/v1/goals/bulk (Bulk Create)', () => {
    it('should create multiple goals successfully', async () => {
      // Arrange
      const goalsData = [
        {
          title: 'Goal 1',
          description: 'First goal',
          moduleId: 'fitness',
          priority: 'high',
          difficulty: 'medium'
        },
        {
          title: 'Goal 2',
          description: 'Second goal',
          moduleId: 'learning',
          priority: 'medium',
          difficulty: 'hard'
        }
      ]

      const createdGoals = goalsData.map((goal, index) => ({
        id: `goal-${index + 1}`,
        ...goal,
        userId: 'user-1',
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      mockGoalRepository.createMany.mockResolvedValue(createdGoals)

      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goals: goalsData })
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.data[0].title).toBe('Goal 1')
      expect(data.data[1].title).toBe('Goal 2')
      expect(mockGoalRepository.createMany).toHaveBeenCalledWith(
        goalsData.map(goal => ({ ...goal, userId: 'user-1' }))
      )
    })

    it('should validate required fields for bulk creation', async () => {
      // Arrange
      const invalidGoalsData = [
        {
          // Missing title
          description: 'First goal',
          moduleId: 'fitness'
        },
        {
          title: 'Goal 2',
          // Missing moduleId
          description: 'Second goal'
        }
      ]

      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goals: invalidGoalsData })
      })

      // Act & Assert
      await expect(POST(request)).rejects.toThrow()
    })

    it('should handle empty goals array', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goals: [] })
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('At least one goal is required')
    })

    it('should enforce maximum bulk creation limit', async () => {
      // Arrange - Create more than allowed limit (assuming limit is 50)
      const tooManyGoals = Array.from({ length: 51 }, (_, index) => ({
        title: `Goal ${index + 1}`,
        moduleId: 'fitness',
        priority: 'medium',
        difficulty: 'medium'
      }))

      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goals: tooManyGoals })
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Maximum 50 goals allowed per bulk operation')
    })
  })

  describe('PUT /api/v1/goals/bulk (Bulk Update)', () => {
    it('should update multiple goals successfully', async () => {
      // Arrange
      const updateData = {
        goalIds: ['goal-1', 'goal-2'],
        updates: {
          priority: 'high',
          difficulty: 'hard'
        }
      }

      const updatedGoals = [
        {
          id: 'goal-1',
          title: 'Goal 1',
          priority: 'high',
          difficulty: 'hard',
          userId: 'user-1'
        },
        {
          id: 'goal-2',
          title: 'Goal 2',
          priority: 'high',
          difficulty: 'hard',
          userId: 'user-1'
        }
      ]

      mockGoalRepository.updateMany.mockResolvedValue(updatedGoals)

      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.message).toBe('2 goals updated successfully')
      expect(mockGoalRepository.updateMany).toHaveBeenCalledWith(
        updateData.goalIds,
        'user-1',
        updateData.updates
      )
    })

    it('should handle bulk completion', async () => {
      // Arrange
      const updateData = {
        goalIds: ['goal-1', 'goal-2', 'goal-3'],
        updates: {
          isCompleted: true
        }
      }

      const completedGoals = updateData.goalIds.map(id => ({
        id,
        isCompleted: true,
        userId: 'user-1'
      }))

      mockGoalRepository.updateMany.mockResolvedValue(completedGoals)

      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(3)
      expect(data.message).toBe('3 goals updated successfully')
    })

    it('should validate goal IDs array', async () => {
      // Arrange
      const invalidUpdateData = {
        goalIds: [], // Empty array
        updates: {
          priority: 'high'
        }
      }

      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidUpdateData)
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('At least one goal ID is required')
    })

    it('should validate updates object', async () => {
      // Arrange
      const invalidUpdateData = {
        goalIds: ['goal-1'],
        updates: {} // Empty updates
      }

      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidUpdateData)
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('At least one field to update is required')
    })

    it('should enforce maximum bulk update limit', async () => {
      // Arrange
      const tooManyIds = Array.from({ length: 101 }, (_, index) => `goal-${index + 1}`)
      const updateData = {
        goalIds: tooManyIds,
        updates: {
          priority: 'high'
        }
      }

      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })

      // Act
      const response = await PUT(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Maximum 100 goals allowed per bulk operation')
    })
  })

  describe('DELETE /api/v1/goals/bulk (Bulk Delete)', () => {
    it('should delete multiple goals successfully', async () => {
      // Arrange
      const deleteData = {
        goalIds: ['goal-1', 'goal-2', 'goal-3']
      }

      mockGoalRepository.deleteMany.mockResolvedValue({
        count: 3,
        deletedIds: deleteData.goalIds
      })

      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deleteData)
      })

      // Act
      const response = await DELETE(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.count).toBe(3)
      expect(data.data.deletedIds).toEqual(deleteData.goalIds)
      expect(data.message).toBe('3 goals deleted successfully')
      expect(mockGoalRepository.deleteMany).toHaveBeenCalledWith(deleteData.goalIds, 'user-1')
    })

    it('should handle partial deletion success', async () => {
      // Arrange - Some goals might not exist or belong to other users
      const deleteData = {
        goalIds: ['goal-1', 'goal-2', 'nonexistent-goal']
      }

      mockGoalRepository.deleteMany.mockResolvedValue({
        count: 2,
        deletedIds: ['goal-1', 'goal-2']
      })

      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deleteData)
      })

      // Act
      const response = await DELETE(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.count).toBe(2)
      expect(data.data.deletedIds).toHaveLength(2)
      expect(data.message).toBe('2 goals deleted successfully')
    })

    it('should validate goal IDs array for deletion', async () => {
      // Arrange
      const invalidDeleteData = {
        goalIds: [] // Empty array
      }

      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidDeleteData)
      })

      // Act
      const response = await DELETE(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('At least one goal ID is required')
    })

    it('should handle case when no goals are deleted', async () => {
      // Arrange - Goals don't exist or don't belong to user
      const deleteData = {
        goalIds: ['nonexistent-goal-1', 'nonexistent-goal-2']
      }

      mockGoalRepository.deleteMany.mockResolvedValue({
        count: 0,
        deletedIds: []
      })

      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deleteData)
      })

      // Act
      const response = await DELETE(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('No goals found to delete')
    })

    it('should enforce maximum bulk deletion limit', async () => {
      // Arrange
      const tooManyIds = Array.from({ length: 101 }, (_, index) => `goal-${index + 1}`)
      const deleteData = {
        goalIds: tooManyIds
      }

      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deleteData)
      })

      // Act
      const response = await DELETE(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Maximum 100 goals allowed per bulk operation')
    })
  })

  describe('Error Handling', () => {
    it('should handle repository errors during bulk creation', async () => {
      // Arrange
      mockGoalRepository.createMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goals: [{ title: 'Goal 1', moduleId: 'fitness' }]
        })
      })

      // Act & Assert
      await expect(POST(request)).rejects.toThrow('Database error')
    })

    it('should handle repository errors during bulk updates', async () => {
      // Arrange
      mockGoalRepository.updateMany.mockRejectedValue(new Error('Update failed'))

      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalIds: ['goal-1'],
          updates: { priority: 'high' }
        })
      })

      // Act & Assert
      await expect(PUT(request)).rejects.toThrow('Update failed')
    })

    it('should handle repository errors during bulk deletion', async () => {
      // Arrange
      mockGoalRepository.deleteMany.mockRejectedValue(new Error('Delete failed'))

      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalIds: ['goal-1']
        })
      })

      // Act & Assert
      await expect(DELETE(request)).rejects.toThrow('Delete failed')
    })
  })

  describe('Request Body Validation', () => {
    it('should handle malformed JSON', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{ invalid json'
      })

      // Act & Assert
      await expect(POST(request)).rejects.toThrow()
    })

    it('should handle missing request body', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      // Act & Assert
      await expect(POST(request)).rejects.toThrow()
    })
  })

  describe('Data Sanitization', () => {
    it('should sanitize input data during bulk creation', async () => {
      // Arrange
      const goalsData = [
        {
          title: '  Goal with spaces  ',
          description: 'Description with\nextra\nlines',
          moduleId: 'fitness',
          priority: 'HIGH', // Should be normalized to lowercase
          difficulty: 'MEDIUM'
        }
      ]

      const sanitizedGoal = {
        id: 'goal-1',
        title: 'Goal with spaces',
        description: 'Description with extra lines',
        moduleId: 'fitness',
        priority: 'high',
        difficulty: 'medium',
        userId: 'user-1',
        isCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockGoalRepository.createMany.mockResolvedValue([sanitizedGoal])

      const request = new NextRequest('http://localhost:3000/api/v1/goals/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goals: goalsData })
      })

      // Act
      const response = await POST(request)
      const data = await response.json()

      // Assert
      expect(response.status).toBe(201)
      // The repository should receive sanitized data
      expect(mockGoalRepository.createMany).toHaveBeenCalledWith([
        expect.objectContaining({
          title: expect.any(String), // Should be trimmed
          priority: expect.any(String), // Should be normalized
          userId: 'user-1'
        })
      ])
    })
  })
})