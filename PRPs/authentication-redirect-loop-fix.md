# PRP: Authentication Redirect Loop Fix

## Problem Statement

Users experience infinite redirect loops during the login process, requiring them to close and reopen browser tabs to access the application after successful authentication. This creates a critical user experience issue that prevents smooth login flow.

## Root Cause Analysis

Based on investigation of the authentication system at `/home/tholum/projects/goalassistant/src/components/providers/AuthProvider.tsx` and `/home/tholum/projects/goalassistant/src/hooks/useAuth.ts`:

### Primary Issues Identified:

1. **Race Condition in AuthProvider**: The `useEffect` in AuthProvider (lines 52-71) triggers redirects based on auth state changes, but the timing of `auth.isInitialized` and `auth.user` updates can create loops

2. **Multiple Redirect Triggers**: 
   - AuthProvider redirects unauthenticated users to `/auth/login`
   - Successful login in useAuth sets user state
   - AuthProvider detects authenticated user on auth page and redirects to `/dashboard`
   - Timing issues can cause this to repeat

3. **State Synchronization Issues**: The `shouldRedirect` state in AuthProvider may not properly synchronize with the actual auth state changes

4. **Missing Auth Page Route**: Investigation shows auth routes exist (`/auth/login`, `/auth/register`, etc.) but the redirect logic may have URL matching issues

## Technical Details from Codebase

### Current Auth Flow:
1. **useAuth hook**: Manages login API call and sets user state (lines 87-120)
2. **AuthProvider**: Watches auth state and handles redirects (lines 52-71)
3. **Login Success**: User state is set, triggering AuthProvider useEffect
4. **Redirect Logic**: If user is authenticated and on auth page, redirect to `/dashboard`

### Problematic Code Pattern:
```tsx
// AuthProvider.tsx lines 52-71
useEffect(() => {
  if (!auth.isInitialized) {
    return
  }

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  
  if (!auth.user && !isPublicRoute) {
    setShouldRedirect(true)
    const redirectUrl = pathname !== '/' ? `?redirect=${encodeURIComponent(pathname)}` : ''
    router.push(`/auth/login${redirectUrl}`)
  } else if (auth.user && isPublicRoute) {
    router.push('/dashboard') // POTENTIAL LOOP HERE
  } else {
    setShouldRedirect(false)
  }
}, [auth.user, auth.isInitialized, pathname, router])
```

## Implementation Strategy

### Phase 1: Stabilize Redirect Logic
Implement redirect throttling and better state management to prevent loops.

### Phase 2: Improve State Synchronization  
Ensure auth state and redirect state are properly synchronized.

### Phase 3: Add Recovery Mechanisms
Implement fallback logic and error boundaries for auth failures.

## Technical Implementation Plan

### 1. Fix AuthProvider Redirect Logic

#### A. Add Redirect Throttling
Prevent rapid consecutive redirects by implementing a cooldown period:

```tsx
// Add to AuthProvider state
const [lastRedirect, setLastRedirect] = useState<number>(0)
const REDIRECT_COOLDOWN = 1000 // 1 second

// Update useEffect
useEffect(() => {
  if (!auth.isInitialized) {
    return
  }

  const now = Date.now()
  if (now - lastRedirect < REDIRECT_COOLDOWN) {
    return // Prevent rapid redirects
  }

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  
  if (!auth.user && !isPublicRoute) {
    setLastRedirect(now)
    setShouldRedirect(true)
    const redirectUrl = pathname !== '/' ? `?redirect=${encodeURIComponent(pathname)}` : ''
    router.push(`/auth/login${redirectUrl}`)
  } else if (auth.user && isPublicRoute) {
    // Check if we're in the middle of login process
    if (pathname === '/auth/login' && !auth.isLoading) {
      setLastRedirect(now)
      router.push('/dashboard')
    }
  } else {
    setShouldRedirect(false)
  }
}, [auth.user, auth.isInitialized, pathname, router, lastRedirect])
```

#### B. Implement Redirect Intent Tracking
Track the source of redirects to prevent loops:

```tsx
const [redirectIntent, setRedirectIntent] = useState<{
  from: string
  to: string
  timestamp: number
} | null>(null)

// Before redirecting, check if this creates a loop
const wouldCreateLoop = (from: string, to: string) => {
  return redirectIntent && 
         redirectIntent.to === from && 
         redirectIntent.from === to &&
         Date.now() - redirectIntent.timestamp < 5000
}
```

### 2. Improve useAuth Hook Stability

#### A. Add Login Success Callback
Modify login function to handle post-login navigation:

```tsx
// Update login function in useAuth.ts
const login = useCallback(async (data: LoginData, redirectTo?: string) => {
  setIsLoading(true)
  
  try {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(data)
    })

    const result = await response.json()

    if (result.success) {
      setUser(result.data.user)
      
      // Handle redirect after successful login
      if (redirectTo && redirectTo !== '/auth/login') {
        window.location.href = redirectTo // Use location.href to avoid router conflicts
      }
      
      return { success: true }
    } else {
      return { 
        success: false, 
        error: result.error || 'Login failed' 
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: 'Network error occurred' 
    }
  } finally {
    setIsLoading(false)
  }
}, [])
```

### 3. Create Auth Route Recovery

#### A. Add Auth Boundary Component
Create error boundary specifically for auth issues:

```tsx
// src/components/providers/AuthBoundary.tsx
'use client'

import React from 'react'

class AuthBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, redirectLoop: false }
  }

  static getDerivedStateFromError(error) {
    if (error.message.includes('redirect') || error.message.includes('navigation')) {
      return { hasError: true, redirectLoop: true }
    }
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Auth Boundary Error:', error, errorInfo)
  }

  render() {
    if (this.state.redirectLoop) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Authentication Issue</h2>
            <p>Please refresh the page and try again</p>
            <button 
              onClick={() => window.location.href = '/auth/login'}
              className="bg-primary text-primary-foreground px-4 py-2 rounded"
            >
              Go to Login
            </button>
          </div>
        </div>
      )
    }

    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="bg-primary text-primary-foreground px-4 py-2 rounded"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default AuthBoundary
```

### 4. Update Login Form Component

Modify login form to handle redirects properly:

```tsx
// In login form component
const handleLogin = async (data: LoginData) => {
  const urlParams = new URLSearchParams(window.location.search)
  const redirectTo = urlParams.get('redirect') || '/dashboard'
  
  const result = await login(data, redirectTo)
  
  if (result.success) {
    // Let the login function handle redirect
    // Don't trigger additional navigation here
  } else {
    setError(result.error)
  }
}
```

## Files to Create/Modify

### Modified Files:
1. `/src/components/providers/AuthProvider.tsx` - Add redirect throttling and loop prevention
2. `/src/hooks/useAuth.ts` - Improve login function with redirect handling
3. `/src/app/layout.tsx` - Add AuthBoundary wrapper

### New Files:
1. `/src/components/providers/AuthBoundary.tsx` - Error boundary for auth issues
2. `/src/lib/auth/redirect-manager.ts` - Centralized redirect logic

## Testing Requirements

### Unit Tests:
```bash
# Test auth provider logic
npm run test src/components/providers/AuthProvider.test.tsx

# Test useAuth hook
npm run test src/hooks/useAuth.test.ts

# Test redirect management
npm run test src/lib/auth/redirect-manager.test.ts
```

### Integration Tests:
```bash
# Test login flow
npm run test:api auth-flow

# Test redirect scenarios
npm run test:e2e auth-redirects
```

### Manual Testing Checklist:
- [ ] Login from `/auth/login` redirects to `/dashboard` without loops
- [ ] Login with redirect parameter works: `/auth/login?redirect=/modules/fitness`
- [ ] Accessing protected route redirects to login with return URL
- [ ] Browser back button works correctly during auth flows
- [ ] Multiple rapid login attempts don't cause issues
- [ ] Session expiry redirects work properly
- [ ] Hard refresh during auth flow doesn't break state

## Validation Gates

### Pre-Implementation:
```bash
# Test current auth flow
npm run test src/hooks/useAuth.test.ts
npm run test src/components/providers/

# Check for existing redirect issues
npm run test:e2e auth-basic-flow
```

### Post-Implementation:
```bash
# Syntax/Style Check
npm run lint

# Type Check  
npx tsc --noEmit

# Unit Tests
npm run test src/components/providers/ src/hooks/useAuth.ts --verbose

# Integration Tests
npm run test:e2e auth-flows --verbose

# Build Test
npm run build

# Performance Check (ensure no memory leaks from redirect loops)
npm run test:performance auth-provider
```

## Success Criteria

1. **No Redirect Loops**: Login flow completes without infinite redirects
2. **Proper Navigation**: Users land on intended pages after authentication
3. **Session Persistence**: Refresh doesn't break auth state
4. **Error Recovery**: Failed auth attempts don't crash the app
5. **UX Smoothness**: Loading states prevent UI flicker during auth

## Risk Assessment

**Low Risk:** 
- Redirect throttling implementation
- Error boundary addition

**Medium Risk:**
- Changing core auth flow logic
- Potential race conditions with router state

**High Risk:**
- Breaking existing working auth flows

**Mitigation:**
- Implement with feature flags for gradual rollout
- Extensive testing of auth flows before deployment
- Keep fallback mechanisms for critical failures
- Monitor auth success rates post-deployment

## External Resources

- **Next.js Navigation**: https://nextjs.org/docs/app/api-reference/functions/redirect
- **React Router Patterns**: https://reactrouter.com/en/main/start/concepts#navigation
- **Auth Best Practices**: https://auth0.com/blog/a-look-at-the-latest-draft-for-oauth-2-security-best-current-practice/

## Implementation Tasks (Ordered)

1. **Add Redirect Throttling** - Prevent rapid consecutive redirects
2. **Implement Redirect Intent Tracking** - Track redirect sources to prevent loops  
3. **Update Login Function** - Add proper redirect handling post-login
4. **Create Auth Boundary** - Error recovery for auth failures
5. **Update Login Form** - Handle redirects correctly in UI
6. **Test Auth Flows** - Comprehensive testing of all auth scenarios
7. **Add Monitoring** - Track auth success rates and redirect patterns
8. **Deploy Gradually** - Roll out with feature flags and monitoring

---

**PRP Confidence Score: 8/10**

This PRP addresses the root cause of redirect loops through throttling, better state management, and error recovery. The implementation preserves existing functionality while fixing the critical UX issue. Some complexity remains around router state timing, hence 8/10 confidence.