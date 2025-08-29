/**
 * useAchievements Hook
 * 
 * Custom hook for achievements management with TanStack Query integration.
 * Provides achievement data, progress tracking, and unlocking functionality.
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'

/**
 * Achievement data types
 */
type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  tier: AchievementTier
  moduleId: string | null
  conditions: any
  xpReward: number
  createdAt: Date
}

interface UserAchievementProgress {
  progress: number
  isCompleted: boolean
  unlockedAt: Date | null
}

interface AchievementWithProgress extends Achievement {
  userProgress: UserAchievementProgress
}

interface AchievementSummary {
  total: number
  completed: number
  completionRate: number
  totalXpFromAchievements: number
}

/**
 * API Response interfaces
 */
interface AchievementsResponse {
  success: boolean
  data: {
    achievements: AchievementWithProgress[]
    summary: AchievementSummary
  }
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  message: string
}

interface AchievementCheckResponse {
  success: boolean
  data: any
  message: string
}

interface AchievementCheckAllResponse {
  success: boolean
  data: {
    checkedCount: number
    newlyCompleted: number
    achievements: any[]
  }
  message: string
}

/**
 * Hook options
 */
interface UseAchievementsOptions {
  moduleId?: string
  tier?: AchievementTier
  completed?: boolean
  page?: number
  limit?: number
  enabled?: boolean
  refetchInterval?: number
}

/**
 * API service functions
 */
const achievementsAPI = {
  /**
   * Fetch achievements with progress
   */
  async fetchAchievements(options: UseAchievementsOptions = {}): Promise<AchievementsResponse> {
    const params = new URLSearchParams()
    
    if (options.moduleId) params.set('moduleId', options.moduleId)
    if (options.tier) params.set('tier', options.tier)
    if (options.completed !== undefined) params.set('completed', String(options.completed))
    if (options.page) params.set('page', options.page.toString())
    if (options.limit) params.set('limit', options.limit.toString())

    const response = await fetch(`/api/v1/achievements?${params}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch achievements')
    }
    
    return response.json()
  },

  /**
   * Check specific achievement progress
   */
  async checkAchievement(achievementId: string): Promise<AchievementCheckResponse> {
    const response = await fetch('/api/v1/achievements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'check', achievementId }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to check achievement')
    }
    
    return response.json()
  },

  /**
   * Check all achievements progress
   */
  async checkAllAchievements(): Promise<AchievementCheckAllResponse> {
    const response = await fetch('/api/v1/achievements', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'check_all' }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to check achievements')
    }
    
    return response.json()
  }
}

/**
 * Generate query key for caching
 */
const generateQueryKey = (options: UseAchievementsOptions) => {
  return ['achievements', options]
}

/**
 * Main useAchievements hook
 */
export function useAchievements(options: UseAchievementsOptions = {}) {
  const queryClient = useQueryClient()
  
  // Query for fetching achievements
  const achievementsQuery = useQuery({
    queryKey: generateQueryKey(options),
    queryFn: () => achievementsAPI.fetchAchievements(options),
    placeholderData: keepPreviousData,
    enabled: options.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes (achievements change more frequently)
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchInterval: options.refetchInterval,
  })

  // Check single achievement mutation
  const checkAchievementMutation = useMutation({
    mutationFn: achievementsAPI.checkAchievement,
    onSuccess: (data, achievementId) => {
      // Update the achievement in the cache
      queryClient.setQueryData(generateQueryKey(options), (old: AchievementsResponse | undefined) => {
        if (!old) return old
        
        return {
          ...old,
          data: {
            ...old.data,
            achievements: old.data.achievements.map(achievement => 
              achievement.id === achievementId
                ? { 
                    ...achievement, 
                    userProgress: {
                      progress: data.data.progress,
                      isCompleted: data.data.isCompleted,
                      unlockedAt: data.data.unlockedAt
                    }
                  }
                : achievement
            )
          }
        }
      })
      
      // If achievement was completed, invalidate to get updated summary
      if (data.data.isCompleted) {
        queryClient.invalidateQueries({ queryKey: ['achievements'] })
      }
    },
    onError: (error) => {
      console.error('Failed to check achievement:', error)
    }
  })

  // Check all achievements mutation
  const checkAllAchievementsMutation = useMutation({
    mutationFn: achievementsAPI.checkAllAchievements,
    onSuccess: () => {
      // Invalidate all achievement queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['achievements'] })
    },
    onError: (error) => {
      console.error('Failed to check all achievements:', error)
    }
  })

  // Helper functions
  const refetch = () => {
    return achievementsQuery.refetch()
  }

  const checkAchievement = (achievementId: string) => {
    return checkAchievementMutation.mutateAsync(achievementId)
  }

  const checkAllAchievements = () => {
    return checkAllAchievementsMutation.mutateAsync()
  }

  // Data access helpers
  const getAchievements = () => {
    return achievementsQuery.data?.data?.achievements || []
  }

  const getSummary = () => {
    return achievementsQuery.data?.data?.summary || {
      total: 0,
      completed: 0,
      completionRate: 0,
      totalXpFromAchievements: 0
    }
  }

  const getCompletedAchievements = () => {
    return getAchievements().filter(achievement => achievement.userProgress.isCompleted)
  }

  const getPendingAchievements = () => {
    return getAchievements().filter(achievement => 
      !achievement.userProgress.isCompleted && achievement.userProgress.progress > 0
    )
  }

  const getAchievementsByTier = (tier: AchievementTier) => {
    return getAchievements().filter(achievement => achievement.tier === tier)
  }

  const getAchievementsByModule = (moduleId: string) => {
    return getAchievements().filter(achievement => achievement.moduleId === moduleId)
  }

  const getRecentlyUnlocked = (days = 7) => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return getCompletedAchievements().filter(achievement => {
      const unlockedAt = achievement.userProgress.unlockedAt
      return unlockedAt && new Date(unlockedAt) >= cutoffDate
    })
  }

  const getNextAchievements = (limit = 3) => {
    return getPendingAchievements()
      .sort((a, b) => b.userProgress.progress - a.userProgress.progress)
      .slice(0, limit)
  }

  const getTierProgress = () => {
    const achievements = getAchievements()
    const tiers: AchievementTier[] = ['bronze', 'silver', 'gold', 'platinum']
    
    return tiers.map(tier => {
      const tierAchievements = achievements.filter(a => a.tier === tier)
      const completed = tierAchievements.filter(a => a.userProgress.isCompleted).length
      
      return {
        tier,
        total: tierAchievements.length,
        completed,
        completionRate: tierAchievements.length > 0 
          ? Math.round((completed / tierAchievements.length) * 100) 
          : 0
      }
    })
  }

  const getCompletionStreak = () => {
    const completedAchievements = getCompletedAchievements()
      .sort((a, b) => {
        const dateA = a.userProgress.unlockedAt ? new Date(a.userProgress.unlockedAt) : new Date(0)
        const dateB = b.userProgress.unlockedAt ? new Date(b.userProgress.unlockedAt) : new Date(0)
        return dateB.getTime() - dateA.getTime()
      })
    
    let streak = 0
    let lastDate: Date | null = null
    
    for (const achievement of completedAchievements) {
      if (!achievement.userProgress.unlockedAt) break
      
      const unlockedDate = new Date(achievement.userProgress.unlockedAt)
      
      if (!lastDate) {
        streak = 1
        lastDate = unlockedDate
      } else {
        const daysDiff = Math.floor((lastDate.getTime() - unlockedDate.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff <= 7) { // Within a week
          streak++
          lastDate = unlockedDate
        } else {
          break
        }
      }
    }
    
    return streak
  }

  // Achievement notification helpers
  const getUnreadAchievements = () => {
    // This would require a "read" status in the database, but for now
    // we'll consider achievements unlocked in the last day as "unread"
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    return getCompletedAchievements().filter(achievement => {
      const unlockedAt = achievement.userProgress.unlockedAt
      return unlockedAt && new Date(unlockedAt) >= yesterday
    })
  }

  const getTotalXpFromAchievements = () => {
    return getCompletedAchievements().reduce((total, achievement) => {
      return total + achievement.xpReward
    }, 0)
  }

  return {
    // Data
    achievements: getAchievements(),
    summary: getSummary(),
    loading: achievementsQuery.isLoading,
    error: achievementsQuery.error,
    pagination: achievementsQuery.data?.pagination,
    
    // Mutation states
    isChecking: checkAchievementMutation.isPending,
    isCheckingAll: checkAllAchievementsMutation.isPending,
    
    // Methods
    refetch,
    checkAchievement,
    checkAllAchievements,
    
    // Data helpers
    getCompletedAchievements,
    getPendingAchievements,
    getAchievementsByTier,
    getAchievementsByModule,
    getRecentlyUnlocked,
    getNextAchievements,
    getTierProgress,
    getCompletionStreak,
    getUnreadAchievements,
    getTotalXpFromAchievements,
    
    // Raw queries for advanced usage
    achievementsQuery,
    checkAchievementMutation,
    checkAllAchievementsMutation
  }
}

/**
 * Hook for completed achievements only
 */
export function useCompletedAchievements(options: Omit<UseAchievementsOptions, 'completed'> = {}) {
  return useAchievements({ ...options, completed: true })
}

/**
 * Hook for pending achievements only
 */
export function usePendingAchievements(options: Omit<UseAchievementsOptions, 'completed'> = {}) {
  return useAchievements({ ...options, completed: false })
}

/**
 * Hook for module-specific achievements
 */
export function useModuleAchievements(moduleId: string, enabled = true) {
  return useAchievements({ moduleId, enabled })
}

/**
 * Hook for tier-specific achievements
 */
export function useTierAchievements(tier: AchievementTier, enabled = true) {
  return useAchievements({ tier, enabled })
}

/**
 * Export types for use in components
 */
export type { 
  Achievement,
  AchievementTier,
  AchievementWithProgress,
  UserAchievementProgress,
  AchievementSummary,
  UseAchievementsOptions 
}