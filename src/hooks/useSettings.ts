/**
 * useSettings Hook
 * 
 * Custom hook for user settings management with TanStack Query integration.
 * Provides CRUD operations, caching, and error handling for user settings.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

/**
 * Settings data types
 */
type SettingCategory = 'notification' | 'privacy' | 'display' | 'account'
type SettingDataType = 'string' | 'boolean' | 'number' | 'json'

interface UserSetting {
  value: any
  dataType: SettingDataType
  updatedAt: string
}

interface GroupedSettings {
  [category: string]: {
    [key: string]: UserSetting
  }
}

interface SettingInput {
  category: SettingCategory
  settingKey: string
  settingValue: string
  dataType?: SettingDataType
}

/**
 * API Response interfaces
 */
interface SettingsResponse {
  success: boolean
  data: GroupedSettings
  message?: string
}

interface SettingUpdateResponse {
  success: boolean
  data: any
  message: string
}

/**
 * Hook options
 */
interface UseSettingsOptions {
  category?: SettingCategory
  enabled?: boolean
}

/**
 * API service functions
 */
const settingsAPI = {
  /**
   * Fetch user settings
   */
  async fetchSettings(category?: SettingCategory): Promise<SettingsResponse> {
    const params = new URLSearchParams()
    if (category) params.set('category', category)

    const response = await fetch(`/api/v1/settings?${params}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch settings')
    }
    
    return response.json()
  },

  /**
   * Update single setting
   */
  async updateSetting(setting: SettingInput): Promise<SettingUpdateResponse> {
    const response = await fetch('/api/v1/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(setting),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update setting')
    }
    
    return response.json()
  },

  /**
   * Update multiple settings
   */
  async updateSettings(settings: SettingInput[]): Promise<SettingUpdateResponse> {
    const response = await fetch('/api/v1/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update settings')
    }
    
    return response.json()
  }
}

/**
 * Generate query key for caching
 */
const generateQueryKey = (category?: SettingCategory) => {
  return category ? ['settings', category] : ['settings']
}

/**
 * Main useSettings hook
 */
export function useSettings(options: UseSettingsOptions = {}) {
  const queryClient = useQueryClient()
  
  // Query for fetching settings
  const settingsQuery = useQuery({
    queryKey: generateQueryKey(options.category),
    queryFn: () => settingsAPI.fetchSettings(options.category),
    enabled: options.enabled !== false,
    staleTime: 10 * 60 * 1000, // 10 minutes (settings don't change often)
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  })

  // Update single setting mutation
  const updateSettingMutation = useMutation({
    mutationFn: settingsAPI.updateSetting,
    onMutate: async (newSetting) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['settings'] })
      
      // Snapshot previous value
      const previousSettings = queryClient.getQueryData(generateQueryKey(options.category))
      
      // Optimistically update cache
      queryClient.setQueryData(generateQueryKey(options.category), (old: SettingsResponse | undefined) => {
        if (!old) return old
        
        // Parse value based on dataType
        let parsedValue: any = newSetting.settingValue
        try {
          switch (newSetting.dataType) {
            case 'boolean':
              parsedValue = newSetting.settingValue === 'true'
              break
            case 'number':
              parsedValue = parseFloat(newSetting.settingValue)
              break
            case 'json':
              parsedValue = JSON.parse(newSetting.settingValue)
              break
            default:
              parsedValue = newSetting.settingValue
          }
        } catch (error) {
          parsedValue = newSetting.settingValue
        }
        
        return {
          ...old,
          data: {
            ...old.data,
            [newSetting.category]: {
              ...old.data[newSetting.category],
              [newSetting.settingKey]: {
                value: parsedValue,
                dataType: newSetting.dataType || 'string',
                updatedAt: new Date().toISOString()
              }
            }
          }
        }
      })
      
      return { previousSettings }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(generateQueryKey(options.category), context.previousSettings)
      }
      console.error('Failed to update setting:', error)
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    }
  })

  // Update multiple settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: settingsAPI.updateSettings,
    onSuccess: () => {
      // Invalidate all settings queries to refetch
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
    onError: (error) => {
      console.error('Failed to update settings:', error)
    }
  })

  // Helper functions
  const getSetting = (category: SettingCategory, key: string, defaultValue?: any) => {
    const settings = settingsQuery.data?.data
    return settings?.[category]?.[key]?.value ?? defaultValue
  }

  const updateSetting = (category: SettingCategory, key: string, value: any, dataType: SettingDataType = 'string') => {
    const settingInput: SettingInput = {
      category,
      settingKey: key,
      settingValue: dataType === 'json' ? JSON.stringify(value) : String(value),
      dataType
    }
    
    return updateSettingMutation.mutateAsync(settingInput)
  }

  const updateMultipleSettings = (settings: Array<{
    category: SettingCategory
    key: string
    value: any
    dataType?: SettingDataType
  }>) => {
    const settingsInput: SettingInput[] = settings.map(setting => ({
      category: setting.category,
      settingKey: setting.key,
      settingValue: setting.dataType === 'json' ? JSON.stringify(setting.value) : String(setting.value),
      dataType: setting.dataType || 'string'
    }))
    
    return updateSettingsMutation.mutateAsync(settingsInput)
  }

  const refetch = () => {
    return settingsQuery.refetch()
  }

  // Convenience getters for common settings
  const getNotificationSettings = () => {
    const settings = settingsQuery.data?.data?.notification || {}
    return {
      emailNotifications: settings.emailNotifications?.value ?? true,
      pushNotifications: settings.pushNotifications?.value ?? true,
      weeklyDigest: settings.weeklyDigest?.value ?? true,
      achievementAlerts: settings.achievementAlerts?.value ?? true,
      goalReminders: settings.goalReminders?.value ?? true
    }
  }

  const getPrivacySettings = () => {
    const settings = settingsQuery.data?.data?.privacy || {}
    return {
      profileVisibility: settings.profileVisibility?.value ?? 'private',
      analyticsSharing: settings.analyticsSharing?.value ?? false,
      dataExport: settings.dataExport?.value ?? false
    }
  }

  const getDisplaySettings = () => {
    const settings = settingsQuery.data?.data?.display || {}
    return {
      theme: settings.theme?.value ?? 'light',
      density: settings.density?.value ?? 'comfortable',
      animations: settings.animations?.value ?? true,
      language: settings.language?.value ?? 'en-US',
      dateFormat: settings.dateFormat?.value ?? 'MM/dd/yyyy'
    }
  }

  const getAccountSettings = () => {
    const settings = settingsQuery.data?.data?.account || {}
    return {
      twoFactorAuth: settings.twoFactorAuth?.value ?? false,
      sessionTimeout: settings.sessionTimeout?.value ?? 30,
      loginHistory: settings.loginHistory?.value ?? true
    }
  }

  return {
    // Data
    settings: settingsQuery.data?.data || {},
    loading: settingsQuery.isLoading,
    error: settingsQuery.error,
    
    // Mutation states
    isUpdating: updateSettingMutation.isPending || updateSettingsMutation.isPending,
    
    // Methods
    getSetting,
    updateSetting,
    updateMultipleSettings,
    refetch,
    
    // Convenience getters
    getNotificationSettings,
    getPrivacySettings,
    getDisplaySettings,
    getAccountSettings,
    
    // Raw queries for advanced usage
    settingsQuery,
    updateSettingMutation,
    updateSettingsMutation
  }
}

/**
 * Hook for specific setting category
 */
export function useSettingsCategory(category: SettingCategory, enabled = true) {
  return useSettings({ category, enabled })
}

/**
 * Export types for use in components
 */
export type { SettingCategory, SettingDataType, UserSetting, GroupedSettings, SettingInput }