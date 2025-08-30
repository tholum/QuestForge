/**
 * Fitness Module Types
 * 
 * TypeScript interfaces and types for the fitness module components
 */

import type { ExerciseCategory } from './constants'

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

export interface WorkoutPlan {
  id: string
  userId: string
  name: string
  description?: string
  isTemplate: boolean
  isActive: boolean
  startDate?: Date
  endDate?: Date
  createdAt: Date
  updatedAt: Date
  workouts?: Workout[]
  _count?: {
    workouts: number
  }
}

export interface Workout {
  id: string
  planId?: string
  userId: string
  name: string
  description?: string
  scheduledDate?: Date
  completedAt?: Date
  isTemplate: boolean
  workoutType: 'cardio' | 'strength' | 'flexibility' | 'mixed'
  estimatedDuration?: number
  actualDuration?: number
  notes?: string
  xpAwarded: number
  createdAt: Date
  updatedAt: Date
  plan?: Pick<WorkoutPlan, 'id' | 'name'>
  exercises?: WorkoutExercise[]
  _count?: {
    exercises: number
  }
}

export interface WorkoutExercise {
  id: string
  workoutId: string
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
  createdAt: Date
  updatedAt: Date
  workout?: Pick<Workout, 'id' | 'name' | 'userId'>
  exercise?: Pick<ExerciseTemplate, 'id' | 'name' | 'category' | 'muscleGroups'>
  sets?: WorkoutSet[]
}

export interface WorkoutSet {
  id: string
  workoutExerciseId: string
  setNumber: number
  reps?: number
  weight?: number
  duration?: number
  distance?: number
  restAfter?: number
  rpe?: number
  notes?: string
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
  workoutExercise?: WorkoutExercise
}

export interface PersonalRecord {
  id: string
  userId: string
  exerciseId: string
  recordType: '1rm' | '5rm' | 'volume' | 'duration' | 'distance'
  value: number
  unit: 'lbs' | 'kg' | 'seconds' | 'miles' | 'km'
  previousValue?: number
  achievedAt: Date
  workoutId?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
  exercise?: Pick<ExerciseTemplate, 'id' | 'name' | 'category'>
  workout?: Pick<Workout, 'id' | 'name' | 'scheduledDate'>
}

export interface FitnessDashboardData {
  activeWorkoutPlans: WorkoutPlan[]
  recentWorkouts: Workout[]
  weeklyStats: {
    totalWorkouts: number
    totalDuration: number
  }
  personalRecords: PersonalRecord[]
  exerciseCategories: any
  upcomingWorkouts: Workout[]
  stats: {
    totalActivePlans: number
    weeklyWorkouts: number
    weeklyDuration: number
    recentPRCount: number
  }
}

export interface FitnessAnalytics {
  period: string
  workoutCount: number
  totalDuration: number
  averageDuration: number
  exerciseVolume: number
  personalRecordCount: number
}

// API Response Types
export interface FitnessApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  details?: any[]
}

// Hook Options
export interface UseExerciseLibraryOptions {
  search?: string
  category?: ExerciseCategory
  muscleGroups?: string[]
  equipment?: string[]
  includeCustom?: boolean
  enabled?: boolean
}

// Component Props
export interface ExerciseCardProps {
  exercise: ExerciseTemplate
  onSelect?: (exercise: ExerciseTemplate) => void
  onEdit?: (exercise: ExerciseTemplate) => void
  onDelete?: (exercise: ExerciseTemplate) => void
  onDuplicate?: (exercise: ExerciseTemplate) => void
  selectionMode?: boolean
  viewMode?: 'grid' | 'list'
}

export interface ExerciseSearchProps {
  searchTerm: string
  onSearchChange: (search: string) => void
  selectedCategory: ExerciseCategory | 'all'
  onCategoryChange: (category: ExerciseCategory | 'all') => void
  exerciseCount: number
  filters?: ExerciseSearchFilters
  onFiltersChange?: (filters: ExerciseSearchFilters) => void
}

export interface ExerciseFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<ExerciseTemplate>) => void
  exercise?: ExerciseTemplate
  title?: string
}

export interface ExerciseGridProps {
  exercises: ExerciseTemplate[]
  viewMode: 'grid' | 'list'
  isLoading: boolean
  onExerciseSelect?: (exercise: ExerciseTemplate) => void
  selectionMode?: boolean
  onExerciseEdit?: (id: string, data: Partial<ExerciseTemplate>) => void
  categories?: Record<string, ExerciseTemplate[]>
}

export interface CustomExerciseManagerProps {
  exercises: ExerciseTemplate[]
  onExerciseCreate: (data: Partial<ExerciseTemplate>) => void
  onExerciseUpdate: (id: string, data: Partial<ExerciseTemplate>) => void
  onExerciseDelete: (id: string) => void
  onExerciseSelect?: (exercise: ExerciseTemplate) => void
}

export interface ExerciseLibraryViewProps {
  onExerciseSelect?: (exercise: ExerciseTemplate) => void
  selectionMode?: boolean
  showHeader?: boolean
}