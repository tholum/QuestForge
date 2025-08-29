import { PrismaClient } from '@prisma/client';
import { 
  Achievement, 
  AchievementProgress, 
  UserGamificationProfile,
  XPTransaction 
} from '../../types/gamification';
import { ModuleUtils } from '../../modules/core/ModuleUtils';
import { AppError, ErrorType } from '../../types';

/**
 * Manages achievement tracking and unlocking for users
 */
export class AchievementManager {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Check and update achievement progress for a user
   */
  async checkAchievements(
    userId: string, 
    moduleId?: string,
    triggeredAction?: string
  ): Promise<Achievement[]> {
    try {
      // Get user's current achievement progress
      const userAchievements = await this.prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true }
      });

      // Get available achievements (module-specific or all)
      const availableAchievements = await this.prisma.achievement.findMany({
        where: moduleId ? { moduleId } : undefined
      });

      const newlyUnlocked: Achievement[] = [];

      for (const achievement of availableAchievements) {
        const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);
        
        if (userAchievement?.isCompleted) {
          continue; // Already completed
        }

        // Get user data for checking conditions
        const userData = await this.getUserDataForAchievement(userId, achievement.id);
        const moduleData = moduleId ? await this.getModuleDataForUser(userId, moduleId) : undefined;

        // Check achievement condition
        const conditionResult = ModuleUtils.checkAchievementCondition(
          {
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            tier: achievement.tier as any,
            conditions: achievement.conditions as any,
            xpReward: achievement.xpReward
          },
          userData,
          moduleData
        );

        if (userAchievement) {
          // Update existing progress
          const updatedAchievement = await this.prisma.userAchievement.update({
            where: { id: userAchievement.id },
            data: {
              progress: conditionResult.progress,
              isCompleted: conditionResult.met,
              ...(conditionResult.met && !userAchievement.isCompleted ? {
                unlockedAt: new Date()
              } : {})
            },
            include: { achievement: true }
          });

          if (conditionResult.met && !userAchievement.isCompleted) {
            // Achievement newly unlocked
            await this.awardAchievement(userId, achievement.id, achievement.xpReward);
            newlyUnlocked.push({
              id: achievement.id,
              name: achievement.name,
              description: achievement.description,
              icon: achievement.icon,
              tier: achievement.tier as any,
              conditions: achievement.conditions as any,
              xpReward: achievement.xpReward
            });
          }
        } else if (conditionResult.progress > 0) {
          // Create new achievement progress
          const newUserAchievement = await this.prisma.userAchievement.create({
            data: {
              userId,
              achievementId: achievement.id,
              progress: conditionResult.progress,
              isCompleted: conditionResult.met,
              ...(conditionResult.met ? { unlockedAt: new Date() } : {})
            },
            include: { achievement: true }
          });

          if (conditionResult.met) {
            // Achievement unlocked on first check
            await this.awardAchievement(userId, achievement.id, achievement.xpReward);
            newlyUnlocked.push({
              id: achievement.id,
              name: achievement.name,
              description: achievement.description,
              icon: achievement.icon,
              tier: achievement.tier as any,
              conditions: achievement.conditions as any,
              xpReward: achievement.xpReward
            });
          }
        }
      }

      return newlyUnlocked;
    } catch (error) {
      throw new AppError({
        type: ErrorType.MODULE_ERROR,
        message: 'Failed to check achievements',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get user's achievement progress
   */
  async getUserAchievements(userId: string, moduleId?: string): Promise<AchievementProgress[]> {
    try {
      const userAchievements = await this.prisma.userAchievement.findMany({
        where: {
          userId,
          ...(moduleId ? { achievement: { moduleId } } : {})
        },
        include: { achievement: true }
      });

      return userAchievements.map(ua => ({
        achievementId: ua.achievementId,
        currentValue: ua.progress * (ua.achievement.conditions as any).target || 0,
        targetValue: (ua.achievement.conditions as any).target || 1,
        progress: ua.progress,
        isCompleted: ua.isCompleted,
        unlockedAt: ua.unlockedAt,
        completedAt: ua.isCompleted ? ua.unlockedAt : undefined
      }));
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to get user achievements',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get achievement statistics for a user
   */
  async getAchievementStats(userId: string): Promise<{
    totalAchievements: number;
    completedAchievements: number;
    completionRate: number;
    xpFromAchievements: number;
    achievementsByTier: Record<string, number>;
  }> {
    try {
      const [userAchievements, allAchievements] = await Promise.all([
        this.prisma.userAchievement.findMany({
          where: { userId },
          include: { achievement: true }
        }),
        this.prisma.achievement.count()
      ]);

      const completedAchievements = userAchievements.filter(ua => ua.isCompleted);
      const xpFromAchievements = completedAchievements.reduce(
        (total, ua) => total + ua.achievement.xpReward, 
        0
      );

      const achievementsByTier = completedAchievements.reduce((acc, ua) => {
        const tier = ua.achievement.tier;
        acc[tier] = (acc[tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalAchievements: allAchievements,
        completedAchievements: completedAchievements.length,
        completionRate: allAchievements > 0 ? completedAchievements.length / allAchievements : 0,
        xpFromAchievements,
        achievementsByTier
      };
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to get achievement statistics',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Create a new achievement
   */
  async createAchievement(achievement: Omit<Achievement, 'id'> & { moduleId?: string }): Promise<Achievement> {
    try {
      const created = await this.prisma.achievement.create({
        data: {
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          tier: achievement.tier,
          moduleId: achievement.moduleId,
          conditions: achievement.conditions as any,
          xpReward: achievement.xpReward
        }
      });

      return {
        id: created.id,
        name: created.name,
        description: created.description,
        icon: created.icon,
        tier: created.tier as any,
        conditions: created.conditions as any,
        xpReward: created.xpReward
      };
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to create achievement',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Update an achievement
   */
  async updateAchievement(
    achievementId: string, 
    updates: Partial<Omit<Achievement, 'id'>>
  ): Promise<Achievement> {
    try {
      const updated = await this.prisma.achievement.update({
        where: { id: achievementId },
        data: {
          ...(updates.name && { name: updates.name }),
          ...(updates.description && { description: updates.description }),
          ...(updates.icon && { icon: updates.icon }),
          ...(updates.tier && { tier: updates.tier }),
          ...(updates.conditions && { conditions: updates.conditions as any }),
          ...(updates.xpReward !== undefined && { xpReward: updates.xpReward })
        }
      });

      return {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        icon: updated.icon,
        tier: updated.tier as any,
        conditions: updated.conditions as any,
        xpReward: updated.xpReward
      };
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to update achievement',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Delete an achievement
   */
  async deleteAchievement(achievementId: string): Promise<void> {
    try {
      await this.prisma.achievement.delete({
        where: { id: achievementId }
      });
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to delete achievement',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get leaderboard for achievements
   */
  async getAchievementLeaderboard(limit: number = 10): Promise<{
    userId: string;
    userName: string;
    achievementCount: number;
    totalXP: number;
    rank: number;
  }[]> {
    try {
      // This would need a more complex query in production
      // For now, we'll return a placeholder implementation
      const users = await this.prisma.user.findMany({
        include: {
          userAchievements: {
            where: { isCompleted: true },
            include: { achievement: true }
          }
        },
        take: limit
      });

      return users
        .map(user => ({
          userId: user.id,
          userName: user.name || user.email,
          achievementCount: user.userAchievements.length,
          totalXP: user.userAchievements.reduce((sum, ua) => sum + ua.achievement.xpReward, 0),
          rank: 0 // Will be set after sorting
        }))
        .sort((a, b) => b.achievementCount - a.achievementCount || b.totalXP - a.totalXP)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to get achievement leaderboard',
        details: error,
        timestamp: new Date()
      });
    }
  }

  // Private helper methods

  private async awardAchievement(userId: string, achievementId: string, xpReward: number): Promise<void> {
    // Award XP to user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totalXp: { increment: xpReward }
      }
    });

    // Create XP transaction record (if you have this table)
    // await this.prisma.xpTransaction.create({
    //   data: {
    //     userId,
    //     amount: xpReward,
    //     reason: `Achievement unlocked: ${achievementId}`,
    //     source: 'achievement',
    //     metadata: { achievementId }
    //   }
    // });
  }

  private async getUserDataForAchievement(userId: string, achievementId: string): Promise<any> {
    // This would fetch relevant user data based on achievement requirements
    // For now, return basic user data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        goals: true,
        progress: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      totalGoals: user.goals.length,
      completedGoals: user.goals.filter(g => g.isCompleted).length,
      totalProgress: user.progress.length,
      streakCount: user.streakCount,
      totalXp: user.totalXp,
      currentLevel: user.currentLevel
    };
  }

  private async getModuleDataForUser(userId: string, moduleId: string): Promise<any> {
    // This would fetch module-specific user data
    // For now, return basic module-related data
    const goals = await this.prisma.goal.findMany({
      where: {
        userId,
        moduleId
      },
      include: {
        progress: true
      }
    });

    return {
      moduleGoals: goals.length,
      completedModuleGoals: goals.filter(g => g.isCompleted).length,
      moduleProgress: goals.flatMap(g => g.progress)
    };
  }
}