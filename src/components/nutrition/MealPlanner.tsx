/**
 * MealPlanner Component
 * 
 * Allows users to plan meals in advance and manage meal templates.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar, Plus, Clock, Utensils, Trash2, Edit, AlertCircle } from 'lucide-react'
import type { Meal } from '@/hooks/nutrition/useFoodLog'

interface MealPlannerProps {
  userId: string
  selectedDate?: Date
  onMealCreated?: (meal: Meal) => void
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'lunch', label: 'Lunch', color: 'bg-green-100 text-green-800' },
  { value: 'dinner', label: 'Dinner', color: 'bg-blue-100 text-blue-800' },
  { value: 'snack', label: 'Snack', color: 'bg-purple-100 text-purple-800' }
]

export function MealPlanner({ userId, selectedDate = new Date(), onMealCreated }: MealPlannerProps) {
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newMeal, setNewMeal] = useState({
    name: '',
    mealType: 'breakfast' as const,
    plannedTime: '',
    notes: ''
  })

  const fetchMeals = async () => {
    setLoading(true)
    setError(null)

    try {
      const dateString = selectedDate.toISOString().split('T')[0]
      const response = await fetch(`/api/v1/modules/fitness?type=meals&date=${dateString}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch meals: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load meals')
      }
      
      setMeals(result.data || [])
    } catch (err) {
      console.error('Error fetching meals:', err)
      setError(err instanceof Error ? err.message : 'Failed to load meals')
    } finally {
      setLoading(false)
    }
  }

  const createMeal = async () => {
    setCreating(true)
    setError(null)

    try {
      const plannedDateTime = newMeal.plannedTime 
        ? new Date(`${selectedDate.toISOString().split('T')[0]}T${newMeal.plannedTime}`)
        : undefined

      const response = await fetch('/api/v1/modules/fitness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'meal',
          name: newMeal.name,
          mealType: newMeal.mealType,
          date: selectedDate.toISOString(),
          plannedTime: plannedDateTime?.toISOString(),
          notes: newMeal.notes || undefined
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create meal: ${response.statusText}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create meal')
      }

      // Reset form and refresh meals
      setNewMeal({ name: '', mealType: 'breakfast', plannedTime: '', notes: '' })
      setShowCreateForm(false)
      await fetchMeals()
      onMealCreated?.(result.data)
    } catch (err) {
      console.error('Error creating meal:', err)
      setError(err instanceof Error ? err.message : 'Failed to create meal')
    } finally {
      setCreating(false)
    }
  }

  const deleteMeal = async (mealId: string) => {
    try {
      const response = await fetch(`/api/v1/modules/fitness?type=meal&id=${mealId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete meal')
      }

      await fetchMeals()
    } catch (err) {
      console.error('Error deleting meal:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete meal')
    }
  }

  useEffect(() => {
    fetchMeals()
  }, [selectedDate])

  const getMealTypeConfig = (type: string) => {
    return MEAL_TYPES.find(t => t.value === type) || MEAL_TYPES[0]
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Meal Planner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Meal Planner
            </div>
            <span className="text-sm text-gray-500">
              {selectedDate.toLocaleDateString()}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}

          {/* Create Meal Button */}
          {!showCreateForm && (
            <Button onClick={() => setShowCreateForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Plan New Meal
            </Button>
          )}

          {/* Create Meal Form */}
          {showCreateForm && (
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
              <h4 className="font-medium">Plan New Meal</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meal Name
                  </label>
                  <Input
                    value={newMeal.name}
                    onChange={(e) => setNewMeal({ ...newMeal, name: e.target.value })}
                    placeholder="e.g., Protein smoothie"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meal Type
                  </label>
                  <Select 
                    value={newMeal.mealType} 
                    onValueChange={(value) => setNewMeal({ ...newMeal, mealType: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEAL_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planned Time (optional)
                  </label>
                  <Input
                    type="time"
                    value={newMeal.plannedTime}
                    onChange={(e) => setNewMeal({ ...newMeal, plannedTime: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <Input
                    value={newMeal.notes}
                    onChange={(e) => setNewMeal({ ...newMeal, notes: e.target.value })}
                    placeholder="e.g., Post-workout meal"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={createMeal}
                  disabled={!newMeal.name || creating}
                  className="flex-1"
                >
                  {creating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create Meal
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Planned Meals */}
          <div className="space-y-3">
            {meals.length === 0 ? (
              <div className="text-center py-8">
                <Utensils className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Meals Planned</h3>
                <p className="text-gray-500">
                  Plan your meals in advance to stay on track with your nutrition goals.
                </p>
              </div>
            ) : (
              <>
                <h4 className="font-medium text-gray-700">Planned Meals</h4>
                {meals
                  .sort((a, b) => {
                    // Sort by meal type order, then by planned time
                    const typeOrder = ['breakfast', 'lunch', 'dinner', 'snack']
                    const aTypeIndex = typeOrder.indexOf(a.mealType)
                    const bTypeIndex = typeOrder.indexOf(b.mealType)
                    
                    if (aTypeIndex !== bTypeIndex) {
                      return aTypeIndex - bTypeIndex
                    }
                    
                    if (a.plannedTime && b.plannedTime) {
                      return a.plannedTime.localeCompare(b.plannedTime)
                    }
                    
                    return 0
                  })
                  .map((meal) => {
                    const typeConfig = getMealTypeConfig(meal.mealType)
                    return (
                      <div
                        key={meal.id}
                        className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center space-x-3">
                          <Utensils className="h-5 w-5 text-gray-400" />
                          <div>
                            <h5 className="font-medium">{meal.name}</h5>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <Badge className={typeConfig.color}>
                                {typeConfig.label}
                              </Badge>
                              {meal.plannedTime && (
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {new Date(`2000-01-01T${meal.plannedTime.slice(11, 19)}`).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </span>
                              )}
                            </div>
                            {meal.notes && (
                              <p className="text-xs text-gray-400 mt-1">{meal.notes}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {meal.foods?.length ? (
                            <Badge variant="secondary">
                              {meal.foods.length} food{meal.foods.length !== 1 ? 's' : ''}
                            </Badge>
                          ) : null}
                          
                          <div className="text-right text-sm">
                            <p className="font-medium">{Math.round(meal.totalCalories || 0)} cal</p>
                            <p className="text-gray-500">{(meal.totalProtein || 0).toFixed(1)}p</p>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteMeal(meal.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}