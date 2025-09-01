/**
 * Fitness Goals Page
 * 
 * Goals route for fitness module showing goal setting and tracking interface.
 */
'use client'

import React from 'react'

export default function FitnessGoalsPage() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Fitness Goals</h3>
      <p className="text-gray-600 mb-6">Set and track your fitness goals to stay motivated.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-3">Current Goals</h4>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border">
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium text-blue-900">Weekly Workout Target</h5>
                <span className="text-sm text-blue-600">Active</span>
              </div>
              <p className="text-sm text-blue-700 mb-3">Complete 4 workouts per week</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-600">Progress: 2/4 this week</span>
                <div className="w-24 bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg border">
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium text-green-900">Weight Loss Goal</h5>
                <span className="text-sm text-green-600">Active</span>
              </div>
              <p className="text-sm text-green-700 mb-3">Lose 10 lbs in 3 months</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-green-600">Progress: 3 lbs lost</span>
                <div className="w-24 bg-green-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg border">
              <div className="flex justify-between items-start mb-2">
                <h5 className="font-medium text-purple-900">Strength Building</h5>
                <span className="text-sm text-purple-600">Active</span>
              </div>
              <p className="text-sm text-purple-700 mb-3">Increase bench press by 25%</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-purple-600">Progress: 15% increase</span>
                <div className="w-24 bg-purple-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-3">Goal Templates</h4>
          <div className="space-y-3">
            {[
              { name: 'Weight Loss', description: 'Lose weight through cardio and diet', icon: '🏃‍♀️' },
              { name: 'Muscle Building', description: 'Build strength and muscle mass', icon: '💪' },
              { name: 'Endurance', description: 'Improve cardiovascular endurance', icon: '🫀' },
              { name: 'Flexibility', description: 'Increase flexibility and mobility', icon: '🤸‍♀️' }
            ].map((template, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <h5 className="font-medium">{template.name}</h5>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Create New Goal
          </button>
        </div>
      </div>
      
      {/* Goal analytics section */}
      <div className="mt-8 pt-6 border-t">
        <h4 className="font-medium mb-4">Goal Analytics</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium mb-2">Goals Completed</h5>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-green-600">5</span>
              <span className="text-sm text-gray-600">this month</span>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium mb-2">Success Rate</h5>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600">78%</span>
              <span className="text-sm text-gray-600">overall</span>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium mb-2">Active Goals</h5>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-purple-600">3</span>
              <span className="text-sm text-gray-600">in progress</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}