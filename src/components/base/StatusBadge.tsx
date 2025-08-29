import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Pause, 
  Play, 
  Target,
  Zap,
  Calendar
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 font-medium transition-all duration-200",
  {
    variants: {
      status: {
        // Goal statuses
        active: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
        completed: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
        paused: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
        cancelled: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
        pending: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800",
        overdue: "bg-red-100 text-red-800 border-red-200 animate-pulse dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
        
        // Priority levels
        low: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
        medium: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
        high: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
        critical: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
        
        // Progress states
        notStarted: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800",
        inProgress: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
        review: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
        
        // Gamification statuses
        streak: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
        achievement: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
        levelUp: "bg-purple-100 text-purple-700 border-purple-200 animate-pulse dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800",
      },
      size: {
        xs: "text-xs px-1.5 py-0.5 min-h-5",
        sm: "text-xs px-2 py-1 min-h-6",
        default: "text-sm px-2.5 py-1 min-h-7",
        lg: "text-sm px-3 py-1.5 min-h-8",
      },
      variant: {
        default: "border",
        solid: "border-transparent",
        outline: "bg-transparent border",
        ghost: "bg-transparent border-transparent",
      },
      rounded: {
        default: "rounded-md",
        sm: "rounded-sm",
        lg: "rounded-lg",
        full: "rounded-full",
        none: "rounded-none",
      },
    },
    defaultVariants: {
      status: "active",
      size: "default",
      variant: "default",
      rounded: "default",
    },
  }
)

const statusIcons = {
  // Goal statuses
  active: Play,
  completed: CheckCircle2,
  paused: Pause,
  cancelled: XCircle,
  pending: Clock,
  overdue: AlertCircle,
  
  // Priority levels
  low: Target,
  medium: Target,
  high: Target,
  critical: AlertCircle,
  
  // Progress states
  notStarted: Clock,
  inProgress: Play,
  review: AlertCircle,
  
  // Gamification
  streak: Zap,
  achievement: Target,
  levelUp: Zap,
} as const

const statusLabels = {
  // Goal statuses
  active: "Active",
  completed: "Completed",
  paused: "Paused",
  cancelled: "Cancelled",
  pending: "Pending",
  overdue: "Overdue",
  
  // Priority levels
  low: "Low Priority",
  medium: "Medium Priority",
  high: "High Priority",
  critical: "Critical",
  
  // Progress states
  notStarted: "Not Started",
  inProgress: "In Progress",
  review: "In Review",
  
  // Gamification
  streak: "Streak",
  achievement: "Achievement",
  levelUp: "Level Up!",
} as const

export interface IStatusBadgeProps extends
  React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof statusBadgeVariants> {
  customLabel?: string
  showIcon?: boolean
  customIcon?: React.ReactNode
  pulse?: boolean
  count?: number
  tooltip?: string
}

const StatusBadge = React.forwardRef<HTMLDivElement, IStatusBadgeProps>(
  ({
    className,
    status = "active",
    size,
    variant,
    rounded,
    customLabel,
    showIcon = true,
    customIcon,
    pulse = false,
    count,
    tooltip,
    ...props
  }, ref) => {
    const IconComponent = statusIcons[status as keyof typeof statusIcons]
    const defaultLabel = statusLabels[status as keyof typeof statusLabels]
    const label = customLabel || defaultLabel

    const badgeContent = (
      <>
        {showIcon && (customIcon || (IconComponent && <IconComponent className="w-3 h-3" />))}
        <span className="truncate">
          {label}
          {count !== undefined && ` (${count})`}
        </span>
      </>
    )

    return (
      <Badge
        ref={ref}
        variant="outline"
        title={tooltip}
        className={cn(
          statusBadgeVariants({ status, size, variant, rounded }),
          pulse && "animate-pulse",
          status === "overdue" && "animate-pulse",
          status === "levelUp" && "animate-pulse",
          className
        )}
        {...props}
      >
        {badgeContent}
      </Badge>
    )
  }
)

StatusBadge.displayName = "StatusBadge"

// Helper function to get status from goal state
export const getGoalStatus = (goal: {
  isCompleted?: boolean
  isPaused?: boolean
  isCancelled?: boolean
  dueDate?: Date | string | null
  startDate?: Date | string | null
}): keyof typeof statusLabels => {
  if (goal.isCancelled) return "cancelled"
  if (goal.isCompleted) return "completed"
  if (goal.isPaused) return "paused"
  
  const now = new Date()
  const dueDate = goal.dueDate ? new Date(goal.dueDate) : null
  const startDate = goal.startDate ? new Date(goal.startDate) : null
  
  if (dueDate && now > dueDate) return "overdue"
  if (startDate && now < startDate) return "pending"
  
  return "active"
}

// Helper function to get priority status
export const getPriorityStatus = (priority: string | number): keyof typeof statusLabels => {
  if (typeof priority === "string") {
    const lowerPriority = priority.toLowerCase()
    if (lowerPriority.includes("critical") || lowerPriority.includes("urgent")) return "critical"
    if (lowerPriority.includes("high")) return "high"
    if (lowerPriority.includes("medium") || lowerPriority.includes("normal")) return "medium"
    return "low"
  }
  
  // Numeric priority (1-4 scale)
  if (priority >= 4) return "critical"
  if (priority >= 3) return "high"
  if (priority >= 2) return "medium"
  return "low"
}

// Helper function to get progress status
export const getProgressStatus = (progress: number): keyof typeof statusLabels => {
  if (progress === 0) return "notStarted"
  if (progress >= 100) return "completed"
  return "inProgress"
}

export { StatusBadge, statusBadgeVariants, statusLabels, statusIcons }