'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Calendar, BookTemplate, Play, Plus, Settings, Repeat } from 'lucide-react'
import { addDays, format } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/base'
import { toast } from '@/components/ui/use-toast'

// Import workout planning components
import { WeeklyWorkoutPlanner, type Workout } from './WeeklyWorkoutPlanner'
import { WorkoutForm, type ExerciseTemplate } from './WorkoutForm'
import { WorkoutExecution, type WorkoutExecutionData } from './WorkoutExecution'
import { WorkoutTemplates, type WorkoutTemplate } from './WorkoutTemplates'
import { CopyWorkoutDialog, useCopyWorkouts } from './WorkoutCopyUtils'
import { RecurringPatternDialog } from './RecurringPatternDialog'

// Hooks for data management
import { useWorkoutPlanning } from '@/hooks/useWorkoutPlanning'
import { useExerciseLibrary } from '@/hooks/useExerciseLibrary'

export interface WorkoutPlanningViewProps {
  userId: string
  onWorkoutComplete?: (workout: Workout) => void
}

export function WorkoutPlanningView({ 
  userId, 
  onWorkoutComplete 
}: WorkoutPlanningViewProps) {
  // State management
  const [activeTab, setActiveTab] = useState('planner')
  const [showWorkoutForm, setShowWorkoutForm] = useState(false)
  const [showWorkoutExecution, setShowWorkoutExecution] = useState(false)
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [executingWorkout, setExecutingWorkout] = useState<WorkoutExecutionData | null>(null)
  const [showRecurringPatternDialog, setShowRecurringPatternDialog] = useState(false)

  // Copy functionality
  const {
    copyDialog,
    openWorkoutCopy,
    openDayCopy,
    openWeekCopy,
    closeCopyDialog
  } = useCopyWorkouts()

  // Data hooks
  const {
    workouts,
    templates,
    isLoading,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    executeWorkout,
    saveWorkoutSet,
    completeWorkout,
    copyWorkout,
    copyDay,
    copyWeek,
    favoriteTemplate,
    deleteTemplate,
    duplicateTemplate,
    createRecurringPattern,
    refetch
  } = useWorkoutPlanning(userId)

  const {
    exercises,
    isLoading: exercisesLoading
  } = useExerciseLibrary({
    includeCustom: true,
    enabled: showWorkoutForm
  })

  // Event handlers
  const handleWorkoutSelect = useCallback((workout: Workout) => {
    setSelectedWorkout(workout)
    setShowWorkoutForm(true)
  }, [])

  const handleWorkoutCreate = useCallback((date: Date) => {
    setSelectedDate(date)
    setSelectedWorkout(null)
    setShowWorkoutForm(true)
  }, [])

  const handleWorkoutEdit = useCallback((workout: Workout) => {
    setSelectedWorkout(workout)
    setShowWorkoutForm(true)
  }, [])

  const handleWorkoutDelete = useCallback(async (workout: Workout) => {
    if (window.confirm(`Are you sure you want to delete "${workout.name}"?`)) {
      try {
        await deleteWorkout(workout.id)
        toast({
          title: 'Workout deleted',
          description: `"${workout.name}" has been deleted successfully.`
        })
      } catch (error) {
        console.error('Error deleting workout:', error)
        toast({
          title: 'Error',
          description: 'Failed to delete workout. Please try again.',
          variant: 'destructive'
        })
      }
    }
  }, [deleteWorkout])

  const handleWorkoutExecute = useCallback(async (workout: Workout) => {
    try {
      const executionData = await executeWorkout(workout.id)
      setExecutingWorkout(executionData)
      setShowWorkoutExecution(true)
    } catch (error) {
      console.error('Error starting workout:', error)
      toast({
        title: 'Error',
        description: 'Failed to start workout. Please try again.',
        variant: 'destructive'
      })
    }
  }, [executeWorkout])

  const handleWorkoutSave = useCallback(async (workoutData: any) => {
    try {
      if (selectedWorkout) {
        await updateWorkout(selectedWorkout.id, workoutData)
        toast({
          title: 'Workout updated',
          description: `"${workoutData.name}" has been updated successfully.`
        })
      } else {
        await createWorkout(workoutData)
        toast({
          title: 'Workout created',
          description: `"${workoutData.name}" has been created successfully.`
        })
      }
      
      setShowWorkoutForm(false)
      setSelectedWorkout(null)
      setSelectedDate(null)
    } catch (error) {
      console.error('Error saving workout:', error)
      toast({
        title: 'Error',
        description: 'Failed to save workout. Please try again.',
        variant: 'destructive'
      })
    }
  }, [selectedWorkout, createWorkout, updateWorkout])

  const handleSetSave = useCallback(async (exerciseId: string, setData: any) => {
    try {
      await saveWorkoutSet(exerciseId, setData)
    } catch (error) {
      console.error('Error saving set:', error)
      toast({
        title: 'Error',
        description: 'Failed to save set. Please try again.',
        variant: 'destructive'
      })
    }
  }, [saveWorkoutSet])

  const handleWorkoutCompleteExecution = useCallback(async () => {
    if (!executingWorkout) return

    try {
      await completeWorkout(executingWorkout.id)
      
      // Find the completed workout and call the callback
      const completedWorkout = workouts.find(w => w.id === executingWorkout.id)
      if (completedWorkout && onWorkoutComplete) {
        onWorkoutComplete(completedWorkout)
      }

      toast({
        title: 'Workout completed!',
        description: `Great job completing "${executingWorkout.name}"!`
      })
      
      setShowWorkoutExecution(false)
      setExecutingWorkout(null)
    } catch (error) {
      console.error('Error completing workout:', error)
      toast({
        title: 'Error',
        description: 'Failed to complete workout. Please try again.',
        variant: 'destructive'
      })
    }
  }, [executingWorkout, completeWorkout, workouts, onWorkoutComplete])

  // Template handlers
  const handleTemplateUse = useCallback(async (template: WorkoutTemplate, date?: Date) => {
    try {
      const scheduledDate = date || new Date()
      // Convert template to workout
      const workoutData = {
        name: template.name,
        description: template.description,
        scheduledDate: format(scheduledDate, 'yyyy-MM-dd\'T\'09:00'),
        workoutType: template.workoutType,
        estimatedDuration: template.estimatedDuration,
        exercises: template.exercises.map(ex => ({
          ...ex,
          exerciseId: ex.exerciseId
        }))
      }
      
      await createWorkout(workoutData)
      
      toast({
        title: 'Workout created from template',
        description: `"${template.name}" has been scheduled for ${format(scheduledDate, 'MMM d')}.`
      })
      
      // Switch to planner tab to see the new workout
      setActiveTab('planner')
    } catch (error) {
      console.error('Error using template:', error)
      toast({
        title: 'Error',
        description: 'Failed to create workout from template. Please try again.',
        variant: 'destructive'
      })
    }
  }, [createWorkout])

  const handleTemplateEdit = useCallback((template: WorkoutTemplate) => {
    // Convert template to workout for editing
    const workoutData: Workout = {
      id: template.id,
      name: template.name,
      description: template.description,
      scheduledDate: new Date(),
      workoutType: template.workoutType,
      estimatedDuration: template.estimatedDuration,
      planId: undefined,
      exercises: template.exercises.map(ex => ({
        id: ex.id,
        exerciseId: ex.exerciseId,
        orderIndex: ex.orderIndex,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        targetWeight: ex.targetWeight,
        targetDuration: ex.targetDuration,
        targetDistance: ex.targetDistance,
        restBetweenSets: ex.restBetweenSets,
        exercise: ex.exercise
      }))
    }
    
    setSelectedWorkout(workoutData)
    setShowWorkoutForm(true)
  }, [])

  const handleTemplateDelete = useCallback(async (template: WorkoutTemplate) => {
    if (window.confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      try {
        await deleteTemplate(template.id)
        toast({
          title: 'Template deleted',
          description: `"${template.name}" template has been deleted.`
        })
      } catch (error) {
        console.error('Error deleting template:', error)
        toast({
          title: 'Error',
          description: 'Failed to delete template. Please try again.',
          variant: 'destructive'
        })
      }
    }
  }, [deleteTemplate])

  const handleTemplateDuplicate = useCallback(async (template: WorkoutTemplate) => {
    try {
      await duplicateTemplate(template.id)
      toast({
        title: 'Template duplicated',
        description: `Copy of "${template.name}" has been created.`
      })
    } catch (error) {
      console.error('Error duplicating template:', error)
      toast({
        title: 'Error',
        description: 'Failed to duplicate template. Please try again.',
        variant: 'destructive'
      })
    }
  }, [duplicateTemplate])

  const handleTemplateFavorite = useCallback(async (template: WorkoutTemplate, favorite: boolean) => {
    try {
      await favoriteTemplate(template.id, favorite)
      toast({
        title: favorite ? 'Added to favorites' : 'Removed from favorites',
        description: `"${template.name}" has been ${favorite ? 'added to' : 'removed from'} favorites.`
      })
    } catch (error) {
      console.error('Error updating template favorite:', error)
      toast({
        title: 'Error',
        description: 'Failed to update favorite status. Please try again.',
        variant: 'destructive'
      })
    }
  }, [favoriteTemplate])

  // Copy handlers
  const handleWorkoutCopy = useCallback(async (sourceWorkoutId: string, targetDate: Date) => {
    try {
      await copyWorkout(sourceWorkoutId, targetDate)
      toast({
        title: 'Workout copied',
        description: `Workout has been copied to ${format(targetDate, 'MMM d')}.`
      })
    } catch (error) {
      console.error('Error copying workout:', error)
      toast({
        title: 'Error',
        description: 'Failed to copy workout. Please try again.',
        variant: 'destructive'
      })
    }
  }, [copyWorkout])

  const handleDayCopy = useCallback(async (sourceDate: Date, targetDate: Date) => {
    try {
      await copyDay(sourceDate, targetDate)
      toast({
        title: 'Day copied',
        description: `Workouts from ${format(sourceDate, 'MMM d')} have been copied to ${format(targetDate, 'MMM d')}.`
      })
    } catch (error) {
      console.error('Error copying day:', error)
      toast({
        title: 'Error',
        description: 'Failed to copy day. Please try again.',
        variant: 'destructive'
      })
    }
  }, [copyDay])

  const handleWeekCopy = useCallback(async (sourceWeekStart: Date, targetWeekStart: Date) => {
    try {
      await copyWeek(sourceWeekStart, targetWeekStart)
      toast({
        title: 'Week copied',
        description: `Week starting ${format(sourceWeekStart, 'MMM d')} has been copied to week starting ${format(targetWeekStart, 'MMM d')}.`
      })
    } catch (error) {
      console.error('Error copying week:', error)
      toast({
        title: 'Error',
        description: 'Failed to copy week. Please try again.',
        variant: 'destructive'
      })
    }
  }, [copyWeek])

  // Recurring pattern handler
  const handleCreateRecurringPattern = useCallback(async (patternData: any) => {
    try {
      await createRecurringPattern(patternData)
      toast({
        title: 'Recurring pattern created',
        description: `"${patternData.name}" pattern has been created and workouts scheduled.`
      })
    } catch (error) {
      console.error('Error creating recurring pattern:', error)
      toast({
        title: 'Error',
        description: 'Failed to create recurring pattern. Please try again.',
        variant: 'destructive'
      })
    }
  }, [createRecurringPattern])

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Workout Planning</h1>
            <p className="text-gray-600">Plan, schedule, and track your workouts</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRecurringPatternDialog(true)}
              leftIcon={<Repeat className="h-4 w-4" />}
            >
              Recurring Pattern
            </Button>
            <Button
              onClick={() => handleWorkoutCreate(new Date())}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create Workout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b px-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="planner" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Planner
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <BookTemplate className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Active
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="planner" className="h-full mt-0">
              <WeeklyWorkoutPlanner
                workouts={workouts}
                onWorkoutSelect={handleWorkoutSelect}
                onWorkoutCreate={handleWorkoutCreate}
                onWorkoutEdit={handleWorkoutEdit}
                onWorkoutDelete={handleWorkoutDelete}
                onWorkoutCopy={openWorkoutCopy}
                onDayCopy={openDayCopy}
                onWorkoutExecute={handleWorkoutExecute}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="templates" className="h-full mt-0 p-6 overflow-y-auto">
              <WorkoutTemplates
                templates={templates}
                onTemplateUse={handleTemplateUse}
                onTemplateEdit={handleTemplateEdit}
                onTemplateDelete={handleTemplateDelete}
                onTemplateDuplicate={handleTemplateDuplicate}
                onTemplateFavorite={handleTemplateFavorite}
                onTemplateCreate={() => {
                  setSelectedWorkout(null)
                  setShowWorkoutForm(true)
                }}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="active" className="h-full mt-0 p-6">
              <div className="text-center py-12">
                <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Workouts</h3>
                <p className="text-gray-600 mb-4">Start a workout to see it here</p>
                <Button onClick={() => setActiveTab('planner')}>
                  Go to Planner
                </Button>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Workout Form Dialog */}
      <WorkoutForm
        isOpen={showWorkoutForm}
        onClose={() => {
          setShowWorkoutForm(false)
          setSelectedWorkout(null)
          setSelectedDate(null)
        }}
        onSave={handleWorkoutSave}
        workout={selectedWorkout}
        initialDate={selectedDate || undefined}
        title={selectedWorkout ? 'Edit Workout' : 'Create Workout'}
        exercises={exercises}
      />

      {/* Workout Execution Dialog */}
      {executingWorkout && (
        <WorkoutExecution
          workout={executingWorkout}
          isOpen={showWorkoutExecution}
          onClose={() => {
            setShowWorkoutExecution(false)
            setExecutingWorkout(null)
          }}
          onSaveSet={handleSetSave}
          onCompleteWorkout={handleWorkoutCompleteExecution}
          onUpdateWorkoutNotes={async (notes: string) => {
            if (executingWorkout) {
              await updateWorkout(executingWorkout.id, { notes })
            }
          }}
        />
      )}

      {/* Copy Dialog */}
      <CopyWorkoutDialog
        isOpen={copyDialog.isOpen}
        onClose={closeCopyDialog}
        onCopyWorkout={handleWorkoutCopy}
        onCopyDay={handleDayCopy}
        onCopyWeek={handleWeekCopy}
        sourceWorkout={copyDialog.sourceWorkout}
        sourceDate={copyDialog.sourceDate}
        sourceWeekStart={copyDialog.sourceWeekStart}
        workouts={workouts}
        copyType={copyDialog.type}
      />

      {/* Recurring Pattern Dialog */}
      <RecurringPatternDialog
        isOpen={showRecurringPatternDialog}
        onClose={() => setShowRecurringPatternDialog(false)}
        onSave={handleCreateRecurringPattern}
        workoutTemplates={templates}
      />
    </div>
  )
}