import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ModuleRegistry } from '../../modules/core/ModuleRegistry';
import { ModuleStorage } from '../../modules/core/ModuleStorage';
import { IModule } from '../../types/module';

// Mock dependencies
vi.mock('@prisma/client');

// Create a mock module for testing
const createMockModule = (id: string): IModule => ({
  id,
  name: `Test Module ${id}`,
  version: '1.0.0',
  icon: 'test',
  color: '#000000',
  
  metadata: {
    id,
    name: `Test Module ${id}`,
    version: '1.0.0',
    author: 'Test Author',
    description: 'Test module for unit tests',
    keywords: ['test'],
    license: 'MIT',
    minSystemVersion: '1.0.0',
    dependencies: {},
  },
  
  components: {
    dashboard: () => null,
    mobileQuickAdd: () => null,
    desktopDetail: () => null,
    settings: () => null,
  },
  
  achievements: [],
  pointsConfig: {
    actions: {},
    difficultyMultipliers: { easy: 1, medium: 1.5, hard: 2, expert: 3 },
    streakBonusPercentage: 10
  },
  permissions: [],
  capabilities: [],
  
  async onInstall() { console.log(`Installing ${id}`); },
  async onUninstall() { console.log(`Uninstalling ${id}`); },
  async onEnable() { console.log(`Enabling ${id}`); },
  async onDisable() { console.log(`Disabling ${id}`); },
});

describe('ModuleRegistry', () => {
  let registry: ModuleRegistry;
  let mockStorage: ModuleStorage;

  beforeEach(async () => {
    // Create mock storage
    mockStorage = {
      getInstalledModules: vi.fn().mockResolvedValue([]),
      getModule: vi.fn(),
      saveModule: vi.fn(),
      updateModuleConfig: vi.fn(),
      updateModuleStatus: vi.fn(),
      removeModule: vi.fn(),
      moduleExists: vi.fn(),
      getEnabledModules: vi.fn(),
      getModulesByVersion: vi.fn(),
      getModuleStats: vi.fn(),
      cleanup: vi.fn(),
      exportModules: vi.fn(),
      importModules: vi.fn(),
    } as any;

    registry = new ModuleRegistry(mockStorage);
    await registry.initialize();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize without errors', async () => {
      const newRegistry = new ModuleRegistry(mockStorage);
      await expect(newRegistry.initialize()).resolves.not.toThrow();
    });

    it('should load installed modules from storage', async () => {
      const mockModule = { 
        id: 'test', 
        name: 'Test', 
        version: '1.0.0', 
        isEnabled: true, 
        isInstalled: true,
        config: {} 
      };
      
      vi.mocked(mockStorage.getInstalledModules).mockResolvedValue([mockModule]);
      
      const newRegistry = new ModuleRegistry(mockStorage);
      await newRegistry.initialize();
      
      expect(mockStorage.getInstalledModules).toHaveBeenCalled();
    });
  });

  describe('module registration', () => {
    it('should register a new module successfully', async () => {
      const testModule = createMockModule('test_module');
      
      vi.mocked(mockStorage.saveModule).mockResolvedValue(undefined);
      
      const result = await registry.register(testModule);
      
      expect(result.success).toBe(true);
      expect(result.moduleId).toBe('test_module');
      expect(mockStorage.saveModule).toHaveBeenCalled();
    });

    it('should reject registration of duplicate module', async () => {
      const testModule = createMockModule('duplicate_module');
      
      // Register once
      await registry.register(testModule);
      
      // Try to register again
      const result = await registry.register(testModule);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('already registered');
    });

    it('should validate module before registration', async () => {
      const invalidModule = {
        id: '', // Invalid ID
        name: 'Test',
        version: '1.0.0',
        // Missing required fields
      } as any;
      
      const result = await registry.register(invalidModule);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation failed');
    });
  });

  describe('module state management', () => {
    let testModule: IModule;

    beforeEach(async () => {
      testModule = createMockModule('state_test_module');
      await registry.register(testModule);
    });

    it('should enable a module', async () => {
      vi.mocked(mockStorage.updateModuleStatus).mockResolvedValue(undefined);
      
      const result = await registry.enable('state_test_module');
      
      expect(result.success).toBe(true);
      expect(mockStorage.updateModuleStatus).toHaveBeenCalledWith('state_test_module', true);
    });

    it('should disable a module', async () => {
      // Enable first
      await registry.enable('state_test_module');
      
      vi.mocked(mockStorage.updateModuleStatus).mockResolvedValue(undefined);
      
      const result = await registry.disable('state_test_module');
      
      expect(result.success).toBe(true);
      expect(mockStorage.updateModuleStatus).toHaveBeenCalledWith('state_test_module', false);
    });

    it('should get module state', () => {
      const state = registry.getModuleState('state_test_module');
      
      expect(state).toBeDefined();
      expect(state?.id).toBe('state_test_module');
      expect(state?.status).toBeDefined();
    });
  });

  describe('module unregistration', () => {
    let testModule: IModule;

    beforeEach(async () => {
      testModule = createMockModule('unregister_test_module');
      await registry.register(testModule);
    });

    it('should unregister a module', async () => {
      vi.mocked(mockStorage.removeModule).mockResolvedValue(undefined);
      
      const result = await registry.unregister('unregister_test_module');
      
      expect(result.success).toBe(true);
      expect(mockStorage.removeModule).toHaveBeenCalledWith('unregister_test_module');
    });

    it('should not unregister non-existent module', async () => {
      const result = await registry.unregister('non_existent_module');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('module querying', () => {
    beforeEach(async () => {
      const module1 = createMockModule('query_test_1');
      const module2 = createMockModule('query_test_2');
      
      await registry.register(module1);
      await registry.register(module2);
      await registry.enable('query_test_1');
    });

    it('should get all modules', () => {
      const modules = registry.getModules();
      
      expect(modules.length).toBeGreaterThan(0);
      expect(modules.some(m => m.id === 'query_test_1')).toBe(true);
    });

    it('should filter modules by enabled status', () => {
      const enabledModules = registry.getModules({ enabled: true });
      const disabledModules = registry.getModules({ enabled: false });
      
      expect(enabledModules.some(m => m.id === 'query_test_1')).toBe(true);
      expect(disabledModules.some(m => m.id === 'query_test_2')).toBe(true);
    });

    it('should search modules by name', () => {
      const modules = registry.getModules({ search: 'query_test' });
      
      expect(modules.length).toBe(2);
    });
  });

  describe('configuration management', () => {
    let testModule: IModule;

    beforeEach(async () => {
      testModule = createMockModule('config_test_module');
      await registry.register(testModule);
    });

    it('should update module configuration', async () => {
      const newConfig = { setting1: 'value1', setting2: 42 };
      
      vi.mocked(mockStorage.updateModuleConfig).mockResolvedValue(undefined);
      
      const result = await registry.updateConfig('config_test_module', newConfig);
      
      expect(result.success).toBe(true);
      expect(mockStorage.updateModuleConfig).toHaveBeenCalledWith('config_test_module', newConfig);
    });

    it('should call module onConfigChange hook', async () => {
      const configChangeSpy = vi.spyOn(testModule, 'onConfigChange');
      const newConfig = { setting: 'new_value' };
      
      await registry.updateConfig('config_test_module', newConfig);
      
      expect(configChangeSpy).toHaveBeenCalled();
    });
  });

  describe('statistics', () => {
    beforeEach(async () => {
      const module1 = createMockModule('stats_test_1');
      const module2 = createMockModule('stats_test_2');
      
      await registry.register(module1);
      await registry.register(module2);
      await registry.enable('stats_test_1');
    });

    it('should return correct statistics', () => {
      const stats = registry.getStatistics();
      
      expect(stats.totalModules).toBeGreaterThan(0);
      expect(stats.enabledModules).toBeGreaterThan(0);
      expect(stats.modulesByStatus).toBeDefined();
    });
  });

  describe('event handling', () => {
    it('should emit module events', async () => {
      const eventSpy = vi.fn();
      registry.onModuleEvent('module:installed', eventSpy);
      
      const testModule = createMockModule('event_test_module');
      await registry.register(testModule);
      
      expect(eventSpy).toHaveBeenCalled();
    });

    it('should remove event listeners', async () => {
      const eventSpy = vi.fn();
      
      registry.onModuleEvent('module:installed', eventSpy);
      registry.offModuleEvent('module:installed', eventSpy);
      
      const testModule = createMockModule('event_removal_test');
      await registry.register(testModule);
      
      // Should not be called since listener was removed
      expect(eventSpy).not.toHaveBeenCalled();
    });
  });
});