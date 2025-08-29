import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { MoreHorizontal, TrendingUp, TrendingDown, Target, Calendar } from "lucide-react"

import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "./Button"

const dataCardVariants = cva(
  "relative overflow-hidden transition-all duration-200 hover:shadow-md",
  {
    variants: {
      variant: {
        default: "border-border",
        primary: "border-primary/20 bg-primary/5",
        success: "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30",
        warning: "border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30",
        danger: "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
        info: "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30",
      },
      size: {
        sm: "p-3",
        default: "p-4",
        lg: "p-6",
      },
      interactive: {
        true: "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      interactive: false,
    },
  }
)

export interface IDataCardProps extends
  React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof dataCardVariants> {
  title: string
  description?: string
  value?: string | number
  subtitle?: string
  progress?: number
  progressLabel?: string
  badge?: {
    text: string
    variant?: "default" | "secondary" | "success" | "warning" | "destructive"
  }
  trend?: {
    direction: "up" | "down"
    value: string | number
    label?: string
  }
  metadata?: Array<{
    icon?: React.ReactNode
    label: string
    value: string
  }>
  actions?: Array<{
    label: string
    icon?: React.ReactNode
    onClick: () => void
    variant?: "default" | "secondary" | "ghost"
  }>
  showMenu?: boolean
  onMenuClick?: () => void
  loading?: boolean
  error?: string
}

const DataCard = React.forwardRef<HTMLDivElement, IDataCardProps>(
  ({
    className,
    variant,
    size,
    interactive,
    title,
    description,
    value,
    subtitle,
    progress,
    progressLabel,
    badge,
    trend,
    metadata,
    actions,
    showMenu = false,
    onMenuClick,
    loading = false,
    error,
    onClick,
    ...props
  }, ref) => {
    const TrendIcon = trend?.direction === "up" ? TrendingUp : TrendingDown
    const trendColor = trend?.direction === "up" ? "text-green-600" : "text-red-600"

    if (loading) {
      return (
        <Card ref={ref} className={cn(dataCardVariants({ variant, size, interactive: false }), className)}>
          <CardHeader className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent className="animate-pulse space-y-2">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-2 bg-muted rounded"></div>
          </CardContent>
        </Card>
      )
    }

    if (error) {
      return (
        <Card ref={ref} className={cn(dataCardVariants({ variant: "danger", size, interactive: false }), className)}>
          <CardContent className="flex items-center justify-center p-6 text-red-600">
            <div className="text-center">
              <div className="text-sm font-medium">Error loading data</div>
              <div className="text-xs opacity-70 mt-1">{error}</div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card
        ref={ref}
        className={cn(dataCardVariants({ variant, size, interactive }), className)}
        onClick={onClick}
        {...props}
      >
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium truncate">
                {title}
              </CardTitle>
              {badge && (
                <Badge variant={badge.variant} className="text-xs">
                  {badge.text}
                </Badge>
              )}
            </div>
            {description && (
              <CardDescription className="text-xs">
                {description}
              </CardDescription>
            )}
          </div>
          
          {showMenu && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
                onMenuClick?.()
              }}
              className="shrink-0"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Main Value Display */}
          {value !== undefined && (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold tracking-tight">
                  {value}
                </div>
                {subtitle && (
                  <div className="text-xs text-muted-foreground">
                    {subtitle}
                  </div>
                )}
              </div>
              
              {trend && (
                <div className={cn("flex items-center gap-1 text-sm", trendColor)}>
                  <TrendIcon className="w-4 h-4" />
                  <span className="font-medium">{trend.value}</span>
                  {trend.label && (
                    <span className="text-xs opacity-70">{trend.label}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Progress Display */}
          {progress !== undefined && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {progressLabel || "Progress"}
                </span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Metadata */}
          {metadata && metadata.length > 0 && (
            <div className="grid grid-cols-1 gap-2 text-sm">
              {metadata.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-muted-foreground">
                  {item.icon}
                  <span className="text-xs">{item.label}:</span>
                  <span className="font-medium text-foreground ml-auto">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          {actions && actions.length > 0 && (
            <div className="flex gap-2 pt-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "secondary"}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    action.onClick()
                  }}
                  leftIcon={action.icon}
                  className="flex-1"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)

DataCard.displayName = "DataCard"

export { DataCard, dataCardVariants }