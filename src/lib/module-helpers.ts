import { PrismaClient } from '@prisma/client';
import { ModuleRegistry, ModuleStorage, GamificationService } from './index';
import { IModule, ModuleConfig } from '../types';

/**
 * High-level utility functions for module management across the application
 */

let moduleRegistryInstance: ModuleRegistry | null = null;
let gamificationServiceInstance: GamificationService | null = null;

/**
 * Initialize the global module registry
 */
export async function initializeModuleSystem(prisma: PrismaClient): Promise<ModuleRegistry> {
  if (moduleRegistryInstance) {
    return moduleRegistryInstance;
  }

  const storage = new ModuleStorage(prisma);
  moduleRegistryInstance = new ModuleRegistry(storage);
  
  await moduleRegistryInstance.initialize();
  
  return moduleRegistryInstance;
}

/**
 * Get the global module registry instance
 */
export function getModuleRegistry(): ModuleRegistry {
  if (!moduleRegistryInstance) {
    throw new Error('Module registry not initialized. Call initializeModuleSystem() first.');
  }
  return moduleRegistryInstance;
}

/**
 * Initialize the global gamification service
 */
export function initializeGamificationService(prisma: PrismaClient): GamificationService {
  if (gamificationServiceInstance) {
    return gamificationServiceInstance;
  }

  gamificationServiceInstance = new GamificationService(prisma);
  return gamificationServiceInstance;
}

/**
 * Get the global gamification service instance
 */
export function getGamificationService(): GamificationService {
  if (!gamificationServiceInstance) {
    throw new Error('Gamification service not initialized. Call initializeGamificationService() first.');
  }
  return gamificationServiceInstance;
}

/**
 * Helper function to process a goal completion with gamification
 */
export async function processGoalCompletion(
  userId: string,
  goalId: string,
  moduleId: string,
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'medium'
): Promise<{
  xpAwarded: number;
  leveledUp: boolean;
  achievementsUnlocked: any[];
}> {
  const gamificationService = getGamificationService();
  
  const result = await gamificationService.processAction(
    userId,
    'complete_goal',
    moduleId,
    difficulty,
    { goalId }
  );

  return {
    xpAwarded: result.xpAwarded,
    leveledUp: result.leveledUp,
    achievementsUnlocked: result.achievementsUnlocked
  };
}

/**
 * Helper function to process goal creation with gamification
 */
export async function processGoalCreation(
  userId: string,
  goalId: string,
  moduleId: string,
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' = 'medium'
): Promise<{
  xpAwarded: number;
  streakUpdated: boolean;
}> {
  const gamificationService = getGamificationService();
  
  const result = await gamificationService.processAction(
    userId,
    'create_goal',
    moduleId,
    difficulty,
    { goalId }
  );

  return {
    xpAwarded: result.xpAwarded,
    streakUpdated: result.streakUpdated.isActive
  };
}

/**
 * Helper function to get a user's complete gamification overview
 */
export async function getUserGamificationOverview(userId: string): Promise<{
  level: number;
  totalXP: number;
  currentStreak: number;
  achievementCount: number;
  rank?: number;
}> {
  const gamificationService = getGamificationService();
  
  const [profile, leaderboard] = await Promise.all([
    gamificationService.getUserProfile(userId),
    gamificationService.getLeaderboards('xp', 100) // Get top 100 to find user's rank
  ]);

  const userRank = leaderboard.findIndex(entry => entry.userId === userId);

  return {
    level: profile.level.currentLevel,
    totalXP: profile.level.totalXP,
    currentStreak: profile.streak.currentStreak,
    achievementCount: profile.achievements.filter(a => a.isCompleted).length,
    rank: userRank !== -1 ? userRank + 1 : undefined
  };
}

/**
 * Helper function to check if a module is enabled for a user
 */
export function isModuleEnabled(moduleId: string): boolean {
  try {
    const registry = getModuleRegistry();
    const state = registry.getModuleState(moduleId);
    return state?.status === 'enabled';
  } catch {
    return false;
  }
}

/**
 * Helper function to get enabled modules
 */
export function getEnabledModules(): IModule[] {
  try {
    const registry = getModuleRegistry();
    return registry.getModules({ enabled: true });
  } catch {
    return [];
  }
}

/**
 * Helper function to get module configuration
 */
export function getModuleConfig(moduleId: string): Record<string, unknown> {
  try {
    const registry = getModuleRegistry();
    const state = registry.getModuleState(moduleId);
    return state?.config || {};
  } catch {
    return {};
  }
}

/**
 * Helper function to safely execute module lifecycle methods
 */
export async function executeModuleLifecycle(
  moduleId: string,
  method: 'onInstall' | 'onUninstall' | 'onEnable' | 'onDisable'
): Promise<{ success: boolean; error?: string }> {
  try {
    const registry = getModuleRegistry();
    
    switch (method) {
      case 'onInstall':
      case 'onUninstall':
        // These would be handled by the registry's register/unregister methods
        throw new Error(`Use registry.register() or registry.unregister() for ${method}`);
      
      case 'onEnable':
        const enableResult = await registry.enable(moduleId);
        return { success: enableResult.success, error: enableResult.error };
      
      case 'onDisable':
        const disableResult = await registry.disable(moduleId);
        return { success: disableResult.success, error: disableResult.error };
      
      default:
        throw new Error(`Unknown lifecycle method: ${method}`);
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Helper function to validate module data before operations
 */
export function validateModuleData(data: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data) {
    errors.push('Module data is required');
    return { valid: false, errors };
  }

  if (!data.id || typeof data.id !== 'string') {
    errors.push('Module ID is required and must be a string');
  }

  if (!data.name || typeof data.name !== 'string') {
    errors.push('Module name is required and must be a string');
  }

  if (!data.version || typeof data.version !== 'string') {
    errors.push('Module version is required and must be a string');
  }

  // Add more validation as needed

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Helper function to format module status for display
 */
export function formatModuleStatus(moduleId: string): {
  status: string;
  displayName: string;
  color: string;
} {
  try {
    const registry = getModuleRegistry();
    const state = registry.getModuleState(moduleId);
    
    if (!state) {
      return {
        status: 'unknown',
        displayName: 'Unknown',
        color: 'gray'
      };
    }

    const statusMap: Record<string, { displayName: string; color: string }> = {
      'enabled': { displayName: 'Active', color: 'green' },
      'disabled': { displayName: 'Inactive', color: 'orange' },
      'installed': { displayName: 'Installed', color: 'blue' },
      'installing': { displayName: 'Installing...', color: 'blue' },
      'uninstalling': { displayName: 'Uninstalling...', color: 'red' },
      'error': { displayName: 'Error', color: 'red' }
    };

    const statusInfo = statusMap[state.status] || { displayName: 'Unknown', color: 'gray' };

    return {
      status: state.status,
      displayName: statusInfo.displayName,
      color: statusInfo.color
    };
  } catch {
    return {
      status: 'error',
      displayName: 'Error',
      color: 'red'
    };
  }
}

/**
 * Helper function to get module statistics
 */
export function getModuleSystemStats(): {
  totalModules: number;
  enabledModules: number;
  errorModules: number;
  lastUpdated: Date;
} {
  try {
    const registry = getModuleRegistry();
    const stats = registry.getStatistics();
    
    return {
      totalModules: stats.totalModules,
      enabledModules: stats.enabledModules,
      errorModules: stats.errorModules,
      lastUpdated: new Date()
    };
  } catch {
    return {
      totalModules: 0,
      enabledModules: 0,
      errorModules: 0,
      lastUpdated: new Date()
    };
  }
}