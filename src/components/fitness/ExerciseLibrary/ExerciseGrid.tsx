/**
 * ExerciseGrid Component
 * 
 * Grid/list display for exercise templates with loading states
 * and empty state handling.
 */

import React from 'react'
import { BookOpen, Dumbbell } from 'lucide-react'
import { LoadingSpinner } from '@/components/base/LoadingSpinner'
import { ExerciseCard } from './ExerciseCard'
import type { ExerciseGridProps } from '@/lib/fitness/types'

export function ExerciseGrid({
  exercises,
  viewMode,
  isLoading,
  onExerciseSelect,
  selectionMode = false,
  onExerciseEdit,
  categories
}: ExerciseGridProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p className="text-gray-600 mt-4">Loading exercises...</p>
      </div>
    )
  }

  // Empty state
  if (exercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No exercises found</h3>
        <p className="text-gray-600 text-center max-w-md">
          {selectionMode 
            ? "No exercises match your current search criteria. Try adjusting your filters."
            : "No exercises found. Create a custom exercise or adjust your search filters."
          }
        </p>
      </div>
    )
  }

  const handleExerciseEdit = (exercise: any) => {
    if (onExerciseEdit) {
      onExerciseEdit(exercise.id, exercise)
    }
  }

  // Grid view layout
  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onSelect={onExerciseSelect}
            onEdit={handleExerciseEdit}
            selectionMode={selectionMode}
            viewMode="grid"
          />
        ))}
      </div>
    )
  }

  // List view layout
  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onSelect={onExerciseSelect}
            onEdit={handleExerciseEdit}
            selectionMode={selectionMode}
            viewMode="list"
          />
        ))}
      </div>
    )
  }

  // Category-based view (if categories provided)
  if (categories) {
    return (
      <div className="space-y-8">
        {Object.entries(categories).map(([categoryName, categoryExercises]) => (
          <div key={categoryName}>
            <div className="flex items-center gap-2 mb-4">
              <Dumbbell className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold capitalize">
                {categoryName.replace('-', ' ')} Exercises
              </h3>
              <span className="text-sm text-gray-500">
                ({categoryExercises.length})
              </span>
            </div>
            
            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                : "space-y-3"
            }>
              {categoryExercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onSelect={onExerciseSelect}
                  onEdit={handleExerciseEdit}
                  selectionMode={selectionMode}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return null
}