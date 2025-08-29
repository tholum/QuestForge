import { NextRequest } from 'next/server';
import { GET } from './route';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database client
vi.mock('@/lib/prisma/client', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    goal: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    progress: {
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
    userAchievement: {
      count: vi.fn(),
    },
  },
}));

// Mock auth middleware
vi.mock('@/lib/auth/middleware', () => ({
  authenticateRequest: vi.fn(),
}));

import { db } from '@/lib/prisma/client';
import { authenticateRequest } from '@/lib/auth/middleware';

const mockAuthenticateRequest = authenticateRequest as any;
const mockDb = db as any;

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
};

const mockGoals = [
  {
    id: 'goal-1',
    title: 'Morning Run',
    module: 'fitness',
    status: 'active',
    createdAt: new Date('2024-01-01'),
    targetValue: 30,
    currentValue: 15,
  },
  {
    id: 'goal-2',
    title: 'Read Books',
    module: 'learning',
    status: 'completed',
    createdAt: new Date('2024-01-02'),
    targetValue: 12,
    currentValue: 12,
  },
  {
    id: 'goal-3',
    title: 'Project Work',
    module: 'work',
    status: 'active',
    createdAt: new Date('2024-01-03'),
    targetValue: 100,
    currentValue: 75,
  },
];

const mockProgress = [
  {
    id: 'progress-1',
    goalId: 'goal-1',
    value: 3,
    xpEarned: 25,
    recordedAt: new Date('2024-01-10'),
    goal: mockGoals[0],
  },
  {
    id: 'progress-2',
    goalId: 'goal-2',
    value: 50,
    xpEarned: 40,
    recordedAt: new Date('2024-01-11'),
    goal: mockGoals[1],
  },
  {
    id: 'progress-3',
    goalId: 'goal-3',
    value: 8,
    xpEarned: 60,
    recordedAt: new Date('2024-01-12'),
    goal: mockGoals[2],
  },
];

describe('/api/v1/analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/analytics', () => {
    it('returns analytics data successfully for default period (month)', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.goal.findMany.mockResolvedValue(mockGoals);
      mockDb.goal.count
        .mockResolvedValueOnce(3) // total goals
        .mockResolvedValueOnce(1); // completed goals
      
      mockDb.progress.findMany.mockResolvedValue(mockProgress);
      mockDb.progress.aggregate.mockResolvedValue({
        _sum: { xpEarned: 125 },
        _count: { id: 3 },
      });
      mockDb.userAchievement.count.mockResolvedValue(5);

      const request = new NextRequest('http://localhost:3000/api/v1/analytics');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        totalGoals: 3,
        completedGoals: 1,
        totalProgress: 3,
        xpEarned: 125,
        currentStreak: expect.any(Number),
        bestStreak: expect.any(Number),
        averageProgress: expect.any(Number),
        totalActiveTime: expect.any(Number),
      });

      expect(data.summary).toMatchObject({
        totalGoals: 3,
        completedGoals: 1,
        completionRate: expect.any(Number),
        totalXpEarned: 125,
        currentStreak: expect.any(Number),
        currentLevel: expect.any(Number),
      });

      expect(data.moduleBreakdown).toBeInstanceOf(Array);
      expect(data.timeline).toBeInstanceOf(Array);
    });

    it('accepts and processes period parameter (week)', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.goal.findMany.mockResolvedValue(mockGoals);
      mockDb.goal.count.mockResolvedValue(2);
      mockDb.progress.findMany.mockResolvedValue(mockProgress.slice(0, 2));
      mockDb.progress.aggregate.mockResolvedValue({
        _sum: { xpEarned: 65 },
        _count: { id: 2 },
      });
      mockDb.userAchievement.count.mockResolvedValue(3);

      const request = new NextRequest('http://localhost:3000/api/v1/analytics?period=week');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.xpEarned).toBe(65);
      expect(data.data.totalProgress).toBe(2);
    });

    it('accepts and processes moduleId parameter', async () => {
      const fitnessGoals = mockGoals.filter(g => g.module === 'fitness');
      const fitnessProgress = mockProgress.filter(p => p.goal.module === 'fitness');

      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.goal.findMany.mockResolvedValue(fitnessGoals);
      mockDb.goal.count.mockResolvedValue(1);
      mockDb.progress.findMany.mockResolvedValue(fitnessProgress);
      mockDb.progress.aggregate.mockResolvedValue({
        _sum: { xpEarned: 25 },
        _count: { id: 1 },
      });
      mockDb.userAchievement.count.mockResolvedValue(2);

      const request = new NextRequest('http://localhost:3000/api/v1/analytics?moduleId=fitness');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.totalGoals).toBe(1);
      expect(data.data.xpEarned).toBe(25);
      
      // Should only include fitness module in breakdown
      expect(data.moduleBreakdown).toHaveLength(1);
      expect(data.moduleBreakdown[0].moduleId).toBe('fitness');
    });

    it('handles multiple query parameters correctly', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.goal.findMany.mockResolvedValue([]);
      mockDb.goal.count.mockResolvedValue(0);
      mockDb.progress.findMany.mockResolvedValue([]);
      mockDb.progress.aggregate.mockResolvedValue({
        _sum: { xpEarned: 0 },
        _count: { id: 0 },
      });
      mockDb.userAchievement.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/v1/analytics?period=quarter&moduleId=learning');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('calculates module breakdown correctly', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.goal.findMany.mockResolvedValue(mockGoals);
      mockDb.goal.count.mockResolvedValue(3);
      mockDb.progress.findMany.mockResolvedValue(mockProgress);
      mockDb.progress.aggregate.mockResolvedValue({
        _sum: { xpEarned: 125 },
        _count: { id: 3 },
      });
      mockDb.userAchievement.count.mockResolvedValue(5);

      const request = new NextRequest('http://localhost:3000/api/v1/analytics');
      const response = await GET(request);
      
      const data = await response.json();
      
      expect(data.moduleBreakdown).toHaveLength(3);
      
      const fitnessModule = data.moduleBreakdown.find((m: any) => m.moduleId === 'fitness');
      expect(fitnessModule).toMatchObject({
        moduleId: 'fitness',
        moduleName: 'Fitness',
        totalGoals: 1,
        completedGoals: 0,
        xpEarned: 25,
      });
    });

    it('generates timeline data correctly', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.goal.findMany.mockResolvedValue(mockGoals);
      mockDb.goal.count.mockResolvedValue(3);
      mockDb.progress.findMany.mockResolvedValue(mockProgress);
      mockDb.progress.aggregate.mockResolvedValue({
        _sum: { xpEarned: 125 },
        _count: { id: 3 },
      });
      mockDb.userAchievement.count.mockResolvedValue(5);

      const request = new NextRequest('http://localhost:3000/api/v1/analytics');
      const response = await GET(request);
      
      const data = await response.json();
      
      expect(data.timeline).toBeInstanceOf(Array);
      expect(data.timeline.length).toBeGreaterThan(0);
      
      const firstEntry = data.timeline[0];
      expect(firstEntry).toHaveProperty('date');
      expect(firstEntry).toHaveProperty('progress');
      expect(firstEntry).toHaveProperty('xp');
      expect(firstEntry).toHaveProperty('displayDate');
    });

    it('calculates trends correctly', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      
      // Mock data for trend calculation - current period vs previous period
      mockDb.goal.findMany
        .mockResolvedValueOnce(mockGoals) // Current period
        .mockResolvedValueOnce(mockGoals.slice(0, 2)); // Previous period
      
      mockDb.goal.count
        .mockResolvedValueOnce(3) // Current total
        .mockResolvedValueOnce(1) // Current completed
        .mockResolvedValueOnce(2) // Previous total
        .mockResolvedValueOnce(0); // Previous completed
      
      mockDb.progress.findMany.mockResolvedValue(mockProgress);
      mockDb.progress.aggregate.mockResolvedValue({
        _sum: { xpEarned: 125 },
        _count: { id: 3 },
      });
      mockDb.userAchievement.count.mockResolvedValue(5);

      const request = new NextRequest('http://localhost:3000/api/v1/analytics');
      const response = await GET(request);
      
      const data = await response.json();
      
      expect(data.trends).toMatchObject({
        goalsTrend: expect.any(Number),
        completionTrend: expect.any(Number),
      });
    });

    it('handles empty data gracefully', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.goal.findMany.mockResolvedValue([]);
      mockDb.goal.count.mockResolvedValue(0);
      mockDb.progress.findMany.mockResolvedValue([]);
      mockDb.progress.aggregate.mockResolvedValue({
        _sum: { xpEarned: 0 },
        _count: { id: 0 },
      });
      mockDb.userAchievement.count.mockResolvedValue(0);

      const request = new NextRequest('http://localhost:3000/api/v1/analytics');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.totalGoals).toBe(0);
      expect(data.data.xpEarned).toBe(0);
      expect(data.moduleBreakdown).toHaveLength(0);
      expect(data.timeline).toHaveLength(0);
    });

    it('validates period parameter', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);

      const request = new NextRequest('http://localhost:3000/api/v1/analytics?period=invalid');
      const response = await GET(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Invalid period. Must be one of: week, month, quarter, year');
    });

    it('returns 401 when user is not authenticated', async () => {
      mockAuthenticateRequest.mockRejectedValue(new Error('Unauthorized'));

      const request = new NextRequest('http://localhost:3000/api/v1/analytics');
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Authentication required');
    });

    it('handles database errors gracefully', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.goal.findMany.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/v1/analytics');
      const response = await GET(request);
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toBe('Failed to retrieve analytics data');
    });

    it('calculates current level correctly based on XP', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.goal.findMany.mockResolvedValue(mockGoals);
      mockDb.goal.count.mockResolvedValue(3);
      mockDb.progress.findMany.mockResolvedValue(mockProgress);
      mockDb.progress.aggregate.mockResolvedValue({
        _sum: { xpEarned: 2500 }, // High XP for level testing
        _count: { id: 3 },
      });
      mockDb.userAchievement.count.mockResolvedValue(8);

      const request = new NextRequest('http://localhost:3000/api/v1/analytics');
      const response = await GET(request);
      
      const data = await response.json();
      
      // Level should be calculated based on XP thresholds
      expect(data.summary.currentLevel).toBeGreaterThan(1);
      expect(data.summary.totalXpEarned).toBe(2500);
    });

    it('calculates completion rate correctly', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.goal.findMany.mockResolvedValue(mockGoals);
      mockDb.goal.count
        .mockResolvedValueOnce(10) // total goals
        .mockResolvedValueOnce(7); // completed goals
      
      mockDb.progress.findMany.mockResolvedValue(mockProgress);
      mockDb.progress.aggregate.mockResolvedValue({
        _sum: { xpEarned: 125 },
        _count: { id: 3 },
      });
      mockDb.userAchievement.count.mockResolvedValue(5);

      const request = new NextRequest('http://localhost:3000/api/v1/analytics');
      const response = await GET(request);
      
      const data = await response.json();
      
      expect(data.summary.completionRate).toBe(70); // 7/10 * 100
    });

    it('handles streak calculations', async () => {
      const streakProgress = [
        { ...mockProgress[0], recordedAt: new Date('2024-01-10') },
        { ...mockProgress[1], recordedAt: new Date('2024-01-11') },
        { ...mockProgress[2], recordedAt: new Date('2024-01-12') },
      ];

      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.goal.findMany.mockResolvedValue(mockGoals);
      mockDb.goal.count.mockResolvedValue(3);
      mockDb.progress.findMany.mockResolvedValue(streakProgress);
      mockDb.progress.aggregate.mockResolvedValue({
        _sum: { xpEarned: 125 },
        _count: { id: 3 },
      });
      mockDb.userAchievement.count.mockResolvedValue(5);

      const request = new NextRequest('http://localhost:3000/api/v1/analytics');
      const response = await GET(request);
      
      const data = await response.json();
      
      expect(data.data.currentStreak).toBeGreaterThanOrEqual(0);
      expect(data.data.bestStreak).toBeGreaterThanOrEqual(data.data.currentStreak);
    });

    it('includes cached flag when appropriate', async () => {
      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.goal.findMany.mockResolvedValue(mockGoals);
      mockDb.goal.count.mockResolvedValue(3);
      mockDb.progress.findMany.mockResolvedValue(mockProgress);
      mockDb.progress.aggregate.mockResolvedValue({
        _sum: { xpEarned: 125 },
        _count: { id: 3 },
      });
      mockDb.userAchievement.count.mockResolvedValue(5);

      const request = new NextRequest('http://localhost:3000/api/v1/analytics');
      const response = await GET(request);
      
      const data = await response.json();
      
      expect(data).toHaveProperty('cached');
      expect(typeof data.cached).toBe('boolean');
    });

    it('handles large datasets efficiently', async () => {
      // Create large mock datasets
      const largeGoalSet = Array.from({ length: 100 }, (_, i) => ({
        ...mockGoals[0],
        id: `goal-${i}`,
        title: `Goal ${i}`,
      }));

      const largeProgressSet = Array.from({ length: 1000 }, (_, i) => ({
        ...mockProgress[0],
        id: `progress-${i}`,
        recordedAt: new Date(Date.now() - i * 86400000), // Spread over days
      }));

      mockAuthenticateRequest.mockResolvedValue(mockUser);
      mockDb.goal.findMany.mockResolvedValue(largeGoalSet);
      mockDb.goal.count.mockResolvedValue(100);
      mockDb.progress.findMany.mockResolvedValue(largeProgressSet);
      mockDb.progress.aggregate.mockResolvedValue({
        _sum: { xpEarned: 25000 },
        _count: { id: 1000 },
      });
      mockDb.userAchievement.count.mockResolvedValue(50);

      const start = Date.now();
      const request = new NextRequest('http://localhost:3000/api/v1/analytics');
      const response = await GET(request);
      const duration = Date.now() - start;
      
      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.totalGoals).toBe(100);
    });
  });
});