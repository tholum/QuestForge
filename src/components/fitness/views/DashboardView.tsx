/**
 * Dashboard View Component
 * 
 * Main dashboard interface for fitness module showing workout history,
 * weekly stats, and achievements.
 */
'use client'

import React from 'react'
import { useFitnessDashboard, formatDuration, formatWorkoutDate, estimateCalories } from '@/hooks/fitness/useFitnessDashboard'
import { Loader2 } from 'lucide-react'

export interface DashboardViewProps {
  userId?: string
}

interface LoadingSpinnerProps {
  message?: string
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4 animate-pulse"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 bg-gray-200 rounded w-24 mb-4 animate-pulse"></div>
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingSpinner({ message = "Loading dashboard..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  )
}

function ErrorState({ error, onRetry }: { error: Error, onRetry: () => void }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-center py-8">
        <div className="text-red-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h3>
        <p className="text-sm text-gray-600 mb-4">{error.message}</p>
        <button 
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}

function EmptyWorkoutHistory() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Workout History</h3>
      <div className="text-center py-8">
        <div className="text-gray-400 text-4xl mb-4">💪</div>
        <h4 className="text-md font-medium text-gray-900 mb-2">No workouts yet</h4>
        <p className="text-sm text-gray-600">Start your fitness journey by creating your first workout!</p>
      </div>
    </div>
  )
}

export function DashboardView({ userId = 'test-user-id' }: DashboardViewProps) {
  const { data: dashboardData, isLoading, error, refetch } = useFitnessDashboard(userId)

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return <ErrorState error={error as Error} onRetry={() => refetch()} />
  }

  const hasWorkouts = dashboardData?.recentWorkouts?.length > 0
  const weeklyStats = dashboardData?.weeklyStats || { totalWorkouts: 0, totalDuration: 0 }
  const stats = dashboardData?.stats || { weeklyWorkouts: 0, weeklyDuration: 0, recentPRCount: 0 }

  // Calculate estimated calories for the week
  const estimatedWeeklyCalories = dashboardData?.recentWorkouts
    ?.filter(workout => workout.completedAt && workout.actualDuration)
    ?.reduce((total, workout) => {
      return total + estimateCalories(workout.actualDuration || 0, workout.workoutType)
    }, 0) || 0

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        {hasWorkouts ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Workout History</h3>
            <div className="space-y-3">
              {dashboardData.recentWorkouts.slice(0, 5).map(workout => {
                const duration = workout.actualDuration || 0
                const calories = estimateCalories(duration, workout.workoutType)
                const exerciseNames = workout.exercises
                  ?.map(ex => ex.exercise.name)
                  ?.slice(0, 2)
                  ?.join(', ') || workout.name
                
                return (
                  <div key={workout.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <h4 className="font-medium">{workout.name}</h4>
                      <p className="text-sm text-gray-600">
                        {duration > 0 ? `${formatDuration(duration)} • ${calories} calories` : exerciseNames}
                      </p>
                      {workout.plan?.name && (
                        <p className="text-xs text-gray-500">Part of {workout.plan.name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">
                        {formatWorkoutDate(workout.scheduledDate)}
                      </span>
                      {workout.completedAt && (
                        <div className="text-xs text-green-600">✓ Completed</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <EmptyWorkoutHistory />
        )}
      </div>
      
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Weekly Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Workouts</span>
              <span className="font-medium">{weeklyStats.totalWorkouts}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Time</span>
              <span className="font-medium">
                {weeklyStats.totalDuration > 0 ? formatDuration(weeklyStats.totalDuration) : '0m'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Calories</span>
              <span className="font-medium">
                {estimatedWeeklyCalories > 0 ? estimatedWeeklyCalories.toLocaleString() : '0'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Achievements</h3>
          <div className="space-y-2">
            {stats.weeklyWorkouts > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">🏆</span>
                <span className="text-sm">First Workout</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">🏆</span>
                <span className="text-sm text-gray-600">First Workout (Start your first workout!)</span>
              </div>
            )}
            
            {stats.recentPRCount > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">💪</span>
                <span className="text-sm">Personal Record</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">💪</span>
                <span className="text-sm text-gray-600">Personal Record (Set a new PR!)</span>
              </div>
            )}
            
            {weeklyStats.totalWorkouts >= 3 ? (
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">🔥</span>
                <span className="text-sm">Weekly Warrior</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-gray-400">🔥</span>
                <span className="text-sm text-gray-600">Weekly Warrior ({weeklyStats.totalWorkouts}/3 workouts)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}