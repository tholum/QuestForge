import type { Meta, StoryObj } from "@storybook/nextjs"
import { fn } from "@storybook/test"
import { NotificationToast, ToastContainer, useToast } from "./NotificationToast"
import { Button } from "./Button"
import { Trophy, Target, Zap } from "lucide-react"

const meta: Meta<typeof NotificationToast> = {
  title: "Base Components/NotificationToast",
  component: NotificationToast,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Comprehensive notification toast system with multiple variants, auto-dismiss, progress indicators, and accessibility features. Perfect for user feedback and gamification notifications."
      }
    }
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "error", "warning", "info", "achievement"],
      description: "Visual variant for different message types"
    },
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
      description: "Size variant"
    },
    position: {
      control: "select",
      options: ["top-left", "top-right", "top-center", "bottom-left", "bottom-right", "bottom-center"],
      description: "Position on screen (for container)"
    },
    title: {
      control: "text",
      description: "Main title of the toast"
    },
    description: {
      control: "text",
      description: "Description text"
    },
    closeable: {
      control: "boolean",
      description: "Show close button"
    },
    duration: {
      control: "number",
      description: "Auto-dismiss duration in milliseconds"
    },
    showProgress: {
      control: "boolean",
      description: "Show progress bar for auto-dismiss"
    },
    persistent: {
      control: "boolean",
      description: "Prevent auto-dismiss"
    },
    soundEnabled: {
      control: "boolean",
      description: "Play notification sound"
    },
    vibrate: {
      control: "boolean",
      description: "Enable haptic feedback"
    },
    onClose: { action: "closed" }
  },
  args: {
    onClose: fn()
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Basic examples
export const Default: Story = {
  args: {
    title: "Notification",
    description: "This is a default notification message."
  }
}

export const Variants: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <NotificationToast
        variant="default"
        title="Default Message"
        description="This is a standard notification."
      />
      <NotificationToast
        variant="success"
        title="Success!"
        description="Your goal has been completed successfully."
      />
      <NotificationToast
        variant="error"
        title="Error Occurred"
        description="Failed to save your goal. Please try again."
      />
      <NotificationToast
        variant="warning"
        title="Warning"
        description="Your goal deadline is approaching."
      />
      <NotificationToast
        variant="info"
        title="Information"
        description="New features are available in the latest update."
      />
      <NotificationToast
        variant="achievement"
        title="Achievement Unlocked!"
        description="You've completed your first fitness goal!"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different variants for various types of notifications and feedback."
      }
    }
  }
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <NotificationToast
        size="sm"
        title="Small Toast"
        description="Compact notification for subtle feedback."
      />
      <NotificationToast
        size="default"
        title="Default Toast"
        description="Standard size for most notifications."
      />
      <NotificationToast
        size="lg"
        title="Large Toast"
        description="Prominent size for important messages and achievements."
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different size variants for various importance levels and contexts."
      }
    }
  }
}

export const WithActions: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <NotificationToast
        variant="info"
        title="New Feature Available"
        description="Check out the new goal templates!"
        action={{
          label: "View Templates",
          onClick: () => console.log("View templates clicked")
        }}
      />
      <NotificationToast
        variant="success"
        title="Goal Completed!"
        description="Morning workout finished successfully."
        action={{
          label: "Share",
          onClick: () => console.log("Share achievement")
        }}
      />
      <NotificationToast
        variant="warning"
        title="Streak at Risk"
        description="Complete today's goals to maintain your streak."
        action={{
          label: "View Goals",
          onClick: () => console.log("View goals")
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Toasts with action buttons for immediate user engagement."
      }
    }
  }
}

export const WithCustomIcons: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <NotificationToast
        variant="achievement"
        title="Level Up!"
        description="You've reached level 5 in fitness goals."
        icon={<Trophy className="h-5 w-5" />}
      />
      <NotificationToast
        variant="info"
        title="New Goal Available"
        description="Ready to set your next challenge?"
        icon={<Target className="h-5 w-5" />}
      />
      <NotificationToast
        variant="success"
        title="Streak Bonus!"
        description="7-day streak earned you bonus XP."
        icon={<Zap className="h-5 w-5" />}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Toasts with custom icons for enhanced visual communication."
      }
    }
  }
}

export const WithProgress: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <NotificationToast
        variant="info"
        title="Auto-dismissing Toast"
        description="This will disappear in 5 seconds."
        showProgress
        duration={5000}
      />
      <NotificationToast
        variant="success"
        title="Progress Indicator"
        description="Watch the progress bar at the top."
        showProgress
        duration={8000}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Toasts with progress bars showing auto-dismiss countdown."
      }
    }
  }
}

export const Persistent: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <NotificationToast
        variant="error"
        title="Critical Error"
        description="This requires your immediate attention."
        persistent
        action={{
          label: "Fix Now",
          onClick: () => console.log("Fix error")
        }}
      />
      <NotificationToast
        variant="achievement"
        title="Major Achievement!"
        description="You've completed 100 goals! This won't auto-dismiss."
        persistent
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Persistent toasts that don't auto-dismiss for critical messages."
      }
    }
  }
}

// Goal Assistant specific examples
export const GamificationToasts: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <NotificationToast
        variant="achievement"
        title="Achievement Unlocked!"
        description="First Goal Crusher - Complete your first goal"
        icon={<Trophy className="h-5 w-5" />}
        action={{
          label: "View Badge",
          onClick: () => console.log("View achievement badge")
        }}
        duration={8000}
      />
      <NotificationToast
        variant="success"
        title="Streak Extended!"
        description="15 days in a row! You're on fire!"
        icon={<Zap className="h-5 w-5" />}
        showProgress
        duration={6000}
      />
      <NotificationToast
        variant="achievement"
        title="Level Up!"
        description="Welcome to Level 8! New features unlocked."
        persistent
        action={{
          label: "Explore",
          onClick: () => console.log("Explore new features")
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Gamification-focused toasts for achievements, streaks, and level progression."
      }
    }
  }
}

export const GoalProgressToasts: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <NotificationToast
        variant="success"
        title="Goal Completed!"
        description="Morning workout - 30 minutes cardio ✓"
        action={{
          label: "Log Results",
          onClick: () => console.log("Log workout results")
        }}
      />
      <NotificationToast
        variant="warning"
        title="Goal Reminder"
        description="Don't forget: Read for 20 minutes before bed"
        action={{
          label: "Mark Done",
          onClick: () => console.log("Mark reading done")
        }}
      />
      <NotificationToast
        variant="info"
        title="Weekly Progress"
        description="You're 80% towards your weekly goal!"
        showProgress
        duration={7000}
      />
      <NotificationToast
        variant="error"
        title="Goal Overdue"
        description="Kitchen renovation planning is 2 days overdue"
        action={{
          label: "Reschedule",
          onClick: () => console.log("Reschedule goal")
        }}
        persistent
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Goal-specific notifications for progress updates and reminders."
      }
    }
  }
}

// Interactive examples with useToast hook
export const ToastManager: Story = {
  render: function ToastManagerDemo() {
    const toast = useToast()

    const showSuccess = () => {
      toast.success("Goal completed!", "Great job on finishing your workout!")
    }

    const showError = () => {
      toast.error("Save failed", "Could not save your goal. Check your connection.")
    }

    const showWarning = () => {
      toast.warning("Deadline approaching", "Your project is due in 2 hours.")
    }

    const showInfo = () => {
      toast.info("Pro tip", "Set smaller, achievable goals for better success rates.")
    }

    const showAchievement = () => {
      toast.achievement("Level Up!", "You've reached level 10 in fitness goals!")
    }

    const showCustom = () => {
      toast.addToast({
        variant: "success",
        title: "Custom Toast",
        description: "This toast has custom settings",
        action: {
          label: "Action",
          onClick: () => console.log("Custom action")
        },
        showProgress: true,
        duration: 10000
      })
    }

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={showSuccess} variant="success" size="sm">
            Success Toast
          </Button>
          <Button onClick={showError} variant="destructive" size="sm">
            Error Toast
          </Button>
          <Button onClick={showWarning} variant="warning" size="sm">
            Warning Toast
          </Button>
          <Button onClick={showInfo} variant="outline" size="sm">
            Info Toast
          </Button>
          <Button onClick={showAchievement} variant="default" size="sm">
            Achievement
          </Button>
          <Button onClick={showCustom} variant="secondary" size="sm">
            Custom Toast
          </Button>
        </div>

        <Button 
          onClick={() => toast.clearAllToasts()} 
          variant="ghost" 
          size="sm"
          className="w-full"
        >
          Clear All Toasts
        </Button>

        <ToastContainer position="top-right">
          {toast.toasts.map(({ id, props }) => (
            <NotificationToast key={id} {...props} />
          ))}
        </ToastContainer>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demo using the useToast hook for managing multiple toasts."
      }
    }
  }
}

export const MobileToasts: Story = {
  render: () => (
    <div className="w-full max-w-sm space-y-3">
      <NotificationToast
        size="sm"
        variant="success"
        title="Quick Goal Added"
        description="Workout logged successfully"
      />
      <NotificationToast
        size="sm"
        variant="info"
        title="Reminder"
        description="Time for your daily reflection"
        action={{
          label: "Start",
          onClick: () => console.log("Start reflection")
        }}
      />
      <NotificationToast
        size="sm"
        variant="achievement"
        title="Streak!"
        description="7 days completed 🔥"
        showProgress
        duration={4000}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Mobile-optimized toasts with compact layouts and essential information."
      }
    }
  }
}

export const AccessibilityFeatures: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-sm">
      <NotificationToast
        variant="success"
        title="Accessible Toast"
        description="This toast includes proper ARIA attributes for screen readers."
        role="alert"
        aria-live="polite"
      />
      <NotificationToast
        variant="error"
        title="Critical Alert"
        description="High priority message with assertive announcement."
        role="alert"
        aria-live="assertive"
      />
      <NotificationToast
        variant="info"
        title="Keyboard Navigation"
        description="Use Tab to reach the action button and close button."
        action={{
          label: "Action",
          onClick: () => console.log("Keyboard accessible action")
        }}
        persistent
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Toasts demonstrating accessibility features including ARIA attributes and keyboard navigation."
      }
    }
  }
}