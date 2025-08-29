/**
 * GoalCard Component Tests
 * 
 * Tests for the GoalCard component including rendering, interactions, 
 * swipe actions, and accessibility features.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GoalCard } from './GoalCard'
import { GoalWithRelations } from '@/lib/prisma/repositories/goal-repository'

// Mock components
vi.mock('@/components/mobile/TouchFriendlyCard', () => ({
  TouchFriendlyCard: ({ children, onClick, swipeActions, className, ...props }: any) => (
    <div 
      className={className}
      onClick={onClick}
      data-testid="touch-friendly-card"
      data-swipe-actions={JSON.stringify(swipeActions)}
      {...props}
    >
      {children}
    </div>
  )
}))

vi.mock('@/components/base/StatusBadge', () => ({
  StatusBadge: ({ status, size }: any) => (
    <span data-testid="status-badge" data-status={status} data-size={size}>
      {status}
    </span>
  )
}))

describe('GoalCard Component', () => {
  const mockGoal: GoalWithRelations = {
    id: 'goal-1',
    title: 'Test Goal',
    description: 'This is a test goal description',
    isCompleted: false,
    userId: 'user-1',
    moduleId: 'fitness',
    priority: 'medium',
    difficulty: 'medium',
    targetDate: new Date('2024-12-31'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    progress: [
      {
        id: 'progress-1',
        goalId: 'goal-1',
        value: 50,
        maxValue: 100,
        recordedAt: new Date('2023-01-15'),
        notes: 'Good progress',
        xpEarned: 25
      }
    ],
    _count: {
      subGoals: 2,
      progress: 1
    },
    subGoals: [],
    parentGoal: null,
    parentId: null
  }

  const defaultProps = {
    goal: mockGoal,
    onComplete: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onView: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render goal title and description', () => {
      render(<GoalCard {...defaultProps} />)
      
      expect(screen.getByText('Test Goal')).toBeInTheDocument()
      expect(screen.getByText('This is a test goal description')).toBeInTheDocument()
    })

    it('should render module icon and information', () => {
      render(<GoalCard {...defaultProps} />)
      
      // Fitness module should show 💪 icon
      expect(screen.getByRole('img', { name: 'Fitness' })).toBeInTheDocument()
    })

    it('should render status badge', () => {
      render(<GoalCard {...defaultProps} />)
      
      const statusBadge = screen.getByTestId('status-badge')
      expect(statusBadge).toBeInTheDocument()
      expect(statusBadge).toHaveAttribute('data-status', 'in_progress')
    })

    it('should render priority and difficulty badges', () => {
      render(<GoalCard {...defaultProps} />)
      
      expect(screen.getByText('medium')).toBeInTheDocument()
      expect(screen.getByText('100 XP')).toBeInTheDocument()
    })

    it('should render progress bar when showProgress is true', () => {
      render(<GoalCard {...defaultProps} showProgress={true} />)
      
      expect(screen.getByText('Progress')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('should not render progress bar when showProgress is false', () => {
      render(<GoalCard {...defaultProps} showProgress={false} />)
      
      expect(screen.queryByText('Progress')).not.toBeInTheDocument()
    })

    it('should render sub-goals count when available', () => {
      render(<GoalCard {...defaultProps} />)
      
      expect(screen.getByText('2 sub-goals')).toBeInTheDocument()
    })

    it('should render target date', () => {
      render(<GoalCard {...defaultProps} />)
      
      // Should show time until due
      expect(screen.getByText(/Due in \d+ days/)).toBeInTheDocument()
    })
  })

  describe('Compact Mode', () => {
    it('should render in compact mode', () => {
      render(<GoalCard {...defaultProps} compact={true} />)
      
      expect(screen.getByText('Test Goal')).toBeInTheDocument()
      expect(screen.queryByText('This is a test goal description')).not.toBeInTheDocument()
    })

    it('should show abbreviated date format in compact mode', () => {
      render(<GoalCard {...defaultProps} compact={true} />)
      
      expect(screen.getByText('Dec 31')).toBeInTheDocument()
    })
  })

  describe('Completed Goal State', () => {
    it('should render completed goal with strikethrough title', () => {
      const completedGoal = { ...mockGoal, isCompleted: true }
      render(<GoalCard {...defaultProps} goal={completedGoal} />)
      
      const title = screen.getByText('Test Goal')
      expect(title).toHaveClass('line-through')
    })

    it('should show completed status badge', () => {
      const completedGoal = { ...mockGoal, isCompleted: true }
      render(<GoalCard {...defaultProps} goal={completedGoal} />)
      
      const statusBadge = screen.getByTestId('status-badge')
      expect(statusBadge).toHaveAttribute('data-status', 'completed')
    })

    it('should show 100% progress for completed goals', () => {
      const completedGoal = { ...mockGoal, isCompleted: true }
      render(<GoalCard {...defaultProps} goal={completedGoal} />)
      
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  describe('Overdue Goal State', () => {
    it('should render overdue goal correctly', () => {
      const overdueGoal = {
        ...mockGoal,
        targetDate: new Date('2023-01-01'), // Past date
        isCompleted: false
      }
      render(<GoalCard {...defaultProps} goal={overdueGoal} />)
      
      const statusBadge = screen.getByTestId('status-badge')
      expect(statusBadge).toHaveAttribute('data-status', 'overdue')
    })

    it('should show overdue message for past due dates', () => {
      const overdueGoal = {
        ...mockGoal,
        targetDate: new Date('2023-01-01'), // Past date
        isCompleted: false
      }
      render(<GoalCard {...defaultProps} goal={overdueGoal} />)
      
      expect(screen.getByText(/\d+ days overdue/)).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onView when card is clicked', async () => {
      const user = userEvent.setup()
      render(<GoalCard {...defaultProps} />)
      
      const card = screen.getByTestId('touch-friendly-card')
      await user.click(card)
      
      expect(defaultProps.onView).toHaveBeenCalledWith(mockGoal)
    })

    it('should call onComplete when complete menu item is clicked', async () => {
      const user = userEvent.setup()
      render(<GoalCard {...defaultProps} />)
      
      // Open dropdown menu
      const menuButton = screen.getByRole('button', { name: 'Open menu' })
      await user.click(menuButton)
      
      // Click complete option
      const completeItem = screen.getByText('Mark Complete')
      await user.click(completeItem)
      
      expect(defaultProps.onComplete).toHaveBeenCalledWith('goal-1')
    })

    it('should call onEdit when edit menu item is clicked', async () => {
      const user = userEvent.setup()
      render(<GoalCard {...defaultProps} />)
      
      // Open dropdown menu
      const menuButton = screen.getByRole('button', { name: 'Open menu' })
      await user.click(menuButton)
      
      // Click edit option
      const editItem = screen.getByText('Edit')
      await user.click(editItem)
      
      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockGoal)
    })

    it('should call onDelete when delete menu item is clicked', async () => {
      const user = userEvent.setup()
      render(<GoalCard {...defaultProps} />)
      
      // Open dropdown menu
      const menuButton = screen.getByRole('button', { name: 'Open menu' })
      await user.click(menuButton)
      
      // Click delete option
      const deleteItem = screen.getByText('Delete')
      await user.click(deleteItem)
      
      expect(defaultProps.onDelete).toHaveBeenCalledWith('goal-1')
    })

    it('should not show complete option for completed goals', async () => {
      const user = userEvent.setup()
      const completedGoal = { ...mockGoal, isCompleted: true }
      render(<GoalCard {...defaultProps} goal={completedGoal} />)
      
      // Open dropdown menu
      const menuButton = screen.getByRole('button', { name: 'Open menu' })
      await user.click(menuButton)
      
      // Complete option should not be present
      expect(screen.queryByText('Mark Complete')).not.toBeInTheDocument()
    })
  })

  describe('Swipe Actions', () => {
    it('should enable swipe actions by default', () => {
      render(<GoalCard {...defaultProps} />)
      
      const card = screen.getByTestId('touch-friendly-card')
      const swipeActions = JSON.parse(card.dataset.swipeActions || '{}')
      
      expect(swipeActions.left).toHaveLength(1) // Complete action
      expect(swipeActions.right).toHaveLength(2) // Edit and Delete actions
    })

    it('should disable swipe actions when enableSwipeActions is false', () => {
      render(<GoalCard {...defaultProps} enableSwipeActions={false} />)
      
      // Should not render TouchFriendlyCard when swipe actions are disabled
      expect(screen.queryByTestId('touch-friendly-card')).not.toBeInTheDocument()
    })

    it('should not show complete swipe action for completed goals', () => {
      const completedGoal = { ...mockGoal, isCompleted: true }
      render(<GoalCard {...defaultProps} goal={completedGoal} />)
      
      const card = screen.getByTestId('touch-friendly-card')
      const swipeActions = JSON.parse(card.dataset.swipeActions || '{}')
      
      expect(swipeActions.left).toHaveLength(0) // No complete action for completed goals
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<GoalCard {...defaultProps} />)
      
      const card = screen.getByTestId('touch-friendly-card')
      expect(card).toHaveAttribute('aria-label', 'Goal: Test Goal')
    })

    it('should support keyboard navigation when swipe actions are disabled', () => {
      render(<GoalCard {...defaultProps} enableSwipeActions={false} />)
      
      const card = screen.getByRole('button')
      expect(card).toHaveAttribute('tabIndex', '0')
      expect(card).toHaveAttribute('aria-label', 'Goal: Test Goal')
    })

    it('should handle keyboard events', async () => {
      render(<GoalCard {...defaultProps} enableSwipeActions={false} />)
      
      const card = screen.getByRole('button')
      
      // Test Enter key
      fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' })
      expect(defaultProps.onView).toHaveBeenCalledWith(mockGoal)
      
      vi.clearAllMocks()
      
      // Test Space key
      fireEvent.keyDown(card, { key: ' ', code: 'Space' })
      expect(defaultProps.onView).toHaveBeenCalledWith(mockGoal)
    })

    it('should have proper progress bar accessibility', () => {
      render(<GoalCard {...defaultProps} showProgress={true} />)
      
      const progressBar = screen.getByLabelText('Goal progress: 50%')
      expect(progressBar).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle goal without progress data', () => {
      const goalWithoutProgress = { ...mockGoal, progress: [] }
      render(<GoalCard {...defaultProps} goal={goalWithoutProgress} />)
      
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('should handle goal without target date', () => {
      const goalWithoutDate = { ...mockGoal, targetDate: null }
      render(<GoalCard {...defaultProps} goal={goalWithoutDate} />)
      
      // Should not show any date-related text
      expect(screen.queryByText(/Due/)).not.toBeInTheDocument()
    })

    it('should handle goal without sub-goals count', () => {
      const goalWithoutSubGoals = { ...mockGoal, _count: { subGoals: 0, progress: 0 } }
      render(<GoalCard {...defaultProps} goal={goalWithoutSubGoals} />)
      
      expect(screen.queryByText(/sub-goal/)).not.toBeInTheDocument()
    })

    it('should handle unknown module ID gracefully', () => {
      const goalWithUnknownModule = { ...mockGoal, moduleId: 'unknown-module' }
      render(<GoalCard {...defaultProps} goal={goalWithUnknownModule} />)
      
      // Should still render the goal card without crashing
      expect(screen.getByText('Test Goal')).toBeInTheDocument()
    })
  })

  describe('CSS Classes', () => {
    it('should apply custom className', () => {
      render(<GoalCard {...defaultProps} className="custom-class" />)
      
      const card = screen.getByTestId('touch-friendly-card')
      expect(card).toHaveClass('custom-class')
    })

    it('should apply correct module colors', () => {
      render(<GoalCard {...defaultProps} />)
      
      // Check for fitness module styling classes
      const moduleIcon = screen.getByRole('img', { name: 'Fitness' })
      const iconContainer = moduleIcon.parentElement
      expect(iconContainer).toHaveClass('bg-orange-50')
    })
  })
})