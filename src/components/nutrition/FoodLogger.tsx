/**
 * FoodLogger Component
 * 
 * Provides food search and logging functionality with quantity selection.
 */

'use client'

import React, { useState } from 'react'
import { useFoodSearch, useFoodLog, type Food } from '@/hooks/nutrition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Clock, Star, AlertCircle, CheckCircle } from 'lucide-react'

interface FoodLoggerProps {
  mealId?: string
  onFoodLogged?: (foodLog: any) => void
  onClose?: () => void
  showMealSelector?: boolean
}

const COMMON_UNITS = [
  { value: 'g', label: 'grams (g)' },
  { value: 'ml', label: 'milliliters (ml)' },
  { value: 'cup', label: 'cup' },
  { value: 'tbsp', label: 'tablespoon' },
  { value: 'tsp', label: 'teaspoon' },
  { value: 'oz', label: 'ounce' },
  { value: 'piece', label: 'piece' },
  { value: 'slice', label: 'slice' },
  { value: 'serving', label: 'serving' }
]

export function FoodLogger({ 
  mealId, 
  onFoodLogged, 
  onClose,
  showMealSelector = false 
}: FoodLoggerProps) {
  const { searchResults, recentFoods, loading, error, searchFoods, clearSearch, searchQuery } = useFoodSearch()
  const { logFood, logging, error: logError } = useFoodLog()
  
  const [selectedFood, setSelectedFood] = useState<Food | null>(null)
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('g')
  const [searchInput, setSearchInput] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSearch = async (query: string) => {
    setSearchInput(query)
    if (query.length > 2) {
      await searchFoods(query)
    } else if (query.length === 0) {
      clearSearch()
    }
  }

  const handleFoodSelect = (food: Food) => {
    setSelectedFood(food)
    setQuantity(food.servingSize?.toString() || '100')
    setUnit(food.servingUnit || 'g')
    clearSearch()
    setSearchInput('')
  }

  const handleLogFood = async () => {
    if (!selectedFood || !quantity) return

    const result = await logFood({
      foodId: selectedFood.id,
      quantity: parseFloat(quantity),
      unit,
      mealId
    })

    if (result) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
      
      // Reset form
      setSelectedFood(null)
      setQuantity('')
      setUnit('g')
      
      onFoodLogged?.(result)
    }
  }

  const calculateNutrition = () => {
    if (!selectedFood || !quantity) return null

    const qty = parseFloat(quantity)
    let multiplier = qty / 100 // Default to per 100g

    // Adjust multiplier based on unit and serving size
    if (unit === 'serving' && selectedFood.servingSize) {
      multiplier = (qty * selectedFood.servingSize) / 100
    } else if (unit !== 'g' && unit !== 'ml') {
      // For other units, assume they match serving size or use default
      multiplier = qty / 100
    }

    return {
      calories: Math.round(selectedFood.caloriesPer100g * multiplier),
      protein: Math.round(selectedFood.proteinPer100g * multiplier * 10) / 10,
      carbs: Math.round(selectedFood.carbsPer100g * multiplier * 10) / 10,
      fat: Math.round(selectedFood.fatPer100g * multiplier * 10) / 10
    }
  }

  const nutrition = calculateNutrition()

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {showSuccess && (
        <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-green-800">Food logged successfully!</span>
        </div>
      )}

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Search Food
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Search for food (e.g., chicken breast, apple, quinoa)"
              value={searchInput}
              onChange={(e) => handleSearch(e.target.value)}
              className="pr-10"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-700">Search Results</h4>
              {searchResults.map((food) => (
                <div
                  key={food.id}
                  onClick={() => handleFoodSelect(food)}
                  className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium">{food.name}</h5>
                      {food.brand && (
                        <p className="text-sm text-gray-600">{food.brand}</p>
                      )}
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{food.caloriesPer100g} cal/100g</p>
                      {food.isCustom && (
                        <Badge variant="secondary" className="text-xs">Custom</Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-1 flex space-x-4 text-xs text-gray-500">
                    <span>P: {food.proteinPer100g}g</span>
                    <span>C: {food.carbsPer100g}g</span>
                    <span>F: {food.fatPer100g}g</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Foods */}
          {recentFoods.length > 0 && !searchQuery && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Recent Foods
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recentFoods.slice(0, 6).map((food) => (
                  <div
                    key={food.id}
                    onClick={() => handleFoodSelect(food)}
                    className="p-2 border rounded cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <p className="font-medium text-sm">{food.name}</p>
                    <p className="text-xs text-gray-500">{food.caloriesPer100g} cal/100g</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Food and Quantity */}
      {selectedFood && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Log Food
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900">{selectedFood.name}</h4>
              {selectedFood.brand && (
                <p className="text-sm text-blue-700">{selectedFood.brand}</p>
              )}
              <div className="mt-2 flex space-x-4 text-sm text-blue-600">
                <span>Calories: {selectedFood.caloriesPer100g}/100g</span>
                <span>Protein: {selectedFood.proteinPer100g}g</span>
                <span>Carbs: {selectedFood.carbsPer100g}g</span>
                <span>Fat: {selectedFood.fatPer100g}g</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_UNITS.map((unitOption) => (
                      <SelectItem key={unitOption.value} value={unitOption.value}>
                        {unitOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Calculated Nutrition */}
            {nutrition && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <h5 className="font-medium text-green-900 mb-2">Nutritional Info for {quantity} {unit}</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-lg">{nutrition.calories}</p>
                    <p className="text-gray-600">Calories</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg text-red-600">{nutrition.protein}g</p>
                    <p className="text-gray-600">Protein</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg text-green-600">{nutrition.carbs}g</p>
                    <p className="text-gray-600">Carbs</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-lg text-yellow-600">{nutrition.fat}g</p>
                    <p className="text-gray-600">Fat</p>
                  </div>
                </div>
              </div>
            )}

            {logError && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-red-800 text-sm">{logError}</span>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                onClick={handleLogFood}
                disabled={!quantity || logging}
                className="flex-1"
              >
                {logging ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Log Food
              </Button>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}