import type { Meta, StoryObj } from '@storybook/react'
import { AppHeader } from './AppHeader'

const meta: Meta<typeof AppHeader> = {
  title: 'Layout/AppHeader',
  component: AppHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The AppHeader component provides the main navigation header with:
- Mobile-responsive design with different layouts for mobile and desktop
- User profile dropdown with gamification stats (XP, level, progress)
- Notification center with real-time updates and unread badges
- Search functionality for goals, modules, and achievements
- Theme switching and accessibility features
- Adaptive content based on current page and user state
        `
      }
    }
  },
  argTypes: {
    user: {
      control: 'object',
      description: 'User information including name, email, avatar, and gamification data'
    },
    notifications: {
      control: 'object',
      description: 'Array of user notifications with different types and read states'
    },
    currentPage: {
      control: 'select',
      options: ['dashboard', 'goals', 'progress', 'analytics', 'calendar', 'modules', 'settings', 'profile'],
      description: 'Current page for adaptive header content'
    },
    isMobile: {
      control: 'boolean',
      description: 'Force mobile layout (normally auto-detected)'
    },
    isSidebarOpen: {
      control: 'boolean',
      description: 'Whether sidebar is open (desktop only)'
    },
    onMenuClick: {
      action: 'menu-clicked',
      description: 'Callback for menu toggle button'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

const mockUser = {
  id: '1',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@example.com',
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b1c7?w=32&h=32&fit=crop&crop=face',
  level: 5,
  xp: 1347
}

const mockNewUser = {
  id: '2',
  name: 'Alex Chen',
  email: 'alex.chen@example.com',
  level: 1,
  xp: 45
}

const mockNotifications = [
  {
    id: '1',
    type: 'success' as const,
    message: '🎉 Goal completed! You earned 50 XP for "Morning workout"',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    read: false
  },
  {
    id: '2',
    type: 'info' as const,
    message: '📚 Daily reminder: You have 3 goals scheduled for today',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    read: false
  },
  {
    id: '3',
    type: 'warning' as const,
    message: '⚠️ You haven\'t logged progress in 3 days. Keep your streak alive!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false
  },
  {
    id: '4',
    type: 'success' as const,
    message: '🏆 Achievement unlocked: "7-Day Streak" - You\'re on fire!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true
  },
  {
    id: '5',
    type: 'info' as const,
    message: '💡 Tip: Try the new Fitness module to track your workouts',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    read: true
  }
]

/**
 * Default desktop header with authenticated user
 */
export const Desktop: Story = {
  args: {
    user: mockUser,
    notifications: mockNotifications,
    currentPage: 'dashboard',
    isMobile: false,
    isSidebarOpen: true
  }
}

/**
 * Mobile header layout
 */
export const Mobile: Story = {
  args: {
    user: mockUser,
    notifications: mockNotifications,
    currentPage: 'dashboard',
    isMobile: true
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile2'
    },
    docs: {
      description: {
        story: 'Mobile header with compact layout, back navigation, and essential actions.'
      }
    }
  }
}

/**
 * Mobile header on non-dashboard page
 */
export const MobileWithBackButton: Story = {
  args: {
    user: mockUser,
    notifications: mockNotifications,
    currentPage: 'goals',
    isMobile: true
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile2'
    },
    docs: {
      description: {
        story: 'Mobile header showing back button when not on dashboard.'
      }
    }
  }
}

/**
 * New user with minimal gamification stats
 */
export const NewUser: Story = {
  args: {
    user: mockNewUser,
    notifications: [
      {
        id: '1',
        type: 'info' as const,
        message: '👋 Welcome to Goal Assistant! Let\'s set up your first goal.',
        timestamp: new Date(Date.now() - 1000 * 60 * 10),
        read: false
      }
    ],
    currentPage: 'dashboard',
    isMobile: false,
    isSidebarOpen: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Header appearance for a new user with level 1 and minimal XP.'
      }
    }
  }
}

/**
 * No notifications state
 */
export const NoNotifications: Story = {
  args: {
    user: mockUser,
    notifications: [],
    currentPage: 'dashboard',
    isMobile: false,
    isSidebarOpen: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Header when user has no notifications to display.'
      }
    }
  }
}

/**
 * Anonymous/unauthenticated state
 */
export const Unauthenticated: Story = {
  args: {
    notifications: [],
    currentPage: 'dashboard',
    isMobile: false,
    isSidebarOpen: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Header appearance for unauthenticated users with limited functionality.'
      }
    }
  }
}

/**
 * Goals page header
 */
export const GoalsPage: Story = {
  args: {
    user: mockUser,
    notifications: mockNotifications,
    currentPage: 'goals',
    isMobile: false,
    isSidebarOpen: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Header appearance on the Goals page with contextual title.'
      }
    }
  }
}

/**
 * Settings page header
 */
export const SettingsPage: Story = {
  args: {
    user: mockUser,
    notifications: mockNotifications,
    currentPage: 'settings',
    isMobile: false,
    isSidebarOpen: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Header appearance on the Settings page.'
      }
    }
  }
}

/**
 * High notification count
 */
export const ManyNotifications: Story = {
  args: {
    user: mockUser,
    notifications: [
      ...mockNotifications,
      {
        id: '6',
        type: 'error' as const,
        message: 'Failed to sync data. Please check your connection.',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        read: false
      },
      {
        id: '7',
        type: 'success' as const,
        message: 'Weekly goal achieved! You completed 5/5 fitness goals.',
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        read: false
      },
      {
        id: '8',
        type: 'info' as const,
        message: 'New feature: Calendar view is now available!',
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
        read: false
      }
    ],
    currentPage: 'dashboard',
    isMobile: false,
    isSidebarOpen: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Header with many unread notifications showing badge count.'
      }
    }
  }
}

/**
 * Collapsed sidebar state
 */
export const CollapsedSidebar: Story = {
  args: {
    user: mockUser,
    notifications: mockNotifications,
    currentPage: 'dashboard',
    isMobile: false,
    isSidebarOpen: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Header when sidebar is collapsed, showing menu toggle button.'
      }
    }
  }
}

/**
 * Long user name testing
 */
export const LongUserName: Story = {
  args: {
    user: {
      ...mockUser,
      name: 'Alexander Maximilian von Brandenburg-Schweinfurt',
      email: 'alexander.maximilian@very-long-domain-name.example.com'
    },
    notifications: mockNotifications,
    currentPage: 'dashboard',
    isMobile: false,
    isSidebarOpen: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Header handling very long user names and email addresses.'
      }
    }
  }
}

/**
 * Tablet view
 */
export const Tablet: Story = {
  args: {
    user: mockUser,
    notifications: mockNotifications,
    currentPage: 'dashboard',
    isMobile: false,
    isSidebarOpen: false
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet'
    },
    docs: {
      description: {
        story: 'Header appearance on tablet devices with medium screen size.'
      }
    }
  }
}

/**
 * Dark theme demonstration
 */
export const DarkTheme: Story = {
  args: {
    user: mockUser,
    notifications: mockNotifications,
    currentPage: 'dashboard',
    isMobile: false,
    isSidebarOpen: true
  },
  parameters: {
    backgrounds: {
      default: 'dark'
    },
    docs: {
      description: {
        story: 'Header appearance in dark theme with proper contrast.'
      }
    }
  }
}

/**
 * All notification types
 */
export const AllNotificationTypes: Story = {
  args: {
    user: mockUser,
    notifications: [
      {
        id: '1',
        type: 'success' as const,
        message: 'Success: Goal completed successfully!',
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        read: false
      },
      {
        id: '2',
        type: 'info' as const,
        message: 'Info: Daily reminder about your goals.',
        timestamp: new Date(Date.now() - 1000 * 60 * 15),
        read: false
      },
      {
        id: '3',
        type: 'warning' as const,
        message: 'Warning: You\'re falling behind on your goals.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        read: false
      },
      {
        id: '4',
        type: 'error' as const,
        message: 'Error: Failed to save your progress.',
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        read: false
      }
    ],
    currentPage: 'dashboard',
    isMobile: false,
    isSidebarOpen: true
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of all notification types with different visual indicators.'
      }
    }
  }
}

/**
 * Mobile with many notifications
 */
export const MobileManyNotifications: Story = {
  args: {
    user: mockUser,
    notifications: [
      ...mockNotifications,
      {
        id: '6',
        type: 'info' as const,
        message: 'Additional notification for testing',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        read: false
      }
    ],
    currentPage: 'dashboard',
    isMobile: true
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile2'
    },
    docs: {
      description: {
        story: 'Mobile header with multiple unread notifications showing badge.'
      }
    }
  }
}