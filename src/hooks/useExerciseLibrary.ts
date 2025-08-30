/**
 * useExerciseLibrary Hook
 * 
 * React Query-based hook for managing exercise library data including
 * fetching, creating, updating, and deleting exercise templates.
 */
'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { 
  ExerciseTemplate, 
  ExerciseCategory, 
  UseExerciseLibraryOptions, 
  FitnessApiResponse 
} from '@/lib/fitness/types'

// Fitness API client functions
class FitnessApiClient {
  private baseUrl = '/api/v1/modules/fitness'

  async getExerciseTemplates(options: UseExerciseLibraryOptions = {}): Promise<ExerciseTemplate[]> {
    const params = new URLSearchParams()
    params.append('type', 'exercise-templates')
    
    if (options.search) params.append('search', options.search)
    if (options.category) params.append('category', options.category)
    if (options.includeCustom) params.append('includeCustom', 'true')
    
    const response = await fetch(`${this.baseUrl}?${params}`)
    if (!response.ok) {
      throw new Error('Failed to fetch exercise templates')
    }
    
    const result: FitnessApiResponse<ExerciseTemplate[]> = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch exercise templates')
    }
    
    return result.data || []
  }

  async createExerciseTemplate(data: Partial<ExerciseTemplate>): Promise<ExerciseTemplate> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'exercise-template',
        ...data
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to create exercise template')
    }
    
    const result: FitnessApiResponse<ExerciseTemplate> = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Failed to create exercise template')
    }
    
    return result.data!
  }

  async updateExerciseTemplate(id: string, data: Partial<ExerciseTemplate>): Promise<ExerciseTemplate> {
    const response = await fetch(this.baseUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'exercise-template',
        id,
        ...data
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to update exercise template')
    }
    
    const result: FitnessApiResponse<ExerciseTemplate> = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Failed to update exercise template')
    }
    
    return result.data!
  }

  async deleteExerciseTemplate(id: string): Promise<void> {
    const params = new URLSearchParams()
    params.append('type', 'exercise-template')
    params.append('id', id)
    
    const response = await fetch(`${this.baseUrl}?${params}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete exercise template')
    }
    
    const result: FitnessApiResponse = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete exercise template')
    }
  }
}

// Create singleton instance
const fitnessApi = new FitnessApiClient()

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

// Export the API client for direct use if needed
export { fitnessApi }