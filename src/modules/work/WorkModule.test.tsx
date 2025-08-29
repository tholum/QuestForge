/**
 * Work Module Tests
 */

import { describe, it, expect } from 'vitest';
import { WorkModule } from './WorkModule';

describe('WorkModule', () => {
  it('should export a valid module that implements IModule interface', () => {
    expect(WorkModule).toBeDefined();
    expect(WorkModule.id).toBe('work');
    expect(WorkModule.name).toBe('Work Projects');
    expect(WorkModule.version).toBe('1.0.0');
  });

  it('should have all required components', () => {
    expect(WorkModule.components).toBeDefined();
    expect(WorkModule.components.dashboard).toBeDefined();
    expect(WorkModule.components.mobileQuickAdd).toBeDefined();
    expect(WorkModule.components.desktopDetail).toBeDefined();
    expect(WorkModule.components.settings).toBeDefined();
  });

  it('should have achievements defined', () => {
    expect(WorkModule.achievements).toBeDefined();
    expect(Array.isArray(WorkModule.achievements)).toBe(true);
    expect(WorkModule.achievements.length).toBeGreaterThan(0);
    
    // Check first achievement structure
    const firstAchievement = WorkModule.achievements[0];
    expect(firstAchievement.id).toBeDefined();
    expect(firstAchievement.name).toBeDefined();
    expect(firstAchievement.description).toBeDefined();
    expect(firstAchievement.tier).toBeDefined();
    expect(firstAchievement.xpReward).toBeGreaterThan(0);
  });

  it('should have points configuration defined', () => {
    expect(WorkModule.pointsConfig).toBeDefined();
    expect(WorkModule.pointsConfig.actions).toBeDefined();
    expect(WorkModule.pointsConfig.difficultyMultipliers).toBeDefined();
    expect(WorkModule.pointsConfig.streakBonusPercentage).toBeDefined();
  });

  it('should have capabilities defined', () => {
    expect(WorkModule.capabilities).toBeDefined();
    expect(Array.isArray(WorkModule.capabilities)).toBe(true);
    expect(WorkModule.capabilities.length).toBeGreaterThan(0);
  });

  it('should have correct metadata', () => {
    expect(WorkModule.metadata).toBeDefined();
    expect(WorkModule.metadata.id).toBe('work');
    expect(WorkModule.metadata.name).toBe('Work Projects');
    expect(WorkModule.metadata.keywords).toContain('work');
    expect(WorkModule.metadata.keywords).toContain('projects');
    expect(WorkModule.metadata.keywords).toContain('time-tracking');
  });

  it('should have lifecycle methods', () => {
    expect(typeof WorkModule.onInstall).toBe('function');
    expect(typeof WorkModule.onUninstall).toBe('function');
    expect(typeof WorkModule.onEnable).toBe('function');
    expect(typeof WorkModule.onDisable).toBe('function');
    expect(typeof WorkModule.onUpgrade).toBe('function');
    expect(typeof WorkModule.onConfigChange).toBe('function');
  });

  it('should have correct permissions', () => {
    expect(WorkModule.permissions).toBeDefined();
    expect(Array.isArray(WorkModule.permissions)).toBe(true);
    expect(WorkModule.permissions).toContain('read:work_data');
    expect(WorkModule.permissions).toContain('write:work_data');
    expect(WorkModule.permissions).toContain('read:time_data');
    expect(WorkModule.permissions).toContain('write:time_data');
  });

  it('should have API routes configuration', () => {
    expect(WorkModule.apiRoutes).toBeDefined();
    expect(WorkModule.apiRoutes.baseRoute).toBe('/api/v1/modules/work');
    expect(WorkModule.apiRoutes.routes).toBeDefined();
    expect(Array.isArray(WorkModule.apiRoutes.routes)).toBe(true);
  });
});