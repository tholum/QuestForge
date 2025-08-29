/**
 * Database Integration Tests
 * 
 * Comprehensive tests for database operations, repositories, and data integrity.
 */

import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { prisma } from '../client'
import { handlePrismaError } from '../error-handler'
import { 
  UserRepository, 
  GoalRepository, 
  ProgressRepository,
  ModuleRepository,
  AchievementRepository
} from '../repositories'
import { hashPassword } from '../../auth/password'

// Test database setup
const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || 'file:./test.db'
    }
  }
})

describe('Database Integration Tests', () => {
  let userRepo: UserRepository
  let goalRepo: GoalRepository
  let progressRepo: ProgressRepository
  let moduleRepo: ModuleRepository
  let achievementRepo: AchievementRepository

  beforeAll(async () => {
    // Initialize repositories
    userRepo = new UserRepository()
    goalRepo = new GoalRepository()
    progressRepo = new ProgressRepository()
    moduleRepo = new ModuleRepository()
    achievementRepo = new AchievementRepository()
  })

  beforeEach(async () => {
    // Clean database before each test
    await testPrisma.userAchievement.deleteMany()
    await testPrisma.progress.deleteMany()
    await testPrisma.goal.deleteMany()
    await testPrisma.achievement.deleteMany()
    await testPrisma.user.deleteMany()
    await testPrisma.module.deleteMany()
  })

  afterAll(async () => {
    await testPrisma.$disconnect()
  })

  describe('Connection and Health', () => {
    it('should connect to database successfully', async () => {
      await expect(prisma.$queryRaw`SELECT 1`).resolves.toBeDefined()
    })

    it('should perform health check', async () => {
      const result = await prisma.$queryRaw`SELECT 1 as health`
      expect(result).toBeDefined()
    })
  })

  describe('User Repository', () => {
    it('should create user with hashed password', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      }

      const user = await userRepo.create(userData)

      expect(user.email).toBe(userData.email)
      expect(user.name).toBe(userData.name)
      expect(user.password).not.toBe(userData.password) // Password should be hashed
      expect(user.id).toBeDefined()
      expect(user.createdAt).toBeInstanceOf(Date)
    })

    it('should find user by email', async () => {
      const password = await hashPassword('password123')
      const user = await testPrisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password
        }
      })

      const foundUser = await userRepo.findByEmail('test@example.com')

      expect(foundUser).toBeDefined()
      expect(foundUser!.email).toBe(user.email)
    })

    it('should update user XP and level', async () => {
      const password = await hashPassword('password123')
      const user = await testPrisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password,
          totalXp: 0,
          currentLevel: 1
        }
      })

      const updatedUser = await userRepo.updateXp(user.id, 150)

      expect(updatedUser.totalXp).toBe(150)
      expect(updatedUser.currentLevel).toBe(2) // Level should increase
      expect(updatedUser.lastActivity).toBeInstanceOf(Date)
    })

    it('should handle unique email constraint', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      }

      await userRepo.create(userData)

      await expect(userRepo.create(userData)).rejects.toThrow()
    })
  })

  describe('Module Repository', () => {
    it('should create and find modules', async () => {
      const moduleData = {
        id: 'test_module',
        name: 'Test Module',
        version: '1.0.0',
        isInstalled: true,
        isEnabled: true,
        config: {
          test: true,
          categories: ['test']
        }
      }

      const module = await moduleRepo.create(moduleData)

      expect(module.id).toBe(moduleData.id)
      expect(module.name).toBe(moduleData.name)
      expect(module.config).toEqual(moduleData.config)

      const foundModule = await moduleRepo.findById(moduleData.id)
      expect(foundModule).toBeDefined()
      expect(foundModule!.id).toBe(moduleData.id)
    })

    it('should find enabled modules only', async () => {
      await testPrisma.module.createMany({
        data: [
          { id: 'enabled', name: 'Enabled', version: '1.0.0', isEnabled: true, isInstalled: true },
          { id: 'disabled', name: 'Disabled', version: '1.0.0', isEnabled: false, isInstalled: true }
        ]
      })

      const enabledModules = await moduleRepo.findEnabled()

      expect(enabledModules).toHaveLength(1)
      expect(enabledModules[0].id).toBe('enabled')
    })

    it('should update module configuration', async () => {
      const module = await testPrisma.module.create({
        data: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          config: { setting1: 'value1' }
        }
      })

      const updated = await moduleRepo.updateConfig(module.id, { setting2: 'value2' })

      expect(updated.config).toEqual({
        setting1: 'value1',
        setting2: 'value2'
      })
    })
  })

  describe('Goal Repository', () => {
    let testUser: any
    let testModule: any

    beforeEach(async () => {
      const password = await hashPassword('password123')
      testUser = await testPrisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password
        }
      })

      testModule = await testPrisma.module.create({
        data: {
          id: 'fitness',
          name: 'Fitness',
          version: '1.0.0',
          isInstalled: true,
          isEnabled: true
        }
      })
    })

    it('should create goal with valid data', async () => {
      const goalData = {
        title: 'Test Goal',
        description: 'Test goal description',
        difficulty: 'medium' as const,
        priority: 'high' as const,
        userId: testUser.id,
        moduleId: testModule.id,
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }

      const goal = await goalRepo.create(goalData)

      expect(goal.title).toBe(goalData.title)
      expect(goal.userId).toBe(testUser.id)
      expect(goal.moduleId).toBe(testModule.id)
      expect(goal.isCompleted).toBe(false)
      expect(goal.id).toBeDefined()
    })

    it('should find goals by user', async () => {
      const goalData = {
        title: 'User Goal',
        userId: testUser.id,
        moduleId: testModule.id,
        difficulty: 'easy' as const,
        priority: 'medium' as const
      }

      await goalRepo.create(goalData)

      const userGoals = await goalRepo.findByUser(testUser.id)

      expect(userGoals).toHaveLength(1)
      expect(userGoals[0].userId).toBe(testUser.id)
    })

    it('should complete goal and sub-goals', async () => {
      const parentGoal = await goalRepo.create({
        title: 'Parent Goal',
        userId: testUser.id,
        moduleId: testModule.id,
        difficulty: 'medium' as const,
        priority: 'high' as const
      })

      const subGoal = await goalRepo.create({
        title: 'Sub Goal',
        userId: testUser.id,
        moduleId: testModule.id,
        parentGoalId: parentGoal.id,
        difficulty: 'easy' as const,
        priority: 'medium' as const
      })

      const completed = await goalRepo.completeGoal(parentGoal.id, true)

      expect(completed.isCompleted).toBe(true)

      // Check if sub-goal is also completed
      const updatedSubGoal = await goalRepo.findById(subGoal.id)
      expect(updatedSubGoal!.isCompleted).toBe(true)
    })

    it('should get goal progress summary', async () => {
      const goal = await goalRepo.create({
        title: 'Progress Goal',
        userId: testUser.id,
        moduleId: testModule.id,
        difficulty: 'medium' as const,
        priority: 'high' as const
      })

      // Add some progress
      await testPrisma.progress.create({
        data: {
          value: 75,
          maxValue: 100,
          xpEarned: 25,
          userId: testUser.id,
          goalId: goal.id
        }
      })

      const summary = await goalRepo.getGoalProgress(goal.id)

      expect(summary.goal.id).toBe(goal.id)
      expect(summary.currentProgress).toBe(75)
      expect(summary.progressPercentage).toBe(75)
      expect(summary.totalXpEarned).toBe(25)
    })
  })

  describe('Progress Repository', () => {
    let testUser: any
    let testGoal: any

    beforeEach(async () => {
      const password = await hashPassword('password123')
      testUser = await testPrisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password
        }
      })

      const testModule = await testPrisma.module.create({
        data: {
          id: 'fitness',
          name: 'Fitness',
          version: '1.0.0'
        }
      })

      testGoal = await testPrisma.goal.create({
        data: {
          title: 'Test Goal',
          userId: testUser.id,
          moduleId: testModule.id,
          difficulty: 'medium',
          priority: 'high'
        }
      })
    })

    it('should create progress entry', async () => {
      const progressData = {
        value: 50,
        maxValue: 100,
        xpEarned: 25,
        notes: 'Good progress',
        userId: testUser.id,
        goalId: testGoal.id,
        recordedAt: new Date()
      }

      const progress = await progressRepo.create(progressData)

      expect(progress.value).toBe(progressData.value)
      expect(progress.xpEarned).toBe(progressData.xpEarned)
      expect(progress.goalId).toBe(testGoal.id)
      expect(progress.notes).toBe(progressData.notes)
    })

    it('should get progress analytics for user', async () => {
      // Create multiple progress entries
      const progressEntries = [
        { value: 25, xpEarned: 10, recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { value: 50, xpEarned: 15, recordedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { value: 75, xpEarned: 20, recordedAt: new Date() }
      ]

      for (const entry of progressEntries) {
        await testPrisma.progress.create({
          data: {
            ...entry,
            maxValue: 100,
            userId: testUser.id,
            goalId: testGoal.id
          }
        })
      }

      const analytics = await progressRepo.getUserProgressAnalytics(testUser.id)

      expect(analytics.totalEntries).toBe(3)
      expect(analytics.totalXpEarned).toBe(45)
      expect(analytics.progressTrend).toBe('increasing')
      expect(analytics.averageProgress).toBeGreaterThan(0)
    })

    it('should get latest progress for goal', async () => {
      const olderProgress = await testPrisma.progress.create({
        data: {
          value: 25,
          maxValue: 100,
          xpEarned: 10,
          userId: testUser.id,
          goalId: testGoal.id,
          recordedAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      })

      const newerProgress = await testPrisma.progress.create({
        data: {
          value: 75,
          maxValue: 100,
          xpEarned: 25,
          userId: testUser.id,
          goalId: testGoal.id,
          recordedAt: new Date()
        }
      })

      const latest = await progressRepo.getLatestProgressForGoal(testGoal.id)

      expect(latest).toBeDefined()
      expect(latest!.id).toBe(newerProgress.id)
      expect(latest!.value).toBe(75)
    })
  })

  describe('Achievement Repository', () => {
    let testUser: any

    beforeEach(async () => {
      const password = await hashPassword('password123')
      testUser = await testPrisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          password
        }
      })
    })

    it('should create achievement', async () => {
      const achievementData = {
        name: 'Test Achievement',
        description: 'Test achievement description',
        icon: 'star',
        tier: 'bronze' as const,
        xpReward: 50,
        conditions: {
          type: 'goal_created',
          count: 1
        }
      }

      const achievement = await achievementRepo.create(achievementData)

      expect(achievement.name).toBe(achievementData.name)
      expect(achievement.xpReward).toBe(achievementData.xpReward)
      expect(achievement.conditions).toEqual(achievementData.conditions)
    })

    it('should award achievement to user', async () => {
      const achievement = await testPrisma.achievement.create({
        data: {
          name: 'First Goal',
          description: 'Create first goal',
          icon: 'target',
          tier: 'bronze',
          xpReward: 25,
          conditions: { type: 'goal_created', count: 1 }
        }
      })

      const userAchievement = await achievementRepo.awardToUser(testUser.id, achievement.id)

      expect(userAchievement.userId).toBe(testUser.id)
      expect(userAchievement.achievementId).toBe(achievement.id)
      expect(userAchievement.isCompleted).toBe(true)
      expect(userAchievement.progress).toBe(1)

      // Check that XP was awarded
      const updatedUser = await testPrisma.user.findUnique({
        where: { id: testUser.id }
      })
      expect(updatedUser!.totalXp).toBe(25)
    })

    it('should update achievement progress', async () => {
      const achievement = await testPrisma.achievement.create({
        data: {
          name: 'Goal Master',
          description: 'Complete 10 goals',
          icon: 'crown',
          tier: 'silver',
          xpReward: 100,
          conditions: { type: 'goals_completed', count: 10 }
        }
      })

      // Award initial progress
      await achievementRepo.awardToUser(testUser.id, achievement.id, 0.3)

      // Update progress
      const updated = await achievementRepo.updateUserAchievementProgress(
        testUser.id,
        achievement.id,
        0.7
      )

      expect(updated.progress).toBe(0.7)
      expect(updated.isCompleted).toBe(false)

      // Complete the achievement
      const completed = await achievementRepo.updateUserAchievementProgress(
        testUser.id,
        achievement.id,
        1.0
      )

      expect(completed.progress).toBe(1)
      expect(completed.isCompleted).toBe(true)
    })

    it('should get user achievements', async () => {
      const achievement = await testPrisma.achievement.create({
        data: {
          name: 'Test Achievement',
          description: 'Test',
          icon: 'star',
          tier: 'bronze',
          xpReward: 25,
          conditions: { type: 'goal_created', count: 1 }
        }
      })

      await achievementRepo.awardToUser(testUser.id, achievement.id)

      const userAchievements = await achievementRepo.getUserAchievements(testUser.id)

      expect(userAchievements).toHaveLength(1)
      expect(userAchievements[0].achievement.name).toBe('Test Achievement')
    })
  })

  describe('Error Handling', () => {
    it('should handle Prisma errors correctly', async () => {
      const error = new Error('Test error')
      const handledError = handlePrismaError(error)

      expect(handledError.message).toBe('Test error')
      expect(handledError.code).toBe('UNKNOWN_ERROR')
    })

    it('should handle validation errors', async () => {
      const invalidUserData = {
        email: 'invalid-email', // Invalid email format
        password: '123' // Too short password
      }

      await expect(userRepo.create(invalidUserData as any)).rejects.toThrow()
    })

    it('should handle foreign key constraints', async () => {
      const goalData = {
        title: 'Test Goal',
        userId: 'non-existent-user-id',
        moduleId: 'non-existent-module-id',
        difficulty: 'medium' as const,
        priority: 'high' as const
      }

      await expect(goalRepo.create(goalData)).rejects.toThrow()
    })
  })

  describe('Transaction Handling', () => {
    it('should handle transactions correctly', async () => {
      const password = await hashPassword('password123')

      await userRepo.transaction(async ({ tx }) => {
        const user = await tx.user.create({
          data: {
            email: 'transaction-test@example.com',
            name: 'Transaction User',
            password
          }
        })

        const module = await tx.module.create({
          data: {
            id: 'transaction-module',
            name: 'Transaction Module',
            version: '1.0.0'
          }
        })

        await tx.goal.create({
          data: {
            title: 'Transaction Goal',
            userId: user.id,
            moduleId: module.id,
            difficulty: 'easy',
            priority: 'medium'
          }
        })
      })

      // Verify all data was created
      const user = await testPrisma.user.findUnique({
        where: { email: 'transaction-test@example.com' }
      })
      const module = await testPrisma.module.findUnique({
        where: { id: 'transaction-module' }
      })
      const goal = await testPrisma.goal.findFirst({
        where: { title: 'Transaction Goal' }
      })

      expect(user).toBeDefined()
      expect(module).toBeDefined()
      expect(goal).toBeDefined()
    })

    it('should rollback on transaction failure', async () => {
      const password = await hashPassword('password123')

      await expect(
        userRepo.transaction(async ({ tx }) => {
          await tx.user.create({
            data: {
              email: 'rollback-test@example.com',
              name: 'Rollback User',
              password
            }
          })

          // This should cause the transaction to rollback
          throw new Error('Transaction should rollback')
        })
      ).rejects.toThrow('Transaction should rollback')

      // Verify user was not created due to rollback
      const user = await testPrisma.user.findUnique({
        where: { email: 'rollback-test@example.com' }
      })

      expect(user).toBeNull()
    })
  })

  describe('Data Integrity', () => {
    it('should maintain referential integrity', async () => {
      const password = await hashPassword('password123')
      const user = await testPrisma.user.create({
        data: {
          email: 'integrity@example.com',
          name: 'Integrity User',
          password
        }
      })

      const module = await testPrisma.module.create({
        data: {
          id: 'integrity-module',
          name: 'Integrity Module',
          version: '1.0.0'
        }
      })

      const goal = await testPrisma.goal.create({
        data: {
          title: 'Integrity Goal',
          userId: user.id,
          moduleId: module.id,
          difficulty: 'medium',
          priority: 'high'
        }
      })

      // Verify relationships exist
      const goalWithRelations = await testPrisma.goal.findUnique({
        where: { id: goal.id },
        include: {
          user: true,
          module: true
        }
      })

      expect(goalWithRelations!.user.id).toBe(user.id)
      expect(goalWithRelations!.module.id).toBe(module.id)
    })

    it('should enforce cascade deletes', async () => {
      const password = await hashPassword('password123')
      const user = await testPrisma.user.create({
        data: {
          email: 'cascade@example.com',
          name: 'Cascade User',
          password
        }
      })

      const module = await testPrisma.module.create({
        data: {
          id: 'cascade-module',
          name: 'Cascade Module',
          version: '1.0.0'
        }
      })

      const goal = await testPrisma.goal.create({
        data: {
          title: 'Cascade Goal',
          userId: user.id,
          moduleId: module.id,
          difficulty: 'medium',
          priority: 'high'
        }
      })

      // Delete user should cascade to goals
      await testPrisma.user.delete({
        where: { id: user.id }
      })

      // Verify goal was deleted
      const deletedGoal = await testPrisma.goal.findUnique({
        where: { id: goal.id }
      })

      expect(deletedGoal).toBeNull()
    })
  })
})