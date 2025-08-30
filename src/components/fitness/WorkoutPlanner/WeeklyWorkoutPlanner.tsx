'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Plus, Copy, MoreVertical, Play, Edit, Trash2 } from 'lucide-react'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, isSameDay, isToday } from 'date-fns'
import { Button } from '@/components/base'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

// Types for workout planning
export interface Workout {
  id: string
  name: string
  description?: string
  scheduledDate: Date
  completedAt?: Date
  workoutType: 'cardio' | 'strength' | 'flexibility' | 'mixed'
  estimatedDuration?: number
  actualDuration?: number
  planId?: string
  exercises: WorkoutExercise[]
}

export interface WorkoutExercise {
  id: string
  exerciseId: string
  orderIndex: number
  targetSets?: number
  targetReps?: number
  targetWeight?: number
  targetDuration?: number
  exercise: {
    name: string
    category: string
  }
}

export interface WeeklyWorkoutPlannerProps {
  workouts: Workout[]
  onWorkoutSelect: (workout: Workout) => void
  onWorkoutCreate: (date: Date) => void
  onWorkoutEdit: (workout: Workout) => void
  onWorkoutDelete: (workout: Workout) => void
  onWorkoutCopy: (workout: Workout, targetDate: Date) => void
  onDayCopy: (sourceDate: Date, targetDate: Date) => void
  onWorkoutExecute: (workout: Workout) => void
  isLoading?: boolean
}

export function WeeklyWorkoutPlanner({
  workouts,
  onWorkoutSelect,
  onWorkoutCreate,
  onWorkoutEdit,
  onWorkoutDelete,
  onWorkoutCopy,
  onDayCopy,
  onWorkoutExecute,
  isLoading = false
}: WeeklyWorkoutPlannerProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date())

  const weekStart = useMemo(() => startOfWeek(currentWeek, { weekStartsOn: 1 }), [currentWeek])
  const weekEnd = useMemo(() => endOfWeek(currentWeek, { weekStartsOn: 1 }), [currentWeek])

  const weekDays = useMemo(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i))
    }
    return days
  }, [weekStart])

  const workoutsByDate = useMemo(() => {
    const grouped = new Map<string, Workout[]>()
    workouts.forEach(workout => {
      const dateKey = format(workout.scheduledDate, 'yyyy-MM-dd')
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, [])
      }
      grouped.get(dateKey)!.push(workout)
    })
    return grouped
  }, [workouts])

  const handlePreviousWeek = useCallback(() => {
    setCurrentWeek(prev => subWeeks(prev, 1))
  }, [])

  const handleNextWeek = useCallback(() => {
    setCurrentWeek(prev => addWeeks(prev, 1))
  }, [])

  const handleToday = useCallback(() => {
    setCurrentWeek(new Date())
  }, [])

  const getWorkoutsForDate = useCallback((date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return workoutsByDate.get(dateKey) || []
  }, [workoutsByDate])

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case 'strength': return 'bg-blue-500 text-white'
      case 'cardio': return 'bg-red-500 text-white'
      case 'flexibility': return 'bg-green-500 text-white'
      case 'mixed': return 'bg-purple-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const WorkoutCard = ({ workout, date }: { workout: Workout; date: Date }) => (
    <Card className={cn(
      'mb-2 cursor-pointer transition-all hover:shadow-md border-l-4',
      workout.completedAt ? 'border-l-green-500 bg-green-50' : 'border-l-blue-500',
      'group'
    )}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0" onClick={() => onWorkoutSelect(workout)}>
            <h4 className="font-medium text-sm truncate">{workout.name}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge 
                variant="secondary" 
                className={cn('text-xs', getWorkoutTypeColor(workout.workoutType))}
              >
                {workout.workoutType}
              </Badge>
              {workout.estimatedDuration && (
                <span className="text-xs text-gray-500">
                  {workout.estimatedDuration}min
                </span>
              )}
            </div>
            {workout.exercises.length > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!workout.completedAt && (
                <>
                  <DropdownMenuItem onClick={() => onWorkoutExecute(workout)}>
                    <Play className="h-4 w-4 mr-2" />
                    Start Workout
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => onWorkoutEdit(workout)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onWorkoutCopy(workout, date)}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onWorkoutDelete(workout)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )

  const DayColumn = ({ date }: { date: Date }) => {
    const dayWorkouts = getWorkoutsForDate(date)
    const isCurrentDay = isToday(date)

    return (
      <div className="flex-1 min-h-[500px]">
        <div className={cn(
          'sticky top-0 bg-white border-b p-3 mb-3',
          isCurrentDay && 'bg-blue-50 border-blue-200'
        )}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={cn(
                'font-medium text-sm',
                isCurrentDay && 'text-blue-700'
              )}>
                {format(date, 'EEE')}
              </h3>
              <p className={cn(
                'text-xs text-gray-500',
                isCurrentDay && 'text-blue-600 font-medium'
              )}>
                {format(date, 'MMM d')}
              </p>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => onWorkoutCreate(date)}
                title="Add workout"
              >
                <Plus className="h-4 w-4" />
              </Button>
              
              {dayWorkouts.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => onDayCopy(date, date)}
                      disabled={dayWorkouts.length === 0}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Day
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        <div className="px-3 space-y-2">
          {dayWorkouts.map(workout => (
            <WorkoutCard key={workout.id} workout={workout} date={date} />
          ))}
          
          {dayWorkouts.length === 0 && (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => onWorkoutCreate(date)}
            >
              <Plus className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Add workout</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Week Navigation Header */}
      <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousWeek}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
            >
              Today
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <h2 className="text-lg font-semibold">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {workouts.filter(w => w.completedAt).length} completed
          </Badge>
          <Badge variant="outline">
            {workouts.filter(w => !w.completedAt).length} planned
          </Badge>
        </div>
      </div>

      {/* Week View Grid */}
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full">
          {weekDays.map((date, index) => (
            <div 
              key={format(date, 'yyyy-MM-dd')} 
              className={cn(
                'border-r last:border-r-0',
                index === 0 && 'border-l'
              )}
            >
              <DayColumn date={date} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}