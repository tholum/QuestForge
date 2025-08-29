import { render, screen, waitFor } from './test-utils'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { DataCard } from './DataCard'
import { Target, Clock } from 'lucide-react'

describe('DataCard', () => {
  it('renders basic card content', () => {
    render(
      <DataCard
        title="Test Card"
        description="Test Description"
        value="42"
        subtitle="items"
      />
    )

    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('items')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<DataCard title="Loading Card" loading />)
    
    // Should show skeleton loading animation
    expect(screen.getByText('Loading Card').closest('[data-testid]') || 
           document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows error state', () => {
    render(<DataCard title="Error Card" error="Failed to load data" />)
    
    expect(screen.getByText('Error loading data')).toBeInTheDocument()
    expect(screen.getByText('Failed to load data')).toBeInTheDocument()
  })

  it('renders with progress bar', () => {
    render(
      <DataCard
        title="Progress Card"
        value="75"
        subtitle="percent complete"
        progress={75}
        progressLabel="Completion"
      />
    )

    expect(screen.getByText('Completion')).toBeInTheDocument()
    expect(screen.getByText('75%')).toBeInTheDocument()
    
    // Check for progress bar element
    expect(document.querySelector('[data-progress]') || 
           document.querySelector('[role="progressbar"]')).toBeInTheDocument()
  })

  it('renders with badge', () => {
    render(
      <DataCard
        title="Badge Card"
        value="5"
        badge={{ text: "Hot!", variant: "success" }}
      />
    )

    expect(screen.getByText('Hot!')).toBeInTheDocument()
  })

  it('renders with trend indicator', () => {
    render(
      <DataCard
        title="Trend Card"
        value="150"
        trend={{
          direction: "up",
          value: "+25%",
          label: "vs last week"
        }}
      />
    )

    expect(screen.getByText('+25%')).toBeInTheDocument()
    expect(screen.getByText('vs last week')).toBeInTheDocument()
  })

  it('renders metadata items', () => {
    render(
      <DataCard
        title="Metadata Card"
        value="42"
        metadata={[
          { icon: <Target data-testid="target-icon" />, label: "Goals", value: "5" },
          { icon: <Clock data-testid="clock-icon" />, label: "Time", value: "2h" }
        ]}
      />
    )

    expect(screen.getByTestId('target-icon')).toBeInTheDocument()
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument()
    expect(screen.getByText('Goals:')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Time:')).toBeInTheDocument()
    expect(screen.getByText('2h')).toBeInTheDocument()
  })

  it('renders action buttons', () => {
    const mockAction1 = vi.fn()
    const mockAction2 = vi.fn()

    render(
      <DataCard
        title="Actions Card"
        value="10"
        actions={[
          {
            label: "Edit",
            icon: <Target data-testid="edit-icon" />,
            onClick: mockAction1
          },
          {
            label: "Delete",
            onClick: mockAction2,
            variant: "secondary"
          }
        ]}
      />
    )

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    expect(screen.getByTestId('edit-icon')).toBeInTheDocument()
  })

  it('handles action button clicks', async () => {
    const mockAction = vi.fn()
    const user = userEvent.setup()

    render(
      <DataCard
        title="Clickable Card"
        value="5"
        actions={[
          {
            label: "Click me",
            onClick: mockAction
          }
        ]}
      />
    )

    await user.click(screen.getByRole('button', { name: /click me/i }))
    expect(mockAction).toHaveBeenCalledTimes(1)
  })

  it('shows menu button when showMenu is true', () => {
    const mockMenuClick = vi.fn()

    render(
      <DataCard
        title="Menu Card"
        value="3"
        showMenu
        onMenuClick={mockMenuClick}
      />
    )

    expect(screen.getByRole('button', { name: /more/i }) || 
           screen.getByTestId('menu-button')).toBeInTheDocument()
  })

  it('handles menu button click', async () => {
    const mockMenuClick = vi.fn()
    const user = userEvent.setup()

    render(
      <DataCard
        title="Menu Card"
        value="3"
        showMenu
        onMenuClick={mockMenuClick}
      />
    )

    const menuButton = screen.getByRole('button', { name: /more/i }) || 
                      document.querySelector('[data-testid="menu-button"]') as HTMLElement
    
    if (menuButton) {
      await user.click(menuButton)
      expect(mockMenuClick).toHaveBeenCalledTimes(1)
    }
  })

  it('handles card click when interactive', async () => {
    const mockClick = vi.fn()
    const user = userEvent.setup()

    render(
      <DataCard
        title="Interactive Card"
        value="7"
        interactive
        onClick={mockClick}
      />
    )

    // Click on the card (but not on action buttons)
    const cardTitle = screen.getByText('Interactive Card')
    await user.click(cardTitle)
    
    expect(mockClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant classes correctly', () => {
    const { rerender } = render(<DataCard title="Variant Card" variant="success" />)
    
    const card = screen.getByText('Variant Card').closest('div')
    expect(card).toHaveClass('border-green-200')
    
    rerender(<DataCard title="Variant Card" variant="danger" />)
    expect(card).toHaveClass('border-red-200')
  })

  it('applies size classes correctly', () => {
    const { rerender } = render(<DataCard title="Size Card" size="sm" />)
    
    const card = screen.getByText('Size Card').closest('div')
    expect(card).toHaveClass('p-3')
    
    rerender(<DataCard title="Size Card" size="lg" />)
    expect(card).toHaveClass('p-6')
  })

  it('applies interactive styling when interactive is true', () => {
    render(<DataCard title="Interactive Card" interactive />)
    
    const card = screen.getByText('Interactive Card').closest('div')
    expect(card).toHaveClass('cursor-pointer', 'hover:scale-[1.02]')
  })

  // Test event propagation for nested buttons
  it('prevents card click when action button is clicked', async () => {
    const mockCardClick = vi.fn()
    const mockActionClick = vi.fn()
    const user = userEvent.setup()

    render(
      <DataCard
        title="Nested Click Card"
        value="5"
        interactive
        onClick={mockCardClick}
        actions={[
          {
            label: "Action",
            onClick: mockActionClick
          }
        ]}
      />
    )

    // Click the action button - should not trigger card click
    await user.click(screen.getByRole('button', { name: /action/i }))
    
    expect(mockActionClick).toHaveBeenCalledTimes(1)
    expect(mockCardClick).not.toHaveBeenCalled()
  })

  // Accessibility tests
  it('has proper accessibility attributes', () => {
    render(
      <DataCard
        title="Accessible Card"
        description="This card is accessible"
        value="42"
      />
    )

    const card = screen.getByText('Accessible Card').closest('[role]')
    // Card should have appropriate role or be properly labeled
    expect(card).toBeInTheDocument()
  })

  it('supports keyboard navigation', async () => {
    const mockClick = vi.fn()
    const user = userEvent.setup()

    render(
      <DataCard
        title="Keyboard Card"
        interactive
        onClick={mockClick}
      />
    )

    const card = screen.getByText('Keyboard Card').closest('div')
    if (card) {
      card.focus()
      await user.keyboard('{Enter}')
      expect(mockClick).toHaveBeenCalledTimes(1)
    }
  })

  // Snapshot test
  it('matches snapshot for complex configuration', () => {
    const { container } = render(
      <DataCard
        title="Complex Card"
        description="Full-featured card"
        value="156"
        subtitle="total points"
        variant="primary"
        size="lg"
        progress={78}
        progressLabel="Progress"
        badge={{ text: "Featured", variant: "success" }}
        trend={{
          direction: "up",
          value: "+12%",
          label: "this week"
        }}
        metadata={[
          { label: "Category", value: "Fitness" },
          { label: "Streak", value: "5 days" }
        ]}
        actions={[
          {
            label: "View Details",
            onClick: () => {}
          }
        ]}
        showMenu
        interactive
      />
    )
    expect(container.firstChild).toMatchSnapshot()
  })
})