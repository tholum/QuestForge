/**
 * CustomExerciseManager Component
 * 
 * Manages user's custom exercise templates with creation, editing,
 * and deletion capabilities.
 */
'use client'

import React, { useState } from 'react'
import { Plus, Edit, Trash2, Copy, BookOpen } from 'lucide-react'
import { Button } from '@/components/base/Button'
import { ExerciseCard } from './ExerciseCard'
import { ExerciseForm } from './ExerciseForm'
import type { CustomExerciseManagerProps, ExerciseTemplate } from '@/lib/fitness/types'

export function CustomExerciseManager({
  exercises,
  onExerciseCreate,
  onExerciseUpdate,
  onExerciseDelete,
  onExerciseSelect
}: CustomExerciseManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingExercise, setEditingExercise] = useState<ExerciseTemplate | null>(null)
  const [deletingExercise, setDeletingExercise] = useState<ExerciseTemplate | null>(null)

  const handleCreate = async (data: Partial<ExerciseTemplate>) => {
    try {
      await onExerciseCreate(data)
      setShowCreateForm(false)
      // TODO: Show success toast
    } catch (error) {
      console.error('Error creating exercise:', error)
      // TODO: Show error toast
    }
  }

  const handleEdit = (exercise: ExerciseTemplate) => {
    setEditingExercise(exercise)
  }

  const handleUpdate = async (data: Partial<ExerciseTemplate>) => {
    if (!editingExercise) return
    
    try {
      await onExerciseUpdate(editingExercise.id, data)
      setEditingExercise(null)
      // TODO: Show success toast
    } catch (error) {
      console.error('Error updating exercise:', error)
      // TODO: Show error toast
    }
  }

  const handleDelete = async (exercise: ExerciseTemplate) => {
    if (!window.confirm(`Are you sure you want to delete "${exercise.name}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      await onExerciseDelete(exercise.id)
      setDeletingExercise(null)
      // TODO: Show success toast
    } catch (error) {
      console.error('Error deleting exercise:', error)
      // TODO: Show error toast
    }
  }

  const handleDuplicate = async (exercise: ExerciseTemplate) => {
    const duplicateData = {
      name: `${exercise.name} (Copy)`,
      description: exercise.description,
      category: exercise.category,
      muscleGroups: [...exercise.muscleGroups],
      equipmentNeeded: exercise.equipmentNeeded,
      instructions: exercise.instructions ? [...exercise.instructions] : undefined,
      difficulty: exercise.difficulty
    }

    try {
      await onExerciseCreate(duplicateData)
      // TODO: Show success toast
    } catch (error) {
      console.error('Error duplicating exercise:', error)
      // TODO: Show error toast
    }
  }

  if (exercises.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Custom Exercises Yet</h3>
          <p className="text-gray-600 text-center max-w-md mb-6">
            Create your first custom exercise to track your unique workouts and movements.
            You can also duplicate existing exercises and modify them to suit your needs.
          </p>
          <Button
            onClick={() => setShowCreateForm(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Your First Exercise
          </Button>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <ExerciseForm
            isOpen={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            onSave={handleCreate}
            title="Create Custom Exercise"
          />
        )}
      </>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">My Custom Exercises</h2>
          <p className="text-gray-600">
            {exercises.length} custom exercise{exercises.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Create Exercise
        </Button>
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onSelect={onExerciseSelect}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            viewMode="grid"
          />
        ))}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <ExerciseForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSave={handleCreate}
          title="Create Custom Exercise"
        />
      )}

      {/* Edit Form Modal */}
      {editingExercise && (
        <ExerciseForm
          isOpen={true}
          onClose={() => setEditingExercise(null)}
          onSave={handleUpdate}
          exercise={editingExercise}
          title="Edit Exercise"
        />
      )}
    </div>
  )
}