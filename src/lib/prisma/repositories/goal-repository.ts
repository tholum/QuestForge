/**
 * Goal Repository
 * 
 * Repository for goal-specific database operations with progress tracking
 * and hierarchical goal support.
 */

import { Goal } from '@prisma/client'
import { BaseRepository, Repository, TransactionContext } from '../base-repository'
import {
  GoalCreateSchema,
  GoalUpdateSchema,
  GoalQuerySchema,
  GoalCreateInput,
  GoalUpdateInput,
  GoalQuery
} from '../../validation/schemas'
import { withErrorHandling } from '../error-handler'

/**
 * Extended goal type with relations
 */
export interface GoalWithRelations extends Goal {
  user?: any
  module?: any
  parentGoal?: GoalWithRelations
  subGoals?: GoalWithRelations[]
  progress?: any[]
  _count?: {
    subGoals: number
    progress: number
  }
}

@Repository('goal')
export class GoalRepository extends BaseRepository<
  GoalWithRelations,
  GoalCreateInput,
  GoalUpdateInput,
  GoalQuery
> {
  protected model = 'goal'
  protected createSchema = GoalCreateSchema
  protected updateSchema = GoalUpdateSchema
  protected querySchema = GoalQuerySchema

  /**
   * Build where clause for goal queries
   */
  protected buildWhereClause(query: GoalQuery): any {
    const where: any = {}

    if (query.id) {
      where.id = query.id
    }

    if (query.userId) {
      where.userId = query.userId
    }

    if (query.moduleId) {
      where.moduleId = query.moduleId
    }

    if (query.parentGoalId) {
      where.parentGoalId = query.parentGoalId
    }

    if (query.isCompleted !== undefined) {
      where.isCompleted = query.isCompleted
    }

    if (query.difficulty) {
      where.difficulty = query.difficulty
    }

    if (query.priority) {
      where.priority = query.priority
    }

    if (query.targetDateAfter) {
      where.targetDate = { gte: query.targetDateAfter }
    }

    if (query.targetDateBefore) {
      where.targetDate = { ...where.targetDate, lte: query.targetDateBefore }
    }

    if (query.createdAfter) {
      where.createdAt = { gte: query.createdAfter }
    }

    if (query.createdBefore) {
      where.createdAt = { ...where.createdAt, lte: query.createdBefore }
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } }
      ]
    }

    return where
  }

  /**
   * Build order by clause for goal queries
   */
  protected buildOrderByClause(query: GoalQuery): any {
    return {
      [query.sortBy]: query.sortOrder
    }
  }

  /**
   * Get include options for goal queries
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
        module: {
          select: {
            id: true,
            name: true,
            version: true
          }
        },
        parentGoal: {
          select: {
            id: true,
            title: true,
            isCompleted: true
          }
        },
        subGoals: {
          select: {
            id: true,
            title: true,
            isCompleted: true,
            difficulty: true,
            priority: true,
            createdAt: true
          }
        },
        progress: {
          select: {
            id: true,
            value: true,
            maxValue: true,
            xpEarned: true,
            recordedAt: true
          },
          orderBy: {
            recordedAt: 'desc'
          },
          take: 5 // Latest 5 progress entries
        },
        _count: {
          select: {
            subGoals: true,
            progress: true
          }
        }
      }
    }
  }

  /**
   * Find goals by user with completion status
   */
  async findByUser(userId: string, completed?: boolean): Promise<GoalWithRelations[]> {
    const query: GoalQuery = {
      userId,
      isCompleted: completed,
      limit: 100,
      offset: 0,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }

    return this.findMany(query)
  }

  /**
   * Find goals by module
   */
  async findByModule(moduleId: string, limit = 20): Promise<GoalWithRelations[]> {
    const query: GoalQuery = {
      moduleId,
      limit,
      offset: 0,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }

    return this.findMany(query)
  }

  /**
   * Find root goals (goals without parent)
   */
  async findRootGoals(userId: string): Promise<GoalWithRelations[]> {
    return withErrorHandling(async () => {
      const client = this.prisma

      const results = await client.goal.findMany({
        where: {
          userId,
          parentGoalId: null
        },
        ...this.getIncludeOptions(),
        orderBy: {
          createdAt: 'desc'
        }
      })

      return results.map(result => this.transformResult(result))
    }, 'Finding root goals')
  }

  /**
   * Find sub-goals of a parent goal
   */
  async findSubGoals(parentGoalId: string): Promise<GoalWithRelations[]> {
    const query: GoalQuery = {
      parentGoalId,
      limit: 100,
      offset: 0,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }

    return this.findMany(query)
  }

  /**
   * Get goal hierarchy (goal with all nested sub-goals)
   */
  async getGoalHierarchy(goalId: string): Promise<GoalWithRelations | null> {
    return withErrorHandling(async () => {
      const client = this.prisma

      const result = await client.goal.findUnique({
        where: { id: goalId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          module: {
            select: {
              id: true,
              name: true,
              version: true
            }
          },
          subGoals: {
            include: {
              subGoals: {
                include: {
                  subGoals: true // 3 levels deep
                }
              },
              progress: {
                select: {
                  id: true,
                  value: true,
                  maxValue: true,
                  recordedAt: true
                },
                orderBy: {
                  recordedAt: 'desc'
                },
                take: 1
              }
            }
          },
          progress: {
            select: {
              id: true,
              value: true,
              maxValue: true,
              xpEarned: true,
              recordedAt: true
            },
            orderBy: {
              recordedAt: 'desc'
            }
          }
        }
      })

      return result ? this.transformResult(result) : null
    }, 'Getting goal hierarchy')
  }

  /**
   * Complete a goal and optionally complete sub-goals
   */
  async completeGoal(goalId: string, completeSubGoals = false, context?: TransactionContext): Promise<GoalWithRelations> {
    return withErrorHandling(async () => {
      const client = context?.tx || this.prisma

      // Update the main goal
      const goal = await client.goal.update({
        where: { id: goalId },
        data: { isCompleted: true },
        ...this.getIncludeOptions()
      })

      // Complete sub-goals if requested
      if (completeSubGoals) {
        await this.completeSubGoalsRecursively(goalId, context)
      }

      return this.transformResult(goal)
    }, 'Completing goal')
  }

  /**
   * Recursively complete all sub-goals
   */
  private async completeSubGoalsRecursively(parentGoalId: string, context?: TransactionContext): Promise<void> {
    const client = context?.tx || this.prisma

    const subGoals = await client.goal.findMany({
      where: {
        parentGoalId,
        isCompleted: false
      }
    })

    for (const subGoal of subGoals) {
      await client.goal.update({
        where: { id: subGoal.id },
        data: { isCompleted: true }
      })

      // Recursively complete nested sub-goals
      await this.completeSubGoalsRecursively(subGoal.id, context)
    }
  }

  /**
   * Get goal progress summary
   */
  async getGoalProgress(goalId: string): Promise<{
    goal: GoalWithRelations
    currentProgress: number
    maxProgress: number
    progressPercentage: number
    totalXpEarned: number
    subGoalsProgress: {
      total: number
      completed: number
      completionPercentage: number
    }
  }> {
    return withErrorHandling(async () => {
      const client = this.prisma

      const [goal, latestProgress, totalXp, subGoalsStats] = await Promise.all([
        this.findById(goalId),
        client.progress.findFirst({
          where: { goalId },
          orderBy: { recordedAt: 'desc' }
        }),
        client.progress.aggregate({
          where: { goalId },
          _sum: { xpEarned: true }
        }),
        client.goal.groupBy({
          by: ['isCompleted'],
          where: { parentGoalId: goalId },
          _count: { id: true }
        })
      ])

      if (!goal) {
        throw new Error('Goal not found')
      }

      const currentProgress = latestProgress?.value || 0
      const maxProgress = latestProgress?.maxValue || 100
      const progressPercentage = maxProgress > 0 ? (currentProgress / maxProgress) * 100 : 0
      const totalXpEarned = totalXp._sum.xpEarned || 0

      const totalSubGoals = subGoalsStats.reduce((sum, stat) => sum + stat._count.id, 0)
      const completedSubGoals = subGoalsStats.find(stat => stat.isCompleted)?._count.id || 0
      const subGoalsCompletionPercentage = totalSubGoals > 0 ? (completedSubGoals / totalSubGoals) * 100 : 100

      return {
        goal,
        currentProgress,
        maxProgress,
        progressPercentage,
        totalXpEarned,
        subGoalsProgress: {
          total: totalSubGoals,
          completed: completedSubGoals,
          completionPercentage: subGoalsCompletionPercentage
        }
      }
    }, 'Getting goal progress')
  }

  /**
   * Find overdue goals
   */
  async findOverdueGoals(userId?: string): Promise<GoalWithRelations[]> {
    return withErrorHandling(async () => {
      const client = this.prisma

      const where: any = {
        targetDate: {
          lt: new Date()
        },
        isCompleted: false
      }

      if (userId) {
        where.userId = userId
      }

      const results = await client.goal.findMany({
        where,
        ...this.getIncludeOptions(),
        orderBy: {
          targetDate: 'asc'
        }
      })

      return results.map(result => this.transformResult(result))
    }, 'Finding overdue goals')
  }

  /**
   * Find goals by priority
   */
  async findByPriority(priority: string, userId?: string): Promise<GoalWithRelations[]> {
    const query: GoalQuery = {
      priority: priority as any,
      userId,
      limit: 50,
      offset: 0,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }

    return this.findMany(query)
  }

  /**
   * Get goal statistics for a user
   */
  async getUserGoalStats(userId: string): Promise<{
    total: number
    completed: number
    inProgress: number
    overdue: number
    byDifficulty: Record<string, number>
    byPriority: Record<string, number>
    byModule: Record<string, number>
  }> {
    return withErrorHandling(async () => {
      const client = this.prisma

      const [
        completionStats,
        difficultyStats,
        priorityStats,
        moduleStats,
        overdueCount
      ] = await Promise.all([
        client.goal.groupBy({
          by: ['isCompleted'],
          where: { userId },
          _count: { id: true }
        }),
        client.goal.groupBy({
          by: ['difficulty'],
          where: { userId },
          _count: { id: true }
        }),
        client.goal.groupBy({
          by: ['priority'],
          where: { userId },
          _count: { id: true }
        }),
        client.goal.groupBy({
          by: ['moduleId'],
          where: { userId },
          _count: { id: true }
        }),
        client.goal.count({
          where: {
            userId,
            targetDate: { lt: new Date() },
            isCompleted: false
          }
        })
      ])

      const total = completionStats.reduce((sum, stat) => sum + stat._count.id, 0)
      const completed = completionStats.find(stat => stat.isCompleted)?._count.id || 0
      const inProgress = total - completed

      const byDifficulty: Record<string, number> = {}
      difficultyStats.forEach(stat => {
        byDifficulty[stat.difficulty] = stat._count.id
      })

      const byPriority: Record<string, number> = {}
      priorityStats.forEach(stat => {
        byPriority[stat.priority] = stat._count.id
      })

      const byModule: Record<string, number> = {}
      moduleStats.forEach(stat => {
        byModule[stat.moduleId] = stat._count.id
      })

      return {
        total,
        completed,
        inProgress,
        overdue: overdueCount,
        byDifficulty,
        byPriority,
        byModule
      }
    }, 'Getting user goal statistics')
  }

  private get prisma() {
    return require('../client').prisma.$client
  }
}