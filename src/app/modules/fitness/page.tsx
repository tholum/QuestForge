/**
 * Fitness Module Page Route
 * 
 * Main fitness page with tabbed interface - shows dashboard by default.
 */
'use client'

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MainContent } from '@/components/layout/MainContent'
import { DashboardView } from '@/components/fitness/views/DashboardView'
import { ProgressView } from '@/components/fitness/views/ProgressView'
import { WorkoutPlanningView } from '@/components/fitness/WorkoutPlanner/WorkoutPlanningView'
import { NutritionView } from '@/components/nutrition'
import { useAuth } from '@/hooks/useAuth'

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'exercises', label: 'Exercise Library' },
  { id: 'workouts', label: 'Workouts' },
  { id: 'progress', label: 'Progress' },
  { id: 'nutrition', label: 'Nutrition' }
]

// Exercise Library Component
const ExerciseLibraryView = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <h3 className="text-lg font-semibold mb-4">Exercise Library</h3>
    <p className="text-gray-600 mb-4">Browse exercises and create custom ones for your workouts.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        { name: 'Push-ups', category: 'Chest', difficulty: 'Beginner' },
        { name: 'Squats', category: 'Legs', difficulty: 'Beginner' },
        { name: 'Pull-ups', category: 'Back', difficulty: 'Intermediate' },
        { name: 'Deadlift', category: 'Full Body', difficulty: 'Advanced' },
        { name: 'Planks', category: 'Core', difficulty: 'Beginner' },
        { name: 'Burpees', category: 'Full Body', difficulty: 'Intermediate' }
      ].map((exercise, i) => (
        <div key={i} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
          <h4 className="font-medium text-lg">{exercise.name}</h4>
          <p className="text-sm text-gray-600">{exercise.category}</p>
          <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
            exercise.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
            exercise.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {exercise.difficulty}
          </span>
        </div>
      ))}
    </div>
  </div>
)


// Real NutritionView component is imported above and used directly in renderTabContent

export default function FitnessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'dashboard'
  const { user } = useAuth()

  // Handle workout completion
  const handleWorkoutComplete = (workout: any) => {
    // TODO: Add gamification/XP rewards here if needed
    console.log('Workout completed:', workout)
  }

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tabId === 'dashboard') {
      params.delete('tab')
    } else {
      params.set('tab', tabId)
    }
    const queryString = params.toString()
    const newUrl = queryString ? `?${queryString}` : ''
    router.push(`/modules/fitness${newUrl}`)
  }

  const renderTabContent = () => {
    if (!user) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-center text-gray-600">Please log in to access the fitness module.</p>
        </div>
      )
    }

    switch (activeTab) {
      case 'exercises':
        return <ExerciseLibraryView />
      case 'workouts':
        return (
          <WorkoutPlanningView
            userId={user.id}
            onWorkoutComplete={handleWorkoutComplete}
          />
        )
      case 'progress':
        return <ProgressView userId={user.id} />
      case 'nutrition':
        return <NutritionView userId={user.id} />
      default:
        return <DashboardView userId={user.id} />
    }
  }

  return (
    <MainContent
      currentPage="modules"
      pageTitle="Fitness Module"
      pageSubtitle="Track your fitness goals and workouts"
    >
      <div className="p-6" data-testid="module-content">
        <h2 className="text-2xl font-bold mb-6" data-testid="module-title">Fitness Tracker</h2>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 p-1 bg-gray-100 rounded-lg">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </MainContent>
  )
}