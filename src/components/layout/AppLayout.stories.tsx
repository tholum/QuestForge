import type { Meta, StoryObj } from '@storybook/react'
import { AppLayout } from './AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const meta: Meta<typeof AppLayout> = {
  title: 'Layout/AppLayout',
  component: AppLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The AppLayout component provides the main application layout with:
- Mobile-first responsive design
- Bottom navigation for mobile, sidebar for desktop
- Accessibility features including skip links and screen reader support
- Header with user profile and notifications
- Keyboard shortcuts for desktop users
        `
      }
    }
  },
  argTypes: {
    currentPage: {
      control: 'select',
      options: ['dashboard', 'goals', 'progress', 'modules', 'settings'],
      description: 'Current active page for navigation highlighting'
    },
    currentModule: {
      control: 'select',
      options: ['fitness', 'learning', 'home', 'work'],
      description: 'Currently active module'
    },
    user: {
      control: 'object',
      description: 'User information for header display'
    },
    notifications: {
      control: 'object',
      description: 'Array of user notifications'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

const mockUser = {
  id: '1',
  name: 'Sarah Johnson',
  email: 'sarah@example.com',
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b1c7?w=32&h=32&fit=crop&crop=face',
  level: 5,
  xp: 1250
}

const mockNotifications = [
  {
    id: '1',
    type: 'success' as const,
    message: 'Goal completed! You earned 50 XP.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    read: false
  },
  {
    id: '2',
    type: 'info' as const,
    message: 'Daily reminder: Review your fitness goals.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    read: false
  },
  {
    id: '3',
    type: 'warning' as const,
    message: 'You haven\'t logged progress in 3 days.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true
  }
]

const SampleContent = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Today's Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">3/5</p>
          <p className="text-sm text-muted-foreground">Goals completed</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Weekly Streak</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">7 days</p>
          <p className="text-sm text-muted-foreground">Keep it up!</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Total XP</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">1,250</p>
          <p className="text-sm text-muted-foreground">Level 5</p>
        </CardContent>
      </Card>
    </div>
    
    <Card>
      <CardHeader>
        <CardTitle>Recent Goals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Morning workout</span>
            <span className="text-green-600 font-medium">✓ Complete</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Read 20 pages</span>
            <span className="text-blue-600 font-medium">In Progress</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Meal prep</span>
            <span className="text-gray-500">Pending</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)

/**
 * Default dashboard view with authenticated user
 */
export const Dashboard: Story = {
  args: {
    currentPage: 'dashboard',
    user: mockUser,
    notifications: mockNotifications,
    children: <SampleContent />
  }
}

/**
 * Goals page view
 */
export const GoalsPage: Story = {
  args: {
    currentPage: 'goals',
    user: mockUser,
    notifications: mockNotifications,
    children: (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Goals</h1>
          <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md">
            Add Goal
          </button>
        </div>
        <SampleContent />
      </div>
    )
  }
}

/**
 * Module-specific page (Fitness)
 */
export const FitnessModule: Story = {
  args: {
    currentPage: 'modules',
    currentModule: 'fitness',
    user: mockUser,
    notifications: mockNotifications,
    children: (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            💪
          </div>
          <div>
            <h1 className="text-3xl font-bold">Fitness Goals</h1>
            <p className="text-muted-foreground">Track your fitness journey</p>
          </div>
        </div>
        <SampleContent />
      </div>
    )
  }
}

/**
 * User without notifications
 */
export const NoNotifications: Story = {
  args: {
    currentPage: 'dashboard',
    user: mockUser,
    notifications: [],
    children: <SampleContent />
  }
}

/**
 * Anonymous/unauthenticated state
 */
export const Unauthenticated: Story = {
  args: {
    currentPage: 'dashboard',
    notifications: [],
    children: (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Welcome to Goal Assistant</h2>
          <p className="text-muted-foreground">Sign in to track your goals and progress</p>
          <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md">
            Sign In
          </button>
        </div>
      </div>
    )
  }
}

/**
 * Mobile view demonstration
 */
export const Mobile: Story = {
  args: {
    currentPage: 'dashboard',
    user: mockUser,
    notifications: mockNotifications,
    children: <SampleContent />
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile2'
    },
    docs: {
      description: {
        story: 'Mobile layout with bottom navigation and mobile-optimized header.'
      }
    }
  }
}

/**
 * Tablet view demonstration
 */
export const Tablet: Story = {
  args: {
    currentPage: 'dashboard',
    user: mockUser,
    notifications: mockNotifications,
    children: <SampleContent />
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    },
    docs: {
      description: {
        story: 'Tablet layout showing the transition between mobile and desktop layouts.'
      }
    }
  }
}

/**
 * Settings page
 */
export const Settings: Story = {
  args: {
    currentPage: 'settings',
    user: mockUser,
    notifications: mockNotifications,
    children: (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold">Settings</h1>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input 
                    className="w-full border rounded-md px-3 py-2" 
                    defaultValue="Sarah Johnson" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input 
                    className="w-full border rounded-md px-3 py-2" 
                    defaultValue="sarah@example.com" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Daily reminders</span>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span>Achievement notifications</span>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span>Weekly progress summary</span>
                <input type="checkbox" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
}

/**
 * Dark theme demonstration
 */
export const DarkTheme: Story = {
  args: {
    currentPage: 'dashboard',
    user: mockUser,
    notifications: mockNotifications,
    children: <SampleContent />
  },
  parameters: {
    backgrounds: {
      default: 'dark'
    },
    docs: {
      description: {
        story: 'AppLayout appearance in dark theme with proper contrast and readability.'
      }
    }
  }
}

/**
 * High contrast accessibility mode
 */
export const HighContrast: Story = {
  args: {
    currentPage: 'dashboard',
    user: mockUser,
    notifications: mockNotifications,
    children: <SampleContent />
  },
  parameters: {
    backgrounds: {
      default: 'dark'
    },
    docs: {
      description: {
        story: 'High contrast mode for users with visual accessibility needs.'
      }
    }
  }
}