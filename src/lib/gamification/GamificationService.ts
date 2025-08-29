import { PrismaClient } from '@prisma/client';
import { AchievementManager } from './AchievementManager';
import { XPManager } from './XPManager';
import { 
  UserGamificationProfile, 
  ActivityEntry, 
  GamificationNotification,
  Achievement,
  UserLevel,
  StreakData
} from '../../types/gamification';
import { GoalDifficulty } from '../../types';
import { AppError, ErrorType } from '../../types';

/**
 * Main gamification service that coordinates all gamification features
 */
export class GamificationService {
  private prisma: PrismaClient;
  private achievementManager: AchievementManager;
  private xpManager: XPManager;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
    this.achievementManager = new AchievementManager(prismaClient);
    this.xpManager = new XPManager(prismaClient);
  }

  /**
   * Process a user action and handle all gamification aspects
   */
  async processAction(
    userId: string,
    action: string,
    moduleId?: string,
    difficulty: GoalDifficulty = 'medium',
    metadata?: Record<string, unknown>
  ): Promise<{
    xpAwarded: number;
    newLevel: UserLevel;
    leveledUp: boolean;
    achievementsUnlocked: Achievement[];
    streakUpdated: StreakData;
    notifications: GamificationNotification[];
  }> {
    try {
      // Update streak first
      const streakData = await this.xpManager.updateStreak(userId);

      // Award XP
      const xpResult = await this.xpManager.awardXP(
        userId,
        action,
        difficulty,
        streakData.currentStreak,
        metadata
      );

      // Check for achievements
      const newAchievements = await this.achievementManager.checkAchievements(
        userId,
        moduleId,
        action
      );

      // Generate notifications
      const notifications = await this.generateNotifications(
        userId,
        xpResult.leveledUp,
        newAchievements,
        streakData.currentStreak
      );

      // Create activity entry
      await this.createActivityEntry(
        userId,
        action,
        xpResult.xpAwarded,
        moduleId,
        metadata
      );

      return {
        xpAwarded: xpResult.xpAwarded,
        newLevel: xpResult.newLevel,
        leveledUp: xpResult.leveledUp,
        achievementsUnlocked: newAchievements,
        streakUpdated: streakData,
        notifications
      };
    } catch (error) {
      throw new AppError({
        type: ErrorType.MODULE_ERROR,
        message: 'Failed to process gamification action',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get complete user gamification profile
   */
  async getUserProfile(userId: string): Promise<UserGamificationProfile> {
    try {
      const [user, level, streak, achievements, stats] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId } }),
        this.xpManager.getUserLevel(userId),
        this.xpManager.getUserStreak(userId),
        this.achievementManager.getUserAchievements(userId),
        this.achievementManager.getAchievementStats(userId)
      ]);

      if (!user) {
        throw new Error('User not found');
      }

      return {
        userId,
        level,
        streak,
        achievements,
        unlockedRewards: [], // Would implement reward system
        activeChallenges: [], // Would implement challenge system
        preferences: {
          showPublicProfile: true,
          participateInLeaderboards: true,
          receiveAchievementNotifications: true,
          showStreakReminders: true
        },
        statistics: {
          totalGoalsCompleted: await this.getTotalGoalsCompleted(userId),
          totalActiveDays: await this.getTotalActiveDays(userId),
          favoriteModules: await this.getFavoriteModules(userId),
          averageDailyXP: await this.getAverageDailyXP(userId),
          peakStreak: streak.longestStreak
        }
      };
    } catch (error) {
      throw new AppError({
        type: ErrorType.MODULE_ERROR,
        message: 'Failed to get user profile',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get activity feed for a user
   */
  async getActivityFeed(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<ActivityEntry[]> {
    try {
      // This would query an activity feed table in a real implementation
      // For now, we'll return placeholder data based on recent achievements
      const recentAchievements = await this.prisma.userAchievement.findMany({
        where: { userId, isCompleted: true },
        include: { 
          achievement: true,
          user: true
        },
        orderBy: { unlockedAt: 'desc' },
        take: limit,
        skip: offset
      });

      return recentAchievements.map(ua => ({
        id: ua.id,
        userId: ua.userId,
        userName: ua.user.name || ua.user.email,
        userAvatar: undefined,
        type: 'achievement_unlocked',
        description: `Unlocked "${ua.achievement.name}" achievement`,
        xpEarned: ua.achievement.xpReward,
        moduleId: ua.achievement.moduleId || undefined,
        timestamp: ua.unlockedAt,
        data: { achievementId: ua.achievementId }
      }));
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to get activity feed',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get leaderboards
   */
  async getLeaderboards(type: 'xp' | 'level' | 'achievements', limit: number = 10): Promise<any[]> {
    try {
      switch (type) {
        case 'xp':
          return this.xpManager.getXPLeaderboard(limit);
        case 'level':
          return this.xpManager.getLevelLeaderboard(limit);
        case 'achievements':
          return this.achievementManager.getAchievementLeaderboard(limit);
        default:
          throw new Error(`Unknown leaderboard type: ${type}`);
      }
    } catch (error) {
      throw new AppError({
        type: ErrorType.MODULE_ERROR,
        message: 'Failed to get leaderboard',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    unreadOnly: boolean = false
  ): Promise<GamificationNotification[]> {
    try {
      // This would query a notifications table in a real implementation
      // For now, return empty array
      return [];
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to get notifications',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationRead(notificationId: string): Promise<void> {
    try {
      // This would update a notifications table in a real implementation
      console.log(`Marking notification ${notificationId} as read`);
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to mark notification as read',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get gamification statistics overview
   */
  async getOverviewStats(): Promise<{
    totalUsers: number;
    totalXPAwarded: number;
    totalAchievementsUnlocked: number;
    averageLevel: number;
    activeStreaks: number;
  }> {
    try {
      const [totalUsers, users, totalAchievements] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.findMany(),
        this.prisma.userAchievement.count({ where: { isCompleted: true } })
      ]);

      const totalXPAwarded = users.reduce((sum, user) => sum + user.totalXp, 0);
      const averageLevel = users.length > 0 
        ? users.reduce((sum, user) => sum + user.currentLevel, 0) / users.length 
        : 0;
      
      // Count active streaks (simplified)
      const activeStreaks = users.filter(user => user.streakCount > 0).length;

      return {
        totalUsers,
        totalXPAwarded,
        totalAchievementsUnlocked: totalAchievements,
        averageLevel: Math.round(averageLevel * 100) / 100,
        activeStreaks
      };
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to get overview statistics',
        details: error,
        timestamp: new Date()
      });
    }
  }

  // Expose sub-managers for direct access
  get achievements(): AchievementManager {
    return this.achievementManager;
  }

  get xp(): XPManager {
    return this.xpManager;
  }

  // Private helper methods

  private async generateNotifications(
    userId: string,
    leveledUp: boolean,
    newAchievements: Achievement[],
    streakCount: number
  ): Promise<GamificationNotification[]> {
    const notifications: GamificationNotification[] = [];

    if (leveledUp) {
      const level = await this.xpManager.getUserLevel(userId);
      notifications.push({
        id: `level_up_${userId}_${Date.now()}`,
        userId,
        type: 'level_up',
        title: 'Level Up!',
        message: `Congratulations! You've reached level ${level.currentLevel}!`,
        data: { newLevel: level.currentLevel },
        isRead: false,
        createdAt: new Date()
      });
    }

    for (const achievement of newAchievements) {
      notifications.push({
        id: `achievement_${userId}_${achievement.id}_${Date.now()}`,
        userId,
        type: 'achievement_unlocked',
        title: 'Achievement Unlocked!',
        message: `You've earned the "${achievement.name}" achievement!`,
        data: { achievement },
        isRead: false,
        createdAt: new Date()
      });
    }

    if (streakCount > 0 && streakCount % 7 === 0) { // Weekly streak milestones
      notifications.push({
        id: `streak_${userId}_${streakCount}_${Date.now()}`,
        userId,
        type: 'streak_milestone',
        title: 'Streak Milestone!',
        message: `Amazing! You've maintained a ${streakCount}-day streak!`,
        data: { streakCount },
        isRead: false,
        createdAt: new Date()
      });
    }

    return notifications;
  }

  private async createActivityEntry(
    userId: string,
    action: string,
    xpEarned: number,
    moduleId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    // This would create an entry in an activity feed table
    console.log(`Activity: User ${userId} performed ${action}, earned ${xpEarned} XP`);
  }

  private async getTotalGoalsCompleted(userId: string): Promise<number> {
    return this.prisma.goal.count({
      where: { userId, isCompleted: true }
    });
  }

  private async getTotalActiveDays(userId: string): Promise<number> {
    // This would require tracking daily activity
    // For now, return a placeholder based on streak
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return user ? user.streakCount : 0;
  }

  private async getFavoriteModules(userId: string): Promise<string[]> {
    // This would analyze user activity across modules
    const goals = await this.prisma.goal.findMany({
      where: { userId },
      select: { moduleId: true }
    });

    const moduleCounts = goals.reduce((acc, goal) => {
      acc[goal.moduleId] = (acc[goal.moduleId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(moduleCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([moduleId]) => moduleId);
  }

  private async getAverageDailyXP(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.createdAt) return 0;

    const daysSinceJoined = Math.max(1, Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    ));

    return Math.round((user.totalXp / daysSinceJoined) * 100) / 100;
  }
}