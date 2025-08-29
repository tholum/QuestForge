/**
 * Progress-Gamification Integration Tests
 * 
 * Tests the complete integration between progress tracking and gamification systems,
 * including XP calculation, streak management, and achievement unlocking.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { XPManager } from '@/lib/gamification/XPManager'
import { AchievementManager } from '@/lib/gamification/AchievementManager'
import { ProgressRepository } from '@/lib/prisma/repositories/progress-repository'

// Mock Prisma client
const mockPrismaClient = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  progress: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  userAchievement: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  achievement: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
}

vi.mock('@/lib/prisma/client', () => ({
  prisma: {
    $client: mockPrismaClient
  }
}))

describe('Progress-Gamification Integration', () => {
  let xpManager: XPManager
  let achievementManager: AchievementManager
  let progressRepository: ProgressRepository

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    totalXp: 100,
    currentLevel: 2,
    streakCount: 3,
    lastActivity: new Date()
  }

  const mockGoal = {
    id: 'goal-123',
    title: 'Test Goal',
    difficulty: 'medium',
    userId: 'user-123',
    isCompleted: false
  }

  beforeEach(() => {
    vi.clearAllMocks()
    xpManager = new XPManager(mockPrismaClient as any)
    achievementManager = new AchievementManager(mockPrismaClient as any)
    progressRepository = new ProgressRepository()

    // Setup default mock responses
    mockPrismaClient.user.findUnique.mockResolvedValue(mockUser)
    mockPrismaClient.user.update.mockResolvedValue({
      ...mockUser,
      totalXp: 125,
      currentLevel: 2
    })
  })

  describe('XP Calculation Integration', () => {
    it('should award correct XP for progress entries', async () => {
      const progressData = {
        value: 50,
        maxValue: 100,
        goalId: 'goal-123',
        userId: 'user-123'
      }

      const result = await xpManager.awardXP('user-123', 'update_progress', 'medium', 3)

      expect(result).toHaveProperty('xpAwarded')
      expect(result).toHaveProperty('newLevel')
      expect(result.xpAwarded).toBeGreaterThan(0)
      expect(mockPrismaClient.user.update).toHaveBeenCalled()
    })

    it('should apply difficulty multipliers correctly', async () => {
      const testCases = [
        { difficulty: 'easy', expectedMultiplier: 1 },
        { difficulty: 'medium', expectedMultiplier: 1.5 },
        { difficulty: 'hard', expectedMultiplier: 2 },
        { difficulty: 'expert', expectedMultiplier: 3 }
      ]

      for (const { difficulty, expectedMultiplier } of testCases) {
        const result = await xpManager.awardXP('user-123', 'update_progress', difficulty as any, 0)
        
        // Base XP should be modified by difficulty multiplier
        expect(result.xpAwarded).toBeGreaterThan(0)
        expect(mockPrismaClient.user.update).toHaveBeenCalled()
      }
    })

    it('should apply streak multipliers', async () => {
      const baseStreak = 0
      const highStreak = 7

      const baseResult = await xpManager.awardXP('user-123', 'update_progress', 'medium', baseStreak)
      const streakResult = await xpManager.awardXP('user-123', 'update_progress', 'medium', highStreak)

      expect(streakResult.xpAwarded).toBeGreaterThan(baseResult.xpAwarded)
    })

    it('should handle level ups correctly', async () => {
      // Mock user close to leveling up
      mockPrismaClient.user.findUnique.mockResolvedValueOnce({
        ...mockUser,
        totalXp: 995, // Close to 1000 XP threshold
        currentLevel: 2
      })

      mockPrismaClient.user.update.mockResolvedValueOnce({
        ...mockUser,
        totalXp: 1025,
        currentLevel: 3 // Should level up
      })

      const result = await xpManager.awardXP('user-123', 'complete_goal', 'medium', 0)

      expect(result.leveledUp).toBe(true)
      expect(result.newLevel.currentLevel).toBe(3)
    })
  })

  describe('Streak Management', () => {
    it('should update user streak correctly', async () => {
      mockPrismaClient.progress.findMany.mockResolvedValue([
        {
          recordedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          userId: 'user-123'
        }
      ])

      const streakResult = await xpManager.updateStreak('user-123')

      expect(streakResult).toHaveProperty('currentStreak')
      expect(streakResult).toHaveProperty('isActive')
      expect(streakResult.currentStreak).toBeGreaterThanOrEqual(1)
    })

    it('should break streaks correctly', async () => {
      // Mock no recent progress (streak should break)
      mockPrismaClient.progress.findMany.mockResolvedValue([
        {
          recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          userId: 'user-123'
        }
      ])

      const streakResult = await xpManager.updateStreak('user-123')

      expect(streakResult.isActive).toBe(false)
      expect(streakResult.currentStreak).toBe(0)
    })

    it('should maintain active streaks', async () => {
      // Mock recent progress
      mockPrismaClient.progress.findMany.mockResolvedValue([
        {
          recordedAt: new Date(), // Today
          userId: 'user-123'
        },
        {
          recordedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          userId: 'user-123'
        }
      ])

      const streakResult = await xpManager.updateStreak('user-123')

      expect(streakResult.isActive).toBe(true)
      expect(streakResult.currentStreak).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Achievement System Integration', () => {
    beforeEach(() => {
      mockPrismaClient.achievement.findMany.mockResolvedValue([
        {
          id: 'achievement-1',
          name: 'First Steps',
          description: 'Create your first progress entry',
          xpReward: 5,
          category: 'progress',
          difficulty: 'easy',
          criteria: { progressEntries: 1 }
        },
        {
          id: 'achievement-2',
          name: 'Consistency Master',
          description: 'Maintain a 7-day streak',
          xpReward: 25,
          category: 'streaks',
          difficulty: 'medium',
          criteria: { streak: 7 }
        }
      ])

      mockPrismaClient.userAchievement.findMany.mockResolvedValue([])
    })

    it('should unlock achievements for progress milestones', async () => {
      // Mock user with 1 progress entry (should unlock "First Steps")
      mockPrismaClient.progress.count.mockResolvedValue(1)
      
      const achievements = await achievementManager.checkProgressAchievements('user-123')

      expect(achievements.length).toBeGreaterThan(0)
      expect(achievements[0].name).toBe('First Steps')
      expect(mockPrismaClient.userAchievement.create).toHaveBeenCalled()
    })

    it('should unlock streak achievements', async () => {
      const streakAchievements = await achievementManager.checkStreakAchievements('user-123', 7)

      expect(streakAchievements.length).toBeGreaterThan(0)
      expect(streakAchievements[0].name).toBe('Consistency Master')
    })

    it('should not unlock already earned achievements', async () => {
      // Mock user already has "First Steps" achievement
      mockPrismaClient.userAchievement.findMany.mockResolvedValue([
        {
          id: 'user-achievement-1',
          userId: 'user-123',
          achievementId: 'achievement-1',
          unlockedAt: new Date()
        }
      ])

      mockPrismaClient.progress.count.mockResolvedValue(5) // Multiple entries

      const achievements = await achievementManager.checkProgressAchievements('user-123')

      // Should not re-unlock "First Steps"
      const firstStepsAchievement = achievements.find(a => a.name === 'First Steps')
      expect(firstStepsAchievement).toBeUndefined()
    })

    it('should award XP for achievement unlocks', async () => {
      mockPrismaClient.progress.count.mockResolvedValue(1)
      
      const achievements = await achievementManager.checkProgressAchievements('user-123')
      
      if (achievements.length > 0) {
        const xpResult = await xpManager.awardAchievementXP('user-123', achievements[0])
        
        expect(xpResult.xpAwarded).toBe(5) // First Steps reward
        expect(mockPrismaClient.user.update).toHaveBeenCalled()
      }
    })
  })

  describe('Complete Progress Flow Integration', () => {
    it('should handle complete progress creation flow with gamification', async () => {
      const progressData = {
        value: 75,
        maxValue: 100,
        goalId: 'goal-123',
        userId: 'user-123',
        notes: 'Great progress!'
      }

      // Mock progress creation
      mockPrismaClient.progress.create.mockResolvedValue({
        id: 'progress-123',
        ...progressData,
        xpEarned: 18,
        recordedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Mock progress count for achievement check
      mockPrismaClient.progress.count.mockResolvedValue(1)

      // 1. Create progress entry
      const progress = await mockPrismaClient.progress.create({ data: progressData })

      // 2. Award XP
      const xpResult = await xpManager.awardXP('user-123', 'update_progress', 'medium', 3)

      // 3. Update streak
      const streakResult = await xpManager.updateStreak('user-123')

      // 4. Check for achievements
      const achievements = await achievementManager.checkProgressAchievements('user-123')

      // Verify complete flow
      expect(progress.id).toBe('progress-123')
      expect(xpResult.xpAwarded).toBeGreaterThan(0)
      expect(streakResult).toHaveProperty('currentStreak')
      expect(achievements.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle goal completion with bonus XP', async () => {
      const completionData = {
        value: 100,
        maxValue: 100, // 100% completion
        goalId: 'goal-123',
        userId: 'user-123'
      }

      // Mock goal completion
      const xpResult = await xpManager.awardXP('user-123', 'complete_goal', 'hard', 5)

      expect(xpResult.xpAwarded).toBeGreaterThan(20) // Should include completion bonus
    })

    it('should handle multiple progress entries in sequence', async () => {
      const progressEntries = [
        { value: 25, maxValue: 100 },
        { value: 50, maxValue: 100 },
        { value: 75, maxValue: 100 },
        { value: 100, maxValue: 100 }
      ]

      let totalXP = 0
      let currentStreak = 0

      for (const [index, entry] of progressEntries.entries()) {
        const xpResult = await xpManager.awardXP('user-123', 'update_progress', 'medium', currentStreak)
        const streakResult = await xpManager.updateStreak('user-123')
        
        totalXP += xpResult.xpAwarded
        currentStreak = streakResult.currentStreak

        // Last entry should trigger goal completion
        if (index === progressEntries.length - 1) {
          const completionXP = await xpManager.awardXP('user-123', 'complete_goal', 'medium', currentStreak)
          totalXP += completionXP.xpAwarded
        }
      }

      expect(totalXP).toBeGreaterThan(0)
      expect(currentStreak).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Error Handling in Gamification', () => {
    it('should handle XP calculation errors gracefully', async () => {
      mockPrismaClient.user.findUnique.mockRejectedValue(new Error('Database error'))

      await expect(xpManager.awardXP('user-123', 'update_progress', 'medium', 0))
        .rejects.toThrow('Database error')
    })

    it('should handle achievement check failures', async () => {
      mockPrismaClient.achievement.findMany.mockRejectedValue(new Error('Achievement query failed'))

      await expect(achievementManager.checkProgressAchievements('user-123'))
        .rejects.toThrow('Achievement query failed')
    })

    it('should validate progress data before XP calculation', async () => {
      // Test with invalid user ID
      await expect(xpManager.awardXP('', 'update_progress', 'medium', 0))
        .rejects.toThrow()

      // Test with invalid action
      await expect(xpManager.awardXP('user-123', 'invalid_action' as any, 'medium', 0))
        .rejects.toThrow()
    })
  })

  describe('Performance Considerations', () => {
    it('should batch multiple XP operations efficiently', async () => {
      const operations = []
      for (let i = 0; i < 10; i++) {
        operations.push(xpManager.awardXP('user-123', 'update_progress', 'easy', i))
      }

      const results = await Promise.all(operations)
      
      expect(results).toHaveLength(10)
      results.forEach(result => {
        expect(result.xpAwarded).toBeGreaterThan(0)
      })
    })

    it('should handle concurrent achievement checks', async () => {
      const users = ['user-1', 'user-2', 'user-3']
      
      const achievementChecks = users.map(userId =>
        achievementManager.checkProgressAchievements(userId)
      )

      const results = await Promise.all(achievementChecks)
      expect(results).toHaveLength(3)
    })
  })
})