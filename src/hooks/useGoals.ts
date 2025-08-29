/**
 * useGoals Hook
 * 
 * Custom hook for goal data management with TanStack Query integration.
 * Provides comprehensive CRUD operations, caching, optimistic updates,
 * and error handling for goals.
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { GoalWithRelations } from '@/lib/prisma/repositories/goal-repository'
import { GoalCreateInput, GoalUpdateInput } from '@/lib/validation/schemas'

/**
 * Hook options interface
 */
interface UseGoalsOptions {
  userId?: string
  moduleId?: string
  page?: number
  limit?: number
  filter?: 'all' | 'active' | 'completed'
  search?: string
  priority?: string
  difficulty?: string
  sort?: string
  order?: 'asc' | 'desc'
  targetDateAfter?: string
  targetDateBefore?: string
  enabled?: boolean
}

/**
 * Pagination information
 */
interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Filter state
 */
interface FilterState {
  moduleId?: string
  search?: string
  filter?: 'all' | 'active' | 'completed'
  priority?: string
  difficulty?: string
  sort?: string
  order?: 'asc' | 'desc'
}

/**
 * API Response interfaces
 */
interface GoalsResponse {
  success: boolean
  data: GoalWithRelations[]
  pagination: PaginationInfo
  filters: FilterState
}

interface GoalResponse {
  success: boolean
  data: GoalWithRelations
  message?: string
}

interface BulkOperationResponse {
  success: boolean
  data: {
    action: string
    processed: number
    successful: number
    failed: number
    results: any[]
    errors: any[]
  }
  message: string
}

/**
 * API service functions
 */
const goalsAPI = {
  /**
   * Fetch goals with filters and pagination
   */
  async fetchGoals(options: UseGoalsOptions = {}): Promise<GoalsResponse> {
    const params = new URLSearchParams()
    
    if (options.page) params.set('page', options.page.toString())
    if (options.limit) params.set('limit', options.limit.toString())
    if (options.moduleId) params.set('moduleId', options.moduleId)
    if (options.search) params.set('search', options.search)
    if (options.filter && options.filter !== 'all') params.set('filter', options.filter)
    if (options.priority) params.set('priority', options.priority)
    if (options.difficulty) params.set('difficulty', options.difficulty)
    if (options.sort) params.set('sort', options.sort)
    if (options.order) params.set('order', options.order)
    if (options.targetDateAfter) params.set('targetDateAfter', options.targetDateAfter)
    if (options.targetDateBefore) params.set('targetDateBefore', options.targetDateBefore)

    const response = await fetch(`/api/v1/goals?${params}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch goals')
    }
    
    return response.json()
  },

  /**
   * Fetch single goal by ID
   */
  async fetchGoal(id: string): Promise<GoalResponse> {
    const response = await fetch(`/api/v1/goals/${id}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch goal')
    }
    
    return response.json()
  },

  /**
   * Create new goal
   */
  async createGoal(data: GoalCreateInput): Promise<GoalResponse> {
    const response = await fetch('/api/v1/goals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create goal')
    }
    
    return response.json()
  },

  /**
   * Update goal
   */
  async updateGoal(id: string, data: GoalUpdateInput): Promise<GoalResponse> {
    const response = await fetch(`/api/v1/goals/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update goal')
    }
    
    return response.json()
  },

  /**
   * Delete goal
   */
  async deleteGoal(id: string, options: { cascade?: boolean; hard?: boolean } = {}): Promise<{ success: boolean }> {
    const params = new URLSearchParams()
    if (options.cascade) params.set('cascade', 'true')
    if (options.hard) params.set('hard', 'true')

    const response = await fetch(`/api/v1/goals/${id}?${params}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete goal')
    }
    
    return response.json()
  },

  /**
   * Bulk operations on goals
   */
  async bulkOperation(
    action: 'bulk-update-status' | 'bulk-delete' | 'bulk-archive' | 'bulk-complete',
    goalIds: string[],
    data?: any
  ): Promise<BulkOperationResponse> {
    const response = await fetch('/api/v1/goals/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, goalIds, data }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to execute bulk operation')
    }
    
    return response.json()
  }
}

/**
 * Generate query key for caching
 */
const generateQueryKey = (options: UseGoalsOptions) => {
  return ['goals', options]
}

/**
 * Main useGoals hook
 */
export function useGoals(options: UseGoalsOptions = {}) {
  const queryClient = useQueryClient()
  
  // Query for fetching goals
  const goalsQuery = useQuery({
    queryKey: generateQueryKey(options),
    queryFn: () => goalsAPI.fetchGoals(options),
    placeholderData: keepPreviousData,
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: goalsAPI.createGoal,
    onSuccess: (data) => {
      // Invalidate goals queries to refetch
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      
      // Add new goal to cache optimistically
      const queryKey = generateQueryKey(options)
      queryClient.setQueryData(queryKey, (old: GoalsResponse | undefined) => {
        if (!old) return old
        return {
          ...old,
          data: [data.data, ...old.data],
          pagination: {
            ...old.pagination,
            total: old.pagination.total + 1
          }
        }
      })
    },
    onError: (error) => {
      console.error('Failed to create goal:', error)
    }
  })

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: GoalUpdateInput }) => 
      goalsAPI.updateGoal(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['goals'] })
      
      // Snapshot previous value
      const previousGoals = queryClient.getQueryData(generateQueryKey(options))
      
      // Optimistically update cache
      queryClient.setQueryData(generateQueryKey(options), (old: GoalsResponse | undefined) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map(goal => 
            goal.id === id ? { ...goal, ...data, updatedAt: new Date() } : goal
          )
        }
      })
      
      return { previousGoals }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousGoals) {
        queryClient.setQueryData(generateQueryKey(options), context.previousGoals)
      }
      console.error('Failed to update goal:', error)
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    }
  })

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: ({ id, options: deleteOptions }: { 
      id: string; 
      options?: { cascade?: boolean; hard?: boolean } 
    }) => goalsAPI.deleteGoal(id, deleteOptions),
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] })
      
      const previousGoals = queryClient.getQueryData(generateQueryKey(options))
      
      // Optimistically remove goal
      queryClient.setQueryData(generateQueryKey(options), (old: GoalsResponse | undefined) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.filter(goal => goal.id !== id),
          pagination: {
            ...old.pagination,
            total: old.pagination.total - 1
          }
        }
      })
      
      return { previousGoals }
    },
    onError: (error, variables, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(generateQueryKey(options), context.previousGoals)
      }
      console.error('Failed to delete goal:', error)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    }
  })

  // Bulk operation mutation
  const bulkOperationMutation = useMutation({
    mutationFn: ({ action, goalIds, data }: {
      action: 'bulk-update-status' | 'bulk-delete' | 'bulk-archive' | 'bulk-complete'
      goalIds: string[]
      data?: any
    }) => goalsAPI.bulkOperation(action, goalIds, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
    },
    onError: (error) => {
      console.error('Failed to execute bulk operation:', error)
    }
  })

  // Helper functions
  const updateFilters = (newFilters: Partial<UseGoalsOptions>) => {
    // This would be handled by the parent component updating the options
    // The hook will automatically refetch when options change
  }

  const refetch = () => {
    return goalsQuery.refetch()
  }

  const createGoal = (data: GoalCreateInput) => {
    return createGoalMutation.mutateAsync(data)
  }

  const updateGoal = (id: string, data: GoalUpdateInput) => {
    return updateGoalMutation.mutateAsync({ id, data })
  }

  const deleteGoal = (id: string, deleteOptions?: { cascade?: boolean; hard?: boolean }) => {
    return deleteGoalMutation.mutateAsync({ id, options: deleteOptions })
  }

  const bulkUpdateGoals = (goalIds: string[], data: Partial<GoalUpdateInput>) => {
    return bulkOperationMutation.mutateAsync({ 
      action: 'bulk-update-status', 
      goalIds, 
      data 
    })
  }

  return {
    // Data
    goals: goalsQuery.data?.data || [],
    loading: goalsQuery.isLoading,
    error: goalsQuery.error,
    pagination: goalsQuery.data?.pagination || {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false
    },
    filters: goalsQuery.data?.filters || {},
    
    // Mutation states
    isCreating: createGoalMutation.isPending,
    isUpdating: updateGoalMutation.isPending,
    isDeleting: deleteGoalMutation.isPending,
    isBulkOperating: bulkOperationMutation.isPending,
    
    // Methods
    updateFilters,
    refetch,
    createGoal,
    updateGoal,
    deleteGoal,
    bulkUpdateGoals,
    
    // Raw queries for advanced usage
    goalsQuery,
    createGoalMutation,
    updateGoalMutation,
    deleteGoalMutation,
    bulkOperationMutation
  }
}

/**
 * Hook for fetching a single goal
 */
export function useGoal(id: string, enabled = true) {
  return useQuery({
    queryKey: ['goal', id],
    queryFn: () => goalsAPI.fetchGoal(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,
    retry: 3
  })
}

/**
 * Export types for use in components
 */
export type { UseGoalsOptions, PaginationInfo, FilterState, GoalWithRelations }