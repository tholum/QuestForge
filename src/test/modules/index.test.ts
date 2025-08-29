/**
 * Module system integration test suite
 * 
 * This file runs comprehensive integration tests that verify the entire
 * module system works together correctly.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ModuleRegistry } from '../../modules/core/ModuleRegistry';
import { ModuleStorage } from '../../modules/core/ModuleStorage';
import { GamificationService } from '../../lib/gamification/GamificationService';
import { 
  mockPrismaClient, 
  createTestModule, 
  createTestUser, 
  createTestAchievement,
  cleanup 
} from './setup';

describe('Module System Integration', () => {
  let registry: ModuleRegistry;
  let gamificationService: GamificationService;
  let storage: ModuleStorage;

  beforeEach(async () => {
    // Set up storage with mock Prisma
    storage = new ModuleStorage(mockPrismaClient as any);
    
    // Initialize registry
    registry = new ModuleRegistry(storage);
    
    // Initialize gamification service
    gamificationService = new GamificationService(mockPrismaClient as any);
    
    // Mock storage responses
    mockPrismaClient.module.findMany.mockResolvedValue([]);
    
    await registry.initialize();
  });

  afterEach(() => {
    cleanup();
  });

  describe('End-to-end module lifecycle', () => {
    it('should handle complete module lifecycle', async () => {
      const testModule = createTestModule('e2e_test');
      
      // Mock storage operations
      mockPrismaClient.module.create.mockResolvedValue({
        id: testModule.id,
        name: testModule.name,
        version: testModule.version,
        isEnabled: true,
        isInstalled: true,
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      mockPrismaClient.module.update.mockResolvedValue({});
      mockPrismaClient.module.delete.mockResolvedValue({});

      // 1. Register module
      const registerResult = await registry.register(testModule, { autoEnable: true });
      expect(registerResult.success).toBe(true);

      // 2. Verify module is registered and enabled
      const moduleData = registry.getModule(testModule.id);
      expect(moduleData).toBeDefined();
      expect(moduleData?.id).toBe(testModule.id);

      const state = registry.getModuleState(testModule.id);
      expect(state?.status).toBe('enabled');

      // 3. Update configuration
      const newConfig = { setting1: 'value1', setting2: 42 };
      const configResult = await registry.updateConfig(testModule.id, newConfig);
      expect(configResult.success).toBe(true);

      // 4. Disable module
      const disableResult = await registry.disable(testModule.id);
      expect(disableResult.success).toBe(true);

      // 5. Re-enable module
      const enableResult = await registry.enable(testModule.id);
      expect(enableResult.success).toBe(true);

      // 6. Unregister module
      const unregisterResult = await registry.unregister(testModule.id);
      expect(unregisterResult.success).toBe(true);

      // 7. Verify module is removed
      const removedModule = registry.getModule(testModule.id);
      expect(removedModule).toBeUndefined();
    });

    it('should handle module dependencies correctly', async () => {
      const baseModule = createTestModule('base_module');
      const dependentModule = createTestModule('dependent_module', {
        metadata: {
          ...createTestModule('dependent_module').metadata,
          dependencies: { 'base_module': '1.0.0' }
        }
      });

      // Mock storage operations
      mockPrismaClient.module.create.mockResolvedValue({
        id: 'mock',
        name: 'Mock',
        version: '1.0.0',
        isEnabled: false,
        isInstalled: true,
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Register base module first
      await registry.register(baseModule);
      await registry.enable(baseModule.id);

      // Register dependent module - should succeed
      const result = await registry.register(dependentModule);
      expect(result.success).toBe(true);

      // Try to disable base module - should fail due to dependency
      await registry.enable(dependentModule.id);
      const disableResult = await registry.disable(baseModule.id);
      expect(disableResult.success).toBe(false);
      expect(disableResult.error).toContain('dependent modules');
    });
  });

  describe('Gamification integration', () => {
    it('should process goal completion with XP and achievements', async () => {
      const testModule = createTestModule('gamification_test', {
        achievements: [createTestAchievement({
          id: 'first_goal',
          conditions: {
            type: 'count',
            target: 1,
            field: 'completedGoals'
          }
        })]
      });

      const testUser = createTestUser();

      // Mock user and achievement data
      mockPrismaClient.user.findUnique.mockResolvedValue(testUser);
      mockPrismaClient.user.update.mockResolvedValue({
        ...testUser,
        totalXp: testUser.totalXp + 15,
        streakCount: testUser.streakCount + 1,
      });

      mockPrismaClient.userAchievement.findMany.mockResolvedValue([]);
      mockPrismaClient.achievement.findMany.mockResolvedValue([
        createTestAchievement({
          id: 'first_goal',
          conditions: {
            type: 'count',
            target: 1,
            field: 'completedGoals'
          }
        })
      ]);

      mockPrismaClient.goal.findMany.mockResolvedValue([
        { isCompleted: true }
      ]);

      mockPrismaClient.userAchievement.create.mockResolvedValue({
        id: 'ua1',
        userId: testUser.id,
        achievementId: 'first_goal',
        progress: 1,
        isCompleted: true,
        unlockedAt: new Date(),
        achievement: createTestAchievement({ id: 'first_goal' })
      });

      // Process action
      const result = await gamificationService.processAction(
        testUser.id,
        'complete_goal',
        testModule.id,
        'medium'
      );

      expect(result.xpAwarded).toBeGreaterThan(0);
      expect(result.streakUpdated.currentStreak).toBeGreaterThan(0);
      expect(result.achievementsUnlocked.length).toBeGreaterThan(0);
    });

    it('should track user progress over time', async () => {
      const testUser = createTestUser();

      // Mock user data
      mockPrismaClient.user.findUnique.mockResolvedValue(testUser);
      mockPrismaClient.userAchievement.findMany.mockResolvedValue([
        {
          achievementId: 'test_achievement',
          currentValue: 5,
          targetValue: 10,
          progress: 0.5,
          isCompleted: false,
          unlockedAt: new Date(),
        }
      ]);

      mockPrismaClient.goal.count.mockResolvedValue(15);
      mockPrismaClient.goal.findMany.mockResolvedValue([]);

      const profile = await gamificationService.getUserProfile(testUser.id);

      expect(profile.userId).toBe(testUser.id);
      expect(profile.level.currentLevel).toBe(testUser.currentLevel);
      expect(profile.streak.currentStreak).toBe(testUser.streakCount);
      expect(profile.achievements.length).toBeGreaterThan(0);
      expect(profile.statistics.totalGoalsCompleted).toBe(15);
    });
  });

  describe('System statistics and monitoring', () => {
    it('should provide accurate system statistics', async () => {
      const modules = [
        createTestModule('stats_test_1'),
        createTestModule('stats_test_2'),
        createTestModule('stats_test_3')
      ];

      // Mock storage for multiple modules
      mockPrismaClient.module.create.mockResolvedValue({
        id: 'mock',
        name: 'Mock',
        version: '1.0.0',
        isEnabled: false,
        isInstalled: true,
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Register modules
      await registry.register(modules[0]);
      await registry.register(modules[1]);
      await registry.register(modules[2]);

      // Enable some modules
      await registry.enable(modules[0].id);
      await registry.enable(modules[1].id);

      const stats = registry.getStatistics();

      expect(stats.totalModules).toBe(3);
      expect(stats.enabledModules).toBe(2);
      expect(stats.disabledModules).toBe(1);
      expect(stats.modulesByStatus.enabled).toBe(2);
    });

    it('should provide gamification overview stats', async () => {
      // Mock gamification data
      mockPrismaClient.user.count.mockResolvedValue(50);
      mockPrismaClient.user.findMany.mockResolvedValue([
        { totalXp: 500, currentLevel: 5, streakCount: 3 },
        { totalXp: 300, currentLevel: 3, streakCount: 0 },
        { totalXp: 800, currentLevel: 7, streakCount: 10 },
      ]);
      mockPrismaClient.userAchievement.count.mockResolvedValue(75);

      const overviewStats = await gamificationService.getOverviewStats();

      expect(overviewStats.totalUsers).toBe(50);
      expect(overviewStats.totalXPAwarded).toBe(1600);
      expect(overviewStats.totalAchievementsUnlocked).toBe(75);
      expect(overviewStats.averageLevel).toBeCloseTo(5, 1);
      expect(overviewStats.activeStreaks).toBe(2);
    });
  });

  describe('Error handling and resilience', () => {
    it('should handle database connection failures gracefully', async () => {
      // Mock database failure
      mockPrismaClient.module.findMany.mockRejectedValue(new Error('Database connection failed'));

      const newStorage = new ModuleStorage(mockPrismaClient as any);
      
      await expect(newStorage.getInstalledModules()).rejects.toThrow();
    });

    it('should handle module validation failures', async () => {
      const invalidModule = createTestModule('invalid_module', {
        id: '', // Invalid ID
        version: 'invalid_version'
      });

      const result = await registry.register(invalidModule);

      expect(result.success).toBe(false);
      expect(result.error).toContain('validation failed');
    });

    it('should prevent circular dependencies', async () => {
      const moduleA = createTestModule('module_a', {
        metadata: {
          ...createTestModule('module_a').metadata,
          dependencies: { 'module_b': '1.0.0' }
        }
      });

      const moduleB = createTestModule('module_b', {
        metadata: {
          ...createTestModule('module_b').metadata,
          dependencies: { 'module_a': '1.0.0' }
        }
      });

      // Mock storage
      mockPrismaClient.module.create.mockResolvedValue({
        id: 'mock',
        name: 'Mock',
        version: '1.0.0',
        isEnabled: false,
        isInstalled: true,
        config: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Register first module
      const resultA = await registry.register(moduleA);
      expect(resultA.success).toBe(true);

      // Attempt to register second module - should fail due to circular dependency
      const resultB = await registry.register(moduleB);
      expect(resultB.success).toBe(false);
      expect(resultB.error).toContain('Circular dependency detected');
    });
  });
});

describe('Performance and Scalability', () => {
  it('should handle large numbers of modules efficiently', async () => {
    const storage = new ModuleStorage(mockPrismaClient as any);
    const registry = new ModuleRegistry(storage);

    // Mock empty initial state
    mockPrismaClient.module.findMany.mockResolvedValue([]);
    await registry.initialize();

    // Mock storage operations
    mockPrismaClient.module.create.mockResolvedValue({
      id: 'mock',
      name: 'Mock',
      version: '1.0.0',
      isEnabled: false,
      isInstalled: true,
      config: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const startTime = Date.now();
    
    // Register 100 modules
    const modules = Array.from({ length: 100 }, (_, i) => 
      createTestModule(`performance_test_${i}`)
    );

    await Promise.all(modules.map(module => registry.register(module)));

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete within reasonable time (adjust as needed)
    expect(duration).toBeLessThan(5000); // 5 seconds

    const stats = registry.getStatistics();
    expect(stats.totalModules).toBe(100);
  });
});