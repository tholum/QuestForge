/**
 * useGoalForm Hook Tests
 * 
 * Tests for the useGoalForm hook including form creation, editing,
 * validation, auto-save functionality, and draft recovery.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useCreateGoalForm, useEditGoalForm } from '@/hooks/useGoalForm'
import { GoalWithRelations } from '@/lib/prisma/repositories/goal-repository'

// Mock react-hook-form
const mockForm = {
  control: {},
  handleSubmit: vi.fn((cb) => (e: any) => {
    e?.preventDefault?.()
    return cb({
      title: 'Test Goal',
      description: 'Test description',
      moduleId: 'fitness',
      priority: 'medium',
      difficulty: 'medium'
    })
  }),
  formState: {
    isValid: true,
    errors: {},
    isDirty: false,
    isSubmitting: false
  },
  reset: vi.fn(),
  setValue: vi.fn(),
  getValues: vi.fn(() => ({
    title: 'Test Goal',
    moduleId: 'fitness'
  })),
  watch: vi.fn(() => ({
    title: 'Test Goal',
    moduleId: 'fitness'
  }))
}

vi.mock('react-hook-form', () => ({
  useForm: vi.fn(() => mockForm),
  Controller: ({ render }: any) => render({ field: { onChange: vi.fn(), value: '' } })
}))

// Mock zod validation
vi.mock('@/lib/validation/goals', () => ({
  createGoalSchema: {
    parse: vi.fn((data) => data),
    safeParse: vi.fn((data) => ({ success: true, data }))
  },
  updateGoalSchema: {
    parse: vi.fn((data) => data),
    safeParse: vi.fn((data) => ({ success: true, data }))
  }
}))

// Mock localStorage for draft functionality
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('useGoalForm Hooks', () => {
  const mockInitialData: GoalWithRelations = {
    id: 'goal-1',
    title: 'Existing Goal',
    description: 'Existing description',
    isCompleted: false,
    userId: 'user-1',
    moduleId: 'fitness',
    priority: 'high',
    difficulty: 'hard',
    targetDate: new Date('2024-12-31'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    progress: [],
    _count: { subGoals: 0, progress: 0 },
    subGoals: [],
    parentGoal: null,
    parentId: null
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
    
    // Reset form mock
    mockForm.formState = {
      isValid: true,
      errors: {},
      isDirty: false,
      isSubmitting: false
    }
  })

  describe('useCreateGoalForm', () => {
    it('should initialize with default values', () => {
      const onSubmit = vi.fn()
      const onError = vi.fn()

      const { result } = renderHook(() =>
        useCreateGoalForm({ onSubmit, onError })
      )

      expect(result.current.form).toBeDefined()
      expect(result.current.handleSubmit).toBeDefined()
      expect(result.current.isSubmitting).toBe(false)
      expect(result.current.autoSaveStatus).toEqual({
        isSaving: false,
        lastSaved: null,
        hasUnsavedChanges: false,
        error: null
      })
      expect(result.current.isDraftRecovered).toBe(false)
    })

    it('should handle form submission successfully', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      const onError = vi.fn()

      const { result } = renderHook(() =>
        useCreateGoalForm({ onSubmit, onError })
      )

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() }
        await result.current.handleSubmit(mockEvent as any)
      })

      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Test Goal',
        description: 'Test description',
        moduleId: 'fitness',
        priority: 'medium',
        difficulty: 'medium'
      })
      expect(onError).not.toHaveBeenCalled()
    })

    it('should handle form submission errors', async () => {
      const submitError = new Error('Submission failed')
      const onSubmit = vi.fn().mockRejectedValue(submitError)
      const onError = vi.fn()

      const { result } = renderHook(() =>
        useCreateGoalForm({ onSubmit, onError })
      )

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() }
        await result.current.handleSubmit(mockEvent as any)
      })

      expect(onError).toHaveBeenCalledWith(submitError)
    })

    it('should recover draft when available', () => {
      const draftData = {
        title: 'Draft Goal',
        description: 'Draft description',
        moduleId: 'learning'
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(draftData))

      const { result } = renderHook(() =>
        useCreateGoalForm({
          onSubmit: vi.fn(),
          onError: vi.fn(),
          enableDraftRecovery: true
        })
      )

      expect(result.current.isDraftRecovered).toBe(true)
      expect(mockForm.setValue).toHaveBeenCalledWith('title', 'Draft Goal')
      expect(mockForm.setValue).toHaveBeenCalledWith('description', 'Draft description')
      expect(mockForm.setValue).toHaveBeenCalledWith('moduleId', 'learning')
    })

    it('should handle auto-save functionality', async () => {
      vi.useFakeTimers()
      
      const { result } = renderHook(() =>
        useCreateGoalForm({
          onSubmit: vi.fn(),
          onError: vi.fn(),
          autoSave: true
        })
      )

      // Simulate form changes
      act(() => {
        mockForm.formState.isDirty = true
      })

      // Fast-forward time to trigger auto-save
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled()
      })

      vi.useRealTimers()
    })

    it('should handle auto-save errors', async () => {
      vi.useFakeTimers()
      
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage failed')
      })

      const { result } = renderHook(() =>
        useCreateGoalForm({
          onSubmit: vi.fn(),
          onError: vi.fn(),
          autoSave: true
        })
      )

      act(() => {
        mockForm.formState.isDirty = true
      })

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(result.current.autoSaveStatus.error).toBeInstanceOf(Error)
        expect(result.current.autoSaveStatus.error?.message).toBe('Storage failed')
      })

      vi.useRealTimers()
    })

    it('should clean up draft on successful submission', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined)

      const { result } = renderHook(() =>
        useCreateGoalForm({
          onSubmit,
          onError: vi.fn(),
          enableDraftRecovery: true
        })
      )

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() }
        await result.current.handleSubmit(mockEvent as any)
      })

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('goal-form-draft')
    })
  })

  describe('useEditGoalForm', () => {
    it('should initialize with existing goal data', () => {
      const onSubmit = vi.fn()
      const onError = vi.fn()

      const { result } = renderHook(() =>
        useEditGoalForm({
          initialData: mockInitialData,
          onSubmit,
          onError
        })
      )

      expect(result.current.form).toBeDefined()
      expect(mockForm.setValue).toHaveBeenCalledWith('title', 'Existing Goal')
      expect(mockForm.setValue).toHaveBeenCalledWith('description', 'Existing description')
      expect(mockForm.setValue).toHaveBeenCalledWith('moduleId', 'fitness')
      expect(mockForm.setValue).toHaveBeenCalledWith('priority', 'high')
      expect(mockForm.setValue).toHaveBeenCalledWith('difficulty', 'hard')
    })

    it('should handle form submission for updates', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined)
      const onError = vi.fn()

      const { result } = renderHook(() =>
        useEditGoalForm({
          initialData: mockInitialData,
          onSubmit,
          onError
        })
      )

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() }
        await result.current.handleSubmit(mockEvent as any)
      })

      expect(onSubmit).toHaveBeenCalledWith({
        title: 'Test Goal',
        description: 'Test description',
        moduleId: 'fitness',
        priority: 'medium',
        difficulty: 'medium'
      })
    })

    it('should handle draft recovery for edits', () => {
      const draftData = {
        title: 'Draft Edit',
        description: 'Draft edit description'
      }
      
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(draftData))

      const { result } = renderHook(() =>
        useEditGoalForm({
          initialData: mockInitialData,
          onSubmit: vi.fn(),
          onError: vi.fn(),
          enableDraftRecovery: true
        })
      )

      expect(result.current.isDraftRecovered).toBe(true)
      // Should set draft values over initial data
      expect(mockForm.setValue).toHaveBeenCalledWith('title', 'Draft Edit')
      expect(mockForm.setValue).toHaveBeenCalledWith('description', 'Draft edit description')
    })

    it('should use goal-specific draft key', () => {
      const { result } = renderHook(() =>
        useEditGoalForm({
          initialData: mockInitialData,
          onSubmit: vi.fn(),
          onError: vi.fn(),
          enableDraftRecovery: true
        })
      )

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('goal-form-draft-goal-1')
    })

    it('should handle missing initial data gracefully', () => {
      const onSubmit = vi.fn()
      const onError = vi.fn()

      const { result } = renderHook(() =>
        useEditGoalForm({
          initialData: undefined,
          onSubmit,
          onError
        })
      )

      expect(result.current.form).toBeDefined()
      // Should not crash when initialData is undefined
    })
  })

  describe('Validation Integration', () => {
    it('should validate form data before submission', async () => {
      const mockValidation = vi.mocked(require('@/lib/validation/goals').createGoalSchema)
      mockValidation.parse.mockImplementation((data) => {
        if (!data.title) {
          throw new Error('Title is required')
        }
        return data
      })

      const onSubmit = vi.fn()
      const onError = vi.fn()

      const { result } = renderHook(() =>
        useCreateGoalForm({ onSubmit, onError })
      )

      // Mock form data without title
      mockForm.getValues.mockReturnValue({
        description: 'Test description',
        moduleId: 'fitness'
      })

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() }
        await result.current.handleSubmit(mockEvent as any)
      })

      expect(onError).toHaveBeenCalledWith(expect.any(Error))
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('should handle validation errors gracefully', async () => {
      const mockValidation = vi.mocked(require('@/lib/validation/goals').createGoalSchema)
      mockValidation.safeParse.mockReturnValue({
        success: false,
        error: {
          errors: [{ path: ['title'], message: 'Title is required' }]
        }
      })

      const onSubmit = vi.fn()
      const onError = vi.fn()

      const { result } = renderHook(() =>
        useCreateGoalForm({ onSubmit, onError })
      )

      await act(async () => {
        const mockEvent = { preventDefault: vi.fn() }
        await result.current.handleSubmit(mockEvent as any)
      })

      expect(onError).toHaveBeenCalled()
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })

  describe('Auto-save Edge Cases', () => {
    it('should not auto-save when form is not dirty', async () => {
      vi.useFakeTimers()

      const { result } = renderHook(() =>
        useCreateGoalForm({
          onSubmit: vi.fn(),
          onError: vi.fn(),
          autoSave: true
        })
      )

      // Form is not dirty by default
      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()

      vi.useRealTimers()
    })

    it('should not auto-save when already saving', async () => {
      vi.useFakeTimers()

      const { result } = renderHook(() =>
        useCreateGoalForm({
          onSubmit: vi.fn(),
          onError: vi.fn(),
          autoSave: true
        })
      )

      act(() => {
        mockForm.formState.isDirty = true
      })

      // Start first auto-save
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // Clear the setItem calls
      mockLocalStorage.setItem.mockClear()

      // Try to trigger another auto-save while first is in progress
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      // Should not call setItem again during save operation
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled()

      vi.useRealTimers()
    })
  })

  describe('Memory Management', () => {
    it('should clean up timers on unmount', () => {
      vi.useFakeTimers()
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      const { unmount } = renderHook(() =>
        useCreateGoalForm({
          onSubmit: vi.fn(),
          onError: vi.fn(),
          autoSave: true
        })
      )

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()

      vi.useRealTimers()
    })

    it('should clean up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() =>
        useCreateGoalForm({
          onSubmit: vi.fn(),
          onError: vi.fn(),
          enableDraftRecovery: true
        })
      )

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalled()
    })
  })

  describe('Error Recovery', () => {
    it('should recover from localStorage errors', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage access denied')
      })

      // Should not throw error
      expect(() => {
        renderHook(() =>
          useCreateGoalForm({
            onSubmit: vi.fn(),
            onError: vi.fn(),
            enableDraftRecovery: true
          })
        )
      }).not.toThrow()
    })

    it('should handle corrupted draft data', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json{')

      const { result } = renderHook(() =>
        useCreateGoalForm({
          onSubmit: vi.fn(),
          onError: vi.fn(),
          enableDraftRecovery: true
        })
      )

      expect(result.current.isDraftRecovered).toBe(false)
    })
  })
})