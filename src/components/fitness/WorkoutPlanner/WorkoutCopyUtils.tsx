'use client'

import React, { useState } from 'react'
import { 
  Copy, 
  Calendar, 
  ChevronLeft,
  ChevronRight,
  Check
} from 'lucide-react'
import { 
  format, 
  addWeeks, 
  subWeeks, 
  startOfWeek, 
  addDays,
  isSameDay 
} from 'date-fns'
import { Button } from '@/components/base'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface CopyWorkoutDialogProps {
  isOpen: boolean
  onClose: () => void
  onCopyWorkout: (sourceWorkoutId: string, targetDate: Date) => Promise<void>
  onCopyDay: (sourceDate: Date, targetDate: Date) => Promise<void>
  onCopyWeek: (sourceWeekStart: Date, targetWeekStart: Date) => Promise<void>
  sourceWorkout?: {
    id: string
    name: string
    scheduledDate: Date
    workoutType: string
  }
  sourceDate?: Date
  sourceWeekStart?: Date
  workouts?: Array<{
    id: string
    name: string
    scheduledDate: Date
    workoutType: string
  }>
  copyType: 'workout' | 'day' | 'week'
}

export function CopyWorkoutDialog({
  isOpen,
  onClose,
  onCopyWorkout,
  onCopyDay,
  onCopyWeek,
  sourceWorkout,
  sourceDate,
  sourceWeekStart,
  workouts = [],
  copyType
}: CopyWorkoutDialogProps) {
  const [selectedTargetDate, setSelectedTargetDate] = useState<Date | null>(null)
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [isSubmitting, setIsSubmitting] = useState(false)

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i))

  const getWorkoutsForDate = (date: Date) => {
    return workouts.filter(workout => isSameDay(workout.scheduledDate, date))
  }

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case 'strength': return 'bg-blue-500 text-white'
      case 'cardio': return 'bg-red-500 text-white'
      case 'flexibility': return 'bg-green-500 text-white'
      case 'mixed': return 'bg-purple-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const handleCopy = async () => {
    if (!selectedTargetDate) return

    setIsSubmitting(true)
    try {
      if (copyType === 'workout' && sourceWorkout) {
        await onCopyWorkout(sourceWorkout.id, selectedTargetDate)
      } else if (copyType === 'day' && sourceDate) {
        await onCopyDay(sourceDate, selectedTargetDate)
      } else if (copyType === 'week' && sourceWeekStart) {
        await onCopyWeek(sourceWeekStart, startOfWeek(selectedTargetDate, { weekStartsOn: 1 }))
      }
      onClose()
    } catch (error) {
      console.error('Error copying:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTitle = () => {
    switch (copyType) {
      case 'workout':
        return `Copy "${sourceWorkout?.name}" to another date`
      case 'day':
        return `Copy ${sourceDate ? format(sourceDate, 'EEEE, MMM d') : 'day'} to another date`
      case 'week':
        return `Copy week of ${sourceWeekStart ? format(sourceWeekStart, 'MMM d') : ''} to another week`
      default:
        return 'Copy Workout'
    }
  }

  const getSourcePreview = () => {
    if (copyType === 'workout' && sourceWorkout) {
      return (
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm mb-1">{sourceWorkout.name}</h4>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary"
              className={cn('text-xs', getWorkoutTypeColor(sourceWorkout.workoutType))}
            >
              {sourceWorkout.workoutType}
            </Badge>
            <span className="text-xs text-gray-500">
              {format(sourceWorkout.scheduledDate, 'EEE, MMM d')}
            </span>
          </div>
        </div>
      )
    }

    if (copyType === 'day' && sourceDate) {
      const dayWorkouts = getWorkoutsForDate(sourceDate)
      return (
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">
            {format(sourceDate, 'EEEE, MMM d, yyyy')}
          </h4>
          {dayWorkouts.length > 0 ? (
            <div className="space-y-1">
              {dayWorkouts.map(workout => (
                <div key={workout.id} className="flex items-center gap-2">
                  <Badge 
                    variant="secondary"
                    className={cn('text-xs', getWorkoutTypeColor(workout.workoutType))}
                  >
                    {workout.workoutType}
                  </Badge>
                  <span className="text-xs text-gray-700">{workout.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-xs text-gray-500">No workouts</span>
          )}
        </div>
      )
    }

    if (copyType === 'week' && sourceWeekStart) {
      const weekWorkouts = workouts.filter(workout => {
        const workoutDate = workout.scheduledDate
        return workoutDate >= sourceWeekStart && 
               workoutDate < addDays(sourceWeekStart, 7)
      })

      return (
        <div className="p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-sm mb-2">
            Week of {format(sourceWeekStart, 'MMM d, yyyy')}
          </h4>
          <div className="text-xs text-gray-600">
            {weekWorkouts.length} workout{weekWorkouts.length !== 1 ? 's' : ''} this week
          </div>
        </div>
      )
    }

    return null
  }

  const DaySelector = ({ date }: { date: Date }) => {
    const dayWorkouts = getWorkoutsForDate(date)
    const isSelected = selectedTargetDate && isSameDay(date, selectedTargetDate)
    const isToday = isSameDay(date, new Date())

    return (
      <button
        onClick={() => setSelectedTargetDate(date)}
        className={cn(
          'w-full p-3 border rounded-lg text-left hover:bg-gray-50 transition-colors',
          isSelected && 'border-blue-500 bg-blue-50',
          isToday && 'border-green-500'
        )}
      >
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className={cn(
              'text-sm font-medium',
              isToday && 'text-green-700',
              isSelected && 'text-blue-700'
            )}>
              {format(date, 'EEE')}
            </p>
            <p className={cn(
              'text-xs text-gray-500',
              isToday && 'text-green-600',
              isSelected && 'text-blue-600'
            )}>
              {format(date, 'MMM d')}
            </p>
          </div>
          {isSelected && <Check className="h-4 w-4 text-blue-600" />}
        </div>

        {dayWorkouts.length > 0 && (
          <div className="space-y-1">
            {dayWorkouts.slice(0, 2).map(workout => (
              <div key={workout.id} className="text-xs">
                <Badge 
                  variant="outline" 
                  className="text-xs mr-1"
                >
                  {workout.workoutType}
                </Badge>
                <span className="text-gray-600 truncate">{workout.name}</span>
              </div>
            ))}
            {dayWorkouts.length > 2 && (
              <p className="text-xs text-gray-500">+{dayWorkouts.length - 2} more</p>
            )}
          </div>
        )}
      </button>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Source Preview */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Copying from:</h3>
            {getSourcePreview()}
          </div>

          {/* Target Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-4">
              Select target {copyType === 'week' ? 'week' : 'date'}:
            </h3>

            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(prev => subWeeks(prev, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="text-center">
                <p className="font-medium">
                  {format(currentWeek, 'MMM d')} - {format(addDays(currentWeek, 6), 'MMM d, yyyy')}
                </p>
                <p className="text-sm text-gray-500">
                  Week of {format(currentWeek, 'MMM d')}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(prev => addWeeks(prev, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Week Selection for Week Copy */}
            {copyType === 'week' && (
              <div className="mb-4">
                <button
                  onClick={() => setSelectedTargetDate(currentWeek)}
                  className={cn(
                    'w-full p-4 border rounded-lg text-left hover:bg-gray-50 transition-colors',
                    selectedTargetDate && isSameDay(selectedTargetDate, currentWeek) && 'border-blue-500 bg-blue-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">
                        Week of {format(currentWeek, 'MMM d, yyyy')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(currentWeek, 'MMM d')} - {format(addDays(currentWeek, 6), 'MMM d')}
                      </p>
                    </div>
                    {selectedTargetDate && isSameDay(selectedTargetDate, currentWeek) && (
                      <Check className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </button>
              </div>
            )}

            {/* Day Grid for Day/Workout Copy */}
            {copyType !== 'week' && (
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map(date => (
                  <DaySelector key={format(date, 'yyyy-MM-dd')} date={date} />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCopy}
              disabled={!selectedTargetDate || isSubmitting}
              loading={isSubmitting}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              {copyType === 'workout' && 'Copy Workout'}
              {copyType === 'day' && 'Copy Day'}
              {copyType === 'week' && 'Copy Week'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook for managing copy operations
export function useCopyWorkouts() {
  const [copyDialog, setCopyDialog] = useState<{
    isOpen: boolean
    type: 'workout' | 'day' | 'week'
    sourceWorkout?: any
    sourceDate?: Date
    sourceWeekStart?: Date
  }>({
    isOpen: false,
    type: 'workout'
  })

  const openWorkoutCopy = (workout: any) => {
    setCopyDialog({
      isOpen: true,
      type: 'workout',
      sourceWorkout: workout
    })
  }

  const openDayCopy = (date: Date) => {
    setCopyDialog({
      isOpen: true,
      type: 'day',
      sourceDate: date
    })
  }

  const openWeekCopy = (weekStart: Date) => {
    setCopyDialog({
      isOpen: true,
      type: 'week',
      sourceWeekStart: weekStart
    })
  }

  const closeCopyDialog = () => {
    setCopyDialog(prev => ({ ...prev, isOpen: false }))
  }

  return {
    copyDialog,
    openWorkoutCopy,
    openDayCopy,
    openWeekCopy,
    closeCopyDialog
  }
}