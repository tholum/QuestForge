/**
 * ExerciseLibraryView Component
 * 
 * Main exercise library interface with search, filtering, and management
 * capabilities. Supports both selection mode and general browsing.
 */
'use client'

import React, { useState, useMemo } from 'react'
import { Search, Filter, Plus, Grid3X3, List, BookOpen } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { Button } from '@/components/base/Button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExerciseGrid } from './ExerciseGrid'
import { ExerciseSearch } from './ExerciseSearch'
import { ExerciseForm } from './ExerciseForm'
import { CustomExerciseManager } from './CustomExerciseManager'
import { useExerciseLibrary } from '@/hooks/useExerciseLibrary'
import type { 
  ExerciseLibraryViewProps, 
  ExerciseTemplate, 
  ExerciseCategory,
  ExerciseSearchFilters 
} from '@/lib/fitness/types'

export function ExerciseLibraryView({ 
  onExerciseSelect, 
  selectionMode = false,
  showHeader = true 
}: ExerciseLibraryViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [filters, setFilters] = useState<ExerciseSearchFilters>({})
  
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
    includeCustom: true,
    ...filters
  })

  // Filter exercises based on advanced filters
  const filteredExercises = useMemo(() => {
    let filtered = exercises

    // Apply muscle group filter
    if (filters.muscleGroups && filters.muscleGroups.length > 0) {
      filtered = filtered.filter(exercise => 
        filters.muscleGroups!.some(mg => exercise.muscleGroups.includes(mg))
      )
    }

    // Apply equipment filter
    if (filters.equipment && filters.equipment.length > 0) {
      filtered = filtered.filter(exercise => {
        if (!exercise.equipmentNeeded) return filters.equipment!.includes('bodyweight')
        return filters.equipment!.some(eq => 
          exercise.equipmentNeeded!.toLowerCase().includes(eq.replace('-', ' '))
        )
      })
    }

    // Apply difficulty filter
    if (filters.difficulty) {
      filtered = filtered.filter(exercise => exercise.difficulty === filters.difficulty)
    }

    // Apply user-only filter
    if (filters.userOnly) {
      filtered = filtered.filter(exercise => exercise.isCustom && exercise.userId)
    }

    return filtered
  }, [exercises, filters])

  const exercisesByCategory = useMemo(() => {
    const categories: Record<string, ExerciseTemplate[]> = {}
    
    filteredExercises.forEach(exercise => {
      if (!categories[exercise.category]) {
        categories[exercise.category] = []
      }
      categories[exercise.category].push(exercise)
    })
    
    return categories
  }, [filteredExercises])

  const handleExerciseCreate = async (exerciseData: Partial<ExerciseTemplate>) => {
    try {
      await createExercise(exerciseData)
      setShowCreateForm(false)
      // TODO: Show success toast
    } catch (error) {
      console.error('Error creating exercise:', error)
      // TODO: Show error toast
    }
  }

  const handleFiltersChange = (newFilters: ExerciseSearchFilters) => {
    setFilters(newFilters)
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
              Browse {filteredExercises.length} exercises or create your own
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
        exerciseCount={filteredExercises.length}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Content Tabs */}
      <Tabs defaultValue="library" className="flex-1 mt-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="library">Exercise Library</TabsTrigger>
          <TabsTrigger value="custom">My Exercises</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="flex-1 mt-4">
          <ExerciseGrid
            exercises={filteredExercises.filter(e => !e.isCustom)}
            viewMode={viewMode}
            isLoading={isLoading}
            onExerciseSelect={onExerciseSelect}
            selectionMode={selectionMode}
            onExerciseEdit={updateExercise}
            categories={selectedCategory === 'all' && !searchTerm && Object.keys(filters).length === 0 
              ? Object.fromEntries(
                  Object.entries(exercisesByCategory).map(([cat, exs]) => [
                    cat, 
                    exs.filter(e => !e.isCustom)
                  ])
                )
              : undefined
            }
          />
        </TabsContent>

        <TabsContent value="custom" className="flex-1 mt-4">
          <CustomExerciseManager
            exercises={filteredExercises.filter(e => e.isCustom)}
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