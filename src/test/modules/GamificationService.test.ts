import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GamificationService } from '../../lib/gamification/GamificationService';
import { XPManager } from '../../lib/gamification/XPManager';
import { AchievementManager } from '../../lib/gamification/AchievementManager';

// Mock Prisma client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  userAchievement: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  achievement: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  goal: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  progress: {
    findMany: vi.fn(),
  },
} as any;

describe('GamificationService', () => {
  let service: GamificationService;

  beforeEach(() => {
    service = new GamificationService(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('processAction', () => {
    beforeEach(() => {
      // Mock user data
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        totalXp: 100,
        currentLevel: 2,
        streakCount: 5,
        lastActivity: new Date('2023-01-01'),
      });

      mockPrisma.user.update.mockResolvedValue({
        id: 'user1',
        totalXp: 150,
        currentLevel: 2,
        streakCount: 6,
      });

      mockPrisma.userAchievement.findMany.mockResolvedValue([]);
      mockPrisma.achievement.findMany.mockResolvedValue([]);
    });

    it('should process a user action and award XP', async () => {
      const result = await service.processAction('user1', 'complete_goal', 'fitness', 'medium');

      expect(result.xpAwarded).toBeGreaterThan(0);
      expect(result.newLevel).toBeDefined();
      expect(result.streakUpdated).toBeDefined();
      expect(result.achievementsUnlocked).toBeDefined();
      expect(result.notifications).toBeDefined();
    });

    it('should update streak when processing action', async () => {
      await service.processAction('user1', 'complete_goal', 'fitness', 'medium');

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user1' },
          data: expect.objectContaining({
            streakCount: expect.any(Number),
            lastActivity: expect.any(Date),
          }),
        })
      );
    });

    it('should check for achievements when processing action', async () => {
      mockPrisma.achievement.findMany.mockResolvedValue([
        {
          id: 'achievement1',
          name: 'Test Achievement',
          description: 'Test',
          icon: 'trophy',
          tier: 'bronze',
          xpReward: 50,
          conditions: { type: 'count', target: 1, field: 'goalsCompleted' },
        },
      ]);

      const result = await service.processAction('user1', 'complete_goal', 'fitness', 'medium');

      expect(mockPrisma.achievement.findMany).toHaveBeenCalled();
      expect(result.achievementsUnlocked).toBeDefined();
    });
  });

  describe('getUserProfile', () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        name: 'Test User',
        email: 'test@example.com',
        totalXp: 500,
        currentLevel: 5,
        streakCount: 10,
        lastActivity: new Date(),
        createdAt: new Date('2023-01-01'),
      });

      mockPrisma.userAchievement.findMany.mockResolvedValue([]);
      mockPrisma.goal.count.mockResolvedValue(25);
      mockPrisma.goal.findMany.mockResolvedValue([]);
    });

    it('should return complete user profile', async () => {
      const profile = await service.getUserProfile('user1');

      expect(profile.userId).toBe('user1');
      expect(profile.level).toBeDefined();
      expect(profile.streak).toBeDefined();
      expect(profile.achievements).toBeDefined();
      expect(profile.statistics).toBeDefined();
      expect(profile.preferences).toBeDefined();
    });

    it('should include user level information', async () => {
      const profile = await service.getUserProfile('user1');

      expect(profile.level.currentLevel).toBe(5);
      expect(profile.level.totalXP).toBe(500);
      expect(profile.level.progressToNextLevel).toBeDefined();
    });

    it('should include streak information', async () => {
      const profile = await service.getUserProfile('user1');

      expect(profile.streak.currentStreak).toBe(10);
      expect(profile.streak.isActive).toBeDefined();
    });
  });

  describe('getLeaderboards', () => {
    beforeEach(() => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: 'user1',
          name: 'User 1',
          email: 'user1@example.com',
          totalXp: 1000,
          currentLevel: 8,
        },
        {
          id: 'user2',
          name: 'User 2',
          email: 'user2@example.com',
          totalXp: 800,
          currentLevel: 7,
        },
      ]);

      mockPrisma.userAchievement.count.mockResolvedValue(15);
    });

    it('should return XP leaderboard', async () => {
      const leaderboard = await service.getLeaderboards('xp', 10);

      expect(leaderboard).toBeDefined();
      expect(Array.isArray(leaderboard)).toBe(true);
      expect(leaderboard[0].totalXP).toBeGreaterThanOrEqual(leaderboard[1]?.totalXP || 0);
    });

    it('should return level leaderboard', async () => {
      const leaderboard = await service.getLeaderboards('level', 10);

      expect(leaderboard).toBeDefined();
      expect(Array.isArray(leaderboard)).toBe(true);
      expect(leaderboard[0].currentLevel).toBeGreaterThanOrEqual(leaderboard[1]?.currentLevel || 0);
    });

    it('should limit results correctly', async () => {
      const leaderboard = await service.getLeaderboards('xp', 5);

      expect(leaderboard.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getActivityFeed', () => {
    beforeEach(() => {
      mockPrisma.userAchievement.findMany.mockResolvedValue([
        {
          id: 'ua1',
          userId: 'user1',
          achievementId: 'achievement1',
          unlockedAt: new Date(),
          user: { name: 'Test User', email: 'test@example.com' },
          achievement: {
            id: 'achievement1',
            name: 'First Goal',
            xpReward: 50,
            moduleId: 'fitness',
          },
        },
      ]);
    });

    it('should return activity feed', async () => {
      const feed = await service.getActivityFeed('user1', 20);

      expect(feed).toBeDefined();
      expect(Array.isArray(feed)).toBe(true);
      expect(feed.length).toBeGreaterThan(0);
    });

    it('should format activity entries correctly', async () => {
      const feed = await service.getActivityFeed('user1', 20);

      const entry = feed[0];
      expect(entry.id).toBeDefined();
      expect(entry.userId).toBe('user1');
      expect(entry.type).toBe('achievement_unlocked');
      expect(entry.description).toContain('First Goal');
      expect(entry.xpEarned).toBe(50);
    });

    it('should respect limit parameter', async () => {
      const feed = await service.getActivityFeed('user1', 5);

      expect(feed.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getOverviewStats', () => {
    beforeEach(() => {
      mockPrisma.user.count.mockResolvedValue(100);
      mockPrisma.user.findMany.mockResolvedValue([
        { totalXp: 500, currentLevel: 5, streakCount: 3 },
        { totalXp: 300, currentLevel: 3, streakCount: 0 },
        { totalXp: 800, currentLevel: 7, streakCount: 10 },
      ]);
      mockPrisma.userAchievement.count.mockResolvedValue(150);
    });

    it('should return overview statistics', async () => {
      const stats = await service.getOverviewStats();

      expect(stats.totalUsers).toBe(100);
      expect(stats.totalXPAwarded).toBe(1600);
      expect(stats.totalAchievementsUnlocked).toBe(150);
      expect(stats.averageLevel).toBe(5);
      expect(stats.activeStreaks).toBe(2);
    });

    it('should calculate averages correctly', async () => {
      const stats = await service.getOverviewStats();

      expect(stats.averageLevel).toBeCloseTo(5, 1);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(service.getUserProfile('user1')).rejects.toThrow();
    });

    it('should handle missing user gracefully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserProfile('nonexistent')).rejects.toThrow('User not found');
    });
  });
});

describe('XPManager', () => {
  let xpManager: XPManager;

  beforeEach(() => {
    xpManager = new XPManager(mockPrisma);
    vi.clearAllMocks();
  });

  describe('awardXP', () => {
    beforeEach(() => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        totalXp: 100,
        currentLevel: 2,
      });

      mockPrisma.user.update.mockResolvedValue({
        id: 'user1',
        totalXp: 150,
        currentLevel: 2,
      });
    });

    it('should award XP for known actions', async () => {
      const result = await xpManager.awardXP('user1', 'complete_goal', 'medium', 5);

      expect(result.xpAwarded).toBeGreaterThan(0);
      expect(result.newLevel).toBeDefined();
    });

    it('should apply difficulty multipliers', async () => {
      const easyResult = await xpManager.awardXP('user1', 'complete_goal', 'easy', 0);
      
      // Reset mock
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        totalXp: 100,
        currentLevel: 2,
      });
      
      const hardResult = await xpManager.awardXP('user1', 'complete_goal', 'hard', 0);

      expect(hardResult.xpAwarded).toBeGreaterThan(easyResult.xpAwarded);
    });

    it('should apply streak bonuses', async () => {
      const noStreakResult = await xpManager.awardXP('user1', 'complete_goal', 'medium', 0);
      
      // Reset mock
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        totalXp: 100,
        currentLevel: 2,
      });
      
      const streakResult = await xpManager.awardXP('user1', 'complete_goal', 'medium', 10);

      expect(streakResult.xpAwarded).toBeGreaterThan(noStreakResult.xpAwarded);
    });

    it('should detect level ups', async () => {
      // Mock user close to leveling up
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        totalXp: 95,
        currentLevel: 1,
      });

      mockPrisma.user.update.mockResolvedValue({
        id: 'user1',
        totalXp: 105,
        currentLevel: 2,
      });

      const result = await xpManager.awardXP('user1', 'complete_goal', 'medium', 0);

      expect(result.leveledUp).toBe(true);
    });
  });

  describe('calculateLevel', () => {
    it('should calculate correct level for XP amounts', () => {
      const level1 = xpManager.calculateLevel(50);
      const level2 = xpManager.calculateLevel(150);
      const level3 = xpManager.calculateLevel(300);

      expect(level1.currentLevel).toBe(1);
      expect(level2.currentLevel).toBe(2);
      expect(level3.currentLevel).toBe(3);
    });

    it('should calculate progress to next level', () => {
      const level = xpManager.calculateLevel(150);

      expect(level.progressToNextLevel).toBeGreaterThan(0);
      expect(level.progressToNextLevel).toBeLessThanOrEqual(1);
    });
  });
});

describe('AchievementManager', () => {
  let achievementManager: AchievementManager;

  beforeEach(() => {
    achievementManager = new AchievementManager(mockPrisma);
    vi.clearAllMocks();
  });

  describe('checkAchievements', () => {
    beforeEach(() => {
      mockPrisma.userAchievement.findMany.mockResolvedValue([]);
      mockPrisma.achievement.findMany.mockResolvedValue([
        {
          id: 'achievement1',
          name: 'First Goal',
          description: 'Complete your first goal',
          icon: 'trophy',
          tier: 'bronze',
          xpReward: 50,
          conditions: { type: 'count', target: 1, field: 'goalsCompleted' },
        },
      ]);

      // Mock user data for achievement checking
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        goals: [{ isCompleted: true }],
        progress: [],
        streakCount: 5,
        totalXp: 100,
        currentLevel: 2,
      });

      mockPrisma.goal.findMany.mockResolvedValue([]);
    });

    it('should check and unlock new achievements', async () => {
      mockPrisma.userAchievement.create.mockResolvedValue({
        id: 'ua1',
        userId: 'user1',
        achievementId: 'achievement1',
        progress: 1,
        isCompleted: true,
        unlockedAt: new Date(),
        achievement: {
          id: 'achievement1',
          name: 'First Goal',
          xpReward: 50,
        },
      });

      const achievements = await achievementManager.checkAchievements('user1');

      expect(achievements.length).toBe(1);
      expect(achievements[0].id).toBe('achievement1');
      expect(mockPrisma.userAchievement.create).toHaveBeenCalled();
    });

    it('should update existing achievement progress', async () => {
      mockPrisma.userAchievement.findMany.mockResolvedValue([
        {
          id: 'ua1',
          userId: 'user1',
          achievementId: 'achievement1',
          progress: 0.5,
          isCompleted: false,
        },
      ]);

      mockPrisma.userAchievement.update.mockResolvedValue({
        id: 'ua1',
        progress: 1,
        isCompleted: true,
        achievement: {
          id: 'achievement1',
          name: 'First Goal',
          xpReward: 50,
        },
      });

      const achievements = await achievementManager.checkAchievements('user1');

      expect(mockPrisma.userAchievement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ua1' },
          data: expect.objectContaining({
            progress: 1,
            isCompleted: true,
          }),
        })
      );
    });
  });

  describe('createAchievement', () => {
    it('should create new achievement', async () => {
      const achievementData = {
        name: 'New Achievement',
        description: 'A test achievement',
        icon: 'star',
        tier: 'silver' as const,
        conditions: { type: 'count' as const, target: 5, field: 'tasks' },
        xpReward: 100,
      };

      mockPrisma.achievement.create.mockResolvedValue({
        id: 'new_achievement',
        ...achievementData,
      });

      const achievement = await achievementManager.createAchievement(achievementData);

      expect(achievement.name).toBe('New Achievement');
      expect(mockPrisma.achievement.create).toHaveBeenCalled();
    });
  });
});