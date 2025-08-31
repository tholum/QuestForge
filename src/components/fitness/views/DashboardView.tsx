/**
 * Dashboard View Component
 * 
 * Main dashboard interface for fitness module showing workout history,
 * weekly stats, and achievements.
 */
'use client'

import React from 'react'

export interface DashboardViewProps {
  userId?: string
}

export function DashboardView({ userId }: DashboardViewProps) {
  return (
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
  )
}