/**
 * Module Repository
 * 
 * Repository for module management with installation and configuration support.
 */

import { Module } from '@prisma/client'
import { BaseRepository, Repository } from '../base-repository'
import {
  ModuleCreateSchema,
  ModuleUpdateSchema,
  ModuleQuerySchema,
  ModuleCreateInput,
  ModuleUpdateInput,
  ModuleQuery
} from '../../validation/schemas'
import { withErrorHandling } from '../error-handler'

/**
 * Extended module type with relations
 */
export interface ModuleWithRelations extends Module {
  goals?: any[]
  _count?: {
    goals: number
  }
}

@Repository('module')
export class ModuleRepository extends BaseRepository<
  ModuleWithRelations,
  ModuleCreateInput,
  ModuleUpdateInput,
  ModuleQuery
> {
  protected model = 'module'
  protected createSchema = ModuleCreateSchema
  protected updateSchema = ModuleUpdateSchema
  protected querySchema = ModuleQuerySchema

  /**
   * Build where clause for module queries
   */
  protected buildWhereClause(query: ModuleQuery): any {
    const where: any = {}

    if (query.id) {
      where.id = query.id
    }

    if (query.name) {
      where.name = {
        contains: query.name,
        mode: 'insensitive'
      }
    }

    if (query.isEnabled !== undefined) {
      where.isEnabled = query.isEnabled
    }

    if (query.isInstalled !== undefined) {
      where.isInstalled = query.isInstalled
    }

    return where
  }

  /**
   * Build order by clause for module queries
   */
  protected buildOrderByClause(query: ModuleQuery): any {
    return {
      [query.sortBy]: query.sortOrder
    }
  }

  /**
   * Get include options for module queries
   */
  protected getIncludeOptions(): any {
    return {
      include: {
        _count: {
          select: {
            goals: true
          }
        }
      }
    }
  }

  /**
   * Find all enabled modules
   */
  async findEnabled(): Promise<ModuleWithRelations[]> {
    const query: ModuleQuery = {
      isEnabled: true,
      limit: 100,
      offset: 0,
      sortBy: 'name',
      sortOrder: 'asc'
    }

    return this.findMany(query)
  }

  /**
   * Find all installed modules
   */
  async findInstalled(): Promise<ModuleWithRelations[]> {
    const query: ModuleQuery = {
      isInstalled: true,
      limit: 100,
      offset: 0,
      sortBy: 'name',
      sortOrder: 'asc'
    }

    return this.findMany(query)
  }

  /**
   * Find available modules (installed but not necessarily enabled)
   */
  async findAvailable(): Promise<ModuleWithRelations[]> {
    const query: ModuleQuery = {
      isInstalled: true,
      limit: 100,
      offset: 0,
      sortBy: 'name',
      sortOrder: 'asc'
    }

    return this.findMany(query)
  }

  /**
   * Install a module
   */
  async install(moduleId: string): Promise<ModuleWithRelations> {
    return withErrorHandling(async () => {
      const module = await this.findById(moduleId)
      if (!module) {
        throw new Error(`Module ${moduleId} not found`)
      }

      if (module.isInstalled) {
        throw new Error(`Module ${moduleId} is already installed`)
      }

      return await this.update(moduleId, {
        isInstalled: true,
        isEnabled: true // Enable by default when installing
      })
    }, 'Installing module')
  }

  /**
   * Uninstall a module
   */
  async uninstall(moduleId: string, removeData = false): Promise<ModuleWithRelations> {
    return withErrorHandling(async () => {
      const client = this.prisma

      const module = await this.findById(moduleId)
      if (!module) {
        throw new Error(`Module ${moduleId} not found`)
      }

      if (!module.isInstalled) {
        throw new Error(`Module ${moduleId} is not installed`)
      }

      // Check if module has associated goals
      const goalCount = await client.goal.count({
        where: { moduleId }
      })

      if (goalCount > 0 && !removeData) {
        throw new Error(`Module ${moduleId} has ${goalCount} associated goals. Set removeData=true to force uninstall.`)
      }

      // If removeData is true, delete all associated data
      if (removeData) {
        await this.transaction(async ({ tx }) => {
          // Delete progress entries for goals in this module
          await tx.progress.deleteMany({
            where: {
              goal: {
                moduleId
              }
            }
          })

          // Delete goals in this module
          await tx.goal.deleteMany({
            where: { moduleId }
          })

          // Delete module-specific achievements
          await tx.userAchievement.deleteMany({
            where: {
              achievement: {
                moduleId
              }
            }
          })

          await tx.achievement.deleteMany({
            where: { moduleId }
          })
        })
      }

      return await this.update(moduleId, {
        isInstalled: false,
        isEnabled: false
      })
    }, 'Uninstalling module')
  }

  /**
   * Enable a module
   */
  async enable(moduleId: string): Promise<ModuleWithRelations> {
    return withErrorHandling(async () => {
      const module = await this.findById(moduleId)
      if (!module) {
        throw new Error(`Module ${moduleId} not found`)
      }

      if (!module.isInstalled) {
        throw new Error(`Module ${moduleId} must be installed before it can be enabled`)
      }

      if (module.isEnabled) {
        return module // Already enabled
      }

      return await this.update(moduleId, { isEnabled: true })
    }, 'Enabling module')
  }

  /**
   * Disable a module
   */
  async disable(moduleId: string): Promise<ModuleWithRelations> {
    return withErrorHandling(async () => {
      const module = await this.findById(moduleId)
      if (!module) {
        throw new Error(`Module ${moduleId} not found`)
      }

      if (!module.isEnabled) {
        return module // Already disabled
      }

      return await this.update(moduleId, { isEnabled: false })
    }, 'Disabling module')
  }

  /**
   * Update module configuration
   */
  async updateConfig(moduleId: string, config: any): Promise<ModuleWithRelations> {
    return withErrorHandling(async () => {
      const module = await this.findById(moduleId)
      if (!module) {
        throw new Error(`Module ${moduleId} not found`)
      }

      // Merge with existing config
      const updatedConfig = {
        ...module.config,
        ...config
      }

      return await this.update(moduleId, { config: updatedConfig })
    }, 'Updating module configuration')
  }

  /**
   * Get module configuration
   */
  async getConfig(moduleId: string): Promise<any> {
    return withErrorHandling(async () => {
      const module = await this.findById(moduleId)
      if (!module) {
        throw new Error(`Module ${moduleId} not found`)
      }

      return module.config || {}
    }, 'Getting module configuration')
  }

  /**
   * Check if module version is newer
   */
  isNewerVersion(currentVersion: string, newVersion: string): boolean {
    const current = currentVersion.split('.').map(Number)
    const newer = newVersion.split('.').map(Number)

    for (let i = 0; i < Math.max(current.length, newer.length); i++) {
      const c = current[i] || 0
      const n = newer[i] || 0
      
      if (n > c) return true
      if (n < c) return false
    }

    return false
  }

  /**
   * Update module version
   */
  async updateVersion(moduleId: string, version: string): Promise<ModuleWithRelations> {
    return withErrorHandling(async () => {
      const module = await this.findById(moduleId)
      if (!module) {
        throw new Error(`Module ${moduleId} not found`)
      }

      if (!this.isNewerVersion(module.version, version)) {
        throw new Error(`Version ${version} is not newer than current version ${module.version}`)
      }

      return await this.update(moduleId, { version })
    }, 'Updating module version')
  }

  /**
   * Get module statistics
   */
  async getModuleStats(moduleId: string): Promise<{
    module: ModuleWithRelations
    totalGoals: number
    completedGoals: number
    activeUsers: number
    totalXpEarned: number
    lastActivityAt?: Date
  }> {
    return withErrorHandling(async () => {
      const client = this.prisma

      const [
        module,
        goalStats,
        activeUsers,
        xpStats,
        lastActivity
      ] = await Promise.all([
        this.findById(moduleId),
        client.goal.groupBy({
          by: ['isCompleted'],
          where: { moduleId },
          _count: { id: true }
        }),
        client.goal.findMany({
          where: { moduleId },
          select: { userId: true },
          distinct: ['userId']
        }),
        client.progress.aggregate({
          where: {
            goal: { moduleId }
          },
          _sum: { xpEarned: true }
        }),
        client.progress.findFirst({
          where: {
            goal: { moduleId }
          },
          orderBy: { recordedAt: 'desc' },
          select: { recordedAt: true }
        })
      ])

      if (!module) {
        throw new Error(`Module ${moduleId} not found`)
      }

      const totalGoals = goalStats.reduce((sum, stat) => sum + stat._count.id, 0)
      const completedGoals = goalStats.find(stat => stat.isCompleted)?._count.id || 0
      const totalXpEarned = xpStats._sum.xpEarned || 0

      return {
        module,
        totalGoals,
        completedGoals,
        activeUsers: activeUsers.length,
        totalXpEarned,
        lastActivityAt: lastActivity?.recordedAt
      }
    }, 'Getting module statistics')
  }

  /**
   * Get all modules with their statistics
   */
  async getAllWithStats(): Promise<Array<{
    module: ModuleWithRelations
    goalsCount: number
    usersCount: number
    isActive: boolean
  }>> {
    return withErrorHandling(async () => {
      const client = this.prisma

      const modules = await this.findMany()
      const moduleIds = modules.map(m => m.id)

      const [goalCounts, userCounts, lastActivities] = await Promise.all([
        client.goal.groupBy({
          by: ['moduleId'],
          where: { moduleId: { in: moduleIds } },
          _count: { id: true }
        }),
        client.goal.groupBy({
          by: ['moduleId'],
          where: { moduleId: { in: moduleIds } },
          _count: { userId: true }
        }),
        client.progress.groupBy({
          by: ['goal', 'moduleId'],
          where: {
            goal: { moduleId: { in: moduleIds } },
            recordedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          },
          _count: { id: true }
        })
      ])

      const goalCountMap = new Map(goalCounts.map(gc => [gc.moduleId, gc._count.id]))
      const userCountMap = new Map(userCounts.map(uc => [uc.moduleId, uc._count.userId]))
      const activeModuleIds = new Set(lastActivities.map(la => la.moduleId))

      return modules.map(module => ({
        module,
        goalsCount: goalCountMap.get(module.id) || 0,
        usersCount: userCountMap.get(module.id) || 0,
        isActive: activeModuleIds.has(module.id)
      }))
    }, 'Getting all modules with statistics')
  }

  private get prisma() {
    return require('../client').prisma.$client
  }
}