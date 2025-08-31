/**
 * Fitness Exercises Page
 * 
 * Exercises route for fitness module showing exercise library.
 */
'use client'

import React from 'react'

export default function FitnessExercisesPage() {
  return (
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
}