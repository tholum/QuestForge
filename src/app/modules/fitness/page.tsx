/**
 * Fitness Module Page Route
 * 
 * Next.js 15 App Router page for the Fitness module.
 */
'use client'

import React from 'react';
import { MainContent } from '@/components/layout/MainContent';

// Import the component directly since the module structure isn't loading
import { ExerciseLibraryView } from '@/components/fitness/ExerciseLibrary';
import { WorkoutPlanningView } from '@/components/fitness/WorkoutPlanner/WorkoutPlanningView';

const FitnessModuleView = () => {
  const [activeTab, setActiveTab] = React.useState('dashboard')

  return (
    <div className="p-6" data-testid="module-content">
      <h2 className="text-2xl font-bold mb-6" data-testid="module-title">Fitness Tracker</h2>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('exercises')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'exercises'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Exercise Library
        </button>
        <button
          onClick={() => setActiveTab('workouts')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'workouts'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Workouts
        </button>
        <button
          onClick={() => setActiveTab('progress')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'progress'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Progress
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Workout History</h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <h4 className="font-medium">Morning Run</h4>
                      <p className="text-sm text-gray-600">45 minutes • 400 calories</p>
                    </div>
                    <span className="text-sm text-gray-500">{i} days ago</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Weekly Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Workouts</span>
                  <span className="font-medium">5/7</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Time</span>
                  <span className="font-medium">3h 20m</span>
                </div>
                <div className="flex justify-between">
                  <span>Calories</span>
                  <span className="font-medium">1,250</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Achievements</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">🏆</span>
                  <span className="text-sm">First Workout</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">🏃</span>
                  <span className="text-sm text-gray-600">5K Runner (Locked)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'exercises' && (
        <div className="bg-white rounded-lg shadow p-6">
          <ExerciseLibraryView 
            showHeader={false}
            onExerciseSelect={(exercise) => {
              console.log('Selected exercise:', exercise)
            }}
          />
        </div>
      )}

      {activeTab === 'workouts' && (
        <div className="bg-white rounded-lg shadow p-0 h-[600px]">
          <WorkoutPlanningView 
            userId="placeholder-user-id"
            onWorkoutComplete={(workout) => {
              console.log('Workout completed:', workout)
            }}
          />
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Progress Tracking</h3>
          <p className="text-gray-600">Progress analytics and personal records coming soon...</p>
        </div>
      )}
    </div>
  )
}

/**
 * Fitness module page - authentication handled by AuthProvider
 */
export default function Page() {
  return (
    <MainContent
      currentPage="modules"
      pageTitle="Fitness Module"
      pageSubtitle="Track your fitness goals and workouts"
    >
      <FitnessModuleView />
    </MainContent>
  );
}