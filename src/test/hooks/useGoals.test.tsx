/**
 * useGoals Hook Tests
 * 
 * Tests for the useGoals custom hook to ensure proper data fetching and state management.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useGoals } from '@/hooks/useGoals'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useGoals Hook', () => {
  let queryClient: QueryClient

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
    mockFetch.mockReset()
  })

  it('should fetch goals successfully', async () => {
    // Arrange
    const mockGoalsResponse = {
      success: true,
      data: [
        {
          id: 'goal-1',
          title: 'Test Goal',
          description: 'A test goal',
          isCompleted: false,
          userId: 'user-1',
          moduleId: 'fitness',
          priority: 'medium',
          difficulty: 'medium',
          createdAt: '2023-01-01T00:00:00.000Z',
          updatedAt: '2023-01-01T00:00:00.000Z'
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      },
      filters: {}
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGoalsResponse
    })

    // Act
    const { result } = renderHook(() => useGoals({ page: 1, limit: 20 }), { wrapper })

    // Assert
    expect(result.current.loading).toBe(true)
    expect(result.current.goals).toEqual([])

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.goals).toEqual(mockGoalsResponse.data)
    expect(result.current.pagination).toEqual(mockGoalsResponse.pagination)
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/goals?page=1&limit=20')
  })

  it('should handle search queries', async () => {
    // Arrange
    const mockGoalsResponse = {
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
      },
      filters: { search: 'fitness' }
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGoalsResponse
    })

    // Act
    const { result } = renderHook(() => useGoals({ 
      page: 1, 
      limit: 20, 
      search: 'fitness' 
    }), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Assert
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/goals?page=1&limit=20&search=fitness')
    expect(result.current.filters).toEqual({ search: 'fitness' })
  })

  it('should handle filter options', async () => {
    // Arrange
    const mockGoalsResponse = {
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
      },
      filters: {}
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockGoalsResponse
    })

    // Act
    const { result } = renderHook(() => useGoals({ 
      page: 1, 
      limit: 20, 
      moduleId: 'fitness',
      filter: 'active',
      priority: 'high'
    }), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Assert
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/goals?page=1&limit=20&moduleId=fitness&filter=active&priority=high')
  })

  it('should handle API errors', async () => {
    // Arrange
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Failed to fetch goals'
      })
    })

    // Act
    const { result } = renderHook(() => useGoals({ page: 1, limit: 20 }), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Assert
    expect(result.current.error).toBeTruthy()
    expect(result.current.goals).toEqual([])
  })

  it('should create goals successfully', async () => {
    // Arrange
    const newGoalData = {
      title: 'New Goal',
      description: 'A new goal',
      moduleId: 'fitness',
      difficulty: 'medium',
      priority: 'high'
    }

    const createdGoal = {
      id: 'goal-2',
      ...newGoalData,
      userId: 'user-1',
      isCompleted: false,
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    }

    // Mock initial fetch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
        filters: {}
      })
    })

    // Mock create goal
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: createdGoal,
        message: 'Goal created successfully'
      })
    })

    // Act
    const { result } = renderHook(() => useGoals({ page: 1, limit: 20 }), { wrapper })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Create the goal
    await result.current.createGoal(newGoalData)

    // Assert
    expect(mockFetch).toHaveBeenLastCalledWith('/api/v1/goals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newGoalData)
    })
  })
})