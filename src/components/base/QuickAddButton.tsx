import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Plus, Zap, Target, Dumbbell, Home, BookOpen, Briefcase } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "./Button"

const quickAddButtonVariants = cva(
  "fixed z-50 transition-all duration-300 ease-out shadow-lg hover:shadow-xl",
  {
    variants: {
      position: {
        "bottom-right": "bottom-4 right-4 sm:bottom-6 sm:right-6",
        "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2 sm:bottom-6",
        "bottom-left": "bottom-4 left-4 sm:bottom-6 sm:left-6",
        "top-right": "top-4 right-4 sm:top-6 sm:right-6",
      },
      size: {
        sm: "w-12 h-12",
        default: "w-14 h-14",
        lg: "w-16 h-16",
        xl: "w-20 h-20",
      },
      variant: {
        primary: "bg-primary hover:bg-primary/90 text-primary-foreground",
        success: "bg-green-600 hover:bg-green-700 text-white",
        gradient: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white",
        glass: "backdrop-blur-md bg-white/20 border border-white/30 text-white hover:bg-white/30",
      },
      pulse: {
        true: "animate-pulse",
        false: "",
      },
      bounce: {
        true: "animate-bounce",
        false: "",
      },
    },
    defaultVariants: {
      position: "bottom-right",
      size: "default",
      variant: "primary",
      pulse: false,
      bounce: false,
    },
  }
)

const quickActionMenuVariants = cva(
  "absolute z-40 flex flex-col gap-2 transition-all duration-300 origin-bottom-right",
  {
    variants: {
      position: {
        "bottom-right": "bottom-full right-0 mb-3",
        "bottom-center": "bottom-full left-1/2 transform -translate-x-1/2 mb-3",
        "bottom-left": "bottom-full left-0 mb-3",
        "top-right": "top-full right-0 mt-3",
      },
      state: {
        closed: "opacity-0 scale-0 pointer-events-none",
        open: "opacity-100 scale-100",
      },
    },
    defaultVariants: {
      position: "bottom-right",
      state: "closed",
    },
  }
)

export interface IQuickAddButtonProps extends
  React.HTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof quickAddButtonVariants> {
  onMainAction?: () => void
  quickActions?: Array<{
    id: string
    label: string
    icon: React.ReactNode
    color?: string
    onClick: () => void
  }>
  showLabel?: boolean
  label?: string
  hideOnScroll?: boolean
  vibrate?: boolean
  notifications?: number
}

const QuickAddButton = React.forwardRef<HTMLButtonElement, IQuickAddButtonProps>(
  ({
    className,
    position,
    size,
    variant,
    pulse,
    bounce,
    onMainAction,
    quickActions = [],
    showLabel = false,
    label = "Quick Add",
    hideOnScroll = true,
    vibrate = true,
    notifications = 0,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [isVisible, setIsVisible] = React.useState(true)
    const [lastScrollY, setLastScrollY] = React.useState(0)

    // Handle scroll behavior
    React.useEffect(() => {
      if (!hideOnScroll) return

      const handleScroll = () => {
        const currentScrollY = window.scrollY
        const scrollingDown = currentScrollY > lastScrollY

        if (scrollingDown && currentScrollY > 100) {
          setIsVisible(false)
          setIsOpen(false)
        } else {
          setIsVisible(true)
        }

        setLastScrollY(currentScrollY)
      }

      window.addEventListener("scroll", handleScroll, { passive: true })
      return () => window.removeEventListener("scroll", handleScroll)
    }, [hideOnScroll, lastScrollY])

    // Close menu when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (isOpen && !(event.target as Element)?.closest("[data-quick-add]")) {
          setIsOpen(false)
        }
      }

      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }, [isOpen])

    // Handle haptic feedback
    const handleVibrate = () => {
      if (vibrate && "vibrate" in navigator) {
        navigator.vibrate(50)
      }
    }

    const handleMainClick = () => {
      handleVibrate()
      
      if (quickActions.length > 0) {
        setIsOpen(!isOpen)
      } else if (onMainAction) {
        onMainAction()
      }
    }

    const handleQuickAction = (action: { onClick: () => void }) => {
      handleVibrate()
      action.onClick()
      setIsOpen(false)
    }

    const buttonIcon = isOpen ? (
      <Plus className={cn(
        "transition-transform duration-300",
        isOpen && "rotate-45"
      )} />
    ) : (
      <Plus />
    )

    return (
      <div
        data-quick-add="container"
        className={cn(
          quickAddButtonVariants({ position, size, variant, pulse, bounce }),
          !isVisible && "translate-y-20 opacity-0",
          className
        )}
      >
        {/* Quick Actions Menu */}
        {quickActions.length > 0 && (
          <div
            className={cn(
              quickActionMenuVariants({
                position,
                state: isOpen ? "open" : "closed"
              })
            )}
          >
            {quickActions.map((action) => (
              <Button
                key={action.id}
                size="icon"
                variant="secondary"
                onClick={() => handleQuickAction(action)}
                className={cn(
                  "rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105",
                  action.color
                )}
                tooltip={action.label}
              >
                {action.icon}
              </Button>
            ))}
          </div>
        )}

        {/* Main Button */}
        <Button
          ref={ref}
          size="icon"
          onClick={handleMainClick}
          className={cn(
            "rounded-full relative overflow-hidden hover:scale-110 active:scale-95 transition-transform duration-200",
            size === "sm" && "w-12 h-12",
            size === "default" && "w-14 h-14",
            size === "lg" && "w-16 h-16",
            size === "xl" && "w-20 h-20"
          )}
          {...props}
        >
          {buttonIcon}
          
          {/* Notification Badge */}
          {notifications > 0 && (
            <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full animate-pulse">
              {notifications > 99 ? "99+" : notifications}
            </span>
          )}
          
          {/* Ripple Effect */}
          <span className="absolute inset-0 rounded-full bg-white opacity-0 animate-ping pointer-events-none" />
        </Button>

        {/* Label */}
        {showLabel && (
          <span className={cn(
            "absolute text-xs font-medium px-2 py-1 bg-black/80 text-white rounded whitespace-nowrap transition-opacity duration-300",
            position === "bottom-right" && "bottom-full right-0 mb-2",
            position === "bottom-center" && "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
            position === "bottom-left" && "bottom-full left-0 mb-2",
            position === "top-right" && "top-full right-0 mt-2",
            isOpen ? "opacity-0" : "opacity-100"
          )}>
            {label}
          </span>
        )}
      </div>
    )
  }
)

QuickAddButton.displayName = "QuickAddButton"

// Predefined quick action sets
export const defaultQuickActions = {
  fitness: {
    id: "fitness",
    label: "Add Workout",
    icon: <Dumbbell className="w-4 h-4" />,
    color: "bg-red-500 hover:bg-red-600",
  },
  home: {
    id: "home",
    label: "Add Home Task",
    icon: <Home className="w-4 h-4" />,
    color: "bg-blue-500 hover:bg-blue-600",
  },
  learning: {
    id: "learning",
    label: "Add Learning Goal",
    icon: <BookOpen className="w-4 h-4" />,
    color: "bg-green-500 hover:bg-green-600",
  },
  work: {
    id: "work",
    label: "Add Work Task",
    icon: <Briefcase className="w-4 h-4" />,
    color: "bg-purple-500 hover:bg-purple-600",
  },
  general: {
    id: "general",
    label: "Add Goal",
    icon: <Target className="w-4 h-4" />,
    color: "bg-gray-500 hover:bg-gray-600",
  },
  quick: {
    id: "quick",
    label: "Quick Entry",
    icon: <Zap className="w-4 h-4" />,
    color: "bg-yellow-500 hover:bg-yellow-600",
  },
}

export { QuickAddButton, quickAddButtonVariants }