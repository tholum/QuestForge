/**
 * NutritionDashboard Component
 * 
 * Displays today's nutrition summary including calories, macros, and progress.
 */

'use client'

import React from 'react'
import { useNutritionDashboard, useNutritionGoals } from '@/hooks/nutrition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Droplets, Target, TrendingUp, Plus, AlertCircle } from 'lucide-react'

interface NutritionDashboardProps {
  date?: Date
  onAddFood?: () => void
  onSetGoals?: () => void
}

export function NutritionDashboard({ 
  date, 
  onAddFood, 
  onSetGoals 
}: NutritionDashboardProps) {
  const { dashboardData, loading, error, refreshDashboard } = useNutritionDashboard(date)
  const { goals } = useNutritionGoals()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Dashboard</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={refreshDashboard} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!dashboardData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Nutrition Data</h3>
            <p className="text-gray-500 mb-4">Start tracking your nutrition to see your dashboard.</p>
            <Button onClick={onAddFood}>
              <Plus className="h-4 w-4 mr-2" />
              Add Food
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { 
    totalCalories, 
    totalProtein, 
    totalCarbs, 
    totalFat, 
    waterIntakeMl,
    goals: dashboardGoals,
    progress,
    mealBreakdown
  } = dashboardData

  const currentGoals = goals || dashboardGoals

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nutrition Dashboard</h2>
          <p className="text-gray-500">
            {date ? date.toLocaleDateString() : 'Today'} • Track your daily nutrition
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={refreshDashboard}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={onAddFood}>
            <Plus className="h-4 w-4 mr-2" />
            Add Food
          </Button>
        </div>
      </div>

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calories */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold">
                {totalCalories.toLocaleString()}
              </span>
              {currentGoals?.dailyCalories && (
                <span className="text-sm text-gray-500">
                  / {currentGoals.dailyCalories.toLocaleString()}
                </span>
              )}
            </div>
            {currentGoals?.dailyCalories && (
              <Progress 
                value={progress.calories} 
                className="h-2"
                indicatorClassName={progress.calories > 100 ? "bg-red-500" : "bg-blue-500"}
              />
            )}
          </CardContent>
        </Card>

        {/* Protein */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Protein</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-red-600">
                {totalProtein.toFixed(1)}g
              </span>
              {currentGoals?.dailyProtein && (
                <span className="text-sm text-gray-500">
                  / {currentGoals.dailyProtein}g
                </span>
              )}
            </div>
            {currentGoals?.dailyProtein && (
              <Progress 
                value={progress.protein} 
                className="h-2"
                indicatorClassName="bg-red-500"
              />
            )}
          </CardContent>
        </Card>

        {/* Carbs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Carbs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-green-600">
                {totalCarbs.toFixed(1)}g
              </span>
              {currentGoals?.dailyCarbs && (
                <span className="text-sm text-gray-500">
                  / {currentGoals.dailyCarbs}g
                </span>
              )}
            </div>
            {currentGoals?.dailyCarbs && (
              <Progress 
                value={progress.carbs} 
                className="h-2"
                indicatorClassName="bg-green-500"
              />
            )}
          </CardContent>
        </Card>

        {/* Fat */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Fat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-yellow-600">
                {totalFat.toFixed(1)}g
              </span>
              {currentGoals?.dailyFat && (
                <span className="text-sm text-gray-500">
                  / {currentGoals.dailyFat}g
                </span>
              )}
            </div>
            {currentGoals?.dailyFat && (
              <Progress 
                value={progress.fat} 
                className="h-2"
                indicatorClassName="bg-yellow-500"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Water Intake and Goal Setting */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Water Intake */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Droplets className="h-5 w-5 mr-2 text-blue-500" />
              Water Intake
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-bold text-blue-600">
                {(waterIntakeMl / 1000).toFixed(1)}L
              </span>
              <span className="text-lg text-gray-500">
                {Math.round(waterIntakeMl * 0.033814)} fl oz
              </span>
            </div>
            {currentGoals?.dailyWaterMl && (
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Goal: {(currentGoals.dailyWaterMl / 1000).toFixed(1)}L</span>
                  <span>{Math.round(progress.water)}%</span>
                </div>
                <Progress 
                  value={progress.water} 
                  className="h-2"
                  indicatorClassName="bg-blue-500"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2 text-purple-500" />
              Goals Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!currentGoals ? (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">No nutrition goals set</p>
                <Button variant="outline" onClick={onSetGoals}>
                  Set Goals
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-gray-500">
                    {Math.round((progress.calories + progress.protein + progress.carbs + progress.fat) / 4)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Goal Type</p>
                    <p className="font-medium capitalize">{currentGoals.goalType.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Activity Level</p>
                    <p className="font-medium capitalize">{currentGoals.activityLevel.replace('_', ' ')}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Meal Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Meal Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(mealBreakdown).map(([mealType, nutrition]) => (
              <div key={mealType} className="text-center">
                <h4 className="font-medium capitalize mb-2">{mealType}</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">{Math.round(nutrition.calories)}</span> cal</p>
                  <p className="text-red-600">{nutrition.protein.toFixed(1)}g protein</p>
                  <p className="text-green-600">{nutrition.carbs.toFixed(1)}g carbs</p>
                  <p className="text-yellow-600">{nutrition.fat.toFixed(1)}g fat</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}