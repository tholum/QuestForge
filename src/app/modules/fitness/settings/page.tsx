/**
 * Fitness Settings Page
 * 
 * Settings route for fitness module showing configuration and preferences.
 */
'use client'

import React from 'react'

export default function FitnessSettingsPage() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Fitness Settings</h3>
      <p className="text-gray-600 mb-6">Configure your fitness preferences and settings.</p>
      
      <div className="space-y-8">
        {/* Profile Settings */}
        <div>
          <h4 className="font-medium mb-4 text-gray-900">Profile Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Weight (lbs)
              </label>
              <input
                type="number"
                defaultValue="165"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Weight (lbs)
              </label>
              <input
                type="number"
                defaultValue="155"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height
              </label>
              <input
                type="text"
                defaultValue="5'8&quot;"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Level
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                <option>Sedentary</option>
                <option>Lightly Active</option>
                <option selected>Moderately Active</option>
                <option>Very Active</option>
                <option>Extremely Active</option>
              </select>
            </div>
          </div>
        </div>

        {/* Workout Preferences */}
        <div>
          <h4 className="font-medium mb-4 text-gray-900">Workout Preferences</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Workout Time
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                  <option>Early Morning (5-7 AM)</option>
                  <option selected>Morning (7-9 AM)</option>
                  <option>Midday (11 AM-1 PM)</option>
                  <option>Afternoon (3-5 PM)</option>
                  <option>Evening (6-8 PM)</option>
                  <option>Night (8-10 PM)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Workout Duration (minutes)
                </label>
                <input
                  type="number"
                  defaultValue="45"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Exercise Types
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { name: 'Cardio', checked: true },
                  { name: 'Strength', checked: true },
                  { name: 'Flexibility', checked: false },
                  { name: 'Yoga', checked: true },
                  { name: 'HIIT', checked: false },
                  { name: 'Pilates', checked: false },
                  { name: 'Swimming', checked: true },
                  { name: 'Running', checked: true }
                ].map((type, i) => (
                  <label key={i} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      defaultChecked={type.checked}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{type.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div>
          <h4 className="font-medium mb-4 text-gray-900">Notification Settings</h4>
          <div className="space-y-3">
            {[
              { name: 'Workout Reminders', description: 'Get notified before scheduled workouts', checked: true },
              { name: 'Goal Progress Updates', description: 'Weekly progress notifications', checked: true },
              { name: 'Achievement Unlocked', description: 'Celebrate your fitness milestones', checked: true },
              { name: 'Rest Day Reminders', description: 'Gentle reminders to take rest days', checked: false },
              { name: 'Nutrition Tracking', description: 'Reminders to log your meals', checked: false }
            ].map((setting, i) => (
              <div key={i} className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  defaultChecked={setting.checked}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <label className="text-sm font-medium text-gray-700">{setting.name}</label>
                  <p className="text-sm text-gray-500">{setting.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data & Privacy */}
        <div>
          <h4 className="font-medium mb-4 text-gray-900">Data & Privacy</h4>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                defaultChecked={true}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <label className="text-sm font-medium text-gray-700">Sync with Health Apps</label>
                <p className="text-sm text-gray-500">Allow syncing with Apple Health, Google Fit, etc.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                defaultChecked={false}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <label className="text-sm font-medium text-gray-700">Anonymous Analytics</label>
                <p className="text-sm text-gray-500">Help improve the app by sharing anonymous usage data</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
            Reset to Defaults
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}