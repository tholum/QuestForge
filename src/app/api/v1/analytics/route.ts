/**
 * Analytics API Routes
 * 
 * Provides analytics data with caching for performance optimization.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth, withMethodValidation, AuthenticatedRequest } from '@/lib/auth/middleware'
import { withErrorHandling } from '@/lib/prisma/error-handler'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { startOfWeek, startOfMonth, startOfQuarter, startOfYear, endOfWeek, endOfMonth, endOfQuarter, endOfYear, subDays, subWeeks, subMonths, subYears } from 'date-fns'

const prisma = new PrismaClient()

// Validation schema for analytics query
const AnalyticsQuerySchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year', 'custom']).optional().default('month'),
  moduleId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  includeCache: z.boolean().optional().default(true)
})

/**
 * Generate cache key for analytics data
 */
function generateCacheKey(userId: string, params: any): string {
  const { period, moduleId, startDate, endDate } = params
  const parts = ['analytics', userId, period]
  
  if (moduleId) parts.push(`module_${moduleId}`)
  if (startDate) parts.push(`start_${startDate}`)
  if (endDate) parts.push(`end_${endDate}`)
  
  return parts.join('_')
}

/**
 * Get date ranges based on period
 */
function getDateRange(period: string, customStart?: string, customEnd?: string) {
  const now = new Date()
  
  switch (period) {
    case 'week':
      return {
        start: startOfWeek(now),
        end: endOfWeek(now),
        previousStart: startOfWeek(subWeeks(now, 1)),
        previousEnd: endOfWeek(subWeeks(now, 1))
      }
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        previousStart: startOfMonth(subMonths(now, 1)),
        previousEnd: endOfMonth(subMonths(now, 1))
      }
    case 'quarter':
      return {
        start: startOfQuarter(now),
        end: endOfQuarter(now),
        previousStart: startOfQuarter(subMonths(now, 3)),
        previousEnd: endOfQuarter(subMonths(now, 3))
      }
    case 'year':
      return {
        start: startOfYear(now),
        end: endOfYear(now),
        previousStart: startOfYear(subYears(now, 1)),
        previousEnd: endOfYear(subYears(now, 1))
      }
    case 'custom':
      const start = customStart ? new Date(customStart) : subDays(now, 30)
      const end = customEnd ? new Date(customEnd) : now
      const daysDiff = Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      
      return {
        start,
        end,
        previousStart: new Date(start.getTime() - daysDiff * 24 * 60 * 60 * 1000),
        previousEnd: start
      }
    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        previousStart: startOfMonth(subMonths(now, 1)),
        previousEnd: endOfMonth(subMonths(now, 1))
      }
  }
}

/**
 * Generate analytics data
 */
async function generateAnalyticsData(userId: string, params: any) {
  const { period, moduleId, startDate, endDate } = params
  const dateRange = getDateRange(period, startDate, endDate)
  
  // Build base query conditions
  const baseWhere: any = {
    userId,
    createdAt: {
      gte: dateRange.start,
      lte: dateRange.end
    }
  }
  
  const previousWhere: any = {
    userId,
    createdAt: {
      gte: dateRange.previousStart,
      lte: dateRange.previousEnd
    }
  }
  
  if (moduleId) {
    baseWhere.goal = { moduleId }
    previousWhere.goal = { moduleId }
  }
  
  // Get current period data
  const [
    currentGoals,
    currentProgress,
    currentCompletedGoals,
    currentAchievements,
    previousGoals,
    previousCompletedGoals,
    totalXpCurrent,
    streakData
  ] = await Promise.all([
    // Current goals
    prisma.goal.findMany({
      where: {
        userId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end
        },
        ...(moduleId && { moduleId })
      },
      include: {
        progress: {
          where: {
            recordedAt: {
              gte: dateRange.start,
              lte: dateRange.end
            }
          }
        },
        module: true
      }
    }),
    
    // Current progress entries
    prisma.progress.findMany({
      where: baseWhere,
      include: {
        goal: {
          include: {
            module: true
          }
        }
      }
    }),
    
    // Completed goals in current period
    prisma.goal.count({
      where: {
        userId,
        isCompleted: true,
        updatedAt: {
          gte: dateRange.start,
          lte: dateRange.end
        },
        ...(moduleId && { moduleId })
      }
    }),
    
    // Achievements unlocked in current period
    prisma.userAchievement.count({
      where: {
        userId,
        unlockedAt: {
          gte: dateRange.start,
          lte: dateRange.end
        }
      }
    }),
    
    // Previous period goals for comparison
    prisma.goal.count({
      where: {
        userId,
        createdAt: {
          gte: dateRange.previousStart,
          lte: dateRange.previousEnd
        },
        ...(moduleId && { moduleId })
      }
    }),
    
    // Previous period completed goals
    prisma.goal.count({
      where: {
        userId,
        isCompleted: true,
        updatedAt: {
          gte: dateRange.previousStart,
          lte: dateRange.previousEnd
        },
        ...(moduleId && { moduleId })
      }
    }),
    
    // Total XP earned in current period
    prisma.progress.aggregate({
      where: baseWhere,
      _sum: {
        xpEarned: true
      }
    }),
    
    // User streak data
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        streakCount: true,
        totalXp: true,
        currentLevel: true,
        lastActivity: true
      }
    })
  ])
  
  // Calculate metrics
  const totalGoals = currentGoals.length
  const completedGoals = currentCompletedGoals
  const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0
  const totalXpEarned = totalXpCurrent._sum.xpEarned || 0
  const totalProgressEntries = currentProgress.length
  
  // Calculate trends (comparison with previous period)
  const goalsTrend = previousGoals > 0 ? ((totalGoals - previousGoals) / previousGoals) * 100 : 0
  const completionTrend = previousCompletedGoals > 0 
    ? ((completedGoals - previousCompletedGoals) / previousCompletedGoals) * 100 
    : 0
  
  // Group data by module
  const moduleBreakdown = currentGoals.reduce((acc, goal) => {
    const moduleId = goal.moduleId
    const moduleName = goal.module.name
    
    if (!acc[moduleId]) {
      acc[moduleId] = {
        moduleId,
        moduleName,
        totalGoals: 0,
        completedGoals: 0,
        progressEntries: 0,
        xpEarned: 0
      }
    }
    
    acc[moduleId].totalGoals += 1
    if (goal.isCompleted) acc[moduleId].completedGoals += 1
    acc[moduleId].progressEntries += goal.progress.length
    acc[moduleId].xpEarned += goal.progress.reduce((sum, p) => sum + p.xpEarned, 0)
    
    return acc
  }, {} as Record<string, any>)
  
  // Prepare timeline data (daily breakdown for charts)
  const timelineData = []
  const currentDate = new Date(dateRange.start)
  
  while (currentDate <= dateRange.end) {
    const dayStart = new Date(currentDate)
    const dayEnd = new Date(currentDate)
    dayEnd.setHours(23, 59, 59, 999)
    
    const dayProgress = currentProgress.filter(p => 
      p.recordedAt >= dayStart && p.recordedAt <= dayEnd
    )
    
    const dayCompletedGoals = currentGoals.filter(g => 
      g.isCompleted && g.updatedAt >= dayStart && g.updatedAt <= dayEnd
    ).length
    
    timelineData.push({
      date: currentDate.toISOString().split('T')[0],
      progressEntries: dayProgress.length,
      xpEarned: dayProgress.reduce((sum, p) => sum + p.xpEarned, 0),
      completedGoals: dayCompletedGoals
    })
    
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return {
    period,
    dateRange: {
      start: dateRange.start,
      end: dateRange.end
    },
    summary: {
      totalGoals,
      completedGoals,
      completionRate: Math.round(completionRate * 100) / 100,
      totalProgressEntries,
      totalXpEarned,
      currentStreak: streakData?.streakCount || 0,
      currentLevel: streakData?.currentLevel || 1,
      totalXp: streakData?.totalXp || 0,
      achievementsUnlocked: currentAchievements
    },
    trends: {
      goalsTrend: Math.round(goalsTrend * 100) / 100,
      completionTrend: Math.round(completionTrend * 100) / 100
    },
    moduleBreakdown: Object.values(moduleBreakdown),
    timeline: timelineData,
    generatedAt: new Date()
  }
}

/**
 * Check cache for analytics data
 */
async function getCachedAnalytics(userId: string, cacheKey: string) {
  const cached = await prisma.analyticsCache.findUnique({
    where: {
      userId_cacheKey: {
        userId,
        cacheKey
      }
    }
  })
  
  if (cached && cached.expiresAt > new Date()) {
    try {
      return JSON.parse(cached.data)
    } catch (error) {
      // If parsing fails, return null to regenerate
      return null
    }
  }
  
  return null
}

/**
 * Cache analytics data
 */
async function cacheAnalytics(userId: string, cacheKey: string, data: any, ttlHours = 1) {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + ttlHours)
  
  await prisma.analyticsCache.upsert({
    where: {
      userId_cacheKey: {
        userId,
        cacheKey
      }
    },
    update: {
      data: JSON.stringify(data),
      expiresAt
    },
    create: {
      userId,
      cacheKey,
      data: JSON.stringify(data),
      expiresAt
    }
  })
}

/**
 * GET /api/v1/analytics
 * Generate analytics with caching
 */
async function handleGet(request: AuthenticatedRequest): Promise<NextResponse> {
  return withErrorHandling(async () => {
    const url = new URL(request.url)
    
    // Parse query parameters
    const queryParams = {
      period: url.searchParams.get('period') || 'month',
      moduleId: url.searchParams.get('moduleId') || undefined,
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      includeCache: url.searchParams.get('includeCache') !== 'false'
    }
    
    // Validate query parameters
    const validatedQuery = AnalyticsQuerySchema.parse(queryParams)
    
    // Generate cache key
    const cacheKey = generateCacheKey(request.user.id, validatedQuery)
    
    // Try to get cached data if caching is enabled
    let analyticsData = null
    if (validatedQuery.includeCache) {
      analyticsData = await getCachedAnalytics(request.user.id, cacheKey)
    }
    
    // Generate fresh data if no cache or caching disabled
    if (!analyticsData) {
      analyticsData = await generateAnalyticsData(request.user.id, validatedQuery)
      
      // Cache the data for future requests
      if (validatedQuery.includeCache) {
        await cacheAnalytics(request.user.id, cacheKey, analyticsData)
      }
    }
    
    return NextResponse.json({
      success: true,
      data: analyticsData,
      cached: !!analyticsData && validatedQuery.includeCache,
      message: 'Analytics data retrieved successfully'
    })
  }, 'Generating analytics data')
}

/**
 * Main route handlers
 */
export async function GET(request: NextRequest) {
  const methodCheck = withMethodValidation(request, ['GET'])
  if (methodCheck) return methodCheck
  
  return withAuth(request, handleGet)
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}