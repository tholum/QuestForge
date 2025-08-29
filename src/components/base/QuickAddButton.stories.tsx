import type { Meta, StoryObj } from "@storybook/nextjs"
import { fn } from "@storybook/test"
import { QuickAddButton, defaultQuickActions } from "./QuickAddButton"
import { Plus, Zap } from "lucide-react"

const meta: Meta<typeof QuickAddButton> = {
  title: "Base Components/QuickAddButton",
  component: QuickAddButton,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Floating action button for mobile quick actions. Features expandable menu, haptic feedback, scroll behavior, and customizable positioning for optimal user experience."
      }
    }
  },
  tags: ["autodocs"],
  argTypes: {
    position: {
      control: "select",
      options: ["bottom-right", "bottom-center", "bottom-left", "top-right"],
      description: "Position on screen"
    },
    size: {
      control: "select",
      options: ["sm", "default", "lg", "xl"],
      description: "Button size"
    },
    variant: {
      control: "select",
      options: ["primary", "success", "gradient", "glass"],
      description: "Visual style variant"
    },
    pulse: {
      control: "boolean",
      description: "Add pulsing animation"
    },
    bounce: {
      control: "boolean",
      description: "Add bouncing animation"
    },
    showLabel: {
      control: "boolean",
      description: "Show text label"
    },
    label: {
      control: "text",
      description: "Label text"
    },
    hideOnScroll: {
      control: "boolean",
      description: "Hide button when scrolling down"
    },
    vibrate: {
      control: "boolean",
      description: "Enable haptic feedback"
    },
    notifications: {
      control: "number",
      description: "Notification count badge"
    },
    onMainAction: { action: "main-action" }
  },
  args: {
    onMainAction: fn()
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Basic examples
export const Default: Story = {
  args: {
    position: "bottom-right",
    onMainAction: fn()
  }
}

export const Positions: Story = {
  render: () => (
    <div className="relative h-screen bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
      <div className="absolute inset-4 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium">Quick Add Button Positions</div>
          <div className="text-sm">Buttons are positioned around this container</div>
        </div>
      </div>
      
      <QuickAddButton
        position="bottom-right"
        size="default"
        variant="primary"
        onMainAction={() => console.log("Bottom Right")}
      />
      <QuickAddButton
        position="bottom-left"
        size="default"
        variant="success"
        onMainAction={() => console.log("Bottom Left")}
      />
      <QuickAddButton
        position="bottom-center"
        size="default"
        variant="gradient"
        onMainAction={() => console.log("Bottom Center")}
      />
      <QuickAddButton
        position="top-right"
        size="default"
        variant="glass"
        onMainAction={() => console.log("Top Right")}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different positioning options for the Quick Add Button."
      }
    }
  }
}

export const Sizes: Story = {
  render: () => (
    <div className="relative h-96 bg-gradient-to-br from-green-50 to-blue-50 overflow-hidden">
      <QuickAddButton
        position="bottom-right"
        size="sm"
        variant="primary"
        label="Small"
        showLabel
        onMainAction={() => console.log("Small")}
      />
      <div className="absolute bottom-6 right-20">
        <QuickAddButton
          position="bottom-right"
          size="default"
          variant="success"
          label="Default"
          showLabel
          onMainAction={() => console.log("Default")}
          style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
        />
      </div>
      <div className="absolute bottom-6 right-36">
        <QuickAddButton
          position="bottom-right"
          size="lg"
          variant="gradient"
          label="Large"
          showLabel
          onMainAction={() => console.log("Large")}
          style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
        />
      </div>
      <div className="absolute bottom-6 right-56">
        <QuickAddButton
          position="bottom-right"
          size="xl"
          variant="glass"
          label="Extra Large"
          showLabel
          onMainAction={() => console.log("Extra Large")}
          style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different size variants for various use cases and screen sizes."
      }
    }
  }
}

export const Variants: Story = {
  render: () => (
    <div className="relative h-96 bg-gray-100 overflow-hidden">
      <div className="absolute bottom-6 right-6 flex gap-4">
        <QuickAddButton
          variant="primary"
          position="bottom-right"
          style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
          onMainAction={() => console.log("Primary")}
        />
        <QuickAddButton
          variant="success"
          position="bottom-right"
          style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
          onMainAction={() => console.log("Success")}
        />
        <QuickAddButton
          variant="gradient"
          position="bottom-right"
          style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
          onMainAction={() => console.log("Gradient")}
        />
        <QuickAddButton
          variant="glass"
          position="bottom-right"
          style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
          onMainAction={() => console.log("Glass")}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different visual style variants for various design aesthetics."
      }
    }
  }
}

export const WithQuickActions: Story = {
  args: {
    quickActions: [
      {
        ...defaultQuickActions.fitness,
        onClick: () => console.log("Add fitness goal")
      },
      {
        ...defaultQuickActions.learning,
        onClick: () => console.log("Add learning goal")
      },
      {
        ...defaultQuickActions.home,
        onClick: () => console.log("Add home project")
      },
      {
        ...defaultQuickActions.work,
        onClick: () => console.log("Add work task")
      }
    ]
  },
  parameters: {
    docs: {
      description: {
        story: "Quick Add Button with expandable menu showing predefined quick actions."
      }
    }
  }
}

export const WithAnimations: Story = {
  render: () => (
    <div className="relative h-96 bg-gradient-to-br from-purple-50 to-pink-50 overflow-hidden">
      <QuickAddButton
        position="bottom-right"
        variant="gradient"
        pulse
        onMainAction={() => console.log("Pulsing")}
      />
      <div className="absolute bottom-6 right-20">
        <QuickAddButton
          position="bottom-right"
          variant="success"
          bounce
          onMainAction={() => console.log("Bouncing")}
          style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Quick Add Buttons with attention-grabbing animations."
      }
    }
  }
}

export const WithNotifications: Story = {
  render: () => (
    <div className="relative h-96 bg-gray-50 overflow-hidden">
      <div className="absolute bottom-6 right-6 flex gap-4">
        <QuickAddButton
          variant="primary"
          notifications={3}
          position="bottom-right"
          style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
          onMainAction={() => console.log("3 notifications")}
        />
        <QuickAddButton
          variant="success"
          notifications={99}
          position="bottom-right"
          style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
          onMainAction={() => console.log("99 notifications")}
        />
        <QuickAddButton
          variant="gradient"
          notifications={150}
          position="bottom-right"
          style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
          onMainAction={() => console.log("150+ notifications")}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Quick Add Buttons with notification badges showing different count displays."
      }
    }
  }
}

export const WithLabels: Story = {
  render: () => (
    <div className="relative h-96 bg-blue-50 overflow-hidden">
      <QuickAddButton
        position="bottom-right"
        variant="primary"
        showLabel
        label="Add Goal"
        onMainAction={() => console.log("Add Goal")}
      />
      <div className="absolute bottom-6 left-6">
        <QuickAddButton
          position="bottom-left"
          variant="success"
          showLabel
          label="Quick Entry"
          onMainAction={() => console.log("Quick Entry")}
          style={{ position: 'relative', bottom: 'auto', left: 'auto' }}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Quick Add Buttons with text labels for better accessibility and clarity."
      }
    }
  }
}

// Goal Assistant specific examples
export const GoalAssistantExample: Story = {
  args: {
    position: "bottom-right",
    variant: "gradient",
    size: "lg",
    quickActions: [
      {
        id: "fitness",
        label: "Log Workout",
        icon: defaultQuickActions.fitness.icon,
        color: defaultQuickActions.fitness.color,
        onClick: () => console.log("Log workout")
      },
      {
        id: "learning",
        label: "Study Session",
        icon: defaultQuickActions.learning.icon,
        color: defaultQuickActions.learning.color,
        onClick: () => console.log("Start study session")
      },
      {
        id: "home",
        label: "Home Task",
        icon: defaultQuickActions.home.icon,
        color: defaultQuickActions.home.color,
        onClick: () => console.log("Add home task")
      },
      {
        id: "quick",
        label: "Quick Note",
        icon: defaultQuickActions.quick.icon,
        color: defaultQuickActions.quick.color,
        onClick: () => console.log("Quick note")
      }
    ],
    notifications: 2,
    vibrate: true
  },
  parameters: {
    docs: {
      description: {
        story: "Goal Assistant implementation with module-specific quick actions and notifications."
      }
    }
  }
}

export const MobileInterface: Story = {
  render: () => (
    <div className="relative h-screen bg-white overflow-hidden">
      {/* Mock mobile interface */}
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4">
          <h1 className="text-xl font-bold">Goal Assistant</h1>
          <p className="text-blue-100">Your daily progress</p>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-4 space-y-4">
          <div className="bg-gray-100 h-20 rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Today's Goals</span>
          </div>
          <div className="bg-gray-100 h-20 rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Progress Chart</span>
          </div>
          <div className="bg-gray-100 h-20 rounded-lg flex items-center justify-center">
            <span className="text-gray-500">Recent Activity</span>
          </div>
        </div>
      </div>

      {/* Quick Add Button */}
      <QuickAddButton
        position="bottom-right"
        variant="primary"
        size="lg"
        notifications={1}
        quickActions={[
          {
            id: "goal",
            label: "New Goal",
            icon: <Plus className="w-4 h-4" />,
            color: "bg-blue-500 hover:bg-blue-600",
            onClick: () => console.log("New goal")
          },
          {
            id: "quick",
            label: "Quick Log",
            icon: <Zap className="w-4 h-4" />,
            color: "bg-yellow-500 hover:bg-yellow-600",
            onClick: () => console.log("Quick log")
          }
        ]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Complete mobile interface example showing the Quick Add Button in context."
      }
    }
  }
}

export const AccessibilityFeatures: Story = {
  args: {
    position: "bottom-right",
    variant: "primary",
    label: "Add new goal",
    showLabel: true,
    vibrate: true,
    quickActions: [
      {
        id: "fitness",
        label: "Add fitness goal - Track your workouts and health progress",
        icon: defaultQuickActions.fitness.icon,
        color: defaultQuickActions.fitness.color,
        onClick: () => console.log("Fitness goal with full accessibility")
      },
      {
        id: "learning",
        label: "Add learning goal - Set educational objectives and track progress",
        icon: defaultQuickActions.learning.icon,
        color: defaultQuickActions.learning.color,
        onClick: () => console.log("Learning goal with full accessibility")
      }
    ]
  },
  parameters: {
    docs: {
      description: {
        story: "Quick Add Button with full accessibility features including descriptive labels and haptic feedback."
      }
    }
  }
}

export const InteractiveDemo: Story = {
  render: function InteractiveDemo() {
    const [notifications, setNotifications] = React.useState(3)
    const [showTooltip, setShowTooltip] = React.useState(false)

    const handleMainAction = () => {
      setNotifications(0)
      setShowTooltip(true)
      setTimeout(() => setShowTooltip(false), 2000)
    }

    const handleQuickAction = (actionType: string) => {
      setNotifications(prev => prev + 1)
      console.log(`Quick action: ${actionType}`)
    }

    return (
      <div className="relative h-96 bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden">
        {showTooltip && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black text-white px-3 py-2 rounded-lg text-sm">
            Action completed! ✓
          </div>
        )}
        
        <div className="absolute inset-4 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">Interactive Demo</div>
            <div className="text-sm text-gray-600 mb-4">
              Click the main button or quick actions
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {notifications} notifications
            </div>
          </div>
        </div>

        <QuickAddButton
          position="bottom-right"
          variant="gradient"
          size="lg"
          notifications={notifications}
          onMainAction={handleMainAction}
          quickActions={[
            {
              id: "demo1",
              label: "Demo Action 1",
              icon: <Plus className="w-4 h-4" />,
              color: "bg-green-500 hover:bg-green-600",
              onClick: () => handleQuickAction("Demo 1")
            },
            {
              id: "demo2",
              label: "Demo Action 2",
              icon: <Zap className="w-4 h-4" />,
              color: "bg-purple-500 hover:bg-purple-600",
              onClick: () => handleQuickAction("Demo 2")
            }
          ]}
        />
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demonstration showing notification updates and user feedback."
      }
    }
  }
}