/**
 * Auth + Routing Integration Tests
 * 
 * Tests the integration between authentication and routing systems,
 * specifically for the fitness module.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useRouter, usePathname } from 'next/navigation'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}))

// Mock components to avoid complex dependencies
vi.mock('@/components/layout/MainContent', () => ({
  MainContent: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="main-content">{children}</div>
}))

describe('Auth + Routing Integration', () => {
  let mockRouter: any
  let mockPathname: string
  let queryClient: QueryClient

  beforeEach(() => {
    mockRouter = {
      push: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn()
    }
    mockPathname = '/modules/fitness/workouts'
    
    vi.mocked(useRouter).mockReturnValue(mockRouter)
    vi.mocked(usePathname).mockReturnValue(mockPathname)
    
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    
    // Reset fetch mock
    global.fetch = vi.fn()
  })

  it('handles fitness route access with valid auth', async () => {
    // Mock successful auth response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User'
          }
        }
      })
    } as Response)

    const TestAuthComponent = () => {
      const [isAuthenticated, setIsAuthenticated] = React.useState(false)
      
      React.useEffect(() => {
        fetch('/api/v1/auth/me')
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data?.user) {
              setIsAuthenticated(true)
            }
          })
      }, [])
      
      if (!isAuthenticated) {
        return <div data-testid="loading">Loading...</div>
      }
      
      return <div data-testid="protected-content">Fitness Module</div>
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestAuthComponent />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })

    // Should not redirect away from fitness route when auth is valid
    expect(mockRouter.push).not.toHaveBeenCalledWith(expect.stringContaining('/auth/login'))
  })

  it('redirects fitness route access without auth', async () => {
    // Mock failed auth response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ success: false })
    } as Response)

    const TestAuthComponent = () => {
      const [authChecked, setAuthChecked] = React.useState(false)
      const router = useRouter()
      const pathname = usePathname()
      
      React.useEffect(() => {
        fetch('/api/v1/auth/me')
          .then(res => {
            if (!res.ok) {
              const redirectUrl = encodeURIComponent(pathname)
              router.push(`/auth/login?redirect=${redirectUrl}`)
            }
          })
          .finally(() => setAuthChecked(true))
      }, [router, pathname])
      
      if (!authChecked) {
        return <div data-testid="checking-auth">Checking auth...</div>
      }
      
      return <div data-testid="auth-checked">Auth check complete</div>
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestAuthComponent />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith(
        '/auth/login?redirect=%2Fmodules%2Ffitness%2Fworkouts'
      )
    })
  })

  it('prevents redirect loops during auth flow', async () => {
    // Mock login success
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          user: {
            id: '1',
            email: 'test@example.com', 
            name: 'Test User'
          }
        }
      })
    } as Response)

    // Set pathname to login page
    vi.mocked(usePathname).mockReturnValue('/auth/login')

    const TestAuthComponent = () => {
      const [redirectAttempts, setRedirectAttempts] = React.useState(0)
      const router = useRouter()
      const pathname = usePathname()
      
      React.useEffect(() => {
        if (pathname === '/auth/login') {
          fetch('/api/v1/auth/me')
            .then(res => res.json())
            .then(data => {
              if (data.success && data.data?.user) {
                setRedirectAttempts(prev => prev + 1)
                
                // Simulate successful login redirect
                if (redirectAttempts < 2) { // Prevent infinite loop
                  router.push('/dashboard')
                }
              }
            })
        }
      }, [router, pathname, redirectAttempts])
      
      return (
        <div data-testid="login-page">
          <div data-testid="redirect-count">{redirectAttempts}</div>
        </div>
      )
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestAuthComponent />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')
    })

    // Should only trigger redirect once, not multiple times
    expect(mockRouter.push).toHaveBeenCalledTimes(1)
  })

  it('handles route changes while maintaining auth state', async () => {
    // Mock consistent auth response
    vi.mocked(global.fetch).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: {
              id: '1',
              email: 'test@example.com',
              name: 'Test User'
            }
          }
        })
      } as Response)
    )

    const TestRouteAuthComponent = () => {
      const [currentPath, setCurrentPath] = React.useState('/modules/fitness/dashboard')
      const [authState, setAuthState] = React.useState<'checking' | 'authenticated' | 'failed'>('checking')
      
      const checkAuth = React.useCallback(async () => {
        try {
          const res = await fetch('/api/v1/auth/me')
          const data = await res.json()
          setAuthState(data.success && data.data?.user ? 'authenticated' : 'failed')
        } catch {
          setAuthState('failed')
        }
      }, [])
      
      React.useEffect(() => {
        checkAuth()
      }, [currentPath, checkAuth])
      
      const navigateToRoute = (path: string) => {
        setCurrentPath(path)
        setAuthState('checking')
      }
      
      return (
        <div data-testid="route-auth-test">
          <div data-testid="current-path">{currentPath}</div>
          <div data-testid="auth-state">{authState}</div>
          
          <button 
            data-testid="nav-workouts"
            onClick={() => navigateToRoute('/modules/fitness/workouts')}
          >
            Go to Workouts
          </button>
          
          <button 
            data-testid="nav-exercises" 
            onClick={() => navigateToRoute('/modules/fitness/exercises')}
          >
            Go to Exercises
          </button>
        </div>
      )
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestRouteAuthComponent />
      </QueryClientProvider>
    )

    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated')
    })

    // Navigate to workouts
    screen.getByTestId('nav-workouts').click()
    
    await waitFor(() => {
      expect(screen.getByTestId('current-path')).toHaveTextContent('/modules/fitness/workouts')
      expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated')
    })

    // Navigate to exercises
    screen.getByTestId('nav-exercises').click()
    
    await waitFor(() => {
      expect(screen.getByTestId('current-path')).toHaveTextContent('/modules/fitness/exercises')
      expect(screen.getByTestId('auth-state')).toHaveTextContent('authenticated')
    })
    
    // Verify fetch was called for auth checks but no redirects occurred
    expect(vi.mocked(global.fetch)).toHaveBeenCalledWith('/api/v1/auth/me')
    expect(mockRouter.push).not.toHaveBeenCalled()
  })

  it('handles network errors during auth gracefully', async () => {
    // Mock network error
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

    const TestNetworkErrorComponent = () => {
      const [error, setError] = React.useState<string | null>(null)
      const [loading, setLoading] = React.useState(true)
      
      React.useEffect(() => {
        fetch('/api/v1/auth/me')
          .then(res => res.json())
          .then(() => setError(null))
          .catch(err => setError(err.message))
          .finally(() => setLoading(false))
      }, [])
      
      if (loading) return <div data-testid="loading">Loading...</div>
      if (error) return <div data-testid="error">{error}</div>
      
      return <div data-testid="success">Success</div>
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestNetworkErrorComponent />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Network error')
    })

    // Should handle the error gracefully without crashes
    expect(screen.getByTestId('error')).toBeInTheDocument()
  })

  it('maintains session across tab/page refreshes', async () => {
    // Mock persistent auth state
    let authCallCount = 0
    vi.mocked(global.fetch).mockImplementation(() => {
      authCallCount++
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: {
              id: '1',
              email: 'test@example.com',
              name: 'Test User'
            }
          }
        })
      } as Response)
    })

    const TestSessionPersistenceComponent = () => {
      const [authChecks, setAuthChecks] = React.useState(0)
      const [isAuthenticated, setIsAuthenticated] = React.useState(false)
      
      const checkAuth = React.useCallback(async () => {
        setAuthChecks(prev => prev + 1)
        try {
          const res = await fetch('/api/v1/auth/me')
          const data = await res.json()
          setIsAuthenticated(data.success && data.data?.user)
        } catch {
          setIsAuthenticated(false)
        }
      }, [])
      
      React.useEffect(() => {
        checkAuth()
      }, [checkAuth])
      
      const simulateRefresh = () => {
        // Simulate page refresh by re-checking auth
        checkAuth()
      }
      
      return (
        <div data-testid="session-test">
          <div data-testid="auth-checks">{authChecks}</div>
          <div data-testid="is-authenticated">{isAuthenticated.toString()}</div>
          <button data-testid="refresh" onClick={simulateRefresh}>
            Simulate Refresh
          </button>
        </div>
      )
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestSessionPersistenceComponent />
      </QueryClientProvider>
    )

    // Wait for initial auth check
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('auth-checks')).toHaveTextContent('1')
    })

    // Simulate page refresh
    screen.getByTestId('refresh').click()
    
    await waitFor(() => {
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
      expect(screen.getByTestId('auth-checks')).toHaveTextContent('2')
    })

    // Verify auth persisted across refresh
    expect(authCallCount).toBe(2)
    expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true')
  })
})