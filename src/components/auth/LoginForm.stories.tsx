import type { Meta, StoryObj } from '@storybook/react'
import { LoginForm } from './LoginForm'

/**
 * LoginForm component stories for Storybook
 * Demonstrates various states and interactions
 */

const meta: Meta<typeof LoginForm> = {
  title: 'Auth/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The LoginForm component provides a user-friendly login interface with:
- Email and password validation
- Password visibility toggle
- Remember me option
- Loading states
- Error handling
- ADHD-friendly design with clear labels and immediate feedback
        `
      }
    }
  },
  argTypes: {
    onSubmit: { 
      action: 'submitted',
      description: 'Callback function called when form is submitted'
    },
    onForgotPassword: { 
      action: 'forgot-password',
      description: 'Callback function called when forgot password link is clicked'
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the form is in a loading state'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// Mock submit handler that simulates API call
const mockSubmit = async (data: any) => {
  () => console.log('login-submitted')(data)
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // Return success for demo@example.com, error for others
  if (data.email === 'demo@example.com' && data.password === 'Demo123!') {
    return { success: true }
  } else {
    return { success: false, error: 'Invalid email or password' }
  }
}

/**
 * Default login form state
 */
export const Default: Story = {
  args: {
    onSubmit: mockSubmit,
    onForgotPassword: () => console.log('forgot-password-clicked'),
    isLoading: false
  }
}

/**
 * Loading state while form is being submitted
 */
export const Loading: Story = {
  args: {
    onSubmit: mockSubmit,
    onForgotPassword: () => console.log('forgot-password-clicked'),
    isLoading: true
  }
}

/**
 * Form without forgot password link
 */
export const WithoutForgotPassword: Story = {
  args: {
    onSubmit: mockSubmit,
    isLoading: false
  }
}

/**
 * Interactive example with demo credentials
 */
export const InteractiveDemo: Story = {
  args: {
    onSubmit: mockSubmit,
    onForgotPassword: () => console.log('forgot-password-clicked'),
    isLoading: false
  },
  parameters: {
    docs: {
      description: {
        story: `
Try logging in with these credentials:
- **Email**: demo@example.com  
- **Password**: Demo123!

Any other credentials will show an error message.
        `
      }
    }
  }
}

/**
 * Mobile view demonstration
 */
export const Mobile: Story = {
  args: {
    onSubmit: mockSubmit,
    onForgotPassword: () => console.log('forgot-password-clicked'),
    isLoading: false
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'LoginForm optimized for mobile devices with touch-friendly inputs.'
      }
    }
  }
}

/**
 * Dark theme demonstration
 */
export const DarkTheme: Story = {
  args: {
    onSubmit: mockSubmit,
    onForgotPassword: () => console.log('forgot-password-clicked'),
    isLoading: false
  },
  parameters: {
    backgrounds: {
      default: 'dark'
    },
    docs: {
      description: {
        story: 'LoginForm appearance in dark theme.'
      }
    }
  }
}