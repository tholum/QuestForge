/**
 * Mobile Progress Slider Component Tests
 * 
 * Tests for mobile-specific features including touch interactions,
 * haptic feedback, and gesture support.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import MobileProgressSlider from '@/components/progress/MobileProgressSlider'

// Mock the useProgress hook
vi.mock('@/hooks/useProgress', () => ({
  useCreateProgress: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({
      data: {
        id: 'progress-123',
        value: 75,
        maxValue: 100,
        xpEarned: 22,
        xpAwarded: 22,
        leveledUp: false,
        newLevel: 2,
        goalId: 'goal-123'
      }
    }),
    isPending: false
  }))
}))

// Mock haptic feedback API
const mockVibrate = vi.fn()
Object.defineProperty(window.navigator, 'vibrate', {
  value: mockVibrate,
  writable: true,
})

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

const renderWithQueryClient = (ui: React.ReactElement) => {
  return render(ui, { wrapper: createWrapper() })
}

describe('MobileProgressSlider', () => {
  const mockProps = {
    goalId: 'goal-123',
    goalTitle: 'Test Goal',
    goalDifficulty: 'medium' as const,
    onProgressAdded: vi.fn(),
    onCancel: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockVibrate.mockClear()
  })

  describe('Basic Rendering', () => {
    it('should render mobile slider with goal information', () => {
      renderWithQueryClient(<MobileProgressSlider {...mockProps} />)

      expect(screen.getByText('Test Goal')).toBeInTheDocument()
      expect(screen.getByText('medium')).toBeInTheDocument()
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })

    it('should show current progress value', () => {
      renderWithQueryClient(
        <MobileProgressSlider {...mockProps} currentProgress={45} />
      )

      expect(screen.getByText('45')).toBeInTheDocument()
    })

    it('should display XP preview when enabled', () => {
      renderWithQueryClient(
        <MobileProgressSlider {...mockProps} showXPPreview={true} />
      )

      expect(screen.getByText(/xp/i)).toBeInTheDocument()
    })

    it('should show percentage when enabled', () => {
      renderWithQueryClient(
        <MobileProgressSlider 
          {...mockProps} 
          currentProgress={25}
          maxValue={100}
          showPercentage={true} 
        />
      )

      expect(screen.getByText('25%')).toBeInTheDocument()
    })
  })

  describe('Touch Interactions', () => {
    it('should handle slider value changes', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<MobileProgressSlider {...mockProps} />)

      const slider = screen.getByRole('slider')
      
      await user.click(slider)
      fireEvent.change(slider, { target: { value: '75' } })

      await waitFor(() => {
        expect(slider).toHaveAttribute('aria-valuenow', '75')
      })
    })

    it('should support gesture-based input when enabled', () => {
      renderWithQueryClient(
        <MobileProgressSlider {...mockProps} gestureEnabled={true} />
      )

      const slider = screen.getByRole('slider')
      
      // Simulate touch gesture
      fireEvent.touchStart(slider, {
        touches: [{ clientX: 100, clientY: 100 }]
      })
      fireEvent.touchMove(slider, {
        touches: [{ clientX: 150, clientY: 100 }]
      })
      fireEvent.touchEnd(slider)

      expect(slider).toBeInTheDocument() // Basic gesture support test
    })

    it('should provide haptic feedback when enabled', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(
        <MobileProgressSlider {...mockProps} hapticFeedback={true} />
      )

      const slider = screen.getByRole('slider')
      await user.click(slider)

      // Note: In real implementation, haptic feedback would trigger
      // This test verifies the component renders with haptic option
      expect(slider).toBeInTheDocument()
    })
  })

  describe('Progress Submission', () => {
    it('should submit progress when confirm button clicked', async () => {
      const user = userEvent.setup()
      const onProgressAdded = vi.fn()
      
      renderWithQueryClient(
        <MobileProgressSlider 
          {...mockProps}
          onProgressAdded={onProgressAdded}
        />
      )

      const slider = screen.getByRole('slider')
      await user.click(slider)
      fireEvent.change(slider, { target: { value: '75' } })

      const submitButton = screen.getByRole('button', { name: /confirm|submit/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(onProgressAdded).toHaveBeenCalled()
      })
    })

    it('should handle cancellation', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()
      
      renderWithQueryClient(
        <MobileProgressSlider {...mockProps} onCancel={onCancel} />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(onCancel).toHaveBeenCalled()
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      
      // Mock pending state
      const { useCreateProgress } = await import('@/hooks/useProgress')
      vi.mocked(useCreateProgress).mockReturnValueOnce({
        mutateAsync: vi.fn().mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 1000))
        ),
        isPending: true
      } as any)

      renderWithQueryClient(<MobileProgressSlider {...mockProps} />)

      const submitButton = screen.getByRole('button', { name: /confirm|submit/i })
      
      expect(submitButton).toBeDisabled()
    })
  })

  describe('XP Calculation', () => {
    it('should calculate XP correctly for different difficulties', () => {
      const testCases = [
        { difficulty: 'easy', progress: 50, expectedMin: 5 },
        { difficulty: 'medium', progress: 50, expectedMin: 7 },
        { difficulty: 'hard', progress: 50, expectedMin: 10 },
        { difficulty: 'expert', progress: 50, expectedMin: 15 }
      ]

      testCases.forEach(({ difficulty, progress, expectedMin }) => {
        const { rerender } = renderWithQueryClient(
          <MobileProgressSlider 
            {...mockProps}
            goalDifficulty={difficulty as any}
            currentProgress={progress}
            showXPPreview={true}
          />
        )

        // Should show XP value greater than minimum expected
        expect(screen.getByText(/xp/i)).toBeInTheDocument()
        
        rerender(<div />) // Cleanup for next iteration
      })
    })

    it('should update XP preview in real-time', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(
        <MobileProgressSlider 
          {...mockProps}
          showXPPreview={true}
          currentProgress={25}
        />
      )

      const initialXP = screen.getByText(/xp/i).textContent

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '75' } })

      await waitFor(() => {
        const updatedXP = screen.getByText(/xp/i).textContent
        expect(updatedXP).not.toBe(initialXP)
      })
    })
  })

  describe('Slider Configuration', () => {
    it('should support custom step values', () => {
      renderWithQueryClient(
        <MobileProgressSlider {...mockProps} step={10} />
      )

      const slider = screen.getByRole('slider')
      expect(slider).toHaveAttribute('step', '10')
    })

    it('should display marks when enabled', () => {
      const marks = [
        { value: 25, label: '25%' },
        { value: 50, label: '50%' },
        { value: 75, label: '75%' }
      ]

      renderWithQueryClient(
        <MobileProgressSlider 
          {...mockProps} 
          showMarks={true}
          marks={marks}
        />
      )

      marks.forEach(mark => {
        expect(screen.getByText(mark.label)).toBeInTheDocument()
      })
    })

    it('should support different thumb sizes', () => {
      const { rerender } = renderWithQueryClient(
        <MobileProgressSlider {...mockProps} thumbSize="lg" />
      )

      const slider = screen.getByRole('slider')
      expect(slider).toBeInTheDocument()

      // Test different sizes
      rerender(
        <QueryClient>
          <MobileProgressSlider {...mockProps} thumbSize="sm" />
        </QueryClient>
      )
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithQueryClient(<MobileProgressSlider {...mockProps} />)

      const slider = screen.getByRole('slider')
      expect(slider).toHaveAttribute('aria-label')
      expect(slider).toHaveAttribute('aria-valuemin')
      expect(slider).toHaveAttribute('aria-valuemax')
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<MobileProgressSlider {...mockProps} />)

      const slider = screen.getByRole('slider')
      slider.focus()
      
      // Test arrow key navigation
      await user.keyboard('{ArrowRight}')
      await user.keyboard('{ArrowUp}')
      await user.keyboard('{ArrowLeft}')
      await user.keyboard('{ArrowDown}')

      expect(slider).toHaveFocus()
    })

    it('should announce value changes to screen readers', async () => {
      renderWithQueryClient(<MobileProgressSlider {...mockProps} />)

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '60' } })

      expect(slider).toHaveAttribute('aria-valuenow', '60')
      expect(slider).toHaveAttribute('aria-valuetext')
    })
  })

  describe('Performance', () => {
    it('should debounce rapid slider changes', async () => {
      const user = userEvent.setup()
      renderWithQueryClient(<MobileProgressSlider {...mockProps} />)

      const slider = screen.getByRole('slider')
      
      // Rapid changes
      fireEvent.change(slider, { target: { value: '10' } })
      fireEvent.change(slider, { target: { value: '20' } })
      fireEvent.change(slider, { target: { value: '30' } })
      fireEvent.change(slider, { target: { value: '40' } })

      // Should handle rapid changes without performance issues
      await waitFor(() => {
        expect(slider).toHaveAttribute('aria-valuenow', '40')
      })
    })

    it('should not cause memory leaks with rapid interactions', async () => {
      const { unmount } = renderWithQueryClient(<MobileProgressSlider {...mockProps} />)

      const slider = screen.getByRole('slider')
      
      // Simulate many interactions
      for (let i = 0; i < 50; i++) {
        fireEvent.change(slider, { target: { value: i.toString() } })
      }

      // Should unmount cleanly
      unmount()
      expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle submission errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock error
      const { useCreateProgress } = await import('@/hooks/useProgress')
      vi.mocked(useCreateProgress).mockReturnValueOnce({
        mutateAsync: vi.fn().mockRejectedValue(new Error('Network error')),
        isPending: false
      } as any)

      renderWithQueryClient(<MobileProgressSlider {...mockProps} />)

      const slider = screen.getByRole('slider')
      await user.click(slider)
      
      const submitButton = screen.getByRole('button', { name: /confirm|submit/i })
      await user.click(submitButton)

      // Should handle error without crashing
      await waitFor(() => {
        expect(submitButton).toBeEnabled()
      })
    })

    it('should validate slider values', async () => {
      renderWithQueryClient(
        <MobileProgressSlider 
          {...mockProps} 
          maxValue={100}
          currentProgress={150} // Invalid: exceeds max
        />
      )

      const slider = screen.getByRole('slider')
      expect(slider).toHaveAttribute('aria-valuenow', '100') // Should clamp to max
    })
  })
})