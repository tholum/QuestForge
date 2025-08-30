/**
 * ExerciseForm Component
 * 
 * Form for creating and editing exercise templates with validation
 * and proper field management.
 */
'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Plus, Trash2 } from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/base/Button'
import { FormField } from '@/components/base/FormField'
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
import { EXERCISE_CATEGORIES, MUSCLE_GROUPS } from '@/lib/fitness/constants'
import type { ExerciseFormProps } from '@/lib/fitness/types'

const ExerciseFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  category: z.enum(['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'flexibility', 'full-body']),
  muscleGroups: z.array(z.string()).min(1, 'At least one muscle group is required'),
  equipmentNeeded: z.string().optional(),
  instructions: z.array(z.string()).optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal('')),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional()
})

type ExerciseFormData = z.infer<typeof ExerciseFormSchema>

export function ExerciseForm({ 
  isOpen, 
  onClose, 
  onSave, 
  exercise,
  title = 'Create Exercise' 
}: ExerciseFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ExerciseFormData>({
    resolver: zodResolver(ExerciseFormSchema),
    defaultValues: {
      name: exercise?.name || '',
      description: exercise?.description || '',
      category: exercise?.category || 'chest',
      muscleGroups: exercise?.muscleGroups || [],
      equipmentNeeded: exercise?.equipmentNeeded || '',
      instructions: exercise?.instructions || [''],
      videoUrl: exercise?.videoUrl || '',
      imageUrl: exercise?.imageUrl || '',
      difficulty: exercise?.difficulty || 'beginner'
    }
  })

  const muscleGroups = watch('muscleGroups') || []
  const instructions = watch('instructions') || ['']

  const handleMuscleGroupToggle = (muscleGroup: string) => {
    const updated = muscleGroups.includes(muscleGroup)
      ? muscleGroups.filter(mg => mg !== muscleGroup)
      : [...muscleGroups, muscleGroup]
    setValue('muscleGroups', updated)
  }

  const addInstruction = () => {
    setValue('instructions', [...instructions, ''])
  }

  const removeInstruction = (index: number) => {
    const updated = instructions.filter((_, i) => i !== index)
    setValue('instructions', updated)
  }

  const updateInstruction = (index: number, value: string) => {
    const updated = [...instructions]
    updated[index] = value
    setValue('instructions', updated)
  }

  const handleFormSubmit = (data: ExerciseFormData) => {
    const cleanData = {
      ...data,
      instructions: data.instructions?.filter(i => i.trim()) || [],
      videoUrl: data.videoUrl || undefined,
      imageUrl: data.imageUrl || undefined
    }
    onSave(cleanData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Exercise Name"
              required
              error={errors.name?.message}
            >
              <Input
                {...register('name')}
                placeholder="e.g. Bench Press"
              />
            </FormField>

            <FormField
              label="Category"
              required
              error={errors.category?.message}
            >
              <Select 
                value={watch('category')} 
                onValueChange={(value) => setValue('category', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXERCISE_CATEGORIES.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Difficulty Level"
              description="Select the appropriate difficulty level"
            >
              <Select 
                value={watch('difficulty')} 
                onValueChange={(value) => setValue('difficulty', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              label="Equipment Needed"
              description="List required equipment (optional)"
              error={errors.equipmentNeeded?.message}
            >
              <Input
                {...register('equipmentNeeded')}
                placeholder="e.g. Barbell, bench"
              />
            </FormField>
          </div>

          <FormField
            label="Description"
            description="Brief description of the exercise"
            error={errors.description?.message}
          >
            <Textarea
              {...register('description')}
              placeholder="Describe the exercise and its benefits..."
              rows={3}
            />
          </FormField>

          {/* Muscle Groups */}
          <FormField
            label="Target Muscle Groups"
            required
            error={errors.muscleGroups?.message}
            description="Select all muscle groups this exercise targets"
          >
            <div className="flex flex-wrap gap-2 mt-2">
              {MUSCLE_GROUPS.map(muscleGroup => (
                <Badge
                  key={muscleGroup}
                  variant={muscleGroups.includes(muscleGroup) ? 'default' : 'outline'}
                  className="cursor-pointer transition-colors hover:bg-primary/10"
                  onClick={() => handleMuscleGroupToggle(muscleGroup)}
                >
                  {muscleGroup.replace('-', ' ')}
                </Badge>
              ))}
            </div>
          </FormField>

          {/* Instructions */}
          <FormField
            label="Instructions"
            description="Step-by-step instructions for performing the exercise"
            error={errors.instructions?.message}
          >
            <div className="space-y-3">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    placeholder={`Step ${index + 1}`}
                  />
                  {instructions.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeInstruction(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addInstruction}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add Step
              </Button>
            </div>
          </FormField>

          {/* Media URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Video URL"
              description="Link to instructional video (optional)"
              error={errors.videoUrl?.message}
            >
              <Input
                {...register('videoUrl')}
                placeholder="https://youtube.com/watch?v=..."
                type="url"
              />
            </FormField>

            <FormField
              label="Image URL"  
              description="Link to exercise image (optional)"
              error={errors.imageUrl?.message}
            >
              <Input
                {...register('imageUrl')}
                placeholder="https://example.com/image.jpg"
                type="url"
              />
            </FormField>
          </div>

          {/* Actions */}
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
            >
              {exercise ? 'Update Exercise' : 'Create Exercise'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}