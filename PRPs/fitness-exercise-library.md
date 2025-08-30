# PRP 3: Exercise Library & Management System

## Overview
Implement comprehensive exercise library with categorized templates, custom exercise creation, search functionality, and exercise management. This system will serve as the foundation for all workout planning and execution.

## Research Context

### Exercise Database Best Practices
Based on fitness application research:
- **Hierarchical Categories**: Organize by muscle groups and equipment types
- **Flexible Templates**: Support both strength and cardio exercises with different metrics
- **Search Optimization**: Enable quick exercise discovery through multiple search methods
- **User Customization**: Allow users to create and modify exercise templates
- **Instruction Support**: Include detailed instructions, images, and video links

### UI Component Patterns
Following existing base component patterns:
- **DataCard**: For exercise display with metadata and actions
- **FormField**: For exercise creation and editing forms
- **SearchInput**: For exercise library search functionality
- **StatusBadge**: For exercise categories and difficulty levels

## System Architecture

### Core Components Structure

```typescript
// Exercise Library Components
src/components/fitness/ExerciseLibrary/
  ExerciseLibraryView.tsx      // Main library view with search and categories
  ExerciseGrid.tsx             // Grid layout for exercise cards
  ExerciseCard.tsx             // Individual exercise display card
  ExerciseDetailModal.tsx      // Detailed exercise view with instructions
  ExerciseForm.tsx             // Create/edit exercise form
  ExerciseSearch.tsx           // Search and filter component
  CategoryFilter.tsx           // Category selection component
  CustomExerciseManager.tsx    // User's custom exercises management
```

### Data Types and Interfaces

```typescript
// Exercise Library Types
export interface ExerciseTemplate {
  id: string
  name: string
  description?: string
  category: ExerciseCategory
  muscleGroups: string[]
  equipmentNeeded?: string
  instructions?: string[]
  videoUrl?: string
  imageUrl?: string
  isCustom: boolean
  userId?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  tags?: string[]
  createdAt: Date
  updatedAt: Date
}

export type ExerciseCategory = 
  | 'chest' 
  | 'back' 
  | 'legs' 
  | 'shoulders' 
  | 'arms' 
  | 'core' 
  | 'cardio'
  | 'flexibility'
  | 'full-body'

export interface ExerciseSearchFilters {
  category?: ExerciseCategory
  muscleGroups?: string[]
  equipment?: string[]
  difficulty?: string
  search?: string
  userOnly?: boolean
}

export interface ExerciseLibraryProps {
  onExerciseSelect?: (exercise: ExerciseTemplate) => void
  selectionMode?: boolean
  showCustomOnly?: boolean
  categories?: ExerciseCategory[]
}
```

## Implementation

### Exercise Library Main View

```typescript
// src/components/fitness/ExerciseLibrary/ExerciseLibraryView.tsx

import React, { useState, useEffect, useMemo } from 'react'
import { Search, Filter, Plus, Grid3X3, List, BookOpen } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '@/components/base'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExerciseGrid } from './ExerciseGrid'
import { ExerciseSearch } from './ExerciseSearch'
import { ExerciseForm } from './ExerciseForm'
import { CustomExerciseManager } from './CustomExerciseManager'
import { useExerciseLibrary } from '@/hooks/useExerciseLibrary'

interface ExerciseLibraryViewProps {
  onExerciseSelect?: (exercise: ExerciseTemplate) => void
  selectionMode?: boolean
  showHeader?: boolean
}

export function ExerciseLibraryView({ 
  onExerciseSelect, 
  selectionMode = false,
  showHeader = true 
}: ExerciseLibraryViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  const debouncedSearch = useDebounce(searchTerm, 300)
  
  const {
    exercises,
    isLoading,
    error,
    refetch,
    createExercise,
    updateExercise,
    deleteExercise
  } = useExerciseLibrary({
    search: debouncedSearch,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    includeCustom: true
  })

  const exercisesByCategory = useMemo(() => {
    const categories: Record<string, ExerciseTemplate[]> = {}
    
    exercises.forEach(exercise => {
      if (!categories[exercise.category]) {
        categories[exercise.category] = []
      }
      categories[exercise.category].push(exercise)
    })
    
    return categories
  }, [exercises])

  const handleExerciseCreate = async (exerciseData: Partial<ExerciseTemplate>) => {
    try {
      await createExercise(exerciseData)
      setShowCreateForm(false)
      // Show success toast
    } catch (error) {
      console.error('Error creating exercise:', error)
      // Show error toast
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Failed to load exercises</h3>
        <p className="text-gray-600 mb-4">There was an error loading the exercise library.</p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {showHeader && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Exercise Library</h1>
            <p className="text-gray-600">
              Browse {exercises.length} exercises or create your own
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
            </Button>
            
            <Button
              onClick={() => setShowCreateForm(true)}
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create Exercise
            </Button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <ExerciseSearch
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        exerciseCount={exercises.length}
      />

      {/* Content Tabs */}
      <Tabs defaultValue="library" className="flex-1 mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="library">Exercise Library</TabsTrigger>
          <TabsTrigger value="custom">My Exercises</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="flex-1 mt-4">
          <ExerciseGrid
            exercises={exercises.filter(e => !e.isCustom)}
            viewMode={viewMode}
            isLoading={isLoading}
            onExerciseSelect={onExerciseSelect}
            selectionMode={selectionMode}
            onExerciseEdit={updateExercise}
            categories={exercisesByCategory}
          />
        </TabsContent>

        <TabsContent value="custom" className="flex-1 mt-4">
          <CustomExerciseManager
            exercises={exercises.filter(e => e.isCustom)}
            onExerciseCreate={handleExerciseCreate}
            onExerciseUpdate={updateExercise}
            onExerciseDelete={deleteExercise}
            onExerciseSelect={onExerciseSelect}
          />
        </TabsContent>
      </Tabs>

      {/* Create Exercise Modal */}
      {showCreateForm && (
        <ExerciseForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSave={handleExerciseCreate}
          title="Create New Exercise"
        />
      )}
    </div>
  )
}
```

### Exercise Card Component

```typescript
// src/components/fitness/ExerciseLibrary/ExerciseCard.tsx

import React from 'react'
import { MoreVertical, Play, Edit, Trash2, Copy, Dumbbell, Timer } from 'lucide-react'
import { DataCard, StatusBadge } from '@/components/base'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

interface ExerciseCardProps {
  exercise: ExerciseTemplate
  onSelect?: (exercise: ExerciseTemplate) => void
  onEdit?: (exercise: ExerciseTemplate) => void
  onDelete?: (exercise: ExerciseTemplate) => void
  onDuplicate?: (exercise: ExerciseTemplate) => void
  selectionMode?: boolean
  viewMode?: 'grid' | 'list'
}

export function ExerciseCard({ 
  exercise, 
  onSelect, 
  onEdit, 
  onDelete,
  onDuplicate,
  selectionMode = false,
  viewMode = 'grid' 
}: ExerciseCardProps) {
  const handleCardClick = () => {
    if (selectionMode && onSelect) {
      onSelect(exercise)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cardio': return <Timer className="h-4 w-4" />
      default: return <Dumbbell className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      chest: 'red',
      back: 'blue', 
      legs: 'green',
      shoulders: 'orange',
      arms: 'purple',
      core: 'yellow',
      cardio: 'pink',
      flexibility: 'indigo',
      'full-body': 'gray'
    }
    return colors[category as keyof typeof colors] || 'gray'
  }

  if (viewMode === 'list') {
    return (
      <div className="flex items-center p-4 border rounded-lg hover:shadow-md transition-shadow">
        {/* Exercise Image/Icon */}
        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
          {exercise.imageUrl ? (
            <img 
              src={exercise.imageUrl} 
              alt={exercise.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            getCategoryIcon(exercise.category)
          )}
        </div>

        {/* Exercise Info */}
        <div className="flex-1 ml-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{exercise.name}</h3>
            {exercise.isCustom && <Badge variant="outline" size="sm">Custom</Badge>}
          </div>
          
          <p className="text-sm text-gray-600 mb-2">{exercise.description}</p>
          
          <div className="flex items-center gap-2">
            <StatusBadge 
              status={exercise.category}
              variant={getCategoryColor(exercise.category) as any}
              size="sm"
            />
            {exercise.muscleGroups.slice(0, 2).map((muscle, index) => (
              <Badge key={index} variant="secondary" size="sm">
                {muscle}
              </Badge>
            ))}
            {exercise.muscleGroups.length > 2 && (
              <Badge variant="secondary" size="sm">
                +{exercise.muscleGroups.length - 2} more
              </Badge>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {selectionMode ? (
            <Button 
              onClick={handleCardClick}
              size="sm"
            >
              Select
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelect?.(exercise)}
              >
                <Play className="h-4 w-4" />
              </Button>
              
              {(onEdit || onDelete || onDuplicate) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(exercise)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDuplicate && (
                      <DropdownMenuItem onClick={() => onDuplicate(exercise)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                    )}
                    {onDelete && exercise.isCustom && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(exercise)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // Grid view (card format)
  return (
    <DataCard
      title={exercise.name}
      description={exercise.description}
      badge={exercise.isCustom ? { text: 'Custom', variant: 'secondary' } : undefined}
      metadata={[
        { 
          icon: getCategoryIcon(exercise.category), 
          label: 'Category', 
          value: exercise.category 
        },
        { 
          icon: <Dumbbell className="h-4 w-4" />, 
          label: 'Muscle Groups', 
          value: exercise.muscleGroups.length.toString()
        },
        ...(exercise.equipmentNeeded ? [{
          label: 'Equipment',
          value: exercise.equipmentNeeded
        }] : [])
      ]}
      actions={[
        {
          label: selectionMode ? 'Select' : 'Use Exercise',
          icon: selectionMode ? undefined : <Play className="h-4 w-4" />,
          onClick: () => onSelect?.(exercise)
        }
      ]}
      interactive={true}
      onClick={handleCardClick}
      className={`transition-all ${
        selectionMode 
          ? 'cursor-pointer hover:ring-2 hover:ring-primary' 
          : ''
      }`}
    />
  )
}
```

### Exercise Search Component

```typescript
// src/components/fitness/ExerciseLibrary/ExerciseSearch.tsx

import React from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { EXERCISE_CATEGORIES, MUSCLE_GROUPS, EQUIPMENT_TYPES } from '@/lib/fitness/constants'

interface ExerciseSearchProps {
  searchTerm: string
  onSearchChange: (search: string) => void
  selectedCategory: ExerciseCategory | 'all'
  onCategoryChange: (category: ExerciseCategory | 'all') => void
  exerciseCount: number
  filters?: ExerciseSearchFilters
  onFiltersChange?: (filters: ExerciseSearchFilters) => void
}

export function ExerciseSearch({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  exerciseCount,
  filters = {},
  onFiltersChange
}: ExerciseSearchProps) {
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false)

  const handleMuscleGroupToggle = (muscleGroup: string) => {
    const current = filters.muscleGroups || []
    const updated = current.includes(muscleGroup)
      ? current.filter(mg => mg !== muscleGroup)
      : [...current, muscleGroup]
    
    onFiltersChange?.({ ...filters, muscleGroups: updated })
  }

  const handleEquipmentChange = (equipment: string) => {
    const current = filters.equipment || []
    const updated = current.includes(equipment)
      ? current.filter(eq => eq !== equipment)
      : [...current, equipment]
    
    onFiltersChange?.({ ...filters, equipment: updated })
  }

  const clearFilters = () => {
    onSearchChange('')
    onCategoryChange('all')
    onFiltersChange?.({})
    setShowAdvancedFilters(false)
  }

  const hasActiveFilters = searchTerm || 
    selectedCategory !== 'all' || 
    (filters.muscleGroups && filters.muscleGroups.length > 0) ||
    (filters.equipment && filters.equipment.length > 0) ||
    filters.difficulty

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {EXERCISE_CATEGORIES.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          leftIcon={<Filter className="h-4 w-4" />}
        >
          Filters
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
          {/* Muscle Groups */}
          <div>
            <label className="text-sm font-medium mb-2 block">Muscle Groups</label>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map(muscleGroup => (
                <Badge
                  key={muscleGroup}
                  variant={filters.muscleGroups?.includes(muscleGroup) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleMuscleGroupToggle(muscleGroup)}
                >
                  {muscleGroup}
                </Badge>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="text-sm font-medium mb-2 block">Equipment</label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_TYPES.map(equipment => (
                <Badge
                  key={equipment}
                  variant={filters.equipment?.includes(equipment) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => handleEquipmentChange(equipment)}
                >
                  {equipment}
                </Badge>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="text-sm font-medium mb-2 block">Difficulty</label>
            <Select 
              value={filters.difficulty || ''} 
              onValueChange={(value) => onFiltersChange?.({ ...filters, difficulty: value || undefined })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Any difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any difficulty</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''} found
        </span>
        
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            leftIcon={<X className="h-4 w-4" />}
          >
            Clear filters
          </Button>
        )}
      </div>
    </div>
  )
}
```

### Exercise Form Component

```typescript
// src/components/fitness/ExerciseLibrary/ExerciseForm.tsx

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
import { EXERCISE_CATEGORIES, MUSCLE_GROUPS } from '@/lib/fitness/constants'

const ExerciseFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  category: z.enum(['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'flexibility', 'full-body']),
  muscleGroups: z.array(z.string()).min(1, 'At least one muscle group is required'),
  equipmentNeeded: z.string().optional(),
  instructions: z.array(z.string()).optional(),
  videoUrl: z.string().url().optional().or(z.literal('')),
  imageUrl: z.string().url().optional().or(z.literal(''))
})

type ExerciseFormData = z.infer<typeof ExerciseFormSchema>

interface ExerciseFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<ExerciseTemplate>) => void
  exercise?: ExerciseTemplate
  title?: string
}

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
      imageUrl: exercise?.imageUrl || ''
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
                  className="cursor-pointer"
                  onClick={() => handleMuscleGroupToggle(muscleGroup)}
                >
                  {muscleGroup}
                </Badge>
              ))}
            </div>
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
```

## API Integration Hook

```typescript
// src/hooks/useExerciseLibrary.ts

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fitnessApi } from '@/lib/api/fitness'

export interface UseExerciseLibraryOptions {
  search?: string
  category?: ExerciseCategory
  muscleGroups?: string[]
  equipment?: string[]
  includeCustom?: boolean
  enabled?: boolean
}

export function useExerciseLibrary(options: UseExerciseLibraryOptions = {}) {
  const queryClient = useQueryClient()
  
  const {
    data: exercises = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['exercises', options],
    queryFn: () => fitnessApi.getExerciseTemplates(options),
    enabled: options.enabled !== false
  })

  const createMutation = useMutation({
    mutationFn: (exerciseData: Partial<ExerciseTemplate>) => 
      fitnessApi.createExerciseTemplate(exerciseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ExerciseTemplate> }) =>
      fitnessApi.updateExerciseTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fitnessApi.deleteExerciseTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] })
    }
  })

  return {
    exercises,
    isLoading,
    error,
    refetch,
    createExercise: createMutation.mutateAsync,
    updateExercise: (id: string, data: Partial<ExerciseTemplate>) => 
      updateMutation.mutateAsync({ id, data }),
    deleteExercise: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  }
}
```

## Implementation Tasks

### Task 1: Core Components
- [ ] Create ExerciseLibraryView with search and categories
- [ ] Implement ExerciseCard for both grid and list views
- [ ] Build ExerciseSearch with advanced filtering
- [ ] Create ExerciseForm for CRUD operations

### Task 2: Data Integration
- [ ] Implement useExerciseLibrary hook with React Query
- [ ] Create fitness API client methods
- [ ] Add proper TypeScript types and interfaces
- [ ] Test API integration with backend endpoints

### Task 3: Search & Filtering
- [ ] Implement debounced search functionality
- [ ] Add category and muscle group filtering
- [ ] Create equipment and difficulty filters
- [ ] Add sorting options (name, category, date created)

### Task 4: User Experience
- [ ] Add loading states and error handling
- [ ] Implement responsive design for mobile/desktop
- [ ] Add keyboard navigation support  
- [ ] Create empty states for no results

### Task 5: Testing
- [ ] Unit tests for all components
- [ ] Integration tests for search functionality
- [ ] Test form validation and submission
- [ ] E2E tests for complete exercise management workflow

## Validation Gates

### Component Testing
```typescript
// Test exercise library functionality
describe('ExerciseLibraryView', () => {
  it('displays exercises in grid format', () => {
    render(<ExerciseLibraryView />)
    expect(screen.getByText('Exercise Library')).toBeInTheDocument()
  })

  it('filters exercises by category', async () => {
    render(<ExerciseLibraryView />)
    
    const categorySelect = screen.getByRole('combobox')
    await user.click(categorySelect)
    await user.click(screen.getByText('Chest'))
    
    expect(mockApi.getExerciseTemplates).toHaveBeenCalledWith({
      category: 'chest'
    })
  })

  it('creates new exercise', async () => {
    render(<ExerciseLibraryView />)
    
    await user.click(screen.getByText('Create Exercise'))
    await user.type(screen.getByLabelText('Exercise Name'), 'Test Exercise')
    await user.click(screen.getByText('Create Exercise'))
    
    expect(mockApi.createExerciseTemplate).toHaveBeenCalled()
  })
})
```

### API Integration Testing
```bash
# Test exercise library endpoints
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/v1/modules/fitness?type=exercise-templates"

# Test exercise creation
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"type":"exercise-template","name":"Test Exercise","category":"chest","muscleGroups":["pectorals"]}' \
  http://localhost:3000/api/v1/modules/fitness
```

## Performance Considerations

### Search Optimization
- Implement debounced search to reduce API calls
- Cache exercise templates for faster filtering
- Use virtual scrolling for large exercise lists
- Optimize images with lazy loading

### Memory Management
- Implement proper cleanup in useEffect hooks
- Use React.memo for expensive components
- Optimize re-renders with proper dependency arrays

## Success Criteria

### Functionality
- [ ] Users can browse comprehensive exercise library
- [ ] Search and filtering work across all exercise attributes
- [ ] Custom exercise creation and editing function properly
- [ ] Exercise selection integrates with workout planning

### Performance
- [ ] Library loads in <2 seconds with 100+ exercises
- [ ] Search results appear in <300ms
- [ ] Smooth scrolling with large exercise lists
- [ ] Mobile responsiveness across all screen sizes

### User Experience
- [ ] Intuitive navigation between categories and search
- [ ] Clear visual hierarchy and exercise information
- [ ] Accessible keyboard navigation and screen reader support
- [ ] Consistent design patterns with existing application

This PRP provides a comprehensive exercise library system that serves as the foundation for all workout planning and execution functionality.