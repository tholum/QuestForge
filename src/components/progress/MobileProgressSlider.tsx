/**
 * Mobile Progress Slider Component
 * 
 * Touch-optimized progress input with gesture support, haptic feedback,
 * and real-time XP calculation preview.
 */

import React from 'react'
import { Zap, Target, Check, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { useCreateProgress, type ProgressEntry } from '@/hooks/useProgress'
import { cn } from '@/lib/utils'

interface IMobileProgressSliderProps {
  goalId: string
  goalTitle: string
  goalDifficulty: 'easy' | 'medium' | 'hard' | 'expert'
  currentProgress?: number
  maxValue?: number
  onProgressAdded?: (progress: ProgressEntry & { xpAwarded: number }) => void
  onCancel?: () => void
  className?: string
  
  // Slider configuration
  step?: number
  precision?: number
  showMarks?: boolean
  marks?: Array<{ value: number; label: string }>
  
  // UI features
  showXPPreview?: boolean
  showPercentage?: boolean
  hapticFeedback?: boolean
  gestureEnabled?: boolean
  
  // Visual customization
  sliderColor?: string
  thumbSize?: 'sm' | 'md' | 'lg'
}

const MobileProgressSlider: React.FC<IMobileProgressSliderProps> = ({
  goalId,
  goalTitle,
  goalDifficulty,
  currentProgress = 0,
  maxValue = 100,
  onProgressAdded,
  onCancel,
  className,
  step = 1,
  precision = 1,
  showMarks = true,
  marks,
  showXPPreview = true,
  showPercentage = true,
  hapticFeedback = true,
  gestureEnabled = true,
  sliderColor = 'hsl(var(--primary))',
  thumbSize = 'lg'
}) => {
  const createProgress = useCreateProgress()
  const [value, setValue] = React.useState(currentProgress)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const sliderRef = React.useRef<HTMLDivElement>(null)
  const thumbRef = React.useRef<HTMLDivElement>(null)

  // Touch/gesture handling
  const [touchStart, setTouchStart] = React.useState<{ x: number; y: number } | null>(null)
  const [lastTouchValue, setLastTouchValue] = React.useState(value)

  // Calculate derived values
  const percentage = Math.min((value / maxValue) * 100, 100)
  const isComplete = percentage >= 100
  const hasChanged = value !== currentProgress

  // XP calculation
  const calculateXP = React.useCallback(() => {
    const baseXP = Math.floor(percentage / 10)
    const difficultyMultipliers = {
      easy: 1,
      medium: 1.5,
      hard: 2,
      expert: 3
    }
    const multiplier = difficultyMultipliers[goalDifficulty]
    const completionBonus = isComplete ? 50 : 0
    return Math.max(1, Math.floor(baseXP * multiplier) + completionBonus)
  }, [percentage, goalDifficulty, isComplete])

  const estimatedXP = calculateXP()

  // Haptic feedback
  const triggerHaptic = React.useCallback((intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!hapticFeedback || !('vibrate' in navigator)) return
    
    const patterns = {
      light: [5],
      medium: [10],
      heavy: [25]
    }
    navigator.vibrate(patterns[intensity])
  }, [hapticFeedback])

  // Default marks for common percentages
  const defaultMarks = React.useMemo(() => [
    { value: 0, label: '0%' },
    { value: maxValue * 0.25, label: '25%' },
    { value: maxValue * 0.5, label: '50%' },
    { value: maxValue * 0.75, label: '75%' },
    { value: maxValue, label: '100%' }
  ], [maxValue])

  const sliderMarks = marks || (showMarks ? defaultMarks : [])

  // Handle slider interaction
  const handleSliderChange = React.useCallback((newValue: number) => {
    const clampedValue = Math.max(0, Math.min(maxValue, newValue))
    const steppedValue = Math.round(clampedValue / step) * step
    const preciseValue = Math.round(steppedValue * Math.pow(10, precision)) / Math.pow(10, precision)
    
    setValue(preciseValue)
    
    // Haptic feedback on significant changes
    if (Math.abs(preciseValue - lastTouchValue) >= maxValue * 0.1) {
      triggerHaptic('light')
      setLastTouchValue(preciseValue)
    }
  }, [maxValue, step, precision, triggerHaptic, lastTouchValue])

  // Touch event handlers
  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    if (!gestureEnabled || !sliderRef.current) return
    
    const touch = e.touches[0]
    const rect = sliderRef.current.getBoundingClientRect()
    const touchX = touch.clientX - rect.left
    const touchY = touch.clientY - rect.top
    
    setTouchStart({ x: touchX, y: touchY })
    setIsDragging(true)
    triggerHaptic('medium')
    
    // Calculate initial value from touch position
    const percentage = Math.max(0, Math.min(1, touchX / rect.width))
    handleSliderChange(percentage * maxValue)
  }, [gestureEnabled, triggerHaptic, handleSliderChange, maxValue])

  const handleTouchMove = React.useCallback((e: React.TouchEvent) => {
    if (!isDragging || !gestureEnabled || !sliderRef.current || !touchStart) return
    
    e.preventDefault()
    const touch = e.touches[0]
    const rect = sliderRef.current.getBoundingClientRect()
    const touchX = touch.clientX - rect.left
    
    const percentage = Math.max(0, Math.min(1, touchX / rect.width))
    handleSliderChange(percentage * maxValue)
  }, [isDragging, gestureEnabled, touchStart, handleSliderChange, maxValue])

  const handleTouchEnd = React.useCallback(() => {
    setIsDragging(false)
    setTouchStart(null)
    triggerHaptic('light')
  }, [triggerHaptic])

  // Submit progress
  const handleSubmit = async () => {
    if (!hasChanged || isSubmitting) return
    
    setIsSubmitting(true)
    triggerHaptic('heavy')

    try {
      const progressData = {
        value,
        maxValue,
        goalId,
        userId: '', // Will be filled by API
        xpEarned: 0, // Will be calculated by API
        recordedAt: new Date(),
      }

      const result = await createProgress.mutateAsync(progressData)
      onProgressAdded?.(result.data)
      triggerHaptic('heavy')
    } catch (error) {
      console.error('Failed to submit progress:', error)
      triggerHaptic('heavy')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset to current progress
  const handleReset = () => {
    setValue(currentProgress)
    triggerHaptic('light')
  }

  const thumbSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-4 h-4" />
            Progress Entry
          </CardTitle>
          <Badge variant="outline" className="capitalize text-xs">
            {goalDifficulty}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{goalTitle}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Progress Display */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold text-primary">
            {showPercentage ? `${percentage.toFixed(1)}%` : value.toFixed(precision)}
          </div>
          <div className="text-sm text-muted-foreground">
            {value.toFixed(precision)} / {maxValue}
          </div>
        </div>

        {/* Custom Slider */}
        <div className="relative px-2">
          <div
            ref={sliderRef}
            className="relative h-8 bg-muted rounded-full cursor-pointer touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Progress track */}
            <div
              className="absolute top-1/2 left-0 h-2 bg-primary rounded-full transform -translate-y-1/2 transition-all duration-200"
              style={{
                width: `${percentage}%`,
                backgroundColor: sliderColor
              }}
            />
            
            {/* Thumb */}
            <div
              ref={thumbRef}
              className={cn(
                'absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2',
                'bg-background border-2 border-primary rounded-full shadow-lg',
                'transition-all duration-200 touch-manipulation',
                thumbSizeClasses[thumbSize],
                isDragging && 'scale-110 shadow-xl'
              )}
              style={{
                left: `${percentage}%`,
                borderColor: sliderColor
              }}
            />
            
            {/* Marks */}
            {sliderMarks.map((mark, index) => {
              const markPercentage = (mark.value / maxValue) * 100
              const isActive = value >= mark.value
              
              return (
                <div key={index}>
                  {/* Mark dot */}
                  <div
                    className={cn(
                      'absolute top-1/2 w-2 h-2 rounded-full transform -translate-y-1/2 -translate-x-1/2',
                      isActive ? 'bg-primary' : 'bg-muted-foreground'
                    )}
                    style={{ left: `${markPercentage}%` }}
                  />
                  
                  {/* Mark label */}
                  <div
                    className="absolute top-full mt-2 text-xs text-muted-foreground transform -translate-x-1/2"
                    style={{ left: `${markPercentage}%` }}
                  >
                    {mark.label}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* XP Preview */}
        {showXPPreview && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Estimated XP</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary">
                  {estimatedXP} XP
                </span>
                {isComplete && (
                  <Badge variant="secondary" className="text-xs">
                    +50 Bonus
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{percentage.toFixed(1)}%</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2">
          {hasChanged && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSubmitting}
              className="flex items-center gap-2 touch-manipulation active:scale-95 transition-transform"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          )}
          
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 touch-manipulation active:scale-95 transition-transform"
            >
              Cancel
            </Button>
          )}
          
          <Button
            onClick={handleSubmit}
            disabled={!hasChanged || isSubmitting}
            className="flex-1 touch-manipulation active:scale-95 transition-transform"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Recording...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Record Progress
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default MobileProgressSlider