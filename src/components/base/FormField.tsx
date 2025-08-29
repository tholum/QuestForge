import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { AlertCircle, CheckCircle2, Info } from "lucide-react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const formFieldVariants = cva(
  "space-y-2",
  {
    variants: {
      variant: {
        default: "",
        error: "",
        success: "",
        warning: "",
      },
      size: {
        sm: "",
        default: "",
        lg: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "text-foreground",
        error: "text-destructive",
        success: "text-green-600 dark:text-green-400",
        warning: "text-yellow-600 dark:text-yellow-400",
      },
      required: {
        true: "after:content-['*'] after:ml-0.5 after:text-destructive",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      required: false,
    },
  }
)

const messageVariants = cva(
  "flex items-center gap-2 text-xs",
  {
    variants: {
      variant: {
        default: "text-muted-foreground",
        error: "text-destructive",
        success: "text-green-600 dark:text-green-400",
        warning: "text-yellow-600 dark:text-yellow-400",
        info: "text-blue-600 dark:text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface IFormFieldProps extends
  React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof formFieldVariants> {
  label?: string
  description?: string
  error?: string
  success?: string
  warning?: string
  info?: string
  required?: boolean
  children: React.ReactNode
  htmlFor?: string
  disabled?: boolean
  loading?: boolean
}

const FormField = React.forwardRef<HTMLDivElement, IFormFieldProps>(
  ({
    className,
    variant: propVariant,
    size,
    label,
    description,
    error,
    success,
    warning,
    info,
    required = false,
    children,
    htmlFor,
    disabled = false,
    loading = false,
    ...props
  }, ref) => {
    // Determine the variant based on validation states
    const variant = propVariant || (
      error ? "error" : 
      success ? "success" : 
      warning ? "warning" : 
      "default"
    )

    // Get the message to display and its variant
    const message = error || success || warning || info || description
    const messageVariant = error ? "error" : 
                          success ? "success" : 
                          warning ? "warning" : 
                          info ? "info" : 
                          "default"

    const MessageIcon = error ? AlertCircle : 
                       success ? CheckCircle2 : 
                       warning ? AlertCircle : 
                       info ? Info : 
                       null

    return (
      <div
        ref={ref}
        className={cn(
          formFieldVariants({ variant, size }),
          disabled && "opacity-60",
          loading && "animate-pulse",
          className
        )}
        {...props}
      >
        {label && (
          <Label
            htmlFor={htmlFor}
            className={cn(labelVariants({ variant, required }))}
          >
            {label}
            {loading && (
              <span className="ml-2 inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin opacity-60" />
            )}
          </Label>
        )}
        
        <div className="relative">
          {children}
          
          {/* Overlay for loading state */}
          {loading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-md">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {message && (
          <div className={cn(messageVariants({ variant: messageVariant }))}>
            {MessageIcon && <MessageIcon className="w-3 h-3 flex-shrink-0" />}
            <span>{message}</span>
          </div>
        )}
      </div>
    )
  }
)

FormField.displayName = "FormField"

// Helper hook for form field state management
export const useFormFieldState = () => {
  const [state, setState] = React.useState<{
    error?: string
    success?: string
    warning?: string
    loading?: boolean
  }>({})

  const setError = (error: string) => setState(prev => ({ ...prev, error, success: undefined, warning: undefined }))
  const setSuccess = (success: string) => setState(prev => ({ ...prev, success, error: undefined, warning: undefined }))
  const setWarning = (warning: string) => setState(prev => ({ ...prev, warning, error: undefined, success: undefined }))
  const setLoading = (loading: boolean) => setState(prev => ({ ...prev, loading }))
  const clearState = () => setState({})

  return {
    ...state,
    setError,
    setSuccess,
    setWarning,
    setLoading,
    clearState,
  }
}

export { FormField, formFieldVariants }