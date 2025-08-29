/**
 * Progress Components Export Index
 * 
 * Centralized exports for all progress tracking components.
 */

export { default as ProgressEntryForm } from './ProgressEntryForm'
export { default as ProgressChart } from './ProgressChart'
export { default as QuickProgressEntry } from './QuickProgressEntry'
export { default as MobileProgressSlider } from './MobileProgressSlider'
export { default as ProgressDashboard } from './ProgressDashboard'

// Re-export progress hooks for convenience
export {
  useProgress,
  useProgressById,
  useGoalProgress,
  useUserAnalytics,
  useProgressChart,
  useLeaderboard,
  useCreateProgress,
  useUpdateProgress,
  useDeleteProgress,
  type ProgressEntry,
  type ProgressResponse,
  type CreateProgressResponse,
  type GoalProgressData,
  type UserAnalytics
} from '@/hooks/useProgress'