import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive focus:scale-[0.98] active:scale-[0.96] select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:shadow-sm",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 hover:shadow-sm focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground hover:shadow-sm dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 hover:shadow-sm",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        success:
          "bg-green-600 text-white shadow-xs hover:bg-green-700 hover:shadow-sm focus-visible:ring-green-500/20 dark:bg-green-500/90 dark:hover:bg-green-600",
        warning:
          "bg-yellow-600 text-white shadow-xs hover:bg-yellow-700 hover:shadow-sm focus-visible:ring-yellow-500/20 dark:bg-yellow-500/90 dark:hover:bg-yellow-600",
      },
      size: {
        xs: "h-6 text-xs px-2 gap-1 has-[>svg]:px-1.5",
        sm: "h-8 text-sm px-3 gap-1.5 has-[>svg]:px-2.5",
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        lg: "h-10 px-6 has-[>svg]:px-4",
        xl: "h-12 px-8 text-base has-[>svg]:px-6",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        "icon-xl": "size-12",
      },
      rounded: {
        default: "rounded-md",
        sm: "rounded-sm",
        lg: "rounded-lg",
        xl: "rounded-xl",
        full: "rounded-full",
        none: "rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
    },
  }
)

export interface IButtonProps extends 
  Omit<React.ComponentProps<"button">, "children">,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children?: React.ReactNode
  fullWidth?: boolean
  tooltip?: string
  badge?: number | string
}

const Button = React.forwardRef<HTMLButtonElement, IButtonProps>(
  ({
    className,
    variant,
    size,
    rounded,
    asChild = false,
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    children,
    fullWidth = false,
    tooltip,
    badge,
    disabled,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const isDisabled = disabled || loading

    const buttonContent = (
      <>
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          leftIcon
        )}
        
        <span className="flex-1">
          {loading && loadingText ? loadingText : children}
        </span>
        
        {!loading && rightIcon}
        
        {badge !== undefined && (
          <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 text-xs font-medium bg-red-500 text-white rounded-full px-1">
            {badge}
          </span>
        )}
      </>
    )

    return (
      <Comp
        ref={ref}
        data-slot="button"
        data-loading={loading}
        title={tooltip}
        disabled={isDisabled}
        className={cn(
          buttonVariants({ variant, size, rounded }),
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {buttonContent}
      </Comp>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants }