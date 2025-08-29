import type { Meta, StoryObj } from "@storybook/nextjs"
import { fn } from "@storybook/test"
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Dumbbell, 
  BookOpen,
  Home,
  Zap,
  CheckCircle2,
  Play,
  Flame
} from "lucide-react"
import { DataCard } from "./DataCard"

const meta: Meta<typeof DataCard> = {
  title: "Base Components/DataCard",
  component: DataCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Versatile data display card for goals, progress, and metrics. Features trend indicators, progress bars, metadata display, and interactive elements for comprehensive data visualization."
      }
    }
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "primary", "success", "warning", "danger", "info"],
      description: "Visual variant for different data types"
    },
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
      description: "Size variant for different contexts"
    },
    interactive: {
      control: "boolean",
      description: "Enable hover and click interactions"
    },
    title: {
      control: "text",
      description: "Main title of the card"
    },
    description: {
      control: "text",
      description: "Subtitle or description"
    },
    value: {
      control: "text",
      description: "Primary value to display"
    },
    subtitle: {
      control: "text",
      description: "Additional context for the value"
    },
    progress: {
      control: { type: "range", min: 0, max: 100, step: 1 },
      description: "Progress percentage (0-100)"
    },
    progressLabel: {
      control: "text",
      description: "Label for the progress bar"
    },
    loading: {
      control: "boolean",
      description: "Show loading state"
    },
    error: {
      control: "text",
      description: "Error message to display"
    },
    showMenu: {
      control: "boolean",
      description: "Show menu button"
    },
    onClick: { action: "card-clicked" },
    onMenuClick: { action: "menu-clicked" }
  },
  args: {
    onClick: fn(),
    onMenuClick: fn()
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Basic examples
export const Default: Story = {
  args: {
    title: "Daily Steps",
    description: "Today's walking progress",
    value: "7,542",
    subtitle: "steps"
  }
}

export const WithProgress: Story = {
  args: {
    title: "Fitness Goal Progress", 
    description: "30-day challenge",
    value: "18",
    subtitle: "days completed",
    progress: 60,
    progressLabel: "Overall Progress"
  }
}

export const Variants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl">
      <DataCard
        variant="default"
        title="Total Goals"
        value="24"
        subtitle="active"
      />
      <DataCard
        variant="primary"
        title="This Week"
        value="5"
        subtitle="goals completed"
        progress={71}
      />
      <DataCard
        variant="success"
        title="Streak"
        value="12"
        subtitle="days"
        badge={{ text: "Hot!", variant: "success" }}
      />
      <DataCard
        variant="warning"
        title="Overdue"
        value="3"
        subtitle="goals need attention"
        badge={{ text: "Action Needed", variant: "warning" }}
      />
      <DataCard
        variant="danger"
        title="Failed Goals"
        value="1"
        subtitle="this month"
      />
      <DataCard
        variant="info"
        title="Total XP"
        value="1,247"
        subtitle="experience points"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different visual variants for various data types and urgency levels."
      }
    }
  }
}

export const WithTrends: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
      <DataCard
        title="Weekly Goals Completed"
        value="8"
        subtitle="this week"
        trend={{
          direction: "up",
          value: "+25%",
          label: "vs last week"
        }}
        progress={80}
        variant="success"
      />
      <DataCard
        title="Average Daily XP"
        value="127"
        subtitle="experience points"
        trend={{
          direction: "down", 
          value: "-12%",
          label: "vs last week"
        }}
        progress={45}
        variant="warning"
      />
      <DataCard
        title="Goal Success Rate"
        value="85%"
        subtitle="completion rate"
        trend={{
          direction: "up",
          value: "+5%",
          label: "improving"
        }}
        progress={85}
        variant="primary"
      />
      <DataCard
        title="Active Categories"
        value="4"
        subtitle="areas of focus"
        trend={{
          direction: "up",
          value: "+1",
          label: "added this month"
        }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Cards with trend indicators showing improvement or decline in metrics."
      }
    }
  }
}

export const WithMetadata: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
      <DataCard
        title="Morning Workout"
        description="Daily fitness routine"
        value="Completed"
        subtitle="7:30 AM today"
        progress={100}
        variant="success"
        metadata={[
          { icon: <Clock className="w-4 h-4" />, label: "Duration", value: "45 min" },
          { icon: <Target className="w-4 h-4" />, label: "Calories", value: "320" },
          { icon: <Zap className="w-4 h-4" />, label: "XP Earned", value: "+15" }
        ]}
      />
      <DataCard
        title="Spanish Learning"
        description="Daily language practice"
        value="In Progress"
        subtitle="Started 2 hours ago"
        progress={35}
        variant="primary"
        metadata={[
          { icon: <BookOpen className="w-4 h-4" />, label: "Lesson", value: "Chapter 3" },
          { icon: <Calendar className="w-4 h-4" />, label: "Streak", value: "7 days" },
          { icon: <Target className="w-4 h-4" />, label: "Goal", value: "30 days" }
        ]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Cards with detailed metadata showing additional context and metrics."
      }
    }
  }
}

export const WithActions: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
      <DataCard
        title="Home Project: Kitchen"
        description="Paint kitchen cabinets"
        value="75%"
        subtitle="complete"
        progress={75}
        variant="primary"
        actions={[
          {
            label: "Continue",
            icon: <Play className="w-4 h-4" />,
            onClick: () => console.log("Continue project"),
            variant: "default"
          },
          {
            label: "Complete",
            icon: <CheckCircle2 className="w-4 h-4" />,
            onClick: () => console.log("Mark complete"),
            variant: "secondary"
          }
        ]}
        showMenu
      />
      <DataCard
        title="Weekly Fitness Goal"
        description="5 workouts this week"
        value="3/5"
        subtitle="workouts completed"
        progress={60}
        variant="warning"
        actions={[
          {
            label: "Start Workout",
            icon: <Dumbbell className="w-4 h-4" />,
            onClick: () => console.log("Start workout"),
            variant: "default"
          }
        ]}
        badge={{ text: "2 days left", variant: "warning" }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Interactive cards with action buttons for common operations."
      }
    }
  }
}

export const InteractiveCards: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-6xl">
      <DataCard
        interactive
        title="View All Goals"
        description="Click to see your complete goal list"
        value="24"
        subtitle="active goals"
        variant="primary"
      />
      <DataCard
        interactive
        title="Weekly Stats"
        description="Click for detailed analytics"
        value="85%"
        subtitle="success rate"
        progress={85}
        variant="success"
      />
      <DataCard
        interactive
        title="Achievement Gallery"
        description="View your earned badges"
        value="12"
        subtitle="achievements"
        badge={{ text: "NEW", variant: "success" }}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Cards with hover effects and click interactions for navigation."
      }
    }
  }
}

export const LoadingStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
      <DataCard loading title="Loading..." />
      <DataCard loading title="Loading..." />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Loading states with skeleton animations."
      }
    }
  }
}

export const ErrorStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
      <DataCard error="Failed to load goal data" title="Error" />
      <DataCard error="Network timeout" title="Error" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Error states with helpful error messages."
      }
    }
  }
}

// Goal Assistant specific examples
export const GamificationDashboard: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-6xl">
      <DataCard
        title="Current Level"
        value="12"
        subtitle="Achiever"
        progress={67}
        progressLabel="Progress to Level 13"
        variant="primary"
        metadata={[
          { icon: <Zap className="w-4 h-4" />, label: "Total XP", value: "2,340" },
          { icon: <Target className="w-4 h-4" />, label: "Next Level", value: "500 XP" }
        ]}
      />
      <DataCard
        title="Current Streak"
        value="15"
        subtitle="days"
        variant="success"
        badge={{ text: "Fire!", variant: "destructive" }}
        metadata={[
          { icon: <Flame className="w-4 h-4" />, label: "Best Streak", value: "23 days" },
          { icon: <Calendar className="w-4 h-4" />, label: "This Month", value: "15/30" }
        ]}
      />
      <DataCard
        title="Goals This Month"
        value="8/12"
        subtitle="completed"
        progress={67}
        variant="warning"
        trend={{
          direction: "up",
          value: "+2",
          label: "vs last month"
        }}
      />
      <DataCard
        title="Achievements"
        value="24"
        subtitle="earned"
        variant="info"
        badge={{ text: "+3 this week", variant: "success" }}
        actions={[
          {
            label: "View All",
            onClick: () => console.log("View achievements"),
            variant: "ghost"
          }
        ]}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Gamification dashboard showing levels, streaks, and achievements."
      }
    }
  }
}

export const ModuleOverview: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
      <DataCard
        title="Fitness Goals"
        description="Health & wellness tracking"
        value="4/6"
        subtitle="goals active"
        progress={75}
        variant="success"
        metadata={[
          { icon: <Dumbbell className="w-4 h-4" />, label: "Workouts", value: "12 this week" },
          { icon: <Target className="w-4 h-4" />, label: "Streak", value: "8 days" }
        ]}
        actions={[
          {
            label: "Quick Add",
            icon: <Target className="w-4 h-4" />,
            onClick: () => console.log("Add fitness goal"),
            variant: "default"
          }
        ]}
        interactive
      />
      <DataCard
        title="Learning Goals"
        description="Knowledge & skill development"
        value="2/3"
        subtitle="goals active"
        progress={66}
        variant="primary"
        metadata={[
          { icon: <BookOpen className="w-4 h-4" />, label: "Sessions", value: "5 this week" },
          { icon: <Calendar className="w-4 h-4" />, label: "Hours", value: "12.5" }
        ]}
        actions={[
          {
            label: "Study Now",
            icon: <BookOpen className="w-4 h-4" />,
            onClick: () => console.log("Start study session"),
            variant: "default"
          }
        ]}
        interactive
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Module overview cards showing different goal categories with specific icons and actions."
      }
    }
  }
}

export const MobileFriendly: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-3 w-full max-w-sm">
      <DataCard
        title="Today's Goals"
        value="3/5"
        subtitle="completed"
        progress={60}
        size="sm"
        variant="primary"
        actions={[
          {
            label: "View All",
            onClick: () => console.log("View goals"),
            variant: "ghost"
          }
        ]}
      />
      <DataCard
        title="Quick Stats"
        value="127"
        subtitle="XP today"
        size="sm"
        trend={{
          direction: "up",
          value: "+15",
          label: "vs yesterday"
        }}
        variant="success"
      />
      <DataCard
        title="Next Goal"
        description="Morning workout"
        value="7:00 AM"
        subtitle="in 45 minutes"
        size="sm"
        actions={[
          {
            label: "Start Now",
            onClick: () => console.log("Start workout"),
            variant: "default"
          }
        ]}
        variant="warning"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Mobile-optimized cards with compact layout and essential information."
      }
    }
  }
}