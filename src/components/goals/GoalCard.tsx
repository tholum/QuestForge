/**
 * GoalCard Component
 * 
 * Touch-friendly mobile goal card with progress visualization, quick actions,
 * and swipe gestures for mobile interaction.
 */

"use client"

import React from 'react'
import { 
  Calendar, 
  Clock, 
  Flame, 
  Target,
  CheckCircle2, 
  Circle,
  MoreVertical,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import { GoalWithRelations } from '@/lib/prisma/repositories/goal-repository'
import { TouchFriendlyCard } from '@/components/mobile/TouchFriendlyCard'
import { SwipeActions, SwipeAction } from '@/components/mobile/SwipeActions'
import { StatusBadge } from '@/components/base/StatusBadge'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { format, isAfter, isBefore, differenceInDays } from 'date-fns'

/**
 * Module configuration for display
 */
const MODULE_CONFIG = {
  fitness: { 
    icon: '💪', 
    label: 'Fitness', 
    color: 'text-orange-600', 
    bg: 'bg-orange-50',
    border: 'border-orange-200'
  },
  learning: { 
    icon: '📚', 
    label: 'Learning', 
    color: 'text-blue-600', 
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  home: { 
    icon: '🏠', 
    label: 'Home', 
    color: 'text-green-600', 
    bg: 'bg-green-50',
    border: 'border-green-200'
  },
  bible: { 
    icon: '✝️', 
    label: 'Bible', 
    color: 'text-purple-600', 
    bg: 'bg-purple-50',
    border: 'border-purple-200'
  },
  work: { 
    icon: '💼', 
    label: 'Work', 
    color: 'text-indigo-600', 
    bg: 'bg-indigo-50',
    border: 'border-indigo-200'
  }
} as const

/**
 * Priority configuration
 */
const PRIORITY_CONFIG = {
  low: { color: 'bg-gray-100 text-gray-700 border-gray-200' },
  medium: { color: 'bg-blue-100 text-blue-700 border-blue-200' },
  high: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  urgent: { color: 'bg-red-100 text-red-700 border-red-200' }
} as const

/**
 * Difficulty configuration
 */
const DIFFICULTY_CONFIG = {
  easy: { label: 'Easy', xp: '50 XP', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Medium', xp: '100 XP', color: 'bg-yellow-100 text-yellow-700' },
  hard: { label: 'Hard', xp: '200 XP', color: 'bg-orange-100 text-orange-700' },
  expert: { label: 'Expert', xp: '500 XP', color: 'bg-red-100 text-red-700' }
} as const

/**
 * Goal card props interface
 */
interface GoalCardProps {
  goal: GoalWithRelations
  onComplete?: (goalId: string) => void
  onEdit?: (goal: GoalWithRelations) => void
  onDelete?: (goalId: string) => void
  onView?: (goal: GoalWithRelations) => void
  className?: string
  enableSwipeActions?: boolean
  compact?: boolean
  showProgress?: boolean
}

/**
 * Calculate goal status from data
 */
function calculateGoalStatus(goal: GoalWithRelations): 'completed' | 'in_progress' | 'pending' | 'overdue' {
  if (goal.isCompleted) return 'completed'
  
  if (goal.targetDate) {
    const now = new Date()
    const target = new Date(goal.targetDate)
    
    if (isBefore(target, now)) {
      return 'overdue'
    }
  }
  
  // If there's progress data, consider it in progress
  if (goal.progress && goal.progress.length > 0) {
    return 'in_progress'
  }
  
  return 'pending'
}

/**
 * Calculate progress percentage
 */
function calculateProgressPercentage(goal: GoalWithRelations): number {
  if (goal.isCompleted) return 100
  
  if (!goal.progress || goal.progress.length === 0) return 0
  
  const latestProgress = goal.progress[0] // Assuming progress is sorted by date desc
  if (!latestProgress) return 0
  
  return Math.min(100, Math.max(0, (latestProgress.value / latestProgress.maxValue) * 100))
}

/**
 * Get time until due
 */
function getTimeUntilDue(targetDate: Date): { text: string; isOverdue: boolean; color: string } {
  const now = new Date()
  const daysDiff = differenceInDays(targetDate, now)
  
  if (daysDiff < 0) {
    return {
      text: `${Math.abs(daysDiff)} days overdue`,
      isOverdue: true,
      color: 'text-red-600'
    }
  } else if (daysDiff === 0) {
    return {
      text: 'Due today',
      isOverdue: false,
      color: 'text-amber-600'
    }
  } else if (daysDiff === 1) {
    return {
      text: 'Due tomorrow',
      isOverdue: false,
      color: 'text-amber-600'
    }
  } else if (daysDiff <= 7) {
    return {
      text: `Due in ${daysDiff} days`,
      isOverdue: false,
      color: 'text-orange-600'
    }
  } else {
    return {
      text: `Due in ${daysDiff} days`,
      isOverdue: false,
      color: 'text-muted-foreground'
    }
  }
}

/**
 * GoalCard component
 */
export function GoalCard({
  goal,
  onComplete,
  onEdit,
  onDelete,
  onView,
  className,
  enableSwipeActions = true,
  compact = false,
  showProgress = true
}: GoalCardProps) {
  const status = calculateGoalStatus(goal)
  const progressPercentage = calculateProgressPercentage(goal)
  const moduleConfig = MODULE_CONFIG[goal.moduleId as keyof typeof MODULE_CONFIG]
  const priorityConfig = PRIORITY_CONFIG[goal.priority as keyof typeof PRIORITY_CONFIG]
  const difficultyConfig = DIFFICULTY_CONFIG[goal.difficulty as keyof typeof DIFFICULTY_CONFIG]

  // Calculate streak display
  const streakCount = 0 // This would come from progress tracking
  
  // Time until due
  const timeUntilDue = goal.targetDate ? getTimeUntilDue(new Date(goal.targetDate)) : null

  // Swipe actions for mobile
  const swipeActions: { left: SwipeAction[], right: SwipeAction[] } = {
    left: status === 'completed' ? [] : [
      {
        id: 'complete',
        label: 'Complete',
        icon: CheckCircle2,
        color: 'bg-green-500',
        onAction: () => onComplete?.(goal.id)
      }
    ],
    right: [
      {
        id: 'edit',
        label: 'Edit',
        icon: Edit,
        color: 'bg-blue-500',
        onAction: () => onEdit?.(goal)
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: Trash2,
        color: 'bg-red-500',
        onAction: () => onDelete?.(goal.id)
      }
    ]
  }

  const cardContent = (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {moduleConfig && (
            <div className={cn(
              "p-2 rounded-lg flex-shrink-0",
              moduleConfig.bg,
              moduleConfig.border,
              "border"
            )}>
              <span className="text-lg" role="img" aria-label={moduleConfig.label}>
                {moduleConfig.icon}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-semibold truncate",
              compact ? "text-sm" : "text-base",
              status === 'completed' && "line-through text-muted-foreground"
            )}>
              {goal.title}
            </h3>
            {goal.description && !compact && (
              <p className="text-sm text-muted-foreground truncate mt-1">
                {goal.description}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          <StatusBadge status={status} size="sm" />
          
          {/* Desktop menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(goal)}>
                <Target className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {status !== 'completed' && (
                <DropdownMenuItem onClick={() => onComplete?.(goal.id)}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onEdit?.(goal)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete?.(goal.id)}
                className="text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Progress bar */}
      {showProgress && !compact && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2"
            aria-label={`Goal progress: ${Math.round(progressPercentage)}%`}
          />
        </div>
      )}

      {/* Sub-goals indicator */}
      {goal._count?.subGoals && goal._count.subGoals > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="w-4 h-4" />
          <span>{goal._count.subGoals} sub-goal{goal._count.subGoals !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 text-sm">
          {/* Target date */}
          {goal.targetDate && (
            <div className={cn(
              "flex items-center space-x-1",
              timeUntilDue?.color
            )}>
              <Calendar className="w-4 h-4" />
              <span className={cn(compact && "text-xs")}>
                {compact 
                  ? format(new Date(goal.targetDate), 'MMM d')
                  : timeUntilDue?.text
                }
              </span>
            </div>
          )}
          
          {/* Streak */}
          {streakCount > 0 && (
            <div className="flex items-center space-x-1 text-orange-600">
              <Flame className="w-4 h-4" />
              <span className={cn(compact && "text-xs")}>{streakCount}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Priority */}
          <Badge 
            variant="outline" 
            className={cn(
              "text-xs",
              priorityConfig.color,
              compact && "px-1 py-0 text-xs"
            )}
          >
            {goal.priority}
          </Badge>
          
          {/* XP reward */}
          {difficultyConfig && (
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs",
                compact && "px-1 py-0 text-xs"
              )}
            >
              {compact ? difficultyConfig.xp.split(' ')[0] : difficultyConfig.xp}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )

  if (enableSwipeActions) {
    return (
      <TouchFriendlyCard
        swipeActions={swipeActions}
        onClick={() => onView?.(goal)}
        className={cn("mb-3", className)}
        aria-label={`Goal: ${goal.title}`}
      >
        {cardContent}
      </TouchFriendlyCard>
    )
  }

  return (
    <div 
      className={cn(
        "p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer",
        className
      )}
      onClick={() => onView?.(goal)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onView?.(goal)
        }
      }}
      aria-label={`Goal: ${goal.title}`}
    >
      {cardContent}
    </div>
  )
}

export default GoalCard