/**
 * Exercise Library Components
 * 
 * Export all exercise library related components for easy importing
 * Using dynamic exports to avoid HMR module factory issues
 */

import { lazy } from 'react'

// Primary components with lazy loading to prevent HMR issues
export const ExerciseLibraryView = lazy(() => import('./ExerciseLibraryView'))
export const ExerciseCard = lazy(() => import('./ExerciseCard'))
export const ExerciseSearch = lazy(() => import('./ExerciseSearch'))
export const ExerciseForm = lazy(() => import('./ExerciseForm'))
export const ExerciseGrid = lazy(() => import('./ExerciseGrid'))
export const CustomExerciseManager = lazy(() => import('./CustomExerciseManager'))

// Also provide direct exports for non-lazy usage (fallback)
export { ExerciseLibraryView as ExerciseLibraryViewDirect } from './ExerciseLibraryView'
export { ExerciseCard as ExerciseCardDirect } from './ExerciseCard'
export { ExerciseSearch as ExerciseSearchDirect } from './ExerciseSearch'
export { ExerciseForm as ExerciseFormDirect } from './ExerciseForm'
export { ExerciseGrid as ExerciseGridDirect } from './ExerciseGrid'
export { CustomExerciseManager as CustomExerciseManagerDirect } from './CustomExerciseManager'