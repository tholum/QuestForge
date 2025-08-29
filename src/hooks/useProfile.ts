/**
 * useProfile Hook
 * 
 * Custom hook for user profile management with TanStack Query integration.
 * Provides profile data, statistics, and update operations.
 */

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Profile data types
 */
interface UserProfile {
  id: string
  email: string
  name: string | null
  bio: string | null
  profilePicture: string | null
  timezone: string
  locale: string
  onboardingCompleted: boolean
  emailVerified: boolean
  lastLoginAt: Date | null
  lastActiveAt: Date | null
  createdAt: Date
  updatedAt: Date
  preferences: any
}

interface UserStats {
  goals: {
    total: number
    completed: number
    active: number
    completionRate: number
  }
  activity: {
    totalProgressEntries: number
    totalXpEarned: number
    currentStreak: number
    lastActive: Date | null
    daysSinceJoined: number
  }
  gamification: {
    currentLevel: number
    totalXp: number
    achievementCount: number
    streakCount: number
  }
  moduleUsage: Array<{
    moduleId: string
    moduleName: string
    goalCount: number
  }>
  recentActivity: Array<{
    id: string
    value: number
    maxValue: number
    xpEarned: number
    recordedAt: Date
    goal: {
      title: string
      module: string
    }
  }>
}

/**
 * Profile update data
 */
interface ProfileUpdateInput {
  name?: string
  bio?: string
  profilePicture?: string
  timezone?: string
  locale?: string
  preferences?: Record<string, any>
}

/**
 * API Response interfaces
 */
interface ProfileResponse {
  success: boolean
  data: {
    profile: UserProfile
    stats: UserStats
  }
  message: string
}

interface ProfileUpdateResponse {
  success: boolean
  data: UserProfile
  message: string
}

interface ProfileActionResponse {
  success: boolean
  data: any
  message: string
}

/**
 * Hook options
 */
interface UseProfileOptions {
  includeStats?: boolean
  enabled?: boolean
  refetchInterval?: number
}

/**
 * API service functions
 */
const profileAPI = {
  /**
   * Fetch user profile with stats
   */
  async fetchProfile(): Promise<ProfileResponse> {
    const response = await fetch('/api/v1/users/profile')
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch profile')
    }
    
    return response.json()
  },

  /**
   * Update user profile
   */
  async updateProfile(data: ProfileUpdateInput): Promise<ProfileUpdateResponse> {
    const response = await fetch('/api/v1/users/profile', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update profile')
    }
    
    return response.json()
  },

  /**
   * Complete onboarding
   */
  async completeOnboarding(): Promise<ProfileActionResponse> {
    const response = await fetch('/api/v1/users/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'complete_onboarding' }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to complete onboarding')
    }
    
    return response.json()
  },

  /**
   * Update last active timestamp
   */
  async updateLastActive(): Promise<ProfileActionResponse> {
    const response = await fetch('/api/v1/users/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'update_last_active' }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update last active')
    }
    
    return response.json()
  }
}

/**
 * Generate query key for caching
 */
const generateQueryKey = (options: UseProfileOptions) => {
  return ['profile', options]
}

/**
 * Main useProfile hook
 */
export function useProfile(options: UseProfileOptions = {}) {
  const queryClient = useQueryClient()
  
  // Query for fetching profile
  const profileQuery = useQuery({
    queryKey: generateQueryKey(options),
    queryFn: profileAPI.fetchProfile,
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchInterval: options.refetchInterval,
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: profileAPI.updateProfile,
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['profile'] })
      
      // Snapshot previous value
      const previousProfile = queryClient.getQueryData(generateQueryKey(options))
      
      // Optimistically update cache
      queryClient.setQueryData(generateQueryKey(options), (old: ProfileResponse | undefined) => {
        if (!old) return old
        return {
          ...old,
          data: {
            ...old.data,
            profile: {
              ...old.data.profile,
              ...newData,
              updatedAt: new Date()
            }
          }
        }
      })
      
      return { previousProfile }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(generateQueryKey(options), context.previousProfile)
      }
      console.error('Failed to update profile:', error)
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    }
  })

  // Complete onboarding mutation
  const completeOnboardingMutation = useMutation({
    mutationFn: profileAPI.completeOnboarding,
    onSuccess: () => {
      // Update the profile query cache
      queryClient.setQueryData(generateQueryKey(options), (old: ProfileResponse | undefined) => {
        if (!old) return old
        return {
          ...old,
          data: {
            ...old.data,
            profile: {
              ...old.data.profile,
              onboardingCompleted: true,
              updatedAt: new Date()
            }
          }
        }
      })
    },
    onError: (error) => {
      console.error('Failed to complete onboarding:', error)
    }
  })

  // Update last active mutation
  const updateLastActiveMutation = useMutation({
    mutationFn: profileAPI.updateLastActive,
    onSuccess: () => {
      // Update the profile query cache
      queryClient.setQueryData(generateQueryKey(options), (old: ProfileResponse | undefined) => {
        if (!old) return old
        return {
          ...old,
          data: {
            ...old.data,
            profile: {
              ...old.data.profile,
              lastActiveAt: new Date()
            }
          }
        }
      })
    },
    onError: (error) => {
      console.error('Failed to update last active:', error)
    }
  })

  // Helper functions
  const refetch = () => {
    return profileQuery.refetch()
  }

  const updateProfile = (data: ProfileUpdateInput) => {
    return updateProfileMutation.mutateAsync(data)
  }

  const completeOnboarding = () => {
    return completeOnboardingMutation.mutateAsync()
  }

  const updateLastActive = () => {
    return updateLastActiveMutation.mutateAsync()
  }

  // Data access helpers
  const getProfile = () => {
    return profileQuery.data?.data?.profile
  }

  const getStats = () => {
    return profileQuery.data?.data?.stats
  }

  const isOnboardingComplete = () => {
    return profileQuery.data?.data?.profile?.onboardingCompleted ?? false
  }

  const getProfileCompleteness = () => {
    const profile = getProfile()
    if (!profile) return 0
    
    let completeness = 0
    const fields = [
      profile.name,
      profile.bio,
      profile.profilePicture,
      profile.emailVerified,
      profile.onboardingCompleted
    ]
    
    completeness = fields.filter(Boolean).length / fields.length * 100
    return Math.round(completeness)
  }

  const getLevelProgress = () => {
    const stats = getStats()
    if (!stats) return { progress: 0, nextLevel: 2, xpToNext: 0 }
    
    const currentLevel = stats.gamification.currentLevel
    const currentXp = stats.gamification.totalXp
    
    // Simple level progression (this could be made more sophisticated)
    const xpPerLevel = 1000
    const nextLevel = currentLevel + 1
    const xpForCurrentLevel = (currentLevel - 1) * xpPerLevel
    const xpForNextLevel = currentLevel * xpPerLevel
    const xpInCurrentLevel = currentXp - xpForCurrentLevel
    const xpToNext = xpForNextLevel - currentXp
    const progress = (xpInCurrentLevel / xpPerLevel) * 100
    
    return {
      progress: Math.min(Math.max(progress, 0), 100),
      nextLevel,
      xpToNext: Math.max(xpToNext, 0)
    }
  }

  const getTopModule = () => {
    const stats = getStats()
    if (!stats || !stats.moduleUsage.length) return null
    
    return stats.moduleUsage.reduce((top, current) => {
      return current.goalCount > top.goalCount ? current : top
    })
  }

  const getActivitySummary = () => {
    const stats = getStats()
    if (!stats) return null
    
    const { activity } = stats
    return {
      streak: activity.currentStreak,
      totalProgress: activity.totalProgressEntries,
      totalXp: activity.totalXpEarned,
      daysSinceJoined: activity.daysSinceJoined,
      lastActive: activity.lastActive
    }
  }

  // Preference management
  const getPreference = (key: string, defaultValue?: any) => {
    const profile = getProfile()
    return profile?.preferences?.[key] ?? defaultValue
  }

  const updatePreference = (key: string, value: any) => {
    const profile = getProfile()
    if (!profile) return Promise.reject(new Error('Profile not loaded'))
    
    const updatedPreferences = {
      ...profile.preferences,
      [key]: value
    }
    
    return updateProfile({ preferences: updatedPreferences })
  }

  return {
    // Data
    profile: getProfile(),
    stats: getStats(),
    loading: profileQuery.isLoading,
    error: profileQuery.error,
    
    // Mutation states
    isUpdating: updateProfileMutation.isPending,
    isCompletingOnboarding: completeOnboardingMutation.isPending,
    isUpdatingLastActive: updateLastActiveMutation.isPending,
    
    // Methods
    refetch,
    updateProfile,
    completeOnboarding,
    updateLastActive,
    
    // Data helpers
    isOnboardingComplete,
    getProfileCompleteness,
    getLevelProgress,
    getTopModule,
    getActivitySummary,
    
    // Preferences
    getPreference,
    updatePreference,
    
    // Raw queries for advanced usage
    profileQuery,
    updateProfileMutation,
    completeOnboardingMutation,
    updateLastActiveMutation
  }
}

/**
 * Hook for just profile data (without stats)
 */
export function useBasicProfile(enabled = true) {
  return useProfile({ includeStats: false, enabled })
}

/**
 * Hook that automatically updates last active on mount
 */
export function useActiveProfile(options: UseProfileOptions = {}) {
  const profile = useProfile(options)
  
  // Update last active when hook is first used
  React.useEffect(() => {
    if (profile.profile && !profile.isUpdatingLastActive) {
      profile.updateLastActive()
    }
  }, [profile.profile?.id])
  
  return profile
}

/**
 * Export types for use in components
 */
export type { 
  UserProfile, 
  UserStats, 
  ProfileUpdateInput, 
  UseProfileOptions 
}