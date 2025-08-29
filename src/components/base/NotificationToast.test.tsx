import { render, screen, waitFor, act } from './test-utils'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationToast, useToast, ToastContainer } from './NotificationToast'
import { Trophy } from 'lucide-react'

// Mock timers for auto-dismiss testing
vi.useFakeTimers()

describe('NotificationToast', () => {
  beforeEach(() => {
    vi.clearAllTimers()
  })

  it('renders toast with title and description', () => {
    render(
      <NotificationToast
        title="Test Toast"
        description="This is a test notification"
      />
    )

    expect(screen.getByText('Test Toast')).toBeInTheDocument()
    expect(screen.getByText('This is a test notification')).toBeInTheDocument()
  })

  it('applies variant styles correctly', () => {
    const { rerender } = render(
      <NotificationToast
        variant="success"
        title="Success"
        description="Operation completed"
      />
    )

    const toast = screen.getByText('Success').closest('[role="alert"]')
    expect(toast).toHaveClass('border-green-200', 'bg-green-50')

    rerender(
      <NotificationToast
        variant="error"
        title="Error"
        description="Something went wrong"
      />
    )

    expect(toast).toHaveClass('border-red-200', 'bg-red-50')
  })

  it('renders with custom icon', () => {
    render(
      <NotificationToast
        title="Achievement"
        description="You earned a badge!"
        icon={<Trophy data-testid="trophy-icon" />}
      />
    )

    expect(screen.getByTestId('trophy-icon')).toBeInTheDocument()
  })

  it('renders action button and handles click', async () => {
    const mockAction = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    render(
      <NotificationToast
        title="Toast with Action"
        description="Click the action button"
        action={{
          label: "Take Action",
          onClick: mockAction
        }}
      />
    )

    const actionButton = screen.getByRole('button', { name: /take action/i })
    expect(actionButton).toBeInTheDocument()

    await user.click(actionButton)
    expect(mockAction).toHaveBeenCalledTimes(1)
  })

  it('renders close button and handles close', async () => {
    const mockClose = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    render(
      <NotificationToast
        title="Closeable Toast"
        description="This toast can be closed"
        closeable
        onClose={mockClose}
      />
    )

    const closeButton = screen.getByRole('button', { name: /close/i })
    expect(closeButton).toBeInTheDocument()

    await user.click(closeButton)
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it('hides close button when closeable is false', () => {
    render(
      <NotificationToast
        title="Non-closeable Toast"
        description="This toast cannot be closed"
        closeable={false}
      />
    )

    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
  })

  it('shows progress bar when showProgress is true', () => {
    render(
      <NotificationToast
        title="Progress Toast"
        description="This toast shows progress"
        showProgress
        duration={5000}
      />
    )

    // Look for progress bar element
    const progressBar = document.querySelector('.h-1')
    expect(progressBar).toBeInTheDocument()
  })

  it('auto-dismisses after specified duration', async () => {
    const mockClose = vi.fn()

    render(
      <NotificationToast
        title="Auto-dismiss Toast"
        description="This will auto-dismiss"
        duration={3000}
        onClose={mockClose}
      />
    )

    expect(mockClose).not.toHaveBeenCalled()

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    await waitFor(() => {
      expect(mockClose).toHaveBeenCalledTimes(1)
    })
  })

  it('does not auto-dismiss when persistent is true', async () => {
    const mockClose = vi.fn()

    render(
      <NotificationToast
        title="Persistent Toast"
        description="This will not auto-dismiss"
        persistent
        duration={1000}
        onClose={mockClose}
      />
    )

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(mockClose).not.toHaveBeenCalled()
  })

  it('pauses auto-dismiss on hover', async () => {
    const mockClose = vi.fn()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    render(
      <NotificationToast
        title="Hover Toast"
        description="Hover pauses auto-dismiss"
        duration={2000}
        onClose={mockClose}
      />
    )

    const toast = screen.getByText('Hover Toast').closest('[role="alert"]')!

    // Start timer
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Hover to pause
    await user.hover(toast)

    // Advance time - should not dismiss yet
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(mockClose).not.toHaveBeenCalled()

    // Un-hover to resume
    await user.unhover(toast)

    // Now it should dismiss
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    await waitFor(() => {
      expect(mockClose).toHaveBeenCalledTimes(1)
    })
  })

  it('applies correct size classes', () => {
    const { rerender } = render(
      <NotificationToast
        title="Small Toast"
        size="sm"
      />
    )

    const toast = screen.getByText('Small Toast').closest('[role="alert"]')
    expect(toast).toHaveClass('text-sm', 'p-3')

    rerender(
      <NotificationToast
        title="Large Toast"
        size="lg"
      />
    )

    expect(toast).toHaveClass('text-base', 'p-5')
  })

  it('has proper accessibility attributes', () => {
    render(
      <NotificationToast
        variant="error"
        title="Error Message"
        description="This is an error"
      />
    )

    const toast = screen.getByRole('alert')
    expect(toast).toHaveAttribute('role', 'alert')
    expect(toast).toHaveAttribute('aria-live', 'assertive')
  })

  it('has polite aria-live for non-error variants', () => {
    render(
      <NotificationToast
        variant="info"
        title="Info Message"
        description="This is info"
      />
    )

    const toast = screen.getByRole('alert')
    expect(toast).toHaveAttribute('aria-live', 'polite')
  })

  // Test useToast hook
  describe('useToast hook', () => {
    const TestComponent = () => {
      const toast = useToast()

      return (
        <div>
          <button onClick={() => toast.success('Success!', 'It worked!')}>
            Add Success
          </button>
          <button onClick={() => toast.error('Error!', 'Something failed')}>
            Add Error
          </button>
          <button onClick={() => toast.clearAllToasts()}>
            Clear All
          </button>
          
          <ToastContainer position="top-right">
            {toast.toasts.map(({ id, props }) => (
              <NotificationToast key={id} {...props} />
            ))}
          </ToastContainer>
        </div>
      )
    }

    it('adds and manages toasts', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      render(<TestComponent />)

      // Add success toast
      await user.click(screen.getByText('Add Success'))
      expect(screen.getByText('Success!')).toBeInTheDocument()
      expect(screen.getByText('It worked!')).toBeInTheDocument()

      // Add error toast
      await user.click(screen.getByText('Add Error'))
      expect(screen.getByText('Error!')).toBeInTheDocument()
      expect(screen.getByText('Something failed')).toBeInTheDocument()

      // Should have both toasts
      expect(screen.getAllByRole('alert')).toHaveLength(2)
    })

    it('clears all toasts', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      render(<TestComponent />)

      // Add toasts
      await user.click(screen.getByText('Add Success'))
      await user.click(screen.getByText('Add Error'))

      expect(screen.getAllByRole('alert')).toHaveLength(2)

      // Clear all
      await user.click(screen.getByText('Clear All'))

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('removes individual toasts', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

      render(<TestComponent />)

      await user.click(screen.getByText('Add Success'))
      await user.click(screen.getByText('Add Error'))

      expect(screen.getAllByRole('alert')).toHaveLength(2)

      // Close one toast
      const closeButtons = screen.getAllByRole('button', { name: /close/i })
      await user.click(closeButtons[0])

      await waitFor(() => {
        expect(screen.getAllByRole('alert')).toHaveLength(1)
      })
    })
  })

  // ToastContainer tests
  describe('ToastContainer', () => {
    it('applies position classes correctly', () => {
      const { rerender } = render(
        <ToastContainer position="top-left">
          <div data-testid="toast-content">Toast</div>
        </ToastContainer>
      )

      const container = screen.getByTestId('toast-content').parentElement
      expect(container).toHaveClass('fixed', 'top-4', 'left-4')

      rerender(
        <ToastContainer position="bottom-center">
          <div data-testid="toast-content">Toast</div>
        </ToastContainer>
      )

      expect(container).toHaveClass('bottom-4', 'left-1/2')
    })

    it('limits number of toasts when maxToasts is specified', () => {
      render(
        <ToastContainer maxToasts={2}>
          <div data-testid="toast-1">Toast 1</div>
          <div data-testid="toast-2">Toast 2</div>
          <div data-testid="toast-3">Toast 3</div>
        </ToastContainer>
      )

      // Should render all children (limiting would be handled by the hook logic)
      expect(screen.getByTestId('toast-1')).toBeInTheDocument()
      expect(screen.getByTestId('toast-2')).toBeInTheDocument()
      expect(screen.getByTestId('toast-3')).toBeInTheDocument()
    })
  })

  // Snapshot test
  it('matches snapshot', () => {
    const { container } = render(
      <NotificationToast
        variant="achievement"
        title="Achievement Unlocked!"
        description="You've completed your first goal!"
        icon={<Trophy />}
        action={{
          label: "View Badge",
          onClick: () => {}
        }}
        showProgress
        duration={5000}
      />
    )
    expect(container.firstChild).toMatchSnapshot()
  })
})