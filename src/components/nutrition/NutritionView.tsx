/**
 * NutritionView Component
 * 
 * Main nutrition tracking interface that brings together all nutrition components.
 * This replaces the placeholder nutrition content in the fitness module.
 */

'use client'

import React, { useState } from 'react'
import { NutritionDashboard } from './NutritionDashboard'
import { FoodLogger } from './FoodLogger'
import { MealPlanner } from './MealPlanner'
import { WaterTracker } from './WaterTracker'
import { NutritionGoals } from './NutritionGoals'
import { NutritionTrends } from './NutritionTrends'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  BarChart3, 
  Droplets, 
  Plus, 
  Target, 
  TrendingUp,
  Calendar,
  Utensils
} from 'lucide-react'

interface NutritionViewProps {
  userId: string
}

export function NutritionView({ userId }: NutritionViewProps) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showFoodLogger, setShowFoodLogger] = useState(false)
  const [showGoalsSetting, setShowGoalsSetting] = useState(false)
  const [selectedDate] = useState<Date>(new Date())

  const handleFoodLogged = (foodLog: any) => {
    // Refresh dashboard data when food is logged
    console.log('Food logged:', foodLog)
    // The dashboard will auto-refresh when food is logged
  }

  const handleWaterLogged = (entry: any) => {
    // Handle water logging
    console.log('Water logged:', entry)
  }

  const handleGoalsSet = (goals: any) => {
    // Handle goals being set
    console.log('Goals set:', goals)
    setShowGoalsSetting(false)
  }

  const handleAddFood = () => {
    setShowFoodLogger(true)
  }

  const handleSetGoals = () => {
    setShowGoalsSetting(true)
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nutrition Tracking</h2>
          <p className="text-gray-600">
            Track your daily nutrition, set goals, and monitor your progress.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleSetGoals} variant="outline" size="sm">
            <Target className="h-4 w-4 mr-2" />
            Goals
          </Button>
          <Button onClick={handleAddFood} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Log Food
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="water" className="flex items-center">
            <Droplets className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Water</span>
          </TabsTrigger>
          <TabsTrigger value="food" className="flex items-center">
            <Utensils className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Log Food</span>
          </TabsTrigger>
          <TabsTrigger value="meals" className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Meals</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center">
            <Target className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Goals</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="dashboard">
            <NutritionDashboard
              date={selectedDate}
              onAddFood={handleAddFood}
              onSetGoals={handleSetGoals}
            />
          </TabsContent>

          <TabsContent value="water">
            <div className="max-w-2xl mx-auto">
              <WaterTracker
                date={selectedDate}
                onWaterLogged={handleWaterLogged}
                showGoalSetting={true}
                dailyGoalMl={2000}
              />
            </div>
          </TabsContent>

          <TabsContent value="food">
            <div className="max-w-4xl mx-auto">
              <FoodLogger
                onFoodLogged={handleFoodLogged}
                showMealSelector={true}
              />
            </div>
          </TabsContent>

          <TabsContent value="meals">
            <div className="max-w-4xl mx-auto">
              <MealPlanner
                userId={userId}
                selectedDate={selectedDate}
                onMealCreated={(meal) => {
                  console.log('Meal created:', meal)
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="trends">
            <NutritionTrends userId={userId} />
          </TabsContent>

          <TabsContent value="goals">
            <div className="max-w-4xl mx-auto">
              <NutritionGoals
                onGoalsSet={handleGoalsSet}
              />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* Food Logger Dialog */}
      <Dialog open={showFoodLogger} onOpenChange={setShowFoodLogger}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Log Food
            </DialogTitle>
          </DialogHeader>
          <FoodLogger
            onFoodLogged={(foodLog) => {
              handleFoodLogged(foodLog)
              setShowFoodLogger(false)
            }}
            onClose={() => setShowFoodLogger(false)}
            showMealSelector={true}
          />
        </DialogContent>
      </Dialog>

      {/* Goals Setting Dialog */}
      <Dialog open={showGoalsSetting} onOpenChange={setShowGoalsSetting}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Nutrition Goals
            </DialogTitle>
          </DialogHeader>
          <NutritionGoals
            onGoalsSet={handleGoalsSet}
            onClose={() => setShowGoalsSetting(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Quick Actions Float (Mobile-friendly) */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-2 sm:hidden">
        <Button
          onClick={handleAddFood}
          size="lg"
          className="rounded-full shadow-lg"
        >
          <Plus className="h-5 w-5" />
        </Button>
        <Button
          onClick={() => setActiveTab('water')}
          size="lg"
          variant="outline"
          className="rounded-full shadow-lg bg-white"
        >
          <Droplets className="h-5 w-5 text-blue-500" />
        </Button>
      </div>
    </div>
  )
}