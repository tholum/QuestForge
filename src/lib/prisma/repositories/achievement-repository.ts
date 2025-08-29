/**
 * Achievement Repository
 * 
 * Repository for achievement management with progress tracking and unlocking logic.
 */

import { Achievement, UserAchievement } from '@prisma/client'
import { BaseRepository, Repository } from '../base-repository'
import {
  AchievementCreateSchema,
  AchievementUpdateSchema,
  AchievementQuerySchema,
  UserAchievementCreateSchema,
  UserAchievementUpdateSchema,
  UserAchievementQuerySchema,
  AchievementCreateInput,
  AchievementUpdateInput,
  AchievementQuery,
  UserAchievementCreateInput,
  UserAchievementUpdateInput,
  UserAchievementQuery
} from '../../validation/schemas'
import { withErrorHandling } from '../error-handler'

/**
 * Extended achievement type with relations
 */
export interface AchievementWithRelations extends Achievement {
  userAchievements?: UserAchievementWithRelations[]
  _count?: {
    userAchievements: number
  }
}

/**
 * Extended user achievement type with relations
 */
export interface UserAchievementWithRelations extends UserAchievement {
  user?: any
  achievement?: AchievementWithRelations
}

@Repository('achievement')
export class AchievementRepository extends BaseRepository<
  AchievementWithRelations,
  AchievementCreateInput,
  AchievementUpdateInput,
  AchievementQuery
> {
  protected model = 'achievement'
  protected createSchema = AchievementCreateSchema
  protected updateSchema = AchievementUpdateSchema
  protected querySchema = AchievementQuerySchema

  /**
   * Build where clause for achievement queries
   */
  protected buildWhereClause(query: AchievementQuery): any {
    const where: any = {}

    if (query.id) {
      where.id = query.id
    }

    if (query.moduleId) {
      where.moduleId = query.moduleId
    }

    if (query.tier) {
      where.tier = query.tier
    }

    if (query.minXpReward !== undefined) {
      where.xpReward = { gte: query.minXpReward }
    }

    if (query.maxXpReward !== undefined) {
      where.xpReward = { ...where.xpReward, lte: query.maxXpReward }
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } }
      ]
    }

    return where
  }

  /**
   * Build order by clause for achievement queries
   */
  protected buildOrderByClause(query: AchievementQuery): any {
    return {
      [query.sortBy]: query.sortOrder
    }
  }

  /**
   * Get include options for achievement queries
   */
  protected getIncludeOptions(): any {
    return {
      include: {
        _count: {
          select: {
            userAchievements: true
          }
        }
      }
    }
  }

  /**
   * Find achievements by module
   */
  async findByModule(moduleId: string): Promise<AchievementWithRelations[]> {
    const query: AchievementQuery = {
      moduleId,
      limit: 100,
      offset: 0,
      sortBy: 'tier',
      sortOrder: 'asc'
    }

    return this.findMany(query)
  }

  /**
   * Find achievements by tier
   */
  async findByTier(tier: string): Promise<AchievementWithRelations[]> {
    const query: AchievementQuery = {
      tier: tier as any,
      limit: 100,
      offset: 0,
      sortBy: 'xpReward',
      sortOrder: 'asc'
    }

    return this.findMany(query)
  }

  /**
   * Get user achievements
   */
  async getUserAchievements(userId: string, completed?: boolean): Promise<UserAchievementWithRelations[]> {
    return withErrorHandling(async () => {
      const client = this.prisma

      const where: any = { userId }
      if (completed !== undefined) {
        where.isCompleted = completed
      }

      const results = await client.userAchievement.findMany({
        where,
        include: {
          achievement: {
            include: {
              _count: {
                select: {
                  userAchievements: true
                }
              }
            }
          }
        },
        orderBy: {
          unlockedAt: 'desc'
        }
      })

      return results
    }, 'Getting user achievements')
  }

  /**
   * Check if user has achievement
   */
  async userHasAchievement(userId: string, achievementId: string): Promise<UserAchievementWithRelations | null> {
    return withErrorHandling(async () => {
      const client = this.prisma

      return await client.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId
          }
        },
        include: {
          achievement: true
        }
      })
    }, 'Checking if user has achievement')
  }

  /**
   * Award achievement to user
   */
  async awardToUser(userId: string, achievementId: string, progress = 1): Promise<UserAchievementWithRelations> {
    return withErrorHandling(async () => {
      const client = this.prisma

      // Check if achievement exists
      const achievement = await this.findById(achievementId)
      if (!achievement) {
        throw new Error(`Achievement ${achievementId} not found`)
      }

      // Check if user already has this achievement
      const existing = await this.userHasAchievement(userId, achievementId)
      if (existing) {
        if (existing.isCompleted) {
          return existing // Already completed
        }

        // Update progress
        const updatedProgress = Math.min(progress, 1)
        const isCompleted = updatedProgress >= 1

        const updated = await client.userAchievement.update({
          where: {
            userId_achievementId: {
              userId,
              achievementId
            }
          },
          data: {
            progress: updatedProgress,
            isCompleted
          },
          include: {
            achievement: true
          }
        })

        // Award XP if completed
        if (isCompleted && !existing.isCompleted) {
          await this.awardXpForAchievement(userId, achievement.xpReward)
        }

        return updated
      }

      // Create new user achievement
      const isCompleted = progress >= 1
      const userAchievement = await client.userAchievement.create({
        data: {
          userId,
          achievementId,
          progress: Math.min(progress, 1),
          isCompleted
        },
        include: {
          achievement: true
        }
      })

      // Award XP if completed
      if (isCompleted) {
        await this.awardXpForAchievement(userId, achievement.xpReward)
      }

      return userAchievement
    }, 'Awarding achievement to user')
  }

  /**
   * Update achievement progress
   */
  async updateUserAchievementProgress(
    userId: string, 
    achievementId: string, 
    progress: number
  ): Promise<UserAchievementWithRelations> {
    return withErrorHandling(async () => {
      const client = this.prisma

      const existing = await this.userHasAchievement(userId, achievementId)
      if (!existing) {
        throw new Error(`User ${userId} does not have achievement ${achievementId}`)
      }

      if (existing.isCompleted) {
        return existing // Already completed
      }

      const updatedProgress = Math.min(progress, 1)
      const isCompleted = updatedProgress >= 1

      const updated = await client.userAchievement.update({
        where: {
          userId_achievementId: {
            userId,
            achievementId
          }
        },
        data: {
          progress: updatedProgress,
          isCompleted
        },
        include: {
          achievement: true
        }
      })

      // Award XP if completed
      if (isCompleted && !existing.isCompleted) {
        await this.awardXpForAchievement(userId, existing.achievement!.xpReward)
      }

      return updated
    }, 'Updating user achievement progress')
  }

  /**
   * Check and award achievements for user actions
   */
  async checkAndAwardAchievements(userId: string, actionType: string, actionData: any): Promise<UserAchievementWithRelations[]> {
    return withErrorHandling(async () => {
      const client = this.prisma

      // Get all achievements that could potentially be awarded
      const achievements = await client.achievement.findMany({
        where: {
          OR: [
            { moduleId: null }, // Global achievements
            { moduleId: actionData.moduleId } // Module-specific achievements
          ]
        }
      })

      const awardedAchievements: UserAchievementWithRelations[] = []

      for (const achievement of achievements) {
        const conditions = achievement.conditions as any
        
        if (conditions.type === actionType) {
          const progress = await this.calculateAchievementProgress(userId, achievement, actionData)
          
          if (progress > 0) {
            const awarded = await this.awardToUser(userId, achievement.id, progress)
            if (awarded.isCompleted) {
              awardedAchievements.push(awarded)
            }
          }
        }
      }

      return awardedAchievements
    }, 'Checking and awarding achievements')
  }

  /**
   * Calculate achievement progress based on user data
   */
  private async calculateAchievementProgress(
    userId: string, 
    achievement: Achievement, 
    actionData: any
  ): Promise<number> {
    const conditions = achievement.conditions as any
    const client = this.prisma

    switch (conditions.type) {
      case 'goal_created':
        const goalCount = await client.goal.count({ where: { userId } })
        return goalCount >= conditions.count ? 1 : goalCount / conditions.count

      case 'goals_completed':
        const completedGoalCount = await client.goal.count({ where: { userId, isCompleted: true } })
        return completedGoalCount >= conditions.count ? 1 : completedGoalCount / conditions.count

      case 'streak':
        const user = await client.user.findUnique({ where: { id: userId }, select: { streakCount: true } })
        const streakCount = user?.streakCount || 0
        return streakCount >= conditions.days ? 1 : streakCount / conditions.days

      case 'module_goals_completed':
        const moduleCompletedCount = await client.goal.count({
          where: { 
            userId, 
            moduleId: conditions.module,
            isCompleted: true 
          }
        })
        return moduleCompletedCount >= conditions.count ? 1 : moduleCompletedCount / conditions.count

      case 'xp_earned':
        const userXp = await client.user.findUnique({ where: { id: userId }, select: { totalXp: true } })
        const totalXp = userXp?.totalXp || 0
        return totalXp >= conditions.xpAmount ? 1 : totalXp / conditions.xpAmount

      default:
        return 0
    }
  }

  /**
   * Award XP for achievement completion
   */
  private async awardXpForAchievement(userId: string, xpReward: number): Promise<void> {
    if (xpReward <= 0) return

    const client = this.prisma
    
    // Update user's total XP
    await client.user.update({
      where: { id: userId },
      data: {
        totalXp: { increment: xpReward },
        lastActivity: new Date()
      }
    })
  }

  /**
   * Get achievement leaderboard
   */
  async getLeaderboard(limit = 10): Promise<{
    userId: string
    userName: string | null
    achievementCount: number
    totalXpFromAchievements: number
    latestAchievementAt?: Date
  }[]> {
    return withErrorHandling(async () => {
      const client = this.prisma

      const results = await client.userAchievement.groupBy({
        by: ['userId'],
        where: {
          isCompleted: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        },
        take: limit
      })

      // Get user names and XP data
      const userIds = results.map(r => r.userId)
      const [users, xpData, latestAchievements] = await Promise.all([
        client.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true }
        }),
        client.userAchievement.findMany({
          where: {
            userId: { in: userIds },
            isCompleted: true
          },
          include: {
            achievement: {
              select: { xpReward: true }
            }
          }
        }),
        client.userAchievement.groupBy({
          by: ['userId'],
          where: {
            userId: { in: userIds },
            isCompleted: true
          },
          _max: {
            unlockedAt: true
          }
        })
      ])

      const userMap = new Map(users.map(u => [u.id, u.name]))
      const latestMap = new Map(latestAchievements.map(la => [la.userId, la._max.unlockedAt]))
      
      // Calculate total XP from achievements for each user
      const xpMap = new Map<string, number>()
      xpData.forEach(ua => {
        const currentXp = xpMap.get(ua.userId) || 0
        xpMap.set(ua.userId, currentXp + ua.achievement.xpReward)
      })

      return results.map(result => ({
        userId: result.userId,
        userName: userMap.get(result.userId) || null,
        achievementCount: result._count.id,
        totalXpFromAchievements: xpMap.get(result.userId) || 0,
        latestAchievementAt: latestMap.get(result.userId)
      }))
    }, 'Getting achievement leaderboard')
  }

  /**
   * Get achievement statistics
   */
  async getAchievementStats(): Promise<{
    totalAchievements: number
    totalUserAchievements: number
    completionRate: number
    byTier: Record<string, number>
    byModule: Record<string, number>
    topAchievements: Array<{
      achievement: AchievementWithRelations
      completionCount: number
      completionRate: number
    }>
  }> {
    return withErrorHandling(async () => {
      const client = this.prisma

      const [
        totalAchievements,
        totalUserAchievements,
        completedUserAchievements,
        tierStats,
        moduleStats,
        topAchievements
      ] = await Promise.all([
        client.achievement.count(),
        client.userAchievement.count(),
        client.userAchievement.count({ where: { isCompleted: true } }),
        client.achievement.groupBy({
          by: ['tier'],
          _count: { id: true }
        }),
        client.achievement.groupBy({
          by: ['moduleId'],
          _count: { id: true }
        }),
        client.achievement.findMany({
          include: {
            _count: {
              select: {
                userAchievements: {
                  where: { isCompleted: true }
                }
              }
            }
          },
          take: 10
        })
      ])

      const completionRate = totalUserAchievements > 0 
        ? (completedUserAchievements / totalUserAchievements) * 100 
        : 0

      const byTier: Record<string, number> = {}
      tierStats.forEach(stat => {
        byTier[stat.tier] = stat._count.id
      })

      const byModule: Record<string, number> = {}
      moduleStats.forEach(stat => {
        byModule[stat.moduleId || 'global'] = stat._count.id
      })

      const topAchievementsWithStats = topAchievements.map(achievement => ({
        achievement,
        completionCount: achievement._count.userAchievements,
        completionRate: totalUserAchievements > 0 
          ? (achievement._count.userAchievements / totalUserAchievements) * 100 
          : 0
      })).sort((a, b) => b.completionCount - a.completionCount)

      return {
        totalAchievements,
        totalUserAchievements,
        completionRate,
        byTier,
        byModule,
        topAchievements: topAchievementsWithStats.slice(0, 10)
      }
    }, 'Getting achievement statistics')
  }

  private get prisma() {
    return require('../client').prisma.$client
  }
}