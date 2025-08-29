/**
 * GoalDetail Component Tests
 * 
 * Tests for the GoalDetail component including tabs, progress visualization,
 * sub-goals management, and activity timeline.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GoalDetail } from './GoalDetail'
import { GoalWithRelations } from '@/lib/prisma/repositories/goal-repository'

// Mock date-fns functions
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'PPP') return 'December 31st, 2024'
    if (formatStr === 'PPp') return 'Jan 1, 2023, 12:00 AM'
    return '2023-01-01'
  }),
  formatDistanceToNow: vi.fn(() => '2 hours ago'),
  isBefore: vi.fn(() => false)
}))

describe('GoalDetail Component', () => {
  const mockGoal: GoalWithRelations = {
    id: 'goal-1',
    title: 'Test Goal',
    description: 'This is a detailed test goal description',
    isCompleted: false,
    userId: 'user-1',
    moduleId: 'fitness',
    priority: 'high',
    difficulty: 'medium',
    targetDate: new Date('2024-12-31'),
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    progress: [
      {
        id: 'progress-1',
        goalId: 'goal-1',
        value: 75,
        maxValue: 100,
        recordedAt: new Date('2023-01-15'),
        notes: 'Good progress made',
        xpEarned: 50
      }
    ],
    _count: {
      subGoals: 3,
      progress: 1
    },
    subGoals: [
      {
        id: 'subgoal-1',
        title: 'Sub-goal 1',
        description: 'First sub-goal',
        isCompleted: true,
        userId: 'user-1',
        moduleId: 'fitness',
        priority: 'medium',
        difficulty: 'easy',
        targetDate: null,
        createdAt: new Date('2023-01-02'),
        updatedAt: new Date('2023-01-02'),
        progress: [],
        _count: { subGoals: 0, progress: 0 },
        subGoals: [],
        parentGoal: null,
        parentId: 'goal-1'
      }
    ],
    parentGoal: null,
    parentId: null
  }

  const defaultProps = {
    goal: mockGoal,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onComplete: vi.fn(),
    onBack: vi.fn(),
    onAddSubGoal: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Header Rendering', () => {
    it('should render goal title and basic information', () => {
      render(<GoalDetail {...defaultProps} />)
      
      expect(screen.getByText('Test Goal')).toBeInTheDocument()
      expect(screen.getByRole('img', { name: 'Fitness' })).toBeInTheDocument()
    })

    it('should render status badges correctly', () => {
      render(<GoalDetail {...defaultProps} />)
      
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('🚨 high')).toBeInTheDocument()
      expect(screen.getByText('Medium (1.5x)')).toBeInTheDocument()
    })

    it('should render back button when showBackButton is true', () => {
      render(<GoalDetail {...defaultProps} showBackButton={true} />)
      
      const backButton = screen.getByRole('button', { name: 'Go back' })
      expect(backButton).toBeInTheDocument()
    })

    it('should not render back button when showBackButton is false', () => {
      render(<GoalDetail {...defaultProps} showBackButton={false} />)
      
      const backButton = screen.queryByRole('button', { name: 'Go back' })
      expect(backButton).not.toBeInTheDocument()
    })

    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup()
      render(<GoalDetail {...defaultProps} showBackButton={true} />)
      
      const backButton = screen.getByRole('button', { name: 'Go back' })
      await user.click(backButton)
      
      expect(defaultProps.onBack).toHaveBeenCalled()
    })
  })

  describe('Stats Grid', () => {
    it('should display progress percentage', () => {
      render(<GoalDetail {...defaultProps} />)
      
      expect(screen.getByText('Progress')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('should display XP earned', () => {
      render(<GoalDetail {...defaultProps} />)
      
      expect(screen.getByText('XP Earned')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
    })

    it('should display streak count', () => {
      render(<GoalDetail {...defaultProps} />)
      
      expect(screen.getByText('Streak')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should display sub-goals count', () => {
      render(<GoalDetail {...defaultProps} />)
      
      expect(screen.getByText('Sub-Goals')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should handle goal with no progress', () => {
      const goalWithoutProgress = { ...mockGoal, progress: [], _count: { ...mockGoal._count, progress: 0 } }
      render(<GoalDetail {...defaultProps} goal={goalWithoutProgress} />)
      
      expect(screen.getByText('0%')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument() // XP Earned
    })
  })

  describe('Dropdown Menu Actions', () => {
    it('should show all menu options for incomplete goal', async () => {
      const user = userEvent.setup()
      render(<GoalDetail {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: 'More actions' })
      await user.click(menuButton)
      
      expect(screen.getByText('Mark Complete')).toBeInTheDocument()
      expect(screen.getByText('Edit Goal')).toBeInTheDocument()
      expect(screen.getByText('Add Sub-Goal')).toBeInTheDocument()
      expect(screen.getByText('Share')).toBeInTheDocument()
      expect(screen.getByText('Export')).toBeInTheDocument()
      expect(screen.getByText('Delete Goal')).toBeInTheDocument()
    })

    it('should not show complete option for completed goals', async () => {
      const user = userEvent.setup()
      const completedGoal = { ...mockGoal, isCompleted: true }
      render(<GoalDetail {...defaultProps} goal={completedGoal} />)
      
      const menuButton = screen.getByRole('button', { name: 'More actions' })
      await user.click(menuButton)
      
      expect(screen.queryByText('Mark Complete')).not.toBeInTheDocument()
    })

    it('should call appropriate handlers when menu items are clicked', async () => {
      const user = userEvent.setup()
      render(<GoalDetail {...defaultProps} />)
      
      const menuButton = screen.getByRole('button', { name: 'More actions' })
      await user.click(menuButton)
      
      // Test complete action
      const completeItem = screen.getByText('Mark Complete')
      await user.click(completeItem)
      expect(defaultProps.onComplete).toHaveBeenCalledWith('goal-1')
      
      // Reopen menu for next test
      await user.click(menuButton)
      
      // Test edit action
      const editItem = screen.getByText('Edit Goal')
      await user.click(editItem)
      expect(defaultProps.onEdit).toHaveBeenCalledWith(mockGoal)
      
      // Reopen menu for next test
      await user.click(menuButton)
      
      // Test add sub-goal action
      const addSubGoalItem = screen.getByText('Add Sub-Goal')
      await user.click(addSubGoalItem)
      expect(defaultProps.onAddSubGoal).toHaveBeenCalledWith('goal-1')
      
      // Reopen menu for next test
      await user.click(menuButton)
      
      // Test delete action
      const deleteItem = screen.getByText('Delete Goal')
      await user.click(deleteItem)
      expect(defaultProps.onDelete).toHaveBeenCalledWith('goal-1')
    })
  })

  describe('Tabs Navigation', () => {
    it('should render all tab options', () => {
      render(<GoalDetail {...defaultProps} />)
      
      expect(screen.getByText('Overview')).toBeInTheDocument()
      expect(screen.getByText('Progress')).toBeInTheDocument()
      expect(screen.getByText('Sub-Goals')).toBeInTheDocument()
      expect(screen.getByText('Activity')).toBeInTheDocument()
    })

    it('should switch tabs when clicked', async () => {
      const user = userEvent.setup()
      render(<GoalDetail {...defaultProps} />)
      
      // Click on Progress tab
      const progressTab = screen.getByRole('tab', { name: 'Progress' })
      await user.click(progressTab)
      
      expect(screen.getByText('Progress History')).toBeInTheDocument()
      expect(screen.getByText('Add Progress')).toBeInTheDocument()
    })
  })

  describe('Overview Tab', () => {
    it('should display goal description', () => {
      render(<GoalDetail {...defaultProps} />)
      
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(screen.getByText('This is a detailed test goal description')).toBeInTheDocument()
    })

    it('should display goal details section', () => {
      render(<GoalDetail {...defaultProps} />)
      
      expect(screen.getByText('Goal Details')).toBeInTheDocument()
      expect(screen.getByText('Category')).toBeInTheDocument()
      expect(screen.getByText('Priority')).toBeInTheDocument()
      expect(screen.getByText('Difficulty')).toBeInTheDocument()
      expect(screen.getByText('Target Date')).toBeInTheDocument()
    })

    it('should display timestamps section', () => {
      render(<GoalDetail {...defaultProps} />)
      
      expect(screen.getByText('Timestamps')).toBeInTheDocument()
      expect(screen.getByText('Created')).toBeInTheDocument()
      expect(screen.getByText('Last Updated')).toBeInTheDocument()
    })

    it('should handle goal without description', () => {
      const goalWithoutDescription = { ...mockGoal, description: null }
      render(<GoalDetail {...defaultProps} goal={goalWithoutDescription} />)
      
      expect(screen.queryByText('Description')).not.toBeInTheDocument()
    })

    it('should handle goal without target date', () => {
      const goalWithoutDate = { ...mockGoal, targetDate: null }
      render(<GoalDetail {...defaultProps} goal={goalWithoutDate} />)
      
      expect(screen.queryByText('Target Date')).not.toBeInTheDocument()
    })
  })

  describe('Progress Tab', () => {
    it('should display progress history when available', async () => {
      const user = userEvent.setup()
      render(<GoalDetail {...defaultProps} />)
      
      const progressTab = screen.getByRole('tab', { name: 'Progress' })
      await user.click(progressTab)
      
      expect(screen.getByText('Progress History')).toBeInTheDocument()
      expect(screen.getByText('75% Complete')).toBeInTheDocument()
      expect(screen.getByText('Good progress made')).toBeInTheDocument()
      expect(screen.getByText('+50 XP')).toBeInTheDocument()
    })

    it('should show add progress button', async () => {
      const user = userEvent.setup()
      render(<GoalDetail {...defaultProps} />)
      
      const progressTab = screen.getByRole('tab', { name: 'Progress' })
      await user.click(progressTab)
      
      expect(screen.getByText('Add Progress')).toBeInTheDocument()
    })

    it('should show no progress message when no progress entries exist', async () => {
      const user = userEvent.setup()
      const goalWithoutProgress = { ...mockGoal, progress: [] }
      render(<GoalDetail {...defaultProps} goal={goalWithoutProgress} />)
      
      const progressTab = screen.getByRole('tab', { name: 'Progress' })
      await user.click(progressTab)
      
      expect(screen.getByText(/No progress entries yet/)).toBeInTheDocument()
    })
  })

  describe('Sub-Goals Tab', () => {
    it('should display sub-goals when available', async () => {
      const user = userEvent.setup()
      render(<GoalDetail {...defaultProps} />)
      
      const subGoalsTab = screen.getByRole('tab', { name: 'Sub-Goals' })
      await user.click(subGoalsTab)
      
      expect(screen.getByText('Sub-Goals')).toBeInTheDocument()
      expect(screen.getByText('Sub-goal 1')).toBeInTheDocument()
      expect(screen.getByText('Add Sub-Goal')).toBeInTheDocument()
    })

    it('should show completed status for completed sub-goals', async () => {
      const user = userEvent.setup()
      render(<GoalDetail {...defaultProps} />)
      
      const subGoalsTab = screen.getByRole('tab', { name: 'Sub-Goals' })
      await user.click(subGoalsTab)
      
      // Sub-goal should have completed styling (line-through)
      const subGoalTitle = screen.getByText('Sub-goal 1')
      expect(subGoalTitle).toHaveClass('line-through')
    })

    it('should show no sub-goals message when none exist', async () => {
      const user = userEvent.setup()
      const goalWithoutSubGoals = { ...mockGoal, subGoals: [], _count: { ...mockGoal._count, subGoals: 0 } }
      render(<GoalDetail {...defaultProps} goal={goalWithoutSubGoals} />)
      
      const subGoalsTab = screen.getByRole('tab', { name: 'Sub-Goals' })
      await user.click(subGoalsTab)
      
      expect(screen.getByText(/No sub-goals yet/)).toBeInTheDocument()
    })

    it('should call onAddSubGoal when add button is clicked', async () => {
      const user = userEvent.setup()
      render(<GoalDetail {...defaultProps} />)
      
      const subGoalsTab = screen.getByRole('tab', { name: 'Sub-Goals' })
      await user.click(subGoalsTab)
      
      const addButton = screen.getByText('Add Sub-Goal')
      await user.click(addButton)
      
      expect(defaultProps.onAddSubGoal).toHaveBeenCalledWith('goal-1')
    })
  })

  describe('Activity Tab', () => {
    it('should display activity timeline', async () => {
      const user = userEvent.setup()
      render(<GoalDetail {...defaultProps} />)
      
      const activityTab = screen.getByRole('tab', { name: 'Activity' })
      await user.click(activityTab)
      
      expect(screen.getByText('Activity Timeline')).toBeInTheDocument()
      expect(screen.getByText('Updated progress to 75%')).toBeInTheDocument()
      expect(screen.getByText('Goal created')).toBeInTheDocument()
    })

    it('should show XP gained for activities', async () => {
      const user = userEvent.setup()
      render(<GoalDetail {...defaultProps} />)
      
      const activityTab = screen.getByRole('tab', { name: 'Activity' })
      await user.click(activityTab)
      
      expect(screen.getByText('+25 XP')).toBeInTheDocument()
    })
  })

  describe('Completed Goal State', () => {
    it('should show completed status and styling', () => {
      const completedGoal = { ...mockGoal, isCompleted: true }
      render(<GoalDetail {...defaultProps} goal={completedGoal} />)
      
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByText('100%')).toBeInTheDocument() // Progress should be 100%
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for tabs', () => {
      render(<GoalDetail {...defaultProps} />)
      
      expect(screen.getByRole('tab', { name: 'Overview' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Progress' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Sub-Goals' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Activity' })).toBeInTheDocument()
    })

    it('should have proper button labels', () => {
      render(<GoalDetail {...defaultProps} showBackButton={true} />)
      
      expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'More actions' })).toBeInTheDocument()
    })

    it('should have proper screen reader content', () => {
      render(<GoalDetail {...defaultProps} showBackButton={true} />)
      
      const backButton = screen.getByRole('button', { name: 'Go back' })
      const srText = backButton.querySelector('.sr-only')
      expect(srText).toHaveTextContent('Go back')
    })
  })

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      render(<GoalDetail {...defaultProps} className="custom-detail-class" />)
      
      expect(document.querySelector('.custom-detail-class')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle goal with unknown module ID', () => {
      const goalWithUnknownModule = { ...mockGoal, moduleId: 'unknown-module' }
      render(<GoalDetail {...defaultProps} goal={goalWithUnknownModule} />)
      
      // Should still render without crashing
      expect(screen.getByText('Test Goal')).toBeInTheDocument()
    })

    it('should handle goal with no _count data', () => {
      const goalWithoutCount = { ...mockGoal, _count: null }
      render(<GoalDetail {...defaultProps} goal={goalWithoutCount as any} />)
      
      // Should show 0 for sub-goals
      expect(screen.getByText('0')).toBeInTheDocument()
    })
  })
})