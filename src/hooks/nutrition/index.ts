/**
 * Nutrition hooks barrel export
 * 
 * Centralized exports for all nutrition-related hooks
 */

export { useNutritionDashboard } from './useNutritionDashboard'
export { useFoodSearch } from './useFoodSearch'
export { useFoodLog } from './useFoodLog'
export { useWaterIntake } from './useWaterIntake'
export { useNutritionGoals } from './useNutritionGoals'

// Re-export types
export type { NutritionDashboard } from './useNutritionDashboard'
export type { Food } from './useFoodSearch'
export type { FoodLog, Meal } from './useFoodLog'
export type { WaterIntakeEntry, WaterIntakeData } from './useWaterIntake'
export type { NutritionGoals } from './useNutritionGoals'