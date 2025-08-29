import type { Meta, StoryObj } from "@storybook/nextjs"
import { ProgressIndicator, CircularProgress } from "./ProgressIndicator"
import { Target, Trophy, Zap } from "lucide-react"

const meta: Meta<typeof ProgressIndicator> = {
  title: "Base Components/ProgressIndicator",
  component: ProgressIndicator,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Advanced progress indicator with gamification features, animations, and milestone tracking. Perfect for goal tracking and user engagement in ADHD-friendly interfaces."
      }
    }
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "success", "warning", "danger", "gamified"],
      description: "Visual style variant"
    },
    size: {
      control: "select",
      options: ["sm", "default", "lg", "xl"],
      description: "Text and spacing size"
    },
    animation: {
      control: "select",
      options: ["none", "pulse", "bounce", "glow"],
      description: "Animation style"
    },
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
      description: "Progress value (0-100)"
    },
    max: {
      control: "number",
      description: "Maximum value for progress calculation"
    },
    label: {
      control: "text",
      description: "Label for the progress indicator"
    },
    showPercentage: {
      control: "boolean",
      description: "Show percentage value"
    },
    showValue: {
      control: "boolean",
      description: "Show current/max value"
    },
    showGamification: {
      control: "boolean",
      description: "Show gamification elements"
    },
    level: {
      control: "number",
      description: "Current level for gamification"
    },
    xp: {
      control: "number",
      description: "Current XP points"
    },
    nextLevelXp: {
      control: "number",
      description: "XP needed for next level"
    },
    streak: {
      control: "number",
      description: "Current streak count"
    },
    achievements: {
      control: "number",
      description: "Total achievements earned"
    },
    animateOnMount: {
      control: "boolean",
      description: "Animate progress from 0 on mount"
    },
    celebrateOnComplete: {
      control: "boolean",
      description: "Show celebration when progress reaches 100%"
    },
    barHeight: {
      control: "select",
      options: ["xs", "sm", "default", "lg", "xl"],
      description: "Height of the progress bar"
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Basic examples
export const Default: Story = {
  args: {
    value: 65,
    label: "Goal Progress"
  }
}

export const BasicVariants: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <ProgressIndicator
        variant="default"
        value={45}
        label="Default Progress"
      />
      <ProgressIndicator
        variant="success"
        value={85}
        label="Success Progress"
      />
      <ProgressIndicator
        variant="warning"
        value={25}
        label="Warning Progress"
      />
      <ProgressIndicator
        variant="danger"
        value={10}
        label="Danger Progress"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different visual variants for various progress states and contexts."
      }
    }
  }
}

export const WithValues: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <ProgressIndicator
        value={75}
        max={100}
        label="Percentage Display"
        showPercentage
      />
      <ProgressIndicator
        value={15}
        max={20}
        label="Value Display"
        showValue
        showPercentage={false}
      />
      <ProgressIndicator
        value={350}
        max={500}
        label="Both Displays"
        showValue
        showPercentage
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Progress indicators with different value display options."
      }
    }
  }
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <ProgressIndicator
        value={60}
        label="Small Size"
        size="sm"
      />
      <ProgressIndicator
        value={60}
        label="Default Size"
        size="default"
      />
      <ProgressIndicator
        value={60}
        label="Large Size"
        size="lg"
      />
      <ProgressIndicator
        value={60}
        label="Extra Large Size"
        size="xl"
      />
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

export const BarHeights: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <ProgressIndicator
        value={70}
        label="Extra Small Bar"
        barHeight="xs"
      />
      <ProgressIndicator
        value={70}
        label="Small Bar"
        barHeight="sm"
      />
      <ProgressIndicator
        value={70}
        label="Default Bar"
        barHeight="default"
      />
      <ProgressIndicator
        value={70}
        label="Large Bar"
        barHeight="lg"
      />
      <ProgressIndicator
        value={70}
        label="Extra Large Bar"
        barHeight="xl"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different progress bar heights for various visual emphasis needs."
      }
    }
  }
}

export const WithMilestones: Story = {
  args: {
    value: 65,
    label: "Learning Goal Progress",
    showMilestones: true,
    milestones: [
      { value: 25, label: "Basics" },
      { value: 50, label: "Intermediate" },
      { value: 75, label: "Advanced" },
      { value: 100, label: "Expert" }
    ]
  },
  parameters: {
    docs: {
      description: {
        story: "Progress indicator with milestone markers showing key achievement points."
      }
    }
  }
}

export const Gamified: Story = {
  args: {
    value: 75,
    variant: "gamified",
    label: "Fitness Challenge",
    showGamification: true,
    level: 5,
    xp: 1250,
    nextLevelXp: 1500,
    streak: 12,
    achievements: 8
  },
  parameters: {
    docs: {
      description: {
        story: "Fully gamified progress indicator with level, XP, streak, and achievement tracking."
      }
    }
  }
}

export const Animations: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <ProgressIndicator
        value={45}
        label="Animated Entry"
        animateOnMount
      />
      <ProgressIndicator
        value={100}
        label="Celebration Complete"
        celebrateOnComplete
        variant="success"
      />
      <ProgressIndicator
        value={85}
        label="Pulsing Progress"
        animation="pulse"
      />
      <ProgressIndicator
        value={25}
        label="Glowing Progress"
        animation="glow"
        variant="gamified"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Various animation options for enhanced user engagement."
      }
    }
  }
}

export const CircularProgressExample: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6 items-center justify-center">
      <CircularProgress value={25} size={80} />
      <CircularProgress 
        value={60} 
        size={120} 
        strokeWidth={12}
        color="hsl(var(--success))"
      />
      <CircularProgress 
        value={90} 
        size={100} 
        strokeWidth={8}
        color="hsl(var(--warning))"
      />
      <CircularProgress 
        value={100} 
        size={140} 
        strokeWidth={16}
        color="hsl(var(--success))"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Circular progress indicators with different sizes, stroke widths, and colors."
      }
    }
  }
}

// Goal Assistant specific examples
export const GoalTrackingExample: Story = {
  render: () => (
    <div className="space-y-8 w-full max-w-lg">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">30-Day Fitness Challenge</h3>
        <ProgressIndicator
          value={18}
          max={30}
          label="Days Completed"
          variant="success"
          showValue
          showPercentage
          showMilestones
          milestones={[
            { value: 7, label: "Week 1" },
            { value: 14, label: "Week 2" },
            { value: 21, label: "Week 3" },
            { value: 30, label: "Complete!" }
          ]}
          barHeight="lg"
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Spanish Learning Journey</h3>
        <ProgressIndicator
          value={340}
          max={500}
          label="Vocabulary Words"
          variant="primary"
          showValue
          showGamification
          level={3}
          xp={340}
          nextLevelXp={500}
          streak={15}
          achievements={5}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Home Project: Kitchen Renovation</h3>
        <ProgressIndicator
          value={85}
          label="Project Completion"
          variant="warning"
          showPercentage
          showMilestones
          milestones={[
            { value: 25, label: "Planning" },
            { value: 50, label: "Demo" },
            { value: 75, label: "Install" },
            { value: 100, label: "Finish" }
          ]}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Real-world goal tracking examples with different progress types and contexts."
      }
    }
  }
}

export const GamificationDashboard: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Player Progress</h3>
        <ProgressIndicator
          value={1847}
          max={2500}
          label="Experience Points"
          variant="gamified"
          showGamification
          level={7}
          xp={1847}
          nextLevelXp={2500}
          streak={23}
          achievements={15}
          barHeight="lg"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">This Month's Goals</h3>
        <ProgressIndicator
          value={12}
          max={15}
          label="Goals Completed"
          variant="success"
          showValue
          showPercentage
          celebrateOnComplete={false}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Weekly Streak</h3>
        <ProgressIndicator
          value={6}
          max={7}
          label="Consecutive Days"
          variant="warning"
          showValue
          animation="glow"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Achievement Hunter</h3>
        <ProgressIndicator
          value={24}
          max={30}
          label="Badges Collected"
          variant="gamified"
          showValue
          showPercentage
          showMilestones
          milestones={[
            { value: 10, label: "Bronze" },
            { value: 20, label: "Silver" },
            { value: 30, label: "Gold" }
          ]}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Comprehensive gamification dashboard with multiple progress indicators."
      }
    }
  }
}

export const MobileOptimized: Story = {
  render: () => (
    <div className="w-full max-w-sm space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-3">Today's Progress</h3>
        <ProgressIndicator
          value={4}
          max={6}
          label="Daily Goals"
          variant="primary"
          showValue
          size="lg"
          barHeight="lg"
        />
      </div>

      <div className="space-y-4">
        <ProgressIndicator
          value={85}
          label="Morning Routine"
          variant="success"
          size="sm"
          showPercentage
        />
        <ProgressIndicator
          value={45}
          label="Reading Goal"
          variant="default"
          size="sm"
          showPercentage
        />
        <ProgressIndicator
          value={15}
          label="Exercise Target"
          variant="warning"
          size="sm"
          showPercentage
        />
      </div>

      <div className="flex justify-center space-x-6">
        <div className="text-center">
          <CircularProgress value={75} size={80} />
          <div className="text-sm font-medium mt-2">Week</div>
        </div>
        <div className="text-center">
          <CircularProgress 
            value={45} 
            size={80}
            color="hsl(var(--warning))"
          />
          <div className="text-sm font-medium mt-2">Month</div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Mobile-optimized layout with compact progress indicators and circular variants."
      }
    }
  }
}

export const InteractiveDemo: Story = {
  render: function InteractiveDemo() {
    const [progress, setProgress] = React.useState(45)
    
    const handleIncrease = () => setProgress(Math.min(100, progress + 10))
    const handleDecrease = () => setProgress(Math.max(0, progress - 10))
    const handleReset = () => setProgress(0)

    return (
      <div className="space-y-6 w-full max-w-md">
        <ProgressIndicator
          value={progress}
          label="Interactive Progress"
          variant="gamified"
          showPercentage
          celebrateOnComplete
          animateOnMount
        />
        
        <div className="flex gap-2 justify-center">
          <button 
            onClick={handleDecrease}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm"
          >
            -10%
          </button>
          <button 
            onClick={handleReset}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
          >
            Reset
          </button>
          <button 
            onClick={handleIncrease}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm"
          >
            +10%
          </button>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demo showing progress changes with celebration animation at 100%."
      }
    }
  }
}