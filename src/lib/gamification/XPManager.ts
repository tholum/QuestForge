import { PrismaClient } from '@prisma/client';
import { 
  XPConfiguration, 
  UserLevel, 
  XPTransaction,
  StreakData 
} from '../../types/gamification';
import { GoalDifficulty } from '../../types';
import { AppError, ErrorType } from '../../types';

/**
 * Manages XP earning, level progression, and streak tracking
 */
export class XPManager {
  private prisma: PrismaClient;
  private xpConfig: XPConfiguration;

  constructor(prismaClient: PrismaClient, xpConfig?: XPConfiguration) {
    this.prisma = prismaClient;
    this.xpConfig = xpConfig || this.getDefaultXPConfiguration();
  }

  /**
   * Award XP to a user for a specific action
   */
  async awardXP(
    userId: string,
    action: string,
    difficulty: GoalDifficulty = 'medium',
    streakDays: number = 0,
    metadata?: Record<string, unknown>
  ): Promise<{
    xpAwarded: number;
    newLevel: UserLevel;
    leveledUp: boolean;
  }> {
    try {
      // Calculate XP based on configuration
      const baseXP = this.xpConfig.baseXP[action] || 0;
      if (baseXP === 0) {
        throw new Error(`Unknown action: ${action}`);
      }

      let xpAwarded = baseXP;

      // Apply difficulty multiplier
      xpAwarded *= this.xpConfig.difficultyMultipliers[difficulty];

      // Apply streak bonus
      if (streakDays > 0) {
        const streakMultiplier = 1 + (this.xpConfig.streakBonusPercentage / 100) * Math.min(streakDays, 30); // Cap at 30 days
        xpAwarded *= streakMultiplier;
      }

      xpAwarded = Math.round(xpAwarded);

      // Get current user data
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const oldLevel = this.calculateLevel(user.totalXp);
      const newTotalXP = user.totalXp + xpAwarded;
      const newLevel = this.calculateLevel(newTotalXP);
      const leveledUp = newLevel.currentLevel > oldLevel.currentLevel;

      // Update user XP and level
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          totalXp: newTotalXP,
          currentLevel: newLevel.currentLevel
        }
      });

      // Create XP transaction record (if you have this table)
      // await this.createXPTransaction(userId, xpAwarded, action, metadata);

      return {
        xpAwarded,
        newLevel,
        leveledUp
      };
    } catch (error) {
      throw new AppError({
        type: ErrorType.MODULE_ERROR,
        message: 'Failed to award XP',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get user's current level information
   */
  async getUserLevel(userId: string): Promise<UserLevel> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      return this.calculateLevel(user.totalXp);
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to get user level',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Calculate level information from total XP
   */
  calculateLevel(totalXP: number): UserLevel {
    let currentLevel = 1;
    let xpForCurrentLevel = 0;

    // Find current level
    for (let i = 0; i < this.xpConfig.levelThresholds.length; i++) {
      if (totalXP >= this.xpConfig.levelThresholds[i]) {
        currentLevel = i + 2; // Level 1 starts at 0 XP, level 2 at first threshold
        xpForCurrentLevel = this.xpConfig.levelThresholds[i];
      } else {
        break;
      }
    }

    // Cap at max level
    if (currentLevel > this.xpConfig.maxLevel) {
      currentLevel = this.xpConfig.maxLevel;
    }

    // Calculate XP for next level
    const nextLevelIndex = currentLevel - 1; // Convert to 0-based index for thresholds
    const xpForNextLevel = nextLevelIndex < this.xpConfig.levelThresholds.length 
      ? this.xpConfig.levelThresholds[nextLevelIndex]
      : this.xpConfig.levelThresholds[this.xpConfig.levelThresholds.length - 1];

    // Calculate progress to next level
    const xpInCurrentLevel = totalXP - xpForCurrentLevel;
    const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
    const progressToNextLevel = currentLevel >= this.xpConfig.maxLevel 
      ? 1 
      : Math.max(0, Math.min(1, xpInCurrentLevel / xpNeededForNextLevel));

    return {
      currentLevel,
      currentXP: totalXP,
      xpForCurrentLevel,
      xpForNextLevel,
      progressToNextLevel,
      totalXP
    };
  }

  /**
   * Update user's streak
   */
  async updateStreak(userId: string): Promise<StreakData> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastActivity = user.lastActivity;
      
      let newStreakCount = user.streakCount;
      let isActive = false;

      if (!lastActivity) {
        // First activity ever
        newStreakCount = 1;
        isActive = true;
      } else {
        const lastActivityDate = new Date(
          lastActivity.getFullYear(), 
          lastActivity.getMonth(), 
          lastActivity.getDate()
        );
        
        const daysDiff = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
          // Activity today, maintain streak
          isActive = true;
        } else if (daysDiff === 1) {
          // Activity yesterday, continue streak
          newStreakCount += 1;
          isActive = true;
        } else {
          // Streak broken
          newStreakCount = 1;
          isActive = true;
        }
      }

      // Update user record
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          streakCount: newStreakCount,
          lastActivity: now
        }
      });

      return {
        currentStreak: newStreakCount,
        longestStreak: Math.max(user.streakCount, newStreakCount), // Would need to track this separately in real implementation
        lastActivityDate: now,
        streakStartDate: lastActivity, // Would need to calculate this properly
        isActive
      };
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to update streak',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get user's streak data
   */
  async getUserStreak(userId: string): Promise<StreakData> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastActivity = user.lastActivity;
      
      let isActive = false;
      
      if (lastActivity) {
        const lastActivityDate = new Date(
          lastActivity.getFullYear(), 
          lastActivity.getMonth(), 
          lastActivity.getDate()
        );
        
        const daysDiff = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
        isActive = daysDiff <= 1; // Active if activity was today or yesterday
      }

      return {
        currentStreak: user.streakCount,
        longestStreak: user.streakCount, // Would need separate tracking
        lastActivityDate: lastActivity,
        streakStartDate: null, // Would need to calculate
        isActive
      };
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to get user streak',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get XP leaderboard
   */
  async getXPLeaderboard(limit: number = 10): Promise<Array<{
    userId: string;
    userName: string;
    totalXP: number;
    currentLevel: number;
    rank: number;
  }>> {
    try {
      const users = await this.prisma.user.findMany({
        orderBy: { totalXp: 'desc' },
        take: limit
      });

      return users.map((user, index) => ({
        userId: user.id,
        userName: user.name || user.email,
        totalXP: user.totalXp,
        currentLevel: user.currentLevel,
        rank: index + 1
      }));
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to get XP leaderboard',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get level leaderboard
   */
  async getLevelLeaderboard(limit: number = 10): Promise<Array<{
    userId: string;
    userName: string;
    currentLevel: number;
    totalXP: number;
    rank: number;
  }>> {
    try {
      const users = await this.prisma.user.findMany({
        orderBy: [
          { currentLevel: 'desc' },
          { totalXp: 'desc' }
        ],
        take: limit
      });

      return users.map((user, index) => ({
        userId: user.id,
        userName: user.name || user.email,
        currentLevel: user.currentLevel,
        totalXP: user.totalXp,
        rank: index + 1
      }));
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to get level leaderboard',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Update XP configuration
   */
  updateXPConfiguration(newConfig: Partial<XPConfiguration>): void {
    this.xpConfig = { ...this.xpConfig, ...newConfig };
  }

  /**
   * Get current XP configuration
   */
  getXPConfiguration(): XPConfiguration {
    return { ...this.xpConfig };
  }

  // Private helper methods

  private getDefaultXPConfiguration(): XPConfiguration {
    return {
      baseXP: {
        create_goal: 5,
        complete_goal: 10,
        update_progress: 2,
        daily_login: 1,
        share_achievement: 3,
        help_other_user: 5,
        complete_challenge: 15
      },
      difficultyMultipliers: {
        easy: 1,
        medium: 1.5,
        hard: 2,
        expert: 3
      },
      streakBonusPercentage: 10,
      levelThresholds: [
        100,   // Level 2
        250,   // Level 3
        500,   // Level 4
        1000,  // Level 5
        1750,  // Level 6
        2750,  // Level 7
        4000,  // Level 8
        5500,  // Level 9
        7250,  // Level 10
        9250,  // Level 11
        11500, // Level 12
        14000, // Level 13
        16750, // Level 14
        19750, // Level 15
        23000, // Level 16
        26500, // Level 17
        30250, // Level 18
        34250, // Level 19
        38500, // Level 20
        43000  // Level 21
      ],
      maxLevel: 50
    };
  }

  private async createXPTransaction(
    userId: string,
    amount: number,
    reason: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    // This would create an XP transaction record if you have that table
    // await this.prisma.xpTransaction.create({
    //   data: {
    //     userId,
    //     amount,
    //     reason,
    //     source: 'action',
    //     metadata: metadata as any,
    //     timestamp: new Date()
    //   }
    // });
  }
}