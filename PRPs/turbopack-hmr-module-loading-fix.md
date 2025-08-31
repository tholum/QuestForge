# PRP: Turbopack HMR Module Loading Fix

## Problem Statement

The application experiences critical HMR (Hot Module Replacement) errors with Turbopack in Next.js 15 development environment:

```
runtime-base.ts:131 Uncaught Error: Module 68027 was instantiated because it was required from module [project]/node_modules/next/dist/compiled/react-server-dom-turbopack/cjs/react-server-dom-turbopack-client.browser.development.js [app-client] (ecmascript), but the module factory is not available. It might have been deleted in an HMR update.
```

This error prevents proper development experience and causes fitness module components to fail loading during development.

## Root Cause Analysis

### Known Issue Investigation
Based on web search findings, this is a **known issue with Next.js 15 and Turbopack** affecting multiple projects:

1. **GitHub Issues Identified:**
   - Issue #74167: Next15 + Turbo dev module factory error
   - Issue #70424: NextJs+Turbo+ClerkJs+sentry+HMR error  
   - Issue #64494: TurboPack unable to compile specific packages
   - Issue #68077: Turbopack module factory issues with dynamic imports

2. **Common Scenarios:**
   - Projects using third-party libraries (Clerk.js, Sentry, PostHog, Sanity)
   - Components with dynamic imports
   - Complex component trees with conditional rendering
   - HMR updates causing module factories to be deleted

### Local Codebase Analysis

#### Problematic Components Found:
1. **Fitness Module Structure**: `/src/modules/fitness/FitnessModule.tsx` exports complex nested components
2. **Dynamic Component Loading**: Exercise library and workout planner components with conditional imports
3. **Client-Side Hydration**: Multiple 'use client' components with complex dependencies

#### Specific Issues in Our Codebase:
1. **Complex Import Chain**: 
   ```tsx
   // FitnessModule.tsx imports
   import { ExerciseLibraryView } from '../../components/fitness/ExerciseLibrary'
   import { WorkoutPlanningView } from '../../components/fitness/WorkoutPlanner/WorkoutPlanningView'
   ```

2. **Conditional Component Rendering**: Tab-based conditional rendering causing module instantiation issues
3. **Mixed Export Patterns**: Both default exports and named exports in component hierarchy

## Implementation Strategy

### Phase 1: Immediate Workarounds
Implement known workarounds while the upstream issue is resolved.

### Phase 2: Code Structure Improvements
Refactor component loading patterns to be more HMR-friendly.

### Phase 3: Development Environment Optimization
Configure development environment for better Turbopack compatibility.

## Technical Implementation Plan

### 1. Immediate Workarounds

#### A. Webpack Fallback Configuration
Add webpack fallback for development when Turbopack fails:

**File: `next.config.js`**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Current config...
  
  // Add experimental flag control
  experimental: {
    // Allow disabling turbopack via env var
    turbo: process.env.DISABLE_TURBOPACK === 'true' ? false : {
      // Turbopack configuration
      rules: {
        // Handle dynamic imports better
        '*.{js,jsx,ts,tsx}': {
          loaders: ['swc-loader'],
          as: '*.js',
        },
      },
      resolveAlias: {
        // Add explicit aliases for problematic imports
        '@/components/fitness': './src/components/fitness',
        '@/hooks': './src/hooks',
        '@/lib/fitness': './src/lib/fitness',
      }
    }
  },

  // Webpack fallback configuration
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Better handling of dynamic imports in development
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            fitness: {
              test: /[\\/]components[\\/]fitness[\\/]/,
              name: 'fitness-components',
              chunks: 'all',
              priority: 10,
            }
          }
        }
      }
    }
    
    return config
  },

  // Add fallback development command
  env: {
    DISABLE_TURBOPACK: process.env.DISABLE_TURBOPACK || 'false',
  }
}

module.exports = nextConfig
```

#### B. Package.json Script Updates
**File: `package.json`**
```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "dev:webpack": "DISABLE_TURBOPACK=true next dev",
    "dev:safe": "npm run dev:webpack",
  }
}
```

### 2. Component Structure Improvements

#### A. Simplify Fitness Module Imports
**File: `/src/modules/fitness/FitnessModule.tsx`**

Replace complex conditional imports with lazy loading:
```tsx
'use client'

import React, { lazy, Suspense } from 'react'
import { IModule } from '../../types/module'

// Use lazy loading for heavy components to avoid HMR issues
const ExerciseLibraryView = lazy(() => 
  import('../../components/fitness/ExerciseLibrary').then(mod => ({
    default: mod.ExerciseLibraryView
  }))
)

const WorkoutPlanningView = lazy(() => 
  import('../../components/fitness/WorkoutPlanner/WorkoutPlanningView').then(mod => ({
    default: mod.WorkoutPlanningView
  }))
)

// Component wrapper with error boundary for HMR issues
const ComponentWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  }>
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  </Suspense>
)

// Error boundary specifically for HMR issues
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Fitness Module HMR Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-800 font-medium">Module Loading Error</h3>
          <p className="text-red-600 text-sm">
            Development error - try refreshing (Ctrl+Shift+R)
          </p>
          <button 
            className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Retry
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Improved tab content with better error handling
const FitnessDesktopDetail = ({ moduleId, userId, config }: any) => {
  const [activeTab, setActiveTab] = React.useState('dashboard')

  return (
    <div className="p-6">
      {/* Tab navigation... */}
      
      {activeTab === 'exercises' && (
        <ComponentWrapper>
          <ExerciseLibraryView 
            showHeader={false}
            onExerciseSelect={(exercise) => {
              console.log('Selected exercise:', exercise)
            }}
          />
        </ComponentWrapper>
      )}

      {activeTab === 'workouts' && (
        <ComponentWrapper>
          <WorkoutPlanningView 
            userId={userId}
            onWorkoutComplete={(workout) => {
              console.log('Workout completed:', workout)
            }}
          />
        </ComponentWrapper>
      )}
    </div>
  )
}
```

#### B. Improve Component Index Files
**File: `/src/components/fitness/ExerciseLibrary/index.ts`**
```typescript
// Use dynamic exports to avoid module factory issues
export const ExerciseLibraryView = React.lazy(() => import('./ExerciseLibraryView'))
export const ExerciseCard = React.lazy(() => import('./ExerciseCard'))
export const ExerciseSearch = React.lazy(() => import('./ExerciseSearch'))
export const ExerciseForm = React.lazy(() => import('./ExerciseForm'))
export const ExerciseGrid = React.lazy(() => import('./ExerciseGrid'))
export const CustomExerciseManager = React.lazy(() => import('./CustomExerciseManager'))
```

### 3. Development Environment Configuration

#### A. TypeScript Configuration Update
**File: `tsconfig.json`**
```json
{
  "compilerOptions": {
    // Existing config...
    
    // Better module resolution for HMR
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "noEmit": true,
    
    // Improve incremental builds
    "incremental": true,
    "tsBuildInfoFile": "./.tsbuildinfo",
    
    // Better tree shaking
    "sideEffects": false
  },
  
  // Exclude build artifacts
  "exclude": [
    "node_modules",
    ".next",
    ".tsbuildinfo"
  ]
}
```

#### B. Development Scripts Enhancement
Create development utility scripts:

**File: `scripts/dev-safe.js`**
```javascript
#!/usr/bin/env node

const { spawn } = require('child_process')

console.log('🚀 Starting development server with HMR safety...')

// Try turbopack first
const turbopack = spawn('npm', ['run', 'dev'], { 
  stdio: 'inherit',
  env: { ...process.env }
})

turbopack.on('error', (error) => {
  console.error('❌ Turbopack failed:', error.message)
  console.log('🔄 Falling back to webpack...')
  
  // Fallback to webpack
  const webpack = spawn('npm', ['run', 'dev:webpack'], {
    stdio: 'inherit',
    env: { ...process.env, DISABLE_TURBOPACK: 'true' }
  })
  
  webpack.on('error', (error) => {
    console.error('❌ Webpack also failed:', error.message)
    process.exit(1)
  })
})
```

### 4. Runtime Error Recovery

#### A. HMR Error Handler
**File: `src/lib/dev/hmr-recovery.ts`**
```typescript
'use client'

/**
 * HMR Error Recovery Utilities
 * Handles Turbopack HMR module loading issues in development
 */

export class HMRRecovery {
  private static instance: HMRRecovery
  private errorCount = 0
  private maxErrors = 3
  
  static getInstance() {
    if (!HMRRecovery.instance) {
      HMRRecovery.instance = new HMRRecovery()
    }
    return HMRRecovery.instance
  }
  
  setupErrorHandler() {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
      return
    }
    
    window.addEventListener('error', (event) => {
      if (this.isHMRModuleError(event.error)) {
        this.handleHMRError(event.error)
        event.preventDefault()
      }
    })
    
    window.addEventListener('unhandledrejection', (event) => {
      if (this.isHMRModuleError(event.reason)) {
        this.handleHMRError(event.reason)
        event.preventDefault()
      }
    })
  }
  
  private isHMRModuleError(error: any): boolean {
    return error?.message?.includes('module factory is not available') ||
           error?.message?.includes('deleted in an HMR update')
  }
  
  private handleHMRError(error: any) {
    this.errorCount++
    console.warn(`🔥 HMR Module Error (${this.errorCount}/${this.maxErrors}):`, error.message)
    
    if (this.errorCount >= this.maxErrors) {
      console.warn('🔄 Too many HMR errors, suggesting hard refresh...')
      this.showRecoveryModal()
    } else {
      // Try to recover silently
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }
  
  private showRecoveryModal() {
    const modal = document.createElement('div')
    modal.innerHTML = `
      <div style="
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); z-index: 9999;
        display: flex; align-items: center; justify-content: center;
      ">
        <div style="
          background: white; padding: 2rem; border-radius: 8px;
          max-width: 400px; text-align: center;
        ">
          <h3 style="margin: 0 0 1rem;">Development Error</h3>
          <p style="margin: 0 0 1rem;">
            HMR module loading issues detected. This is a known issue with Turbopack.
          </p>
          <button onclick="window.location.reload(true)" style="
            background: #007bff; color: white; border: none;
            padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;
          ">Hard Refresh (Ctrl+Shift+R)</button>
        </div>
      </div>
    `
    document.body.appendChild(modal)
  }
}

// Auto-initialize in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  HMRRecovery.getInstance().setupErrorHandler()
}
```

## Files to Create/Modify

### Modified Files:
1. `next.config.js` - Add Turbopack configuration and webpack fallback
2. `package.json` - Add development script alternatives  
3. `tsconfig.json` - Improve module resolution
4. `/src/modules/fitness/FitnessModule.tsx` - Implement lazy loading and error boundaries
5. `/src/components/fitness/ExerciseLibrary/index.ts` - Use dynamic exports

### New Files:
1. `scripts/dev-safe.js` - Safe development server startup
2. `/src/lib/dev/hmr-recovery.ts` - HMR error recovery utilities

## Testing Requirements

### Development Environment Tests:
```bash
# Test Turbopack mode
npm run dev

# Test webpack fallback  
npm run dev:webpack

# Test safe development mode
npm run dev:safe

# Test component lazy loading
npm run test src/modules/fitness/
```

### Manual Testing Checklist:
- [ ] Development server starts without HMR errors
- [ ] Fitness components load correctly in both Turbopack and webpack modes
- [ ] Hot reload works for component changes
- [ ] Error recovery modal appears on repeated HMR failures
- [ ] Build process remains unaffected
- [ ] Production build works correctly

## Validation Gates

### Pre-Implementation:
```bash
# Document current HMR errors
npm run dev 2>&1 | grep -i "module factory" || echo "No current errors"

# Test component loading
npm run test src/components/fitness/
```

### Post-Implementation:
```bash
# Test development modes
npm run dev:webpack &
sleep 10 && curl -f http://localhost:3000 && killall node

npm run dev &  
sleep 10 && curl -f http://localhost:3000 && killall node

# Test builds
npm run build

# Component tests  
npm run test src/modules/fitness/ --verbose
```

## Success Criteria

1. **HMR Stability**: No module factory errors during development
2. **Component Loading**: All fitness components load reliably
3. **Development Experience**: Smooth hot reload without crashes
4. **Fallback Mechanism**: Automatic fallback to webpack when Turbopack fails
5. **Error Recovery**: Graceful handling of HMR issues when they occur

## Risk Assessment

**Low Risk:** 
- Adding webpack fallback configuration
- Implementing error boundaries
- Development script enhancements

**Medium Risk:**
- Changing component import patterns
- Lazy loading implementation
- TypeScript configuration changes

**High Risk:**
- None - these are development-only changes

**Mitigation:**
- Changes are development-focused and don't affect production
- Keep existing components as fallback
- Comprehensive testing of both development modes

## External Resources

- **Next.js 15 Turbopack Issues**: https://github.com/vercel/next.js/issues?q=turbopack+module+factory
- **Turbopack Documentation**: https://turbo.build/pack/docs  
- **Next.js HMR Guide**: https://nextjs.org/docs/architecture/fast-refresh
- **React Lazy Loading**: https://react.dev/reference/react/lazy

## Implementation Tasks (Ordered)

1. **Add Development Scripts** - Create webpack fallback and safe mode scripts
2. **Configure Next.js** - Add Turbopack configuration and webpack fallback  
3. **Implement Error Recovery** - Add HMR error handler and recovery utilities
4. **Refactor Component Loading** - Implement lazy loading and error boundaries
5. **Update TypeScript Config** - Improve module resolution settings
6. **Test Development Modes** - Verify both Turbopack and webpack work correctly
7. **Document Workarounds** - Update development documentation with HMR fixes
8. **Monitor Upstream Fix** - Track Next.js/Turbopack issue resolution

---

**PRP Confidence Score: 7/10**

This PRP addresses a known upstream issue with practical workarounds and structural improvements. While the core issue requires upstream fixes, the implemented solutions should provide stable development experience. Confidence is 7/10 due to the external dependency on Turbopack improvements.