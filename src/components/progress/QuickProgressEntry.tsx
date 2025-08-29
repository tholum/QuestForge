/**
 * Quick Progress Entry Component
 * 
 * Mobile-optimized quick progress entry with preset percentages,
 * touch-friendly controls, and haptic feedback integration.
 */

import React from 'react'
import { Check, Plus, Zap, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useCreateProgress, type ProgressEntry } from '@/hooks/useProgress'
import { cn } from '@/lib/utils'

interface Goal {
  id: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  isCompleted: boolean
  currentProgress?: number
  maxValue?: number
}

interface IQuickProgressEntryProps {
  goal: Goal
  onProgressAdded?: (progress: ProgressEntry & { xpAwarded: number }) => void
  className?: string
  
  // Preset options
  presetPercentages?: number[]
  presetValues?: number[]
  
  // UI customization
  variant?: 'default' | 'compact' | 'card'
  showXPPreview?: boolean
  showCurrentProgress?: boolean
  
  // Mobile features
  hapticFeedback?: boolean
  quickCompleteEnabled?: boolean
}

const QuickProgressEntry: React.FC<IQuickProgressEntryProps> = ({
  goal,
  onProgressAdded,
  className,
  presetPercentages = [10, 25, 50, 75, 100],
  presetValues = [],
  variant = 'default',
  showXPPreview = true,
  showCurrentProgress = true,
  hapticFeedback = true,
  quickCompleteEnabled = true
}) => {
  const createProgress = useCreateProgress()
  const [selectedPreset, setSelectedPreset] = React.useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Calculate estimated XP for preview
  const calculateXP = (progressValue: number) => {
    const percentage = Math.min((progressValue / (goal.maxValue || 100)) * 100, 100)
    const baseXP = Math.floor(percentage / 10)
    const difficultyMultipliers = {
      easy: 1,
      medium: 1.5,
      hard: 2,
      expert: 3
    }
    const multiplier = difficultyMultipliers[goal.difficulty]
    const completionBonus = percentage >= 100 ? 50 : 0
    return Math.max(1, Math.floor(baseXP * multiplier) + completionBonus)
  }

  // Trigger haptic feedback if available
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!hapticFeedback) return
    
    // Check if running on mobile device with haptic support
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50]
      }
      navigator.vibrate(patterns[type])
    }
  }

  const handleProgressSubmit = async (value: number) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    triggerHaptic('medium')

    try {
      const progressData = {
        value,
        maxValue: goal.maxValue || 100,
        goalId: goal.id,
        userId: '', // Will be filled by API
        xpEarned: 0, // Will be calculated by API
        recordedAt: new Date(),
      }

      const result = await createProgress.mutateAsync(progressData)
      
      // Success haptic feedback
      triggerHaptic('heavy')
      
      onProgressAdded?.(result.data)
      setSelectedPreset(null)
    } catch (error) {
      console.error('Failed to submit progress:', error)
      // Error haptic feedback
      triggerHaptic('heavy')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickComplete = () => {
    handleProgressSubmit(goal.maxValue || 100)
  }

  const renderPresetButtons = () => {
    const presets = presetValues.length > 0 
      ? presetValues 
      : presetPercentages.map(p => (goal.maxValue || 100) * (p / 100))

    return (
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {presets.map((preset, index) => {
          const percentage = (preset / (goal.maxValue || 100)) * 100
          const isSelected = selectedPreset === preset
          const estimatedXP = showXPPreview ? calculateXP(preset) : 0
          
          return (
            <Button
              key={preset}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'relative h-16 flex flex-col items-center justify-center p-2 text-xs',
                'touch-manipulation active:scale-95 transition-transform',
                isSelected && 'ring-2 ring-primary ring-offset-2'
              )}
              onClick={() => {
                triggerHaptic('light')
                setSelectedPreset(preset)
              }}
              disabled={isSubmitting || goal.isCompleted}
            >
              <span className="font-semibold">
                {presetValues.length > 0 ? preset : `${percentage}%`}
              </span>
              {showXPPreview && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {estimatedXP}
                </span>
              )}
            </Button>
          )
        })}
      </div>
    )
  }

  const renderSubmitSection = () => {
    if (selectedPreset === null) return null

    const percentage = (selectedPreset / (goal.maxValue || 100)) * 100
    const estimatedXP = calculateXP(selectedPreset)
    const isCompletion = percentage >= 100

    return (
      <div className="space-y-3 pt-4 border-t">
        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground">
            Selected Progress
          </div>
          <div className="text-2xl font-bold text-primary">
            {presetValues.length > 0 ? selectedPreset : `${percentage.toFixed(1)}%`}
          </div>
          {showXPPreview && (
            <div className="flex items-center justify-center gap-1 text-sm">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>{estimatedXP} XP</span>
              {isCompletion && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  +50 Completion Bonus
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <Button
          onClick={() => handleProgressSubmit(selectedPreset)}
          disabled={isSubmitting}
          className="w-full h-12 text-base touch-manipulation active:scale-95 transition-transform"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              Recording...
            </>
          ) : (
            <>
              <Check className="w-5 h-5 mr-2" />
              Record Progress
            </>
          )}
        </Button>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate">{goal.title}</span>
          <Badge variant="outline" className="text-xs capitalize">
            {goal.difficulty}
          </Badge>
        </div>
        
        {showCurrentProgress && goal.currentProgress !== undefined && (
          <Progress value={(goal.currentProgress / (goal.maxValue || 100)) * 100} className="h-2" />
        )}
        
        {renderPresetButtons()}
        {renderSubmitSection()}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              <span className="font-medium">{goal.title}</span>
            </div>
            <Badge variant="outline" className="capitalize">
              {goal.difficulty}
            </Badge>
          </div>
          
          {showCurrentProgress && goal.currentProgress !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Progress</span>
                <span>{((goal.currentProgress / (goal.maxValue || 100)) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(goal.currentProgress / (goal.maxValue || 100)) * 100} />
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium mb-3">Add Progress</h4>
            {renderPresetButtons()}
          </div>
          
          {quickCompleteEnabled && !goal.isCompleted && (
            <div className="pt-3 border-t">
              <Button
                onClick={handleQuickComplete}
                disabled={isSubmitting}
                variant="outline"
                className="w-full touch-manipulation active:scale-95 transition-transform"
              >
                <Check className="w-4 h-4 mr-2" />
                Mark as Complete
              </Button>
            </div>
          )}
          
          {renderSubmitSection()}
        </CardContent>
      </Card>
    )
  }

  // Default variant
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{goal.title}</h3>
        <Badge variant="outline" className="capitalize">
          {goal.difficulty}
        </Badge>
      </div>
      
      {showCurrentProgress && goal.currentProgress !== undefined && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Current Progress</span>
            <span>{((goal.currentProgress / (goal.maxValue || 100)) * 100).toFixed(1)}%</span>
          </div>
          <Progress value={(goal.currentProgress / (goal.maxValue || 100)) * 100} className="h-3" />
        </div>
      )}
      
      <div>
        <h4 className="text-sm font-medium mb-3">Quick Progress Entry</h4>
        {renderPresetButtons()}
      </div>
      
      {quickCompleteEnabled && !goal.isCompleted && (
        <Button
          onClick={handleQuickComplete}
          disabled={isSubmitting}
          variant="outline"
          className="w-full touch-manipulation active:scale-95 transition-transform"
        >
          <Check className="w-4 h-4 mr-2" />
          Mark as Complete
        </Button>
      )}
      
      {renderSubmitSection()}
    </div>
  )
}

export default QuickProgressEntry