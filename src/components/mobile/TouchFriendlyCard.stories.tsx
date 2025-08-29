import type { Meta, StoryObj } from '@storybook/nextjs'
import { TouchFriendlyCard } from './TouchFriendlyCard'
import { commonSwipeActions } from './SwipeActions'
import { CheckCircle, Clock, AlertCircle, Star, Target } from 'lucide-react'

const meta: Meta<typeof TouchFriendlyCard> = {
  title: 'Mobile/TouchFriendlyCard',
  component: TouchFriendlyCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
TouchFriendlyCard is optimized for mobile touch interactions with:
- Large touch targets (minimum 44px)
- Haptic feedback on interactions
- Long press support for contextual actions
- Visual feedback on touch with subtle animations
- Swipe actions integration
- ADHD-friendly visual states
- Keyboard navigation support
        `
      }
    }
  },
  argTypes: {
    onClick: {
      action: 'clicked',
      description: 'Callback when card is tapped/clicked'
    },
    onLongPress: {
      action: 'long-pressed',
      description: 'Callback when card is long pressed (500ms default)'
    },
    disabled: {
      control: 'boolean',
      description: 'Disable all interactions'
    },
    hapticFeedback: {
      control: 'boolean',
      description: 'Enable haptic vibration feedback'
    },
    longPressDelay: {
      control: 'number',
      description: 'Delay in ms before long press is triggered'
    },
    swipeActions: {
      control: 'object',
      description: 'Configure swipe actions for left and right swipes'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

const SampleGoalContent = ({ 
  title, 
  description, 
  status = 'pending',
  xp = 0 
}: {
  title: string
  description: string
  status?: 'pending' | 'in-progress' | 'completed'
  xp?: number
}) => {
  const statusColors = {
    pending: 'text-gray-500',
    'in-progress': 'text-blue-600',
    completed: 'text-green-600'
  }
  
  const StatusIcon = {
    pending: Clock,
    'in-progress': AlertCircle,
    completed: CheckCircle
  }[status]

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {xp > 0 && (
            <div className="flex items-center space-x-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
              <Star className="w-3 h-3" />
              <span>+{xp} XP</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className={`flex items-center space-x-2 ${statusColors[status]}`}>
          <StatusIcon className="w-4 h-4" />
          <span className="text-sm font-medium capitalize">{status.replace('-', ' ')}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Basic interactive card
 */
export const Basic: Story = {
  args: {
    children: (
      <SampleGoalContent
        title="Morning Workout"
        description="Complete 30-minute cardio session"
        status="pending"
        xp={25}
      />
    ),
    hapticFeedback: true
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
}

/**
 * Card with long press action
 */
export const WithLongPress: Story = {
  args: {
    children: (
      <SampleGoalContent
        title="Read 20 Pages"
        description="Continue reading 'Atomic Habits'"
        status="in-progress"
        xp={15}
      />
    ),
    longPressDelay: 600,
    hapticFeedback: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Long press the card to trigger the secondary action. Visual feedback shows when long press is activated.'
      }
    },
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
}

/**
 * Completed goal card
 */
export const Completed: Story = {
  args: {
    children: (
      <SampleGoalContent
        title="Meal Prep Sunday"
        description="Prepared healthy meals for the week"
        status="completed"
        xp={50}
      />
    ),
    hapticFeedback: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Card showing a completed goal with success state styling.'
      }
    },
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
}

/**
 * Card with swipe actions
 */
export const WithSwipeActions: Story = {
  args: {
    children: (
      <SampleGoalContent
        title="Daily Meditation"
        description="10 minutes of mindfulness practice"
        status="pending"
        xp={20}
      />
    ),
    swipeActions: {
      left: [
        {
          ...commonSwipeActions.complete,
          onAction: () => console.log('Goal completed!')
        }
      ],
      right: [
        {
          ...commonSwipeActions.edit,
          onAction: () => console.log('Edit goal')
        },
        {
          ...commonSwipeActions.delete,
          onAction: () => console.log('Delete goal')
        }
      ]
    },
    hapticFeedback: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Card with swipe actions - swipe left to complete, right to edit or delete. Actions appear when swiping past threshold.'
      }
    },
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
}

/**
 * Disabled card
 */
export const Disabled: Story = {
  args: {
    children: (
      <SampleGoalContent
        title="Learn Spanish"
        description="Complete Duolingo lesson"
        status="pending"
        xp={10}
      />
    ),
    disabled: true,
    hapticFeedback: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Disabled card with reduced opacity and no interaction capabilities.'
      }
    },
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
}

/**
 * Compact card with minimal content
 */
export const Compact: Story = {
  args: {
    children: (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <span className="font-medium">Quick Task</span>
        </div>
        <div className="text-xs text-muted-foreground">+5 XP</div>
      </div>
    ),
    hapticFeedback: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Minimal card design for simple tasks or quick actions.'
      }
    },
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
}

/**
 * Card with rich content
 */
export const RichContent: Story = {
  args: {
    children: (
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">Weekly Fitness Challenge</h3>
            <p className="text-sm text-muted-foreground mt-1">Complete 5 workouts this week</p>
          </div>
          <div className="flex items-center space-x-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            <Star className="w-3 h-3" />
            <span>+100 XP</span>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">3/5 workouts</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Fitness</span>
          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Challenge</span>
          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">Weekly</span>
        </div>
      </div>
    ),
    swipeActions: {
      left: [
        {
          ...commonSwipeActions.favorite,
          onAction: () => console.log('Added to favorites!')
        }
      ],
      right: [
        {
          ...commonSwipeActions.edit,
          onAction: () => console.log('Edit challenge')
        }
      ]
    },
    hapticFeedback: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Card with rich content including progress bars, tags, and detailed information.'
      }
    },
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
}

/**
 * List of cards for layout testing
 */
export const CardList: Story = {
  render: () => (
    <div className="space-y-4 max-w-sm">
      <TouchFriendlyCard
        swipeActions={{
          left: [
            {
              ...commonSwipeActions.complete,
              onAction: () => console.log('Morning run completed!')
            }
          ],
          right: [
            {
              ...commonSwipeActions.edit,
              onAction: () => console.log('Edit morning run')
            }
          ]
        }}
      >
        <SampleGoalContent
          title="Morning Run"
          description="5K jog around the neighborhood"
          status="pending"
          xp={30}
        />
      </TouchFriendlyCard>
      
      <TouchFriendlyCard>
        <SampleGoalContent
          title="Healthy Breakfast"
          description="Prepare and eat nutritious meal"
          status="completed"
          xp={15}
        />
      </TouchFriendlyCard>
      
      <TouchFriendlyCard
        swipeActions={{
          right: [
            {
              ...commonSwipeActions.archive,
              onAction: () => console.log('Archive coding practice')
            }
          ]
        }}
      >
        <SampleGoalContent
          title="Code Practice"
          description="Work on React components for 1 hour"
          status="in-progress"
          xp={40}
        />
      </TouchFriendlyCard>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Multiple cards in a list layout showing different states and swipe actions.'
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
    children: (
      <div className="space-y-2">
        <h3 className="font-semibold">Accessible Goal Card</h3>
        <p className="text-sm text-muted-foreground">
          This card supports keyboard navigation, screen readers, and proper ARIA attributes.
        </p>
        <div className="text-xs text-muted-foreground mt-2">
          • Press Enter or Space to activate<br />
          • Use arrow keys with swipe actions<br />
          • Screen reader compatible
        </div>
      </div>
    ),
    swipeActions: {
      left: [
        {
          ...commonSwipeActions.complete,
          onAction: () => console.log('Completed via keyboard!')
        }
      ]
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of accessibility features including keyboard navigation and screen reader support.'
      }
    },
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
}

/**
 * Different card sizes
 */
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      {/* Small card */}
      <TouchFriendlyCard className="max-w-xs">
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="font-medium">Small Task</span>
        </div>
      </TouchFriendlyCard>
      
      {/* Medium card */}
      <TouchFriendlyCard className="max-w-md">
        <SampleGoalContent
          title="Medium Goal"
          description="This is a medium-sized goal card"
          status="in-progress"
          xp={25}
        />
      </TouchFriendlyCard>
      
      {/* Large card */}
      <TouchFriendlyCard className="max-w-lg">
        <div className="space-y-4">
          <SampleGoalContent
            title="Large Complex Goal"
            description="This is a larger card with more detailed information and multiple elements"
            status="pending"
            xp={75}
          />
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-xs text-muted-foreground">Due: Tomorrow</span>
            <span className="text-xs font-medium text-blue-600">High Priority</span>
          </div>
        </div>
      </TouchFriendlyCard>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Different card sizes to show responsive behavior and content adaptation.'
      }
    },
    viewport: {
      defaultViewport: 'mobile2'
    }
  }
}