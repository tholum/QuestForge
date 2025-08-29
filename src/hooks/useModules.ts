/**
 * useModules Hook
 * 
 * Custom hook for module configuration management with TanStack Query integration.
 * Provides module enablement, configuration, and usage tracking.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

/**
 * Module data types
 */
interface Module {
  id: string
  name: string
  version: string
  isEnabled: boolean
  isInstalled: boolean
  config: any
}

interface UserModuleConfig {
  id: string
  moduleId: string
  isEnabled: boolean
  configuration: Record<string, any>
  lastUsedAt: Date | null
  usageCount: number
  createdAt: Date
  updatedAt: Date
  module: Module | null
}

interface ModuleConfigSummary {
  totalModules: number
  enabledModules: number
  disabledModules: number
  recentlyUsed: number
  initializedCount: number
}

/**
 * Module configuration input types
 */
interface ModuleConfigInput {
  moduleId: string
  isEnabled: boolean
  configuration?: Record<string, any>
}

interface ModuleConfigUpdateInput {
  isEnabled?: boolean
  configuration?: Record<string, any>
}

/**
 * API Response interfaces
 */
interface ModulesConfigResponse {
  success: boolean
  data: {
    configurations: UserModuleConfig[]
    summary: ModuleConfigSummary
  }
  message: string
}

interface ModuleConfigResponse {
  success: boolean
  data: UserModuleConfig | UserModuleConfig[]
  message: string
}

interface ModuleActionResponse {
  success: boolean
  data?: any
  message: string
}

/**
 * Hook options
 */
interface UseModulesOptions {
  moduleId?: string
  enabledOnly?: boolean
  enabled?: boolean
  refetchInterval?: number
}

/**
 * API service functions
 */
const modulesAPI = {
  /**
   * Fetch user module configurations
   */
  async fetchModuleConfigs(options: UseModulesOptions = {}): Promise<ModulesConfigResponse> {
    const params = new URLSearchParams()
    
    if (options.moduleId) params.set('moduleId', options.moduleId)
    if (options.enabledOnly) params.set('enabledOnly', 'true')

    const response = await fetch(`/api/v1/modules/config?${params}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch module configurations')
    }
    
    return response.json()
  },

  /**
   * Update single module configuration
   */
  async updateModuleConfig(moduleId: string, updates: ModuleConfigUpdateInput): Promise<ModuleConfigResponse> {
    const response = await fetch('/api/v1/modules/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ moduleId, ...updates }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update module configuration')
    }
    
    return response.json()
  },

  /**
   * Update multiple module configurations
   */
  async updateModuleConfigs(configs: ModuleConfigInput[]): Promise<ModuleConfigResponse> {
    const response = await fetch('/api/v1/modules/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configs),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update module configurations')
    }
    
    return response.json()
  },

  /**
   * Track module usage
   */
  async trackModuleUsage(moduleId: string): Promise<ModuleActionResponse> {
    const response = await fetch('/api/v1/modules/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'track_usage', moduleId }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to track module usage')
    }
    
    return response.json()
  },

  /**
   * Initialize default configurations
   */
  async initializeDefaults(): Promise<ModuleActionResponse> {
    const response = await fetch('/api/v1/modules/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'initialize_defaults' }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to initialize default configurations')
    }
    
    return response.json()
  }
}

/**
 * Generate query key for caching
 */
const generateQueryKey = (options: UseModulesOptions) => {
  return ['modules', 'config', options]
}

/**
 * Main useModules hook
 */
export function useModules(options: UseModulesOptions = {}) {
  const queryClient = useQueryClient()
  
  // Query for fetching module configurations
  const modulesQuery = useQuery({
    queryKey: generateQueryKey(options),
    queryFn: () => modulesAPI.fetchModuleConfigs(options),
    enabled: options.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchInterval: options.refetchInterval,
  })

  // Update single module configuration mutation
  const updateModuleConfigMutation = useMutation({
    mutationFn: ({ moduleId, updates }: { moduleId: string; updates: ModuleConfigUpdateInput }) => 
      modulesAPI.updateModuleConfig(moduleId, updates),
    onMutate: async ({ moduleId, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['modules'] })
      
      // Snapshot previous value
      const previousModules = queryClient.getQueryData(generateQueryKey(options))
      
      // Optimistically update cache
      queryClient.setQueryData(generateQueryKey(options), (old: ModulesConfigResponse | undefined) => {
        if (!old) return old
        
        return {
          ...old,
          data: {
            ...old.data,
            configurations: old.data.configurations.map(config => 
              config.moduleId === moduleId
                ? { ...config, ...updates, updatedAt: new Date() }
                : config
            )
          }
        }
      })
      
      return { previousModules }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousModules) {
        queryClient.setQueryData(generateQueryKey(options), context.previousModules)
      }
      console.error('Failed to update module configuration:', error)
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['modules'] })
    }
  })

  // Update multiple module configurations mutation
  const updateModuleConfigsMutation = useMutation({
    mutationFn: modulesAPI.updateModuleConfigs,
    onSuccess: () => {
      // Invalidate all module queries to refetch
      queryClient.invalidateQueries({ queryKey: ['modules'] })
    },
    onError: (error) => {
      console.error('Failed to update module configurations:', error)
    }
  })

  // Track module usage mutation
  const trackUsageMutation = useMutation({
    mutationFn: modulesAPI.trackModuleUsage,
    onSuccess: (data, moduleId) => {
      // Update the module configuration in the cache
      queryClient.setQueryData(generateQueryKey(options), (old: ModulesConfigResponse | undefined) => {
        if (!old) return old
        
        return {
          ...old,
          data: {
            ...old.data,
            configurations: old.data.configurations.map(config => 
              config.moduleId === moduleId
                ? { 
                    ...config, 
                    lastUsedAt: new Date(), 
                    usageCount: config.usageCount + 1 
                  }
                : config
            )
          }
        }
      })
    },
    onError: (error) => {
      console.error('Failed to track module usage:', error)
    }
  })

  // Initialize defaults mutation
  const initializeDefaultsMutation = useMutation({
    mutationFn: modulesAPI.initializeDefaults,
    onSuccess: () => {
      // Invalidate all module queries to refetch
      queryClient.invalidateQueries({ queryKey: ['modules'] })
    },
    onError: (error) => {
      console.error('Failed to initialize default configurations:', error)
    }
  })

  // Helper functions
  const refetch = () => {
    return modulesQuery.refetch()
  }

  const updateModuleConfig = (moduleId: string, updates: ModuleConfigUpdateInput) => {
    return updateModuleConfigMutation.mutateAsync({ moduleId, updates })
  }

  const updateModuleConfigs = (configs: ModuleConfigInput[]) => {
    return updateModuleConfigsMutation.mutateAsync(configs)
  }

  const enableModule = (moduleId: string, configuration?: Record<string, any>) => {
    return updateModuleConfig(moduleId, { isEnabled: true, configuration })
  }

  const disableModule = (moduleId: string) => {
    return updateModuleConfig(moduleId, { isEnabled: false })
  }

  const trackModuleUsage = (moduleId: string) => {
    return trackUsageMutation.mutateAsync(moduleId)
  }

  const initializeDefaults = () => {
    return initializeDefaultsMutation.mutateAsync()
  }

  // Data access helpers
  const getConfigurations = () => {
    return modulesQuery.data?.data?.configurations || []
  }

  const getSummary = () => {
    return modulesQuery.data?.data?.summary || {
      totalModules: 0,
      enabledModules: 0,
      disabledModules: 0,
      recentlyUsed: 0,
      initializedCount: 0
    }
  }

  const getModuleConfig = (moduleId: string) => {
    return getConfigurations().find(config => config.moduleId === moduleId)
  }

  const getEnabledModules = () => {
    return getConfigurations().filter(config => config.isEnabled)
  }

  const getDisabledModules = () => {
    return getConfigurations().filter(config => !config.isEnabled)
  }

  const getRecentlyUsedModules = (days = 7) => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return getConfigurations()
      .filter(config => config.lastUsedAt && new Date(config.lastUsedAt) >= cutoffDate)
      .sort((a, b) => {
        if (!a.lastUsedAt || !b.lastUsedAt) return 0
        return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
      })
  }

  const getMostUsedModules = (limit = 5) => {
    return getConfigurations()
      .filter(config => config.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
  }

  const getUnusedModules = () => {
    return getConfigurations().filter(config => config.usageCount === 0 && !config.lastUsedAt)
  }

  const getModulesByType = () => {
    const modules = getConfigurations()
    
    const types: Record<string, UserModuleConfig[]> = {
      productivity: [],
      personal: [],
      learning: [],
      health: [],
      other: []
    }
    
    modules.forEach(config => {
      if (!config.module) return
      
      // Categorize modules based on their names (this could be improved with actual categories)
      const moduleName = config.module.name.toLowerCase()
      if (moduleName.includes('work') || moduleName.includes('project')) {
        types.productivity.push(config)
      } else if (moduleName.includes('bible') || moduleName.includes('prayer')) {
        types.personal.push(config)
      } else if (moduleName.includes('learning') || moduleName.includes('study')) {
        types.learning.push(config)
      } else if (moduleName.includes('fitness') || moduleName.includes('health')) {
        types.health.push(config)
      } else {
        types.other.push(config)
      }
    })
    
    return types
  }

  // Configuration helpers
  const getModuleConfiguration = (moduleId: string, key: string, defaultValue?: any) => {
    const config = getModuleConfig(moduleId)
    return config?.configuration?.[key] ?? defaultValue
  }

  const updateModuleConfiguration = (moduleId: string, key: string, value: any) => {
    const config = getModuleConfig(moduleId)
    if (!config) return Promise.reject(new Error('Module configuration not found'))
    
    const updatedConfiguration = {
      ...config.configuration,
      [key]: value
    }
    
    return updateModuleConfig(moduleId, { configuration: updatedConfiguration })
  }

  const isModuleEnabled = (moduleId: string) => {
    const config = getModuleConfig(moduleId)
    return config?.isEnabled ?? false
  }

  const getModuleUsageStats = (moduleId: string) => {
    const config = getModuleConfig(moduleId)
    if (!config) return null
    
    return {
      usageCount: config.usageCount,
      lastUsedAt: config.lastUsedAt,
      enabled: config.isEnabled,
      daysSinceLastUse: config.lastUsedAt 
        ? Math.floor((new Date().getTime() - new Date(config.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24))
        : null
    }
  }

  // Bulk operations
  const enableAllModules = () => {
    const configs = getConfigurations().map(config => ({
      moduleId: config.moduleId,
      isEnabled: true,
      configuration: config.configuration
    }))
    
    return updateModuleConfigs(configs)
  }

  const disableAllModules = () => {
    const configs = getConfigurations().map(config => ({
      moduleId: config.moduleId,
      isEnabled: false,
      configuration: config.configuration
    }))
    
    return updateModuleConfigs(configs)
  }

  const resetModuleConfigurations = () => {
    const configs = getConfigurations().map(config => ({
      moduleId: config.moduleId,
      isEnabled: config.isEnabled,
      configuration: {} // Reset to empty configuration
    }))
    
    return updateModuleConfigs(configs)
  }

  return {
    // Data
    configurations: getConfigurations(),
    summary: getSummary(),
    loading: modulesQuery.isLoading,
    error: modulesQuery.error,
    
    // Mutation states
    isUpdating: updateModuleConfigMutation.isPending || updateModuleConfigsMutation.isPending,
    isTracking: trackUsageMutation.isPending,
    isInitializing: initializeDefaultsMutation.isPending,
    
    // Methods
    refetch,
    updateModuleConfig,
    updateModuleConfigs,
    enableModule,
    disableModule,
    trackModuleUsage,
    initializeDefaults,
    
    // Data helpers
    getModuleConfig,
    getEnabledModules,
    getDisabledModules,
    getRecentlyUsedModules,
    getMostUsedModules,
    getUnusedModules,
    getModulesByType,
    
    // Configuration helpers
    getModuleConfiguration,
    updateModuleConfiguration,
    isModuleEnabled,
    getModuleUsageStats,
    
    // Bulk operations
    enableAllModules,
    disableAllModules,
    resetModuleConfigurations,
    
    // Raw queries for advanced usage
    modulesQuery,
    updateModuleConfigMutation,
    updateModuleConfigsMutation,
    trackUsageMutation,
    initializeDefaultsMutation
  }
}

/**
 * Hook for enabled modules only
 */
export function useEnabledModules(enabled = true) {
  return useModules({ enabledOnly: true, enabled })
}

/**
 * Hook for specific module configuration
 */
export function useModuleConfig(moduleId: string, enabled = true) {
  return useModules({ moduleId, enabled })
}

/**
 * Export types for use in components
 */
export type { 
  Module,
  UserModuleConfig,
  ModuleConfigSummary,
  ModuleConfigInput,
  ModuleConfigUpdateInput,
  UseModulesOptions 
}