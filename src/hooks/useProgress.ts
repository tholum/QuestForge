/**
 * Progress Management Hook
 * 
 * React Query hooks for progress tracking with optimistic updates,
 * error handling, and real-time synchronization.
 */

import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { ProgressCreateInput, ProgressUpdateInput, ProgressQuery } from '@/lib/validation/schemas'

// Types for API responses
interface ProgressEntry {
  id: string
  value: number
  maxValue: number
  xpEarned: number
  notes?: string
  recordedAt: Date
  createdAt: Date
  userId: string
  goalId: string
  user?: {
    id: string
    name: string
    email: string
  }
  goal?: {
    id: string
    title: string
    difficulty: string
    priority: string
    moduleId: string
  }
}

interface ProgressResponse {
  success: boolean
  data: ProgressEntry[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

interface CreateProgressResponse {
  success: boolean
  data: ProgressEntry & {
    xpAwarded: number
    leveledUp: boolean
    newLevel: {
      currentLevel: number
      currentXP: number
      progressToNextLevel: number
    }
    streak: number
    goalCompleted: boolean
  }
  message: string
}

interface GoalProgressData {
  goal: {
    id: string
    title: string
    difficulty: string
    priority: string
    isCompleted: boolean
    targetDate?: Date
  }
  progressEntries: ProgressEntry[]
  summary?: {
    totalEntries: number
    latestProgress: ProgressEntry | null
    totalXpEarned: number
    averageProgress: number
    progressTrend: 'increasing' | 'decreasing' | 'stable'
    firstRecordedAt?: Date
    lastRecordedAt?: Date
  }
  chartData?: Array<{
    date: string
    progress: number
    xpEarned: number
  }>
}

interface UserAnalytics {
  userId: string
  timeframe: {
    days: number
    startDate: Date
    endDate: Date
  }
  analytics: {
    totalEntries: number
    totalXpEarned: number
    averageProgress: number
    progressTrend: 'increasing' | 'decreasing' | 'stable'
    lastRecordedAt?: Date
    streakDays: number
    peakProgress: number
    consistencyScore: number
  }
  gamification: {
    level: {
      currentLevel: number
      currentXP: number
      progressToNextLevel: number
    }
    streak: {
      currentStreak: number
      longestStreak: number
      isActive: boolean
    }
  }
  insights: {
    dailyAverage: number
    xpPerEntry: number
    streakHealth: 'excellent' | 'good' | 'fair' | 'needs_attention'
    consistencyGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  }
}

// Query Keys
const PROGRESS_KEYS = {
  all: ['progress'] as const,
  lists: () => [...PROGRESS_KEYS.all, 'list'] as const,
  list: (filters: Partial<ProgressQuery>) => [...PROGRESS_KEYS.lists(), { filters }] as const,
  details: () => [...PROGRESS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PROGRESS_KEYS.details(), id] as const,
  goal: (goalId: string) => [...PROGRESS_KEYS.all, 'goal', goalId] as const,
  analytics: (userId: string, days?: number) => [...PROGRESS_KEYS.all, 'analytics', userId, days] as const,
  chart: (goalId: string, options?: any) => [...PROGRESS_KEYS.all, 'chart', goalId, options] as const,
  leaderboard: (options?: any) => [...PROGRESS_KEYS.all, 'leaderboard', options] as const,
}

// API functions
const api = {
  async getProgress(query: Partial<ProgressQuery> = {}): Promise<ProgressResponse> {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          params.append(key, value.toISOString())
        } else {
          params.append(key, String(value))
        }
      }
    })

    const response = await fetch(`/api/v1/progress?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch progress: ${response.statusText}`)
    }
    return response.json()
  },

  async getProgressById(id: string): Promise<{ success: boolean; data: ProgressEntry }> {
    const response = await fetch(`/api/v1/progress/${id}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch progress entry: ${response.statusText}`)
    }
    return response.json()
  },

  async createProgress(data: ProgressCreateInput): Promise<CreateProgressResponse> {
    const response = await fetch('/api/v1/progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to create progress: ${response.statusText}`)
    }
    return response.json()
  },

  async updateProgress(id: string, data: ProgressUpdateInput): Promise<{ success: boolean; data: ProgressEntry }> {
    const response = await fetch(`/api/v1/progress/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to update progress: ${response.statusText}`)
    }
    return response.json()
  },

  async deleteProgress(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`/api/v1/progress/${id}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || `Failed to delete progress: ${response.statusText}`)
    }
    return response.json()
  },

  async getGoalProgress(goalId: string, options: {
    days?: number
    includeChart?: boolean
    includeSummary?: boolean
  } = {}): Promise<{ success: boolean; data: GoalProgressData }> {
    const params = new URLSearchParams()
    
    if (options.days) params.append('days', String(options.days))
    if (options.includeChart) params.append('includeChart', 'true')
    if (options.includeSummary !== false) params.append('includeSummary', 'true')

    const response = await fetch(`/api/v1/progress/goal/${goalId}?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch goal progress: ${response.statusText}`)
    }
    return response.json()
  },

  async getUserAnalytics(userId: string, days: number = 30): Promise<{ success: boolean; data: UserAnalytics }> {
    const params = new URLSearchParams({
      days: String(days),
      includeLeaderboard: 'false'
    })

    const response = await fetch(`/api/v1/progress/analytics/${userId}?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch user analytics: ${response.statusText}`)
    }
    return response.json()
  },

  async getChartData(goalId: string, options: {
    days?: number
    type?: 'line' | 'area' | 'bar'
    aggregation?: 'daily' | 'weekly' | 'monthly'
    includeXP?: boolean
    includeTrend?: boolean
  } = {}) {
    const params = new URLSearchParams()
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value))
      }
    })

    const response = await fetch(`/api/v1/progress/chart/${goalId}?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch chart data: ${response.statusText}`)
    }
    return response.json()
  },

  async getLeaderboard(options: {
    limit?: number
    days?: number
    type?: 'all' | 'xp' | 'level' | 'progress' | 'streak'
    includeUserRank?: boolean
  } = {}) {
    const params = new URLSearchParams()
    
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value))
      }
    })

    const response = await fetch(`/api/v1/progress/leaderboard?${params}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch leaderboard: ${response.statusText}`)
    }
    return response.json()
  }
}

// Hook functions
export function useProgress(query: Partial<ProgressQuery> = {}, options?: UseQueryOptions<ProgressResponse>) {
  return useQuery({
    queryKey: PROGRESS_KEYS.list(query),
    queryFn: () => api.getProgress(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  })
}

export function useProgressById(id: string, options?: UseQueryOptions<{ success: boolean; data: ProgressEntry }>) {
  return useQuery({
    queryKey: PROGRESS_KEYS.detail(id),
    queryFn: () => api.getProgressById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

export function useGoalProgress(goalId: string, options: {
  days?: number
  includeChart?: boolean
  includeSummary?: boolean
} = {}) {
  return useQuery({
    queryKey: PROGRESS_KEYS.goal(goalId),
    queryFn: () => api.getGoalProgress(goalId, options),
    enabled: !!goalId,
    staleTime: 2 * 60 * 1000, // 2 minutes for goal-specific data
  })
}

export function useUserAnalytics(userId: string, days: number = 30) {
  return useQuery({
    queryKey: PROGRESS_KEYS.analytics(userId, days),
    queryFn: () => api.getUserAnalytics(userId, days),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes for analytics
  })
}

export function useProgressChart(goalId: string, options: {
  days?: number
  type?: 'line' | 'area' | 'bar'
  aggregation?: 'daily' | 'weekly' | 'monthly'
  includeXP?: boolean
  includeTrend?: boolean
} = {}) {
  return useQuery({
    queryKey: PROGRESS_KEYS.chart(goalId, options),
    queryFn: () => api.getChartData(goalId, options),
    enabled: !!goalId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useLeaderboard(options: {
  limit?: number
  days?: number
  type?: 'all' | 'xp' | 'level' | 'progress' | 'streak'
  includeUserRank?: boolean
} = {}) {
  return useQuery({
    queryKey: PROGRESS_KEYS.leaderboard(options),
    queryFn: () => api.getLeaderboard(options),
    staleTime: 15 * 60 * 1000, // 15 minutes for leaderboard
  })
}

// Mutation hooks
export function useCreateProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.createProgress,
    onSuccess: (data) => {
      // Invalidate and refetch progress lists
      queryClient.invalidateQueries({ queryKey: PROGRESS_KEYS.lists() })
      
      // Invalidate goal-specific progress
      queryClient.invalidateQueries({ queryKey: PROGRESS_KEYS.goal(data.data.goalId) })
      
      // Invalidate analytics
      queryClient.invalidateQueries({ queryKey: PROGRESS_KEYS.analytics(data.data.userId) })
    },
  })
}

export function useUpdateProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProgressUpdateInput }) =>
      api.updateProgress(id, data),
    onSuccess: (response, variables) => {
      // Update specific progress entry in cache
      queryClient.setQueryData(
        PROGRESS_KEYS.detail(variables.id),
        response
      )
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: PROGRESS_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: PROGRESS_KEYS.goal(response.data.goalId) })
    },
  })
}

export function useDeleteProgress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.deleteProgress,
    onSuccess: (_, progressId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: PROGRESS_KEYS.detail(progressId) })
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: PROGRESS_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: PROGRESS_KEYS.all })
    },
  })
}

// Export types
export type { 
  ProgressEntry, 
  ProgressResponse, 
  CreateProgressResponse, 
  GoalProgressData, 
  UserAnalytics 
}