/**
 * Hook for nutrition goals management
 * 
 * Provides functionality to get, set, and update nutrition goals
 * and track progress towards those goals.
 */

import { useState, useCallback, useEffect } from 'react'

export interface NutritionGoals {
  id?: string
  userId: string
  dailyCalories: number
  dailyProtein: number
  dailyCarbs: number
  dailyFat: number
  dailyFiber?: number
  dailySugar?: number
  dailySodium?: number
  dailyWaterMl?: number
  goalType: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain' | 'general'
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  startDate?: string
  endDate?: string
  createdAt?: string
  updatedAt?: string
}

interface SetGoalsParams {
  dailyCalories: number
  dailyProtein: number
  dailyCarbs: number
  dailyFat: number
  dailyFiber?: number
  dailySugar?: number
  dailySodium?: number
  dailyWaterMl?: number
  goalType?: 'weight_loss' | 'weight_gain' | 'maintenance' | 'muscle_gain' | 'general'
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  startDate?: Date
  endDate?: Date
}

interface UseNutritionGoalsReturn {
  goals: NutritionGoals | null
  loading: boolean
  updating: boolean
  error: string | null
  setGoals: (params: SetGoalsParams) => Promise<NutritionGoals | null>
  updateGoals: (params: Partial<SetGoalsParams>) => Promise<NutritionGoals | null>
  clearGoals: () => Promise<boolean>
  refreshGoals: () => Promise<void>
  calculateMacroDistribution: (calories: number, goalType: string) => { protein: number; carbs: number; fat: number }
  calculateCalorieNeeds: (weight: number, height: number, age: number, gender: 'male' | 'female', activityLevel: string, goalType: string) => number
}

export function useNutritionGoals(): UseNutritionGoalsReturn {
  const [goals, setGoalsData] = useState<NutritionGoals | null>(null)
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/modules/fitness?type=nutrition-goals')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch nutrition goals: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load nutrition goals')
      }
      
      setGoalsData(result.data)
    } catch (err) {
      console.error('Error fetching nutrition goals:', err)
      setError(err instanceof Error ? err.message : 'Failed to load nutrition goals')
    } finally {
      setLoading(false)
    }
  }, [])

  const setGoals = useCallback(async (params: SetGoalsParams): Promise<NutritionGoals | null> => {
    setUpdating(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/modules/fitness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'nutrition-goal',
          ...params,
          startDate: params.startDate?.toISOString(),
          endDate: params.endDate?.toISOString()
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to set nutrition goals: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to set nutrition goals')
      }

      setGoalsData(result.data)
      return result.data
    } catch (err) {
      console.error('Error setting nutrition goals:', err)
      setError(err instanceof Error ? err.message : 'Failed to set nutrition goals')
      return null
    } finally {
      setUpdating(false)
    }
  }, [])

  const updateGoals = useCallback(async (params: Partial<SetGoalsParams>): Promise<NutritionGoals | null> => {
    if (!goals?.id) {
      throw new Error('No existing goals to update')
    }

    setUpdating(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/modules/fitness', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'nutrition-goal',
          id: goals.id,
          ...params,
          startDate: params.startDate?.toISOString(),
          endDate: params.endDate?.toISOString()
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update nutrition goals: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update nutrition goals')
      }

      setGoalsData(result.data)
      return result.data
    } catch (err) {
      console.error('Error updating nutrition goals:', err)
      setError(err instanceof Error ? err.message : 'Failed to update nutrition goals')
      return null
    } finally {
      setUpdating(false)
    }
  }, [goals?.id])

  const clearGoals = useCallback(async (): Promise<boolean> => {
    setUpdating(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/modules/fitness?type=nutrition-goal&id=all', {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Failed to clear nutrition goals: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to clear nutrition goals')
      }

      setGoalsData(null)
      return true
    } catch (err) {
      console.error('Error clearing nutrition goals:', err)
      setError(err instanceof Error ? err.message : 'Failed to clear nutrition goals')
      return false
    } finally {
      setUpdating(false)
    }
  }, [])

  const refreshGoals = useCallback(async () => {
    await fetchGoals()
  }, [fetchGoals])

  // Helper function to calculate macro distribution based on goal type
  const calculateMacroDistribution = useCallback((calories: number, goalType: string) => {
    let proteinPercent: number
    let carbsPercent: number
    let fatPercent: number

    switch (goalType) {
      case 'weight_loss':
        proteinPercent = 0.35 // Higher protein for satiety and muscle preservation
        fatPercent = 0.25
        carbsPercent = 0.40
        break
      case 'muscle_gain':
        proteinPercent = 0.30 // High protein for muscle building
        fatPercent = 0.25
        carbsPercent = 0.45
        break
      case 'weight_gain':
        proteinPercent = 0.25
        fatPercent = 0.30 // Higher fat for calorie density
        carbsPercent = 0.45
        break
      case 'maintenance':
      default:
        proteinPercent = 0.25 // Balanced macro distribution
        fatPercent = 0.25
        carbsPercent = 0.50
        break
    }

    return {
      protein: Math.round((calories * proteinPercent) / 4), // 4 calories per gram of protein
      carbs: Math.round((calories * carbsPercent) / 4), // 4 calories per gram of carbs
      fat: Math.round((calories * fatPercent) / 9) // 9 calories per gram of fat
    }
  }, [])

  // Helper function to calculate calorie needs using Mifflin-St Jeor equation
  const calculateCalorieNeeds = useCallback((
    weight: number, // kg
    height: number, // cm
    age: number,
    gender: 'male' | 'female',
    activityLevel: string,
    goalType: string
  ): number => {
    // Calculate BMR (Basal Metabolic Rate)
    let bmr: number
    if (gender === 'male') {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
    } else {
      bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161
    }

    // Activity level multipliers
    const activityMultipliers: Record<string, number> = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    }

    const tdee = bmr * (activityMultipliers[activityLevel] || 1.55)

    // Adjust for goal type
    switch (goalType) {
      case 'weight_loss':
        return Math.round(tdee - 500) // 500 calorie deficit for ~1lb/week loss
      case 'weight_gain':
        return Math.round(tdee + 500) // 500 calorie surplus for weight gain
      case 'muscle_gain':
        return Math.round(tdee + 300) // Moderate surplus for lean gains
      case 'maintenance':
      default:
        return Math.round(tdee)
    }
  }, [])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  return {
    goals,
    loading,
    updating,
    error,
    setGoals,
    updateGoals,
    clearGoals,
    refreshGoals,
    calculateMacroDistribution,
    calculateCalorieNeeds
  }
}