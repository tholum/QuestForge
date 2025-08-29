import type { Meta, StoryObj } from '@storybook/react'
import { SwipeActions, commonSwipeActions, SwipeAction } from './SwipeActions'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle, Clock, Star, Target, Heart, BookOpen, Zap, Trophy } from 'lucide-react'

const meta: Meta<typeof SwipeActions> = {
  title: 'Mobile/SwipeActions',
  component: SwipeActions,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
SwipeActions provides touch-based swipe gestures for mobile goal management:
- Configurable left and right swipe actions
- Visual feedback with haptic vibration
- Automatic reset after action execution
- Threshold-based activation (default 80px)
- Keyboard navigation support with arrow keys
- Accessibility features for screen readers
- Smooth animations and responsive design
        `
      }
    }
  },
  argTypes: {
    leftActions: {
      control: 'object',
      description: 'Array of actions available on left swipe'
    },
    rightActions: {
      control: 'object',
      description: 'Array of actions available on right swipe'
    },
    disabled: {
      control: 'boolean',
      description: 'Disable all swipe interactions'
    },
    threshold: {
      control: 'number',
      description: 'Distance in pixels required to trigger action'
    },
    onSwipeStart: {
      action: 'swipe-start',
      description: 'Callback when swipe gesture begins'
    },
    onSwipeEnd: {
      action: 'swipe-end',
      description: 'Callback when swipe gesture ends'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

const SampleCard = ({ 
  title, 
  description, 
  status = 'pending',
  xp = 0 
}: {
  title: string
  description: string
  status?: string
  xp?: number
}) => (
  <Card className="w-full">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        {xp > 0 && (
          <div className="flex items-center space-x-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full ml-4">
            <Star className="w-3 h-3" />
            <span>+{xp} XP</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center space-x-2 text-blue-600">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium capitalize">{status}</span>
        </div>
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          <Target className="w-4 h-4 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
)

/**
 * Basic swipe actions - left to complete, right to delete
 */
export const Basic: Story = {
  args: {
    leftActions: [
      {
        ...commonSwipeActions.complete,
        onAction: () => console.log('Goal completed!')
      }
    ],
    rightActions: [
      {
        ...commonSwipeActions.delete,
        onAction: () => console.log('Goal deleted!')
      }
    ],
    children: (
      <SampleCard
        title="Morning Workout"
        description="30-minute cardio session"
        status="pending"
        xp={25}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Swipe left to complete the goal, swipe right to delete. Actions trigger at 80px threshold.'
      }
    },
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
}

/**
 * Multiple actions on each side
 */
export const MultipleActions: Story = {
  args: {
    leftActions: [
      {
        ...commonSwipeActions.complete,
        onAction: () => console.log('Completed!')
      },
      {
        ...commonSwipeActions.favorite,
        onAction: () => console.log('Added to favorites!')
      }
    ],
    rightActions: [
      {
        ...commonSwipeActions.edit,
        onAction: () => console.log('Edit goal')
      },
      {
        ...commonSwipeActions.archive,
        onAction: () => console.log('Archived goal')
      },
      {
        ...commonSwipeActions.delete,
        onAction: () => console.log('Deleted goal')
      }
    ],
    children: (
      <SampleCard
        title="Learn Spanish"
        description="Complete Duolingo lesson"
        status="in-progress"
        xp={15}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple actions available - swipe further to reveal additional actions. Left: Complete, Favorite. Right: Edit, Archive, Delete.'
      }
    },
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
}

/**
 * Custom actions with different colors
 */
export const CustomActions: Story = {
  args: {
    leftActions: [
      {
        id: 'celebrate',
        icon: Trophy,
        label: 'Celebrate',
        color: 'yellow',
        onAction: () => console.log('Celebrating achievement!')
      } as SwipeAction,
      {
        id: 'share',
        icon: Heart,
        label: 'Share',
        color: 'red',
        onAction: () => console.log('Sharing progress!')
      } as SwipeAction
    ],
    rightActions: [
      {
        id: 'postpone',
        icon: Clock,
        label: 'Postpone',
        color: 'blue',
        onAction: () => console.log('Postponed goal')
      } as SwipeAction,
      {
        id: 'boost',
        icon: Zap,
        label: 'Boost',
        color: 'yellow',
        onAction: () => console.log('Boosted with extra XP!')
      } as SwipeAction
    ],
    children: (
      <SampleCard
        title="Weekly Reading Goal"
        description="Read 3 books this week"
        status="almost-complete"
        xp={100}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom actions with different icons and colors. Shows flexibility of the swipe system for various use cases.'
      }
    },
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
}

/**
 * Left actions only
 */
export const LeftActionsOnly: Story = {
  args: {
    leftActions: [
      {
        ...commonSwipeActions.complete,
        onAction: () => console.log('Quick complete!')
      }
    ],
    children: (
      <SampleCard
        title="Quick Task"
        description="Simple daily habit"
        status="pending"
        xp={5}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Only left swipe actions available - useful for simple completion actions.'
      }
    },
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
}

/**
 * Right actions only
 */
export const RightActionsOnly: Story = {
  args: {
    rightActions: [
      {
        ...commonSwipeActions.edit,
        onAction: () => console.log('Edit mode')
      },
      {
        ...commonSwipeActions.delete,
        onAction: () => console.log('Delete confirmed')
      }
    ],
    children: (
      <SampleCard
        title="Draft Goal"
        description="This goal is still being planned"
        status="draft"
        xp={0}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Only right swipe actions available - useful for management actions like edit/delete.'
      }
    },
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
}

/**
 * Disabled state
 */
export const Disabled: Story = {
  args: {
    disabled: true,
    leftActions: [
      {
        ...commonSwipeActions.complete,
        onAction: () => console.log('This should not fire')
      }
    ],
    rightActions: [
      {
        ...commonSwipeActions.delete,
        onAction: () => console.log('This should not fire')
      }
    ],
    children: (
      <SampleCard
        title="Locked Goal"
        description="This goal cannot be modified right now"
        status="locked"
        xp={0}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled swipe actions - useful for locked or readonly content.'
      }
    },
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
}

/**
 * Custom threshold
 */
export const CustomThreshold: Story = {
  args: {
    threshold: 120,
    leftActions: [
      {
        ...commonSwipeActions.complete,
        onAction: () => console.log('Harder swipe required!')
      }
    ],
    rightActions: [
      {
        ...commonSwipeActions.delete,
        onAction: () => console.log('Careful deletion!')
      }
    ],
    children: (
      <SampleCard
        title="Important Goal"
        description="Requires longer swipe to prevent accidental actions"
        status="critical"
        xp={50}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Higher threshold (120px) requires more deliberate swipe actions - useful for important or destructive actions.'
      }
    },
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
}

/**
 * List of swipeable items
 */
export const SwipeableList: Story = {
  render: () => {
    const goals = [
      { id: 1, title: "Morning Meditation", description: "10 minutes of mindfulness", status: "pending", xp: 20 },
      { id: 2, title: "Healthy Lunch", description: "Prepare nutritious meal", status: "completed", xp: 15 },
      { id: 3, title: "Evening Walk", description: "30-minute neighborhood walk", status: "in-progress", xp: 25 },
      { id: 4, title: "Journal Writing", description: "Reflect on today's experiences", status: "pending", xp: 10 },
    ]

    return (
      <div className="space-y-3 max-w-sm">
        {goals.map((goal) => (
          <SwipeActions
            key={goal.id}
            leftActions={goal.status !== 'completed' ? [
              {
                ...commonSwipeActions.complete,
                onAction: () => console.log(`Completed: ${goal.title}`)
              }
            ] : [
              {
                ...commonSwipeActions.favorite,
                onAction: () => console.log(`Favorited: ${goal.title}`)
              }
            ]}
            rightActions={[
              {
                ...commonSwipeActions.edit,
                onAction: () => console.log(`Edit: ${goal.title}`)
              },
              {
                ...commonSwipeActions.delete,
                onAction: () => console.log(`Delete: ${goal.title}`)
              }
            ]}
            className="rounded-lg overflow-hidden"
          >
            <SampleCard
              title={goal.title}
              description={goal.description}
              status={goal.status}
              xp={goal.xp}
            />
          </SwipeActions>
        ))}
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Multiple swipeable items in a list showing different states and contextual actions.'
      }
    },
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
}

/**
 * Goal management workflow
 */
export const GoalWorkflow: Story = {
  render: () => {
    const workflowSteps = [
      {
        title: "Plan Your Day",
        description: "Review and organize today's goals",
        leftActions: [
          {
            id: 'start-planning',
            icon: BookOpen,
            label: 'Start',
            color: 'blue',
            onAction: () => console.log('Started planning session')
          } as SwipeAction
        ],
        rightActions: [
          {
            ...commonSwipeActions.edit,
            onAction: () => console.log('Edit planning template')
          }
        ]
      },
      {
        title: "Track Progress",
        description: "Log completion of your goals",
        leftActions: [
          {
            ...commonSwipeActions.complete,
            onAction: () => console.log('Marked progress')
          }
        ],
        rightActions: [
          {
            id: 'add-note',
            icon: BookOpen,
            label: 'Note',
            color: 'gray',
            onAction: () => console.log('Added progress note')
          } as SwipeAction
        ]
      },
      {
        title: "Celebrate Wins",
        description: "Acknowledge your achievements",
        leftActions: [
          {
            id: 'celebrate',
            icon: Trophy,
            label: 'Celebrate',
            color: 'yellow',
            onAction: () => console.log('Celebrated achievement!')
          } as SwipeAction,
          {
            id: 'share',
            icon: Heart,
            label: 'Share',
            color: 'red',
            onAction: () => console.log('Shared achievement!')
          } as SwipeAction
        ]
      }
    ]

    return (
      <div className="space-y-4 max-w-sm">
        <div className="text-center mb-6">
          <h3 className="font-semibold text-lg">Daily Goal Workflow</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Swipe to interact with each step
          </p>
        </div>
        {workflowSteps.map((step, index) => (
          <SwipeActions
            key={index}
            leftActions={step.leftActions}
            rightActions={step.rightActions}
            className="rounded-lg overflow-hidden"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{step.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </SwipeActions>
        ))}
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Complete goal management workflow showing how swipe actions can guide users through different stages of goal achievement.'
      }
    },
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
}

/**
 * Accessibility demonstration
 */
export const Accessibility: Story = {
  args: {
    leftActions: [
      {
        ...commonSwipeActions.complete,
        onAction: () => console.log('Completed via keyboard or swipe!')
      }
    ],
    rightActions: [
      {
        ...commonSwipeActions.edit,
        onAction: () => console.log('Edit via keyboard or swipe!')
      }
    ],
    children: (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <h3 className="font-semibold">Accessible Swipe Actions</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Touch: Swipe left to complete, right to edit</p>
              <p>• Keyboard: Use ← arrow for left action, → arrow for right action</p>
              <p>• Screen reader: Actions are announced with proper labels</p>
              <p>• Focus management: Maintains focus after actions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates accessibility features including keyboard navigation and screen reader support.'
      }
    },
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
}