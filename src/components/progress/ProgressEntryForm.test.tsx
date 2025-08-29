/**
 * ProgressEntryForm Component Tests
 * 
 * Tests for form validation, user interactions, XP calculation preview,
 * and submission handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ProgressEntryForm from './ProgressEntryForm'

// Mock the useProgress hook
vi.mock('@/hooks/useProgress', () => ({
  useCreateProgress: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({
      data: {
        id: 'progress-123',
        value: 50,
        maxValue: 100,
        xpEarned: 15,
        goalId: 'goal-123'
      }
    }),
    isPending: false
  })),
  useUpdateProgress: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({
      data: {
        id: 'progress-123',
        value: 75,
        maxValue: 100,
        xpEarned: 22
      }
    }),
    isPending: false
  }))
}))

// Mock UI components that might not be available in test environment
vi.mock('@/components/ui/slider', () => ({
  Slider: ({ value, onValueChange, ...props }: any) => (
    <input
      type="range"
      value={value[0]}
      onChange={(e) => onValueChange([parseFloat(e.target.value)])}
      data-testid="progress-slider"
      {...props}
    />
  )
}))

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  )
}

describe('ProgressEntryForm', () => {
  const mockProps = {
    goalId: 'goal-123',
    goalTitle: 'Test Goal',
    goalDifficulty: 'medium' as const,
    onSuccess: vi.fn(),
    onCancel: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render form with all required fields', () => {
    renderWithQueryClient(<ProgressEntryForm {...mockProps} />)

    expect(screen.getAllByText('Record Progress')).toHaveLength(2) // Title and button
    expect(screen.getByText('Test Goal')).toBeInTheDocument()
    expect(screen.getByText('medium')).toBeInTheDocument()
    expect(screen.getByLabelText(/current progress/i)).toBeInTheDocument()
    expect(screen.getByText(/maximum value/i)).toBeInTheDocument() // Label text, not form control
    expect(screen.getByText(/recorded at/i)).toBeInTheDocument() // Label text, not form control
    expect(screen.getByText(/notes/i)).toBeInTheDocument() // Label text, not form control
  })

  it('should show XP calculation preview', () => {
    renderWithQueryClient(<ProgressEntryForm {...mockProps} showXPCalculation={true} />)

    expect(screen.getByText(/estimated xp reward/i)).toBeInTheDocument()
    // Default values should show 1 XP (0% progress)
    expect(screen.getByText('1 XP')).toBeInTheDocument()
  })

  it('should update XP calculation when progress changes', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<ProgressEntryForm {...mockProps} showXPCalculation={true} />)

    const progressInput = screen.getByLabelText(/current progress/i)
    
    // Change progress to 50
    await user.clear(progressInput)
    await user.type(progressInput, '50')

    // Should show updated XP calculation (50/10 * 1.5 for medium difficulty = 7 XP)
    await waitFor(() => {
      expect(screen.getByText('7 XP')).toBeInTheDocument()
    })
  })

  it('should show completion bonus for 100% progress', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<ProgressEntryForm {...mockProps} showXPCalculation={true} />)

    const progressInput = screen.getByLabelText(/current progress/i)
    
    // Change progress to 100 (completion)
    await user.clear(progressInput)
    await user.type(progressInput, '100')

    await waitFor(() => {
      expect(screen.getByText('+50 Completion Bonus')).toBeInTheDocument()
    })
  })

  it('should validate form inputs', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<ProgressEntryForm {...mockProps} />)

    const progressInput = screen.getByLabelText(/current progress/i)
    const maxValueInput = screen.getByLabelText(/maximum value/i)
    const submitButton = screen.getByRole('button', { name: /record progress/i })

    // Test negative value validation
    await user.clear(progressInput)
    await user.type(progressInput, '-10')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/progress value cannot be negative/i)).toBeInTheDocument()
    })

    // Test zero max value validation
    await user.clear(maxValueInput)
    await user.type(maxValueInput, '0')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/maximum value must be positive/i)).toBeInTheDocument()
    })
  })

  it('should switch between input and slider modes', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<ProgressEntryForm {...mockProps} />)

    // Should start with input mode
    expect(screen.getByLabelText(/current progress/i)).toBeInTheDocument()
    expect(screen.queryByTestId('progress-slider')).not.toBeInTheDocument()

    // Switch to slider mode
    const sliderButton = screen.getByRole('button', { name: /slider/i })
    await user.click(sliderButton)

    // Should now show slider
    expect(screen.getByTestId('progress-slider')).toBeInTheDocument()
  })

  it('should use max value presets', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(
      <ProgressEntryForm 
        {...mockProps} 
        maxValuePresets={[100, 500, 1000]} 
      />
    )

    const preset500Button = screen.getByRole('button', { name: '500' })
    await user.click(preset500Button)

    const maxValueInput = screen.getByLabelText(/maximum value/i) as HTMLInputElement
    expect(maxValueInput.value).toBe('500')
  })

  it('should submit form with correct data', async () => {
    const user = userEvent.setup()
    const mockOnSuccess = vi.fn()
    
    const { useCreateProgress } = await import('@/hooks/useProgress')
    const mockMutate = vi.fn().mockResolvedValue({
      data: { id: 'progress-123', value: 75, maxValue: 100, goalId: 'goal-123' }
    })
    vi.mocked(useCreateProgress).mockReturnValue({
      mutateAsync: mockMutate,
      isPending: false
    } as any)

    renderWithQueryClient(
      <ProgressEntryForm 
        {...mockProps} 
        onSuccess={mockOnSuccess}
      />
    )

    const progressInput = screen.getByLabelText(/current progress/i)
    const notesInput = screen.getByLabelText(/notes/i)
    const submitButton = screen.getByRole('button', { name: /record progress/i })

    await user.clear(progressInput)
    await user.type(progressInput, '75')
    await user.type(notesInput, 'Great progress today!')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          value: 75,
          maxValue: 100,
          notes: 'Great progress today!',
          goalId: 'goal-123'
        })
      )
    })

    expect(mockOnSuccess).toHaveBeenCalled()
  })

  it('should handle update mode correctly', async () => {
    const user = userEvent.setup()
    const existingProgress = {
      id: 'progress-123',
      value: 30,
      maxValue: 100,
      notes: 'Initial progress',
      recordedAt: new Date(),
      xpEarned: 10,
      userId: 'user-123',
      goalId: 'goal-123'
    }

    const { useUpdateProgress } = await import('@/hooks/useProgress')
    const mockUpdate = vi.fn().mockResolvedValue({
      data: { ...existingProgress, value: 50 }
    })
    vi.mocked(useUpdateProgress).mockReturnValue({
      mutateAsync: mockUpdate,
      isPending: false
    } as any)

    renderWithQueryClient(
      <ProgressEntryForm 
        {...mockProps}
        existingProgress={existingProgress}
      />
    )

    expect(screen.getByText('Update Progress')).toBeInTheDocument()
    
    const progressInput = screen.getByLabelText(/current progress/i) as HTMLInputElement
    expect(progressInput.value).toBe('30')

    await user.clear(progressInput)
    await user.type(progressInput, '50')
    
    const updateButton = screen.getByRole('button', { name: /update progress/i })
    await user.click(updateButton)

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        id: 'progress-123',
        data: expect.objectContaining({
          value: 50
        })
      })
    })
  })

  it('should show progress preview', () => {
    renderWithQueryClient(
      <ProgressEntryForm 
        {...mockProps} 
        showPreview={true}
      />
    )

    expect(screen.getByText(/progress preview/i)).toBeInTheDocument()
  })

  it('should handle notes character limit', async () => {
    const user = userEvent.setup()
    renderWithQueryClient(<ProgressEntryForm {...mockProps} />)

    const notesInput = screen.getByLabelText(/notes/i)
    const longText = 'a'.repeat(600) // Exceeds 500 character limit

    await user.type(notesInput, longText)

    await waitFor(() => {
      expect(screen.getByText(/notes cannot exceed 500 characters/i)).toBeInTheDocument()
    })
  })

  it('should handle compact variant', () => {
    renderWithQueryClient(
      <ProgressEntryForm 
        {...mockProps}
        variant="compact"
      />
    )

    // Should still render all essential elements but with compact styling
    expect(screen.getByText('Record Progress')).toBeInTheDocument()
    expect(screen.getByLabelText(/current progress/i)).toBeInTheDocument()
  })
})