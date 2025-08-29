/**
 * Progress Entry Form Component
 * 
 * Form for creating and editing progress entries with React Hook Form + Zod validation,
 * real-time progress visualization, and XP calculation preview.
 */

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Target, Zap, Calendar, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useCreateProgress, useUpdateProgress, type ProgressEntry } from '@/hooks/useProgress'
import { ProgressIndicator } from '@/components/base/ProgressIndicator'
import { cn } from '@/lib/utils'

// Form validation schema
const progressFormSchema = z.object({
  value: z.number()
    .min(0, 'Progress value cannot be negative')
    .max(10000, 'Progress value too large'),
  maxValue: z.number()
    .min(0.01, 'Maximum value must be positive')
    .max(10000, 'Maximum value too large'),
  notes: z.string()
    .max(500, 'Notes cannot exceed 500 characters')
    .optional(),
  recordedAt: z.string()
    .optional(),
})

type ProgressFormValues = z.infer<typeof progressFormSchema>

interface IProgressEntryFormProps {
  goalId: string
  goalTitle: string
  goalDifficulty: 'easy' | 'medium' | 'hard' | 'expert'
  existingProgress?: ProgressEntry
  onSuccess?: (progress: ProgressEntry) => void
  onCancel?: () => void
  className?: string
  
  // UI customization
  variant?: 'default' | 'compact' | 'mobile'
  showPreview?: boolean
  showXPCalculation?: boolean
  maxValuePresets?: number[]
}

const ProgressEntryForm: React.FC<IProgressEntryFormProps> = ({
  goalId,
  goalTitle,
  goalDifficulty,
  existingProgress,
  onSuccess,
  onCancel,
  className,
  variant = 'default',
  showPreview = true,
  showXPCalculation = true,
  maxValuePresets = [100, 1000, 10000]
}) => {
  const createProgress = useCreateProgress()
  const updateProgress = useUpdateProgress()
  const [useSlider, setUseSlider] = React.useState(false)

  const form = useForm<ProgressFormValues>({
    resolver: zodResolver(progressFormSchema),
    defaultValues: {
      value: existingProgress?.value || 0,
      maxValue: existingProgress?.maxValue || 100,
      notes: existingProgress?.notes || '',
      recordedAt: existingProgress?.recordedAt 
        ? new Date(existingProgress.recordedAt).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
    },
  })

  const { watch, setValue } = form
  const watchedValues = watch()
  
  // Calculate progress percentage and XP preview
  const percentage = React.useMemo(() => {
    return Math.min((watchedValues.value / watchedValues.maxValue) * 100, 100)
  }, [watchedValues.value, watchedValues.maxValue])

  const estimatedXP = React.useMemo(() => {
    const baseXP = Math.floor(percentage / 10)
    const difficultyMultipliers = {
      easy: 1,
      medium: 1.5,
      hard: 2,
      expert: 3
    }
    const multiplier = difficultyMultipliers[goalDifficulty]
    const completionBonus = percentage >= 100 ? 50 : 0
    return Math.max(1, Math.floor(baseXP * multiplier) + completionBonus)
  }, [percentage, goalDifficulty])

  const onSubmit = async (data: ProgressFormValues) => {
    try {
      const progressData = {
        value: data.value,
        maxValue: data.maxValue,
        notes: data.notes || undefined,
        recordedAt: data.recordedAt ? new Date(data.recordedAt) : new Date(),
        goalId,
        userId: '', // Will be filled by API from auth context
        xpEarned: 0, // Will be calculated by API
      }

      let result
      if (existingProgress) {
        result = await updateProgress.mutateAsync({
          id: existingProgress.id,
          data: {
            value: data.value,
            maxValue: data.maxValue,
            notes: data.notes,
            recordedAt: data.recordedAt ? new Date(data.recordedAt) : undefined,
          }
        })
        onSuccess?.(result.data)
      } else {
        result = await createProgress.mutateAsync(progressData)
        onSuccess?.(result.data)
      }
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  const isLoading = createProgress.isPending || updateProgress.isPending
  const isCompact = variant === 'compact'
  const isMobile = variant === 'mobile'

  return (
    <Card className={cn('w-full max-w-2xl', className)}>
      <CardHeader className={cn(isCompact && 'pb-4')}>
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <CardTitle className={cn('text-lg', isCompact && 'text-base')}>
            {existingProgress ? 'Update Progress' : 'Record Progress'}
          </CardTitle>
        </div>
        <CardDescription>
          Tracking progress for <strong>{goalTitle}</strong>
          <Badge variant="outline" className="ml-2 capitalize">
            {goalDifficulty}
          </Badge>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Progress Input Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Progress Value</h3>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={useSlider ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => setUseSlider(false)}
                  >
                    Input
                  </Button>
                  <Button
                    type="button"
                    variant={useSlider ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUseSlider(true)}
                  >
                    Slider
                  </Button>
                </div>
              </div>

              <div className={cn('grid gap-4', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Progress</FormLabel>
                      <FormControl>
                        {useSlider ? (
                          <div className="space-y-2">
                            <Slider
                              value={[field.value]}
                              onValueChange={([value]) => field.onChange(value)}
                              max={watchedValues.maxValue}
                              step={watchedValues.maxValue / 100}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>0</span>
                              <span>{field.value.toFixed(1)}</span>
                              <span>{watchedValues.maxValue}</span>
                            </div>
                          </div>
                        ) : (
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Value</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="100"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 100)}
                          />
                          <div className="flex gap-1">
                            {maxValuePresets.map((preset) => (
                              <Button
                                key={preset}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setValue('maxValue', preset)}
                                className="text-xs"
                              >
                                {preset}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>
                        Set the scale for this progress entry
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Progress Preview */}
            {showPreview && (
              <div className="space-y-3">
                <Separator />
                <div>
                  <h3 className="text-sm font-medium mb-3">Progress Preview</h3>
                  <ProgressIndicator
                    value={percentage}
                    max={100}
                    label="Current Progress"
                    showPercentage
                    showValue={false}
                    variant="gamified"
                    size="lg"
                    animation="glow"
                  />
                </div>
              </div>
            )}

            {/* XP Preview */}
            {showXPCalculation && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Estimated XP Reward</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-primary">
                    {estimatedXP} XP
                  </span>
                  {percentage >= 100 && (
                    <Badge variant="secondary" className="text-xs">
                      +50 Completion Bonus
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {goalDifficulty} difficulty and {percentage.toFixed(1)}% completion
                </p>
              </div>
            )}

            {/* Optional Fields */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="recordedAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Recorded At
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      When was this progress achieved?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Notes (Optional)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any notes about this progress..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value ? `${field.value.length}/500 characters` : '0/500 characters'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className={cn(
              'flex gap-2 pt-4',
              isMobile ? 'flex-col' : 'flex-row justify-end'
            )}>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className={cn(isMobile && 'w-full')}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className={cn(isMobile && 'w-full')}
              >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {existingProgress ? 'Update Progress' : 'Record Progress'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

export default ProgressEntryForm