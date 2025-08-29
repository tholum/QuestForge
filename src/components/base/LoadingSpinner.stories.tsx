import type { Meta, StoryObj } from "@storybook/nextjs"
import { LoadingSpinner, SkeletonLoader, PulseLoader, DotsLoader } from "./LoadingSpinner"
import { Button } from "./Button"

const meta: Meta<typeof LoadingSpinner> = {
  title: "Base Components/LoadingSpinner",
  component: LoadingSpinner,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Comprehensive loading system with spinners, skeleton loaders, and various animation styles. Includes overlay and full-screen options for different loading contexts."
      }
    }
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "success", "warning", "danger", "white", "current"],
      description: "Color variant for the spinner"
    },
    size: {
      control: "select",
      options: ["xs", "sm", "default", "lg", "xl", "2xl", "3xl"],
      description: "Size of the spinner"
    },
    speed: {
      control: "select",
      options: ["slow", "normal", "fast"],
      description: "Animation speed"
    },
    label: {
      control: "text",
      description: "Accessibility label"
    },
    showLabel: {
      control: "boolean",
      description: "Show text label"
    },
    center: {
      control: "boolean",
      description: "Center the spinner"
    },
    overlay: {
      control: "boolean",
      description: "Show as overlay"
    },
    fullScreen: {
      control: "boolean",
      description: "Show full screen"
    },
    progress: {
      control: { type: "range", min: 0, max: 100, step: 1 },
      description: "Progress percentage for determinate loading"
    },
    indeterminate: {
      control: "boolean",
      description: "Show indeterminate spinner vs progress circle"
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Basic examples
export const Default: Story = {
  args: {
    label: "Loading..."
  }
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6 items-center">
      <div className="text-center">
        <LoadingSpinner variant="default" />
        <div className="text-xs mt-2">Default</div>
      </div>
      <div className="text-center">
        <LoadingSpinner variant="secondary" />
        <div className="text-xs mt-2">Secondary</div>
      </div>
      <div className="text-center">
        <LoadingSpinner variant="success" />
        <div className="text-xs mt-2">Success</div>
      </div>
      <div className="text-center">
        <LoadingSpinner variant="warning" />
        <div className="text-xs mt-2">Warning</div>
      </div>
      <div className="text-center">
        <LoadingSpinner variant="danger" />
        <div className="text-xs mt-2">Danger</div>
      </div>
      <div className="text-center bg-gray-800 p-4 rounded">
        <LoadingSpinner variant="white" />
        <div className="text-xs mt-2 text-white">White</div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different color variants for various contexts and themes."
      }
    }
  }
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6 items-center">
      <div className="text-center">
        <LoadingSpinner size="xs" />
        <div className="text-xs mt-2">XS</div>
      </div>
      <div className="text-center">
        <LoadingSpinner size="sm" />
        <div className="text-xs mt-2">SM</div>
      </div>
      <div className="text-center">
        <LoadingSpinner size="default" />
        <div className="text-xs mt-2">Default</div>
      </div>
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <div className="text-xs mt-2">LG</div>
      </div>
      <div className="text-center">
        <LoadingSpinner size="xl" />
        <div className="text-xs mt-2">XL</div>
      </div>
      <div className="text-center">
        <LoadingSpinner size="2xl" />
        <div className="text-xs mt-2">2XL</div>
      </div>
      <div className="text-center">
        <LoadingSpinner size="3xl" />
        <div className="text-xs mt-2">3XL</div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different size variants for various UI contexts and prominence needs."
      }
    }
  }
}

export const Speeds: Story = {
  render: () => (
    <div className="flex gap-8 items-center">
      <div className="text-center">
        <LoadingSpinner speed="slow" size="lg" />
        <div className="text-sm mt-2">Slow</div>
      </div>
      <div className="text-center">
        <LoadingSpinner speed="normal" size="lg" />
        <div className="text-sm mt-2">Normal</div>
      </div>
      <div className="text-center">
        <LoadingSpinner speed="fast" size="lg" />
        <div className="text-sm mt-2">Fast</div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different animation speeds for various loading contexts."
      }
    }
  }
}

export const WithLabels: Story = {
  render: () => (
    <div className="space-y-6">
      <LoadingSpinner 
        showLabel 
        label="Loading your goals..."
        center
      />
      <LoadingSpinner 
        showLabel 
        label="Saving progress..."
        variant="success"
        center
      />
      <LoadingSpinner 
        showLabel 
        label="Syncing data..."
        variant="secondary"
        size="sm"
        center
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Spinners with descriptive labels for better user understanding."
      }
    }
  }
}

export const DeterminateLoading: Story = {
  render: () => (
    <div className="space-y-6">
      <LoadingSpinner 
        indeterminate={false}
        progress={25}
        showLabel
        label="Uploading..."
        center
      />
      <LoadingSpinner 
        indeterminate={false}
        progress={60}
        showLabel
        label="Processing goals..."
        variant="success"
        center
      />
      <LoadingSpinner 
        indeterminate={false}
        progress={90}
        showLabel
        label="Almost done..."
        variant="warning"
        center
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Determinate loading with progress indicators for known-duration tasks."
      }
    }
  }
}

export const InButton: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button disabled>
        <LoadingSpinner size="sm" variant="current" />
        Loading...
      </Button>
      <Button variant="success" disabled>
        <LoadingSpinner size="sm" variant="current" />
        Saving
      </Button>
      <Button variant="destructive" disabled>
        <LoadingSpinner size="sm" variant="current" />
        Deleting
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Loading spinners integrated into buttons for action feedback."
      }
    }
  }
}

export const OverlayExample: Story = {
  render: () => (
    <div className="relative w-96 h-64 bg-gray-100 rounded-lg border p-4">
      <h3 className="text-lg font-semibold mb-4">Goal Dashboard</h3>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
      
      <LoadingSpinner 
        overlay 
        showLabel 
        label="Loading dashboard..."
        variant="primary"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Overlay spinner for loading states over existing content."
      }
    }
  }
}

export const FullScreenExample: Story = {
  render: () => {
    const [showFullScreen, setShowFullScreen] = React.useState(false)

    const handleShowFullScreen = () => {
      setShowFullScreen(true)
      setTimeout(() => setShowFullScreen(false), 3000)
    }

    return (
      <div className="text-center">
        <Button onClick={handleShowFullScreen}>
          Show Full Screen Loading
        </Button>
        
        {showFullScreen && (
          <LoadingSpinner 
            fullScreen 
            showLabel 
            label="Initializing Goal Assistant..."
            size="xl"
          />
        )}
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: "Full screen loading for app initialization and major operations."
      }
    }
  }
}

// Alternative loading components
export const SkeletonLoaderExample: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      <div>
        <h4 className="text-sm font-medium mb-3">Goal Cards Loading</h4>
        <div className="space-y-3">
          <SkeletonLoader lines={2} width={["100%", "75%"]} />
          <SkeletonLoader lines={2} width={["100%", "60%"]} />
          <SkeletonLoader lines={2} width={["100%", "80%"]} />
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-medium mb-3">Profile Section</h4>
        <SkeletonLoader 
          lines={4} 
          width={["40%", "100%", "90%", "70%"]}
          height="1.25rem"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Skeleton loaders for content placeholders with configurable dimensions."
      }
    }
  }
}

export const PulseLoaderExample: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div>Small Pulse</div>
        <PulseLoader size="sm" />
      </div>
      
      <div className="text-center space-y-4">
        <div>Default Pulse</div>
        <PulseLoader size="default" variant="success" />
      </div>
      
      <div className="text-center space-y-4">
        <div>Large Pulse</div>
        <PulseLoader size="lg" variant="warning" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Pulse loader with smooth scaling animation for subtle loading states."
      }
    }
  }
}

export const DotsLoaderExample: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div>Small Dots</div>
        <DotsLoader size="sm" />
      </div>
      
      <div className="text-center space-y-4">
        <div>Default Dots</div>
        <DotsLoader size="default" variant="success" />
      </div>
      
      <div className="text-center space-y-4">
        <div>Large Dots</div>
        <DotsLoader size="lg" variant="danger" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Bouncing dots loader for playful loading animations."
      }
    }
  }
}

// Goal Assistant specific examples
export const GoalLoadingStates: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
      <div className="space-y-4">
        <h4 className="font-medium">Dashboard Loading</h4>
        <div className="relative bg-white border rounded-lg p-4 h-48">
          <h3 className="font-semibold mb-3">Your Goals</h3>
          <SkeletonLoader lines={3} />
          <LoadingSpinner 
            overlay 
            showLabel 
            label="Loading your goals..."
            size="sm"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Progress Sync</h4>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium">Syncing Progress</span>
            <LoadingSpinner size="sm" variant="success" />
          </div>
          <LoadingSpinner 
            indeterminate={false}
            progress={75}
            showLabel
            label="Uploading achievements..."
            center
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Goal Creation</h4>
        <div className="flex gap-2 items-center">
          <span className="text-sm">Creating your fitness goal</span>
          <DotsLoader size="sm" variant="success" />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Data Processing</h4>
        <div className="flex gap-2 items-center">
          <span className="text-sm">Calculating XP rewards</span>
          <PulseLoader size="sm" variant="warning" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Goal Assistant specific loading states for different app sections."
      }
    }
  }
}

export const MobileLoadingStates: Story = {
  render: () => (
    <div className="w-full max-w-sm space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-3 mb-4">
          <LoadingSpinner size="sm" />
          <span className="text-sm">Refreshing goals...</span>
        </div>
        <SkeletonLoader lines={3} />
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-medium mb-3">Quick Add Goal</h3>
        <div className="space-y-3">
          <div className="h-10 bg-gray-100 rounded border"></div>
          <div className="flex gap-2">
            <Button disabled className="flex-1">
              <LoadingSpinner size="xs" variant="current" />
              Creating...
            </Button>
          </div>
        </div>
      </div>

      <div className="text-center py-8">
        <LoadingSpinner size="lg" />
        <div className="text-sm text-gray-600 mt-2">
          Loading your achievements...
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Mobile-optimized loading states with appropriate sizing and spacing."
      }
    }
  }
}

export const InteractiveDemo: Story = {
  render: function InteractiveDemo() {
    const [loading, setLoading] = React.useState(false)
    const [progress, setProgress] = React.useState(0)
    const [loadingType, setLoadingType] = React.useState<'spinner' | 'skeleton' | 'progress'>('spinner')

    const simulateLoading = () => {
      setLoading(true)
      setProgress(0)

      if (loadingType === 'progress') {
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval)
              setLoading(false)
              return 0
            }
            return prev + 10
          })
        }, 200)
      } else {
        setTimeout(() => setLoading(false), 3000)
      }
    }

    return (
      <div className="space-y-6 w-full max-w-md">
        <div className="flex gap-2 justify-center">
          <Button 
            size="sm" 
            variant={loadingType === 'spinner' ? 'default' : 'outline'}
            onClick={() => setLoadingType('spinner')}
          >
            Spinner
          </Button>
          <Button 
            size="sm" 
            variant={loadingType === 'skeleton' ? 'default' : 'outline'}
            onClick={() => setLoadingType('skeleton')}
          >
            Skeleton
          </Button>
          <Button 
            size="sm" 
            variant={loadingType === 'progress' ? 'default' : 'outline'}
            onClick={() => setLoadingType('progress')}
          >
            Progress
          </Button>
        </div>

        <Button 
          onClick={simulateLoading} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Loading..." : "Start Demo"}
        </Button>

        <div className="min-h-32 border rounded-lg p-4 relative">
          {!loading && (
            <div className="text-center text-gray-500 py-8">
              Click "Start Demo" to see loading state
            </div>
          )}

          {loading && loadingType === 'spinner' && (
            <LoadingSpinner 
              center 
              showLabel 
              label="Processing your request..."
            />
          )}

          {loading && loadingType === 'skeleton' && (
            <SkeletonLoader lines={4} width={["100%", "75%", "90%", "60%"]} />
          )}

          {loading && loadingType === 'progress' && (
            <LoadingSpinner 
              indeterminate={false}
              progress={progress}
              showLabel
              label={`Loading... ${progress}%`}
              center
            />
          )}
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demo showing different loading types and their behaviors."
      }
    }
  }
}