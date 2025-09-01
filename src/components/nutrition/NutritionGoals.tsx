/**
 * NutritionGoals Component
 * 
 * Allows users to set and manage their nutrition goals with smart recommendations.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useNutritionGoals } from '@/hooks/nutrition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Target, Calculator, Save, RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react'

interface NutritionGoalsProps {
  onGoalsSet?: (goals: any) => void
  onClose?: () => void
}

interface CalorieCalculatorData {
  weight: string
  height: string
  age: string
  gender: 'male' | 'female' | ''
  activityLevel: string
  goalType: string
}

export function NutritionGoals({ onGoalsSet, onClose }: NutritionGoalsProps) {
  const { goals, loading, updating, error, setGoals, updateGoals, calculateMacroDistribution, calculateCalorieNeeds } = useNutritionGoals()
  
  const [activeTab, setActiveTab] = useState('goals')
  const [formData, setFormData] = useState({
    dailyCalories: '',
    dailyProtein: '',
    dailyCarbs: '',
    dailyFat: '',
    dailyFiber: '',
    dailyWaterMl: '',
    goalType: 'maintenance',
    activityLevel: 'moderate'
  })

  const [calculatorData, setCalculatorData] = useState<CalorieCalculatorData>({
    weight: '',
    height: '',
    age: '',
    gender: '',
    activityLevel: 'moderate',
    goalType: 'maintenance'
  })

  const [calculatedNutrition, setCalculatedNutrition] = useState<{
    calories: number
    protein: number
    carbs: number
    fat: number
  } | null>(null)

  const [showSuccess, setShowSuccess] = useState(false)

  // Initialize form with existing goals
  useEffect(() => {
    if (goals) {
      setFormData({
        dailyCalories: goals.dailyCalories.toString(),
        dailyProtein: goals.dailyProtein.toString(),
        dailyCarbs: goals.dailyCarbs.toString(),
        dailyFat: goals.dailyFat.toString(),
        dailyFiber: goals.dailyFiber?.toString() || '',
        dailyWaterMl: goals.dailyWaterMl?.toString() || '2000',
        goalType: goals.goalType,
        activityLevel: goals.activityLevel
      })
    }
  }, [goals])

  const handleCalculate = () => {
    const { weight, height, age, gender, activityLevel, goalType } = calculatorData

    if (!weight || !height || !age || !gender) {
      return
    }

    const weightKg = parseFloat(weight)
    const heightCm = parseFloat(height)
    const ageYears = parseInt(age)

    const calories = calculateCalorieNeeds(
      weightKg,
      heightCm,
      ageYears,
      gender,
      activityLevel,
      goalType
    )

    const macros = calculateMacroDistribution(calories, goalType)
    
    setCalculatedNutrition({
      calories,
      ...macros
    })

    // Auto-fill the goals form with calculated values
    setFormData({
      dailyCalories: calories.toString(),
      dailyProtein: macros.protein.toString(),
      dailyCarbs: macros.carbs.toString(),
      dailyFat: macros.fat.toString(),
      dailyFiber: Math.round(calories * 0.014).toString(), // ~14g per 1000 calories
      dailyWaterMl: '2000',
      goalType,
      activityLevel
    })

    setActiveTab('goals')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const goalData = {
      dailyCalories: parseInt(formData.dailyCalories),
      dailyProtein: parseInt(formData.dailyProtein),
      dailyCarbs: parseInt(formData.dailyCarbs),
      dailyFat: parseInt(formData.dailyFat),
      dailyFiber: formData.dailyFiber ? parseInt(formData.dailyFiber) : undefined,
      dailyWaterMl: formData.dailyWaterMl ? parseInt(formData.dailyWaterMl) : undefined,
      goalType: formData.goalType as any,
      activityLevel: formData.activityLevel as any
    }

    let result
    if (goals?.id) {
      result = await updateGoals(goalData)
    } else {
      result = await setGoals(goalData)
    }

    if (result) {
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      onGoalsSet?.(result)
    }
  }

  const getGoalTypeDescription = (type: string) => {
    switch (type) {
      case 'weight_loss':
        return 'Create a calorie deficit to lose weight gradually'
      case 'weight_gain':
        return 'Create a calorie surplus to gain weight'
      case 'muscle_gain':
        return 'Moderate surplus with high protein for lean muscle'
      case 'maintenance':
        return 'Maintain current weight with balanced nutrition'
      default:
        return 'General healthy eating goals'
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48"></div>
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Target className="h-6 w-6 mr-2" />
          Nutrition Goals
        </CardTitle>
        <p className="text-gray-600">
          Set your daily nutrition targets to track your progress effectively.
        </p>
      </CardHeader>
      <CardContent>
        {showSuccess && (
          <div className="mb-4 flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800">Goals saved successfully!</span>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calculator" className="flex items-center">
              <Calculator className="h-4 w-4 mr-2" />
              Calculator
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Set Goals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                <div className="text-blue-800">
                  <p className="font-medium">Calorie & Macro Calculator</p>
                  <p className="text-sm mt-1">
                    Enter your details below to calculate your daily calorie needs and recommended macro distribution.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={calculatorData.weight}
                    onChange={(e) => setCalculatorData({ ...calculatorData, weight: e.target.value })}
                    placeholder="e.g., 70"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={calculatorData.height}
                    onChange={(e) => setCalculatorData({ ...calculatorData, height: e.target.value })}
                    placeholder="e.g., 170"
                  />
                </div>
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={calculatorData.age}
                    onChange={(e) => setCalculatorData({ ...calculatorData, age: e.target.value })}
                    placeholder="e.g., 30"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={calculatorData.gender} onValueChange={(value) => setCalculatorData({ ...calculatorData, gender: value as any })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="calc-activity">Activity Level</Label>
                  <Select value={calculatorData.activityLevel} onValueChange={(value) => setCalculatorData({ ...calculatorData, activityLevel: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
                      <SelectItem value="light">Light (light exercise 1-3 days/week)</SelectItem>
                      <SelectItem value="moderate">Moderate (moderate exercise 3-5 days/week)</SelectItem>
                      <SelectItem value="active">Active (hard exercise 6-7 days/week)</SelectItem>
                      <SelectItem value="very_active">Very Active (very hard exercise, physical job)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="calc-goal">Goal Type</Label>
                  <Select value={calculatorData.goalType} onValueChange={(value) => setCalculatorData({ ...calculatorData, goalType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight_loss">Weight Loss</SelectItem>
                      <SelectItem value="maintenance">Maintain Weight</SelectItem>
                      <SelectItem value="weight_gain">Weight Gain</SelectItem>
                      <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleCalculate} className="w-full">
                <Calculator className="h-4 w-4 mr-2" />
                Calculate My Needs
              </Button>

              {calculatedNutrition && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-3">Recommended Daily Targets</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{calculatedNutrition.calories}</p>
                      <p className="text-sm text-gray-600">Calories</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-red-600">{calculatedNutrition.protein}g</p>
                      <p className="text-sm text-gray-600">Protein</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{calculatedNutrition.carbs}g</p>
                      <p className="text-sm text-gray-600">Carbs</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{calculatedNutrition.fat}g</p>
                      <p className="text-sm text-gray-600">Fat</p>
                    </div>
                  </div>
                  <p className="text-sm text-green-700 mt-3 text-center">
                    {getGoalTypeDescription(calculatorData.goalType)}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Goal Type and Activity Level */}
                <div>
                  <Label htmlFor="goalType">Goal Type</Label>
                  <Select value={formData.goalType} onValueChange={(value) => setFormData({ ...formData, goalType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight_loss">Weight Loss</SelectItem>
                      <SelectItem value="maintenance">Maintain Weight</SelectItem>
                      <SelectItem value="weight_gain">Weight Gain</SelectItem>
                      <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                      <SelectItem value="general">General Health</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {getGoalTypeDescription(formData.goalType)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="activityLevel">Activity Level</Label>
                  <Select value={formData.activityLevel} onValueChange={(value) => setFormData({ ...formData, activityLevel: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary</SelectItem>
                      <SelectItem value="light">Light Activity</SelectItem>
                      <SelectItem value="moderate">Moderate Activity</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="very_active">Very Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Macronutrients */}
                <div>
                  <Label htmlFor="dailyCalories">Daily Calories</Label>
                  <Input
                    id="dailyCalories"
                    type="number"
                    value={formData.dailyCalories}
                    onChange={(e) => setFormData({ ...formData, dailyCalories: e.target.value })}
                    placeholder="e.g., 2000"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dailyProtein">Daily Protein (g)</Label>
                  <Input
                    id="dailyProtein"
                    type="number"
                    value={formData.dailyProtein}
                    onChange={(e) => setFormData({ ...formData, dailyProtein: e.target.value })}
                    placeholder="e.g., 150"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dailyCarbs">Daily Carbs (g)</Label>
                  <Input
                    id="dailyCarbs"
                    type="number"
                    value={formData.dailyCarbs}
                    onChange={(e) => setFormData({ ...formData, dailyCarbs: e.target.value })}
                    placeholder="e.g., 250"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dailyFat">Daily Fat (g)</Label>
                  <Input
                    id="dailyFat"
                    type="number"
                    value={formData.dailyFat}
                    onChange={(e) => setFormData({ ...formData, dailyFat: e.target.value })}
                    placeholder="e.g., 67"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dailyFiber">Daily Fiber (g) - Optional</Label>
                  <Input
                    id="dailyFiber"
                    type="number"
                    value={formData.dailyFiber}
                    onChange={(e) => setFormData({ ...formData, dailyFiber: e.target.value })}
                    placeholder="e.g., 25"
                  />
                </div>

                <div>
                  <Label htmlFor="dailyWaterMl">Daily Water (ml)</Label>
                  <Input
                    id="dailyWaterMl"
                    type="number"
                    value={formData.dailyWaterMl}
                    onChange={(e) => setFormData({ ...formData, dailyWaterMl: e.target.value })}
                    placeholder="e.g., 2000"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              )}

              <div className="flex space-x-3">
                <Button type="submit" disabled={updating} className="flex-1">
                  {updating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {goals?.id ? 'Update Goals' : 'Set Goals'}
                </Button>
                {onClose && (
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}