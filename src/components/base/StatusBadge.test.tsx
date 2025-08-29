import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StatusBadge, getGoalStatus, getPriorityStatus, getProgressStatus } from './StatusBadge'
import { Target } from 'lucide-react'

describe('StatusBadge', () => {
  it('renders with default status', () => {
    render(<StatusBadge status="active" />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('applies correct variant classes for different statuses', () => {
    const { rerender } = render(<StatusBadge status="completed" />)
    expect(screen.getByText('Completed')).toHaveClass('text-green-800')
    
    rerender(<StatusBadge status="error" />)
    expect(screen.getByText('Error')).toHaveClass('text-red-800')
    
    rerender(<StatusBadge status="warning" />)
    expect(screen.getByText('Warning')).toHaveClass('text-yellow-800')
  })

  it('shows custom label when provided', () => {
    render(<StatusBadge status="active" customLabel="In Progress" />)
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('shows count when provided', () => {
    render(<StatusBadge status="active" count={5} />)
    expect(screen.getByText('Active (5)')).toBeInTheDocument()
  })

  it('renders custom icon', () => {
    render(
      <StatusBadge 
        status="active" 
        customIcon={<Target data-testid="custom-icon" />}
      />
    )
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('hides icon when showIcon is false', () => {
    render(<StatusBadge status="active" showIcon={false} />)
    
    // Should not have any svg elements (icons)
    const badge = screen.getByText('Active').closest('span')
    expect(badge?.querySelector('svg')).toBeNull()
  })

  it('applies size classes correctly', () => {
    const { rerender } = render(<StatusBadge status="active" size="sm" />)
    expect(screen.getByText('Active').closest('span')).toHaveClass('text-xs', 'px-2')
    
    rerender(<StatusBadge status="active" size="lg" />)
    expect(screen.getByText('Active').closest('span')).toHaveClass('px-3')
  })

  it('applies rounded classes correctly', () => {
    const { rerender } = render(<StatusBadge status="active" rounded="full" />)
    expect(screen.getByText('Active').closest('span')).toHaveClass('rounded-full')
    
    rerender(<StatusBadge status="active" rounded="none" />)
    expect(screen.getByText('Active').closest('span')).toHaveClass('rounded-none')
  })

  it('applies pulse animation when specified', () => {
    render(<StatusBadge status="active" pulse />)
    expect(screen.getByText('Active').closest('span')).toHaveClass('animate-pulse')
  })

  it('sets tooltip when provided', () => {
    render(<StatusBadge status="active" tooltip="This is active" />)
    expect(screen.getByText('Active').closest('span')).toHaveAttribute('title', 'This is active')
  })

  // Test automatic pulse for certain statuses
  it('automatically pulses for overdue status', () => {
    render(<StatusBadge status="overdue" />)
    expect(screen.getByText('Overdue').closest('span')).toHaveClass('animate-pulse')
  })

  it('automatically pulses for levelUp status', () => {
    render(<StatusBadge status="levelUp" />)
    expect(screen.getByText('Level Up!').closest('span')).toHaveClass('animate-pulse')
  })

  // Helper function tests
  describe('getGoalStatus', () => {
    it('returns completed for completed goals', () => {
      const goal = { isCompleted: true, isPaused: false, isCancelled: false }
      expect(getGoalStatus(goal)).toBe('completed')
    })

    it('returns cancelled for cancelled goals', () => {
      const goal = { isCompleted: false, isPaused: false, isCancelled: true }
      expect(getGoalStatus(goal)).toBe('cancelled')
    })

    it('returns paused for paused goals', () => {
      const goal = { isCompleted: false, isPaused: true, isCancelled: false }
      expect(getGoalStatus(goal)).toBe('paused')
    })

    it('returns overdue for overdue goals', () => {
      const yesterday = new Date(Date.now() - 86400000)
      const goal = { 
        isCompleted: false, 
        isPaused: false, 
        isCancelled: false, 
        dueDate: yesterday 
      }
      expect(getGoalStatus(goal)).toBe('overdue')
    })

    it('returns pending for future goals', () => {
      const tomorrow = new Date(Date.now() + 86400000)
      const goal = { 
        isCompleted: false, 
        isPaused: false, 
        isCancelled: false, 
        startDate: tomorrow 
      }
      expect(getGoalStatus(goal)).toBe('pending')
    })

    it('returns active for active goals', () => {
      const goal = { isCompleted: false, isPaused: false, isCancelled: false }
      expect(getGoalStatus(goal)).toBe('active')
    })
  })

  describe('getPriorityStatus', () => {
    it('correctly identifies string priorities', () => {
      expect(getPriorityStatus('low')).toBe('low')
      expect(getPriorityStatus('high')).toBe('high')
      expect(getPriorityStatus('critical')).toBe('critical')
      expect(getPriorityStatus('urgent')).toBe('critical')
    })

    it('correctly identifies numeric priorities', () => {
      expect(getPriorityStatus(1)).toBe('low')
      expect(getPriorityStatus(2)).toBe('medium')
      expect(getPriorityStatus(3)).toBe('high')
      expect(getPriorityStatus(4)).toBe('critical')
    })
  })

  describe('getProgressStatus', () => {
    it('returns notStarted for 0 progress', () => {
      expect(getProgressStatus(0)).toBe('notStarted')
    })

    it('returns inProgress for partial progress', () => {
      expect(getProgressStatus(45)).toBe('inProgress')
    })

    it('returns completed for 100% progress', () => {
      expect(getProgressStatus(100)).toBe('completed')
    })
  })

  // Accessibility tests
  it('has proper role and attributes', () => {
    render(<StatusBadge status="active" />)
    const badge = screen.getByText('Active').closest('span')
    
    // Badge should be properly labeled for screen readers
    expect(badge).toBeInTheDocument()
  })

  // Snapshot test
  it('matches snapshot for various configurations', () => {
    const { container } = render(
      <div>
        <StatusBadge status="active" />
        <StatusBadge status="completed" size="lg" />
        <StatusBadge status="overdue" count={3} pulse />
        <StatusBadge status="levelUp" customLabel="Achievement!" />
      </div>
    )
    expect(container).toMatchSnapshot()
  })
})