/**
 * Hook for nutrition dashboard data
 * 
 * Provides today's nutrition summary including calories, macros, water intake,
 * and progress towards daily goals.
 */

import { useState, useEffect, useCallback } from 'react'

export interface NutritionDashboard {
  date: string
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalFiber?: number
  totalSugar?: number
  totalSodium?: number
  waterIntakeMl: number
  goals?: {
    dailyCalories: number
    dailyProtein: number
    dailyCarbs: number
    dailyFat: number
    dailyWaterMl?: number
  }
  progress: {
    calories: number
    protein: number
    carbs: number
    fat: number
    water: number
  }
  mealBreakdown: {
    breakfast: { calories: number; protein: number; carbs: number; fat: number }
    lunch: { calories: number; protein: number; carbs: number; fat: number }
    dinner: { calories: number; protein: number; carbs: number; fat: number }
    snack: { calories: number; protein: number; carbs: number; fat: number }
  }
}

interface UseNutritionDashboardReturn {
  dashboardData: NutritionDashboard | null
  loading: boolean
  error: string | null
  refreshDashboard: () => Promise<void>
}

export function useNutritionDashboard(date?: Date): UseNutritionDashboardReturn {
  const [dashboardData, setDashboardData] = useState<NutritionDashboard | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const targetDate = date || new Date()
      const dateString = targetDate.toISOString().split('T')[0]
      
      const response = await fetch(
        `/api/v1/modules/fitness?type=nutrition-dashboard&date=${dateString}`
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch nutrition dashboard: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown error occurred')
      }

      // Transform API response to match component expectations
      const apiData = result.data
      const transformedData: NutritionDashboard = {
        date: apiData.date,
        totalCalories: apiData.todayTotals?.calories || 0,
        totalProtein: apiData.todayTotals?.protein || 0,
        totalCarbs: apiData.todayTotals?.carbs || 0,
        totalFat: apiData.todayTotals?.fat || 0,
        totalFiber: apiData.todayTotals?.fiber,
        totalSugar: apiData.todayTotals?.sugar,
        totalSodium: apiData.todayTotals?.sodium,
        waterIntakeMl: apiData.totalWaterMl || 0,
        goals: apiData.nutritionGoals ? {
          dailyCalories: apiData.nutritionGoals.dailyCalories,
          dailyProtein: apiData.nutritionGoals.dailyProtein,
          dailyCarbs: apiData.nutritionGoals.dailyCarbs,
          dailyFat: apiData.nutritionGoals.dailyFat,
          dailyWaterMl: apiData.waterGoalMl
        } : undefined,
        progress: {
          calories: apiData.goalProgress?.calories?.percentage || 0,
          protein: apiData.goalProgress?.protein?.percentage || 0,
          carbs: apiData.goalProgress?.carbs?.percentage || 0,
          fat: apiData.goalProgress?.fat?.percentage || 0,
          water: apiData.waterProgress || 0
        },
        mealBreakdown: apiData.mealBreakdown || {
          breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          lunch: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          dinner: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          snack: { calories: 0, protein: 0, carbs: 0, fat: 0 }
        }
      }
      
      setDashboardData(transformedData)
    } catch (err) {
      console.error('Error fetching nutrition dashboard:', err)
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [date])

  const refreshDashboard = useCallback(async () => {
    await fetchDashboard()
  }, [fetchDashboard])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  return {
    dashboardData,
    loading,
    error,
    refreshDashboard
  }
}