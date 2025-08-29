import { IModule, ModuleValidationResult, ModuleCapability, Achievement } from '../../types/module';

/**
 * Validates module implementations for compliance and security
 */
export class ModuleValidator {
  
  /**
   * Validate a module implementation
   */
  async validate(module: IModule): Promise<ModuleValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    this.validateBasicStructure(module, errors);
    
    // Metadata validation
    this.validateMetadata(module, errors, warnings);
    
    // Component validation
    this.validateComponents(module, errors, warnings);
    
    // Lifecycle validation
    this.validateLifecycle(module, errors);
    
    // Gamification validation
    this.validateGamification(module, errors, warnings);
    
    // Permissions validation
    this.validatePermissions(module, errors, warnings);
    
    // Capabilities validation
    this.validateCapabilities(module, errors, warnings);
    
    // API routes validation
    this.validateAPIRoutes(module, errors, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      moduleId: module.id
    };
  }

  private validateBasicStructure(module: IModule, errors: string[]): void {
    // Required fields
    if (!module.id || typeof module.id !== 'string') {
      errors.push('Module ID is required and must be a string');
    } else if (!/^[a-z][a-z0-9_]*$/.test(module.id)) {
      errors.push('Module ID must be lowercase, start with a letter, and contain only letters, numbers, and underscores');
    }

    if (!module.name || typeof module.name !== 'string') {
      errors.push('Module name is required and must be a string');
    }

    if (!module.version || typeof module.version !== 'string') {
      errors.push('Module version is required and must be a string');
    } else if (!this.isValidSemVer(module.version)) {
      errors.push('Module version must follow semantic versioning (e.g., 1.0.0)');
    }

    if (!module.icon || typeof module.icon !== 'string') {
      errors.push('Module icon is required and must be a string');
    }

    if (!module.color || typeof module.color !== 'string') {
      errors.push('Module color is required and must be a string');
    } else if (!this.isValidColor(module.color)) {
      errors.push('Module color must be a valid hex color or CSS color name');
    }
  }

  private validateMetadata(module: IModule, errors: string[], warnings: string[]): void {
    if (!module.metadata) {
      errors.push('Module metadata is required');
      return;
    }

    const { metadata } = module;

    if (!metadata.author || typeof metadata.author !== 'string') {
      errors.push('Module metadata.author is required and must be a string');
    }

    if (!metadata.description || typeof metadata.description !== 'string') {
      errors.push('Module metadata.description is required and must be a string');
    }

    if (!metadata.license || typeof metadata.license !== 'string') {
      errors.push('Module metadata.license is required and must be a string');
    }

    if (!metadata.minSystemVersion || typeof metadata.minSystemVersion !== 'string') {
      errors.push('Module metadata.minSystemVersion is required and must be a string');
    } else if (!this.isValidSemVer(metadata.minSystemVersion)) {
      errors.push('Module metadata.minSystemVersion must be a valid semantic version');
    }

    if (!Array.isArray(metadata.keywords)) {
      warnings.push('Module metadata.keywords should be an array of strings');
    } else if (metadata.keywords.some(k => typeof k !== 'string')) {
      warnings.push('All keywords should be strings');
    }

    if (metadata.homepage && !this.isValidUrl(metadata.homepage)) {
      warnings.push('Module metadata.homepage should be a valid URL');
    }

    if (metadata.repository && !this.isValidUrl(metadata.repository)) {
      warnings.push('Module metadata.repository should be a valid URL');
    }
  }

  private validateComponents(module: IModule, errors: string[], warnings: string[]): void {
    if (!module.components) {
      errors.push('Module components are required');
      return;
    }

    const requiredComponents = ['dashboard', 'mobileQuickAdd', 'desktopDetail', 'settings'];
    
    for (const componentName of requiredComponents) {
      const component = module.components[componentName as keyof typeof module.components];
      
      if (!component) {
        errors.push(`Component '${componentName}' is required`);
      } else if (typeof component !== 'function') {
        errors.push(`Component '${componentName}' must be a React component (function)`);
      }
    }
  }

  private validateLifecycle(module: IModule, errors: string[]): void {
    const requiredMethods = ['onInstall', 'onUninstall', 'onEnable', 'onDisable'];
    
    for (const methodName of requiredMethods) {
      const method = module[methodName as keyof IModule];
      
      if (!method) {
        errors.push(`Lifecycle method '${methodName}' is required`);
      } else if (typeof method !== 'function') {
        errors.push(`Lifecycle method '${methodName}' must be a function`);
      }
    }

    // Optional methods
    const optionalMethods = ['onUpgrade', 'onConfigChange'];
    
    for (const methodName of optionalMethods) {
      const method = module[methodName as keyof IModule];
      
      if (method && typeof method !== 'function') {
        errors.push(`Optional lifecycle method '${methodName}' must be a function if provided`);
      }
    }
  }

  private validateGamification(module: IModule, errors: string[], warnings: string[]): void {
    // Achievements validation
    if (!Array.isArray(module.achievements)) {
      warnings.push('Module achievements should be an array');
    } else {
      module.achievements.forEach((achievement, index) => {
        this.validateAchievement(achievement, `achievements[${index}]`, errors, warnings);
      });
    }

    // Points configuration validation
    if (!module.pointsConfig) {
      warnings.push('Module pointsConfig is recommended for gamification');
    } else {
      this.validatePointsConfig(module.pointsConfig, errors, warnings);
    }
  }

  private validateAchievement(achievement: Achievement, path: string, errors: string[], warnings: string[]): void {
    if (!achievement.id || typeof achievement.id !== 'string') {
      errors.push(`${path}.id is required and must be a string`);
    }

    if (!achievement.name || typeof achievement.name !== 'string') {
      errors.push(`${path}.name is required and must be a string`);
    }

    if (!achievement.description || typeof achievement.description !== 'string') {
      errors.push(`${path}.description is required and must be a string`);
    }

    if (!achievement.icon || typeof achievement.icon !== 'string') {
      errors.push(`${path}.icon is required and must be a string`);
    }

    const validTiers = ['bronze', 'silver', 'gold', 'platinum'];
    if (!validTiers.includes(achievement.tier)) {
      errors.push(`${path}.tier must be one of: ${validTiers.join(', ')}`);
    }

    if (typeof achievement.xpReward !== 'number' || achievement.xpReward < 0) {
      errors.push(`${path}.xpReward must be a non-negative number`);
    }

    if (!achievement.conditions || typeof achievement.conditions !== 'object') {
      errors.push(`${path}.conditions is required and must be an object`);
    } else {
      const validTypes = ['count', 'streak', 'completion', 'custom'];
      if (!validTypes.includes(achievement.conditions.type)) {
        errors.push(`${path}.conditions.type must be one of: ${validTypes.join(', ')}`);
      }

      if (achievement.conditions.type !== 'custom' && typeof achievement.conditions.target !== 'number') {
        errors.push(`${path}.conditions.target is required for non-custom conditions`);
      }
    }
  }

  private validatePointsConfig(pointsConfig: any, errors: string[], warnings: string[]): void {
    if (!pointsConfig.actions || typeof pointsConfig.actions !== 'object') {
      warnings.push('pointsConfig.actions should be an object mapping actions to point values');
    }

    if (!pointsConfig.difficultyMultipliers || typeof pointsConfig.difficultyMultipliers !== 'object') {
      warnings.push('pointsConfig.difficultyMultipliers should be an object with difficulty levels');
    } else {
      const requiredDifficulties = ['easy', 'medium', 'hard', 'expert'];
      for (const difficulty of requiredDifficulties) {
        if (typeof pointsConfig.difficultyMultipliers[difficulty] !== 'number') {
          warnings.push(`pointsConfig.difficultyMultipliers.${difficulty} should be a number`);
        }
      }
    }

    if (typeof pointsConfig.streakBonusPercentage !== 'number') {
      warnings.push('pointsConfig.streakBonusPercentage should be a number');
    }
  }

  private validatePermissions(module: IModule, errors: string[], warnings: string[]): void {
    if (!Array.isArray(module.permissions)) {
      warnings.push('Module permissions should be an array of strings');
    } else if (module.permissions.some(p => typeof p !== 'string')) {
      errors.push('All permissions must be strings');
    }
  }

  private validateCapabilities(module: IModule, errors: string[], warnings: string[]): void {
    if (!Array.isArray(module.capabilities)) {
      warnings.push('Module capabilities should be an array');
    } else {
      module.capabilities.forEach((capability, index) => {
        this.validateCapability(capability, `capabilities[${index}]`, errors, warnings);
      });
    }
  }

  private validateCapability(capability: ModuleCapability, path: string, errors: string[], warnings: string[]): void {
    if (!capability.id || typeof capability.id !== 'string') {
      errors.push(`${path}.id is required and must be a string`);
    }

    if (!capability.name || typeof capability.name !== 'string') {
      errors.push(`${path}.name is required and must be a string`);
    }

    if (!capability.description || typeof capability.description !== 'string') {
      errors.push(`${path}.description is required and must be a string`);
    }

    if (capability.required !== undefined && typeof capability.required !== 'boolean') {
      warnings.push(`${path}.required should be a boolean`);
    }
  }

  private validateAPIRoutes(module: IModule, errors: string[], warnings: string[]): void {
    if (!module.apiRoutes) {
      return; // API routes are optional
    }

    const { apiRoutes } = module;

    if (!apiRoutes.baseRoute || typeof apiRoutes.baseRoute !== 'string') {
      errors.push('apiRoutes.baseRoute is required when apiRoutes is provided');
    }

    if (!Array.isArray(apiRoutes.routes)) {
      errors.push('apiRoutes.routes must be an array');
    } else {
      apiRoutes.routes.forEach((route, index) => {
        this.validateAPIRoute(route, `apiRoutes.routes[${index}]`, errors, warnings);
      });
    }
  }

  private validateAPIRoute(route: any, path: string, errors: string[], warnings: string[]): void {
    if (!route.path || typeof route.path !== 'string') {
      errors.push(`${path}.path is required and must be a string`);
    }

    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    if (!validMethods.includes(route.method)) {
      errors.push(`${path}.method must be one of: ${validMethods.join(', ')}`);
    }

    if (!route.handler || typeof route.handler !== 'string') {
      errors.push(`${path}.handler is required and must be a string`);
    }

    if (route.middleware && !Array.isArray(route.middleware)) {
      warnings.push(`${path}.middleware should be an array of strings`);
    }

    if (route.permissions && !Array.isArray(route.permissions)) {
      warnings.push(`${path}.permissions should be an array of strings`);
    }
  }

  // Utility validation methods

  private isValidSemVer(version: string): boolean {
    const semVerRegex = /^\d+\.\d+\.\d+(?:-[a-zA-Z0-9-]+)?(?:\+[a-zA-Z0-9-]+)?$/;
    return semVerRegex.test(version);
  }

  private isValidColor(color: string): boolean {
    // Check hex colors
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return true;
    }

    // Check common CSS color names
    const cssColors = [
      'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'brown',
      'black', 'white', 'gray', 'grey', 'cyan', 'magenta', 'lime', 'navy',
      'olive', 'maroon', 'silver', 'aqua', 'fuchsia', 'teal'
    ];
    
    return cssColors.includes(color.toLowerCase());
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}