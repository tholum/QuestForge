/**
 * Fitness Workouts Page
 * 
 * Full workout planning interface with workout execution capabilities.
 */
'use client'

import React, { Suspense } from 'react'
import { WorkoutPlanningView } from '@/components/fitness/WorkoutPlanner/WorkoutPlanningView'

// Use actual seeded user ID - in a real app, this would come from auth context
const TEST_USER_ID = 'cmf0i3af3002gtyzuqrs4wvvs' // demo@example.com user

function WorkoutPlanningLoader() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
}

export default function FitnessWorkoutsPage() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Suspense fallback={<WorkoutPlanningLoader />}>
        <WorkoutPlanningView 
          userId={TEST_USER_ID}
          onWorkoutComplete={(workout) => {
            console.log('Workout completed:', workout)
            // Could trigger notifications, XP awards, etc.
          }}
        />
      </Suspense>
    </div>
  )
}