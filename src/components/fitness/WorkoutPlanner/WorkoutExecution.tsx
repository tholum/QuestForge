'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Play, 
  Pause, 
  Square, 
  Check, 
  SkipForward, 
  Timer, 
  Target,
  Plus,
  Minus,
  Save,
  X
} from 'lucide-react'
import { format, differenceInSeconds } from 'date-fns'
import { Button } from '@/components/base'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface WorkoutSet {
  id?: string
  setNumber: number
  reps?: number
  weight?: number
  duration?: number // in seconds
  distance?: number
  restAfter?: number // in seconds
  rpe?: number // Rate of Perceived Exertion 1-10
  notes?: string
  completedAt?: Date
}

export interface WorkoutExerciseExecution {
  id: string
  exerciseId: string
  orderIndex: number
  targetSets?: number
  targetReps?: number
  targetWeight?: number
  targetDuration?: number
  targetDistance?: number
  restBetweenSets?: number
  notes?: string
  completedAt?: Date
  exercise: {
    id: string
    name: string
    category: string
    instructions?: string[]
  }
  sets: WorkoutSet[]
}

export interface WorkoutExecutionData {
  id: string
  name: string
  description?: string
  workoutType: 'cardio' | 'strength' | 'flexibility' | 'mixed'
  startedAt?: Date
  completedAt?: Date
  exercises: WorkoutExerciseExecution[]
}

export interface WorkoutExecutionProps {
  workout: WorkoutExecutionData
  isOpen: boolean
  onClose: () => void
  onSaveSet: (exerciseId: string, setData: WorkoutSet) => Promise<void>
  onCompleteWorkout: () => Promise<void>
  onUpdateWorkoutNotes: (notes: string) => Promise<void>
}

export function WorkoutExecution({
  workout,
  isOpen,
  onClose,
  onSaveSet,
  onCompleteWorkout,
  onUpdateWorkoutNotes
}: WorkoutExecutionProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [currentSetData, setCurrentSetData] = useState<Partial<WorkoutSet>>({})
  const [restTimer, setRestTimer] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [workoutTimer, setWorkoutTimer] = useState(0)
  const [isWorkoutActive, setIsWorkoutActive] = useState(false)
  const [workoutNotes, setWorkoutNotes] = useState('')
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)

  const currentExercise = workout.exercises[currentExerciseIndex]
  const totalExercises = workout.exercises.length
  const completedSets = currentExercise?.sets?.filter(set => set.completedAt).length || 0
  const totalSets = currentExercise?.targetSets || 1

  // Workout timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isWorkoutActive) {
      interval = setInterval(() => {
        setWorkoutTimer(prev => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isWorkoutActive])

  // Rest timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (isResting && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isResting, restTimer])

  // Auto-start workout timer when dialog opens
  useEffect(() => {
    if (isOpen && !workout.startedAt) {
      setIsWorkoutActive(true)
    }
  }, [isOpen, workout.startedAt])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const handleStartSet = () => {
    const newSet: Partial<WorkoutSet> = {
      setNumber: completedSets + 1,
      reps: currentExercise?.targetReps || undefined,
      weight: currentExercise?.targetWeight || undefined,
      duration: currentExercise?.targetDuration || undefined,
      distance: currentExercise?.targetDistance || undefined,
      rpe: 7 // Default RPE
    }
    setCurrentSetData(newSet)
  }

  const handleCompleteSet = async () => {
    if (!currentSetData.setNumber) return

    try {
      const completedSet: WorkoutSet = {
        ...currentSetData,
        setNumber: currentSetData.setNumber,
        completedAt: new Date()
      } as WorkoutSet

      await onSaveSet(currentExercise.id, completedSet)

      // Start rest timer if specified and not the last set
      if (currentExercise.restBetweenSets && completedSets + 1 < totalSets) {
        setRestTimer(currentExercise.restBetweenSets)
        setIsResting(true)
      }

      // Reset current set data
      setCurrentSetData({})

      // Auto-advance to next exercise if all sets completed
      if (completedSets + 1 >= totalSets && currentExerciseIndex < totalExercises - 1) {
        setTimeout(() => {
          setCurrentExerciseIndex(prev => prev + 1)
        }, 1000)
      }
    } catch (error) {
      console.error('Error saving set:', error)
    }
  }

  const handleSkipRest = () => {
    setRestTimer(0)
    setIsResting(false)
  }

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1)
      setCurrentSetData({})
    }
  }

  const handleNextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(prev => prev + 1)
      setCurrentSetData({})
    }
  }

  const handleCompleteWorkout = async () => {
    try {
      setIsWorkoutActive(false)
      await onCompleteWorkout()
      if (workoutNotes.trim()) {
        await onUpdateWorkoutNotes(workoutNotes)
      }
      setShowCompleteDialog(false)
      onClose()
    } catch (error) {
      console.error('Error completing workout:', error)
    }
  }

  const workoutProgress = useMemo(() => {
    const totalPossibleSets = workout.exercises.reduce((sum, ex) => sum + (ex.targetSets || 1), 0)
    const completedSetsCount = workout.exercises.reduce((sum, ex) => 
      sum + (ex.sets?.filter(set => set.completedAt).length || 0), 0
    )
    return totalPossibleSets > 0 ? (completedSetsCount / totalPossibleSets) * 100 : 0
  }, [workout.exercises])

  const SetTracker = () => {
    const isCardio = currentExercise?.exercise.category === 'cardio'

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Set {completedSets + 1} of {totalSets}
            </CardTitle>
            <Badge variant={currentSetData.setNumber ? 'default' : 'secondary'}>
              {currentSetData.setNumber ? 'In Progress' : 'Ready'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!currentSetData.setNumber ? (
            <Button onClick={handleStartSet} className="w-full" size="lg">
              <Play className="h-5 w-5 mr-2" />
              Start Set {completedSets + 1}
            </Button>
          ) : (
            <>
              {/* Strength Training Inputs */}
              {!isCardio && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Reps</label>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentSetData(prev => ({
                          ...prev,
                          reps: Math.max(0, (prev.reps || 0) - 1)
                        }))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={currentSetData.reps || ''}
                        onChange={(e) => setCurrentSetData(prev => ({
                          ...prev,
                          reps: parseInt(e.target.value) || 0
                        }))}
                        className="text-center"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentSetData(prev => ({
                          ...prev,
                          reps: (prev.reps || 0) + 1
                        }))}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Weight (lbs)</label>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentSetData(prev => ({
                          ...prev,
                          weight: Math.max(0, (prev.weight || 0) - 2.5)
                        }))}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        step="0.5"
                        value={currentSetData.weight || ''}
                        onChange={(e) => setCurrentSetData(prev => ({
                          ...prev,
                          weight: parseFloat(e.target.value) || 0
                        }))}
                        className="text-center"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentSetData(prev => ({
                          ...prev,
                          weight: (prev.weight || 0) + 2.5
                        }))}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Cardio Inputs */}
              {isCardio && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (min)</label>
                    <Input
                      type="number"
                      value={currentSetData.duration ? Math.round(currentSetData.duration / 60) : ''}
                      onChange={(e) => setCurrentSetData(prev => ({
                        ...prev,
                        duration: (parseInt(e.target.value) || 0) * 60
                      }))}
                      placeholder="30"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Distance (mi)</label>
                    <Input
                      type="number"
                      step="0.1"
                      value={currentSetData.distance || ''}
                      onChange={(e) => setCurrentSetData(prev => ({
                        ...prev,
                        distance: parseFloat(e.target.value) || 0
                      }))}
                      placeholder="3.1"
                    />
                  </div>
                </div>
              )}

              {/* RPE Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Rate of Perceived Exertion (1-10)</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rpe => (
                    <Button
                      key={rpe}
                      size="sm"
                      variant={currentSetData.rpe === rpe ? 'default' : 'outline'}
                      onClick={() => setCurrentSetData(prev => ({ ...prev, rpe }))}
                      className="flex-1"
                    >
                      {rpe}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Set Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Set Notes (optional)</label>
                <Input
                  value={currentSetData.notes || ''}
                  onChange={(e) => setCurrentSetData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Form notes, how it felt, etc."
                />
              </div>

              <Button onClick={handleCompleteSet} className="w-full" size="lg">
                <Check className="h-5 w-5 mr-2" />
                Complete Set
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  const RestTimer = () => (
    <Card className="mb-4 bg-blue-50 border-blue-200">
      <CardContent className="p-4 text-center">
        <Timer className="h-8 w-8 mx-auto mb-2 text-blue-600" />
        <p className="text-sm text-blue-800 mb-2">Rest Period</p>
        <p className="text-3xl font-bold text-blue-900 mb-3">
          {formatTime(restTimer)}
        </p>
        <Button onClick={handleSkipRest} size="sm" variant="outline">
          Skip Rest
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{workout.name}</DialogTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Timer className="h-4 w-4" />
                {formatTime(workoutTimer)}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Workout Progress */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Workout Progress</span>
                  <span className="text-sm text-gray-600">
                    Exercise {currentExerciseIndex + 1} of {totalExercises}
                  </span>
                </div>
                <Progress value={workoutProgress} className="mb-2" />
                <p className="text-xs text-gray-600">
                  {Math.round(workoutProgress)}% complete
                </p>
              </CardContent>
            </Card>

            {/* Current Exercise */}
            {currentExercise && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{currentExercise.exercise.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{currentExercise.exercise.category}</Badge>
                        {currentExercise.targetSets && (
                          <span className="text-sm text-gray-600">
                            {currentExercise.targetSets} sets
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePreviousExercise}
                        disabled={currentExerciseIndex === 0}
                      >
                        ← Prev
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleNextExercise}
                        disabled={currentExerciseIndex === totalExercises - 1}
                      >
                        Next →
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Exercise Instructions */}
                  {currentExercise.exercise.instructions && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Instructions:</h4>
                      <ol className="text-sm space-y-1 list-decimal list-inside">
                        {currentExercise.exercise.instructions.map((instruction, index) => (
                          <li key={index}>{instruction}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Target Information */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {currentExercise.targetSets && (
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Target Sets</p>
                        <p className="font-semibold">{currentExercise.targetSets}</p>
                      </div>
                    )}
                    {currentExercise.targetReps && (
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Target Reps</p>
                        <p className="font-semibold">{currentExercise.targetReps}</p>
                      </div>
                    )}
                    {currentExercise.targetWeight && (
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Target Weight</p>
                        <p className="font-semibold">{currentExercise.targetWeight} lbs</p>
                      </div>
                    )}
                    {currentExercise.targetDuration && (
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-600">Target Duration</p>
                        <p className="font-semibold">{Math.round(currentExercise.targetDuration / 60)} min</p>
                      </div>
                    )}
                  </div>

                  {/* Completed Sets */}
                  {currentExercise.sets && currentExercise.sets.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm mb-2">Completed Sets:</h4>
                      <div className="space-y-2">
                        {currentExercise.sets
                          .filter(set => set.completedAt)
                          .map((set, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                            <span className="text-sm">Set {set.setNumber}</span>
                            <div className="flex items-center gap-4 text-sm">
                              {set.reps && <span>{set.reps} reps</span>}
                              {set.weight && <span>{set.weight} lbs</span>}
                              {set.duration && <span>{Math.round(set.duration / 60)} min</span>}
                              {set.distance && <span>{set.distance} mi</span>}
                              {set.rpe && <span>RPE {set.rpe}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Rest Timer or Set Tracker */}
            {isResting ? <RestTimer /> : <SetTracker />}

            {/* Workout Actions */}
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowCompleteDialog(true)}
                    className="flex-1"
                    variant="default"
                  >
                    Complete Workout
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="outline"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete Workout Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Workout</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Check className="h-12 w-12 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-lg mb-1">Great Work!</h3>
              <p className="text-sm text-gray-600">
                You've been working out for {formatTime(workoutTimer)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Workout Notes (optional)</label>
              <Textarea
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                placeholder="How did the workout feel? Any notes for next time?"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowCompleteDialog(false)}
                variant="outline"
                className="flex-1"
              >
                Continue Workout
              </Button>
              <Button
                onClick={handleCompleteWorkout}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                Complete Workout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}