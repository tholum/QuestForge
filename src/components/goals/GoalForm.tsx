/**
 * GoalForm Component
 * 
 * Comprehensive goal creation and editing form with validation, rich editing capabilities,
 * auto-save functionality, and accessibility compliance.
 */

"use client"

import React, { useState, useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { Calendar, Target, Clock, Flame, BookOpen, AlertTriangle, Save, X } from 'lucide-react'
import { useCreateGoalForm, useEditGoalForm, type FormMode } from '@/hooks/useGoalForm'
import { GoalWithRelations } from '@/lib/prisma/repositories/goal-repository'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from '@/components/ui/form'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

/**
 * Form props interface
 */
interface GoalFormProps {
  mode: FormMode
  initialData?: GoalWithRelations
  onSubmit: (data: any) => Promise<void>
  onCancel?: () => void
  className?: string
  autoSave?: boolean
  enableDraftRecovery?: boolean
}

/**
 * Module options (this would typically come from an API)
 */
const MODULE_OPTIONS = [
  { id: 'fitness', name: 'Fitness', icon: '💪', color: 'text-orange-600', bg: 'bg-orange-50' },
  { id: 'learning', name: 'Learning', icon: '📚', color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'home', name: 'Home Projects', icon: '🏠', color: 'text-green-600', bg: 'bg-green-50' },
  { id: 'bible', name: 'Bible Study', icon: '✝️', color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'work', name: 'Work', icon: '💼', color: 'text-indigo-600', bg: 'bg-indigo-50' },
]

/**
 * Difficulty configuration
 */
const DIFFICULTY_CONFIG = {
  easy: { 
    label: 'Easy', 
    description: 'Simple task, low complexity',
    color: 'bg-green-100 text-green-800',
    xpMultiplier: '1x'
  },
  medium: { 
    label: 'Medium', 
    description: 'Moderate complexity and effort',
    color: 'bg-yellow-100 text-yellow-800',
    xpMultiplier: '1.5x'
  },
  hard: { 
    label: 'Hard', 
    description: 'Complex task requiring focus',
    color: 'bg-orange-100 text-orange-800',
    xpMultiplier: '2x'
  },
  expert: { 
    label: 'Expert', 
    description: 'Highly complex, challenging task',
    color: 'bg-red-100 text-red-800',
    xpMultiplier: '3x'
  }
}

/**
 * Priority configuration
 */
const PRIORITY_CONFIG = {
  low: { 
    label: 'Low', 
    description: 'Nice to have, flexible timing',
    color: 'bg-gray-100 text-gray-800',
    icon: '⬇️'
  },
  medium: { 
    label: 'Medium', 
    description: 'Important but not urgent',
    color: 'bg-blue-100 text-blue-800',
    icon: '➡️'
  },
  high: { 
    label: 'High', 
    description: 'Important and time-sensitive',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⬆️'
  },
  urgent: { 
    label: 'Urgent', 
    description: 'Critical, immediate attention',
    color: 'bg-red-100 text-red-800',
    icon: '🚨'
  }
}

/**
 * Main GoalForm component
 */
export function GoalForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  className,
  autoSave = false,
  enableDraftRecovery = true
}: GoalFormProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Use appropriate hook based on mode
  const formHook = mode === 'create' 
    ? useCreateGoalForm({
        onSubmit: handleFormSubmit,
        onError: (error) => setSubmitError(error.message),
        autoSave,
        enableDraftRecovery
      })
    : useEditGoalForm({
        initialData,
        onSubmit: handleFormSubmit,
        onError: (error) => setSubmitError(error.message),
        autoSave,
        enableDraftRecovery
      })

  const {
    form,
    handleSubmit,
    isSubmitting,
    autoSaveStatus,
    isDraftRecovered
  } = formHook

  async function handleFormSubmit(data: any) {
    setSubmitError(null)
    try {
      await onSubmit(data)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred')
      throw error
    }
  }

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {mode === 'create' ? 'Create New Goal' : 'Edit Goal'}
            </CardTitle>
            {isDraftRecovered && (
              <Alert className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your draft has been recovered. Continue editing or save to keep your changes.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          {autoSave && (
            <div className="flex items-center gap-2 text-sm">
              {autoSaveStatus.isSaving && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </div>
              )}
              {autoSaveStatus.lastSaved && !autoSaveStatus.isSaving && (
                <div className="text-muted-foreground">
                  Saved {format(autoSaveStatus.lastSaved, 'HH:mm')}
                </div>
              )}
              {autoSaveStatus.hasUnsavedChanges && !autoSaveStatus.isSaving && (
                <div className="text-amber-600">Unsaved changes</div>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Title Field */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Goal Title *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="What do you want to accomplish?"
                      className="h-12 text-base"
                      autoFocus
                      disabled={isSubmitting}
                      maxLength={200}
                    />
                  </FormControl>
                  <FormDescription>
                    Be specific and clear about what you want to achieve
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your goal in more detail..."
                      className="min-h-[100px] text-base resize-vertical"
                      disabled={isSubmitting}
                      maxLength={1000}
                    />
                  </FormControl>
                  <FormDescription>
                    Add context, steps, or any details that will help you achieve this goal
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Module Selection */}
            <FormField
              control={form.control}
              name="moduleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Category *
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                    <FormControl>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select a category for your goal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MODULE_OPTIONS.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{module.icon}</span>
                            <span>{module.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose the life area this goal belongs to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Priority Selection */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Priority
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Set priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-3">
                              <span>{config.icon}</span>
                              <div>
                                <div className="font-medium">{config.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {config.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Difficulty Selection */}
              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Difficulty
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Set difficulty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-3">
                              <Badge className={cn("text-xs", config.color)}>
                                {config.xpMultiplier} XP
                              </Badge>
                              <div>
                                <div className="font-medium">{config.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {config.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Difficulty affects XP rewards when completed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Target Date */}
            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Target Date
                  </FormLabel>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-12 pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isSubmitting}
                        >
                          {field.value ? (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {format(field.value, 'PPP')}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>Select target date</span>
                            </div>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date)
                          setIsDatePickerOpen(false)
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Optional: When do you want to complete this goal?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Error */}
            {submitError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex items-center gap-4">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
                
                {autoSave && autoSaveStatus.error && (
                  <div className="text-sm text-red-600">
                    Auto-save failed: {autoSaveStatus.error.message}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {mode === 'create' ? 'Create Goal' : 'Update Goal'}
                  </div>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default GoalForm