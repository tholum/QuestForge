/**
 * Progress Repository
 * 
 * Repository for progress tracking with analytics and reporting capabilities.
 */

import { Progress } from '@prisma/client'
import { BaseRepository, Repository } from '../base-repository'
import {
  ProgressCreateSchema,
  ProgressUpdateSchema,
  ProgressQuerySchema,
  ProgressCreateInput,
  ProgressUpdateInput,
  ProgressQuery
} from '../../validation/schemas'
import { withErrorHandling } from '../error-handler'

/**
 * Extended progress type with relations
 */
export interface ProgressWithRelations extends Progress {
  user?: any
  goal?: any
}

/**
 * Progress analytics data
 */
export interface ProgressAnalytics {
  totalEntries: number
  totalXpEarned: number
  averageProgress: number
  progressTrend: 'increasing' | 'decreasing' | 'stable'
  lastRecordedAt?: Date
  streakDays: number
  peakProgress: number
  consistencyScore: number // 0-100
}

@Repository('progress')
export class ProgressRepository extends BaseRepository<
  ProgressWithRelations,
  ProgressCreateInput,
  ProgressUpdateInput,
  ProgressQuery
> {
  protected model = 'progress'
  protected createSchema = ProgressCreateSchema
  protected updateSchema = ProgressUpdateSchema
  protected querySchema = ProgressQuerySchema

  /**
   * Build where clause for progress queries
   */
  protected buildWhereClause(query: ProgressQuery): any {
    const where: any = {}

    if (query.id) {
      where.id = query.id
    }

    if (query.userId) {
      where.userId = query.userId
    }

    if (query.goalId) {
      where.goalId = query.goalId
    }

    if (query.recordedAfter) {
      where.recordedAt = { gte: query.recordedAfter }
    }

    if (query.recordedBefore) {
      where.recordedAt = { ...where.recordedAt, lte: query.recordedBefore }
    }

    if (query.minValue !== undefined) {
      where.value = { gte: query.minValue }
    }

    if (query.maxValue !== undefined) {
      where.value = { ...where.value, lte: query.maxValue }
    }

    if (query.minXp !== undefined) {
      where.xpEarned = { gte: query.minXp }
    }

    return where
  }

  /**
   * Build order by clause for progress queries
   */
  protected buildOrderByClause(query: ProgressQuery): any {
    return {
      [query.sortBy]: query.sortOrder
    }
  }

  /**
   * Get include options for progress queries
   */
  protected getIncludeOptions(): any {
    return {
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        goal: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            priority: true,
            moduleId: true
          }
        }
      }
    }
  }

  /**
   * Find progress entries for a specific goal
   */
  async findByGoal(goalId: string, limit = 50): Promise<ProgressWithRelations[]> {
    const query: ProgressQuery = {
      goalId,
      limit,
      offset: 0,
      sortBy: 'recordedAt',
      sortOrder: 'desc'
    }

    return this.findMany(query)
  }

  /**
   * Find progress entries for a user
   */
  async findByUser(userId: string, limit = 50): Promise<ProgressWithRelations[]> {
    const query: ProgressQuery = {
      userId,
      limit,
      offset: 0,
      sortBy: 'recordedAt',
      sortOrder: 'desc'
    }

    return this.findMany(query)
  }

  /**
   * Get latest progress for a goal
   */
  async getLatestProgressForGoal(goalId: string): Promise<ProgressWithRelations | null> {
    return withErrorHandling(async () => {
      const client = this.prisma

      const result = await client.progress.findFirst({
        where: { goalId },
        orderBy: { recordedAt: 'desc' },
        ...this.getIncludeOptions()
      })

      return result ? this.transformResult(result) : null
    }, 'Getting latest progress for goal')
  }

  /**
   * Get progress summary for a goal
   */
  async getGoalProgressSummary(goalId: string): Promise<{
    totalEntries: number
    latestProgress: ProgressWithRelations | null
    totalXpEarned: number
    averageProgress: number
    progressTrend: 'increasing' | 'decreasing' | 'stable'
    firstRecordedAt?: Date
    lastRecordedAt?: Date
  }> {
    return withErrorHandling(async () => {
      const client = this.prisma

      const [
        totalEntries,
        latestProgress,
        aggregateData,
        firstProgress,
        recentTrendData
      ] = await Promise.all([
        client.progress.count({ where: { goalId } }),
        this.getLatestProgressForGoal(goalId),
        client.progress.aggregate({
          where: { goalId },
          _sum: { xpEarned: true },
          _avg: { value: true }
        }),
        client.progress.findFirst({
          where: { goalId },
          orderBy: { recordedAt: 'asc' }
        }),
        client.progress.findMany({
          where: { goalId },
          orderBy: { recordedAt: 'desc' },
          take: 5,
          select: { value: true, recordedAt: true }
        })
      ])

      const totalXpEarned = aggregateData._sum.xpEarned || 0
      const averageProgress = aggregateData._avg.value || 0

      // Calculate trend
      let progressTrend: 'increasing' | 'decreasing' | 'stable' = 'stable'
      if (recentTrendData.length >= 2) {
        const recentValues = recentTrendData.slice(0, 3).map(p => p.value)
        const olderValues = recentTrendData.slice(-3).map(p => p.value)
        
        const recentAvg = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length
        const olderAvg = olderValues.reduce((sum, val) => sum + val, 0) / olderValues.length
        
        if (recentAvg > olderAvg * 1.05) progressTrend = 'increasing'
        else if (recentAvg < olderAvg * 0.95) progressTrend = 'decreasing'
      }

      return {
        totalEntries,
        latestProgress,
        totalXpEarned,
        averageProgress,
        progressTrend,
        firstRecordedAt: firstProgress?.recordedAt,
        lastRecordedAt: latestProgress?.recordedAt
      }
    }, 'Getting goal progress summary')
  }

  /**
   * Get user progress analytics
   */
  async getUserProgressAnalytics(userId: string, days = 30): Promise<ProgressAnalytics> {
    return withErrorHandling(async () => {
      const client = this.prisma
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const [
        totalEntries,
        aggregateData,
        recentEntries,
        dailyProgress
      ] = await Promise.all([
        client.progress.count({
          where: {
            userId,
            recordedAt: { gte: startDate }
          }
        }),
        client.progress.aggregate({
          where: {
            userId,
            recordedAt: { gte: startDate }
          },
          _sum: { xpEarned: true },
          _avg: { value: true },
          _max: { value: true }
        }),
        client.progress.findMany({
          where: {
            userId,
            recordedAt: { gte: startDate }
          },
          orderBy: { recordedAt: 'desc' },
          take: 10,
          select: { value: true, recordedAt: true }
        }),
        client.progress.groupBy({
          by: ['recordedAt'],
          where: {
            userId,
            recordedAt: { gte: startDate }
          },
          _count: { id: true }
        })
      ])

      const totalXpEarned = aggregateData._sum.xpEarned || 0
      const averageProgress = aggregateData._avg.value || 0
      const peakProgress = aggregateData._max.value || 0

      // Calculate trend
      let progressTrend: 'increasing' | 'decreasing' | 'stable' = 'stable'
      if (recentEntries.length >= 5) {
        const recent = recentEntries.slice(0, Math.floor(recentEntries.length / 2))
        const older = recentEntries.slice(Math.floor(recentEntries.length / 2))
        
        const recentAvg = recent.reduce((sum, entry) => sum + entry.value, 0) / recent.length
        const olderAvg = older.reduce((sum, entry) => sum + entry.value, 0) / older.length
        
        if (recentAvg > olderAvg * 1.05) progressTrend = 'increasing'
        else if (recentAvg < olderAvg * 0.95) progressTrend = 'decreasing'
      }

      // Calculate streak days
      const streakDays = this.calculateStreakDays(dailyProgress)

      // Calculate consistency score (0-100)
      const consistencyScore = this.calculateConsistencyScore(dailyProgress, days)

      return {
        totalEntries,
        totalXpEarned,
        averageProgress,
        progressTrend,
        lastRecordedAt: recentEntries[0]?.recordedAt,
        streakDays,
        peakProgress,
        consistencyScore
      }
    }, 'Getting user progress analytics')
  }

  /**
   * Get progress chart data
   */
  async getProgressChartData(goalId: string, days = 30): Promise<{
    date: string
    progress: number
    xpEarned: number
  }[]> {
    return withErrorHandling(async () => {
      const client = this.prisma
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const progressEntries = await client.progress.findMany({
        where: {
          goalId,
          recordedAt: { gte: startDate }
        },
        orderBy: { recordedAt: 'asc' },
        select: {
          value: true,
          xpEarned: true,
          recordedAt: true
        }
      })

      // Group by date
      const chartData = new Map<string, { progress: number; xpEarned: number }>()
      
      progressEntries.forEach(entry => {
        const dateKey = entry.recordedAt.toISOString().split('T')[0]
        const existing = chartData.get(dateKey) || { progress: 0, xpEarned: 0 }
        
        chartData.set(dateKey, {
          progress: Math.max(existing.progress, entry.value), // Use highest progress for the day
          xpEarned: existing.xpEarned + entry.xpEarned
        })
      })

      // Convert to array and fill missing dates
      const result = []
      for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - (days - 1 - i))
        const dateKey = date.toISOString().split('T')[0]
        
        const data = chartData.get(dateKey) || { progress: 0, xpEarned: 0 }
        result.push({
          date: dateKey,
          progress: data.progress,
          xpEarned: data.xpEarned
        })
      }

      return result
    }, 'Getting progress chart data')
  }

  /**
   * Get top performers (users with most progress/XP)
   */
  async getTopPerformers(limit = 10, days = 30): Promise<{
    userId: string
    userName: string | null
    totalXp: number
    totalProgress: number
    entriesCount: number
  }[]> {
    return withErrorHandling(async () => {
      const client = this.prisma
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const results = await client.progress.groupBy({
        by: ['userId'],
        where: {
          recordedAt: { gte: startDate }
        },
        _sum: {
          xpEarned: true,
          value: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _sum: {
            xpEarned: 'desc'
          }
        },
        take: limit
      })

      // Get user names
      const userIds = results.map(r => r.userId)
      const users = await client.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true }
      })

      const userMap = new Map(users.map(u => [u.id, u.name]))

      return results.map(result => ({
        userId: result.userId,
        userName: userMap.get(result.userId) || null,
        totalXp: result._sum.xpEarned || 0,
        totalProgress: result._sum.value || 0,
        entriesCount: result._count.id
      }))
    }, 'Getting top performers')
  }

  /**
   * Calculate streak days from daily progress data
   */
  private calculateStreakDays(dailyProgress: any[]): number {
    if (dailyProgress.length === 0) return 0

    // Sort by date (most recent first)
    const sortedDays = dailyProgress
      .map(dp => dp.recordedAt.toISOString().split('T')[0])
      .sort((a, b) => b.localeCompare(a))

    let streakDays = 0
    const today = new Date().toISOString().split('T')[0]
    let currentDate = today

    // Check for consecutive days working backwards from today
    for (let i = 0; i < sortedDays.length; i++) {
      if (sortedDays[i] === currentDate) {
        streakDays++
        // Move to previous day
        const date = new Date(currentDate)
        date.setDate(date.getDate() - 1)
        currentDate = date.toISOString().split('T')[0]
      } else {
        break
      }
    }

    return streakDays
  }

  /**
   * Calculate consistency score (0-100)
   */
  private calculateConsistencyScore(dailyProgress: any[], totalDays: number): number {
    if (totalDays === 0) return 0

    const activeDays = new Set(
      dailyProgress.map(dp => dp.recordedAt.toISOString().split('T')[0])
    ).size

    return Math.round((activeDays / totalDays) * 100)
  }

  private get prisma() {
    return require('../client').prisma.$client
  }
}