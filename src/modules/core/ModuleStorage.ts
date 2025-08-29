import { PrismaClient } from '@prisma/client';
import { ModuleConfig } from '../../types';
import { AppError, ErrorType } from '../../types';

/**
 * Handles persistence of module data in the database
 * Provides CRUD operations for module configurations and state
 */
export class ModuleStorage {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  /**
   * Get all installed modules from the database
   */
  async getInstalledModules(): Promise<ModuleConfig[]> {
    try {
      const modules = await this.prisma.module.findMany({
        where: { isInstalled: true }
      });

      return modules.map(module => ({
        id: module.id,
        name: module.name,
        version: module.version,
        isEnabled: module.isEnabled,
        isInstalled: module.isInstalled,
        config: (module.config as Record<string, unknown>) || {},
        installedAt: module.createdAt,
        lastUpdated: module.updatedAt
      }));
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to fetch installed modules',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get a specific module configuration
   */
  async getModule(moduleId: string): Promise<ModuleConfig | null> {
    try {
      const module = await this.prisma.module.findUnique({
        where: { id: moduleId }
      });

      if (!module) {
        return null;
      }

      return {
        id: module.id,
        name: module.name,
        version: module.version,
        isEnabled: module.isEnabled,
        isInstalled: module.isInstalled,
        config: (module.config as Record<string, unknown>) || {},
        installedAt: module.createdAt,
        lastUpdated: module.updatedAt
      };
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: `Failed to fetch module: ${moduleId}`,
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Save a new module configuration
   */
  async saveModule(config: Omit<ModuleConfig, 'installedAt' | 'lastUpdated'>): Promise<ModuleConfig> {
    try {
      const module = await this.prisma.module.create({
        data: {
          id: config.id,
          name: config.name,
          version: config.version,
          isEnabled: config.isEnabled,
          isInstalled: config.isInstalled,
          config: config.config as any
        }
      });

      return {
        id: module.id,
        name: module.name,
        version: module.version,
        isEnabled: module.isEnabled,
        isInstalled: module.isInstalled,
        config: (module.config as Record<string, unknown>) || {},
        installedAt: module.createdAt,
        lastUpdated: module.updatedAt
      };
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: `Failed to save module: ${config.id}`,
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Update module configuration
   */
  async updateModuleConfig(moduleId: string, config: Record<string, unknown>): Promise<void> {
    try {
      await this.prisma.module.update({
        where: { id: moduleId },
        data: { 
          config: config as any,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: `Failed to update module config: ${moduleId}`,
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Update module enabled/disabled status
   */
  async updateModuleStatus(moduleId: string, isEnabled: boolean): Promise<void> {
    try {
      await this.prisma.module.update({
        where: { id: moduleId },
        data: { 
          isEnabled,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: `Failed to update module status: ${moduleId}`,
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Update module version
   */
  async updateModuleVersion(moduleId: string, version: string): Promise<void> {
    try {
      await this.prisma.module.update({
        where: { id: moduleId },
        data: { 
          version,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: `Failed to update module version: ${moduleId}`,
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Remove a module from the database
   */
  async removeModule(moduleId: string): Promise<void> {
    try {
      await this.prisma.module.delete({
        where: { id: moduleId }
      });
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: `Failed to remove module: ${moduleId}`,
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Check if a module exists in the database
   */
  async moduleExists(moduleId: string): Promise<boolean> {
    try {
      const count = await this.prisma.module.count({
        where: { id: moduleId }
      });
      return count > 0;
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: `Failed to check module existence: ${moduleId}`,
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get enabled modules
   */
  async getEnabledModules(): Promise<ModuleConfig[]> {
    try {
      const modules = await this.prisma.module.findMany({
        where: { 
          isInstalled: true,
          isEnabled: true
        }
      });

      return modules.map(module => ({
        id: module.id,
        name: module.name,
        version: module.version,
        isEnabled: module.isEnabled,
        isInstalled: module.isInstalled,
        config: (module.config as Record<string, unknown>) || {},
        installedAt: module.createdAt,
        lastUpdated: module.updatedAt
      }));
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to fetch enabled modules',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get modules by version pattern
   */
  async getModulesByVersion(versionPattern: string): Promise<ModuleConfig[]> {
    try {
      const modules = await this.prisma.module.findMany({
        where: {
          version: {
            contains: versionPattern
          }
        }
      });

      return modules.map(module => ({
        id: module.id,
        name: module.name,
        version: module.version,
        isEnabled: module.isEnabled,
        isInstalled: module.isInstalled,
        config: (module.config as Record<string, unknown>) || {},
        installedAt: module.createdAt,
        lastUpdated: module.updatedAt
      }));
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: `Failed to fetch modules by version: ${versionPattern}`,
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Count modules by status
   */
  async getModuleStats(): Promise<{
    total: number;
    installed: number;
    enabled: number;
    disabled: number;
  }> {
    try {
      const [total, installed, enabled] = await Promise.all([
        this.prisma.module.count(),
        this.prisma.module.count({ where: { isInstalled: true } }),
        this.prisma.module.count({ where: { isInstalled: true, isEnabled: true } })
      ]);

      return {
        total,
        installed,
        enabled,
        disabled: installed - enabled
      };
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to fetch module statistics',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Cleanup orphaned module data
   */
  async cleanup(): Promise<void> {
    try {
      // Remove modules that are not installed
      await this.prisma.module.deleteMany({
        where: { isInstalled: false }
      });
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to cleanup module data',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Backup module configurations
   */
  async exportModules(): Promise<ModuleConfig[]> {
    try {
      return await this.getInstalledModules();
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to export module configurations',
        details: error,
        timestamp: new Date()
      });
    }
  }

  /**
   * Restore module configurations
   */
  async importModules(modules: ModuleConfig[]): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        for (const moduleConfig of modules) {
          await tx.module.upsert({
            where: { id: moduleConfig.id },
            update: {
              name: moduleConfig.name,
              version: moduleConfig.version,
              isEnabled: moduleConfig.isEnabled,
              isInstalled: moduleConfig.isInstalled,
              config: moduleConfig.config as any
            },
            create: {
              id: moduleConfig.id,
              name: moduleConfig.name,
              version: moduleConfig.version,
              isEnabled: moduleConfig.isEnabled,
              isInstalled: moduleConfig.isInstalled,
              config: moduleConfig.config as any
            }
          });
        }
      });
    } catch (error) {
      throw new AppError({
        type: ErrorType.DATABASE_ERROR,
        message: 'Failed to import module configurations',
        details: error,
        timestamp: new Date()
      });
    }
  }
}