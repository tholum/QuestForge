/**
 * User Repository
 * 
 * Repository for user-specific database operations with authentication
 * and profile management functionality.
 */

import { User } from '@prisma/client'
import { BaseRepository, Repository } from '../base-repository'
import {
  UserCreateSchema,
  UserUpdateSchema,
  UserQuerySchema,
  UserCreateInput,
  UserUpdateInput,
  UserQuery
} from '../../validation/schemas'
import { withErrorHandling } from '../error-handler'
import { hashPassword } from '../../auth/password'

/**
 * Extended user type with relations
 */
export interface UserWithRelations extends User {
  goals?: any[]
  progress?: any[]
  userAchievements?: any[]
  _count?: {
    goals: number
    progress: number
    userAchievements: number
  }
}

@Repository('user')
export class UserRepository extends BaseRepository<
  UserWithRelations,
  UserCreateInput,
  UserUpdateInput,
  UserQuery
> {
  protected model = 'user'
  protected createSchema = UserCreateSchema
  protected updateSchema = UserUpdateSchema
  protected querySchema = UserQuerySchema

  /**
   * Build where clause for user queries
   */
  protected buildWhereClause(query: UserQuery): any {
    const where: any = {}

    if (query.id) {
      where.id = query.id
    }

    if (query.email) {
      where.email = query.email
    }

    if (query.emailVerified !== undefined) {
      where.emailVerified = query.emailVerified
    }

    if (query.minLevel) {
      where.currentLevel = { gte: query.minLevel }
    }

    if (query.maxLevel) {
      where.currentLevel = { ...where.currentLevel, lte: query.maxLevel }
    }

    if (query.minXp) {
      where.totalXp = { gte: query.minXp }
    }

    if (query.hasStreak) {
      where.streakCount = query.hasStreak ? { gt: 0 } : { equals: 0 }
    }

    if (query.lastActivityAfter) {
      where.lastActivity = { gte: query.lastActivityAfter }
    }

    if (query.lastActivityBefore) {
      where.lastActivity = { ...where.lastActivity, lte: query.lastActivityBefore }
    }

    return where
  }

  /**
   * Build order by clause for user queries
   */
  protected buildOrderByClause(query: UserQuery): any {
    return {
      [query.sortBy]: query.sortOrder
    }
  }

  /**
   * Get include options for user queries
   */
  protected getIncludeOptions(): any {
    return {
      include: {
        _count: {
          select: {
            goals: true,
            progress: true,
            userAchievements: true
          }
        }
      }
    }
  }

  /**
   * Prepare create data (hash password)
   */
  protected async prepareCreateData(data: UserCreateInput): Promise<any> {
    const hashedPassword = await hashPassword(data.password)
    return {
      ...data,
      password: hashedPassword
    }
  }

  /**
   * Create user (override to handle password hashing)
   */
  async create(data: UserCreateInput): Promise<UserWithRelations> {
    return withErrorHandling(async () => {
      const preparedData = await this.prepareCreateData(data)
      const client = this.prisma

      const result = await client.user.create({
        data: preparedData,
        ...this.getIncludeOptions()
      })

      return this.transformResult(result)
    }, 'Creating user')
  }

  /**
   * Update user (handle password hashing if password is being updated)
   */
  async update(id: string, data: UserUpdateInput): Promise<UserWithRelations> {
    return withErrorHandling(async () => {
      let updateData = { ...data }
      
      // Hash password if it's being updated
      if (data.password) {
        updateData.password = await hashPassword(data.password)
      }

      const client = this.prisma

      const result = await client.user.update({
        where: { id },
        data: updateData,
        ...this.getIncludeOptions()
      })

      return this.transformResult(result)
    }, 'Updating user')
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<UserWithRelations | null> {
    return withErrorHandling(async () => {
      const client = this.prisma

      const result = await client.user.findUnique({
        where: { email },
        ...this.getIncludeOptions()
      })

      return result ? this.transformResult(result) : null
    }, 'Finding user by email')
  }

  /**
   * Find user by email with password (for authentication)
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return withErrorHandling(async () => {
      const client = this.prisma

      return await client.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          emailVerified: true,
          loginAttempts: true,
          lockedUntil: true,
          createdAt: true,
          updatedAt: true
        }
      })
    }, 'Finding user by email with password')
  }

  /**
   * Update login attempts
   */
  async updateLoginAttempts(id: string, attempts: number, lockedUntil?: Date): Promise<void> {
    return withErrorHandling(async () => {
      const client = this.prisma

      await client.user.update({
        where: { id },
        data: {
          loginAttempts: attempts,
          lockedUntil,
          lastLoginAt: attempts === 0 ? new Date() : undefined
        }
      })
    }, 'Updating login attempts')
  }

  /**
   * Reset password with token
   */
  async updatePasswordResetToken(email: string, token: string, expires: Date): Promise<void> {
    return withErrorHandling(async () => {
      const client = this.prisma

      await client.user.update({
        where: { email },
        data: {
          passwordResetToken: token,
          passwordResetExpires: expires
        }
      })
    }, 'Setting password reset token')
  }

  /**
   * Find user by password reset token
   */
  async findByPasswordResetToken(token: string): Promise<User | null> {
    return withErrorHandling(async () => {
      const client = this.prisma

      return await client.user.findFirst({
        where: {
          passwordResetToken: token,
          passwordResetExpires: {
            gt: new Date()
          }
        }
      })
    }, 'Finding user by password reset token')
  }

  /**
   * Clear password reset token
   */
  async clearPasswordResetToken(id: string): Promise<void> {
    return withErrorHandling(async () => {
      const client = this.prisma

      await client.user.update({
        where: { id },
        data: {
          passwordResetToken: null,
          passwordResetExpires: null
        }
      })
    }, 'Clearing password reset token')
  }

  /**
   * Update user XP and level
   */
  async updateXp(id: string, xpGained: number): Promise<UserWithRelations> {
    return withErrorHandling(async () => {
      const client = this.prisma

      const user = await this.findById(id)
      if (!user) {
        throw new Error('User not found')
      }

      const newTotalXp = user.totalXp + xpGained
      const newLevel = this.calculateLevel(newTotalXp)

      const result = await client.user.update({
        where: { id },
        data: {
          totalXp: newTotalXp,
          currentLevel: newLevel,
          lastActivity: new Date()
        },
        ...this.getIncludeOptions()
      })

      return this.transformResult(result)
    }, 'Updating user XP')
  }

  /**
   * Update user streak
   */
  async updateStreak(id: string, streakCount: number): Promise<UserWithRelations> {
    return withErrorHandling(async () => {
      const client = this.prisma

      const result = await client.user.update({
        where: { id },
        data: {
          streakCount,
          lastActivity: new Date()
        },
        ...this.getIncludeOptions()
      })

      return this.transformResult(result)
    }, 'Updating user streak')
  }

  /**
   * Get user statistics
   */
  async getUserStats(id: string): Promise<{
    goalsCount: number
    completedGoalsCount: number
    totalProgressEntries: number
    achievementsCount: number
    currentStreak: number
    totalXp: number
    currentLevel: number
  }> {
    return withErrorHandling(async () => {
      const client = this.prisma

      const [user, goalsStats, achievementsCount] = await Promise.all([
        client.user.findUnique({
          where: { id },
          select: {
            streakCount: true,
            totalXp: true,
            currentLevel: true
          }
        }),
        client.goal.groupBy({
          by: ['isCompleted'],
          where: { userId: id },
          _count: { id: true }
        }),
        client.userAchievement.count({
          where: {
            userId: id,
            isCompleted: true
          }
        }),
        client.progress.count({
          where: { userId: id }
        })
      ])

      if (!user) {
        throw new Error('User not found')
      }

      const totalGoals = goalsStats.reduce((sum, stat) => sum + stat._count.id, 0)
      const completedGoals = goalsStats.find(stat => stat.isCompleted)?._count.id || 0
      const totalProgressEntries = await client.progress.count({ where: { userId: id } })

      return {
        goalsCount: totalGoals,
        completedGoalsCount: completedGoals,
        totalProgressEntries,
        achievementsCount,
        currentStreak: user.streakCount,
        totalXp: user.totalXp,
        currentLevel: user.currentLevel
      }
    }, 'Getting user statistics')
  }

  /**
   * Calculate level based on XP
   */
  private calculateLevel(xp: number): number {
    // Simple XP to level calculation
    // Level 1: 0-99 XP, Level 2: 100-299 XP, Level 3: 300-599 XP, etc.
    // Formula: Level = floor(sqrt(XP/100)) + 1
    return Math.floor(Math.sqrt(xp / 100)) + 1
  }

  /**
   * Get XP required for next level
   */
  getXpForNextLevel(currentLevel: number): number {
    return Math.pow(currentLevel, 2) * 100
  }

  private get prisma() {
    return require('../client').prisma.$client
  }
}