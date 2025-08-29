import { IModule, ModuleMetadata, ModuleComponents } from '../../types/module';
import { ModuleValidator } from './ModuleValidator';
import { ModuleUtils } from './ModuleUtils';

/**
 * Factory for creating and configuring module instances
 */
export class ModuleFactory {
  private validator: ModuleValidator;

  constructor() {
    this.validator = new ModuleValidator();
  }

  /**
   * Create a module instance from configuration
   */
  async createModule(config: ModuleConfig): Promise<IModule> {
    // Validate basic configuration
    this.validateConfig(config);

    // Create base module object
    const module: IModule = {
      id: config.id,
      name: config.name,
      version: config.version,
      icon: config.icon,
      color: config.color,
      metadata: this.createMetadata(config),
      components: await this.loadComponents(config),
      achievements: config.achievements || [],
      pointsConfig: config.pointsConfig || this.createDefaultPointsConfig(),
      permissions: config.permissions || [],
      capabilities: config.capabilities || [],
      dataSchema: config.dataSchema,
      apiRoutes: config.apiRoutes,
      
      // Lifecycle methods
      onInstall: config.onInstall || this.createDefaultLifecycleMethod('install'),
      onUninstall: config.onUninstall || this.createDefaultLifecycleMethod('uninstall'),
      onEnable: config.onEnable || this.createDefaultLifecycleMethod('enable'),
      onDisable: config.onDisable || this.createDefaultLifecycleMethod('disable'),
      onUpgrade: config.onUpgrade,
      onConfigChange: config.onConfigChange
    };

    // Validate the created module
    const validation = await this.validator.validate(module);
    if (!validation.valid) {
      throw new Error(`Module validation failed: ${validation.errors.join(', ')}`);
    }

    return module;
  }

  /**
   * Create a module from a manifest file
   */
  async createFromManifest(manifestPath: string): Promise<IModule> {
    // In a real implementation, this would load from file system
    // For now, we'll throw an error to indicate it's not implemented
    throw new Error('Module creation from manifest not implemented');
  }

  /**
   * Clone an existing module with modifications
   */
  async cloneModule(
    baseModule: IModule, 
    overrides: Partial<ModuleConfig>
  ): Promise<IModule> {
    const config: ModuleConfig = {
      id: overrides.id || `${baseModule.id}_clone`,
      name: overrides.name || `${baseModule.name} (Clone)`,
      version: overrides.version || baseModule.version,
      icon: overrides.icon || baseModule.icon,
      color: overrides.color || baseModule.color,
      author: overrides.author || baseModule.metadata.author,
      description: overrides.description || baseModule.metadata.description,
      keywords: overrides.keywords || baseModule.metadata.keywords,
      license: overrides.license || baseModule.metadata.license,
      homepage: overrides.homepage || baseModule.metadata.homepage,
      repository: overrides.repository || baseModule.metadata.repository,
      minSystemVersion: overrides.minSystemVersion || baseModule.metadata.minSystemVersion,
      dependencies: overrides.dependencies || baseModule.metadata.dependencies,
      achievements: overrides.achievements || baseModule.achievements,
      pointsConfig: overrides.pointsConfig || baseModule.pointsConfig,
      permissions: overrides.permissions || baseModule.permissions,
      capabilities: overrides.capabilities || baseModule.capabilities,
      dataSchema: overrides.dataSchema || baseModule.dataSchema,
      apiRoutes: overrides.apiRoutes || baseModule.apiRoutes,
      components: overrides.components || baseModule.components,
      onInstall: overrides.onInstall || baseModule.onInstall,
      onUninstall: overrides.onUninstall || baseModule.onUninstall,
      onEnable: overrides.onEnable || baseModule.onEnable,
      onDisable: overrides.onDisable || baseModule.onDisable,
      onUpgrade: overrides.onUpgrade || baseModule.onUpgrade,
      onConfigChange: overrides.onConfigChange || baseModule.onConfigChange
    };

    return this.createModule(config);
  }

  /**
   * Create a module template for development
   */
  createTemplate(templateType: ModuleTemplateType): ModuleConfig {
    const baseTemplate: ModuleConfig = {
      id: 'new_module',
      name: 'New Module',
      version: '1.0.0',
      icon: 'default',
      color: '#3B82F6',
      author: 'Developer',
      description: 'A new module for Goal Assistant',
      keywords: ['goal', 'module'],
      license: 'MIT',
      minSystemVersion: '1.0.0',
      dependencies: {},
      achievements: [],
      pointsConfig: this.createDefaultPointsConfig(),
      permissions: [],
      capabilities: [],
      components: this.createDefaultComponents()
    };

    switch (templateType) {
      case 'fitness':
        return this.createFitnessTemplate(baseTemplate);
      case 'productivity':
        return this.createProductivityTemplate(baseTemplate);
      case 'learning':
        return this.createLearningTemplate(baseTemplate);
      case 'basic':
      default:
        return baseTemplate;
    }
  }

  // Private helper methods

  private validateConfig(config: ModuleConfig): void {
    const idValidation = ModuleUtils.validateModuleId(config.id);
    if (!idValidation.valid) {
      throw new Error(`Invalid module ID: ${idValidation.reason}`);
    }

    if (!config.name || typeof config.name !== 'string') {
      throw new Error('Module name is required');
    }

    if (!config.version || typeof config.version !== 'string') {
      throw new Error('Module version is required');
    }

    try {
      ModuleUtils.parseVersion(config.version);
    } catch (error) {
      throw new Error(`Invalid version format: ${config.version}`);
    }
  }

  private createMetadata(config: ModuleConfig): ModuleMetadata {
    return {
      id: config.id,
      name: config.name,
      version: config.version,
      author: config.author || 'Unknown',
      description: config.description || '',
      keywords: config.keywords || [],
      homepage: config.homepage,
      repository: config.repository,
      license: config.license || 'MIT',
      minSystemVersion: config.minSystemVersion || '1.0.0',
      dependencies: config.dependencies || {},
      peerDependencies: config.peerDependencies
    };
  }

  private async loadComponents(config: ModuleConfig): Promise<ModuleComponents> {
    if (config.components) {
      return config.components;
    }

    // Return default placeholder components
    return this.createDefaultComponents();
  }

  private createDefaultComponents(): ModuleComponents {
    const DefaultComponent = () => null; // Placeholder component

    return {
      dashboard: DefaultComponent,
      mobileQuickAdd: DefaultComponent,
      desktopDetail: DefaultComponent,
      settings: DefaultComponent
    };
  }

  private createDefaultPointsConfig() {
    return {
      actions: {
        create_goal: { basePoints: 5, difficultyMultiplier: true, streakBonus: false, description: 'Create a new goal' },
        complete_goal: { basePoints: 10, difficultyMultiplier: true, streakBonus: true, description: 'Complete a goal' },
        update_progress: { basePoints: 2, difficultyMultiplier: false, streakBonus: true, description: 'Update progress' }
      },
      difficultyMultipliers: {
        easy: 1,
        medium: 1.5,
        hard: 2,
        expert: 3
      },
      streakBonusPercentage: 10
    };
  }

  private createDefaultLifecycleMethod(type: string): () => Promise<void> {
    return async () => {
      console.log(`Default ${type} lifecycle method called`);
    };
  }

  private createFitnessTemplate(base: ModuleConfig): ModuleConfig {
    return {
      ...base,
      id: 'fitness',
      name: 'Fitness Tracker',
      description: 'Track workouts, nutrition, and fitness goals',
      keywords: ['fitness', 'workout', 'health', 'nutrition'],
      icon: 'dumbbell',
      color: '#EF4444',
      achievements: [
        {
          id: 'first_workout',
          name: 'First Workout',
          description: 'Complete your first workout',
          icon: 'trophy',
          tier: 'bronze',
          conditions: { type: 'count', target: 1, field: 'workoutsCompleted' },
          xpReward: 50
        }
      ],
      permissions: ['read:fitness_data', 'write:fitness_data']
    };
  }

  private createProductivityTemplate(base: ModuleConfig): ModuleConfig {
    return {
      ...base,
      id: 'productivity',
      name: 'Productivity Tracker',
      description: 'Manage tasks, projects, and productivity metrics',
      keywords: ['productivity', 'tasks', 'projects', 'time'],
      icon: 'clipboard',
      color: '#8B5CF6',
      achievements: [
        {
          id: 'task_master',
          name: 'Task Master',
          description: 'Complete 10 tasks in a day',
          icon: 'check',
          tier: 'silver',
          conditions: { type: 'count', target: 10, field: 'dailyTasksCompleted' },
          xpReward: 100
        }
      ],
      permissions: ['read:task_data', 'write:task_data']
    };
  }

  private createLearningTemplate(base: ModuleConfig): ModuleConfig {
    return {
      ...base,
      id: 'learning',
      name: 'Learning Tracker',
      description: 'Track learning goals, courses, and skill development',
      keywords: ['learning', 'education', 'skills', 'courses'],
      icon: 'book',
      color: '#10B981',
      achievements: [
        {
          id: 'scholar',
          name: 'Scholar',
          description: 'Complete a learning course',
          icon: 'graduation-cap',
          tier: 'gold',
          conditions: { type: 'completion', target: 100, field: 'courseCompletion' },
          xpReward: 200
        }
      ],
      permissions: ['read:learning_data', 'write:learning_data']
    };
  }
}

// Supporting types and interfaces

export interface ModuleConfig {
  id: string;
  name: string;
  version: string;
  icon: string;
  color: string;
  author?: string;
  description?: string;
  keywords?: string[];
  license?: string;
  homepage?: string;
  repository?: string;
  minSystemVersion?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  achievements?: any[];
  pointsConfig?: any;
  permissions?: string[];
  capabilities?: any[];
  dataSchema?: any;
  apiRoutes?: any;
  components?: ModuleComponents;
  onInstall?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
  onEnable?: () => Promise<void>;
  onDisable?: () => Promise<void>;
  onUpgrade?: (fromVersion: string, toVersion: string) => Promise<void>;
  onConfigChange?: (oldConfig: Record<string, unknown>, newConfig: Record<string, unknown>) => Promise<void>;
}

export type ModuleTemplateType = 'basic' | 'fitness' | 'productivity' | 'learning';