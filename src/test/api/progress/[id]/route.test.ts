/**
 * Progress by ID API Routes Tests
 * 
 * Tests for individual progress entry CRUD operations (GET, PUT, DELETE)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, PUT, DELETE } from '@/app/api/v1/progress/[id]/route'
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
    findById: vi.fn().mockResolvedValue({
      id: 'progress-123',
      value: 50,
      maxValue: 100,
      xpEarned: 15,
      notes: 'Test progress',
      recordedAt: new Date(),
      userId: 'user-123',
      goalId: 'goal-123'
    }),
    update: vi.fn().mockResolvedValue({
      id: 'progress-123',
      value: 75,
      maxValue: 100,
      xpEarned: 22,
      notes: 'Updated test progress',
      recordedAt: new Date(),
      userId: 'user-123',
      goalId: 'goal-123'
    }),
    delete: vi.fn().mockResolvedValue(true)
  }))
}))

vi.mock('@/lib/validation/schemas', () => ({
  validateInput: vi.fn((schema, data) => data),
  ProgressUpdateSchema: {}
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

describe('Progress by ID API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/v1/progress/[id]', () => {
    it('should fetch specific progress entry', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/progress-123')
      
      const response = await GET(request, { params: { id: 'progress-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe('progress-123')
      expect(data.data.value).toBe(50)
    })

    it('should return 404 for non-existent progress', async () => {
      const { ProgressRepository } = await import('@/lib/prisma/repositories/progress-repository')
      const mockProgressRepo = new ProgressRepository()
      vi.mocked(mockProgressRepo.findById).mockResolvedValueOnce(null)

      const request = createMockRequest('http://localhost:3000/api/v1/progress/non-existent')
      
      const response = await GET(request, { params: { id: 'non-existent' } })
      
      expect(response.status).toBe(404)
    })

    it('should return 403 for unauthorized access', async () => {
      const { ProgressRepository } = await import('@/lib/prisma/repositories/progress-repository')
      const mockProgressRepo = new ProgressRepository()
      vi.mocked(mockProgressRepo.findById).mockResolvedValueOnce({
        id: 'progress-123',
        value: 50,
        maxValue: 100,
        xpEarned: 15,
        notes: 'Test progress',
        recordedAt: new Date(),
        userId: 'different-user', // Different user ID
        goalId: 'goal-123'
      } as any)

      const request = createMockRequest('http://localhost:3000/api/v1/progress/progress-123')
      
      const response = await GET(request, { params: { id: 'progress-123' } })
      
      expect(response.status).toBe(403)
    })
  })

  describe('PUT /api/v1/progress/[id]', () => {
    it('should update progress entry', async () => {
      const requestBody = {
        value: 75,
        maxValue: 100,
        notes: 'Updated progress'
      }

      const request = createMockRequest('http://localhost:3000/api/v1/progress/progress-123', {
        method: 'PUT',
        body: requestBody,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const response = await PUT(request, { params: { id: 'progress-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.value).toBe(75)
      expect(data.data.notes).toBe('Updated test progress')
    })

    it('should return 404 for non-existent progress', async () => {
      const { ProgressRepository } = await import('@/lib/prisma/repositories/progress-repository')
      const mockProgressRepo = new ProgressRepository()
      vi.mocked(mockProgressRepo.findById).mockResolvedValueOnce(null)

      const requestBody = { value: 75 }
      const request = createMockRequest('http://localhost:3000/api/v1/progress/non-existent', {
        method: 'PUT',
        body: requestBody
      })

      const response = await PUT(request, { params: { id: 'non-existent' } })
      
      expect(response.status).toBe(404)
    })
  })

  describe('DELETE /api/v1/progress/[id]', () => {
    it('should delete progress entry', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/progress/progress-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'progress-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Progress entry deleted successfully')
    })

    it('should return 404 for non-existent progress', async () => {
      const { ProgressRepository } = await import('@/lib/prisma/repositories/progress-repository')
      const mockProgressRepo = new ProgressRepository()
      vi.mocked(mockProgressRepo.findById).mockResolvedValueOnce(null)

      const request = createMockRequest('http://localhost:3000/api/v1/progress/non-existent', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'non-existent' } })
      
      expect(response.status).toBe(404)
    })

    it('should return 403 for unauthorized deletion', async () => {
      const { ProgressRepository } = await import('@/lib/prisma/repositories/progress-repository')
      const mockProgressRepo = new ProgressRepository()
      vi.mocked(mockProgressRepo.findById).mockResolvedValueOnce({
        id: 'progress-123',
        value: 50,
        maxValue: 100,
        xpEarned: 15,
        userId: 'different-user', // Different user ID
        goalId: 'goal-123'
      } as any)

      const request = createMockRequest('http://localhost:3000/api/v1/progress/progress-123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: { id: 'progress-123' } })
      
      expect(response.status).toBe(403)
    })
  })
})