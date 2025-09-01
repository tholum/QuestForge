/**
 * Hook for food search functionality
 * 
 * Provides search functionality for the food database with autocomplete
 * and recent/favorite foods access.
 */

import { useState, useCallback, useEffect } from 'react'

export interface Food {
  id: string
  name: string
  brand?: string
  barcode?: string
  caloriesPer100g: number
  proteinPer100g: number
  carbsPer100g: number
  fatPer100g: number
  fiberPer100g?: number
  sugarPer100g?: number
  sodiumPer100g?: number
  servingSize?: number
  servingUnit?: string
  category?: string
  isCustom?: boolean
  userId?: string
}

interface UseFoodSearchReturn {
  searchResults: Food[]
  recentFoods: Food[]
  favoriteFoods: Food[]
  loading: boolean
  error: string | null
  searchFoods: (query: string) => Promise<void>
  clearSearch: () => void
  searchQuery: string
}

export function useFoodSearch(): UseFoodSearchReturn {
  const [searchResults, setSearchResults] = useState<Food[]>([])
  const [recentFoods, setRecentFoods] = useState<Food[]>([])
  const [favoriteFoods, setFavoriteFoods] = useState<Food[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const searchFoods = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setSearchQuery('')
      return
    }

    setLoading(true)
    setError(null)
    setSearchQuery(query)

    try {
      const response = await fetch(
        `/api/v1/modules/fitness?type=food-search&query=${encodeURIComponent(query)}&limit=20`
      )
      
      if (!response.ok) {
        throw new Error(`Failed to search foods: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Search failed')
      }
      
      setSearchResults(result.data || [])
    } catch (err) {
      console.error('Error searching foods:', err)
      setError(err instanceof Error ? err.message : 'Search failed')
      setSearchResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const clearSearch = useCallback(() => {
    setSearchResults([])
    setSearchQuery('')
    setError(null)
  }, [])

  // Load recent and favorite foods on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // For now, we'll get recent foods from recent food logs
        // This would typically be handled by a separate API endpoint
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 7)
        
        // Get recent food logs to extract recent foods
        const response = await fetch(
          `/api/v1/modules/fitness?type=food-logs&date=${today.toISOString().split('T')[0]}`
        )
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            // Extract unique foods from recent logs
            const uniqueFoods = new Map<string, Food>()
            result.data.forEach((log: any) => {
              if (log.food) {
                uniqueFoods.set(log.food.id, log.food)
              }
            })
            setRecentFoods(Array.from(uniqueFoods.values()).slice(0, 10))
          }
        }
      } catch (err) {
        console.warn('Failed to load recent foods:', err)
      }
    }

    loadInitialData()
  }, [])

  return {
    searchResults,
    recentFoods,
    favoriteFoods,
    loading,
    error,
    searchFoods,
    clearSearch,
    searchQuery
  }
}