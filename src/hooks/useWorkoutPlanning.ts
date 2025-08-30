import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fitnessApi } from '@/lib/api/fitness'

export interface UseWorkoutPlanningOptions {
  enabled?: boolean
}

export function useWorkoutPlanning(userId: string, options: UseWorkoutPlanningOptions = {}) {
  const queryClient = useQueryClient()
  
  // Query for workouts
  const {
    data: workouts = [],
    isLoading: workoutsLoading,
    error: workoutsError,
    refetch: refetchWorkouts
  } = useQuery({
    queryKey: ['workouts', userId],
    queryFn: () => fitnessApi.getWorkouts({ userId }),
    enabled: options.enabled !== false
  })

  // Query for workout templates
  const {
    data: templates = [],
    isLoading: templatesLoading,
    error: templatesError,
    refetch: refetchTemplates
  } = useQuery({
    queryKey: ['workout-templates', userId],
    queryFn: () => fitnessApi.getWorkoutTemplates({ userId }),
    enabled: options.enabled !== false
  })

  // Mutations
  const createWorkoutMutation = useMutation({
    mutationFn: (workoutData: any) => fitnessApi.createWorkout({ ...workoutData, userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] })
    }
  })

  const updateWorkoutMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      fitnessApi.updateWorkout(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] })
    }
  })

  const deleteWorkoutMutation = useMutation({
    mutationFn: (id: string) => fitnessApi.deleteWorkout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] })
    }
  })

  const executeWorkoutMutation = useMutation({
    mutationFn: (workoutId: string) => fitnessApi.executeWorkout(workoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] })
    }
  })

  const saveWorkoutSetMutation = useMutation({
    mutationFn: ({ exerciseId, setData }: { exerciseId: string; setData: any }) =>
      fitnessApi.saveWorkoutSet(exerciseId, setData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] })
    }
  })

  const completeWorkoutMutation = useMutation({
    mutationFn: (workoutId: string) => fitnessApi.completeWorkout(workoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] })
    }
  })

  const copyWorkoutMutation = useMutation({
    mutationFn: ({ sourceWorkoutId, targetDate }: { sourceWorkoutId: string; targetDate: Date }) =>
      fitnessApi.copyWorkout(sourceWorkoutId, targetDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] })
    }
  })

  const copyDayMutation = useMutation({
    mutationFn: ({ sourceDate, targetDate }: { sourceDate: Date; targetDate: Date }) =>
      fitnessApi.copyDay(sourceDate, targetDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] })
    }
  })

  const copyWeekMutation = useMutation({
    mutationFn: ({ sourceWeekStart, targetWeekStart }: { sourceWeekStart: Date; targetWeekStart: Date }) =>
      fitnessApi.copyWeek(sourceWeekStart, targetWeekStart),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] })
    }
  })

  // Template mutations
  const favoriteTemplateMutation = useMutation({
    mutationFn: ({ templateId, favorite }: { templateId: string; favorite: boolean }) =>
      fitnessApi.favoriteTemplate(templateId, favorite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-templates', userId] })
    }
  })

  const deleteTemplateMutation = useMutation({
    mutationFn: (templateId: string) => fitnessApi.deleteWorkoutTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-templates', userId] })
    }
  })

  const duplicateTemplateMutation = useMutation({
    mutationFn: (templateId: string) => fitnessApi.duplicateWorkoutTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-templates', userId] })
    }
  })

  // Exercise copy mutations
  const copyExerciseMutation = useMutation({
    mutationFn: ({ sourceExerciseId, targetWorkoutId, orderIndex }: { sourceExerciseId: string; targetWorkoutId: string; orderIndex?: number }) =>
      fitnessApi.copyExercise(sourceExerciseId, targetWorkoutId, orderIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] })
    }
  })

  const copyExercisesMutation = useMutation({
    mutationFn: ({ sourceWorkoutId, targetWorkoutId, exerciseIds }: { sourceWorkoutId: string; targetWorkoutId: string; exerciseIds?: string[] }) =>
      fitnessApi.copyExercises(sourceWorkoutId, targetWorkoutId, exerciseIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] })
    }
  })

  // Recurring pattern mutation
  const createRecurringPatternMutation = useMutation({
    mutationFn: (data: Parameters<typeof fitnessApi.createRecurringPattern>[0]) => 
      fitnessApi.createRecurringPattern(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', userId] })
      queryClient.invalidateQueries({ queryKey: ['workout-templates', userId] })
    }
  })

  const refetch = () => {
    refetchWorkouts()
    refetchTemplates()
  }

  return {
    // Data
    workouts,
    templates,
    isLoading: workoutsLoading || templatesLoading,
    error: workoutsError || templatesError,
    
    // Actions
    createWorkout: createWorkoutMutation.mutateAsync,
    updateWorkout: (id: string, data: any) => updateWorkoutMutation.mutateAsync({ id, data }),
    deleteWorkout: deleteWorkoutMutation.mutateAsync,
    executeWorkout: executeWorkoutMutation.mutateAsync,
    saveWorkoutSet: (exerciseId: string, setData: any) => 
      saveWorkoutSetMutation.mutateAsync({ exerciseId, setData }),
    completeWorkout: completeWorkoutMutation.mutateAsync,
    
    // Copy operations
    copyWorkout: (sourceWorkoutId: string, targetDate: Date) =>
      copyWorkoutMutation.mutateAsync({ sourceWorkoutId, targetDate }),
    copyDay: (sourceDate: Date, targetDate: Date) =>
      copyDayMutation.mutateAsync({ sourceDate, targetDate }),
    copyWeek: (sourceWeekStart: Date, targetWeekStart: Date) =>
      copyWeekMutation.mutateAsync({ sourceWeekStart, targetWeekStart }),
    
    // Template operations
    favoriteTemplate: (templateId: string, favorite: boolean) =>
      favoriteTemplateMutation.mutateAsync({ templateId, favorite }),
    deleteTemplate: deleteTemplateMutation.mutateAsync,
    duplicateTemplate: duplicateTemplateMutation.mutateAsync,
    
    // Exercise copy operations
    copyExercise: (sourceExerciseId: string, targetWorkoutId: string, orderIndex?: number) =>
      copyExerciseMutation.mutateAsync({ sourceExerciseId, targetWorkoutId, orderIndex }),
    copyExercises: (sourceWorkoutId: string, targetWorkoutId: string, exerciseIds?: string[]) =>
      copyExercisesMutation.mutateAsync({ sourceWorkoutId, targetWorkoutId, exerciseIds }),
    
    // Recurring pattern operations
    createRecurringPattern: createRecurringPatternMutation.mutateAsync,
    
    // Loading states
    isCreating: createWorkoutMutation.isPending,
    isUpdating: updateWorkoutMutation.isPending,
    isDeleting: deleteWorkoutMutation.isPending,
    isExecuting: executeWorkoutMutation.isPending,
    isSavingSet: saveWorkoutSetMutation.isPending,
    isCompleting: completeWorkoutMutation.isPending,
    
    // Copy loading states
    isCopyingWorkout: copyWorkoutMutation.isPending,
    isCopyingDay: copyDayMutation.isPending,
    isCopyingWeek: copyWeekMutation.isPending,
    
    // Template loading states
    isFavoriting: favoriteTemplateMutation.isPending,
    isDeletingTemplate: deleteTemplateMutation.isPending,
    isDuplicating: duplicateTemplateMutation.isPending,
    
    // Exercise copy loading states
    isCopyingExercise: copyExerciseMutation.isPending,
    isCopyingExercises: copyExercisesMutation.isPending,
    
    // Recurring pattern loading states
    isCreatingRecurringPattern: createRecurringPatternMutation.isPending,
    
    refetch
  }
}