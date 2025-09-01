/**
 * WaterTracker Component
 * 
 * Tracks daily water intake with quick add buttons and detailed logging.
 */

'use client'

import React, { useState } from 'react'
import { useWaterIntake } from '@/hooks/nutrition'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Droplets, Plus, Minus, Trash2, AlertCircle } from 'lucide-react'

interface WaterTrackerProps {
  date?: Date
  onWaterLogged?: (entry: any) => void
  showGoalSetting?: boolean
  dailyGoalMl?: number
}

const QUICK_AMOUNTS = [
  { ml: 250, label: 'Glass (250ml)' },
  { ml: 330, label: 'Can (330ml)' },
  { ml: 500, label: 'Bottle (500ml)' },
  { ml: 1000, label: 'Large Bottle (1L)' }
]

const TEMPERATURE_OPTIONS = [
  { value: 'cold', label: 'Cold' },
  { value: 'room', label: 'Room Temp' },
  { value: 'warm', label: 'Warm' },
  { value: 'hot', label: 'Hot' }
]

export function WaterTracker({ 
  date, 
  onWaterLogged, 
  showGoalSetting = false,
  dailyGoalMl = 2000 
}: WaterTrackerProps) {
  const { waterData, loading, logging, deleting, error, logWater, deleteWaterEntry, quickAddWater } = useWaterIntake(date)
  
  const [showCustomEntry, setShowCustomEntry] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [temperature, setTemperature] = useState<string>('room')
  const [source, setSource] = useState('')

  const handleQuickAdd = async (amountMl: number) => {
    const entry = await quickAddWater(amountMl)
    if (entry) {
      onWaterLogged?.(entry)
    }
  }

  const handleCustomLog = async () => {
    if (!customAmount) return

    const entry = await logWater({
      amountMl: parseInt(customAmount),
      temperature: temperature as any,
      source: source || undefined
    })

    if (entry) {
      setCustomAmount('')
      setTemperature('room')
      setSource('')
      setShowCustomEntry(false)
      onWaterLogged?.(entry)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    await deleteWaterEntry(id)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Droplets className="h-5 w-5 mr-2 text-blue-500" />
            Water Intake
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalMl = waterData?.totalMl || 0
  const totalOz = waterData?.totalOz || 0
  const progressPercent = (totalMl / dailyGoalMl) * 100
  const remainingMl = Math.max(0, dailyGoalMl - totalMl)

  return (
    <div className="space-y-4">
      {/* Main Water Tracking Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Droplets className="h-5 w-5 mr-2 text-blue-500" />
              Water Intake
            </div>
            <span className="text-sm text-gray-500">
              {date ? date.toLocaleDateString() : 'Today'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Progress */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{(totalMl / 1000).toFixed(1)}L</p>
                <p className="text-sm text-gray-500">liters</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{Math.round(totalOz)}</p>
                <p className="text-sm text-gray-500">fl oz</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Goal: {(dailyGoalMl / 1000).toFixed(1)}L</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress 
                value={Math.min(progressPercent, 100)} 
                className="h-3"
                indicatorClassName={progressPercent >= 100 ? "bg-green-500" : "bg-blue-500"}
              />
              {remainingMl > 0 && (
                <p className="text-sm text-center text-gray-600">
                  {(remainingMl / 1000).toFixed(1)}L to go
                </p>
              )}
              {progressPercent >= 100 && (
                <p className="text-sm text-center text-green-600 font-medium">
                  Goal achieved! Great job! 🎉
                </p>
              )}
            </div>
          </div>

          {/* Quick Add Buttons */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Quick Add</h4>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_AMOUNTS.map((amount) => (
                <Button
                  key={amount.ml}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickAdd(amount.ml)}
                  disabled={logging}
                  className="flex items-center justify-center"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {amount.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Entry Toggle */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustomEntry(!showCustomEntry)}
              className="text-blue-600"
            >
              <Plus className="h-4 w-4 mr-1" />
              Custom Amount
            </Button>
          </div>

          {/* Custom Entry Form */}
          {showCustomEntry && (
            <div className="space-y-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (ml)
                  </label>
                  <Input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="e.g., 250"
                    min="1"
                    max="2000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Temperature
                  </label>
                  <Select value={temperature} onValueChange={setTemperature}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPERATURE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source (optional)
                </label>
                <Input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="e.g., water bottle, tap water"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleCustomLog}
                  disabled={!customAmount || logging}
                  size="sm"
                  className="flex-1"
                >
                  {logging ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                  ) : (
                    <Plus className="h-3 w-3 mr-1" />
                  )}
                  Log Water
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomEntry(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Water Log */}
      {waterData?.entries && waterData.entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Water Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {waterData.entries
                .sort((a, b) => new Date(b.consumedAt).getTime() - new Date(a.consumedAt).getTime())
                .map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="font-medium">{entry.amountMl}ml</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{new Date(entry.consumedAt).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}</span>
                        {entry.temperature && (
                          <span>• {entry.temperature}</span>
                        )}
                        {entry.source && (
                          <span>• {entry.source}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteEntry(entry.id)}
                    disabled={deleting}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}