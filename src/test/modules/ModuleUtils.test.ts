import { describe, it, expect, vi } from 'vitest';
import { ModuleUtils } from '../../modules/core/ModuleUtils';
import { PointsConfiguration, Achievement } from '../../types/module';
import { GoalDifficulty } from '../../types';

describe('ModuleUtils', () => {
  const mockPointsConfig: PointsConfiguration = {
    actions: {
      complete_goal: {
        basePoints: 10,
        difficultyMultiplier: true,
        streakBonus: true,
        description: 'Complete a goal'
      },
      create_goal: {
        basePoints: 5,
        difficultyMultiplier: false,
        streakBonus: false,
        description: 'Create a goal'
      }
    },
    difficultyMultipliers: {
      easy: 1,
      medium: 1.5,
      hard: 2,
      expert: 3
    },
    streakBonusPercentage: 10
  };

  describe('calculateXP', () => {
    it('should calculate base XP correctly', () => {
      const xp = ModuleUtils.calculateXP(mockPointsConfig, 'create_goal');
      expect(xp).toBe(5);
    });

    it('should apply difficulty multipliers when enabled', () => {
      const easyXP = ModuleUtils.calculateXP(mockPointsConfig, 'complete_goal', 'easy');
      const mediumXP = ModuleUtils.calculateXP(mockPointsConfig, 'complete_goal', 'medium');
      const hardXP = ModuleUtils.calculateXP(mockPointsConfig, 'complete_goal', 'hard');
      const expertXP = ModuleUtils.calculateXP(mockPointsConfig, 'complete_goal', 'expert');

      expect(easyXP).toBe(10);
      expect(mediumXP).toBe(15);
      expect(hardXP).toBe(20);
      expect(expertXP).toBe(30);
    });

    it('should not apply difficulty multipliers when disabled', () => {
      const easyXP = ModuleUtils.calculateXP(mockPointsConfig, 'create_goal', 'easy');
      const expertXP = ModuleUtils.calculateXP(mockPointsConfig, 'create_goal', 'expert');

      expect(easyXP).toBe(5);
      expect(expertXP).toBe(5);
    });

    it('should apply streak bonuses when enabled', () => {
      const noStreakXP = ModuleUtils.calculateXP(mockPointsConfig, 'complete_goal', 'medium', 0);
      const streakXP = ModuleUtils.calculateXP(mockPointsConfig, 'complete_goal', 'medium', 10);

      expect(streakXP).toBeGreaterThan(noStreakXP);
    });

    it('should return 0 for unknown actions', () => {
      const xp = ModuleUtils.calculateXP(mockPointsConfig, 'unknown_action');
      expect(xp).toBe(0);
    });

    it('should round XP to nearest integer', () => {
      const xp = ModuleUtils.calculateXP(mockPointsConfig, 'complete_goal', 'medium', 5);
      expect(Number.isInteger(xp)).toBe(true);
    });
  });

  describe('checkAchievementCondition', () => {
    const mockAchievement: Achievement = {
      id: 'test_achievement',
      name: 'Test Achievement',
      description: 'A test achievement',
      icon: 'trophy',
      tier: 'bronze',
      conditions: {
        type: 'count',
        target: 10,
        field: 'goalsCompleted'
      },
      xpReward: 100
    };

    it('should check count conditions correctly', () => {
      const userData = { goalsCompleted: 5 };
      const result = ModuleUtils.checkAchievementCondition(mockAchievement, userData);

      expect(result.met).toBe(false);
      expect(result.progress).toBe(0.5);
    });

    it('should detect when count conditions are met', () => {
      const userData = { goalsCompleted: 15 };
      const result = ModuleUtils.checkAchievementCondition(mockAchievement, userData);

      expect(result.met).toBe(true);
      expect(result.progress).toBe(1);
    });

    it('should check streak conditions', () => {
      const streakAchievement: Achievement = {
        ...mockAchievement,
        conditions: {
          type: 'streak',
          target: 7
        }
      };

      const userData = { streakCount: 3 };
      const result = ModuleUtils.checkAchievementCondition(streakAchievement, userData);

      expect(result.met).toBe(false);
      expect(result.progress).toBeCloseTo(0.43, 2);
    });

    it('should check completion conditions', () => {
      const completionAchievement: Achievement = {
        ...mockAchievement,
        conditions: {
          type: 'completion',
          target: 80 // 80%
        }
      };

      const userData = { completionRate: 0.9 }; // 90%
      const result = ModuleUtils.checkAchievementCondition(completionAchievement, userData);

      expect(result.met).toBe(true);
    });

    it('should handle custom conditions', () => {
      const customAchievement: Achievement = {
        ...mockAchievement,
        conditions: {
          type: 'custom',
          customValidator: ({ userData }) => userData.customValue > 42
        }
      };

      const userData = { customValue: 50 };
      const result = ModuleUtils.checkAchievementCondition(customAchievement, userData);

      expect(result.met).toBe(true);
    });
  });

  describe('parseVersion', () => {
    it('should parse valid semantic versions', () => {
      const version = ModuleUtils.parseVersion('2.1.3');

      expect(version.major).toBe(2);
      expect(version.minor).toBe(1);
      expect(version.patch).toBe(3);
    });

    it('should parse versions with prerelease', () => {
      const version = ModuleUtils.parseVersion('1.0.0-alpha.1');

      expect(version.major).toBe(1);
      expect(version.minor).toBe(0);
      expect(version.patch).toBe(0);
      expect(version.prerelease).toBe('alpha.1');
    });

    it('should parse versions with build metadata', () => {
      const version = ModuleUtils.parseVersion('1.0.0+build.123');

      expect(version.major).toBe(1);
      expect(version.minor).toBe(0);
      expect(version.patch).toBe(0);
      expect(version.build).toBe('build.123');
    });

    it('should throw error for invalid versions', () => {
      expect(() => ModuleUtils.parseVersion('invalid')).toThrow();
      expect(() => ModuleUtils.parseVersion('1.2')).toThrow();
      expect(() => ModuleUtils.parseVersion('1.2.3.4')).toThrow();
    });
  });

  describe('compareVersions', () => {
    it('should compare major versions correctly', () => {
      expect(ModuleUtils.compareVersions('2.0.0', '1.9.9')).toBeGreaterThan(0);
      expect(ModuleUtils.compareVersions('1.0.0', '2.0.0')).toBeLessThan(0);
    });

    it('should compare minor versions correctly', () => {
      expect(ModuleUtils.compareVersions('1.2.0', '1.1.9')).toBeGreaterThan(0);
      expect(ModuleUtils.compareVersions('1.1.0', '1.2.0')).toBeLessThan(0);
    });

    it('should compare patch versions correctly', () => {
      expect(ModuleUtils.compareVersions('1.0.2', '1.0.1')).toBeGreaterThan(0);
      expect(ModuleUtils.compareVersions('1.0.1', '1.0.2')).toBeLessThan(0);
    });

    it('should handle equal versions', () => {
      expect(ModuleUtils.compareVersions('1.2.3', '1.2.3')).toBe(0);
    });

    it('should handle prerelease versions', () => {
      expect(ModuleUtils.compareVersions('1.0.0-alpha', '1.0.0')).toBeLessThan(0);
      expect(ModuleUtils.compareVersions('1.0.0', '1.0.0-alpha')).toBeGreaterThan(0);
      expect(ModuleUtils.compareVersions('1.0.0-alpha', '1.0.0-beta')).toBeLessThan(0);
    });
  });

  describe('validateModuleId', () => {
    it('should validate correct module IDs', () => {
      const validIds = ['fitness', 'home_projects', 'learning_tracker', 'a2', 'my_module_1'];

      validIds.forEach(id => {
        const result = ModuleUtils.validateModuleId(id);
        expect(result.valid).toBe(true);
      });
    });

    it('should reject invalid module IDs', () => {
      const invalidIds = [
        '', // empty
        '1abc', // starts with number
        'ABC', // uppercase
        'my-module', // contains dash
        'my module', // contains space
        'a', // too short
        'x'.repeat(51), // too long
      ];

      invalidIds.forEach(id => {
        const result = ModuleUtils.validateModuleId(id);
        expect(result.valid).toBe(false);
        expect(result.reason).toBeDefined();
      });
    });

    it('should reject reserved module IDs', () => {
      const reservedIds = ['core', 'system', 'admin', 'user', 'api'];

      reservedIds.forEach(id => {
        const result = ModuleUtils.validateModuleId(id);
        expect(result.valid).toBe(false);
        expect(result.reason).toContain('reserved');
      });
    });
  });

  describe('generateInstanceId', () => {
    it('should generate unique instance IDs', () => {
      const id1 = ModuleUtils.generateInstanceId('test');
      const id2 = ModuleUtils.generateInstanceId('test');

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^test_\d+_[a-z0-9]+$/);
    });

    it('should include module ID in instance ID', () => {
      const instanceId = ModuleUtils.generateInstanceId('fitness');
      expect(instanceId).toStartWith('fitness_');
    });
  });

  describe('checkCompatibility', () => {
    const mockModule = {
      id: 'test_module',
      name: 'Test Module',
      version: '1.0.0',
      metadata: {
        minSystemVersion: '1.2.0'
      },
      permissions: ['read:data', 'write:data']
    } as any;

    it('should detect system version incompatibility', () => {
      const result = ModuleUtils.checkCompatibility(
        mockModule,
        '1.1.0', // Lower than required
        []
      );

      expect(result.compatible).toBe(false);
      expect(result.issues).toContain(expect.stringContaining('system version'));
    });

    it('should detect module ID conflicts', () => {
      const existingModules = [{ id: 'test_module' } as any];
      
      const result = ModuleUtils.checkCompatibility(
        mockModule,
        '1.5.0',
        existingModules
      );

      expect(result.compatible).toBe(false);
      expect(result.issues).toContain(expect.stringContaining('already installed'));
    });

    it('should detect permission conflicts', () => {
      const existingModules = [
        { id: 'other_module', permissions: ['read:data'] } as any
      ];
      
      const result = ModuleUtils.checkCompatibility(
        mockModule,
        '1.5.0',
        existingModules
      );

      expect(result.compatible).toBe(true); // Should be compatible but with warnings
      expect(result.warnings).toContain(expect.stringContaining('Permission conflicts'));
    });

    it('should pass compatibility checks', () => {
      const result = ModuleUtils.checkCompatibility(
        mockModule,
        '1.5.0',
        []
      );

      expect(result.compatible).toBe(true);
      expect(result.issues).toHaveLength(0);
    });
  });

  describe('generateModuleManifest', () => {
    it('should generate module manifest', () => {
      const mockModule = {
        id: 'test_module',
        name: 'Test Module',
        version: '1.0.0',
        metadata: {
          author: 'Test Author',
          description: 'Test description'
        },
        permissions: ['read:data'],
        capabilities: [{ id: 'cap1', name: 'Capability 1' }],
        achievements: [{ id: 'ach1', name: 'Achievement 1', tier: 'bronze', xpReward: 50 }],
        components: { dashboard: () => null, settings: () => null },
        apiRoutes: {
          baseRoute: '/api/test',
          routes: [{ path: '/data', method: 'GET' }]
        }
      } as any;

      const manifest = ModuleUtils.generateModuleManifest(mockModule);

      expect(manifest).toHaveProperty('id', 'test_module');
      expect(manifest).toHaveProperty('name', 'Test Module');
      expect(manifest).toHaveProperty('version', '1.0.0');
      expect(manifest).toHaveProperty('metadata');
      expect(manifest).toHaveProperty('permissions');
      expect(manifest).toHaveProperty('capabilities');
      expect(manifest).toHaveProperty('achievements');
      expect(manifest).toHaveProperty('componentCount', 2);
    });
  });
});