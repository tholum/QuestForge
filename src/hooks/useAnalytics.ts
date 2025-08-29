/**
 * useAnalytics Hook
 * 
 * Custom hook for analytics data management with TanStack Query integration.
 * Provides analytics data with caching, filtering, and performance optimization.
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'

/**
 * Analytics data types
 */
type AnalyticsPeriod = 'week' | 'month' | 'quarter' | 'year' | 'custom'

interface AnalyticsSummary {
  totalGoals: number
  completedGoals: number
  completionRate: number
  totalProgressEntries: number
  totalXpEarned: number
  currentStreak: number
  currentLevel: number
  totalXp: number
  achievementsUnlocked: number
}

interface AnalyticsTrends {
  goalsTrend: number
  completionTrend: number
}

interface ModuleBreakdown {
  moduleId: string
  moduleName: string
  totalGoals: number
  completedGoals: number
  progressEntries: number
  xpEarned: number
}

interface TimelineDataPoint {
  date: string
  progressEntries: number
  xpEarned: number
  completedGoals: number
}

interface AnalyticsData {
  period: AnalyticsPeriod
  dateRange: {
    start: Date
    end: Date
  }
  summary: AnalyticsSummary
  trends: AnalyticsTrends
  moduleBreakdown: ModuleBreakdown[]
  timeline: TimelineDataPoint[]
  generatedAt: Date
}

/**
 * API Response interfaces
 */
interface AnalyticsResponse {
  success: boolean
  data: AnalyticsData
  cached: boolean
  message: string
}

/**
 * Hook options
 */
interface UseAnalyticsOptions {
  period?: AnalyticsPeriod
  moduleId?: string
  startDate?: string
  endDate?: string
  includeCache?: boolean
  enabled?: boolean
  refetchInterval?: number
}

/**
 * API service functions
 */
const analyticsAPI = {
  /**
   * Fetch analytics data
   */
  async fetchAnalytics(options: UseAnalyticsOptions = {}): Promise<AnalyticsResponse> {
    const params = new URLSearchParams()
    
    if (options.period) params.set('period', options.period)
    if (options.moduleId) params.set('moduleId', options.moduleId)
    if (options.startDate) params.set('startDate', options.startDate)
    if (options.endDate) params.set('endDate', options.endDate)
    if (options.includeCache !== undefined) params.set('includeCache', String(options.includeCache))

    const response = await fetch(`/api/v1/analytics?${params}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch analytics')
    }
    
    return response.json()
  }
}

/**
 * Generate query key for caching
 */
const generateQueryKey = (options: UseAnalyticsOptions) => {
  return ['analytics', options]
}

/**
 * Main useAnalytics hook
 */
export function useAnalytics(options: UseAnalyticsOptions = {}) {
  const queryClient = useQueryClient()
  
  // Query for fetching analytics
  const analyticsQuery = useQuery({
    queryKey: generateQueryKey(options),
    queryFn: () => analyticsAPI.fetchAnalytics(options),
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes (analytics can be slightly stale)
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchInterval: options.refetchInterval,
  })

  // Helper functions
  const refetch = () => {
    return analyticsQuery.refetch()
  }

  const invalidateCache = () => {
    // Force fresh data by disabling cache
    const freshOptions = { ...options, includeCache: false }
    return queryClient.invalidateQueries({ 
      queryKey: generateQueryKey(freshOptions) 
    })
  }

  // Data processing helpers
  const getCompletionPercentage = () => {
    const data = analyticsQuery.data?.data
    return data?.summary?.completionRate || 0
  }

  const getXpGrowth = () => {
    const data = analyticsQuery.data?.data
    return data?.summary?.totalXpEarned || 0
  }

  const getTopPerformingModule = () => {
    const data = analyticsQuery.data?.data
    const modules = data?.moduleBreakdown || []
    return modules.reduce((top, current) => {
      if (!top || current.xpEarned > top.xpEarned) {
        return current
      }
      return top
    }, null as ModuleBreakdown | null)
  }

  const getActivityTrend = () => {
    const data = analyticsQuery.data?.data
    const timeline = data?.timeline || []
    
    if (timeline.length < 2) return 0
    
    const recent = timeline.slice(-7) // Last 7 days
    const previous = timeline.slice(-14, -7) // Previous 7 days
    
    const recentAvg = recent.reduce((sum, day) => sum + day.progressEntries, 0) / recent.length
    const previousAvg = previous.reduce((sum, day) => sum + day.progressEntries, 0) / previous.length
    
    if (previousAvg === 0) return 100
    return ((recentAvg - previousAvg) / previousAvg) * 100
  }

  const getStreakStatus = () => {
    const data = analyticsQuery.data?.data
    const currentStreak = data?.summary?.currentStreak || 0
    
    let status = 'inactive'
    let message = 'No current streak'
    
    if (currentStreak > 0) {
      if (currentStreak < 7) {
        status = 'building'
        message = `${currentStreak} day streak`
      } else if (currentStreak < 30) {
        status = 'strong'
        message = `${currentStreak} day streak - Keep it up!`
      } else {
        status = 'legendary'
        message = `${currentStreak} day streak - Amazing!`
      }
    }
    
    return { status, message, days: currentStreak }
  }

  // Chart data preparation
  const getTimelineChartData = () => {
    const data = analyticsQuery.data?.data
    return data?.timeline?.map(point => ({
      date: point.date,
      progress: point.progressEntries,
      xp: point.xpEarned,
      completed: point.completedGoals,
      // Format date for display
      displayDate: new Date(point.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })
    })) || []
  }

  const getModuleChartData = () => {
    const data = analyticsQuery.data?.data
    return data?.moduleBreakdown?.map(module => ({
      name: module.moduleName,
      goals: module.totalGoals,
      completed: module.completedGoals,
      xp: module.xpEarned,
      completionRate: module.totalGoals > 0 
        ? Math.round((module.completedGoals / module.totalGoals) * 100) 
        : 0
    })) || []
  }

  // Export data helpers
  const exportToCsv = () => {
    const data = analyticsQuery.data?.data
    if (!data) return
    
    const timeline = data.timeline
    const csvData = [
      ['Date', 'Progress Entries', 'XP Earned', 'Goals Completed'],
      ...timeline.map(point => [
        point.date,
        point.progressEntries.toString(),
        point.xpEarned.toString(),
        point.completedGoals.toString()
      ])
    ]
    
    const csvContent = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics-${data.period}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportToJson = () => {
    const data = analyticsQuery.data?.data
    if (!data) return
    
    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `analytics-${data.period}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return {
    // Data
    data: analyticsQuery.data?.data,
    loading: analyticsQuery.isLoading,
    error: analyticsQuery.error,
    cached: analyticsQuery.data?.cached || false,
    
    // Summary data
    summary: analyticsQuery.data?.data?.summary,
    trends: analyticsQuery.data?.data?.trends,
    moduleBreakdown: analyticsQuery.data?.data?.moduleBreakdown || [],
    timeline: analyticsQuery.data?.data?.timeline || [],
    
    // Methods
    refetch,
    invalidateCache,
    
    // Calculated metrics
    getCompletionPercentage,
    getXpGrowth,
    getTopPerformingModule,
    getActivityTrend,
    getStreakStatus,
    
    // Chart data
    getTimelineChartData,
    getModuleChartData,
    
    // Export functions
    exportToCsv,
    exportToJson,
    
    // Raw query for advanced usage
    analyticsQuery
  }
}

/**
 * Hook for specific period analytics
 */
export function usePeriodAnalytics(
  period: AnalyticsPeriod, 
  moduleId?: string, 
  enabled = true
) {
  return useAnalytics({ period, moduleId, enabled })
}

/**
 * Hook for custom date range analytics
 */
export function useCustomAnalytics(
  startDate: string, 
  endDate: string, 
  moduleId?: string, 
  enabled = true
) {
  return useAnalytics({ 
    period: 'custom', 
    startDate, 
    endDate, 
    moduleId, 
    enabled 
  })
}

/**
 * Export types for use in components
 */
export type { 
  AnalyticsPeriod, 
  AnalyticsData, 
  AnalyticsSummary, 
  ModuleBreakdown, 
  TimelineDataPoint,
  UseAnalyticsOptions 
}