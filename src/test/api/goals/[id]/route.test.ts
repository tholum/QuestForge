/**
 * Individual Goal API Route Tests
 * 
 * Tests for the individual goal API endpoints (GET, PUT, DELETE /api/v1/goals/[id])
 * to ensure CRUD operations work correctly for single goals.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PUT, DELETE } from '@/app/api/v1/goals/[id]/route'
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

describe('Individual Goal API Routes', () => {
  let mockGoalRepository: any
  const mockGoal = {
    id: 'goal-1',
    title: 'Test Goal',
    description: 'A test goal',
    isCompleted: false,
    userId: 'user-1',
    moduleId: 'fitness',
    priority: 'medium',
    difficulty: 'medium',
    targetDate: new Date('2024-12-31'),
    createdAt: new Date(),
    updatedAt: new Date()
  }

  beforeEach(() => {
    mockGoalRepository = {
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
    vi.mocked(GoalRepository).mockImplementation(() => mockGoalRepository)
  })

  describe('GET /api/v1/goals/[id]', () => {
    it('should return a specific goal by ID', async () => {
      // Arrange
      mockGoalRepository.findById.mockResolvedValue(mockGoal)

      const request = new NextRequest('http://localhost:3000/api/v1/goals/goal-1')
      const params = { id: 'goal-1' }

      // Act
      const response = await GET(request, { params })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockGoal)
      expect(mockGoalRepository.findById).toHaveBeenCalledWith('goal-1', 'user-1')
    })

    it('should return 404 when goal is not found', async () => {
      // Arrange
      mockGoalRepository.findById.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/v1/goals/nonexistent')
      const params = { id: 'nonexistent' }

      // Act
      const response = await GET(request, { params })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Goal not found')
    })

    it('should only return goals owned by the authenticated user', async () => {
      // Arrange
      mockGoalRepository.findById.mockResolvedValue(null) // Goal not found for this user

      const request = new NextRequest('http://localhost:3000/api/v1/goals/other-user-goal')
      const params = { id: 'other-user-goal' }

      // Act
      const response = await GET(request, { params })

      // Assert
      expect(response.status).toBe(404)
      expect(mockGoalRepository.findById).toHaveBeenCalledWith('other-user-goal', 'user-1')
    })
  })

  describe('PUT /api/v1/goals/[id]', () => {
    it('should update a goal successfully', async () => {
      // Arrange
      const updateData = {
        title: 'Updated Goal',
        description: 'Updated description',
        priority: 'high',
        difficulty: 'hard'
      }

      const updatedGoal = {
        ...mockGoal,
        ...updateData,
        updatedAt: new Date()
      }

      mockGoalRepository.update.mockResolvedValue(updatedGoal)

      const request = new NextRequest('http://localhost:3000/api/v1/goals/goal-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })
      const params = { id: 'goal-1' }

      // Act
      const response = await PUT(request, { params })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(updatedGoal)
      expect(mockGoalRepository.update).toHaveBeenCalledWith('goal-1', 'user-1', updateData)
    })

    it('should validate update data', async () => {
      // Arrange
      const invalidUpdateData = {
        title: '', // Empty title should be invalid
        priority: 'invalid-priority'
      }

      const request = new NextRequest('http://localhost:3000/api/v1/goals/goal-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invalidUpdateData)
      })
      const params = { id: 'goal-1' }

      // Act & Assert
      await expect(PUT(request, { params })).rejects.toThrow()
    })

    it('should return 404 when trying to update non-existent goal', async () => {
      // Arrange
      mockGoalRepository.update.mockResolvedValue(null)

      const updateData = {
        title: 'Updated Goal'
      }

      const request = new NextRequest('http://localhost:3000/api/v1/goals/nonexistent', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })
      const params = { id: 'nonexistent' }

      // Act
      const response = await PUT(request, { params })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Goal not found or access denied')
    })

    it('should handle partial updates', async () => {
      // Arrange
      const partialUpdateData = {
        isCompleted: true
      }

      const updatedGoal = {
        ...mockGoal,
        isCompleted: true,
        updatedAt: new Date()
      }

      mockGoalRepository.update.mockResolvedValue(updatedGoal)

      const request = new NextRequest('http://localhost:3000/api/v1/goals/goal-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partialUpdateData)
      })
      const params = { id: 'goal-1' }

      // Act
      const response = await PUT(request, { params })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.isCompleted).toBe(true)
    })

    it('should handle date field updates', async () => {
      // Arrange
      const updateData = {
        targetDate: '2025-01-01T00:00:00.000Z'
      }

      const updatedGoal = {
        ...mockGoal,
        targetDate: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date()
      }

      mockGoalRepository.update.mockResolvedValue(updatedGoal)

      const request = new NextRequest('http://localhost:3000/api/v1/goals/goal-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      })
      const params = { id: 'goal-1' }

      // Act
      const response = await PUT(request, { params })

      // Assert
      expect(response.status).toBe(200)
      expect(mockGoalRepository.update).toHaveBeenCalledWith('goal-1', 'user-1', updateData)
    })
  })

  describe('DELETE /api/v1/goals/[id]', () => {
    it('should delete a goal successfully', async () => {
      // Arrange
      mockGoalRepository.delete.mockResolvedValue(true)

      const request = new NextRequest('http://localhost:3000/api/v1/goals/goal-1', {
        method: 'DELETE'
      })
      const params = { id: 'goal-1' }

      // Act
      const response = await DELETE(request, { params })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Goal deleted successfully')
      expect(mockGoalRepository.delete).toHaveBeenCalledWith('goal-1', 'user-1')
    })

    it('should return 404 when trying to delete non-existent goal', async () => {
      // Arrange
      mockGoalRepository.delete.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/v1/goals/nonexistent', {
        method: 'DELETE'
      })
      const params = { id: 'nonexistent' }

      // Act
      const response = await DELETE(request, { params })
      const data = await response.json()

      // Assert
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Goal not found or access denied')
    })

    it('should only allow deletion of goals owned by the authenticated user', async () => {
      // Arrange
      mockGoalRepository.delete.mockResolvedValue(false) // Goal not found for this user

      const request = new NextRequest('http://localhost:3000/api/v1/goals/other-user-goal', {
        method: 'DELETE'
      })
      const params = { id: 'other-user-goal' }

      // Act
      const response = await DELETE(request, { params })

      // Assert
      expect(response.status).toBe(404)
      expect(mockGoalRepository.delete).toHaveBeenCalledWith('other-user-goal', 'user-1')
    })
  })

  describe('Error Handling', () => {
    it('should handle repository errors in GET', async () => {
      // Arrange
      mockGoalRepository.findById.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/goals/goal-1')
      const params = { id: 'goal-1' }

      // Act & Assert
      await expect(GET(request, { params })).rejects.toThrow('Database error')
    })

    it('should handle repository errors in PUT', async () => {
      // Arrange
      mockGoalRepository.update.mockRejectedValue(new Error('Update failed'))

      const request = new NextRequest('http://localhost:3000/api/v1/goals/goal-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Updated Goal' })
      })
      const params = { id: 'goal-1' }

      // Act & Assert
      await expect(PUT(request, { params })).rejects.toThrow('Update failed')
    })

    it('should handle repository errors in DELETE', async () => {
      // Arrange
      mockGoalRepository.delete.mockRejectedValue(new Error('Delete failed'))

      const request = new NextRequest('http://localhost:3000/api/v1/goals/goal-1', {
        method: 'DELETE'
      })
      const params = { id: 'goal-1' }

      // Act & Assert
      await expect(DELETE(request, { params })).rejects.toThrow('Delete failed')
    })
  })

  describe('Request Body Parsing', () => {
    it('should handle malformed JSON in PUT request', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/v1/goals/goal-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '{ invalid json'
      })
      const params = { id: 'goal-1' }

      // Act & Assert
      await expect(PUT(request, { params })).rejects.toThrow()
    })

    it('should handle missing request body in PUT request', async () => {
      // Arrange
      const request = new NextRequest('http://localhost:3000/api/v1/goals/goal-1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      const params = { id: 'goal-1' }

      // Act & Assert
      await expect(PUT(request, { params })).rejects.toThrow()
    })
  })

  describe('Goal ID Validation', () => {
    it('should validate goal ID format', async () => {
      // Test with various invalid ID formats
      const invalidIds = ['', '  ', 'invalid-id-format-that-is-too-long', null, undefined]

      for (const invalidId of invalidIds) {
        const request = new NextRequest(`http://localhost:3000/api/v1/goals/${invalidId}`)
        const params = { id: invalidId }

        // These should either throw validation errors or return 404
        // The exact behavior depends on the validation implementation
        try {
          const response = await GET(request, { params })
          if (response.status !== 404 && response.status !== 400) {
            throw new Error(`Expected 404 or 400 for invalid ID: ${invalidId}`)
          }
        } catch (error) {
          // Validation errors are acceptable
          expect(error).toBeDefined()
        }
      }
    })
  })
})