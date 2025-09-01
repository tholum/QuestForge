/**
 * NutritionTrends Component
 * 
 * Displays nutrition trends over time with charts and analytics.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Minus, Calendar, AlertCircle } from 'lucide-react'

interface TrendData {
  date: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  water: number
}

interface NutritionTrendsProps {
  userId?: string
}

export function NutritionTrends({ userId }: NutritionTrendsProps) {
  const [trendsData, setTrendsData] = useState<TrendData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('7') // days
  const [selectedMetric, setSelectedMetric] = useState('calories')

  const fetchTrends = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/modules/fitness?type=nutrition-trends&days=${period}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch nutrition trends: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load trends')
      }
      
      setTrendsData(result.data || [])
    } catch (err) {
      console.error('Error fetching nutrition trends:', err)
      setError(err instanceof Error ? err.message : 'Failed to load trends')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrends()
  }, [period])

  const getMetricValue = (data: TrendData, metric: string): number => {
    switch (metric) {
      case 'calories': return data.calories
      case 'protein': return data.protein
      case 'carbs': return data.carbs
      case 'fat': return data.fat
      case 'fiber': return data.fiber || 0
      case 'water': return data.water / 1000 // Convert to liters
      default: return 0
    }
  }

  const getMetricUnit = (metric: string): string => {
    switch (metric) {
      case 'calories': return 'cal'
      case 'water': return 'L'
      default: return 'g'
    }
  }

  const calculateTrend = (data: TrendData[], metric: string): { direction: 'up' | 'down' | 'stable'; percentage: number } => {
    if (data.length < 2) return { direction: 'stable', percentage: 0 }

    const recent = data.slice(-3).map(d => getMetricValue(d, metric))
    const older = data.slice(0, 3).map(d => getMetricValue(d, metric))

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length

    if (olderAvg === 0) return { direction: 'stable', percentage: 0 }

    const change = ((recentAvg - olderAvg) / olderAvg) * 100
    const absChange = Math.abs(change)

    if (absChange < 5) return { direction: 'stable', percentage: absChange }
    return { 
      direction: change > 0 ? 'up' : 'down', 
      percentage: absChange 
    }
  }

  const calculateAverage = (data: TrendData[], metric: string): number => {
    if (data.length === 0) return 0
    const sum = data.reduce((acc, d) => acc + getMetricValue(d, metric), 0)
    return Math.round((sum / data.length) * 10) / 10
  }

  const getMinMax = (data: TrendData[], metric: string): { min: number; max: number } => {
    if (data.length === 0) return { min: 0, max: 0 }
    
    const values = data.map(d => getMetricValue(d, metric))
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Nutrition Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="flex space-x-4 mb-4">
              <div className="h-10 bg-gray-200 rounded w-32"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Trends</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchTrends} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectedTrend = calculateTrend(trendsData, selectedMetric)
  const average = calculateAverage(trendsData, selectedMetric)
  const { min, max } = getMinMax(trendsData, selectedMetric)
  const unit = getMetricUnit(selectedMetric)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Nutrition Trends
          </div>
          <div className="flex items-center space-x-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="14">14 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchTrends}>
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metric Selector */}
        <div>
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="calories">Calories</SelectItem>
              <SelectItem value="protein">Protein</SelectItem>
              <SelectItem value="carbs">Carbohydrates</SelectItem>
              <SelectItem value="fat">Fat</SelectItem>
              <SelectItem value="fiber">Fiber</SelectItem>
              <SelectItem value="water">Water Intake</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              {selectedTrend.direction === 'up' && <TrendingUp className="h-5 w-5 text-green-600" />}
              {selectedTrend.direction === 'down' && <TrendingDown className="h-5 w-5 text-red-600" />}
              {selectedTrend.direction === 'stable' && <Minus className="h-5 w-5 text-gray-600" />}
              <span className={`ml-2 font-medium ${
                selectedTrend.direction === 'up' ? 'text-green-600' : 
                selectedTrend.direction === 'down' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {selectedTrend.direction === 'stable' ? 'Stable' : 
                 `${selectedTrend.percentage.toFixed(1)}% ${selectedTrend.direction}`}
              </span>
            </div>
            <p className="text-sm text-gray-600">Trend</p>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{average}</p>
            <p className="text-sm text-gray-600">Average {unit}</p>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-lg font-semibold text-orange-600">{min} - {max}</p>
            <p className="text-sm text-gray-600">Range {unit}</p>
          </div>
        </div>

        {/* Simple Chart */}
        {trendsData.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium capitalize">{selectedMetric} Over Time</h4>
            <div className="space-y-2">
              {trendsData.map((data, index) => {
                const value = getMetricValue(data, selectedMetric)
                const maxValue = Math.max(...trendsData.map(d => getMetricValue(d, selectedMetric)))
                const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
                
                return (
                  <div key={data.date} className="flex items-center space-x-3">
                    <div className="w-16 text-xs text-gray-600">
                      {new Date(data.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                      <div 
                        className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${Math.max(percentage, 5)}%` }}
                      >
                        <span className="text-white text-xs font-medium">
                          {value}{unit}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {trendsData.length === 0 && (
          <div className="text-center py-8">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-500">
              Start tracking your nutrition to see trends over time.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}