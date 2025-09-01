/**
 * Hook for food logging operations
 * 
 * Provides functionality to log, update, and delete food entries,
 * and manage meals.
 */

import { useState, useCallback } from 'react'
import type { Food } from './useFoodSearch'

export interface FoodLog {
  id: string
  userId: string
  foodId: string
  food: Food
  quantity: number
  unit: string
  mealId?: string
  meal?: Meal
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  consumedAt: string
  createdAt: string
  updatedAt: string
}

export interface Meal {
  id: string
  userId: string
  name: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  date: string
  plannedTime?: string
  notes?: string
  foods: FoodLog[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
}

interface LogFoodParams {
  foodId: string
  quantity: number
  unit: string
  mealId?: string
}

interface UpdateFoodLogParams {
  id: string
  quantity?: number
  unit?: string
  mealId?: string
}

interface UseFoodLogReturn {
  logging: boolean
  updating: boolean
  deleting: boolean
  error: string | null
  logFood: (params: LogFoodParams) => Promise<FoodLog | null>
  updateFoodLog: (params: UpdateFoodLogParams) => Promise<FoodLog | null>
  deleteFoodLog: (id: string) => Promise<boolean>
  logMultipleFoods: (foods: LogFoodParams[], mealId?: string) => Promise<FoodLog[]>
  clearError: () => void
}

export function useFoodLog(): UseFoodLogReturn {
  const [logging, setLogging] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const logFood = useCallback(async (params: LogFoodParams): Promise<FoodLog | null> => {
    setLogging(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/modules/fitness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'food-log',
          ...params
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to log food: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to log food')
      }

      return result.data
    } catch (err) {
      console.error('Error logging food:', err)
      setError(err instanceof Error ? err.message : 'Failed to log food')
      return null
    } finally {
      setLogging(false)
    }
  }, [])

  const updateFoodLog = useCallback(async (params: UpdateFoodLogParams): Promise<FoodLog | null> => {
    setUpdating(true)
    setError(null)

    try {
      const { id, ...updateData } = params
      const response = await fetch('/api/v1/modules/fitness', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'food-log',
          id,
          ...updateData
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update food log: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update food log')
      }

      return result.data
    } catch (err) {
      console.error('Error updating food log:', err)
      setError(err instanceof Error ? err.message : 'Failed to update food log')
      return null
    } finally {
      setUpdating(false)
    }
  }, [])

  const deleteFoodLog = useCallback(async (id: string): Promise<boolean> => {
    setDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/modules/fitness?type=food-log&id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Failed to delete food log: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete food log')
      }

      return true
    } catch (err) {
      console.error('Error deleting food log:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete food log')
      return false
    } finally {
      setDeleting(false)
    }
  }, [])

  const logMultipleFoods = useCallback(async (foods: LogFoodParams[], mealId?: string): Promise<FoodLog[]> => {
    setLogging(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/modules/fitness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'bulk-food-log',
          foods,
          mealId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to log foods: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to log foods')
      }

      return result.data || []
    } catch (err) {
      console.error('Error logging multiple foods:', err)
      setError(err instanceof Error ? err.message : 'Failed to log foods')
      return []
    } finally {
      setLogging(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    logging,
    updating,
    deleting,
    error,
    logFood,
    updateFoodLog,
    deleteFoodLog,
    logMultipleFoods,
    clearError
  }
}