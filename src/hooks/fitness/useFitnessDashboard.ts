/**
 * Fitness Dashboard React Query Hooks
 * 
 * Custom hooks for fetching fitness dashboard data using React Query.
 * Handles loading states, error handling, and data caching.
 */

import { useQuery } from '@tanstack/react-query'
import { fitnessApi } from '@/lib/api/fitness'

/**
 * Hook to fetch fitness dashboard data
 */
export function useFitnessDashboard(userId: string) {
  return useQuery({
    queryKey: ['fitness', 'dashboard', userId],
    queryFn: () => fitnessApi.getDashboardData(userId),
    enabled: !!userId, // Only run query if userId exists
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
    gcTime: 5 * 60 * 1000, // Keep data in cache for 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on authentication or client errors
      if (error instanceof Error && 
          (error.message.includes('Authentication') || 
           error.message.includes('400') ||
           error.message.includes('403') ||
           error.message.includes('404'))) {
        return false
      }
      return failureCount < 3
    },
    meta: {
      errorMessage: 'Failed to load fitness dashboard data'
    }
  })
}

/**
 * Hook to fetch fitness analytics data
 */
export function useFitnessAnalytics(userId: string, period: string = 'week') {
  return useQuery({
    queryKey: ['fitness', 'analytics', userId, period],
    queryFn: () => fitnessApi.getAnalytics(userId, period),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Analytics can be a bit more stale
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error instanceof Error && 
          (error.message.includes('Authentication') || 
           error.message.includes('400') ||
           error.message.includes('403') ||
           error.message.includes('404'))) {
        return false
      }
      return failureCount < 3
    },
    meta: {
      errorMessage: 'Failed to load fitness analytics data'
    }
  })
}

/**
 * Types for the dashboard data based on the repository structure
 */
export interface FitnessDashboardData {
  activeWorkoutPlans: any[]
  recentWorkouts: {
    id: string
    name: string
    description?: string
    scheduledDate: string
    completedAt?: string
    actualDuration?: number
    workoutType: string
    plan?: {
      name: string
    }
    exercises: {
      exercise: {
        name: string
        category: string
      }
    }[]
  }[]
  weeklyStats: {
    totalWorkouts: number
    totalDuration: number
  }
  personalRecords: any[]
  exerciseCategories: any[]
  upcomingWorkouts: any[]
  stats: {
    totalActivePlans: number
    weeklyWorkouts: number
    weeklyDuration: number
    recentPRCount: number
  }
}

/**
 * Helper function to format duration in minutes to readable format
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

/**
 * Helper function to format date for display
 */
export function formatWorkoutDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    return 'Today'
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

/**
 * Helper function to calculate estimated calories (rough estimate)
 */
export function estimateCalories(duration: number, workoutType: string): number {
  const baseCaloriesPerMinute: Record<string, number> = {
    cardio: 12,
    strength: 8,
    flexibility: 4,
    mixed: 10
  }
  
  const rate = baseCaloriesPerMinute[workoutType] || 8
  return Math.round(duration * rate)
}