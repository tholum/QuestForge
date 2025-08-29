import type { Meta, StoryObj } from "@storybook/nextjs"
import { StatusBadge, getGoalStatus, getPriorityStatus, getProgressStatus } from "./StatusBadge"
import { Target, Zap } from "lucide-react"

const meta: Meta<typeof StatusBadge> = {
  title: "Base Components/StatusBadge",
  component: StatusBadge,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Comprehensive status badge component for goals, priorities, and progress states. Features built-in icons, animations, and helper functions for dynamic status determination."
      }
    }
  },
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "select",
      options: [
        "active", "completed", "paused", "cancelled", "pending", "overdue",
        "low", "medium", "high", "critical",
        "notStarted", "inProgress", "review",
        "streak", "achievement", "levelUp"
      ],
      description: "Status type to display"
    },
    size: {
      control: "select",
      options: ["xs", "sm", "default", "lg"],
      description: "Size variant"
    },
    variant: {
      control: "select",
      options: ["default", "solid", "outline", "ghost"],
      description: "Visual style variant"
    },
    rounded: {
      control: "select",
      options: ["default", "sm", "lg", "full", "none"],
      description: "Border radius variant"
    },
    showIcon: {
      control: "boolean",
      description: "Show status icon"
    },
    customLabel: {
      control: "text",
      description: "Custom label text"
    },
    count: {
      control: "number",
      description: "Count to display after label"
    },
    pulse: {
      control: "boolean",
      description: "Add pulse animation"
    },
    tooltip: {
      control: "text",
      description: "Tooltip text"
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Basic examples
export const Default: Story = {
  args: {
    status: "active"
  }
}

export const GoalStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge status="active" />
      <StatusBadge status="completed" />
      <StatusBadge status="paused" />
      <StatusBadge status="cancelled" />
      <StatusBadge status="pending" />
      <StatusBadge status="overdue" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Standard goal status indicators with appropriate colors and icons."
      }
    }
  }
}

export const PriorityLevels: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge status="low" />
      <StatusBadge status="medium" />
      <StatusBadge status="high" />
      <StatusBadge status="critical" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Priority level indicators with escalating visual importance."
      }
    }
  }
}

export const ProgressStates: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge status="notStarted" />
      <StatusBadge status="inProgress" />
      <StatusBadge status="review" />
      <StatusBadge status="completed" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Progress state indicators for workflow stages."
      }
    }
  }
}

export const GamificationStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge status="streak" count={15} />
      <StatusBadge status="achievement" customLabel="First Goal!" />
      <StatusBadge status="levelUp" customLabel="Level 5!" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Gamification-related status badges with special animations and styling."
      }
    }
  }
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <StatusBadge status="active" size="xs" />
      <StatusBadge status="active" size="sm" />
      <StatusBadge status="active" size="default" />
      <StatusBadge status="active" size="lg" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different size variants for various UI contexts."
      }
    }
  }
}

export const Variants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <StatusBadge status="active" variant="default" customLabel="Default" />
        <StatusBadge status="active" variant="solid" customLabel="Solid" />
        <StatusBadge status="active" variant="outline" customLabel="Outline" />
        <StatusBadge status="active" variant="ghost" customLabel="Ghost" />
      </div>
      <div className="flex flex-wrap gap-3">
        <StatusBadge status="completed" variant="default" />
        <StatusBadge status="completed" variant="solid" />
        <StatusBadge status="completed" variant="outline" />
        <StatusBadge status="completed" variant="ghost" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different visual style variants for various design needs."
      }
    }
  }
}

export const RoundedVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge status="active" rounded="none" />
      <StatusBadge status="active" rounded="sm" />
      <StatusBadge status="active" rounded="default" />
      <StatusBadge status="active" rounded="lg" />
      <StatusBadge status="active" rounded="full" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different border radius options for various design aesthetics."
      }
    }
  }
}

export const CustomLabelsAndCounts: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge 
        status="active" 
        customLabel="In Progress" 
        count={5} 
      />
      <StatusBadge 
        status="completed" 
        customLabel="Finished Today" 
        count={3} 
      />
      <StatusBadge 
        status="overdue" 
        customLabel="Needs Attention" 
        count={2} 
      />
      <StatusBadge 
        status="streak" 
        customLabel="Daily Streak" 
        count={28} 
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Custom labels and count displays for specific use cases."
      }
    }
  }
}

export const WithCustomIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge 
        status="active" 
        customIcon={<Target className="w-3 h-3" />}
        customLabel="Goal Active"
      />
      <StatusBadge 
        status="levelUp" 
        customIcon={<Zap className="w-3 h-3" />}
        customLabel="Power Up!"
      />
      <StatusBadge 
        status="completed" 
        showIcon={false}
        customLabel="No Icon"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Custom icons and icon visibility controls."
      }
    }
  }
}

export const WithAnimations: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge status="overdue" />
      <StatusBadge status="levelUp" />
      <StatusBadge status="streak" pulse />
      <StatusBadge status="achievement" pulse customLabel="New Badge!" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Animated badges for attention-grabbing statuses and achievements."
      }
    }
  }
}

export const WithTooltips: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusBadge 
        status="active" 
        tooltip="This goal is currently active and being worked on"
      />
      <StatusBadge 
        status="overdue" 
        tooltip="This goal is past its due date and needs attention"
      />
      <StatusBadge 
        status="streak" 
        count={15}
        tooltip="You've completed goals for 15 consecutive days!"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Badges with helpful tooltips providing additional context."
      }
    }
  }
}

// Helper function examples
export const HelperFunctions: Story = {
  render: function HelperExample() {
    const goalExamples = [
      { isCompleted: false, isPaused: false, isCancelled: false, dueDate: null, startDate: null },
      { isCompleted: true, isPaused: false, isCancelled: false, dueDate: null, startDate: null },
      { isCompleted: false, isPaused: true, isCancelled: false, dueDate: null, startDate: null },
      { isCompleted: false, isPaused: false, isCancelled: false, dueDate: new Date(Date.now() - 86400000), startDate: null }, // overdue
      { isCompleted: false, isPaused: false, isCancelled: false, dueDate: null, startDate: new Date(Date.now() + 86400000) }, // pending
    ]

    return (
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Goal Status Helper</h4>
          <div className="flex flex-wrap gap-2">
            {goalExamples.map((goal, index) => (
              <StatusBadge 
                key={index}
                status={getGoalStatus(goal)}
              />
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Priority Status Helper</h4>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={getPriorityStatus("low")} />
            <StatusBadge status={getPriorityStatus("high")} />
            <StatusBadge status={getPriorityStatus("critical")} />
            <StatusBadge status={getPriorityStatus(1)} />
            <StatusBadge status={getPriorityStatus(4)} />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Progress Status Helper</h4>
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={getProgressStatus(0)} />
            <StatusBadge status={getProgressStatus(45)} />
            <StatusBadge status={getProgressStatus(100)} />
          </div>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: "Demonstration of helper functions that automatically determine status based on goal data."
      }
    }
  }
}

// Goal Assistant specific examples
export const GoalManagementInterface: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-2xl">
      <div>
        <h4 className="text-sm font-medium mb-3">Active Goals</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <div className="font-medium">Complete morning workout</div>
              <div className="text-sm text-muted-foreground">Fitness • Due in 2 hours</div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="high" size="sm" />
              <StatusBadge status="active" size="sm" />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <div className="font-medium">Read chapter 5 of TypeScript book</div>
              <div className="text-sm text-muted-foreground">Learning • Due tomorrow</div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="medium" size="sm" />
              <StatusBadge status="inProgress" size="sm" />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50 border-red-200">
            <div className="flex-1">
              <div className="font-medium">Submit project proposal</div>
              <div className="text-sm text-muted-foreground">Work • Overdue by 1 day</div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status="critical" size="sm" />
              <StatusBadge status="overdue" size="sm" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-3">Recent Achievements</h4>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="streak" count={7} customLabel="Weekly Streak" />
          <StatusBadge status="achievement" customLabel="First Fitness Goal" />
          <StatusBadge status="levelUp" customLabel="Reached Level 3" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Real-world example of status badges in a goal management interface."
      }
    }
  }
}

export const MobileDashboard: Story = {
  render: () => (
    <div className="w-full max-w-sm space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Today's Status</h3>
          <StatusBadge status="levelUp" size="sm" customLabel="Level 5!" />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold">3/5</div>
            <div className="text-xs text-muted-foreground mb-1">Goals</div>
            <StatusBadge status="inProgress" size="xs" />
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">12</div>
            <div className="text-xs text-muted-foreground mb-1">Streak</div>
            <StatusBadge status="streak" size="xs" />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>High Priority</span>
          <StatusBadge status="high" count={2} size="xs" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Overdue</span>
          <StatusBadge status="overdue" count={1} size="xs" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span>Completed Today</span>
          <StatusBadge status="completed" count={3} size="xs" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Mobile-optimized dashboard with compact status badges and counts."
      }
    }
  }
}