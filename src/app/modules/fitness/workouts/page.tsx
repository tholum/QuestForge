/**
 * Fitness Workouts Page
 * 
 * Workouts route for fitness module showing workout planning interface.
 */
'use client'

import React from 'react'

export default function FitnessWorkoutsPage() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Workout Planning</h3>
      <p className="text-gray-600 mb-6">Plan and track your workouts with custom routines.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-3">Quick Workouts</h4>
          <div className="space-y-3">
            {[
              { name: 'Morning Cardio', duration: '30 min', type: 'Cardio' },
              { name: 'Upper Body Strength', duration: '45 min', type: 'Strength' },
              { name: 'Full Body HIIT', duration: '25 min', type: 'HIIT' },
              { name: 'Core & Abs', duration: '20 min', type: 'Core' }
            ].map((workout, i) => (
              <div key={i} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <h5 className="font-medium">{workout.name}</h5>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <span>{workout.duration}</span>
                  <span>•</span>
                  <span>{workout.type}</span>
                </div>
                <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                  Start Workout
                </button>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-3">Workout History</h4>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">Morning Run</h5>
                    <p className="text-sm text-gray-600">45 minutes • 400 calories</p>
                  </div>
                  <span className="text-sm text-gray-500">{i} days ago</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}