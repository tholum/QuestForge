'use client'

import React, { useState } from 'react'
import { Calendar, Plus, Clock, Repeat, X } from 'lucide-react'
import { format, addWeeks } from 'date-fns'
import { Button } from '@/components/base'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

// Define types locally to avoid server imports
interface RecurringPattern {
  id: string
  name: string
  description?: string
  workoutTemplateId: string
  frequency: 'daily' | 'weekly' | 'custom'
  daysOfWeek?: number[]
  timesPerWeek?: number
  duration?: number
  startDate: Date
  endDate?: Date
  isActive: boolean
}

interface CreateRecurringPatternInput {
  name: string
  description?: string
  workoutTemplateId: string
  frequency: 'daily' | 'weekly' | 'custom'
  daysOfWeek?: number[]
  timesPerWeek?: number
  duration?: number
  startDate: Date
  endDate?: Date
}

export interface RecurringPatternDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (pattern: CreateRecurringPatternInput) => Promise<void>
  workoutTemplates?: Array<{
    id: string
    name: string
    workoutType: string
    estimatedDuration?: number
  }>
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullLabel: 'Sunday' },
  { value: 1, label: 'Mon', fullLabel: 'Monday' },
  { value: 2, label: 'Tue', fullLabel: 'Tuesday' },
  { value: 3, label: 'Wed', fullLabel: 'Wednesday' },
  { value: 4, label: 'Thu', fullLabel: 'Thursday' },
  { value: 5, label: 'Fri', fullLabel: 'Friday' },
  { value: 6, label: 'Sat', fullLabel: 'Saturday' }
]

export function RecurringPatternDialog({
  isOpen,
  onClose,
  onSave,
  workoutTemplates = []
}: RecurringPatternDialogProps) {
  const [formData, setFormData] = useState<CreateRecurringPatternInput>({
    name: '',
    description: '',
    workoutTemplateId: '',
    frequency: 'weekly',
    daysOfWeek: [1, 3, 5], // Default to MWF
    timesPerWeek: 3,
    duration: 12, // 12 weeks default
    startDate: new Date()
  })
  
  const [selectedPattern, setSelectedPattern] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewDates, setPreviewDates] = useState<Date[]>([])

  // Define common patterns locally
  const commonPatterns = [
    {
      name: 'Daily Cardio',
      description: 'Cardio workout every day',
      frequency: 'daily' as const
    },
    {
      name: 'MWF Strength',
      description: 'Strength training on Monday, Wednesday, Friday',
      frequency: 'weekly' as const,
      daysOfWeek: [1, 3, 5]
    },
    {
      name: 'Weekend Warrior',
      description: 'Workouts on Saturday and Sunday',
      frequency: 'weekly' as const,
      daysOfWeek: [0, 6]
    },
    {
      name: 'Leg Day (3x/week)',
      description: 'Leg workouts 3 times per week',
      frequency: 'custom' as const,
      timesPerWeek: 3
    },
    {
      name: 'Upper Body (2x/week)',
      description: 'Upper body workouts 2 times per week',
      frequency: 'custom' as const,
      timesPerWeek: 2
    },
    {
      name: 'Full Body (4x/week)',
      description: 'Full body workouts 4 times per week',
      frequency: 'custom' as const,
      timesPerWeek: 4
    }
  ]

  const handlePatternSelect = (patternName: string) => {
    const pattern = commonPatterns.find(p => p.name === patternName)
    if (pattern) {
      setFormData(prev => ({
        ...prev,
        name: pattern.name,
        description: pattern.description,
        frequency: pattern.frequency,
        daysOfWeek: pattern.daysOfWeek,
        timesPerWeek: pattern.timesPerWeek
      }))
      setSelectedPattern(patternName)
      updatePreview()
    }
  }

  const handleDayToggle = (dayValue: number) => {
    setFormData(prev => {
      const currentDays = prev.daysOfWeek || []
      const isSelected = currentDays.includes(dayValue)
      
      const newDays = isSelected
        ? currentDays.filter(day => day !== dayValue)
        : [...currentDays, dayValue].sort((a, b) => a - b)
      
      return { ...prev, daysOfWeek: newDays }
    })
    updatePreview()
  }

  const updatePreview = () => {
    try {
      // Simple client-side preview calculation
      const dates: Date[] = []
      const current = new Date(formData.startDate)
      const endDate = addWeeks(formData.startDate, 2) // 2 week preview
      
      if (formData.frequency === 'daily') {
        while (current <= endDate && dates.length < 14) {
          dates.push(new Date(current))
          current.setDate(current.getDate() + 1)
        }
      } else if (formData.frequency === 'weekly' && formData.daysOfWeek) {
        while (current <= endDate && dates.length < 14) {
          const weekStart = new Date(current)
          weekStart.setDate(current.getDate() - current.getDay())
          
          for (const dayOfWeek of formData.daysOfWeek) {
            const workoutDate = new Date(weekStart)
            workoutDate.setDate(weekStart.getDate() + dayOfWeek)
            
            if (workoutDate >= formData.startDate && workoutDate <= endDate) {
              dates.push(new Date(workoutDate))
            }
          }
          
          current.setDate(current.getDate() + 7)
        }
      }
      
      dates.sort((a, b) => a.getTime() - b.getTime())
      setPreviewDates(dates.slice(0, 14))
    } catch (error) {
      console.error('Error generating preview:', error)
      setPreviewDates([])
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a pattern name')
      return
    }
    
    if (!formData.workoutTemplateId) {
      alert('Please select a workout template')
      return
    }

    if (formData.frequency === 'weekly' && (!formData.daysOfWeek || formData.daysOfWeek.length === 0)) {
      alert('Please select at least one day of the week')
      return
    }

    if (formData.frequency === 'custom' && (!formData.timesPerWeek || formData.timesPerWeek < 1)) {
      alert('Please specify times per week')
      return
    }

    setIsSubmitting(true)
    try {
      await onSave(formData)
      onClose()
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        workoutTemplateId: '',
        frequency: 'weekly',
        daysOfWeek: [1, 3, 5],
        timesPerWeek: 3,
        duration: 12,
        startDate: new Date()
      })
      setSelectedPattern('')
      setPreviewDates([])
    } catch (error) {
      console.error('Error creating recurring pattern:', error)
      alert('Failed to create recurring pattern. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  React.useEffect(() => {
    if (isOpen) {
      updatePreview()
    }
  }, [isOpen, formData])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Create Recurring Workout Pattern
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="space-y-6">
            {/* Quick Patterns */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Quick Patterns</Label>
              <div className="grid grid-cols-1 gap-2">
                {commonPatterns.map((pattern) => (
                  <button
                    key={pattern.name}
                    onClick={() => handlePatternSelect(pattern.name)}
                    className={cn(
                      'p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors',
                      selectedPattern === pattern.name && 'border-blue-500 bg-blue-50'
                    )}
                  >
                    <div className="font-medium text-sm">{pattern.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{pattern.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Pattern Form */}
            <div className="border-t pt-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Pattern Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Daily Cardio, Leg Day 3x/week"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this workout pattern"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="template">Workout Template</Label>
                  <Select 
                    value={formData.workoutTemplateId} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, workoutTemplateId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a workout template" />
                    </SelectTrigger>
                    <SelectContent>
                      {workoutTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <span>{template.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {template.workoutType}
                            </Badge>
                            {template.estimatedDuration && (
                              <span className="text-xs text-gray-500">
                                {template.estimatedDuration}min
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select 
                    value={formData.frequency} 
                    onValueChange={(value: 'daily' | 'weekly' | 'custom') => 
                      setFormData(prev => ({ ...prev, frequency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly (specific days)</SelectItem>
                      <SelectItem value="custom">Custom (X times per week)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.frequency === 'weekly' && (
                  <div>
                    <Label className="text-sm font-medium mb-3 block">Days of Week</Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => handleDayToggle(day.value)}
                          className={cn(
                            'px-3 py-2 text-sm border rounded-md transition-colors',
                            (formData.daysOfWeek || []).includes(day.value)
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          )}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {formData.frequency === 'custom' && (
                  <div>
                    <Label htmlFor="timesPerWeek">Times Per Week</Label>
                    <Input
                      id="timesPerWeek"
                      type="number"
                      min="1"
                      max="7"
                      value={formData.timesPerWeek}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        timesPerWeek: parseInt(e.target.value) || 1 
                      }))}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={format(formData.startDate, 'yyyy-MM-dd')}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        startDate: new Date(e.target.value) 
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="duration">Duration (Weeks)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="52"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        duration: parseInt(e.target.value) || 12 
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule Preview (Next 2 Weeks)
            </h3>
            
            {previewDates.length > 0 ? (
              <div className="space-y-2">
                {previewDates.map((date, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-3 p-2 bg-white rounded border"
                  >
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <div>
                      <div className="text-sm font-medium">
                        {format(date, 'EEEE, MMM d')}
                      </div>
                      <div className="text-xs text-gray-600">
                        {formData.name || 'Workout'}
                      </div>
                    </div>
                  </div>
                ))}
                
                {previewDates.length >= 14 && (
                  <div className="text-xs text-gray-500 text-center py-2">
                    ... and more workouts continuing for {formData.duration || 12} weeks
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Configure your pattern to see the schedule preview</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            loading={isSubmitting}
            disabled={!formData.name.trim() || !formData.workoutTemplateId}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Recurring Pattern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}