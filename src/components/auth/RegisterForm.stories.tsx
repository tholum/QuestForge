import type { Meta, StoryObj } from '@storybook/nextjs'
import { RegisterForm } from './RegisterForm'

/**
 * RegisterForm component stories for Storybook
 * Demonstrates registration flow and password strength validation
 */

const meta: Meta<typeof RegisterForm> = {
  title: 'Auth/RegisterForm',
  component: RegisterForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
The RegisterForm component provides user registration functionality with:
- Real-time password strength validation
- Password confirmation matching
- Email and name validation
- Visual strength indicator
- ADHD-friendly design with clear progress feedback
        `
      }
    }
  },
  argTypes: {
    onSubmit: { 
      action: 'submitted',
      description: 'Callback function called when form is submitted'
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
  () => console.log('register-submitted')(data)
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Return error for existing@example.com, success for others
  if (data.email === 'existing@example.com') {
    return { success: false, error: 'User with this email already exists' }
  } else {
    return { success: true }
  }
}

/**
 * Default registration form state
 */
export const Default: Story = {
  args: {
    onSubmit: mockSubmit,
    isLoading: false
  }
}

/**
 * Loading state while form is being submitted
 */
export const Loading: Story = {
  args: {
    onSubmit: mockSubmit,
    isLoading: true
  }
}

/**
 * Interactive demo showing password strength validation
 */
export const PasswordStrengthDemo: Story = {
  args: {
    onSubmit: mockSubmit,
    isLoading: false
  },
  parameters: {
    docs: {
      description: {
        story: `
Try typing different passwords to see the strength indicator:
- **Weak**: "password"
- **Fair**: "Password123" 
- **Strong**: "MyStrongPassword123!"

Try registering with "existing@example.com" to see error handling.
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
    isLoading: false
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'RegisterForm optimized for mobile devices with larger touch targets.'
      }
    }
  }
}

/**
 * Form validation demonstration
 */
export const ValidationDemo: Story = {
  args: {
    onSubmit: mockSubmit,
    isLoading: false
  },
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates form validation:
- Try submitting with invalid email formats
- Test password mismatch scenarios
- Check name validation with numbers/symbols
        `
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
    isLoading: false
  },
  parameters: {
    backgrounds: {
      default: 'dark'
    },
    docs: {
      description: {
        story: 'RegisterForm appearance in dark theme with password strength indicators.'
      }
    }
  }
}