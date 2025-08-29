import { IModule, ModuleState, Achievement, PointsConfiguration } from '../../types/module';
import { GoalDifficulty } from '../../types';

/**
 * Utility functions for module management and operations
 */
export class ModuleUtils {
  
  /**
   * Calculate XP based on module points configuration
   */
  static calculateXP(
    pointsConfig: PointsConfiguration,
    action: string,
    difficulty: GoalDifficulty = 'medium',
    streakDays: number = 0
  ): number {
    const actionConfig = pointsConfig.actions[action];
    if (!actionConfig) {
      return 0;
    }

    let basePoints = actionConfig.basePoints;

    // Apply difficulty multiplier
    if (actionConfig.difficultyMultiplier) {
      const multiplier = pointsConfig.difficultyMultipliers[difficulty] || 1;
      basePoints *= multiplier;
    }

    // Apply streak bonus
    if (actionConfig.streakBonus && streakDays > 0) {
      const bonusMultiplier = 1 + (pointsConfig.streakBonusPercentage / 100) * streakDays;
      basePoints *= bonusMultiplier;
    }

    return Math.round(basePoints);
  }

  /**
   * Check if an achievement condition is met
   */
  static checkAchievementCondition(
    achievement: Achievement,
    userData: any,
    moduleData?: any
  ): { met: boolean; progress: number } {
    const { conditions } = achievement;

    switch (conditions.type) {
      case 'count':
        return this.checkCountCondition(conditions, userData, moduleData);
      
      case 'streak':
        return this.checkStreakCondition(conditions, userData, moduleData);
      
      case 'completion':
        return this.checkCompletionCondition(conditions, userData, moduleData);
      
      case 'custom':
        return this.checkCustomCondition(conditions, userData, moduleData);
      
      default:
        return { met: false, progress: 0 };
    }
  }

  /**
   * Generate a module manifest for validation
   */
  static generateModuleManifest(module: IModule): object {
    return {
      id: module.id,
      name: module.name,
      version: module.version,
      metadata: module.metadata,
      permissions: module.permissions,
      capabilities: module.capabilities,
      achievements: module.achievements.map(a => ({
        id: a.id,
        name: a.name,
        tier: a.tier,
        xpReward: a.xpReward
      })),
      apiRoutes: module.apiRoutes ? {
        baseRoute: module.apiRoutes.baseRoute,
        routeCount: module.apiRoutes.routes.length
      } : null,
      componentCount: Object.keys(module.components).length
    };
  }

  /**
   * Parse module version into components
   */
  static parseVersion(version: string): {
    major: number;
    minor: number;
    patch: number;
    prerelease?: string;
    build?: string;
  } {
    const versionRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;
    const match = version.match(versionRegex);

    if (!match) {
      throw new Error(`Invalid version format: ${version}`);
    }

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4],
      build: match[5]
    };
  }

  /**
   * Compare two version strings
   */
  static compareVersions(version1: string, version2: string): number {
    const v1 = this.parseVersion(version1);
    const v2 = this.parseVersion(version2);

    if (v1.major !== v2.major) {
      return v1.major - v2.major;
    }
    if (v1.minor !== v2.minor) {
      return v1.minor - v2.minor;
    }
    if (v1.patch !== v2.patch) {
      return v1.patch - v2.patch;
    }

    // Handle pre-release versions
    if (v1.prerelease && !v2.prerelease) {
      return -1; // Pre-release is less than release
    }
    if (!v1.prerelease && v2.prerelease) {
      return 1; // Release is greater than pre-release
    }
    if (v1.prerelease && v2.prerelease) {
      return v1.prerelease.localeCompare(v2.prerelease);
    }

    return 0;
  }

  /**
   * Validate module ID format
   */
  static validateModuleId(moduleId: string): { valid: boolean; reason?: string } {
    if (!moduleId) {
      return { valid: false, reason: 'Module ID cannot be empty' };
    }

    if (typeof moduleId !== 'string') {
      return { valid: false, reason: 'Module ID must be a string' };
    }

    if (moduleId.length < 2) {
      return { valid: false, reason: 'Module ID must be at least 2 characters long' };
    }

    if (moduleId.length > 50) {
      return { valid: false, reason: 'Module ID cannot exceed 50 characters' };
    }

    if (!/^[a-z][a-z0-9_]*$/.test(moduleId)) {
      return { 
        valid: false, 
        reason: 'Module ID must start with a lowercase letter and contain only lowercase letters, numbers, and underscores' 
      };
    }

    // Reserved module IDs
    const reservedIds = ['core', 'system', 'admin', 'user', 'api', 'lib', 'util', 'test'];
    if (reservedIds.includes(moduleId)) {
      return { valid: false, reason: `Module ID '${moduleId}' is reserved` };
    }

    return { valid: true };
  }

  /**
   * Generate unique module instance ID
   */
  static generateInstanceId(moduleId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${moduleId}_${timestamp}_${random}`;
  }

  /**
   * Extract module metadata summary
   */
  static extractModuleSummary(module: IModule): object {
    return {
      id: module.id,
      name: module.name,
      version: module.version,
      author: module.metadata.author,
      description: module.metadata.description,
      keywords: module.metadata.keywords,
      license: module.metadata.license,
      achievementCount: module.achievements.length,
      permissionCount: module.permissions.length,
      capabilityCount: module.capabilities.length,
      hasApiRoutes: !!module.apiRoutes,
      hasDataSchema: !!module.dataSchema
    };
  }

  /**
   * Check module compatibility with system
   */
  static checkCompatibility(
    module: IModule,
    systemVersion: string,
    installedModules: IModule[]
  ): {
    compatible: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Check system version compatibility
    if (this.compareVersions(systemVersion, module.metadata.minSystemVersion) < 0) {
      issues.push(
        `Module requires system version ${module.metadata.minSystemVersion} or higher, ` +
        `but current version is ${systemVersion}`
      );
    }

    // Check for conflicting modules
    const conflictingModule = installedModules.find(m => m.id === module.id);
    if (conflictingModule) {
      issues.push(`Module with ID '${module.id}' is already installed`);
    }

    // Check for permission conflicts
    const allPermissions = installedModules.flatMap(m => m.permissions);
    const conflictingPermissions = module.permissions.filter(p => 
      allPermissions.filter(ap => ap === p).length > 0
    );
    
    if (conflictingPermissions.length > 0) {
      warnings.push(`Permission conflicts detected: ${conflictingPermissions.join(', ')}`);
    }

    return {
      compatible: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * Format module status for display
   */
  static formatModuleStatus(state: ModuleState): {
    status: string;
    color: string;
    description: string;
  } {
    switch (state.status) {
      case 'installing':
        return {
          status: 'Installing',
          color: 'blue',
          description: 'Module is being installed'
        };
      case 'installed':
        return {
          status: 'Installed',
          color: 'gray',
          description: 'Module is installed but not enabled'
        };
      case 'enabled':
        return {
          status: 'Enabled',
          color: 'green',
          description: 'Module is active and running'
        };
      case 'disabled':
        return {
          status: 'Disabled',
          color: 'orange',
          description: 'Module is installed but disabled'
        };
      case 'error':
        return {
          status: 'Error',
          color: 'red',
          description: state.lastError || 'Module has encountered an error'
        };
      case 'uninstalling':
        return {
          status: 'Uninstalling',
          color: 'red',
          description: 'Module is being removed'
        };
      default:
        return {
          status: 'Unknown',
          color: 'gray',
          description: 'Module status is unknown'
        };
    }
  }

  // Private helper methods for achievement checking

  private static checkCountCondition(
    conditions: any,
    userData: any,
    moduleData?: any
  ): { met: boolean; progress: number } {
    const fieldValue = conditions.field ? userData[conditions.field] : userData.count;
    const currentValue = typeof fieldValue === 'number' ? fieldValue : 0;
    const targetValue = conditions.target || 0;
    
    return {
      met: currentValue >= targetValue,
      progress: targetValue > 0 ? Math.min(currentValue / targetValue, 1) : 1
    };
  }

  private static checkStreakCondition(
    conditions: any,
    userData: any,
    moduleData?: any
  ): { met: boolean; progress: number } {
    const streakValue = userData.streakCount || 0;
    const targetValue = conditions.target || 0;
    
    return {
      met: streakValue >= targetValue,
      progress: targetValue > 0 ? Math.min(streakValue / targetValue, 1) : 1
    };
  }

  private static checkCompletionCondition(
    conditions: any,
    userData: any,
    moduleData?: any
  ): { met: boolean; progress: number } {
    const completionRate = userData.completionRate || 0;
    const targetRate = (conditions.target || 100) / 100;
    
    return {
      met: completionRate >= targetRate,
      progress: Math.min(completionRate / targetRate, 1)
    };
  }

  private static checkCustomCondition(
    conditions: any,
    userData: any,
    moduleData?: any
  ): { met: boolean; progress: number } {
    if (typeof conditions.customValidator === 'function') {
      try {
        const result = conditions.customValidator({ userData, moduleData });
        if (typeof result === 'boolean') {
          return { met: result, progress: result ? 1 : 0 };
        }
        if (typeof result === 'object' && result.met !== undefined) {
          return {
            met: !!result.met,
            progress: typeof result.progress === 'number' ? result.progress : (result.met ? 1 : 0)
          };
        }
      } catch (error) {
        console.error('Error in custom achievement validator:', error);
      }
    }
    
    return { met: false, progress: 0 };
  }
}