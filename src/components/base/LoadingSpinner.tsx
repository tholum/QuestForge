import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const loadingSpinnerVariants = cva(
  "animate-spin",
  {
    variants: {
      variant: {
        default: "text-primary",
        secondary: "text-muted-foreground",
        success: "text-green-500",
        warning: "text-yellow-500",
        danger: "text-red-500",
        white: "text-white",
        current: "text-current",
      },
      size: {
        xs: "w-3 h-3",
        sm: "w-4 h-4",
        default: "w-5 h-5",
        lg: "w-6 h-6",
        xl: "w-8 h-8",
        "2xl": "w-10 h-10",
        "3xl": "w-12 h-12",
      },
      speed: {
        slow: "animate-spin [animation-duration:3s]",
        normal: "animate-spin [animation-duration:1s]",
        fast: "animate-spin [animation-duration:0.5s]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      speed: "normal",
    },
  }
)

export interface ILoadingSpinnerProps extends
  React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof loadingSpinnerVariants> {
  label?: string
  showLabel?: boolean
  center?: boolean
  overlay?: boolean
  fullScreen?: boolean
  progress?: number
  indeterminate?: boolean
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, ILoadingSpinnerProps>(
  ({
    className,
    variant,
    size,
    speed,
    label = "Loading...",
    showLabel = false,
    center = false,
    overlay = false,
    fullScreen = false,
    progress,
    indeterminate = true,
    ...props
  }, ref) => {
    const spinnerContent = (
      <div
        className={cn(
          "flex items-center gap-2",
          center && "justify-center",
          showLabel ? "flex-row" : "flex-col"
        )}
      >
        {indeterminate ? (
          <Loader2 className={cn(loadingSpinnerVariants({ variant, size, speed }))} />
        ) : (
          <CircularProgress
            value={progress || 0}
            size={size === "xs" ? 16 : size === "sm" ? 20 : size === "default" ? 24 : size === "lg" ? 28 : size === "xl" ? 32 : 40}
            variant={variant}
          />
        )}
        
        {showLabel && (
          <span className={cn(
            "text-sm font-medium",
            variant === "white" ? "text-white" : 
            variant === "current" ? "text-current" : 
            "text-muted-foreground"
          )}>
            {label}
            {progress !== undefined && !indeterminate && ` ${Math.round(progress)}%`}
          </span>
        )}
      </div>
    )

    if (fullScreen) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div
            ref={ref}
            className={cn("flex flex-col items-center space-y-4 p-8", className)}
            role="status"
            aria-label={label}
            {...props}
          >
            {spinnerContent}
          </div>
        </div>
      )
    }

    if (overlay) {
      return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[2px]">
          <div
            ref={ref}
            className={cn("flex flex-col items-center space-y-2", className)}
            role="status"
            aria-label={label}
            {...props}
          >
            {spinnerContent}
          </div>
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          center && "flex items-center justify-center",
          className
        )}
        role="status"
        aria-label={label}
        {...props}
      >
        {spinnerContent}
      </div>
    )
  }
)

LoadingSpinner.displayName = "LoadingSpinner"

// Circular progress component for determinate loading
const CircularProgress: React.FC<{
  value: number
  size?: number
  strokeWidth?: number
  variant?: VariantProps<typeof loadingSpinnerVariants>["variant"]
}> = ({ value, size = 24, strokeWidth = 2, variant = "default" }) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (value / 100) * circumference

  const colorClasses = {
    default: "stroke-primary",
    secondary: "stroke-muted-foreground",
    success: "stroke-green-500",
    warning: "stroke-yellow-500",
    danger: "stroke-red-500",
    white: "stroke-white",
    current: "stroke-current",
  }

  return (
    <svg
      width={size}
      height={size}
      className={cn("transform -rotate-90", colorClasses[variant || "default"])}
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        className="opacity-20"
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-300 ease-in-out"
      />
    </svg>
  )
}

// Skeleton loader component
export const SkeletonLoader: React.FC<{
  lines?: number
  width?: string | string[]
  height?: string
  className?: string
}> = ({ lines = 3, width = "100%", height = "1rem", className }) => {
  const widths = Array.isArray(width) ? width : Array(lines).fill(width)

  return (
    <div className={cn("space-y-2", className)} role="status" aria-label="Loading content">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse bg-muted rounded"
          style={{
            width: widths[index] || widths[0],
            height,
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

// Pulse loader for simple loading states
export const PulseLoader: React.FC<{
  size?: "sm" | "default" | "lg"
  variant?: VariantProps<typeof loadingSpinnerVariants>["variant"]
  className?: string
}> = ({ size = "default", variant = "default", className }) => {
  const sizeClasses = {
    sm: "w-2 h-2",
    default: "w-3 h-3",
    lg: "w-4 h-4",
  }

  const colorClasses = {
    default: "bg-primary",
    secondary: "bg-muted-foreground",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
    white: "bg-white",
    current: "bg-current",
  }

  return (
    <div className={cn("flex space-x-1", className)} role="status" aria-label="Loading">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            "rounded-full animate-pulse",
            sizeClasses[size],
            colorClasses[variant || "default"]
          )}
          style={{
            animationDelay: `${index * 0.15}s`,
            animationDuration: "0.9s",
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

// Dots loader with bouncing animation
export const DotsLoader: React.FC<{
  size?: "sm" | "default" | "lg"
  variant?: VariantProps<typeof loadingSpinnerVariants>["variant"]
  className?: string
}> = ({ size = "default", variant = "default", className }) => {
  const sizeClasses = {
    sm: "w-1.5 h-1.5",
    default: "w-2 h-2",
    lg: "w-3 h-3",
  }

  const colorClasses = {
    default: "bg-primary",
    secondary: "bg-muted-foreground",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
    white: "bg-white",
    current: "bg-current",
  }

  return (
    <div className={cn("flex space-x-1", className)} role="status" aria-label="Loading">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            "rounded-full animate-bounce",
            sizeClasses[size],
            colorClasses[variant || "default"]
          )}
          style={{
            animationDelay: `${index * 0.1}s`,
            animationDuration: "0.6s",
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export { LoadingSpinner, loadingSpinnerVariants }