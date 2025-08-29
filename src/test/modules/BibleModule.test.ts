/**
 * Bible Module Tests
 * 
 * Tests for the Bible study module implementation including
 * API service, repository functions, and module registration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BibleModule } from '../../modules/bible/BibleModule';
import { bibleAPIService } from '../../modules/bible/services/BibleAPIService';
import { 
  bibleDashboardRepository,
  bibleReadingPlanRepository 
} from '../../lib/prisma/repositories/bible-repository';

// Mock external dependencies
vi.mock('../../lib/prisma/repositories/bible-repository', () => ({
  bibleDashboardRepository: {
    getDashboardData: vi.fn()
  },
  bibleReadingPlanRepository: {
    getUserActivePlans: vi.fn(),
    createFromPreset: vi.fn()
  }
}));

describe('Bible Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Module Definition', () => {
    it('should have correct module metadata', () => {
      expect(BibleModule.id).toBe('bible');
      expect(BibleModule.name).toBe('Bible Study');
      expect(BibleModule.version).toBe('1.0.0');
      expect(BibleModule.icon).toBe('book-open');
      expect(BibleModule.color).toBe('#3B82F6');
    });

    it('should have proper metadata structure', () => {
      expect(BibleModule.metadata).toMatchObject({
        id: 'bible',
        name: 'Bible Study',
        version: '1.0.0',
        author: 'Goal Assistant Team',
        description: expect.stringContaining('Bible study'),
        keywords: expect.arrayContaining(['bible', 'study', 'reading', 'prayer']),
        license: 'MIT'
      });
    });

    it('should have required UI components', () => {
      expect(BibleModule.components).toHaveProperty('dashboard');
      expect(BibleModule.components).toHaveProperty('mobileQuickAdd');
      expect(BibleModule.components).toHaveProperty('desktopDetail');
      expect(BibleModule.components).toHaveProperty('settings');
    });

    it('should have achievements defined', () => {
      expect(Array.isArray(BibleModule.achievements)).toBe(true);
      expect(BibleModule.achievements.length).toBeGreaterThan(0);
      
      // Check for specific achievements
      const achievementIds = BibleModule.achievements.map(a => a.id);
      expect(achievementIds).toContain('first_reading');
      expect(achievementIds).toContain('week_consistent');
      expect(achievementIds).toContain('year_reader');
    });

    it('should have points configuration', () => {
      expect(BibleModule.pointsConfig).toHaveProperty('actions');
      expect(BibleModule.pointsConfig).toHaveProperty('difficultyMultipliers');
      expect(BibleModule.pointsConfig).toHaveProperty('streakBonusPercentage');

      // Check specific actions
      expect(BibleModule.pointsConfig.actions).toHaveProperty('complete_reading');
      expect(BibleModule.pointsConfig.actions).toHaveProperty('log_study_session');
      expect(BibleModule.pointsConfig.actions).toHaveProperty('add_prayer_request');
    });

    it('should have module capabilities', () => {
      expect(Array.isArray(BibleModule.capabilities)).toBe(true);
      expect(BibleModule.capabilities.length).toBeGreaterThan(0);
      
      const capabilityIds = BibleModule.capabilities.map(c => c.id);
      expect(capabilityIds).toContain('reading_plans');
      expect(capabilityIds).toContain('study_sessions');
      expect(capabilityIds).toContain('bible_api');
    });

    it('should have proper permissions', () => {
      expect(Array.isArray(BibleModule.permissions)).toBe(true);
      expect(BibleModule.permissions).toContain('read:bible_data');
      expect(BibleModule.permissions).toContain('write:bible_data');
      expect(BibleModule.permissions).toContain('read:prayer_data');
      expect(BibleModule.permissions).toContain('write:prayer_data');
    });

    it('should have API routes defined', () => {
      expect(BibleModule.apiRoutes).toHaveProperty('baseRoute');
      expect(BibleModule.apiRoutes?.baseRoute).toBe('/api/v1/modules/bible');
      expect(Array.isArray(BibleModule.apiRoutes?.routes)).toBe(true);
      expect(BibleModule.apiRoutes?.routes.length).toBeGreaterThan(0);
    });
  });

  describe('Lifecycle Methods', () => {
    it('should have all required lifecycle methods', () => {
      expect(typeof BibleModule.onInstall).toBe('function');
      expect(typeof BibleModule.onUninstall).toBe('function');
      expect(typeof BibleModule.onEnable).toBe('function');
      expect(typeof BibleModule.onDisable).toBe('function');
      expect(typeof BibleModule.onUpgrade).toBe('function');
      expect(typeof BibleModule.onConfigChange).toBe('function');
    });

    it('should handle install lifecycle', async () => {
      // Mock console.log to check if it's called
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await BibleModule.onInstall();
      
      expect(consoleSpy).toHaveBeenCalledWith('Installing Bible Study module...');
      consoleSpy.mockRestore();
    });

    it('should handle enable lifecycle', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await BibleModule.onEnable();
      
      expect(consoleSpy).toHaveBeenCalledWith('Enabling Bible Study module...');
      consoleSpy.mockRestore();
    });

    it('should handle upgrade lifecycle', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await BibleModule.onUpgrade('1.0.0', '1.1.0');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Upgrading Bible Study module from 1.0.0 to 1.1.0...'
      );
      consoleSpy.mockRestore();
    });

    it('should handle config change lifecycle', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const oldConfig = { version: 'ESV' };
      const newConfig = { version: 'NIV' };
      
      await BibleModule.onConfigChange(oldConfig, newConfig);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Bible Study module configuration changed:',
        { oldConfig, newConfig }
      );
      consoleSpy.mockRestore();
    });
  });
});

describe('Bible API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear cache before each test
    bibleAPIService.clearCache();
  });

  describe('Reference Parsing', () => {
    it('should parse valid scripture references', () => {
      const reference1 = bibleAPIService.parseReference('John 3:16');
      expect(reference1).toEqual({
        book: 'John',
        chapter: 3,
        verse: 16,
        endVerse: undefined
      });

      const reference2 = bibleAPIService.parseReference('Genesis 1:1-3');
      expect(reference2).toEqual({
        book: 'Genesis',
        chapter: 1,
        verse: 1,
        endVerse: 3
      });

      const reference3 = bibleAPIService.parseReference('Romans 8');
      expect(reference3).toEqual({
        book: 'Romans',
        chapter: 8,
        verse: undefined,
        endVerse: undefined
      });
    });

    it('should handle invalid references', () => {
      expect(bibleAPIService.parseReference('')).toBeNull();
      expect(bibleAPIService.parseReference('invalid')).toBeNull();
      expect(bibleAPIService.parseReference('123')).toBeNull();
    });

    it('should handle references with numbers in book names', () => {
      const reference = bibleAPIService.parseReference('1 Corinthians 13:4');
      expect(reference).toEqual({
        book: '1 Corinthians',
        chapter: 13,
        verse: 4,
        endVerse: undefined
      });
    });
  });

  describe('Reference Formatting', () => {
    it('should format references correctly', () => {
      expect(bibleAPIService.formatReference('John', 3, 16)).toBe('John 3:16');
      expect(bibleAPIService.formatReference('Genesis', 1, 1, 3)).toBe('Genesis 1:1-3');
      expect(bibleAPIService.formatReference('Romans', 8)).toBe('Romans 8');
    });
  });

  describe('Cache Management', () => {
    it('should provide cache statistics', () => {
      const stats = bibleAPIService.getCacheStats();
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(Array.isArray(stats.keys)).toBe(true);
    });

    it('should clear cache', () => {
      bibleAPIService.clearCache();
      const stats = bibleAPIService.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.keys.length).toBe(0);
    });
  });
});

describe('Bible Repository Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Dashboard Repository', () => {
    it('should be callable', () => {
      expect(typeof bibleDashboardRepository.getDashboardData).toBe('function');
    });
  });

  describe('Reading Plan Repository', () => {
    it('should have required methods', () => {
      expect(typeof bibleReadingPlanRepository.getUserActivePlans).toBe('function');
      expect(typeof bibleReadingPlanRepository.createFromPreset).toBe('function');
    });
  });
});

describe('Integration with Module System', () => {
  it('should be importable as a module', () => {
    expect(BibleModule).toBeDefined();
    expect(typeof BibleModule).toBe('object');
  });

  it('should implement IModule interface requirements', () => {
    // Check required IModule properties
    expect(typeof BibleModule.id).toBe('string');
    expect(typeof BibleModule.name).toBe('string');
    expect(typeof BibleModule.version).toBe('string');
    expect(typeof BibleModule.icon).toBe('string');
    expect(typeof BibleModule.color).toBe('string');
    
    expect(typeof BibleModule.metadata).toBe('object');
    expect(typeof BibleModule.components).toBe('object');
    expect(Array.isArray(BibleModule.achievements)).toBe(true);
    expect(typeof BibleModule.pointsConfig).toBe('object');
    expect(Array.isArray(BibleModule.capabilities)).toBe(true);
    expect(Array.isArray(BibleModule.permissions)).toBe(true);
  });

  it('should have valid achievement structure', () => {
    BibleModule.achievements.forEach(achievement => {
      expect(achievement).toHaveProperty('id');
      expect(achievement).toHaveProperty('name');
      expect(achievement).toHaveProperty('description');
      expect(achievement).toHaveProperty('icon');
      expect(achievement).toHaveProperty('tier');
      expect(achievement).toHaveProperty('conditions');
      expect(achievement).toHaveProperty('xpReward');
      expect(typeof achievement.xpReward).toBe('number');
    });
  });

  it('should have valid points configuration structure', () => {
    const { pointsConfig } = BibleModule;
    
    expect(pointsConfig).toHaveProperty('actions');
    expect(pointsConfig).toHaveProperty('difficultyMultipliers');
    expect(pointsConfig).toHaveProperty('streakBonusPercentage');
    
    expect(typeof pointsConfig.streakBonusPercentage).toBe('number');
    
    Object.values(pointsConfig.actions).forEach(action => {
      expect(action).toHaveProperty('basePoints');
      expect(action).toHaveProperty('description');
      expect(typeof action.basePoints).toBe('number');
    });
  });
});