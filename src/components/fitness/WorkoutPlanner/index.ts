/**
 * Workout Planner Components
 * 
 * Using dynamic exports to avoid HMR module factory issues
 */

import { lazy } from 'react'

// Primary components with lazy loading to prevent HMR issues
export const WeeklyWorkoutPlanner = lazy(() => import('./WeeklyWorkoutPlanner'))
export const WorkoutForm = lazy(() => import('./WorkoutForm'))
export const WorkoutExecution = lazy(() => import('./WorkoutExecution'))
export const WorkoutTemplates = lazy(() => import('./WorkoutTemplates'))
export const WorkoutPlanningView = lazy(() => import('./WorkoutPlanningView'))

// Special handling for utils that export multiple items
export const CopyWorkoutDialog = lazy(() => 
  import('./WorkoutCopyUtils').then(mod => ({ default: mod.CopyWorkoutDialog }))
)

// Direct exports as fallback for non-lazy usage
export { WeeklyWorkoutPlanner as WeeklyWorkoutPlannerDirect } from './WeeklyWorkoutPlanner'
export { WorkoutForm as WorkoutFormDirect } from './WorkoutForm'
export { WorkoutExecution as WorkoutExecutionDirect } from './WorkoutExecution'
export { WorkoutTemplates as WorkoutTemplatesDirect } from './WorkoutTemplates'
export { WorkoutPlanningView as WorkoutPlanningViewDirect } from './WorkoutPlanningView'
export { CopyWorkoutDialog as CopyWorkoutDialogDirect, useCopyWorkouts } from './WorkoutCopyUtils'

// Re-export types (these are compile-time only, so no HMR issues)
export type { 
  Workout,
  WorkoutExercise,
  WeeklyWorkoutPlannerProps 
} from './WeeklyWorkoutPlanner'

export type { 
  WorkoutFormProps,
  ExerciseTemplate 
} from './WorkoutForm'

export type {
  WorkoutExecutionData,
  WorkoutExerciseExecution,
  WorkoutSet,
  WorkoutExecutionProps
} from './WorkoutExecution'

export type {
  WorkoutTemplate,
  WorkoutTemplatesProps
} from './WorkoutTemplates'