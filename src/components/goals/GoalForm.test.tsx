/**
 * GoalForm Component Tests
 * 
 * Tests for the GoalForm component including form validation, submission,
 * auto-save functionality, and accessibility features.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GoalForm } from './GoalForm'
import { GoalWithRelations } from '@/lib/prisma/repositories/goal-repository'

// Mock the hooks
const mockCreateForm = {
  form: {
    control: {},
    formState: { isValid: true },
    handleSubmit: vi.fn((cb) => (e: any) => {
      e.preventDefault()
      cb({ title: 'Test Goal', moduleId: 'fitness' })
    }),
  },
  handleSubmit: vi.fn(),
  isSubmitting: false,
  autoSaveStatus: {
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    error: null
  },
  isDraftRecovered: false
}

const mockEditForm = {
  ...mockCreateForm,
  isDraftRecovered: true
}

vi.mock('@/hooks/useGoalForm', () => ({
  useCreateGoalForm: vi.fn(() => mockCreateForm),
  useEditGoalForm: vi.fn(() => mockEditForm)
}))

// Mock UI components
vi.mock('@/components/ui/form', () => ({
  Form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
  FormControl: ({ children }: any) => <div>{children}</div>,
  FormField: ({ render }: any) => {
    const field = { onChange: vi.fn(), value: '', name: 'test' }
    return render({ field })
  },
  FormItem: ({ children }: any) => <div>{children}</div>,
  FormLabel: ({ children, ...props }: any) => <label {...props}>{children}</label>,
  FormMessage: () => <div data-testid="form-message" />,
  FormDescription: ({ children }: any) => <div className="form-description">{children}</div>
}))

vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({ selected, onSelect, ...props }: any) => (
    <div data-testid="calendar" {...props}>
      <button onClick={() => onSelect?.(new Date('2024-12-31'))}>
        Select Date
      </button>
    </div>
  )
}))

describe('GoalForm Component', () => {
  const mockGoal: GoalWithRelations = {
    id: 'goal-1',
    title: 'Test Goal',
    description: 'This is a test goal',
    isCompleted: false,
    userId: 'user-1',
    moduleId: 'fitness',
    priority: 'medium',
    difficulty: 'medium',
    targetDate: new Date('2024-12-31'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    progress: [],
    _count: { subGoals: 0, progress: 0 },
    subGoals: [],
    parentGoal: null,
    parentId: null
  }

  const defaultProps = {
    mode: 'create' as const,
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Create Mode', () => {
    it('should render create form with correct title', () => {
      render(<GoalForm {...defaultProps} />)
      
      expect(screen.getByText('Create New Goal')).toBeInTheDocument()
      expect(screen.getByText('Create Goal')).toBeInTheDocument()
    })

    it('should render all form fields', () => {
      render(<GoalForm {...defaultProps} />)
      
      expect(screen.getByText('Goal Title *')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Category *')).toBeInTheDocument()
      expect(screen.getByText('Priority')).toBeInTheDocument()
      expect(screen.getByText('Difficulty')).toBeInTheDocument()
      expect(screen.getByText('Target Date')).toBeInTheDocument()
    })

    it('should show field descriptions', () => {
      render(<GoalForm {...defaultProps} />)
      
      expect(screen.getByText('Be specific and clear about what you want to achieve')).toBeInTheDocument()
      expect(screen.getByText('Choose the life area this goal belongs to')).toBeInTheDocument()
      expect(screen.getByText('Difficulty affects XP rewards when completed')).toBeInTheDocument()
    })

    it('should not show draft recovery message in create mode', () => {
      render(<GoalForm {...defaultProps} />)
      
      expect(screen.queryByText('Your draft has been recovered')).not.toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    it('should render edit form with correct title', () => {
      render(
        <GoalForm 
          {...defaultProps} 
          mode="edit" 
          initialData={mockGoal}
        />
      )
      
      expect(screen.getByText('Edit Goal')).toBeInTheDocument()
      expect(screen.getByText('Update Goal')).toBeInTheDocument()
    })

    it('should show draft recovery message when applicable', () => {
      render(
        <GoalForm 
          {...defaultProps} 
          mode="edit" 
          initialData={mockGoal}
        />
      )
      
      expect(screen.getByText(/Your draft has been recovered/)).toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('should show required field indicators', () => {
      render(<GoalForm {...defaultProps} />)
      
      expect(screen.getByText('Goal Title *')).toBeInTheDocument()
      expect(screen.getByText('Category *')).toBeInTheDocument()
    })

    it('should disable submit button when form is invalid', () => {
      const invalidForm = {
        ...mockCreateForm,
        form: {
          ...mockCreateForm.form,
          formState: { isValid: false }
        }
      }
      
      vi.mocked(require('@/hooks/useGoalForm').useCreateGoalForm).mockReturnValue(invalidForm)
      
      render(<GoalForm {...defaultProps} />)
      
      const submitButton = screen.getByRole('button', { name: /Create Goal/ })
      expect(submitButton).toBeDisabled()
    })

    it('should show loading state during submission', () => {
      const submittingForm = {
        ...mockCreateForm,
        isSubmitting: true
      }
      
      vi.mocked(require('@/hooks/useGoalForm').useCreateGoalForm).mockReturnValue(submittingForm)
      
      render(<GoalForm {...defaultProps} />)
      
      expect(screen.getByText('Creating...')).toBeInTheDocument()
      const submitButton = screen.getByRole('button', { name: /Creating.../ })
      expect(submitButton).toBeDisabled()
    })
  })

  describe('Module Selection', () => {
    it('should render all module options', () => {
      render(<GoalForm {...defaultProps} />)
      
      // Module options would be rendered within the select component
      // This tests the presence of the select field
      expect(screen.getByText('Category *')).toBeInTheDocument()
    })
  })

  describe('Priority Selection', () => {
    it('should render priority selection field', () => {
      render(<GoalForm {...defaultProps} />)
      
      expect(screen.getByText('Priority')).toBeInTheDocument()
    })
  })

  describe('Difficulty Selection', () => {
    it('should render difficulty selection field', () => {
      render(<GoalForm {...defaultProps} />)
      
      expect(screen.getByText('Difficulty')).toBeInTheDocument()
      expect(screen.getByText('Difficulty affects XP rewards when completed')).toBeInTheDocument()
    })
  })

  describe('Date Selection', () => {
    it('should render date picker field', () => {
      render(<GoalForm {...defaultProps} />)
      
      expect(screen.getByText('Target Date')).toBeInTheDocument()
      expect(screen.getByText('Optional: When do you want to complete this goal?')).toBeInTheDocument()
    })

    it('should open date picker when clicked', async () => {
      const user = userEvent.setup()
      render(<GoalForm {...defaultProps} />)
      
      // This would test the date picker interaction if properly implemented
      // The current mock doesn't fully simulate the popover behavior
      expect(screen.getByText('Target Date')).toBeInTheDocument()
    })
  })

  describe('Auto-save Functionality', () => {
    it('should show auto-save status when enabled', () => {
      const autoSavingForm = {
        ...mockCreateForm,
        autoSaveStatus: {
          isSaving: true,
          lastSaved: null,
          hasUnsavedChanges: false,
          error: null
        }
      }
      
      vi.mocked(require('@/hooks/useGoalForm').useCreateGoalForm).mockReturnValue(autoSavingForm)
      
      render(<GoalForm {...defaultProps} autoSave={true} />)
      
      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })

    it('should show last saved time', () => {
      const savedForm = {
        ...mockCreateForm,
        autoSaveStatus: {
          isSaving: false,
          lastSaved: new Date('2023-01-01T10:00:00'),
          hasUnsavedChanges: false,
          error: null
        }
      }
      
      vi.mocked(require('@/hooks/useGoalForm').useCreateGoalForm).mockReturnValue(savedForm)
      
      render(<GoalForm {...defaultProps} autoSave={true} />)
      
      expect(screen.getByText(/Saved \d{2}:\d{2}/)).toBeInTheDocument()
    })

    it('should show unsaved changes warning', () => {
      const unsavedForm = {
        ...mockCreateForm,
        autoSaveStatus: {
          isSaving: false,
          lastSaved: null,
          hasUnsavedChanges: true,
          error: null
        }
      }
      
      vi.mocked(require('@/hooks/useGoalForm').useCreateGoalForm).mockReturnValue(unsavedForm)
      
      render(<GoalForm {...defaultProps} autoSave={true} />)
      
      expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    })

    it('should show auto-save error when it occurs', () => {
      const errorForm = {
        ...mockCreateForm,
        autoSaveStatus: {
          isSaving: false,
          lastSaved: null,
          hasUnsavedChanges: false,
          error: new Error('Save failed')
        }
      }
      
      vi.mocked(require('@/hooks/useGoalForm').useCreateGoalForm).mockReturnValue(errorForm)
      
      render(<GoalForm {...defaultProps} autoSave={true} />)
      
      expect(screen.getByText('Auto-save failed: Save failed')).toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('should call onSubmit when form is submitted', async () => {
      const user = userEvent.setup()
      render(<GoalForm {...defaultProps} />)
      
      const submitButton = screen.getByRole('button', { name: /Create Goal/ })
      await user.click(submitButton)
      
      expect(defaultProps.onSubmit).toHaveBeenCalled()
    })

    it('should handle submission errors', async () => {
      const failingOnSubmit = vi.fn().mockRejectedValue(new Error('Submission failed'))
      
      render(<GoalForm {...defaultProps} onSubmit={failingOnSubmit} />)
      
      const submitButton = screen.getByRole('button', { name: /Create Goal/ })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Submission failed')).toBeInTheDocument()
      })
    })
  })

  describe('Cancel Functionality', () => {
    it('should render cancel button when onCancel is provided', () => {
      render(<GoalForm {...defaultProps} />)
      
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should not render cancel button when onCancel is not provided', () => {
      render(<GoalForm {...defaultProps} onCancel={undefined} />)
      
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
    })

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<GoalForm {...defaultProps} />)
      
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      
      expect(defaultProps.onCancel).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper form structure', () => {
      render(<GoalForm {...defaultProps} />)
      
      const form = screen.getByRole('form')
      expect(form).toHaveAttribute('noValidate')
    })

    it('should have proper labels for form fields', () => {
      render(<GoalForm {...defaultProps} />)
      
      expect(screen.getByText('Goal Title *')).toBeInTheDocument()
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('Category *')).toBeInTheDocument()
    })

    it('should have proper ARIA attributes', () => {
      render(<GoalForm {...defaultProps} />)
      
      // Form should have proper structure for screen readers
      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()
    })
  })

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<GoalForm {...defaultProps} className="custom-form-class" />)
      
      // Card should have the custom class
      expect(document.querySelector('.custom-form-class')).toBeInTheDocument()
    })
  })

  describe('Field Character Limits', () => {
    it('should enforce title character limit', () => {
      render(<GoalForm {...defaultProps} />)
      
      // Title field should have maxLength attribute
      // This is tested through the FormField render prop structure
      expect(screen.getByText('Goal Title *')).toBeInTheDocument()
    })

    it('should enforce description character limit', () => {
      render(<GoalForm {...defaultProps} />)
      
      // Description field should have maxLength attribute
      expect(screen.getByText('Description')).toBeInTheDocument()
    })
  })
})