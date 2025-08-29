import { EventEmitter } from 'events';
import { 
  IModule, 
  ModuleState, 
  ModuleRegistrationOptions, 
  ModuleQueryFilter, 
  ModuleOperationResult, 
  ModuleDependencyResult, 
  ModuleValidationResult,
  ModuleEvent,
  ModuleEventListener,
  ModuleEventType
} from '../../types/module';
import { ModuleStorage } from './ModuleStorage';
import { ModuleValidator } from './ModuleValidator';
import { ModuleDependencyResolver } from './ModuleDependencyResolver';
import { AppError, ErrorType } from '../../types';

/**
 * Central registry for managing all modules in the application
 * Handles module lifecycle, dependencies, validation, and state management
 */
export class ModuleRegistry extends EventEmitter {
  private modules: Map<string, IModule> = new Map();
  private moduleStates: Map<string, ModuleState> = new Map();
  private storage: ModuleStorage;
  private validator: ModuleValidator;
  private dependencyResolver: ModuleDependencyResolver;
  private initialized: boolean = false;

  constructor(storage: ModuleStorage) {
    super();
    this.storage = storage;
    this.validator = new ModuleValidator();
    this.dependencyResolver = new ModuleDependencyResolver(this);
    
    // Set up error handling
    this.on('error', (error) => {
      console.error('ModuleRegistry Error:', error);
    });
  }

  /**
   * Initialize the module registry
   * Loads installed modules from storage and validates them
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Load installed modules from storage
      const installedModules = await this.storage.getInstalledModules();
      
      for (const moduleConfig of installedModules) {
        try {
          // Load module instance (would be from dynamic import in real implementation)
          const module = await this.loadModuleFromConfig(moduleConfig);
          if (module) {
            this.modules.set(module.id, module);
            this.moduleStates.set(module.id, {
              id: module.id,
              status: moduleConfig.isEnabled ? 'enabled' : 'disabled',
              version: module.version,
              config: moduleConfig.config || {},
              dependencies: module.metadata.dependencies ? Object.keys(module.metadata.dependencies) : [],
              dependents: []
            });
          }
        } catch (error) {
          console.error(`Failed to load module ${moduleConfig.id}:`, error);
          this.moduleStates.set(moduleConfig.id, {
            id: moduleConfig.id,
            status: 'error',
            version: moduleConfig.version,
            lastError: error instanceof Error ? error.message : 'Unknown error',
            config: moduleConfig.config || {},
            dependencies: [],
            dependents: []
          });
        }
      }

      // Resolve dependencies and update dependents
      await this.resolveDependencies();
      
      this.initialized = true;
      this.emitEvent('registry:initialized', 'system', { moduleCount: this.modules.size });
    } catch (error) {
      throw new AppError({
        type: ErrorType.MODULE_ERROR,
        message: 'Failed to initialize module registry',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Register a new module in the registry
   */
  async register(module: IModule, options: ModuleRegistrationOptions = {}): Promise<ModuleOperationResult> {
    try {
      // Validate module
      const validation = await this.validator.validate(module);
      if (!validation.valid) {
        return {
          success: false,
          moduleId: module.id,
          error: `Module validation failed: ${validation.errors.join(', ')}`
        };
      }

      // Check if module already exists
      if (this.modules.has(module.id)) {
        return {
          success: false,
          moduleId: module.id,
          error: 'Module already registered'
        };
      }

      // Check dependencies if not skipping
      if (!options.skipDependencyCheck) {
        const depResult = await this.dependencyResolver.resolve(module.id, module.metadata.dependencies || {});
        if (!depResult.canInstall) {
          return {
            success: false,
            moduleId: module.id,
            error: `Dependency resolution failed: ${depResult.conflicts.map(c => c.reason).join(', ')}`
          };
        }
      }

      this.emitEvent('module:installing', module.id, { module });

      // Install the module
      await module.onInstall();

      // Save to storage
      await this.storage.saveModule({
        id: module.id,
        name: module.name,
        version: module.version,
        isEnabled: options.autoEnable ?? false,
        isInstalled: true,
        config: options.config || {}
      });

      // Add to registry
      this.modules.set(module.id, module);
      this.moduleStates.set(module.id, {
        id: module.id,
        status: options.autoEnable ? 'enabled' : 'installed',
        version: module.version,
        config: options.config || {},
        dependencies: Object.keys(module.metadata.dependencies || {}),
        dependents: []
      });

      // Update dependents for dependencies
      await this.updateDependents(module.id);

      // Auto-enable if requested
      if (options.autoEnable) {
        await module.onEnable();
        this.emitEvent('module:enabled', module.id, { module });
      }

      this.emitEvent('module:installed', module.id, { module });

      return {
        success: true,
        moduleId: module.id,
        data: { version: module.version }
      };
    } catch (error) {
      this.emitEvent('module:error', module.id, { error });
      return {
        success: false,
        moduleId: module.id,
        error: error instanceof Error ? error.message : 'Unknown error during registration'
      };
    }
  }

  /**
   * Unregister a module from the registry
   */
  async unregister(moduleId: string): Promise<ModuleOperationResult> {
    try {
      const module = this.modules.get(moduleId);
      if (!module) {
        return {
          success: false,
          moduleId,
          error: 'Module not found'
        };
      }

      const state = this.moduleStates.get(moduleId);
      if (!state) {
        return {
          success: false,
          moduleId,
          error: 'Module state not found'
        };
      }

      // Check if other modules depend on this one
      if (state.dependents.length > 0) {
        return {
          success: false,
          moduleId,
          error: `Cannot uninstall: modules ${state.dependents.join(', ')} depend on this module`
        };
      }

      this.emitEvent('module:uninstalling', moduleId, { module });

      // Disable first if enabled
      if (state.status === 'enabled') {
        await this.disable(moduleId);
      }

      // Run uninstall hook
      await module.onUninstall();

      // Remove from storage
      await this.storage.removeModule(moduleId);

      // Remove from registry
      this.modules.delete(moduleId);
      this.moduleStates.delete(moduleId);

      // Update dependents for dependencies
      for (const depId of state.dependencies) {
        const depState = this.moduleStates.get(depId);
        if (depState) {
          depState.dependents = depState.dependents.filter(id => id !== moduleId);
        }
      }

      this.emitEvent('module:uninstalled', moduleId, { module });

      return {
        success: true,
        moduleId
      };
    } catch (error) {
      this.emitEvent('module:error', moduleId, { error });
      return {
        success: false,
        moduleId,
        error: error instanceof Error ? error.message : 'Unknown error during unregistration'
      };
    }
  }

  /**
   * Enable a module
   */
  async enable(moduleId: string): Promise<ModuleOperationResult> {
    try {
      const module = this.modules.get(moduleId);
      const state = this.moduleStates.get(moduleId);

      if (!module || !state) {
        return {
          success: false,
          moduleId,
          error: 'Module not found'
        };
      }

      if (state.status === 'enabled') {
        return {
          success: true,
          moduleId,
          data: { alreadyEnabled: true }
        };
      }

      if (state.status !== 'installed' && state.status !== 'disabled') {
        return {
          success: false,
          moduleId,
          error: `Cannot enable module in state: ${state.status}`
        };
      }

      // Check dependencies are enabled
      const missingDeps = [];
      for (const depId of state.dependencies) {
        const depState = this.moduleStates.get(depId);
        if (!depState || depState.status !== 'enabled') {
          missingDeps.push(depId);
        }
      }

      if (missingDeps.length > 0) {
        return {
          success: false,
          moduleId,
          error: `Dependencies not enabled: ${missingDeps.join(', ')}`
        };
      }

      this.emitEvent('module:enabling', moduleId, { module });

      // Update state
      state.status = 'enabled';

      // Run enable hook
      await module.onEnable();

      // Update storage
      await this.storage.updateModuleStatus(moduleId, true);

      this.emitEvent('module:enabled', moduleId, { module });

      return {
        success: true,
        moduleId
      };
    } catch (error) {
      // Revert state on error
      const state = this.moduleStates.get(moduleId);
      if (state) {
        state.status = 'error';
        state.lastError = error instanceof Error ? error.message : 'Unknown error';
      }

      this.emitEvent('module:error', moduleId, { error });
      return {
        success: false,
        moduleId,
        error: error instanceof Error ? error.message : 'Unknown error during enable'
      };
    }
  }

  /**
   * Disable a module
   */
  async disable(moduleId: string): Promise<ModuleOperationResult> {
    try {
      const module = this.modules.get(moduleId);
      const state = this.moduleStates.get(moduleId);

      if (!module || !state) {
        return {
          success: false,
          moduleId,
          error: 'Module not found'
        };
      }

      if (state.status === 'disabled') {
        return {
          success: true,
          moduleId,
          data: { alreadyDisabled: true }
        };
      }

      if (state.status !== 'enabled') {
        return {
          success: false,
          moduleId,
          error: `Cannot disable module in state: ${state.status}`
        };
      }

      // Check if dependents are disabled first
      const enabledDependents = [];
      for (const depId of state.dependents) {
        const depState = this.moduleStates.get(depId);
        if (depState && depState.status === 'enabled') {
          enabledDependents.push(depId);
        }
      }

      if (enabledDependents.length > 0) {
        return {
          success: false,
          moduleId,
          error: `Cannot disable: dependent modules still enabled: ${enabledDependents.join(', ')}`
        };
      }

      this.emitEvent('module:disabling', moduleId, { module });

      // Update state
      state.status = 'disabled';

      // Run disable hook
      await module.onDisable();

      // Update storage
      await this.storage.updateModuleStatus(moduleId, false);

      this.emitEvent('module:disabled', moduleId, { module });

      return {
        success: true,
        moduleId
      };
    } catch (error) {
      // Revert state on error
      const state = this.moduleStates.get(moduleId);
      if (state) {
        state.status = 'error';
        state.lastError = error instanceof Error ? error.message : 'Unknown error';
      }

      this.emitEvent('module:error', moduleId, { error });
      return {
        success: false,
        moduleId,
        error: error instanceof Error ? error.message : 'Unknown error during disable'
      };
    }
  }

  /**
   * Get a module by ID
   */
  getModule(moduleId: string): IModule | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Get module state
   */
  getModuleState(moduleId: string): ModuleState | undefined {
    return this.moduleStates.get(moduleId);
  }

  /**
   * Get all modules matching filter criteria
   */
  getModules(filter: ModuleQueryFilter = {}): IModule[] {
    let modules = Array.from(this.modules.values());

    // Apply filters
    if (filter.enabled !== undefined) {
      modules = modules.filter(module => {
        const state = this.moduleStates.get(module.id);
        return state ? (state.status === 'enabled') === filter.enabled : false;
      });
    }

    if (filter.installed !== undefined) {
      modules = modules.filter(module => {
        const state = this.moduleStates.get(module.id);
        return state ? (state.status !== 'error') === filter.installed : false;
      });
    }

    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      modules = modules.filter(module => {
        const state = this.moduleStates.get(module.id);
        return state ? statuses.includes(state.status) : false;
      });
    }

    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      modules = modules.filter(module =>
        module.name.toLowerCase().includes(searchTerm) ||
        module.metadata.description.toLowerCase().includes(searchTerm) ||
        module.metadata.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm))
      );
    }

    if (filter.author) {
      modules = modules.filter(module => 
        module.metadata.author.toLowerCase() === filter.author!.toLowerCase()
      );
    }

    return modules;
  }

  /**
   * Update module configuration
   */
  async updateConfig(moduleId: string, config: Record<string, unknown>): Promise<ModuleOperationResult> {
    try {
      const module = this.modules.get(moduleId);
      const state = this.moduleStates.get(moduleId);

      if (!module || !state) {
        return {
          success: false,
          moduleId,
          error: 'Module not found'
        };
      }

      const oldConfig = { ...state.config };
      
      // Update state
      state.config = { ...config };

      // Call module hook if available
      if (module.onConfigChange) {
        await module.onConfigChange(oldConfig, config);
      }

      // Update storage
      await this.storage.updateModuleConfig(moduleId, config);

      this.emitEvent('module:config-changed', moduleId, { oldConfig, newConfig: config });

      return {
        success: true,
        moduleId,
        data: { config }
      };
    } catch (error) {
      this.emitEvent('module:error', moduleId, { error });
      return {
        success: false,
        moduleId,
        error: error instanceof Error ? error.message : 'Unknown error during config update'
      };
    }
  }

  /**
   * Add event listener for module events
   */
  onModuleEvent(type: ModuleEventType, listener: ModuleEventListener): void {
    this.on(type, listener);
  }

  /**
   * Remove event listener
   */
  offModuleEvent(type: ModuleEventType, listener: ModuleEventListener): void {
    this.off(type, listener);
  }

  /**
   * Get dependency information for a module
   */
  async getDependencyInfo(moduleId: string): Promise<ModuleDependencyResult> {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error('Module not found');
    }

    return this.dependencyResolver.resolve(moduleId, module.metadata.dependencies || {});
  }

  /**
   * Validate a module
   */
  async validateModule(module: IModule): Promise<ModuleValidationResult> {
    return this.validator.validate(module);
  }

  /**
   * Get registry statistics
   */
  getStatistics() {
    const states = Array.from(this.moduleStates.values());
    
    return {
      totalModules: this.modules.size,
      enabledModules: states.filter(s => s.status === 'enabled').length,
      disabledModules: states.filter(s => s.status === 'disabled').length,
      errorModules: states.filter(s => s.status === 'error').length,
      installedModules: states.filter(s => s.status !== 'error').length,
      modulesByStatus: states.reduce((acc, state) => {
        acc[state.status] = (acc[state.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  // Private helper methods

  private async loadModuleFromConfig(config: any): Promise<IModule | null> {
    // In a real implementation, this would dynamically import the module
    // For now, we'll return null to indicate module loading is not implemented
    // This would be replaced with actual module loading logic
    console.warn(`Module loading not implemented for ${config.id}`);
    return null;
  }

  private async resolveDependencies(): Promise<void> {
    // Update dependents for all modules
    for (const [moduleId, state] of this.moduleStates.entries()) {
      await this.updateDependents(moduleId);
    }
  }

  private async updateDependents(moduleId: string): Promise<void> {
    const state = this.moduleStates.get(moduleId);
    if (!state) return;

    // Clear current dependents
    state.dependents = [];

    // Find all modules that depend on this one
    for (const [otherId, otherState] of this.moduleStates.entries()) {
      if (otherId !== moduleId && otherState.dependencies.includes(moduleId)) {
        state.dependents.push(otherId);
      }
    }
  }

  private emitEvent(type: ModuleEventType, moduleId: string, data?: unknown): void {
    const event: ModuleEvent = {
      type,
      moduleId,
      timestamp: new Date(),
      data
    };

    this.emit(type, event);
    this.emit('module:*', event); // Wildcard event for all module events
  }
}