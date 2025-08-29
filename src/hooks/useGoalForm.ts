/**
 * useGoalForm Hook
 * 
 * Custom hook for goal form state management with React Hook Form,
 * validation, auto-save functionality, and draft recovery.
 */

import { useForm, UseFormProps, UseFormReturn } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, useCallback } from 'react'
import { GoalCreateSchema, GoalUpdateSchema, GoalCreateInput, GoalUpdateInput } from '@/lib/validation/schemas'
import { GoalWithRelations } from '@/lib/prisma/repositories/goal-repository'
import { z } from 'zod'

/**
 * Form mode types
 */
type FormMode = 'create' | 'edit'

/**
 * Form data types based on mode
 */
type CreateFormData = Omit<GoalCreateInput, 'userId'>
type UpdateFormData = GoalUpdateInput

type FormData<T extends FormMode> = T extends 'create' ? CreateFormData : UpdateFormData

/**
 * Hook options interface
 */
interface UseGoalFormOptions<T extends FormMode> {
  mode: T
  initialData?: T extends 'edit' ? Partial<GoalWithRelations> : undefined
  onSubmit?: (data: FormData<T>) => Promise<void> | void
  onError?: (error: Error) => void
  autoSave?: boolean
  autoSaveDelay?: number
  enableDraftRecovery?: boolean
  draftKey?: string
}

/**
 * Auto-save status
 */
interface AutoSaveStatus {
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  error: Error | null
}

/**
 * Form validation schemas based on mode
 */
const getValidationSchema = <T extends FormMode>(mode: T) => {
  if (mode === 'create') {
    // Remove userId from create schema as it will be added by the API
    return GoalCreateSchema.omit({ userId: true })
  }
  return GoalUpdateSchema
}

/**
 * Default form values
 */
const getDefaultValues = <T extends FormMode>(mode: T, initialData?: any): FormData<T> => {
  if (mode === 'create') {
    return {
      title: '',
      description: '',
      targetDate: undefined,
      difficulty: 'medium',
      priority: 'medium',
      moduleId: '',
      moduleData: undefined,
      parentGoalId: undefined,
    } as FormData<T>
  }

  return {
    title: initialData?.title,
    description: initialData?.description,
    isCompleted: initialData?.isCompleted,
    targetDate: initialData?.targetDate ? new Date(initialData.targetDate) : undefined,
    difficulty: initialData?.difficulty,
    priority: initialData?.priority,
    moduleData: initialData?.moduleData,
    parentGoalId: initialData?.parentGoalId,
  } as FormData<T>
}

/**
 * Local storage helpers
 */
const getDraftKey = (mode: FormMode, id?: string, customKey?: string) => {
  if (customKey) return `goal-draft-${customKey}`
  if (mode === 'edit' && id) return `goal-draft-edit-${id}`
  return 'goal-draft-create'
}

const saveDraft = <T extends FormMode>(key: string, data: FormData<T>) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }))
  } catch (error) {
    console.warn('Failed to save draft:', error)
  }
}

const loadDraft = <T extends FormMode>(key: string): FormData<T> | null => {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return null

    const { data, timestamp } = JSON.parse(stored)
    
    // Expire drafts after 7 days
    if (Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(key)
      return null
    }

    return data
  } catch (error) {
    console.warn('Failed to load draft:', error)
    return null
  }
}

const clearDraft = (key: string) => {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.warn('Failed to clear draft:', error)
  }
}

/**
 * Main useGoalForm hook
 */
export function useGoalForm<T extends FormMode>(options: UseGoalFormOptions<T>) {
  const {
    mode,
    initialData,
    onSubmit,
    onError,
    autoSave = false,
    autoSaveDelay = 2000,
    enableDraftRecovery = true,
    draftKey
  } = options

  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    error: null
  })

  const [isDraftRecovered, setIsDraftRecovered] = useState(false)

  // Get validation schema and default values
  const validationSchema = getValidationSchema(mode)
  const defaultValues = getDefaultValues(mode, initialData)

  // Generate draft key
  const storageKey = getDraftKey(
    mode, 
    (initialData as any)?.id, 
    draftKey
  )

  // Initialize form
  const form = useForm<FormData<T>>({
    resolver: zodResolver(validationSchema),
    defaultValues,
    mode: 'onChange'
  }) as UseFormReturn<FormData<T>>

  // Load draft on mount
  useEffect(() => {
    if (!enableDraftRecovery) return

    const draft = loadDraft<T>(storageKey)
    if (draft && !isDraftRecovered) {
      // Ask user if they want to recover draft
      const shouldRecover = window.confirm(
        'A draft was found for this form. Would you like to recover it?'
      )
      
      if (shouldRecover) {
        form.reset(draft)
        setIsDraftRecovered(true)
        setAutoSaveStatus(prev => ({ ...prev, hasUnsavedChanges: true }))
      } else {
        clearDraft(storageKey)
      }
    }
  }, [enableDraftRecovery, storageKey, form, isDraftRecovered])

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave) return

    let timeoutId: NodeJS.Timeout

    const subscription = form.watch((data) => {
      setAutoSaveStatus(prev => ({ ...prev, hasUnsavedChanges: true }))

      if (timeoutId) clearTimeout(timeoutId)

      timeoutId = setTimeout(async () => {
        try {
          setAutoSaveStatus(prev => ({ ...prev, isSaving: true, error: null }))

          // Save as draft
          if (enableDraftRecovery) {
            saveDraft(storageKey, data as FormData<T>)
          }

          // TODO: Implement server-side auto-save if needed
          // await autoSaveToServer(data)

          setAutoSaveStatus(prev => ({
            ...prev,
            isSaving: false,
            lastSaved: new Date(),
            hasUnsavedChanges: false
          }))
        } catch (error) {
          setAutoSaveStatus(prev => ({
            ...prev,
            isSaving: false,
            error: error as Error
          }))
        }
      }, autoSaveDelay)
    })

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [autoSave, autoSaveDelay, enableDraftRecovery, storageKey, form])

  // Form submission handler
  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit?.(data)
      
      // Clear draft on successful submission
      if (enableDraftRecovery) {
        clearDraft(storageKey)
      }
      
      setAutoSaveStatus(prev => ({
        ...prev,
        hasUnsavedChanges: false,
        lastSaved: new Date()
      }))
    } catch (error) {
      onError?.(error as Error)
    }
  })

  // Reset form with new data
  const resetWithData = useCallback((newData: Partial<FormData<T>>) => {
    const mergedData = { ...defaultValues, ...newData }
    form.reset(mergedData)
    setAutoSaveStatus(prev => ({ ...prev, hasUnsavedChanges: false }))
  }, [form, defaultValues])

  // Clear form
  const clearForm = useCallback(() => {
    form.reset(defaultValues)
    if (enableDraftRecovery) {
      clearDraft(storageKey)
    }
    setAutoSaveStatus(prev => ({ ...prev, hasUnsavedChanges: false }))
  }, [form, defaultValues, enableDraftRecovery, storageKey])

  // Save draft manually
  const saveDraftManually = useCallback(() => {
    if (!enableDraftRecovery) return

    const data = form.getValues()
    saveDraft(storageKey, data)
    setAutoSaveStatus(prev => ({ ...prev, lastSaved: new Date() }))
  }, [form, enableDraftRecovery, storageKey])

  // Check if form has errors
  const hasErrors = Object.keys(form.formState.errors).length > 0

  // Check if form is valid
  const isValid = form.formState.isValid

  // Check if form is dirty (has changes)
  const isDirty = form.formState.isDirty || autoSaveStatus.hasUnsavedChanges

  return {
    // Form instance
    form,
    
    // Form state
    formState: form.formState,
    errors: form.formState.errors,
    isValid,
    isDirty,
    hasErrors,
    isSubmitting: form.formState.isSubmitting,
    
    // Auto-save state
    autoSaveStatus,
    isDraftRecovered,
    
    // Methods
    handleSubmit,
    resetWithData,
    clearForm,
    saveDraftManually,
    
    // Field helpers
    register: form.register,
    control: form.control,
    watch: form.watch,
    setValue: form.setValue,
    getValues: form.getValues,
    trigger: form.trigger,
    clearErrors: form.clearErrors,
    setError: form.setError,
    
    // Validation helpers
    validateField: (fieldName: keyof FormData<T>) => form.trigger(fieldName as any),
    validateForm: () => form.trigger(),
    
    // Draft management
    hasDraft: () => loadDraft<T>(storageKey) !== null,
    clearDraft: () => clearDraft(storageKey),
  }
}

/**
 * Simplified hooks for specific use cases
 */
export function useCreateGoalForm(options: Omit<UseGoalFormOptions<'create'>, 'mode'>) {
  return useGoalForm({ ...options, mode: 'create' })
}

export function useEditGoalForm(options: Omit<UseGoalFormOptions<'edit'>, 'mode'>) {
  return useGoalForm({ ...options, mode: 'edit' })
}

/**
 * Export types
 */
export type { FormMode, CreateFormData, UpdateFormData, FormData, UseGoalFormOptions, AutoSaveStatus }