/**
 * Fitness Module Component Integration Tests
 * 
 * Tests the integration of fitness module components with lazy loading,
 * error boundaries, and component lifecycle.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/modules/fitness/dashboard'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn()
  }))
}))

// Mock the layout component
vi.mock('@/components/layout/MainContent', () => ({
  MainContent: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="main-content">{children}</div>
}))

// Mock heavy components to test lazy loading
vi.mock('@/components/fitness/ExerciseLibrary', () => ({
  ExerciseLibraryView: () => <div data-testid="exercise-library-mock">Exercise Library Loaded</div>
}))

vi.mock('@/components/fitness/WorkoutPlanner/WorkoutPlanningView', () => ({
  WorkoutPlanningView: () => <div data-testid="workout-planning-mock">Workout Planning Loaded</div>
}))

// Mock HMR recovery utilities
vi.mock('@/lib/dev/hmr-recovery', () => ({
  useHMRErrorBoundary: () => ({ hasError: false, retry: vi.fn() })
}))

// Import the actual fitness module
import { FitnessModule } from '@/modules/fitness/FitnessModule'

describe('Fitness Module Component Integration', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  it('loads all fitness module components without errors', async () => {
    const { Dashboard, DesktopDetail, MobileQuickAdd, Settings } = FitnessModule.components

    // Test Dashboard component
    const { unmount: unmountDashboard } = render(
      <Dashboard moduleId="fitness" userId="test-user" config={{}} />
    )
    
    expect(screen.getByText(/fitness dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/track your workouts/i)).toBeInTheDocument()
    unmountDashboard()

    // Test Desktop Detail component
    const { unmount: unmountDetail } = render(
      <DesktopDetail moduleId="fitness" userId="test-user" config={{}} />
    )
    
    await waitFor(() => {
      expect(screen.getByTestId('module-content')).toBeInTheDocument()
      expect(screen.getByTestId('module-title')).toHaveTextContent('Fitness Tracker')
    })
    unmountDetail()

    // Test Mobile Quick Add
    const mockSuccess = vi.fn()
    const mockCancel = vi.fn()
    const { unmount: unmountMobile } = render(
      <MobileQuickAdd 
        moduleId="fitness" 
        userId="test-user" 
        onSuccess={mockSuccess}
        onCancel={mockCancel}
      />
    )
    
    expect(screen.getByText(/quick add workout/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log workout/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    unmountMobile()

    // Test Settings component
    const mockConfigChange = vi.fn()
    render(
      <Settings 
        moduleId="fitness" 
        config={{ defaultDuration: 30, trackCalories: true }} 
        onConfigChange={mockConfigChange}
      />
    )
    
    expect(screen.getByText(/fitness module settings/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('30')).toBeInTheDocument()
  })

  it('handles tab navigation in desktop detail component', async () => {
    const user = userEvent.setup()
    const { DesktopDetail } = FitnessModule.components

    render(
      <DesktopDetail moduleId="fitness" userId="test-user" config={{}} />
    )

    // Verify initial dashboard tab is active
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    // Click on Exercise Library tab
    const exerciseTab = screen.getByRole('button', { name: 'Exercise Library' })
    await act(async () => {
      await user.click(exerciseTab)
    })

    // Should show lazy-loaded exercise library component
    await waitFor(() => {
      expect(screen.getByTestId('exercise-library-mock')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Click on Workouts tab
    const workoutTab = screen.getByRole('button', { name: 'Workouts' })
    await act(async () => {
      await user.click(workoutTab)
    })

    // Should show lazy-loaded workout planning component
    await waitFor(() => {
      expect(screen.getByTestId('workout-planning-mock')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Click on Progress tab
    const progressTab = screen.getByRole('button', { name: 'Progress' })
    await act(async () => {
      await user.click(progressTab)
    })

    expect(screen.getByText(/progress analytics and personal records coming soon/i)).toBeInTheDocument()

    // Click back to Dashboard tab
    const dashboardTab = screen.getByRole('button', { name: 'Dashboard' })
    await act(async () => {
      await user.click(dashboardTab)
    })

    expect(screen.getByText(/workout history/i)).toBeInTheDocument()
  })

  it('handles mobile quick add interactions', async () => {
    const user = userEvent.setup()
    const mockSuccess = vi.fn()
    const mockCancel = vi.fn()
    
    const { MobileQuickAdd } = FitnessModule.components

    render(
      <MobileQuickAdd 
        moduleId="fitness" 
        userId="test-user" 
        onSuccess={mockSuccess}
        onCancel={mockCancel}
      />
    )

    // Interact with form elements
    const exerciseSelect = screen.getByRole('combobox')
    await act(async () => {
      await user.selectOptions(exerciseSelect, 'strength')
    })

    const durationInput = screen.getByPlaceholderText('30')
    await act(async () => {
      await user.clear(durationInput)
      await user.type(durationInput, '45')
    })

    // Test success callback
    const logButton = screen.getByRole('button', { name: /log workout/i })
    await act(async () => {
      await user.click(logButton)
    })

    expect(mockSuccess).toHaveBeenCalledTimes(1)

    // Test cancel callback
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await act(async () => {
      await user.click(cancelButton)
    })

    expect(mockCancel).toHaveBeenCalledTimes(1)
  })

  it('handles settings configuration changes', async () => {
    const user = userEvent.setup()
    const mockConfigChange = vi.fn()
    
    const { Settings } = FitnessModule.components

    render(
      <Settings 
        moduleId="fitness" 
        config={{ defaultDuration: 30, trackCalories: false, enableReminders: true }} 
        onConfigChange={mockConfigChange}
      />
    )

    // Change default duration
    const durationInput = screen.getByDisplayValue('30')
    await act(async () => {
      await user.clear(durationInput)
      await user.type(durationInput, '45')
    })

    expect(mockConfigChange).toHaveBeenCalledWith({
      defaultDuration: 45,
      trackCalories: false,
      enableReminders: true
    })

    // Toggle calorie tracking
    const calorieCheckbox = screen.getByRole('checkbox', { name: /track calories burned/i })
    await act(async () => {
      await user.click(calorieCheckbox)
    })

    expect(mockConfigChange).toHaveBeenCalledWith({
      defaultDuration: 45,
      trackCalories: true,
      enableReminders: true
    })

    // Toggle reminders
    const reminderCheckbox = screen.getByRole('checkbox', { name: /enable workout reminders/i })
    await act(async () => {
      await user.click(reminderCheckbox)
    })

    expect(mockConfigChange).toHaveBeenCalledWith({
      defaultDuration: 45,
      trackCalories: true,
      enableReminders: false
    })
  })

  it('handles component lazy loading errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Mock component loading failure
    vi.doMock('@/components/fitness/ExerciseLibrary', () => {
      throw new Error('Module loading failed')
    })

    const { DesktopDetail } = FitnessModule.components
    
    const { unmount } = render(
      <DesktopDetail moduleId="fitness" userId="test-user" config={{}} />
    )

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByTestId('module-content')).toBeInTheDocument()
    })

    // Click on Exercise Library tab to trigger lazy loading
    const exerciseTab = screen.getByRole('button', { name: 'Exercise Library' })
    await act(async () => {
      await userEvent.setup().click(exerciseTab)
    })

    // Should show error fallback instead of crashing
    await waitFor(() => {
      expect(
        screen.getByText(/failed to load exercise library/i) ||
        screen.getByText(/component loading failed/i) ||
        screen.getByText(/module loading error/i)
      ).toBeInTheDocument()
    }, { timeout: 3000 })

    consoleSpy.mockRestore()
    unmount()
  })

  it('error boundary provides recovery options', async () => {
    const user = userEvent.setup()
    
    // Mock component that throws an error
    const ThrowingComponent = () => {
      throw new Error('Test error for error boundary')
    }

    // Create a test wrapper that includes the error boundary logic
    const TestErrorBoundary = () => {
      const [hasError, setHasError] = React.useState(false)
      const [error, setError] = React.useState<Error | null>(null)

      React.useEffect(() => {
        const errorHandler = (event: ErrorEvent) => {
          setHasError(true)
          setError(new Error(event.message))
        }

        window.addEventListener('error', errorHandler)
        return () => window.removeEventListener('error', errorHandler)
      }, [])

      if (hasError) {
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-red-800 font-medium">Module Loading Error</h3>
            <p className="text-red-600 text-sm mt-1">Component failed to load</p>
            <div className="mt-3 space-x-2">
              <button 
                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                onClick={() => { setHasError(false); setError(null) }}
                data-testid="retry-button"
              >
                Retry
              </button>
              <button 
                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                onClick={() => window.location.reload()}
                data-testid="refresh-button"
              >
                Refresh Page
              </button>
            </div>
          </div>
        )
      }

      try {
        return <ThrowingComponent />
      } catch (err) {
        setHasError(true)
        setError(err as Error)
        return null
      }
    }

    render(<TestErrorBoundary />)

    // Wait for error boundary to catch the error
    await waitFor(() => {
      expect(screen.getByText(/module loading error/i)).toBeInTheDocument()
    })

    // Verify error boundary UI elements
    expect(screen.getByText(/component failed to load/i)).toBeInTheDocument()
    expect(screen.getByTestId('retry-button')).toBeInTheDocument()
    expect(screen.getByTestId('refresh-button')).toBeInTheDocument()

    // Test retry functionality
    const retryButton = screen.getByTestId('retry-button')
    await act(async () => {
      await user.click(retryButton)
    })

    // Should attempt to recover (though will error again in this test)
    await waitFor(() => {
      expect(screen.getByText(/module loading error/i)).toBeInTheDocument()
    })
  })

  it('maintains component state during tab switches', async () => {
    const user = userEvent.setup()
    const { DesktopDetail } = FitnessModule.components

    render(
      <DesktopDetail moduleId="fitness" userId="test-user" config={{}} />
    )

    // Start on dashboard
    await waitFor(() => {
      expect(screen.getByText(/workout history/i)).toBeInTheDocument()
    })

    // Switch to exercises tab
    const exerciseTab = screen.getByRole('button', { name: 'Exercise Library' })
    await act(async () => {
      await user.click(exerciseTab)
    })

    await waitFor(() => {
      expect(screen.getByTestId('exercise-library-mock')).toBeInTheDocument()
    })

    // Switch to workouts tab
    const workoutTab = screen.getByRole('button', { name: 'Workouts' })
    await act(async () => {
      await user.click(workoutTab)
    })

    await waitFor(() => {
      expect(screen.getByTestId('workout-planning-mock')).toBeInTheDocument()
    })

    // Switch back to dashboard
    const dashboardTab = screen.getByRole('button', { name: 'Dashboard' })
    await act(async () => {
      await user.click(dashboardTab)
    })

    // Should return to dashboard content
    expect(screen.getByText(/workout history/i)).toBeInTheDocument()
  })

  it('handles concurrent component loading', async () => {
    const user = userEvent.setup()
    const { DesktopDetail } = FitnessModule.components

    const { unmount } = render(
      <DesktopDetail moduleId="fitness" userId="test-user" config={{}} />
    )

    // Rapidly switch between tabs to test concurrent loading
    const exerciseTab = screen.getByRole('button', { name: 'Exercise Library' })
    const workoutTab = screen.getByRole('button', { name: 'Workouts' })

    await act(async () => {
      // Quick succession of tab switches
      await user.click(exerciseTab)
      await user.click(workoutTab)
      await user.click(exerciseTab)
    })

    // Should eventually settle on exercise library
    await waitFor(() => {
      expect(screen.getByTestId('exercise-library-mock')).toBeInTheDocument()
    }, { timeout: 5000 })

    unmount()
  })
})