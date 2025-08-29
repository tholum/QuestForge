import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { 
  CheckCircle2, 
  Target, 
  Zap, 
  Trophy, 
  Star, 
  Flame,
  TrendingUp,
  Award
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"

const progressIndicatorVariants = cva(
  "relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "",
        success: "",
        warning: "",
        danger: "",
        gamified: "bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4",
      },
      size: {
        sm: "text-sm",
        default: "text-base",
        lg: "text-lg",
        xl: "text-xl",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        glow: "animate-pulse shadow-lg shadow-blue-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
)

const progressBarVariants = cva(
  "transition-all duration-500 ease-out",
  {
    variants: {
      variant: {
        default: "[&>[data-state=complete-indicator]]:bg-primary",
        success: "[&>[data-state=complete-indicator]]:bg-green-500",
        warning: "[&>[data-state=complete-indicator]]:bg-yellow-500",
        danger: "[&>[data-state=complete-indicator]]:bg-red-500",
        gamified: "[&>[data-state=complete-indicator]]:bg-gradient-to-r [&>[data-state=complete-indicator]]:from-purple-500 [&>[data-state=complete-indicator]]:to-blue-500",
      },
      height: {
        xs: "h-1",
        sm: "h-2",
        default: "h-3",
        lg: "h-4",
        xl: "h-6",
      },
    },
    defaultVariants: {
      variant: "default",
      height: "default",
    },
  }
)

export interface IProgressIndicatorProps extends
  React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof progressIndicatorVariants> {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  showValue?: boolean
  
  // Gamification props
  level?: number
  xp?: number
  nextLevelXp?: number
  streak?: number
  achievements?: number
  showGamification?: boolean
  
  // Animation props
  animateOnMount?: boolean
  celebrateOnComplete?: boolean
  
  // Visual customization
  color?: string
  gradient?: boolean
  showMilestones?: boolean
  milestones?: Array<{
    value: number
    label: string
    icon?: React.ReactNode
  }>
  
  // Progress bar customization
  barHeight?: VariantProps<typeof progressBarVariants>["height"]
  rounded?: boolean
}

const ProgressIndicator = React.forwardRef<HTMLDivElement, IProgressIndicatorProps>(
  ({
    className,
    variant,
    size,
    animation,
    value,
    max = 100,
    label,
    showPercentage = true,
    showValue = false,
    level,
    xp,
    nextLevelXp,
    streak,
    achievements,
    showGamification = false,
    animateOnMount = false,
    celebrateOnComplete = false,
    color,
    gradient = false,
    showMilestones = false,
    milestones = [],
    barHeight = "default",
    rounded = true,
    ...props
  }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(animateOnMount ? 0 : value)
    const [isComplete, setIsComplete] = React.useState(false)
    const [showCelebration, setShowCelebration] = React.useState(false)

    const percentage = Math.min((value / max) * 100, 100)
    const isCompleted = percentage >= 100

    // Animate progress on mount or value change
    React.useEffect(() => {
      const timer = setTimeout(() => {
        setDisplayValue(value)
      }, animateOnMount ? 100 : 0)

      return () => clearTimeout(timer)
    }, [value, animateOnMount])

    // Handle completion celebration
    React.useEffect(() => {
      if (celebrateOnComplete && isCompleted && !isComplete) {
        setIsComplete(true)
        setShowCelebration(true)
        const timer = setTimeout(() => setShowCelebration(false), 2000)
        return () => clearTimeout(timer)
      }
    }, [isCompleted, isComplete, celebrateOnComplete])

    // Calculate gamification values
    const currentLevelProgress = React.useMemo(() => {
      if (!showGamification || !xp || !nextLevelXp) return 0
      return Math.min((xp / nextLevelXp) * 100, 100)
    }, [xp, nextLevelXp, showGamification])

    const displayPercentage = Math.min((displayValue / max) * 100, 100)

    return (
      <div
        ref={ref}
        className={cn(
          progressIndicatorVariants({ variant, size, animation }),
          showCelebration && "animate-pulse",
          className
        )}
        {...props}
      >
        {/* Header with label and stats */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {label && (
              <span className="font-medium text-foreground">
                {label}
              </span>
            )}
            {isCompleted && (
              <CheckCircle2 className="w-4 h-4 text-green-500 animate-bounce" />
            )}
          </div>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {showValue && (
              <span className="font-medium">
                {Math.round(displayValue)} / {max}
              </span>
            )}
            {showPercentage && (
              <span className="font-medium">
                {Math.round(displayPercentage)}%
              </span>
            )}
          </div>
        </div>

        {/* Main Progress Bar */}
        <div className="relative">
          <Progress
            value={displayPercentage}
            className={cn(
              progressBarVariants({ variant, height: barHeight }),
              rounded ? "rounded-full" : "rounded-none",
              gradient && "bg-gradient-to-r from-purple-500 to-blue-500"
            )}
          />
          
          {/* Milestones */}
          {showMilestones && milestones.length > 0 && (
            <div className="absolute inset-0 flex items-center">
              {milestones.map((milestone, index) => {
                const milestonePosition = (milestone.value / max) * 100
                const isReached = displayValue >= milestone.value
                
                return (
                  <div
                    key={index}
                    className="absolute flex flex-col items-center transform -translate-x-1/2"
                    style={{ left: `${milestonePosition}%` }}
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full border-2 border-background transition-colors",
                        isReached ? "bg-green-500" : "bg-muted"
                      )}
                    />
                    <span className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
                      {milestone.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Gamification Section */}
        {showGamification && (
          <div className="mt-4 space-y-3">
            {/* Level and XP */}
            {level !== undefined && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">Level {level}</span>
                </div>
                
                {xp !== undefined && nextLevelXp && (
                  <div className="text-xs text-muted-foreground">
                    {xp} / {nextLevelXp} XP
                  </div>
                )}
              </div>
            )}

            {/* XP Progress Bar */}
            {xp !== undefined && nextLevelXp && (
              <div className="space-y-1">
                <Progress 
                  value={currentLevelProgress} 
                  className="h-2 bg-gradient-to-r from-yellow-200 to-orange-200 dark:from-yellow-900 dark:to-orange-900"
                />
              </div>
            )}

            {/* Streak and Achievements */}
            <div className="flex items-center gap-4 text-sm">
              {streak !== undefined && (
                <div className="flex items-center gap-1 text-orange-600">
                  <Flame className="w-4 h-4" />
                  <span className="font-medium">{streak}</span>
                  <span className="text-muted-foreground">streak</span>
                </div>
              )}
              
              {achievements !== undefined && (
                <div className="flex items-center gap-1 text-purple-600">
                  <Award className="w-4 h-4" />
                  <span className="font-medium">{achievements}</span>
                  <span className="text-muted-foreground">achievements</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Celebration Animation */}
        {showCelebration && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full animate-bounce">
              <Star className="w-5 h-5 fill-current" />
              <span className="font-bold">Complete!</span>
              <Star className="w-5 h-5 fill-current" />
            </div>
          </div>
        )}
      </div>
    )
  }
)

ProgressIndicator.displayName = "ProgressIndicator"

// Helper component for circular progress
export const CircularProgress: React.FC<{
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  showPercentage?: boolean
  color?: string
  className?: string
}> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  showPercentage = true,
  color = "hsl(var(--primary))",
  className
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const percentage = Math.min((value / max) * 100, 100)
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  )
}

export { ProgressIndicator, progressIndicatorVariants }