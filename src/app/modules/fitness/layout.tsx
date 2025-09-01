/**
 * Fitness Module Layout
 * 
 * Shared layout for fitness module with tab navigation supporting both
 * client-side navigation and direct URL access.
 */
'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { MainContent } from '@/components/layout/MainContent'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', path: '/modules/fitness/dashboard' },
  { id: 'exercises', label: 'Exercise Library', path: '/modules/fitness/exercises' },
  { id: 'workouts', label: 'Workouts', path: '/modules/fitness/workouts' },
  { id: 'progress', label: 'Progress', path: '/modules/fitness/progress' },
  { id: 'nutrition', label: 'Nutrition', path: '/modules/fitness/nutrition' }
]

export default function FitnessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  const currentTab = TABS.find(tab => pathname.startsWith(tab.path))?.id || 'dashboard'

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
            <Link
              key={tab.id}
              href={tab.path}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Tab Content */}
        {children}
      </div>
    </MainContent>
  )
}