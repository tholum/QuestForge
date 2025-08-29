import type { Meta, StoryObj } from '@storybook/nextjs'
import { AuthLayout } from './AuthLayout'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

/**
 * AuthLayout component stories for Storybook
 * Demonstrates the shared layout for authentication pages
 */

const meta: Meta<typeof AuthLayout> = {
  title: 'Auth/AuthLayout',
  component: AuthLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The AuthLayout component provides a consistent layout for authentication pages featuring:
- Responsive design that works on mobile and desktop
- Clear branding and navigation
- Optional back button functionality
- Footer with helpful links
- ADHD-friendly visual hierarchy
        `
      }
    }
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Main title displayed in the header'
    },
    subtitle: {
      control: 'text',
      description: 'Subtitle text below the title'
    },
    showBackButton: {
      control: 'boolean',
      description: 'Whether to show the back navigation button'
    },
    backButtonText: {
      control: 'text',
      description: 'Text for the back button'
    },
    backButtonHref: {
      control: 'text',
      description: 'URL for the back button link'
    },
    onBack: {
      action: 'back-clicked',
      description: 'Callback for back button click (overrides href)'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

const mockSubmit = async () => ({ success: true })
const mockAction = () => console.log('Action triggered')

/**
 * Default layout with login form
 */
export const WithLoginForm: Story = {
  args: {
    title: 'Welcome back',
    subtitle: 'Sign in to your GoalAssistant account',
    showBackButton: false,
    children: (
      <LoginForm 
        onSubmit={mockSubmit}
        onForgotPassword={mockAction}
      />
    )
  }
}

/**
 * Layout with registration form
 */
export const WithRegisterForm: Story = {
  args: {
    title: 'Create your account',
    subtitle: 'Start your goal achievement journey',
    showBackButton: false,
    children: (
      <RegisterForm onSubmit={mockSubmit} />
    )
  }
}

/**
 * Layout with back button
 */
export const WithBackButton: Story = {
  args: {
    title: 'Reset your password',
    subtitle: "We'll send you instructions to reset your password",
    showBackButton: true,
    backButtonText: 'Back to sign in',
    backButtonHref: '/auth/login',
    onBack: mockAction,
    children: (
      <div className="text-center p-8 bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">
          Password reset form would be here
        </p>
      </div>
    )
  }
}

/**
 * Minimal layout without subtitle
 */
export const MinimalLayout: Story = {
  args: {
    title: 'Authentication',
    showBackButton: false,
    children: (
      <div className="text-center p-8 bg-muted/50 rounded-lg">
        <p className="text-muted-foreground">
          Auth form content goes here
        </p>
      </div>
    )
  }
}

/**
 * Mobile view demonstration
 */
export const Mobile: Story = {
  args: {
    title: 'Welcome back',
    subtitle: 'Sign in to your GoalAssistant account',
    showBackButton: true,
    backButtonText: 'Back',
    onBack: mockAction,
    children: (
      <LoginForm 
        onSubmit={mockSubmit}
        onForgotPassword={mockAction}
      />
    )
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'AuthLayout optimized for mobile devices with compact spacing.'
      }
    }
  }
}

/**
 * Error state demonstration
 */
export const WithErrorContent: Story = {
  args: {
    title: 'Access Denied',
    subtitle: 'You do not have permission to view this page',
    showBackButton: true,
    backButtonText: 'Go back',
    onBack: mockAction,
    children: (
      <div className="text-center space-y-4">
        <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive font-medium">
            Authentication Required
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Please sign in to continue to this page.
          </p>
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
    title: 'Welcome back',
    subtitle: 'Sign in to your GoalAssistant account',
    showBackButton: false,
    children: (
      <LoginForm 
        onSubmit={mockSubmit}
        onForgotPassword={mockAction}
      />
    )
  },
  parameters: {
    backgrounds: {
      default: 'dark'
    },
    docs: {
      description: {
        story: 'AuthLayout appearance in dark theme with proper contrast.'
      }
    }
  }
}