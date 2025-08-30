'use client'

import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { 
  X, 
  Plus, 
  Trash2, 
  Search, 
  Clock, 
  Target, 
  Dumbbell,
  GripVertical,
  Copy
} from 'lucide-react'
import { format } from 'date-fns'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/base'
import { FormField } from '@/components/base'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExerciseLibraryView } from '../ExerciseLibrary/ExerciseLibraryView'

// Validation schema for workout form
const WorkoutFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  scheduledDate: z.string(),
  workoutType: z.enum(['cardio', 'strength', 'flexibility', 'mixed']),
  estimatedDuration: z.number().min(5).max(300).optional(),
  exercises: z.array(z.object({
    exerciseId: z.string().min(1, 'Exercise is required'),
    orderIndex: z.number(),
    targetSets: z.number().min(1).optional(),
    targetReps: z.number().min(1).optional(),
    targetWeight: z.number().min(0).optional(),
    targetDuration: z.number().min(1).optional(),
    targetDistance: z.number().min(0).optional(),
    restBetweenSets: z.number().min(0).optional(),
    notes: z.string().optional()
  }))
})

type WorkoutFormData = z.infer<typeof WorkoutFormSchema>

export interface ExerciseTemplate {
  id: string
  name: string
  description?: string
  category: string
  muscleGroups: string[]
  equipmentNeeded?: string
  instructions?: string[]
  videoUrl?: string
  imageUrl?: string
  isCustom: boolean
}

export interface WorkoutFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: WorkoutFormData) => Promise<void>
  workout?: Workout | null
  initialDate?: Date
  title?: string
  exercises?: ExerciseTemplate[]
}

interface WorkoutExerciseFormData {
  exerciseId: string
  orderIndex: number
  targetSets?: number
  targetReps?: number
  targetWeight?: number
  targetDuration?: number
  targetDistance?: number
  restBetweenSets?: number
  notes?: string
  exercise?: ExerciseTemplate // For display purposes
}

export function WorkoutForm({ 
  isOpen, 
  onClose, 
  onSave, 
  workout,
  initialDate,
  title = 'Create Workout',
  exercises = []
}: WorkoutFormProps) {
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false)
  const [selectedExercises, setSelectedExercises] = useState<ExerciseTemplate[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<WorkoutFormData>({
    resolver: zodResolver(WorkoutFormSchema),
    defaultValues: {
      name: workout?.name || '',
      description: workout?.description || '',
      scheduledDate: workout?.scheduledDate 
        ? format(workout.scheduledDate, 'yyyy-MM-dd\'T\'HH:mm')
        : initialDate 
          ? format(initialDate, 'yyyy-MM-dd\'T\'09:00')
          : format(new Date(), 'yyyy-MM-dd\'T\'09:00'),
      workoutType: workout?.workoutType || 'strength',
      estimatedDuration: workout?.estimatedDuration || 60,
      exercises: workout?.exercises?.map((ex, index) => ({
        exerciseId: ex.exerciseId,
        orderIndex: index,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        targetWeight: ex.targetWeight,
        targetDuration: ex.targetDuration,
        targetDistance: ex.targetDistance,
        restBetweenSets: ex.restBetweenSets,
        notes: ex.notes
      })) || []
    }
  })

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'exercises'
  })

  const workoutType = watch('workoutType')

  // Reset form when workout changes
  useEffect(() => {
    if (workout) {
      reset({
        name: workout.name,
        description: workout.description || '',
        scheduledDate: format(workout.scheduledDate, 'yyyy-MM-dd\'T\'HH:mm'),
        workoutType: workout.workoutType,
        estimatedDuration: workout.estimatedDuration || 60,
        exercises: workout.exercises?.map((ex, index) => ({
          exerciseId: ex.exerciseId,
          orderIndex: index,
          targetSets: ex.targetSets,
          targetReps: ex.targetReps,
          targetWeight: ex.targetWeight,
          targetDuration: ex.targetDuration,
          targetDistance: ex.targetDistance,
          restBetweenSets: ex.restBetweenSets,
          notes: ex.notes
        })) || []
      })
    } else if (initialDate) {
      reset({
        name: '',
        description: '',
        scheduledDate: format(initialDate, 'yyyy-MM-dd\'T\'09:00'),
        workoutType: 'strength',
        estimatedDuration: 60,
        exercises: []
      })
    }
  }, [workout, initialDate, reset])

  const handleExerciseSelect = (exercise: ExerciseTemplate) => {
    const newExercise: WorkoutExerciseFormData = {
      exerciseId: exercise.id,
      orderIndex: fields.length,
      targetSets: exercise.category === 'cardio' ? undefined : 3,
      targetReps: exercise.category === 'cardio' ? undefined : 10,
      targetWeight: undefined,
      targetDuration: exercise.category === 'cardio' ? 1800 : undefined, // 30 minutes for cardio
      targetDistance: undefined,
      restBetweenSets: exercise.category === 'cardio' ? undefined : 90,
      notes: '',
      exercise
    }

    append(newExercise)
    setShowExerciseLibrary(false)
  }

  const handleExerciseRemove = (index: number) => {
    remove(index)
  }

  const handleExerciseMoveUp = (index: number) => {
    if (index > 0) {
      move(index, index - 1)
    }
  }

  const handleExerciseMoveDown = (index: number) => {
    if (index < fields.length - 1) {
      move(index, index + 1)
    }
  }

  const handleFormSubmit = async (data: WorkoutFormData) => {
    try {
      // Update orderIndex for all exercises
      const exercisesWithOrder = data.exercises.map((exercise, index) => ({
        ...exercise,
        orderIndex: index
      }))

      await onSave({
        ...data,
        exercises: exercisesWithOrder
      })
      
      onClose()
    } catch (error) {
      console.error('Error saving workout:', error)
      // Handle error (show toast, etc.)
    }
  }

  const getExerciseById = (exerciseId: string) => {
    return exercises.find(ex => ex.id === exerciseId)
  }

  const ExerciseCard = ({ exercise, index }: { exercise: any; index: number }) => {
    const exerciseTemplate = getExerciseById(exercise.exerciseId)
    
    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleExerciseMoveUp(index)}
                  disabled={index === 0}
                  className="h-6 w-8 p-0"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleExerciseMoveDown(index)}
                  disabled={index === fields.length - 1}
                  className="h-6 w-8 p-0"
                >
                  ↓
                </Button>
              </div>
              
              <div>
                <CardTitle className="text-base">
                  {exerciseTemplate?.name || 'Unknown Exercise'}
                </CardTitle>
                {exerciseTemplate && (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {exerciseTemplate.category}
                    </Badge>
                    {exerciseTemplate.equipmentNeeded && (
                      <span className="text-xs text-gray-500">
                        {exerciseTemplate.equipmentNeeded}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleExerciseRemove(index)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Strength Training Targets */}
          {workoutType !== 'cardio' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <FormField label="Sets" error={errors.exercises?.[index]?.targetSets?.message}>
                <Input
                  {...register(`exercises.${index}.targetSets`, { valueAsNumber: true })}
                  type="number"
                  min="1"
                  placeholder="3"
                />
              </FormField>

              <FormField label="Reps" error={errors.exercises?.[index]?.targetReps?.message}>
                <Input
                  {...register(`exercises.${index}.targetReps`, { valueAsNumber: true })}
                  type="number"
                  min="1"
                  placeholder="10"
                />
              </FormField>

              <FormField label="Weight (lbs)" error={errors.exercises?.[index]?.targetWeight?.message}>
                <Input
                  {...register(`exercises.${index}.targetWeight`, { valueAsNumber: true })}
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="135"
                />
              </FormField>

              <FormField label="Rest (sec)" error={errors.exercises?.[index]?.restBetweenSets?.message}>
                <Input
                  {...register(`exercises.${index}.restBetweenSets`, { valueAsNumber: true })}
                  type="number"
                  min="0"
                  placeholder="90"
                />
              </FormField>
            </div>
          )}

          {/* Cardio Targets */}
          {workoutType === 'cardio' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <FormField label="Duration (min)" error={errors.exercises?.[index]?.targetDuration?.message}>
                <Input
                  {...register(`exercises.${index}.targetDuration`, { 
                    valueAsNumber: true,
                    setValueAs: (value: string) => value ? parseInt(value) * 60 : undefined // Convert minutes to seconds
                  })}
                  type="number"
                  min="1"
                  placeholder="30"
                />
              </FormField>

              <FormField label="Distance (mi)" error={errors.exercises?.[index]?.targetDistance?.message}>
                <Input
                  {...register(`exercises.${index}.targetDistance`, { valueAsNumber: true })}
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="3.1"
                />
              </FormField>

              <FormField label="Rest (sec)" error={errors.exercises?.[index]?.restBetweenSets?.message}>
                <Input
                  {...register(`exercises.${index}.restBetweenSets`, { valueAsNumber: true })}
                  type="number"
                  min="0"
                  placeholder="60"
                />
              </FormField>
            </div>
          )}

          {/* Notes */}
          <FormField label="Exercise Notes" error={errors.exercises?.[index]?.notes?.message}>
            <Textarea
              {...register(`exercises.${index}.notes`)}
              placeholder="Exercise-specific notes, form cues, etc."
              rows={2}
            />
          </FormField>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Basic Workout Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Workout Name"
                required
                error={errors.name?.message}
              >
                <Input
                  {...register('name')}
                  placeholder="e.g. Chest & Triceps"
                />
              </FormField>

              <FormField
                label="Workout Type"
                required
                error={errors.workoutType?.message}
              >
                <Select 
                  value={watch('workoutType')} 
                  onValueChange={(value) => setValue('workoutType', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strength">Strength Training</SelectItem>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="flexibility">Flexibility</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Scheduled Date & Time"
                required
                error={errors.scheduledDate?.message}
              >
                <Input
                  {...register('scheduledDate')}
                  type="datetime-local"
                />
              </FormField>

              <FormField
                label="Estimated Duration (minutes)"
                error={errors.estimatedDuration?.message}
              >
                <Input
                  {...register('estimatedDuration', { valueAsNumber: true })}
                  type="number"
                  min="5"
                  max="300"
                  placeholder="60"
                />
              </FormField>
            </div>

            <FormField
              label="Description"
              description="Optional notes about this workout"
              error={errors.description?.message}
            >
              <Textarea
                {...register('description')}
                placeholder="Workout goals, notes, or special instructions..."
                rows={3}
              />
            </FormField>

            {/* Exercise Management */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Exercises</h3>
                <Button
                  type="button"
                  onClick={() => setShowExerciseLibrary(true)}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add Exercise
                </Button>
              </div>

              {fields.length === 0 ? (
                <Card className="p-8 text-center border-dashed">
                  <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No exercises added</h4>
                  <p className="text-gray-600 mb-4">Add exercises from the library to build your workout</p>
                  <Button
                    type="button"
                    onClick={() => setShowExerciseLibrary(true)}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Add Exercise
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <ExerciseCard
                      key={field.id}
                      exercise={field}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isSubmitting}
                loadingText="Saving..."
                disabled={fields.length === 0}
              >
                {workout ? 'Update Workout' : 'Create Workout'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Exercise Library Dialog */}
      <Dialog open={showExerciseLibrary} onOpenChange={setShowExerciseLibrary}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Select Exercise</DialogTitle>
          </DialogHeader>
          
          <div className="h-[600px]">
            <ExerciseLibraryView
              onExerciseSelect={handleExerciseSelect}
              selectionMode={true}
              showHeader={false}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}