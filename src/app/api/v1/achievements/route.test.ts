import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database client
vi.mock('@/lib/prisma/client', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    achievement: {
      findMany: vi.fn(),
    },
    userAchievement: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    progress: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    goal: {
      count: vi.fn(),
    },
  },
}));

// Mock auth middleware
vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn(),
}));

// Mock achievement manager
vi.mock('@/lib/gamification/AchievementManager', () => ({
  AchievementManager: {
    getInstance: vi.fn(() => ({
      checkAndUnlockAchievements: vi.fn(),
      getAchievementProgress: vi.fn(),
      calculateNextAchievement: vi.fn(),
    })),
  },
}));

import { db } from '@/lib/prisma/client';
import { authenticateRequest } from '@/lib/auth/middleware';
import { AchievementManager } from '@/lib/gamification/AchievementManager';

const mockAuthenticateRequest = authenticateRequest as any;
const mockDb = db as any;
const mockAchievementManager = AchievementManager.getInstance() as any;

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
};

const mockAchievements = [
  {
    id: 'achievement-1',
    name: 'First Steps',
    description: 'Create your first goal',
    category: 'general',
    tier: 'bronze',
    icon: 'trophy',
    xpReward: 100,
    criteria: { goalCount: 1 },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'achievement-2',
    name: 'Goal Crusher',
    description: 'Complete 10 goals',
    category: 'goals',
    tier: 'silver',
    icon: 'target',
    xpReward: 250,
    criteria: { completedGoals: 10 },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'achievement-3',
    name: 'Streak Master',
    description: 'Maintain a 30-day streak',
    category: 'streaks',
    tier: 'gold',
    icon: 'flame',
    xpReward: 500,
    criteria: { streakDays: 30 },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockUnlockedAchievements = [
  {
    id: 'user-achievement-1',
    userId: 'user-1',
    achievementId: 'achievement-1',
    unlockedAt: new Date('2024-01-10'),
    xpEarned: 100,
    achievement: mockAchievements[0],
  },
];

const mockProgressData = [
  { goalId: 'goal-1', recordedAt: new Date('2024-01-10') },
  { goalId: 'goal-2', recordedAt: new Date('2024-01-11') },
  { goalId: 'goal-3', recordedAt: new Date('2024-01-12') },
];

describe('/api/v1/achievements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/achievements', () => {
    it('returns all achievements with unlock status', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.achievement.findMany.mockResolvedValue(mockAchievements);
      mockDb.userAchievement.findMany.mockResolvedValue(mockUnlockedAchievements);
      mockAchievementManager.getAchievementProgress.mockResolvedValue({
        current: 5,
        required: 10,
        percentage: 50,
      });

      const request = new NextRequest('http://localhost:3000/api/v1/achievements');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.achievements).toHaveLength(3);
      
      // First achievement should be unlocked
      const firstAchievement = data.achievements.find((a: any) => a.id === 'achievement-1');
      expect(firstAchievement.unlocked).toBe(true);
      expect(firstAchievement.unlockedAt).toBeDefined();
      expect(firstAchievement.xpEarned).toBe(100);
      
      // Second achievement should be locked with progress
      const secondAchievement = data.achievements.find((a: any) => a.id === 'achievement-2');
      expect(secondAchievement.unlocked).toBe(false);
      expect(secondAchievement.progress).toMatchObject({
        current: 5,
        required: 10,
        percentage: 50,
      });
    });

    it('filters achievements by category', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.achievement.findMany.mockResolvedValue(
        mockAchievements.filter(a => a.category === 'goals')
      );
      mockDb.userAchievement.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/v1/achievements?category=goals');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.achievements).toHaveLength(1);
      expect(data.achievements[0].category).toBe('goals');
    });

    it('filters achievements by tier', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.achievement.findMany.mockResolvedValue(
        mockAchievements.filter(a => a.tier === 'silver')
      );
      mockDb.userAchievement.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/v1/achievements?tier=silver');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.achievements).toHaveLength(1);
      expect(data.achievements[0].tier).toBe('silver');
    });

    it('returns only unlocked achievements when requested', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.achievement.findMany.mockResolvedValue(mockAchievements);
      mockDb.userAchievement.findMany.mockResolvedValue(mockUnlockedAchievements);

      const request = new NextRequest('http://localhost:3000/api/v1/achievements?unlocked=true');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.achievements).toHaveLength(1);
      expect(data.achievements[0].unlocked).toBe(true);
    });

    it('returns achievements statistics', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.achievement.findMany.mockResolvedValue(mockAchievements);
      mockDb.userAchievement.findMany.mockResolvedValue(mockUnlockedAchievements);
      mockAchievementManager.calculateNextAchievement.mockResolvedValue({
        id: 'achievement-2',
        name: 'Goal Crusher',
        description: 'Complete 10 goals',
        progressToNext: 50,
      });

      const request = new NextRequest('http://localhost:3000/api/v1/achievements');
      const response = await GET(request);
      
      const data = await response.json();
      
      expect(data.stats).toMatchObject({
        total: 3,
        unlocked: 1,
        progress: 2,
        totalXpEarned: 100,
        nextAchievement: {
          id: 'achievement-2',
          name: 'Goal Crusher',
          description: 'Complete 10 goals',
          progressToNext: 50,
        },
      });
    });

    it('returns recent unlocks', async () => {
      const recentUnlock = {
        ...mockUnlockedAchievements[0],
        unlockedAt: new Date(), // Recent unlock
      };

      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.achievement.findMany.mockResolvedValue(mockAchievements);
      mockDb.userAchievement.findMany.mockResolvedValue([recentUnlock]);

      const request = new NextRequest('http://localhost:3000/api/v1/achievements');
      const response = await GET(request);
      
      const data = await response.json();
      
      expect(data.recentUnlocks).toHaveLength(1);
      expect(data.recentUnlocks[0]).toMatchObject({
        id: 'achievement-1',
        name: 'First Steps',
        unlockedAt: expect.any(String),
        xpEarned: 100,
      });
    });

    it('calculates category breakdown', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.achievement.findMany.mockResolvedValue(mockAchievements);
      mockDb.userAchievement.findMany.mockResolvedValue(mockUnlockedAchievements);

      const request = new NextRequest('http://localhost:3000/api/v1/achievements');
      const response = await GET(request);
      
      const data = await response.json();
      
      expect(data.stats.categories).toMatchObject({
        general: { unlocked: 1, total: 1 },
        goals: { unlocked: 0, total: 1 },
        streaks: { unlocked: 0, total: 1 },
      });
    });

    it('calculates tier breakdown', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.achievement.findMany.mockResolvedValue(mockAchievements);
      mockDb.userAchievement.findMany.mockResolvedValue(mockUnlockedAchievements);

      const request = new NextRequest('http://localhost:3000/api/v1/achievements');
      const response = await GET(request);
      
      const data = await response.json();
      
      expect(data.stats.tiers).toMatchObject({
        bronze: { unlocked: 1, total: 1 },
        silver: { unlocked: 0, total: 1 },
        gold: { unlocked: 0, total: 1 },
      });
    });

    it('handles empty achievement data', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.achievement.findMany.mockResolvedValue([]);
      mockDb.userAchievement.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/v1/achievements');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.achievements).toHaveLength(0);
      expect(data.stats.total).toBe(0);
      expect(data.stats.unlocked).toBe(0);
      expect(data.recentUnlocks).toHaveLength(0);
    });

    it('returns 401 when user is not authenticated', async () => {
      mockAuthenticateRequest.mockRejectedValue(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost:3000/api/v1/achievements');
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Authentication required');
    });

    it('handles database errors gracefully', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.achievement.findMany.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/v1/achievements');
      const response = await GET(request);
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to retrieve achievements');
    });

    it('includes progress for locked achievements', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.achievement.findMany.mockResolvedValue(mockAchievements);
      mockDb.userAchievement.findMany.mockResolvedValue([]);
      
      // Mock progress for different achievements
      mockAchievementManager.getAchievementProgress
        .mockResolvedValueOnce({ current: 1, required: 1, percentage: 100 })
        .mockResolvedValueOnce({ current: 5, required: 10, percentage: 50 })
        .mockResolvedValueOnce({ current: 15, required: 30, percentage: 50 });

      const request = new NextRequest('http://localhost:3000/api/v1/achievements');
      const response = await GET(request);
      
      const data = await response.json();
      
      const goalCrusherAchievement = data.achievements.find((a: any) => a.name === 'Goal Crusher');
      expect(goalCrusherAchievement.progress).toMatchObject({
        current: 5,
        required: 10,
        percentage: 50,
      });
    });
  });

  describe('POST /api/v1/achievements', () => {
    it('claims achievement successfully', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.userAchievement.findFirst.mockResolvedValue(null); // Not already unlocked
      mockDb.achievement.findMany.mockResolvedValue([mockAchievements[1]]); // Achievement exists
      mockAchievementManager.getAchievementProgress.mockResolvedValue({
        current: 10,
        required: 10,
        percentage: 100,
      });
      mockDb.userAchievement.create.mockResolvedValue({
        id: 'user-achievement-2',
        userId: 'user-1',
        achievementId: 'achievement-2',
        unlockedAt: new Date(),
        xpEarned: 250,
      });

      const requestBody = {
        achievementId: 'achievement-2',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('Achievement claimed successfully');
      expect(data.xpEarned).toBe(250);
      
      expect(mockDb.userAchievement.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          achievementId: 'achievement-2',
          xpEarned: 250,
        },
      });
    });

    it('validates achievement exists', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.achievement.findMany.mockResolvedValue([]);

      const requestBody = {
        achievementId: 'nonexistent-achievement',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Achievement not found');
    });

    it('prevents claiming already unlocked achievement', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.userAchievement.findFirst.mockResolvedValue(mockUnlockedAchievements[0]);

      const requestBody = {
        achievementId: 'achievement-1',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Achievement already unlocked');
    });

    it('validates achievement criteria are met', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.userAchievement.findFirst.mockResolvedValue(null);
      mockDb.achievement.findMany.mockResolvedValue([mockAchievements[1]]);
      mockAchievementManager.getAchievementProgress.mockResolvedValue({
        current: 5,
        required: 10,
        percentage: 50,
      });

      const requestBody = {
        achievementId: 'achievement-2',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Achievement criteria not met');
    });

    it('validates request body', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);

      const requestBody = {}; // Missing achievementId

      const request = new NextRequest('http://localhost:3000/api/v1/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Achievement ID is required');
    });

    it('handles malformed JSON', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/v1/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid JSON format');
    });

    it('returns 401 when user is not authenticated', async () => {
      mockAuthenticateRequest.mockRejectedValue(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost:3000/api/v1/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievementId: 'achievement-1' }),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(401);
    });

    it('handles database errors during claim', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.userAchievement.findFirst.mockResolvedValue(null);
      mockDb.achievement.findMany.mockResolvedValue([mockAchievements[1]]);
      mockAchievementManager.getAchievementProgress.mockResolvedValue({
        current: 10,
        required: 10,
        percentage: 100,
      });
      mockDb.userAchievement.create.mockRejectedValue(new Error('Database error'));

      const requestBody = {
        achievementId: 'achievement-2',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to claim achievement');
    });

    it('triggers achievement check after successful claim', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.userAchievement.findFirst.mockResolvedValue(null);
      mockDb.achievement.findMany.mockResolvedValue([mockAchievements[1]]);
      mockAchievementManager.getAchievementProgress.mockResolvedValue({
        current: 10,
        required: 10,
        percentage: 100,
      });
      mockDb.userAchievement.create.mockResolvedValue({
        id: 'user-achievement-2',
        userId: 'user-1',
        achievementId: 'achievement-2',
        unlockedAt: new Date(),
        xpEarned: 250,
      });
      mockAchievementManager.checkAndUnlockAchievements.mockResolvedValue([]);

      const requestBody = {
        achievementId: 'achievement-2',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      
      // Should trigger achievement check to see if claiming this achievement unlocks others
      expect(mockAchievementManager.checkAndUnlockAchievements).toHaveBeenCalledWith('user-1');
    });

    it('returns additional unlocked achievements if triggered by claim', async () => {
      const bonusAchievement = {
        id: 'achievement-3',
        name: 'Achiever',
        description: 'Unlock 5 achievements',
        xpReward: 100,
      };

      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.userAchievement.findFirst.mockResolvedValue(null);
      mockDb.achievement.findMany.mockResolvedValue([mockAchievements[1]]);
      mockAchievementManager.getAchievementProgress.mockResolvedValue({
        current: 10,
        required: 10,
        percentage: 100,
      });
      mockDb.userAchievement.create.mockResolvedValue({
        id: 'user-achievement-2',
        userId: 'user-1',
        achievementId: 'achievement-2',
        unlockedAt: new Date(),
        xpEarned: 250,
      });
      mockAchievementManager.checkAndUnlockAchievements.mockResolvedValue([bonusAchievement]);

      const requestBody = {
        achievementId: 'achievement-2',
      };

      const request = new NextRequest('http://localhost:3000/api/v1/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.bonusAchievements).toHaveLength(1);
      expect(data.bonusAchievements[0].name).toBe('Achiever');
      expect(data.totalXpEarned).toBe(350); // 250 + 100
    });
  });
});