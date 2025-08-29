import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  X, 
  AlertTriangle,
  Zap,
  Trophy,
  Target
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "./Button"

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        success: "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300",
        error: "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
        warning: "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
        info: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
        achievement: "border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-800 dark:border-purple-800 dark:from-purple-950 dark:to-pink-950 dark:text-purple-300",
      },
      size: {
        sm: "text-sm p-3",
        default: "text-sm p-4",
        lg: "text-base p-5",
      },
      position: {
        "top-left": "",
        "top-right": "",
        "top-center": "",
        "bottom-left": "",
        "bottom-right": "",
        "bottom-center": "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      position: "top-right",
    },
  }
)

const toastIcons = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  achievement: Trophy,
} as const

export interface INotificationToastProps extends
  React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof toastVariants> {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: {
    label: string
    onClick: () => void
  }
  onClose?: () => void
  closeable?: boolean
  duration?: number
  progress?: number
  showProgress?: boolean
  persistent?: boolean
  soundEnabled?: boolean
  vibrate?: boolean
}

const NotificationToast = React.forwardRef<HTMLDivElement, INotificationToastProps>(
  ({
    className,
    variant = "default",
    size,
    position,
    title,
    description,
    icon: customIcon,
    action,
    onClose,
    closeable = true,
    duration = 5000,
    progress,
    showProgress = false,
    persistent = false,
    soundEnabled = false,
    vibrate = false,
    ...props
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(true)
    const [progressValue, setProgressValue] = React.useState(100)
    const timerRef = React.useRef<NodeJS.Timeout>()
    const progressTimerRef = React.useRef<NodeJS.Timeout>()

    const IconComponent = toastIcons[variant as keyof typeof toastIcons]
    const icon = customIcon || <IconComponent className="h-5 w-5 flex-shrink-0" />

    // Auto dismiss functionality
    React.useEffect(() => {
      if (persistent || duration <= 0) return

      // Progress bar animation
      if (showProgress) {
        const progressInterval = 50
        const progressStep = (progressInterval / duration) * 100
        
        const updateProgress = () => {
          setProgressValue(prev => {
            const newValue = prev - progressStep
            if (newValue <= 0) {
              handleClose()
              return 0
            }
            return newValue
          })
        }

        progressTimerRef.current = setInterval(updateProgress, progressInterval)
      }

      // Auto close timer
      timerRef.current = setTimeout(() => {
        if (!persistent) {
          handleClose()
        }
      }, duration)

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current)
        if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      }
    }, [duration, persistent, showProgress])

    // Handle sounds and vibration
    React.useEffect(() => {
      if (soundEnabled) {
        // Play notification sound (implement based on your audio system)
        // playNotificationSound(variant)
      }

      if (vibrate && "vibrate" in navigator) {
        const pattern = variant === "error" ? [100, 50, 100] : [50]
        navigator.vibrate(pattern)
      }
    }, [soundEnabled, vibrate, variant])

    const handleClose = () => {
      setIsVisible(false)
      onClose?.()
      
      // Clean up timers
      if (timerRef.current) clearTimeout(timerRef.current)
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    }

    const handleMouseEnter = () => {
      // Pause auto-dismiss on hover
      if (timerRef.current) clearTimeout(timerRef.current)
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
    }

    const handleMouseLeave = () => {
      // Resume auto-dismiss when not hovering
      if (!persistent && duration > 0) {
        const remainingTime = (progressValue / 100) * duration
        
        if (showProgress) {
          const progressInterval = 50
          const progressStep = (progressInterval / remainingTime) * progressValue
          
          progressTimerRef.current = setInterval(() => {
            setProgressValue(prev => {
              const newValue = prev - progressStep
              if (newValue <= 0) {
                handleClose()
                return 0
              }
              return newValue
            })
          }, progressInterval)
        }

        timerRef.current = setTimeout(handleClose, remainingTime)
      }
    }

    if (!isVisible) return null

    return (
      <div
        ref={ref}
        className={cn(toastVariants({ variant, size, position }), className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="alert"
        aria-live={variant === "error" ? "assertive" : "polite"}
        {...props}
      >
        {/* Progress bar */}
        {showProgress && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10">
            <div
              className="h-full bg-current transition-all duration-75 ease-linear"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex items-start space-x-3 flex-1">
          {icon && (
            <div className="flex-shrink-0 pt-0.5">
              {icon}
            </div>
          )}
          
          <div className="flex-1 space-y-1">
            <div className="font-semibold leading-none tracking-tight">
              {title}
            </div>
            {description && (
              <div className="text-sm opacity-90 leading-relaxed">
                {description}
              </div>
            )}
          </div>
        </div>

        {/* Action button */}
        {action && (
          <div className="flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={action.onClick}
              className="h-auto p-2 text-current hover:bg-current/10"
            >
              {action.label}
            </Button>
          </div>
        )}

        {/* Close button */}
        {closeable && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleClose}
            className="absolute top-2 right-2 h-6 w-6 text-current hover:bg-current/10 focus:ring-current/20"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Close</span>
          </Button>
        )}
      </div>
    )
  }
)

NotificationToast.displayName = "NotificationToast"

// Toast container component
export const ToastContainer: React.FC<{
  position?: VariantProps<typeof toastVariants>["position"]
  maxToasts?: number
  children: React.ReactNode
}> = ({ 
  position = "top-right", 
  maxToasts = 5,
  children 
}) => {
  const positionClasses = {
    "top-left": "fixed top-4 left-4 z-50",
    "top-right": "fixed top-4 right-4 z-50",
    "top-center": "fixed top-4 left-1/2 transform -translate-x-1/2 z-50",
    "bottom-left": "fixed bottom-4 left-4 z-50",
    "bottom-right": "fixed bottom-4 right-4 z-50",
    "bottom-center": "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50",
  }

  return (
    <div className={cn(positionClasses[position], "space-y-2 max-w-sm w-full")}>
      {children}
    </div>
  )
}

// Toast manager hook
export const useToast = () => {
  const [toasts, setToasts] = React.useState<Array<{
    id: string
    props: INotificationToastProps
  }>>([])

  const addToast = (props: Omit<INotificationToastProps, "onClose">) => {
    const id = Math.random().toString(36).substr(2, 9)
    
    setToasts(prev => [...prev, {
      id,
      props: {
        ...props,
        onClose: () => removeToast(id)
      }
    }])

    return id
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearAllToasts = () => {
    setToasts([])
  }

  // Convenience methods
  const success = (title: string, description?: string) => 
    addToast({ variant: "success", title, description })

  const error = (title: string, description?: string) => 
    addToast({ variant: "error", title, description })

  const warning = (title: string, description?: string) => 
    addToast({ variant: "warning", title, description })

  const info = (title: string, description?: string) => 
    addToast({ variant: "info", title, description })

  const achievement = (title: string, description?: string) => 
    addToast({ variant: "achievement", title, description, duration: 8000 })

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
    achievement,
  }
}

export { NotificationToast, toastVariants }