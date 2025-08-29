import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Button } from './Button'
import { Plus, ArrowRight } from 'lucide-react'

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant classes correctly', () => {
    const { rerender } = render(<Button variant="success">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-green-600')
    
    rerender(<Button variant="destructive">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-destructive')
  })

  it('applies size classes correctly', () => {
    const { rerender } = render(<Button size="sm">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-8')
    
    rerender(<Button size="lg">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('h-10')
  })

  it('shows loading state correctly', () => {
    render(<Button loading>Save</Button>)
    
    // Should show spinner (Loader2 from lucide-react)
    const button = screen.getByRole('button')
    expect(button.querySelector('svg')).toBeInTheDocument()
    expect(button).toHaveAttribute('data-loading', 'true')
    
    // Button should be disabled when loading
    expect(button).toBeDisabled()
  })

  it('shows loading text when provided', () => {
    render(<Button loading loadingText="Saving...">Save</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Saving...')
  })

  it('renders with left icon', () => {
    render(
      <Button leftIcon={<Plus data-testid="plus-icon" />}>
        Add Item
      </Button>
    )
    
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveTextContent('Add Item')
  })

  it('renders with right icon', () => {
    render(
      <Button rightIcon={<ArrowRight data-testid="arrow-icon" />}>
        Continue
      </Button>
    )
    
    expect(screen.getByTestId('arrow-icon')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveTextContent('Continue')
  })

  it('renders with both left and right icons', () => {
    render(
      <Button 
        leftIcon={<Plus data-testid="plus-icon" />}
        rightIcon={<ArrowRight data-testid="arrow-icon" />}
      >
        Add and Continue
      </Button>
    )
    
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
    expect(screen.getByTestId('arrow-icon')).toBeInTheDocument()
  })

  it('shows badge when provided', () => {
    render(<Button badge={5}>Messages</Button>)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveTextContent('Messages')
  })

  it('shows string badge', () => {
    render(<Button badge="NEW">Features</Button>)
    expect(screen.getByText('NEW')).toBeInTheDocument()
  })

  it('applies fullWidth class', () => {
    render(<Button fullWidth>Full Width</Button>)
    expect(screen.getByRole('button')).toHaveClass('w-full')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('is disabled when loading is true', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('sets tooltip title attribute', () => {
    render(<Button tooltip="This is a tooltip">Button</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('title', 'This is a tooltip')
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('custom-class')
  })

  it('applies rounded variant classes', () => {
    const { rerender } = render(<Button rounded="full">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('rounded-full')
    
    rerender(<Button rounded="none">Button</Button>)
    expect(screen.getByRole('button')).toHaveClass('rounded-none')
  })

  it('renders as child element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    )
    
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/test')
    expect(link).toHaveTextContent('Link Button')
  })

  // Accessibility tests
  it('has proper accessibility attributes', () => {
    render(<Button>Accessible Button</Button>)
    const button = screen.getByRole('button')
    
    expect(button).toHaveAttribute('data-slot', 'button')
  })

  it('maintains focus management', async () => {
    const user = userEvent.setup()
    render(<Button>Focusable Button</Button>)
    
    const button = screen.getByRole('button')
    await user.tab()
    
    expect(button).toHaveFocus()
  })

  it('handles keyboard interactions', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Keyboard Button</Button>)
    
    const button = screen.getByRole('button')
    button.focus()
    
    await user.keyboard('{Enter}')
    expect(handleClick).toHaveBeenCalledTimes(1)
    
    await user.keyboard(' ')
    expect(handleClick).toHaveBeenCalledTimes(2)
  })

  // Snapshot test
  it('matches snapshot', () => {
    const { container } = render(
      <Button 
        variant="success" 
        size="lg" 
        leftIcon={<Plus />}
        badge={3}
      >
        Test Button
      </Button>
    )
    expect(container.firstChild).toMatchSnapshot()
  })
})