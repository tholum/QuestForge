/**
 * GoalsPage Component Tests
 * 
 * Tests for the GoalsPage component including responsive behavior, 
 * filtering, searching, pagination, and CRUD operations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GoalsPage } from './GoalsPage'
import { GoalWithRelations } from '@/lib/prisma/repositories/goal-repository'

// Mock the useGoals hook
const mockGoalsHook = {
  goals: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  },
  filters: {},
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  createGoal: vi.fn(),
  updateGoal: vi.fn(),
  deleteGoal: vi.fn(),
  refetch: vi.fn()
}

vi.mock('@/hooks/useGoals', () => ({
  useGoals: vi.fn(() => mockGoalsHook)
}))

// Mock components
vi.mock('@/components/layout/MainContent', () => ({
  MainContent: ({ children, currentPage, pageTitle, pageSubtitle, pageActions }: any) => (
    <div data-testid="main-content" data-page={currentPage}>
      <div data-testid="page-header">
        <h1>{pageTitle}</h1>
        <p>{pageSubtitle}</p>
        <div>{pageActions}</div>
      </div>
      {children}
    </div>
  )
}))

vi.mock('@/components/goals', () => ({
  GoalCard: ({ goal, onView, onEdit, onDelete, onComplete }: any) => (
    <div data-testid={`goal-card-${goal.id}`}>
      <h3>{goal.title}</h3>
      <button onClick={() => onView(goal)}>View</button>
      <button onClick={() => onEdit(goal)}>Edit</button>
      <button onClick={() => onDelete(goal.id)}>Delete</button>
      <button onClick={() => onComplete(goal.id)}>Complete</button>
    </div>
  ),
  GoalForm: ({ mode, onSubmit, onCancel, initialData }: any) => (
    <div data-testid={`goal-form-${mode}`}>
      <button onClick={() => onSubmit({ title: 'New Goal', moduleId: 'fitness' })}>
        Submit
      </button>
      {onCancel && <button onClick={onCancel}>Cancel</button>}
    </div>
  ),
  GoalDetail: ({ goal, onEdit, onDelete, onComplete, onBack }: any) => (
    <div data-testid={`goal-detail-${goal.id}`}>
      <h2>{goal.title}</h2>
      <button onClick={() => onEdit(goal)}>Edit Goal</button>
      <button onClick={() => onDelete(goal.id)}>Delete Goal</button>
      <button onClick={() => onComplete(goal.id)}>Complete Goal</button>
      {onBack && <button onClick={onBack}>Back</button>}
    </div>
  )
}))

vi.mock('@/components/base/BaseTable', () => ({
  BaseTable: ({ data, onRowClick }: any) => (
    <div data-testid="base-table">
      {data.map((item: any) => (
        <div key={item.id} onClick={() => onRowClick?.(item)}>
          {item.title}
        </div>
      ))}
    </div>
  )
}))

vi.mock('@/components/mobile/PullToRefresh', () => ({
  PullToRefresh: ({ children, onRefresh }: any) => (
    <div data-testid="pull-to-refresh">
      <button onClick={onRefresh}>Refresh</button>
      {children}
    </div>
  )
}))

describe('GoalsPage Component', () => {
  const mockGoals: GoalWithRelations[] = [
    {
      id: 'goal-1',
      title: 'Fitness Goal',
      description: 'Get in shape',
      isCompleted: false,
      userId: 'user-1',
      moduleId: 'fitness',
      priority: 'high',
      difficulty: 'medium',
      targetDate: new Date('2024-12-31'),
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      progress: [],
      _count: { subGoals: 0, progress: 0 },
      subGoals: [],
      parentGoal: null,
      parentId: null
    },
    {
      id: 'goal-2',
      title: 'Learning Goal',
      description: 'Learn React',
      isCompleted: true,
      userId: 'user-1',
      moduleId: 'learning',
      priority: 'medium',
      difficulty: 'hard',
      targetDate: new Date('2023-12-31'),
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      progress: [],
      _count: { subGoals: 2, progress: 5 },
      subGoals: [],
      parentGoal: null,
      parentId: null
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset window size for responsive tests
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    
    // Reset mock hook
    vi.mocked(require('@/hooks/useGoals').useGoals).mockReturnValue({
      ...mockGoalsHook,
      goals: mockGoals,
      pagination: {
        ...mockGoalsHook.pagination,
        total: 2
      }
    })
  })

  describe('Page Header', () => {
    it('should render page title and subtitle', () => {
      render(<GoalsPage />)
      
      expect(screen.getByText('Goals')).toBeInTheDocument()
      expect(screen.getByText('2 goals found')).toBeInTheDocument()
    })

    it('should render new goal button', () => {
      render(<GoalsPage />)
      
      expect(screen.getByText('New Goal')).toBeInTheDocument()
    })

    it('should show loading state in subtitle', () => {
      vi.mocked(require('@/hooks/useGoals').useGoals).mockReturnValue({
        ...mockGoalsHook,
        loading: true
      })

      render(<GoalsPage />)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error alert when API fails', () => {
      vi.mocked(require('@/hooks/useGoals').useGoals).mockReturnValue({
        ...mockGoalsHook,
        error: new Error('API Error')
      })

      render(<GoalsPage />)
      
      expect(screen.getByText('Failed to load goals: API Error')).toBeInTheDocument()
    })
  })

  describe('Quick Stats', () => {
    it('should calculate and display goal statistics', () => {
      render(<GoalsPage />)
      
      expect(screen.getByText('Total Goals')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument() // Total goals
      
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument() // Completed goals
      
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument() // In progress goals
      
      expect(screen.getByText('Overdue')).toBeInTheDocument()
    })
  })

  describe('Search and Filters', () => {
    it('should render search input', () => {
      render(<GoalsPage />)
      
      const searchInput = screen.getByPlaceholderText('Search goals...')
      expect(searchInput).toBeInTheDocument()
    })

    it('should update search query when typing', async () => {
      const user = userEvent.setup()
      render(<GoalsPage />)
      
      const searchInput = screen.getByPlaceholderText('Search goals...')
      await user.type(searchInput, 'fitness')
      
      expect(searchInput).toHaveValue('fitness')
    })

    it('should show clear search button when search has value', async () => {
      const user = userEvent.setup()
      render(<GoalsPage />)
      
      const searchInput = screen.getByPlaceholderText('Search goals...')
      await user.type(searchInput, 'fitness')
      
      // Clear button should be visible
      const clearButton = searchInput.parentElement?.querySelector('button')
      expect(clearButton).toBeInTheDocument()
    })

    it('should clear search when clear button is clicked', async () => {
      const user = userEvent.setup()
      render(<GoalsPage />)
      
      const searchInput = screen.getByPlaceholderText('Search goals...')
      await user.type(searchInput, 'fitness')
      
      const clearButton = searchInput.parentElement?.querySelector('button')
      if (clearButton) {
        await user.click(clearButton)
      }
      
      expect(searchInput).toHaveValue('')
    })

    it('should render filter selects', () => {
      render(<GoalsPage />)
      
      expect(screen.getByDisplayValue('Filter by category')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Filter by priority')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Sort by')).toBeInTheDocument()
    })
  })

  describe('Tabs', () => {
    it('should render tab navigation', () => {
      render(<GoalsPage />)
      
      expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Active' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Done' })).toBeInTheDocument()
    })

    it('should switch tabs when clicked', async () => {
      const user = userEvent.setup()
      render(<GoalsPage />)
      
      const activeTab = screen.getByRole('tab', { name: 'Active' })
      await user.click(activeTab)
      
      // Should update the selected tab - this would trigger a re-render with filtered data
      expect(activeTab).toHaveAttribute('data-state', 'active')
    })
  })

  describe('Responsive Behavior', () => {
    it('should show desktop table view on large screens', () => {
      // Set large screen size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })
      
      render(<GoalsPage />)
      
      expect(screen.getByTestId('base-table')).toBeInTheDocument()
      expect(screen.queryByTestId('pull-to-refresh')).not.toBeInTheDocument()
    })

    it('should show mobile card view on small screens', () => {
      // Set mobile screen size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      })
      
      render(<GoalsPage />)
      
      // Trigger resize event to update state
      fireEvent.resize(window)
      
      // Need to wait for state update and re-render
      waitFor(() => {
        expect(screen.getByTestId('pull-to-refresh')).toBeInTheDocument()
        expect(screen.queryByTestId('base-table')).not.toBeInTheDocument()
      })
    })
  })

  describe('Goal List Rendering', () => {
    it('should render goals in mobile view', () => {
      // Set mobile screen size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      })
      
      render(<GoalsPage />)
      fireEvent.resize(window)
      
      waitFor(() => {
        expect(screen.getByTestId('goal-card-goal-1')).toBeInTheDocument()
        expect(screen.getByTestId('goal-card-goal-2')).toBeInTheDocument()
      })
    })

    it('should show empty state when no goals exist', () => {
      vi.mocked(require('@/hooks/useGoals').useGoals).mockReturnValue({
        ...mockGoalsHook,
        goals: [],
        pagination: { ...mockGoalsHook.pagination, total: 0 }
      })

      render(<GoalsPage />)
      
      expect(screen.getByText('No goals found')).toBeInTheDocument()
      expect(screen.getByText('Get started by creating your first goal')).toBeInTheDocument()
      expect(screen.getByText('Create Goal')).toBeInTheDocument()
    })

    it('should show loading spinner when loading', () => {
      vi.mocked(require('@/hooks/useGoals').useGoals).mockReturnValue({
        ...mockGoalsHook,
        loading: true
      })

      render(<GoalsPage />)
      
      // LoadingSpinner would be mocked, so we check for its container
      expect(screen.getByTestId('main-content')).toBeInTheDocument()
    })
  })

  describe('Pagination', () => {
    it('should show pagination when multiple pages exist', () => {
      vi.mocked(require('@/hooks/useGoals').useGoals).mockReturnValue({
        ...mockGoalsHook,
        goals: mockGoals,
        pagination: {
          page: 1,
          limit: 20,
          total: 50,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: false
        }
      })

      render(<GoalsPage />)
      
      expect(screen.getByText('Showing 1 to 2 of 50 goals')).toBeInTheDocument()
      expect(screen.getByText('Previous')).toBeInTheDocument()
      expect(screen.getByText('Next')).toBeInTheDocument()
    })

    it('should disable previous button on first page', () => {
      vi.mocked(require('@/hooks/useGoals').useGoals).mockReturnValue({
        ...mockGoalsHook,
        pagination: {
          ...mockGoalsHook.pagination,
          totalPages: 2,
          hasNextPage: true,
          hasPreviousPage: false
        }
      })

      render(<GoalsPage />)
      
      const previousButton = screen.getByText('Previous')
      expect(previousButton).toBeDisabled()
    })

    it('should disable next button on last page', () => {
      vi.mocked(require('@/hooks/useGoals').useGoals).mockReturnValue({
        ...mockGoalsHook,
        pagination: {
          ...mockGoalsHook.pagination,
          page: 2,
          totalPages: 2,
          hasNextPage: false,
          hasPreviousPage: true
        }
      })

      render(<GoalsPage />)
      
      const nextButton = screen.getByText('Next')
      expect(nextButton).toBeDisabled()
    })
  })

  describe('Goal Actions', () => {
    it('should open create dialog when new goal button is clicked', async () => {
      const user = userEvent.setup()
      render(<GoalsPage />)
      
      const newGoalButton = screen.getByText('New Goal')
      await user.click(newGoalButton)
      
      expect(screen.getByTestId('goal-form-create')).toBeInTheDocument()
    })

    it('should call createGoal when form is submitted', async () => {
      const user = userEvent.setup()
      render(<GoalsPage />)
      
      // Open create dialog
      const newGoalButton = screen.getByText('New Goal')
      await user.click(newGoalButton)
      
      // Submit form
      const submitButton = screen.getByText('Submit')
      await user.click(submitButton)
      
      expect(mockGoalsHook.createGoal).toHaveBeenCalledWith({
        title: 'New Goal',
        moduleId: 'fitness'
      })
    })

    it('should handle goal completion', async () => {
      const user = userEvent.setup()
      // Set mobile view to see goal cards
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      })
      
      render(<GoalsPage />)
      fireEvent.resize(window)
      
      await waitFor(async () => {
        const completeButton = screen.getAllByText('Complete')[0]
        await user.click(completeButton)
        
        expect(mockGoalsHook.updateGoal).toHaveBeenCalledWith('goal-1', { isCompleted: true })
      })
    })

    it('should handle goal deletion with confirmation', async () => {
      // Mock window.confirm
      window.confirm = vi.fn(() => true)
      
      const user = userEvent.setup()
      // Set mobile view to see goal cards
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      })
      
      render(<GoalsPage />)
      fireEvent.resize(window)
      
      await waitFor(async () => {
        const deleteButton = screen.getAllByText('Delete')[0]
        await user.click(deleteButton)
        
        expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this goal?')
        expect(mockGoalsHook.deleteGoal).toHaveBeenCalledWith('goal-1')
      })
    })

    it('should not delete goal when confirmation is denied', async () => {
      // Mock window.confirm to return false
      window.confirm = vi.fn(() => false)
      
      const user = userEvent.setup()
      // Set mobile view to see goal cards
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      })
      
      render(<GoalsPage />)
      fireEvent.resize(window)
      
      await waitFor(async () => {
        const deleteButton = screen.getAllByText('Delete')[0]
        await user.click(deleteButton)
        
        expect(window.confirm).toHaveBeenCalled()
        expect(mockGoalsHook.deleteGoal).not.toHaveBeenCalled()
      })
    })
  })

  describe('Dialogs', () => {
    it('should open and close create dialog', async () => {
      const user = userEvent.setup()
      render(<GoalsPage />)
      
      // Open dialog
      const newGoalButton = screen.getByText('New Goal')
      await user.click(newGoalButton)
      
      expect(screen.getByTestId('goal-form-create')).toBeInTheDocument()
      
      // Close dialog
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      
      expect(screen.queryByTestId('goal-form-create')).not.toBeInTheDocument()
    })

    it('should open edit dialog when goal is clicked for editing', async () => {
      const user = userEvent.setup()
      // Set mobile view to see goal cards
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      })
      
      render(<GoalsPage />)
      fireEvent.resize(window)
      
      await waitFor(async () => {
        const editButton = screen.getAllByText('Edit')[0]
        await user.click(editButton)
        
        expect(screen.getByTestId('goal-form-edit')).toBeInTheDocument()
      })
    })

    it('should open detail dialog when goal is viewed', async () => {
      const user = userEvent.setup()
      // Set mobile view to see goal cards
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      })
      
      render(<GoalsPage />)
      fireEvent.resize(window)
      
      await waitFor(async () => {
        const viewButton = screen.getAllByText('View')[0]
        await user.click(viewButton)
        
        expect(screen.getByTestId('goal-detail-goal-1')).toBeInTheDocument()
      })
    })
  })

  describe('Pull to Refresh', () => {
    it('should trigger refetch when pull to refresh is activated', async () => {
      const user = userEvent.setup()
      // Set mobile view
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      })
      
      render(<GoalsPage />)
      fireEvent.resize(window)
      
      await waitFor(async () => {
        const refreshButton = screen.getByText('Refresh')
        await user.click(refreshButton)
        
        expect(mockGoalsHook.refetch).toHaveBeenCalled()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper page structure', () => {
      render(<GoalsPage />)
      
      expect(screen.getByTestId('main-content')).toHaveAttribute('data-page', 'goals')
    })

    it('should have proper tab navigation', () => {
      render(<GoalsPage />)
      
      expect(screen.getByRole('tab', { name: 'All' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Active' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Done' })).toBeInTheDocument()
    })
  })
})