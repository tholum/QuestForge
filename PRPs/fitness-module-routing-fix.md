# PRP: Fitness Module Routing Structure Fix

## Problem Statement

Users are encountering 404 and 500 errors when trying to access fitness-related routes, particularly `/modules/fitness/workouts`. The error occurs because:

1. **Missing Route Structure**: The fitness module uses tab-based navigation internally, but users expect direct URL access to specific sections
2. **URL Pattern Mismatch**: Users expect `/modules/fitness/workouts` to be a direct route, but it's only available as a tab within `/modules/fitness`
3. **SEO/UX Issues**: Direct linking to specific fitness sections is not possible

## Root Cause Analysis

Based on codebase investigation:

1. **Current Implementation**: `/home/tholum/projects/goalassistant/src/app/modules/fitness/page.tsx` contains all fitness functionality in tabs
2. **Expected Routes**: Users expect these routes to work:
   - `/modules/fitness/workouts` - Workout planning view
   - `/modules/fitness/exercises` - Exercise library
   - `/modules/fitness/progress` - Progress tracking
   - `/modules/fitness/dashboard` - Dashboard (default)

3. **Architecture Gap**: The tab-based approach works for SPA-style navigation but fails for direct URL access

## Implementation Strategy

### Phase 1: Create Dynamic Route Structure
Restructure fitness module to support both tab navigation and direct routing using Next.js 15 App Router dynamic routes.

### Phase 2: Maintain Backward Compatibility
Ensure existing fitness page continues to work while adding new routes.

### Phase 3: Update Component Loading
Fix any potential HMR/bundling issues with the restructured components.

## Technical Implementation Plan

### 1. Create Dynamic Route Structure

**New File Structure:**
```
src/app/modules/fitness/
├── page.tsx (main dashboard - redirects to dashboard)
├── dashboard/
│   └── page.tsx
├── workouts/
│   └── page.tsx
├── exercises/
│   └── page.tsx
├── progress/
│   └── page.tsx
└── layout.tsx (shared layout with tab navigation)
```

### 2. Implementation Details

#### A. Create Shared Layout (`src/app/modules/fitness/layout.tsx`)
```tsx
'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { MainContent } from '@/components/layout/MainContent'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', path: '/modules/fitness/dashboard' },
  { id: 'exercises', label: 'Exercise Library', path: '/modules/fitness/exercises' },
  { id: 'workouts', label: 'Workouts', path: '/modules/fitness/workouts' },
  { id: 'progress', label: 'Progress', path: '/modules/fitness/progress' }
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
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Fitness Tracker</h2>
        
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
```

#### B. Create Individual Route Pages

**Dashboard Page** (`src/app/modules/fitness/dashboard/page.tsx`)
**Workouts Page** (`src/app/modules/fitness/workouts/page.tsx`) 
**Exercises Page** (`src/app/modules/fitness/exercises/page.tsx`)
**Progress Page** (`src/app/modules/fitness/progress/page.tsx`)

Each page will contain the respective content from the original tab implementation.

#### C. Update Main Fitness Page
Update `/src/app/modules/fitness/page.tsx` to redirect to dashboard:

```tsx
import { redirect } from 'next/navigation'

export default function FitnessPage() {
  redirect('/modules/fitness/dashboard')
}
```

### 3. Component Refactoring Required

Extract tab content from `FitnessModule.tsx` into separate page components:
- Dashboard content → `DashboardView` component
- Exercises content → Use existing `ExerciseLibraryView`
- Workouts content → Use existing `WorkoutPlanningView`
- Progress content → New `ProgressView` component

## Files to Create/Modify

### New Files:
1. `/src/app/modules/fitness/layout.tsx`
2. `/src/app/modules/fitness/dashboard/page.tsx`
3. `/src/app/modules/fitness/workouts/page.tsx`
4. `/src/app/modules/fitness/exercises/page.tsx`
5. `/src/app/modules/fitness/progress/page.tsx`
6. `/src/components/fitness/views/DashboardView.tsx`
7. `/src/components/fitness/views/ProgressView.tsx`

### Modified Files:
1. `/src/app/modules/fitness/page.tsx` - Convert to redirect
2. `/src/modules/fitness/FitnessModule.tsx` - Extract components

## Testing Requirements

### Unit Tests:
```bash
# Test route accessibility
npm run test src/app/modules/fitness/

# Test component rendering
npm run test src/components/fitness/views/
```

### Integration Tests:
```bash
# Test tab navigation
npm run test:api src/app/modules/fitness/

# Test direct URL access
npm run test:e2e fitness-routing
```

### Manual Testing Checklist:
- [ ] `/modules/fitness` redirects to `/modules/fitness/dashboard`
- [ ] `/modules/fitness/workouts` loads workout planning view
- [ ] `/modules/fitness/exercises` loads exercise library
- [ ] `/modules/fitness/progress` loads progress tracking
- [ ] Tab navigation works between sections
- [ ] Browser back/forward buttons work correctly
- [ ] Direct URL linking works for all sections
- [ ] Mobile navigation remains functional

## Validation Gates

### Pre-Implementation:
```bash
# Verify current structure
find src/app/modules/fitness -name "*.tsx" | head -10
ls -la src/app/modules/fitness/
```

### Post-Implementation:
```bash
# Syntax/Style Check
npm run lint

# Type Check
npx tsc --noEmit

# Unit Tests
npm run test src/app/modules/fitness/ --verbose

# Build Test
npm run build

# E2E Route Testing
npm run test:e2e fitness-routes
```

## Success Criteria

1. **Route Accessibility**: All fitness routes respond with 200 status
2. **Navigation Continuity**: Tab and direct URL navigation both work
3. **Component Loading**: No HMR/bundling errors in development
4. **SEO Optimization**: Each route has proper metadata and is crawlable
5. **User Experience**: Seamless navigation with proper active states

## Risk Assessment

**Low Risk:** 
- Component extraction (existing components work)
- Route structure (Next.js 15 App Router is stable)

**Medium Risk:**
- Navigation state management during route changes
- Potential conflicts with existing module system

**Mitigation:**
- Implement incrementally with feature flags
- Keep original page as fallback during testing
- Comprehensive integration testing

## External Resources

- **Next.js 15 App Router**: https://nextjs.org/docs/app/building-your-application/routing
- **Dynamic Routes**: https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes
- **Layout Patterns**: https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates

## Implementation Tasks (Ordered)

1. **Create Layout Structure** - Set up shared layout with navigation
2. **Extract Component Views** - Move tab content to reusable view components  
3. **Create Individual Pages** - Implement each route page
4. **Update Main Page** - Convert to redirect
5. **Test Route Access** - Verify all routes work correctly
6. **Update Navigation** - Ensure tab navigation uses proper links
7. **Test Integration** - Comprehensive testing of routing and navigation
8. **Deploy and Monitor** - Deploy changes and monitor for issues

---

**PRP Confidence Score: 9/10**

This PRP provides comprehensive context for implementing proper routing structure for the fitness module. The solution addresses the root cause (missing direct routes) while maintaining existing functionality and follows established Next.js patterns.