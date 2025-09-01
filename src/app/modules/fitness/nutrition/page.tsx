/**
 * Fitness Nutrition Page
 * 
 * Nutrition route for fitness module showing nutrition tracking interface.
 */
'use client'

import React from 'react'

export default function FitnessNutritionPage() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Nutrition Tracking</h3>
      <p className="text-gray-600 mb-6">Track your daily nutrition and calorie intake.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-3">Today's Summary</h4>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-blue-800">Calories</span>
                <span className="text-lg font-bold text-blue-900">1,450 / 2,000</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '72.5%' }}></div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-green-600">Carbs</p>
                <p className="font-semibold text-green-800">180g</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg text-center">
                <p className="text-xs text-red-600">Protein</p>
                <p className="font-semibold text-red-800">95g</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg text-center">
                <p className="text-xs text-yellow-600">Fat</p>
                <p className="font-semibold text-yellow-800">45g</p>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-3">Recent Meals</h4>
          <div className="space-y-3">
            {[
              { meal: 'Breakfast', food: 'Oatmeal with berries', calories: 320 },
              { meal: 'Lunch', food: 'Grilled chicken salad', calories: 450 },
              { meal: 'Snack', food: 'Greek yogurt', calories: 150 }
            ].map((entry, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">{entry.meal}</h5>
                    <p className="text-sm text-gray-600">{entry.food}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{entry.calories} cal</span>
                </div>
              </div>
            ))}
          </div>
          
          <button className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
            Add Meal
          </button>
        </div>
      </div>
      
      {/* Additional nutrition features */}
      <div className="mt-8 pt-6 border-t">
        <h4 className="font-medium mb-4">Nutrition Goals</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium mb-2">Daily Calories</h5>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-blue-600">2,000</span>
              <span className="text-sm text-gray-600">target</span>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium mb-2">Protein Goal</h5>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-600">120g</span>
              <span className="text-sm text-gray-600">target</span>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium mb-2">Water Intake</h5>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-cyan-600">6/8</span>
              <span className="text-sm text-gray-600">glasses</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}